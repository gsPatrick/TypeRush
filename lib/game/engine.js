import { GAME_CONFIG } from "./config";
import { WORDS_PT_BR } from "./words";
import { generateWords } from "./generateWords";
import { remainingMs, shiftDeadline } from "./clock";
import { accuracy, peakWpm, wpm, wpmSeries } from "./scoring";
import { isWordCorrect, normalize, toChars } from "./text";

/**
 * Motor do TypeRush — lógica pura, sem React e sem DOM.
 *
 * Regras de contagem (decididas aqui, em um lugar só):
 * - Uma palavra só é julgada no ENVIO (espaço ou Enter). Enquanto o jogador
 *   digita, nada é penalizado — só o feedback visual muda.
 * - Cada índice de palavra é enviado exatamente uma vez: o envio avança
 *   `index` antes de retornar, então um segundo evento para o mesmo envio
 *   cai em uma palavra nova com input vazio, que é ignorado.
 * - Envio vazio (espaço duplo, espaço no início) não conta como erro.
 * - Precisão é por tecla: cada caractere novo que entra no input é comparado
 *   com a letra esperada naquela posição. Texto em composição (acento morto,
 *   IME) não é contado até a composição terminar.
 * - Nova tentativa: logo após errar, Backspace no campo vazio volta para a
 *   palavra errada com o texto enviado restaurado. Acerto vale +0,5s (em vez
 *   de +1s); errar de novo custa −2s outra vez. Uma retry por palavra, e só
 *   para a palavra imediatamente anterior.
 * - Overdrive: relógio acima do limite (35s) abre uma sessão; ela fecha
 *   quando o relógio fica no limite ou abaixo por mais de `graceMs`. A duração conta até o momento
 *   em que caiu (não inclui a tolerância).
 * - Toda entrada verifica o prazo primeiro: se o tempo acabou entre dois
 *   frames, a tecla não é processada e a partida termina no prazo exato.
 *
 * Todos os métodos recebem `at` (performance.now()) para serem testáveis.
 */

const WHITESPACE = /[\s ]/;

