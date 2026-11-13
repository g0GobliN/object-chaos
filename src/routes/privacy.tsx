import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Header, Footer } from "@/components/chaos/shell";
import { pageHead } from "@/lib/chaos";
export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead(
      "Your photos stay yours",
      "How the OBJECT CHAOS frontend demo handles your photos and game data.",
    ),
  component: Privacy,
});
function Privacy() {
  return (
    <>
      <Header />
      <main className="editorial-page page-width">
        <ShieldCheck className="editorial-icon" />
        <p className="eyebrow">LESS DATA. MORE CHAOS.</p>
        <h1>
          Your photos.
          <br />
          <span className="text-primary">Still yours.</span>
        </h1>
        <h2>Photos stay on your device.</h2>
        <p>
          Choosing a photo creates a local preview in your browser. This demo does not upload your
          photo, analyze it with AI, or send it to a server.
        </p>
        <h2>No account. No tracking.</h2>
        <p>
          There are no accounts, payment systems or analytics integrations in this frontend demo.
          Game progress is temporary. Reloading the page resets it.
        </p>
        <h2>Sharing is your choice.</h2>
        <p>
          Sharing sends the report text to an app you choose, or copies it to your clipboard.
          Downloading creates a result image on your device. Neither includes your photo.
        </p>
        <h2>Demo data, not a real scan.</h2>
        <p>
          Object boxes, object counts, chaos scores and roasts are mock data. Uploaded photos use
          the same demonstration boxes.
        </p>
      </main>
      <Footer />
    </>
  );
}
