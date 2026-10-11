import { avatarSrc } from "@/lib/duel/avatars";
import styles from "./Avatar.module.css";

/** Avatar do jogador; sem avatar válido, a inicial do nome num círculo. */
export default function Avatar({ id, name = "", size = 40, tone = "me", className = "" }) {
  const src = avatarSrc(id);
  return (
    <span
      className={`${styles.root} ${styles[tone]} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" width={size} height={size} /> : name?.[0]?.toUpperCase() || "?"}
    </span>
  );
}
