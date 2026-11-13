import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  CircleAlert,
  Eye,
  RotateCcw,
  Sparkles,
  Trophy,
  Upload,
  X,
} from "lucide-react";

import { DeskViewer } from "@/components/chaos/desk-viewer";
import { Footer, Header } from "@/components/chaos/shell";
import { SAMPLE_ANALYSIS, SAMPLE_PHOTO, pageHead } from "@/lib/chaos";
import { describePixels, localInferenceSupported, type MirageProgress } from "@/lib/mirage/client";
import { adaptMirage, mergeAnalyses, type Analysis } from "@/lib/mirage/adapter";
import { buildChallenges, type Challenge } from "@/lib/game/challenges";
import { buildRoast, type Roast } from "@/lib/game/roasts";
import { saveResult } from "@/lib/result-store";
import {
  loadBoard,
  rememberBoardName,
  savedBoardName,
  submitScore,
  type LeaderboardEntry,
} from "@/lib/leaderboard";

export const Route = createFileRoute("/play")({
  validateSearch: (search: Record<string, unknown>): { mode?: "find" | "roast" } => ({
    mode: search["mode"] === "roast" ? "roast" : "find",
  }),
  head: () =>
    pageHead(
      "Play",
      "Upload a photo, let Mirage inspect it on your device, then find the object or get roasted.",
      "/play",
    ),
  component: Play,
});

const MAX_EDGE = 768;
const MAX_BYTES = 15 * 1024 * 1024;
const MIN_IMAGE_EDGE = 64;
const MAX_IMAGE_EDGE = 12000;
const ROUND_SECONDS = 20;
const BASE_POINTS = 150;
const QUICK_BONUS = 50;
const QUICK_SECONDS = 10;
const HINT_SECONDS = 8;
const MAX_ROUND_POINTS = BASE_POINTS + QUICK_BONUS;
const DETAIL_EDGE = 1152;
const MIN_DETAIL_EDGE = 320;
const SEEN_KEY = "objectchaos:seen-challenges";

function readSeenChallenges(): string[] {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function rememberChallenges(ids: string[]) {
  try {
    const next = [...new Set([...readSeenChallenges(), ...ids])].slice(-120);
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(next));
  } catch {
    // Storage being unavailable just means a challenge could repeat.
  }
}

type Stage = "idle" | "analyzing" | "ready";

function progressCopy(progress: MirageProgress | null): string {
  if (!progress) return "Warming up";
  if (progress.phase === "runtime") return "Loading the Cactus runtime";
  if (progress.phase === "inference") return "Mirage is looking at your photo";
  return progress.cached ? "Loading Mirage from cache" : "Downloading Mirage (21.6 MB, once)";
}

function progressPercent(progress: MirageProgress | null): number | null {
  if (!progress || progress.phase === "inference") return null;
  if (!progress.total) return null;
  return Math.min(100, Math.round((progress.loaded / progress.total) * 100));
}

