'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  CalendarDays,
  Camera,
  Settings,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { ParticipantsTable } from './ParticipantsTable';
import { DailyEntryGrid } from './DailyEntryGrid';
import { JourneyManager } from './JourneyManager';
import { ConfigForm } from './ConfigForm';
import { CardsGenerator } from './CardsGenerator';
import {
  type AdminParticipant,
  type JourneyPost,
  type MotherStrongConfig,
} from '@/lib/data/mother-strong-types';
import { type AdminGridRow } from '@/lib/data/mother-strong';

type TabId = 'participants' | 'daily' | 'journey' | 'config' | 'cards';

interface Props {
  initialTab: TabId;
  participants: AdminParticipant[];
  gridRows: AdminGridRow[];
  journey: JourneyPost[];
  config: MotherStrongConfig;
}

export function MotherStrongAdmin({
  initialTab,
  participants,
  gridRows,
  journey,
  config,
}: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [tab, setTab] = useState<TabId>(initialTab);

  const setActiveTab = (next: TabId) => {
    setTab(next);
    // Keep the URL in sync so reloads stay on the same tab.
    const params = new URLSearchParams(search?.toString());
    params.set('tab', next);
    router.replace(`/admin/mother-strong?${params.toString()}`, {
      scroll: false,
    });
  };

  const tabs: { id: TabId; label: string; icon: typeof Users; count?: number }[] = [
    { id: 'participants', label: 'Participants', icon: Users, count: participants.length },
    { id: 'daily', label: 'Daily entry', icon: CalendarDays },
    { id: 'journey', label: 'Journey feed', icon: Camera, count: journey.length },
    { id: 'config', label: 'Config', icon: Settings },
    { id: 'cards', label: 'Gratitude cards', icon: Award },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex items-center gap-1 overflow-x-auto -mb-px">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  active
                    ? 'text-accent border-accent'
                    : 'text-text-muted border-transparent hover:text-text hover:border-border-soft'
                )}
              >
                <Icon size={14} />
                {t.label}
                {typeof t.count === 'number' && t.count > 0 && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-mono font-bold',
                      active ? 'bg-accent text-bg' : 'bg-bg-elevated text-text-muted'
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[400px]">
        {tab === 'participants' && (
          <ParticipantsTable participants={participants} />
        )}
        {tab === 'daily' && (
          <DailyEntryGrid rows={gridRows} dailyGoal={config.dailyGoal} />
        )}
        {tab === 'journey' && (
          <JourneyManager posts={journey} participants={participants} />
        )}
        {tab === 'config' && <ConfigForm initial={config} />}
        {tab === 'cards' && <CardsGenerator participants={participants} />}
      </div>
    </div>
  );
}
