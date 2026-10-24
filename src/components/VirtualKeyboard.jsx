import { useState, useCallback, useEffect, useRef } from "react";
import { useAppStore } from "../store/appStore";

const LAYOUT = [
  [
    {id:"Backquote",l:"`",s:"~",f:"lp"},{id:"Digit1",l:"1",s:"!",f:"lp"},{id:"Digit2",l:"2",s:"@",f:"lr"},
    {id:"Digit3",l:"3",s:"#",f:"lm"},{id:"Digit4",l:"4",s:"$",f:"li"},{id:"Digit5",l:"5",s:"%",f:"li"},
    {id:"Digit6",l:"6",s:"^",f:"ri"},{id:"Digit7",l:"7",s:"&",f:"ri"},{id:"Digit8",l:"8",s:"*",f:"rm"},
    {id:"Digit9",l:"9",s:"(",f:"rr"},{id:"Digit0",l:"0",s:")",f:"rp"},{id:"Minus",l:"-",s:"_",f:"rp"},
    {id:"Equal",l:"=",s:"+",f:"rp"},{id:"Backspace",l:"Bksp",f:"rp",w:1.75}
  ],
  [
    {id:"Tab",l:"Tab",f:"lp",w:1.5},{id:"KeyQ",l:"Q",f:"lp"},{id:"KeyW",l:"W",f:"lr"},{id:"KeyE",l:"E",f:"lm"},
    {id:"KeyR",l:"R",f:"li"},{id:"KeyT",l:"T",f:"li"},{id:"KeyY",l:"Y",f:"ri"},{id:"KeyU",l:"U",f:"ri"},
    {id:"KeyI",l:"I",f:"rm"},{id:"KeyO",l:"O",f:"rr"},{id:"KeyP",l:"P",f:"rp"},
    {id:"BracketLeft",l:"[",s:"{",f:"rp"},{id:"BracketRight",l:"]",s:"}",f:"rp"},{id:"Backslash",l:"\\",s:"|",f:"rp",w:1.25}
  ],
  [
    {id:"CapsLock",l:"Caps",f:"lp",w:1.75},{id:"KeyA",l:"A",f:"lp"},{id:"KeyS",l:"S",f:"lr"},
    {id:"KeyD",l:"D",f:"lm"},{id:"KeyF",l:"F",f:"li",homing:true},{id:"KeyG",l:"G",f:"li"},
    {id:"KeyH",l:"H",f:"ri"},{id:"KeyJ",l:"J",f:"ri",homing:true},{id:"KeyK",l:"K",f:"rm"},
    {id:"KeyL",l:"L",f:"rr"},{id:"Semicolon",l:";",s:":",f:"rp"},{id:"Quote",l:"'",s:'"',f:"rp"},{id:"Enter",l:"Enter",f:"rp",w:2.25}
  ],
  [
    {id:"ShiftLeft",l:"Shift",f:"lp",w:2.25},{id:"KeyZ",l:"Z",f:"lp"},{id:"KeyX",l:"X",f:"lr"},
    {id:"KeyC",l:"C",f:"lm"},{id:"KeyV",l:"V",f:"li"},{id:"KeyB",l:"B",f:"li"},
    {id:"KeyN",l:"N",f:"ri"},{id:"KeyM",l:"M",f:"ri"},{id:"Comma",l:",",s:"<",f:"rm"},
    {id:"Period",l:".",s:">",f:"rr"},{id:"Slash",l:"/",s:"?",f:"rp"},{id:"ShiftRight",l:"Shift",f:"rp",w:2.5}
  ],
  [
    {id:"ControlLeft",l:"Ctrl",f:"lp",w:1.5},{id:"AltLeft",l:"Alt",f:"th",w:1.25},
    {id:"Space",l:"Space",f:"th",w:6.5},{id:"AltRight",l:"Alt",f:"th",w:1.25},{id:"ControlRight",l:"Ctrl",f:"rp",w:1.5}
  ]
];

