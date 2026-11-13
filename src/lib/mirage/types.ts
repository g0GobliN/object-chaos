export type MirageResult = {
  json: string;
  ms: number;
};

export type MirageRawObject = {
  id?: number | string;
  name?: string;
  score?: number;
  bbox?: number[];
  position?: string;
  description?: { color?: string; material?: string } & Record<string, unknown>;
};

export type MirageRaw = {
  scene?: { setting?: string; surface?: string; lighting?: string; style?: string };
  objects?: MirageRawObject[];
  regions?: MirageRawObject[];
  text?: Array<{ text?: string } & Record<string, unknown>>;
  relations?: unknown[];
  events?: unknown[];
  reasoning?: string;
};
