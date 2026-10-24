import { useRef } from "react";
import { useAppStore } from "../store/appStore";

export default function CertificateModal({ open, onClose, wpm, accuracy, mode, label }) {
  const user = useAppStore(s => s.user);
  const canvasRef = useRef(null);
  const today = new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
  const displayName = user?.username || "TypeForge Typist";
  const grade = wpm >= 100 ? "Elite" : wpm >= 70 ? "Advanced" : wpm >= 50 ? "Intermediate" : "Beginner";
  const gradeColor = wpm >= 100 ? "#FFD700" : wpm >= 70 ? "#FF8C42" : wpm >= 50 ? "#5FD97A" : "#8A8A93";

  const downloadCertificate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = 900, H = 620;
    canvas.width = W; canvas.height = H;

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,   "#12121a");
    bg.addColorStop(0.5, "#1a1a2e");
    bg.addColorStop(1,   "#12121a");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Outer border
    ctx.strokeStyle = "#FFB347"; ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, W - 32, H - 32);
    ctx.strokeStyle = "rgba(255,179,71,0.25)"; ctx.lineWidth = 1;
    ctx.strokeRect(26, 26, W - 52, H - 52);

    // Corner decorations
    const corners = [[36,36],[W-36,36],[36,H-36],[W-36,H-36]];
    corners.forEach(([cx,cy]) => {
      ctx.fillStyle = "#FFB347";
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
    });

    // Title "TYPEFORGE"
    ctx.fillStyle = "#FFB347";
    ctx.font = "bold 22px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("TYPEFORGE", W/2, 90);

    // Subtitle
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "13px 'Inter', sans-serif";
    ctx.fillText("CERTIFICATE OF TYPING MASTERY", W/2, 116);

    // Divider
    ctx.strokeStyle = "rgba(255,179,71,0.4)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(120, 135); ctx.lineTo(W - 120, 135); ctx.stroke();

    // "This certifies that"
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "15px 'Inter', sans-serif";
    ctx.fillText("This certifies that", W/2, 175);

    // Name
    ctx.fillStyle = "#EDEDF0";
    ctx.font = "bold 38px 'Inter', sans-serif";
    ctx.fillText(displayName, W/2, 230);

    // "has achieved"
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "15px 'Inter', sans-serif";
    ctx.fillText("has achieved the grade of", W/2, 270);

    // Grade
    ctx.fillStyle = gradeColor;
    ctx.font = "bold 32px 'Inter', sans-serif";
    ctx.fillText(grade + " Typist", W/2, 312);

    // Stats row
    ctx.font = "bold 16px 'JetBrains Mono', monospace";
    const cols = [{label:"NET WPM",val:wpm+"",color:"#FFB347"},{label:"ACCURACY",val:accuracy+"%",color:"#5FD97A"},{label:"MODE",val:mode.replace("-"," ").toUpperCase(),color:"#4FC3F7"}];
    cols.forEach(({label:l, val, color}, i) => {
      const x = W/2 - 180 + i * 180;
      ctx.fillStyle = color;
      ctx.font = "bold 28px 'JetBrains Mono', monospace";
      ctx.fillText(val, x, 385);
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "11px 'Inter', sans-serif";
      ctx.fillText(l, x, 405);
    });

    // Divider
    ctx.strokeStyle = "rgba(255,179,71,0.3)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(120, 430); ctx.lineTo(W - 120, 430); ctx.stroke();

    // Footer
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "13px 'Inter', sans-serif";
    ctx.fillText(today + "   •   " + (label || "Typing Test"), W/2, 460);
    ctx.fillStyle = "rgba(255,179,71,0.6)";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText("typeforge.app   •   forge your speed, one keystroke at a time", W/2, 490);

    // Download
    const link = document.createElement("a");
    link.download = `TypeForge_Certificate_${displayName}_${wpm}WPM.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  };

  if (!open) return null;

  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(8,8,12,0.9)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:3000,padding:20
    }} onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{
        background:"linear-gradient(160deg,#12121a 0%,#1a1a2e 100%)",
        border:"2px solid rgba(255,179,71,0.6)",borderRadius:18,
        width:"100%",maxWidth:560,padding:"36px 32px",
        boxShadow:"0 0 60px rgba(255,179,71,0.2),0 24px 60px rgba(0,0,0,0.8)"
      }}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"2.5rem",marginBottom:8}}>🏆</div>
          <h2 style={{fontSize:"1.5rem",fontWeight:800,marginBottom:4}}>Certificate Earned!</h2>
          <p style={{fontSize:"0.85rem",color:"var(--text-2)",marginBottom:24}}>
            Impressive typing — here is your official TypeForge certificate.
          </p>
        </div>

        {/* Preview card */}
        <div style={{
          background:"linear-gradient(135deg,#0f0f1a,#1a1a2e)",border:"1px solid rgba(255,179,71,0.5)",
          borderRadius:12,padding:"28px 24px",textAlign:"center",marginBottom:24,
          boxShadow:"inset 0 0 20px rgba(255,179,71,0.07)"
        }}>
          <div style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.12em",color:"var(--caret)",marginBottom:4}}>TYPEFORGE — CERTIFICATE OF TYPING MASTERY</div>
          <div style={{fontSize:"0.8rem",color:"var(--text-2)",marginBottom:14}}>This certifies that</div>
          <div style={{fontSize:"1.5rem",fontWeight:800,marginBottom:4}}>{displayName}</div>
          <div style={{fontSize:"0.8rem",color:"var(--text-2)",marginBottom:6}}>has achieved the grade of</div>
          <div style={{fontSize:"1.3rem",fontWeight:800,color:gradeColor,marginBottom:18}}>{grade} Typist</div>
          <div style={{display:"flex",justifyContent:"center",gap:32}}>
            <div><div style={{fontFamily:"var(--font-mono)",fontSize:"1.5rem",fontWeight:800,color:"var(--caret)"}}>{wpm}</div><div style={{fontSize:"0.68rem",color:"var(--text-2)"}}>NET WPM</div></div>
            <div><div style={{fontFamily:"var(--font-mono)",fontSize:"1.5rem",fontWeight:800,color:"var(--correct)"}}>{accuracy}%</div><div style={{fontSize:"0.68rem",color:"var(--text-2)"}}>ACCURACY</div></div>
          </div>
          <div style={{marginTop:14,fontSize:"0.72rem",color:"var(--text-muted)"}}>{today}</div>
        </div>

        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={downloadCertificate}>
            ⬇ Download Certificate (.png)
          </button>
        </div>
        <canvas ref={canvasRef} style={{display:"none"}} />
      </div>
    </div>
  );
}
