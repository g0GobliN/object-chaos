import { createFileRoute, Link } from "@tanstack/react-router";
import { Asterisk, ArrowUpRight } from "lucide-react";

import { Header, Footer } from "@/components/chaos/shell";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/chaos";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "About the chaos",
      "A little independent internet game with a vision model running on your own device.",
    ),
  component: About,
});

function About() {
  return (
    <>
      <Header />
      <main className="editorial-page page-width">
        <Asterisk className="editorial-icon" />
        <p className="eyebrow">A SMALL GAME. A QUESTIONABLE IDEA.</p>
        <h1>
          Ordinary objects.
          <br />
          <span className="text-primary">Extraordinary nonsense.</span>
        </h1>
        <p>
          OBJECT CHAOS is a playful browser-based party game for curious minds and questionable
          desks. Point it at your surroundings and it finds the objects, then turns them into a
          game.
        </p>

        <h2>Small. Independent. A little weird.</h2>
        <p>
          This is a free experimental product, not a commercial SaaS launch. No accounts, no
          subscriptions, no setup. Just you, your surroundings and a little chaos.
        </p>

        <h2>The AI is real, and it is yours.</h2>
        <p>
          Detection is handled by Cactus Mirage, a 22 MB vision model that runs inside this page
          with WebAssembly. There is no inference API, no GPU server and no per-photo bill. The
          model downloads once, then every photo is analysed on your own hardware.
        </p>
        <p>
          That trade has a real cost: small models are quick but occasionally wrong. Mirage will
          call a dog a cat, merge two cups into one, or miss something small. The game shows you the
          confidence it reported and never invents a detection to fill a gap.
        </p>

        <Button asChild size="hero">
          <Link to="/play" search={{ mode: "find" }}>
            Make some chaos <ArrowUpRight />
          </Link>
        </Button>
      </main>
      <Footer />
    </>
  );
}
