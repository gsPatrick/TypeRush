import DonatePanel from "@/components/organisms/DonatePanel/DonatePanel";
import { PIX } from "@/lib/pix/config";
import styles from "./Donate.module.css";

/**
 * Apoio — "ajude esse dev a tomar um café". Mesmo conteúdo na seção da
 * landing (#apoie) e na página /apoie (h1). Duas colunas: texto | painel Pix.
 */
export default function Donate({ as = "section" }) {
  const Title = as === "page" ? "h1" : "h2";
  return (
    <section id="apoie" className={`${styles.root} ${as === "page" ? styles.page : ""}`}>
      <div className={styles.copy}>
        <span className={styles.kicker}>apoie</span>
        <Title className={styles.title}>
          Ajude esse dev a tomar um café <span aria-hidden="true">☕</span>
          <br />
          <span className={styles.muted}>enquanto você digita.</span>
        </Title>
        <p className={styles.lede}>
          O TypeRush é grátis, sem anúncio e sem cadastro — e é feito por uma pessoa só. Se ele te divertiu, um Pix de
          qualquer valor paga o café que mantém o próximo modo saindo.
        </p>
        <p className={styles.fine}>
          Doação voluntária. O Pix cai em nome de {PIX.holder} (CNPJ {PIX.keyDisplay}). Não libera nada no jogo — é só
          um obrigado.
        </p>
      </div>
      <DonatePanel />
    </section>
  );
}
