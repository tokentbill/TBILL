"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Draggable from "react-draggable";
import confetti from "canvas-confetti";
import { CONTRACT_ADDRESS, LINKS } from "./config";
import LiveTicker from "./components/LiveTicker";

/* <marquee> is period-accurate but not in the TS JSX types. */
const Marquee = "marquee" as unknown as React.FC<
  React.HTMLAttributes<HTMLElement>
>;

// Only render a CA / link once it's actually been filled in.
const has = (v: string) => !!v && v.trim() !== "" && v !== "#";
const CA_LIVE = has(CONTRACT_ADDRESS);

/* ---- window registry: id, initial pos, rotation, width ---- */
type WinCfg = {
  id: string;
  x: number;
  y: number;
  rot: number;
  width: number;
};

// Tidy, aligned desktop grid — three columns, no rotation, with a
// reserved left strip (~112px) for the desktop icons.
// NOTE: order must match the WINDOWS[i] indexes used in the JSX below.
const WINDOWS: WinCfg[] = [
  { id: "main", x: 116, y: 20, rot: 0, width: 520 },
  { id: "brainrot", x: 652, y: 20, rot: 0, width: 300 },
  { id: "lore", x: 116, y: 352, rot: 0, width: 520 },
  { id: "portfolio", x: 652, y: 188, rot: 0, width: 300 },
  { id: "socials", x: 968, y: 20, rot: 0, width: 300 },
  { id: "asseen", x: 968, y: 276, rot: 0, width: 300 },
  { id: "game", x: 968, y: 556, rot: 0, width: 300 },
  { id: "faq", x: 652, y: 562, rot: 0, width: 300 },
];

const TASKBAR_TABS: Record<string, string> = {
  main: "MyComputer_TBILL.exe",
  brainrot: "brainrot_counter.exe",
  lore: "lore.txt",
  portfolio: "portfolio_widget.exe",
  socials: "socials.exe",
  asseen: "as_seen_on.exe",
  game: "whack-a-jeet.exe",
  faq: "faq.txt",
};

const ICON_GLYPHS: Record<string, string> = {
  main: "💻",
  brainrot: "🧠",
  lore: "📄",
  portfolio: "📈",
  socials: "🌐",
  asseen: "📺",
  game: "🕹️",
  faq: "❓",
};

const LORE = `LORE.TXT — DO NOT CLOSE THIS WINDOW

it started with a durag and a dream.

somewhere in a robinhood data center, a t-bill ETF got
tokenized as a joke by an intern who had been awake for
31 hours straight. nobody signed off on it. nobody reviewed
the smart contract. it just... deployed. at 4:20am. on a
tuesday. this is not a metaphor, this is the actual timeline.

the wrapper woke up low-poly. bootleg-rendered. built like
a 2005 xbox cutscene that skipped every texture budget
meeting. it looked at itself in a car window (low-poly car,
naturally) and decided it looked incredible actually.

it put on a durag. it does not remember buying the durag.
the durag was simply there, the way destiny is simply there.

it got gold teeth installed. the dentist does not exist in
this universe, the teeth are just canon now. it got a chain.
the chain has a dollar sign on it because subtlety was never
on the roadmap.

its eyes are permanently half-lidded and bloodshot because
it has been staring at a candle stick chart for six
consecutive days and the chart only goes one direction and
that direction is up and it cannot look away and honestly
it doesn't want to.

the badge on its chest says 69. not 9. we upgraded. everyone
agreed 69 was funnier and the vote took four seconds.

it is not backed by treasuries. it is not backed by anything.
it insists it is "under-collateralized by choice, like a
lifestyle." it says this while holding a fanned stack of
cartoon cash it also does not remember acquiring.

it spends this money in the most degenerate way conceivable.
lambos it cannot parallel park. pool floats shaped like
dollar signs. private jets with low-poly champagne. rooftop
parties overlooking a skyline that is also, upon closer
inspection, low-poly. it has never once bought a t-bill
with this money. this is the whole joke. this is the only
joke. it is a very good joke.

the sec has stopped asking questions because every question
gets answered with a screenshot of the badge and the number
69 and eventually they just stopped calling.

it lives on robinhood chain. it launched on pons. it has no
whitepaper, no roadmap, no audit, no utility, and a badge
that says 69 on a shirt it has never taken off.

we are the bagholders. we are also, somehow, up bad and up
money at the same time and nobody can explain the math.
the math is vibes. the math has always been vibes.

$TBILL. tokenized rwa. sigma frog energy, durag execution.
69 on the chest. gold in the mouth. nothing behind it but
confetti and conviction.

- the guy in the durag (unconfirmed if frog)
`;

