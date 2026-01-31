"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Beef, Circle } from "lucide-react";

interface CategoryStats {
  category: string;
  displayName: string;
  count: number;
  subcategories: string[];
}

interface CategoryScrollProps {
  categories: CategoryStats[];
}

// Get category icon based on category key - using category-icon classes for green tint
function getCategoryIcon(categoryKey: string) {
  switch (categoryKey.toUpperCase()) {
    case 'BURGER':
      return <img src="/Hamburger.png" alt="Burger" className="h-8 w-8 object-contain category-icon" />;
    case 'SAUSAGES':
      return <img src="/Wurst.png" alt="Sausages" className="h-8 w-8 object-contain category-icon-thick" />;
    case 'NUGGETS':
      return <img src="/Nuggets.png" alt="Nuggets" className="h-8 w-8 object-contain category-icon-thick" />;
    case 'CHICKEN':
      return <img src="/chicken.png" alt="Chicken" className="h-8 w-8 object-contain category-icon-thick" />;
    case 'SCHNITZEL':
      return <img src="/schnitzel.png" alt="Schnitzel" className="h-8 w-8 object-contain category-icon-thick" />;
    case 'MEATBALLS':
      return <img src="/meatballs.png" alt="Meatballs" className="h-8 w-8 object-contain category-icon" />;
    case 'FISH':
      return <img src="/Fish.png" alt="Fish" className="h-8 w-8 object-contain category-icon" />;
    case 'TOFU':
      return <img src="/tofu.png" alt="Tofu" className="h-8 w-8 object-contain category-icon-thick" />;
    case 'DELI':
      return <img src="/brotbelag.png" alt="Deli" className="h-8 w-8 object-contain category-icon-thick" />;
    case 'BACON':
      return <img src="/bacon.png" alt="Bacon" className="h-8 w-8 object-contain category-icon-thick" />;
    case 'MINCE':
    case 'BEEF':
    case 'FILET':
    case 'STRIPS':
      return <Beef className="h-8 w-8 category-icon-thick" />;
    default:
      return <Circle className="h-8 w-8 category-icon" />;
  }
}

export default function CategoryScroll({ categories }: CategoryScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative group/scroll">
      {/* Left Arrow */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex opacity-0 group-hover/scroll:opacity-100 transition-opacity bg-background/80 hover:bg-primary hover:text-primary-foreground"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide flex gap-1 sm:gap-2 pb-4 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((stat) => (
          <Link
            key={stat.category}
            href={`/search?category=${encodeURIComponent(stat.category)}`}
            className="category-icon-hover flex flex-col items-center gap-3 p-4 rounded-lg transition-all hover:bg-accent active:scale-95 flex-shrink-0 w-[120px] snap-start group"
          >
            <div className="rounded-full bg-primary/10 p-4 text-primary group-hover:bg-primary transition-colors">
              {getCategoryIcon(stat.category)}
            </div>
            <div className="text-sm font-medium text-center leading-tight">
              {stat.displayName}
            </div>
          </Link>
        ))}
      </div>

      {/* Right Arrow */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex opacity-0 group-hover/scroll:opacity-100 transition-opacity bg-background/80 hover:bg-primary hover:text-primary-foreground"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  );
}
