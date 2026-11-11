// Gets the run from the web lab: loads the page in headless Chrome and calls
// window.marbleRun.score() over the DevTools protocol. Always muted.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// For tunes the lab does not ship we add one method to the page as it loads (nothing on disk
// changes): scoreSong(song, opt) runs the lab's own solver on a song object.
const HOOK_AT = "window.marbleRun = {";
const HOOK = `window.marbleRun = { scoreSong(song, opt) { const keep = current; current = song; try { return score("__not_a_builtin__", opt); } finally { current = keep; } },`;

export async function fetchScore({ url, tune, song = null, aspect = "9:16", speed = 1, bass = true, port = 9377, timeoutMs = 40000 }) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "marble-video-chrome-"));
  const chrome = spawn(CHROME, ["--headless=new", "--mute-audio", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--autoplay-policy=user-gesture-required", "about:blank"], { stdio: "ignore" });
  let ws;
  try {
    let target = null;
    for (const t0 = Date.now(); !target && Date.now() - t0 < 15000;) {
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page"); } catch { /* not up yet */ }
      if (!target) await sleep(150);
    }
    if (!target) throw new Error("headless Chrome did not start");
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("DevTools socket failed")); });
    let id = 0; const pending = new Map(), handlers = [];
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) { const [res, rej] = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
      else handlers.forEach((h) => h(m));
    };
    const send = (method, params = {}) => new Promise((res, rej) => { pending.set(++id, [res, rej]); ws.send(JSON.stringify({ id, method, params })); });
    await send("Page.enable"); await send("Runtime.enable");
    if (song) {
      await send("Fetch.enable", { patterns: [{ urlPattern: "*", resourceType: "Document", requestStage: "Response" }] });
      handlers.push(async (m) => {
        if (m.method !== "Fetch.requestPaused") return;
        const rid = m.params.requestId;
        try {
          const b = await send("Fetch.getResponseBody", { requestId: rid });
          let html = b.base64Encoded ? Buffer.from(b.body, "base64").toString("utf8") : b.body;
          if (html.includes(HOOK_AT)) html = html.replace(HOOK_AT, HOOK);
          await send("Fetch.fulfillRequest", { requestId: rid, responseCode: 200,
            responseHeaders: [{ name: "content-type", value: "text/html; charset=utf-8" }], body: Buffer.from(html, "utf8").toString("base64") });
        } catch { await send("Fetch.continueRequest", { requestId: rid }).catch(() => {}); }
      });
    }
    const nav = await send("Page.navigate", { url });
    if (nav.errorText) throw new Error(`could not open ${url}: ${nav.errorText}`);
    const evaluate = async (expression) => {
      const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    };
    const t0 = Date.now();
    while (!(await evaluate("!!(window.marbleRun && window.marbleRun.score)").catch(() => false))) {
      if (Date.now() - t0 > timeoutMs) throw new Error("the lab page never exposed window.marbleRun.score");
      await sleep(200);
    }
    const opt = JSON.stringify({ aspect, speed, bass });
    let json;
    if (song) {
      if (!(await evaluate("typeof window.marbleRun.scoreSong === 'function'")))
        throw new Error("could not hook the lab's solver for an extra tune (the page's script changed shape)");
      json = await evaluate(`JSON.stringify(window.marbleRun.scoreSong(${JSON.stringify(song)}, ${opt}))`);
    } else {
      json = await evaluate(`JSON.stringify(window.marbleRun.score(${JSON.stringify(tune)}, ${opt}))`);
    }
    const score = JSON.parse(json);
    if (!song && score.tune.name.toLowerCase() !== String(tune).toLowerCase()) throw new Error(`the lab has no tune called "${tune}" (it answered with "${score.tune.name}")`);
    return score;
  } finally {
    try { ws && ws.close(); } catch { /* ignore */ }
    chrome.kill("SIGKILL");
    await sleep(300);
    fs.rmSync(profile, { recursive: true, force: true });
  }
}