const FAQ = `LORE.TXT — ADDENDUM — DO NOT CLOSE THIS WINDOW EITHER

an update. there is a watch now.

nobody remembers when the watch appeared. one screenshot
he doesn't have it. the next screenshot he does. between
those two screenshots is a gap in the timeline that the
team has classified as "not our problem."

it is an iced-out skeleton watch. you can see the gears
moving inside it, which is either a marvel of horology or
a sign that the diamonds were bought before the actual
watch mechanism, and someone had to improvise. we have
chosen not to investigate further.

the watch does not tell time. it has never told time. it
has told other things — vibes, mostly, and occasionally
the exact millisecond a candle turns green — but never
time. this is considered an upgrade.

frequently asked questions, answered badly:

Q: is this backed by real t-bills?
A: it is backed by the badge, the chain, and the watch.
   these are the only three things that have ever been
   verified to exist.

Q: what is the utility?
A: the utility is the confetti. there has always only
   been the confetti.

Q: why 69 and not 9?
A: because 9 wasn't funny enough and we had already
   printed the shirts before anyone thought to ask "why
   not 69" so now it's just canon. see: the durag.

Q: is the sec going to do anything?
A: they have a folder. the folder has a screenshot of the
   badge in it. that is the entire file. this has been
   true for weeks. nothing has been added to the folder.

Q: does he ever take off the durag?
A: no. there was one incident. we do not discuss the
   incident. he has not taken it off since.

Q: what happens if the price goes to zero?
A: he still has the watch. he was always going to still
   have the watch. the watch was never about the price.

$TBILL. still tokenized. still an rwa. still no roadmap.
now with a watch that shows you the gears turning instead
of the time, which honestly is more honest than most
finance products anyway.

- the guy in the durag, now also the guy with the watch
`;

/* ------------------------------------------------------------- */
/* Confetti helper                                               */
/* ------------------------------------------------------------- */
function blastConfetti() {
  const shoot = (originX: number) =>
    confetti({
      particleCount: 90,
      spread: 75,
      startVelocity: 45,
      origin: { x: originX, y: 0.6 },
      colors: ["#FFD700", "#3c8f3f", "#60D394", "#00ff00", "#000080"],
    });
  shoot(0.2);
  shoot(0.5);
  shoot(0.8);
}

/* ------------------------------------------------------------- */
/* Draggable window wrapper                                      */
/* ------------------------------------------------------------- */
function Win({
  cfg,
  z,
  onFocus,
  children,
}: {
  cfg: WinCfg;
  z: number;
  onFocus: () => void;
  children: ReactNode;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      handle=".title-bar"
      defaultPosition={{ x: cfg.x, y: cfg.y }}
      bounds="parent"
    >
      <div
        ref={nodeRef}
        className="win"
        style={{ zIndex: z }}
        onMouseDown={onFocus}
      >
        <div
          className="window"
          style={{
            width: cfg.width,
            maxWidth: "94vw",
            transform: `rotate(${cfg.rot}deg)`,
          }}
        >
          {children}
        </div>
      </div>
    </Draggable>
  );
}

