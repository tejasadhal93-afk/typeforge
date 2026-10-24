import { useMemo } from "react";

export default function PaceCar({ currentWpm, targetWpm, currentIndex, totalChars, timeElapsed, mode, duration }) {
  // User progress: chars typed / total
  const userProgress = totalChars > 0 ? Math.min(1, currentIndex / totalChars) : 0;

  // Pace car progress: based on target WPM
  const paceProgress = useMemo(() => {
    if (mode === "time-trial") {
      return Math.min(1, timeElapsed / duration);
    }
    if (totalChars === 0) return 0;
    const targetCharsPerSec = (targetWpm * 5) / 60;
    const expectedChars = targetCharsPerSec * timeElapsed;
    return Math.min(1, expectedChars / totalChars);
  }, [mode, timeElapsed, duration, targetWpm, totalChars]);

  const userAhead = userProgress >= paceProgress;
  const userColor = userAhead ? "var(--correct)" : "var(--incorrect)";
  const paceColor = "var(--caret)";

  return (
    <div style={{
      background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,
      padding:"10px 16px",position:"relative",overflow:"hidden"
    }}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.72rem",
        color:"var(--text-2)",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>
        <span>👤 You — <strong style={{color:userColor,fontFamily:"var(--font-mono)"}}>{currentWpm} WPM</strong></span>
        <span>🏎️ Pace Car — <strong style={{color:paceColor,fontFamily:"var(--font-mono)"}}>{targetWpm} WPM</strong></span>
      </div>

      {/* Track */}
      <div style={{position:"relative",height:28,background:"var(--bg)",borderRadius:6,
        border:"1px solid var(--border)",overflow:"hidden"}}>

        {/* Track lanes */}
        <div style={{position:"absolute",left:0,right:0,top:"50%",height:1,background:"#ffffff08"}}/>

        {/* Pace car */}
        <div style={{
          position:"absolute",top:"50%",transform:"translateY(-50%)",
          left:`calc(${Math.max(0, paceProgress * 100 - 1)}% - 8px)`,
          transition:"left 0.5s linear",fontSize:"1.1rem",lineHeight:1
        }}>🏎️</div>

        {/* User car */}
        <div style={{
          position:"absolute",top:"50%",transform:"translateY(-50%)",
          left:`calc(${Math.max(0, userProgress * 100 - 1)}% - 8px)`,
          transition:"left 0.15s ease",fontSize:"1.1rem",lineHeight:1,zIndex:2
        }}>🚗</div>
      </div>

      {/* Delta label */}
      <div style={{marginTop:6,fontSize:"0.72rem",textAlign:"center",fontWeight:600,
        color:userAhead ? "var(--correct)" : "var(--incorrect)"}}>
        {userAhead
          ? `⬆ ${currentWpm - targetWpm > 0 ? "+" + (currentWpm - targetWpm) : ""} WPM ahead of pace`
          : `⬇ ${targetWpm - currentWpm} WPM behind pace — speed up!`}
      </div>
    </div>
  );
}
