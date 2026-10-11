"use client";

import Link from "next/link";
import BrandMark from "@/components/atoms/BrandMark/BrandMark";
import Button from "@/components/atoms/Button/Button";
import ModeNav from "@/components/molecules/ModeNav/ModeNav";
import DuelLobby from "@/components/organisms/DuelLobby/DuelLobby";
import DuelPlay from "@/components/organisms/DuelPlay/DuelPlay";
import useDuelRoom from "@/hooks/useDuelRoom";
import { LocaleProvider, useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./DuelRoom.module.css";

/**
 * Sala: header com código e placar + a fase atual.
 * O jogo (DuelPlay) fica montado de countdown → playing → result → revanche,
 * para o motor, o áudio e o foco sobreviverem entre rodadas.
 */
export default function DuelRoom({ code, isHost, name, avatar, mode, lang, onLeave }) {
  const room = useDuelRoom({ code, isHost, name, avatar, mode, lang });
  return (
    <LocaleProvider lang={room.settings.lang}>
      <RoomView room={room} code={code} name={name} avatar={avatar} onLeave={onLeave} />
    </LocaleProvider>
  );
}

function RoomView({ room, code, name, avatar, onLeave }) {
  const { lang, t } = useLocale();
  const d = t.duel;
  const inGame = room.phase !== "lobby";
  const blocked = room.conn === "full" || room.conn === "host-left" || room.conn === "error";

  return (
    <div className={styles.shell}>
      <header className={`${styles.header} ${room.phase === "playing" ? styles.dim : ""}`}>
        <Link href="/" className={styles.home} aria-label="TypeRush">
          <BrandMark />
        </Link>
        <ModeNav current="duel" lang={lang} className={styles.modes} />

        <div className={styles.meta}>
          <span className={styles.code}>
            {d.code} <b>{code}</b>
          </span>
          <span className={styles.mode}>{room.mode.name[lang]}</span>
        </div>

        <div className={styles.score} aria-label="placar">
          <span className={styles.me}>{d.you}</span>
          <b>{room.score[room.role]}</b>
          <span className={styles.x}>×</span>
          <b className={styles.rivalScore}>{room.score[room.rivalRole]}</b>
          <span className={styles.rivalName}>{room.rival?.name ?? "—"}</span>
        </div>

        <button type="button" className={styles.leave} onClick={onLeave}>
          {d.leave}
        </button>
      </header>

      <main className={styles.stage}>
        {blocked ? (
          <div className={styles.notice}>
            <p>{room.conn === "full" ? d.full : room.conn === "host-left" ? d.hostLeft : d.error}</p>
            <Button href="/duel" onClick={onLeave}>
              {d.newRoom}
            </Button>
          </div>
        ) : inGame && room.match ? (
          <DuelPlay room={room} name={name} avatar={avatar} />
        ) : (
          <DuelLobby room={room} code={code} name={name} avatar={avatar} />
        )}
      </main>
    </div>
  );
}
