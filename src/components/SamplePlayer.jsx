import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { decodeTrack } from "./samplePeaks";

function fmtTime(s) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function drawWave(canvas, peaks, progress) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h || !peaks?.length) return;
  const pw = Math.floor(w * dpr);
  const ph = Math.floor(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const gap = 2;
  const barW = Math.max(1.25, (w - gap * (peaks.length - 1)) / peaks.length);
  peaks.forEach((p, i) => {
    const bh = Math.max(2, p * (h - 4));
    const x = i * (barW + gap);
    const played = (i + 0.5) / peaks.length <= progress;
    ctx.fillStyle = played ? "#ffe4b0" : "rgba(255, 156, 48, 0.42)";
    ctx.fillRect(x, (h - bh) / 2, barW, bh);
  });
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2 1.1c0-.7.8-1.2 1.4-.8l7 4.9c.5.4.5 1.2 0 1.6l-7 4.9c-.6.4-1.4-.1-1.4-.8V1.1z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <rect x="1.5" y="1" width="3" height="10" rx="1" />
      <rect x="7.5" y="1" width="3" height="10" rx="1" />
    </svg>
  );
}

const WASHES = [
  "rgba(255, 168, 48, 0.12)",
  "rgba(255, 104, 32, 0.1)",
  "rgba(255, 206, 112, 0.08)",
  "rgba(226, 86, 40, 0.11)",
];

function trackMeta(name) {
  const tags = [];
  const bpm = name.match(/(\d+)\s*bpm/i);
  if (bpm) tags.push(`${bpm[1]} bpm`);
  for (const match of name.matchAll(/\(([^)]+)\)/g)) {
    if (/bpm/i.test(match[1])) continue;
    match[1].split(",").forEach(part => {
      const clean = part.trim();
      if (clean) tags.push(clean);
    });
  }
  let title = name.replace(/!+/g, " ").replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  title = title.replace(/^1mains\s*[-–—]\s*/i, "").trim();
  return { title: title || name, tags: tags.slice(0, 4) };
}

