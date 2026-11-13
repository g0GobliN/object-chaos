import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { Header, Footer } from "@/components/chaos/shell";
import { pageHead } from "@/lib/chaos";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead(
      "Your photos stay yours",
      "OBJECT CHAOS runs Mirage on your device. Your photos are never uploaded.",
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

        <h2>Everything is processed on your device.</h2>
        <p>
          OBJECT CHAOS runs Cactus Mirage, a 22 MB vision model, inside your browser using
          WebAssembly. The photo is decoded locally, analysed locally and thrown away when you close
          the tab. No image, crop or pixel ever leaves your device.
        </p>

        <h2>The only download is the model.</h2>
        <p>
          The first time you play, your browser downloads the model weights from Hugging Face. That
          is a normal file download with no image data in it. After that it is cached, so later
          rounds run with no network at all. The model file is public and Apache-2.0 licensed.
        </p>

        <h2>No account. No tracking.</h2>
        <p>
          There are no accounts, payment systems or analytics integrations. Game progress is
          temporary and reloading the page resets it. The result card is generated in your browser.
        </p>

        <h2>Sharing is your choice.</h2>
        <p>
          Sharing sends the report text to an app you choose, or copies it to your clipboard.
          Downloading creates a result image on your device. Neither includes your photo.
        </p>

        <h2>What the model gives us.</h2>
        <p>
          Object names, rough positions, confidence scores and short attributes such as colour and
          material. If the model is unsure it still reports a low confidence, and the game treats
          that as a maybe. Nothing is invented to fill a gap.
        </p>
      </main>
      <Footer />
    </>
  );
}
