import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="w-logo" aria-label="OBJECT CHAOS">
      Object Chaos
    </Link>
  );
}

const NAV = [
  { to: "/play", label: "play", search: { mode: "find" as const } },
  { to: "/games", label: "games" },
  { to: "/how-it-works", label: "how it works" },
  { to: "/about", label: "about" },
] as const;

export function Header(_props: { game?: boolean }) {
  return (
    <header className="w-top">
      <div className="w-wrap">
        <Logo />
        <nav className="w-nav" aria-label="Main navigation">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              {...("search" in item ? { search: item.search } : {})}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="w-footer">
      <div className="w-wrap">
        <div>
          <p>© 2026 Object Chaos. Built by Vishal Gurung.</p>
          <p>Your photos stay on your device. No accounts, no uploads.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link to="/privacy">privacy</Link>
          <Link to="/terms">ground rules</Link>
          <a href="mailto:hello@vishalgurung.com.np">email</a>
          <a href="https://vishalgurung.com.np" target="_blank" rel="noreferrer noopener">
            portfolio
          </a>
        </nav>
      </div>
    </footer>
  );
}
