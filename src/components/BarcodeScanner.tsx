"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Camera, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { lookupProductByBarcode, isValidBarcodeFormat } from "@/lib/barcodeScanner";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ScannerState = "requesting" | "scanning" | "processing" | "found" | "notfound" | "error";

const BarcodeScanner = ({ open, onOpenChange }: BarcodeScannerProps) => {
  const [state, setState] = useState<ScannerState>("requesting");
  const [error, setError] = useState<string>("");
  const [scannedBarcode, setScannedBarcode] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef<boolean>(false);
  const lastScanTimeRef = useRef<number>(0);

  const router = useRouter();

  // Initialize camera and scanner
  useEffect(() => {
    if (!open) {
      cleanup();
      return;
    }

    startScanning();

    return () => {
      cleanup();
    };
  }, [open]);

  const startScanning = async () => {
    try {
      setState("requesting");
      setError("");

      // Create code reader
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // Get available video devices
      const videoInputDevices = await codeReader.listVideoInputDevices();

      if (videoInputDevices.length === 0) {
        setError("No camera found on this device.");
        setState("error");
        return;
      }

      // Try to use back camera on mobile, otherwise use first available
      const selectedDeviceId = videoInputDevices.find(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('environment')
      )?.deviceId || videoInputDevices[0].deviceId;

      setState("scanning");
      scanningRef.current = true;

      // Start decoding from video device
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, err) => {
          if (result && scanningRef.current) {
            handleBarcodeDetected(result.getText());
          }

          // Ignore NotFoundException - it just means no barcode in frame
          if (err && !(err instanceof NotFoundException)) {
            console.error("Scan error:", err);
          }
        }
      );

    } catch (err) {
      console.error("Camera error:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access in your browser settings.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          setError("Failed to access camera. Please check your permissions.");
        }
      }
      setState("error");
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    // Prevent multiple scans in quick succession
    const now = Date.now();
    if (now - lastScanTimeRef.current < 1000) {
      return;
    }
    lastScanTimeRef.current = now;

    // Validate barcode format
    if (!isValidBarcodeFormat(barcode)) {
      console.log("Invalid barcode format:", barcode);
      return;
    }

    // Stop scanning
    scanningRef.current = false;
    setState("processing");
    setScannedBarcode(barcode);

    // Look up product with timeout
    try {
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Lookup timeout")), 10000)
      );

      const productId = await Promise.race([
        lookupProductByBarcode(barcode),
        timeoutPromise
      ]);

      if (productId) {
        // Product found!
        setState("found");
        setTimeout(() => {
          cleanup();
          onOpenChange(false);
          router.push(`/product/${productId}`);
        }, 1500);
      } else {
        // Product not found
        setState("notfound");
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setError("Failed to search for product. Please try again.");
      setState("error");
    }
  };

  const cleanup = () => {
    scanningRef.current = false;

    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }

    // Reset state when closing
    if (!open) {
      setState("requesting");
      setError("");
      setScannedBarcode("");
    }
  };

  const handleClose = () => {
    cleanup();
    onOpenChange(false);
  };

  const handleRetry = () => {
    setScannedBarcode("");
    setError("");
    startScanning();
  };

  const handleAddProduct = () => {
    cleanup();
    onOpenChange(false);
    // Navigate to search with the barcode as query
    router.push(`/search?q=${scannedBarcode}`);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription>
            {state === "scanning" && "Hold the barcode in front of your camera"}
            {state === "processing" && "Looking up product..."}
            {state === "found" && "Product found! Redirecting..."}
            {state === "notfound" && "Product not found in database"}
            {state === "error" && "Camera error"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Feed */}
          {(state === "requesting" || state === "scanning" || state === "processing") && (
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />

              {/* Scanning Overlay */}
              {state === "scanning" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-primary w-64 h-32 rounded-lg">
                    <div className="w-full h-0.5 bg-primary animate-pulse mt-16" />
                  </div>
                </div>
              )}

              {/* Processing Overlay */}
              {state === "processing" && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Searching database...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success State */}
          {state === "found" && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Product Found!</h3>
              <p className="text-sm text-muted-foreground">
                Barcode: {scannedBarcode}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Redirecting to product page...
              </p>
            </div>
          )}

          {/* Not Found State */}
          {state === "notfound" && (
            <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Product Not Found</h3>
              <p className="text-sm text-muted-foreground mb-1">
                Barcode: {scannedBarcode}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                We couldn&apos;t find this product in our database.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRetry} variant="outline">
                  Scan Again
                </Button>
                <Button onClick={handleAddProduct}>
                  Search Instead
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {state === "error" && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          {state === "scanning" && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Position the barcode within the frame</p>
              <p className="text-xs mt-1">Supports EAN-13, EAN-8, UPC formats</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          {state === "error" && (
            <Button onClick={handleRetry} variant="outline">
              Try Again
            </Button>
          )}
          <Button onClick={handleClose} variant="outline">
            {state === "scanning" || state === "requesting" ? "Cancel" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