export function createEngine({ combo = true, pool = WORDS_PT_BR, config = GAME_CONFIG, rng = Math.random } = {}) {
  const s = {
    status: "idle", // idle | running | over
    words: generateWords(config.wordBatch, [], pool, 6, rng),
    typed: [], // valor enviado por índice
    verdicts: [], // true/false por índice enviado
    retried: [], // true quando a palavra já usou a nova tentativa
    index: 0,
    input: "",
    evaluated: "", // último input já contabilizado (fora de composição)
    composing: false,

    startAt: 0,
    deadline: 0,
    endAt: 0,

    correctWords: 0,
    errors: 0,
    correctChars: 0,
    correctKeys: 0,
    incorrectKeys: 0,
    streak: 0,
    bestStreak: 0,
    combos: 0,
    retries: 0,
    retrySaves: 0,

    od: { active: false, since: 0, belowSince: null },
    odCount: 0,
    odTotalMs: 0,
    odBestMs: 0,

    samples: [], // chars corretos acumulados ao fim de cada segundo
    remainingSamples: [], // ms restantes ao fim de cada segundo
    errorMarks: [], // segundo (0-based) de cada erro
  };

  const idleRemaining = config.startMs;

  // ── tempo ────────────────────────────────────────────────

  function remaining(at) {
    if (s.status === "idle") return idleRemaining;
    if (s.status === "over") return 0;
    return remainingMs(s.deadline, at);
  }

  function start(at) {
    s.status = "running";
    s.startAt = at;
    s.deadline = at + config.startMs;
  }

  // ── overdrive ────────────────────────────────────────────

  function closeOverdrive(endAt) {
    const durationMs = Math.max(0, endAt - s.od.since);
    const best = durationMs > s.odBestMs;
    s.od = { active: false, since: 0, belowSince: null };
    s.odCount++;
    s.odTotalMs += durationMs;
    s.odBestMs = Math.max(s.odBestMs, durationMs);
    return { durationMs, best };
  }

  /** Abre/fecha a sessão de overdrive conforme o relógio. Retorna eventos. */
  function updateOverdrive(at) {
    const events = [];
    if (s.status !== "running") return events;
    const { thresholdMs, graceMs, minBlastMs } = config.overdrive;
    const above = remainingMs(s.deadline, at) > thresholdMs;

    if (!s.od.active) {
      if (above) {
        s.od = { active: true, since: at, belowSince: null };
        events.push({ type: "overdrive-start" });
      }
      return events;
    }

    if (above) {
      s.od.belowSince = null;
    } else {
      if (s.od.belowSince === null) s.od.belowSince = at;
      if (at - s.od.belowSince >= graceMs) {
        const { durationMs, best } = closeOverdrive(s.od.belowSince);
        events.push({ type: "overdrive-end", durationMs, best, blast: durationMs >= minBlastMs });
      }
    }
    return events;
  }

  function overdrive(at) {
    if (!s.od.active) return { active: false, elapsedMs: 0, grace: false };
    const until = s.od.belowSince ?? at;
    return { active: true, elapsedMs: until - s.od.since, grace: s.od.belowSince !== null };
  }

  function finish(at) {
    if (s.status !== "running") return false;
    // sessão aberta no fim fecha em silêncio (sem explosão sobre o game over)
    if (s.od.active) closeOverdrive(s.od.belowSince ?? Math.min(at, s.deadline));
    s.status = "over";
    s.endAt = Math.min(at, s.deadline);
    sample(s.endAt);
    return true;
  }

  /** Avança amostras por segundo e encerra se o prazo passou. */
  function tick(at) {
    if (s.status !== "running") return { ended: false, events: [] };
    if (at >= s.deadline) return { ended: finish(at), events: [] };
    sample(at);
    return { ended: false, events: updateOverdrive(at) };
  }

  function sample(at) {
    const fullSeconds = Math.floor((at - s.startAt) / 1000);
    while (s.samples.length < fullSeconds) {
      s.samples.push(s.correctChars);
      s.remainingSamples.push(remainingMs(s.deadline, s.startAt + s.samples.length * 1000));
    }
  }

  // ── entrada ──────────────────────────────────────────────

  /** Conta teclas novas comparando com o último valor avaliado. */
  function countKeys(value) {
    const prev = toChars(s.evaluated);
    const next = toChars(value);
    const target = toChars(s.words[s.index]);

    let common = 0;
    while (common < prev.length && common < next.length && prev[common] === next[common]) {
      common++;
    }
    for (let i = common; i < next.length; i++) {
      if (next[i] === target[i]) s.correctKeys++;
      else s.incorrectKeys++;
    }
    s.evaluated = value;
  }

  /**
   * Novo valor do campo. `composing` = composição de acento/IME em curso.
   * Retorna a lista de eventos gerados ({type: "submit" | "end", ...}).
   */
  function input(rawValue, { composing = false, at }) {
    const events = [];
    if (s.status === "over") return events;
    if (s.status === "running" && at >= s.deadline) {
      if (finish(at)) events.push({ type: "end" });
      return events;
    }

    let value = rawValue;

    // Espaço digitado: o que vem antes dele é o envio.
    const ws = value.search(WHITESPACE);
    if (ws !== -1 && !composing) {
      const head = value.slice(0, ws);
      const rest = value.slice(ws + 1).replace(/^[\s ]+/, "");

      if (head.length === 0) {
        // espaço sem palavra: descarta, não penaliza
        value = rest;
      } else {
        if (s.status === "idle") start(at);
        countKeys(head);
        s.input = head;
        events.push(...submit(at));
        if (s.status === "over") return events;
        value = rest;
      }
      // sobra após o espaço (digitação muito rápida no celular)
      if (value.length > 0) events.push(...input(value, { composing, at }));
      return events;
    }

    if (value.length > 0 && s.status === "idle") start(at);

    s.input = value;
    s.composing = composing;
    if (!composing) countKeys(value);
    return events;
  }

  function submit(at) {
    const events = [];
    if (s.status !== "running") return events;
    if (at >= s.deadline) {
      if (finish(at)) events.push({ type: "end" });
      return events;
    }

    const typed = normalize(s.input);
    if (typed.length === 0) return events;

    const submitted = s.index;
    const target = s.words[submitted];
    const correct = isWordCorrect(target, typed);
    const isRetry = s.retried[submitted] === true;
    const second = Math.floor((at - s.startAt) / 1000);

    s.typed[s.index] = typed;
    s.verdicts[s.index] = correct;
    s.index += 1;
    s.input = "";
    s.evaluated = "";
    s.composing = false;

    let delta;
    let comboHit = false;

    if (correct) {
      s.correctWords++;
      s.correctChars += toChars(target).length + 1; // + espaço
      s.streak++;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
      delta = isRetry ? config.retryBonusMs : config.correctBonusMs;
      if (isRetry) s.retrySaves++;
      if (combo && s.streak % config.combo.every === 0) {
        delta += config.combo.bonusMs;
        s.combos++;
        comboHit = true;
      }
    } else {
      s.errors++;
      s.streak = 0;
      s.errorMarks.push(second);
      delta = -config.wrongPenaltyMs;
    }

    const before = remainingMs(s.deadline, at);
    s.deadline = shiftDeadline(s.deadline, delta, at, config.maxMs);
    const applied = remainingMs(s.deadline, at) - before;

    events.push({
      type: "submit",
      index: submitted,
      correct,
      retry: isRetry,
      streak: s.streak,
      deltaMs: applied,
      combo: comboHit,
    });

    events.push(...updateOverdrive(at));

    if (s.deadline <= at) {
      // a penalidade zerou o relógio agora — a partida acaba neste instante
      s.deadline = at;
      finish(at);
      events.push({ type: "end" });
    }

    if (s.words.length - s.index < config.wordLookahead) {
      s.words = s.words.concat(generateWords(config.wordBatch, s.words, pool, 6, rng));
    }
    return events;
  }

  /** A palavra anterior pode ser refeita agora? */
  function canRetry() {
    const prev = s.index - 1;
    return (
      s.status === "running" &&
      prev >= 0 &&
      s.input.length === 0 &&
      s.verdicts[prev] === false &&
      !s.retried[prev]
    );
  }

  /** Volta para a palavra recém-errada (o −2s já foi pago no erro). */
  function retry(at) {
    const events = [];
    if (s.status === "running" && at >= s.deadline) {
      if (finish(at)) events.push({ type: "end" });
      return events;
    }
    if (!canRetry()) return events;

    const prev = s.index - 1;
    s.index = prev;
    s.retried[prev] = true;
    s.retries++;
    // texto enviado volta ao campo; já foi contabilizado, não conta de novo
    s.input = s.typed[prev];
    s.evaluated = s.typed[prev];
    s.composing = false;
    delete s.verdicts[prev];
    delete s.typed[prev];

    events.push({ type: "retry", index: prev });
    return events;
  }

  // ── leitura ──────────────────────────────────────────────

  function liveWpm(at) {
    if (s.status !== "running") return 0;
    // piso de 3s: sem ele a primeira palavra mostra 200+ wpm
    return Math.round(wpm(s.correctChars, Math.max(at - s.startAt, 3000)));
  }

  function result() {
    const survivedMs = s.endAt - s.startAt;
    const avg = wpm(s.correctChars, survivedMs);
    return {
      wpm: Math.round(avg),
      peakWpm: Math.round(Math.max(peakWpm(s.samples), avg)),
      accuracy: Math.round(accuracy(s.correctKeys, s.incorrectKeys) * 10) / 10,
      correctWords: s.correctWords,
      errors: s.errors,
      survivedMs,
      bestStreak: s.bestStreak,
      combos: s.combos,
      retries: s.retries,
      retrySaves: s.retrySaves,
      overdrive: { count: s.odCount, totalMs: s.odTotalMs, bestMs: s.odBestMs },
      keys: { correct: s.correctKeys, incorrect: s.incorrectKeys },
      series: wpmSeries(s.samples),
      remainingSeries: s.remainingSamples.slice(),
      errorMarks: s.errorMarks.slice(),
    };
  }

  return { state: s, remaining, overdrive, start, tick, input, submit, retry, canRetry, finish, liveWpm, result };
}
