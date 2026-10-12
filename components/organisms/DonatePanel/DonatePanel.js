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

// "quanto quiser": máscara de banco — só dígitos, preenchendo pelos centavos
// (5 → 0,05 · 500 → 5,00 · 5000 → 50,00). Teto R$ 10.000,00.
const MAX_CENTS = 1_000_000;
const centsOf = (text) => {
  const digits = String(text).replace(/\D/g, "").replace(/^0+/, "");
  return digits ? Math.min(MAX_CENTS, Number(digits.slice(0, 7))) : 0;
};
const maskCents = (cents) =>
  cents ? (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
// abaixo de R$ 1 não vale (o banco recusa ou não compensa) → QR sem valor
const amountOf = (cents) => (cents >= 100 ? cents / 100 : null);

export default function DonatePanel() {
  const [value, setValue] = useState(DEFAULT_VALUE);
  const [custom, setCustom] = useState(null); // centavos em "quanto quiser" (null = usando um chip)
  const customValue = custom === null ? null : amountOf(custom);
  // modo "quanto quiser": vale o digitado; vazio = QR sem valor (escolhe no app)
  const amount = custom === null ? value : customValue;
  const [svg, setSvg] = useState("");
  const [copied, setCopied] = useState(null);

  const payload = useMemo(
    () => buildPixPayload({ key: PIX.key, name: PIX.name, city: PIX.city, amount: amount ?? undefined, message: PIX.message }),
    [amount]
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
            aria-checked={custom === null && v === value}
            className={`${styles.value} ${custom === null && v === value ? styles.on : ""}`}
            onClick={() => {
              setValue(v);
              setCustom(null);
            }}
          >
            R$ {v}
          </button>
        ))}
      </div>

      <label className={`${styles.custom} ${custom !== null ? styles.customOn : ""}`}>
        <span className={styles.customLabel}>doe o quanto quiser</span>
        <span className={styles.customField}>
          R$
          <input
            inputMode="decimal"
            placeholder="0,00"
            value={maskCents(custom ?? 0)}
            onFocus={(e) => {
              setCustom((c) => c ?? 0);
              // cursor sempre no fim: a máscara cresce da direita
              const el = e.currentTarget;
              requestAnimationFrame(() => el.setSelectionRange?.(el.value.length, el.value.length));
            }}
            onChange={(e) => setCustom(centsOf(e.target.value))}
            aria-label="doe o quanto quiser (R$)"
          />
        </span>
      </label>

      <div className={styles.pay}>
        <div
          className={styles.qr}
          role="img"
          aria-label={amount ? `QR Code Pix de ${brl(amount)}` : "QR Code Pix, valor livre"}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className={styles.side}>
          {(() => {
            const label = amount ? brl(amount) : "valor livre";
            // --chars: a fonte encolhe para o valor caber na coluna (R$ 10.000,00)
            return (
              <span className={styles.amount} style={{ "--chars": Array.from(label).length }}>
                {label}
              </span>
            );
          })()}
          <span className={styles.hint}>
            {amount
              ? "abra o app do banco e aponte a câmera — o valor já vem preenchido"
              : "abra o app do banco e aponte a câmera — você digita o valor lá"}
          </span>
          <button type="button" className={styles.copyMain} onClick={() => copy("code", payload)}>
            {copied === "code" ? "copiado ✓" : "Pix copia e cola"}
          </button>
          <button type="button" className={styles.copyKey} onClick={() => copy("key", PIX.key)}>
            <span>chave CNPJ · copiar</span>
            <b>{copied === "key" ? "copiada ✓" : PIX.keyDisplay}</b>
          </button>
          <span className={styles.holder}>
            <span>recebedor</span>
            <b>{PIX.holder}</b>
            <span>CNPJ {PIX.keyDisplay}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
