import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import SamplePlayer from "./components/SamplePlayer";
import { warmTracks } from "./components/samplePeaks";
import DATA from "./portfolio-data.json";
import SAMPLES from "virtual:samples";
import BEATS from "virtual:beats";
import REELS from "virtual:reels";

function fmtStreams(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function youtubeId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let id = null;
    if (host === "youtu.be") id = parsed.pathname.slice(1);
    else if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (parsed.pathname.startsWith("/embed/") || parsed.pathname.startsWith("/shorts/")) id = parsed.pathname.split("/")[2];
      else id = parsed.searchParams.get("v");
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function loadYouTubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise(resolve => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    if (!document.getElementById("yt-iframe-api")) {
      const script = document.createElement("script");
      script.id = "yt-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });
}

function WorkBackdrop({ item }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const fileRef = useRef(null);
  const rootRef = useRef(null);
  const nearRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [armed, setArmed] = useState(false);
  const [near, setNear] = useState(false);
  const yt = item ? youtubeId(item.video) : null;
  const portrait = Boolean(item?.video && /\/shorts\//.test(item.video));
  const file = Boolean(item?.video && !yt && (item.video.startsWith("/") || /\.(mp4|webm)(\?|$)/i.test(item.video)));
  const itemKey = item?.id || item?.video || "";
  const [seenKey, setSeenKey] = useState(itemKey);
  if (itemKey !== seenKey) {
    setSeenKey(itemKey);
    setPlaying(false);
  }

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting;
      nearRef.current = visible;
      setNear(visible);
      if (visible) setArmed(true);
    }, { rootMargin: "240px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!armed || !yt) return undefined;
    let dead = false;
    loadYouTubeAPI().then(() => {
      if (dead || !hostRef.current || !window.YT?.Player) return;
      playerRef.current?.destroy?.();
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId: yt,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          rel: 0,
          loop: 1,
          playlist: yt,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          cc_load_policy: 0,
        },
        events: {
          onReady: (event) => {
            event.target.mute();
            if (nearRef.current) event.target.playVideo();
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) setPlaying(true);
            if (event.data === window.YT.PlayerState.ENDED) event.target.playVideo();
          },
        },
      });
    });
    return () => {
      dead = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [armed, yt]);

  useEffect(() => {
    nearRef.current = near;
    const player = playerRef.current;
    if (player?.playVideo) {
      if (near) player.playVideo();
      else player.pauseVideo?.();
    }
    const video = fileRef.current;
    if (!video) return;
    if (near) video.play().catch(() => {});
    else video.pause();
  }, [near]);

  if (!item) return null;

  return (
    <div ref={rootRef} className={`work-bg${portrait ? " is-portrait" : ""}${item?.more ? " is-profile" : ""}`} aria-hidden="true">
      {(yt || file) && armed && (
        <div className="work-bg-media">
          {yt && (
            <div className="work-bg-yt" key={yt}>
              <div ref={hostRef} />
            </div>
          )}
          {file && (
            <video
              ref={fileRef}
              key={item.video}
              src={item.video}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onPlaying={() => setPlaying(true)}
            />
          )}
        </div>
      )}
      {item.cover && <img className={playing ? "is-hidden" : ""} src={item.cover} alt="" />}
      <div className="work-bg-fade" />
    </div>
  );
}

const geniusProfile = DATA.socials.find(s => /genius/i.test(s.name));
const moreProduction = geniusProfile?.image
  ? { id: "more", more: true, url: geniusProfile.url, cover: geniusProfile.image }
  : null;
const productionItems = moreProduction ? [...DATA.productions, moreProduction] : DATA.productions;

