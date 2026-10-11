# TypeRush

Jogo de digitação de sobrevivência. Você começa com **30s**; cada palavra certa
dá **+1s**, cada erro tira **−2s**, o relógio nunca passa de **60s**. Combo
opcional: **+2s a cada 10 acertos seguidos**.

```bash
npm install
npm run dev     # http://localhost:3017  (landing) · /play (jogo)
```

| Rota | O quê |
|---|---|
| `/` | landing — o jogo se jogando sozinho no herói, regras "digitadas" pelo scroll |
| `/play` | o jogo |
| `/duel` | duelo online 1×1 — sala com código/link, P2P |

## Duelo online (P2P, sem servidor)

Os navegadores se conectam direto (WebRTC) via [Trystero](https://github.com/dmotz/trystero);
relays Nostr públicos só servem para os dois se acharem. Não há backend.

- **Anfitrião = juiz.** Quem cria a sala decide o resultado (`lib/duel/referee.js`)
  comparando o tempo de cada um medido no próprio relógio desde o "vai!".
  Janela de 600ms para o "caíram quase juntos".
- **Mesmas palavras** para os dois: motor com semente (`lib/game/rng.js`).
- **Modos** (`lib/duel/modes.js`): Sobrevivência, Overdrive (10s em overdrive
  vence), Livre (60s fixos, mais palavras) e Morte súbita (um erro e acabou).
- **Limites conhecidos:** algumas redes corporativas/4G bloqueiam P2P sem um
  servidor TURN; o juiz é o navegador do anfitrião (bom entre amigos, não para
  ranking público); relays públicos têm limite de taxa por IP.

Só frontend: Next.js 14 (App Router), JavaScript, CSS Modules. Recordes ficam em
`localStorage` (`typerush:v1`).

## Estrutura

```
lib/game/            lógica pura — sem React, testável em Node
  config.js          todos os números do jogo
  engine.js          motor: entrada, envio, prazo, contagem
  clock.js           prazo absoluto + faixas de tensão
  text.js            normalização NFC e diff letra a letra
  scoring.js         wpm, precisão, pico em janela móvel
  words.js           vocabulário pt-BR
  generateWords.js   sorteio sem repetição próxima
  storage.js         recordes e totais
  rng.js             aleatório com semente (duelo)
lib/duel/            modos, juiz, resumo de partida, códigos de sala
hooks/useTypeRush.js ponte motor ↔ React (relógio fora do estado); modo duelo opcional
hooks/useDuelRoom.js sala P2P: conexão, fases, juiz, revanche
components/
  atoms/             BrandMark · Button · Kbd
  molecules/         Word · TimeDeltas · StatBlock · LiveStats · ComboToggle · WpmChart
  organisms/         jogo: TypeRushGame · Header · Arena · Timer · WordStream · Results · Footer · OverdriveBlast
                     landing: LandingNav · LandingHero (+HeroDemo) · RulesMarquee · HowItWorks ·
                              Mechanics · ResultShowcase · FinalCta · LandingFooter
```

## Decisões de regra

- **Relógio = prazo absoluto.** `deadline` em `performance.now()`; bônus e
  penalidades movem o prazo. O restante é sempre `deadline − agora`, então um
  frame atrasado ou uma aba em segundo plano não ganham tempo.
- **Uma palavra só é julgada no envio** (espaço ou Enter). Enquanto digita,
  nada é penalizado. Cada índice é enviado uma vez; espaço sem texto é ignorado.
- **Precisão por tecla.** Texto em composição (acento morto, IME) só conta
  quando a composição termina; comparação em NFC.
- **Fim exato.** Toda entrada checa o prazo antes; se o tempo acabou entre dois
  frames a tecla é descartada e o tempo sobrevivido é o prazo, não o instante
  da detecção.
- **Performance.** O `Timer` escreve direto no DOM via rAF; React só
  re-renderiza em tecla/envio. WPM ao vivo atualiza no máximo 4×/s.
