import LandingNav from "@/components/organisms/LandingNav/LandingNav";
import LandingHero from "@/components/organisms/LandingHero/LandingHero";
import RulesMarquee from "@/components/organisms/RulesMarquee/RulesMarquee";
import HowItWorks from "@/components/organisms/HowItWorks/HowItWorks";
import Mechanics from "@/components/organisms/Mechanics/Mechanics";
import PlayModes from "@/components/organisms/PlayModes/PlayModes";
import ResultShowcase from "@/components/organisms/ResultShowcase/ResultShowcase";
import FinalCta from "@/components/organisms/FinalCta/FinalCta";
import Donate from "@/components/organisms/Donate/Donate";
import LandingFooter from "@/components/organisms/LandingFooter/LandingFooter";

/**
 * Landing — arco: chegar (jogo ao vivo) → regras → como funciona (scroll) →
 * mecânicas → modos (solo · duelo · música) → resultado → ação → apoio → rodapé.
 */
export default function Home() {
  return (
    <>
      <LandingNav />
      <main id="top">
        <LandingHero />
        <RulesMarquee />
        <HowItWorks />
        <Mechanics />
        <PlayModes />
        <ResultShowcase />
        <FinalCta />
        <Donate />
      </main>
      <LandingFooter />
    </>
  );
}
