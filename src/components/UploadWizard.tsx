'use client';

import { useState } from "react";
import { Camera, Upload, X, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getSupabaseClient } from "@/lib/supabase/client";

interface UploadWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery?: string;
}

interface ImageUpload {
  id: string;
  file: File;
  preview: string;
  label: string;
}

type UploadStep = "intro" | "upload" | "processing" | "success";

const imageTypes = [
  { id: "front", label: "Front of Package", required: true },
  { id: "back", label: "Back of Package", required: false },
  { id: "ingredients", label: "Ingredients Close-up", required: false },
  { id: "nutrition", label: "Nutrition Table", required: false },
  { id: "barcode", label: "Barcode", required: false },
];

export default function UploadWizard({ open, onOpenChange, searchQuery }: UploadWizardProps) {
  const [step, setStep] = useState<UploadStep>("intro");
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [storeName, setStoreName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: ImageUpload[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file);
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview,
          label: images.length === 0 && newImages.length === 0 ? "Front of Package" : "Additional Image",
        });
      }
    });

    setImages((prev) => [...prev, ...newImages]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      const removed = prev.find((img) => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return updated;
    });
  };

  const updateImageLabel = (id: string, label: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, label } : img))
    );
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadImagesToStorage = async (
    imageData: Array<{ label: string; data: string; filename: string }>
  ) => {
    const supabase = getSupabaseClient();
    const uploadedUrls: string[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < imageData.length; i++) {
      const image = imageData[i];
      const filename = `${timestamp}_${i}_${image.filename}`;

      // Convert base64 to Blob
      const byteCharacters = atob(image.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let j = 0; j < byteCharacters.length; j++) {
        byteNumbers[j] = byteCharacters.charCodeAt(j);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });

      const { error: uploadError } = await supabase.storage
        .from("user-submissions")
        .upload(filename, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("user-submissions")
        .getPublicUrl(filename);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const createPendingProductWithJob = async ({
    uploadedUrls,
    userEmail,
    searchQuery,
    storeName,
  }: {
    uploadedUrls: string[];
    userEmail?: string;
    searchQuery?: string;
    storeName?: string;
  }) => {
    const supabase = getSupabaseClient();

    const productData = {
      product_status: "pending",
      product_name: "Unknown Product",
      brand: "Unknown",
      category: "Other",
      product_image_url: uploadedUrls[0] || null,
      p_description: `User-submitted via upload wizard. Search query: ${searchQuery || 'none'}. Email: ${userEmail || 'anonymous'}. Store: ${storeName || 'unknown'}.`,
      store_name: storeName || null,
    };

    const { data: product, error } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (error) throw error;

    const { error: jobErr } = await supabase
      .from("product_extraction_jobs")
      .insert({
        product_id: product.product_id,
        image_urls: uploadedUrls,
        submitted_email: userEmail || null,
        search_query: searchQuery || null,
        status: "pending",
      });
    if (jobErr) throw jobErr;

    return product;
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      toast.error("Please upload at least one image of the product.");
      return;
    }

    // Immediately thank the user and close the dialog; continue in background
    setStep("success");
    toast.success("Product submitted! We'll process it in the background.");

    const selectedImages = [...images];
    const email = userEmail;
    const query = searchQuery;
    const store = storeName.trim();

    // Close and reset UI so the user can continue
    setTimeout(() => {
      handleClose();
    }, 1200);

    // Fire-and-forget: upload images, create product + job
    (async () => {
      try {
        const imageData = await Promise.all(
          selectedImages.map(async (img) => {
            const base64 = await fileToBase64(img.file);
            return { label: img.label, data: base64, filename: img.file.name };
          })
        );
        const uploadedUrls = await uploadImagesToStorage(imageData);

        const product = await createPendingProductWithJob({
          uploadedUrls,
          userEmail: email,
          searchQuery: query,
          storeName: store,
        });

        // Best-effort: nudge the processor to pick up a job
        try {
          const processUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')}/functions/v1/process-extraction-queue?limit=1`;
          fetch(processUrl, { method: 'GET', keepalive: true });
        } catch { /* ignore */ }

        console.log("Enqueued extraction job for product", product?.product_id);
      } catch (err) {
        console.error("Background enqueue failed:", err);
      }
    })();
  };

  const handleClose = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    setUserEmail("");
    setStoreName("");
    setStep("intro");
    onOpenChange(false);
  };

  const renderIntro = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Camera className="h-16 w-16 mx-auto text-primary" />
        <h3 className="text-xl font-semibold">Help us add this product!</h3>
        <p className="text-muted-foreground">
          Upload photos of the product and we'll extract the information automatically.
        </p>
      </div>

      <div className="space-y-3">
        <p className="font-medium text-sm">What we need:</p>
        <div className="space-y-2">
          {imageTypes.map((type) => (
            <div key={type.id} className="flex items-center gap-2 text-sm">
              <Badge variant={type.required ? "default" : "secondary"} className="text-xs">
                {type.required ? "Required" : "Optional"}
              </Badge>
              <span className="text-muted-foreground">{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <p className="font-medium text-sm">Tips for best results:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Take clear, well-lit photos</li>
          <li>• Ensure text is readable and not blurry</li>
          <li>• Include all sides of the packaging</li>
          <li>• Make sure barcode is fully visible</li>
        </ul>
      </div>

      <Button onClick={() => setStep("upload")} className="w-full" size="lg">
        Start Upload
      </Button>
    </div>
  );

  const renderUpload = () => (
    <div className="space-y-6">
      {/* Drag and drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm font-medium mb-2">
          Drag and drop images here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Supports: JPG, PNG, HEIC (max 10MB per image)
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button type="button" variant="outline" asChild>
            <span>Choose Files</span>
          </Button>
        </label>

        {/* Mobile camera button */}
        <div className="mt-3">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="camera-capture"
          />
          <label htmlFor="camera-capture">
            <Button type="button" variant="secondary" asChild className="md:hidden">
              <span className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Take Photo
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Uploaded images preview */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">Uploaded Images ({images.length})</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                images.forEach((img) => URL.revokeObjectURL(img.preview));
                setImages([]);
              }}
            >
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.preview}
                  alt={img.label}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                <select
                  value={img.label}
                  onChange={(e) => updateImageLabel(img.id, e.target.value)}
                  className="absolute bottom-2 left-2 right-2 text-xs bg-background/95 border rounded px-2 py-1"
                >
                  {imageTypes.map((type) => (
                    <option key={type.id} value={type.label}>
                      {type.label}
                    </option>
                  ))}
                  <option value="Additional Image">Additional Image</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store name field - optional */}
      <div className="space-y-2">
        <Label htmlFor="storeName" className="text-sm">Store Name (optional)</Label>
        <Input
          id="storeName"
          type="text"
          placeholder="Store (e.g. Rewe, Albert Heijn)"
          value={storeName}
          onChange={e => setStoreName(e.target.value)}
        />
      </div>

      {/* Optional email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm">Email (optional)</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={userEmail}
          onChange={e => setUserEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Get notified when your product is approved and added to VMDb
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep("intro")} className="flex-1">
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={images.length === 0}
          className="flex-1"
        >
          Submit Product
        </Button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center space-y-6 py-8">
      <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
      <div>
        <h3 className="text-xl font-semibold mb-2">Analyzing your images...</h3>
        <p className="text-muted-foreground">
          Our AI is extracting product information. This may take a few moments.
        </p>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse w-2/3" />
        </div>
        <p className="text-xs text-muted-foreground">Processing images and extracting data...</p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6 py-8">
      <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
      <div>
        <h3 className="text-xl font-semibold mb-2">Product submitted!</h3>
        <p className="text-muted-foreground">
          Thank you for contributing to VMDb! We'll review and add this product soon.
        </p>
      </div>
      {userEmail && (
        <p className="text-sm text-muted-foreground">
          We'll send you an email at <strong>{userEmail}</strong> when it's approved.
        </p>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "intro" && "Add a Product"}
            {step === "upload" && "Upload Product Photos"}
            {step === "processing" && "Processing"}
            {step === "success" && "Success!"}
          </DialogTitle>
          <DialogDescription>
            {step === "intro" &&
              "Help grow the VMDb database by adding a product that's not in our system yet."}
            {step === "upload" && "Upload clear photos of the product packaging."}
            {step === "processing" && "Please wait while we process your images."}
            {step === "success" && "Thanks! We'll handle the rest in the background."}
          </DialogDescription>
        </DialogHeader>

        {step === "intro" && renderIntro()}
        {step === "upload" && renderUpload()}
        {step === "processing" && renderProcessing()}
        {step === "success" && renderSuccess()}
      </DialogContent>
    </Dialog>
  );
}
