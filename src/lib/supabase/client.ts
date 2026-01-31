'use client';

import { createBrowserClient } from '@supabase/ssr';

// Configure cookie domain for cross-subdomain auth (vmdb.me ↔ admin.vmdb.me)
const isProduction = typeof window !== 'undefined' && window.location.hostname.endsWith('vmdb.me');

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    isProduction ? {
      cookieOptions: {
        domain: '.vmdb.me',
        sameSite: 'lax' as const,
        secure: true,
      },
    } : undefined
  );
}

// Singleton instance for client-side usage
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}

// Export for backwards compatibility
export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null;
