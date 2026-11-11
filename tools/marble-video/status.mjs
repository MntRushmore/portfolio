#!/usr/bin/env node
// A little status page for the render that's running: a ring that fills as
// Blender finishes frames. Usage: npm run marble:status  → http://localhost:4848
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "output");
const WORK = path.join(OUT, ".work");
const PORT = Number(process.env.PORT || 4848);

/** The job whose frames changed most recently. */
function activeJob() {
  if (!fs.existsSync(WORK)) return null;
  let best = null;
  for (const name of fs.readdirSync(WORK)) {
    const dir = path.join(WORK, name);
    if (name.endsWith("-preview")) continue; // previews aren't the video you're waiting for
    const frames = path.join(dir, "frames");
    const plan = path.join(dir, "plan.json");
    if (!fs.existsSync(frames) && !fs.existsSync(plan)) continue;
    const files = fs.existsSync(frames) ? fs.readdirSync(frames).filter((f) => f.endsWith(".png")) : [];
    // A new job counts from the moment it's set up, before its first frame.
    let newest = Math.max(fs.statSync(dir).mtimeMs, fs.existsSync(plan) ? fs.statSync(plan).mtimeMs : 0);
    let newestFile = null;
    for (const f of files) {
      const m = fs.statSync(path.join(frames, f)).mtimeMs;
      if (m >= newest) { newest = m; newestFile = f; }
    }
    if (!best || newest > best.newest) best = { name, dir, frames, files, newest, newestFile };
  }
  return best;
}

