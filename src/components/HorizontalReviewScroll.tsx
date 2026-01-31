"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReviewCard from "@/components/ReviewCard";

interface Review {
  comment: {
    comment_id: number;
    comment_text: string | null;
    overall_rating: number | null;
    comment_date: string;
    author_name: string | null;
    product_id: number;
    user_id: string | null;
    authorAvatar: string | null;
  };
  product: {
    product_id: number;
    product_name: string;
    product_image_url: string | null;
    brand: string;
    slug: string | null;
  } | null;
}

interface HorizontalReviewScrollProps {
  reviews: Review[];
}

export default function HorizontalReviewScroll({ reviews }: HorizontalReviewScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.offsetWidth * 0.8;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative group">
      {/* Left scroll button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:opacity-0 md:group-hover:opacity-100 transition-opacity md:flex shadow-lg"
        onClick={() => scroll("left")}
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide flex gap-6 pb-4 scroll-smooth snap-x snap-mandatory"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {reviews.map(({ comment, product }) => (
          <div
            key={comment.comment_id}
            className="flex-shrink-0 w-[280px] sm:w-[320px] snap-start"
          >
            <ReviewCard comment={comment} product={product} />
          </div>
        ))}
      </div>

      {/* Right scroll button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:opacity-0 md:group-hover:opacity-100 transition-opacity md:flex shadow-lg"
        onClick={() => scroll("right")}
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
