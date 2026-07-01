import type { Metadata } from 'next';
import { MothersPageView } from '@/components/purex-mothers/MothersPageView';

export const metadata: Metadata = {
  title: 'PURE X Mothers — 60 Days of Strength · Team PURE X',
  description:
    'Celebrating 9 mothers who completed 60 days of strength training, diet discipline, and 10,000 steps a day. Generate your personalized appreciation card.',
  openGraph: {
    title: 'PURE X Mothers — 60 Days of Strength',
    description:
      'A celebration of mothers who chose strength, consistency, and self-care. Started on Mother\'s Day, completed in 60 days.',
    type: 'website',
  },
};

export default function PureXMothersPage() {
  return <MothersPageView initialMother={null} />;
}
