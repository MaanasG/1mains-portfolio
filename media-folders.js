import fs from "fs";
import path from "path";

const AUDIO = new Set([".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aac", ".aif", ".aiff"]);
const VIDEO = new Set([".mp4", ".webm", ".mov"]);
const MIME = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
  ".aif": "audio/aiff",
  ".aiff": "audio/aiff",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function formatSize(bytes) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${bytes} B`;
}

function displayName(filename) {
  return path.basename(filename, path.extname(filename)).replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
}

function publicSrc(prefix, rel) {
  return `${prefix}/${rel.split(/[\\/]/).map(encodeURIComponent).join("/")}`;
}

function scanSamples(dir, prefix = "/samples", fallbackGroup = "samples") {
  const groups = new Map();
  const add = (group, track) => {
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(track);
  };
  const walk = (current, group) => {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full, entry.name);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!AUDIO.has(ext)) continue;
      const rel = path.relative(dir, full);
      const id = rel.replace(/[\\/]/g, "--").replace(/\.[^.]+$/, "");
      add(group || fallbackGroup, {
        id,
        name: displayName(entry.name),
        src: publicSrc(prefix, rel),
        size: formatSize(fs.statSync(full).size),
      });
    }
  };
  walk(dir, null);
  return [...groups.entries()].map(([group, tracks]) => ({
    group,
    tracks: tracks.sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

function reelShortcode(url) {
  const match = String(url).match(/instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
}

function scanReels(dir) {
  const items = [];
  if (!fs.existsSync(dir)) return items;
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!VIDEO.has(ext)) continue;
      const rel = path.relative(dir, full);
      items.push({
        type: "file",
        id: rel.replace(/[\\/]/g, "--"),
        name: displayName(entry.name),
        src: publicSrc("/reels", rel),
      });
    }
  };
  walk(dir);
  const links = path.join(dir, "links.txt");
  if (fs.existsSync(links)) {
    for (const line of fs.readFileSync(links, "utf8").split(/\r?\n/)) {
      const url = line.trim();
      if (!url || url.startsWith("#")) continue;
      const shortcode = reelShortcode(url);
      if (!shortcode) continue;
      items.push({ type: "instagram", id: shortcode, name: shortcode, url, shortcode });
    }
  }
  return items;
}

function safeFile(root, urlPath) {
  let rel = urlPath.split("?")[0];
  try { rel = decodeURIComponent(rel); } catch { return null; }
  const file = path.resolve(root, rel);
  const fromRoot = path.relative(root, file);
  if (fromRoot.startsWith("..") || path.isAbsolute(fromRoot)) return null;
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
  return file;
}

function sendFile(req, res, file) {
  const stat = fs.statSync(file);
  const total = stat.size;
  const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", type);
  const range = req.headers.range;
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (!match) {
      res.statusCode = 416;
      res.end();
      return;
    }
    let start = match[1] ? Number(match[1]) : 0;
    let end = match[2] ? Number(match[2]) : total - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) {
      res.statusCode = 416;
      res.setHeader("Content-Range", `bytes */${total}`);
      res.end();
      return;
    }
    end = Math.min(end, total - 1);
    res.statusCode = 206;
    res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
    res.setHeader("Content-Length", end - start + 1);
    fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.statusCode = 200;
  res.setHeader("Content-Length", total);
  fs.createReadStream(file).pipe(res);
}

function copyMedia(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "links.txt") continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyMedia(from, to);
    else fs.cpSync(from, to);
  }
}

export function mediaFolders() {
  const samplesDir = path.resolve("samples");
  const beatsDir = path.resolve("beats");
  const reelsDir = path.resolve("reels");
  const samplesId = "\0virtual:samples";
  const beatsId = "\0virtual:beats";
  const reelsId = "\0virtual:reels";
  let outDir = path.resolve("dist");

  const serve = (req, res, next) => {
    const url = req.url || "";
    const hit = url.startsWith("/samples/")
      ? ["samples", samplesDir]
      : url.startsWith("/beats/")
        ? ["beats", beatsDir]
        : url.startsWith("/reels/")
          ? ["reels", reelsDir]
          : null;
    if (!hit) return next();
    const file = safeFile(hit[1], url.slice(hit[0].length + 2));
    if (!file) return next();
    sendFile(req, res, file);
  };

  return {
    name: "media-folders",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    resolveId(id) {
      if (id === "virtual:samples") return samplesId;
      if (id === "virtual:beats") return beatsId;
      if (id === "virtual:reels") return reelsId;
    },
    load(id) {
      if (id === samplesId) return `export default ${JSON.stringify(scanSamples(samplesDir))}`;
      if (id === beatsId) return `export default ${JSON.stringify(scanSamples(beatsDir, "/beats", "beats"))}`;
      if (id === reelsId) return `export default ${JSON.stringify(scanReels(reelsDir))}`;
    },
    configureServer(server) {
      ensureDir(samplesDir);
      ensureDir(beatsDir);
      ensureDir(reelsDir);
      server.middlewares.use(serve);
      server.watcher.add(samplesDir);
      server.watcher.add(beatsDir);
      server.watcher.add(reelsDir);
      const reload = (file) => {
        const norm = path.resolve(file).toLowerCase();
        const inside = (dir) => norm.startsWith(path.resolve(dir).toLowerCase());
        if (!inside(samplesDir) && !inside(beatsDir) && !inside(reelsDir)) return;
        for (const id of [samplesId, beatsId, reelsId]) {
          const mod = server.moduleGraph.getModuleById(id);
          if (mod) server.moduleGraph.invalidateModule(mod);
        }
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", reload);
      server.watcher.on("unlink", reload);
      server.watcher.on("change", reload);
    },
    configurePreviewServer(server) {
      server.middlewares.use(serve);
    },
    writeBundle() {
      copyMedia(samplesDir, path.join(outDir, "samples"));
      copyMedia(beatsDir, path.join(outDir, "beats"));
      copyMedia(reelsDir, path.join(outDir, "reels"));
    },
  };
}
