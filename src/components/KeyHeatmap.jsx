const HEATMAP_LAYOUT = [
  ["`","1","2","3","4","5","6","7","8","9","0","-","="],
  ["Q","W","E","R","T","Y","U","I","O","P","[","]","\\"],
  ["A","S","D","F","G","H","J","K","L",";","'"],
  ["Z","X","C","V","B","N","M",",",".","/"],
];

export default function KeyHeatmap({ keyErrors }) {
  if (!keyErrors || Object.keys(keyErrors).length === 0) {
    return (
      <div style={{ textAlign:"center", padding:"32px 16px", color:"var(--text-2)" }}>
        <div style={{ fontSize:"2rem", marginBottom:"10px" }}>🎯</div>
        <p style={{ fontWeight:600 }}>No key errors yet</p>
        <p style={{ fontSize:"0.78rem", color:"var(--text-muted)", marginTop:"4px" }}>Your most frequently missed keys will appear here after practice sessions.</p>
      </div>
    );
  }

  const maxErrors = Math.max(...Object.values(keyErrors));

  const getColor = (key) => {
    const count = keyErrors[key.toLowerCase()] || keyErrors[key] || 0;
    if (count === 0) return "transparent";
    const intensity = count / maxErrors;
    const r = Math.round(255);
    const g = Math.round(93 + (1-intensity) * 162);
    const b = Math.round(93 + (1-intensity) * 162);
    return `rgba(${r},${g},${b},${0.15 + intensity * 0.55})`;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
      {HEATMAP_LAYOUT.map((row, ri) => (
        <div key={ri} style={{ display:"flex", gap:"5px", justifyContent:"center" }}>
          {row.map(key => {
            const count = keyErrors[key.toLowerCase()] || keyErrors[key] || 0;
            return (
              <div key={key}
                title={count > 0 ? `${key}: ${count} error${count !== 1 ? "s" : ""}` : undefined}
                style={{
                  width:40, height:40, background:count > 0 ? getColor(key) : "var(--bg)",
                  border:`1px solid ${count > 0 ? "rgba(255,93,93,0.4)" : "var(--border)"}`,
                  borderRadius:"5px", display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:"var(--font-mono)", fontSize:"0.82rem", fontWeight:600, color:"var(--text)",
                  cursor: count > 0 ? "help" : "default",
                  boxShadow: count > 0 ? `0 0 8px rgba(255,93,93,${Math.min(0.6, (count/maxErrors)*0.6)})` : "none",
                  transition:"all 0.2s",
                }}
              >
                {key}
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginTop:"12px", fontSize:"0.74rem", color:"var(--text-2)" }}>
        <span>Fewer errors</span>
        {[0.1,0.3,0.5,0.7,1.0].map(i => (
          <div key={i} style={{width:18,height:18,borderRadius:"3px",background:`rgba(255,93,93,${0.15+i*0.55})`,border:"1px solid rgba(255,93,93,0.3)"}}/>
        ))}
        <span>More errors</span>
      </div>
    </div>
  );
}