function TitleBar({ text, onClose }: { text: string; onClose?: () => void }) {
  return (
    <div className="title-bar">
      <div className="title-bar-text">{text}</div>
      <div className="title-bar-controls">
        <button aria-label="Minimize" />
        <button aria-label="Maximize" />
        <button
          aria-label="Close"
          onClick={onClose}
          // don't let the close click also register as a drag/focus
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- */
/* Sparkline (only ever up-and-to-the-right, then moonshot)      */
/* ------------------------------------------------------------- */
function Sparkline() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || 300;
    const H = canvas.clientHeight || 90;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    // build a squiggly-but-rising series, ending in a moonshot spike
    const N = 60;
    const pts: number[] = [];
    let v = H * 0.85;
    for (let i = 0; i < N; i++) {
      const drift = -0.6 - i * 0.05; // steadily rising (canvas y grows down)
      const wobble = Math.sin(i * 0.8) * 5 + (i % 3 === 0 ? 3 : -2);
      v += drift + wobble;
      if (i > N - 10) v -= 9; // final stretch = moonshot
      v = Math.max(6, Math.min(H - 6, v));
      pts.push(v);
    }

    let progress = 0;
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // faint grid
      ctx.strokeStyle = "rgba(0,255,0,0.15)";
      ctx.lineWidth = 1;
      for (let g = 1; g < 4; g++) {
        ctx.beginPath();
        ctx.moveTo(0, (H / 4) * g);
        ctx.lineTo(W, (H / 4) * g);
        ctx.stroke();
      }

      const count = Math.floor(progress);
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= count && i < N; i++) {
        const x = (i / (N - 1)) * W;
        const y = pts[i];
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // glowing head dot
      if (count > 0 && count < N) {
        const x = (count / (N - 1)) * W;
        const y = pts[Math.min(count, N - 1)];
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      if (progress < N - 1) {
        progress += 1.2;
        raf = requestAnimationFrame(draw);
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="sparkline-wrap">
      <canvas ref={ref} />
    </div>
  );
}

/* ------------------------------------------------------------- */
/* Brainrot counter                                             */
/* ------------------------------------------------------------- */
function BrainrotCounter() {
  const [count, setCount] = useState(10847203);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const tick = () => {
      setCount((c) => c + Math.floor(Math.random() * 4000) + 137);
      timeout = setTimeout(tick, 400 + Math.random() * 500);
    };
    timeout = setTimeout(tick, 600);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <p style={{ margin: "0 0 6px", fontWeight: "bold" }}>BRAINROT ACHIEVED:</p>
      <div className="sunken-panel" style={{ padding: 2 }}>
        <span className="odometer">{count.toLocaleString("en-US")}</span>
      </div>
      <p style={{ fontSize: 10, marginTop: 6, marginBottom: 0 }}>
        counter has never gone down. we checked.
      </p>
    </>
  );
}

/* ------------------------------------------------------------- */
/* Live clock (the one real feature)                            */
/* ------------------------------------------------------------- */
function Clock() {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString("en-US", { hour12: true });
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return <div className="clock">{time}</div>;
}

/* ------------------------------------------------------------- */
/* Bouncing DVD-style $TBILL coin                                */
/* ------------------------------------------------------------- */
function BouncingCoin() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let x = 140;
    let y = 160;
    let vx = 1.4;
    let vy = 1.15;
    let raf = 0;
    const step = () => {
      const maxX = window.innerWidth - 66;
      const maxY = window.innerHeight - 40 - 66; // keep clear of the taskbar
      x += vx;
      y += vy;
      if (x <= 0) {
        x = 0;
        vx = Math.abs(vx);
      } else if (x >= maxX) {
        x = maxX;
        vx = -Math.abs(vx);
      }
      if (y <= 0) {
        y = 0;
        vy = Math.abs(vy);
      } else if (y >= maxY) {
        y = maxY;
        vy = -Math.abs(vy);
      }
      el.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div ref={ref} className="bouncing-coin" aria-hidden="true">
      $TBILL
    </div>
  );
}

