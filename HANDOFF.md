# $TBILL site — dev handoff

One-page memecoin site: a fake Windows 98 desktop (98.css) with draggable
windows, a spinning 3D WordArt hero, a live trades ticker, and a mini-game.
Single route, all client-side, no backend.

## Stack / requirements

- **Next.js 16** (app router, Turbopack) · **React 19** · TypeScript
- **Node 18.18+** (built on Node 22)
- Libraries: `98.css`, `react-draggable`, `canvas-confetti`
- Deploy target: **Vercel** (static — no server/env required to run)

## Run / build / deploy

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (run before deploying)
npm start        # serve the production build locally
```

Deploy: push to a Git repo and import into Vercel (framework auto-detected),
or `vercel` CLI. No build config needed.

## Project structure (the files that matter)

| File | What it is |
|------|------------|
| `app/page.tsx` | The whole page. Window manager (open/close/z-index/taskbar/icons), all window content, WordArt hero, game, wires in the ticker. Client component. |
| `app/globals.css` | All custom styling (98.css is imported separately in layout). |
| `app/layout.tsx` | Imports `98.css`, sets `<title>`/description. |
| `app/config.ts` | **Launch config** — contract address + social links (see below). |
| `app/components/LiveTicker.tsx` | The top live-trades ticker (consumes the trade source). |
| `lib/tradeSource.ts` | **The trade data source — the ONLY file to change to go live** (see below). |
| `app/icon.png`, `app/apple-icon.png` | Favicon / touch icon (the mascot). Swap the files to change. |
| `next.config.ts` | Pins the Turbopack workspace root. |

## Launch config — `app/config.ts`

CA and links are **empty by default and simply don't render** until filled —
no fake placeholders show pre-launch. At launch, set them one of two ways:

- **In code:** paste the real values between the quotes in `app/config.ts`, redeploy.
- **No code (Vercel):** set env vars, then redeploy (they're baked in at build time):
  `NEXT_PUBLIC_CA`, `NEXT_PUBLIC_TWITTER`, `NEXT_PUBLIC_TELEGRAM`, `NEXT_PUBLIC_PONS`, `NEXT_PUBLIC_CHART`

The site reads the CA and social buttons from here automatically — no other edits needed.

## Live trades ticker — going live (the important part)

The trade feed is deliberately split so going live touches **one file only**:

- `lib/tradeSource.ts` exposes `subscribeToTrades(onTrade) => unsubscribe` and a `Trade` type.
- **Phase 1 (current):** the body generates realistic **mock** trades every 2–8s.
- `app/components/LiveTicker.tsx` only ever calls `subscribeToTrades`; it does not
  know or care where trades come from. **The frontend does not change when you go live.**

**To go live, replace only the body of `subscribeToTrades` in `lib/tradeSource.ts`**
(there's a `// TODO: Phase 2` block at the top of that file spelling this out):

1. Open a WebSocket to a **WSS RPC** for the chain the pool lives on.
2. `eth_subscribe` to the pool contract's **`Swap`** events (or `Transfer` events
   to/from the pool address if the DEX doesn't emit a clean Swap).
3. Per event: decode amounts; **side = tokens leaving pool → `buy`, entering → `sell`**;
   estimate USD; read `txHash` and sender (`wallet`).
4. Emit each via the existing `onTrade(trade)` callback — same `Trade` shape.
5. Add **reconnect-with-backoff** (WSS endpoints drop).
6. Delete the mock helpers and the `MOCK_PRICE_USD` constant.

**Feasibility / what to confirm first:** this works cleanly **if Robinhood Chain is
EVM-compatible and exposes a WSS RPC endpoint**, and the pool emits standard,
decodable Swap/Transfer events — then ethers/viem + a websocket is all you need.
If there's no public WSS, or the chain isn't EVM, use an **indexer/API instead**
(a DEX-data API, the launchpad's API, or a subgraph, polled or streamed) — wrap it
in the same `subscribeToTrades` signature and, again, the frontend is unchanged.
So: **yes, it's built to go live** — but it's real integration work in that one file,
not a config flag. You need the deployed **CA + pool address** before you can start.

## Known placeholders / mock (by design)

- **Live ticker** = mock data until `tradeSource.ts` is wired to chain (above).
- **VIBES widget** (`portfolio_widget`) — deliberately NOT a price/return; it's a joke
  ("VIBES: MAXIMUM", labelled "not a price / not financial advice"). Keep it that way.
- **Brainrot counter**, **whack-a-jeet** game — pure cosmetic/fun, no data.
- **"as seen on"** chips — parody text, intentionally fake.
- Everything has **"not financial advice" disclaimers**; there are no "buy" CTAs
  (the big button just fires confetti). Please keep it that way for compliance.

## Gotchas

- The **folder is literally named `$TBILL`**, which npm rejects as a package name —
  so `package.json` name is `tbill-website`. Don't re-run `create-next-app` in this
  folder; it'll choke on the `$`. (Deploy/build are unaffected.)
- Next's dev server only allows **one instance per project dir** — if `npm run dev`
  says one's already running, kill it first (`pkill -f "next dev"`).
- To change the **mascot/favicon**, replace `app/icon.png` (256×256) and
  `app/apple-icon.png` (180×180). Next auto-detects them; no code change.
