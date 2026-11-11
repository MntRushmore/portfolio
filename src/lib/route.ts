/**
 * Three-band stripe routes for SVG: the same supergraphic as the page stripe,
 * drawn as paths. A route is an axis-aligned polyline for the middle band's
 * centre line; each band is that line offset to the left or right of travel,
 * with corner radii that grow on the outside of a turn and shrink inside it.
 */

export type Point = [number, number];

function unit(a: Point, b: Point): Point {
  const dx = Math.sign(b[0] - a[0]);
  const dy = Math.sign(b[1] - a[1]);
  return [dx, dy];
}

/** Left of travel, in screen coordinates (y down). */
const leftNormal = ([dx, dy]: Point): Point => [dy, -dx];

/**
 * @param points  centre-line vertices (axis-aligned segments only)
 * @param radius  corner radius of the centre line
 * @param offset  distance to the left of travel (negative = right)
 */
export function bandPath(points: Point[], radius: number, offset: number): string {
  const n = points.length;
  const dirs = points.slice(1).map((p, i) => unit(points[i], p));

  // Offset vertices: each vertex moves along the left normals of both segments it joins.
  const shifted: Point[] = points.map((p, i) => {
    const dIn = dirs[Math.max(0, i - 1)];
    const dOut = dirs[Math.min(dirs.length - 1, i)];
    const nIn = leftNormal(dIn);
    const nOut = leftNormal(dOut);
    if (i === 0) return [p[0] + nOut[0] * offset, p[1] + nOut[1] * offset];
    if (i === n - 1) return [p[0] + nIn[0] * offset, p[1] + nIn[1] * offset];
    // Perpendicular segments: shift by both normals (they are orthogonal).
    return [p[0] + (nIn[0] + nOut[0]) * offset, p[1] + (nIn[1] + nOut[1]) * offset];
  });

  let d = `M${shifted[0][0]} ${shifted[0][1]}`;
  for (let i = 1; i < n - 1; i++) {
    const dIn = dirs[i - 1];
    const dOut = dirs[i];
    const cross = dIn[0] * dOut[1] - dIn[1] * dOut[0];
    const rightTurn = cross > 0;
    // The left band is outside a right turn and inside a left turn.
    const r = Math.max(0.01, rightTurn ? radius + offset : radius - offset);
    const v = shifted[i];
    const a: Point = [v[0] - dIn[0] * r, v[1] - dIn[1] * r];
    const b: Point = [v[0] + dOut[0] * r, v[1] + dOut[1] * r];
    d += ` L${a[0]} ${a[1]} A${r} ${r} 0 0 ${rightTurn ? 1 : 0} ${b[0]} ${b[1]}`;
  }
  d += ` L${shifted[n - 1][0]} ${shifted[n - 1][1]}`;
  return d;
}

/** The three bands, outermost-left first: [left band, middle band, right band]. */
export function stripe(points: Point[], radius: number, step: number): [string, string, string] {
  return [bandPath(points, radius, step), bandPath(points, radius, 0), bandPath(points, radius, -step)];
}
