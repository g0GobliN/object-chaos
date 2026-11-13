import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Asterisk, Github, Globe, Instagram, Mail, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="OBJECT CHAOS">
      <img src="/brand/logo-header.webp" alt="OBJECT CHAOS" width={256} height={171} />
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
const ELSEWHERE = [
  {
    label: "Portfolio",
    href: "https://vishalgurung.com.np",
    icon: Globe,
    hint: "vishalgurung.com.np",
  },
  { label: "GitHub", href: "https://github.com/g0GobliN", icon: Github, hint: "g0GobliN" },
  {
    label: "Instagram",
    href: "https://instagram.com/goblin01_",
    icon: Instagram,
    hint: "goblin01_",
  },
  {
    label: "Email",
    href: "mailto:hello@vishalgurung.com.np",
    icon: Mail,
    hint: "hello@vishalgurung.com.np",
  },
];

export function Footer() {
  return (
    <footer className="site-footer page-width">
      <div className="footer-top">
        <div className="footer-brand">
          <Logo />
          <p>Made for curious minds and questionable desks.</p>
          <p className="footer-note">
            One human, one very small vision model, zero cookies. Built by Vishal Gurung after
            pointing a camera at a messy desk and asking, “what if this was a game?”
          </p>
        </div>
        <div className="footer-links">
          <nav aria-label="Footer navigation" className="footer-col">
            <h2>Play</h2>
            <Link to="/">Home</Link>
            <Link to="/games">Games</Link>
            <Link to="/how-it-works">How it works</Link>
            <Link to="/about">About</Link>
          </nav>
          <nav aria-label="Legal and small print" className="footer-col">
            <h2>Small print</h2>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Ground rules</Link>
            <a href="mailto:hello@vishalgurung.com.np">Contact</a>
          </nav>
          <div className="footer-col">
            <h2>Elsewhere</h2>
            {ELSEWHERE.map(({ label, href, icon: Icon, hint }) => (
              <a
                key={label}
                href={href}
                title={hint}
                {...(href.startsWith("http")
                  ? { target: "_blank", rel: "noreferrer noopener" }
                  : {})}
              >
                <Icon size={12} aria-hidden="true" />
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 OBJECT CHAOS · built by Vishal Gurung</span>
        <span>Local AI · Your photos stay on your device.</span>
        <span>
          A little mess. A lot of possibilities. <Asterisk size={14} />
        </span>
      </div>
    </footer>
  );
}
