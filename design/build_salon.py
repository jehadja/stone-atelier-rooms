import bpy, math, random
from pathlib import Path
from mathutils import Vector
from math import sin,cos,pi
B=Path('/Users/jehadjaghoub/Documents/Codex/2026-10-31/ple');WEB=B/'work/stone-showroom/dist/assets'
bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene
root=bpy.data.collections.new('Salon interior');s.collection.children.link(root)
# Reuse the established modelling helpers, preserving the approved renderer.
src=(B/'work/build_real_rooms.py').read_text();A=str(B/'work/real-assets')
exec(src[src.index('def move('):src.index('plaster=mat(')])
wall=mat('Terracotta lacquered plaster',(.31,.155,.09),.78);trim=mat('Warm panel mouldings',(.35,.18,.105),.48)
bronze=mat('Patinated bronze',(.47,.28,.105),.25,1);dark=mat('Ebonised timber',(.018,.014,.011),.38);ivory=mat('Ivory lacquer',(.72,.65,.52),.29);cloth=mat('Champagne velvet',(.47,.29,.19),.83);ceramic=mat('Porcelain',(.8,.76,.65),.2)
floor=texture(mat('Grey limestone',(.32,.29,.25),.52),'oak_wood_planks','wood',1)
# Limestone-like subtle striation rather than timber board colour.
p=floor.node_tree.nodes.get('Principled BSDF')
for l in list(floor.node_tree.links):
 if l.to_socket==p.inputs['Base Color']:floor.node_tree.links.remove(l)
p.inputs['Base Color'].default_value=(.28,.25,.21,1)
for ix in range(7):
 for iy in range(7):box('Honed stone floor tile',(-3+ix, -3+iy,-.045),(.998,.998,.08),floor,.002)
# A grand central window with two wall wings and a high lintel.
for x in [-2.35,2.35]:box('Panelled wall',(x,2.4,1.9),(2.5,.16,3.8),wall,.005)
box('Window lintel',(0,2.4,3.57),(2.2,.16,.46),wall,.005)
box('Left return',(-3.6,0,1.9),(.16,4.8,3.8),wall,.005)
box('Ceiling',(0,0,3.85),(7.2,4.8,.1),ivory,.005)
for x in [-2.35,2.35]:
 for xx in [x-.98,x+.98]:box('Panel moulding',(xx,2.30,1.95),(.022,.025,3.25),trim,.004)
 for z in [.325,3.575]:box('Panel moulding',(x,2.30,z),(1.98,.025,.022),trim,.004)
 box('Double skirting',(x,2.285,.13),(2.5,.035,.16),trim,.003)
for z in [3.74,3.68]:box('Cornice',(0,2.28,z),(7.2,.07,.035),trim,.006)
# Soft bright view beyond the actual window opening.
sky=mat('Hazy daylight',(.72,.79,.83),1);pn=sky.node_tree.nodes.get('Principled BSDF');pn.inputs['Emission Color'].default_value=(.72,.79,.83,1);pn.inputs['Emission Strength'].default_value=.6
box('Distant daylight',(0,5,2),(4,.02,5),sky,0)
city=mat('Distant stone skyline',(.54,.61,.66),1)
random.seed(19)
for i in range(14):
 h=random.uniform(.4,1.25);box('Distant city',(-1.8+i*.28,4.8,h/2),(.22,.12,h),city,.004)
curtain=mat('Curtain warm silk',(.68,.61,.51),.88)
for center,width in [(-1.02,.55),(1.02,.55)]:
 vs=[];fs=[]
 for iz in range(31):
  for ix in range(81):
   u=ix/80;v=iz/30;vs.append((center+(u-.5)*width,2.12+sin(u*pi*16)*.065+.01*sin(v*7+u*9),.035+v*3.35))
 for iz in range(30):
  for ix in range(80):a=iz*81+ix;fs.append((a,a+1,a+82,a+81))
 me=bpy.data.meshes.new('Silk folds');me.from_pydata(vs,[],fs);o=bpy.data.objects.new('Tailored curtain',me);root.objects.link(o);o.data.materials.append(curtain)
 for f in me.polygons:f.use_smooth=True
