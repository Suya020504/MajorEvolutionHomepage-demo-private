import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { ServicesShowcase } from "@/components/site/services-showcase";
import { Capabilities } from "@/components/site/capabilities";
import { Support } from "@/components/site/support";
import { PlanShowcase } from "@/components/site/plan-showcase";
import { CultureCta } from "@/components/site/culture-cta";
import { Footer } from "@/components/site/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <Support />
        <PlanShowcase />
        <ServicesShowcase />
        <Capabilities />
        <CultureCta />
      </main>
      <Footer />
    </>
  );
}
