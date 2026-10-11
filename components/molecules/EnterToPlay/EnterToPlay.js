"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Kbd from "@/components/atoms/Kbd/Kbd";
import styles from "./EnterToPlay.module.css";

/**
 * "aperte enter" — e funciona: Enter em qualquer lugar da landing (fora de
 * links/botões, que já tratam o próprio Enter) abre a escolha de modo.
 */
export default function EnterToPlay({ label = "ou aperte", listen = true }) {
  const router = useRouter();

  useEffect(() => {
    if (!listen) return undefined; // só uma instância escuta — evita push duplo
    router.prefetch("/jogar");
    const onKey = (e) => {
      if (e.key !== "Enter" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest("a, button, input, textarea")) return;
      router.push("/jogar");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, listen]);

  return (
    <span className={styles.root}>
      {label} <Kbd>enter</Kbd>
    </span>
  );
}
