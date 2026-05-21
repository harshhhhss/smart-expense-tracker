// src/pages/Analytics.jsx
import { useState, useEffect } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import AnomalyPanel from "../components/AnomalyPanel";
import PredictionPanel from "../components/PredictionPanel";
import BudgetPlanner from "../components/BudgetPlanner";
import InsightCard from "../components/InsightCard";

const Analytics = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await API.get("/advanced/dashboard");
        setInsights(data.dashboard?.insights || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Navbar />
      <div className="app-page analytics-page" style={styles.page}>
        <div className="dashboard-header" style={styles.header}>
          <div>
            <h1 style={styles.title}>Analytics</h1>
            <p style={styles.subtitle}>Forecasts, risk signals, and budget controls</p>
          </div>
          <div style={styles.headerMeta}>
            <span style={styles.metaDot} />
            <span>Live model view</span>
          </div>
        </div>

        <div className="analytics-flow" style={styles.flow}>
          <section className="analytics-main" style={styles.mainColumn}>
            <PredictionPanel />
            <BudgetPlanner />
          </section>

          <aside className="analytics-side" style={styles.sideColumn}>
            <AnomalyPanel />
            <InsightCard insights={insights} loading={loading} />
          </aside>
        </div>
      </div>
    </>
  );
};

const styles = {
  page: {
    maxWidth: 'var(--app-content-max)',
    padding: '1.15rem 0 2.2rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '0.95rem',
    minHeight: 58,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '1.34rem',
    fontWeight: 850,
    color: 'var(--text)',
    margin: 0,
  },
  subtitle: {
    color: 'var(--muted)',
    fontSize: '0.82rem',
    margin: '0.18rem 0 0 0',
  },
  headerMeta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    color: 'var(--muted-strong)',
    background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
    border: '1px solid var(--border)',
    borderRadius: 999,
    padding: '0.42rem 0.62rem',
    fontSize: '0.74rem',
    fontWeight: 750,
  },
  metaDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'var(--success)',
    boxShadow: '0 0 0 3px var(--success-soft)',
  },
  flow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.45fr) minmax(330px, 0.85fr)',
    gap: '0.72rem',
    alignItems: 'start',
  },
  mainColumn: {
    display: 'grid',
    gap: '0.72rem',
    minWidth: 0,
  },
  sideColumn: {
    display: 'grid',
    gap: '0.72rem',
    minWidth: 0,
  },
};

export default Analytics;
