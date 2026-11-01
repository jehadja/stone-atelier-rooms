export const roomIds=['lounge','living','dining','entry','salon'];
export const stoneIds=['green','patagonia','ivory','honey','noir'];
export const finishIds=['bronze','champagne','graphite'];
export function createState(){return {room:'lounge',light:'day',choices:Object.fromEntries(roomIds.map((id,i)=>[id,{stone:stoneIds[i],finish:'bronze',wood:'smoked',base:'fluted',rug:'sand',furniture:'atelier',upholstery:'camel'}]))};}
export function choose(state,key,value){
 const s=structuredClone(state);
 if(key==='room'&&roomIds.includes(value))s.room=value;
 else if(key==='light'&&['day','evening'].includes(value))s.light=value;
 else if(key==='stone'&&stoneIds.includes(value))s.choices[s.room].stone=value;
 else if(key==='finish'&&finishIds.includes(value))s.choices[s.room].finish=value;
 else if(key==='base'&&['fluted','conic','twin'].includes(value))s.choices[s.room].base=value;
 else if(key==='rug'&&['sand','ivory','charcoal'].includes(value))s.choices[s.room].rug=value;
 else if(key==='furniture'&&['atelier','gallery'].includes(value))s.choices[s.room].furniture=value;
 else if(key==='upholstery'&&['camel','pearl','olive'].includes(value))s.choices[s.room].upholstery=value;
 else if(key==='wood'&&['smoked','natural'].includes(value))s.choices[s.room].wood=value;
 return s;
}
export function encodeState(state){return '#config='+encodeURIComponent(JSON.stringify(state));}
export function decodeState(hash){
 try{const input=JSON.parse(decodeURIComponent(hash.replace(/^#config=/,'')));let s=createState();
 for(const id of roomIds){s=choose(s,'room',id);for(const key of ['stone','finish','wood','base','rug','furniture','upholstery'])s=choose(s,key,input.choices?.[id]?.[key]);}
 s=choose(s,'room',roomIds.includes(input.room)?input.room:'lounge');return choose(s,'light',input.light);
 }catch{return createState();}
}
export function fitDistance({width,height,depth},fov,aspect,padding=1.15){
 const tan=Math.tan(fov*Math.PI/360);return Math.max(height/(2*tan),width/(2*tan*Math.max(.1,aspect)))*padding+depth/2+1e-8;
}
