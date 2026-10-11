import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["200", "400"],
  variable: "--font-jetbrains",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "TypeRush — digite contra o relógio",
  description:
    "Jogo de digitação de sobrevivência: 30 segundos, +1s por palavra certa, −2s por erro. Até onde você chega?",
};

export const viewport = {
  themeColor: "#0b0c0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${mono.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
