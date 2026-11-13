import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Share2, Download, RotateCcw, Asterisk } from "lucide-react";
import { Header, Footer } from "@/components/chaos/shell";
import { Report } from "@/components/chaos/report";
import { Button } from "@/components/ui/button";
import { roasts, pageHead } from "@/lib/chaos";
export const Route = createFileRoute("/result")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { mode?: "find" | "roast"; score?: number; roast?: number } => ({
    mode: s["mode"] === "find" ? "find" : "roast",
    score: Number.isFinite(Number(s["score"]))
      ? Math.max(0, Math.min(300, Number(s["score"])))
      : 94,
    roast: Math.max(0, Math.min(3, Number(s["roast"]) || 0)),
  }),
  head: () =>
    pageHead("Your chaos report", "Certified chaos. Your shareable OBJECT CHAOS game result."),
  component: Result,
});
function Result() {
  const { mode = "roast", score = 94, roast = 0 } = Route.useSearch();
  const [notice, setNotice] = useState("");
  const text = roasts[roast] ?? roasts[0] ?? "Your desk is clearly under investigation.";
  async function share() {
    const summary = `OBJECT CHAOS REPORT · ${score}${mode === "find" ? " points" : "/100"} · CERTIFIED CHAOS\n${text}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My OBJECT CHAOS report", text: summary });
        setNotice("Chaos shared.");
      } else {
        await navigator.clipboard.writeText(summary);
        setNotice("Result copied. Go spread the chaos.");
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError")
        setNotice("Sharing is unavailable here. Try downloading your card.");
    }
  }
  function download() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setNotice("Image download is not supported by this browser.");
      return;
    }
    const css = getComputedStyle(document.documentElement);
    ctx.fillStyle = css.getPropertyValue("--background");
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = css.getPropertyValue("--primary");
    ctx.font = "bold 30px sans-serif";
    ctx.fillText("OBJECT CHAOS REPORT", 70, 100);
    ctx.fillStyle = css.getPropertyValue("--foreground");
    ctx.font = "bold 200px sans-serif";
    ctx.fillText(String(score), 60, 350);
    ctx.fillStyle = css.getPropertyValue("--chaos-orange");
    ctx.font = "bold 30px sans-serif";
    ctx.fillText(mode === "find" ? "FINAL SCORE" : "CHAOS SCORE / 100", 70, 420);
    ctx.fillStyle = css.getPropertyValue("--foreground");
    ctx.font = "34px sans-serif";
    let line = "";
    let y = 525;
    for (const word of text.split(" ")) {
      const test = `${line}${word} `;
      if (ctx.measureText(test).width > 940 && line) {
        ctx.fillText(line, 70, y);
        y += 49;
        line = `${word} `;
      } else line = test;
    }
    ctx.fillText(line, 70, y);
    ctx.fillStyle = css.getPropertyValue("--chaos-lime");
    ctx.font = "bold 27px sans-serif";
    ctx.fillText("✦ CERTIFIED CHAOS · DEMO RESULT", 70, 940);
    ctx.fillStyle = css.getPropertyValue("--muted-foreground");
    ctx.font = "20px sans-serif";
    ctx.fillText("YOUR WORLD. YOUR OBJECTS. YOUR CHAOS.", 70, 1010);
    const a = document.createElement("a");
    a.download = "object-chaos-report.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
    setNotice("Your chaos card is downloaded.");
  }
  return (
    <>
      <Header game />
      <main className="results-page page-width">
        <div className="results-heading">
          <p className="eyebrow">
            <Asterisk size={16} /> AN OFFICIAL, DEEPLY UNOFFICIAL REPORT
          </p>
          <h1>{mode === "find" ? "CHAOS. CONQUERED." : "YOU HAVE BEEN ROASTED."}</h1>
          <p>
            {mode === "find"
              ? "Sharp eyes. Questionable surroundings. Excellent work."
              : "No desks were harmed. A few feelings, maybe."}
          </p>
        </div>
        <Report roast={text} score={score} mode={mode} />
        <div className="result-actions">
          <Button asChild size="hero">
            <Link to="/play" search={{ mode }}>
              <RotateCcw /> Play again
            </Link>
          </Button>
          <Button size="hero" variant="outline" onClick={share}>
            <Share2 /> Share result
          </Button>
          <Button size="hero" variant="ghost" onClick={download}>
            <Download /> Download card
          </Button>
        </div>
        <p className="share-notice" role="status">
          {notice || "Go on. Make the group chat a little weirder."}
        </p>
      </main>
      <Footer />
    </>
  );
}
