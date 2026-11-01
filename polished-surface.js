import * as T from 'three';
import {Reflector} from './vendor/studio-renderer.js';
export function polishedSurface(meta,position){
 let geometry;
 if(meta.id==='lounge'||meta.id==='dining'||meta.id==='salon'){
  geometry=new T.CircleGeometry(1,128);geometry.scale(meta.width/2-.001,meta.depth/2-.001,1);
 }else{
  const w=meta.width/2-.001,d=meta.depth/2-.001,r=meta.id==='living'?.103:.006,s=new T.Shape();
  s.moveTo(-w+r,-d);s.lineTo(w-r,-d);s.quadraticCurveTo(w,-d,w,-d+r);s.lineTo(w,d-r);s.quadraticCurveTo(w,d,w-r,d);s.lineTo(-w+r,d);s.quadraticCurveTo(-w,d,-w,d-r);s.lineTo(-w,-d+r);s.quadraticCurveTo(-w,-d,-w+r,-d);geometry=new T.ShapeGeometry(s,20);
 }
 const source=Reflector.ReflectorShader;
 const shader={uniforms:T.UniformsUtils.clone(source.uniforms),vertexShader:source.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv;varying vec3 vEye;varying vec3 vSurfaceNormal;').replace('vUv = textureMatrix','vEye=-(modelViewMatrix*vec4(position,1.0)).xyz;vSurfaceNormal=normalMatrix*normal;\n vUv = textureMatrix'),fragmentShader:source.fragmentShader.replace('varying vec4 vUv;','varying vec4 vUv;varying vec3 vEye;varying vec3 vSurfaceNormal;').replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );','float grazing=1.0-clamp(dot(normalize(vEye),normalize(vSurfaceNormal)),0.0,1.0);gl_FragColor=vec4(base.rgb,.10+.65*pow(grazing,3.0));')};
 if(meta.id==='salon')shader.fragmentShader=shader.fragmentShader.replace('.10+.65*pow(grazing,3.0)','.03+.12*pow(grazing,3.0)');
 const mirror=new Reflector(geometry,{textureWidth:1024,textureHeight:1024,clipBias:.0003,shader,multisample:2});
 mirror.rotation.x=-Math.PI/2;mirror.position.set(position.x,position.y+meta.height+.0003,position.z);mirror.material.transparent=true;mirror.material.depthWrite=false;mirror.renderOrder=10;mirror.visible=false;return mirror;
}
