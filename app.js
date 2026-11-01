import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {WebGLPathTracer,GradientEquirectTexture,DenoiseMaterial,FullScreenQuad,RectAreaLightUniformsLib,Reflector} from './vendor/studio-renderer.js';
import {applySalon,setupSalon} from './salon.js?v=tailored4';
import {createRoom} from './rooms.js?v=tailored4';
import {polishedSurface} from './polished-surface.js?v=tailored4';
import {photoSource,photoAvailability} from './photo.js?v=tailored4';
import {createState,choose,decodeState,encodeState,roomIds,fitDistance} from './config.js?v=tailored4';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const meta=[
 {id:'lounge',title:'A quiet corner.',description:'A small ritual. An expressive stone.',piece:'The side table',size:'Ø 460 × 510 mm',model:'side',width:.46,height:.51,depth:.46},
 {id:'living',title:'Room to slow down.',description:'Rich mineral patterns. Everyday moments.',piece:'The coffee table',size:'1050 × 650 × 350 mm',model:'coffee',width:1.05,height:.35,depth:.65},
 {id:'dining',title:'Gather beautifully.',description:'Warm oak. Quiet stone. Good company.',piece:'The dining table',size:'2200 × 1050 × 750 mm',model:'dining',width:2.2,height:.75,depth:1.05},
 {id:'entry',title:'A warm welcome.',description:'A slender silhouette. A lasting impression.',piece:'The console',size:'1250 × 350 × 800 mm',model:'console',width:1.25,height:.8,depth:.35},
 {id:'salon',title:'The grand salon.',description:'Sculptural stone. Tailored elegance.',piece:'The round dining table',size:'Ø 1400 × 750 mm',model:'round',width:1.4,height:.75,depth:1.4}
];
const stones={green:{name:'Forest green',family:'Green marble palette',url:'green.jpg'},patagonia:{name:'Patagonia',family:'Expressive quartzite palette',url:'patagonia.jpg'},ivory:{name:'Warm ivory',family:'Cream quartzite palette',url:'ivory.jpg'},honey:{name:'Honey onyx',family:'Amber & cream palette',url:'honey.jpg'},noir:{name:'Midnight',family:'Dark marble palette',url:'noir.jpg'}};
const finishes={bronze:{name:'Brushed bronze',color:'#aa8660',roughness:.25,css:'linear-gradient(120deg,#6f512e,#ccb28a 40%,#927047 60%,#d2b78b)'},champagne:{name:'Satin champagne',color:'#dac08b',roughness:.2,css:'linear-gradient(120deg,#a18f6a,#ecdfbd 40%,#b3a078 60%,#e5d7b2)'},graphite:{name:'Dark graphite',color:'#61666a',roughness:.27,css:'linear-gradient(120deg,#252b27,#777c72 40%,#353b34 60%,#686e62)'}};
let experience='3d',photoRequest=0;let tracer=null,traceReady=false,traceDirty=true,traceDisabled=false,lastTraceStatus=0;let renderQuality='balanced';
let state=location.hash.startsWith('#config=')?decodeState(location.hash):createState();
try{if(!location.hash&&localStorage.getItem('stone-atelier-rooms'))state=decodeState(localStorage.getItem('stone-atelier-rooms'));}catch{}
const viewport=$('#viewport'),stage=$('.stage');let renderer,scene,camera,controls,rooms=[],textures={},currentView='room',flight=null,activeRoom,toastTimer,ready=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
for(const [id,m] of Object.entries(stones)){const b=document.createElement('button');b.className='swatch';b.dataset.stone=id;b.style.backgroundImage=`url(assets/${m.url})`;b.setAttribute('aria-label',m.name);b.setAttribute('title',m.name);b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>setChoice('stone',id));$('#stone-swatches').append(b);}
for(const [id,m] of Object.entries(finishes)){const b=document.createElement('button');b.dataset.finish=id;b.style.background=m.css;b.title=m.name;b.setAttribute('aria-label',m.name);b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>setChoice('finish',id));$('#finish-swatches').append(b);}
function toast(text){clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2800);}
function persist(){try{localStorage.setItem('stone-atelier-rooms',encodeState(state));}catch{}}
function setChoice(key,value){state=choose(state,key,value);persist();updateUI();refreshPhoto();if(!ready)return;if(key==='room'){activateRoom();}else if(key==='light'){lighting();traceDirty=true;}else{applyMaterials(activeRoom);if(bakedMode())refreshBakedLighting();if(['base','furniture'].includes(key))traceDirty=true;else if(traceReady){tracer.updateMaterials();}}}
function updateUI(){const i=roomIds.indexOf(state.room),m=meta[i],choice=state.choices[state.room],stone=stones[choice.stone];
 $('#scene-number').textContent=`ROOM 0${i+1} / 05`;$('#room-title').textContent=m.title;$('#room-description').textContent=m.description;$('#product-name').textContent=m.piece;$('#product-size').textContent=m.size;$('#stone-name').textContent=stone.name;$('#stone-family').textContent=stone.family;$('#stone-count').textContent=`0${Object.keys(stones).indexOf(choice.stone)+1} / 05`;$('#material-preview').style.backgroundImage=`url(assets/${stone.url})`;$('#finish-name').textContent=finishes[choice.finish].name;$('#wood-section').hidden=state.room!=='dining';$('#salon-options').hidden=state.room!=='salon';$('#chair-view').hidden=state.room!=='salon';
 for(const kind of ['room','stone','finish','light','wood','base','rug','furniture','upholstery'])for(const b of $$(`[data-${kind}]`)){const v=kind==='room'?state.room:kind==='light'?state.light:choice[kind];b.setAttribute('aria-pressed',String(b.dataset[kind]===v));}
 stage.classList.toggle('night',state.light==='evening');document.title=`${m.piece} · ${stone.name} — Stone Atelier`;
}
$$('[data-room]').forEach(b=>b.addEventListener('click',()=>setChoice('room',b.dataset.room)));
$$('[data-light]').forEach(b=>b.addEventListener('click',()=>setChoice('light',b.dataset.light)));
$$('[data-wood]').forEach(b=>b.addEventListener('click',()=>setChoice('wood',b.dataset.wood)));
for(const key of ['base','rug','furniture','upholstery'])$$(`[data-${key}]`).forEach(b=>b.addEventListener('click',()=>setChoice(key,b.dataset[key])));
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));
$('#fit').addEventListener('click',()=>view('room'));
$('#reset').addEventListener('click',()=>{const id=state.room;state.choices[id]=createState().choices[id];state.light='day';persist();updateUI();refreshPhoto();if(ready){applyMaterials(activeRoom);traceDirty=true;lighting();view('room');}toast('This room is back to its original palette.');});
const dialog=$('#info-dialog');for(const id of ['about','help'])$('#'+id).addEventListener('click',()=>dialog.showModal());$('.dialog-close').addEventListener('click',()=>dialog.close());$('#back-to-room').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen();}catch{toast('Fullscreen is not available in this browser.');}});
$('#share').addEventListener('click',async()=>{const link=location.origin+location.pathname+encodeState(state);history.replaceState(null,'',encodeState(state));try{await navigator.clipboard.writeText(link);toast('Configuration link copied.');}catch{const input=document.createElement('textarea');input.value=link;document.body.append(input);input.select();let copied=document.execCommand('copy');input.remove();toast(copied?'Configuration link copied.':'Copy the link from your address bar.');if(!copied)history.replaceState(null,'',encodeState(state));}});
$('#save-view').addEventListener('click',()=>{if(!ready&&experience!=='photo')return;if(experience==='3d'&&!traceReady)renderer.render(scene,camera);const capture=experience==='photo'?$('#room-photo'):renderer.domElement;if(!capture.width)return;const c=document.createElement('canvas');c.width=experience==='photo'?capture.naturalWidth:capture.width;c.height=(experience==='photo'?capture.naturalHeight:capture.height)+100;const ctx=c.getContext('2d');ctx.fillStyle='#f5f2e9';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(capture,0,0);const m=meta[roomIds.indexOf(state.room)],choice=state.choices[state.room];ctx.fillStyle='#354a39';ctx.font='22px Georgia';ctx.fillText(`STONE ATELIER / ${m.piece}`,28,c.height-62);ctx.font='14px Arial';ctx.fillText(`${stones[choice.stone].name} · ${finishes[choice.finish].name} · ${m.size}`,28,c.height-37);ctx.font='11px Arial';ctx.fillText('Concept study / illustrative materials / 20 mm stone thickness provisional',28,c.height-16);c.toBlob(blob=>{if(!blob){toast('Could not save this view. Please try again.');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Stone-Atelier-${state.room}-${choice.stone}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('Your room view has been saved.');},'image/png');});
updateUI();
function setMode(mode){if(mode==='photo'){const reason=photoAvailability(state);if(reason){setMode('3d');toast(reason);return;}}experience=mode;$('#save-view').firstChild.textContent=mode==='photo'?'Save photograph ':'Save this view ';if(mode==='3d'&&!ready){$('#loading').hidden=false;$('#loading').classList.remove('done');}stage.classList.toggle('photo-mode',mode==='photo');$('#live-render-tools').hidden=mode==='photo';for(const b of $$('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===mode));$('.drag-hint').textContent=mode==='photo'?'Rendered daylight · Select a material':'Drag to explore · Scroll to zoom';if(mode==='photo')refreshPhoto();}
function refreshPhoto(){if(experience!=='photo')return;const reason=photoAvailability(state);if(reason){setMode('3d');toast(reason);return;}const request=++photoRequest,im=new Image(),url=photoSource(state),c=state.choices[state.room];$('#photo-status').textContent='Preparing your chosen materials…';$('#room-photo').style.opacity='.45';im.onload=()=>{if(request!==photoRequest)return;$('#room-photo').src=url;$('#room-photo').alt=`${meta[roomIds.indexOf(state.room)].piece}, ${stones[c.stone].name}, ${finishes[c.finish].name}, rendered daylight interior`;$('#room-photo').style.opacity='1';$('#photo-status').textContent='';$('#loading').hidden=true;};im.onerror=()=>{if(request!==photoRequest)return;setMode('3d');toast('This photograph could not load. Your materials are shown in 3D.');};im.src=url;}
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));setMode('3d');
let sun,ambient,env,fill,windowLight,reflectionProbe,reflectionTarget,windowReflection;
function bakedMode(){return state.light==='day'&&!!activeRoom?.bakedInterior;}
async function init(){
 renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.AgXToneMapping;renderer.toneMappingExposure=1.05;viewport.append(renderer.domElement);
 scene=new T.Scene();scene.background=new T.Color('#ddd8ca');camera=new T.PerspectiveCamera(43,1,.05,80);camera.position.set(2,2,6);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.enablePan=false;controls.minPolarAngle=.45;controls.maxPolarAngle=1.52;controls.minAzimuthAngle=-1.1;controls.maxAzimuthAngle=1.1;controls.minDistance=.65;controls.maxDistance=22;controls.rotateSpeed=.5;controls.zoomSpeed=.65;controls.addEventListener('start',()=>{flight=null;currentView='custom';updateViews();});
 env=new GradientEquirectTexture(128);env.topColor.set('#d5e1f3');env.bottomColor.set('#c3bcae');env.exponent=1;env.update();scene.environment=env;scene.environmentIntensity=.35;
 RectAreaLightUniformsLib.init();
 windowLight=new T.RectAreaLight('#fff0d9',12,3,2.2);windowLight.position.set(3.3,2.3,0);windowLight.lookAt(0,.7,-.3);scene.add(windowLight);
 ambient=new T.HemisphereLight('#f1f1df','#7a6e54',1.1);scene.add(ambient);
 sun=new T.DirectionalLight('#fff0d3',3.2);sun.position.set(3.0,6.3,3.5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:20});sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;sun.shadow.radius=3;sun.target.position.set(0,0,-1);scene.add(sun,sun.target);
 fill=new T.DirectionalLight('#fff8ed',.7);fill.position.set(-2,3,4);scene.add(fill);
 const loader=new GLTFLoader(),tl=new T.TextureLoader();textures.wood=await tl.loadAsync('assets/oak-detail.jpg');textures.wood.colorSpace=T.SRGBColorSpace;textures.wood.wrapS=textures.wood.wrapT=T.RepeatWrapping;textures.wood.anisotropy=renderer.capabilities.getMaxAnisotropy();const weave=await tl.loadAsync('assets/rug-detail.jpg');weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.anisotropy=renderer.capabilities.getMaxAnisotropy();await Promise.all(Object.entries(stones).map(async([id,m])=>{const tex=await tl.loadAsync('assets/'+m.url);tex.colorSpace=T.SRGBColorSpace;tex.flipY=false;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();textures[id]=tex;}));
 windowReflection=new T.Mesh(new T.PlaneGeometry(4.3,2.4),new T.MeshBasicMaterial({color:new T.Color(3,3,3),side:T.DoubleSide}));windowReflection.position.set(3.5,1.75,0);windowReflection.rotation.y=Math.PI/2;windowReflection.visible=false;scene.add(windowReflection);
 reflectionTarget=new T.WebGLCubeRenderTarget(512,{type:T.HalfFloatType});reflectionProbe=new T.CubeCamera(.05,30,reflectionTarget);scene.add(reflectionProbe);
 for(let i=0;i<meta.length;i++){const gltf=await loader.loadAsync('assets/'+meta[i].model+'.glb');const interior=await loader.loadAsync('assets/'+meta[i].id+'-interior.glb'+(meta[i].id==='salon'?'?v=tailored4':''));const r=createRoom(i,gltf.scene,interior.scene);r.root.visible=false;r.originalInterior=interior.scene;
 {
  const baked=await loader.loadAsync('assets/'+meta[i].id+'-baked-interior.glb'+(meta[i].id==='salon'?'?v=tailored4':''));r.bakedInterior=baked.scene;r.bakedInterior.visible=false;
  r.bakedInterior.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
   const convert=m=>{if(m.name.startsWith('Baked daylight')){const map=m.emissiveMap||m.map;const surface=new T.MeshBasicMaterial({map,color:0xffffff,side:m.side});surface.onBeforeCompile=shader=>{shader.uniforms.studioWeave={value:weave};shader.vertexShader='varying vec3 vStudioWorld;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvStudioWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');shader.fragmentShader='uniform sampler2D studioWeave;varying vec3 vStudioWorld;\n'+shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nif(vStudioWorld.y>.016 && vStudioWorld.y<.028){float fibre=texture2D(studioWeave,vStudioWorld.xz*.6).r;diffuseColor.rgb*=.36+fibre;}');};return surface;}return m;};
   o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);
  });r.root.add(r.bakedInterior);
 }
 r.gloss=polishedSurface(meta[i],r.product.position);r.root.add(r.gloss);if(meta[i].id==='entry'){r.wallMirror=new Reflector(new T.CircleGeometry(.568,96),{textureWidth:1024,textureHeight:1024,clipBias:.001,color:0x7f7f7f});r.wallMirror.position.set(-.5,1.74,-2.149);r.wallMirror.visible=false;r.root.add(r.wallMirror);}if(meta[i].id==='salon'){const chairs=await loader.loadAsync('assets/salon-chairs-lit.glb?v=tailored4');r.litChairs=chairs.scene;r.bakedInterior.add(chairs.scene);setupSalon(r,weave,textures.wood);}rooms.push(r);scene.add(r.root);}
 try{if(!renderer.extensions.has('EXT_color_buffer_float'))throw new Error('Floating-point rendering unavailable');tracer=new WebGLPathTracer(renderer);tracer.bounces=6;tracer.filterGlossyFactor=.5;tracer.dynamicLowRes=false;tracer.renderScale=1;tracer.tiles.set(2,2);tracer.minSamples=32;tracer.fadeDuration=700;tracer.renderDelay=350;tracer.textureSize.set(1024,1024);tracer.rasterizeScene=true;
 const denoise=new DenoiseMaterial({sigma:3,kSigma:1.5,threshold:.22});
 const denoiseQuad=new FullScreenQuad(denoise);
 tracer.renderToCanvasCallback=(target,output,quad)=>{
  denoise.map=target.texture;denoise.opacity=quad.material.opacity;
  denoise.blending=denoise.opacity<1?T.NormalBlending:T.NoBlending;
  denoise.transparent=denoise.opacity<1;
  const autoClear=output.autoClear;output.autoClear=false;
  try{denoiseQuad.render(output);}finally{output.autoClear=autoClear;}
 };}catch(error){traceDisabled=true;console.warn('Live path tracing unavailable',error);}
 controls.addEventListener('change',()=>{if(traceReady)tracer.updateCamera();});
 $('#render-quality').addEventListener('change',e=>{renderQuality=e.target.value;if(tracer){tracer.renderScale=1;tracer.minSamples=renderQuality==='fine'?64:32;tracer.reset();}});
 ready=true;activateRoom(false);resize();$('#loading').classList.add('done');setTimeout(()=>$('#loading').hidden=true,550);
 new ResizeObserver(resize).observe(viewport);
 window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#config=')){state=decodeState(location.hash);updateUI();refreshPhoto();activateRoom();}});
 viewport.addEventListener('keydown',e=>{let handled=true;flight=null;const offset=camera.position.clone().sub(controls.target),sp=new T.Spherical().setFromVector3(offset);switch(e.key){case'ArrowLeft':sp.theta-=.12;break;case'ArrowRight':sp.theta+=.12;break;case'ArrowUp':sp.phi-=.10;break;case'ArrowDown':sp.phi+=.10;break;case'+':case'=':sp.radius*=.88;break;case'-':sp.radius*=1.12;break;case'Home':view('room');break;default:handled=false;}if(handled){e.preventDefault();if(e.key!=='Home'){sp.theta=T.MathUtils.clamp(sp.theta,-1.1,1.1);sp.phi=T.MathUtils.clamp(sp.phi,.45,1.52);sp.radius=T.MathUtils.clamp(sp.radius,.65,22);camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(sp));controls.update();currentView='custom';updateViews();}}});
 renderer.setAnimationLoop(animate);
}
function applyMaterials(room){const choice=state.choices[state.room];if(state.room==='salon')applySalon(room,choice);room.product.traverse(o=>{if(!o.isMesh)return;const part=o.userData.part||o.parent?.userData.part;
 if(part==='stone'){if(!o.userData.liveMaterial)o.userData.liveMaterial=new T.MeshStandardMaterial({roughness:state.room==='salon'?.36:.13,metalness:0});o.material=o.userData.liveMaterial;o.material.map=textures[choice.stone];o.material.color.set(state.room==='salon'&&choice.stone==='noir'?'#444444':'#ffffff');o.material.needsUpdate=true;}
 else if(part==='metal'){if(!o.userData.liveMaterial)o.userData.liveMaterial=new T.MeshStandardMaterial({metalness:1});o.material=o.userData.liveMaterial;o.material.color.set(finishes[choice.finish].color);o.material.roughness=finishes[choice.finish].roughness;}
 else if(part==='wood'){if(!o.userData.liveMaterial){o.userData.liveMaterial=new T.MeshStandardMaterial({roughness:.53,map:textures.wood});if(!o.geometry.attributes.uv){const p=o.geometry.attributes.position,uv=new Float32Array(p.count*2);o.geometry.computeBoundingBox();const box=o.geometry.boundingBox;for(let i=0;i<p.count;i++){uv[i*2]=Math.atan2(p.getZ(i),p.getX(i))/(Math.PI*2)+.5;uv[i*2+1]=(p.getY(i)-box.min.y)/Math.max(.001,box.max.y-box.min.y);}o.geometry.setAttribute('uv',new T.BufferAttribute(uv,2));}}o.material=o.userData.liveMaterial;o.material.color.set(choice.wood==='smoked'?'#685b4d':'#fff1da');}
 });}
