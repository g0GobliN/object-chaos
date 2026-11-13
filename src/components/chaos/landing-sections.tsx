import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Upload,
  ScanLine,
  Sparkles,
  Crosshair,
  Flame,
  Eye,
  Clock,
  Trophy,
  ImagePlus,
  Asterisk,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import desk from "@/assets/chaos-desk.jpg";
export function HowSection() {
  return (
    <section className="section page-width" id="how-it-works">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <span className="text-chaos-orange">✦</span> LESS SETUP. MORE NONSENSE.
          </p>
          <h2>Three steps. Maximum chaos.</h2>
        </div>
        <p>
          Your ordinary surroundings are more
          <br className="desktop-break" /> interesting than you think.
        </p>
      </div>
      <div className="steps-grid">
        <article className="step-card">
          <div className="step-top">
            <span>01 / UPLOAD</span>
            <Upload size={18} />
          </div>
          <div className="step-visual upload-visual">
            <ImagePlus size={30} />
            <span>Drop a little reality here</span>
            <span className="tiny">JPG, PNG, WEBP</span>
            <div className="mini-photo">
              <img src={desk} alt="Desk photo preview" loading="lazy" />
              <span>
                desk_001.jpg <span className="text-chaos-lime">✓</span>
              </span>
            </div>
          </div>
          <h3>Drop a photo</h3>
          <p>Pick any photo from your camera roll or snap something around you.</p>
        </article>
        <article className="step-card">
          <div className="step-top">
            <span>02 / DISCOVER</span>
            <ScanLine size={18} />
          </div>
          <div className="step-visual scan-visual">
            <img src={desk} alt="Desk being scanned" loading="lazy" />
            <div className="mini-box">
              <span>COFFEE MUG</span>
            </div>
            <span className="scan-pill">
              <span className="status-dot" /> A little mess. A lot to find.
            </span>
          </div>
          <h3>Let the chaos scan</h3>
          <p>
            A 22 MB vision model finds the objects on your device and turns them into challenges.
          </p>
        </article>
        <article className="step-card">
          <div className="step-top">
            <span>03 / UNLEASH</span>
            <Sparkles size={18} />
          </div>
          <div className="step-visual result-visual">
            <span className="tiny">OFFICIAL CHAOS REPORT</span>
            <div>
              <span>94</span>
              <span>
                /100 <Asterisk />
              </span>
            </div>
            <span className="mini-achievement">✦ CERTIFIED CHAOS</span>
          </div>
          <h3>Play and share</h3>
          <p>Find things, get roasted and share your ridiculous results.</p>
        </article>
      </div>
    </section>
  );
}
export function GamesSection() {
  return (
    <section className="section page-width games-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <span className="text-chaos-lime">✦</span> PICK YOUR POISON
          </p>
          <h2>Choose your chaos.</h2>
        </div>
        <p>Different games. Same questionable surroundings.</p>
      </div>
      <div className="games-grid">
        <article className="game-card find-card">
          <div className="game-card-heading">
            <Crosshair />
            <span>01 / A LITTLE HIDE & SEEK</span>
            <span className="game-tag">QUICK PLAY</span>
          </div>
          <h3>Find the object</h3>
          <p>Can you find it before the timer runs out?</p>
          <div className="find-preview">
            <img src={desk} alt="Find the object game preview" loading="lazy" />
            <span className="challenge-pill">
              Find something <strong>RED.</strong>
            </span>
            <span className="timer-pill">
              <Clock size={14} /> 00:18
            </span>
            <div className="notebook-box">
              <span>THERE YOU ARE!</span>
            </div>
            <span className="score-pill">
              <Trophy size={13} /> +100
            </span>
          </div>
          <Button asChild size="hero">
            <Link to="/play" search={{ mode: "find" }}>
              Play this game <ArrowRight />
            </Link>
          </Button>
        </article>
        <article className="game-card roast-card">
          <div className="game-card-heading">
            <Flame />
            <span>02 / EMOTIONAL DAMAGE</span>
            <span className="game-tag">NO MERCY</span>
          </div>
          <h3>Object roast</h3>
          <p>Your surroundings have a personality. Unfortunately.</p>
          <div className="roast-preview">
            <span className="tiny">THE VERDICT IS IN.</span>
            <Flame className="roast-flame" />
            <blockquote>
              “Your cables are
              <br /> forming a government.”
            </blockquote>
            <span className="roast-signature">— your desk, probably</span>
            <div className="roast-preview-bottom">
              <span>CHAOS LEVEL</span>
              <span className="text-chaos-orange">UNREASONABLE ↗</span>
            </div>
          </div>
          <Button asChild variant="orange" size="hero">
            <Link to="/play" search={{ mode: "roast" }}>
              Get roasted <ArrowRight />
            </Link>
          </Button>
        </article>
        <article className="coming-card">
          <div className="coming-icon">
            <Eye />
          </div>
          <div>
            <span className="tiny text-chaos-lime">NEXT ON THE CHAOS MENU</span>
            <h3>What's missing?</h3>
            <p>Look closely. Remember everything. Find what disappeared.</p>
          </div>
          <span className="coming-badge">
            COMING SOON <Clock size={12} />
          </span>
        </article>
      </div>
    </section>
  );
}
