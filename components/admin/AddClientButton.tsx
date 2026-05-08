'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { AddClientModal } from './AddClientModal';

/**
 * The "Add Client" button + its modal.
 *
 * Wraps the static button in a client component so we can manage the
 * modal open state. Used as the action slot on the admin clients page.
 */
export function AddClientButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors"
      >
        <UserPlus size={14} strokeWidth={2.5} />
        Add Client
      </button>

      <AddClientModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
