import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Asterisk, Download, RotateCcw, Share2 } from "lucide-react";

import { Header, Footer } from "@/components/chaos/shell";
import { Report } from "@/components/chaos/report";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/chaos";
import { loadResult, type StoredResult } from "@/lib/result-store";

export const Route = createFileRoute("/result")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { mode?: "find" | "roast"; score?: number } => {
    const mode: "find" | "roast" = search["mode"] === "find" ? "find" : "roast";
    const raw = Number(search["score"]);
    return {
      mode,
      ...(Number.isFinite(raw) ? { score: Math.max(0, Math.min(300, raw)) } : {}),
    };
  },
  head: () =>
    pageHead("Your chaos report", "Your OBJECT CHAOS game result, generated on your device."),
  component: Result,
});

function loadLogo() {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = "/brand/logo.webp";
  });
}

function Result() {
  const { mode = "roast", score } = Route.useSearch();
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setStored(loadResult());
  }, []);

  const finalScore = score ?? stored?.score ?? 0;
  const result = useMemo(
    () =>
      stored ?? {
        mode,
        score: finalScore,
        roast: "No report yet. Play a round and your surroundings will have opinions.",
        roastLines: [],
        objectCount: 0,
        objectNames: [],
        textLines: [],
        inferenceMs: 0,
        image: null,
      },
    [stored, mode, finalScore],
  );

  async function share() {
    const summary = `OBJECT CHAOS REPORT · ${finalScore}${
      mode === "find" ? " points" : "/100"
    } · CERTIFIED CHAOS\n${result.roast}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My OBJECT CHAOS report", text: summary });
        setNotice("Chaos shared.");
      } else {
        await navigator.clipboard.writeText(summary);
        setNotice("Result copied. Go spread the chaos.");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setNotice("Sharing is unavailable here. Try downloading your card.");
      }
    }
  }

  async function download() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const context = canvas.getContext("2d");
    if (!context) {
      setNotice("Image download is not supported by this browser.");
      return;
    }

    const css = getComputedStyle(document.documentElement);
    const color = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;

    context.fillStyle = color("--background", "#141416");
    context.fillRect(0, 0, 1080, 1080);
    const logo = await loadLogo();
    if (logo) {
      const logoWidth = 200;
      const logoHeight = Math.round((logo.naturalHeight / logo.naturalWidth) * logoWidth);
      context.drawImage(logo, 60, 38, logoWidth, logoHeight);
    }

    context.fillStyle = color("--foreground", "#f5f2ff");
    context.font = "bold 200px sans-serif";
    context.fillText(String(finalScore), 60, 350);

    context.fillStyle = color("--chaos-orange", "#ff9b52");
    context.font = "bold 30px sans-serif";
    context.fillText(mode === "find" ? "FINAL SCORE" : "CHAOS SCORE / 100", 70, 420);

    context.fillStyle = color("--muted-foreground", "#b3aec4");
    context.font = "22px sans-serif";
    context.fillText(`${result.objectCount} objects detected on-device`, 70, 470);

    context.fillStyle = color("--foreground", "#f5f2ff");
    context.font = "34px sans-serif";
    let line = "";
    let y = 545;
    for (const word of result.roast.split(" ")) {
      const candidate = `${line}${word} `;
      if (context.measureText(candidate).width > 940 && line) {
        context.fillText(line, 70, y);
        y += 49;
        line = `${word} `;
      } else {
        line = candidate;
      }
    }
    context.fillText(line, 70, y);

    context.fillStyle = color("--chaos-lime", "#c6f24f");
    context.font = "bold 27px sans-serif";
    context.fillText("✦ CERTIFIED CHAOS · LOCAL INFERENCE", 70, 940);

    context.fillStyle = color("--muted-foreground", "#b3aec4");
    context.font = "20px sans-serif";
    context.fillText("YOUR WORLD. YOUR OBJECTS. YOUR CHAOS.", 70, 1010);

    const link = document.createElement("a");
    link.download = "object-chaos-report.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
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

        <Report
          roast={result.roast}
          score={finalScore}
          mode={mode}
          objectCount={result.objectCount}
          objectNames={result.objectNames}
          textLines={result.textLines}
        />

        <div className="result-actions">
          <Button asChild size="hero">
            <Link to="/play" search={{ mode }}>
              <RotateCcw /> Play again
            </Link>
          </Button>
          <Button size="hero" variant="outline" onClick={share}>
            <Share2 /> Share result
          </Button>
          <Button size="hero" variant="ghost" onClick={() => void download()}>
            <Download /> Download card
          </Button>
        </div>
        <p className="share-notice" role="status">
          {notice ||
            (stored
              ? `Mirage found ${result.objectCount} objects in ${Math.max(
                  1,
                  Math.round(result.inferenceMs),
                )} ms on this device.`
              : "No round data in this tab yet. Play one to fill this card.")}
        </p>
      </main>
      <Footer />
    </>
  );
}
