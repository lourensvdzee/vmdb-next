"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface SignupConversionCTAProps {
  onLoginClick?: () => void;
}

const STORAGE_KEY = "vmdb_hide_signup_cta_until";
const HIDE_DURATION_DAYS = 30;

const SignupConversionCTA = ({ onLoginClick }: SignupConversionCTAProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if CTA has been dismissed
    const dismissedUntil = localStorage.getItem(STORAGE_KEY);

    if (dismissedUntil) {
      const dismissedDate = new Date(dismissedUntil);
      const now = new Date();

      // If still within dismissal period, don't show
      if (now < dismissedDate) {
        return;
      }

      // Dismissal period expired, clear storage
      localStorage.removeItem(STORAGE_KEY);
    }

    // Show CTA with fade-in animation
    setIsVisible(true);
    // Delay fade-in slightly to ensure smooth animation
    setTimeout(() => setFadeIn(true), 50);
  }, []);

  const handleDismiss = () => {
    // Calculate dismissal expiry (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + HIDE_DURATION_DAYS);

    // Store expiry date
    localStorage.setItem(STORAGE_KEY, expiryDate.toISOString());

    // Hide with fade-out
    setFadeIn(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleSignupClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      router.push("/login");
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`transition-opacity duration-300 ${
        fadeIn ? "opacity-100" : "opacity-0"
      }`}
    >
      <Card
        className="relative overflow-hidden border-primary/20"
        style={{ background: 'linear-gradient(to right, #f0fdf4, #ecfdf5)' }}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-sm hover:bg-background/50"
          aria-label="Dismiss signup prompt"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 pr-12">
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Enjoying VMDb? 🌱
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Create a free account to rate products & help others choose smarter.
              </p>
            </div>

            <Button
              onClick={handleSignupClick}
              variant="default"
              size="sm"
              className="w-fit"
            >
              Sign up with magic link
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SignupConversionCTA;