function Productions({ onActive }) {
  const prods = DATA.productions;
  const items = productionItems;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const stripRef = useRef(null);
  const prod = items[idx];

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIdx(n => (n + 1) % items.length), 5200);
    return () => clearInterval(id);
  }, [paused, idx, items.length]);

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
  }, [items.length]);

  useEffect(() => {
    onActive?.(items[idx]);
  }, [idx, onActive, items]);

  const hold = () => setPaused(true);
  const release = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
  };

  return (
    <div
      className={`prod-spotlight${paused ? " is-held" : ""}`}
      onMouseEnter={hold}
      onMouseLeave={release}
      onFocus={hold}
      onBlur={release}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); setIdx(n => (n + 1) % items.length); }
        if (e.key === "ArrowLeft") { e.preventDefault(); setIdx(n => (n - 1 + items.length) % items.length); }
      }}
    >
      <div className="prod-feature-stack">
        <a
          key={prod.id}
          className={`${prod.more ? "prod-feature is-more" : "prod-feature"} is-active`}
          href={prod.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="prod-feature-inner">
            {prod.more ? (
              <span className="prod-feature-copy">
                <span className="prod-meta">
                  <span>genius</span>
                  <span className="prod-meta-rule" />
                  <span>credits</span>
                </span>
                <span className="prod-more-title">And more!</span>
                <span className="prod-open">open profile</span>
              </span>
            ) : (
              <>
                <span className="prod-feature-art">
                  <span className="prod-feature-shot">
                    <img src={prod.cover} alt="" decoding="async" />
                  </span>
                  <span className="prod-corners" aria-hidden="true" />
                </span>
                <span className="prod-feature-copy">
                  <span className="prod-meta">
                    <span>{String(idx + 1).padStart(2, "0")} / {String(prods.length).padStart(2, "0")}</span>
                    <span className="prod-meta-rule" />
                    <span>production</span>
                  </span>
                  <span className="prod-feature-artist">{prod.artist}</span>
                  <span className="prod-feature-title">{prod.title}</span>
                  <span className="prod-feature-year">{prod.year}</span>
                  <span className="prod-open">listen</span>
                </span>
              </>
            )}
          </span>
        </a>
      </div>
      <div className="prod-progress" key={prod.id} />

      <div className="prod-index" ref={stripRef} role="listbox" aria-label="productions">
        {items.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="option"
            className={p.more ? "is-more" : undefined}
            aria-selected={i === idx}
            aria-label={p.more ? "And more on Genius" : `${p.artist}, ${p.title}`}
            onClick={() => setIdx(i)}
          >
            <img src={p.cover} alt="" decoding="async" />
            {p.more && <span>more</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function DawScroll() {
  const items = [...DATA.daws, ...DATA.daws];
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      el.classList.toggle("is-on", entry.isIntersecting);
    }, { rootMargin: "80px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`daw-track flex items-center gap-12 whitespace-nowrap`} ref={ref}>
      {items.map((d, i) => (
        <div key={`${d.name}-${i}`} className="flex-shrink-0 flex flex-col items-center gap-2">
          <img
            src={d.logo}
            alt={d.name}
            className="w-8 h-8 object-contain opacity-55"
            decoding="async"
            onError={e => { e.target.style.display = "none"; }}
          />
          <span className="text-white/35 text-[0.68rem] tracking-[0.14em] uppercase">{d.name}</span>
        </div>
      ))}
    </div>
  );
}

function ReelColumns({ items }) {
  const ref = useRef(null);
  const files = items.filter(item => item.type === "file");

  useEffect(() => {
    const root = ref.current;
    const frame = root?.parentElement;
    if (!root || !frame) return;
    const videos = [...root.querySelectorAll("video")];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let sectionOn = false;
    let scrolling = false;
    let scrollTimer = 0;

    const apply = () => {
      const allow = sectionOn && !scrolling && !motion.matches;
      videos.forEach(video => {
        if (allow && video.dataset.on === "1") video.play().catch(() => {});
        else video.pause();
      });
    };

    const clip = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.dataset.on = entry.isIntersecting ? "1" : "0";
      });
      apply();
    }, { root: frame, threshold: 0.2, rootMargin: "8% 0px" });
    videos.forEach(video => clip.observe(video));

    const section = new IntersectionObserver(([entry]) => {
      sectionOn = entry.isIntersecting;
      frame.classList.toggle("is-live", sectionOn);
      apply();
    }, { threshold: 0.12 });
    section.observe(frame);

    const onScroll = () => {
      if (!scrolling) {
        scrolling = true;
        apply();
      }
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        scrolling = false;
        apply();
      }, 140);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clip.disconnect();
      section.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(scrollTimer);
      videos.forEach(video => video.pause());
    };
  }, [files.length]);

  if (!files.length) {
    return <p className="reel-empty">Drop clips into the reels folder, or add reel links to reels/links.txt.</p>;
  }

  const columns = [0, 1, 2].map(col => {
    const picked = [];
    for (let step = 0; picked.length < 4; step += 1) picked.push(files[(col + step * 3) % files.length]);
    return picked;
  });
  const eagerSrc = new Set();

  return (
    <div className="reel-columns" ref={ref} aria-label="reels">
      {columns.map((col, i) => (
        <div className="reel-col" key={i}>
          <div className="reel-track" style={{ "--reel-dur": `${48 + i * 12}s`, "--reel-delay": `${-i * 8}s` }}>
            {[...col, ...col].map((item, j) => {
              const lead = !eagerSrc.has(item.src);
              if (lead) eagerSrc.add(item.src);
              return (
                <video
                  key={`${item.id}-${j}`}
                  src={item.src}
                  muted
                  loop
                  playsInline
                  preload={lead ? "auto" : "metadata"}
                  aria-label={item.name}
                  onLoadedData={(e) => e.currentTarget.classList.add("is-ready")}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function BetaTools() {
  const items = Array.isArray(DATA.betaTools) ? DATA.betaTools : [];
  if (!items.length) return null;

  return (
    <div className="beta-row">
      {items.map((t, idx) => (
        t.url ? (
          <a key={t.label || idx} href={t.url} target="_blank" rel="noopener noreferrer">
            {t.label}
          </a>
        ) : (
          <span key={t.label || idx}>{t.label}</span>
        )
      ))}
    </div>
  );
}

function useReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nodes = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

function CursorGlow() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    if (reduce.matches || coarse.matches) return;
    const ctx = canvas.getContext("2d");
    const marks = [];
    let dpr = 1;
    let raf = 0;
    let primed = false;
    let lastX = 0;
    let lastY = 0;

    const fit = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();

    const spawn = (x, y) => {
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const hot = Math.random() > 0.65;
        marks.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y + (i - (count - 1) / 2) * 7 + (Math.random() - 0.5) * 4,
          len: 5 + Math.random() * (hot ? 16 : 9),
          life: 1,
          decay: 0.008 + Math.random() * 0.007,
          hot,
        });
      }
      if (marks.length > 260) marks.splice(0, marks.length - 260);
    };

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.lineCap = "butt";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "rgba(255, 140, 32, 0.9)";
      for (let i = marks.length - 1; i >= 0; i--) {
        const mark = marks[i];
        mark.life -= mark.decay;
        if (mark.life <= 0) {
          marks.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = mark.life * mark.life;
        ctx.strokeStyle = mark.hot ? "rgba(255, 244, 220, 0.98)" : "rgba(255, 176, 54, 0.95)";
        ctx.lineWidth = mark.hot ? 1.6 : 1.15;
        ctx.beginPath();
        ctx.moveTo(mark.x - mark.len * 0.5, mark.y);
        ctx.lineTo(mark.x + mark.len * 0.5, mark.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = marks.length ? requestAnimationFrame(draw) : 0;
    };

    const move = (event) => {
      const x = event.clientX;
      const y = event.clientY;
      canvas.classList.add("is-on");
      if (!primed) {
        lastX = x;
        lastY = y;
        primed = true;
        return;
      }
      let dx = x - lastX;
      let dy = y - lastY;
      let dist = Math.hypot(dx, dy);
      const gap = 22;
      while (dist >= gap) {
        const step = gap / dist;
        lastX += dx * step;
        lastY += dy * step;
        spawn(lastX, lastY);
        dx = x - lastX;
        dy = y - lastY;
        dist = Math.hypot(dx, dy);
      }
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const hide = () => canvas.classList.remove("is-on");
    window.addEventListener("pointermove", move);
    window.addEventListener("resize", fit);
    document.documentElement.addEventListener("mouseleave", hide);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("resize", fit);
      document.documentElement.removeEventListener("mouseleave", hide);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas className="cursor-glow" ref={ref} aria-hidden="true" />;
}

const HERO_VIDEO_START = 2;

function whenHeroReady(video) {
  return new Promise(resolve => {
    if (!video) { resolve(); return; }
    const check = () => {
      if (video.readyState >= 2 && video.currentTime >= HERO_VIDEO_START - 0.5) {
        video.removeEventListener("loadeddata", check);
        video.removeEventListener("canplay", check);
        video.removeEventListener("seeked", check);
        resolve();
      }
    };
    video.addEventListener("loadeddata", check);
    video.addEventListener("canplay", check);
    video.addEventListener("seeked", check);
    check();
  });
}

function whenReelReady(video) {
  return new Promise(resolve => {
    if (video.readyState >= 2) { resolve(); return; }
    const finish = () => {
      video.removeEventListener("loadeddata", finish);
      video.removeEventListener("error", finish);
      resolve();
    };
    video.addEventListener("loadeddata", finish);
    video.addEventListener("error", finish);
  });
}

function BootLoader({ heroRef, onDone }) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let dead = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    const body = document.body;
    const previousRoot = root.style.overflow;
    const previousBody = body.style.overflow;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    const app = document.getElementById("root");
    app?.setAttribute("inert", "");
    const unlock = () => {
      root.style.overflow = previousRoot;
      body.style.overflow = previousBody;
      app?.removeAttribute("inert");
    };

    const sampleSrcs = SAMPLES.flatMap(group => (group.tracks || []).map(track => track.src));
    const reelVideos = [...document.querySelectorAll(".reel-columns video")];
    const leadReels = [];
    const seen = new Set();
    reelVideos.forEach(video => {
      const src = video.getAttribute("src");
      if (!src || seen.has(src)) return;
      seen.add(src);
      leadReels.push(video);
    });

    let hero = 0;
    let reels = 0;
    let audio = 0;
    const reelTotal = Math.max(leadReels.length, 1);
    const audioTotal = Math.max(sampleSrcs.length, 1);
    const publish = () => {
      if (!dead) setProgress(Math.min(1, hero * 0.4 + (reels / reelTotal) * 0.3 + (audio / audioTotal) * 0.3));
    };
    if (!leadReels.length) reels = reelTotal;
    if (!sampleSrcs.length) audio = audioTotal;
    publish();

    const finish = () => {
      if (dead) return;
      dead = true;
      setProgress(1);
      setLeaving(true);
      leaveTimer = window.setTimeout(() => {
        unlock();
        onDone();
      }, reduce ? 0 : 680);
    };

    let leaveTimer = 0;
    const timeout = window.setTimeout(finish, 12000);
    const warming = warmTracks(sampleSrcs, () => { audio += 1; publish(); });

    Promise.all([
      whenHeroReady(heroRef.current).then(() => { hero = 1; publish(); }),
      Promise.all(leadReels.map(video => whenReelReady(video).then(() => { reels += 1; publish(); }))),
      warming,
    ]).then(() => {
      window.clearTimeout(timeout);
      finish();
    });

    return () => {
      dead = true;
      warming.cancel?.();
      window.clearTimeout(timeout);
      window.clearTimeout(leaveTimer);
      unlock();
    };
  }, [heroRef, onDone]);

  return createPortal(
    <div className={leaving ? "boot is-leaving" : "boot"} role="status" aria-live="polite" aria-label="Loading">
      <img className="boot-mark" src="/favicon.svg" alt="" />
      <p className="boot-name">1mains</p>
      <span className="boot-line" aria-hidden="true"><span style={{ width: `${Math.round(progress * 100)}%` }} /></span>
    </div>,
    document.body,
  );
}

export default function Portfolio() {
  const [count, setCount] = useState(0);
  const [activeProd, setActiveProd] = useState(DATA.productions[0]);
  const heroRef = useRef(null);
  const [catalog, setCatalog] = useState("samples");
  const [booting, setBooting] = useState(true);
  const finishBoot = useCallback(() => setBooting(false), []);
  const store = DATA.links.find(l => /store/i.test(l.label));
  const archive = DATA.links.find(l => /telegram/i.test(l.label));
  useReveal();

  useEffect(() => {
    const video = heroRef.current;
    if (!video) return undefined;
    const cue = () => {
      if (video.currentTime < 0.35) video.currentTime = HERO_VIDEO_START;
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= 0.25) video.play().catch(() => {});
      else video.pause();
    }, { threshold: [0, 0.25] });
    video.addEventListener("loadedmetadata", cue);
    video.addEventListener("seeked", cue);
    io.observe(video);
    return () => {
      video.removeEventListener("loadedmetadata", cue);
      video.removeEventListener("seeked", cue);
      io.disconnect();
    };
  }, []);

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

  const streamsLabel = fmtStreams(count);

  return (
    <>
      {booting && <BootLoader heroRef={heroRef} onDone={finishBoot} />}
      <CursorGlow />
      <header className="topbar" id="top">
        <div className="topbar-left">
          <a className="brand" href="#top" aria-label="1mains">
            <img src="/favicon.svg" alt="" />
          </a>
          <nav className="topnav" aria-label="primary">
            <a href="#work">Work</a>
            <a href="#reels">Reels</a>
            <a href="#about">About</a>
            {store && (
              <a href={store.url} target="_blank" rel="noopener noreferrer">Store</a>
            )}
            <a href="#contact">Contact</a>
          </nav>
        </div>
        <div className="topbar-right">
          <div className="topbar-socials">
            {DATA.socials.map(s => (
              <a key={s.name} className="icon-btn" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}>
                <img src={s.icon} alt="" />
              </a>
            ))}
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-media" aria-hidden="true">
          <video ref={heroRef} autoPlay loop playsInline muted preload="auto" fetchPriority="high">
            <source src="/bg.mp4" type="video/mp4" />
          </video>
          <div className="hero-shade" />
        </div>
        <div className="hero-copy">
          <h1 className="wordmark">
            <span className="wordmark-one"><span className="horizontal-smear">1</span></span>
            <span>mains</span>
          </h1>
          <p className="eyebrow">producer · artist · sound designer</p>
          <a className="scroll-cue" href="#previews">
            <span className="scroll-rule" />
            Scroll
          </a>
        </div>
      </section>

      <main>
        <section className="band preview-band" id="previews">
          <div className="preview-layout">
            <div className="preview-main reveal">
              <p className="band-kicker">previews</p>
              <div className="catalog-switch" role="tablist" aria-label="preview catalog">
                <button type="button" role="tab" aria-selected={catalog === "samples"} onClick={() => setCatalog("samples")}>samples</button>
                <button type="button" role="tab" aria-selected={catalog === "beats"} onClick={() => setCatalog("beats")}>beats</button>
              </div>
              <SamplePlayer
                key={catalog}
                groups={catalog === "beats" ? BEATS : SAMPLES}
                empty={catalog === "beats" ? "Drop audio files into the beats folder." : "Drop audio files into the samples folder."}
              />
              {(catalog === "beats" ? store : archive) && (
                <a
                  className="sample-more"
                  href={catalog === "beats" ? store.url : archive.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {catalog === "beats" ? "beat store →" : "samples archive →"}
                </a>
              )}
            </div>
            <div className="preview-reels" id="reels">
              <ReelColumns items={REELS} />
            </div>
          </div>
        </section>

        <section className="band work-band" id="work">
          <WorkBackdrop item={activeProd} />
          <div className="work-layout reveal">
            <div>
              <p className="band-kicker">productions</p>
              <Productions onActive={setActiveProd} />
            </div>
            <div className="streams">
              <p className="band-kicker">total streams</p>
              <div className="stream-figure">
                <span className="horizontal-smear" data-text={streamsLabel}>{streamsLabel}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="band tools-band" id="tools">
          <div className="tools-layout reveal">
            <div>
              <p className="band-kicker">tools</p>
              <div className="tool-marquee">
                <DawScroll />
              </div>
            </div>
            <div className="tools-links">
              <p className="band-kicker">links</p>
              <BetaTools />
            </div>
          </div>
        </section>

        <section className="band" id="about">
          <p className="band-kicker">about</p>
          <div className="about-layout reveal">
            <a className="about-photo-link" href="https://www.maanasgopi.com" target="_blank" rel="noopener noreferrer" aria-label="Maanas Gopi">
              <img className="about-photo" src={DATA.about.image} alt="" decoding="async" loading="lazy" />
            </a>
            <div className="about-copy">
              {DATA.about.paragraphs.map(text => (
                <p key={text}>
                  {text.startsWith("Maanas Gopi") ? (
                    <>
                      <a className="about-name" href="https://www.maanasgopi.com" target="_blank" rel="noopener noreferrer">Maanas Gopi</a>
                      {text.slice("Maanas Gopi".length)}
                    </>
                  ) : text}
                </p>
              ))}
              <a className="about-genius" href={geniusProfile?.url || "https://genius.com/artists/1mains"} target="_blank" rel="noopener noreferrer">Genius →</a>
            </div>
          </div>
        </section>

        <section className="band contact-band" id="contact">
          <p className="band-kicker">contact</p>
          <div className="contact-marks reveal">
            {[
              ...DATA.socials.map(s => ({ name: s.name, url: s.url, icon: s.icon })),
              ...DATA.links.filter(l => l.icon).map(l => ({ name: l.label, url: l.url, icon: l.icon, note: l.description })),
            ].map(item => (
              <a key={item.name} className="contact-mark" href={item.url} target="_blank" rel="noopener noreferrer">
                <img src={item.icon} alt="" />
                <span>
                  {item.name}
                  {item.note && <small>{item.note}</small>}
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer className="colophon">1mains</footer>
    </>
  );
}
