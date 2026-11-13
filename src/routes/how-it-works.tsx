import { createFileRoute } from "@tanstack/react-router";
import { Header, Footer } from "@/components/chaos/shell";
import { HowSection } from "@/components/chaos/landing-sections";
import { pageHead } from "@/lib/chaos";
export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageHead(
      "How it works",
      "Drop a photo, discover the objects, and play your way into a little chaos.",
      "/how-it-works",
    ),
  component: How,
});
function How() {
  return (
    <>
      <Header />
      <main className="standalone-section">
        <HowSection />
      </main>
      <Footer />
    </>
  );
}
