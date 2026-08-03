import {
  AdminSidebar,
  AdminMobileBottomNav,
} from '@/components/admin/AdminSidebar';

/**
 * Admin shell. Auth + role gating happens in middleware.ts
 * (which already runs supabase.auth.getUser() and enforces
 * profiles.role === 'admin' | 'super_admin' before this layout
 * renders). Duplicating that check here added 2 extra Supabase
 * round-trips per navigation — ~400-800ms of pure round-trip
 * latency from India, which is why every admin page felt slow.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
