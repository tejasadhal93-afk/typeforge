import { useState, useCallback, useRef, useEffect } from "react";

function calcMetrics(chars, elapsed, keystrokes, correctKeystrokes, errors) {
  const mins = Math.max(0.001, elapsed / 60);
  const correctChars = chars.filter(c => c.state === "correct").length;
  const wpm = Math.max(0, Math.round((correctChars / 5) / mins));
  const rawWpm = Math.max(0, Math.round((chars.filter(c => c.state !== "pending" && c.state !== "current").length / 5) / mins));
  const accuracy = keystrokes > 0 ? Math.min(100, (correctKeystrokes / keystrokes) * 100) : 100;
  return { wpm, rawWpm, accuracy, correctChars, errors };
}

export function useTypingEngine({ onComplete } = {}) {
  const [chars, setChars] = useState([]);
  const [targetText, setTargetText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [metrics, setMetrics] = useState({ wpm: 0, rawWpm: 0, accuracy: 100, correctChars: 0, errors: 0 });
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [mode, setMode] = useState("lesson");
  const [duration, setDuration] = useState(30);
  const [streak, setStreak] = useState(0);
  const [keyErrors, setKeyErrors] = useState({});

  const startTimeRef = useRef(null);
  const tickRef = useRef(null);
  const keystrokesRef = useRef(0);
  const correctKeystrokesRef = useRef(0);
  const errorsRef = useRef(0);
  const streakRef = useRef(0);
  const keyErrorsRef = useRef({});
  const charsRef = useRef([]);
  const currentIndexRef = useRef(0);
  const modeRef = useRef("lesson");
  const durationRef = useRef(30);

  const buildChars = (text) =>
    text.split("").map((ch, i) => ({ ch, state: i === 0 ? "current" : "pending" }));

  const loadText = useCallback((text, newMode = "lesson", newDuration = 30) => {
    if (tickRef.current) clearInterval(tickRef.current);
    const built = buildChars(text);
    charsRef.current = built;
    currentIndexRef.current = 0;
    modeRef.current = newMode;
    durationRef.current = newDuration;
    keystrokesRef.current = 0;
    correctKeystrokesRef.current = 0;
    errorsRef.current = 0;
    streakRef.current = 0;
    keyErrorsRef.current = {};
    setChars(built);
    setTargetText(text);
    setCurrentIndex(0);
    setIsRunning(false);
    setIsFinished(false);
    setMode(newMode);
    setDuration(newDuration);
    setTimeElapsed(0);
    setTimeRemaining(newDuration);
    setMetrics({ wpm: 0, rawWpm: 0, accuracy: 100, correctChars: 0, errors: 0 });
    setStreak(0);
    setKeyErrors({});
    startTimeRef.current = null;
  }, []);

  const appendText = useCallback((extra) => {
    setTargetText(prev => {
      const newText = prev + " " + extra;
      const additions = (" " + extra).split("").map(ch => ({ ch, state: "pending" }));
      charsRef.current = [...charsRef.current, ...additions];
      setChars(prev2 => [...prev2, ...additions]);
      return newText;
    });
  }, []);

  const startTimer = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      setTimeElapsed(elapsed);
      const m = calcMetrics(
        charsRef.current, elapsed,
        keystrokesRef.current, correctKeystrokesRef.current, errorsRef.current
      );
      setMetrics(m);
      if (modeRef.current === "time-trial") {
        const rem = Math.max(0, durationRef.current - elapsed);
        setTimeRemaining(Math.ceil(rem));
        if (rem <= 0) {
          clearInterval(tickRef.current);
          setIsRunning(false);
          setIsFinished(true);
          const finalM = calcMetrics(charsRef.current, durationRef.current, keystrokesRef.current, correctKeystrokesRef.current, errorsRef.current);
          onComplete && onComplete({ ...finalM, timeElapsed: durationRef.current, keyErrors: keyErrorsRef.current, streak: streakRef.current });
        }
      }
    }, 100);
  }, [onComplete]);

  const handleKey = useCallback((key) => {
    if (isFinished) return null;
    const idx = currentIndexRef.current;
    const currentChars = charsRef.current;
    if (idx >= currentChars.length) return null;

    // Start timer on first real keystroke
    if (!startTimeRef.current && key.length === 1) {
      startTimeRef.current = performance.now();
      setIsRunning(true);
      startTimer();
    }

    if (key === "Backspace") {
      if (idx === 0) return null;
      const newIdx = idx - 1;
      const updated = currentChars.map((c, i) => {
        if (i === newIdx) return { ...c, state: "current" };
        if (i === idx && c.state !== "pending") return { ...c, state: "pending" };
        return c;
      });
      charsRef.current = updated;
      currentIndexRef.current = newIdx;
      setChars(updated);
      setCurrentIndex(newIdx);
      streakRef.current = 0;
      setStreak(0);
      return { typed: key, expected: currentChars[newIdx].ch, isCorrect: true, nextChar: currentChars[newIdx].ch };
    }

    if (key.length !== 1) return null;

    keystrokesRef.current++;
    const expected = currentChars[idx].ch;
    const isCorrect = key === expected;

    if (isCorrect) {
      correctKeystrokesRef.current++;
      streakRef.current++;
      setStreak(streakRef.current);
    } else {
      errorsRef.current++;
      streakRef.current = 0;
      setStreak(0);
      // Track which key was missed
      keyErrorsRef.current[expected] = (keyErrorsRef.current[expected] || 0) + 1;
    }

    const newIdx = idx + 1;
    const updated = currentChars.map((c, i) => {
      if (i === idx) return { ...c, state: isCorrect ? "correct" : "incorrect" };
      if (i === newIdx) return { ...c, state: "current" };
      return c;
    });

    charsRef.current = updated;
    currentIndexRef.current = newIdx;
    setChars(updated);
    setCurrentIndex(newIdx);

    const nextChar = newIdx < currentChars.length ? currentChars[newIdx].ch : null;

    // Non-time-trial completion
    if (modeRef.current !== "time-trial" && newIdx >= currentChars.length) {
      if (tickRef.current) clearInterval(tickRef.current);
      setIsRunning(false);
      setIsFinished(true);
      const elapsed = startTimeRef.current ? (performance.now() - startTimeRef.current) / 1000 : 0;
      const finalM = calcMetrics(updated, elapsed, keystrokesRef.current, correctKeystrokesRef.current, errorsRef.current);
      setMetrics(finalM);
      onComplete && onComplete({ ...finalM, timeElapsed: elapsed, keyErrors: keyErrorsRef.current, streak: streakRef.current });
    }

    return { typed: key, expected, isCorrect, nextChar };
  }, [isFinished, startTimer, onComplete]);

  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current); }, []);

  return {
    chars, targetText, currentIndex, isRunning, isFinished,
    metrics, timeElapsed, timeRemaining, mode, duration, streak, keyErrors,
    loadText, appendText, handleKey,
    nextExpected: chars[currentIndex]?.ch ?? null,
  };
}
