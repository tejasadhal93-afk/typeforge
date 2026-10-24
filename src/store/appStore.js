import { create } from "zustand";
import { ACHIEVEMENTS } from "../data/achievements";

const SESSIONS_KEY    = "tf_sessions";
const STATS_KEY       = "tf_stats";
const PROGRESS_KEY    = "tf_lesson_progress";
const ACHIEVEMENTS_KEY= "tf_achievements";
const AUTH_KEY        = "tf_auth";        // { token, user }
const SETTINGS_KEY    = "tf_settings";

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

const defaultStats = {
  totalSessions:0, bestWpm:0, bestAccuracy:0, avgWpm:0, avgAccuracy:100,
  totalTimeMinutes:0, bestStreak:0, maxCorrectChars:0, dailyCompleted:0,
  lessonTiersCompleted:0, customTextSessions:0, musicGameSessions:0, sessionsAt100wpm:0,
};

const defaultSettings = {
  soundEnabled: true, fingerZonesEnabled: true,
  soundProfile: "thock",   // thock | clicky | bubble
  soundVolume: 0.7,
  theme: "dark",           // dark | cyberpunk | retro | candy
  paceCarEnabled: false,
  targetPaceWpm: 60,
};

const savedSettings = loadJSON(SETTINGS_KEY, {});
const savedAuth     = loadJSON(AUTH_KEY, null);

// Apply theme to document on init
const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
};

