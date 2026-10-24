import { useEffect, useRef, useCallback } from "react";
import { useTypingEngine } from "../hooks/useTypingEngine";
import { useSound } from "../hooks/useSound";
import { useAppStore } from "../store/appStore";
import VirtualKeyboard from "./VirtualKeyboard";
import ResultsModal from "./ResultsModal";
import PaceCar from "./PaceCar";

export default function TypingArea({ text, mode, duration = 30, onComplete, onNeedMore, label, drillId }) {
  const { playClick, playComplete } = useSound();
  const saveSession       = useAppStore(s => s.saveSession);
  const paceCarEnabled    = useAppStore(s => s.paceCarEnabled);
  const targetPaceWpm     = useAppStore(s => s.targetPaceWpm);
  const deckRef           = useRef(null);
  const completedRef      = useRef(false);

  const handleComplete = useCallback((results) => {
    if (completedRef.current) return;
    completedRef.current = true;
    playComplete();
    saveSession({ mode, label, drillId, ...results });
    onComplete && onComplete(results);
  }, [mode, label, drillId, playComplete, saveSession, onComplete]);

  const engine = useTypingEngine({ onComplete: handleComplete });

  // Reload when text/mode/duration changes
  useEffect(() => {
    completedRef.current = false;
    engine.loadText(text, mode, duration);
    if (deckRef.current) deckRef.current.classList.remove("active");
  }, [text, mode, duration]);

  // Auto-append words for time trial
  useEffect(() => {
    if (mode === "time-trial" && !engine.isFinished && onNeedMore) {
      const remaining = engine.targetText.length - engine.currentIndex;
      if (remaining < 80) engine.appendText(onNeedMore());
    }
  }, [engine.currentIndex, mode, engine.isFinished, onNeedMore]);

  // Global keydown
  useEffect(() => {
    const onKey = (e) => {
      if (engine.isFinished) return;
      if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "Escape") {
        completedRef.current = false;
        engine.loadText(text, mode, duration);
        if (deckRef.current) deckRef.current.classList.remove("active");
        return;
      }
      if (e.key === " " || e.key === "Backspace") e.preventDefault();
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const result = engine.handleKey(e.key);
      if (result) {
        playClick(result.isCorrect);
        if (VirtualKeyboard.flashRef) {
          let code;
          if (e.key === " ") code = "Space";
          else if (e.key === "Backspace") code = "Backspace";
          else if (/^[a-zA-Z]$/.test(e.key)) code = `Key${e.key.toUpperCase()}`;
          if (code) VirtualKeyboard.flashRef(code, result.isCorrect ? "ok" : "err");
        }
        if (deckRef.current && !deckRef.current.classList.contains("active"))
          deckRef.current.classList.add("active");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engine, playClick, text, mode, duration]);

  const { wpm, accuracy, errors } = engine.metrics;
  const timerLabel = mode === "time-trial" ? "Time Left" : "Elapsed";
  const timeDisplay = mode === "time-trial"
    ? `${engine.timeRemaining}s`
    : `${Math.round(engine.timeElapsed)}s`;

  const restart = () => {
    completedRef.current = false;
    engine.loadText(text, mode, duration);
    if (deckRef.current) deckRef.current.classList.remove("active");
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Pace Car */}
      {paceCarEnabled && (engine.isRunning || engine.currentIndex > 0) && (
        <PaceCar
          currentWpm={wpm}
          targetWpm={targetPaceWpm}
          currentIndex={engine.currentIndex}
          totalChars={engine.targetText.length}
          timeElapsed={engine.timeElapsed}
          mode={mode}
          duration={duration}
        />
      )}

      {/* Metrics bar */}
      <div className="metrics-bar">
        <div className="metrics-group">
          <div className="metric">
            <span className="metric-label">WPM</span>
            <span className="metric-value wpm">{wpm}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Accuracy</span>
            <span className="metric-value acc">{Math.round(accuracy)}%</span>
          </div>
          <div className="metric">
            <span className="metric-label">{timerLabel}</span>
            <span className="metric-value">{timeDisplay}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Errors</span>
            <span className="metric-value err">{errors}</span>
          </div>
          {engine.streak >= 5 && (
            <div className="metric">
              <span className="metric-label">Streak</span>
              <span className="metric-value" style={{color:"#ff8c42"}}>🔥{engine.streak}</span>
            </div>
          )}
        </div>
        <button className="btn btn-ghost" onClick={restart}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          Restart
        </button>
      </div>

      {/* Text deck */}
      <div ref={deckRef} className="typing-deck card-lg">
        <div className="text-display">
          {engine.chars.map((c, i) => (
            <span key={i} className={`char ${c.state}`}>
              {c.ch === " " ? "\u00A0" : c.ch}
            </span>
          ))}
        </div>
      </div>

      {/* Virtual keyboard */}
      <VirtualKeyboard nextChar={engine.nextExpected} />

      {/* Results modal */}
      <ResultsModal
        open={engine.isFinished}
        metrics={engine.metrics}
        timeElapsed={engine.timeElapsed}
        mode={mode}
        label={label}
        onRetry={restart}
      />
    </div>
  );
}
