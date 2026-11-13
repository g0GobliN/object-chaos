import { createFileRoute } from "@tanstack/react-router";
import { Header, Footer } from "@/components/chaos/shell";
import { GamesSection } from "@/components/chaos/landing-sections";
import { pageHead } from "@/lib/chaos";
export const Route = createFileRoute("/games")({
  head: () =>
    pageHead(
      "Choose your chaos",
      "Play Find the Object or Object Roast. Different games, same questionable surroundings.",
    ),
  component: Games,
});
function Games() {
  return (
    <>
      <Header />
      <main className="standalone-section">
        <GamesSection />
      </main>
      <Footer />
    </>
  );
}