// Build char → keyCode mapping
const CHAR_MAP = (() => {
  const map = {};
  const leftHand = new Set(["Backquote","Digit1","Digit2","Digit3","Digit4","Digit5","KeyQ","KeyW","KeyE","KeyR","KeyT","KeyA","KeyS","KeyD","KeyF","KeyG","KeyZ","KeyX","KeyC","KeyV","KeyB"]);
  for (const ch of "abcdefghijklmnopqrstuvwxyz") {
    const code = `Key${ch.toUpperCase()}`;
    map[ch] = { code, shift: false }; map[ch.toUpperCase()] = { code, shift: true };
  }
  [["` ","~","Backquote"],["1","!","Digit1"],["2","@","Digit2"],["3","#","Digit3"],["4","$","Digit4"],
   ["5","%","Digit5"],["6","^","Digit6"],["7","&","Digit7"],["8","*","Digit8"],["9","(","Digit9"],
   ["0",")","Digit0"],["-","_","Minus"],["=","+","Equal"],["[","{","BracketLeft"],["]","}","BracketRight"],
   ["\\","|","Backslash"],[";",":","Semicolon"],["'",'"',"Quote"],[",","<","Comma"],[".",">","Period"],["/","?","Slash"]
  ].forEach(([n, s, code]) => { map[n] = {code, shift:false}; map[s] = {code, shift:true}; });
  map[" "] = { code: "Space", shift: false };
  return map;
})();

export default function VirtualKeyboard({ nextChar }) {
  const fingerZonesEnabled = useAppStore(s => s.fingerZonesEnabled);
  const [flashMap, setFlashMap] = useState({});

  const flash = useCallback((code, type) => {
    setFlashMap(m => ({ ...m, [code]: type }));
    setTimeout(() => setFlashMap(m => { const n={...m}; delete n[code]; return n; }), 150);
  }, []);

  // Expose flash via ref so parent can call it (workaround for prop drilling)
  VirtualKeyboard.flashRef = flash;

  const mapping = nextChar ? CHAR_MAP[nextChar] : null;

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px",padding:"0 2px"}}>
        <div className="kb-legend">
          {[["lp","Pinky"],["lr","Ring"],["lm","Middle"],["li","Index"],["th","Thumbs"]].map(([c,l]) => (
            <div key={c} className="kb-legend-item"><span className={`kb-dot ${c}`}/>{l}</div>
          ))}
        </div>
      </div>
      <div className={`keyboard-wrap ${fingerZonesEnabled ? "fz" : ""}`}>
        {LAYOUT.map((row, ri) => (
          <div key={ri} className="kb-row">
            {row.map(key => {
              const isNext = mapping && mapping.code === key.id && !mapping.shift;
              const isShift = mapping?.shift && (
                (mapping.code && CHAR_MAP[nextChar]?.code !== "ShiftLeft" && CHAR_MAP[nextChar]?.code !== "ShiftRight") &&
                ((CHAR_MAP[nextChar]?.code?.startsWith("Key") || ["Digit","Bracket","Minus","Equal","Semicolon","Quote","Comma","Period","Slash","Backquote"].some(p => CHAR_MAP[nextChar]?.code?.startsWith(p))) &&
                 (key.id === "ShiftLeft" || key.id === "ShiftRight"))
              );
              const fl = flashMap[key.id];
              return (
                <div key={key.id}
                  className={[
                    "kb-key",
                    `fz-${key.f}`,
                    isNext ? "key-next" : "",
                    isShift ? "key-shift" : "",
                    fl === "ok" ? "flash-ok" : fl === "err" ? "flash-err" : "",
                    fl ? "pressed" : ""
                  ].filter(Boolean).join(" ")}
                  style={{ flexGrow: key.w || 1 }}
                >
                  {key.s && <span className="kb-shift-label">{key.s}</span>}
                  <span>{key.l}</span>
                  {key.homing && <span className="kb-homing" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
