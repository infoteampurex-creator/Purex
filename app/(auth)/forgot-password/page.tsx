'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Mail } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { requestPasswordReset, type AuthActionState } from '@/lib/actions/auth';
import { Input, Label, FieldError } from '@/components/ui/Input';

const initialState: AuthActionState = { ok: false };

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(requestPasswordReset, initialState);

  return (
    <AuthShell
      variant="calm"
      eyebrow="Reset Password"
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <p className="text-xs text-text-muted">
          Remember it?{' '}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Back to sign in
          </Link>
        </p>
      }
    >
      {state.ok && state.message ? (
        <div className="text-center py-6">
          <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-accent/10 border border-accent/30 text-accent mb-4">
            <Mail size={22} />
          </div>
          <h3 className="font-display font-semibold text-lg tracking-tight mb-2">
            Email sent
          </h3>
          <p className="text-sm text-text-muted leading-relaxed">{state.message}</p>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
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

          {state.error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/40 text-danger text-xs">
              {state.error}
            </div>
          )}

          <SubmitButton />
        </form>
      )}
    </AuthShell>
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
          Sending...
        </>
      ) : (
        'Send Reset Link'
      )}
    </button>
  );
}