export const useAppStore = create((set, get) => ({
  // Settings
  ...defaultSettings, ...savedSettings,

  // Auth
  token: savedAuth?.token || null,
  user:  savedAuth?.user  || null,
  authLoading: false,
  authError: null,

  // Data
  sessions:              loadJSON(SESSIONS_KEY, []),
  stats:                 { ...defaultStats, ...loadJSON(STATS_KEY, {}) },
  lessonProgress:        loadJSON(PROGRESS_KEY, {}),
  unlockedAchievements:  loadJSON(ACHIEVEMENTS_KEY, []),
  newAchievement: null,

  // ── Settings actions ──────────────────────────────────────────────────────
  updateSetting: (key, value) => set(s => {
    const next = { ...s, [key]: value };
    const settingsToSave = {
      soundEnabled: next.soundEnabled, fingerZonesEnabled: next.fingerZonesEnabled,
      soundProfile: next.soundProfile, soundVolume: next.soundVolume,
      theme: next.theme, paceCarEnabled: next.paceCarEnabled, targetPaceWpm: next.targetPaceWpm,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsToSave));
    if (key === "theme") applyTheme(value);
    return { [key]: value };
  }),
  toggleSound:        () => get().updateSetting("soundEnabled",      !get().soundEnabled),
  toggleFingerZones:  () => get().updateSetting("fingerZonesEnabled", !get().fingerZonesEnabled),
  togglePaceCar:      () => get().updateSetting("paceCarEnabled",    !get().paceCarEnabled),
  setSoundProfile:    (p) => get().updateSetting("soundProfile",     p),
  setSoundVolume:     (v) => get().updateSetting("soundVolume",      v),
  setTheme:           (t) => get().updateSetting("theme",            t),
  setTargetPaceWpm:   (w) => get().updateSetting("targetPaceWpm",    w),

  // ── Auth actions ──────────────────────────────────────────────────────────
  setAuthError: (msg) => set({ authError: msg }),
  clearAuthError: () => set({ authError: null }),

  register: async (username, email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      localStorage.setItem(AUTH_KEY, JSON.stringify({ token: data.token, user: data.user }));
      set({ token: data.token, user: data.user, authLoading: false });
      return { ok: true };
    } catch (err) {
      set({ authLoading: false, authError: err.message });
      return { ok: false, error: err.message };
    }
  },

  login: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem(AUTH_KEY, JSON.stringify({ token: data.token, user: data.user }));
      set({ token: data.token, user: data.user, authLoading: false });
      return { ok: true };
    } catch (err) {
      set({ authLoading: false, authError: err.message });
      return { ok: false, error: err.message };
    }
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
    set({ token: null, user: null });
  },

  // ── Session persistence ────────────────────────────────────────────────────
  saveSession: (session) => {
    const { sessions, stats, lessonProgress, unlockedAchievements, token } = get();

    const newSession = {
      id:           "s_" + Date.now(),
      date:         new Date().toISOString(),
      mode:         session.mode,
      label:        session.label || "Test",
      wpm:          Math.round(session.wpm),
      rawWpm:       Math.round(session.rawWpm || session.wpm),
      accuracy:     Math.round(session.accuracy * 10) / 10,
      duration:     Math.round(session.duration),
      errors:       session.errors || 0,
      correctChars: session.correctChars || 0,
      keyErrors:    session.keyErrors || {},
      streak:       session.streak || 0,
    };

    const allSessions = [newSession, ...sessions].slice(0, 100);
    const allWpms = allSessions.map(s => s.wpm);
    const avgWpm  = Math.round(allWpms.reduce((a, b) => a + b, 0) / allWpms.length);
    const allAcc  = allSessions.map(s => s.accuracy);
    const avgAcc  = Math.round((allAcc.reduce((a, b) => a + b, 0) / allAcc.length) * 10) / 10;

    const newStats = {
      ...stats,
      totalSessions:      stats.totalSessions + 1,
      bestWpm:            Math.max(stats.bestWpm, newSession.wpm),
      bestAccuracy:       Math.max(stats.bestAccuracy, newSession.accuracy),
      avgWpm, avgAccuracy: avgAcc,
      totalTimeMinutes:   Math.round((stats.totalTimeMinutes + session.duration / 60) * 10) / 10,
      bestStreak:         Math.max(stats.bestStreak, session.streak || 0),
      maxCorrectChars:    Math.max(stats.maxCorrectChars, session.correctChars || 0),
      dailyCompleted:     session.mode === "daily"  ? stats.dailyCompleted + 1  : stats.dailyCompleted,
      customTextSessions: session.mode === "custom" ? stats.customTextSessions + 1 : stats.customTextSessions,
      musicGameSessions:  session.mode === "music"  ? stats.musicGameSessions + 1  : stats.musicGameSessions,
      sessionsAt100wpm:   newSession.wpm >= 100     ? stats.sessionsAt100wpm + 1  : stats.sessionsAt100wpm,
    };

    // Lesson progress
    let newLessonProgress = { ...lessonProgress };
    if (session.mode === "lesson" && session.drillId) {
      const ex = newLessonProgress[session.drillId] || { bestWpm: 0, completedCount: 0 };
      newLessonProgress[session.drillId] = {
        bestWpm:       Math.max(ex.bestWpm, newSession.wpm),
        bestAccuracy:  Math.max(ex.bestAccuracy || 0, newSession.accuracy),
        completedCount: ex.completedCount + 1,
      };
      const tiersCompleted = new Set(Object.keys(newLessonProgress).map(id => id.split("-")[0])).size;
      newStats.lessonTiersCompleted = tiersCompleted;
    }

    // Check achievements
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach(ach => {
      if (!unlockedAchievements.includes(ach.id) && ach.check(newStats)) {
        newlyUnlocked.push(ach.id);
      }
    });
    const allUnlocked = [...unlockedAchievements, ...newlyUnlocked];

    localStorage.setItem(SESSIONS_KEY,    JSON.stringify(allSessions));
    localStorage.setItem(STATS_KEY,       JSON.stringify(newStats));
    localStorage.setItem(PROGRESS_KEY,    JSON.stringify(newLessonProgress));
    localStorage.setItem(ACHIEVEMENTS_KEY,JSON.stringify(allUnlocked));

    set({
      sessions: allSessions, stats: newStats,
      lessonProgress: newLessonProgress,
      unlockedAchievements: allUnlocked,
      newAchievement: newlyUnlocked.length > 0
        ? ACHIEVEMENTS.find(a => a.id === newlyUnlocked[0]) : null,
    });

    // Cloud sync (fire-and-forget) — only when authenticated
    if (token) {
      fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newSession),
      }).catch(() => {}); // Silently ignore network failures
    }

    return newSession;
  },

  clearNewAchievement: () => set({ newAchievement: null }),

  clearHistory: () => {
    [SESSIONS_KEY, STATS_KEY, PROGRESS_KEY, ACHIEVEMENTS_KEY].forEach(k => localStorage.removeItem(k));
    set({ sessions: [], stats: { ...defaultStats }, lessonProgress: {}, unlockedAchievements: [] });
  },
}));

// Apply theme on app load
applyTheme(loadJSON(SETTINGS_KEY, {}).theme || "dark");
