import { DUEL_MODES } from "./modes";

/**
 * Juiz do duelo — lógica pura, testável sem rede.
 *
 * Cada jogador reporta eventos com o tempo medido no PRÓPRIO relógio desde o
 * "vai!" (`ms`). Como os dois começaram juntos, esses tempos são comparáveis
 * — e a decisão não depende de qual mensagem chegou antes pela rede.
 *
 *   over: o relógio do jogador zerou (ou o tempo fixo acabou, no modo livre)
 *   goal: o jogador bateu a meta (modo overdrive)
 *
 * decide() retorna { winner: "host" | "guest" | null (empate), reason }.
 */

export const DECISION_WINDOW_MS = 600; // espera o "caíram quase juntos"
export const SCORE_TIMEOUT_MS = 4000; // modo livre: espera o fim do outro

const other = (role) => (role === "host" ? "guest" : "host");

export function createReferee(modeId) {
  const mode = DUEL_MODES[modeId];
  const events = { host: {}, guest: {} };
  let decided = false;

  return {
    mode,
    get decided() {
      return decided;
    },
    /** Registra; retorna o tempo (ms) até a decisão ou null se nada a agendar. */
    record(role, type, ms, summary) {
      if (decided || events[role][type]) return null;
      events[role][type] = { ms, summary };
      if (mode.win === "score") {
        return events.host.over && events.guest.over ? 0 : SCORE_TIMEOUT_MS;
      }
      return DECISION_WINDOW_MS;
    },
    summaryOf(role) {
      return events[role].over?.summary ?? events[role].goal?.summary ?? null;
    },
    decide() {
      if (decided) return null;
      decided = true;
      const h = events.host;
      const g = events.guest;

      if (mode.win === "score") {
        const sh = h.over?.summary;
        const sg = g.over?.summary;
        if (!sh || !sg) return { winner: sh ? "host" : sg ? "guest" : null, reason: "score" };
        const cmp = sh.words - sg.words || sh.accuracy - sg.accuracy || sh.wpm - sg.wpm;
        return { winner: cmp > 0 ? "host" : cmp < 0 ? "guest" : null, reason: "score" };
      }

      if (mode.win === "overdrive") {
        if (h.goal || g.goal) {
          if (h.goal && g.goal) {
            const d = h.goal.ms - g.goal.ms;
            return { winner: d < 0 ? "host" : d > 0 ? "guest" : null, reason: "goal" };
          }
          // bater a meta só vale se não caiu antes disso
          const role = h.goal ? "host" : "guest";
          const fell = events[role].over;
          if (!fell || fell.ms > events[role].goal.ms) return { winner: role, reason: "goal" };
        }
      }

      // sobrevivência: quem caiu primeiro perde
      if (h.over && g.over) {
        const d = h.over.ms - g.over.ms;
        return { winner: d > 0 ? "host" : d < 0 ? "guest" : null, reason: "survive" };
      }
      if (h.over) return { winner: "guest", reason: "survive" };
      if (g.over) return { winner: "host", reason: "survive" };
      return { winner: null, reason: "survive" };
    },
  };
}

export function forfeitResult(stayingRole) {
  return { winner: stayingRole, reason: "forfeit", loser: other(stayingRole) };
}
