"use client";

import { useState } from "react";
import Avatar from "@/components/atoms/Avatar/Avatar";
import Button from "@/components/atoms/Button/Button";
import LanguageSwitch from "@/components/molecules/LanguageSwitch/LanguageSwitch";
import ModePicker from "@/components/molecules/ModePicker/ModePicker";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./DuelLobby.module.css";

/** Lobby: link para convidar, quem está na sala, modo/idioma e o "pronto". */
export default function DuelLobby({ room, code, name, avatar }) {
  const { t } = useLocale();
  const d = t.duel;
  const [copied, setCopied] = useState(false);
  const host = room.role === "host";

  const copy = async () => {
    const url = `${window.location.origin}/duel?sala=${code}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* sem clipboard: o código está visível na tela */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  let status = null;
  if (room.conn === "connecting") status = d.connecting;
  else if (!room.rival) status = d.waiting;
  else if (host && !room.rival.ready) status = d.waitReady;
  else if (!host) status = room.meReady ? d.waitHost : null;

  return (
    <section className={styles.root}>
      <div className={styles.left}>
        <div className={styles.invite}>
          <span className={styles.label}>{d.code}</span>
          <span className={styles.bigCode}>{code}</span>
          <div className={styles.inviteRow}>
            <Button variant="ghost" onClick={copy}>
              {copied ? d.copied : d.copyLink}
            </Button>
            <span className={styles.hint}>{d.shareHint}</span>
          </div>
        </div>

        <div className={styles.players}>
          <Player name={name} avatar={avatar} tag={host ? d.host : d.you} ready={host || room.meReady} you t={d} />
          <span className={styles.vs}>vs</span>
          {room.rival ? (
            <Player
              name={room.rival.name}
              avatar={room.rival.avatar}
              tag={host ? "" : d.host}
              ready={!host || room.rival.ready}
              t={d}
            />
          ) : (
            <div className={`${styles.player} ${styles.empty}`}>
              <span className={styles.pulse} />
              <span>{room.conn === "connecting" ? d.connecting : d.waiting}</span>
            </div>
          )}
        </div>

        {room.slow && !room.rival ? <p className={styles.slow}>{host ? d.slowHost : d.slowGuest}</p> : null}
      </div>

      <div className={styles.right}>
        <div className={styles.configHead}>
          <span className={styles.label}>{d.mode}</span>
          {host ? (
            <LanguageSwitch value={room.settings.lang} onChange={(l) => room.changeSettings({ lang: l })} />
          ) : (
            <span className={styles.hint}>{d.onlyHostMode}</span>
          )}
        </div>
        <ModePicker value={room.settings.mode} onChange={(m) => room.changeSettings({ mode: m })} disabled={!host} />

        {host ? (
          <Button size="lg" onClick={room.startRound} disabled={!room.canStart} className={styles.full}>
            {d.start} <span aria-hidden="true">→</span>
          </Button>
        ) : (
          <Button
            size="lg"
            variant={room.meReady ? "ghost" : "primary"}
            onClick={room.toggleReady}
            disabled={!room.rival}
            className={styles.full}
          >
            {room.meReady ? d.unready : d.imReady}
          </Button>
        )}
        {status ? <span className={styles.status}>{status}</span> : null}
      </div>
    </section>
  );
}

function Player({ name, avatar, tag, ready, you, t }) {
  return (
    <div className={`${styles.player} ${you ? styles.you : styles.rival}`}>
      <Avatar id={avatar} name={name} size={44} tone={you ? "me" : "rival"} />
      <span className={styles.who}>
        <b>{name}</b>
        {tag ? <small>{tag}</small> : null}
      </span>
      <span className={`${styles.ready} ${ready ? styles.on : ""}`}>{ready ? t.ready : t.notReady}</span>
    </div>
  );
}
