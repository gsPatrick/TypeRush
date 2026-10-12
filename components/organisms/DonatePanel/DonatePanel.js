"use client";

import { useEffect, useMemo, useState } from "react";
import { buildPixPayload } from "@/lib/pix/brcode";
import { DEFAULT_VALUE, DONATION_VALUES, PIX } from "@/lib/pix/config";
import styles from "./DonatePanel.module.css";

/**
 * Painel de apoio: escolhe o valor → QR Code Pix com o valor já preenchido,
 * "Pix copia e cola" e a chave CNPJ. Tudo gerado no navegador (BR Code do
 * Banco Central + lib qrcode, carregada só aqui).
 * O QR é escuro sobre claro: câmera de banco lê mal QR invertido.
 */
const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function DonatePanel() {
  const [value, setValue] = useState(DEFAULT_VALUE);
  const [svg, setSvg] = useState("");
  const [copied, setCopied] = useState(null);

  const payload = useMemo(
    () => buildPixPayload({ key: PIX.key, name: PIX.name, city: PIX.city, amount: value, message: PIX.message }),
    [value]
  );

  useEffect(() => {
    let alive = true;
    import("qrcode").then((QR) =>
      QR.toString(payload, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0b0c0b", light: "#f2f4ee" } }).then(
        (s) => alive && setSvg(s)
      )
    );
    return () => {
      alive = false;
    };
  }, [payload]);

  const copy = async (what, text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* sem clipboard: o texto está visível na tela */
    }
    setCopied(what);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className={styles.root}>
      <div className={styles.values} role="radiogroup" aria-label="Valor">
        {DONATION_VALUES.map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={v === value}
            className={`${styles.value} ${v === value ? styles.on : ""}`}
            onClick={() => setValue(v)}
          >
            R$ {v}
          </button>
        ))}
      </div>

      <div className={styles.pay}>
        <div
          className={styles.qr}
          role="img"
          aria-label={`QR Code Pix de ${brl(value)}`}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className={styles.side}>
          <span className={styles.amount}>{brl(value)}</span>
          <span className={styles.hint}>abra o app do banco e aponte a câmera — o valor já vem preenchido</span>
          <button type="button" className={styles.copyMain} onClick={() => copy("code", payload)}>
            {copied === "code" ? "copiado ✓" : "Pix copia e cola"}
          </button>
          <button type="button" className={styles.copyKey} onClick={() => copy("key", PIX.key)}>
            <span>chave CNPJ</span>
            <b>{copied === "key" ? "copiada ✓" : PIX.keyDisplay}</b>
          </button>
        </div>
      </div>
    </div>
  );
}
