import { useState, useMemo } from "react";
import { passages } from "../data/passages";
import { useAppStore } from "../store/appStore";
import TypingArea from "../components/TypingArea";

export default function Daily() {
  const stats = useAppStore(s => s.stats);
  const [completed, setCompleted] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  // Today string format YYYY-MM-DD
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  
  // Deterministic daily passage based on day of year
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const passage = useMemo(() => passages[dayOfYear % passages.length], [dayOfYear]);

  return (
    <div className="page-container">
      {/* Daily Banner */}
      <div className="daily-banner">
        <div className="daily-icon">📅</div>
        <div style={{ flex: 1 }}>
          <div className="daily-label">Daily Challenge • {dateStr}</div>
          <div className="daily-title">{passage.title} ({passage.category})</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-2)", marginTop: "4px" }}>
            A synchronized daily drill for all typists. Build your daily streak!
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Completed</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.4rem", fontWeight: 800, color: "var(--caret)" }}>
            {stats.dailyCompleted} {stats.dailyCompleted === 1 ? "day" : "days"}
          </div>
        </div>
      </div>

      <TypingArea
        key={`daily-${sessionKey}-${passage.id}`}
        text={passage.text}
        mode="daily"
        label={`Daily Challenge (${dateStr})`}
        onComplete={() => setCompleted(true)}
      />

      {completed && (
        <div className="card" style={{ marginTop: "18px", textAlign: "center", borderColor: "var(--correct)", background: "rgba(95,217,122,0.06)" }}>
          <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>🌟</div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--correct)" }}>Daily Challenge Completed!</div>
          <div style={{ fontSize: "0.84rem", color: "var(--text-2)", marginTop: "4px" }}>
            Great consistency! Come back tomorrow for a new passage.
          </div>
          <button className="btn btn-ghost" style={{ marginTop: "12px" }} onClick={() => { setCompleted(false); setSessionKey(k => k + 1); }}>
            Practice Again Today
          </button>
        </div>
      )}
    </div>
  );
}
