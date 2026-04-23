'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { updatePassword } from '@/lib/actions/reset-password';
import { Input, Label, FieldError } from '@/components/ui/Input';
import type { AuthActionState } from '@/lib/actions/auth';

const initialState: AuthActionState = { ok: false };

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(updatePassword, initialState);

  return (
    <AuthShell
      variant="calm"
      eyebrow="New Password"
      title="Set your new password"
      subtitle="Choose a strong password you haven't used before."
      footer={
        <p className="text-xs text-text-muted">
          Need to sign in instead?{' '}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Back to login
          </Link>
        </p>
      }
    >
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="password" required helpText="At least 8 characters">
            New password
          </Label>
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

        <div>
          <Label htmlFor="confirmPassword" required>Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={state.fieldErrors?.confirmPassword}
            required
          />
          <FieldError message={state.fieldErrors?.confirmPassword} />
        </div>

        {state.error && !state.fieldErrors && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/40 text-danger text-xs">
            {state.error}
          </div>
        )}

        <SubmitButton />
      </form>
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
          Updating...
        </>
      ) : (
        'Update Password'
      )}
    </button>
  );
}
