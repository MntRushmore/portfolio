// Entry and exit rails, solved in the pipeline. The lab's run starts in a chute and ends in a cup
// (and has its own rails between keys on long waits, which arrive in the score). For the video:
//   - an entry rail per marble: it rolls in from above, leaves the rail's lip and flies a
//     ballistic arc that lands on its first key at exactly the lab's first hit time;
//   - an exit rail per marble: after its last key it flies the lab's arc, meets a rail
//     tangentially and rolls away.
// No hit time moves: only the stretch before the first hit and after the last one changes.

const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = (a) => Math.hypot(a[0], a[1]);
const norm = (a) => mul(a, 1 / (len(a) || 1));

function bezier(P0, P1, P2, P3, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([
      u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0],
      u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1],
    ]);
  }
  return pts;
}

// Times along a polyline for a marble whose speed follows v² = vRef² + 2·k·g·(y − yRef).
function ride(pts, g, k, vRef, yRef, vMin) {
  const v = pts.map((p) => Math.sqrt(Math.max(vMin * vMin, vRef * vRef + 2 * k * g * (p[1] - yRef))));
  const dt = [0];
  for (let i = 1; i < pts.length; i++) dt.push(len([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]) / ((v[i] + v[i - 1]) / 2));
  return dt; // dt[i] = time from point i-1 to point i
}

export function addRails(plan, opt = {}) {
  const g = plan.gravity, mid = plan.field.width / 2;
  // Both entry rails lean the same way (parallel, so they can never cross), starting on the roomier side.
  const avg = plan.marbles.reduce((a, m) => a + m.firstHit.at[0], 0) / plan.marbles.length;
  const dir = avg < mid ? -1 : 1;
  for (const m of plan.marbles) {
    // ── entry: a steep ramp from above that leans over to the first key ──
    const first = m.path[0], H = m.firstHit.at, tHit = m.firstHit.t;
    if (first.type !== "fall" || Math.abs(first.t1 - tHit) > 1e-6) continue;
    const tau = 0.26, vL = [dir * 150, 400], u = len(vL);
    const E = [H[0] - vL[0] * tau, H[1] - vL[1] * tau - 0.5 * g * tau * tau];
    const drop = 900;
    const P0 = [E[0] - dir * 170, E[1] - drop];          // always leaning the same way, so the wires never swap sides
    const pts = bezier(P0, add(P0, [dir * 20, 380]), add(E, mul(norm(vL), -260)), E, 160);
    const k = (0.9 * u * u) / (2 * g * drop);
    const dts = ride(pts, g, k, u, E[1], 0.3 * u);
    const tL = tHit - tau, ts = new Array(pts.length);
    ts[pts.length - 1] = tL;
    for (let i = pts.length - 2; i >= 0; i--) ts[i] = ts[i + 1] - dts[i + 1];
    m.path.splice(0, 1,
      { type: "rail", t0: ts[0], t1: tL, pts, ts },
      { type: "fall", t0: tL, t1: tHit, p0: E, v0: vL });
    plan.rails.push({ marble: m.id, role: "entry", radius: m.radius, pts });

    // ── exit: caught while falling steeply, then swept outward and away ──
    const last = m.path[m.path.length - 1];
    if (last.type !== "fall") continue;
    const vx = last.v0[0];
    const xdir = Math.abs(vx) > 30 ? Math.sign(vx) : (last.p0[0] > mid ? 1 : -1);   // go with the marble
    const vyLand = Math.max(320, 2.2 * Math.abs(vx));
    const tA = last.t0 + Math.max(0.12, (vyLand - last.v0[1]) / g), s = tA - last.t0;
    const A = [last.p0[0] + vx * s, last.p0[1] + last.v0[1] * s + 0.5 * g * s * s];
    const vA = [vx, last.v0[1] + g * s], d = norm(vA);
    const Q = [A[0] + xdir * 700, A[1] + 420];
    const a = (14 * Math.PI) / 180;
    const xp = bezier(A, add(A, mul(d, 150)), add(Q, [-xdir * Math.cos(a) * 380, -Math.sin(a) * 380]), Q, 160);
    const xd = ride(xp, g, 0.2, len(vA), A[1], 0.6 * len(vA));
    const xt = [tA];
    for (let i = 1; i < xp.length; i++) xt.push(xt[i - 1] + xd[i]);
    last.t1 = tA;
    m.path.push({ type: "rail", t0: tA, t1: xt[xt.length - 1], pts: xp, ts: xt });
    plan.rails.push({ marble: m.id, role: "exit", radius: m.radius, pts: xp });
  }
  plan.start = plan.firstNote - (opt.leadIn ?? 1.7);
  plan.end = plan.lastHit + (opt.tail ?? 2.8);
  return plan;
}
