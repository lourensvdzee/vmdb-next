"use client";

import { useState, useEffect } from "react";

const subtitles = [
  "Saving animals, one schnitzel at a time.",
  "Honest reviews for plant-based products",
  "You deserve better than soggy tofu.",
  "The world's biggest meat alternative database",
  "Your guide to the world of plant-based meat.",
  "Find vegan food worth eating",
  "Rate it. Review it. Discover better.",
  "Your tastebuds deserve democracy",
  "The place where fake meat gets real reviews",
  "The answer to 'Is this one good?'",
  "Like IMDb - but for vegan meat.",
  "Stop wasting money on bad vegan products.",
  "Your tastebuds want this database.",
  "Find the best meat alternatives, rated by the community.",
  "No greenwashing, just honest opinions",
  "Join the movement, one bite at a time",
  "Browse. Compare. Try. Review. Repeat.",
  "From awful to epic - we rank it",
  "Plant-based doesn't have to mean guesswork.",
];

const AnimatedSubtitle = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % subtitles.length);
        setIsVisible(true);
      }, 500);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-24 flex items-center justify-center">
      <p
        className={`text-xl md:text-2xl font-semibold italic text-white transition-all duration-500 tracking-wide text-center ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        {subtitles[currentIndex]}
      </p>
    </div>
  );
};

export default AnimatedSubtitle;
