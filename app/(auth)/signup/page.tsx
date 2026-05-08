import Link from 'next/link';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Get Started"
      title="Join PURE X"
      subtitle="Start your transformation with the integrated coaching team."
      footer={
        <p className="text-xs text-text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Sign in
          </Link>
        </p>
      }
    >
      <Suspense fallback={<div className="h-64" />}>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
