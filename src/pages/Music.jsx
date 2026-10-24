import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../store/appStore";

const WORD_SETS = {
  animals: {
    icon: "🐾", label: "Animal Friends", color: "#FF6B9D",
    emojis: ["🐱","🐶","🐸","🦆","🐻","🦁","🐺","🦊","🦉","🐮","🐷","🐝","🦋","🐙","🦄"],
    words: ["cat","dog","fish","bird","frog","duck","bear","lion","wolf","deer","fox","owl","cow","pig","hen","bee","ant","bat","crab","seal","pony","lamb","goat","mole","vole","wren"]
  },
  fruits: {
    icon: "🍎", label: "Yummy Fruits", color: "#FF8C42",
    emojis: ["🍎","🥭","🍇","lemon","🍑","🍒","🍊","🍌","🥝","🍓","🍐","🥥"],
    words: ["apple","mango","grape","lemon","peach","plum","lime","pear","kiwi","fig","date","melon","guava","papaya","cherry","berry","olive","orange","banana","coconut"]
  },
  colors: {
    icon: "🌈", label: "Rainbow Colors", color: "#6C63FF",
    emojis: ["🔴","🔵","🟢","🟡","🟠","🟣","⚫","⚪","🌈"],
    words: ["red","blue","green","pink","gold","teal","navy","lime","cyan","rose","amber","coral","ivory","indigo","violet","scarlet","jade","silver","maroon"]
  },
  space: {
    icon: "🚀", label: "Outer Space", color: "#4FC3F7",
    emojis: ["⭐","🌙","☀️","🚀","🌍","🪐","☄️","🌌","👨‍🚀","🛸"],
    words: ["star","moon","sun","mars","cloud","orbit","comet","planet","nebula","galaxy","rocket","meteor","saturn","venus","earth","pluto","apollo","cosmos","aurora","gravity"]
  },
  magic: {
    icon: "✨", label: "Magic Spell", color: "#FFD700",
    emojis: ["✨","🧙","🧚","🐉","🏰","🌟","💫","🔮","🪄","🎇"],
    words: ["magic","spell","wand","fairy","elf","genie","wish","dream","castle","dragon","wizard","potion","crystal","rainbow","wonder","sparkle","glitter","shimmer","twinkle"]
  }
};

const NOTE_SCALE = [
  261.63, 293.66, 329.63, 392.00, 440.00,   // C4 D4 E4 G4 A4
  523.25, 587.33, 659.25, 783.99, 880.00,   // C5 D5 E5 G5 A5
  1046.50, 1174.66, 1318.51                  // C6 D6 E6
];

