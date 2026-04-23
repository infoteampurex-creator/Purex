import { Nav } from '@/components/marketing/Nav';
import { Footer } from '@/components/marketing/Footer';
import { WhatsAppFab } from '@/components/marketing/WhatsAppFab';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
