"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createMusicEngine } from "@/lib/music/engine";
import { buildLines, parseLrc } from "@/lib/music/lrc";
import { recordSong } from "@/lib/music/storage";
import * as sfx from "@/lib/audio/sfx";

/**
 * Modo música — liga o motor de linhas a um relógio de áudio.
 *
 * Relógio:
 * - com áudio (`hasAudio`): `getAudioTime()` = posição do vídeo em segundos,
 *   ou null com o vídeo pausado/carregando → a letra CONGELA no último
 *   instante (não pode trocar de relógio e saltar);
 * - sem áudio: relógio próprio que começa 3s antes da primeira linha
 *   (ninguém quer 20s de intro em silêncio).
 * Tempo da letra = tempo do áudio − `offset` (ajuste "letra adiantada/atrasada").
 *
 * Performance: rAF chama tick(); React só re-renderiza quando a linha muda,
 * o jogador digita, ou para o relógio da janela (escrito via ref).
 */
export default function useMusicGame({ track, offset = 0, hasAudio = false, getAudioTime }) {
  const lines = useMemo(() => buildLines(parseLrc(track.synced)), [track.synced]);
  const engineRef = useRef(null);
  const [, bump] = useReducer((x) => x + 1, 0);
  const [status, setStatus] = useState("idle"); // idle | playing | over
  const [juice, setJuice] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const audioRef = useRef(getAudioTime);
  audioRef.current = getAudioTime;
  const silentStart = useRef(0);
  const lastAudio = useRef(0);
  const hasAudioRef = useRef(hasAudio);
  hasAudioRef.current = hasAudio;
  const listeners = useRef(new Set());
  const juiceId = useRef(0);

  const lyricTime = useCallback(() => {
    if (hasAudioRef.current) {
      const audio = audioRef.current?.();
      if (typeof audio === "number") lastAudio.current = audio;
      return lastAudio.current - offsetRef.current;
    }
    return (performance.now() - silentStart.current) / 1000;
  }, []);

  const finish = useCallback(() => {
    const result = engineRef.current.result();
    const saved = recordSong(track.id, result);
    setOutcome({ result, ...saved });
    setStatus("over");
    sfx.playEnd(saved.isRecord);
  }, [track.id]);

  const handle = useCallback(
    (events) => {
      let changed = false;
      for (const ev of events) {
        if (ev.type === "line-start") changed = true;
        if (ev.type === "line") {
          changed = true;
          if (ev.perfect) {
            if (ev.streak > 0 && ev.streak % 5 === 0) sfx.playCombo();
            else sfx.playCorrect(ev.streak);
          }
          setJuice({ id: ++juiceId.current, index: ev.index, perfect: ev.perfect, completion: ev.completion });
        }
        if (ev.type === "end") {
          finish();
          return;
        }
      }
      if (changed) bump();
    },
    [finish]
  );

  const start = useCallback(() => {
    engineRef.current = createMusicEngine(lines);
    const first = lines[0]?.t ?? 0;
    silentStart.current = performance.now() - Math.max(0, first - 3) * 1000;
    lastAudio.current = 0;
    setOutcome(null);
    setJuice(null);
    setStatus("playing");
    sfx.setSfxVolume(0.45);
  }, [lines]);

  useEffect(() => () => sfx.setSfxVolume(0.9), []);

  // loop: posição da música → motor
  useEffect(() => {
    if (status !== "playing") return undefined;
    let raf = 0;
    const frame = () => {
      const t = lyricTime();
      handle(engineRef.current.tick(t));
      listeners.current.forEach((fn) => fn(t));
      if (engineRef.current.state.status !== "over") raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [status, lyricTime, handle]);

  const onInput = useCallback(
    (value, composing) => {
      const e = engineRef.current;
      if (!e) return;
      const events = e.input(value, { composing });
      if (events.length) handle(events);
      bump();
    },
    [handle]
  );

  const subscribeTime = useCallback((fn) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  const e = engineRef.current;
  const s = e?.state;
  return {
    lines,
    status,
    start,
    stop: () => setStatus("idle"),
    active: s?.active ?? -1,
    input: s?.input ?? "",
    grades: s?.grades ?? [],
    score: s?.score ?? 0,
    streak: s?.streak ?? 0,
    perfects: s?.perfects ?? 0,
    juice,
    outcome,
    onInput,
    subscribeTime,
    lyricTime,
  };
}
