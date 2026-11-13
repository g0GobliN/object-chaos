import { createFileRoute, Link } from "@tanstack/react-router";
import { Asterisk, ArrowUpRight } from "lucide-react";
import { Header, Footer } from "@/components/chaos/shell";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/chaos";
export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "About the chaos",
      "A little independent internet game for curious minds and questionable desks.",
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
          desks.
        </p>
        <p>
          Turn ordinary photos into ridiculous little adventures. Find hidden objects, roast your
          surroundings and challenge your friends.
        </p>
        <h2>Small. Independent. A little weird.</h2>
        <p>
          This is a free experimental product, not a commercial SaaS launch. No accounts, no
          subscriptions, no complicated setup. Just you, your surroundings and a little chaos.
        </p>
        <h2>A preview of the possibilities.</h2>
        <p>
          This version uses local mock objects and written roast templates. There is no AI
          inference, and photos never leave your device.
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
