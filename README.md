# Stone Atelier — Interactive Rooms

A desktop-first, movable 3D furniture showroom with five rooms and configurable stone, metal, table bases, rugs and upholstery.

## Preview locally

Run `python3 -m http.server 8347 --directory dist`, then open http://localhost:8347.

## Deploy

- **Cloudflare Pages:** connect this repository, leave the build command empty, and set the output directory to `dist`.
- **Vercel:** import this repository. The included `vercel.json` selects the ready-built `dist` directory.

The website is static and requires no environment secrets or server. Model files are included. The largest asset is under 25 MiB.

## Development

Run `npm ci` and `npm test`. Use `npm run build:tracer` only when rebuilding the rendering vendor bundle. The `design/` folder contains Blender authoring scripts retained as provenance; they currently reference the original authoring workspace and require its additional source assets to regenerate scenes. They are not needed to run or deploy the website.

See `LIVE_RENDER.md` for rendering behavior and limitations, and `ASSET_SOURCES.txt` plus `dist/vendor/` for asset attribution and third-party licenses. Product references are illustrative; this repository does not grant additional rights to third-party reference images. No license for the custom project is granted by this upload.