/* ------------------------------------------------------------- */
/* Spinning 3D WordArt hero (the "$TBILL" that rotates on the BG) */
/* ------------------------------------------------------------- */
const WORDART_DEPTH = 20;

function WordArt3D() {
  return (
    <div className="wordart-stage" aria-hidden="true">
      <div className="wordart">
        {Array.from({ length: WORDART_DEPTH }, (_, i) => {
          const t = i / (WORDART_DEPTH - 1);
          const r = Math.round(198 + (110 - 198) * t);
          const g = Math.round(106 + (50 - 106) * t);
          const b = Math.round(32 + (8 - 32) * t);
          return (
            <span
              key={i}
              className="wa-layer"
              style={{
                transform: `translateZ(${-(i + 1) * 2}px)`,
                color: `rgb(${r},${g},${b})`,
              }}
            >
              $TBILL
            </span>
          );
        })}
        <span className="wa-face">$TBILL</span>
      </div>
      <div className="wordart-tag">$TBILL · a meme · not financial advice</div>
    </div>
  );
}

/* ------------------------------------------------------------- */
/* WHACK-A-JEET — a maximally braindead mini-game                */
/* ------------------------------------------------------------- */
type Critter = "guy" | "gem" | "rug";
const CRITTER_GLYPH: Record<Critter, string> = {
  guy: "🤑",
  gem: "💎",
  rug: "🧻",
};
const GAME_SECONDS = 20;

