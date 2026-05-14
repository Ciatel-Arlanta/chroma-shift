import { HeroSection } from "@/components/marketing/hero-section";
import { AnalysisWorkspace } from "@/components/workspace/analysis-workspace";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020611] text-white">
      <HeroSection />
      <AnalysisWorkspace />
    </main>
  );
}
