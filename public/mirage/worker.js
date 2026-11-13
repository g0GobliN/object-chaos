/* OBJECT CHAOS — local Mirage inference worker.
 *
 * Runs Cactus Mirage entirely on this device:
 *   /cactus/cactus.js + /cactus/cactus.wasm  (Apache-2.0, vendored)
 *   mirage.cact                              (21.6 MB, fetched once and cached)
 *
 * Nothing here touches a server: the photo is decoded on the main thread, the
 * RGB bytes are transferred in, and the JSON comes back. No upload, no API key.
 */

/* global createCactus */

const RUNTIME_URL = "/cactus/cactus.js";
const WASM_URL = "/cactus/cactus.wasm";
const MODEL_URL = "https://huggingface.co/Cactus-Compute/mirage/resolve/main/mirage.cact";
const MODEL_CACHE = "object-chaos-mirage-1";

// Ask only for what the game uses: boxes, confidence, position and attributes.
// Masks are omitted on purpose — they are large and the MVP does not draw them.
const OPTIONS = JSON.stringify({
  sections: ["objects", "text"],
  fields: ["bbox", "score", "position", "description"],
  max_objects: 20,
});

const OUTPUT_CAPACITY = 1 << 20;
const MAX_PIXELS = 4_000_000;
const CACTUS_VISION = 4;

importScripts(RUNTIME_URL);

let runtimePromise = null;
let runtime = null;
let outputPointer = 0;
let optionsPointer = 0;

function report(phase, extra) {
  self.postMessage({ type: "progress", phase, ...extra });
}

function fail(id, error) {
  self.postMessage({
    type: "error",
    ...(id === undefined ? {} : { id }),
    message: error instanceof Error ? error.message : String(error),
  });
}

function allocString(rt, value) {
  const bytes = new TextEncoder().encode(`${value}\0`);
  const pointer = rt._malloc(bytes.length);
  rt.HEAPU8.set(bytes, pointer);
  return pointer;
}

function readError(rt) {
  try {
    return rt.UTF8ToString(rt._cactus_last_error());
  } catch {
    return "";
  }
}

async function download(url, label, onProgress) {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`${label} failed with HTTP ${response.status}`);
  const declared =
    Number(response.headers.get("content-length")) ||
    Number(response.headers.get("x-linked-size")) ||
    0;

  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    onProgress(bytes.byteLength, declared || bytes.byteLength);
    return bytes;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.byteLength;
      onProgress(loaded, declared);
    }
  }

  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function loadModel() {
  if (typeof caches !== "undefined") {
    try {
      const cache = await caches.open(MODEL_CACHE);
      const hit = await cache.match(MODEL_URL);
      if (hit) {
        report("model", { loaded: 1, total: 1, cached: true });
        return new Uint8Array(await hit.arrayBuffer());
      }
    } catch {
      // Cache Storage unavailable (private mode, quota) — fall through to the network.
    }
  }

  const bytes = await download(MODEL_URL, "mirage.cact", (loaded, total) =>
    report("model", { loaded, total }),
  );
  if (bytes.byteLength < 1_000_000) throw new Error("mirage.cact download looks truncated");

  if (typeof caches !== "undefined") {
    try {
      const cache = await caches.open(MODEL_CACHE);
      await cache.put(MODEL_URL, new Response(bytes));
    } catch {
      // Caching is an optimisation; inference still works without it.
    }
  }
  return bytes;
}

async function ensureRuntime() {
  if (runtimePromise) return runtimePromise;

  runtimePromise = (async () => {
    report("runtime", { loaded: 0, total: 1 });
    const wasmBinary = await download(WASM_URL, "cactus.wasm", (loaded, total) =>
      report("runtime", { loaded, total }),
    );
    const model = await loadModel();

    const rt = await createCactus({ wasmBinary });
    const modelPointer = rt._malloc(model.byteLength);
    rt.HEAPU8.set(model, modelPointer);
    const loaded = rt._cactus_load(modelPointer, BigInt(model.byteLength));
    if (loaded !== 0) {
      throw new Error(readError(rt) || "Mirage weights failed to load");
    }

    const models = rt._cactus_models();
    if ((models & CACTUS_VISION) === 0) {
      throw new Error("The loaded archive does not expose a vision model");
    }

    const systemPointer = allocString(rt, "");
    rt._cactus_init(systemPointer, 0, 0);

    outputPointer = rt._malloc(OUTPUT_CAPACITY);
    optionsPointer = allocString(rt, OPTIONS);
    runtime = rt;
    return rt;
  })().catch((error) => {
    runtimePromise = null;
    throw error;
  });

  return runtimePromise;
}

function describe(rgb, width, height) {
  if (width * height > MAX_PIXELS) throw new Error("Image is too large to analyse");
  if (rgb.byteLength !== width * height * 3) throw new Error("Unexpected image buffer size");

  const pointer = runtime._malloc(rgb.byteLength);
  runtime.HEAPU8.set(rgb, pointer);
  const startedAt = performance.now();
  try {
    const result = runtime._cactus_describe(
      pointer,
      width,
      height,
      optionsPointer,
      0,
      0,
      outputPointer,
      OUTPUT_CAPACITY,
    );
    if (result < 0) throw new Error(readError(runtime) || "Mirage inference failed");
    const json = runtime.UTF8ToString(outputPointer);
    if (!json) throw new Error("Mirage returned an empty result");
    return { json, ms: performance.now() - startedAt };
  } finally {
    runtime._free(pointer);
  }
}

self.onmessage = async (event) => {
  const message = event.data || {};
  if (message.type !== "describe") return;

  try {
    await ensureRuntime();
    report("inference", { loaded: 0, total: 1 });
    const { json, ms } = describe(new Uint8Array(message.rgb), message.width, message.height);
    self.postMessage({ type: "result", id: message.id, json, ms });
  } catch (error) {
    fail(message.id, error);
  }
};
