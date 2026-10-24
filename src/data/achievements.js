export const ACHIEVEMENTS = [
  { id: "first_key",    icon: "⌨️",  title: "First Keystroke",    desc: "Complete your very first typing session.",    check: (s) => s.totalSessions >= 1 },
  { id: "speed_demon",  icon: "🔥",  title: "Speed Demon",        desc: "Reach 60 WPM in any session.",               check: (s) => s.bestWpm >= 60 },
  { id: "lightning",    icon: "⚡",  title: "Lightning Fingers",  desc: "Reach 100 WPM in any session.",              check: (s) => s.bestWpm >= 100 },
  { id: "perfect",      icon: "💎",  title: "Perfectionist",      desc: "Achieve 100% accuracy in any session.",      check: (s) => s.bestAccuracy >= 100 },
  { id: "iron_wrists",  icon: "🏋️", title: "Iron Wrists",        desc: "Complete 50 typing sessions.",               check: (s) => s.totalSessions >= 50 },
  { id: "streak_lord",  icon: "🎯",  title: "Streak Lord",        desc: "Reach a 20-key correct streak.",             check: (s) => s.bestStreak >= 20 },
  { id: "daily_dev",    icon: "📅",  title: "Daily Devotee",      desc: "Complete 7 daily challenges.",               check: (s) => s.dailyCompleted >= 7 },
  { id: "lesson_master",icon: "🎓",  title: "Lesson Master",      desc: "Complete all 7 lesson tiers.",               check: (s) => s.lessonTiersCompleted >= 7 },
  { id: "custom_text",  icon: "✍️",  title: "Author Mode",        desc: "Practice with your own custom text.",        check: (s) => s.customTextSessions >= 1 },
  { id: "kid_mode",     icon: "🎵",  title: "Music Maestro",      desc: "Complete a music game session.",             check: (s) => s.musicGameSessions >= 1 },
  { id: "composer",     icon: "🎼",  title: "Composer",           desc: "Type 500 correct chars in one session.",     check: (s) => s.maxCorrectChars >= 500 },
  { id: "century",      icon: "💯",  title: "Century Club",       desc: "Sustain 100 WPM across 3+ sessions.",        check: (s) => s.sessionsAt100wpm >= 3 },
];