# Bronze-rimmed circular mirrors.
mirror=mat('Mirror silver',(.8,.81,.8),.015,1)
for x,z,r in [(-2.5,2.55,.32),(-2.8,1.96,.34),(-2.12,2.03,.34),(-2.45,1.4,.31)]:
 o=cyl('Mirror bronze rim',(x,2.19,z),r+.018,.055,bronze);o.rotation_euler.x=pi/2
 o=cyl('Mirror silver',(x,2.155,z),r,.008,mirror);o.rotation_euler.x=pi/2
# Rounded fluted cabinetry; two distinct furniture collections.
def tag(o,key,value):o[key]=value;o['configurable']=True;return o
def cabinet(style):
 before=set(bpy.data.objects);x=2.25;y=1.96
 bodymat=ivory if style=='atelier' else dark
 box('Rounded credenza',(x,y,.48),(1.92,.46,.68),bodymat,.12)
 box('Bronze cabinet top',(x,y,.835),(1.95,.48,.025),bronze,.07)
 for dx in [-.9,.9]:
  for j in range(12):
   a=pi*(j/11);cyl('Cabinet fluting',(x+dx+.08*cos(a),y-.19-.04*sin(a),.48),.013,.61,bodymat)
 for dx in [-.55,0,.55]:box('Door reveal',(x+dx,y-.236,.48),(.004,.005,.58),dark,.001)
 for dx in [-.77,.77]:cyl('Cabinet bronze leg',(x+dx,y,.09),.012,.18,bronze)
 if style=='gallery':
  for dx in [-.45,.45]:cyl('Cabinet pull',(x+dx,y-.25,.5),.008,.16,bronze)
 for o in set(bpy.data.objects)-before:tag(o,'furniture',style)
cabinet('atelier');cabinet('gallery')
# Tall textured artwork.
box('Artwork frame',(2.25,2.18,2.04),(1.03,.055,1.55),bronze,.005)
art=mat('Ivory relief',(.6,.49,.34),.9)
box('Artwork ground',(2.25,2.145,2.04),(.99,.02,1.51),ivory,.003)
for i in range(35):
 o=box('Hand carved relief',(1.8+i*.026,2.12,2.04+.08*sin(i*.4)),(.017,.014,.95+.22*sin(i*.7)),art,.006)
# Elegant chairs with curved upholstered backs, piping and tapered legs.
def sphere(name,p,scale,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=p);o=move(bpy.context.object,name,m);o.scale=scale
 for f in o.data.polygons:f.use_smooth=True
 return o
def rod(name,a,b,r1,r2,m):
 d=Vector(b)-Vector(a);bpy.ops.mesh.primitive_cone_add(vertices=20,radius1=r1,radius2=r2,depth=d.length,location=(Vector(a)+Vector(b))/2);o=move(bpy.context.object,name,m);o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
 for f in o.data.polygons:f.use_smooth=True
 return o
walnut=mat('Chair | polished dark walnut',(.20,.115,.064),.4)
seam=mat('Chair | tonal stitched welt',(.29,.17,.10),.85)
def upholstered_mesh(name,vertices,faces):
 me=bpy.data.meshes.new(name);me.from_pydata(vertices,[],faces);me.update();o=bpy.data.objects.new(name,me);root.objects.link(o);me.materials.append(cloth)
 for f in me.polygons:f.use_smooth=True
 uv=me.uv_layers.new(name='Tailored fabric')
 for f in me.polygons:
  for li in f.loop_indices:
   v=me.vertices[me.loops[li].vertex_index].co;uv.data[li].uv=(v.x*2+.5,v.z*2)
 return o

def welt(name,points,r=.0018):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=2;cu.bevel_depth=r;cu.bevel_resolution=3
 sp=cu.splines.new('POLY');sp.points.add(len(points)-1)
 for p,c in zip(sp.points,points):p.co=(*c,1)
 sp.use_cyclic_u=True;o=bpy.data.objects.new(name,cu);root.objects.link(o);cu.materials.append(seam)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');return bpy.context.object

