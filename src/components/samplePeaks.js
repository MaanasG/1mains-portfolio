function peaksFromBuffer(buffer, bars = 96) {
  const data = buffer.getChannelData(0);
  const block = Math.max(1, Math.floor(data.length / bars));
  const peaks = [];
  for (let i = 0; i < bars; i++) {
    let max = 0;
    const start = i * block;
    for (let j = 0; j < block; j += 16) {
      const v = Math.abs(data[start + j] || 0);
      if (v > max) max = v;
    }
    peaks.push(max);
  }
  const top = Math.max(...peaks, 0.01);
  return peaks.map(p => Math.max(0.06, p / top));
}

const peakCache = new Map();
let sharedAudio;

function audioContext() {
  if (!sharedAudio) sharedAudio = new AudioContext();
  return sharedAudio;
}

export function decodeTrack(src) {
  if (peakCache.has(src)) return peakCache.get(src);
  const job = fetch(src)
    .then(res => res.arrayBuffer())
    .then(buf => audioContext().decodeAudioData(buf.slice(0)))
    .then(audio => ({ peaks: peaksFromBuffer(audio), duration: audio.duration }));
  peakCache.set(src, job);
  return job;
}

export function warmTracks(srcs, onEach) {
  let cancel = false;
  const run = (async () => {
    for (const src of srcs) {
      if (cancel) return;
      try { await decodeTrack(src); } catch { /* skip a file that cannot be read */ }
      if (!cancel) onEach?.();
    }
  })();
  run.cancel = () => { cancel = true; };
  return run;
}
