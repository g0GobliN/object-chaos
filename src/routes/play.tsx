import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  CircleAlert,
  Clock,
  Crosshair,
  Flame,
  RotateCcw,
  Sparkles,
  Trophy,
  Upload,
  X,
} from "lucide-react";

import { Header, Footer } from "@/components/chaos/shell";
import { DeskViewer } from "@/components/chaos/desk-viewer";
import { Button } from "@/components/ui/button";
import { SAMPLE_ANALYSIS, SAMPLE_PHOTO, pageHead } from "@/lib/chaos";
import { describePixels, localInferenceSupported, type MirageProgress } from "@/lib/mirage/client";
import { adaptMirage, type Analysis } from "@/lib/mirage/adapter";
import { buildChallenges, type Challenge } from "@/lib/game/challenges";
import { buildRoast, type Roast } from "@/lib/game/roasts";
import { saveResult } from "@/lib/result-store";

export const Route = createFileRoute("/play")({
  validateSearch: (search: Record<string, unknown>): { mode?: "find" | "roast" } => ({
    mode: search["mode"] === "roast" ? "roast" : "find",
  }),
  head: () =>
    pageHead(
      "Play",
      "Upload a photo, let Mirage inspect it on your device, then find the object or get roasted.",
    ),
  component: Play,
});

