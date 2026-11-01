import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,choose,encodeState,decodeState,fitDistance} from '../dist/config.js';
// A global material value would lose a user's separate room selections.
test('returning to a room preserves its independently chosen finishes',()=>{
 let s=createState();s=choose(s,'stone','honey');s=choose(s,'room','dining');s=choose(s,'stone','ivory');s=choose(s,'room','lounge');
 assert.equal(s.choices?.lounge?.stone,'honey');assert.equal(s.choices?.dining?.stone,'ivory');
});
// An unchecked shared URL could introduce invalid choices or break rendering.
test('a configuration link round-trips all room choices and rejects invalid values',()=>{
 let s=choose(createState(),'finish','graphite');s=choose(s,'room','entry');s=choose(s,'stone','green');
 assert.equal(decodeState(encodeState(s)).choices?.lounge?.finish,'graphite');
 assert.equal(decodeState(encodeState(s)).choices?.entry?.stone,'green');
 assert.deepEqual(decodeState(encodeState(s)),s);
 assert.deepEqual(decodeState('#config=not-json'),createState());
 assert.deepEqual(choose(s,'stone','unknown'),s);
});
// Using only vertical FOV crops the room on a narrow mobile viewport.
test('fit room keeps the entire width and height in desktop and portrait view',()=>{
 for(const aspect of [.55,1,1.8]) {
  const d=fitDistance({width:5,height:3,depth:2},45,aspect,1.15);
  const halfH=Math.tan(Math.PI/8)*(d-1); const halfW=halfH*aspect;
  assert.ok(halfW>=2.5*1.15);assert.ok(halfH>=1.5*1.15);
 }
 assert.ok(fitDistance({width:5,height:3,depth:2},45,.55)>fitDistance({width:5,height:3,depth:2},45,1.8));
});

// All new geometry and palette choices must survive a shared link and old saved configurations.
test('salon configuration persists structural and room choices',()=>{
 let s=choose(createState(),'room','salon');
 for(const [key,value] of Object.entries({base:'twin',rug:'charcoal',furniture:'gallery',upholstery:'olive'}))s=choose(s,key,value);
 assert.deepEqual(decodeState(encodeState(s)),s);
 assert.equal(choose(s,'base','invalid').choices.salon.base,'twin');
 const old=decodeState('#config='+encodeURIComponent(JSON.stringify({room:'dining',choices:{dining:{stone:'ivory',wood:'natural'}}})));
 assert.equal(old.room,'dining');assert.equal(old.choices.dining.wood,'natural');assert.equal(old.choices.salon.base,'fluted');
});
