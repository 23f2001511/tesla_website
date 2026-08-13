import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { FeaturedEvent } from "@/components/sections/FeaturedEvent";
import { UpcomingEventsPreview } from "@/components/sections/UpcomingEventsPreview";
import { OurImpact } from "@/components/sections/OurImpact";
import { CTA } from "@/components/sections/CTA";

export default function Home() {
  return (
    <div className="flex flex-col overflow-x-hidden">
      <Hero />
      <Features />
      <FeaturedEvent />
      <UpcomingEventsPreview />
      <OurImpact />
      <CTA />
    </div>
  );
}

