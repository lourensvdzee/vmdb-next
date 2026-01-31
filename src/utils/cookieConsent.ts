// Cookie consent management utility
// Handles storing and retrieving user consent for cookies and tracking

const CONSENT_KEY = 'vmdb_cookie_consent';

export type ConsentStatus = 'accepted' | 'rejected' | 'pending';

/**
 * Get the current consent status from localStorage
 */
export const getConsentStatus = (): ConsentStatus => {
  if (typeof window === 'undefined') return 'pending';
  const stored = localStorage.getItem(CONSENT_KEY);
  if (stored === 'accepted' || stored === 'rejected') {
    return stored;
  }
  return 'pending';
};

/**
 * Set the consent status in localStorage
 */
export const setConsentStatus = (status: 'accepted' | 'rejected'): void => {
  localStorage.setItem(CONSENT_KEY, status);
  // Dispatch custom event so components can react to consent changes
  window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: status }));
};

/**
 * Check if user has accepted cookies
 */
export const hasAcceptedCookies = (): boolean => {
  return getConsentStatus() === 'accepted';
};

/**
 * Check if consent banner should be shown
 */
export const shouldShowBanner = (): boolean => {
  return getConsentStatus() === 'pending';
};

/**
 * Clear the consent status (user revokes consent)
 * This will cause the banner to show again and reload the page to remove tracking scripts
 */
export const clearConsent = (): void => {
  localStorage.removeItem(CONSENT_KEY);
  // Dispatch event to notify components
  window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: 'pending' }));
  // Reload page to remove any loaded tracking scripts
  window.location.reload();
};
