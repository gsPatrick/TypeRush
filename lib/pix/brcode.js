/**
 * Pix estático ("BR Code", padrão EMV do Banco Central) — gerado no próprio
 * navegador, sem serviço externo. Cada campo é ID(2) + TAMANHO(2) + VALOR, e
 * o código termina com um CRC16-CCITT (campo 63) que o app do banco confere:
 * um caractere errado e o QR é recusado.
 */

function field(id, value) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

/** CRC16-CCITT (polinômio 0x1021, início 0xFFFF) — exigido pelo BR Code. */
export function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// nome e cidade do recebedor: só ASCII, sem acento, com limite de tamanho
function plain(text, max) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^A-Za-z0-9 .-]/g, "")
    .slice(0, max)
    .trim();
}

/**
 * @param key     chave Pix (CNPJ só com dígitos, e-mail, telefone, aleatória)
 * @param name    nome do recebedor (até 25)
 * @param city    cidade do recebedor (até 15)
 * @param amount  valor em reais (opcional — sem valor, quem paga digita)
 * @param txid    identificador (até 25, alfanumérico); "***" = sem id
 * @param message mensagem ao pagador (opcional)
 */
export function buildPixPayload({ key, name, city, amount, txid = "***", message }) {
  const account =
    field("00", "br.gov.bcb.pix") + field("01", key) + (message ? field("02", plain(message, 40)) : "");
  let payload =
    field("00", "01") +
    field("26", account) +
    field("52", "0000") +
    field("53", "986") + // real
    (amount ? field("54", Number(amount).toFixed(2)) : "") +
    field("58", "BR") +
    field("59", plain(name, 25)) +
    field("60", plain(city, 15)) +
    field("62", field("05", txid));
  payload += "6304";
  return payload + crc16(payload);
}
