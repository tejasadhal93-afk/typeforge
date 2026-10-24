import { useState, useEffect } from "react";

const MEDAL = { 0:"🥇", 1:"🥈", 2:"🥉" };

export default function Leaderboard() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [sortBy, setSortBy]   = useState("bestWpm");

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`/api/leaderboard?mode=${sortBy}`)
      .then(r => {
        if (!r.ok) throw new Error("API not available");
        return r.json();
      })
      .then(d => { setData(d.leaderboard || []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [sortBy]);

  return (
    <div className="page-container">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <h2 style={{fontSize:"1.5rem",fontWeight:800}}>🏆 Global Leaderboard</h2>
          <p style={{fontSize:"0.84rem",color:"var(--text-2)",marginTop:4}}>Top typists ranked across all sessions</p>
        </div>
        <div className="pill-group">
          <button className={`pill ${sortBy==="bestWpm"?"active":""}`} onClick={()=>setSortBy("bestWpm")}>Best WPM</button>
          <button className={`pill ${sortBy==="avgWpm"?"active":""}`} onClick={()=>setSortBy("avgWpm")}>Avg WPM</button>
        </div>
      </div>

      {loading && (
        <div className="card" style={{textAlign:"center",padding:"48px"}}>
          <div style={{fontSize:"1.8rem",marginBottom:12}}>⏳</div>
          <p style={{color:"var(--text-2)"}}>Loading leaderboard…</p>
        </div>
      )}

      {error && (
        <div className="card" style={{textAlign:"center",padding:"48px",borderColor:"rgba(255,93,93,0.3)"}}>
          <div style={{fontSize:"2.5rem",marginBottom:12}}>🔌</div>
          <p style={{fontWeight:700,marginBottom:6}}>Backend Offline</p>
          <p style={{fontSize:"0.82rem",color:"var(--text-2)",marginBottom:12}}>
            The leaderboard requires the TypeForge server to be running.
          </p>
          <div className="card" style={{display:"inline-block",textAlign:"left",padding:"12px 18px",background:"var(--bg)"}}>
            <code style={{fontFamily:"var(--font-mono)",fontSize:"0.8rem",color:"var(--caret)"}}>
              cd server && npm run dev
            </code>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Podium (Top 3) */}
          {data.length >= 3 && (
            <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:28,alignItems:"flex-end"}}>
              {[1, 0, 2].map(pos => {
                const entry = data[pos];
                const heights = {0:120, 1:100, 2:90};
                const bgColors = {0:"rgba(255,215,0,0.12)", 1:"rgba(192,192,192,0.08)", 2:"rgba(205,127,50,0.08)"};
                const borderColors = {0:"rgba(255,215,0,0.5)", 1:"rgba(192,192,192,0.3)", 2:"rgba(205,127,50,0.3)"};
                if (!entry) return null;
                return (
                  <div key={pos} style={{
                    flex:1,maxWidth:200,background:bgColors[pos],border:`1px solid ${borderColors[pos]}`,
                    borderRadius:12,padding:"16px 12px",textAlign:"center",
                    minHeight:heights[pos],display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6
                  }}>
                    <div style={{fontSize:"2rem"}}>{MEDAL[pos]}</div>
                    <div style={{fontWeight:800,fontSize:"1rem"}}>{entry.username}</div>
                    <div style={{fontFamily:"var(--font-mono)",fontSize:"1.4rem",fontWeight:800,color:"var(--caret)"}}>{entry[sortBy]}</div>
                    <div style={{fontSize:"0.7rem",color:"var(--text-2)"}}>WPM</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Table */}
          <div className="card">
            {data.length === 0 ? (
              <div style={{textAlign:"center",padding:"32px",color:"var(--text-2)"}}>
                <div style={{fontSize:"2rem",marginBottom:10}}>🏁</div>
                <p style={{fontWeight:700}}>No registered users yet</p>
                <p style={{fontSize:"0.8rem",marginTop:4}}>Sign up and complete a session to appear here!</p>
              </div>
            ) : (
              <table className="hist-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Best WPM</th>
                    <th>Avg WPM</th>
                    <th>Accuracy</th>
                    <th>Sessions</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((entry, idx) => (
                    <tr key={entry._id || idx}>
                      <td style={{fontFamily:"var(--font-mono)",color:"var(--text-2)"}}>{MEDAL[idx] || `#${idx+1}`}</td>
                      <td><strong>{entry.username}</strong></td>
                      <td><span className="wpm-tag">{entry.bestWpm}</span></td>
                      <td style={{fontFamily:"var(--font-mono)"}}>{entry.avgWpm}</td>
                      <td><span className="acc-tag">{entry.avgAccuracy}%</span></td>
                      <td>{entry.totalSessions}</td>
                      <td style={{fontSize:"0.78rem",color:"var(--text-2)"}}>
                        {new Date(entry.createdAt).toLocaleDateString([], {month:"short",year:"numeric"})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
