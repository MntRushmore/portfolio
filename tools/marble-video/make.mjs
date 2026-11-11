#!/usr/bin/env node
// Marble-music video pipeline: lab score -> plan (+ wire rails) -> sampled audio -> Blender (EEVEE)
// frames -> H.264/AAC MP4 ready for Reels / TikTok / Shorts.
//
//   npm run marble:video -- --tune canon --aspect 9:16 --fps 60 [--preview] [--title]
//
// See README.md for every flag.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { fetchScore } from "./lib/score.mjs";
import { buildPlan } from "./lib/build-plan.mjs";
import { VOICES } from "./lib/themes.mjs";
import { resolveTune, slug, LAB_TUNES, EXTRA_TUNES } from "./lib/tunes.mjs";
import { renderAudio } from "./lib/audio.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(HERE, "assets"), OUT = path.join(HERE, "output");
const BLENDER = process.env.BLENDER_BIN || "/Applications/Blender.app/Contents/MacOS/Blender";
const SOUNDFONT = path.join(ASSETS, "FluidR3_GM.sf2");
const SOUNDFONT_URL = "https://github.com/pianobooster/fluid-soundfont/releases/download/v3.1/FluidR3_GM.sf2";
const FONT = path.join(ASSETS, "Anybody-ExtraBold.ttf");
const FONT_URL = "https://fonts.gstatic.com/s/anybody/v13/VuJbdNvK2Ib2ppdWYq311GH32hxIv0sd5grncSUi2F_Wim4JV2fPrg.ttf";

// ── arguments ──
const args = process.argv.slice(2), opt = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (!a.startsWith("--")) continue;
  const k = a.slice(2), next = args[i + 1];
  if (next === undefined || next.startsWith("--")) opt[k] = true; else { opt[k] = next; i++; }
}
if (opt.help || opt.h) {
  console.log(`Usage: npm run marble:video -- --tune <name> [options]

  --tune <name|index>   ${[...LAB_TUNES, ...EXTRA_TUNES.map((t) => t.name)].join(", ")}
  --aspect 9:16|16:9    (default 9:16: 1080x1920; 16:9 is 1920x1080)
  --fps 60              frames per second (default 60)
  --title               section titles at the top (as the lab names them) and the end credit
  --credit <text>       end credit text (default labs.rushilchopra.com)
  --preview             fast look: half resolution, half the frame rate, few samples
  --speed <0.5..1.6>    tempo multiplier passed to the lab (default 1)
  --samples <n>         EEVEE samples per frame (default 20; preview 6)
  --jobs <n>            Blender processes rendering in parallel (default 2; preview 2)
  --engine eevee|cycles cycles is the slow "hero" mode
  --score <file.json>   use a saved lab score instead of asking the lab
  --lab <url>           the lab page (default http://labs.localhost:3123/lab-files/marble-run/index.html)
  --keep-frames         do not delete the PNG sequence after encoding
  --list                list tunes and instrument voices`);
  process.exit(0);
}
if (opt.list) {
  console.log("Tunes:  " + [...LAB_TUNES, ...EXTRA_TUNES.map((t) => t.name)].join(", "));
  console.log("Voices: " + Object.entries(VOICES).map(([k, v]) => `${k} = ${v.label}`).join("; "));
  process.exit(0);
}
const aspect = opt.aspect === "16:9" ? "16:9" : "9:16";
const preview = !!opt.preview;
const fpsFull = Number(opt.fps || 60), fps = preview ? fpsFull / 2 : fpsFull;
const [fullW, fullH] = aspect === "9:16" ? [1080, 1920] : [1920, 1080];
const [W, H] = preview ? [fullW / 2, fullH / 2] : [fullW, fullH];
const samples = Number(opt.samples || (preview ? 6 : 16));
const jobs = Math.max(1, Number(opt.jobs || (preview ? 2 : 1)));
const engine = opt.engine === "cycles" ? "cycles" : "eevee";
const labUrl = opt.lab || "http://labs.localhost:3123/lab-files/marble-run/index.html";
const tune = resolveTune(opt.tune ?? "canon");
if (!tune) { console.error(`Unknown tune "${opt.tune}". Try --list.`); process.exit(1); }

const t0 = Date.now(), secs = () => ((Date.now() - t0) / 1000).toFixed(0).padStart(4) + "s";
const log = (m) => console.log(`[${secs()}] ${m}`);
const run = (cmd, a, o = {}) => { const r = spawnSync(cmd, a, { encoding: "utf8", maxBuffer: 1 << 28, ...o }); if (r.status !== 0) throw new Error(`${path.basename(cmd)} failed:\n${(r.stderr || "").slice(-2000)}`); return r; };

