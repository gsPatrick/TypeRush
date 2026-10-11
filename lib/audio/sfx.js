/**
 * Efeitos sonoros sintetizados (Web Audio) — zero arquivos, zero latência
 * de rede.
 *
 * Desenho do som:
 * - Acerto: "pluck" curto. O tom sobe na escala pentatônica a cada palavra
 *   da sequência — 10 acertos seguidos sobem uma escala inteira até o combo.
 *   É isso que dá a sensação de progresso (e a dopamina).
 * - Combo: arpejo maior rápido com brilho.
 * - Erro: duas notas meio-tom de distância (dissonância) descendo juntas +
 *   estalo de impacto. Corpo em 200–900Hz: alto-falante de notebook não
 *   reproduz quase nada abaixo de ~150Hz, então um erro só no grave some.
 * - Retry: rebobinar (varredura descendente curta).
 * - Tique: nos últimos 5s, um clique seco por segundo.
 * - Fim: queda de tom; recorde: fanfarra curta.
 * - Overdrive (entrada): arpejo subindo duas oitavas sobre um "riser" de
 *   ruído — o power-up. Durante o modo, cada acerto ganha uma oitava de
 *   brilho por cima (recompensa contínua sem som de fundo cansativo).
 * - Overdrive (saída com explosão): estrondo grave + chuva de notas agudas
 *   descendo + acorde final. Saída curta: só um "fizzle".
 *
 * Desbloqueio: navegadores só deixam o áudio tocar depois de um gesto.
 * `installAudioUnlock` escuta TODA tecla/toque e garante o contexto
 * "running" — não só no primeiro som. Sem isso o som morre de vez quando o
 * contexto é suspenso/interrompido (troca de aba, fone Bluetooth conectado,
 * Mac dormiu; o Safari usa o estado "interrupted") ou fechado.
 */

// Pentatônica maior de C5 a A6 — qualquer sequência soa "certa"
const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

let ctx = null;
let master = null;
let enabled = true;

function audio() {
  if (!enabled || typeof window === "undefined") return null;
  if (ctx && ctx.state === "closed") ctx = null; // contexto morto: recria
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume;
    // compressor suaviza picos quando sons se sobrepõem (digitação rápida)
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    master.connect(comp).connect(ctx.destination);
  }
  // "suspended" (sem gesto / aba em segundo plano) ou "interrupted" (Safari)
  if (ctx.state !== "running") ctx.resume().catch(() => {});
  return ctx;
}

/**
 * Liga o desbloqueio em todo gesto. Retorna a função de limpeza.
 * Captura + passivo: roda antes de qualquer handler e nunca bloqueia a tecla.
 */
export function installAudioUnlock() {
  if (typeof window === "undefined") return () => {};
  const unlock = () => {
    if (enabled) audio();
  };
  const opts = { capture: true, passive: true };
  window.addEventListener("keydown", unlock, opts);
  window.addEventListener("pointerdown", unlock, opts);
  window.addEventListener("touchstart", unlock, opts);
  return () => {
    window.removeEventListener("keydown", unlock, opts);
    window.removeEventListener("pointerdown", unlock, opts);
    window.removeEventListener("touchstart", unlock, opts);
  };
}

export function setSoundEnabled(value) {
  enabled = value;
}

let volume = 0.9;
/** Volume geral dos efeitos (0..1). O modo música baixa: a música é a estrela. */
export function setSfxVolume(v) {
  volume = v;
  if (master) master.gain.value = v;
}

/** Oscilador com envelope ataque/decaimento exponencial. */
function tone({ freq, type = "sine", start = 0, attack = 0.004, decay = 0.14, gain = 0.1, slideTo, filter }) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + 0.01 + start;

  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + attack + decay);

  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);

  let node = osc;
  if (filter) {
    const f = ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = filter;
    node = node.connect(f);
  }
  node.connect(env).connect(master);
  osc.start(t0);
  osc.stop(t0 + attack + decay + 0.02);
}

export function playCorrect(streak = 1, overdrive = false) {
  const freq = PENTATONIC[(Math.max(streak, 1) - 1) % PENTATONIC.length];
  tone({ freq, type: "triangle", decay: 0.16, gain: 0.09 });
  tone({ freq: freq * 2, type: "sine", decay: 0.08, gain: 0.025 }); // brilho
  if (overdrive) {
    // camada de overdrive: oitava acima levemente desafinada (chorus)
    tone({ freq: freq * 4, type: "sine", start: 0.015, decay: 0.12, gain: 0.018 });
    tone({ freq: freq * 2 * 1.006, type: "triangle", start: 0.01, decay: 0.14, gain: 0.03 });
  }
}

