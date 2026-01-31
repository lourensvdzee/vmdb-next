"use client";

import { useEffect, useState, useRef } from "react";

interface SubRatingsDisplayProps {
  tasteRating?: number | null;
  textureRating?: number | null;
  valueRating?: number | null;
  meatSimilarityRating?: number | null;
  productName: string;
  productCategory?: string;
}

/**
 * Determines if a product attempts to mimic meat or fish based on its name and category
 * Products that mimic meat/fish should show the "Meat/Fish Similarity" rating
 */
function isMeatLikeProduct(productName: string, category?: string): boolean {
  const text = `${productName} ${category || ''}`.toLowerCase();

  const meatFishKeywords = [
    // Meat keywords
    'burger', 'hamburger', 'sausage', 'wurst', 'worst', 'bratwurst', 'leberwurst',
    'hotdog', 'chicken', 'kip', 'kipfilet', 'kipschnitzel', 'döner', 'doner',
    'gyros', 'kebab', 'bacon', 'speck', 'spekjes', 'beef', 'rind', 'rindfleisch',
    'biefstuk', 'steak', 'mince', 'gehakt', 'hackfleisch', 'schnitzel', 'nugget',
    'bites', 'meatball', 'hackbällchen', 'gemüsebällchen', 'frikadelle', 'gehaktbal',
    'strips', 'reepjes', 'stroken', 'cordon bleu', 'filet', 'fillet', 'lachsschinken',
    'lachschinken', 'cold cut', 'vleeswaren', 'opsnij', 'brotbelag', 'broodbeleg',
    // Fish keywords
    'fish', 'vis', 'fisch', 'salmon', 'zalm', 'lachs', 'tuna', 'tonijn', 'thunfisch',
    'cod', 'kabeljauw', 'kabeljau', 'shrimp', 'garnaal', 'garnelen', 'prawn',
    'crab', 'krab', 'krabbe', 'seafood', 'zeevruchten', 'meeresfrüchte', 'scampi',
    'fishstick', 'visstick', 'fischstäbchen',
  ];

  // Exclude keywords - these are NOT meat/fish-like despite being in the database
  const excludeKeywords = ['tofu', 'tempeh', 'falafel'];

  // Check for exclude keywords first
  if (excludeKeywords.some(keyword => text.includes(keyword))) {
    return false;
  }

  // Check for meat/fish keywords
  return meatFishKeywords.some(keyword => text.includes(keyword));
}

export default function SubRatingsDisplay({
  tasteRating,
  textureRating,
  valueRating,
  meatSimilarityRating,
  productName,
  productCategory,
}: SubRatingsDisplayProps) {
  const showMeatSimilarity = isMeatLikeProduct(productName, productCategory);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);

  const hasSubRatings = tasteRating || textureRating || valueRating || (showMeatSimilarity && meatSimilarityRating);

  useEffect(() => {
    if (!hasSubRatings || hasAnimatedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;
            setTimeout(() => {
              setShouldAnimate(true);
            }, 100);
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasSubRatings]);

  if (!hasSubRatings) {
    return null;
  }

  const RatingBar = ({ label, rating, delay }: { label: string; rating: number; delay: number }) => {
    const percentage = (rating / 5) * 100;

    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-transform duration-1000 ease-out"
            style={{
              width: `${percentage}%`,
              transform: shouldAnimate ? 'scaleX(1)' : 'scaleX(0)',
              transitionDelay: shouldAnimate ? `${delay}ms` : '0ms',
              transformOrigin: 'left center',
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Detailed Ratings
      </h3>
      <div className="space-y-3">
        {tasteRating && <RatingBar label="Taste" rating={tasteRating} delay={0} />}
        {textureRating && <RatingBar label="Texture" rating={textureRating} delay={150} />}
        {valueRating && <RatingBar label="Value" rating={valueRating} delay={300} />}
        {showMeatSimilarity && meatSimilarityRating && (
          <RatingBar label="Meat/Fish Similarity" rating={meatSimilarityRating} delay={450} />
        )}
      </div>
    </div>
  );
}
