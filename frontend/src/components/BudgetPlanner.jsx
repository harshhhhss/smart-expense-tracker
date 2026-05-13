// src/components/BudgetPlanner.jsx
// Feature 4: Budget Recommendation Engine + editable monthly budget

import { useState, useEffect } from "react";
import API from "../api/axios";

const CATEGORIES = ["Food","Travel","Shopping","Entertainment","Health","Utilities","Education","Personal Care","Miscellaneous"];

const STATUS_CONFIG = {
  overspending:   { color: "var(--danger)", bg: "rgba(224,82,82,0.08)" },
  slightly_over:  { color: "var(--warning)", bg: "rgba(216,154,43,0.08)" },
  on_track:       { color: "var(--success)", bg: "rgba(49,196,141,0.08)" },
  underspending:  { color: "var(--accent)", bg: "rgba(124,140,255,0.08)" },
};

const HealthScoreRing = ({ score }) => {
  const color = score >= 70 ? "var(--success)" : score >= 40 ? "var(--warning)" : "var(--danger)";
  return (
    <div style={{ position: "relative", width: 80, height: 80 }}>
      <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border)" strokeWidth="7" />
        <circle cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${2 * Math.PI * 32}`}
          strokeDashoffset={`${2 * Math.PI * 32 * (1 - score / 100)}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontWeight: 700, fontSize: "1.1rem", color }}>{score}</span>
        <span style={{ fontSize: "0.6rem", color: "var(--muted)" }}>/ 100</span>
      </div>
    </div>
  );
};

