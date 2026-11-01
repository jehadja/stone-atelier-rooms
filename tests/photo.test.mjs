import test from 'node:test';import assert from 'node:assert/strict';
import {photoSource,photoAvailability} from '../dist/photo.js';
import {createState,choose} from '../dist/config.js';
test('photographic source follows the room stone and metal selections',()=>{let s=createState();s=choose(s,'room','living');s=choose(s,'stone','honey');s=choose(s,'finish','graphite');assert.equal(photoSource(s),'assets/photos/living-honey-graphite.jpg');s=choose(s,'room','dining');assert.equal(photoSource(s),'assets/photos/dining-ivory-bronze.jpg');});
test('unsupported lighting and wood never show a misleading photograph',()=>{let s=createState();assert.equal(photoAvailability(s),null);s=choose(s,'light','evening');assert.match(photoAvailability(s),/Daylight/);s=choose(s,'light','day');s=choose(s,'room','dining');s=choose(s,'wood','natural');assert.match(photoAvailability(s),/Smoked oak/);});

test('salon never substitutes an unrelated photograph',()=>{const s=createState();s.room='salon';assert.ok(photoAvailability(s));});
