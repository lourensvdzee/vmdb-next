'use client';

import { createBrowserClient } from '@supabase/ssr';

// Configure cookie domain for cross-subdomain auth (vmdb.me ↔ admin.vmdb.me)
const isProduction = typeof window !== 'undefined' && window.location.hostname.endsWith('vmdb.me');

// Debug logging
if (typeof window !== 'undefined') {
  console.log('[Supabase Client] hostname:', window.location.hostname);
  console.log('[Supabase Client] isProduction:', isProduction);
  console.log('[Supabase Client] cookies:', document.cookie);
}

export function createClient() {
  const options = isProduction ? {
    cookieOptions: {
      domain: '.vmdb.me',
      sameSite: 'lax' as const,
      secure: true,
    },
  } : undefined;

  console.log('[Supabase Client] Creating client with options:', options);

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
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
