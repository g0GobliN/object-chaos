import { createFileRoute } from "@tanstack/react-router";

import { Footer, Header } from "@/components/chaos/shell";
import { pageHead } from "@/lib/chaos";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageHead(
      "How it works",
      "Your photo never leaves the browser: a 21.6 MB vision model runs locally, finds the objects, and hands them to the games.",
      "/how-it-works",
    ),
  component: How,
});

function How() {
  return (
    <>
      <Header />
      <main className="w-wrap w-doc">
        <h1>How this actually works</h1>
        <p className="w-lead">
          You pick a photo. A small vision model reads it on your own machine, tells you what it
          thinks is in there and how confident it is, and the games are built from that list. The
          photo itself is never uploaded anywhere.
        </p>

        <h2>The short version</h2>
        <ol>
          <li>
            <strong>You pick a photo.</strong> It is resized to 768 px in a canvas on your device.
            Nothing is sent to a server.
          </li>
          <li>
            <strong>The model reads it.</strong> 21.6 MB of Cactus Mirage weights, downloaded once
            and cached. It looks twice — a quick pass, then a closer one — and merges what both
            found, so small objects are not missed. It returns names, boxes and confidence scores.
          </li>
          <li>
            <strong>The game uses that list.</strong> Anything the model is less than 45% sure of is
            treated as a guess and hidden — that is where “teapot” on a wall clock comes from. The
            rest become challenges or a roast, and the result card is drawn locally.
          </li>
        </ol>

        <h2>Where everything actually goes</h2>
        <ul className="w-list">
          <li>
            <strong>The photo</strong> — decoded into pixels on your device, then forgotten when the
            tab closes. There is no upload endpoint for it to go to.
          </li>
          <li>
            <strong>The model</strong> — downloaded once from this site and cached by the browser.
            After that, the games run with no network at all.
          </li>
          <li>
            <strong>The results</strong> — object names, boxes and confidences, held in the page.
            Your own numbers stay in the tab, plus the report you asked for.
          </li>
          <li>
            <strong>Your account</strong> — you do not have one. Nothing to sign into, nothing to
            sign out of.
          </li>
        </ul>

        <h2>What it is not</h2>
        <p>
          Not a chat model, not a scanner you can trust with a parking sign, and not trained on your
          life. It mislabels things. The game treats a low-confidence guess as a maybe, and says so.
        </p>
      </main>
      <Footer />
    </>
  );
}
