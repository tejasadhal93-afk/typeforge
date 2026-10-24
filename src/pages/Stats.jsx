import { useAppStore } from "../store/appStore";
import WpmChart from "../components/WpmChart";
import KeyHeatmap from "../components/KeyHeatmap";

export default function Stats() {
  const { sessions, stats, clearHistory } = useAppStore();

  // Aggregate key errors from all sessions
  const aggregatedErrors = sessions.reduce((acc, s) => {
    if (s.keyErrors) {
      Object.entries(s.keyErrors).forEach(([k, count]) => {
        acc[k] = (acc[k] || 0) + count;
      });
    }
    return acc;
  }, {});

  const handleClear = () => {
    if (window.confirm("Are you sure you want to reset all your typing history and stats?")) {
      clearHistory();
    }
  };

  return (
    <div className="page-container">
      {/* Top Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card featured">
          <div className="stat-card-title">Best Speed</div>
          <div className="stat-card-val">{stats.bestWpm}</div>
          <div className="stat-card-sub">Words Per Minute</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Average Speed</div>
          <div className="stat-card-val">{stats.avgWpm}</div>
          <div className="stat-card-sub">WPM across sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Avg Accuracy</div>
          <div className="stat-card-val">{stats.avgAccuracy}%</div>
          <div className="stat-card-sub">Precision rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Tests Taken</div>
          <div className="stat-card-val">{stats.totalSessions}</div>
          <div className="stat-card-sub">Logged sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Practice Time</div>
          <div className="stat-card-val">{stats.totalTimeMinutes}m</div>
          <div className="stat-card-sub">Active typing</div>
        </div>
      </div>

      {/* Speed Progression Chart */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 className="section-title">Speed Progression (Recent Sessions)</h3>
        <WpmChart sessions={sessions} />
      </div>

      {/* Key Error Heatmap */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 className="section-title">Keyboard Accuracy Heatmap</h3>
        <p style={{ fontSize: "0.82rem", color: "var(--text-2)", marginBottom: "16px" }}>
          Keys highlighted in red are where you make the most mistakes. Focus on these keys to boost speed!
        </p>
        <KeyHeatmap keyErrors={aggregatedErrors} />
      </div>

      {/* Recent Sessions Table */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 className="section-title" style={{ margin: 0 }}>Session History</h3>
          {sessions.length > 0 && (
            <button className="btn btn-danger" onClick={handleClear}>
              Clear History
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
            No sessions logged yet. Complete a test in Practice or Lessons!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="hist-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mode / Exercise</th>
                  <th>Net WPM</th>
                  <th>Accuracy</th>
                  <th>Duration</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 20).map((s, idx) => (
                  <tr key={s.id || idx}>
                    <td style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>#{sessions.length - idx}</td>
                    <td><strong>{s.label}</strong></td>
                    <td><span className="wpm-tag">{s.wpm} WPM</span></td>
                    <td><span className="acc-tag">{s.accuracy}%</span></td>
                    <td>{s.duration}s</td>
                    <td style={{ color: "var(--text-2)", fontSize: "0.78rem" }}>
                      {new Date(s.date).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
