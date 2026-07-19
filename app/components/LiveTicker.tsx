"use client";

import { useEffect, useState } from "react";
import { subscribeToTrades, type Trade } from "../../lib/tradeSource";

const MAX_ITEMS = 18;

function truncWallet(w: string): string {
  return `${w.slice(0, 6)}…${w.slice(-4)}`;
}
function compact(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.round(n).toString();
}
function fmtUsd(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export default function LiveTicker() {
  const [trades, setTrades] = useState<Trade[]>([]);

  // Same swappable source as everything else (Piece A).
  useEffect(() => {
    return subscribeToTrades((t) =>
      setTrades((prev) => [t, ...prev].slice(0, MAX_ITEMS)),
    );
  }, []);

  return (
    <div className="ticker">
      <div className="ticker-badge">
        <span className="live-dot" /> LIVE&nbsp;$TBILL
      </div>
      <div className="ticker-viewport">
        {trades.length === 0 ? (
          <div className="ticker-empty">waiting for trades…</div>
        ) : (
          // duplicated track for a seamless infinite scroll
          <div className="ticker-track">
            {[...trades, ...trades].map((t, i) => (
              <span key={`${t.id}-${i}`} className={`ticker-item ${t.side}`}>
                <span className="ticker-dot" />
                {truncWallet(t.wallet)} {t.side.toUpperCase()}{" "}
                {fmtUsd(t.amountUsd)}
                <span className="ticker-tokens">({compact(t.amountTokens)})</span>
                <span className="ticker-sep">◆</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
