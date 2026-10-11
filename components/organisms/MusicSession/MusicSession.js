"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/atoms/Button/Button";
import Kbd from "@/components/atoms/Kbd/Kbd";
import SpotifyButton from "@/components/atoms/SpotifyButton/SpotifyButton";
import YouTubeSearchButton from "@/components/atoms/YouTubeSearchButton/YouTubeSearchButton";
import YouTubePlayer from "@/components/molecules/YouTubePlayer/YouTubePlayer";
import LyricStage from "@/components/organisms/LyricStage/LyricStage";
import MusicResults from "@/components/organisms/MusicResults/MusicResults";
import useMusicGame from "@/hooks/useMusicGame";
import { formatDuration } from "@/lib/music/lrc";
import {
  getMusicMode,
  getOffset,
  getRelaxed,
  pushRecent,
  setMusicMode,
  setOffset as saveOffset,
  setRelaxed as saveRelaxed,
} from "@/lib/music/storage";
import { parseYouTubeId } from "@/lib/music/youtube";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./MusicSession.module.css";

/**
 * Sessão de uma música: carrega letra + mídia → preparo → jogo → resultado.
 * O player do YouTube fica montado do preparo ao resultado (remontar
 * recarregaria o vídeo); só o layout ao redor muda.
 */
export default function MusicSession({ pick, onBack }) {
  const { t } = useLocale();
  const m = t.music;
  const [track, setTrack] = useState(null);
  const [media, setMedia] = useState(null);
  const [error, setError] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [quality, setQuality] = useState(null);
  const [silent, setSilent] = useState(false);
  const [offset, setOffsetState] = useState(0);
  const [phase, setPhase] = useState("loading"); // loading | ready | playing | results
  const [audioHint, setAudioHint] = useState(null);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState(false);
  const [changingVideo, setChangingVideo] = useState(false);
  const [mode, setMode] = useState("normal");
  const [relaxed, setRelaxed] = useState(false);
  const playerRef = useRef(null);

  // letra + mídia em paralelo
  useEffect(() => {
    let alive = true;
    setMode(getMusicMode());
    setRelaxed(getRelaxed());
    const q = new URLSearchParams({ artist: pick.artist, track: pick.track, duration: String(pick.duration), album: pick.album || "" });
    Promise.all([
      fetch(`/api/music/track?id=${pick.id}`).then(async (r) => (r.ok ? r.json() : Promise.reject(await r.json()))),
      fetch(`/api/music/media?${q}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([tr, md]) => {
        if (!alive) return;
        setTrack(tr);
        setMedia(md);
        if (md?.video) {
          setVideoId(md.video.id);
          setQuality(md.video.quality);
        }
        setPhase("ready");
      })
      .catch((e) => alive && setError(e?.error === "busy" ? m.busy : m.failed));
    return () => {
      alive = false;
    };
  }, [pick, m]);

  const hasAudio = !!videoId && !silent;

  // o atraso é do par letra + vídeo: trocou o vídeo, carrega o dele
  useEffect(() => {
    setOffsetState(getOffset(pick.id, hasAudio ? videoId : null));
  }, [pick.id, videoId, hasAudio]);

  const persistOffset = useCallback(
    (v) => {
      setOffsetState(v);
      saveOffset(pick.id, hasAudio ? videoId : null, v);
    },
    [pick.id, videoId, hasAudio]
  );
  const game = useMusicGame({
    track: track ?? { id: pick.id, synced: "" },
    offset,
    hasAudio,
    getAudioTime: () => playerRef.current?.time() ?? null,
    mode,
    relaxed,
    onOffsetChange: persistOffset,
  });

  const start = useCallback(() => {
    if (!track) return;
    pushRecent({ ...pick, cover: pick.cover ?? media?.cover ?? null });
    setAudioHint(null);
    if (hasAudio) {
      playerRef.current?.restart();
      // autoplay pode ser bloqueado: avisa se o vídeo não começar
      setTimeout(() => {
        if (playerRef.current && playerRef.current.time() === null) setAudioHint(m.audioBlocked);
      }, 3000);
    }
    game.start();
    setPhase("playing");
  }, [track, pick, media, hasAudio, game, m]);

  // fim do jogo → resultado (a música segue tocando o final; se falhou, para)
  useEffect(() => {
    if (game.status === "over" && phase === "playing") {
      if (game.outcome?.result.failed) playerRef.current?.pause();
      setPhase("results");
    }
  }, [game.status, game.outcome, phase]);

  // Enter começa; Esc sai do jogo
  useEffect(() => {
    const onKey = (e) => {
      if (phase === "ready" && e.key === "Enter" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        start();
      }
      if (phase === "playing" && e.key === "Escape") {
        playerRef.current?.pause();
        game.stop();
        setPhase("ready");
      }
      // Tab: "o cantor começou a próxima linha agora" (Tab não serve para digitar)
      if (phase === "playing" && e.key === "Tab" && hasAudio) {
        e.preventDefault();
        game.syncNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, start, game, hasAudio]);

  const onPlayerState = useCallback(
    (ev) => {
      if (ev.type === "state" && ev.state === 1) setAudioHint(null);
      if (ev.type === "ready" && quality === "link" && track) {
        // link colado: mede a sincronia pela duração do vídeo
        const d = Math.abs(ev.duration - track.duration);
        setQuality(d <= 2 ? "exact" : d <= 6 ? "close" : "loose");
      }
    },
    [quality, track]
  );

  const applyLink = (value = link) => {
    const id = parseYouTubeId(value);
    if (!id) {
      setLinkError(true);
      return;
    }
    setLinkError(false);
    setSilent(false);
    setQuality("link");
    setVideoId(id);
    setChangingVideo(false);
  };

  // ±60s: dá conta de vídeo com introdução bem diferente da letra
  const nudge = (delta) => {
    const v = Math.max(-60, Math.min(60, Math.round((offset + delta) * 10) / 10));
    if (phase === "playing") game.resync(v);
    else persistOffset(v);
  };

  const chooseMode = (next) => {
    setMode(next);
    setMusicMode(next);
  };

  if (error) {
    return (
      <div className={styles.center}>
        <p className={styles.msg}>{error}</p>
        <Button variant="ghost" onClick={onBack}>
          {m.back}
        </Button>
      </div>
    );
  }

  const info = track ?? pick;
  const showLinkForm = !videoId || silent || changingVideo;

  return (
    <div className={`${styles.root} ${styles[phase]}`}>
      {/* clima da música: a capa desfocada vira o fundo da página */}
      {media?.cover ? (
        <div className={styles.ambient} style={{ backgroundImage: `url(${media.cover})` }} aria-hidden="true" />
      ) : null}

      {/* palco: o vídeo em destaque (nunca coberto — política do YouTube); sem vídeo, a capa */}
      <div className={styles.stage}>
        {videoId && !silent ? (
          <YouTubePlayer ref={playerRef} videoId={videoId} onState={onPlayerState} className={styles.video} />
        ) : (
          <div className={styles.art}>
            {media?.cover ? <img src={media.cover} alt="" width={500} height={500} /> : <span>♪</span>}
          </div>
        )}
      </div>

      <div className={styles.panel}>
        <div className={styles.trackbar}>
          {media?.cover ? <img className={styles.thumb} src={media.cover} alt="" width={56} height={56} /> : null}
          <div className={styles.titles}>
            <b>{info.track}</b>
            <span>
              {info.artist}
              {info.album ? <em> · {info.album}</em> : null}
            </span>
          </div>
          <SpotifyButton href={media?.spotify} label={m.listen} />
        </div>

        <section className={styles.main}>
          {phase === "loading" ? <p className={styles.msg}>{m.loading}</p> : null}

          {phase === "ready" ? (
            <div className={styles.readyBox}>
              <div className={styles.audio}>
                <span className={styles.label}>{m.audio}</span>
                {videoId && !silent ? (
                  <p className={`${styles.quality} ${styles[quality] || ""}`}>
                    {m.withAudio}
                    {quality && quality !== "link" ? ` · ${m.quality[quality]}` : ""}
                    {!changingVideo ? (
                      <button type="button" className={styles.inlineBtn} onClick={() => setChangingVideo(true)}>
                        {m.changeVideo}
                      </button>
                    ) : null}
                  </p>
                ) : (
                  <ol className={styles.steps}>
                    {m.ytSteps.map((step, i) => (
                      <li key={i}>
                        <b>{i + 1}</b> {step}
                      </li>
                    ))}
                  </ol>
                )}
                {showLinkForm ? (
                  <div className={styles.ytRow}>
                    <YouTubeSearchButton artist={info.artist} track={info.track} label={m.ytSearch} />
                    <form
                    className={styles.linkRow}
                    onSubmit={(e) => {
                      e.preventDefault();
                      applyLink();
                    }}
                  >
                    <input
                      className={styles.linkInput}
                      value={link}
                      onChange={(e) => {
                        setLink(e.target.value);
                        setLinkError(false);
                      }}
                      onPaste={(e) => {
                        // colou um link válido: aplica na hora, sem clicar em "Usar"
                        const pasted = e.clipboardData.getData("text");
                        if (parseYouTubeId(pasted)) {
                          e.preventDefault();
                          setLink(pasted);
                          applyLink(pasted);
                        }
                      }}
                      placeholder={m.pastePlaceholder}
                      aria-label={m.pastePlaceholder}
                    />
                    <Button variant="ghost" type="submit">
                      {m.useLink}
                    </Button>
                  </form>
                  </div>
                ) : null}

                {linkError ? <p className={styles.err}>{m.badLink}</p> : null}
                {showLinkForm ? <p className={styles.hint}>{m.ytTip}</p> : null}
              </div>

              <div className={styles.modeBox}>
                <span className={styles.label}>{m.modeLabel}</span>
                <div className={styles.modeRow} role="radiogroup" aria-label={m.modeLabel}>
                  {["normal", "lives"].map((id) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={mode === id}
                      className={`${styles.modeOpt} ${mode === id ? styles.modeOn : ""}`}
                      onClick={() => chooseMode(id)}
                    >
                      <b>{m.modes[id].name}</b>
                      <span>{m.modes[id].rule}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={relaxed}
                  className={styles.relaxed}
                  onClick={() => {
                    setRelaxed(!relaxed);
                    saveRelaxed(!relaxed);
                  }}
                >
                  <span className={`${styles.track} ${relaxed ? styles.trackOn : ""}`}>
                    <span />
                  </span>
                  <b>{m.relaxed}</b>
                  <span className={styles.relaxedHint}>{m.relaxedHint}</span>
                </button>
              </div>

              {hasAudio ? (
                <div className={styles.offset}>
                  <span className={styles.label}>{m.offset}</span>
                  <OffsetControl value={offset} onNudge={nudge} m={m} />
                </div>
              ) : null}

              <div className={styles.actions}>
                <Button size="lg" onClick={start}>
                  {m.start} <span aria-hidden="true">→</span>
                </Button>
                {!videoId || silent ? null : (
                  <button type="button" className={styles.silentBtn} onClick={() => setSilent(true)}>
                    {m.silent}
                  </button>
                )}
                <span className={styles.keys}>
                  {m.or} <Kbd>enter</Kbd>
                </span>
              </div>

              <button type="button" className={styles.back} onClick={onBack}>
                ← {m.back} · {formatDuration(info.duration)}
              </button>
            </div>
          ) : null}

          {phase === "playing" ? (
            <>
              <LyricStage game={game} duration={info.duration} />
              {audioHint ? <p className={styles.hint}>{audioHint}</p> : null}
              {hasAudio ? (
                <div className={styles.syncBar}>
                  <button type="button" className={styles.syncBtn} onClick={game.syncNow}>
                    {m.syncNow} <Kbd>tab</Kbd>
                  </button>
                  <OffsetControl value={offset} onNudge={nudge} m={m} compact />
                </div>
              ) : null}
            </>
          ) : null}

          {phase === "results" && game.outcome ? (
            <MusicResults
              outcome={game.outcome}
              track={info}
              media={media}
              hasAudio={hasAudio}
              mode={mode}
              relaxed={relaxed}
              onAgain={start}
              onAnother={onBack}
            />
          ) : null}

          {phase === "playing" ? (
            <p className={styles.credits}>
              <Kbd>esc</Kbd> {m.quit}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

/** Ajuste do atraso: ±1s para corrigir rápido, ±0,1s para o fino. */
function OffsetControl({ value, onNudge, m, compact = false }) {
  return (
    <div className={`${styles.offsetRow} ${compact ? styles.offsetCompact : ""}`}>
      <button type="button" onClick={() => onNudge(-1)} aria-label={`${m.earlier} 1s`}>−1s</button>
      <button type="button" onClick={() => onNudge(-0.1)} aria-label={`${m.earlier} 0.1s`}>−.1</button>
      <b title={m.syncHint}>{m.offsetHint(value)}</b>
      <button type="button" onClick={() => onNudge(0.1)} aria-label={`${m.later} 0.1s`}>+.1</button>
      <button type="button" onClick={() => onNudge(1)} aria-label={`${m.later} 1s`}>+1s</button>
    </div>
  );
}