function Play() {
  const { mode = "find" } = Route.useSearch();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("idle");
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [progress, setProgress] = useState<MirageProgress | null>(null);
  const [detailPass, setDetailPass] = useState(false);
  const [error, setError] = useState("");

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [selected, setSelected] = useState<string | undefined>();
  const [tapped, setTapped] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | "skipped" | undefined>();
  const [seconds, setSeconds] = useState(ROUND_SECONDS);
  const [roastData, setRoastData] = useState<Roast | null>(null);
  const [board, setBoard] = useState<LeaderboardEntry[] | null>(null);
  const [boardName, setBoardName] = useState("");
  const [boardState, setBoardState] = useState<"idle" | "saving" | "saved">("idle");
  const [boardError, setBoardError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  const challenge = challenges[round];
  const complete = challenges.length > 0 && round >= challenges.length;
  const answerNames = (challenge?.answerIds ?? [])
    .map((id) => analysis?.objects.find((object) => object.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  const busy = stage === "analyzing";

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    if (!cameraOn) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
  }, [cameraOn]);

  useEffect(() => {
    if (mode !== "find" || stage !== "ready" || complete) return;
    if (seconds <= 0 || feedback) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [mode, stage, complete, seconds, feedback]);

  useEffect(() => {
    if (mode !== "find" || stage !== "ready" || complete) return;
    if (seconds === 0 && !feedback) setFeedback("skipped");
  }, [mode, stage, complete, seconds, feedback]);

  useEffect(() => {
    setBoardName(savedBoardName());
  }, []);

  useEffect(() => {
    if (mode !== "find") return;
    let cancelled = false;
    loadBoard("find")
      .then((entries) => {
        if (!cancelled) setBoard(entries);
      })
      .catch(() => {
        if (!cancelled) setBoard(null);
      });
    return () => {
      cancelled = true;
    };
  }, [complete, mode]);

  const topScores = board?.slice(0, 5) ?? [];

  const analyse = useCallback(async (bitmap: ImageBitmap) => {
    // close() detaches the bitmap and zeroes its size, so read the dimensions first.
    const pixelsWide = bitmap.width;
    const pixelsHigh = bitmap.height;
    if (pixelsWide < MIN_IMAGE_EDGE || pixelsHigh < MIN_IMAGE_EDGE) {
      bitmap.close();
      throw new Error(
        `That image is ${pixelsWide}×${pixelsHigh} pixels. Use one at least ${MIN_IMAGE_EDGE} px on both sides.`,
      );
    }
    if (pixelsWide > MAX_IMAGE_EDGE || pixelsHigh > MAX_IMAGE_EDGE) {
      bitmap.close();
      throw new Error(
        `That image is ${pixelsWide}×${pixelsHigh} pixels. The limit is ${MAX_IMAGE_EDGE} px on the longest side.`,
      );
    }
    const draw = (edge: number, allowUpscale = false) => {
      const ratio = edge / Math.max(bitmap.width, bitmap.height);
      const scale = allowUpscale ? ratio : Math.min(1, ratio);
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("This browser cannot prepare the image for analysis");
      context.drawImage(bitmap, 0, 0, width, height);
      return { canvas, context, width, height };
    };

    const first = draw(MAX_EDGE);
    const firstPixels = first.context.getImageData(0, 0, first.width, first.height);
    // A closer pass finds small things the fast one misses. Skipped when the
    // photo is already smaller than the detail pass would render it.
    const detail =
      Math.max(pixelsWide, pixelsHigh) > MIN_DETAIL_EDGE ? draw(DETAIL_EDGE, true) : null;
    const detailPixels = detail
      ? detail.context.getImageData(0, 0, detail.width, detail.height)
      : null;
    bitmap.close();

    const output = await describePixels(firstPixels, setProgress);
    let result = adaptMirage(output.json, first.width, first.height, output.ms);

    if (detail && detailPixels) {
      setDetailPass(true);
      try {
        const closer = await describePixels(detailPixels, setProgress);
        result = mergeAnalyses(
          result,
          adaptMirage(closer.json, detail.width, detail.height, closer.ms),
        );
      } finally {
        setDetailPass(false);
      }
    }

    const preview = first.canvas.toDataURL("image/jpeg", 0.85);

    if (result.objects.length === 0) {
      throw new Error(
        "Mirage could not find anything in that photo it was confident about. Try a brighter, closer shot with more stuff in it.",
      );
    }

    const nextChallenges = buildChallenges(result, 3, readSeenChallenges());
    rememberChallenges(nextChallenges.map((challenge) => challenge.id));

    setImage(preview);
    setAnalysis(result);
    setChallenges(nextChallenges);
    setRoastData(buildRoast(result));
    setRound(0);
    setScore(0);
    setSelected(undefined);
    setFeedback(undefined);
    setSeconds(ROUND_SECONDS);
    setStage("ready");
  }, []);

  const run = useCallback(
    async (bitmapPromise: Promise<ImageBitmap>) => {
      setError("");
      setProgress(null);
      setStage("analyzing");
      try {
        if (!localInferenceSupported()) {
          throw new Error(
            "Local inference needs a modern browser on HTTPS or localhost. Try Chrome, Edge, Firefox or Safari.",
          );
        }
        await analyse(await bitmapPromise);
      } catch (caught) {
        setStage("idle");
        setError(
          caught instanceof Error ? caught.message : "Something went wrong analysing that photo",
        );
      } finally {
        setProgress(null);
      }
    },
    [analyse],
  );

  const onFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("That file is not an image. JPEG, PNG or WebP please.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("That image is larger than 15 MB. Try a smaller one.");
        return;
      }
      stopCamera();
      void run(
        createImageBitmap(file).catch(() => {
          // Browsers cannot decode every image format that exists; iPhone HEIC is the
          // common case on desktop Chrome. Say so instead of blaming the model.
          throw new Error(
            "This browser could not decode that image. iPhone HEIC photos often fail — export it as JPEG or PNG and try again.",
          );
        }),
      );
    },
    [run, stopCamera],
  );

  const loadSample = useCallback(async () => {
    const response = await fetch(SAMPLE_PHOTO);
    if (!response.ok) throw new Error("The sample photo could not be loaded. Try uploading one.");
    return createImageBitmap(await response.blob());
  }, []);

  const startCamera = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      setError("The camera is not available. You can upload a photo instead.");
    }
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      setError("The camera is still starting up. Give it a second.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    stopCamera();
    void run(createImageBitmap(canvas));
  }, [run, stopCamera]);

  const choose = useCallback(
    (id: string) => {
      if (!challenge || feedback === "correct" || seconds === 0) return;
      const correct = challenge.answerIds.includes(id);
      // Answering with time to spare is worth extra: the clock is part of the game.
      const points = correct ? BASE_POINTS + (seconds > QUICK_SECONDS ? QUICK_BONUS : 0) : 0;
      setSelected(id);
      setTapped(analysis?.objects.find((object) => object.id === id)?.name ?? null);
      setEarned(points);
      setFeedback(correct ? "correct" : "incorrect");
      if (correct) setScore((value) => value + points);
    },
    [analysis, challenge, feedback, seconds],
  );

  const skip = useCallback(() => {
    if (!challenge || feedback) return;
    setFeedback("skipped");
  }, [challenge, feedback]);

  const saveToBoard = useCallback(async () => {
    if (mode !== "find" || score <= 0) return;
    const name = boardName.trim();
    setBoardState("saving");
    setBoardError("");
    try {
      setBoard(await submitScore(name, score, "find"));
      setBoardState("saved");
      rememberBoardName(name);
    } catch (caught) {
      setBoardState("idle");
      setBoardError(caught instanceof Error ? caught.message : "Could not save that score");
    }
  }, [boardName, mode, score]);

  const next = useCallback(() => {
    setFeedback(undefined);
    setSelected(undefined);
    setEarned(0);
    setSeconds(ROUND_SECONDS);
    setRound((value) => value + 1);
  }, []);

  const reset = useCallback(() => {
    setStage("idle");
    setAnalysis(null);
    setImage(null);
    setChallenges([]);
    setRoastData(null);
    setSelected(undefined);
    setTapped(null);
    setFeedback(undefined);
    setError("");
    setRound(0);
    setScore(0);
    setEarned(0);
    setSeconds(ROUND_SECONDS);
    setBoardState("idle");
    setBoardError("");
  }, []);

  const finish = useCallback(() => {
    if (!analysis) return;
    const roast = roastData ?? buildRoast(analysis);
    const finalScore = mode === "find" ? score : roast.score;
    saveResult({
      mode,
      score: finalScore,
      roast: roast.text,
      roastLines: roast.lines,
      objectCount: analysis.objects.length,
      objectNames: analysis.objects.slice(0, 6).map((object) => object.name),
      textLines: analysis.textLines,
      inferenceMs: Math.round(analysis.inferenceMs),
      image,
      selected: tapped,
    });
    void navigate({ to: "/result", search: { mode, score: finalScore } });
  }, [analysis, mode, navigate, roastData, score, image, tapped]);

  const shownAnalysis = stage === "ready" && analysis ? analysis : SAMPLE_ANALYSIS;

  return (
    <>
      <Header />
      <main className="w-wrap">
        <div className="g-head">
          <h1>{mode === "find" ? "Find the object" : "Object roast"}</h1>
          <p className="g-modes">
            <Link to="/play" search={{ mode: "find" }}>
              {mode === "find" ? <strong>Find</strong> : "Find"}
            </Link>
            <Link to="/play" search={{ mode: "roast" }}>
              {mode === "roast" ? <strong>Roast</strong> : "Roast"}
            </Link>
          </p>
        </div>

        <div className="g-layout">
          <div className="g-stage">
            {cameraOn ? (
              <div className="camera-stage">
                <video ref={videoRef} playsInline muted className="camera-video" />
                <div className="g-attract">
                  <p className="g-attract-title">Hold still</p>
                  <div className="g-attract-actions">
                    <button type="button" className="w-play" onClick={capture}>
                      <Camera size={14} /> take the photo
                    </button>
                    <button type="button" className="w-linkish" onClick={stopCamera}>
                      cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <DeskViewer
                image={image ?? (stage === "ready" ? undefined : SAMPLE_PHOTO)}
                objects={busy ? [] : shownAnalysis.objects}
                selected={selected}
                onSelect={choose}
                interactive={
                  stage === "ready" &&
                  mode === "find" &&
                  !complete &&
                  seconds > 0 &&
                  feedback !== "correct" &&
                  feedback !== "skipped"
                }
                hintIds={
                  mode === "find" &&
                  stage === "ready" &&
                  !feedback &&
                  seconds > 0 &&
                  seconds <= HINT_SECONDS
                    ? challenge?.answerIds
                    : undefined
                }
                inferenceMs={
                  stage === "ready" ? analysis?.inferenceMs : SAMPLE_ANALYSIS.inferenceMs
                }
                caption={
                  stage === "ready"
                    ? "YOUR PHOTO · REAL DETECTIONS"
                    : "EXAMPLE ANALYSIS · SAMPLE DESK"
                }
              />
            )}

            {!cameraOn && !busy && stage !== "ready" ? (
              <div className="g-attract">
                <p className="g-attract-title">{mode === "find" ? "Press start" : "Get roasted"}</p>
                <p className="g-attract-note">
                  {mode === "find"
                    ? `3 rounds · 20 seconds each · ${MAX_ROUND_POINTS * 3} max`
                    : "1 verdict · scored out of 100"}
                </p>
                <div className="g-attract-actions">
                  <button
                    type="button"
                    className="w-play w-play-lg"
                    onClick={() => void run(loadSample())}
                  >
                    use the sample desk
                  </button>
                  <button
                    type="button"
                    className="w-linkish"
                    onClick={() => inputRef.current?.click()}
                  >
                    or upload a photo
                  </button>
                </div>
              </div>
            ) : null}

            {busy ? (
              <div className="g-attract">
                <p className="g-attract-title">Scanning</p>
                <div className="w-progress">
                  <span style={{ width: `${progressPercent(progress) ?? 100}%` }} />
                </div>
                <p className="g-attract-note">
                  {detailPass ? "Second look at full detail" : progressCopy(progress)}
                  {!detailPass && progressPercent(progress) !== null
                    ? ` · ${progressPercent(progress)}%`
                    : ""}
                </p>
              </div>
            ) : null}
          </div>

          <aside className="g-side">
            {stage === "ready" && mode === "find" ? (
              challenges.length === 0 ? (
                <>
                  <p className="g-challenge">Not enough to play with</p>
                  <p className="w-small">
                    Mirage found {analysis?.objects.length ?? 0} usable objects. Find the object
                    needs at least two, so there is something to get wrong.
                  </p>
                  <div className="w-actions">
                    <button type="button" className="w-play" onClick={reset}>
                      try another photo
                    </button>
                  </div>
                </>
              ) : complete ? (
                <>
                  <div className="g-hud">
                    <div>
                      <span className="g-label">Score</span>
                      <span className="g-num">{score}</span>
                    </div>
                    <div>
                      <span className="g-label">Out of</span>
                      <span className="g-num">{challenges.length * MAX_ROUND_POINTS}</span>
                    </div>
                    <div>
                      <span className="g-label">Rounds</span>
                      <span className="g-num">{challenges.length}</span>
                    </div>
                  </div>
                  <p className="g-challenge">Round complete</p>

                  {mode === "find" ? (
                    <div className="g-board">
                      <p className="g-board-title">
                        <Trophy size={13} /> leaderboard
                      </p>
                      {boardState === "saved" ? (
                        <p className="w-feedback">
                          <Check size={13} /> On the board as {boardName.trim()}.
                        </p>
                      ) : (
                        <form
                          className="g-board-form"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void saveToBoard();
                          }}
                        >
                          <input
                            className="g-board-input"
                            value={boardName}
                            maxLength={16}
                            placeholder="your name"
                            aria-label="Name for the leaderboard"
                            onChange={(event) => setBoardName(event.target.value)}
                          />
                          <button
                            type="submit"
                            className="w-play"
                            disabled={
                              boardState === "saving" || boardName.trim().length < 2 || score === 0
                            }
                          >
                            {boardState === "saving" ? "saving…" : "put me on the board"}
                          </button>
                        </form>
                      )}
                      {boardError ? (
                        <p className="w-feedback bad" role="alert">
                          {boardError}
                        </p>
                      ) : null}
                      {board && board.length > 0 ? (
                        <ol className="g-board-list">
                          {board.map((entry, index) => (
                            <li key={`${entry.name}-${entry.score}-${entry.createdAt}-${index}`}>
                              <span className="g-board-rank">{index + 1}</span>
                              <span className="g-board-name">{entry.name}</span>
                              <span className="g-board-score">{entry.score}</span>
                            </li>
                          ))}
                        </ol>
                      ) : board ? (
                        <p className="w-small">Nobody has finished a round yet. Be the first.</p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="w-actions">
                    <button type="button" className="w-play w-play-lg" onClick={finish}>
                      see my report
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="g-hud">
                    <div>
                      <span className="g-label">Round</span>
                      <span className="g-num">
                        {Math.min(round + 1, challenges.length)}/{challenges.length}
                      </span>
                    </div>
                    <div>
                      <span className="g-label">Time</span>
                      <span className={`g-num${seconds < 10 ? " is-low" : ""}`}>
                        00:{String(seconds).padStart(2, "0")}
                      </span>
                    </div>
                    <div>
                      <span className="g-label">Score</span>
                      <span className="g-num">{score}</span>
                      {feedback === "correct" && earned > 0 ? (
                        <span key={`${round}-${earned}`} className="g-pop" aria-hidden="true">
                          +{earned}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p className="g-challenge">{challenge?.text}</p>
                  <div className="g-pips" aria-hidden="true">
                    {challenges.map((item, index) => (
                      <span
                        key={item.id}
                        className={index < round ? "is-done" : index === round ? "is-now" : ""}
                      />
                    ))}
                  </div>
                  <p className="g-hint">tap it on the photo, not down here</p>

                  {feedback ? (
                    <p className={`w-feedback${feedback === "incorrect" ? " bad" : ""}`}>
                      {feedback === "correct" ? <Check size={13} /> : null}
                      {feedback === "incorrect" ? <X size={13} /> : null}
                      {feedback === "skipped" ? <Eye size={13} /> : null}{" "}
                      {feedback === "correct"
                        ? `+${earned}. ${earned > BASE_POINTS ? "Beat the clock." : "Sharp eyes."}`
                        : feedback === "incorrect"
                          ? `Not that one — you tapped the ${tapped ?? "background"}. Keep looking?`
                          : seconds === 0
                            ? `Time's up. Mirage counted: ${answerNames.join(", ") || "nothing certain"}.`
                            : `Skipped, no points. Mirage counted: ${answerNames.join(", ") || "nothing certain"}.`}
                    </p>
                  ) : null}

                  <div className="w-actions">
                    {!feedback ? (
                      <button type="button" className="w-linkish" onClick={skip}>
                        show me what counts
                      </button>
                    ) : (
                      <button type="button" className="w-play" onClick={next}>
                        {round + 1 >= challenges.length ? "finish round" : "next challenge"}
                      </button>
                    )}
                    <span className="w-small">
                      +{BASE_POINTS} a tap · +{QUICK_BONUS} if you beat the clock
                    </span>
                  </div>
                </>
              )
            ) : null}

            {stage === "ready" && mode === "roast" ? (
              <>
                <div className="g-hud">
                  <div>
                    <span className="g-label">Verdict</span>
                    <span className="g-num">{roastData?.score ?? 0}/100</span>
                  </div>
                  <div>
                    <span className="g-label">Objects</span>
                    <span className="g-num">{analysis?.objects.length ?? 0}</span>
                  </div>
                  <div>
                    <span className="g-label">Scan</span>
                    <span className="g-num">
                      {Math.round((analysis?.inferenceMs ?? 0) / 100) / 10}s
                    </span>
                  </div>
                </div>
                <div className="g-verdict">
                  {(roastData?.lines ?? []).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <div className="w-actions">
                  <button type="button" className="w-play w-play-lg" onClick={finish}>
                    make my report
                  </button>
                </div>
              </>
            ) : null}

            {stage !== "ready" && !busy ? (
              <>
                <div className="g-hud">
                  <div>
                    <span className="g-label">Round</span>
                    <span className="g-num">{mode === "find" ? "1/3" : "—"}</span>
                  </div>
                  <div>
                    <span className="g-label">Time</span>
                    <span className="g-num">{mode === "find" ? "00:20" : "—"}</span>
                  </div>
                  <div>
                    <span className="g-label">Score</span>
                    <span className="g-num">0</span>
                  </div>
                </div>
                <p className="g-challenge">{mode === "find" ? "Find it" : "Take it"}</p>

                {mode === "find" && topScores.length > 0 ? (
                  <div className="g-board g-board-side">
                    <p className="g-board-title">
                      <Trophy size={13} /> top scores
                    </p>
                    <ol className="g-board-list">
                      {topScores.map((entry, index) => (
                        <li key={`${entry.name}-${entry.score}-${entry.createdAt}-${index}`}>
                          <span className="g-board-rank">{index + 1}</span>
                          <span className="g-board-name">{entry.name}</span>
                          <span className="g-board-score">{entry.score}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
                <p className="w-small">
                  {mode === "find"
                    ? `The model names a thing on your photo. Tap it before the clock runs out: +${BASE_POINTS} for a hit, +${QUICK_BONUS} more if you answer with time to spare, nothing for a miss. ${MAX_ROUND_POINTS * 3} total.`
                    : "The model reads your photo once and writes a verdict scored out of 100, from fixed templates. It only talks about objects it actually found."}
                </p>
                <p className="w-small">
                  The photo is scanned in this tab and never uploaded. The 21.6 MB model is cached
                  after the first visit.
                </p>
              </>
            ) : null}
          </aside>
        </div>

        {error ? (
          <p className="w-feedback bad" role="alert">
            <CircleAlert size={13} /> {error}
          </p>
        ) : null}

        <hr className="w-rule" />
        <div className="w-actions">
          <button
            type="button"
            className="w-linkish"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <Upload size={12} /> upload a photo
          </button>
          <span className="w-sep">|</span>
          <button
            type="button"
            className="w-linkish"
            onClick={startCamera}
            disabled={busy || cameraOn}
          >
            <Camera size={12} /> use the camera
          </button>
          <span className="w-sep">|</span>
          <button
            type="button"
            className="w-linkish"
            onClick={() => {
              stopCamera();
              void run(loadSample());
            }}
            disabled={busy}
          >
            <Sparkles size={12} /> use the sample desk
          </button>
          <span className="w-small">jpg · png · webp · 15 mb</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              onFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
        <p className="w-small">
          Mirage runs in this tab. <Link to="/how-it-works">how it works</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
