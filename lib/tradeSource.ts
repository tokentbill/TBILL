// ============================================================
//  TODO: Phase 2 — swap this file's internals for a real on-chain
//  listener once the CA + pool exist.
// ============================================================
//  This module is the ONLY piece that changes when going live.
//  Keep the `Trade` shape and the `subscribeToTrades` signature
//  identical, and the frontend needs zero changes.
//
//  Phase 2 outline (do NOT do now — token isn't launched yet):
//   1. Open a WebSocket to a WSS RPC for the pool's chain
//      (free public WSS, or Alchemy/Infura/QuickNode free tier).
//   2. eth_subscribe to the pool contract's `Swap` events
//      (or `Transfer` events to/from the pool if there's no clean Swap).
//   3. For each event: decode amounts; side = tokens leaving pool -> "buy",
//      tokens entering pool -> "sell"; estimate USD; read tx hash + sender.
//   4. Emit via the same onTrade(trade) callback below — unchanged shape.
//   5. Add reconnect-with-backoff (WSS endpoints drop connections).
// ============================================================

export interface Trade {
  id: string;
  wallet: string; // full address; the frontend truncates for display
  side: "buy" | "sell";
  amountTokens: number;
  amountUsd: number;
  timestamp: number; // unix ms
  txHash: string; // fake now, real tx hash in Phase 2
}

// ---------------------------------------------------------------
// Phase 1 mock generator (everything below is throwaway at launch)
// ---------------------------------------------------------------

// Mock unit price used only to derive a plausible token amount from a
// USD amount. In Phase 2 the real amounts come straight off the event.
const MOCK_PRICE_USD = 0.0000069;

let seq = 0;

function randHex(len: number): string {
  let out = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * 16)];
  }
  return out;
}

function randomWallet(): string {
  return "0x" + randHex(40);
}

function randomTxHash(): string {
  return "0x" + randHex(64);
}

function makeTrade(): Trade {
  // ~65/35 buy/sell bias — "everyone's aping in" energy
  const side: Trade["side"] = Math.random() < 0.65 ? "buy" : "sell";

  // mostly small-to-medium, occasional whale to keep the feed lively
  const isWhale = Math.random() < 0.1;
  const amountUsd = isWhale
    ? 5000 + Math.random() * 45000 // 5k–50k
    : 50 + Math.random() * 1950; // 50–2000

  const amountTokens = amountUsd / MOCK_PRICE_USD;

  seq += 1;
  return {
    id: `${Date.now().toString(36)}-${seq.toString(36)}`,
    wallet: randomWallet(),
    side,
    amountTokens,
    amountUsd,
    timestamp: Date.now(),
    txHash: randomTxHash(),
  };
}

/**
 * Subscribe to trade events. Calls `onTrade` for each new trade and
 * returns an unsubscribe function.
 *
 * Phase 1: emits a realistic fake trade every 2–8s.
 * Phase 2: replace the body with a real WSS subscription (see header),
 *          keeping this exact signature.
 */
export function subscribeToTrades(onTrade: (trade: Trade) => void): () => void {
  let active = true;
  let timer: ReturnType<typeof setTimeout>;

  const schedule = (delay: number) => {
    timer = setTimeout(() => {
      if (!active) return;
      onTrade(makeTrade());
      schedule(2000 + Math.random() * 6000); // next trade in 2–8s
    }, delay);
  };

  // first trade lands shortly after mount so the feed isn't empty for long
  schedule(500 + Math.random() * 1000);

  return () => {
    active = false;
    clearTimeout(timer);
  };
}
