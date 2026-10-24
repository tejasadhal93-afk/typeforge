import { ACHIEVEMENTS } from "../data/achievements";
import { useAppStore } from "../store/appStore";

export default function Achievements() {
  const unlocked = useAppStore(s => s.unlockedAchievements);
  const unlockedCount = unlocked.length;
  const totalCount = ACHIEVEMENTS.length;
  const pct = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="card" style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Trophy Case</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-2)", marginTop: "4px" }}>
            Unlock achievements by hitting speed milestones, maintaining accuracy streaks, and mastering lessons.
          </p>
        </div>
        <div style={{ minWidth: 160 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "6px" }}>
            <span style={{ color: "var(--text-2)" }}>Progress</span>
            <span style={{ fontWeight: 700, color: "var(--caret)" }}>{unlockedCount} / {totalCount} ({pct}%)</span>
          </div>
          <div style={{ height: 8, background: "var(--bg)", borderRadius: 4, overflow: "hidden", border: "1px solid var(--border)" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "var(--caret)", borderRadius: 4, transition: "width 0.4s ease" }} />
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="achievements-grid">
        {ACHIEVEMENTS.map(ach => {
          const isUnlocked = unlocked.includes(ach.id);
          return (
            <div key={ach.id} className={`ach-card ${isUnlocked ? "unlocked" : "locked"}`}>
              <div className="ach-icon">{ach.icon}</div>
              <div className="ach-title">{ach.title}</div>
              <div className="ach-desc">{ach.desc}</div>
              <span className={`ach-badge ${isUnlocked ? "unlocked" : "locked"}`}>
                {isUnlocked ? "Unlocked ✓" : "Locked"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
