// src/pages/LandingPage.jsx
// Public marketing page shown at "/" to logged-out visitors.
//
// Deliberately a different design language from the app itself: the
// dashboard is a dense card grid, this is a single sparse column with one
// idea per section. It reuses the app's tokens (palette, Inter scale,
// ThemeProvider) rather than forking a second styling system.

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

// Swap this to change the pill above the headline. Kept as a constant so
// the alternatives are a one-line edit rather than a hunt through JSX.
const EYEBROW = "No bank linking required";

// Every example below is real output from backend/utils/autoCategory.js --
// verified against detectCategory(), not invented for the demo.
const DEMO_ENTRIES = [
  { text: "swiggy dinner with friends", category: "Food", amount: 840, color: "var(--chart-3)" },
  { text: "uber to the airport", category: "Travel", amount: 620, color: "var(--chart-1)" },
  { text: "apollo pharmacy", category: "Health", amount: 1150, color: "var(--chart-5)" },
  { text: "udemy react course", category: "Education", amount: 499, color: "var(--chart-7)" },
];

const STEPS = [
  {
    title: "Add your expenses",
    body: "Type what you spent in plain words — the category sorts itself out.",
  },
  {
    title: "See where it goes",
    body: "Charts break down the month, and short notes say what changed.",
  },
  {
    title: "Stay ahead",
    body: "Forecasts, budget limits and alerts before the month is over.",
  },
];

