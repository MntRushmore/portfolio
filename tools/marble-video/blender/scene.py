# Builds the marble-music scene from a plan (see ../lib/adapter.mjs) and renders it.
#
#   Blender -b --factory-startup --python scene.py -- --plan plan.json --out frames/ \
#           --width 1080 --height 1920 --fps 60 --samples 48 [--stills 3.2,8] [--frames 1:600]
#           [--engine eevee|cycles] [--save scene.blend]
#
# Everything is procedural: no external models or textures.
# Plan space: px ~ mm, x right, y down.  Blender: X = x, Z = -y, Y = -(distance out from the wall),
# so the wall is the plane Y = 0 and the camera sits at negative Y.  1 px = S Blender units.
import bpy, bmesh, sys, json, math, os, time, argparse
import numpy as np
from mathutils import Vector, Matrix

ap = argparse.ArgumentParser()
ap.add_argument("--plan", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--width", type=int, default=1080)
ap.add_argument("--height", type=int, default=1920)
ap.add_argument("--fps", type=float, default=60)
ap.add_argument("--samples", type=int, default=48)
ap.add_argument("--stills", default="")
ap.add_argument("--frames", default="")
ap.add_argument("--engine", default="eevee")
ap.add_argument("--save", default="")
ap.add_argument("--fast", action="store_true", help="preview quality: cheaper shadows, half-res raytracing")
A = ap.parse_args(sys.argv[sys.argv.index("--") + 1:])

plan = json.load(open(A.plan))
S = 0.01
PLANE = 74.0                       # marble centres sit this far out from the wall (px)
G = plan["gravity"]
FW = plan["field"]["width"]
T0, T1 = plan["start"], plan["end"]
FPS = A.fps
portrait = A.height > A.width

def P(x, y, out=PLANE):
    return Vector((x * S, -out * S, -y * S))

# ───────────────────────────── scene reset ─────────────────────────────
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
scene = bpy.context.scene
coll = scene.collection
scene.unit_settings.scale_length = 0.1      # 1 BU = 100 px = 100 mm: depth of field behaves like a real macro set

def link(o):
    coll.objects.link(o); return o

# ───────────────────────────── materials ─────────────────────────────
def new_mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree
    return m, nt, nt.nodes["Principled BSDF"]

def lin(c):  # sRGB 0..1 -> linear
    return [((v / 12.92) if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c] + [1.0]

def hexc(h):
    h = h.lstrip("#"); return lin([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])

_mats = {}
def simple_mat(key, color, rough=0.4, metal=0.0, coat=0.0, emit=0.0, spec=0.5):
    if key in _mats: return _mats[key]
    m, nt, b = new_mat(key)
    b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Coat Roughness"].default_value = 0.08
    b.inputs["Specular IOR Level"].default_value = spec
    if emit:
        b.inputs["Emission Color"].default_value = color
        b.inputs["Emission Strength"].default_value = emit
    _mats[key] = m
    return m

def brushed(key, color, rough=0.3, metal=1.0):
    """Metal with fine streaks along the bar's long (local X) axis."""
    if key in _mats: return _mats[key]
    m, nt, b = new_mat(key)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1.5, 60, 60)
    nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 8; nz.inputs["Detail"].default_value = 4
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"]); nt.links.new(mp.outputs["Vector"], nz.inputs["Vector"])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["To Min"].default_value = rough - 0.07; mr.inputs["To Max"].default_value = rough + 0.1
    nt.links.new(nz.outputs["Fac"], mr.inputs["Value"]); nt.links.new(mr.outputs["Result"], b.inputs["Roughness"])
    bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.06
    nt.links.new(nz.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Base Color"].default_value = color
    b.inputs["Metallic"].default_value = metal
    b.inputs["Anisotropic"].default_value = 0.6
    _mats[key] = m
    return m

def wood_mat():
    if "wood" in _mats: return _mats["wood"]
    m, nt, b = new_mat("wood")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (0.5, 7, 7)
    nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 3.2; nz.inputs["Detail"].default_value = 6
    nz.inputs["Distortion"].default_value = 1.2
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"]); nt.links.new(mp.outputs["Vector"], nz.inputs["Vector"])
    cr = nt.nodes.new("ShaderNodeValToRGB")
    cr.color_ramp.elements[0].position = 0.3; cr.color_ramp.elements[0].color = hexc("#6e3418")
    cr.color_ramp.elements[1].position = 0.75; cr.color_ramp.elements[1].color = hexc("#b9703c")
    nt.links.new(nz.outputs["Fac"], cr.inputs["Fac"]); nt.links.new(cr.outputs["Color"], b.inputs["Base Color"])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["To Min"].default_value = 0.28; mr.inputs["To Max"].default_value = 0.5
    nt.links.new(nz.outputs["Fac"], mr.inputs["Value"]); nt.links.new(mr.outputs["Result"], b.inputs["Roughness"])
    bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.08
    nt.links.new(nz.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Coat Weight"].default_value = 0.35; b.inputs["Coat Roughness"].default_value = 0.15
    _mats["wood"] = m
    return m

def wall_mat():
    m, nt, b = new_mat("wall")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    br = nt.nodes.new("ShaderNodeTexBrick")
    br.offset = 0.0; br.squash = 1.0
    br.inputs["Color1"].default_value = hexc("#c9c1b3")
    br.inputs["Color2"].default_value = hexc("#c2b9ab")
    br.inputs["Mortar"].default_value = hexc("#938b7d")
    br.inputs["Scale"].default_value = 1.0
    br.inputs["Mortar Size"].default_value = 0.022
    br.inputs["Mortar Smooth"].default_value = 0.25
    br.inputs["Bias"].default_value = 0.0
    br.inputs["Brick Width"].default_value = 3.2
    br.inputs["Row Height"].default_value = 3.2
    nt.links.new(tc.outputs["Object"], br.inputs["Vector"])
    # faint cloudy variation over the glaze
    nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 0.9; nz.inputs["Detail"].default_value = 5
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    mix = nt.nodes.new("ShaderNodeMixRGB"); mix.blend_type = "MULTIPLY"; mix.inputs["Fac"].default_value = 0.35
    cr = nt.nodes.new("ShaderNodeValToRGB")
    cr.color_ramp.elements[0].position = 0.3; cr.color_ramp.elements[0].color = (0.82, 0.82, 0.82, 1)
    cr.color_ramp.elements[1].position = 0.7; cr.color_ramp.elements[1].color = (1, 1, 1, 1)
    nt.links.new(nz.outputs["Fac"], cr.inputs["Fac"])
    nt.links.new(br.outputs["Color"], mix.inputs["Color1"]); nt.links.new(cr.outputs["Color"], mix.inputs["Color2"])
    nt.links.new(mix.outputs["Color"], b.inputs["Base Color"])
    # roughness: satin tile, matt grout, small patches
    nz2 = nt.nodes.new("ShaderNodeTexNoise"); nz2.inputs["Scale"].default_value = 2.5; nz2.inputs["Detail"].default_value = 8
    nt.links.new(tc.outputs["Object"], nz2.inputs["Vector"])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["To Min"].default_value = 0.42; mr.inputs["To Max"].default_value = 0.62
    nt.links.new(nz2.outputs["Fac"], mr.inputs["Value"])
    rm = nt.nodes.new("ShaderNodeMixRGB"); rm.inputs["Color2"].default_value = (0.9, 0.9, 0.9, 1)
    nt.links.new(br.outputs["Fac"], rm.inputs["Fac"]); nt.links.new(mr.outputs["Result"], rm.inputs["Color1"])
    nt.links.new(rm.outputs["Color"], b.inputs["Roughness"])
    # grout sits a hair below the tile; the glaze is slightly uneven
    inv = nt.nodes.new("ShaderNodeMath"); inv.operation = "SUBTRACT"; inv.inputs[0].default_value = 1.0
    nt.links.new(br.outputs["Fac"], inv.inputs[1])
    addn = nt.nodes.new("ShaderNodeMath"); addn.operation = "MULTIPLY_ADD"; addn.inputs[1].default_value = 0.05
    nt.links.new(nz2.outputs["Fac"], addn.inputs[0]); nt.links.new(inv.outputs[0], addn.inputs[2])
    bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.35; bp.inputs["Distance"].default_value = 0.02
    nt.links.new(addn.outputs[0], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Specular IOR Level"].default_value = 0.4
    return m

def glass_mat(name, tint):
    m, nt, b = new_mat(name)
    b.inputs["Base Color"].default_value = tint
    b.inputs["Roughness"].default_value = 0.0
    b.inputs["IOR"].default_value = 1.48
    b.inputs["Transmission Weight"].default_value = 1.0
    b.inputs["Coat Weight"].default_value = 0.6
    b.inputs["Coat Roughness"].default_value = 0.02
    m.use_raytrace_refraction = True
    m.thickness_mode = "SPHERE"
    m.use_transparent_shadow = True
    return m

STEEL = lambda: simple_mat("steel-pin", lin([0.80, 0.80, 0.82]), rough=0.22, metal=1.0)

# ───────────────────────────── mesh helpers ─────────────────────────────
def finish(bm, name, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    if smooth:
        me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    return me

def box_mesh(name, lx, ly, lz, bevel):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(lx, ly, lz), verts=bm.verts)
    bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=3, profile=0.5, affect="EDGES")
    return finish(bm, name)

def rod_mesh(name, length, radius):
    """A solid capped cylinder along local X, edges softened."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=40, radius1=radius, radius2=radius, depth=length)
    bmesh.ops.bevel(bm, geom=[e for e in bm.edges if len(e.link_faces) == 2 and any(len(f.verts) > 4 for f in e.link_faces)],
                    offset=radius * 0.12, segments=2, affect="EDGES")
    bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, "Y"), verts=bm.verts)
    return finish(bm, name)

def add_weighted_normals(o):
    md = o.modifiers.new("wn", "WEIGHTED_NORMAL"); md.keep_sharp = False; md.weight = 80

# One merged mesh for every pin, flange and screw head.
hw = bmesh.new()
def hw_cyl(p0, p1, r, seg=14, caps=True):
    d = p1 - p0; L = d.length
    if L < 1e-9: return
    res = bmesh.ops.create_cone(hw, cap_ends=caps, segments=seg, radius1=r, radius2=r, depth=L)
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
    bmesh.ops.transform(hw, matrix=Matrix.Translation((p0 + p1) / 2) @ rot, verts=res["verts"])
def hw_ball(p, r, squash=1.0):
    res = bmesh.ops.create_uvsphere(hw, u_segments=14, v_segments=8, radius=r)
    bmesh.ops.transform(hw, matrix=Matrix.Translation(p) @ Matrix.Diagonal((1, squash, 1, 1)), verts=res["verts"])

def pin(x, y, out_to, r=1.5, head=True):
    """A steel pin from the wall straight out to `out_to`, with a wall flange and a rounded head."""
    hw_cyl(P(x, y, 0), P(x, y, out_to), r * S)
    hw_cyl(P(x, y, 0), P(x, y, 1.6), r * 2.6 * S, seg=20)
    if head: hw_ball(P(x, y, out_to), r * 1.9 * S, squash=0.6)

# ───────────────────────────── animation helpers ─────────────────────────────
def frame_of(t):
    return (t - T0) * FPS + 1.0

def animate(obj, path, cols, frames):
    """cols: list of value arrays (one per array index). Linear keys at `frames` (may be fractional)."""
    if obj.animation_data is None: obj.animation_data_create()
    if obj.animation_data.action is None:
        obj.animation_data.action = bpy.data.actions.new(obj.name + "Action")
    act = obj.animation_data.action
    n = len(frames)
    for idx, vals in enumerate(cols):
        fc = act.fcurve_ensure_for_datablock(obj, path, index=idx)
        fc.keyframe_points.add(n)
        co = np.empty(2 * n); co[0::2] = frames; co[1::2] = vals
        fc.keyframe_points.foreach_set("co", co)
        fc.keyframe_points.foreach_set("interpolation", [1] * n)   # LINEAR
        fc.update()

# ───────────────────────────── wall ─────────────────────────────
ymin = min(min(p[1] for p in r["pts"]) for r in plan["rails"]) if plan["rails"] else plan["field"]["top"]
ymax = max(max(p[1] for p in r["pts"]) for r in plan["rails"]) if plan["rails"] else plan["field"]["bottom"]
ymin = min(ymin, plan["field"]["top"]) - 2500; ymax = max(ymax, plan["field"]["bottom"]) + 2500
bm = bmesh.new()
x0, x1 = FW / 2 - 4500, FW / 2 + 4500
for co in ((x0 * S, -ymax * S, 0), (x1 * S, -ymax * S, 0), (x1 * S, -ymin * S, 0), (x0 * S, -ymin * S, 0)):
    bm.verts.new(co)
bm.faces.new(bm.verts[:])
wall = link(bpy.data.objects.new("wall", finish(bm, "wall", smooth=False)))
wall.rotation_euler = (math.pi / 2, 0, 0)        # local XY -> world XZ, normal toward -Y (the camera)
wall.data.materials.append(wall_mat())

# ───────────────────────────── keys ─────────────────────────────
key_objs = {}
for k in plan["keys"]:
    vis = k["look"]; L, W, D = k["length"], k["width"], k["depth"]
    c = Vector(k["center"]); nrm = Vector(k["normal"]); ang = k["angle"]
    tx = Vector((math.cos(ang), math.sin(ang)))
    col = lin(k["color"])
    ckey = "%02x%02x%02x" % tuple(int(v * 255) for v in k["color"])
    centre_out = PLANE
    along_wall = True                                   # False: the piece points straight out of the wall
    if vis == "brass" and k.get("round"):
        # a small brass bell: a short solid cylinder, end-on to the wall
        me = rod_mesh(k["id"], 50.0 * S, (W / 2) * S)
        mat = brushed("brass", lin([0.95, 0.68, 0.24]), rough=0.22, metal=1.0)
        back = PLANE - 25.0; along_wall = False
    else:
        if vis == "wood":
            D2 = D - 6; me = box_mesh(k["id"], L * S, D2 * S, W * S, 2.2 * S); mat = wood_mat()
        elif vis == "painted":
            D2 = D - 6; me = box_mesh(k["id"], L * S, D2 * S, W * S, 3.2 * S)
            mat = simple_mat("paint-" + ckey, col, rough=0.36, coat=0.25)
        elif vis == "brass":
            D2 = D - 10; me = box_mesh(k["id"], L * S, D2 * S, W * 0.6 * S, 2.0 * S)
            c = c + nrm * (W * 0.2)
            mat = brushed("brass", lin([0.95, 0.68, 0.24]), rough=0.22, metal=1.0)
        elif vis == "vibe":
            D2 = D + 18; me = box_mesh(k["id"], L * S, D2 * S, W * 0.5 * S, 1.2 * S)
            c = c + nrm * (W * 0.25)
            mat = brushed("vibe", lin([0.74, 0.76, 0.79]), rough=0.36, metal=0.6)
        elif vis == "piano":
            D2 = D - 4; me = box_mesh(k["id"], L * S, D2 * S, W * S, 1.6 * S)
            mat = simple_mat("piano", lin([0.94, 0.93, 0.89]), rough=0.18, coat=0.6)
        else:  # felt
            D2 = D; me = box_mesh(k["id"], L * S, D2 * S, W * S, 4.0 * S)
            mat = simple_mat("felt", lin([0.90, 0.86, 0.76]), rough=0.95, spec=0.1)
        back = PLANE - D2 / 2
    o = link(bpy.data.objects.new(k["id"], me))
    me.materials.append(mat)
    add_weighted_normals(o)
    Zw = Vector((nrm.x, 0, -nrm.y))
    Xw = Vector((tx.x, 0, -tx.y)) if along_wall else Vector((0, -1, 0))
    Yw = Zw.cross(Xw)
    rot = Matrix((Xw, Yw, Zw)).transposed()
    base = P(c.x, c.y, centre_out)
    o.matrix_world = Matrix.Translation(base) @ rot.to_4x4()
    key_objs[k["id"]] = o
    # two pins hold it off the wall
    if not along_wall:
        pin(c.x, c.y, back + 3.0, r=2.4, head=False)
    else:
        front = 2 * PLANE - back + 1.5
        for sgn in (-0.3, 0.3):
            q = c + tx * (L * sgn)
            pin(q.x, q.y, front)
    # the dip and ring when the marble lands
    if k["hitT"] is not None:
        amp = (2.2 if vis == "felt" else 4.0) * min(1.3, max(0.5, k["hitSpeed"] / 1000.0))
        ts = [k["hitT"] - 1.0 / FPS, k["hitT"]] + [k["hitT"] + i / FPS for i in range(1, int(0.5 * FPS) + 1)]
        offs = [0.0 if t <= k["hitT"] else -amp * math.sin(46 * (t - k["hitT"])) * math.exp(-9 * (t - k["hitT"])) for t in ts]
        offs[-1] = 0.0
        fr = [frame_of(t) for t in ts]
        loc = [[base[i] + Zw[i] * off * S for off in offs] for i in range(3)]
        animate(o, "location", loc, fr)

# ───────────────────────────── rails ─────────────────────────────
def rail_frames(pts):
    """Per point: the in-plane unit normal toward the wires (the side gravity presses on, y is down)."""
    n = len(pts); nrm = []
    for i in range(n):
        a = Vector(pts[max(0, i - 1)]); b = Vector(pts[min(n - 1, i + 1)])
        t = (b - a).normalized()
        v = Vector((-t.y, t.x))
        nrm.append(v if v.y >= 0 else -v)
    return nrm

def rail_runs(nrm):
    """Index ranges over which the wires stay on one side (a steep rail can swap sides)."""
    runs = []; start = 0
    for i in range(1, len(nrm)):
        if nrm[i].dot(nrm[i - 1]) < 0.2:
            runs.append((start, i)); start = i
    runs.append((start, len(nrm)))
    return [r for r in runs if r[1] - r[0] >= 2]

if plan["rails"]:
    cu = bpy.data.curves.new("rails", "CURVE"); cu.dimensions = "3D"
    cu.bevel_depth = 1.25 * S; cu.bevel_resolution = 3; cu.use_fill_caps = True
    def spline(points):
        sp = cu.splines.new("POLY"); sp.points.add(len(points) - 1)
        for p, q in zip(sp.points, points): p.co = (q.x, q.y, q.z, 1)
    for r in plan["rails"]:
        pts = r["pts"]; rad = r["radius"]; gap = rad * 0.6
        h = math.sqrt((rad + 1.25) ** 2 - gap ** 2)
        nrm = rail_frames(pts)
        for a, b in rail_runs(nrm):
            for side in (-1, 1):
                spline([P(p[0] + n.x * h, p[1] + n.y * h, PLANE + side * gap) for p, n in zip(pts[a:b], nrm[a:b])])
        acc = 0.0; nxt = 6.0; count = 0
        for i in range(1, len(pts)):
            acc += (Vector(pts[i]) - Vector(pts[i - 1])).length
            if acc < nxt: continue
            nxt += 30.0; count += 1
            p = Vector(pts[i]); n = nrm[i]
            # a U-shaped tie under both wires
            arc = []
            for j in range(9):
                a = math.pi * j / 8
                arc.append(P(p.x + n.x * (h + 0.5 + math.sin(a) * gap * 0.75), p.y + n.y * (h + 0.5 + math.sin(a) * gap * 0.75), PLANE - math.cos(a) * gap))
            spline(arc)
            if count % 3 == 1:        # every third tie is held by a pin from the wall
                q = p + n * (h + 0.5 + gap * 0.75)
                pin(q.x, q.y, PLANE, r=1.3, head=True)
    ro = link(bpy.data.objects.new("rails", cu))
    cu.materials.append(STEEL())

hwo = link(bpy.data.objects.new("hardware", finish(hw, "hardware")))
hwo.data.materials.append(STEEL())

# ───────────────────────────── marbles ─────────────────────────────
def marble_pos(m, ts):
    """Marble centre (px) at each time in ts (numpy array)."""
    out = np.zeros((len(ts), 2))
    path = m["path"]
    for i, t in enumerate(ts):
        seg = None
        for s in path:
            if t >= s["t0"]: seg = s
            else: break
        if seg is None: seg = path[0]; t = seg["t0"]
        tt = min(t, seg["t1"]) if seg is path[-1] else t
        if seg["type"] == "fall":
            d = tt - seg["t0"]
            out[i] = (seg["p0"][0] + seg["v0"][0] * d, seg["p0"][1] + seg["v0"][1] * d + 0.5 * G * d * d)
        else:
            pts = np.asarray(seg["pts"]); tsr = np.asarray(seg["ts"])
            out[i] = (np.interp(tt, tsr, pts[:, 0]), np.interp(tt, tsr, pts[:, 1]))
    return out

def swirl_mesh(name, R):
    bm = bmesh.new()
    NU, NV, vanes = 28, 5, 3
    for j in range(vanes):
        grid = []
        for iu in range(NU + 1):
            u = -1 + 2 * iu / NU
            row = []
            for iv in range(NV + 1):
                v = iv / NV
                rr = 0.80 * R * math.sqrt(max(0.0, 1 - u * u)) * (0.06 + 0.94 * v)
                a = j * 2 * math.pi / vanes + 2.6 * u
                row.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), 0.80 * R * u)))
            grid.append(row)
        for iu in range(NU):
            for iv in range(NV):
                f = bm.faces.new((grid[iu][iv], grid[iu + 1][iv], grid[iu + 1][iv + 1], grid[iu][iv + 1]))
                f.material_index = j % 2
    return finish(bm, name)

n_frames = int(math.ceil((T1 - T0) * FPS))
frame_ts = T0 + np.arange(n_frames + 2) / FPS
marble_tracks = {}
for m in plan["marbles"]:
    R = m["radius"]
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=32, radius=R * S)
    mo = link(bpy.data.objects.new("marble-" + m["id"], finish(bm, "marble-" + m["id"])))
    sw0, sw1 = m["swirl"][0], m["swirl"][-1]
    mixc = [(a + b) / 2 for a, b in zip(sw0, sw1)]
    mx = max(mixc); tint = [0.30 + 0.70 * (v / mx) ** 0.8 for v in mixc]      # saturated glass in the swirl's own hue
    mo.data.materials.append(glass_mat("glass-" + m["id"], lin(tint)))
    sw = link(bpy.data.objects.new("swirl-" + m["id"], swirl_mesh("swirl-" + m["id"], R * S)))
    for i, c in enumerate(m["swirl"]):
        sw.data.materials.append(simple_mat("swirl-%s-%d" % (m["id"], i), lin(c), rough=0.35, emit=0.8))
    sd = sw.modifiers.new("solid", "SOLIDIFY"); sd.thickness = 0.20 * R * S; sd.offset = 0
    sw.parent = mo
    sw.visible_shadow = False
    # keys at every frame plus exactly at every bounce, so the marble really touches the key
    extra = [s["t0"] for s in m["path"]] + [s["t1"] for s in m["path"]]
    ts = np.unique(np.concatenate([frame_ts, np.asarray([t for t in extra if T0 <= t <= T1])]))
    pos = marble_pos(m, ts)
    fr = (ts - T0) * FPS + 1.0
    animate(mo, "location", [pos[:, 0] * S, np.full(len(ts), -PLANE * S), -pos[:, 1] * S], fr)
    # roll with the sideways travel, plus a slow tumble so the swirl keeps turning
    dx = np.concatenate([[0], np.diff(pos[:, 0])]); dy = np.concatenate([[0], np.diff(pos[:, 1])])
    roll = np.cumsum(dx) / (1.25 * R)
    tumble = np.cumsum(np.hypot(dx, dy)) / (9.0 * R)
    animate(mo, "rotation_euler", [0.9 + tumble, roll, 0.4 + 0.5 * tumble], fr)
    marble_tracks[m["id"]] = marble_pos(m, frame_ts)

# ───────────────────────────── light ─────────────────────────────
sun_d = bpy.data.lights.new("sun", "SUN")
sun_d.energy = 5.0; sun_d.color = (1.0, 0.95, 0.88); sun_d.angle = math.radians(8.5)
sun_d.use_shadow = True
try:
    sun_d.use_shadow_jitter = True; sun_d.shadow_jitter_overblur = 12
    sun_d.shadow_filter_radius = 1.0; sun_d.shadow_maximum_resolution = 0.002
except Exception as e: print("sun shadow option:", e)
sun = link(bpy.data.objects.new("sun", sun_d))
travel = Vector((0.80, 0.52, -0.50)).normalized()            # from upper-left, raking across the wall
sun.rotation_euler = Vector((0, 0, -1)).rotation_difference(travel).to_euler()

world = bpy.data.worlds.new("world"); scene.world = world; world.use_nodes = True
nt = world.node_tree; nt.nodes.clear()
outn = nt.nodes.new("ShaderNodeOutputWorld"); bg = nt.nodes.new("ShaderNodeBackground")
tc = nt.nodes.new("ShaderNodeTexCoord")
def softbox(direction, cos_half, strength, color):
    dot = nt.nodes.new("ShaderNodeVectorMath"); dot.operation = "DOT_PRODUCT"
    dot.inputs[1].default_value = Vector(direction).normalized()
    nt.links.new(tc.outputs["Generated"], dot.inputs[0])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.interpolation_type = "SMOOTHSTEP"
    mr.inputs["From Min"].default_value = cos_half - 0.06; mr.inputs["From Max"].default_value = cos_half
    mr.inputs["To Max"].default_value = strength
    nt.links.new(dot.outputs["Value"], mr.inputs["Value"])
    mul = nt.nodes.new("ShaderNodeMixRGB"); mul.blend_type = "MULTIPLY"; mul.inputs["Fac"].default_value = 1.0
    mul.inputs["Color1"].default_value = color
    nt.links.new(mr.outputs["Result"], mul.inputs["Color2"])
    return mul.outputs["Color"]
base = nt.nodes.new("ShaderNodeRGB"); base.outputs[0].default_value = (0.50, 0.53, 0.60, 1)   # cool fill against the warm sun
acc = base.outputs[0]
for d, ch, st, colr in (((-0.75, -0.55, 0.5), 0.86, 7.0, (1, 0.96, 0.9, 1)),      # key-side softbox
                        ((0.9, -0.4, -0.1), 0.90, 3.0, (0.85, 0.92, 1, 1)),       # rim
                        ((0.0, -0.3, 1.0), 0.80, 2.0, (1, 1, 1, 1))):             # top
    a = nt.nodes.new("ShaderNodeMixRGB"); a.blend_type = "ADD"; a.inputs["Fac"].default_value = 1.0
    nt.links.new(acc, a.inputs["Color1"]); nt.links.new(softbox(d, ch, st, colr), a.inputs["Color2"]); acc = a.outputs["Color"]
nt.links.new(acc, bg.inputs["Color"]); bg.inputs["Strength"].default_value = 0.24
nt.links.new(bg.outputs["Background"], outn.inputs["Surface"])

# ───────────────────────────── camera ─────────────────────────────
cam_d = bpy.data.cameras.new("cam")
LENS = 22.0
if portrait: cam_d.sensor_fit = "VERTICAL"; cam_d.sensor_height = 36.0
else: cam_d.sensor_fit = "HORIZONTAL"; cam_d.sensor_width = 36.0
cam_d.lens = LENS
cam_d.clip_start = 0.05; cam_d.clip_end = 500
cam = link(bpy.data.objects.new("cam", cam_d)); scene.camera = cam

half_fov_x = math.atan(18.0 / LENS * (A.width / A.height if portrait else 1.0))
half_fov_y = math.atan(18.0 / LENS * (1.0 if portrait else A.height / A.width))
tan_x, tan_y = math.tan(half_fov_x), math.tan(half_fov_y)

first_hit_y = min(k["center"][1] for k in plan["keys"])
def line_y(t):
    tc_ = min(max(t, plan["firstNote"] - 0.9), plan["lastHit"] + 1.4)
    return first_hit_y + plan["sink"] * (tc_ - plan["firstNote"])

def smooth(a, tau):
    k = 1 - math.exp(-1.0 / (tau * FPS)); out = np.array(a, dtype=float)
    for i in range(1, len(out)): out[i] = out[i - 1] + (out[i] - out[i - 1]) * k
    for i in range(len(out) - 2, -1, -1): out[i] = out[i + 1] + (out[i] - out[i + 1]) * k
    return out

xs_all = np.stack([marble_tracks[m["id"]][:, 0] for m in plan["marbles"]])
ys_all = np.stack([marble_tracks[m["id"]][:, 1] for m in plan["marbles"]])
x_lo = np.clip(xs_all.min(axis=0), -60, FW + 60); x_hi = np.clip(xs_all.max(axis=0), -60, FW + 60)
mean_y = ys_all.mean(axis=0)
# Stay as close as the marbles allow: the frame is just wide enough for both, with room to breathe,
# and the camera dollies gently in and out as they drift apart and together.
win = int(0.9 * FPS)
sep = x_hi - x_lo
sep_env = np.array([sep[max(0, i - win):i + win + 1].max() for i in range(len(sep))])
want_w = smooth(np.clip(sep_env + 200.0, 400.0, FW + 40.0), 0.7)
dist_a = np.maximum(want_w / 2 / tan_x, 235.0 / tan_y)
tx_ = smooth((x_lo + x_hi) / 2, 0.55)
half_w = dist_a * tan_x
tx_ = np.clip(tx_, np.minimum(half_w - 70.0, FW / 2), np.maximum(FW + 70.0 - half_w, FW / 2))   # do not stare at bare wall beside the run
view_h = 2 * dist_a * tan_y
ty_raw = np.array([line_y(t + 0.25) for t in frame_ts]) + view_h * 0.07
# mostly the steady descent; on the rails (before the first key, after the last) follow the marbles themselves
w_m = np.array([0.2 + 0.8 * min(1.0, max(0.0, (plan["firstNote"] + 0.5 - t) / 1.2)) + 0.6 * min(1.0, max(0.0, (t - plan["lastHit"] - 0.2) / 1.0)) for t in frame_ts])
ty_raw = (1 - w_m) * ty_raw + w_m * (mean_y + view_h * 0.05)
ty_ = smooth(ty_raw, 0.35)
PITCH = math.radians(11.0)
focus = link(bpy.data.objects.new("focus", None))
cam_loc = [[], [], []]; cam_rot = [[], [], []]; foc_loc = [[], [], []]
for i, t in enumerate(frame_ts):
    yaw = math.radians(9.0) * math.sin(0.33 * t + 0.6) + math.radians(3.0) * math.sin(0.9 * t)
    pitch = PITCH + math.radians(4.0) * math.sin(0.27 * t + 2.0)
    dist = dist_a[i] * (1.0 + 0.03 * math.sin(0.41 * t + 1.0))
    target = P(tx_[i], ty_[i])
    offs = Vector((math.sin(yaw) * math.cos(pitch), -math.cos(yaw) * math.cos(pitch), math.sin(pitch))) * dist * S
    loc = target + offs
    fwd = (target - loc).normalized()
    rot = fwd.to_track_quat("-Z", "Y").to_matrix()
    rot = rot @ Matrix.Rotation(math.radians(1.6) * math.sin(0.5 * t), 3, "Z")
    e = rot.to_euler("XYZ")
    for j in range(3): cam_loc[j].append(loc[j]); cam_rot[j].append(e[j]); foc_loc[j].append(target[j])
fr_all = (frame_ts - T0) * FPS + 1.0
animate(cam, "location", cam_loc, fr_all)
animate(cam, "rotation_euler", cam_rot, fr_all)
animate(focus, "location", foc_loc, fr_all)
cam_d.dof.use_dof = True
cam_d.dof.focus_object = focus
cam_d.dof.aperture_fstop = 1.4
cam_d.dof.aperture_blades = 0

# ───────────────────────────── render settings ─────────────────────────────
r = scene.render
r.resolution_x, r.resolution_y, r.resolution_percentage = A.width, A.height, 100
r.fps = max(1, int(round(FPS))); r.fps_base = r.fps / FPS
scene.frame_start, scene.frame_end = 1, n_frames
r.image_settings.file_format = "PNG"; r.image_settings.color_mode = "RGB"; r.image_settings.compression = 15
r.use_motion_blur = True; r.motion_blur_shutter = 0.5
r.use_persistent_data = True
# Standard keeps the instruments' saturated paint; AgX and Filmic wash the colours toward pastel.
scene.view_settings.view_transform = "Standard"
try: scene.view_settings.look = "None"
except Exception: pass
scene.view_settings.exposure = -0.35

if A.engine == "cycles":
    r.engine = "CYCLES"
    cy = scene.cycles; cy.samples = A.samples; cy.use_denoising = True
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"; prefs.get_devices()
        for d in prefs.devices: d.use = True
        cy.device = "GPU"
    except Exception as e: print("cycles gpu:", e)
    cy.max_bounces = 8; cy.transmission_bounces = 8; cy.caustics_refractive = True
else:
    r.engine = "BLENDER_EEVEE"
    ee = scene.eevee
    ee.taa_render_samples = A.samples
    ee.use_shadows = True
    ee.shadow_ray_count = 1 if A.fast else 2
    ee.shadow_step_count = 4 if A.fast else 8
    ee.shadow_resolution_scale = 1.0
    ee.use_raytracing = True
    ee.ray_tracing_method = "SCREEN"
    rt = ee.ray_tracing_options
    rt.resolution_scale = "2" if A.fast else "1"
    rt.trace_max_roughness = 0.5
    rt.screen_trace_quality = 0.25 if A.fast else 0.6
    ee.use_fast_gi = True
    ee.fast_gi_method = "GLOBAL_ILLUMINATION"
    ee.fast_gi_distance = 0.0
    ee.fast_gi_resolution = "2"
    ee.motion_blur_steps = 1
    ee.use_bokeh_jittered = not A.fast
    ee.use_overscan = True; ee.overscan_size = 6.0

if os.environ.get("MV_TWEAK"): exec(os.environ["MV_TWEAK"])      # for experiments only
os.makedirs(A.out, exist_ok=True)
if A.save:
    bpy.ops.wm.save_as_mainfile(filepath=A.save)

t_start = time.time()
if A.stills:
    for s in A.stills.split(","):
        t = float(s); f = frame_of(t)
        scene.frame_set(int(math.floor(f)), subframe=f - math.floor(f))
        r.filepath = os.path.join(A.out, "still_%07.3f.png" % t)
        bpy.ops.render.render(write_still=True)
        print("STILL", t, r.filepath, "%.1fs" % (time.time() - t_start), flush=True)
else:
    if A.frames:
        a, b = A.frames.split(":"); scene.frame_start, scene.frame_end = int(a), int(b)
    r.filepath = os.path.join(A.out, "f_")
    bpy.ops.render.render(animation=True)
print("RENDER_SECONDS %.1f FRAMES %d" % (time.time() - t_start, scene.frame_end - scene.frame_start + 1), flush=True)
