import { Asterisk, Flame, Coffee, Award, ScanLine } from "lucide-react";

type ReportProps = {
  roast: string;
  score?: number;
  mode?: string;
  objectCount?: number;
  objectNames?: string[];
  textLines?: string[];
  selected?: string | null;
};

export function Report({
  roast,
  score = 94,
  mode = "roast",
  objectCount = 0,
  objectNames = [],
  textLines = [],
  selected = null,
}: ReportProps) {
  const highlights = objectNames.slice(0, 4);
  return (
    <article className="report-card">
      <div className="report-top">
        <span>OBJECT CHAOS REPORT</span>
        <Asterisk />
      </div>
      <div className="report-meta">
        <span>
          {objectCount} OBJECT{objectCount === 1 ? "" : "S"} DETECTED · ON-DEVICE
        </span>
        <span>{mode === "find" ? "FIND THE OBJECT" : "OBJECT ROAST"}</span>
      </div>
      {selected ? <p className="report-selected">YOU TAPPED · {selected}</p> : null}
      <div className="report-score">
        <span>{score}</span>
        <div>
          <span>/ {mode === "find" ? "600" : "100"}</span>
          <strong>{mode === "find" ? "FINAL SCORE" : "CHAOS SCORE"}</strong>
        </div>
        <Flame />
      </div>
      <div className="report-verdict">
        <span className="eyebrow">THE VERDICT</span>
        <blockquote>“{roast}”</blockquote>
      </div>
      {highlights.length > 0 ? (
        <div className="report-objects">
          <span className="tiny">WHAT MIRAGE SAW</span>
          <div>
            {highlights.map((name, index) => (
              <span key={`${name}-${index}`} className="report-chip">
                {name}
              </span>
            ))}
            {textLines.length > 0 ? (
              <span className="report-chip">
                <ScanLine size={11} /> {textLines.length} text line
                {textLines.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="report-award">
        <span>
          <Award /> CERTIFIED CHAOS
        </span>
        <div>
          <Coffee />
        </div>
      </div>
      <div className="report-bottom">
        <span>YOUR WORLD. YOUR OBJECTS. YOUR CHAOS.</span>
        <span>OBJECTCHAOS ✦</span>
      </div>
    </article>
  );
}
