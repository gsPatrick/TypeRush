"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { loadYouTubeApi } from "@/lib/music/youtube";
import styles from "./YouTubePlayer.module.css";

/**
 * Player do YouTube com API imperativa:
 *   ref.current.play() · pause() · restart() · rewind() · time() → s | null · duration()
 * `time()` só devolve número com o vídeo TOCANDO — pausado/carregando é null,
 * e o relógio do jogo trata null como "parado" em vez de saltar.
 * Fica sempre visível (exigência do YouTube; mínimo 200×200).
 */
const YouTubePlayer = forwardRef(function YouTubePlayer({ videoId, onState, className = "" }, ref) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const readyRef = useRef(false);
  const stateRef = useRef(-1);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    readyRef.current = false;
    loadYouTubeApi()
      .then((YT) => {
        if (!alive || !hostRef.current) return;
        const mount = document.createElement("div");
        hostRef.current.replaceChildren(mount);
        playerRef.current = new YT.Player(mount, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1, controls: 1, disablekb: 1 },
          events: {
            onReady: () => {
              readyRef.current = true;
              onStateRef.current?.({ type: "ready", duration: playerRef.current.getDuration?.() || 0 });
            },
            onStateChange: (e) => {
              stateRef.current = e.data;
              onStateRef.current?.({ type: "state", state: e.data });
            },
            onError: (e) => onStateRef.current?.({ type: "error", code: e.data }),
          },
        });
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      try {
        playerRef.current?.destroy();
      } catch {
        /* já destruído */
      }
      playerRef.current = null;
    };
  }, [videoId]);

  useImperativeHandle(ref, () => ({
    play() {
      if (readyRef.current) playerRef.current.playVideo();
    },
    pause() {
      if (readyRef.current) playerRef.current.pauseVideo();
    },
    restart() {
      if (!readyRef.current) return;
      playerRef.current.seekTo(0, true);
      playerRef.current.playVideo();
    },
    /** Pausa e volta ao início (fim da calibração). */
    rewind() {
      if (!readyRef.current) return;
      playerRef.current.pauseVideo();
      playerRef.current.seekTo(0, true);
    },
    time() {
      // 1 = tocando
      if (!readyRef.current || stateRef.current !== 1) return null;
      return playerRef.current.getCurrentTime();
    },
    duration() {
      return readyRef.current ? playerRef.current.getDuration() : 0;
    },
    isReady: () => readyRef.current,
  }));

  return (
    <div className={`${styles.frame} ${className}`}>
      <div ref={hostRef} className={styles.host} />
      {failed ? <span className={styles.failed}>YouTube indisponível</span> : null}
    </div>
  );
});

export default YouTubePlayer;
