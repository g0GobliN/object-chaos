import { createFileRoute, Link } from "@tanstack/react-router";
import { Scale } from "lucide-react";

import { Header, Footer } from "@/components/chaos/shell";
import { pageHead } from "@/lib/chaos";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead(
      "The ground rules",
      "The short, plain-English terms for playing OBJECT CHAOS, plus credits and licensing.",
      "/terms",
    ),
  component: Terms,
});

function Terms() {
  return (
    <>
      <Header />
      <main className="editorial-page page-width">
        <Scale className="editorial-icon" />
        <p className="eyebrow">THE BORING BIT, KEPT SHORT</p>
        <h1>
          Ground rules.
          <br />
          <span className="text-primary">No lawyer required.</span>
        </h1>
        <p>
          OBJECT CHAOS is a free, slightly silly browser game built by one person. These terms are
          written to be read, not to be survived. By playing, you agree to the few things below.
        </p>

        <h2>Your photos stay yours.</h2>
        <p>
          You keep every right to the images you use. Nothing is uploaded, stored on a server or
          claimed by this project — the photo is analysed in your browser and forgotten when you
          close the tab. Only use photos you have the right to use: your own, or ones you have
          permission to play with.
        </p>

        <h2>What this game is.</h2>
        <p>
          A free experimental toy. It is provided “as is”, with no warranty of any kind, and no
          promise that it will always be available, accurate or sensible. Detection is done by a
          small on-device model that is sometimes confidently wrong; the results are entertainment,
          not advice, and definitely not a substitute for a human looking at the picture.
        </p>

        <h2>Please don’t break it.</h2>
        <p>
          Don’t use the site for anything illegal, don’t upload images you have no right to, and
          don’t try to attack, overload or scrape it. It runs on a generous free tier and one
          person’s goodwill.
        </p>

        <h2>Credits and licensing.</h2>
        <p>
          The vision model (Cactus Mirage) and the Cactus WASM runtime are Apache-2.0 licensed
          projects by Cactus Compute; the model is downloaded from Hugging Face and is not
          redistributed here. The site’s own source code is Apache-2.0. The OBJECT CHAOS name,
          wordmark and mascot belong to this project and its creator, Vishal Gurung. Any other
          product names or logos that appear are the property of their respective owners and are
          used only descriptively.
        </p>

        <h2>No accounts, no payments, no data business.</h2>
        <p>
          There is nothing to sign up for and nothing to buy. Read the{" "}
          <Link to="/privacy">privacy page</Link> for exactly what the browser does and does not do.
        </p>

        <h2>Changes and contact.</h2>
        <p>
          These notes may be updated as the game changes; continuing to play means you’re fine with
          the current version. Questions, takedown requests or bug reports go to{" "}
          <a href="mailto:hello@vishalgurung.com.np">hello@vishalgurung.com.np</a> and will be read
          by an actual human.
        </p>
      </main>
      <Footer />
    </>
  );
}
