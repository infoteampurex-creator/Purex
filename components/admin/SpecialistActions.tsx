'use client';

import { useState } from 'react';
import { Edit3, Users } from 'lucide-react';
import { EditSpecialistModal } from './EditSpecialistModal';
import { ViewSpecialistClientsModal } from './ViewSpecialistClientsModal';
import { type SpecialistClient } from '@/lib/data/admin-specialists';

interface SpecialistActionsProps {
  expertId: string;
  initial: {
    name: string;
    title: string;
    shortRole: string;
    location: string;
    calendlyUrl: string;
    photoUrl: string;
    bioShort: string;
    clientsTrained: number;
    isActive: boolean;
  };
  clients: SpecialistClient[];
}

export function SpecialistActions({
  expertId,
  initial,
  clients,
}: SpecialistActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setEditOpen(true)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-full border border-border text-xs font-medium hover:border-accent/50 hover:text-accent transition-colors"
        >
          <Edit3 size={12} />
          Edit profile
        </button>
        <button
          onClick={() => setViewOpen(true)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-full border border-border text-xs font-medium hover:border-accent/50 hover:text-accent transition-colors"
        >
          <Users size={12} />
          View clients
        </button>
      </div>

      <EditSpecialistModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        expertId={expertId}
        initial={initial}
      />

      <ViewSpecialistClientsModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        specialistName={initial.name}
        clients={clients}
      />
    </>
  );
}
