"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

interface AnimatedStarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const AnimatedStarRating = ({
  rating,
  maxStars = 5,
  size = "md",
  showValue = false,
  className = "",
}: AnimatedStarRatingProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only trigger animation once when element comes into view
          if (entry.isIntersecting && !hasAnimated) {
            setIsVisible(true);
            setHasAnimated(true);
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of element is visible
        rootMargin: "0px 0px -50px 0px", // Trigger slightly before element reaches bottom
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [hasAnimated]);

  return (
    <div ref={containerRef} className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        {Array.from({ length: maxStars }).map((_, i) => {
          const isFilled = i < Math.floor(rating);
          const isPartial = i === Math.floor(rating) && rating % 1 !== 0;
          const fillPercentage = isPartial ? (rating % 1) * 100 : 0;

          return (
            <div key={i} className="relative">
              <Star
                className={`${sizeClasses[size]} transition-all duration-300 ${
                  isVisible && isFilled
                    ? "fill-primary text-primary scale-100 opacity-100"
                    : "fill-muted-foreground/30 text-muted-foreground/30 scale-90 opacity-60"
                }`}
                style={{
                  transitionDelay: isVisible ? `${i * 100}ms` : "0ms",
                }}
              />
              {isPartial && (
                <div
                  className="absolute top-0 left-0 overflow-hidden transition-all duration-300"
                  style={{
                    width: isVisible ? `${fillPercentage}%` : "0%",
                    transitionDelay: isVisible ? `${i * 100}ms` : "0ms",
                  }}
                >
                  <Star
                    className={`${sizeClasses[size]} fill-primary text-primary`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showValue && (
        <span
          className={`font-semibold transition-all duration-300 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
          }`}
          style={{
            transitionDelay: isVisible ? `${maxStars * 100}ms` : "0ms",
          }}
        >
          {rating.toFixed(1)} / 5
        </span>
      )}
    </div>
  );
};

export default AnimatedStarRating;
