'use client';

import dynamic from 'next/dynamic';
import { useIsApp } from '@/lib/hooks/useIsApp';
import type {
  BodyMeasurements,
  ProfileBodySettings,
} from '@/lib/data/body-measurements';

/**
 * Dispatcher — only mount the measurements card inside the mobile
 * app. Web never loads the form code, the sheet, or the conversion
 * helpers.
 */
const BodyMeasurementsCardInner = dynamic(
  () =>
    import('./BodyMeasurementsCardInner').then(
      (m) => m.BodyMeasurementsCardInner
    ),
  { ssr: false, loading: () => null }
);

interface Props {
  latest: BodyMeasurements | null;
  profileSettings: ProfileBodySettings;
}

export function BodyMeasurementsCard(props: Props) {
  const isApp = useIsApp();
  if (!isApp) return null;
  return <BodyMeasurementsCardInner {...props} />;
}
