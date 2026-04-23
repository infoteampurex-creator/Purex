'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { whatsappLink } from '@/lib/constants';

export function WhatsAppFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in after 1.2s so it doesn't compete with first paint
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <a
      href={whatsappLink('Hi PURE X, I would like to book a free discovery call.')}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        fixed bottom-5 right-5 md:bottom-8 md:right-8 z-30
        flex items-center justify-center gap-2
        h-14 px-5 rounded-full
        bg-[#25D366] text-white shadow-2xl
        transition-all duration-500
        hover:scale-105 hover:shadow-glow
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={22} fill="currentColor" />
      <span className="hidden md:inline font-medium text-sm">WhatsApp</span>
    </a>
  );
}
