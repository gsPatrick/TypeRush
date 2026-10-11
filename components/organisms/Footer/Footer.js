import Kbd from "@/components/atoms/Kbd/Kbd";
import { GAME_CONFIG } from "@/lib/game/config";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./Footer.module.css";

export default function Footer({ running }) {
  const { t } = useLocale();
  const c = GAME_CONFIG;
  return (
    <footer className={`${styles.root} ${running ? styles.dim : ""}`}>
      <div className={styles.keys}>
        <span><Kbd>tab</Kbd> {t.restart}</span>
        <span><Kbd>esc</Kbd> {t.restart}</span>
        <span><Kbd>{t.keySpace}</Kbd> {t.submit}</span>
        <span><Kbd>⌫</Kbd> {t.retryRule} <b className={styles.gain}>{t.retryBonus}</b></span>
      </div>
      <p className={styles.rules}>
        {c.startMs / 1000}{t.rulesStart} · <b className={styles.gain}>+{c.correctBonusMs / 1000}s</b> {t.rulesGain} ·{" "}
        <b className={styles.loss}>−{c.wrongPenaltyMs / 1000}s</b> {t.rulesLoss} · {t.rulesCap} {c.maxMs / 1000}s
      </p>
    </footer>
  );
}
