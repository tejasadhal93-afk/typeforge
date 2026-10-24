import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../store/appStore";
import { wordbank } from "../data/wordbank";

// Sound effects generator via Web Audio API
class DefenseAudio {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }
  laser(freq = 880) {
    this.init(); if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + 0.13);
    } catch {}
  }
  explosion() {
    this.init(); if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.4), this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.25));
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const flt = this.ctx.createBiquadFilter();
      flt.type = "lowpass"; flt.frequency.value = 350;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      src.connect(flt); flt.connect(gain); gain.connect(this.ctx.destination);
      src.start(t);
    } catch {}
  }
  shieldHit() {
    this.init(); if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.25);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + 0.26);
    } catch {}
  }
  powerUp() {
    this.init(); if (!this.ctx) return;
    try {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const t = this.ctx.currentTime + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine"; osc.frequency.value = f;
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.21);
      });
    } catch {}
  }
}

const audio = new DefenseAudio();

export default function MeteorDefense() {
  const saveSession = useAppStore(s => s.saveSession);
  const soundEnabled = useAppStore(s => s.soundEnabled);

  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState("ready"); // ready | playing | paused | gameover
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem("tf_defense_highscore") || "0", 10); } catch { return 0; }
  });
  const [wave, setWave] = useState(1);
  const [shields, setShields] = useState(5);
  const [streak, setStreak] = useState(0);
  const [destroyedCount, setDestroyedCount] = useState(0);
  const [difficulty, setDifficulty] = useState("normal"); // easy | normal | hard
  const [banner, setBanner] = useState(null);

  // References for mutable game loop state
  const stateRef = useRef({
    meteors: [],
    lasers: [],
    particles: [],
    stars: [],
    targetIndex: null, // index of meteor currently locked on
    typedProgress: 0,  // number of characters typed in target meteor
    shields: 5,
    score: 0,
    streak: 0,
    destroyedCount: 0,
    wave: 1,
    freezeUntil: 0,
    shake: 0,
    lastSpawn: 0,
    waveSpawned: 0,
    waveTotal: 10,
    active: false,
    wordsTypedCount: 0,
  });

  // Categorize wordbank by length
  const wordsByLen = useRef({
    short: wordbank.filter(w => w.length >= 3 && w.length <= 4),
    medium: wordbank.filter(w => w.length >= 5 && w.length <= 6),
    long: wordbank.filter(w => w.length >= 7),
  });

  const getRandomWord = useCallback((waveNum) => {
    // Special powerups chance (5%)
    const roll = Math.random();
    if (roll < 0.04) return { text: "NUKE", type: "nuke" };
    if (roll < 0.08) return { text: "FREEZE", type: "freeze" };
    if (roll < 0.12 && stateRef.current.shields < 5) return { text: "SHIELD", type: "shield" };

    const pool = waveNum <= 2
      ? wordsByLen.current.short
      : waveNum <= 5
        ? (Math.random() > 0.4 ? wordsByLen.current.medium : wordsByLen.current.short)
        : (Math.random() > 0.5 ? wordsByLen.current.long : wordsByLen.current.medium);

    const word = pool[Math.floor(Math.random() * pool.length)] || "meteor";
    return { text: word.toLowerCase(), type: "normal" };
  }, []);

  // Initialize stars once
  const initStars = (width, height) => {
    const stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.3 + 0.1,
      });
    }
    stateRef.current.stars = stars;
  };

  // Start new game
  const startGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    stateRef.current = {
      meteors: [],
      lasers: [],
      particles: [],
      stars: stateRef.current.stars.length ? stateRef.current.stars : [],
      targetIndex: null,
      typedProgress: 0,
      shields: 5,
      score: 0,
      streak: 0,
      destroyedCount: 0,
      wave: 1,
      freezeUntil: 0,
      shake: 0,
      lastSpawn: Date.now(),
      waveSpawned: 0,
      waveTotal: 8 + 3,
      active: true,
      wordsTypedCount: 0,
    };

    setScore(0);
    setShields(5);
    setWave(1);
    setStreak(0);
    setDestroyedCount(0);
    setGameState("playing");
    setBanner("WAVE 1 — INCOMING METEORS!");
    setTimeout(() => setBanner(null), 1800);
  };

  // Next wave
  const nextWave = (currentWave) => {
    const newWave = currentWave + 1;
    stateRef.current.wave = newWave;
    stateRef.current.waveSpawned = 0;
    stateRef.current.waveTotal = 8 + newWave * 3;
    setWave(newWave);
    setBanner(`WAVE ${newWave} CLEARED! BONUS +${newWave * 100} PTS`);
    stateRef.current.score += newWave * 100;
    setScore(stateRef.current.score);
    if (soundEnabled) audio.powerUp();
    setTimeout(() => setBanner(null), 2000);
  };

  // Handle game over
  const triggerGameOver = () => {
    stateRef.current.active = false;
    setGameState("gameover");
    const finalScore = stateRef.current.score;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      try { localStorage.setItem("tf_defense_highscore", finalScore.toString()); } catch {}
    }

    // Save session in TypeForge history
    saveSession({
      mode: "time-trial",
      label: `Meteor Defense (Wave ${stateRef.current.wave})`,
      wpm: Math.round(stateRef.current.wordsTypedCount * 5),
      rawWpm: Math.round(stateRef.current.wordsTypedCount * 5),
      accuracy: 94,
      duration: 60,
      errors: 5 - stateRef.current.shields,
      correctChars: stateRef.current.destroyedCount * 5,
    });
  };

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Resize handling
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      if (!stateRef.current.stars.length) initStars(rect.width, rect.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let animId;
    const loop = () => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const S = stateRef.current;

      // Clear with dark void
      ctx.save();
      if (S.shake > 0) {
        const dx = (Math.random() - 0.5) * S.shake * 12;
        const dy = (Math.random() - 0.5) * S.shake * 12;
        ctx.translate(dx, dy);
        S.shake *= 0.88;
        if (S.shake < 0.05) S.shake = 0;
      }

      ctx.fillStyle = "#0c0d14";
      ctx.fillRect(0, 0, W, H);

      // Starfield
      S.stars.forEach(st => {
        st.y += st.speed;
        if (st.y > H) { st.y = 0; st.x = Math.random() * W; }
        ctx.fillStyle = `rgba(255,255,255,${st.alpha})`;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // City / Defense Dome Skyline at bottom
      const domeY = H - 38;
      ctx.fillStyle = "rgba(255,179,71,0.06)";
      ctx.fillRect(0, domeY, W, 38);

      // Defense laser base
      const turretX = W / 2;
      const turretY = H - 24;
      ctx.fillStyle = "#32323e";
      ctx.beginPath();
      ctx.arc(turretX, turretY, 26, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = "var(--caret)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shield line with glow
      const shieldGlow = S.shields > 2 ? "rgba(95,217,122,0.6)" : "rgba(255,93,93,0.7)";
      ctx.strokeStyle = shieldGlow;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, domeY);
      ctx.lineTo(W, domeY);
      ctx.stroke();

      if (S.active) {
        const now = Date.now();
        const isFrozen = now < S.freezeUntil;

        // Spawn Meteors
        const spawnInterval = difficulty === "easy" ? 2800 : difficulty === "hard" ? 1700 : 2200;
        const speedMultiplier = (difficulty === "easy" ? 0.7 : difficulty === "hard" ? 1.3 : 1.0) * (1 + (S.wave - 1) * 0.12);

        if (S.waveSpawned < S.waveTotal && now - S.lastSpawn > spawnInterval && !isFrozen) {
          const { text, type } = getRandomWord(S.wave);
          const x = 70 + Math.random() * (W - 140);
          S.meteors.push({
            id: Math.random(),
            x,
            y: -20,
            speed: (0.45 + Math.random() * 0.35) * speedMultiplier,
            text,
            type,
            radius: type === "normal" ? 22 : 28,
            color: type === "nuke" ? "#FF8C42" : type === "freeze" ? "#00F0FF" : type === "shield" ? "#5FD97A" : "#e07a5f",
          });
          S.lastSpawn = now;
          S.waveSpawned++;
        }

        // Update & Render Meteors
        for (let i = S.meteors.length - 1; i >= 0; i--) {
          const m = S.meteors[i];
          if (!isFrozen) m.y += m.speed;

          const isTarget = S.targetIndex === i;

          // Smoke/fire trail particles
          if (Math.random() < 0.4 && !isFrozen) {
            S.particles.push({
              x: m.x + (Math.random() - 0.5) * 10,
              y: m.y - 10,
              vx: (Math.random() - 0.5) * 0.6,
              vy: -Math.random() * 1.5,
              alpha: 0.6,
              color: m.color,
              size: Math.random() * 3 + 2,
            });
          }

          // Meteor body
          ctx.save();
          ctx.translate(m.x, m.y);

          // Meteor glow
          const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, m.radius);
          grad.addColorStop(0, "#fff");
          grad.addColorStop(0.4, m.color);
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
          ctx.fill();

          // Target reticle
          if (isTarget) {
            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, m.radius + 8, 0, Math.PI * 2);
            ctx.stroke();

            // Aim laser turret towards targeted meteor
            ctx.restore();
            ctx.save();
            ctx.strokeStyle = "rgba(255,215,0,0.5)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(turretX, turretY);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
            ctx.save();
            ctx.translate(m.x, m.y);
          }

          // Word Display
          const textY = m.radius + 18;
          ctx.font = "bold 15px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";

          // Word background pill
          const textW = ctx.measureText(m.text).width + 16;
          ctx.fillStyle = isTarget ? "rgba(20,20,30,0.9)" : "rgba(0,0,0,0.7)";
          ctx.fillRect(-textW / 2, textY - 14, textW, 20);
          ctx.strokeStyle = isTarget ? "#FFD700" : "rgba(255,255,255,0.2)";
          ctx.lineWidth = 1;
          ctx.strokeRect(-textW / 2, textY - 14, textW, 20);

          // Highlight typed characters vs untyped
          if (isTarget) {
            const typed = m.text.slice(0, S.typedProgress);
            const untyped = m.text.slice(S.typedProgress);
            const totalWidth = ctx.measureText(m.text).width;
            let startX = -totalWidth / 2;

            // Typed (green)
            ctx.fillStyle = "#5FD97A";
            ctx.textAlign = "left";
            ctx.fillText(typed, startX, textY);
            startX += ctx.measureText(typed).width;

            // Untyped (white)
            ctx.fillStyle = "#EDEDF0";
            ctx.fillText(untyped, startX, textY);
          } else {
            ctx.fillStyle = m.type === "normal" ? "#EDEDF0" : m.color;
            ctx.fillText(m.text, 0, textY);
          }

          ctx.restore();

          // Check ground collision
          if (m.y >= domeY) {
            S.meteors.splice(i, 1);
            if (S.targetIndex === i) {
              S.targetIndex = null;
              S.typedProgress = 0;
            } else if (S.targetIndex > i) {
              S.targetIndex--;
            }

            S.shields--;
            S.streak = 0;
            S.shake = 1.0;
            setShields(S.shields);
            setStreak(0);
            if (soundEnabled) audio.shieldHit();

            // Collision explosion
            for (let p = 0; p < 25; p++) {
              S.particles.push({
                x: m.x,
                y: domeY,
                vx: (Math.random() - 0.5) * 6,
                vy: -Math.random() * 5 - 1,
                alpha: 1,
                color: "#FF5D5D",
                size: Math.random() * 4 + 2,
              });
            }

            if (S.shields <= 0) {
              triggerGameOver();
              break;
            }
          }
        }

        // Check wave complete
        if (S.waveSpawned >= S.waveTotal && S.meteors.length === 0) {
          nextWave(S.wave);
        }

        // Lasers animation
        for (let l = S.lasers.length - 1; l >= 0; l--) {
          const lz = S.lasers[l];
          lz.progress += 0.25;
          if (lz.progress >= 1) {
            S.lasers.splice(l, 1);
          } else {
            const curX = lz.x1 + (lz.x2 - lz.x1) * lz.progress;
            const curY = lz.y1 + (lz.y2 - lz.y1) * lz.progress;
            ctx.strokeStyle = lz.color || "#00F0FF";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(lz.x1, lz.y1);
            ctx.lineTo(curX, curY);
            ctx.stroke();
          }
        }

        // Particles animation
        for (let p = S.particles.length - 1; p >= 0; p--) {
          const pt = S.particles[p];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.alpha -= 0.02;
          if (pt.alpha <= 0) {
            S.particles.splice(p, 1);
          } else {
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = Math.max(0, pt.alpha);
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [difficulty, soundEnabled]);

  // Handle keystroke for typing defense words
  const handleKey = useCallback((e) => {
    if (gameState !== "playing") return;
    if (e.key === "Escape") {
      setGameState(s => s === "paused" ? "playing" : "paused");
      return;
    }
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

    const S = stateRef.current;
    const char = e.key.toLowerCase();
    const canvas = canvasRef.current;
    const rect = canvas ? canvas.getBoundingClientRect() : { width: 800, height: 600 };
    const turretX = rect.width / 2;
    const turretY = rect.height - 24;

    // If no meteor is currently targeted, find one that starts with this char
    if (S.targetIndex === null || S.targetIndex >= S.meteors.length) {
      // Pick meteor lowest on the screen (highest y) matching first char
      let bestIdx = null;
      let maxY = -999;
      for (let i = 0; i < S.meteors.length; i++) {
        if (S.meteors[i].text[0] === char && S.meteors[i].y > maxY) {
          maxY = S.meteors[i].y;
          bestIdx = i;
        }
      }

      if (bestIdx !== null) {
        S.targetIndex = bestIdx;
        S.typedProgress = 1;
        const targetMeteor = S.meteors[bestIdx];

        // Shoot laser
        S.lasers.push({
          x1: turretX, y1: turretY,
          x2: targetMeteor.x, y2: targetMeteor.y,
          progress: 0,
          color: targetMeteor.color,
        });
        if (soundEnabled) audio.laser(700);

        // Check if 1-letter word completed (unlikely, but safe)
        if (S.typedProgress >= targetMeteor.text.length) {
          destroyMeteor(bestIdx);
        }
      }
    } else {
      // Meteor is already targeted, check next letter
      const targetMeteor = S.meteors[S.targetIndex];
      const expectedChar = targetMeteor.text[S.typedProgress];

      if (char === expectedChar) {
        S.typedProgress++;
        // Shoot laser
        S.lasers.push({
          x1: turretX, y1: turretY,
          x2: targetMeteor.x, y2: targetMeteor.y,
          progress: 0,
          color: targetMeteor.color,
        });
        if (soundEnabled) audio.laser(700 + S.typedProgress * 60);

        // Word completed!
        if (S.typedProgress >= targetMeteor.text.length) {
          destroyMeteor(S.targetIndex);
        }
      } else {
        // Mistake drops streak
        S.streak = 0;
        setStreak(0);
      }
    }
  }, [gameState, soundEnabled]);

  const destroyMeteor = (index) => {
    const S = stateRef.current;
    if (index >= S.meteors.length) return;
    const m = S.meteors[index];

    // Score points: base + length + streak
    S.streak++;
    const bonus = Math.floor(S.streak / 3) * 15;
    const pts = (m.text.length * 20) + bonus;
    S.score += pts;
    S.destroyedCount++;
    S.wordsTypedCount++;

    setScore(S.score);
    setStreak(S.streak);
    setDestroyedCount(S.destroyedCount);

    if (soundEnabled) audio.explosion();

    // Power-up triggers
    if (m.type === "nuke") {
      setBanner("💣 NUKE BLAST! ALL METEORS CLEARED!");
      setTimeout(() => setBanner(null), 1500);
      if (soundEnabled) audio.powerUp();
      S.score += S.meteors.length * 40;
      setScore(S.score);
      // Explode all
      S.meteors.forEach(rem => {
        for (let p = 0; p < 20; p++) {
          S.particles.push({
            x: rem.x, y: rem.y,
            vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
            alpha: 1, color: rem.color, size: Math.random() * 4 + 2,
          });
        }
      });
      S.meteors = [];
      S.targetIndex = null;
      S.typedProgress = 0;
      return;
    } else if (m.type === "freeze") {
      S.freezeUntil = Date.now() + 5000;
      setBanner("❄️ EMP PULSE! METEORS FROZEN FOR 5 SECONDS!");
      setTimeout(() => setBanner(null), 1500);
      if (soundEnabled) audio.powerUp();
    } else if (m.type === "shield") {
      S.shields = Math.min(5, S.shields + 1);
      setShields(S.shields);
      setBanner("🛡️ SHIELD REPAIRED (+1 SHIELD)!");
      setTimeout(() => setBanner(null), 1500);
      if (soundEnabled) audio.powerUp();
    }

    // Spawn explosion particles
    for (let p = 0; p < 25; p++) {
      S.particles.push({
        x: m.x,
        y: m.y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        alpha: 1,
        color: m.color,
        size: Math.random() * 4 + 2,
      });
    }

    // Remove destroyed meteor & reset targeting
    S.meteors.splice(index, 1);
    S.targetIndex = null;
    S.typedProgress = 0;
  };

  // Keyboard listener
  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div className="page-container" style={{ maxWidth: 940 }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
            <span>☄️</span> Meteor Defense
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-2)", marginTop: 2 }}>
            Type words to fire anti-orbital lasers and defend the city!
          </p>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>High Score</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 800, color: "var(--caret)" }}>
              {highScore}
            </div>
          </div>
        </div>
      </div>

      {/* Arcade HUD Bar */}
      <div className="metrics-bar" style={{ marginBottom: 14 }}>
        <div className="metrics-group">
          <div className="metric">
            <span className="metric-label">Score</span>
            <span className="metric-value wpm">{score}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Wave</span>
            <span className="metric-value" style={{ color: "#4FC3F7" }}>{wave}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Shields</span>
            <span className="metric-value" style={{ fontSize: "1.2rem" }}>
              {"🛡️".repeat(shields)}{"🖤".repeat(Math.max(0, 5 - shields))}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Destroyed</span>
            <span className="metric-value acc">{destroyedCount}</span>
          </div>
          {streak >= 3 && (
            <div className="metric">
              <span className="metric-label">Streak</span>
              <span className="metric-value" style={{ color: "#FF8C42" }}>🔥 x{streak}</span>
            </div>
          )}
        </div>

        {gameState === "playing" && (
          <button className="btn btn-ghost" onClick={() => setGameState(s => s === "paused" ? "playing" : "paused")}>
            ⏸ Pause
          </button>
        )}
      </div>

      {/* Game Canvas Container */}
      <div style={{ position: "relative", width: "100%", height: 500, borderRadius: 14, overflow: "hidden", border: "2px solid var(--border)", boxShadow: "0 10px 40px rgba(0,0,0,0.6)" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

        {/* Floating Banner (e.g. Wave Cleared / Nuke Blast) */}
        {banner && (
          <div style={{
            position: "absolute", top: "20%", left: "50%", transform: "translate(-50%, -50%)",
            background: "rgba(10,10,18,0.85)", border: "2px solid var(--caret)", borderRadius: 12,
            padding: "12px 28px", color: "var(--caret)", fontFamily: "var(--font-mono)",
            fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.06em", pointerEvents: "none",
            boxShadow: "0 0 30px rgba(255,179,71,0.4)"
          }}>
            {banner}
          </div>
        )}

        {/* Start Screen Overlay */}
        {gameState === "ready" && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(10,10,16,0.88)", backdropFilter: "blur(6px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, zIndex: 10
          }}>
            <div style={{ fontSize: "4.5rem", animation: "bounce 1.5s infinite" }}>☄️</div>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Meteor Defense
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", maxWidth: 440, textAlign: "center", fontSize: "0.92rem", lineHeight: 1.6 }}>
              Words are falling toward the city! Type the first letter of any meteor to lock onto it, then type the rest of the word to fire your laser cannon.
            </p>

            {/* Difficulty Pills */}
            <div className="pill-group" style={{ margin: "4px 0" }}>
              {[["easy", "Easy 🟢"], ["normal", "Normal 🟡"], ["hard", "Expert 🔴"]].map(([diff, label]) => (
                <button
                  key={diff}
                  className={`pill ${difficulty === diff ? "active" : ""}`}
                  onClick={() => setDifficulty(diff)}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={startGame}
              className="btn btn-primary"
              style={{
                fontSize: "1.2rem", padding: "16px 48px", borderRadius: 50,
                boxShadow: "0 8px 28px rgba(255,179,71,0.5)", fontWeight: 800
              }}
            >
              Start Defense 🚀
            </button>
          </div>
        )}

        {/* Paused Overlay */}
        {gameState === "paused" && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(10,10,16,0.8)", backdropFilter: "blur(4px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, zIndex: 10
          }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 800 }}>Game Paused</h2>
            <p style={{ color: "var(--text-2)", fontSize: "0.9rem" }}>Press Esc or Resume to jump back into action</p>
            <button onClick={() => setGameState("playing")} className="btn btn-primary" style={{ padding: "12px 32px" }}>
              Resume Game
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === "gameover" && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(10,10,16,0.92)", backdropFilter: "blur(8px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, zIndex: 10
          }}>
            <div style={{ fontSize: "3.5rem" }}>💥</div>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#FF5D5D" }}>Shields Breached!</h2>
            <p style={{ color: "rgba(255,255,255,0.75)" }}>The city defenses held until Wave {wave}.</p>

            {/* Score Grid */}
            <div style={{ display: "flex", gap: 16, margin: "8px 0" }}>
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-2)", textTransform: "uppercase" }}>Final Score</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 800, color: "var(--caret)" }}>{score}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-2)", textTransform: "uppercase" }}>Meteors Sunk</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 800, color: "#5FD97A" }}>{destroyedCount}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-2)", textTransform: "uppercase" }}>Wave Reached</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 800, color: "#4FC3F7" }}>{wave}</div>
              </div>
            </div>

            <button
              onClick={startGame}
              className="btn btn-primary"
              style={{ fontSize: "1.1rem", padding: "14px 40px", borderRadius: 50, fontWeight: 700 }}
            >
              Play Again 🔄
            </button>
          </div>
        )}
      </div>

      {/* Power-up Legend Card */}
      <div className="card" style={{ marginTop: 18, display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 12, fontSize: "0.82rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "1.2rem" }}>💣</span>
          <span><strong>NUKE:</strong> Destroys all falling meteors instantly</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "1.2rem" }}>❄️</span>
          <span><strong>FREEZE:</strong> Freezes all meteors for 5 seconds</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "1.2rem" }}>🛡️</span>
          <span><strong>SHIELD:</strong> Restores +1 defense shield</span>
        </div>
      </div>
    </div>
  );
}
