"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { shouldShowBanner, setConsentStatus } from '@/utils/cookieConsent';

/**
 * Cookie consent banner component
 * Shows at the bottom of the screen until user accepts or rejects
 * Complies with EU cookie regulations (GDPR)
 */
export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if we should show the banner
    setIsVisible(shouldShowBanner());
  }, []);

  const handleAccept = () => {
    setConsentStatus('accepted');
    setIsVisible(false);
  };

  const handleReject = () => {
    setConsentStatus('rejected');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">We use cookies</h3>
            <p className="text-sm text-muted-foreground">
              We use cookies and similar technologies to help personalize content, tailor and measure ads,
              and provide a better experience. By clicking &quot;Accept&quot;, you agree to our use of cookies for
              analytics purposes (Google Analytics, Search Console). You can learn more in our{' '}
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={handleReject}
              className="flex-1 md:flex-none"
            >
              Reject
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-1 md:flex-none"
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
