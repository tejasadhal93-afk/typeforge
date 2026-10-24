import { useState } from "react";
import { useAppStore } from "../store/appStore";
import { lessons } from "../data/lessons";
import TypingArea from "../components/TypingArea";

export default function Lessons() {
  const lessonProgress = useAppStore(s => s.lessonProgress);
  const [selectedTier, setSelectedTier] = useState(0);
  const [selectedDrill, setSelectedDrill] = useState(0);
  const [sessionKey, setSessionKey] = useState(0);

  const tier = lessons[selectedTier];
  const drill = tier.drills[selectedDrill];

  const selectDrill = (ti, di) => {
    setSelectedTier(ti); setSelectedDrill(di); setSessionKey(k => k+1);
  };

  const next = () => {
    if (selectedDrill + 1 < tier.drills.length) {
      selectDrill(selectedTier, selectedDrill + 1);
    } else if (selectedTier + 1 < lessons.length) {
      selectDrill(selectedTier + 1, 0);
    }
  };

  return (
    <div className="page-container">
      {/* Active lesson banner */}
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderLeft:"3px solid var(--caret)", borderRadius:"var(--r-sm)", padding:"12px 18px", marginBottom:"20px" }}>
        <div style={{ fontWeight:700 }}>{tier.title} — {drill.name}</div>
        <div style={{ fontSize:"0.82rem", color:"var(--text-2)", marginTop:"2px" }}>{tier.description}</div>
      </div>

      {/* Tier grid */}
      <div className="tiers-grid" style={{ marginBottom:"24px" }}>
        {lessons.map((t, ti) => (
          <div key={t.id} className={`tier-card ${ti===selectedTier?"active-tier":""}`}>
            <span className="tier-title">{t.title}</span>
            <span className="tier-sub">{t.subtitle}</span>
            <div>
              {t.drills.map((d, di) => {
                const prog = lessonProgress[d.id];
                const done = prog && prog.completedCount > 0;
                return (
                  <button key={d.id}
                    className={`drill-btn ${ti===selectedTier&&di===selectedDrill?"selected":""}`}
                    onClick={() => selectDrill(ti, di)}
                  >
                    <span>{d.name}</span>
                    {done
                      ? <span className="drill-badge">{prog.bestWpm} WPM</span>
                      : <span className="drill-badge empty">Drill</span>
                    }
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <TypingArea
        key={`lesson-${sessionKey}-${tier.id}-${drill.id}`}
        text={drill.text}
        mode="lesson"
        label={`${tier.title} – ${drill.name}`}
        drillId={drill.id}
        onComplete={next}
      />
    </div>
  );
}
