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
      <div className="app-page" style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.title}>Analytics</h1>
          <p style={styles.subtitle}>Insights and planning tools</p>
        </div>

        <div style={styles.grid}>
          <div style={styles.section}>
            <PredictionPanel />
          </div>
          <div style={styles.section}>
            <AnomalyPanel />
          </div>
          <div style={styles.section}>
            <BudgetPlanner />
          </div>
          <div style={styles.section}>
            <InsightCard insights={insights} loading={loading} />
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  page: {
    maxWidth: 'var(--app-content-max)',
    padding: '1.75rem 0 3rem',
  },
  header: {
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.55rem',
    fontWeight: 800,
    color: 'var(--text)',
    margin: 0,
  },
  subtitle: {
    color: 'var(--muted)',
    fontSize: '0.9rem',
    margin: '0.25rem 0 0 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
    gap: '0.9rem',
  },
  section: {
    minWidth: 0,
  },
};

export default Analytics;