export default function Music() {
  const saveSession = useAppStore(s => s.saveSession);
  const soundEnabled = useAppStore(s => s.soundEnabled);

  const [category, setCategory] = useState("animals");
  const [gameState, setGameState] = useState("ready"); // ready | playing | finished
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completedWords, setCompletedWords] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentWord, setCurrentWord] = useState("cat");
  const [typedChars, setTypedChars] = useState([]);
  const [particles, setParticles] = useState([]);
  const [banner, setBanner] = useState(null);
  const [shake, setShake] = useState(false);

  const audioCtxRef = useRef(null);
  const noteIdxRef = useRef(0);
  const timerRef = useRef(null);
  const wordsQueueRef = useRef([]);

  const wordSet = WORD_SETS[category];

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtxRef.current = new AC();
    }
    if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const playNote = useCallback((freq, duration = 0.2, vol = 0.22, isError = false) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isError ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.05);
    } catch {}
  }, [soundEnabled, getAudioCtx]);

  const playChime = useCallback(() => {
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      setTimeout(() => playNote(f, 0.28, 0.2), i * 60);
    });
  }, [playNote]);

  const spawnParticle = (text, color, isConfetti = false) => {
    const id = Date.now() + Math.random();
    const p = {
      id,
      text,
      color,
      left: 15 + Math.random() * 70,
      size: isConfetti ? 1.4 : 1.8,
      duration: isConfetti ? 1.2 : 0.9,
    };
    setParticles(prev => [...prev.slice(-12), p]);
    setTimeout(() => {
      setParticles(prev => prev.filter(x => x.id !== id));
    }, p.duration * 1000);
  };

  const getNextWord = useCallback(() => {
    if (wordsQueueRef.current.length === 0) {
      wordsQueueRef.current = [...wordSet.words].sort(() => Math.random() - 0.5);
    }
    return wordsQueueRef.current.pop() || "star";
  }, [wordSet]);

  const startGame = () => {
    wordsQueueRef.current = [...wordSet.words].sort(() => Math.random() - 0.5);
    const firstWord = wordsQueueRef.current.pop() || "cat";
    setCurrentWord(firstWord);
    setTypedChars([]);
    setScore(0);
    setStreak(0);
    setCompletedWords(0);
    setTimeLeft(60);
    setGameState("playing");
    setParticles([]);
  };

  // Timer
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setGameState("finished");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState]);

  // Session saving on finish
  useEffect(() => {
    if (gameState === "finished") {
      saveSession({
        mode: "music",
        label: `Music Game: ${wordSet.label}`,
        wpm: Math.round((completedWords * 4 / 60) * 12),
        accuracy: 95,
        duration: 60,
        errors: 0,
        correctChars: completedWords * 4,
      });
      playChime();
    }
  }, [gameState]);

  // Key handling
  useEffect(() => {
    const onKey = (e) => {
      if (gameState !== "playing") return;
      if (e.key.length !== 1 || e.key === " ") return;

      const idx = typedChars.length;
      if (idx >= currentWord.length) return;

      const expected = currentWord[idx];
      const isCorrect = e.key.toLowerCase() === expected.toLowerCase();

      if (isCorrect) {
        const nextTyped = [...typedChars, { ch: e.key, correct: true }];
        setTypedChars(nextTyped);
        setStreak(s => s + 1);
        setScore(s => s + 10 + Math.floor(streak / 5) * 5);

        const freq = NOTE_SCALE[noteIdxRef.current % NOTE_SCALE.length];
        noteIdxRef.current++;
        playNote(freq, 0.22, 0.22);
        spawnParticle("🎵", wordSet.color);

        // Word completed!
        if (nextTyped.length === currentWord.length) {
          playChime();
          setScore(s => s + 30);
          setCompletedWords(w => w + 1);
          setBanner("⭐ Awesome!");
          spawnParticle("🎉", "#FFD700", true);
          spawnParticle("✨", "#FF8C42", true);

          setTimeout(() => {
            setBanner(null);
            const nextW = getNextWord();
            setCurrentWord(nextW);
            setTypedChars([]);
          }, 450);
        }
      } else {
        setStreak(0);
        setShake(true);
        playNote(140, 0.18, 0.25, true);
        spawnParticle("❌", "#FF5D5D");
        setTimeout(() => setShake(false), 350);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameState, typedChars, currentWord, streak, wordSet, playNote, playChime, getNextWord]);

  const activeEmoji = wordSet.emojis[completedWords % wordSet.emojis.length];

  return (
    <div className="page-container" style={{ maxWidth: 840 }}>
      {/* Category selector */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginBottom: "20px" }}>
        {Object.entries(WORD_SETS).map(([k, set]) => (
          <button
            key={k}
            disabled={gameState === "playing"}
            onClick={() => setCategory(k)}
            className="pill"
            style={{
              padding: "8px 18px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "0.92rem",
              background: category === k ? set.color : "var(--surface)",
              color: category === k ? "#ffffff" : "var(--text-2)",
              borderColor: category === k ? set.color : "var(--border)",
              boxShadow: category === k ? `0 4px 14px ${set.color}40` : "none",
              transform: category === k ? "scale(1.04)" : "scale(1)",
              transition: "all 0.15s ease"
            }}
          >
            <span>{set.icon}</span>
            <span>{set.label}</span>
          </button>
        ))}
      </div>

      {/* Game Stage */}
      <div
        style={{
          position: "relative",
          background: "linear-gradient(160deg, #181828 0%, #152238 60%, #1a1a2e 100%)",
          border: `2px solid ${wordSet.color}40`,
          borderRadius: "18px",
          padding: "36px 24px",
          minHeight: 380,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          overflow: "hidden",
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), inset 0 0 40px ${wordSet.color}15`
        }}
      >
        {/* Floating Particles */}
        {particles.map(p => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.left}%`,
              bottom: "35%",
              fontSize: `${p.size}rem`,
              color: p.color,
              pointerEvents: "none",
              animation: "floatUp 0.9s ease-out forwards",
              zIndex: 10
            }}
          >
            {p.text}
          </div>
        ))}

        {gameState === "ready" && (
          <div style={{ textAlign: "center", zIndex: 5 }}>
            <div style={{ fontSize: "5rem", marginBottom: "12px", animation: "bounce 1.5s infinite" }}>
              {wordSet.icon}
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>
              {wordSet.label}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", maxWidth: 380, margin: "0 auto 24px" }}>
              Type each word to play musical notes. Faster combos unleash magical tunes!
            </p>
            <button
              onClick={startGame}
              className="btn btn-primary"
              style={{
                background: `linear-gradient(135deg, ${wordSet.color}, #FF8C42)`,
                border: "none",
                fontSize: "1.2rem",
                padding: "16px 48px",
                borderRadius: "50px",
                boxShadow: `0 8px 24px ${wordSet.color}60`,
                fontWeight: 800
              }}
            >
              Start Music Game 🎵
            </button>
          </div>
        )}

        {gameState === "playing" && (
          <>
            {/* Stats row */}
            <div style={{ display: "flex", gap: "24px", alignItems: "center", zIndex: 5 }}>
              <div style={{ textAlign: "center", background: "rgba(255,255,255,0.08)", padding: "8px 18px", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>Score</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.6rem", fontWeight: 800, color: "#FFD700" }}>{score}</div>
              </div>
              <div style={{ textAlign: "center", background: "rgba(255,255,255,0.08)", padding: "8px 18px", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>Streak</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.6rem", fontWeight: 800, color: "#FF8C42" }}>🔥 {streak}</div>
              </div>
              <div style={{ textAlign: "center", background: "rgba(255,255,255,0.08)", padding: "8px 18px", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>Time Left</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.6rem", fontWeight: 800, color: timeLeft <= 10 ? "#FF5D5D" : "#5FD97A" }}>{timeLeft}s</div>
              </div>
            </div>

            {/* Big Emoji Character */}
            <div style={{ fontSize: "4.5rem", userSelect: "none", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}>
              {activeEmoji}
            </div>

            {/* Word Banner alert */}
            <div style={{ height: "24px", fontWeight: 800, color: "#FFD700", fontSize: "1.2rem" }}>
              {banner || "\u00A0"}
            </div>

            {/* Target Word Letters */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "center",
                transform: shake ? "translateX(-6px)" : "none",
                transition: "transform 0.1s"
              }}
            >
              {currentWord.split("").map((ch, i) => {
                const isTyped = i < typedChars.length;
                const isCurrent = i === typedChars.length;
                return (
                  <span
                    key={i}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "3.2rem",
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: "8px",
                      color: isTyped ? "#5FD97A" : isCurrent ? "#fff" : "rgba(255,255,255,0.3)",
                      background: isCurrent ? "rgba(255,255,255,0.14)" : "transparent",
                      boxShadow: isCurrent ? `0 0 16px ${wordSet.color}` : "none",
                      borderBottom: isCurrent ? `4px solid ${wordSet.color}` : "4px solid transparent"
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>

            {/* Progress bar */}
            <div style={{ width: "100%", maxWidth: 360, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (completedWords / 20) * 100)}%`, height: "100%", background: wordSet.color, transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
              {completedWords} words completed
            </div>
          </>
        )}

        {gameState === "finished" && (
          <div style={{ textAlign: "center", zIndex: 5 }}>
            <div style={{ fontSize: "3rem", marginBottom: "8px" }}>
              {score >= 300 ? "⭐⭐⭐" : score >= 150 ? "⭐⭐" : "⭐"}
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#FFD700", marginBottom: "8px" }}>
              Concert Finished!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "20px" }}>
              You played {completedWords} melodies with a score of <strong>{score}</strong>!
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "24px" }}>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "12px 24px", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Final Score</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 800, color: "#FFD700" }}>{score}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "12px 24px", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Words Hit</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 800, color: "#5FD97A" }}>{completedWords}</div>
              </div>
            </div>
            <button
              onClick={startGame}
              className="btn btn-primary"
              style={{
                background: `linear-gradient(135deg, ${wordSet.color}, #6C63FF)`,
                padding: "14px 40px",
                borderRadius: "50px",
                fontSize: "1.05rem",
                fontWeight: 700
              }}
            >
              Play Again 🎵
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.9); opacity: 1; }
          100% { transform: translateY(-80px) scale(1.4); opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
