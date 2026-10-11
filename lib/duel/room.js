/** Códigos de sala, nome do jogador e a marca de "fui eu que criei". */

// sem 0/O/1/I/L: código lido em voz alta ou digitado no celular não confunde
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const NAME_KEY = "typerush:name";
const hostKey = (code) => `typerush:host:${code}`;

export function newRoomCode(length = 6) {
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function normalizeCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function markHost(code) {
  try {
    sessionStorage.setItem(hostKey(code), "1");
  } catch {
    /* sem storage: recarregar a página vira convidado */
  }
}

export function isHostOf(code) {
  try {
    return sessionStorage.getItem(hostKey(code)) === "1";
  } catch {
    return false;
  }
}

export function loadName() {
  try {
    return localStorage.getItem(NAME_KEY) || "";
  } catch {
    return "";
  }
}

export function saveName(name) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* ok */
  }
}

export function cleanName(value) {
  return value.replace(/\s+/g, " ").trim().slice(0, 18);
}
