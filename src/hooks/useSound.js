import { useRef, useCallback } from "react";
import { useAppStore } from "../store/appStore";

export function useSound() {
  const ctxRef = useRef(null);
  const soundEnabled = useAppStore(s => s.soundEnabled);
  const soundProfile = useAppStore(s => s.soundProfile);
  const soundVolume  = useAppStore(s => s.soundVolume);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const playClick = useCallback((isCorrect = true) => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx(); if (!ctx) return;
      const vol = soundVolume;
      const t = ctx.currentTime;

      if (soundProfile === "clicky") {
        // Cherry Blue: sharp transient click + secondary high snap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = isCorrect ? "square" : "sawtooth";
        osc.frequency.setValueAtTime(isCorrect ? 1800 : 300, t);
        osc.frequency.exponentialRampToValueAtTime(isCorrect ? 600 : 100, t + 0.02);
        gain.gain.setValueAtTime(vol * 0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.028);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.03);
        if (isCorrect) {
          const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
          o2.type = "sine"; o2.frequency.value = 3200;
          g2.gain.setValueAtTime(vol * 0.08, t + 0.01); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.022);
          o2.connect(g2); g2.connect(ctx.destination); o2.start(t + 0.01); o2.stop(t + 0.025);
        }
      } else if (soundProfile === "bubble") {
        // Bubble Pop: harmonic bubbly pop for kids
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = "sine";
        const baseFreq = isCorrect ? 520 + Math.random() * 200 : 220;
        osc.frequency.setValueAtTime(baseFreq * 0.7, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, t + 0.06);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, t + 0.14);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol * 0.28, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.16);
      } else {
        // Gateron Ink Thock (default): lowpass + pitch dive
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        const flt = ctx.createBiquadFilter();
        osc.type = isCorrect ? "sine" : "triangle";
        osc.frequency.setValueAtTime(isCorrect ? 680 + Math.random() * 60 : 180, t);
        osc.frequency.exponentialRampToValueAtTime(isCorrect ? 85 : 60, t + 0.04);
        flt.type = "lowpass"; flt.frequency.value = isCorrect ? 2200 : 600;
        gain.gain.setValueAtTime(vol * 0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(flt); flt.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.06);

        // Noise burst (thock texture) — only on correct
        if (isCorrect) {
          const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.018), ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = (Math.random()*2-1) * Math.exp(-i/(data.length*0.35));
          const ns = ctx.createBufferSource(); ns.buffer = buf;
          const nf = ctx.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 1600; nf.Q.value = 2;
          const ng = ctx.createGain(); ng.gain.setValueAtTime(vol * 0.07, t); ng.gain.exponentialRampToValueAtTime(0.001, t+0.018);
          ns.connect(nf); nf.connect(ng); ng.connect(ctx.destination); ns.start(t);
        }
      }
    } catch {}
  }, [soundEnabled, soundProfile, soundVolume, getCtx]);

  const playComplete = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx(); if (!ctx) return;
      const notes = soundProfile === "bubble"
        ? [523.25, 659.25, 783.99, 1046.50, 1318.51]
        : [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        const t = ctx.currentTime + i * 0.09;
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = soundProfile === "clicky" ? "square" : "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(soundVolume * 0.14, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(t); osc.stop(t + 0.36);
      });
    } catch {}
  }, [soundEnabled, soundProfile, soundVolume, getCtx]);

  return { playClick, playComplete };
}
