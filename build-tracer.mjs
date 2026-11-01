import {build} from 'esbuild';
await build({entryPoints:['tracer-entry.js'],bundle:true,format:'esm',minify:true,outfile:'dist/vendor/studio-renderer.js',plugins:[{name:'shared-three',setup(b){b.onResolve({filter:/^three$/},()=>({path:'three',external:true}));}}]});
