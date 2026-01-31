"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseClient } from "@/lib/supabase/client";
import StarRatingInput from "@/components/StarRatingInput";

// Helper function to determine if product mimics meat/fish
function isMeatLikeProduct(productName: string, category?: string): boolean {
  const text = `${productName} ${category || ''}`.toLowerCase();

  const meatFishKeywords = [
    'burger', 'hamburger', 'sausage', 'wurst', 'worst', 'bratwurst', 'leberwurst',
    'hotdog', 'chicken', 'kip', 'kipfilet', 'kipschnitzel', 'döner', 'doner',
    'gyros', 'kebab', 'bacon', 'speck', 'spekjes', 'beef', 'rind', 'rindfleisch',
    'biefstuk', 'steak', 'mince', 'gehakt', 'hackfleisch', 'schnitzel', 'nugget',
    'bites', 'meatball', 'hackbällchen', 'gemüsebällchen', 'frikadelle', 'gehaktbal',
    'strips', 'reepjes', 'stroken', 'cordon bleu', 'filet', 'fillet', 'lachsschinken',
    'lachschinken', 'cold cut', 'vleeswaren', 'opsnij', 'brotbelag', 'broodbeleg',
    'fish', 'vis', 'fisch', 'salmon', 'zalm', 'lachs', 'tuna', 'tonijn', 'thunfisch',
    'cod', 'kabeljauw', 'kabeljau', 'shrimp', 'garnaal', 'garnelen', 'prawn',
    'crab', 'krab', 'krabbe', 'seafood', 'zeevruchten', 'meeresfrüchte', 'scampi',
    'fishstick', 'visstick', 'fischstäbchen',
  ];

  const excludeKeywords = ['tofu', 'tempeh', 'falafel'];

  if (excludeKeywords.some(keyword => text.includes(keyword))) {
    return false;
  }

  return meatFishKeywords.some(keyword => text.includes(keyword));
}

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  productName: string;
  productCategory?: string;
}

