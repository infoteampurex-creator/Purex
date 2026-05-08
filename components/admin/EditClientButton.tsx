'use client';

import { useState } from 'react';
import { Edit3 } from 'lucide-react';
import { EditClientModal } from './EditClientModal';

interface EditClientButtonProps {
  clientId: string;
  initial: {
    fullName: string;
    phone?: string | null;
    planSlug?: string | null;
    coachSlug?: string | null;
    status: 'active' | 'paused' | 'completed' | 'cancelled' | 'onboarding';
  };
}

export function EditClientButton({ clientId, initial }: EditClientButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border text-xs font-medium hover:border-accent/50 hover:text-accent transition-colors"
      >
        <Edit3 size={12} />
        Edit
      </button>

      <EditClientModal
        open={open}
        onClose={() => setOpen(false)}
        clientId={clientId}
        initial={initial}
      />
    </>
  );
}
