# OBJECT CHAOS

**Your world. Your objects. Your chaos.**

Upload a photo. A 21.6 MB vision model runs **on your device**, finds the objects in it, and a party game breaks out. No account, no upload, no inference bill.

- **Live:** https://site-6c8bf6f8cd9e484683219b608ee86525.freebuff.page
- **Repo:** https://github.com/g0GobliN/object-chaos

## What it does

1. You pick a photo (file, camera, or the built-in sample desk).
2. The image is downscaled in the browser (longest edge 768 px) and handed to Cactus's **Mirage** vision model running in WebAssembly inside a Web Worker.
3. The model returns structured JSON: objects with boxes, confidence, position, colour/material descriptions, plus OCR text lines.
4. An adapter turns that into the app's own schema and the two games run off the result:
   - **Find the Object** — three timed challenges built from attributes that actually exist in the photo ("Find something made of paper", "Find something in the top half", "Find the largest object"). Only generated when they are answerable, 100 points per correct answer.
   - **Object Roast** — deterministic local templates keyed to detected names, attributes, duplicates and counts produce a chaos score and a verdict. No LLM involved.
5. Every round produces a report page with a score, the verdict and the detected objects, plus a **1080×1080 PNG card** drawn on a canvas and a **Web Share** fallback to clipboard.

The photo never leaves the browser. There is no backend, no database and no image storage — the deployed artifact is static files.

## Architecture

```
React 19 + TypeScript + TanStack Start (SPA build) + Tailwind CSS 4
└─ /play            upload / camera / sample → analyse → play
   /result          score, verdict, PNG card, share
   public/mirage/worker.js   classic Web Worker
      importScripts("/cactus/cactus.js")   vendored runtime, 99 KB
      fetch https://huggingface.co/Cactus-Compute/mirage/resolve/main/mirage.cact
        → Cache Storage ("mirage-model") 21.6 MB, downloaded once
      _cactus_load() → _cactus_describe(rgb, w, h, options, ...)
   src/lib/mirage/client.ts    singleton worker, serialised requests, progress events
   src/lib/mirage/adapter.ts   raw Mirage JSON → DetectedObject[]
   src/lib/game/challenges.ts  evaluable challenges only
   src/lib/game/roasts.ts      deterministic roast + chaos score
```

Inference request: `sections: ["objects","text"]`, `fields: ["bbox","score","position","description"]`, `max_objects: 20`. Masks are deliberately not requested (not needed by either game, and they cost time).

