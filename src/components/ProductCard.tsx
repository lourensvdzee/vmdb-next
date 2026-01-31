"use client";

import Link from "next/link";
import { useState } from "react";
import { Star, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  id: string | number;
  name: string;
  brand: string;
  rating: number;
  image: string;
  category?: string;
  vegan?: boolean;
  slug?: string;
}

export default function ProductCard({
  id,
  name,
  brand,
  rating,
  image,
  category,
  vegan,
  slug
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  // Generate product URL
  const productUrl = slug ? `/product/${id}/${slug}` : `/product/${id}`;

  // Fallback image
  const fallbackImage = "https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400&h=400&fit=crop";
  const displayImage = imgError ? fallbackImage : (image || fallbackImage);

  return (
    <Link href={productUrl}>
      <Card className="overflow-hidden transition-shadow hover:shadow-lg h-full flex flex-col">
        <div className="aspect-square overflow-hidden bg-secondary relative flex-shrink-0">
          <img
            src={displayImage}
            alt={name}
            className="h-full w-full object-contain transition-transform hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
          {vegan && (
            <Badge variant="secondary" className="absolute top-2 right-2 bg-green-500 text-white">
              <Leaf className="h-3 w-3 mr-1" />
              Vegan
            </Badge>
          )}
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-base leading-tight flex-1 line-clamp-2 min-h-[2.5rem] mb-1">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">{brand}</p>
          {category && (
            <Badge variant="outline" className="mb-2 text-xs w-fit">
              {category}
            </Badge>
          )}
          <div className="flex items-center gap-1 mt-auto">
            {Array.from({ length: 5 }).map((_, i) => {
              const isFilled = i < Math.floor(rating);
              const isPartial = i === Math.floor(rating) && rating % 1 !== 0;

              return (
                <div key={i} className="relative">
                  <Star
                    className={`h-4 w-4 ${
                      isFilled
                        ? "fill-primary text-primary"
                        : "fill-muted text-muted"
                    }`}
                  />
                  {isPartial && (
                    <div
                      className="absolute top-0 left-0 overflow-hidden"
                      style={{ width: `${(rating % 1) * 100}%` }}
                    >
                      <Star className="h-4 w-4 fill-primary text-primary" />
                    </div>
                  )}
                </div>
              );
            })}
            <span className="ml-2 text-sm text-muted-foreground">
              {rating.toFixed(1)} / 5
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
