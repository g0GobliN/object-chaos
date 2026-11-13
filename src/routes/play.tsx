import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Crosshair,
  Flame,
  Upload,
  Clock,
  Trophy,
  Check,
  X,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Header, Footer } from "@/components/chaos/shell";
import { DeskViewer } from "@/components/chaos/desk-viewer";
import { Button } from "@/components/ui/button";
import { challenges, objects, roasts, isCorrectAnswer, pageHead } from "@/lib/chaos";
export const Route = createFileRoute("/play")({
  validateSearch: (search: Record<string, unknown>): { mode?: "find" | "roast" } => ({
    mode: search["mode"] === "roast" ? "roast" : "find",
  }),
  head: () =>
    pageHead(
      "Play",
      "Find the object or roast your surroundings in the OBJECT CHAOS interactive demo.",
    ),
  component: Play,
});
function Play() {
  const { mode = "find" } = Route.useSearch();
  const [image, setImage] = useState<string>();
  const input = useRef<HTMLInputElement>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(30);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [feedback, setFeedback] = useState<"correct" | "incorrect">();
  const [roastIndex, setRoastIndex] = useState(0);
  const [error, setError] = useState("");
  const complete = round >= challenges.length;
  useEffect(() => {
    if (!running || seconds <= 0 || complete || feedback === "correct") return;
    const timer = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [running, seconds, complete, feedback]);
  useEffect(() => {
    if (seconds === 0) setRunning(false);
  }, [seconds]);
  function reset() {
    setRound(0);
    setScore(0);
    setSeconds(30);
    setRunning(false);
    setSelected(undefined);
    setFeedback(undefined);
  }
  function choose(id: string) {
    if (complete || seconds === 0 || feedback === "correct") return;
    setRunning(true);
    setSelected(id);
    const correct = isCorrectAnswer(round, id);
    setFeedback(correct ? "correct" : "incorrect");
    if (correct) {
      setScore((s) => s + 100);
      setRunning(false);
    }
  }
  function next() {
    setRound((r) => r + 1);
    setFeedback(undefined);
    setSelected(undefined);
    setSeconds(30);
    setRunning(false);
  }
  return (
    <>
      <Header game />
      <main className="play-page page-width">
        <div className="play-heading">
          <div>
            <p className="eyebrow">
              <span className="status-dot" /> THE CHAOS LAB · FRONTEND DEMO
            </p>
            <h1>Let's make a little chaos.</h1>
          </div>
          <div className="mode-switch">
            <Button asChild variant={mode === "find" ? "default" : "ghost"} onClick={reset}>
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
            <DeskViewer
              interactive={mode === "find"}
              image={image}
              selected={selected}
              onSelect={choose}
            />
            <div className="upload-row">
              <div>
                <strong>
                  {image ? "Your photo. Our demo objects." : "A perfectly questionable desk."}
                </strong>
                <p>Demo objects are fixed, not detected from your photo.</p>
              </div>
              <Button variant="outline" onClick={() => input.current?.click()}>
                <Upload /> Upload photo
              </Button>
              <input
                ref={input}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith("image/")) {
                    setError("Please choose an image.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") {
                      setImage(reader.result);
                      setError("");
                      reset();
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </div>
            {error && <p role="alert">{error}</p>}
            <div className="demo-note">
              <Sparkles size={15} />
              <span>
                Local preview only. No AI scan, no upload to a server. Your photos stay yours.
              </span>
            </div>
          </section>
          <aside className="game-panel">
            {mode === "find" ? (
              <>
                <div className="panel-eyebrow">
                  <Crosshair size={16} />
                  <span>FIND THE OBJECT</span>
                  <span>{Math.min(round + 1, 3)} / 3</span>
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
                    <small>YOUR SCORE</small>
                  </div>
                </div>
                <div className="challenge-section">
                  <span className="eyebrow">
                    {complete ? "NICELY DONE, CHAOS AGENT." : "YOUR MISSION"}
                  </span>
                  <h2>{complete ? "You found your kind of chaos." : challenges[round]?.text}</h2>
                  <p>
                    {complete
                      ? "Three rounds. One extremely suspicious desk."
                      : "Trust your eyes. Not your desk."}
                  </p>
                </div>
                <div className="round-progress">
                  {challenges.map((_, i) => (
                    <span
                      key={i}
                      className={i < round || (i === round && feedback === "correct") ? "done" : ""}
                    />
                  ))}
                </div>
                {!complete && seconds > 0 && (
                  <div className="object-list">
                    {objects.map((o) => (
                      <Button
                        key={o.id}
                        variant="outline"
                        className={selected === o.id ? "object-option active" : "object-option"}
                        onClick={() => choose(o.id)}
                        disabled={feedback === "correct"}
                      >
                        <span>{o.name}</span>
                        {selected === o.id ? (
                          feedback === "correct" ? (
                            <Check />
                          ) : (
                            <X />
                          )
                        ) : (
                          <Crosshair />
                        )}
                      </Button>
                    ))}
                  </div>
                )}
                <div aria-live="polite">
                  {feedback && (
                    <div className={`feedback ${feedback}`}>
                      {feedback === "correct" ? (
                        <>
                          <Check /> That's the one! +100 points
                        </>
                      ) : (
                        <>
                          <X /> Not quite. Give another object a go.
                        </>
                      )}
                    </div>
                  )}
                  {seconds === 0 && (
                    <div className="feedback incorrect">
                      <Clock /> Time's up. The desk won this round.
                    </div>
                  )}
                </div>
                {feedback === "correct" || seconds === 0 ? (
                  <Button size="hero" className="w-full mt-4" onClick={next}>
                    {round === 2 ? "Finish game" : "Next challenge"} <ArrowRight />
                  </Button>
                ) : complete ? (
                  <Button asChild size="hero" className="w-full">
                    <Link to="/result" search={{ mode: "find", score, roast: 0 }}>
                      See your result <ArrowRight />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="w-full mt-4"
                    onClick={() => setRunning(!running)}
                  >
                    {running ? "Pause timer" : "Start timer"} <Clock />
                  </Button>
                )}
                <Button variant="ghost" className="w-full mt-2" onClick={reset}>
                  <RotateCcw /> Start over
                </Button>
              </>
            ) : (
              <>
                <div className="panel-eyebrow text-chaos-orange">
                  <Flame size={16} />
                  <span>THE VERDICT IS IN.</span>
                </div>
                <h2 className="roast-title">
                  Your desk.
                  <br />
                  Absolutely exposed.
                </h2>
                <blockquote className="live-roast">“{roasts[roastIndex]}”</blockquote>
                <div className="roast-numbers">
                  <div>
                    <strong>17</strong>
                    <span>DEMO OBJECTS</span>
                  </div>
                  <div>
                    <strong>
                      94<span>/100</span>
                    </strong>
                    <span>CHAOS SCORE</span>
                  </div>
                </div>
                <div className="observations">
                  <p>☕ That mug has seen things.</p>
                  <p>⌁ Your cables need adult supervision.</p>
                  <p>❀ The plant deserves a better roommate.</p>
                </div>
                <Button
                  variant="orange"
                  size="hero"
                  className="w-full"
                  onClick={() => setRoastIndex((i) => (i + 1) % roasts.length)}
                >
                  <Flame /> New roast
                </Button>
                <Button asChild variant="outline" size="hero" className="w-full mt-3">
                  <Link to="/result" search={{ mode: "roast", score: 94, roast: roastIndex }}>
                    Get your chaos report <ArrowRight />
                  </Link>
                </Button>
              </>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
