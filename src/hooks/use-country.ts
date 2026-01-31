"use client";

import { useEffect, useState, useCallback } from 'react';
import { resolveActiveCountry, setOverrideCountry, clearOverrideCountry, mapIsoToDbName } from '@/lib/geo';

export type CountryState = {
  code: string; // ISO-2 or 'EU'
  name: string | null; // DB display name, null for unknown/EU
  source: 'override' | 'locale' | 'ip' | 'default';
  justDetected: boolean;
};

export function useCountry(uiLangFallback?: 'NL' | 'DE' | 'EU') {
  const [state, setState] = useState<CountryState>({ code: 'EU', name: null, source: 'default', justDetected: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await resolveActiveCountry(uiLangFallback);
      if (mounted) setState(res);
    })();
    return () => { mounted = false; };
  }, [uiLangFallback]);

  const setOverride = useCallback((code: string) => {
    setOverrideCountry(code);
    const upperCode = code.toUpperCase();
    const isWorldCode = upperCode === 'WORLD' || upperCode === 'EU';
    setState({ code: upperCode, name: isWorldCode ? null : mapIsoToDbName(code), source: 'override', justDetected: false });
  }, []);

  const clearOverride = useCallback(() => {
    clearOverrideCountry();
    // Re-resolve without override, keep current language fallback
    (async () => {
      const res = await resolveActiveCountry(uiLangFallback);
      setState(res);
    })();
  }, [uiLangFallback]);

  const isOverride = state.source === 'override';
  const isWorld = state.code === 'EU' || state.code === 'WORLD';
  return {
    activeCountryCode: state.code,
    activeCountryName: isWorld ? null : state.name, // Treat World/EU as no filter
    source: state.source,
    isOverride,
    isWorld,
    justDetected: state.justDetected,
    setCountryOverride: setOverride,
    clearCountryOverride: clearOverride,
  };
}
