import { createFileRoute, Link } from "@tanstack/react-router";

import { Footer, Header } from "@/components/chaos/shell";
import { pageHead } from "@/lib/chaos";

export const Route = createFileRoute("/games")({
  head: () =>
    pageHead(
      "Choose your chaos",
      "Play Find the Object or Object Roast. Different games, same questionable surroundings.",
      "/games",
    ),
  component: Games,
});

function Games() {
  return (
    <>
      <Header />
      <main className="w-wrap">
        <h1>Two games, one desk</h1>
        <p className="w-lead">
          Both run on the same on-device scan of the same photo. One is a race against a clock, the
          other is a verdict you did not ask for.
        </p>

        <hr className="w-rule" />
        <h2>Find the object</h2>
        <p>
          Three challenges, twenty seconds each. The model&apos;s confidence does not help you here:
          it names a thing, you tap it. +100 for the right tap, nothing for a wrong one, 300 is a
          clean sweep.
        </p>
        <p>
          If the model is being weird, <em>Show me what counts</em> reveals the answer for no
          points.
        </p>
        <p>
          <Link to="/play" search={{ mode: "find" }}>
            play find the object →
          </Link>
        </p>

        <hr className="w-rule" />
        <h2>Object roast</h2>
        <p>
          One verdict per photo, scored out of 100. Written from fixed templates rather than a chat
          model, so it can only comment on objects that were actually found — the furniture, never
          you.
        </p>
        <p>
          <Link to="/play" search={{ mode: "roast" }}>
            get roasted →
          </Link>
        </p>

        <hr className="w-rule" />
        <h2>What you need</h2>
        <ul className="w-list">
          <li>
            <strong>One photo</strong> — a phone snap, a screenshot, a scan of your shelf. At least
            two recognisable objects, or there is nothing to play with.
          </li>
          <li>
            <strong>A modern browser</strong> — Chrome, Edge, Firefox or Safari. The first visit
            downloads a 21.6 MB model; after that it comes from the cache.
          </li>
          <li>
            <strong>Someone to beat</strong> — optional. The share card exists for a reason.
          </li>
        </ul>

        <hr className="w-rule" />
        <h2>Things it got wrong</h2>
        <ul className="w-list">
          <li>
            called it “kitchen” — <strong>it was garage</strong>. the garage has a kettle, fair.
          </li>
          <li>
            called it “grass” — <strong>it was a wall of tools</strong>. still not over this one.
          </li>
          <li>
            called it “cat” — <strong>it was dog</strong>. he has not forgiven it.
          </li>
        </ul>
        <p className="w-small">
          From our own test photos. It is a small model doing a hard job, and pretending otherwise
          would make the whole thing less fun.
        </p>
      </main>
      <Footer />
    </>
  );
}
