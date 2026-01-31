"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    let mounted = true;

    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // Check if user has is_admin flag in their profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (!mounted) return;

        if (error) {
          console.error('[useAdmin] Error checking admin status:', error);
          setIsAdmin(false);
          setIsLoading(false);
        } else {
          setIsAdmin(profile?.is_admin === true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[useAdmin] Error in checkAdminStatus:', error);
        if (mounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    };

    checkAdminStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (mounted) {
        setIsLoading(true);
        checkAdminStatus();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { isAdmin, isLoading };
}
