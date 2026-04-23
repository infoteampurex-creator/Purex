'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { Upload, Loader2, Check, X, Trash2, Camera } from 'lucide-react';
import { uploadProgressPhoto, uploadClientAvatar } from '@/lib/actions/photos';
import { cn } from '@/lib/cn';

interface PhotoUploadProps {
  clientId: string;
  mode: 'avatar' | 'progress';
  currentUrl?: string | null; // Signed URL for preview
  progressMeta?: {
    checkInDate: string;
    view: 'front' | 'side' | 'back';
  };
  label?: string;
  onUploadComplete?: (path: string) => void;
  className?: string;
}

/**
 * File upload component for avatars (headshots) and progress photos (front/side/back).
 *
 * Behaviour:
 *   - Click to open file picker, or drag-drop an image
 *   - Validates client-side before sending (5MB max, JPEG/PNG/WebP only)
 *   - Shows preview of selected file
 *   - Calls server action to upload to Supabase Storage
 *   - Shows progress spinner → success checkmark → returns to idle
 *   - Errors display inline with retry
 */
export function PhotoUpload({
  clientId,
  mode,
  currentUrl,
  progressMeta,
  label,
  onUploadComplete,
  className,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    setError(null);
    setJustUploaded(false);

    // Client-side validation
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please use a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Max 5MB.');
      return;
    }

    // Local preview
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);

    // Upload
    const formData = new FormData();
    formData.append('file', file);

    startTransition(async () => {
      try {
        const result =
          mode === 'avatar'
            ? await uploadClientAvatar(clientId, formData)
            : await uploadProgressPhoto(
                clientId,
                progressMeta!.checkInDate,
                progressMeta!.view,
                formData
              );

        if (!result.ok) {
          setError(result.error || 'Upload failed');
          setLocalPreview(null);
          return;
        }

        setJustUploaded(true);
        if (result.path && onUploadComplete) onUploadComplete(result.path);

        // Reset the success indicator after 2s
        setTimeout(() => setJustUploaded(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setLocalPreview(null);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const displayUrl = localPreview || currentUrl;
  const hasImage = Boolean(displayUrl);

  // ─── AVATAR MODE — circular 96px with overlay camera icon ─────────────
  if (mode === 'avatar') {
    return (
      <div className={cn('relative group', className)}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="relative w-24 h-24 rounded-full overflow-hidden border-2 flex items-center justify-center flex-shrink-0 hover:border-accent transition-colors"
          style={{
            borderColor: hasImage ? 'rgba(198, 255, 61, 0.3)' : 'rgba(120, 130, 120, 0.3)',
            background:
              'linear-gradient(135deg, rgba(198, 255, 61, 0.08), rgba(77, 255, 184, 0.04))',
          }}
          aria-label="Upload avatar"
        >
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <Camera size={24} className="text-accent opacity-60" strokeWidth={1.5} />
          )}

          {/* Hover overlay */}
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center transition-opacity',
              'bg-bg/75 opacity-0 group-hover:opacity-100',
              pending && 'opacity-100'
            )}
          >
            {pending ? (
              <Loader2 size={18} className="animate-spin text-accent" />
            ) : justUploaded ? (
              <Check size={18} className="text-accent" strokeWidth={3} />
            ) : (
              <Camera size={18} className="text-accent" />
            )}
          </div>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />

        {error && (
          <div className="absolute top-full left-0 mt-2 w-48 p-2 rounded-lg bg-danger/10 border border-danger/40 text-danger text-[10px] font-mono">
            {error}
          </div>
        )}
      </div>
    );
  }

  // ─── PROGRESS PHOTO MODE — 3:4 aspect ratio slot ──────────────────────
  return (
    <div
      className={cn('relative group', className)}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className={cn(
          'relative w-full aspect-[3/4] overflow-hidden flex flex-col items-center justify-center transition-colors',
          dragOver && 'ring-2 ring-accent ring-inset'
        )}
        style={{
          background: 'linear-gradient(180deg, #0a0c09 0%, #141814 100%)',
        }}
        aria-label={`Upload ${progressMeta?.view} photo`}
      >
        {displayUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displayUrl} alt={label} className="absolute inset-0 w-full h-full object-cover" />

            {/* Hover overlay for replacement */}
            <div
              className={cn(
                'absolute inset-0 flex flex-col items-center justify-center bg-bg/75 transition-opacity',
                'opacity-0 group-hover:opacity-100',
                pending && 'opacity-100'
              )}
            >
              {pending ? (
                <>
                  <Loader2 size={20} className="animate-spin text-accent mb-2" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold">
                    Uploading…
                  </span>
                </>
              ) : justUploaded ? (
                <>
                  <Check size={20} className="text-accent mb-1" strokeWidth={3} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold">
                    Uploaded
                  </span>
                </>
              ) : (
                <>
                  <Upload size={18} className="text-accent mb-1.5" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold">
                    Replace
                  </span>
                </>
              )}
            </div>
          </>
        ) : (
          // Empty state
          <>
            {pending ? (
              <>
                <Loader2 size={22} className="animate-spin text-accent mb-3" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent font-bold">
                  Uploading…
                </span>
              </>
            ) : (
              <>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(198, 255, 61, 0.08)', color: '#c6ff3d' }}
                >
                  <Upload size={18} strokeWidth={1.5} />
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted font-bold">
                  No {label} Photo
                </div>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-accent font-mono uppercase tracking-[0.14em] font-bold">
                  Click to upload
                </span>
                <span className="mt-0.5 text-[9px] text-text-dim font-mono">
                  or drop an image
                </span>
              </>
            )}
          </>
        )}

        {/* View label badge (bottom-left) */}
        <div
          className="absolute bottom-2 left-2 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-[0.18em] font-bold z-10"
          style={{
            background: 'rgba(10, 12, 9, 0.85)',
            color: '#c6ff3d',
            border: '1px solid rgba(198, 255, 61, 0.25)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {label}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="hidden"
      />

      {error && (
        <div className="mt-2 p-2 rounded-lg bg-danger/10 border border-danger/40 text-danger text-[10px] font-mono">
          {error}
        </div>
      )}
    </div>
  );
}
