import { Asterisk, Flame, Coffee, Cable, Headphones, Award } from "lucide-react";
export function Report({
  roast,
  score = 94,
  mode = "roast",
}: {
  roast: string;
  score?: number;
  mode?: string;
}) {
  return (
    <article className="report-card">
      <div className="report-top">
        <span>OBJECT CHAOS REPORT</span>
        <Asterisk />
      </div>
      <div className="report-meta">
        <span>17 OBJECTS DETECTED · DEMO</span>
        <span>{mode === "find" ? "FIND THE OBJECT" : "OBJECT ROAST"}</span>
      </div>
      <div className="report-score">
        <span>{score}</span>
        <div>
          <span>/ {mode === "find" ? "300" : "100"}</span>
          <strong>{mode === "find" ? "FINAL SCORE" : "CHAOS SCORE"}</strong>
        </div>
        <Flame />
      </div>
      <div className="report-verdict">
        <span className="eyebrow">THE VERDICT</span>
        <blockquote>“{roast}”</blockquote>
      </div>
      <div className="report-award">
        <span>
          <Award /> CERTIFIED CHAOS
        </span>
        <div>
          <Coffee />
          <Cable />
          <Headphones />
        </div>
      </div>
      <div className="report-bottom">
        <span>YOUR WORLD. YOUR OBJECTS. YOUR CHAOS.</span>
        <span>OBJECTCHAOS ✦</span>
      </div>
    </article>
  );
}
