import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;
  return (
    <AuthShell
      eyebrow="Welcome Back"
      title="Sign in to PURE X"
      subtitle="Access your dashboard, plan, and team."
      footer={
        <p className="text-xs text-text-muted">
          New to PURE X?{' '}
          <Link href="/signup" className="text-accent hover:underline font-medium">
            Create an account
          </Link>
        </p>
      }
    >
      <LoginForm redirectTo={redirect} />
    </AuthShell>
  );
}
