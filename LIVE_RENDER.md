# Desktop studio rendering

All four daylight rooms use 4096px lighting atlases baked in Blender Cycles and denoised offline. Architecture, floor and static accessories retain the fixed daylight solution. Reflective furniture, plants, metal and configurable products remain dynamic. The scene stays fully movable with no sample accumulation in daylight.

Stone tops use a shape-matched planar reflection layer (1024px, angle-dependent opacity) over the selected photographed stone. The entrance mirror uses a separate planar reflector. A 512px local reflection probe supplies surrounding-room reflections for curved materials. Fabric microdetail is retained separately from the lighting atlas.

Daylight shadows and indirect room colour are fixed to the designed layout. Changing table finishes does not recalculate the room's indirect colour. Reflections and surface materials update. These are approximations and do not guarantee parity with offline architectural photography. The current model and furnishing detail still limits realism relative to the user's reference.

Evening retains progressive WebGL path tracing with a clean movement preview and noise-filtered refinement. Balanced accumulates 256 samples; Fine detail 1024. Photographic mode remains available. Unsupported tracing devices explicitly show standard 3D.

Build vendor module: npm run build:tracer. Configuration tests: npm test. Third-party licenses are under dist/vendor.

## Grand Salon
Fifth additive room inspired by the supplied terracotta dining references. Round table dimensions are provisional Ø1400 × 750 mm, 20 mm stone. Fluted, conical and twin-column bases are separate geometry. Atelier / Gallery furniture changes chair arms and frames plus cabinetry; rug and upholstery palettes are independent. Selections persist per room and in shared links. Existing four rooms retain their approved rendering.

Architecture lighting is baked without interchangeable objects, avoiding frozen variant shadows. The rug uses live lighting. Daylight chairs use separate denoised diffuse-light atlases while preserving selectable velvet colors and live specular reflections. Original chair geometry remains available for evening rendering. Grouped circular mirrors use one masked planar reflection; the round stone retains a softer planar reflection. Daylight is stable raster rendering; evening remains progressive. New room is live 3D only, and photographic mode reports this rather than showing an unrelated still.

Grand Salon chair revision: custom closed wraparound upholstered backs with lower arch, boxed cushions, tonal perimeter welting, walnut seat rails and tapered rectangular walnut legs. Gallery adds upholstered armrests on bronze supports. Seams follow upholstery selection. Geometry and material changes verified in the movable browser view.

Chair detail revision: the Juliettes Interiors reference lists H83 × W50 × D55 cm and velvet upholstery (https://www.juliettesinteriors.co.uk/product/round-contemporary-stone-effect-dining-set/). The custom approximation now targets these proportions; seat height and internal construction are estimated from photos, not manufacturer CAD. Back wings meet the walnut apron, seats have fuller padding, and piping is tonal. Two 2048px chair atlases provide stable soft diffuse shading during camera movement. The daylight lighting is fixed to the room layout; material changes do not rebake indirect bounce. This is not a licensed manufacturer model or a claim of photographic equivalence.

Isolated-chair reference pass: inspected all seven gallery images, including Modern-Dining-Chair-1/2/3. Replaced separate rectangular rails with solid apron-and-leg silhouettes, rounded inside knees, swept side rails, fine front-leg brass inlays and a taller rounded rectangular back opening. Added dedicated fine velvet noise instead of rug fiber and oriented timber grain vertically. Chair detail camera provides a direct, movable inspection view. Gallery armchair is a custom variation, not the reference product.