const ReviewDialog = ({ open, onOpenChange, productId, productName, productCategory }: ReviewDialogProps) => {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string | undefined } | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Sub-ratings (optional)
  const [tasteRating, setTasteRating] = useState(0);
  const [textureRating, setTextureRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [meatSimilarityRating, setMeatSimilarityRating] = useState(0);
  const [showDetailedRatings, setShowDetailedRatings] = useState(false);

  const showMeatSimilarity = isMeatLikeProduct(productName, productCategory);

  // Get current user when dialog opens
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({ id: user.id, email: user.email });
        // Pre-fill author name if user has a profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        if (profile?.username) {
          setAuthorName(profile.username);
        }
      } else {
        setCurrentUser(null);
      }
    };

    if (open) {
      getCurrentUser();
    }
  }, [open, supabase]);

  const handleSubmit = async () => {
    // Validation
    if (!currentUser && (!authorName || authorName.trim() === "")) {
      toast.error("Please enter your name");
      return;
    }
    if (!currentUser && (!authorEmail || authorEmail.trim() === "")) {
      toast.error("Please enter your email to receive account setup instructions");
      return;
    }
    if (!currentUser && authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsPending(true);

    try {
      // For unauthenticated users, save directly to comments table (visible immediately)
      if (!currentUser && authorEmail) {
        const now = new Date().toISOString();
        const { error: commentError } = await supabase
          .from('comments')
          .insert({
            product_id: productId,
            author_name: authorName || "Anonymous",
            display_name: authorName || "Anonymous",
            author_email: authorEmail,
            comment_date: now,
            comment_text: review || '',
            overall_rating: rating,
            is_approved: 1,
            user_id: null,
            taste_rating: tasteRating > 0 ? tasteRating : null,
            texture_rating: textureRating > 0 ? textureRating : null,
            value_rating: valueRating > 0 ? valueRating : null,
            meat_similarity_rating: meatSimilarityRating > 0 ? meatSimilarityRating : null,
          });

        if (commentError) {
          if (commentError.message.includes("duplicate key") || commentError.code === '23505') {
            toast.error("You've already reviewed this product. You can only submit one review per product.");
          } else {
            console.error('Error submitting guest review:', commentError);
            toast.error("Failed to submit review. Please try again.");
          }
          setIsPending(false);
          return;
        }

        // Send magic link for account creation
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: authorEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (otpError) {
          console.error('Magic link error:', otpError);
          toast.success("Review submitted! Check your email to create your VMDb account.");
        } else {
          toast.success("Review submitted! Check your email to create your VMDb account and unlock more features.");
        }
      } else {
        // For authenticated users, save directly to comments table
        const slug = productName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

        const { error: commentError } = await supabase
          .from('comments')
          .insert({
            product_id: productId,
            product_title: productName,
            product_slug: slug,
            author_name: authorName || "Anonymous",
            display_name: authorName || "Anonymous",
            comment_text: review || '',
            overall_rating: rating,
            user_id: currentUser?.id || null,
            user_email: currentUser?.email || null,
            taste_rating: tasteRating > 0 ? tasteRating : null,
            texture_rating: textureRating > 0 ? textureRating : null,
            value_rating: valueRating > 0 ? valueRating : null,
            meat_similarity_rating: meatSimilarityRating > 0 ? meatSimilarityRating : null,
            is_approved: 1, // Auto-approve for logged-in users
          });

        if (commentError) {
          if (commentError.message.includes("duplicate key")) {
            toast.error("You've already reviewed this product.");
          } else {
            console.error('Error submitting comment:', commentError);
            toast.error("Failed to submit review. Please try again.");
          }
          setIsPending(false);
          return;
        }

        toast.success("Review submitted successfully!");
      }

      // Reset form and close dialog
      setRating(0);
      setReview("");
      setAuthorName("");
      setAuthorEmail("");
      setTasteRating(0);
      setTextureRating(0);
      setValueRating(0);
      setMeatSimilarityRating(0);
      setShowDetailedRatings(false);
      onOpenChange(false);

      // Refresh the page to show the new review
      router.refresh();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-base sm:text-lg">
            {!currentUser ? "Create your free VMDb account to rate this product" : "Leave a Review"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {!currentUser
              ? "Quick signup via email — no password required."
              : `Share your experience with ${productName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-5 py-2 sm:py-4">
          {!currentUser && (
            <div className="space-y-3">
              <label htmlFor="review-name" className="text-sm font-medium block">Display Name</label>
              <Input
                id="review-name"
                name="name"
                placeholder="Name shown with your review"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                This name will be displayed publicly with your review
              </p>
            </div>
          )}

          {!currentUser && (
            <div className="space-y-3">
              <label htmlFor="review-email" className="text-sm font-medium block">Your Email</label>
              <Input
                id="review-email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                We'll send you a link to create your account and unlock more features
              </p>
            </div>
          )}

          {/* Overall Rating (Required) */}
          <StarRatingInput
            value={rating}
            onChange={setRating}
            disabled={isPending}
            label="Overall Rating *"
            showValue={true}
          />

          {/* Detailed Ratings (Optional, Collapsible) */}
          <div className="border-t pt-3 sm:pt-4">
            <button
              type="button"
              onClick={() => setShowDetailedRatings(!showDetailedRatings)}
              className="flex items-center justify-between w-full text-sm font-medium hover:opacity-70 transition-opacity"
              disabled={isPending}
            >
              <span>Detailed Ratings (Optional)</span>
              {showDetailedRatings ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showDetailedRatings && (
              <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                <StarRatingInput
                  value={tasteRating}
                  onChange={setTasteRating}
                  disabled={isPending}
                  label="Taste"
                  size="sm"
                  showValue={true}
                />

                <StarRatingInput
                  value={textureRating}
                  onChange={setTextureRating}
                  disabled={isPending}
                  label="Texture"
                  size="sm"
                  showValue={true}
                />

                <StarRatingInput
                  value={valueRating}
                  onChange={setValueRating}
                  disabled={isPending}
                  label="Value for Money"
                  size="sm"
                  showValue={true}
                />

                {showMeatSimilarity && (
                  <StarRatingInput
                    value={meatSimilarityRating}
                    onChange={setMeatSimilarityRating}
                    disabled={isPending}
                    label="Meat/Fish Similarity"
                    size="sm"
                    showValue={true}
                  />
                )}

                <p className="text-xs text-muted-foreground">
                  These detailed ratings help others make better choices
                </p>
              </div>
            )}
          </div>

          {/* Review Text */}
          <div className="space-y-3">
            <label htmlFor="review-text" className="text-sm font-medium block">Your Review</label>
            <Textarea
              id="review-text"
              name="review"
              placeholder="Tell us what you think..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!currentUser ? "Submit & Create Account" : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
