import bpy,math
from pathlib import Path
B=Path('/Users/jehadjaghoub/Documents/Codex/2026-10-31/ple');W=B/'work/stone-showroom/dist/assets'
bpy.ops.wm.open_mainfile(filepath=str(B/'outputs/Photographic_Rooms/salon.blend'));s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=48;s.cycles.use_denoising=True;s.render.bake.margin=10
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
s.cycles.device='GPU'
for o in bpy.data.objects:
 if o.type=='MESH':o.hide_render=False
 if o.get('base') and o['base']!='fluted':o.hide_render=True
# Close the unseen front and right walls for physically plausible room occlusion.
for pos,size in [((0,-4,1.9),(7.2,.1,3.8)),((3.6,-.8,1.9),(.1,6.4,3.8))]:
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.dimensions=size;m=bpy.data.materials.new('Bounce wall');m.diffuse_color=(.3,.18,.12,1);m.use_nodes=True;m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.3,.18,.12,1);o.data.materials.append(m)
# Reusable chair-only irradiance atlas, one furniture variant at a time.
outputs=[]
for style in ['atelier','gallery']:
 for o in bpy.data.objects:
  if o.get('furniture'):o.hide_render=o['furniture']!=style
  if o.get('chairLit'):o.hide_render=True
 chairs=[o for o in bpy.data.objects if o.type=='MESH' and o.get('chair') and o.get('furniture')==style and not o.get('chairLit')]
 bpy.ops.object.select_all(action='DESELECT')
 for o in chairs:
  o.select_set(True);bpy.context.view_layer.objects.active=o
  for mod in list(o.modifiers):
   try:bpy.ops.object.modifier_apply(modifier=mod.name)
   except:pass
  for slot in o.material_slots:
   m=slot.material.copy();slot.material=m;m['chairSurface']='fabric' if o.get('upholstery') else 'welt' if o.get('seam') else 'metal' if ('brass' in o.name.lower() or 'bronze' in o.name.lower()) else 'wood'
   if o.get('upholstery') or o.get('seam'):
    pn=m.node_tree.nodes.get('Principled BSDF');pn.inputs['Base Color'].default_value=(.18,.18,.18,1) if o.get('upholstery') else (.108,.108,.108,1)
  o.data.uv_layers.new(name='ChairLight');o.data.uv_layers.active=o.data.uv_layers.get('ChairLight')
 bpy.context.view_layer.objects.active=chairs[0];bpy.ops.object.join();obj=bpy.context.object;obj.name='Tailored chairs | '+style;obj['chairLit']=True;obj['furniture']=style
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(70),island_margin=.004);bpy.ops.object.mode_set(mode='OBJECT')
 im=bpy.data.images.new('Chair soft illumination '+style,width=2048,height=2048,alpha=False);im.colorspace_settings.name='sRGB'
 for m in obj.data.materials:
  tx=m.node_tree.nodes.new('ShaderNodeTexImage');tx.image=im;m.node_tree.nodes.active=tx
 s.render.bake.use_pass_direct=True;s.render.bake.use_pass_indirect=True;s.render.bake.use_pass_color=True
 bpy.ops.object.bake(type='DIFFUSE',use_clear=True)
 # Denoise once offline, preserving stable movement in browser.
 comp=bpy.data.scenes.new('Chair atlas denoise');cam=bpy.data.objects.new('Atlas camera',bpy.data.cameras.new('Atlas camera'));comp.collection.objects.link(cam);comp.camera=cam;comp.render.engine='CYCLES';comp.cycles.samples=1;comp.render.resolution_x=2048;comp.render.resolution_y=2048;comp.render.resolution_percentage=100;comp.view_settings.view_transform='Standard';comp.view_settings.look='None'
 ng=bpy.data.node_groups.new('Chair lighting denoise','CompositorNodeTree');ng.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor');comp.compositing_node_group=ng
 ni=ng.nodes.new('CompositorNodeImage');ni.image=im;dn=ng.nodes.new('CompositorNodeDenoise');out=ng.nodes.new('NodeGroupOutput');ng.links.new(ni.outputs['Image'],dn.inputs['Image']);ng.links.new(dn.outputs['Image'],out.inputs['Image']);comp.render.image_settings.file_format='PNG';comp.render.filepath=str(B/'work'/('chair-light-'+style+'.png'));bpy.ops.render.render(write_still=True,scene=comp.name);im=bpy.data.images.load(comp.render.filepath);bpy.context.window.scene=s
 category={}
 for m in list(obj.data.materials):
  key=m.get('chairSurface','wood')
  if key not in category:
   mm=bpy.data.materials.new('Chair light | '+key);mm['chairSurface']=key;mm.use_nodes=True;n=mm.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');em=n.new('ShaderNodeEmission');tx=n.new('ShaderNodeTexImage');tx.image=im;uv=n.new('ShaderNodeUVMap');uv.uv_map='ChairLight';mm.node_tree.links.new(uv.outputs[0],tx.inputs[0]);mm.node_tree.links.new(tx.outputs[0],em.inputs[0]);mm.node_tree.links.new(em.outputs[0],out.inputs[0]);category[key]=mm
  idx=obj.data.materials.find(m.name);obj.data.materials[idx]=category[key]
 outputs.append(obj);obj.hide_render=True
bpy.ops.object.select_all(action='DESELECT')
for o in outputs:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(W/'salon-chairs-lit.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_image_format='JPEG',export_jpeg_quality=96)
print('CHAIR_LIGHTING_COMPLETE',flush=True)
