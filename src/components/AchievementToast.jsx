import { useEffect } from "react";
import { useAppStore } from "../store/appStore";

export default function AchievementToast() {
  const newAchievement = useAppStore(s => s.newAchievement);
  const clearNewAchievement = useAppStore(s => s.clearNewAchievement);

  useEffect(() => {
    if (newAchievement) {
      const t = setTimeout(clearNewAchievement, 4000);
      return () => clearTimeout(t);
    }
  }, [newAchievement, clearNewAchievement]);

  if (!newAchievement) return null;

  return (
    <div className="ach-toast">
      <span className="ach-toast-icon">{newAchievement.icon}</span>
      <div>
        <div className="ach-toast-title">🏆 Achievement Unlocked!</div>
        <div className="ach-toast-name">{newAchievement.title}</div>
        <div style={{ fontSize:"0.72rem", color:"var(--text-2)", marginTop:"3px" }}>{newAchievement.desc}</div>
      </div>
    </div>
  );
}
