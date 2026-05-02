import { Hero } from '@/components/marketing/hero/Hero';
import { PactCounterStrip } from '@/components/marketing/sections/PactCounterStrip';
import { VisionMissionAim } from '@/components/marketing/sections/VisionMissionAim';
import { ExpertsGrid } from '@/components/marketing/sections/ExpertsGrid';
import { ProgramsGrid } from '@/components/marketing/sections/ProgramsGrid';
import { HyroxSection } from '@/components/marketing/sections/HyroxSection';
import { IronmanSection } from '@/components/marketing/sections/IronmanSection';
import { InActionGallery as _InActionGallery } from '@/components/marketing/sections/InActionGallery';
// ^ Imported but not rendered — InAction section hidden until photo refresh.
//   To restore: replace `_InActionGallery` import name with `InActionGallery`
//   and uncomment the <InActionGallery /> line below.
void _InActionGallery;
import { TransformationGallery } from '@/components/marketing/sections/TransformationGallery';
import { TestimonialStrip } from '@/components/marketing/sections/TestimonialStrip';
import { CtaBand } from '@/components/marketing/sections/CtaBand';

export default function HomePage() {
  return (
    <>
      <Hero />
      <PactCounterStrip />
      <VisionMissionAim />
      <ExpertsGrid />
      <ProgramsGrid />
      <HyroxSection />
      <IronmanSection />
      {/* <InActionGallery /> — hidden until photo refresh */}
      <TransformationGallery />
      <TestimonialStrip />
      <CtaBand />
    </>
  );
}