const MAX_EDGE = 768;
const MAX_BYTES = 15 * 1024 * 1024;
const ROUND_SECONDS = 20;

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
  const [error, setError] = useState("");

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | undefined>();
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | undefined>();
  const [seconds, setSeconds] = useState(ROUND_SECONDS);
  const [roastData, setRoastData] = useState<Roast | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  const challenge = challenges[round];
  const complete = challenges.length > 0 && round >= challenges.length;
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
    if (seconds <= 0 || feedback === "correct") return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [mode, stage, complete, seconds, feedback]);

  useEffect(() => {
    if (mode !== "find" || stage !== "ready" || complete) return;
    if (seconds === 0 && !feedback) setFeedback("incorrect");
  }, [mode, stage, complete, seconds, feedback]);

  const analyse = useCallback(async (bitmap: ImageBitmap) => {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("This browser cannot prepare the image for analysis");
    context.drawImage(bitmap, 0, 0, width, height);

    const pixels = context.getImageData(0, 0, width, height);
    const preview = canvas.toDataURL("image/jpeg", 0.85);
    bitmap.close();

    const output = await describePixels(pixels, setProgress);
    const result = adaptMirage(output.json, width, height, output.ms);

    if (result.objects.length === 0) {
      throw new Error(
        "Mirage could not find any objects in that photo. Try one with more stuff in it.",
      );
    }

    setImage(preview);
    setAnalysis(result);
    setChallenges(buildChallenges(result, 3));
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
      setSelected(id);
      setFeedback(correct ? "correct" : "incorrect");
      if (correct) setScore((value) => value + 100);
    },
    [challenge, feedback, seconds],
  );

  const next = useCallback(() => {
    setFeedback(undefined);
    setSelected(undefined);
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
    setFeedback(undefined);
    setError("");
    setRound(0);
    setScore(0);
    setSeconds(ROUND_SECONDS);
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
    });
    void navigate({ to: "/result", search: { mode, score: finalScore } });
  }, [analysis, mode, navigate, roastData, score, image]);

  const shownAnalysis = stage === "ready" && analysis ? analysis : SAMPLE_ANALYSIS;

  return (
    <>
      <Header game />
      <main className="play-page page-width">
        <div className="play-heading">
          <div>
            <p className="eyebrow">
              <span className="status-dot" /> THE CHAOS LAB · LOCAL AI
            </p>
            <h1>Let&apos;s make a little chaos.</h1>
          </div>
          <div className="mode-switch">
            <Button asChild variant={mode === "find" ? "default" : "ghost"}>
              <Link to="/play" search={{ mode: "find" }}>
                <Crosshair /> Find the object
              </Link>
            </Button>
            <Button asChild variant={mode === "roast" ? "orange" : "ghost"}>
              <Link to="/play" search={{ mode: "roast" }}>
                <Flame /> Object roast
              </Link>
            </Button>
          </div>
        </div>

        <div className="play-grid">
          <section>
            {cameraOn ? (
              <div className="camera-stage">
                <video ref={videoRef} playsInline muted className="camera-video" />
                <div className="camera-actions">
                  <Button size="hero" onClick={capture}>
                    <Camera /> Capture
                  </Button>
                  <Button variant="ghost" size="hero" onClick={stopCamera}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <DeskViewer
                image={image ?? (stage === "ready" ? undefined : SAMPLE_PHOTO)}
                objects={shownAnalysis.objects}
                selected={selected}
                onSelect={choose}
                interactive={stage === "ready" && mode === "find" && !complete}
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

            {busy ? (
              <div className="analysis-progress" role="status" aria-live="polite">
                <div>
                  <span className="status-dot" /> {progressCopy(progress)}
                  {progressPercent(progress) !== null ? (
                    <strong>{progressPercent(progress)}%</strong>
                  ) : null}
                </div>
                <div className="progress-track">
                  <span style={{ width: `${progressPercent(progress) ?? 100}%` }} />
                </div>
                <p>Everything runs on this device. The photo is never uploaded.</p>
              </div>
            ) : null}

            {error ? (
              <p className="play-error" role="alert">
                <CircleAlert size={15} /> {error}
              </p>
            ) : null}

            <div className="upload-row">
              <div>
                <strong>
                  {stage === "ready"
                    ? "Your photo, analysed on this device."
                    : "A perfectly questionable desk."}
                </strong>
                <p>
                  {stage === "ready"
                    ? `Mirage found ${analysis?.objects.length ?? 0} objects in ${
                        Math.round((analysis?.inferenceMs ?? 0) / 100) / 10
                      }s.`
                    : "Upload one, use your camera, or try the sample."}
                </p>
              </div>
              <div className="upload-actions">
                <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
                  <Upload /> Upload photo
                </Button>
                <Button variant="ghost" onClick={startCamera} disabled={busy || cameraOn}>
                  <Camera /> Camera
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    stopCamera();
                    void run(loadSample());
                  }}
                  disabled={busy}
                >
                  <Sparkles /> Try the sample
                </Button>
              </div>
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

            <div className="demo-note">
              <Sparkles size={15} />
              <span>
                Mirage is a 22 MB vision model that runs in WebAssembly on your device. The first
                run downloads it once; after that it is cached. No upload, no API key, no inference
                bill.
              </span>
            </div>
          </section>

          <aside className="game-panel">
            {stage === "idle" ? (
              <>
                <div className="panel-eyebrow">
                  <Sparkles size={16} />
                  <span>READY WHEN YOU ARE</span>
                </div>
                <h2 className="roast-title">Point it at your desk.</h2>
                <p className="observations">
                  Mirage looks at the photo, finds the objects, and hands the list to the game. Find
                  them, or let your surroundings say something rude about you.
                </p>
                <Button size="hero" onClick={() => inputRef.current?.click()}>
                  <Upload /> Start creating chaos
                </Button>
              </>
            ) : null}

            {busy ? (
              <div className="panel-loading">
                <span className="status-dot" />
                <p>{progressCopy(progress)}</p>
                <small>First run includes a one-time 21.6 MB model download.</small>
              </div>
            ) : null}

            {stage === "ready" && mode === "find" ? (
              <>
                <div className="panel-eyebrow">
                  <Crosshair size={16} />
                  <span>FIND THE OBJECT</span>
                  <span>
                    {Math.min(round + 1, challenges.length)} / {challenges.length || 0}
                  </span>
                </div>
                <div className="game-stats">
                  <div>
                    <Clock size={16} />
                    <span className={seconds < 10 ? "text-chaos-orange" : ""}>
                      00:{String(seconds).padStart(2, "0")}
                    </span>
                    <small>TIME LEFT</small>
                  </div>
                  <div>
                    <Trophy size={16} />
                    <span>{score}</span>
                    <small>POINTS</small>
                  </div>
                </div>

                {challenges.length === 0 ? (
                  <>
                    <h2 className="roast-title">Not enough to play with.</h2>
                    <p className="observations">
                      Mirage found {analysis?.objects.length ?? 0} usable objects. Find the object
                      needs at least two so there is something to get wrong. Try a richer photo.
                    </p>
                    <Button variant="outline" size="hero" onClick={reset}>
                      <RotateCcw /> Try another photo
                    </Button>
                  </>
                ) : complete ? (
                  <>
                    <h2 className="roast-title">Chaos, conquered.</h2>
                    <p className="observations">
                      You scored {score} of {challenges.length * 100} across {challenges.length}{" "}
                      rounds.
                    </p>
                    <Button size="hero" onClick={finish}>
                      See my report
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="challenge-section">
                      <span className="tiny">YOUR CHALLENGE</span>
                      <h2>{challenge?.text}</h2>
                      <p>Tap the object in the photo.</p>
                    </div>
                    <div className="round-progress">
                      {challenges.map((item, index) => (
                        <span key={item.id} className={index < round ? "done" : ""} />
                      ))}
                    </div>
                    {feedback ? (
                      <p className={`feedback ${feedback}`}>
                        {feedback === "correct" ? <Check /> : <X />}
                        {feedback === "correct"
                          ? "+100. Sharp eyes."
                          : "Not that one. Keep looking?"}
                      </p>
                    ) : null}
                    {feedback ? (
                      <Button variant="outline" size="hero" onClick={next}>
                        {round + 1 >= challenges.length ? "Finish round" : "Next challenge"}
                      </Button>
                    ) : null}
                  </>
                )}
              </>
            ) : null}

            {stage === "ready" && mode === "roast" ? (
              <>
                <div className="panel-eyebrow">
                  <Flame size={16} />
                  <span>OBJECT ROAST</span>
                  <span>{roastData?.score ?? 0} / 100</span>
                </div>
                <h2 className="roast-title">The verdict is in.</h2>
                <div className="roast-lines">
                  {(roastData?.lines ?? []).map((line) => (
                    <p key={line} className="live-roast">
                      {line}
                    </p>
                  ))}
                </div>
                <div className="roast-numbers">
                  <div>
                    <strong>{analysis?.objects.length ?? 0}</strong>
                    <span>OBJECTS DETECTED</span>
                  </div>
                  <div>
                    <strong>
                      {Math.round((analysis?.inferenceMs ?? 0) / 100) / 10}
                      <span>s</span>
                    </strong>
                    <span>ON-DEVICE INFERENCE</span>
                  </div>
                </div>
                <Button size="hero" onClick={finish}>
                  <Flame /> Make my report
                </Button>
              </>
            ) : null}
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

async function loadSample(): Promise<ImageBitmap> {
  const response = await fetch(SAMPLE_PHOTO);
  const blob = await response.blob();
  return createImageBitmap(blob);
}
