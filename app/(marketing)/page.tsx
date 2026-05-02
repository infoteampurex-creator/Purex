import { Hero } from '@/components/marketing/hero/Hero';
import { PactCounterStrip } from '@/components/marketing/sections/PactCounterStrip';
import { VisionMissionAim } from '@/components/marketing/sections/VisionMissionAim';
import { ExpertsGrid } from '@/components/marketing/sections/ExpertsGrid';
import { ProgramsGrid } from '@/components/marketing/sections/ProgramsGrid';
// HyroxSection + IronmanSection content has been consolidated into the
// Enduro program detail page (/programs/enduro). Removed from homepage.
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
      {/* <InActionGallery /> — hidden until photo refresh */}
      <TransformationGallery />
      <TestimonialStrip />
      <CtaBand />
    </>
  );
}
