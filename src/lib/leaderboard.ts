export type LeaderboardEntry = {
  name: string;
  score: number;
  createdAt: string;
};

const ENDPOINT = "/api/leaderboard";
const NAME_KEY = "objectchaos:board-name";

async function readEntries(response: Response): Promise<LeaderboardEntry[]> {
  const type = response.headers.get("content-type") ?? "";
  // In `vite dev` there is no Worker, so /api/* falls through to index.html.
  if (!type.includes("application/json")) throw new Error("The leaderboard is not available here");
  const data = (await response.json()) as { entries?: LeaderboardEntry[]; error?: string };
  if (!response.ok) throw new Error(data.error ?? "The leaderboard did not answer");
  return Array.isArray(data.entries) ? data.entries : [];
}

export async function loadBoard(mode: "find" | "roast" = "find"): Promise<LeaderboardEntry[]> {
  const response = await fetch(`${ENDPOINT}?mode=${mode}`, {
    headers: { accept: "application/json" },
  });
  return readEntries(response);
}

export async function submitScore(
  name: string,
  score: number,
  mode: "find" | "roast" = "find",
): Promise<LeaderboardEntry[]> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, score, mode }),
  });
  return readEntries(response);
}

export function savedBoardName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function rememberBoardName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // Private mode: the name just will not be remembered.
  }
}
