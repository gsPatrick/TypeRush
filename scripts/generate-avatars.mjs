/**
 * Gera os 12 avatares do duelo em public/avatars/*.svg.
 *
 * Estilo "Notionists" da DiceBear — desenho de Zoish, licença CC0 1.0
 * (domínio público): uso livre, inclusive comercial, sem atribuição.
 * Os SVGs são gerados UMA vez e versionados: o site não carrega a lib.
 *
 *   node scripts/generate-avatars.mjs
 *
 * Para trocar um avatar: mude o cabelo/barba/óculos na lista e rode de novo.
 * (Folha com as 64 variantes de cabelo: gere com hair = variant01..variant64.)
 */
import { createAvatar } from "@dicebear/core";
import { notionists } from "@dicebear/collection";
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "avatars");

// id · grupo · cabelo · barba · óculos · fundo · semente (varia rosto/expressão)
export const AVATARS = [
  { id: "f1", kind: "f", hair: "variant10", bg: "cef79e", seed: "ana" },
  { id: "f2", kind: "f", hair: "variant28", bg: "ffb3d1", seed: "bia", glasses: "variant02" },
  { id: "f3", kind: "f", hair: "variant39", bg: "a9b4ff", seed: "carol" },
  { id: "f4", kind: "f", hair: "variant48", bg: "ffc8a8", seed: "duda" },
  { id: "f5", kind: "f", hair: "variant59", bg: "a8f0d8", seed: "eva" },
  { id: "f6", kind: "f", hair: "variant62", bg: "d4b8ff", seed: "fe" },
  { id: "m1", kind: "m", hair: "variant01", bg: "a8dcff", seed: "beto", beard: "variant03" },
  { id: "m2", kind: "m", hair: "variant20", bg: "ffe08a", seed: "caio" },
  { id: "m3", kind: "m", hair: "variant38", bg: "9fe0e0", seed: "davi", glasses: "variant05" },
  { id: "m4", kind: "m", hair: "variant40", bg: "ff9e8a", seed: "enzo", beard: "variant08" },
  { id: "m5", kind: "m", hair: "variant50", bg: "f2e2b8", seed: "gui" },
  { id: "m6", kind: "m", hair: "variant60", bg: "e9ece6", seed: "hugo", beard: "variant11" },
];

fs.mkdirSync(OUT, { recursive: true });
for (const a of AVATARS) {
  const svg = createAvatar(notionists, {
    seed: a.seed,
    hair: [a.hair],
    beard: a.beard ? [a.beard] : undefined,
    beardProbability: a.beard ? 100 : 0,
    glasses: a.glasses ? [a.glasses] : undefined,
    glassesProbability: a.glasses ? 100 : 0,
    gestureProbability: 0,
    bodyIconProbability: 0,
    backgroundColor: [a.bg],
    radius: 50,
  }).toString();
  fs.writeFileSync(path.join(OUT, `${a.id}.svg`), svg);
}
console.log(`ok: ${AVATARS.length} avatares em ${path.relative(process.cwd(), OUT)}/`);
