import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import AchievementToast from "./components/AchievementToast";
import Practice from "./pages/Practice";
import Lessons from "./pages/Lessons";
import Daily from "./pages/Daily";
import Music from "./pages/Music";
import Stats from "./pages/Stats";
import Achievements from "./pages/Achievements";
import Leaderboard from "./pages/Leaderboard";
import MeteorDefense from "./pages/MeteorDefense";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/"            element={<Practice />} />
        <Route path="/lessons"     element={<Lessons />} />
        <Route path="/game"        element={<MeteorDefense />} />
        <Route path="/daily"       element={<Daily />} />
        <Route path="/music"       element={<Music />} />
        <Route path="/stats"       element={<Stats />} />
        <Route path="/achievements"element={<Achievements />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
      <AchievementToast />
    </div>
  );
}
