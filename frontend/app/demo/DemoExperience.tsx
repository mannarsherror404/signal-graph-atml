"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { articles, categories, type Article } from "../articles";
import { scoreGraph } from "../gnn/graph-recommender.mjs";

type SignalMap = Record<string, number>;
type ReadMap = Record<string, number>;

const STORAGE_KEY = "signal-graph-demo-profile";

export function DemoExperience() {
  const [signals, setSignals] = useState<SignalMap>({});
  const [reads, setReads] = useState<ReadMap>({});
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as {
            signals?: SignalMap;
            reads?: ReadMap;
          };
          setSignals(parsed.signals ?? {});
          setReads(parsed.reads ?? {});
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      setReady(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (ready) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ signals, reads }),
      );
    }
  }, [signals, reads, ready]);

  useEffect(() => {
    if (!selectedArticle) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedArticle(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedArticle]);

  const graphScores = useMemo(() => scoreGraph(reads), [reads]);
  const rankedArticles = useMemo(() => {
    return [...articles]
      .filter(
        (article) =>
          activeCategory === "All" || article.category === activeCategory,
      )
      .sort((a, b) => {
        if (graphScores) {
          // Keep already-opened stories discoverable, but give unread stories
          // the front page; the GCN determines their order.
          const readDifference = Number(Boolean(reads[a.id])) - Number(Boolean(reads[b.id]));
          if (readDifference) return readDifference;
          return (graphScores[b.id] - graphScores[a.id]) || b.baseScore - a.baseScore;
        }
        return b.baseScore - a.baseScore;
      });
  }, [activeCategory, graphScores, reads]);

  const totalInteractions = Object.values(reads).reduce(
    (total, count) => total + count,
    0,
  );

  const strongestSignals = useMemo(() => {
    const active = Object.entries(signals)
      .filter(([key, value]) => categories.includes(key) && value > 0)
      .sort((a, b) => b[1] - a[1]);
    return active.slice(0, 4);
  }, [signals]);

  const openArticle = (article: Article) => {
    setReads((current) => ({
      ...current,
      [article.id]: (current[article.id] ?? 0) + 1,
    }));
    setSignals((current) => {
      const next = { ...current };
      next[article.category] = (next[article.category] ?? 0) + 1;
      article.tags.forEach((tag) => {
        next[tag] = (next[tag] ?? 0) + 0.35;
      });
      return next;
    });
    setSelectedArticle(article);
  };

  const resetEdition = () => {
    setSignals({});
    setReads({});
    setActiveCategory("All");
    setSelectedArticle(null);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const leadArticle = rankedArticles[0];
  const secondaryArticles = rankedArticles.slice(1, 3);
  const remainingArticles = rankedArticles.slice(3);
  const maxSignal = Math.max(1, ...strongestSignals.map(([, value]) => value));

  return (
    <main className="demo-shell">
      <div className="demo-product-bar">
        <Link href="/" className="demo-product-brand">
          SIGNAL×GRAPH
        </Link>
        <p>
          {totalInteractions === 0
            ? "Your edition is at its starting point"
            : `Personalised from ${totalInteractions} interaction${totalInteractions === 1 ? "" : "s"}`}
        </p>
        <button type="button" onClick={resetEdition}>
          Reset edition
        </button>
      </div>

      <header className="newspaper-header">
        <div className="newspaper-meta">
          <span>SATURDAY, JULY 25, 2026</span>
          <span>DEMO EDITION</span>
          <span>INDIA · DIGITAL</span>
        </div>
        <div className="newspaper-masthead">The Daily Signal</div>
        <div className="newspaper-subhead">
          A fixed collection, reordered by what you choose to read
        </div>
      </header>

      <nav className="category-nav" aria-label="News categories">
        {["All", ...categories].map((category) => (
          <button
            type="button"
            key={category}
            className={activeCategory === category ? "active" : ""}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </nav>

      <section className="demo-explainer">
        <div>
          <span className="explainer-number">
            {String(totalInteractions).padStart(2, "0")}
          </span>
          <p>
            Open a story to connect it to your private reader node. The graph
            model then reranks this edition in your browser.
          </p>
        </div>
        <div className="profile-panel">
          <div className="profile-heading">
            <span>YOUR READING SIGNAL</span>
            <strong>
              {strongestSignals[0]?.[0] ?? "Waiting for a story"}
            </strong>
          </div>
          {strongestSignals.length === 0 ? (
            <div className="empty-profile">
              Read a story to begin shaping your edition.
            </div>
          ) : (
            <div className="signal-bars">
              {strongestSignals.map(([category, value]) => (
                <div className="signal-row" key={category}>
                  <span>{category}</span>
                  <div><i style={{ width: `${(value / maxSignal) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {leadArticle ? (
        <section className="front-page">
          <button
            type="button"
            className="lead-story"
            onClick={() => openArticle(leadArticle)}
          >
            <div className="lead-image">
              <Image
                unoptimized
                src={leadArticle.image}
                alt=""
                fill
                priority
                sizes="(max-width: 900px) 94vw, 58vw"
              />
              <span className="lead-rank">YOUR #1 STORY</span>
            </div>
            <div className="lead-copy">
              <p>{leadArticle.category} · {leadArticle.location}</p>
              <h1>{leadArticle.title}</h1>
              <span>{leadArticle.dek}</span>
              <small>
                BY {leadArticle.author.toUpperCase()} · {leadArticle.readTime} MIN READ
              </small>
            </div>
          </button>

          <div className="secondary-column">
            <div className="column-label">NEXT IN YOUR EDITION</div>
            {secondaryArticles.map((article, index) => (
              <button
                type="button"
                className="secondary-story"
                key={article.id}
                onClick={() => openArticle(article)}
              >
                <div className="secondary-image">
                  <Image
                    unoptimized
                    src={article.image}
                    alt=""
                    fill
                    sizes="(max-width: 900px) 45vw, 20vw"
                  />
                  <span>0{index + 2}</span>
                </div>
                <p>{article.category}</p>
                <h2>{article.title}</h2>
                <small>{article.readTime} MIN READ</small>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div className="no-stories">No stories in this category yet.</div>
      )}

      {remainingArticles.length > 0 && (
        <section className="more-stories">
          <div className="section-rule">
            <span>MORE FROM TODAY’S EDITION</span>
            <p>{graphScores ? "Ranked by your graph connections" : "The starting edition"}</p>
          </div>
          <div className="article-grid">
            {remainingArticles.map((article, index) => (
              <button
                type="button"
                className="article-card"
                key={article.id}
                onClick={() => openArticle(article)}
              >
                <div className="article-card-image">
                  <Image
                    unoptimized
                    src={article.image}
                    alt=""
                    fill
                    sizes="(max-width: 700px) 90vw, 30vw"
                  />
                  <span>{String(index + 4).padStart(2, "0")}</span>
                  {reads[article.id] && <i>READ</i>}
                </div>
                <div className="article-card-meta">
                  <span>{article.category}</span>
                  <span>{article.readTime} MIN</span>
                </div>
                <h2>{article.title}</h2>
                <p>{article.dek}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="demo-note">
        <span>ABOUT THIS DEMO</span>
        <h2>A small graph model, running on your device.</h2>
        <p>
          A two-layer graph convolutional network was trained on synthetic
          reader–article preferences for these ten demo stories. Each story you
          open adds a new edge to your session node and recomputes the ranking
          locally. It demonstrates the mechanism, not real-world accuracy.
        </p>
        <Link href="/">Return to the product page →</Link>
      </section>

      {selectedArticle && (
        <div
          className="reader-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelectedArticle(null);
          }}
        >
          <article
            className="reader-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reader-title"
          >
            <button
              type="button"
              className="reader-close"
              onClick={() => setSelectedArticle(null)}
              aria-label="Close article"
            >
              Close ×
            </button>
            <div className="reader-hero">
              <Image
                unoptimized
                src={selectedArticle.image}
                alt=""
                fill
                sizes="(max-width: 800px) 100vw, 720px"
              />
            </div>
            <div className="reader-content">
              <p className="reader-category">
                {selectedArticle.category} · {selectedArticle.location}
              </p>
              <h1 id="reader-title">{selectedArticle.title}</h1>
              <p className="reader-dek">{selectedArticle.dek}</p>
              <div className="reader-byline">
                By {selectedArticle.author} · {selectedArticle.readTime} min read
              </div>
              {selectedArticle.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <div className="reader-impact">
                <span>Your edition updated</span>
                <strong>
                  +1 {selectedArticle.category} signal
                </strong>
              </div>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
