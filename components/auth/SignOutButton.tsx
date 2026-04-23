'use client';

import { useTransition } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { signOut } from '@/lib/actions/auth';
import { cn } from '@/lib/cn';

interface SignOutButtonProps {
  className?: string;
  variant?: 'full' | 'icon';
}

export function SignOutButton({ className, variant = 'full' }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        aria-label="Sign out"
        className={cn(
          'w-10 h-10 rounded-full border border-border bg-bg-card flex items-center justify-center hover:border-danger hover:text-danger transition-colors disabled:opacity-50',
          className
        )}
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'inline-flex items-center gap-2 px-4 h-10 rounded-full border border-border text-sm font-medium',
        'text-text-muted hover:text-danger hover:border-danger/50 transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isPending ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          Signing out...
        </>
      ) : (
        <>
          <LogOut size={14} />
          Sign out
        </>
      )}
    </button>
  );
}
