"use client";

import { useState, useRef } from "react";
import { Star } from "lucide-react";

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  showValue?: boolean;
}

const StarRatingInput = ({
  value,
  onChange,
  disabled = false,
  size = "md",
  label,
  showValue = true,
}: StarRatingInputProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  // Calculate rating based on position (works for both mouse and touch)
  const calculateRatingFromPosition = (clientX: number): number | null => {
    const container = containerRef.current;
    if (!container) return null;

    const buttons = Array.from(container.querySelectorAll('button'));

    // Find which star button the position is over
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const rect = button.getBoundingClientRect();

      if (clientX >= rect.left && clientX <= rect.right) {
        const x = clientX - rect.left;
        const width = rect.width;
        const isLeftHalf = x < width / 2;
        return i + (isLeftHalf ? 0.5 : 1);
      }
    }

    // If touch is to the left of all stars, return 0.5
    const firstButton = buttons[0];
    if (firstButton && clientX < firstButton.getBoundingClientRect().left) {
      return 0.5;
    }

    // If touch is to the right of all stars, return 5
    const lastButton = buttons[buttons.length - 1];
    if (lastButton && clientX > lastButton.getBoundingClientRect().right) {
      return 5;
    }

    return null;
  };

  // Calculate rating based on mouse position for half-star precision
  const calculateRating = (e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // If click is in left half, return .5, otherwise return full star
    const isLeftHalf = x < width / 2;
    return starIndex + (isLeftHalf ? 0.5 : 1);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    if (disabled) return;
    const rating = calculateRating(e, starIndex);
    setHoverValue(rating);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    if (disabled) return;
    const rating = calculateRating(e, starIndex);
    onChange(rating);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  // Touch event handlers for mobile slide functionality
  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.preventDefault(); // Prevent scrolling while rating
    setIsDragging(true);

    const touch = e.touches[0];
    const rating = calculateRatingFromPosition(touch.clientX);
    if (rating !== null) {
      setHoverValue(rating);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || !isDragging) return;
    e.preventDefault(); // Prevent scrolling while dragging

    const touch = e.touches[0];
    const rating = calculateRatingFromPosition(touch.clientX);
    if (rating !== null) {
      setHoverValue(rating);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || !isDragging) return;
    e.preventDefault();

    setIsDragging(false);

    // Set the final rating value
    if (hoverValue !== null) {
      onChange(hoverValue);
    }

    setHoverValue(null);
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex items-center gap-2">
        <div
          ref={containerRef}
          className="flex gap-1"
          onMouseLeave={handleMouseLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const isFilled = i < Math.floor(displayValue);
            const isPartial = i === Math.floor(displayValue) && displayValue % 1 !== 0;
            const fillPercentage = isPartial ? (displayValue % 1) * 100 : 0;

            return (
              <button
                key={i}
                type="button"
                onClick={(e) => handleClick(e, i)}
                onMouseMove={(e) => handleMouseMove(e, i)}
                onTouchStart={handleTouchStart}
                disabled={disabled}
                className="relative transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer touch-none"
              >
                <Star
                  className={`${sizeClasses[size]} transition-all ${
                    isFilled
                      ? "fill-primary text-primary"
                      : "fill-muted text-muted"
                  }`}
                />
                {isPartial && (
                  <div
                    className="absolute top-0 left-0 overflow-hidden pointer-events-none"
                    style={{ width: `${fillPercentage}%` }}
                  >
                    <Star className={`${sizeClasses[size]} fill-primary text-primary`} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {showValue && displayValue > 0 && (
          <span className="ml-2 text-sm font-semibold text-muted-foreground min-w-[2rem]">
            {displayValue.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRatingInput;
