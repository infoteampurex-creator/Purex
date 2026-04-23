import { MobileBottomNav, DesktopSidebar } from '@/components/client/ClientNav';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <DesktopSidebar />
      <div className="md:pl-20 lg:pl-64 pb-20 md:pb-0">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-5 md:py-8">
          {children}
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