export function playRetrySave() {
  tone({ freq: 659.25, type: "triangle", decay: 0.1, gain: 0.07 });
  tone({ freq: 783.99, type: "triangle", start: 0.06, decay: 0.14, gain: 0.07 });
}

export function playCombo() {
  [1046.5, 1318.51, 1567.98, 2093].forEach((freq, i) => {
    tone({ freq, type: "triangle", start: i * 0.045, decay: 0.22, gain: 0.07 });
  });
  tone({ freq: 4186, type: "sine", start: 0.12, decay: 0.3, gain: 0.012 });
}

/** Rajada curta de ruído filtrado — o "impacto" no início do erro. */
function thump({ gain = 0.12, freq = 900, decay = 0.05, start = 0, type = "bandpass", sweepTo } = {}) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + 0.01 + start;
  const len = Math.ceil(ac.sampleRate * (decay + 0.02));
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  const src = ac.createBufferSource();
  src.buffer = buffer;
  const band = ac.createBiquadFilter();
  band.type = type;
  band.frequency.setValueAtTime(freq, t0);
  if (sweepTo) band.frequency.exponentialRampToValueAtTime(sweepTo, t0 + decay);
  band.Q.value = 1.2;
  const env = ac.createGain();
  env.gain.setValueAtTime(gain, t0);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
  src.connect(band).connect(env).connect(master);
  src.start(t0);
}

export function playWrong() {
  // dissonância: Si♭3 + Lá3 descendo juntos (o "bzzt" de errado)
  tone({ freq: 233.08, type: "sawtooth", decay: 0.22, gain: 0.06, slideTo: 155, filter: 1600 });
  tone({ freq: 220, type: "square", decay: 0.22, gain: 0.04, slideTo: 146, filter: 1200 });
  thump();
  // grave por baixo — só aparece em fone/caixa, dá peso
  tone({ freq: 98, type: "sine", decay: 0.2, gain: 0.07, slideTo: 60 });
}

export function playRetry() {
  tone({ freq: 880, type: "sine", decay: 0.12, gain: 0.05, slideTo: 440 });
}

export function playTick(level = 2) {
  tone({ freq: level >= 3 ? 1400 : 1100, type: "square", attack: 0.001, decay: 0.03, gain: 0.025, filter: 3000 });
}

export function playEnd(isRecord) {
  if (isRecord) {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      tone({ freq, type: "triangle", start: i * 0.09, decay: 0.32, gain: 0.08 });
    });
    return;
  }
  tone({ freq: 392, type: "triangle", decay: 0.5, gain: 0.07, slideTo: 196 });
}

export function playOverdriveStart() {
  // riser: ruído varrendo de 500Hz a 6kHz
  thump({ gain: 0.05, freq: 500, sweepTo: 6000, decay: 0.32 });
  // arpejo C maior subindo duas oitavas
  [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093].forEach((freq, i) => {
    tone({ freq, type: "triangle", start: 0.04 + i * 0.038, decay: 0.2, gain: 0.065 });
  });
  // pouso: acorde aberto com brilho
  tone({ freq: 1046.5, type: "sine", start: 0.32, decay: 0.6, gain: 0.05 });
  tone({ freq: 1567.98, type: "sine", start: 0.32, decay: 0.6, gain: 0.035 });
  tone({ freq: 4186, type: "sine", start: 0.34, decay: 0.45, gain: 0.012 });
}

export function playOverdriveEnd(blast) {
  if (!blast) {
    tone({ freq: 880, type: "sine", decay: 0.18, gain: 0.04, slideTo: 330 });
    return;
  }
  // estrondo: grave caindo + ruído abrindo
  tone({ freq: 140, type: "sine", decay: 0.5, gain: 0.14, slideTo: 38 });
  tone({ freq: 280, type: "triangle", decay: 0.25, gain: 0.05, slideTo: 90 });
  thump({ gain: 0.16, freq: 2400, sweepTo: 300, decay: 0.45, type: "lowpass" });
  // chuva de faíscas: notas agudas descendo da pentatônica
  [...PENTATONIC].reverse().forEach((freq, i) => {
    tone({ freq: freq * 2, type: "sine", start: 0.06 + i * 0.045, decay: 0.12, gain: 0.022 });
  });
  // acorde de fechamento
  [523.25, 659.25, 783.99].forEach((freq) => {
    tone({ freq, type: "triangle", start: 0.5, decay: 0.7, gain: 0.04 });
  });
}