async function download(url, file) {
  log(`downloading ${path.basename(file)} ...`);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download failed (${r.status}): ${url}`);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
}

async function main() {
  for (const bin of ["ffmpeg", "ffprobe", "fluidsynth"]) {
    if (spawnSync("which", [bin]).status !== 0) throw new Error(`${bin} is not installed (brew install ${bin === "fluidsynth" ? "fluid-synth" : "ffmpeg"})`);
  }
  if (!fs.existsSync(BLENDER)) throw new Error(`Blender not found at ${BLENDER} (set BLENDER_BIN)`);
  fs.mkdirSync(ASSETS, { recursive: true }); fs.mkdirSync(path.join(OUT, "scores"), { recursive: true });
  if (!fs.existsSync(SOUNDFONT)) await download(SOUNDFONT_URL, SOUNDFONT);
  if (opt.title && !fs.existsSync(FONT)) await download(FONT_URL, FONT);

  // 1. score
  const speed = Number(opt.speed || 1);
  const name = `${slug(tune.name)}-${aspect.replace(":", "x")}${speed !== 1 ? `-x${speed}` : ""}`;
  const scoreFile = path.join(OUT, "scores", `${name}.json`);
  let score;
  if (opt.score) { score = JSON.parse(fs.readFileSync(opt.score, "utf8")); log(`score: ${opt.score}`); }
  else {
    try {
      score = await fetchScore({ url: labUrl, tune: tune.name, song: tune.extra, aspect, speed });
      fs.writeFileSync(scoreFile, JSON.stringify(score));
      log(`score: "${score.tune.name}" from the lab, ${score.hits.length} hits, ${score.duration.toFixed(1)} s, layout flaws ${score.layoutFlaws}`);
    } catch (e) {
      if (!fs.existsSync(scoreFile)) throw new Error(`could not get the score from ${labUrl} (${e.message}) and there is no saved copy. Is the dev server running (npm run dev)?`);
      score = JSON.parse(fs.readFileSync(scoreFile, "utf8"));
      log(`score: lab not reachable (${e.message}); using the saved copy ${path.relative(HERE, scoreFile)}`);
    }
  }

  // 2. plan
  const plan = buildPlan(score);
  const base = `${slug(plan.tune.name)}-${aspect.replace(":", "x")}${speed !== 1 ? `-x${speed}` : ""}-${fpsFull}fps${preview ? "-preview" : ""}${engine === "cycles" ? "-cycles" : ""}`;
  const work = path.join(OUT, ".work", base), frames = path.join(work, "frames");
  fs.rmSync(work, { recursive: true, force: true }); fs.mkdirSync(frames, { recursive: true });
  const planFile = path.join(work, "plan.json");
  fs.writeFileSync(planFile, JSON.stringify(plan));
  const duration = plan.end - plan.start, nFrames = Math.ceil(duration * fps);
  log(`plan: ${plan.keys.length} keys, ${plan.rails.length} rails, ${duration.toFixed(2)} s = ${nFrames} frames at ${W}x${H} ${fps} fps; ${plan.sections.map((x) => x.title).join(" / ")}`);
  if (plan.layoutFlaws) log(`note: the lab reports ${plan.layoutFlaws} layout flaw(s) for this tune (a marble passes very close to a key it does not play)`);

  // 3. audio
  const wav = path.join(work, "audio.wav");
  const audio = renderAudio(plan, { workDir: work, outWav: wav, soundfont: SOUNDFONT, assetsDir: ASSETS, log });
  log(`audio: ${audio.lufs.toFixed(1)} LUFS, true peak ${audio.truePeak.toFixed(1)} dBTP; ${audio.sources.join(" + ")}`);

  // 4. frames: one Blender animation job per chunk, so shaders compile once and the scene stays loaded
  const tRender = Date.now();
  const chunk = Math.ceil(nFrames / jobs);
  let done = 0, lastPct = -1;
  await Promise.all([...Array(jobs).keys()].map((j) => new Promise((res, rej) => {
    const a = j * chunk + 1, b = Math.min(nFrames, (j + 1) * chunk);
    if (a > b) return res();
    const p = spawn(BLENDER, ["-b", "--factory-startup", "--python", path.join(HERE, "blender", "scene.py"), "--",
      "--plan", planFile, "--out", frames, "--width", String(W), "--height", String(H), "--fps", String(fps),
      "--samples", String(samples), "--frames", `${a}:${b}`, "--engine", engine, ...(preview ? ["--fast"] : [])]);
    let tail = "";
    const onData = (d) => {
      const s = d.toString(); tail = (tail + s).slice(-3000);
      done += (s.match(/Saved: /g) || []).length;
      const pct = Math.floor((done / nFrames) * 20) * 5;
      if (pct !== lastPct) { lastPct = pct; const el = (Date.now() - tRender) / 1000; log(`render: ${pct}% (${done}/${nFrames} frames, ${(el / Math.max(1, done)).toFixed(2)} s/frame)`); }
    };
    p.stdout.on("data", onData); p.stderr.on("data", (d) => { tail = (tail + d.toString()).slice(-3000); });
    p.on("close", (code) => (code === 0 ? res() : rej(new Error(`Blender exited with ${code}:\n${tail}`))));
  })));
  const got = fs.readdirSync(frames).filter((f) => f.endsWith(".png")).length;
  if (got < nFrames) throw new Error(`Blender wrote ${got} of ${nFrames} frames`);
  const renderSeconds = (Date.now() - tRender) / 1000;
  log(`render: done in ${renderSeconds.toFixed(0)} s (${(renderSeconds / nFrames).toFixed(2)} s/frame, ${jobs} job${jobs > 1 ? "s" : ""})`);

  // 5. overlays
  const inputs = ["-framerate", String(fps), "-i", path.join(frames, "f_%04d.png"), "-i", wav];
  let filter = "[0:v]format=yuv420p[v]";
  if (opt.title) {
    const u = (H / 1920) * (aspect === "9:16" ? 1 : 1.9), y0 = (aspect === "9:16" ? 0.150 : 0.115) * H;
    const secs = plan.sections.length ? plan.sections : [{ t: plan.firstNote, title: plan.tune.name }];
    const creditIn = duration - 2.3;
    const shots = secs.map((sec, i) => ({
      out: path.join(work, `title-${i}.png`),
      lines: [...(i === 0 ? [{ text: plan.tune.name, size: 30 * u, y: y0 - 58 * u }] : []), { text: sec.title, size: 46 * u, y: y0 }],
      tin: Math.max(0.2, sec.t - plan.start - 0.35),
      tout: i + 1 < secs.length ? secs[i + 1].t - plan.start - 0.75 : creditIn - 0.5,
    }));
    shots.push({ out: path.join(work, "credit.png"), lines: [{ text: String(opt.credit || "labs.rushilchopra.com"), size: 40 * u, y: (aspect === "9:16" ? 0.80 : 0.88) * H }], tin: creditIn, tout: null });
    fs.writeFileSync(path.join(work, "titles.json"), JSON.stringify({ width: W, height: H, font: FONT, images: shots }));
    run(BLENDER, ["-b", "--factory-startup", "--python", path.join(HERE, "blender", "title.py"), "--", "--spec", path.join(work, "titles.json")]);
    const parts = []; let last = "0:v";
    shots.forEach((sh, i) => {
      inputs.push("-loop", "1", "-framerate", String(fps), "-t", duration.toFixed(3), "-i", sh.out);
      const k = i + 2, fades = `fade=t=in:st=${sh.tin.toFixed(2)}:d=0.35:alpha=1` + (sh.tout != null ? `,fade=t=out:st=${sh.tout.toFixed(2)}:d=0.35:alpha=1` : "");
      // white text over a soft dark copy of itself, like the reference's titles
      parts.push(`[${k}:v]format=rgba,split[a${i}][b${i}];[b${i}]colorchannelmixer=rr=0:gg=0:bb=0:aa=0.55,gblur=sigma=${(5 * H / 1920).toFixed(1)}[s${i}];[s${i}][a${i}]overlay=0:0:format=auto,${fades}[t${i}]`);
      parts.push(`[${last}][t${i}]overlay=0:0[o${i}]`); last = `o${i}`;
    });
    filter = parts.join(";") + `;[${last}]format=yuv420p[v]`;
  }

  // 6. encode
  const mp4 = path.join(OUT, `${base}.mp4`);
  run("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", filter, "-map", "[v]", "-map", "1:a",
    "-t", duration.toFixed(3), "-r", String(fps),
    "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", preview ? "20" : "16", "-pix_fmt", "yuv420p",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
    "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", mp4]);
  if (!opt["keep-frames"]) fs.rmSync(frames, { recursive: true, force: true });
  const probe = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name,profile,width,height,r_frame_rate,pix_fmt,bit_rate,sample_rate,channels:format=duration,size", "-of", "json", mp4], { encoding: "utf8" });
  const pj = JSON.parse(probe), v = pj.streams.find((s) => s.width), a = pj.streams.find((s) => s.sample_rate);
  fs.writeFileSync(path.join(OUT, `${base}.json`), JSON.stringify({ video: mp4, tune: plan.tune.name, sections: plan.sections, aspect, fps, width: W, height: H, frames: nFrames,
    duration, samples, engine, renderSeconds, totalSeconds: (Date.now() - t0) / 1000, audio: { lufs: audio.lufs, truePeak: audio.truePeak, lra: audio.lra, sources: audio.sources },
    noteTimes: plan.notes.map((n) => +(n.t - plan.start).toFixed(4)), ffprobe: pj }, null, 1));
  // cue sheet for `earshot timeline <mp4> --cues <this>`: every instant a marble lands on a key
  const cueT = [...new Set(plan.notes.map((n) => +(n.t - plan.start).toFixed(4)))].sort((x, y) => x - y);
  fs.writeFileSync(path.join(OUT, `${base}.cues.json`), JSON.stringify({ fps, events: cueT.map((t, i) => ({ t, name: `hit ${i + 1}` })) }));
  log(`video: ${v.codec_name} ${v.profile} ${v.width}x${v.height} ${v.r_frame_rate} fps ${v.pix_fmt} ${(v.bit_rate / 1e6).toFixed(1)} Mbps; audio: ${a.codec_name} ${a.sample_rate} Hz ${(a.bit_rate / 1000).toFixed(0)} kbps; ${Number(pj.format.duration).toFixed(2)} s, ${(pj.format.size / 1048576).toFixed(1)} MB`);
  log(`done: ${mp4}`);
}

main().catch((e) => { console.error(`\nmarble:video failed: ${e.message}`); process.exit(1); });