function status() {
  const job = activeJob();
  if (!job) return { state: "idle" };
  const fps = Number((job.name.match(/(\d+)fps/) || [])[1] || 60);
  let total = null, tune = job.name;
  try {
    const plan = JSON.parse(fs.readFileSync(path.join(job.dir, "plan.json"), "utf8"));
    tune = plan.tune?.name || plan.tune?.title || tune;
    total = Math.round((plan.end - plan.start) * fps);
  } catch {}
  const done = job.files.length;
  // Speed from the last ~3 minutes of finished frames.
  const now = Date.now();
  const times = job.files.map((f) => fs.statSync(path.join(job.frames, f)).mtimeMs).sort((a, b) => a - b);
  const recent = times.filter((t) => now - t < 180_000);
  const secPerFrame = recent.length > 2 ? (recent.at(-1) - recent[0]) / 1000 / (recent.length - 1) : null;
  const mp4 = path.join(OUT, `${job.name}.mp4`);
  const encoded = fs.existsSync(mp4) && fs.statSync(mp4).mtimeMs > (times[0] ?? 0);
  const lastFrameAt = times.at(-1) ?? job.newest;
  const stalled = now - lastFrameAt > 120_000;
  // A render that stopped making frames is abandoned (e.g. switched to another tune).
  if (!encoded && stalled && done > 0 && !(total && done >= total)) {
    return { state: "waiting", tune: "Up next…", done: 0, total: null, fps, secPerFrame: null, etaSec: null, frame: null, output: null };
  }
  const state = encoded ? "done" : total && done >= total ? "encoding" : done === 0 ? "starting" : stalled ? "paused" : "rendering";
  return {
    state, job: job.name, tune, done, total, fps,
    secPerFrame, etaSec: secPerFrame && total ? Math.max(0, (total - done) * secPerFrame) : null,
    frame: job.newestFile, output: encoded ? mp4 : null,
  };
}

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rendering…</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anybody:wdth,wght@50..150,100..900&family=Hanken+Grotesk:wght@400..800&display=swap">
<style>
  :root { --persimmon:#f2662a; --umber:#241006; --brick:#b32317; --plaster:#fbe6cc; --plaster2:#f3d2ab; --ink2:#5a3a26; }
  * { box-sizing: border-box } html,body { margin:0; height:100% }
  body { background: var(--persimmon); color: var(--umber); font-family: "Hanken Grotesk", system-ui, sans-serif;
    display: grid; place-items: center; padding: 24px; }
  main { display: grid; grid-template-columns: auto auto; gap: 48px; align-items: center; }
  .ring { position: relative; width: min(64vmin, 440px); aspect-ratio: 1; }
  svg { width: 100%; height: 100%; transform: rotate(-90deg); }
  .track { fill: none; stroke: var(--plaster2); }
  .band { fill: none; stroke-linecap: butt; transition: stroke-dashoffset 1.6s cubic-bezier(.2,.8,.2,1); }
  .center { position: absolute; inset: 0; display: grid; place-items: center; text-align: center; }
  .pct { font-family: Anybody, sans-serif; font-weight: 900; font-variation-settings: "wdth" 140; font-size: min(16vmin, 112px); line-height: .9; letter-spacing: -.04em; }
  .label { font-family: Anybody, sans-serif; font-weight: 700; font-variation-settings: "wdth" 112; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; }
  .card { background: var(--plaster); border: 2px solid var(--umber); border-radius: 8px; box-shadow: 6px 6px 0 var(--umber); padding: 18px; width: 260px; display: grid; gap: 12px; }
  .card img { width: 100%; aspect-ratio: 9/16; object-fit: cover; border-radius: 4px; border: 2px solid var(--umber); background: var(--plaster2); }
  .tune { font-family: Anybody, sans-serif; font-weight: 900; font-variation-settings: "wdth" 125; font-size: 24px; line-height: 1; }
  .row { display: flex; justify-content: space-between; font-size: 15px; } .row b { font-variant-numeric: tabular-nums; }
  .done .pct { font-size: min(11vmin, 80px) } a { color: inherit }
  @media (max-width: 760px) { main { grid-template-columns: 1fr; gap: 28px; justify-items: center } }
  @media (prefers-reduced-motion: reduce) { .band { transition: none } }
</style></head><body><main>
  <div class="ring">
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <circle class="track" cx="100" cy="100" r="88" stroke-width="22"/>
      <circle class="band" id="b0" cx="100" cy="100" r="92" stroke="var(--umber)" stroke-width="6"/>
      <circle class="band" id="b1" cx="100" cy="100" r="84" stroke="var(--brick)" stroke-width="6"/>
      <circle class="band" id="b2" cx="100" cy="100" r="76" stroke="var(--plaster)" stroke-width="6"/>
    </svg>
    <div class="center"><div><div class="pct" id="pct">–</div><div class="label" id="state">Looking for a render…</div></div></div>
  </div>
  <div class="card">
    <img id="img" alt="The newest finished frame">
    <div class="tune" id="tune">Marble run</div>
    <div class="row"><span>Frames</span><b id="frames">–</b></div>
    <div class="row"><span>Speed</span><b id="speed">–</b></div>
    <div class="row"><span>Time left</span><b id="eta">–</b></div>
  </div>
</main>
<script>
  const $ = (id) => document.getElementById(id);
  const bands = [["b0",92],["b1",84],["b2",76]].map(([id,r]) => { const c = $(id), L = 2*Math.PI*r; c.style.strokeDasharray = L; c.style.strokeDashoffset = L; return [c, L]; });
  const fmt = (s) => { if (s == null) return "–"; s = Math.round(s); const h = Math.floor(s/3600), m = Math.floor(s%3600/60); return h ? h+" h "+m+" min" : m ? m+" min" : s+" s"; };
  const words = { idle: "No render running", starting: "Setting up the scene…", waiting: "Waiting for the next render", rendering: "Rendering", encoding: "Encoding the video", paused: "Paused", done: "Done" };
  let lastFrame = null;
  async function tick() {
    try {
      const s = await (await fetch("/status", { cache: "no-store" })).json();
      const p = s.total ? Math.min(1, s.done / s.total) : 0;
      // Three bands, painted one after another, like the stairwell stripe.
      bands.forEach(([c, L], i) => { const lag = i * 0.015; c.style.strokeDashoffset = L * (1 - Math.max(0, Math.min(1, (p - lag) / (1 - lag)))); });
      $("pct").textContent = s.state === "done" ? "Done" : s.total ? Math.floor(p * 100) + "%" : "–";
      document.body.classList.toggle("done", s.state === "done");
      $("state").textContent = words[s.state] || s.state;
      $("tune").textContent = s.tune || "Marble run";
      $("frames").textContent = s.total ? s.done.toLocaleString() + " / " + s.total.toLocaleString() : (s.done ?? "–");
      $("speed").textContent = s.secPerFrame ? s.secPerFrame.toFixed(1) + " s / frame" : "–";
      $("eta").textContent = s.state === "done" ? "–" : fmt(s.etaSec);
      document.title = s.state === "done" ? "Done!" : s.total ? Math.floor(p*100) + "% · Rendering" : "Rendering…";
      if (s.frame && s.frame !== lastFrame) { lastFrame = s.frame; $("img").src = "/frame?f=" + encodeURIComponent(s.frame) + "&t=" + Date.now(); }
    } catch {}
  }
  tick(); setInterval(tick, 3000);
</script></body></html>`;

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/status") {
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    return res.end(JSON.stringify(status()));
  }
  if (url.pathname === "/frame") {
    const job = activeJob();
    const f = path.basename(url.searchParams.get("f") || "");
    const file = job && path.join(job.frames, f);
    if (!file || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": "image/png", "cache-control": "no-store" });
    return fs.createReadStream(file).pipe(res);
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(PAGE);
}).listen(PORT, "127.0.0.1", () => console.log(`Render status: http://localhost:${PORT}`));
