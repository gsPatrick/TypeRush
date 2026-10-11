import { toChars } from "@/lib/game/text";

/**
 * Motor do modo música — lógica pura.
 *
 * O relógio é a MÚSICA: `tick(songTime)` recebe a posição do áudio (em s)
 * e o motor decide qual linha está ativa. Cada linha tem uma janela
 * [t, end); o jogador digita a linha inteira (espaços inclusos) dentro dela.
 *
 * - Linha digitada perfeita antes do fim → "perfeita" na hora (+ bônus de
 *   velocidade pela fração da janela que sobrou).
 * - Fim da janela → nota parcial: caracteres corretos na posição ÷ total.
 * - Precisão por tecla, igual ao modo solo; composição de acento não conta.
 * - Sequência = linhas perfeitas seguidas.
 */
export function createMusicEngine(lines) {
  const s = {
    status: "idle", // idle | running | over
    lines,
    active: -1, // índice da linha ativa (-1 = nenhuma: intro/intervalo)
    input: "",
    evaluated: "",
    grades: [], // {completion, perfect, score} por linha
    correctKeys: 0,
    incorrectKeys: 0,
    correctChars: 0,
    streak: 0,
    bestStreak: 0,
    score: 0,
    perfects: 0,
    songTime: 0,
  };

  function lineAt(time) {
    for (let i = s.lines.length - 1; i >= 0; i--) {
      if (s.lines[i].t <= time) return time < s.lines[i].end ? i : -1;
    }
    return -1;
  }

  function grade(i, { perfect, time }) {
    if (i < 0 || s.grades[i]) return null;
    const line = s.lines[i];
    const target = toChars(line.text);
    const typed = toChars(s.input);
    let ok = 0;
    for (let k = 0; k < Math.min(target.length, typed.length); k++) if (typed[k] === target[k]) ok++;
    const completion = perfect ? 1 : ok / target.length;
    const left = perfect ? Math.max(0, (line.end - time) / (line.end - line.t)) : 0;
    const score = Math.round(completion * 100) + (perfect ? 50 + Math.round(left * 50) : 0);

    s.grades[i] = { completion, perfect, score };
    s.score += score;
    s.correctChars += perfect ? target.length : ok;
    if (perfect) {
      s.perfects++;
      s.streak++;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
    } else {
      s.streak = 0;
    }
    return { type: "line", index: i, ...s.grades[i], streak: s.streak };
  }

  /** Avança para a posição da música. Retorna eventos. */
  function tick(time) {
    const events = [];
    if (s.status === "over") return events;
    if (s.status === "idle") s.status = "running";
    s.songTime = time;

    const next = lineAt(time);
    // a linha ativa acabou sem ser completada → nota parcial
    if (next !== s.active && s.active >= 0 && !s.grades[s.active]) {
      const ev = grade(s.active, { perfect: false, time });
      if (ev) events.push(ev);
    }
    // linhas cuja janela passou inteira sem nunca ficarem ativas (seek, aba
    // em segundo plano, intervalo) contam como 0 — checado sempre, não só
    // quando a linha ativa muda
    for (let i = 0; i < s.lines.length && s.lines[i].end <= time; i++) {
      if (!s.grades[i]) {
        const typed = s.input;
        s.input = "";
        const ev = grade(i, { perfect: false, time });
        s.input = typed;
        if (ev) events.push(ev);
      }
    }
    if (next !== s.active) {
      s.active = next;
      s.input = "";
      s.evaluated = "";
      if (next >= 0) events.push({ type: "line-start", index: next });
    }

    const last = s.lines[s.lines.length - 1];
    if (!last || time >= last.end) {
      s.status = "over";
      events.push({ type: "end" });
    }
    return events;
  }

  function countKeys(value) {
    const prev = toChars(s.evaluated);
    const next = toChars(value);
    const target = toChars(s.lines[s.active].text);
    let common = 0;
    while (common < prev.length && common < next.length && prev[common] === next[common]) common++;
    for (let i = common; i < next.length; i++) {
      if (next[i] === target[i]) s.correctKeys++;
      else s.incorrectKeys++;
    }
    s.evaluated = value;
  }

  /** Novo valor do campo (a linha inteira, com espaços). */
  function input(rawValue, { composing = false } = {}) {
    const events = [];
    if (s.status !== "running" || s.active < 0 || s.grades[s.active]) return events;
    const value = rawValue.normalize("NFC").replace(/ /g, " ");
    s.input = value;
    if (composing) return events;
    countKeys(value);
    if (value === s.lines[s.active].text) {
      const ev = grade(s.active, { perfect: true, time: s.songTime });
      if (ev) events.push(ev);
    }
    return events;
  }

  function result() {
    const n = s.lines.length || 1;
    const completion = s.grades.reduce((a, g) => a + (g?.completion ?? 0), 0) / n;
    const keys = s.correctKeys + s.incorrectKeys;
    const first = s.lines[0]?.t ?? 0;
    const last = s.lines[s.lines.length - 1]?.end ?? 0;
    const minutes = Math.max((last - first) / 60, 0.1);
    return {
      score: s.score,
      completion: Math.round(completion * 1000) / 10,
      perfects: s.perfects,
      lines: s.lines.length,
      bestStreak: s.bestStreak,
      accuracy: keys ? Math.round((s.correctKeys / keys) * 1000) / 10 : 0,
      wpm: Math.round(s.correctChars / 5 / minutes),
      rank: rankFor(completion * 100, s.perfects / n),
    };
  }

  return { state: s, tick, input, result };
}

export function rankFor(completionPct, perfectRatio) {
  if (completionPct >= 95 && perfectRatio >= 0.8) return "S";
  if (completionPct >= 85) return "A";
  if (completionPct >= 70) return "B";
  if (completionPct >= 50) return "C";
  return "D";
}
