"use client";

import { useEffect, useRef, useState } from "react";
import CoverArt from "@/components/atoms/CoverArt/CoverArt";
import { formatDuration } from "@/lib/music/lrc";
import { getAllBest, getRecent } from "@/lib/music/storage";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./MusicSearch.module.css";

/** Busca com debounce na LRCLIB (via /api/music/search). Só lista o que tem letra sincronizada. */
export default function MusicSearch({ onPick }) {
  const { t } = useLocale();
  const m = t.music;
  const [q, setQ] = useState("");
  const [state, setState] = useState({ status: "idle", results: [] });
  const [recent, setRecent] = useState([]);
  const [best, setBest] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    setRecent(getRecent());
    setBest(getAllBest());
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setState({ status: "idle", results: [] });
      return undefined;
    }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      setState((s) => ({ ...s, status: "loading" }));
      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal });
        const data = await res.json();
        if (!res.ok) setState({ status: data.error === "busy" ? "busy" : "failed", results: [] });
        else setState({ status: "done", results: data.results });
      } catch (e) {
        if (e.name !== "AbortError") setState({ status: "failed", results: [] });
      }
    }, 350);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q]);

  const list = q.trim().length >= 2 ? state.results : recent;

  return (
    <section className={styles.root}>
      <div className={styles.intro}>
        <span className={styles.kicker}>{m.nav}</span>
        <h1 className={styles.h1}>{m.title}</h1>
        <p className={styles.lede}>{m.lede}</p>
      </div>

      <div className={styles.searchBox}>
        <input
          ref={inputRef}
          className={styles.input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={m.searchPlaceholder}
          aria-label={m.searchPlaceholder}
          spellCheck={false}
          autoComplete="off"
        />
        <span className={styles.hint}>{state.status === "loading" ? m.searching : m.searchHint}</span>
      </div>

      {state.status === "busy" ? <p className={styles.msg}>{m.busy}</p> : null}
      {state.status === "failed" ? <p className={styles.msg}>{m.failed}</p> : null}
      {state.status === "done" && !state.results.length ? <p className={styles.msg}>{m.noResults}</p> : null}

      {q.trim().length < 2 && recent.length ? <span className={styles.label}>{m.recent}</span> : null}

      <ul className={styles.list}>
        {list.map((r) => (
          <li key={r.id}>
            <button type="button" className={styles.item} onClick={() => onPick(r)}>
              {/* recorde: o do modo normal; se só jogou no 3 vidas, o dele */}
              <CoverArt src={r.cover} artist={r.artist} track={r.track} className={styles.cover} />
              <span className={styles.titles}>
                <b>{r.track}</b>
                <span>
                  {r.artist}
                  {r.album ? <em> · {r.album}</em> : null}
                </span>
              </span>
              <span className={styles.meta}>
                {(best[r.id] || best[`${r.id}:lives`]) ? (
                  <span className={styles.played} title={`${m.best}: ${(best[r.id] || best[`${r.id}:lives`]).score}`}>
                    <b className={styles[`r${(best[r.id] || best[`${r.id}:lives`]).rank}`]}>{(best[r.id] || best[`${r.id}:lives`]).rank}</b>
                    <span>
                      {(best[r.id] || best[`${r.id}:lives`]).score} {m.score}
                      <em>{(best[r.id] || best[`${r.id}:lives`]).completion}%</em>
                    </span>
                  </span>
                ) : (
                  <span className={styles.badge}>{m.synced}</span>
                )}
                <span className={styles.dur}>{formatDuration(r.duration)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
