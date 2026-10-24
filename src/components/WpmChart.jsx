import { useRef, useState } from "react";

export default function WpmChart({ sessions }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  if (!sessions || sessions.length === 0) {
    return (
      <div style={{ textAlign:"center", padding:"48px", color:"var(--text-2)" }}>
        <div style={{ fontSize:"2.5rem", marginBottom:"12px" }}>📊</div>
        <p style={{ fontWeight:600, color:"var(--text)" }}>No sessions yet</p>
        <p style={{ fontSize:"0.8rem", marginTop:"4px", color:"var(--text-muted)" }}>Complete a lesson or practice test to see your speed chart.</p>
      </div>
    );
  }

  const recent = [...sessions].reverse().slice(-15);
  const W = 720, H = 200, PL = 44, PR = 20, PT = 20, PB = 36;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxWpm = Math.max(60, ...recent.map(s => s.wpm)) * 1.15;
  const avgWpm = Math.round(recent.reduce((a, b) => a + b.wpm, 0) / recent.length);
  const barW = Math.min(38, (cW / recent.length) * 0.65);
  const barSpacing = cW / recent.length;

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map(p => Math.round(maxWpm * p));

  return (
    <div style={{ position:"relative" }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="chart-svg">
        <defs>
          <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5FD97A" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#3BA552" stopOpacity="0.5"/>
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridVals.map((v, i) => {
          const y = PT + cH - (v / maxWpm) * cH;
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W-PR} y2={y} stroke="#2e2e38" strokeWidth="1"/>
              <text x={PL-8} y={y+4} fill="var(--text-muted)" fontSize="10" textAnchor="end" fontFamily="monospace">{v}</text>
            </g>
          );
        })}

        {/* Average line */}
        {(() => {
          const avgY = PT + cH - (avgWpm / maxWpm) * cH;
          return (
            <>
              <line x1={PL} y1={avgY} x2={W-PR} y2={avgY} stroke="var(--caret)" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.7"/>
              <text x={W-PR} y={avgY-5} fill="var(--caret)" fontSize="10" textAnchor="end" fontFamily="monospace" fontWeight="600">Avg {avgWpm}</text>
            </>
          );
        })()}

        {/* Bars */}
        {recent.map((s, i) => {
          const bH = Math.max(4, (s.wpm / maxWpm) * cH);
          const x = PL + i * barSpacing + (barSpacing - barW) / 2;
          const y = PT + cH - bH;
          return (
            <g key={i} style={{ cursor:"pointer" }}
              onMouseEnter={e => {
                const rect = svgRef.current?.getBoundingClientRect();
                if (rect) setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, s });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <rect x={x} y={y} width={barW} height={bH} rx="4" fill="url(#barG)"/>
              {bH > 20 && <text x={x+barW/2} y={y-6} fill="var(--text)" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="700">{s.wpm}</text>}
              <text x={x+barW/2} y={H-PB+18} fill="var(--text-muted)" fontSize="10" textAnchor="middle" fontFamily="monospace">#{i+1}</text>
            </g>
          );
        })}
      </svg>

      {tooltip && (
        <div style={{
          position:"absolute", left:tooltip.x+12, top:tooltip.y-40,
          background:"#18181c", border:"1px solid #3c3c46", borderRadius:"6px",
          padding:"8px 12px", fontSize:"0.76rem", pointerEvents:"none", zIndex:100,
          boxShadow:"0 4px 14px rgba(0,0,0,0.5)"
        }}>
          <strong style={{display:"block",marginBottom:"4px"}}>{tooltip.s.label}</strong>
          <div>Speed: <span style={{color:"var(--correct)",fontFamily:"monospace",fontWeight:700}}>{tooltip.s.wpm} WPM</span></div>
          <div>Accuracy: <span style={{color:"var(--caret)",fontFamily:"monospace"}}>{tooltip.s.accuracy}%</span></div>
          <div style={{color:"var(--text-muted)",marginTop:"4px",fontSize:"0.7rem"}}>{new Date(tooltip.s.date).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
