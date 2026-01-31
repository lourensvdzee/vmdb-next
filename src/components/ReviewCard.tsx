"use client";

import Link from "next/link";
import { Star, User } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ReviewCardProps {
  comment: {
    comment_id: number;
    comment_text: string;
    overall_rating: number;
    comment_date: string;
    author_name: string;
    authorAvatar?: string | null;
  };
  product: {
    product_id: number;
    product_name: string;
    product_image_url: string | null;
    brand: string;
    slug?: string | null;
  } | null;
}

export default function ReviewCard({ comment, product }: ReviewCardProps) {
  if (!product) {
    return null;
  }

  const rating = comment.overall_rating || 0;
  const productUrl = `/product/${product.product_id}${product.slug ? `/${product.slug}` : ''}`;

  return (
    <Link href={productUrl}>
      <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
        <div className="p-5 space-y-4">
          {/* Header: Product context with small image */}
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-secondary">
              {product.product_image_url ? (
                <img
                  src={product.product_image_url}
                  alt={product.product_name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  No img
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-1 text-foreground">
                {product.product_name}
              </h3>
              <p className="text-xs text-muted-foreground">{product.brand}</p>
            </div>
          </div>

          {/* Rating Stars */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => {
              const isFilled = i < Math.floor(rating);
              const isPartial = i === Math.floor(rating) && rating % 1 !== 0;

              return (
                <div key={i} className="relative">
                  <Star
                    className={`h-5 w-5 ${
                      isFilled
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-300 text-gray-300"
                    }`}
                  />
                  {isPartial && (
                    <div
                      className="absolute top-0 left-0 overflow-hidden"
                      style={{ width: `${(rating % 1) * 100}%` }}
                    >
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </div>
                  )}
                </div>
              );
            })}
            <span className="ml-2 text-base font-semibold">{rating.toFixed(1)}</span>
          </div>

          {/* Review Text */}
          <div className="min-h-[3rem]">
            <p className="text-sm text-foreground leading-relaxed line-clamp-3">
              &quot;{comment.comment_text}&quot;
            </p>
          </div>

          {/* Author and Date */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              {comment.authorAvatar ? (
                <img
                  src={comment.authorAvatar}
                  alt={comment.author_name}
                  className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {comment.author_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.comment_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
