'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { signIn, type AuthActionState } from '@/lib/actions/auth';
import { Input, Label, FieldError } from '@/components/ui/Input';

const initialState: AuthActionState = { ok: false };

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {/* Only send an explicit redirect if the caller requested one
          (e.g. deep-link back to a protected page). Otherwise, let the
          server action route based on user role (admin → /admin, else
          → /client). */}
      {redirectTo && (
        <input type="hidden" name="redirect" value={redirectTo} />
      )}

      <div>
        <Label htmlFor="email" required>Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={state.fieldErrors?.email}
          required
        />
        <FieldError message={state.fieldErrors?.email} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="password" required>Password</Label>
          <Link
            href="/forgot-password"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted hover:text-accent transition-colors font-bold"
          >
            Forgot?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={state.fieldErrors?.password}
          required
        />
        <FieldError message={state.fieldErrors?.password} />
      </div>

      {state.error && !state.fieldErrors && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/40 text-danger text-xs">
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-12 rounded-full bg-accent text-bg font-semibold text-sm hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Signing in...
        </>
      ) : (
        'Sign In'
      )}
    </button>
  );
}
