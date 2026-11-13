import type { MirageResult } from "./types";

export type MiragePhase = "runtime" | "model" | "inference";

export type MirageProgress = {
  phase: MiragePhase;
  loaded: number;
  total: number;
  cached?: boolean;
};

type Pending = {
  id: number;
  resolve: (value: MirageResult) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: MirageProgress) => void;
};

let worker: Worker | null = null;
let active: Pending | null = null;
let sequence = 0;

function ensureWorker(): Worker {
  if (worker) return worker;
  if (typeof window === "undefined") throw new Error("Mirage runs in the browser only");

  const instance = new Worker("/mirage/worker.js");
  instance.onmessage = (event: MessageEvent) => {
    const message = event.data as {
      type: string;
      id?: number;
      phase?: MiragePhase;
      loaded?: number;
      total?: number;
      cached?: boolean;
      json?: string;
      ms?: number;
      message?: string;
    };

    if (message.type === "progress") {
      active?.onProgress?.({
        phase: message.phase ?? "inference",
        loaded: message.loaded ?? 0,
        total: message.total ?? 0,
        ...(message.cached === undefined ? {} : { cached: message.cached }),
      });
      return;
    }

    if (!active || message.id !== active.id) return;

    if (message.type === "result" && typeof message.json === "string") {
      const pending = active;
      active = null;
      pending.resolve({ json: message.json, ms: message.ms ?? 0 });
      return;
    }

    if (message.type === "error") {
      const pending = active;
      active = null;
      pending.reject(new Error(message.message || "Mirage inference failed"));
    }
  };

  instance.onerror = (event) => {
    const pending = active;
    active = null;
    pending?.reject(new Error(event.message || "The inference worker crashed"));
  };

  worker = instance;
  return instance;
}

function toRgb(data: ImageData): Uint8Array {
  const source = data.data;
  const rgb = new Uint8Array(data.width * data.height * 3);
  for (let read = 0, write = 0; read < source.length; read += 4) {
    rgb[write++] = source[read] ?? 0;
    rgb[write++] = source[read + 1] ?? 0;
    rgb[write++] = source[read + 2] ?? 0;
  }
  return rgb;
}

/**
 * Runs Mirage on already-decoded pixels. Requests are serialised: the engine
 * holds one model and one conversation, and calls are not re-entrant.
 */
export async function describePixels(
  data: ImageData,
  onProgress?: (progress: MirageProgress) => void,
): Promise<MirageResult> {
  const instance = ensureWorker();
  if (active) throw new Error("Mirage is already analysing an image");

  const id = ++sequence;
  const rgb = toRgb(data);

  return new Promise<MirageResult>((resolve, reject) => {
    active = { id, resolve, reject, ...(onProgress ? { onProgress } : {}) };
    instance.postMessage(
      { type: "describe", id, rgb: rgb.buffer, width: data.width, height: data.height },
      [rgb.buffer],
    );
  });
}

/** Test/debug helper: does this browser expose what the worker needs? */
export function localInferenceSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof Worker === "undefined") return false;
  if (typeof WebAssembly === "undefined") return false;
  // Camera, Cache Storage and workers all need a secure context in practice.
  return window.isSecureContext || window.location.hostname === "localhost";
}
