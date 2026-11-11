/*
 * Labs analytics: a small, cookie-free counter shared by every lab.
 *
 *   <script src="../track.js" defer></script>
 *   window.labTrack("play", { tune: "Ode to Joy" });
 *
 * labTrack(event, props, opts)
 *   event  lowercase name, up to 40 characters: "play", "tune_chosen"
 *   props  a flat object of strings, numbers and booleans (under 1 KB)
 *   opts   { once: true }   send this event (with these props) once per page load
 *          { every: 5000 }  at most once per that many milliseconds
 *          Both count per event + props; add { key: "name" } to count them together.
 * labTrack.alive()  call while something plays by itself (a tune, a video), so
 *                   watching counts as time spent even without touching anything.
 *
 * By itself it sends "view" on load and "engaged" { s } with the seconds the
 * page was visible and in use. It stores nothing but a random id for this tab
 * (sessionStorage), sends nothing if the browser asks not to be tracked, and
 * never throws: a lab works exactly the same if this file fails to load.
 */
(function () {
  "use strict";
  try {
    var script = document.currentScript;
    var lab = (script && script.getAttribute("data-lab")) || (location.pathname.match(/\/lab-files\/([a-z0-9-]+)\//) || [])[1];
    if (!lab) return;

    var nav = navigator;
    var off = nav.doNotTrack === "1" || window.doNotTrack === "1" || nav.globalPrivacyControl === true;
    var URL_ = "/api/labs/track";
    var MAX_EVENTS = 300; // per page load, whatever a lab does
    var sent = 0;

    // One id per tab. Frames on the same site share it, so the index and a lab are one session.
    var session = "";
    try {
      session = sessionStorage.getItem("lab-sid") || "";
      if (!/^[a-z0-9]{8,32}$/.test(session)) {
        session = (Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 20);
        sessionStorage.setItem("lab-sid", session);
      }
    } catch {
      session = (Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 20);
    }

    // Where the visit came from, and which page it is: the outer page knows, if we may ask it.
    var ref = "", path = location.pathname;
    try {
      var top_ = window.parent !== window ? window.parent : window;
      ref = top_.document.referrer || "";
      path = top_.location.pathname;
    } catch {
      ref = "";
    }

    var last = {};
    function send(event, props) {
      if (off || sent >= MAX_EVENTS) return;
      sent++;
      var body = JSON.stringify({ lab: lab, event: event, props: props || {}, session: session, ref: ref, path: path });
      try {
        if (nav.sendBeacon && nav.sendBeacon(URL_, body)) return;
      } catch {}
      try {
        fetch(URL_, { method: "POST", body: body, keepalive: true, headers: { "content-type": "text/plain" } }).catch(function () {});
      } catch {}
    }

    function labTrack(event, props, opts) {
      try {
        if (typeof event !== "string") return;
        if (opts && (opts.once || opts.every)) {
          var key = opts.key || event + "|" + JSON.stringify(props || {}), now = Date.now();
          if (last[key] && (opts.once || now - last[key] < opts.every)) return;
          last[key] = now;
        }
        touch();
        send(event, props);
      } catch {}
    }

    // Time spent: a second counts when the page is visible and was used in the last 30 seconds.
    var IDLE = 30000, FLUSH = 30;
    var lastTouch = 0, secs = 0, stopped = false;
    function touch() { lastTouch = Date.now(); }
    function flush() {
      if (secs < 1) return;
      var s = secs; secs = 0;
      send("engaged", { s: s });
    }
    var timer = setInterval(function () {
      if (document.visibilityState !== "visible" || Date.now() - lastTouch > IDLE) return;
      // Sent in small pieces as well as on leaving, so a tab that dies still counts.
      if (++secs >= FLUSH) flush();
    }, 1000);
    var inputs = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "input"];
    var passive = { passive: true, capture: true };
    inputs.forEach(function (name) { addEventListener(name, touch, passive); });
    function onHide() { if (document.visibilityState === "hidden") flush(); }
    document.addEventListener("visibilitychange", onHide);
    addEventListener("pagehide", flush);

    labTrack.alive = touch;
    /** For pages that stay loaded while the visitor moves on (the React index). */
    labTrack.stop = function () {
      if (stopped) return;
      stopped = true;
      flush();
      clearInterval(timer);
      inputs.forEach(function (name) { removeEventListener(name, touch, passive); });
      document.removeEventListener("visibilitychange", onHide);
      removeEventListener("pagehide", flush);
      if (window.labTrack === labTrack) window.labTrack = function () {};
    };
    window.labTrack = labTrack;

    touch();
    send("view");
  } catch {}
})();