def chairback():
 n=32;verts=[];faces=[]
 def surface(u,v,side):
  width=.235+.014*sin(pi*v)-.012*v**4
  # Open lower arch and broad softly rounded shoulders follow the reference chair.
  q=max(0,min(1,(abs(u)-.60)/.40));bottom=.565-.185*(q*q*(3-2*q));top=.83-.066*abs(u)**4
  x=width*u;z=bottom+(top-bottom)*v
  y=.185+.075*v-.050*u*u
  bulge=.017+.034*(1-u*u)*sin(pi*v)
  # Tiny tension ripples near stitched edges, never regular corrugation.
  bulge+=.0009*sin(31*u+8*v)*math.exp(-((abs(u)-.87)/.11)**2)*sin(pi*v)
  depth=(.018+.008*sin(pi*v)+.005*u*u) if side<0 else (.022+.020*(1-u*u)*sin(pi*v))
  return (x,y+side*depth,z)
 for side in [-1,1]:
  for j in range(n+1):
   for i in range(n+1):verts.append(surface(i/n*2-1,j/n,side))
 count=(n+1)**2
 for j in range(n):
  for i in range(n):
   a=j*(n+1)+i;faces.append((a,a+1,a+n+2,a+n+1));b=a+count;faces.append((b+n+1,b+n+2,b+1,b))
 edge=list(range(n+1))+[j*(n+1)+n for j in range(1,n+1)]+[n*(n+1)+i for i in range(n-1,-1,-1)]+[j*(n+1) for j in range(n-1,0,-1)]
 for a,b in zip(edge,edge[1:]+edge[:1]):faces.append((b,a,a+count,b+count))
 o=upholstered_mesh('Upholstered tailored wraparound back',verts,faces);sub=o.modifiers.new('Soft upholstery transitions','SUBSURF');sub.levels=1
 pts=[]
 for i in edge:
  j=i//(n+1);k=i%(n+1);u=(k/n*2-1)*.974;v=.015+j/n*.97;pts.append(surface(u,v,-1.03))
 welt('Tailored back perimeter seam',pts)

def chairseat():
 def sp(v,e):return math.copysign(abs(v)**e,v)
 verts=[];faces=[];nu=96;nv=32
 for j in range(nv+1):
  a=-pi/2+.001+j/nv*(pi-.002)
  for i in range(nu):
   t=i/nu*2*pi;x=.249*sp(cos(a),.55)*sp(cos(t),.42);y=.238*sp(cos(a),.55)*sp(sin(t),.42)-.025;z=.415+.050*sp(sin(a),.82)
   verts.append((x,y,z))
 for j in range(nv):
  for i in range(nu):a=j*nu+i;b=j*nu+(i+1)%nu;faces.append((a,b,b+nu,a+nu))
 verts.extend([(0,-.025,.365),(0,-.025,.465)]);bottom=len(verts)-2;top=len(verts)-1
 for i in range(nu):
  k=(i+1)%nu;faces.append((bottom,k,i));faces.append((top,nv*nu+i,nv*nu+k))
 upholstered_mesh('Tailored seat cushion',verts,faces)
 welt('Tailored seat perimeter seam',[(.249*sp(cos(i/nu*2*pi),.42),-.025+.238*sp(sin(i/nu*2*pi),.42),.400) for i in range(nu)])

def frame_piece(name,outline,depth,axis,offset):
 # Solid apron/leg silhouettes with curved inner knees, not intersecting cuboids.
 verts=[]
 for d in [-depth/2,depth/2]:
  for t,z in outline:verts.append((t,offset+d,z) if axis=='front' else (offset+d,t,z))
 n=len(outline);faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
 for i in range(n):j=(i+1)%n;faces.append((i,j,j+n,i+n))
 if axis!='front':faces=[tuple(reversed(f)) for f in faces]
 o=upholstered_mesh(name,verts,faces);o.data.materials.clear();o.data.materials.append(walnut)
 for loop in o.data.loops:
  co=o.data.vertices[loop.vertex_index].co;o.data.uv_layers[0].data[loop.index].uv=((co.x if axis=='front' else co.y)*2+.5,co.z*2)
 be=o.modifiers.new('Soft carved timber edges','BEVEL');be.width=.003;be.segments=3
 o.modifiers.new('Continuous frame normals','WEIGHTED_NORMAL')
 return o

