"use client";

import { useEffect, useState } from "react";
import styles from "./CoverArt.module.css";

/**
 * Capa com carregamento sob demanda: se o item já veio com capa, usa; senão
 * pede /api/music/cover — no máximo 4 ao mesmo tempo (fila), com cache em
 * memória, para não martelar a API de capas numa lista de 20.
 */
const cache = new Map();
const queue = [];
let running = 0;
const MAX = 4;

function pump() {
  while (running < MAX && queue.length) {
    const { key, artist, track, resolve } = queue.shift();
    running++;
    fetch(`/api/music/cover?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`)
      .then((r) => (r.ok ? r.json() : { cover: null }))
      .catch(() => ({ cover: null }))
      .then(({ cover }) => {
        cache.set(key, cover);
        resolve(cover);
      })
      .finally(() => {
        running--;
        pump();
      });
  }
}

function loadCover(artist, track) {
  const key = `${artist}\u0000${track}`.toLowerCase();
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  return new Promise((resolve) => {
    queue.push({ key, artist, track, resolve });
    pump();
  });
}

export default function CoverArt({ src, artist, track, size = 52, className = "" }) {
  const [url, setUrl] = useState(src || null);

  useEffect(() => {
    if (src) {
      setUrl(src);
      return undefined;
    }
    let alive = true;
    loadCover(artist, track).then((c) => alive && setUrl(c));
    return () => {
      alive = false;
    };
  }, [src, artist, track]);

  return (
    <span className={`${styles.root} ${className}`} style={{ width: size, height: size }}>
      {url ? <img src={url} alt="" width={size} height={size} loading="lazy" /> : <span aria-hidden="true">♪</span>}
    </span>
  );
}
