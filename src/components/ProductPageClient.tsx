"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, Leaf, Package, Info, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import ReviewDialog from "@/components/ReviewDialog";
import SubRatingsDisplay from "@/components/SubRatingsDisplay";
import AnimatedStarRating from "@/components/AnimatedStarRating";
import AnimatedSubtitle from "@/components/AnimatedSubtitle";
import SignupConversionCTA from "@/components/SignupConversionCTA";
import RecommendedProducts from "@/components/RecommendedProducts";
import { retailerLogos, storeUrls } from "@/lib/retailer-logos";
import { getSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ProductPageClientProps {
  product: any;
  comments: any[];
  avgRating: string | null;
  subRatings: {
    tasteRating: number | null;
    textureRating: number | null;
    valueRating: number | null;
    meatSimilarityRating: number | null;
  };
}

export default function ProductPageClient({
  product,
  comments,
  avgRating,
  subRatings,
}: ProductPageClientProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Parse stores for display
  const stores = product.store_name ? product.store_name.split(',').map((s: string) => s.trim()) : [];

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href="/search"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Link>

        {/* Product header */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Product image */}
          <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
            {product.product_image_url ? (
              <img
                src={product.product_image_url}
                alt={product.product_name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
            {product.is_vegan && (
              <Badge className="absolute top-4 right-4 bg-green-500 text-white text-base">
                <Leaf className="h-4 w-4 mr-1" />
                Vegan
              </Badge>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col">
            <Badge variant="secondary" className="text-sm w-fit mb-2">
              {product.category}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.product_name}</h1>
            <p className="text-xl text-muted-foreground mb-4">{product.brand}</p>

            {/* Rating with animated stars - always show, with Rate button */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <AnimatedStarRating
                  rating={avgRating ? parseFloat(avgRating) : 0}
                  size="lg"
                  showValue={true}
                />
                <span className="text-sm text-muted-foreground">
                  ({comments.length} {comments.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              <Button
                variant="default"
                size="default"
                onClick={() => setReviewDialogOpen(true)}
                className="gap-2"
              >
                <Star className="h-4 w-4" />
                Rate
              </Button>
            </div>

            {/* Sub-Ratings */}
            <div className="mb-6">
              <SubRatingsDisplay
                tasteRating={subRatings.tasteRating}
                textureRating={subRatings.textureRating}
                valueRating={subRatings.valueRating}
                meatSimilarityRating={subRatings.meatSimilarityRating}
                productName={product.product_name}
                productCategory={product.category}
              />
            </div>

            {/* Signup Conversion CTA - only shown for logged-out users */}
            {isAuthenticated === false && (
              <div className="mb-6">
                <SignupConversionCTA onLoginClick={() => router.push("/login")} />
              </div>
            )}

            {/* Prominent Info Badges */}
            <div className="flex flex-wrap gap-3 mb-6 p-4 bg-muted/30 rounded-lg">
              {product.is_vegan ? (
                <Badge className="bg-green-600 hover:bg-green-700 text-white text-base px-4 py-2">
                  <Leaf className="h-5 w-5 mr-2" />
                  100% Vegan
                </Badge>
              ) : product.is_vegetarian ? (
                <Badge className="bg-green-500 hover:bg-green-600 text-white text-base px-4 py-2">
                  <Leaf className="h-5 w-5 mr-2" />
                  Vegetarian
                </Badge>
              ) : null}
              {product.nutri_score && (
                <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-base px-4 py-2 font-bold">
                  Nutri-Score: {product.nutri_score.toUpperCase()}
                </Badge>
              )}
              {product.is_palm_oil_free ? (
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-base px-4 py-2">
                  <Leaf className="h-5 w-5 mr-2" />
                  Palm Oil Free
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500 text-base px-4 py-2 relative">
                  <Leaf className="h-5 w-5 mr-2 opacity-40" />
                  <span className="relative">
                    Palm Oil Free
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-full h-0.5 bg-red-500 rotate-[-15deg]"></span>
                    </span>
                  </span>
                </Badge>
              )}
            </div>

            {/* Description */}
            {(product.short_description || product.description) && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">About this product</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {product.short_description || product.description}
                </p>
              </div>
            )}

            {/* Store logos */}
            {stores.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-muted-foreground mb-3">Available at:</p>
                <div className="flex flex-wrap gap-2">
                  {stores.map((store: string, idx: number) => {
                    const url = storeUrls[store] || product.store_link;
                    const logoSrc = retailerLogos[store];

                    return url ? (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <div className="h-16 w-20 sm:h-20 sm:w-24 rounded-md bg-white flex items-center justify-center p-2.5 sm:p-3 hover:shadow-lg transition-all cursor-pointer">
                          {logoSrc ? (
                            <img
                              src={logoSrc}
                              alt={`${store} logo`}
                              className="max-h-full max-w-full object-contain"
                              loading="eager"
                            />
                          ) : (
                            <span className="font-bold text-sm text-gray-700">{store}</span>
                          )}
                        </div>
                      </a>
                    ) : (
                      <div key={idx} className="h-16 w-20 sm:h-20 sm:w-24 rounded-md bg-gray-100 flex items-center justify-center p-2.5 sm:p-3 opacity-50">
                        {logoSrc ? (
                          <img
                            src={logoSrc}
                            alt={`${store} logo`}
                            className="max-h-full max-w-full object-contain grayscale"
                            loading="eager"
                          />
                        ) : (
                          <span className="font-bold text-sm text-gray-500">{store}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ingredients & Nutrition Section */}
        {(product.p_description || product.nutrition_facts) && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Ingredients */}
                {product.p_description && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                      <Package className="h-5 w-5" />
                      Ingredients
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {product.p_description}
                    </p>
                    {/* Product Details */}
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                      {product.weight_grams && (
                        <div>
                          <p className="text-xs text-muted-foreground">Weight</p>
                          <p className="text-sm font-semibold">{product.weight_grams}g</p>
                        </div>
                      )}
                      {product.barcode && (
                        <div>
                          <p className="text-xs text-muted-foreground">Barcode</p>
                          <p className="font-mono text-xs">{product.barcode}</p>
                        </div>
                      )}
                      {product.country && (
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Country</p>
                          <p className="text-sm font-semibold">{product.country}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Nutrition Facts */}
                {product.nutrition_facts && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                      <Info className="h-5 w-5" />
                      Nutrition Facts
                      <span className="text-sm text-muted-foreground font-normal ml-auto">Per 100g</span>
                    </h3>
                    <div className="overflow-hidden rounded-lg border">
                      <table className="w-full text-sm">
                        <tbody className="divide-y">
                          {product.nutrition_facts.split(',').map((item: string, index: number) => {
                            const trimmed = item.trim();
                            let label, value;
                            if (trimmed.includes(':')) {
                              const parts = trimmed.split(':');
                              label = parts[0].trim();
                              value = parts.slice(1).join(':').trim();
                            } else {
                              const match = trimmed.match(/^([^0-9]+)\s*(.+)$/);
                              if (!match) return null;
                              label = match[1].trim();
                              value = match[2].trim();
                            }

                            const isSubItem = label.toLowerCase().includes('davon') ||
                              label.toLowerCase().includes('of which') ||
                              label.toLowerCase().includes('saturated') ||
                              label.toLowerCase().includes('sugars');

                            return (
                              <tr
                                key={index}
                                className={`${
                                  isSubItem
                                    ? 'bg-muted/30'
                                    : index % 2 === 0
                                      ? 'bg-background'
                                      : 'bg-muted/50'
                                }`}
                              >
                                <td className={`px-3 py-2 font-medium ${isSubItem ? 'pl-6 text-muted-foreground' : ''}`}>
                                  {label}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                                  {value}
                                </td>
                              </tr>
                            );
                          }).filter(Boolean)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommended Products Section */}
        <RecommendedProducts
          currentProductId={product.product_id}
          currentProductCategory={product.category}
        />

        {/* Reviews section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Reviews</h2>
            <Button
              onClick={() => setReviewDialogOpen(true)}
              size="lg"
            >
              <Star className="mr-2 h-5 w-5" />
              Leave a Review
            </Button>
          </div>

          {comments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No reviews yet. Be the first to review this product!</p>
                <Button onClick={() => setReviewDialogOpen(true)}>
                  Write a Review
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => {
                const displayName = comment.display_name || comment.author_name || 'Anonymous';
                const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

                return (
                  <Card key={comment.comment_id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar
                          className={`h-10 w-10 transition-opacity ${comment.user_id ? 'cursor-pointer hover:opacity-80' : ''}`}
                          onClick={() => {
                            if (comment.user_id) {
                              router.push(`/profile/${comment.user_id}`);
                            } else {
                              toast.info("This user hasn't created a profile yet");
                            }
                          }}
                        >
                          {comment.avatar_url && <AvatarImage src={comment.avatar_url} alt={displayName} />}
                          <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p
                                className={`font-semibold transition-colors ${comment.user_id ? 'cursor-pointer hover:text-primary' : ''}`}
                                onClick={() => {
                                  if (comment.user_id) {
                                    router.push(`/profile/${comment.user_id}`);
                                  } else {
                                    toast.info("This user hasn't created a profile yet");
                                  }
                                }}
                              >
                                {displayName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(comment.comment_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= (comment.overall_rating || 0)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "fill-muted text-muted"
                                  }`}
                                />
                              ))}
                              <span className="ml-1 text-sm font-medium">{comment.overall_rating}/5</span>
                            </div>
                          </div>
                          {comment.comment_text && (
                            <p className="text-muted-foreground leading-relaxed">
                              {comment.comment_text}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Animated Subtitle Carousel */}
      <div className="bg-primary py-8">
        <div className="container mx-auto px-4 flex justify-center">
          <AnimatedSubtitle />
        </div>
      </div>

      {/* Review Dialog */}
      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        productId={product.product_id}
        productName={product.product_name}
        productCategory={product.category}
      />
    </main>
  );
}
