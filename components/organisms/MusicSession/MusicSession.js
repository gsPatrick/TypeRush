"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/atoms/Button/Button";
import Kbd from "@/components/atoms/Kbd/Kbd";
import SpotifyButton from "@/components/atoms/SpotifyButton/SpotifyButton";
import YouTubePlayer from "@/components/molecules/YouTubePlayer/YouTubePlayer";
import LyricStage from "@/components/organisms/LyricStage/LyricStage";
import MusicResults from "@/components/organisms/MusicResults/MusicResults";
import useMusicGame from "@/hooks/useMusicGame";
import { formatDuration } from "@/lib/music/lrc";
import { getOffset, pushRecent, setOffset as saveOffset } from "@/lib/music/storage";
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
  const playerRef = useRef(null);

  // letra + mídia em paralelo
  useEffect(() => {
    let alive = true;
    setOffsetState(getOffset(pick.id));
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
  const game = useMusicGame({
    track: track ?? { id: pick.id, synced: "" },
    offset,
    hasAudio,
    getAudioTime: () => playerRef.current?.time() ?? null,
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

  // fim do jogo → resultado (a música segue tocando o final)
  useEffect(() => {
    if (game.status === "over" && phase === "playing") setPhase("results");
  }, [game.status, phase]);

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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, start, game]);

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

  const applyLink = () => {
    const id = parseYouTubeId(link);
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

  const nudge = (delta) => {
    const v = Math.max(-5, Math.min(5, Math.round((offset + delta) * 10) / 10));
    setOffsetState(v);
    saveOffset(pick.id, v);
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
                  <>
                    <p className={styles.msg}>{media?.videoReason === "no-key" ? m.noKey : m.notFound}</p>
                    <p className={styles.hint}>{m.pasteHint}</p>
                  </>
                )}
                {showLinkForm ? (
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
                      onChange={(e) => setLink(e.target.value)}
                      placeholder={m.pastePlaceholder}
                      aria-label={m.pastePlaceholder}
                    />
                    <Button variant="ghost" type="submit">
                      {m.useLink}
                    </Button>
                  </form>
                ) : null}
                {linkError ? <p className={styles.err}>{m.badLink}</p> : null}
              </div>

              {hasAudio ? (
                <div className={styles.offset}>
                  <span className={styles.label}>{m.offset}</span>
                  <div className={styles.offsetRow}>
                    <button type="button" onClick={() => nudge(-0.1)}>− {m.earlier}</button>
                    <b>{m.offsetHint(offset)}</b>
                    <button type="button" onClick={() => nudge(0.1)}>{m.later} +</button>
                  </div>
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
            </>
          ) : null}

          {phase === "results" && game.outcome ? (
            <MusicResults
              outcome={game.outcome}
              track={info}
              media={media}
              hasAudio={hasAudio}
              onAgain={start}
              onAnother={onBack}
            />
          ) : null}

          <p className={styles.credits}>
            {phase === "playing" ? (
              <>
                <Kbd>esc</Kbd> {m.quit} ·{" "}
              </>
            ) : null}
            {m.lyricsCredit}
            {hasAudio ? ` · ${m.audioCredit}` : ""}
          </p>
        </section>
      </div>
    </div>
  );
}
