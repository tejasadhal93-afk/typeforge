import { useState, useMemo, useCallback } from "react";
import TypingArea from "../components/TypingArea";
import { useAppStore } from "../store/appStore";
import { wordbank } from "../data/wordbank";
import { passages } from "../data/passages";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function genWords(n) { return shuffle(wordbank).slice(0, n).join(" "); }

export default function Practice() {
  const {
    paceCarEnabled, targetPaceWpm,
    togglePaceCar, setTargetPaceWpm
  } = useAppStore();

  const [submode, setSubmode] = useState("time-trial");
  const [timeDur, setTimeDur] = useState(30);
  const [passageId, setPassageId] = useState(passages[0].id);
  const [customText, setCustomText] = useState("");
  const [customActive, setCustomActive] = useState("");
  const [sessionKey, setSessionKey] = useState(0);
  const [trialText, setTrialText] = useState(() => genWords(70));

  const passage = useMemo(() => passages.find(p => p.id === passageId) || passages[0], [passageId]);
  const onNeedMore = useCallback(() => genWords(30), []);

  const restart = () => { setTrialText(genWords(70)); setSessionKey(k => k + 1); };

  const activeText = submode === "time-trial" ? trialText
    : submode === "custom" ? customActive
    : passage.text;
  const activeMode = submode === "time-trial" ? "time-trial"
    : submode === "custom" ? "custom" : "passage";
  const activeLabel = submode === "time-trial" ? `${timeDur}s Time Trial`
    : submode === "custom" ? "Custom Text"
    : `Passage: ${passage.title}`;

  return (
    <div className="page-container">
      {/* Mode bar */}
      <div className="mode-bar">
        <div className="pill-group">
          {[["time-trial","⏱ Time Trial"],["passage","📖 Passage"],["custom","✍️ Custom"]].map(([m,l]) => (
            <button key={m} className={`pill ${submode===m?"active":""}`}
              onClick={() => { setSubmode(m); setSessionKey(k=>k+1); }}>{l}</button>
          ))}
        </div>

        {submode === "time-trial" && (
          <div className="pill-group">
            {[15,30,60].map(d => (
              <button key={d} className={`pill ${timeDur===d?"active":""}`}
                onClick={() => { setTimeDur(d); restart(); }}>{d}s</button>
            ))}
          </div>
        )}

        {submode === "passage" && (
          <select className="btn btn-ghost" style={{padding:"7px 12px"}}
            value={passageId} onChange={e => { setPassageId(e.target.value); setSessionKey(k=>k+1); }}>
            {passages.map(p => <option key={p.id} value={p.id}>{p.title} ({p.category})</option>)}
          </select>
        )}

        {submode === "time-trial" && (
          <button className="btn btn-ghost" onClick={restart}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            New Words
          </button>
        )}
      </div>

      {/* Pace Car Control Row */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
        <button
          className={`btn btn-ghost${paceCarEnabled?" active":""}`}
          style={{gap:8,fontSize:"0.82rem"}}
          onClick={togglePaceCar}
        >
          🏎️ Pace Car {paceCarEnabled ? "ON" : "OFF"}
        </button>
        {paceCarEnabled && (
          <div style={{display:"flex",alignItems:"center",gap:10,fontSize:"0.82rem",color:"var(--text-2)"}}>
            <span>Target:</span>
            <input type="range" min={20} max={160} step={5} value={targetPaceWpm}
              onChange={e => setTargetPaceWpm(parseInt(e.target.value))}
              style={{width:120,accentColor:"var(--caret)"}}/>
            <span style={{fontFamily:"var(--font-mono)",fontWeight:700,color:"var(--caret)",minWidth:60}}>
              {targetPaceWpm} WPM
            </span>
          </div>
        )}
      </div>

      {/* Custom text input panel */}
      {submode === "custom" && !customActive && (
        <div className="card" style={{ marginBottom:"18px" }}>
          <p style={{ fontSize:"0.85rem", color:"var(--text-2)", marginBottom:"12px" }}>
            Paste any text to practice — articles, code, lyrics, anything!
          </p>
          <textarea
            className="custom-textarea"
            placeholder="Paste your text here (up to 1,500 characters)…"
            maxLength={1500}
            value={customText}
            onChange={e => setCustomText(e.target.value)}
          />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"12px" }}>
            <span style={{ fontSize:"0.76rem", color:"var(--text-muted)" }}>{customText.length}/1500 characters</span>
            <button className="btn btn-primary" disabled={customText.trim().length < 10}
              onClick={() => { setCustomActive(customText.trim()); setSessionKey(k=>k+1); }}>
              Start Typing →
            </button>
          </div>
        </div>
      )}

      {/* Typing area */}
      {(submode !== "custom" || customActive) && (
        <TypingArea
          key={`${sessionKey}-${submode}-${timeDur}-${passageId}`}
          text={activeText}
          mode={activeMode}
          duration={timeDur}
          label={activeLabel}
          onNeedMore={submode === "time-trial" ? onNeedMore : undefined}
          onComplete={() => {
            if (submode === "time-trial") setTimeout(() => { setTrialText(genWords(70)); setSessionKey(k=>k+1); }, 2500);
          }}
        />
      )}

      {submode === "passage" && (
        <div className="card" style={{ marginTop:"16px" }}>
          <div style={{ fontSize:"0.8rem", fontWeight:700, color:"var(--text-2)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{passage.category}</div>
          <div style={{ fontSize:"0.92rem", fontWeight:700, marginTop:"2px" }}>{passage.title}</div>
          <div style={{ fontSize:"0.78rem", color:"var(--text-2)", marginTop:"4px" }}>{passage.text.split(" ").length} words</div>
        </div>
      )}

      <footer style={{ marginTop:"32px", padding:"16px 0", borderTop:"1px solid var(--border)",
        display:"flex", justifyContent:"space-between", fontSize:"0.76rem", color:"var(--text-muted)" }}>
        <div style={{ display:"flex", gap:"20px" }}>
          {[["Esc","Restart"],["Backspace","Correct"]].map(([k,a]) => (
            <span key={k}>
              <kbd style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:3,
                padding:"2px 6px",fontFamily:"var(--font-mono)",fontSize:"0.7rem"}}>{k}</kbd> {a}
            </span>
          ))}
        </div>
        <span>TypeForge — Focus · Rhythm · Precision</span>
      </footer>
    </div>
  );
}
