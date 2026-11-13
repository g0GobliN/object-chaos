import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Asterisk, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
export function Logo() {
  return (
    <Link to="/" className="logo">
      <Asterisk aria-hidden="true" />
      <span>
        OBJECT<span className="text-primary">CHAOS</span>
      </span>
    </Link>
  );
}
export function Header({ game = false }: { game?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="page-width header-inner">
        <Logo />
        <nav className={open ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
          <Link to="/how-it-works" onClick={() => setOpen(false)}>
            How it works
          </Link>
          <Link to="/games" onClick={() => setOpen(false)}>
            Games
          </Link>
          <Link to="/about" onClick={() => setOpen(false)}>
            About
          </Link>
        </nav>
        <div className="header-actions">
          {game ? (
            <Button asChild variant="ghost">
              <Link to="/">
                Back to home <ArrowUpRight />
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/play" search={{ mode: "find" }}>
                Play for free <ArrowUpRight />
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer page-width">
      <div className="footer-top">
        <div>
          <Logo />
          <p>Made for curious minds and questionable desks.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/games">Games</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/about">About</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© 2026 OBJECT CHAOS</span>
        <span>Local AI · Your photos stay on your device.</span>
        <span>
          A little mess. A lot of possibilities. <Asterisk size={14} />
        </span>
      </div>
    </footer>
  );
}