const FEATURES = [
  {
    title: "Smart categorization",
    body: "Reads your description and picks the category. No manual tagging.",
    icon: (
      <path d="m12 3 1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3ZM18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" />
    ),
  },
  {
    title: "Spending predictions",
    body: "Projects where this month lands from the pace you're already setting.",
    icon: <path d="M3 17l5.5-5.5 3.5 3.5L21 6M21 6h-5m5 0v5" />,
  },
  {
    title: "Anomaly detection",
    body: "Flags the transaction that doesn't look like the rest of your month.",
    icon: <path d="M12 4.5 21 20H3l9-15.5ZM12 10v4M12 17.2v.1" />,
  },
  {
    title: "Budget planner",
    body: "Turns your income into 50/30/20 limits, then tracks you against them.",
    icon: <path d="M12 3a9 9 0 1 0 9 9h-9V3Z M14.5 3.6A9 9 0 0 1 20.4 9.5h-5.9V3.6Z" />,
  },
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (event) => setReduced(event.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
};

// Types out a description, lands the detected category, banks the amount,
// then moves to the next entry. With reduced motion it simply steps
// between finished states instead of animating each character.
const CategorizeDemo = () => {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [settled, setSettled] = useState(false);
  const [total, setTotal] = useState(4210);
  const timer = useRef(null);

  const entry = DEMO_ENTRIES[index];
  // With motion reduced there is no typing phase -- show the settled result.
  const shownText = reduced ? entry.text : typed;
  const showCategory = reduced || settled;

  useEffect(() => {
    const clear = () => timer.current && clearTimeout(timer.current);

    if (reduced) {
      timer.current = setTimeout(() => {
        setTotal((t) => t + entry.amount);
        setIndex((i) => (i + 1) % DEMO_ENTRIES.length);
      }, 2600);
      return clear;
    }

    if (typed.length < entry.text.length) {
      timer.current = setTimeout(() => setTyped(entry.text.slice(0, typed.length + 1)), 42);
      return clear;
    }

    if (!settled) {
      timer.current = setTimeout(() => setSettled(true), 380);
      return clear;
    }

    timer.current = setTimeout(() => {
      setTotal((t) => t + entry.amount);
      setSettled(false);
      setTyped("");
      setIndex((i) => (i + 1) % DEMO_ENTRIES.length);
    }, 1750);
    return clear;
  }, [typed, settled, index, entry, reduced]);

  return (
    <div style={s.demoCard} aria-hidden="true">
      <div style={s.demoTop}>
        <span style={s.demoLabel}>Add expense</span>
        <span style={s.demoTag}>Sample</span>
      </div>

      <div style={s.demoField}>
        <span style={s.demoFieldLabel}>Description</span>
        <div style={s.demoInput}>
          <span>{shownText}</span>
          {!reduced && !settled && <span style={s.caret} />}
        </div>
      </div>

      <div style={s.demoField}>
        <span style={s.demoFieldLabel}>Category</span>
        <div style={s.demoChipRow}>
          {showCategory ? (
            <span
              style={{
                ...s.demoChip,
                color: entry.color,
                borderColor: `color-mix(in srgb, ${entry.color} 34%, transparent)`,
                background: `color-mix(in srgb, ${entry.color} 13%, transparent)`,
              }}
            >
              <span style={{ ...s.chipDot, background: entry.color }} />
              {entry.category}
            </span>
          ) : (
            <span style={s.demoChipGhost}>detecting…</span>
          )}
        </div>
      </div>

      <div style={s.demoFooter}>
        <span style={s.demoFooterLabel}>Tracked this month</span>
        <span style={s.demoFooterValue}>Rs {total.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
};

// Scroll-triggered reveal. Plain IntersectionObserver plus a CSS
// transition -- no animation library. Content starts visible and only
// becomes hidden once the observer is confirmed available, so a failed
// script or an unsupported browser can never leave the page blank.
const Reveal = ({ children, delay = 0 }) => {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const [shown, setShown] = useState(
    () => typeof IntersectionObserver === "undefined"
  );

  useEffect(() => {
    if (reduced || shown) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, shown]);

  const hidden = !reduced && !shown;
  return (
    <div
      ref={ref}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(10px)" : "none",
        transition: reduced ? "none" : "opacity 420ms ease-out, transform 420ms ease-out",
        transitionDelay: hidden ? "0ms" : `${delay}ms`,
        willChange: hidden ? "opacity, transform" : "auto",
      }}
    >
      {children}
    </div>
  );
};

const FeatureIcon = ({ children }) => (
  <span style={s.featureIcon}>
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  </span>
);

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={s.page}>
      {/* ---------- header ---------- */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <span style={s.brand}>ExpenseIQ</span>
          <nav className="landing-nav" style={s.headerNav}>
            <button
              type="button"
              onClick={toggleTheme}
              style={s.themeBtn}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                {theme === "dark" ? (
                  <path d="M20.2 15.5A8.2 8.2 0 0 1 8.5 3.8a8.7 8.7 0 1 0 11.7 11.7Z" />
                ) : (
                  <>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
                  </>
                )}
              </svg>
            </button>
            <Link to="/login" className="landing-signin" style={s.headerLink}>Sign in</Link>
            <Link to="/signup" className="landing-cta" style={s.headerCta}>Create free account</Link>
          </nav>
        </div>
      </header>

      {/* ---------- 1. hero ---------- */}
      <section className="landing-hero-floor" style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroCopy}>
            <span style={s.eyebrowPill}>{EYEBROW}</span>
            <h1 style={s.h1}>Type what you spent. We&rsquo;ll do the rest.</h1>
            <p style={s.lead}>
              ExpenseIQ reads &ldquo;uber to the airport&rdquo; and files it under Travel &mdash;
              then turns months of that into charts, forecasts and budgets.
            </p>
            <div style={s.heroActions}>
              <Link to="/signup" style={s.primaryCta}>Create free account</Link>
              <Link to="/login" style={s.secondaryLink}>Sign in</Link>
            </div>
            <p style={s.heroNote}>Free to use. Your data stays on your account.</p>
          </div>
          <div style={s.heroVisual}>
            <CategorizeDemo />
          </div>
        </div>
        <div style={s.scrollCue} aria-hidden="true">
          <span style={s.scrollCueText}>How it works</span>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v13M6 13l6 6 6-6" />
          </svg>
        </div>
      </section>

      {/* ---------- 2. how it works ---------- */}
      <Reveal>
      <section style={s.section}>
        <div style={s.sectionInner}>
          <p style={s.eyebrow}>How it works</p>
          <h2 style={s.h2}>Three steps, then it runs itself.</h2>
          <ol style={s.steps}>
            {STEPS.map((step, i) => (
              <li key={step.title} style={s.step}>
                <span style={s.stepNum}>{String(i + 1).padStart(2, "0")}</span>
                <h3 style={s.stepTitle}>{step.title}</h3>
                <p style={s.stepBody}>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      </Reveal>

      {/* ---------- 3. features ---------- */}
      <Reveal>
      <section style={s.section}>
        <div style={s.sectionInner}>
          <p style={s.eyebrow}>What it does</p>
          <h2 style={s.h2}>Built to notice things you&rsquo;d miss.</h2>
          <div style={s.featureGrid}>
            {FEATURES.map((f) => (
              <article key={f.title} style={s.featureCard}>
                <FeatureIcon>{f.icon}</FeatureIcon>
                <h3 style={s.featureTitle}>{f.title}</h3>
                <p style={s.featureBody}>{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      </Reveal>

      {/* ---------- 4. privacy ---------- */}
      <Reveal>
      <section style={s.section}>
        <div style={{ ...s.sectionInner, maxWidth: 640, textAlign: "center" }}>
          <p style={s.eyebrow}>Privacy</p>
          <h2 style={s.h2}>Your data stays yours.</h2>
          <p style={{ ...s.lead, margin: "0 auto" }}>
            No bank account linking and no third-party sync. Every expense is one you
            logged yourself, visible only to your account.
          </p>
        </div>
      </section>
      </Reveal>

      {/* ---------- 5. final CTA ---------- */}
      <Reveal>
      <section style={s.finalSection}>
        <div style={{ ...s.sectionInner, textAlign: "center" }}>
          <h2 style={s.finalH2}>Start tracking in about a minute.</h2>
          <div style={{ ...s.heroActions, justifyContent: "center" }}>
            <Link to="/signup" style={s.primaryCta}>Create free account</Link>
            <Link to="/login" style={s.secondaryLink}>Sign in</Link>
          </div>
        </div>
      </section>
      </Reveal>

      <footer style={s.footer}>
        <div style={s.footerInner}>
          <span style={s.footerBrand}>ExpenseIQ</span>
          <span style={s.footerNote}>
            Built by Harsh Singh &middot;{" "}
            <a
              href="https://github.com/harshhhhss/smart-expense-tracker"
              target="_blank"
              rel="noreferrer noopener"
              style={s.footerLink}
            >
              Source on GitHub
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
};

const s = {
  page: { background: "var(--bg)", color: "var(--text)", minHeight: "100vh" },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "color-mix(in srgb, var(--bg) 86%, transparent)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
  },
  headerInner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0.85rem 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--space-4)",
  },
  brand: { fontSize: "var(--text-h2)", fontWeight: 600, letterSpacing: "-0.02em" },
  headerNav: { display: "flex", alignItems: "center", gap: "var(--space-2)" },
  themeBtn: {
    display: "grid",
    placeItems: "center",
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--muted-strong)",
    cursor: "pointer",
  },
  eyebrowPill: {
    display: "inline-block",
    fontSize: "var(--text-sub)",
    fontWeight: 600,
    color: "var(--muted-strong)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-pill)",
    padding: "0.3rem 0.75rem",
    marginBottom: "var(--space-4)",
  },
  scrollCue: {
    maxWidth: 1100,
    margin: "clamp(40px, 6vw, 68px) auto 0",
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    color: "var(--muted)",
    fontSize: "var(--text-sub)",
  },
  scrollCueText: {
    fontWeight: 600,
    letterSpacing: "var(--ls-label)",
    textTransform: "uppercase",
    fontSize: "var(--text-label)",
  },
  footerLink: {
    color: "var(--muted-strong)",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  },
  headerLink: {
    color: "var(--muted-strong)",
    textDecoration: "none",
    fontSize: "var(--text-body)",
    padding: "0.5rem 0.6rem",
    borderRadius: 8,
  },
  headerCta: {
    color: "var(--on-accent)",
    background: "var(--accent)",
    textDecoration: "none",
    fontSize: "var(--text-body)",
    fontWeight: 600,
    padding: "0.55rem 0.95rem",
    borderRadius: 8,
    whiteSpace: "nowrap",
  },

  /* ---- hero ---- */
  hero: {
    padding: "clamp(44px, 7vw, 92px) 24px clamp(40px, 5vw, 64px)",
  },
  heroInner: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: "clamp(36px, 6vw, 72px)",
    alignItems: "center",
  },
  heroCopy: { minWidth: 0 },
  h1: {
    fontSize: "var(--text-display)",
    fontWeight: 700,
    letterSpacing: "-0.035em",
    lineHeight: 1.05,
    margin: 0,
    textWrap: "balance",
  },
  lead: {
    fontSize: "var(--text-lead)",
    fontWeight: 400,
    lineHeight: 1.6,
    color: "var(--muted)",
    margin: "1.15rem 0 0",
    maxWidth: "54ch",
  },
  heroActions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "var(--space-4)",
    marginTop: "var(--space-6)",
  },
  primaryCta: {
    display: "inline-flex",
    alignItems: "center",
    background: "var(--accent)",
    color: "var(--on-accent)",
    textDecoration: "none",
    fontSize: "var(--text-body)",
    fontWeight: 600,
    padding: "0.8rem 1.4rem",
    borderRadius: "var(--radius)",
    boxShadow: "none",
  },
  secondaryLink: {
    color: "var(--muted-strong)",
    textDecoration: "none",
    fontSize: "var(--text-body)",
    fontWeight: 600,
    padding: "0.8rem 0.4rem",
  },
  heroNote: { fontSize: "var(--text-sub)", color: "var(--muted)", margin: "1.1rem 0 0" },
  heroVisual: { minWidth: 0, display: "flex", justifyContent: "center" },

  /* ---- hero demo card ---- */
  demoCard: {
    width: "100%",
    maxWidth: 380,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "1.15rem 1.15rem 0",
    boxShadow: "var(--card-hover-shadow)",
  },
  demoTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "var(--space-4)",
  },
  demoLabel: { fontSize: "var(--text-h2)", fontWeight: 600 },
  demoTag: {
    fontSize: "var(--text-label)",
    fontWeight: 600,
    letterSpacing: "0.09em",
    textTransform: "uppercase",
    color: "var(--muted)",
    border: "1px solid var(--border)",
    borderRadius: 999,
    padding: "2px 8px",
  },
  demoField: { marginBottom: "var(--space-4)" },
  demoFieldLabel: {
    display: "block",
    fontSize: "var(--text-label)",
    fontWeight: 600,
    letterSpacing: "var(--ls-label)",
    textTransform: "uppercase",
    color: "var(--muted)",
    marginBottom: "var(--space-2)",
  },
  demoInput: {
    display: "flex",
    alignItems: "center",
    minHeight: 42,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "0 0.75rem",
    fontSize: "var(--text-body)",
    color: "var(--text)",
  },
  caret: {
    display: "inline-block",
    width: 2,
    height: 17,
    marginLeft: 2,
    background: "var(--accent)",
    animation: "pulse 1.1s ease-in-out infinite",
  },
  demoChipRow: { display: "flex", alignItems: "center", minHeight: 30 },
  demoChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-2)",
    fontSize: "var(--text-sub)",
    fontWeight: 600,
    border: "1px solid",
    borderRadius: 999,
    padding: "0.25rem 0.7rem",
  },
  chipDot: { width: 6, height: 6, borderRadius: "50%" },
  demoChipGhost: { fontSize: "var(--text-sub)", color: "var(--muted)" },
  demoFooter: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "var(--space-3)",
    borderTop: "1px solid var(--border)",
    margin: "0 -1.15rem",
    padding: "0.85rem 1.15rem",
  },
  demoFooterLabel: { fontSize: "var(--text-sub)", color: "var(--muted)" },
  demoFooterValue: {
    fontSize: "var(--text-stat-sm)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    fontVariantNumeric: "tabular-nums",
  },

  /* ---- generic section ---- */
  section: { padding: "clamp(64px, 9vw, 116px) 24px" },
  sectionInner: { maxWidth: 1100, margin: "0 auto" },
  eyebrow: {
    fontSize: "var(--text-label)",
    fontWeight: 600,
    letterSpacing: "var(--ls-label)",
    textTransform: "uppercase",
    color: "var(--accent)",
    margin: "0 0 0.85rem",
  },
  h2: {
    fontSize: "var(--text-h2-lg)",
    fontWeight: 600,
    letterSpacing: "-0.03em",
    lineHeight: 1.15,
    margin: "0 0 1.1rem",
    textWrap: "balance",
  },

  /* ---- steps: no card chrome, on purpose ---- */
  steps: {
    listStyle: "none",
    margin: "clamp(32px, 5vw, 56px) 0 0",
    padding: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
    gap: "clamp(28px, 4vw, 48px)",
  },
  step: { minWidth: 0 },
  stepNum: {
    display: "block",
    fontSize: "var(--text-sub)",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    color: "var(--accent)",
    marginBottom: "var(--space-3)",
  },
  stepTitle: { fontSize: "var(--text-stat-sm)", fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 0.45rem" },
  stepBody: { fontSize: "var(--text-h2)", lineHeight: 1.6, color: "var(--muted)", margin: 0, maxWidth: "38ch" },

  /* ---- features: the only containment on the page ---- */
  featureGrid: {
    marginTop: "clamp(32px, 5vw, 56px)",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 232px), 1fr))",
    gap: "var(--space-4)",
  },
  featureCard: {
    minWidth: 0,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "1.3rem 1.2rem",
  },
  featureIcon: {
    display: "grid",
    placeItems: "center",
    width: 36,
    height: 36,
    borderRadius: "var(--radius-sm)",
    color: "var(--muted-strong)",
    background: "var(--surface-2)",
    marginBottom: "var(--space-4)",
  },
  featureTitle: { fontSize: "var(--text-h2)", fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 0.4rem" },
  featureBody: { fontSize: "var(--text-body)", lineHeight: 1.6, color: "var(--muted)", margin: 0 },

  /* ---- final CTA ---- */
  finalSection: {
    padding: "clamp(64px, 9vw, 116px) 24px",
    borderTop: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
    background: "color-mix(in srgb, var(--accent) 4%, var(--bg))",
  },
  finalH2: {
    fontSize: "var(--text-h2-lg)",
    fontWeight: 600,
    letterSpacing: "-0.03em",
    lineHeight: 1.15,
    margin: "0 0 1.6rem",
    textWrap: "balance",
  },

  footer: { borderTop: "1px solid var(--border)", padding: "1.75rem 24px" },
  footerInner: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--space-2)",
  },
  footerBrand: { fontSize: "var(--text-body)", fontWeight: 600 },
  footerNote: { fontSize: "var(--text-sub)", color: "var(--muted)" },
};

export default LandingPage;
