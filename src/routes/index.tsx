import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Sparkles, ShieldCheck, Asterisk } from "lucide-react";
import { Header, Footer } from "@/components/chaos/shell";
import { DeskViewer } from "@/components/chaos/desk-viewer";
import { HowSection, GamesSection } from "@/components/chaos/landing-sections";
import { Button } from "@/components/ui/button";
import { SAMPLE_ANALYSIS, pageHead } from "@/lib/chaos";
export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Your world. Your objects. Your chaos.",
      "Upload a photo, find hidden objects, roast your surroundings and challenge your friends. A free indie photo party game.",
    ),
  component: Index,
});
function Index() {
  return (
    <>
      <Header />
      <main>
        <section className="hero page-width">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" /> THE INTERNET'S LITTLE CHAOS MACHINE
            </p>
            <h1>
              Your world.
              <br />
              Your objects.
              <br />
              <span className="chaos-word">
                Your chaos.
                <Sparkles />
              </span>
            </h1>
            <p className="hero-description">
              Upload a photo. Let AI inspect your surroundings.
              <br className="desktop-break" /> Discover what happens next.
            </p>
            <div className="hero-actions">
              <Button asChild size="hero">
                <Link to="/play" search={{ mode: "find" }}>
                  Start Creating Chaos <ArrowUpRight />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="hero">
                <Link to="/how-it-works">
                  See how it works <ArrowRight />
                </Link>
              </Button>
            </div>
            <p className="hero-assurance">
              <ShieldCheck size={13} /> No account needed <span>·</span> Free to play <span>·</span>{" "}
              Your photos stay yours
            </p>
          </div>
          <div className="hero-image">
            <div className="hero-image-note">
              ordinary desk. extraordinary problems.<span>↘</span>
            </div>
            <DeskViewer
              compact
              objects={SAMPLE_ANALYSIS.objects}
              inferenceMs={SAMPLE_ANALYSIS.inferenceMs}
              caption="EXAMPLE ANALYSIS · SAMPLE DESK"
            />
            <div className="floating-found">
              <ScanIcon /> {SAMPLE_ANALYSIS.objects.length} OBJECTS FOUND
            </div>
            <div className="floating-chaos">
              <Asterisk size={16} /> CHAOS LEVEL: HIGH
            </div>
            <div className="hero-image-foot">
              <span>REAL LIFE, REMIXED.</span>
              <span>01 — 03</span>
            </div>
          </div>
        </section>
        <div className="ticker">
          <div>
            <span>ORDINARY OBJECTS</span>
            <Asterisk />
            <span>EXTRAORDINARY NONSENSE</span>
            <Asterisk />
            <span>ZERO SOCIAL SKILLS REQUIRED</span>
            <Asterisk />
            <span>100% YOUR KIND OF WEIRD</span>
            <Asterisk />
          </div>
        </div>
        <HowSection />
        <GamesSection />
        <section className="final-cta page-width">
          <Asterisk />
          <p className="eyebrow">YOUR CAMERA ROLL HAS POTENTIAL.</p>
          <h2>
            A little mess.
            <br />
            <span className="text-primary">A lot of possibilities.</span>
          </h2>
          <Button asChild size="hero">
            <Link to="/play" search={{ mode: "find" }}>
              Let's make some chaos <ArrowUpRight />
            </Link>
          </Button>
          <p>No downloads. No sign-ups. Just a good time.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
function ScanIcon() {
  return <span className="badge-scan">⌖</span>;
}
