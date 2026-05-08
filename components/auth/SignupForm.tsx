'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';
import { signUp, type AuthActionState } from '@/lib/actions/auth';
import { Input, Label, FieldError } from '@/components/ui/Input';

const initialState: AuthActionState = { ok: false };

export function SignupForm() {
  const [state, formAction] = useActionState(signUp, initialState);
  const params = useSearchParams();

  // Pre-fill from query params (used when admin generates an invite link)
  const prefillEmail = params.get('email') ?? '';
  const prefillName = params.get('name') ?? '';

  if (state.ok && state.message) {
    return (
      <div className="text-center py-6">
        <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-accent/10 border border-accent/30 text-accent mb-4">
          <Check size={24} strokeWidth={3} />
        </div>
        <h3 className="font-display font-semibold text-lg tracking-tight mb-2">
          Check your email
        </h3>
        <p className="text-sm text-text-muted leading-relaxed">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="fullName" required>Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Arjun M."
          defaultValue={prefillName}
          error={state.fieldErrors?.fullName}
          required
        />
        <FieldError message={state.fieldErrors?.fullName} />
      </div>

      <div>
        <Label htmlFor="email" required>Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={prefillEmail}
          error={state.fieldErrors?.email}
          required
        />
        <FieldError message={state.fieldErrors?.email} />
      </div>

      <div>
        <Label htmlFor="password" required helpText="At least 8 characters">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
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

      <div className="text-center pt-2">
        <p className="text-[11px] text-text-dim leading-relaxed max-w-xs mx-auto">
          By signing up you agree to our{' '}
          <a href="/terms" className="text-text-muted hover:text-accent underline-offset-2 hover:underline">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="text-text-muted hover:text-accent underline-offset-2 hover:underline">Privacy Policy</a>.
        </p>
      </div>
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
          Creating account...
        </>
      ) : (
        'Create Account'
      )}
    </button>
  );
}
