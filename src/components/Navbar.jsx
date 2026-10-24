import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import AuthModal from "./AuthModal";

const THEMES = [
  { id:"dark",      label:"Dark Mechanical", icon:"⬛" },
  { id:"cyberpunk", label:"Cyberpunk Neon",  icon:"🟦" },
  { id:"retro",     label:"Retro Matrix",    icon:"🟩" },
  { id:"candy",     label:"Pastel Candy",    icon:"🟪" },
];
const SOUND_PROFILES = [
  { id:"thock",   label:"Gateron Ink Thock" },
  { id:"clicky",  label:"Cherry Blue Clicky" },
  { id:"bubble",  label:"Bubble Pop 🫧" },
];

export default function Navbar() {
  const {
    soundEnabled, fingerZonesEnabled, toggleSound, toggleFingerZones,
    soundProfile, soundVolume, theme,
    setSoundProfile, setSoundVolume, setTheme,
    user, logout,
  } = useAppStore();

  const [authOpen,    setAuthOpen]    = useState(false);
  const [soundPopup,  setSoundPopup]  = useState(false);
  const [themePopup,  setThemePopup]  = useState(false);
  const [userPopup,   setUserPopup]   = useState(false);

  const closeAll = () => { setSoundPopup(false); setThemePopup(false); setUserPopup(false); };

  return (
    <>
      <nav className="navbar">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="brand-icon">TF</div>
          <span className="brand-name">TypeForge</span>
          <span className="brand-tag">v2.0</span>
        </div>

        {/* Nav Links */}
        <div className="nav-links">
          {[["Practice", "/"], ["Lessons", "/lessons"], ["☄️ Arcade", "/game"], ["Daily", "/daily"],
            ["Music", "/music"], ["Stats", "/stats"], ["Achievements", "/achievements"],
            ["Leaderboard", "/leaderboard"]
          ].map(([label, to]) => (
            <NavLink key={to} to={to} end={to === "/"}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >{label}</NavLink>
          ))}
        </div>

        {/* Actions */}
        <div className="nav-actions" style={{position:"relative"}}>

          {/* Sound profile & volume */}
          <div style={{position:"relative"}}>
            <button className={`btn btn-ghost${soundEnabled?" active":""}`}
              onClick={() => { closeAll(); setSoundPopup(p => !p); }}
              title="Sound settings">
              {soundEnabled ? "🔊" : "🔇"}
            </button>
            {soundPopup && (
              <div onClick={e => e.stopPropagation()} style={{
                position:"absolute",top:"calc(100% + 8px)",right:0,zIndex:500,
                background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,
                padding:"14px 16px",width:230,boxShadow:"0 8px 24px rgba(0,0,0,0.5)"
              }}>
                <div style={{fontSize:"0.72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",color:"var(--text-2)",marginBottom:10}}>Sound Profile</div>
                {SOUND_PROFILES.map(p => (
                  <button key={p.id} className={`btn btn-ghost${soundProfile===p.id?" active":""}`}
                    style={{width:"100%",justifyContent:"flex-start",marginBottom:4,fontSize:"0.82rem"}}
                    onClick={() => setSoundProfile(p.id)}>
                    {p.label}
                  </button>
                ))}
                <div style={{marginTop:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.72rem",color:"var(--text-2)",marginBottom:6}}>
                    <span>Volume</span><span style={{fontFamily:"var(--font-mono)"}}>{Math.round(soundVolume*100)}%</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.05} value={soundVolume}
                    onChange={e => setSoundVolume(parseFloat(e.target.value))}
                    style={{width:"100%",accentColor:"var(--caret)"}}/>
                </div>
                <div style={{borderTop:"1px solid var(--border)",marginTop:12,paddingTop:10}}>
                  <button className={`btn btn-ghost${soundEnabled?" active":""}`}
                    style={{width:"100%",justifyContent:"flex-start",fontSize:"0.82rem"}}
                    onClick={toggleSound}>
                    {soundEnabled ? "🔊 Click Sounds ON" : "🔇 Click Sounds OFF"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Finger zones */}
          <button className={`btn btn-ghost${fingerZonesEnabled?" active":""}`}
            onClick={toggleFingerZones} title="Finger zone guides">
            ☝️
          </button>

          {/* Theme picker */}
          <div style={{position:"relative"}}>
            <button className="btn btn-ghost"
              onClick={() => { closeAll(); setThemePopup(p => !p); }}
              title="Theme">
              {THEMES.find(t=>t.id===theme)?.icon || "🎨"}
            </button>
            {themePopup && (
              <div onClick={e => e.stopPropagation()} style={{
                position:"absolute",top:"calc(100% + 8px)",right:0,zIndex:500,
                background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,
                padding:"12px",width:210,boxShadow:"0 8px 24px rgba(0,0,0,0.5)"
              }}>
                <div style={{fontSize:"0.72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",color:"var(--text-2)",marginBottom:10,paddingLeft:4}}>Theme</div>
                {THEMES.map(t => (
                  <button key={t.id} className={`btn btn-ghost${theme===t.id?" active":""}`}
                    style={{width:"100%",justifyContent:"flex-start",marginBottom:4,gap:10,fontSize:"0.83rem"}}
                    onClick={() => { setTheme(t.id); closeAll(); }}>
                    <span>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth */}
          {user ? (
            <div style={{position:"relative"}}>
              <button className="btn btn-ghost active" style={{gap:8}}
                onClick={() => { closeAll(); setUserPopup(p => !p); }}>
                <span style={{
                  width:24,height:24,borderRadius:"50%",background:"var(--caret)",
                  color:"#141418",display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:"0.7rem",fontWeight:800
                }}>{user.username?.[0]?.toUpperCase()}</span>
                {user.username}
              </button>
              {userPopup && (
                <div onClick={e => e.stopPropagation()} style={{
                  position:"absolute",top:"calc(100% + 8px)",right:0,zIndex:500,
                  background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,
                  padding:"12px",width:190,boxShadow:"0 8px 24px rgba(0,0,0,0.5)"
                }}>
                  <div style={{padding:"4px 8px 10px",fontSize:"0.78rem",color:"var(--text-2)",borderBottom:"1px solid var(--border)",marginBottom:8}}>
                    <div style={{fontWeight:700,color:"var(--text)"}}>@{user.username}</div>
                    <div style={{marginTop:2}}>{user.email}</div>
                  </div>
                  <button className="btn btn-ghost" style={{width:"100%",justifyContent:"flex-start",fontSize:"0.83rem",color:"var(--incorrect)"}}
                    onClick={() => { logout(); closeAll(); }}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-primary" style={{gap:7}} onClick={() => { closeAll(); setAuthOpen(true); }}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Close popups on backdrop click */}
      {(soundPopup || themePopup || userPopup) && (
        <div style={{position:"fixed",inset:0,zIndex:490}} onClick={closeAll}/>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