function WhackAJeet() {
  const [running, setRunning] = useState(false);
  const [played, setPlayed] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [time, setTime] = useState(GAME_SECONDS);
  const [active, setActive] = useState<{ i: number; type: Critter } | null>(
    null,
  );

  // spawn critters + countdown while running
  useEffect(() => {
    if (!running) return;
    const pop = setInterval(() => {
      const i = Math.floor(Math.random() * 9);
      const r = Math.random();
      const type: Critter = r < 0.2 ? "gem" : r < 0.42 ? "rug" : "guy";
      setActive({ i, type });
    }, 680);
    const clock = setInterval(() => setTime((t) => t - 1), 1000);
    return () => {
      clearInterval(pop);
      clearInterval(clock);
    };
  }, [running]);

  // end the round when the timer runs out
  useEffect(() => {
    if (running && time <= 0) {
      setRunning(false);
      setActive(null);
      setBest((b) => Math.max(b, score));
      if (score >= 25) blastConfetti();
    }
  }, [running, time, score]);

  const start = () => {
    setScore(0);
    setTime(GAME_SECONDS);
    setActive(null);
    setRunning(true);
    setPlayed(true);
  };

  const whack = (i: number) => {
    if (!running || !active || active.i !== i) return;
    if (active.type === "gem") setScore((s) => s + 5);
    else if (active.type === "rug") setScore((s) => Math.max(0, s - 3));
    else setScore((s) => s + 1);
    setActive(null);
  };

  const rating =
    score >= 40
      ? "TERMINALLY SIGMA"
      : score >= 25
        ? "certified grindset"
        : score >= 10
          ? "mid. keep grinding."
          : "ngmi (for now)";

  return (
    <div>
      <div className="whack-hud">
        <span>SCORE: {score}</span>
        <span>⏱ {running ? time : GAME_SECONDS}s</span>
        <span>BEST: {best}</span>
      </div>

      <div className="whack-grid">
        {Array.from({ length: 9 }, (_, i) => (
          <button
            key={i}
            className="whack-cell"
            onClick={() => whack(i)}
            disabled={!running}
          >
            {active && active.i === i ? CRITTER_GLYPH[active.type] : ""}
          </button>
        ))}
      </div>

      <p className="whack-legend">🤑 +1 &nbsp; 💎 +5 &nbsp; 🧻 RUG −3</p>

      <div className="whack-footer">
        <button onClick={start}>
          {running ? "GRINDING..." : played ? "GRIND AGAIN" : "START GRINDING"}
        </button>
        <span className="whack-msg lore-font">
          {running
            ? "whack the guys. dodge the rugs."
            : played
              ? `GAME OVER — ${score}. ${rating}`
              : "how many can you whack in 20s?"}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- */
/* Page                                                          */
/* ------------------------------------------------------------- */
export default function Home() {
  // z-index ordering (click-to-front)
  const [zMap, setZMap] = useState<Record<string, number>>(() => {
    const base: Record<string, number> = {};
    WINDOWS.forEach((w, i) => (base[w.id] = 10 + i));
    return base;
  });
  const topZ = useRef(10 + WINDOWS.length);

  const bringToFront = useCallback((id: string) => {
    setZMap((prev) => {
      const maxNow = Math.max(...Object.values(prev));
      if (prev[id] === maxNow) return prev;
      topZ.current += 1;
      return { ...prev, [id]: topZ.current };
    });
  }, []);

  // which windows are open — all CLOSED by default (open via icon/taskbar).
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const base: Record<string, boolean> = {};
    WINDOWS.forEach((w) => (base[w.id] = false));
    return base;
  });
  const closeWindow = useCallback((id: string) => {
    setOpenMap((m) => ({ ...m, [id]: false }));
  }, []);
  const openWindow = useCallback(
    (id: string) => {
      setOpenMap((m) => (m[id] ? m : { ...m, [id]: true }));
      bringToFront(id);
    },
    [bringToFront],
  );

  const [startOpen, setStartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // confetti on load
  useEffect(() => {
    const c = setTimeout(blastConfetti, 250);
    return () => clearTimeout(c);
  }, []);

  // flashing tab title
  useEffect(() => {
    const titles = [
      "$TBILL — TokenizedRWASigmawojak69Hood",
      "⚠ NOT FINANCIAL ADVICE ⚠",
      "🧠 BRAINROT: MAXIMUM 🧠",
      "🤑 SIGMA GRINDSET ACTIVE 🤑",
    ];
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % titles.length;
      document.title = titles[i];
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const onBuy = useCallback(() => {
    blastConfetti();
    setShake(true);
    setTimeout(() => setShake(false), 480);
    showToast("Confetti deployed. Not financial advice. 🎉");
  }, [showToast]);

  const copyCA = useCallback(() => {
    navigator.clipboard?.writeText(CONTRACT_ADDRESS).catch(() => {});
    showToast("Contract address copied! (it does nothing)");
  }, [showToast]);

  const socials: { icon: string; label: string; href: string }[] = [
    { icon: "🐦", label: "Twitter / X", href: LINKS.twitter },
    { icon: "✈️", label: "Telegram", href: LINKS.telegram },
    { icon: "🚀", label: "Pons Listing", href: LINKS.pons },
    { icon: "📈", label: "Chart", href: LINKS.chart },
  ];
  const liveSocials = socials.filter((s) => has(s.href));

  const asSeenOn = [
    "BLOOMBERG TERMINAL (NOT REALLY)",
    "CNBC (WE WISH)",
    "SEC.GOV (THEY'RE WATCHING)",
    "YOUR MOM'S ROBINHOOD ACCOUNT",
  ];

  return (
    <>
      {/* ---------- Live trades top ticker ---------- */}
      <LiveTicker />

      <div className={`desktop${shake ? " shake" : ""}`}>
        {/* ---------- Desktop icons ---------- */}
        <div className="desktop-icons">
          {WINDOWS.map((w) => (
            <button
              key={w.id}
              className="desktop-icon"
              onClick={() => openWindow(w.id)}
              title={`Open ${TASKBAR_TABS[w.id]}`}
            >
              <span className="desktop-icon-glyph" aria-hidden="true">
                {ICON_GLYPHS[w.id]}
              </span>
              <span className="desktop-icon-label">{TASKBAR_TABS[w.id]}</span>
            </button>
          ))}
        </div>

        {/* ---------- Spinning 3D WordArt hero ---------- */}
        <WordArt3D />

        {/* ---------- Bouncing coin ---------- */}
        <BouncingCoin />

        {/* ---------- Window 1: main ---------- */}
        {openMap.main && (
          <Win
            cfg={WINDOWS[0]}
            z={zMap.main}
            onFocus={() => bringToFront("main")}
          >
            <TitleBar
              text="TokenizedRWASigmawojak69Hood.exe - Running on Robinhood Chain"
              onClose={() => closeWindow("main")}
            />
            <div className="window-body">
              <div className="wordmark">$TBILL</div>
              <div className="tagline">
                THE MOST TOKENIZED REAL WORLD ASSET THAT IS NOT A REAL WORLD
                ASSET
              </div>
              <button className="buy-btn" onClick={onBuy}>
                DEPLOY CONFETTI 🎉
              </button>
              <p className="nfa">
                $TBILL is a meme. the meme IS the utility. this is NOT financial
                advice (we are a guy in a durag, not your financial advisor),
                NOT an offer to buy anything, and NOT an investment. no roadmap,
                no promises, no because. it can — and spiritually wants to — go
                to zero. touch grass. DYOR, ser. 🤑
              </p>
              <Marquee>
                *** NOT FINANCIAL ADVICE *** ENTERTAINMENT ONLY *** $TBILL HAS NO
                UTILITY *** ROBINHOOD RWA DIVISION DENIES INVOLVEMENT *** MAY GO
                TO ZERO *** MAXIMUM CONFETTI *** DYOR ***
              </Marquee>
            </div>
          </Win>
        )}

        {/* ---------- Window 2: brainrot ---------- */}
        {openMap.brainrot && (
          <Win
            cfg={WINDOWS[1]}
            z={zMap.brainrot}
            onFocus={() => bringToFront("brainrot")}
          >
            <TitleBar
              text="brainrot_counter.exe"
              onClose={() => closeWindow("brainrot")}
            />
            <div className="window-body" style={{ textAlign: "center" }}>
              <BrainrotCounter />
            </div>
          </Win>
        )}

        {/* ---------- Window 3: lore (notepad) ---------- */}
        {openMap.lore && (
          <Win cfg={WINDOWS[2]} z={zMap.lore} onFocus={() => bringToFront("lore")}>
            <TitleBar
              text="lore.txt - Notepad"
              onClose={() => closeWindow("lore")}
            />
            <div className="window-body notepad">
              <textarea readOnly value={LORE} spellCheck={false} />
            </div>
          </Win>
        )}

        {/* ---------- Window 4: portfolio ---------- */}
        {openMap.portfolio && (
          <Win
            cfg={WINDOWS[3]}
            z={zMap.portfolio}
            onFocus={() => bringToFront("portfolio")}
          >
            <TitleBar
              text="portfolio_widget.exe"
              onClose={() => closeWindow("portfolio")}
            />
            <div className="window-body">
              <div className="sunken-panel" style={{ padding: 10 }}>
                <div style={{ fontWeight: "bold", fontSize: 12 }}>
                  VIBES INDEX &nbsp;•&nbsp; NOT A PRICE
                </div>
                <div className="big-green">VIBES: 📈 MAXIMUM</div>
                <Sparkline />
                <div className="disclaimer">
                  not a real chart, not a price, not performance, not financial
                  advice. we made this up for the bit.
                </div>
              </div>
            </div>
          </Win>
        )}

        {/* ---------- Window 5: socials ---------- */}
        {openMap.socials && (
          <Win
            cfg={WINDOWS[4]}
            z={zMap.socials}
            onFocus={() => bringToFront("socials")}
          >
            <TitleBar
              text="socials.exe"
              onClose={() => closeWindow("socials")}
            />
            <div className="window-body">
              {liveSocials.length === 0 && !CA_LIVE ? (
                <p className="lore-font" style={{ fontSize: 12, margin: "2px" }}>
                  gm. nothing here till we launch.
                </p>
              ) : (
                <>
                  <div className="social-grid">
                    {liveSocials.map((s) => (
                      <a
                        key={s.label}
                        className="social-cell"
                        href={s.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="social-icon">{s.icon}</span>
                        {s.label}
                      </a>
                    ))}
                    {CA_LIVE && (
                      <button
                        type="button"
                        className="social-cell"
                        onClick={copyCA}
                      >
                        <span className="social-icon">📋</span>
                        CA (copy)
                      </button>
                    )}
                  </div>
                  {CA_LIVE && (
                    <p
                      style={{
                        fontSize: 10,
                        marginBottom: 0,
                        marginTop: 8,
                        wordBreak: "break-all",
                      }}
                    >
                      CA: {CONTRACT_ADDRESS}
                    </p>
                  )}
                </>
              )}
            </div>
          </Win>
        )}

        {/* ---------- Window 6: as seen on ---------- */}
        {openMap.asseen && (
          <Win
            cfg={WINDOWS[5]}
            z={zMap.asseen}
            onFocus={() => bringToFront("asseen")}
          >
            <TitleBar
              text="as_seen_on.exe"
              onClose={() => closeWindow("asseen")}
            />
            <div className="window-body">
              <p style={{ marginTop: 0, fontSize: 11, fontWeight: "bold" }}>
                AS SEEN ON:
              </p>
              <div className="asseen-row">
                {asSeenOn.map((label) => (
                  <div key={label} className="asseen-chip">
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </Win>
        )}

        {/* ---------- Window 7: whack-a-jeet game ---------- */}
        {openMap.game && (
          <Win cfg={WINDOWS[6]} z={zMap.game} onFocus={() => bringToFront("game")}>
            <TitleBar
              text="whack-a-jeet.exe"
              onClose={() => closeWindow("game")}
            />
            <div className="window-body">
              <WhackAJeet />
            </div>
          </Win>
        )}

        {/* ---------- Window 8: FAQ (addendum) ---------- */}
        {openMap.faq && (
          <Win cfg={WINDOWS[7]} z={zMap.faq} onFocus={() => bringToFront("faq")}>
            <TitleBar
              text="faq.txt - Notepad"
              onClose={() => closeWindow("faq")}
            />
            <div className="window-body notepad">
              <textarea readOnly value={FAQ} spellCheck={false} />
            </div>
          </Win>
        )}


      </div>

      {/* ---------- Toast ---------- */}
      {toast && (
        <div className="toast window" role="status">
          <div className="title-bar">
            <div className="title-bar-text">🤑 Robinhood Chain</div>
          </div>
          <div className="window-body" style={{ fontSize: 12 }}>
            {toast}
          </div>
        </div>
      )}

      {/* ---------- Start menu ---------- */}
      {startOpen && (
        <div className="start-menu window">
          <div className="window-body" style={{ margin: 0 }}>
            <ul className="tree-view" style={{ margin: 0 }}>
              <li className="menu-item" onClick={() => setStartOpen(false)}>
                📁 My Overleveraged Documents
              </li>
              <li className="menu-item" onClick={onBuy}>
                🎉 Deploy Confetti
              </li>
              <li
                className="menu-item"
                onClick={() => {
                  showToast("Nothing happened. Told you.");
                  setStartOpen(false);
                }}
              >
                ⏻ Shut Down... (do not click, nothing happens)
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ---------- Taskbar ---------- */}
      <div className="taskbar">
        <button className="start-btn" onClick={() => setStartOpen((o) => !o)}>
          <span className="start-logo" />
          START
        </button>
        {WINDOWS.filter((w) => openMap[w.id]).map((w) => (
          <button
            key={w.id}
            className="taskbar-tab"
            onClick={() => openWindow(w.id)}
          >
            {TASKBAR_TABS[w.id]}
          </button>
        ))}
        <span className="taskbar-spacer" />
        <Clock />
      </div>
    </>
  );
}
