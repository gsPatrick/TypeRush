import styles from "./Flag.module.css";

/**
 * Bandeiras como SVG inline — emoji de bandeira não renderiza no Windows.
 * Geometria simplificada para leitura em 20×14px; proporção única para as
 * duas ficarem alinhadas lado a lado.
 */
function Brazil() {
  return (
    <>
      <rect width="20" height="14" fill="#009c3b" />
      <polygon points="10,1.6 18.2,7 10,12.4 1.8,7" fill="#ffdf00" />
      <circle cx="10" cy="7" r="3.3" fill="#002776" />
      <path d="M6.85 6.2 Q10 5.4 13.2 7.6" stroke="#fff" strokeWidth="0.6" fill="none" />
    </>
  );
}

function UnitedStates() {
  const stripes = Array.from({ length: 6 }, (_, i) => (
    <rect key={i} y={i * 2} width="20" height="1" fill="#fff" transform="translate(0 1)" />
  ));
  const stars = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      stars.push(<circle key={`${r}-${c}`} cx={1.2 + c * 2.1} cy={1.1 + r * 1.8} r="0.42" fill="#fff" />);
    }
  }
  return (
    <>
      <rect width="20" height="14" fill="#b22234" />
      {stripes}
      <rect width="9" height="7.5" fill="#3c3b6e" />
      {stars}
    </>
  );
}

const FLAGS = { pt: Brazil, en: UnitedStates };

export default function Flag({ code, className = "" }) {
  const Shape = FLAGS[code];
  if (!Shape) return null;
  return (
    <svg
      className={[styles.root, className].filter(Boolean).join(" ")}
      viewBox="0 0 20 14"
      aria-hidden="true"
      focusable="false"
    >
      <Shape />
    </svg>
  );
}
