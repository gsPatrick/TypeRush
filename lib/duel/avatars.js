/**
 * Avatares do duelo — 6 femininos e 6 masculinos, SVGs em public/avatars/
 * (gerados por scripts/generate-avatars.mjs; desenho Notionists, CC0).
 */
export const AVATARS = [
  { id: "f1", kind: "f" },
  { id: "f2", kind: "f" },
  { id: "f3", kind: "f" },
  { id: "f4", kind: "f" },
  { id: "f5", kind: "f" },
  { id: "f6", kind: "f" },
  { id: "m1", kind: "m" },
  { id: "m2", kind: "m" },
  { id: "m3", kind: "m" },
  { id: "m4", kind: "m" },
  { id: "m5", kind: "m" },
  { id: "m6", kind: "m" },
];

const IDS = new Set(AVATARS.map((a) => a.id));

/** O id chega pela rede: só aceita um dos 12 (nada de caminho arbitrário). */
export function safeAvatar(id) {
  return IDS.has(id) ? id : null;
}

export function avatarSrc(id) {
  const ok = safeAvatar(id);
  return ok ? `/avatars/${ok}.svg` : null;
}

export function randomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)].id;
}
