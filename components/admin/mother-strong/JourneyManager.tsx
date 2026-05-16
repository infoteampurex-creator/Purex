'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, Loader2, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  createJourneyPost,
  deleteJourneyPost,
} from '@/lib/actions/mother-strong';
import {
  type AdminParticipant,
  type JourneyPost,
  CHALLENGE_DURATION_DAYS,
} from '@/lib/data/mother-strong-types';

interface Props {
  posts: JourneyPost[];
  participants: AdminParticipant[];
}

export function JourneyManager({ posts, participants }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isUploading, startUploading] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setErrorMsg(null);
    startUploading(async () => {
      const r = await createJourneyPost(formData);
      if (!r.ok) {
        setErrorMsg(r.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  };

  const onDelete = (id: string) => {
    setDeletingId(id);
    setErrorMsg(null);
    deleteJourneyPost({ id })
      .then((r) => {
        setDeletingId(null);
        setConfirmDeleteId(null);
        if (!r.ok) {
          setErrorMsg(r.error);
          return;
        }
        router.refresh();
      })
      .catch(() => setDeletingId(null));
  };

  return (
    <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
      {/* ─── Upload form ─── */}
      <div className="rounded-2xl bg-bg-card border border-border p-5 md:p-6 self-start">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-2">
          Post to feed
        </div>
        <h3 className="font-display font-semibold text-lg tracking-tight mb-1">
          Share a moment
        </h3>
        <p className="text-xs text-text-muted leading-relaxed mb-4">
          Upload a photo from the cohort's day. It appears on the public
          program page below the leaderboard.
        </p>

        <form ref={formRef} action={onSubmit} className="space-y-3">
          <Field label="Photo *">
            <input
              type="file"
              name="image"
              accept="image/*"
              required
              className="block w-full text-xs file:mr-3 file:h-9 file:px-4 file:rounded-full file:border-0 file:bg-accent file:text-bg file:font-semibold hover:file:bg-accent-hover file:cursor-pointer"
            />
          </Field>

          <Field label="Caption (optional)">
            <textarea
              name="caption"
              rows={2}
              placeholder="Day 5 walk — Saturday morning at Lumbini Park."
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tag participant (optional)">
              <select
                name="participantId"
                className="w-full h-10 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none"
              >
                <option value="">— None —</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayId} · {p.fullName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Day (optional)">
              <input
                name="dayNumber"
                type="number"
                min={1}
                max={CHALLENGE_DURATION_DAYS}
                className="w-full h-10 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none"
              />
            </Field>
          </div>

          {errorMsg && (
            <div className="p-2 rounded-md bg-danger/10 border border-danger/30 text-danger text-xs">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload size={13} strokeWidth={2.5} />
                Post
              </>
            )}
          </button>
        </form>
      </div>

      {/* ─── Feed list ─── */}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-3">
          Feed · {posts.length} {posts.length === 1 ? 'post' : 'posts'}
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl bg-bg-card border border-border p-10 text-center text-text-muted">
            <Camera size={20} className="mx-auto mb-3 opacity-50" />
            <div className="text-sm">
              No posts yet. Upload the first one on the left.
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {posts.map((p) => (
              <div
                key={p.id}
                className={cn(
                  'rounded-xl overflow-hidden bg-bg-card border border-border group relative',
                  deletingId === p.id && 'opacity-50'
                )}
              >
                <div className="relative aspect-[4/3] bg-bg-inset">
                  <Image
                    src={p.imageUrl}
                    alt={p.caption ?? 'Journey post'}
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover"
                    unoptimized
                  />
                  {p.dayNumber != null && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-bg/85 backdrop-blur-sm font-mono text-[10px] uppercase tracking-[0.12em] text-accent font-bold">
                      Day {p.dayNumber}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  {p.participantName && (
                    <div className="font-display font-semibold text-sm">
                      {p.participantName}
                    </div>
                  )}
                  {p.caption && (
                    <div className="text-xs text-text-muted leading-relaxed mt-1">
                      {p.caption}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-soft">
                    <div className="text-[10px] text-text-dim font-mono">
                      {new Date(p.postedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                    {confirmDeleteId === p.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="text-[10px] font-bold uppercase tracking-[0.12em] text-danger hover:underline disabled:opacity-50"
                        >
                          {deletingId === p.id ? 'Deleting…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted hover:text-text"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(p.id)}
                        title="Delete post"
                        className="w-7 h-7 rounded-md border border-border-soft text-text-muted hover:border-danger/50 hover:text-danger transition-colors flex items-center justify-center"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold mb-1.5">
        {label}
      </div>
      {children}
    </label>
  );
}