def chairframe():
 # A single broad apron sweeps into both tapered legs with radiused inner corners.
 outline=[(-.229,.382),(.229,.382),(.249,.006),(.218,.006),(.195,.299)]
 # Quarter-round haunch underneath the rail.
 for i in range(1,13):
  a=i/12*pi/2;outline.append((.155+.04*cos(a),.299+.04*sin(a)))
 outline.append((-.155,.339))
 for i in range(1,13):
  a=pi/2+i/12*pi/2;outline.append((-.155+.04*cos(a),.299+.04*sin(a)))
 outline.extend([(-.218,.006),(-.249,.006)])
 for y in [-.221,.190]:frame_piece('Continuous walnut apron and legs',outline,.036,'front',y)
 # Side rails align to the same outer frame, with generous curved inside corners.
 outline=[(-.221,.382),(.190,.382),(.190,.299)]
 for i in range(1,13):
  a=i/12*pi/2;outline.append((.15+.04*cos(a),.299+.04*sin(a)))
 outline.append((-.181,.339))
 for i in range(1,13):
  a=pi/2+i/12*pi/2;outline.append((-.181+.04*cos(a),.299+.04*sin(a)))
 for x in [-.211,.211]:frame_piece('Swept walnut side apron',outline,.036,'side',x)
 # Fine flush brass strip on the front face of each front leg.
 for sign in [-1,1]:
  rod('Inlaid brass leg detail',(sign*.234,-.2395,.012),(sign*.214,-.2395,.368),.0013,.0013,bronze)

for style in ['atelier','gallery']:
 for ang in [pi/2,pi*7/6,pi*11/6]:
  before=set(bpy.data.objects);chairseat();chairback()
  chairframe()
  if style=='gallery':
   for x in [-.286,.286]:
    rod('Bronze arm support',(x,-.12,.40),(x,-.12,.59),.008,.008,bronze)
    box('Upholstered armrest',(x,.015,.61),(.055,.34,.055),cloth,.025)
  for o in set(bpy.data.objects)-before:
   tag(o,'furniture',style);o['chair']=True
   if 'Upholstered' in o.name or 'Tailored seat cushion' in o.name:o['upholstery']=True
   if 'perimeter seam' in o.name:o['seam']=True
   p=o.location.copy();o.location=(cos(ang)*1.11+cos(ang-pi/2)*p.x-sin(ang-pi/2)*p.y,sin(ang)*1.11+sin(ang-pi/2)*p.x+cos(ang-pi/2)*p.y-.15,p.z);o.rotation_euler.z+=ang-pi/2

# Round woven rug, separate from fixed lighting.
rugmat=mat('Configurable wool',(.56,.48,.37),.97)
rg=cyl('Circular woven rug',(0,-.15,.013),1.85,.024,rugmat);rg['rug']=True;rg['configurable']=True
# Tree and black fluted planter.
asset('pachira_aquatica_01',(-2.9,1.55,.3),scale=.95)
cyl('Tree planter',(-2.9,1.55,.2),.28,.4,dark)
for i in range(64):a=i*pi/32;cyl('Planter reed',(-2.9+.28*cos(a),1.55+.28*sin(a),.2),.009,.39,dark)
# Floating bronze pendant.
cyl('Pendant suspension',(0,-.15,2.94),.003,1.55,dark)
bpy.ops.mesh.primitive_cone_add(vertices=128,radius1=.45,radius2=.07,depth=.14,location=(0,-.15,2.13));move(bpy.context.object,'Bronze disc pendant',bronze)
cyl('Pendant upper disc',(0,-.15,2.22),.19,.008,dark)
# Organic porcelain trio on the table, kept dynamic with its shadow.
for x,y,h,r in [(-.16,-.12,.2,.11),(.07,-.1,.34,.075),(.2,-.18,.24,.065)]:
 o=sphere('Porcelain vessel',(x,y,.774+h/2),(r,r,h/2),ceramic);o['configurable']=True
 cyl('Vase lip',(x,y,.774+h),r*.24,.012,ceramic)['configurable']=True
