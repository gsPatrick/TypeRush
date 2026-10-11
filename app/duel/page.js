import { Suspense } from "react";
import DuelApp from "@/components/organisms/DuelApp/DuelApp";

export const metadata = {
  title: "Duelo — TypeRush",
  description: "Crie uma sala, mande o link e dispute quem sobrevive mais no relógio.",
};

// useSearchParams (código da sala) exige Suspense no App Router
export default function DuelPage() {
  return (
    <Suspense fallback={null}>
      <DuelApp />
    </Suspense>
  );
}
