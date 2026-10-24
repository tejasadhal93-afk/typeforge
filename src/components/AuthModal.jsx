import { useState } from "react";
import { useAppStore } from "../store/appStore";

export default function AuthModal({ open, onClose }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ username:"", email:"", password:"" });
  const { login, register, authLoading, authError, clearAuthError } = useAppStore();

  const change = (e) => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); clearAuthError(); };

  const submit = async (e) => {
    e.preventDefault();
    const result = tab === "login"
      ? await login(form.email, form.password)
      : await register(form.username, form.email, form.password);
    if (result.ok) onClose();
  };

  if (!open) return null;

  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(10,10,14,0.85)",backdropFilter:"blur(6px)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:20
    }} onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{
        background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,
        width:"100%",maxWidth:400,padding:"30px 28px",boxShadow:"0 20px 60px rgba(0,0,0,0.7)"
      }}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <h2 style={{fontSize:"1.3rem",fontWeight:800}}>
            {tab === "login" ? "Welcome back" : "Create account"}
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{padding:"4px 10px",fontSize:"1rem",lineHeight:1}}>×</button>
        </div>

        {/* Tabs */}
        <div className="pill-group" style={{marginBottom:24}}>
          <button className={`pill ${tab==="login"?"active":""}`} onClick={() => { setTab("login"); clearAuthError(); }}>Sign In</button>
          <button className={`pill ${tab==="register"?"active":""}`} onClick={() => { setTab("register"); clearAuthError(); }}>Create Account</button>
        </div>

        {/* Error banner */}
        {authError && (
          <div style={{background:"rgba(255,93,93,0.12)",border:"1px solid rgba(255,93,93,0.35)",borderRadius:8,
            padding:"10px 14px",fontSize:"0.83rem",color:"var(--incorrect)",marginBottom:16}}>
            ⚠️ {authError}
          </div>
        )}

        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
          {tab === "register" && (
            <div>
              <label style={{fontSize:"0.78rem",fontWeight:600,color:"var(--text-2)",display:"block",marginBottom:6}}>Username</label>
              <input name="username" value={form.username} onChange={change} required
                placeholder="e.g. swift_typist" autoComplete="username"
                style={{width:"100%",padding:"10px 14px",background:"var(--bg)",border:"1px solid var(--border)",
                  borderRadius:8,color:"var(--text)",fontFamily:"var(--font-sans)",fontSize:"0.95rem",outline:"none"}}
              />
            </div>
          )}
          <div>
            <label style={{fontSize:"0.78rem",fontWeight:600,color:"var(--text-2)",display:"block",marginBottom:6}}>Email</label>
            <input name="email" type="email" value={form.email} onChange={change} required
              placeholder="you@example.com" autoComplete="email"
              style={{width:"100%",padding:"10px 14px",background:"var(--bg)",border:"1px solid var(--border)",
                borderRadius:8,color:"var(--text)",fontFamily:"var(--font-sans)",fontSize:"0.95rem",outline:"none"}}
            />
          </div>
          <div>
            <label style={{fontSize:"0.78rem",fontWeight:600,color:"var(--text-2)",display:"block",marginBottom:6}}>Password</label>
            <input name="password" type="password" value={form.password} onChange={change} required
              placeholder={tab==="register" ? "At least 6 characters" : "Your password"}
              autoComplete={tab==="login" ? "current-password" : "new-password"}
              style={{width:"100%",padding:"10px 14px",background:"var(--bg)",border:"1px solid var(--border)",
                borderRadius:8,color:"var(--text)",fontFamily:"var(--font-sans)",fontSize:"0.95rem",outline:"none"}}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{width:"100%",padding:"12px",marginTop:4,justifyContent:"center"}}
            disabled={authLoading}>
            {authLoading ? "Please wait…" : tab === "login" ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        <p style={{marginTop:18,fontSize:"0.76rem",color:"var(--text-muted)",textAlign:"center"}}>
          Your sessions sync to the cloud when signed in. Guest mode always works offline.
        </p>
      </div>
    </div>
  );
}