# Fine dried branches with small porcelain-toned seed heads.
random.seed(32)
for j in range(8):
 start=(.07,-.1,1.09);end=(.07+random.uniform(-.16,.22),-.1+random.uniform(-.1,.1),random.uniform(1.35,1.65))
 o=rod('Dried branch',start,end,.0015,.0006,dark);o['configurable']=True
 for k in range(7):
  t=.45+k*.075;p=Vector(start).lerp(Vector(end),t);tip=p+Vector((random.uniform(-.06,.06),random.uniform(-.045,.045),.025))
  rod('Fine twig',p,tip,.0007,.0003,dark)['configurable']=True
  sphere('Seed head',tip,(.006,.003,.01),ivory)['configurable']=True
# Table product, distinct selectable structures.
products=[]
def product(o,part,variant=None):
 o['part']=part
 if variant:o['base']=variant
 products.append(o);return o
stone=mat('Stone surface',(.025,.023,.02),.13)
product(cyl('Round stone top',(0,0,.74),.7,.02,stone),'stone')
for variant in ['fluted','conic','twin']:
 if variant=='fluted':
  product(cyl('Fluted core',(0,0,.405),.29,.65,dark),'structure',variant)
  for i in range(80):a=i*pi/40;product(cyl('Ebonised flute',(.292*cos(a),.292*sin(a),.405),.012,.65,dark),'structure',variant)
  product(cyl('Bronze plinth',(0,0,.065),.3,.13,bronze),'metal',variant)
 elif variant=='conic':
  bpy.ops.mesh.primitive_cone_add(vertices=128,radius1=.35,radius2=.21,depth=.72,location=(0,0,.36));product(move(bpy.context.object,'Sculptural conical pedestal',bronze),'metal',variant)
 else:
  for x in [-.23,.23]:product(cyl('Twin bronze column',(x,0,.36),.14,.72,bronze),'metal',variant)
# Export product variants at local origin.
bpy.ops.object.select_all(action='DESELECT')
for o in products:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(WEB/'round.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True)
for o in products:o.location.y-=.15;o.location.z+=.024;o.hide_render=True
# Hide all interchangeable pieces for architecture-only lighting: no frozen shadows.
for o in bpy.data.objects:
 if o.get('configurable'):o.hide_render=True
s.world=bpy.data.worlds.new('Daylight');s.world.use_nodes=True;s.world.node_tree.nodes.get('Background').inputs[0].default_value=(.65,.74,1,1);s.world.node_tree.nodes.get('Background').inputs[1].default_value=.3
for typ,power,pos,target in [('AREA',450,(0,3.3,2.4),(0,0,.7)),('AREA',160,(3,-1,2.8),(0,0,1))]:
 bpy.ops.object.light_add(type=typ,location=pos);o=bpy.context.object;o.data.energy=power;o.data.shape='RECTANGLE';o.data.size=2;o.data.size_y=3;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.light_add(type='SUN',location=(3,4,5));o=bpy.context.object;o.data.energy=2;o.data.angle=.12;o.rotation_euler=(Vector((-2,-3,0))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2.8,-6.8,2.2));s.camera=bpy.context.object;s.camera.rotation_euler=(Vector((0,.2,1.3))-s.camera.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.select_all(action='DESELECT')
for o in root.objects:
 if o.type=='MESH' and not o.get('part'):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(WEB/'salon-interior.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_image_format='JPEG',export_jpeg_quality=90)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(B/'outputs/Photographic_Rooms/salon.blend'))
print('SALON_CREATED',flush=True)
