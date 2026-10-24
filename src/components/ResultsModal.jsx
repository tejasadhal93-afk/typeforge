import { useState } from "react";
import { useAppStore } from "../store/appStore";
import CertificateModal from "./CertificateModal";

export default function ResultsModal({ open, metrics, timeElapsed, mode, label, onRetry }) {
  const stats   = useAppStore(s => s.stats);
  const [certOpen, setCertOpen] = useState(false);
  const isNewBest = metrics.wpm > 0 && metrics.wpm >= stats.bestWpm && stats.totalSessions > 1;
  const qualifiesForCert = metrics.wpm >= 40;

  if (!open) return null;

  return (
    <>
      <div className="modal-bg open">
        <div className="modal-card">
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:"1.1rem", fontWeight:700 }}>Session Complete</span>
              {isNewBest && <span className="new-best">★ New Best!</span>}
            </div>
            <button className="btn btn-ghost" style={{padding:"4px 10px",fontSize:"1rem"}} onClick={onRetry}>×</button>
          </div>

          {/* Main WPM */}
          <div style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:"var(--r-md)", padding:"22px", marginBottom:18 }}>
            <div className="modal-wpm">{metrics.wpm}</div>
            <div className="modal-wpm-label">Net Words Per Minute</div>
          </div>

          {/* Stats grid */}
          <div className="modal-grid">
            {[
              ["Accuracy",  `${Math.round(metrics.accuracy)}%`],
              ["Raw WPM",   `${metrics.rawWpm}`],
              ["Errors",    `${metrics.errors}`],
              ["Time",      `${Math.round(timeElapsed)}s`],
            ].map(([lbl, val]) => (
              <div key={lbl} className="modal-cell">
                <div className="modal-cell-val">{val}</div>
                <div className="modal-cell-lbl">{lbl}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="modal-actions" style={{flexWrap:"wrap",gap:8}}>
            {qualifiesForCert && (
              <button className="btn btn-ghost" style={{color:"var(--caret)",borderColor:"rgba(255,179,71,0.3)"}}
                onClick={() => setCertOpen(true)}>
                🏆 Get Certificate
              </button>
            )}
            <button className="btn btn-ghost" onClick={onRetry}>Try Again (Esc)</button>
            <button className="btn btn-primary" onClick={onRetry}>↩ Restart</button>
          </div>
        </div>
      </div>

      <CertificateModal
        open={certOpen}
        onClose={() => setCertOpen(false)}
        wpm={metrics.wpm}
        accuracy={Math.round(metrics.accuracy)}
        mode={mode}
        label={label}
      />
    </>
  );
}
