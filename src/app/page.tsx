import { FeatureSections } from "@/components/marketing/feature-sections";
import { HeroSection } from "@/components/marketing/hero-section";
import { SiteHeader } from "@/components/marketing/site-header";

export default function Home() {
  return (
    <main className="min-h-screen text-[var(--text-primary)]">
      <SiteHeader />
      <HeroSection />
      <FeatureSections />
    </main>
  );
}
