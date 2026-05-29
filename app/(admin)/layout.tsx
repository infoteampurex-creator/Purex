import { redirect } from 'next/navigation';
import {
  AdminSidebar,
  AdminMobileBottomNav,
} from '@/components/admin/AdminSidebar';
import { requireAuth } from '@/lib/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Dev note: middleware already protects /admin/* routes. This is a backup
  // check in case middleware is bypassed. Supabase-env guard happens in middleware too.
  //
  // Only run server-side auth check if Supabase is configured — otherwise
  // allow dev browsing so the UI can be viewed without env setup.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const user = await requireAuth({ adminOnly: true });
    if (!user) redirect('/login?redirect=/admin/dashboard');
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop only — hidden < md */}
      <AdminSidebar />
      {/* Mobile only — hidden >= md */}
      <AdminMobileBottomNav />

      {/* Padding: left only on desktop (room for sidebar); bottom on
          mobile to clear the bottom nav (h-16 + safe-area). No left
          padding on mobile so content uses full width. */}
      <div className="md:pl-20 lg:pl-64 pb-20 md:pb-0">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-6 md:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
