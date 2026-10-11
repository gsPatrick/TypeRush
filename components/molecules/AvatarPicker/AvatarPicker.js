import { AVATARS, avatarSrc } from "@/lib/duel/avatars";
import styles from "./AvatarPicker.module.css";

/** Escolha entre os 12 avatares (6 femininos · 6 masculinos). */
export default function AvatarPicker({ value, onChange, label }) {
  return (
    <div className={styles.root} role="radiogroup" aria-label={label}>
      {AVATARS.map((a) => {
        const on = a.id === value;
        return (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${label} ${a.id}`}
            className={`${styles.opt} ${on ? styles.on : ""}`}
            onClick={() => onChange(a.id)}
          >
            <img src={avatarSrc(a.id)} alt="" width={56} height={56} />
          </button>
        );
      })}
    </div>
  );
}
