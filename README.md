# Enfernal

Jogo de plataforma 2D no navegador: uma **enfermeira** atravessa o hospital pulando de **cama em cama**, medicando os **pacientes** e sobrevivendo aos **pacientes chatos**.

Feito com **Next.js 16 (App Router) + React 19 + TypeScript**, renderizado em `<canvas>`, sem assets externos (gráficos desenhados em código e sons sintetizados com Web Audio).

## Como jogar

| Ação | Desktop | Celular |
| --- | --- | --- |
| Andar | ← → ou A D | direcional à esquerda (dá pra deslizar o dedo) |
| Pular (segure para ir mais alto) | Espaço, ↑, W ou Z | botão ⤒ |
| Correr | Shift | automático |
| Seringa de calmante | X ou J | botão 💉 (aparece com o power-up) |
| Pausar / som | P ou Esc / M | botões no canto |

- **Paciente** (camisola azul): um pulo na cabeça e ele dorme.
- **Paciente chato** (camisola salmão): precisa de **dois** pulos, persegue você, reclama sem parar e **joga o controle da TV**.
- **Camas** são as plataformas — bata nelas por baixo para assustar quem estiver em cima.
- **Kits médicos** (✚): bata por baixo para ganhar pílulas, a **touca reforçada** (aguenta um golpe) ou a **seringa de calmante** (atira dardos).
- Chegue na porta de **ALTA** para concluir a fase. São 3 fases; 100 pílulas = 1 vida.

No celular o jogo abre em tela cheia, tenta travar em paisagem, vibra nos impactos e pausa sozinho se você girar para retrato.

## Desenvolvimento

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de produção (página estática)
npm run lint
npm run typecheck
```

Deploy: importe o repositório na Vercel — nenhuma configuração extra é necessária.

## Estrutura

```
app/                 layout, página (Server Component), estilos globais, ícone
components/game/     Game (client: canvas, loop, teclado), Overlay (menus), TouchControls
lib/game/            motor puro em TS: física, fases, render, áudio, input
lib/highscore.ts     recorde no localStorage via useSyncExternalStore
```

Boas práticas aplicadas: Server Components por padrão com uma única ilha cliente, React Compiler,
passo de física fixo (igual em 60/120/144 Hz), estado transitório em refs (zero re-render por frame),
`useSyncExternalStore` para localStorage e media queries, `useEffectEvent` para listeners globais,
canvas nítido em telas HiDPI e headers de segurança no `next.config.ts`. Regras de referência em
`.agents/skills/vercel-react-best-practices`.