function activateRoom(animateView=true){activeRoom=rooms[roomIds.indexOf(state.room)];for(const r of rooms)r.root.visible=r===activeRoom;applyMaterials(activeRoom);traceDirty=true;lighting();view('room',animateView);traceReady=false;traceDirty=true;}
function refreshBakedLighting(){
 const useBaked=bakedMode();for(const r of rooms){r.gloss.visible=false;if(r.wallMirror)r.wallMirror.visible=false;}
 for(const r of rooms){r.originalInterior.visible=!(r===activeRoom&&useBaked);if(r.bakedInterior)r.bakedInterior.visible=r===activeRoom&&useBaked;}
 $('#render-quality').hidden=useBaked;$('label[for=render-quality]').hidden=useBaked;
 if(useBaked){
  activeRoom.bakedInterior.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m.isMeshBasicMaterial){m.envMap=null;m.needsUpdate=true;}}});
  activeRoom.product.visible=false;if(activeRoom.reflectionBackdrop)activeRoom.reflectionBackdrop.visible=true;windowReflection.visible=true;reflectionProbe.position.set(...activeRoom.productTarget);reflectionProbe.update(renderer,scene);windowReflection.visible=false;if(activeRoom.reflectionBackdrop)activeRoom.reflectionBackdrop.visible=false;activeRoom.product.visible=true;
  activeRoom.bakedInterior.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m.isMeshBasicMaterial){m.envMap=reflectionTarget.texture;m.envMapIntensity=.7;m.needsUpdate=true;}}});
 }
 if(useBaked){activeRoom.gloss.visible=true;if(activeRoom.wallMirror)activeRoom.wallMirror.visible=true;}
 for(const r of rooms)r.product.traverse(o=>{if(o.isMesh){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.envMap=useBaked&&r===activeRoom?reflectionTarget.texture:null;m.envMapIntensity=useBaked?(r.salon?.45:1):.35;m.needsUpdate=true;}}});
}
function lighting(){const night=state.light==='evening';sun.position.set(...(state.room==='salon'?[3,6,-4]:[3,6.3,3.5]));windowLight.position.set(...(state.room==='salon'?[0,2.5,-2.3]:[3.3,2.3,0]));windowLight.lookAt(0,.7,-.3);windowReflection.position.set(...(state.room==='salon'?[0,1.75,-2.5]:[3.5,1.75,0]));windowReflection.rotation.y=state.room==='salon'?0:Math.PI/2;sun.shadow.normalBias=state.room==='salon'?.004:.025;sun.intensity=night?.04:state.room==='salon'?.8:1.8;sun.color.set(night?'#a7b5ce':'#fff0d3');ambient.intensity=night?.25:.7;fill.intensity=night?.03:.15;windowLight.intensity=night?.08:state.room==='salon'?5:12;scene.environment=env;scene.environmentIntensity=night?.035:.35;scene.background.set(night?'#252e32':'#ddd8ca');renderer.toneMappingExposure=1.1;
 for(const r of rooms)for(const b of r.bulbs){if(b.isLight){b.visible=r===activeRoom;b.intensity=night?12:.4;}else b.emissiveIntensity=night?3:.4;}
 refreshBakedLighting();if(tracer&&traceReady){tracer.updateLights();tracer.updateEnvironment();}
}
function updateViews(){for(const b of $$('[data-view]')){b.classList.toggle('selected',b.dataset.view===currentView);b.setAttribute('aria-pressed',String(b.dataset.view===currentView));}}
function view(type,animated=true){if(type==='chair'&&experience!=='3d')setMode('3d');stage.classList.toggle('product-view',type==='product'||type==='chair');$('#photograph').classList.toggle('detail',type==='product');if(!ready)return;currentView=type;updateViews();const i=roomIds.indexOf(state.room),m=meta[i],r=activeRoom,product=type==='product';const target=new T.Vector3(...(product?r.productTarget:r.roomTarget));const bounds=product?{width:m.width*1.4,height:m.height*1.3,depth:m.depth*1.1}:{...r.viewBounds,width:r.viewBounds.width*1.12};const dist=fitDistance(bounds,camera.fov,camera.aspect,product?1.18:1.03);const direction=new T.Vector3(product?.8:.36,product?.72:.20,1).normalize();if(type==='chair'){target.set(-.961,.43,.705);direction.set(1.8,.45,1).normalize();}const pos=target.clone().addScaledVector(direction,type==='chair'?fitDistance({width:.65,height:.86,depth:.55},camera.fov,camera.aspect,1.12):dist);
 if(animated&&!reduced){flight={from:camera.position.clone(),to:pos,fromTarget:controls.target.clone(),target,start:performance.now()};}else{flight=null;camera.position.copy(pos);controls.target.copy(target);controls.update();}
}
function resize(){if(!renderer)return;const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(ready)view(['product','chair'].includes(currentView)?currentView:'room',false);}
let frames=0;
function animate(now){if(flight){const t=Math.min((now-flight.start)/900,1),q=1-Math.pow(1-t,3);camera.position.lerpVectors(flight.from,flight.to,q);controls.target.lerpVectors(flight.fromTarget,flight.target,q);if(t===1)flight=null;}controls.update();
 if(experience==='3d'){
  if(bakedMode()){renderer.render(scene,camera);$('#live-render-status').textContent='Studio daylight · drag to explore';$('#live-render-status').dataset.renderer='baked-daylight';}
  else if(tracer&&!traceDisabled){
   try{
    if(traceDirty){$('#live-render-status').textContent='Preparing live lighting…';tracer.setScene(scene,camera);traceDirty=false;traceReady=true;}
    tracer.pausePathTracing=tracer.samples>=(renderQuality==='fine'?1024:256);tracer.renderSample();
    if(now-lastTraceStatus>250){const samples=Math.floor(tracer.samples);$('#live-render-status').textContent=tracer.isCompiling?'Preparing live lighting…':samples<tracer.minSamples?'Clean movement · preparing lighting…':'Noise-filtered render · drag to explore';$('#live-render-status').dataset.samples=String(samples);$('#live-render-status').dataset.renderer=samples<tracer.minSamples?'smooth-preview':'denoised-path-traced';lastTraceStatus=now;}
   }catch(error){console.error('Live renderer failed',error);traceDisabled=true;traceReady=false;tracer.dispose();$('#live-render-status').textContent='Standard 3D · live rendering unavailable on this device';$('#live-render-status').dataset.renderer='standard';}
  }else{renderer.render(scene,camera);$('#live-render-status').textContent='Standard 3D · live rendering unavailable on this device';}
 }frames++;
}
init().catch(error=>{console.error('Showroom could not start',error);$('#loading').innerHTML='<span>The room could not load.</span><small>Please use a browser with WebGL enabled, then reload.</small><button class="primary-button" id="retry" style="width:170px;justify-content:center">Try again</button>';$('#retry').addEventListener('click',()=>location.reload());});