export default function SamplePlayer({ groups = [], empty = "Drop audio files into the samples folder." }) {
  const tracks = useMemo(() => groups.flatMap(g => g.tracks || []), [groups]);
  const audioRef = useRef(null);
  const panelRef = useRef(null);
  const loadedId = useRef(null);
  const [currentId, setCurrentId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [liveDuration, setLiveDuration] = useState(0);
  const [decoded, setDecoded] = useState({});

  const current = tracks.find(t => t.id === currentId) || null;
  const duration = liveDuration || current?.duration || 0;
  const progress = duration ? Math.min(1, time / duration) : 0;

  useEffect(() => {
    document.body.classList.toggle("player-open", Boolean(current));
    return () => document.body.classList.remove("player-open");
  }, [current]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return undefined;
    let cancel = false;
    let started = false;
    const run = async () => {
      for (const track of tracks) {
        if (cancel) return;
        if (track.peaks) continue;
        try {
          const meta = await decodeTrack(track.src);
          if (!cancel) setDecoded(prev => prev[track.src] ? prev : { ...prev, [track.src]: meta });
        } catch {
          /* waveform stays empty if a file can't be read */
        }
      }
    };
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      const start = () => { if (!cancel) run(); };
      if (window.requestIdleCallback) window.requestIdleCallback(start, { timeout: 1200 });
      else window.setTimeout(start, 400);
    }, { rootMargin: "160px 0px" });
    io.observe(panel);
    return () => {
      cancel = true;
      io.disconnect();
    };
  }, [tracks]);

  useEffect(() => {
    document.querySelectorAll(".sample-wave").forEach(canvas => {
      const id = canvas.dataset.id;
      const track = tracks.find(t => t.id === id);
      const peaks = track?.peaks || decoded[track?.src]?.peaks;
      if (!peaks) return;
      drawWave(canvas, peaks, id === currentId ? progress : 0);
    });
  }, [currentId, progress, tracks, decoded]);

  function whenReady(audio, fn) {
    if (audio.readyState >= 1) fn();
    else audio.addEventListener("loadedmetadata", fn, { once: true });
  }

  function ensure(track) {
    const audio = audioRef.current;
    if (loadedId.current !== track.id) {
      audio.src = track.src;
      loadedId.current = track.id;
      setCurrentId(track.id);
      setLiveDuration(track.duration || 0);
    }
    return audio;
  }

  function toggle(track) {
    const audio = audioRef.current;
    if (loadedId.current === track.id && !audio.paused) {
      audio.pause();
      return;
    }
    const el = ensure(track);
    if (el.ended || (el.duration && el.currentTime >= el.duration - 0.05)) el.currentTime = 0;
    el.play().catch(() => {});
  }

  function seek(track, ratio) {
    const el = ensure(track);
    whenReady(el, () => {
      const dur = el.duration || track.duration || 0;
      el.currentTime = Math.min(dur, Math.max(0, ratio * dur));
      setTime(el.currentTime);
      if (el.paused) el.play().catch(() => {});
    });
  }

  function scrub(track, event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    seek(track, ratio);
  }

  function stop() {
    const audio = audioRef.current;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    loadedId.current = null;
    setCurrentId(null);
    setPlaying(false);
    setTime(0);
    setLiveDuration(0);
  }

  if (!tracks.length) {
    return (
      <div className="sample-panel">
        <p className="sample-empty">{empty}</p>
      </div>
    );
  }

    return (
      <>
      <div className="sample-panel" ref={panelRef}>
        {groups.map(group => (
          <div className="sample-group" key={group.group}>
            <div className="sample-group-head">
              <span>{group.group}</span>
              <span>{group.tracks.length}</span>
            </div>
            {group.tracks.map((track, index) => {
              const active = track.id === currentId;
              const shown = active ? time : 0;
              const total = active && duration ? duration : (decoded[track.src]?.duration || track.duration || 0);
              const amount = active ? progress : 0;
              const { title, tags } = trackMeta(track.name);
              return (
                <div
                  className={active && playing ? "sample-row is-playing" : "sample-row"}
                  key={track.id}
                  style={{ "--wash": WASHES[index % WASHES.length] }}
                >
                  <button
                    type="button"
                    className="sample-play"
                    aria-label={`${active && playing ? "Pause" : "Play"} ${track.name}`}
                    onClick={() => toggle(track)}
                  >
                    {active && playing ? <PauseIcon /> : <PlayIcon />}
                  </button>
                  <div className="sample-info">
                    <div className="sample-name" title={track.name}>{title}</div>
                  </div>
                  <div className="sample-time">{fmtTime(shown)} / {fmtTime(total)}</div>
                  <div className="sample-tags">
                    {tags.map(tag => <span key={tag}>{tag}</span>)}
                  </div>
                  <canvas
                    className={track.peaks || decoded[track.src]?.peaks ? "sample-wave is-drawn" : "sample-wave"}
                    data-id={track.id}
                    role="slider"
                    tabIndex={0}
                    aria-label={`Seek ${track.name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(amount * 100)}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      scrub(track, e);
                    }}
                    onPointerMove={(e) => {
                      if (e.currentTarget.hasPointerCapture(e.pointerId)) scrub(track, e);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                      e.preventDefault();
                      const next = Math.min(1, Math.max(0, amount + (e.key === "ArrowRight" ? 0.05 : -0.05)));
                      seek(track, next);
                    }}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setLiveDuration(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      {current && createPortal(
        <div className="now-bar" role="region" aria-label="now playing">
          <button
            type="button"
            className="sample-play"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => toggle(current)}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <div className="now-main">
            <div className="now-name" title={current.name}>{trackMeta(current.name).title}</div>
            <div className="now-track">
              <div className="now-fill" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
          <div className="now-time">{fmtTime(time)}</div>
          <button type="button" className="now-close" aria-label="Stop" onClick={stop}>×</button>
        </div>,
        document.body
      )}
    </>
  );
}
