'use client';

import { useEffect, useState } from 'react';
import { AvatarImage } from './AvatarImage';

/**
 * Renders <AvatarImage> at 260px on mobile, 320px on md+. Prevents the
 * 320px avatar from overflowing the ~255px card content area on
 * 375px-wide iPhones — which was pushing the figure visually right
 * of centre (reported 2026-07-15).
 *
 * Uses matchMedia so the width flips on device rotation / window
 * resize without a full remount.
 */
export function TwinAvatarResponsive({ src }: { src: string }) {
  const [isMd, setIsMd] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsMd(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return <AvatarImage src={src} width={isMd ? 320 : 260} accent="#c6ff3d" />;
}
