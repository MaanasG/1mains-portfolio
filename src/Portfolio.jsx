import { useState, useEffect, useRef } from "react";
import WaveformVisualization from "./components/WaveformVisualization";
import DATA from './portfolio-data.json';

const SocialIcons = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  twitch: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
    </svg>
  ),
  genius: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.5c.828 0 1.5.672 1.5 1.5S12.828 7.5 12 7.5 10.5 6.828 10.5 6s.672-1.5 1.5-1.5zm3.75 14.25h-7.5v-1.5h3v-6h-3v-1.5h4.5v7.5h3v1.5z"/>
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  ),
  store: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 3L2 9v12h7v-7h6v7h7V9L12 3zm0 2.236L20 10v9h-3v-7H7v7H4V10l8-4.764z"/>
    </svg>
  ),
};

function fmtStreams(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function Productions() {
  const prods = DATA.productions;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const stripRef = useRef(null);
  const prod = prods[idx];

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIdx(n => (n + 1) % prods.length), 5200);
    return () => clearInterval(id);
  }, [paused, idx, prods.length]);

  useEffect(() => {
    const strip = stripRef.current;
    const el = strip?.children[idx];
    if (!strip || !el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = el.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
  }, [idx]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const mark = () => strip.classList.toggle("is-overflow", strip.scrollWidth > strip.clientWidth + 2);
    mark();
    const ro = new ResizeObserver(mark);
    ro.observe(strip);
    return () => ro.disconnect();
  }, [prods.length]);

  const hold = () => setPaused(true);
  const release = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
  };

  return (
    <div
      className="prod-spotlight"
      onMouseEnter={hold}
      onMouseLeave={release}
      onFocus={hold}
      onBlur={release}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); setIdx(n => (n + 1) % prods.length); }
        if (e.key === "ArrowLeft") { e.preventDefault(); setIdx(n => (n - 1 + prods.length) % prods.length); }
      }}
    >
      <a
        className="prod-feature"
        href={prod.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span key={prod.id} className="prod-feature-inner yu-gothic">
          <span className="prod-feature-art">
            <img src={prod.cover} alt="" />
          </span>
          <span className="prod-feature-copy">
            <span className="prod-feature-artist">{prod.artist}</span>
            <span className="prod-feature-title">{prod.title}</span>
            <span className="prod-feature-year">{prod.year}</span>
          </span>
        </span>
      </a>

      <div className="prod-index" ref={stripRef} role="listbox" aria-label="productions">
        {prods.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="option"
            aria-selected={i === idx}
            aria-label={`${p.artist}, ${p.title}`}
            onClick={() => setIdx(i)}
          >
            <img src={p.cover} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}

function DawScroll() {
  const items = [...DATA.daws, ...DATA.daws, ...DATA.daws];
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let x = 0;
    let animId;
    const tick = () => {
      x -= 0.1;
      if (Math.abs(x) >= el.scrollWidth / 3) x = 0;
      el.style.transform = `translateX(${x}px)`;
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="w-full overflow-hidden">
      <div ref={ref} className="flex items-center gap-10 whitespace-nowrap will-change-transform">
        {items.map((d, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1 group">
            <img
              src={d.logo} alt={d.name}
              className="w-8 h-8 object-contain opacity-50 group-hover:opacity-90 transition-opacity duration-200"
              onError={e => { e.target.style.display = "none"; }}
            />
            <span className="text-white/30 text-xs group-hover:text-white/70 transition-colors duration-200">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BetaTools() {
  const items = Array.isArray(DATA.betaTools) ? DATA.betaTools : [];
  if (!items.length) return null;

  const textStyle = {
    fontSize: "0.55rem",
    fontWeight: 300,
    letterSpacing: "0.06em",
    color: "rgba(255,255,255,0.35)",
    textTransform: "lowercase",
    whiteSpace: "nowrap"
  };

  return (
    <div style={{ width: "100%", maxWidth: 520, marginBottom: "1.6rem", textAlign: "center" }}>
      <div className="yu-gothic" style={{ display: "flex", justifyContent: "center", gap: "30px", flexWrap: "wrap" }}>
        {items.map((t, idx) => {
          const label = t.label ?? "";
          if (t.url) {
            return (
              <a
                key={label || idx}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...textStyle,
                  textDecoration: "none",
                  transition: "color 0.2s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,220,150,0.9)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
              >
                {label}
              </a>
            );
          }
          return <span key={label || idx} style={textStyle}>{label}</span>;
        })}
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [count, setCount] = useState(0);
  const [waveform, setWaveform] = useState(new Array(32).fill(0));
  const [unmuted, setUnmuted] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const target = DATA.streamCount;
    const duration = 1800;
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.floor(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    const id = setTimeout(() => requestAnimationFrame(tick), 600);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !unmuted) return;

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;

    const src = ctx.createMediaElementSource(video);
    src.connect(analyser);
    analyser.connect(ctx.destination);
    video.muted = false;
    video.volume = 1;
    video.play();

    const data = new Uint8Array(analyser.frequencyBinCount);
    let animId;

    const update = () => {
      analyser.getByteFrequencyData(data);
      const wave = Array.from({ length: 32 }, (_, i) => {
        const si = Math.floor(Math.pow(i / 32, 1.5) * (data.length * 0.9));
        const comp = 1 + (i / 32) * 1.4;
        const scaled = (data[si] / 255) * 0.6;
        return Math.min(Math.pow(scaled, 1.2) * comp, 0.9);
      });
      setWaveform(wave);
      animId = requestAnimationFrame(update);
    };

    ctx.resume().then(update);
    return () => { cancelAnimationFrame(animId); ctx.close(); };
  }, [unmuted]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Yu+Gothic+UI:wght@300;400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #000;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .yu-gothic {
          font-family: 'Yu Gothic UI', 'Yu Gothic', 'YuGothic', 'Hiragino Kaku Gothic ProN', sans-serif;
        }

        .name-text {
          font-family: 'Yu Gothic UI', 'Yu Gothic', 'YuGothic', sans-serif;
          font-size: clamp(3.5rem, 10vw, 7rem);
          font-weight: 300;
          letter-spacing: -0.10em;
          line-height: 1.2;
          color: #fff;
          text-shadow:
            0 0 6px rgba(255,255,255,0.9),
            0 0 12px rgba(255,200,80,0.6),
            0 0 28px rgba(255,160,40,0.45),
            0 0 60px rgba(255,140,20,0.25);
        }

        .name-one { color: rgba(255,255,255,0.45); }

        .glass-card {
          background: linear-gradient(135deg,
            rgba(255,255,255,0.08) 0%,
            rgba(255,255,255,0.04) 50%,
            rgba(255,200,80,0.06) 100%
          );
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 16px;
        }

        .video-bg {
          position: fixed;
          inset: 0;
          height: 80vh;
          z-index: 0;
          overflow: hidden;
        }

        .video-bg video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top;
          opacity: 0.7;
          mix-blend-mode: luminosity;
          filter: saturate(1.3) brightness(0.75);
        }

        .video-fade {
          position: fixed;
          inset: 0;
          height: 80vh;
          z-index: 1;
          background: linear-gradient(to bottom,
            transparent 0%,
            rgba(0,0,0,0.15) 25%,
            rgba(0,0,0,0.4) 50%,
            rgba(0,0,0,0.75) 75%,
            #000 100%
          );
        }

        .ambient-glow {
          position: absolute;
          top: 15vh;
          left: 50%;
          transform: translateX(-50%);
          width: 500px;
          height: 300px;
          background: radial-gradient(ellipse, rgba(230,140,30,0.12) 0%, transparent 70%);
          z-index: 2;
          pointer-events: none;
        }

        .content {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 20px 48px;
        }

        .social-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          color: rgba(255,255,255,0.35);
          transition: transform 0.25s ease;
        }

        .social-link svg, .social-link img {
          width: 30px;
          height: 30px;
          opacity: 0.5;
          filter: invert(1) opacity(0.45);
          transition: all 0.25s ease;
          animation: iconPulse 5s ease-in-out infinite;
        }

        .social-link span {
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(6px);
          transition: all 0.25s ease;
        }

        .social-link:hover svg, .social-link:hover img {
          opacity: 1;
          filter: drop-shadow(0 0 6px rgba(255,180,60,0.7)) drop-shadow(0 0 14px rgba(255,160,40,0.45));
          color: #fbbf24;
          transform: scale(1.12);
        }

        .social-link:hover span {
          opacity: 1;
          transform: translateY(0);
          color: rgba(255,220,150,0.9);
        }

        .social-link:hover { transform: translateY(-3px); }

        .cta-link svg, .cta-link img {
          width: 38px !important;
          height: 38px !important;
        }

        .divider {
          width: 40px;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent);
        }

        .stats-row {
          --cover: 92px;
          display: flex;
          align-items: flex-start;
        }

        .stream-count {
          height: var(--cover);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 520px) {
          .stats-row {
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
          }
          .stats-row > div:last-child {
            padding-left: 0 !important;
            width: 100%;
          }
          .stats-row > div:last-child .section-label { text-align: center; }
          .stream-count { height: auto; }
          .prod-feature-inner { width: 100%; justify-content: center; }
          .prod-feature-copy { flex: 0 1 auto; max-width: calc(100% - 106px); }
          .stats-divider-v { display: none; }
          .stats-divider-h {
            display: block !important;
            width: 40px;
            height: 1px;
            background: linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent);
          }
        }

        .prod-spotlight {
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 0;
          outline: none;
        }

        .prod-feature {
          display: block;
          text-decoration: none;
          min-width: 0;
        }

        .prod-feature-inner {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          animation: prodIn 560ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .prod-feature-art {
          width: var(--cover);
          height: var(--cover);
          flex-shrink: 0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 0 28px rgba(255, 150, 30, 0.16);
        }

        .prod-feature-art img,
        .prod-index img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .prod-feature-copy {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .prod-feature-artist {
          font-size: 0.84rem;
          font-weight: 300;
          letter-spacing: 0.02em;
          color: rgba(255,255,255,0.92);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .prod-feature-title {
          font-size: 0.68rem;
          font-weight: 300;
          letter-spacing: 0.08em;
          color: rgba(251,191,36,0.78);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .prod-feature-year {
          margin-top: 2px;
          font-size: 0.55rem;
          font-weight: 300;
          letter-spacing: 0.16em;
          color: rgba(255,255,255,0.32);
        }

        .prod-index {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 2px 1px 4px;
          min-width: 0;
        }

        .prod-index::-webkit-scrollbar { display: none; }

        .prod-index.is-overflow {
          mask-image: linear-gradient(90deg, transparent, #000 16px, #000 calc(100% - 16px), transparent);
        }

        .prod-index button {
          flex: 0 0 36px;
          width: 36px;
          height: 36px;
          padding: 0;
          border: 0;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          opacity: 0.38;
          background: transparent;
          transition: opacity 0.35s ease, box-shadow 0.35s ease, transform 0.35s ease;
        }

        .prod-index button:hover { opacity: 0.85; }

        .prod-index button[aria-selected="true"] {
          opacity: 1;
          box-shadow: 0 0 0 1px rgba(251,191,36,0.75), 0 0 14px rgba(255,160,40,0.4);
        }

        @keyframes prodIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .prod-feature-inner { animation: none; }
        }

        .section-label {
          font-family: 'Yu Gothic UI', 'Yu Gothic', 'YuGothic', sans-serif;
          font-size: 1rem;
          font-weight: 300;
          letter-spacing: -0.05em;
          text-transform: lowercase;
          color: rgba(255,255,255,0.3);
        }

        .horizontal-smear { position: relative; display: inline-block; color: #fff; }
        .horizontal-smear::after {
          content: "1";
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.4) 10%,
            rgba(251,191,36,0.2) 20%
          );
          -webkit-background-clip: text;
          background-clip: text;
          transform-origin: center;
          animation: smearX 4s steps(2) infinite;
          mix-blend-mode: screen;
          filter: blur(0.4px);
          pointer-events: none;
          z-index: -1;
        }

        @keyframes smearX {
          0%, 90%, 100% { transform: scaleX(1); opacity: 0; }
          92% { transform: scaleX(15); opacity: 0.8; color: rgba(251,191,36,0.5); }
          94% { transform: scaleX(50); opacity: 0.4; filter: brightness(2) contrast(2); }
          96% { transform: scaleX(5); opacity: 0.9; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        @keyframes iconPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.6; }
        }

        .float-anim { animation: float 4s ease-in-out infinite; }
      `}</style>

      <div className="video-bg">
        <video ref={videoRef} autoPlay loop playsInline muted>
          <source src="/bg.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="video-fade" />
      <div className="ambient-glow" />

      <div className="content">
        <div className="float-anim" style={{ marginTop: "18vh", marginBottom: "2.5rem", textAlign: "center", position: "relative" }}>
          {!unmuted && (
            <div
              onClick={() => setUnmuted(true)}
              className="yu-gothic"
              style={{
                position: "absolute",
                top: "-40px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "rgba(255,255,255,0.3)",
                fontSize: "0.55rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.4s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "rgba(255,200,100,0.7)";
                e.currentTarget.style.letterSpacing = "0.4em";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "rgba(255,255,255,0.3)";
                e.currentTarget.style.letterSpacing = "0.3em";
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.8 }}>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              <span>enable audio signal</span>
            </div>
          )}

          <div style={{ display: "inline-block", transform: "translateX(0.18em)" }}>
            <h1 className="name-text" style={{ display: "inline-block" }}>
              <span className="name-one">
                <span className="horizontal-smear">1</span>
              </span>mains
            </h1>
            <WaveformVisualization waveform={waveform} isActive={true} color="amber" />
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
            <div className="yu-gothic" style={{ padding: "3px 16px", fontSize: "1.5rem", fontWeight: 300, letterSpacing: "-0.05em", color: "rgba(255,255,255,0.4)" }}>
              producer · artist · sound designer
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem", alignItems: "center" }}>
          {DATA.socials.map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="social-link" title={s.name}>
              <img src={s.icon} alt={s.name} />
            </a>
          ))}
        </div>

        <div className="yu-gothic" style={{ display: "flex", gap: "20px", marginBottom: "2.5rem", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          {DATA.links.map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="social-link cta-link">
              <img src={l.icon} alt={l.label} />
              <span>{l.label}</span>
            </a>
          ))}
        </div>

        <div className="divider" style={{ marginBottom: ".5rem" }} />

        <div className="stats-row" style={{ width: "100%", maxWidth: 700, marginBottom: "0.8rem" }}>
          <div style={{ textAlign: "center", flex: "0 0 auto", padding: "0 28px" }}>
            <div className="section-label" style={{ marginBottom: "0.85rem" }}>total streams</div>
            <div className="stream-count yu-gothic" style={{
              fontSize: "1.8rem",
              fontWeight: 300,
              letterSpacing: "-0.05em",
              color: "#fff",
              textShadow: "0 0 8px rgba(255,255,255,0.7), 0 0 20px rgba(255,180,40,0.35), 0 0 45px rgba(255,140,20,0.18)",
            }}>
              {fmtStreams(count)}
            </div>
          </div>

          <div className="stats-divider-v" style={{ width: "1px", alignSelf: "stretch", background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent)", flexShrink: 0 }} />
          <div className="stats-divider-h" style={{ display: "none" }} />

          <div style={{ flex: 1, minWidth: 0, paddingLeft: "24px" }}>
            <div className="section-label" style={{ marginBottom: "0.85rem" }}>productions</div>
            <Productions />
          </div>
        </div>

        <BetaTools />

        <div style={{ width: "100%", maxWidth: 520, marginBottom: ".5rem" }}>
          <div className="section-label" style={{ textAlign: "center", marginBottom: "1rem" }}>tools</div>
          <DawScroll />
        </div>
      </div>
    </>
  );
}