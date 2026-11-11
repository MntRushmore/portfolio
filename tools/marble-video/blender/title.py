# Renders text overlays as transparent PNGs (ffmpeg here has no drawtext).
#   Blender -b --factory-startup --python title.py -- --spec spec.json
# spec: { width, height, font, images: [{ out, lines: [{ text, size, y }] }] }   size and y in output px, y from the top
import bpy, sys, json
spec = json.load(open(sys.argv[sys.argv.index("--spec") + 1]))
W, H = spec["width"], spec["height"]
scene = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
font = bpy.data.fonts.load(spec["font"])
mat = bpy.data.materials.new("white"); mat.use_nodes = True
nt = mat.node_tree; nt.nodes.clear()
em = nt.nodes.new("ShaderNodeEmission"); em.inputs["Color"].default_value = (1, 1, 1, 1)
out = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(em.outputs[0], out.inputs["Surface"])
cd = bpy.data.cameras.new("c"); cd.type = "ORTHO"; cd.ortho_scale = max(W, H)
cam = bpy.data.objects.new("c", cd); scene.collection.objects.link(cam); cam.location = (0, 0, 10); scene.camera = cam
r = scene.render
r.engine = "BLENDER_EEVEE"; scene.eevee.taa_render_samples = 16
r.resolution_x, r.resolution_y, r.resolution_percentage = W, H, 100
r.film_transparent = True
r.image_settings.file_format = "PNG"; r.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "Standard"
world = bpy.data.worlds.new("w"); scene.world = world
for im in spec["images"]:
    objs = []
    for ln in im["lines"]:
        c = bpy.data.curves.new("t", "FONT"); c.body = ln["text"]; c.font = font; c.size = ln["size"]; c.align_x = "CENTER"
        c.space_character = ln.get("tracking", 1.0)
        o = bpy.data.objects.new("t", c); scene.collection.objects.link(o); c.materials.append(mat)
        o.location = (0, H / 2 - ln["y"], 0)
        bpy.context.view_layer.update()
        if o.dimensions.x > 0.86 * W:
            k = 0.86 * W / o.dimensions.x; o.scale = (k, k, k)
        objs.append(o)
    r.filepath = im["out"]
    bpy.ops.render.render(write_still=True)
    for o in objs: bpy.data.objects.remove(o)
