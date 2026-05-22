'use client';

import { useIsApp } from '@/lib/hooks/useIsApp';

interface Props {
  raw: string;
}

/**
 * Renders the user's first name in the greeting. App title-cases the
 * first letter (so "vishnu" → "Vishnu"); web keeps the original
 * casing untouched per the explicit "no web changes" instruction.
 */
export function GreetingName({ raw }: Props) {
  const isApp = useIsApp();
  const display =
    isApp && raw.length > 0 ? raw.charAt(0).toUpperCase() + raw.slice(1) : raw;
  return <span className="text-accent">{display}</span>;
}