**One detail worth knowing:** Mirage returns bounding boxes on a fixed **0–1000 grid**, not in input pixels — the same photo analysed at 768 px and 1536 px yields identical numbers. `MIRAGE_GRID` in `src/lib/mirage/adapter.ts` normalises against that constant; dividing by image width/height (the intuitive guess) shifts every box. There is a regression test that asserts both resolutions give identical boxes.

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 16 unit tests
npm run lint
npm run build    # SPA build → .output/public (+ .output/server for Node)
```

The first "Try the sample" downloads 21.6 MB of model into Cache Storage; later runs are instant to start.

## Deployment

The app ships as a static SPA, so any static host works. This repo includes a Worker manifest for the hosting used here:

```bash
npm run build
cp .output/public/_shell.html .output/public/index.html   # SPA shell as the entry document
rm -rf dist-static && cp -r .output/public dist-static
# deploy dist-static with deploy.json (a Worker that only calls env.ASSETS.fetch)
```

The same directory deploys unchanged to Cloudflare Pages (`dist-static` as the output directory) or any bucket/CDN with SPA fallback to `index.html`.

## Benchmarks

Measured on a Windows 11 desktop, Chromium 130 (Electron), 16 logical cores, 8 GB device memory, no cross-origin isolation (the runtime does not need `SharedArrayBuffer`).

| Image (longest edge)                    | Objects | OCR lines | Inference |
| --------------------------------------- | ------- | --------- | --------- |
| Desk, 1536 px (Node harness)            | 10      | 2         | 4.3 s     |
| Desk, 768 px (Node harness)             | 8       | –         | 4.8 s     |
| Bus, 768 px                             | 7       | 6         | 2.7 s     |
| Portrait, 768 px                        | 4       | 0         | 1.8 s     |
| Dog, 768 px                             | 4       | 0         | 1.9 s     |
| Desk, 768 px (in browser, dev build)    | 7       | 0         | 4.0–4.5 s |
| Desk, 768 px (in browser, static build) | 7       | 0         | 4.6 s     |

### 20-photo sweep

Run through the same Node harness at 768 px, on Wikimedia Commons photographs plus the four originals (kitchen, bedroom, bookshelf, supermarket shelves, laptop desk, street scene, flower garden, garage bench, bathroom, classroom, tool workshop, wardrobe, picnic, cafe painting, living room, parked bicycle, desk, bus, portrait, dog):

- **174 objects** across 20 photos — average 8.7, minimum 3, maximum 17. No photo returned zero objects, so every one of them was playable.
- **59 OCR text lines**, concentrated in the supermarket (29) and bus (6) shots.
- **Latency:** average 2.32 s, median 2.40 s, min 1.75 s, max 3.21 s.
- Every bounding-box coordinate across all 20 outputs fell inside 0–1000, which is the evidence for the fixed coordinate grid described above.

Accuracy is real but modest, and the failures are worth knowing before anyone calls this a detector:

- A garage workbench was read as kitchen fixtures ("range hood", "stove", "stainless steel sink").
- A wall of hand tools came back as "grass", "metal ring" and "wooden stick".
- A dog was labelled "cat" (0.80).
- A classroom produced eleven separate "chair" boxes — correct, but duplicate-happy.
- A watermarked stock photo produced an object called "watermark".

Weights: 21.6 MB (`mirage.cact`), cached in Cache Storage. Runtime: 99 KB JS + 1.2 MB WASM, served from the site. App JS: ~350 KB (≈90 KB gzipped) plus fonts. Total first visit ≈ 2.2 MB of app + 21.6 MB of model; every later visit reuses the cached model.

Peak JS heap after a round was ~7 MB; the model lives in the WASM heap, which the browser does not expose to `performance.memory`, so total runtime memory is not measured precisely here.

## What works, and what does not

Verified on the deployed URL, not just locally:

- **Upload:** a real JPEG driven through the file input on the live site → inference → challenge.
- **Camera:** Chromium 157 with a synthetic camera (`--use-fake-device-for-media-stream`, `--use-fake-ui-for-media-stream`, `--use-file-for-fake-video-capture=desk.y4m`) produced a 640×480 live `video` element; the app's Capture button drew it to canvas, ran inference on it (9 objects, 4.07 s) and generated a challenge. The whole round was then played to 300/300.
- **Sample photo:** 7 objects on the sample desk, boxes aligned to the image.
- Both games end to end, scoring, feedback, restart.
- `/result` with real object chips and verdict.
- **PNG card:** clicking Download card wrote `object-chaos-report.png` to a real download directory on disk — 111,639 bytes, PNG signature, 1080×1080 IHDR — and that file renders `300 FINAL SCORE`, `9 objects detected on-device` and the exact verdict generated for that photo. Web Share with clipboard fallback is wired but the native share sheet needs a real OS/browser to observe.

Known limitations:

- **Accuracy is modest.** It labels the familiar well (desk, keyboard, mug, chair, bed, books, shelf, person) and insects the unfamiliar (tool walls become "grass", a garage becomes kitchen appliances, a dog becomes a cat). Duplicate boxes for the same object are common and are merged by the adapter when they overlap; small items are missed at 768 px. Confidence is usually 0.3–0.8, so labels are shown honestly as percentages instead of being treated as ground truth. The 20-photo sweep above is the actual evidence base — see "What works, and what does not".
- **Challenges depend on the photo.** A scene with fewer than two objects cannot start a round; challenges are only drawn from attributes that exist (colour, material, position, size, category, OCR, duplicates), so variety scales with how much the model described.
- **Image formats.** JPEG, PNG and WebP decode in every current browser and are what the 20-photo sweep used. iPhone HEIC cannot be decoded by Chromium, so those uploads now fail with an explicit "export it as JPEG or PNG" message instead of a generic error. Files over 15 MB are rejected.
- **768 px downscale.** Faster and lighter, at the cost of small-object recall. Higher resolutions mostly add latency.
- **First load needs the network** to fetch the model from Hugging Face (CORS is enabled there). After that it is cached; there is no offline-first app shell.
- **Browsers:** Chromium only — 130 (desktop, dev and static build) and 157 (headless, with a fake camera device). Firefox, Safari/iOS and Android Chrome are untested on real devices. The runtime needs WebAssembly and Cache Storage; if either is missing the page reports that local AI is unavailable rather than calling a server.
- **Mobile:** layout, touch targets and box alignment were checked at a 390×844 viewport in desktop Chromium; not verified on real phone hardware, and mobile inference speed is unmeasured.
- Roasts are templates, not generated text, so they can repeat between similar photos.

## Privacy

Image data stays in the page: it is drawn to a canvas, passed as pixels to a Worker in the same origin, and never sent anywhere. The only network requests are the static assets, the fonts and the model download. Results live in `sessionStorage` for the result page and disappear when the tab closes.

## Brand assets

`logo/logo.png` is the source wordmark (1536×1024). Everything the site serves is derived from it in `public/brand/`: `logo.webp` (hero), `logo-header.webp` (header/footer), `icon-64/128/180.png` (same 3:2 aspect as the source, no padding), `og.jpg` (1200×630 social card), plus `public/favicon.ico` (the 64 px icon wrapped as PNG-in-ICO). Regenerate with ffmpeg, e.g.:

```bash
ffmpeg -i logo/logo.png -vf "scale=1024:-1:flags=lanczos" -c:v libwebp -quality 90 public/brand/logo.webp
```

## Credits and licenses

- **Mirage** model and **Cactus** WASM runtime — Cactus Compute, Apache-2.0. Runtime vendored in `public/cactus/`; license text in `LICENSE-APACHE-2.0.txt` and `THIRD_PARTY_NOTICES.md`.
- Mirage model card: https://huggingface.co/Cactus-Compute/mirage
- Cactus: https://github.com/cactus-compute/cactus

The app code in this repository is Apache-2.0.
