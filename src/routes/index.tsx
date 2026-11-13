import { createFileRoute, Link } from "@tanstack/react-router";

import { DeskViewer } from "@/components/chaos/desk-viewer";
import { Footer, Header } from "@/components/chaos/shell";
import { SAMPLE_ANALYSIS, SAMPLE_PHOTO, pageHead } from "@/lib/chaos";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Your world. Your objects. Your chaos.",
      "Upload a photo, find hidden objects, roast your surroundings and challenge your friends. A free indie photo party game.",
      "/",
    ),
  component: Index,
});

function Index() {
  return (
    <>
      <Header />
      <main className="w-wrap">
        <div className="hero">
          <div className="hero-copy">
            <h1>
              Your desk
              <br />
              is the game.
            </h1>
            <p className="w-lead">
              Upload a photo. A small model reads it on your device, names what is lying around, and
              the round starts from that list. Nothing is uploaded, nothing to sign in to.
            </p>
            <div className="w-cta">
              <Link to="/play" search={{ mode: "find" }} className="w-play w-play-lg">
                start playing
              </Link>
            </div>
            <p className="w-small">
              the sample desk is already loaded · free · works offline after the first scan
            </p>
          </div>

          <div className="hero-photo">
            <div className="w-photo">
              <DeskViewer
                image={SAMPLE_PHOTO}
                objects={SAMPLE_ANALYSIS.objects}
                inferenceMs={SAMPLE_ANALYSIS.inferenceMs}
                caption="SAMPLE DESK"
              />
            </div>
            <p className="w-script">
              {SAMPLE_ANALYSIS.objects.length} real detections, found in{" "}
              {Math.round(SAMPLE_ANALYSIS.inferenceMs)} ms on a messy desk
            </p>
          </div>
        </div>

        <div className="hero-strip">
          <Link to="/play" search={{ mode: "find" }} className="hero-tile">
            <span className="hero-tile-num">Play</span>
            <span className="hero-tile-title">Find the object</span>
            <p>Three challenges, twenty seconds each. Tap the right thing fast: 600 max.</p>
          </Link>
          <Link to="/play" search={{ mode: "roast" }} className="hero-tile">
            <span className="hero-tile-num">Play</span>
            <span className="hero-tile-title">Object roast</span>
            <p>One verdict per photo, scored out of 100, built only from what the model found.</p>
          </Link>
          <Link to="/how-it-works" className="hero-tile">
            <span className="hero-tile-num">Read</span>
            <span className="hero-tile-title">How it works</span>
            <p>Where the photo goes (nowhere), what the model does, and what it gets wrong.</p>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
