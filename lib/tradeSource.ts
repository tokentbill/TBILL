// ============================================================
//  Trade source — the ONLY file to change to go live.
// ============================================================
//  Pre-launch: no data source is connected, so this emits nothing
//  and the ticker shows its "activates at launch" state. No seed /
//  mock data ships to production.
//
//  TODO: Phase 2 — implement the real on-chain listener here once the
//  CA + pool exist. Keep the `Trade` shape and `subscribeToTrades`
//  signature identical; the frontend needs zero changes.
//   1. Open a WebSocket to a WSS RPC for the pool's chain.
//   2. eth_subscribe to the pool's `Swap` events (or `Transfer`
//      to/from the pool if there's no clean Swap).
//   3. Per event: decode amounts; side = tokens leaving pool -> "buy",
//      entering -> "sell"; estimate USD; read tx hash + sender.
//   4. Emit each via onTrade(trade) — same shape below.
//   5. Reconnect with backoff (WSS endpoints drop).
// ============================================================

export interface Trade {
  id: string;
  wallet: string; // full address; the frontend truncates for display
  side: "buy" | "sell";
  amountTokens: number;
  amountUsd: number;
  timestamp: number; // unix ms
  txHash: string;
}

/**
 * Subscribe to trade events. Calls `onTrade` for each new trade and
 * returns an unsubscribe function.
 *
 * Currently a no-op (no feed connected pre-launch). At launch, wire the
 * real on-chain listener into this body per the TODO above — nothing
 * that consumes this needs to change.
 */
export function subscribeToTrades(onTrade: (trade: Trade) => void): () => void {
  void onTrade; // intentionally unused until the live feed is wired in
  return () => {};
}
