"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ArrowLeft } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  name: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  dietary_preference: string | null;
}

interface Review {
  comment_id: number;
  product_id: number;
  overall_rating: number;
  comment_text: string;
  comment_date: string;
  product: {
    product_id: number;
    product_name: string;
    product_image_url: string | null;
    brand: string;
    slug: string | null;
  } | null;
}

interface PublicProfileClientProps {
  profile: Profile;
  reviews: Review[];
}

export default function PublicProfileClient({ profile, reviews }: PublicProfileClientProps) {
  const router = useRouter();

  const getInitials = () => {
    if (profile.name) {
      return profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return profile.username.slice(0, 2).toUpperCase();
  };

  const getProductUrl = (product: Review['product']) => {
    if (!product) return '#';
    return product.slug
      ? `/product/${product.product_id}/${product.slug}`
      : `/product/${product.product_id}`;
  };

  return (
    <>
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
          <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
          <AvatarFallback className="text-xl sm:text-2xl">{getInitials()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">{profile.name || profile.username}</h1>
          {profile.name && <p className="text-muted-foreground truncate">@{profile.username}</p>}
          {profile.location && profile.country && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {profile.location}, {profile.country}
            </p>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.bio && (
            <div>
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>
          )}

          {profile.dietary_preference && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Dietary Preference:</span>
              <span className="text-muted-foreground capitalize">{profile.dietary_preference}</span>
            </div>
          )}

          {!profile.bio && !profile.dietary_preference && (
            <p className="text-muted-foreground">This user hasn't added any profile information yet.</p>
          )}
        </CardContent>
      </Card>

      {/* User's Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {reviews.map((review) => (
                <div
                  key={review.comment_id}
                  className="flex-shrink-0 w-40 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => router.push(getProductUrl(review.product))}
                >
                  <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                    {review.product?.product_image_url ? (
                      <img
                        src={review.product.product_image_url}
                        alt={review.product.product_name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        No image
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-sm truncate">{review.product?.product_name || 'Unknown Product'}</h4>
                  <p className="text-xs text-muted-foreground truncate">{review.product?.brand || ''}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{review.overall_rating}/5</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">This user hasn't reviewed any products yet.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
