import bpy,sys,math,os
from pathlib import Path
B=Path('/Users/jehadjaghoub/Documents/Codex/2026-10-31/ple'); room=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'living'
bpy.ops.wm.open_mainfile(filepath=str(B/'outputs/Photographic_Rooms'/f'{room}.blend'))
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=32;s.cycles.use_denoising=True;s.cycles.device='CPU';s.render.bake.margin=12
prefs=bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type='METAL';prefs.get_devices()
for device in prefs.devices:device.use=device.type=='METAL'
s.cycles.device='GPU'
# Retain the original furniture as shadow casters but export it separately for configuration.
interior=[o for o in bpy.data.objects if o.type=='MESH' and not o.get('part') and not o.name.startswith('Reflected')]
receivers=[]
for o in interior:
 if len(o.data.polygons)==0 or o.get('configurable'):continue
 if any(k in o.name.lower() for k in ['pachira','plant','curtain','mirror','sofa','arm_chair','dining_chair']):continue
 metallic=False
 for m in o.data.materials:
  if m and m.use_nodes:
   p=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
   if p and p.inputs['Metallic'].default_value>.5:metallic=True
 if not metallic:receivers.append(o)
print('BAKE_RECEIVERS',len(receivers),flush=True)
bpy.ops.object.select_all(action='DESELECT')
for o in receivers:
 o.hide_set(False);o.select_set(True)
 bpy.context.view_layer.objects.active=o
 for mod in list(o.modifiers):
  try:bpy.ops.object.modifier_apply(modifier=mod.name)
  except:pass
 uv=o.data.uv_layers.new(name='BakedSurface');o.data.uv_layers.active=uv
# Multi-object unwrap packs one atlas without changing the original texture coordinates.
bpy.context.view_layer.objects.active=receivers[0]
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.003,area_weight=.8);bpy.ops.object.mode_set(mode='OBJECT')
im=bpy.data.images.new('Baked daylight surface',width=4096,height=4096,alpha=False,float_buffer=False);im.colorspace_settings.name='sRGB'
for o in receivers:
 # Unique materials ensure target node ownership and preserve the source appearance.
 for slot in o.material_slots:
  if not slot.material:continue
  slot.material=slot.material.copy();m=slot.material;m.use_nodes=True
  n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=im;m.node_tree.nodes.active=n
# Keep generated texture coordinates stable when merging the bake receivers.
for o in receivers:
 attr=o.data.attributes.new(name='sourceGenerated',type='FLOAT_VECTOR',domain='CORNER')
 coords=[v.co for v in o.data.vertices];lo=[min(v[k] for v in coords) for k in range(3)];hi=[max(v[k] for v in coords) for k in range(3)]
 for i,loop in enumerate(o.data.loops):
  c=o.data.vertices[loop.vertex_index].co;attr.data[i].vector=[(c[k]-lo[k])/max(hi[k]-lo[k],1e-6) for k in range(3)]
 for m in o.data.materials:
  if not m:continue
  nodes=m.node_tree.nodes;links=m.node_tree.links;a=nodes.new('ShaderNodeAttribute');a.attribute_name='sourceGenerated'
  for link in list(links):
   if link.from_node.type=='TEX_COORD' and link.from_socket.name=='Generated':links.new(a.outputs['Vector'],link.to_socket)
  for node in nodes:
   if node.type=='TEX_NOISE' and not node.inputs['Vector'].is_linked:links.new(a.outputs['Vector'],node.inputs['Vector'])
dynamic=[o for o in interior if o not in receivers]
bpy.context.view_layer.objects.active=receivers[0];bpy.ops.object.join();joined=bpy.context.view_layer.objects.active;joined.name='Studio baked architecture';joined.data.uv_layers.active=joined.data.uv_layers.get('BakedSurface');receivers=[joined];interior=dynamic+[joined]
print('BAKE_MERGED',room,flush=True)
# Bake colour and physically calculated diffuse illumination; glossy parts remain dynamic.
s.render.bake.use_pass_direct=True;s.render.bake.use_pass_indirect=True;s.render.bake.use_pass_color=True
bpy.ops.object.bake(type='DIFFUSE',use_clear=True)
im.filepath_raw=str(B/'work'/f'{room}-baked-day.png');im.file_format='PNG';im.save()
# Denoise once offline; the browser never needs to accumulate these shadows.
comp=bpy.data.scenes.new('Atlas denoise');cam=bpy.data.objects.new('Atlas camera',bpy.data.cameras.new('Atlas camera'));comp.collection.objects.link(cam);comp.camera=cam
comp.render.engine='CYCLES';comp.cycles.samples=1;comp.render.resolution_x=4096;comp.render.resolution_y=4096;comp.render.resolution_percentage=100;comp.view_settings.view_transform='Standard';comp.view_settings.look='None';comp.view_settings.exposure=0
ng=bpy.data.node_groups.new('Baked lighting denoise','CompositorNodeTree');ng.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor');comp.compositing_node_group=ng
ni=ng.nodes.new('CompositorNodeImage');ni.image=im;dn=ng.nodes.new('CompositorNodeDenoise');out=ng.nodes.new('NodeGroupOutput');ng.links.new(ni.outputs['Image'],dn.inputs['Image']);ng.links.new(dn.outputs['Image'],out.inputs['Image'])
comp.render.image_settings.file_format='PNG';comp.render.filepath=str(B/'work'/f'{room}-baked-clean.png');bpy.ops.render.render(write_still=True,scene=comp.name)
im=bpy.data.images.load(comp.render.filepath,check_existing=False)
bpy.context.window.scene=s
m=bpy.data.materials.new('Baked daylight | camera-independent');m.use_nodes=True;n=m.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');em=n.new('ShaderNodeEmission');tex=n.new('ShaderNodeTexImage');tex.image=im;uv=n.new('ShaderNodeUVMap');uv.uv_map='BakedSurface';m.node_tree.links.new(uv.outputs[0],tex.inputs[0]);m.node_tree.links.new(tex.outputs[0],em.inputs[0]);m.node_tree.links.new(em.outputs[0],out.inputs[0])
for o in receivers:
 o.data.materials.clear();o.data.materials.append(m)
 for p in o.data.polygons:p.material_index=0
 o['bakedDaylight']=True
bpy.ops.object.select_all(action='DESELECT')
for o in interior:o.select_set(True)
# Preserve 2K material detail for remaining dynamic assets.
bpy.ops.export_scene.gltf(filepath=str(B/'work'/f'{room}-baked-interior.glb'),export_format='GLB',use_selection=True,export_apply=True,export_image_format='JPEG',export_jpeg_quality=95,export_extras=True)
print('BAKED_ROOM_COMPLETE',room,flush=True)
