/**
 * Apoio via Pix. Chave = CNPJ da empresa (só dígitos, como o Pix exige).
 * O app do banco mostra o nome OFICIAL do CNPJ ao pagar; nome e cidade
 * abaixo vão no código e precisam existir, mas não mudam o destino.
 */
export const PIX = {
  key: "58315507000114",
  keyDisplay: "58.315.507/0001-14",
  name: "TypeRush",
  city: "Brasil",
  message: "Cafe pro dev do TypeRush",
};

export const DONATION_VALUES = [5, 10, 15, 50, 100];
export const DEFAULT_VALUE = 10;
