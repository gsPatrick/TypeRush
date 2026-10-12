import Link from "next/link";
import BrandMark from "@/components/atoms/BrandMark/BrandMark";
import Donate from "@/components/organisms/Donate/Donate";
import styles from "./apoie.module.css";

export const metadata = {
  title: "Apoie — TypeRush",
  description: "Ajude esse dev a tomar um café enquanto você digita. Pix de R$ 5 a R$ 100.",
};

export default function ApoiePage() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.home} aria-label="TypeRush — início">
          <BrandMark />
        </Link>
        <Link href="/jogar" className={styles.play}>
          voltar a jogar →
        </Link>
      </header>
      <main>
        <Donate as="page" />
      </main>
    </div>
  );
}
