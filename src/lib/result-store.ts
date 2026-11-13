export type StoredResult = {
  mode: "find" | "roast";
  score: number;
  roast: string;
  roastLines: string[];
  objectCount: number;
  objectNames: string[];
  textLines: string[];
  inferenceMs: number;
  image: string | null;
};

const KEY = "objectchaos:result";

export function saveResult(result: StoredResult) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    // Storage can be unavailable in private mode; the report still renders defaults.
  }
}

export function loadResult(): StoredResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredResult;
    if (typeof parsed.score !== "number" || typeof parsed.roast !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
