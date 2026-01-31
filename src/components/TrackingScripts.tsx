"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { hasAcceptedCookies } from '@/utils/cookieConsent';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Component that loads tracking scripts only after user consent
 * Features:
 * - Google Analytics 4 with cookie consent
 * - Automatic SPA page view tracking
 * - Custom event tracking support
 */
export const TrackingScripts = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check initial consent status
    if (hasAcceptedCookies()) {
      loadTrackingScripts();
    }

    // Listen for consent changes
    const handleConsentChange = (event: CustomEvent) => {
      if (event.detail === 'accepted') {
        loadTrackingScripts();
      }
    };

    window.addEventListener('cookieConsentChanged', handleConsentChange as EventListener);

    return () => {
      window.removeEventListener('cookieConsentChanged', handleConsentChange as EventListener);
    };
  }, []);

  // Track page views on route change (SPA navigation)
  useEffect(() => {
    if (hasAcceptedCookies() && window.gtag) {
      const search = searchParams?.toString();
      const fullPath = search ? `${pathname}?${search}` : pathname;
      window.gtag('event', 'page_view', {
        page_path: fullPath,
        page_title: document.title,
      });
    }
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
};

/**
 * Load all tracking scripts
 * Only called when user has accepted cookies
 */
const loadTrackingScripts = () => {
  // Prevent loading scripts multiple times
  if (window.gtag) {
    return;
  }

  // Google Analytics
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize Google Analytics
  const inlineScript = document.createElement('script');
  inlineScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}', {
      send_page_view: false
    });
  `;
  document.head.appendChild(inlineScript);
};

/**
 * Helper function to track custom events
 * Usage: trackEvent('review_submitted', { product_id: 123, rating: 5 })
 */
export const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (hasAcceptedCookies() && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

export default TrackingScripts;
