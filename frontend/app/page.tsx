import Image from "next/image";
import Link from "next/link";
import { articles } from "./articles";

const previewArticles = articles.slice(0, 3);

export default function Home() {
  return (
    <main>
      <div className="topline">
        <span>ATML PRODUCT LAB</span>
        <span>PERSONAL NEWS, WITHOUT THE NOISE</span>
        <span>DEMO EDITION · 10 STORIES</span>
      </div>

      <header className="site-header">
        <Link className="brand" href="/" aria-label="Signal home">
          SIGNAL<span>×</span>GRAPH
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#principles">Principles</a>
          <Link className="nav-cta" href="/demo">
            Open the demo
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">AN ADAPTIVE NEWS EXPERIENCE</p>
          <h1>
            The front page that learns your
            <em> point of view.</em>
          </h1>
          <p className="hero-lede">
            Signal Graph turns reading behaviour into a calmer, more relevant
            daily edition—while keeping discovery, freshness and choice in the
            frame.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" href="/demo">
              Try the live demo <span aria-hidden="true">↗</span>
            </Link>
            <a className="text-link" href="#how-it-works">
              See how it learns <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="hero-proof">
            <div>
              <strong>10</strong>
              <span>fixed demo stories</span>
            </div>
            <div>
              <strong>0</strong>
              <span>accounts required</span>
            </div>
            <div>
              <strong>1</strong>
              <span>feed that adapts live</span>
            </div>
          </div>
        </div>

        <div className="hero-product" aria-label="Signal Graph product preview">
          <div className="preview-toolbar">
            <span className="preview-logo">THE DAILY SIGNAL</span>
            <span className="live-pill">LIVE DEMO</span>
          </div>
          <div className="preview-feature">
            <Image
              unoptimized
              src={previewArticles[0].image}
              alt=""
              fill
              sizes="(max-width: 900px) 90vw, 44vw"
              priority
            />
            <div className="preview-overlay">
              <span>{previewArticles[0].category}</span>
              <h2>{previewArticles[0].title}</h2>
              <p>Reading this story strengthens your Technology signal.</p>
            </div>
          </div>
          <div className="signal-meter">
            <div>
              <span>Your signal</span>
              <strong>Technology</strong>
            </div>
            <div className="meter-track">
              <span style={{ width: "72%" }} />
            </div>
            <p>Feed reordered from your last 3 interactions</p>
          </div>
          <div className="floating-note">
            <span>01</span>
            <p>Every meaningful read updates the next edition.</p>
          </div>
        </div>
      </section>

      <section className="marquee" aria-label="Product principles">
        <div>
          <span>CLICK</span><b>becomes</b><span>SIGNAL</span><b>becomes</b>
          <span>CONTEXT</span><b>becomes</b><span>A BETTER FRONT PAGE</span>
        </div>
      </section>

      <section className="story-section" id="how-it-works">
        <div className="section-kicker">
          <span>01 / HOW IT WORKS</span>
          <p>Personalisation that you can actually see.</p>
        </div>
        <div className="story-grid">
          <div className="story-heading">
            <h2>From every click to a clearer edition.</h2>
          </div>
          <div className="steps">
            <article>
              <span>01</span>
              <h3>Read naturally</h3>
              <p>
                Browse a familiar newspaper interface. No onboarding quiz, no
                profile form, no account wall.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Build a graph</h3>
              <p>
                Every opened story connects to your private reader node. A
                trained graph model uses those connections to calculate your
                edition on-device.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Watch the feed adapt</h3>
              <p>
                A trained two-layer graph model reranks unread stories while
                keeping the full edition available to explore.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="edition-section">
        <div className="edition-heading">
          <p className="eyebrow">TODAY’S FIXED COLLECTION</p>
          <h2>Real enough to explore. Controlled enough to explain.</h2>
          <p>
            Ten authored demo stories let every visitor start from the same
            baseline, making the recommendation shift easy to understand.
          </p>
        </div>
        <div className="edition-cards">
          {previewArticles.map((article, index) => (
            <article className="edition-card" key={article.id}>
              <div className="edition-image">
                <Image
                  unoptimized
                  src={article.image}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 90vw, 30vw"
                />
                <span>0{index + 1}</span>
              </div>
              <p>{article.category} · {article.readTime} MIN READ</p>
              <h3>{article.title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="principles-section" id="principles">
        <div className="principles-copy">
          <p className="eyebrow">DESIGNED WITH RESTRAINT</p>
          <h2>A recommender should broaden a reader, not box them in.</h2>
        </div>
        <div className="principles-list">
          <div><span>01</span><p>Fresh stories keep their place in the edition.</p></div>
          <div><span>02</span><p>Already-read stories move out of the way.</p></div>
          <div><span>03</span><p>Diverse categories prevent a narrow feedback loop.</p></div>
          <div><span>04</span><p>Your demo profile stays on this device.</p></div>
        </div>
      </section>

      <section className="final-cta">
        <p>YOUR EDITION IS WAITING</p>
        <h2>Read three stories.<br />See what changes.</h2>
        <Link className="button button-light" href="/demo">
          Enter the demo newsroom <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <footer>
        <Link className="brand brand-footer" href="/">
          SIGNAL<span>×</span>GRAPH
        </Link>
        <p>ATML · GRAPH-BASED NEWS RECOMMENDATION</p>
        <p>PROTOTYPE TO PRODUCT · 2026</p>
      </footer>
    </main>
  );
}