const BudgetPlanner = () => {
  const [recs,     setRecs]     = useState(null);
  const [budget,   setBudget]   = useState({});
  const [spend,    setSpend]    = useState({});
  const [income,   setIncome]   = useState("");
  const [editing,  setEditing]  = useState(false);
  const [limits,   setLimits]   = useState({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [tab,      setTab]      = useState("overview"); // overview | plan | recommend

  const loadData = async (inc) => {
    setLoading(true);
    try {
      const params = inc ? `?income=${inc}` : "";
      const [recRes, budRes] = await Promise.all([
        API.get(`/advanced/budget/recommend${params}`),
        API.get("/advanced/budget")
      ]);
      setRecs(recRes.data);
      setBudget(budRes.data.budget);
      setSpend(budRes.data.currentSpend);
      const savedLimits = {};
      if (budRes.data.budget.limits) {
        Object.entries(budRes.data.budget.limits).forEach(([k, v]) => { savedLimits[k] = v; });
      }
      setLimits(savedLimits);
      if (budRes.data.budget.income) setIncome(budRes.data.budget.income);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.post("/advanced/budget", { limits, income: Number(income) || 0 });
      setEditing(false);
      loadData(income);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const applyRecommended = () => {
    if (!recs?.recommendations) return;
    const newLimits = {};
    recs.recommendations.forEach(r => { newLimits[r.category] = r.recommendedBudget; });
    setLimits(newLimits);
    setEditing(true);
    setTab("plan");
  };

  if (loading) return (
    <div style={s.card}>
      <div style={s.shimmer} />
    </div>
  );

  return (
    <div style={s.card}>
      <div style={s.header}>
        <span style={s.title}>Budget Planner</span>
        <div style={s.tabs}>
          {["overview", "plan", "recommend"].map(t => (
            <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && recs && (
        <div>
          <div style={s.overviewRow}>
            <HealthScoreRing score={recs.healthScore || 0} />
            <div style={s.overviewStats}>
              <div style={s.statRow}>
                <span style={s.statLabel}>Monthly Spend</span>
                <span style={s.statVal}>₹{(recs.avgMonthlySpend || 0).toLocaleString()}</span>
              </div>
              <div style={s.statRow}>
                <span style={s.statLabel}>Est. Income</span>
                <span style={s.statVal}>₹{(recs.estimatedIncome || 0).toLocaleString()}</span>
              </div>
              <div style={s.statRow}>
                <span style={s.statLabel}>Savings Rate</span>
                <span style={{ ...s.statVal, color: (recs.savingsRate || 0) >= 20 ? "var(--success)" : "var(--danger)" }}>
                  {recs.savingsRate || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* 50/30/20 allocation */}
          {recs.allocation && (
            <div style={s.allocationGrid}>
              {[
                { label: "Needs (50%)",   data: recs.allocation.needs,   color: "var(--accent)" },
                { label: "Wants (30%)",   data: recs.allocation.wants,   color: "var(--warning)" },
                { label: "Savings (20%)", data: recs.allocation.savings, color: "var(--success)" },
              ].map(({ label, data, color }) => (
                <div key={label} style={{ ...s.allocCard, borderColor: color + "30" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginBottom: "0.3rem" }}>{label}</div>
                  <div style={{ fontFamily: "monospace", fontWeight: 700, color, fontSize: "1rem" }}>
                    ₹{(data.actual || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Budget: ₹{(data.budget || 0).toLocaleString()}</div>
                  {/* Progress bar */}
                  <div style={s.progBg}>
                    <div style={{ ...s.progFill, width: `${Math.min(100, data.budget > 0 ? (data.actual / data.budget) * 100 : 0)}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <button style={s.applyBtn} onClick={applyRecommended}>
            Apply Recommendations
          </button>
        </div>
      )}

      {/* ── PLAN TAB ── */}
      {tab === "plan" && (
        <div>
          <div style={s.incomeRow}>
            <label style={s.fieldLabel}>Monthly Income (₹)</label>
            <input
              style={s.incomeInput}
              type="number"
              placeholder="e.g. 50000"
              value={income}
              onChange={e => setIncome(e.target.value)}
            />
          </div>

          <div style={s.limitsGrid}>
            {CATEGORIES.map(cat => {
              const limit   = limits[cat] || 0;
              const current = spend[cat] || 0;
              const pct     = limit > 0 ? Math.min(100, (current / limit) * 100) : 0;
              const over    = current > limit && limit > 0;

              return (
                <div key={cat} style={s.limitRow}>
                  <div style={s.limitLeft}>
                    <span style={s.limitCat}>{cat}</span>
                    {limit > 0 && (
                      <div style={s.limitProg}>
                        <div style={{ ...s.limitFill, width: `${pct}%`, background: over ? "var(--danger)" : "var(--accent)" }} />
                      </div>
                    )}
                    {limit > 0 && (
                      <span style={{ fontSize: "0.7rem", color: over ? "var(--danger)" : "var(--muted)" }}>
                        ₹{current.toFixed(0)} / ₹{limit}
                      </span>
                    )}
                  </div>
                  <input
                    style={s.limitInput}
                    type="number"
                    placeholder="Budget"
                    value={limits[cat] || ""}
                    onChange={e => setLimits(prev => ({ ...prev, [cat]: Number(e.target.value) }))}
                    disabled={!editing}
                  />
                </div>
              );
            })}
          </div>

          <div style={s.planActions}>
            {editing ? (
              <>
                <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Budget"}
                </button>
                <button style={s.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
              </>
            ) : (
              <button style={s.editBtn} onClick={() => setEditing(true)}>Edit Budget</button>
            )}
          </div>
        </div>
      )}

      {/* ── RECOMMEND TAB ── */}
      {tab === "recommend" && recs?.recommendations && (
        <div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={s.fieldLabel}>Your Monthly Income (₹)</label>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem" }}>
              <input style={s.incomeInput} type="number" placeholder="e.g. 50000"
                value={income} onChange={e => setIncome(e.target.value)} />
              <button style={s.refreshBtn} onClick={() => loadData(income)}>Refresh</button>
            </div>
          </div>

          <div style={s.recList}>
            {recs.recommendations.map((r, i) => {
              const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.on_track;
              return (
                <div key={i} style={{ ...s.recItem, background: cfg.bg }}>
                  <div style={s.recLeft}>
                    <span style={{ ...s.recIcon, background: cfg.color }} />
                    <div>
                      <span style={{ ...s.recCat, color: cfg.color }}>{r.category}</span>
                      <p style={s.recAdvice}>{r.advice}</p>
                    </div>
                  </div>
                  <div style={s.recNumbers}>
                    <div style={s.recCurrent}>₹{r.currentAvg}</div>
                    <div style={s.recArrow}>→</div>
                    <div style={{ ...s.recTarget, color: cfg.color }}>₹{r.recommendedBudget}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <button style={s.applyBtn} onClick={applyRecommended}>
            Apply These Limits
          </button>
        </div>
      )}
    </div>
  );
};

const s = {
  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.15rem 1.25rem" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem", flexWrap: "wrap", gap: "0.5rem" },
  title: { fontSize: "0.92rem", fontWeight: 600, color: "var(--text)" },
  tabs: { display: "flex", gap: "0.25rem", background: "var(--surface-2)", borderRadius: "8px", padding: "3px" },
  tab: { padding: "0.3rem 0.75rem", borderRadius: "6px", border: "none", background: "transparent", color: "var(--muted)", fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit" },
  tabActive: { background: "var(--surface)", color: "var(--text)" },
  overviewRow: { display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1.2rem" },
  overviewStats: { flex: 1 },
  statRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" },
  statLabel: { fontSize: "0.78rem", color: "var(--muted)" },
  statVal: { fontFamily: "monospace", fontWeight: 600, fontSize: "0.88rem", color: "var(--text)" },
  allocationGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1rem" },
  allocCard: { background: "var(--surface-2)", borderRadius: "8px", padding: "0.75rem", border: "1px solid var(--border)" },
  progBg: { height: 3, background: "var(--surface)", borderRadius: 2, marginTop: "0.4rem" },
  progFill: { height: "100%", borderRadius: 2, transition: "width 0.5s ease" },
  applyBtn: { width: "100%", padding: "0.7rem", background: "rgba(124,140,255,0.1)", border: "1px solid rgba(124,140,255,0.24)", color: "var(--accent)", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontFamily: "inherit", fontWeight: 600 },
  incomeRow: { marginBottom: "1rem" },
  fieldLabel: { fontSize: "0.78rem", color: "var(--muted)", fontWeight: 500 },
  incomeInput: { padding: "0.6rem 0.9rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontFamily: "inherit", fontSize: "0.88rem", outline: "none", width: "100%" },
  refreshBtn: { padding: "0.6rem 1rem", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", whiteSpace: "nowrap" },
  limitsGrid: { display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem" },
  limitRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" },
  limitLeft: { flex: 1 },
  limitCat: { fontSize: "0.82rem", color: "var(--text)", fontWeight: 500 },
  limitProg: { height: 3, background: "var(--surface)", borderRadius: 2, margin: "3px 0" },
  limitFill: { height: "100%", borderRadius: 2 },
  limitInput: { width: 90, padding: "0.4rem 0.6rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "7px", color: "var(--text)", fontFamily: "monospace", fontSize: "0.82rem", outline: "none" },
  planActions: { display: "flex", gap: "0.5rem" },
  saveBtn: { flex: 1, padding: "0.7rem", background: "var(--accent)", border: "none", color: "white", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 },
  cancelBtn: { padding: "0.7rem 1rem", background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "10px", cursor: "pointer", fontFamily: "inherit" },
  editBtn: { flex: 1, padding: "0.7rem", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "10px", cursor: "pointer", fontFamily: "inherit" },
  recList: { display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" },
  recItem: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.7rem 0.9rem", borderRadius: "10px" },
  recLeft: { display: "flex", alignItems: "flex-start", gap: "0.5rem", flex: 1 },
  recIcon: { width: 7, height: 7, borderRadius: "50%", marginTop: "0.35rem", flexShrink: 0 },
  recCat: { fontSize: "0.82rem", fontWeight: 700, display: "block", marginBottom: "0.15rem" },
  recAdvice: { fontSize: "0.75rem", color: "var(--muted)", margin: 0, lineHeight: 1.4 },
  recNumbers: { display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 },
  recCurrent: { fontFamily: "monospace", fontSize: "0.82rem", color: "var(--muted)" },
  recArrow: { color: "var(--muted)", fontSize: "0.8rem" },
  recTarget: { fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 700 },
  shimmer: { height: 280, borderRadius: 10, background: "var(--surface-2)" }
};

export default BudgetPlanner;
