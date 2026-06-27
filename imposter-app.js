(() => {
  // imposter-app.jsx
  var { useState, useEffect, useRef } = React;
  var ink = "#15131a";
  var card = "#f5efe2";
  var cardEdge = "#e6dcc6";
  var red = "#d23a2e";
  var gold = "#caa24a";
  var muted = "#8a8276";
  var PHASES = {
    SETUP: "setup",
    HANDOFF: "handoff",
    REVEAL: "reveal",
    TIMER: "timer",
    RESULT: "result"
  };
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function ImposterGame() {
    const [phase, setPhase] = useState(PHASES.SETUP);
    const [crewWord, setCrewWord] = useState("");
    const [imposterWord, setImposterWord] = useState("");
    const [names, setNames] = useState(["", "", ""]);
    const [gmName, setGmName] = useState(null);
    const [numImposters, setNumImposters] = useState(1);
    const [timerSecs, setTimerSecs] = useState(120);
    const [assignments, setAssignments] = useState([]);
    const [turn, setTurn] = useState(0);
    const [showingCard, setShowingCard] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const [running, setRunning] = useState(false);
    const tick = useRef(null);
    function move(from, to) {
      if (to < 0 || to >= names.length) return;
      setNames((p) => {
        const a = [...p];
        const [m] = a.splice(from, 1);
        a.splice(to, 0, m);
        return a;
      });
    }
    const cleanNames = names.map((n) => n.trim()).filter(Boolean);
    const activeNames = cleanNames.filter((n) => n !== gmName);
    const maxImposters = Math.max(1, activeNames.length - 1);
    const setName = (i, v) => setNames((p) => p.map((n, idx) => idx === i ? v : n));
    const addName = () => setNames((p) => [...p, ""]);
    const removeName = (i) => setNames((p) => p.filter((_, idx) => idx !== i));
    const toggleGm = (name) => setGmName((cur) => cur === name ? null : name);
    const canStart = crewWord.trim() && imposterWord.trim() && activeNames.length >= 3 && numImposters >= 1 && numImposters <= maxImposters;
    function startRound() {
      const idxs = shuffle(activeNames.map((_, i) => i)).slice(0, numImposters);
      const impSet = new Set(idxs);
      const a = activeNames.map((name, i) => ({
        name,
        isImposter: impSet.has(i),
        word: impSet.has(i) ? imposterWord.trim() : crewWord.trim()
      }));
      setAssignments(a);
      setTurn(0);
      setShowingCard(false);
      setPhase(PHASES.HANDOFF);
    }
    useEffect(() => {
      if (numImposters > maxImposters) setNumImposters(maxImposters);
    }, [maxImposters, numImposters]);
    useEffect(() => {
      if (running) {
        tick.current = setInterval(() => {
          setRemaining((r) => {
            if (r <= 1) {
              clearInterval(tick.current);
              setRunning(false);
              return 0;
            }
            return r - 1;
          });
        }, 1e3);
      }
      return () => clearInterval(tick.current);
    }, [running]);
    function beginTimer() {
      setRemaining(timerSecs);
      setRunning(true);
      setPhase(PHASES.TIMER);
    }
    function nextHandoff() {
      if (turn + 1 < assignments.length) {
        setTurn(turn + 1);
        setShowingCard(false);
        setPhase(PHASES.HANDOFF);
      } else {
        beginTimer();
      }
    }
    function newRoundSameSettings() {
      startRound();
    }
    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    const screen = {
      minHeight: "100vh",
      background: `radial-gradient(120% 80% at 50% -10%, #241f2e 0%, ${ink} 55%)`,
      color: card,
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "28px 18px 48px",
      boxSizing: "border-box"
    };
    const kicker = {
      fontFamily: "'Courier New', monospace",
      letterSpacing: "0.32em",
      textTransform: "uppercase",
      fontSize: 11,
      color: gold
    };
    const btn = (variant = "solid") => ({
      fontFamily: "'Courier New', monospace",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      fontSize: 13,
      padding: "15px 22px",
      borderRadius: 2,
      border: variant === "ghost" ? `1px solid ${muted}` : "none",
      background: variant === "solid" ? card : variant === "danger" ? red : "transparent",
      color: variant === "solid" ? ink : variant === "danger" ? card : card,
      cursor: "pointer",
      width: "100%",
      fontWeight: 700
    });
    if (phase === PHASES.SETUP) {
      const inputStyle = {
        width: "100%",
        boxSizing: "border-box",
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${muted}`,
        borderRadius: 2,
        color: card,
        fontFamily: "'Georgia', serif",
        fontSize: 17,
        padding: "13px 14px"
      };
      const label = { ...kicker, display: "block", marginBottom: 8 };
      return /* @__PURE__ */ React.createElement("div", { style: screen }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 460, width: "100%" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 30 } }, /* @__PURE__ */ React.createElement("div", { style: kicker }, "One word is a lie"), /* @__PURE__ */ React.createElement(
        "h1",
        {
          style: {
            fontSize: 46,
            margin: "8px 0 0",
            fontWeight: 400,
            letterSpacing: "-0.02em"
          }
        },
        "The Imposter"
      )), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 22 } }, /* @__PURE__ */ React.createElement("label", { style: label }, "The crew's word"), /* @__PURE__ */ React.createElement(
        "input",
        {
          style: inputStyle,
          value: crewWord,
          onChange: (e) => setCrewWord(e.target.value),
          placeholder: "what most players see"
        }
      )), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 26 } }, /* @__PURE__ */ React.createElement("label", { style: { ...label, color: red } }, "The imposter's word"), /* @__PURE__ */ React.createElement(
        "input",
        {
          style: { ...inputStyle, borderColor: red },
          value: imposterWord,
          onChange: (e) => setImposterWord(e.target.value),
          placeholder: "the lie they're handed"
        }
      )), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 22 } }, /* @__PURE__ */ React.createElement("label", { style: label }, "Players"), /* @__PURE__ */ React.createElement(
        "p",
        {
          style: {
            color: muted,
            fontSize: 12,
            margin: "-2px 0 10px",
            fontStyle: "italic"
          }
        },
        "Tap \u2605 to set a game master \u2014 they sit out the round."
      ), names.map((n, i) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: i,
          style: {
            display: "flex",
            gap: 8,
            marginBottom: 8,
            alignItems: "stretch"
          }
        },
        /* @__PURE__ */ React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              gap: 2
            }
          },
          /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => move(i, i - 1),
              disabled: i === 0,
              "aria-label": "Move up",
              style: {
                background: "transparent",
                border: `1px solid ${muted}`,
                color: muted,
                borderRadius: 2,
                width: 32,
                flex: 1,
                cursor: i === 0 ? "default" : "pointer",
                opacity: i === 0 ? 0.25 : 1,
                fontSize: 11,
                lineHeight: 1
              }
            },
            "\u25B2"
          ),
          /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => move(i, i + 1),
              disabled: i === names.length - 1,
              "aria-label": "Move down",
              style: {
                background: "transparent",
                border: `1px solid ${muted}`,
                color: muted,
                borderRadius: 2,
                width: 32,
                flex: 1,
                cursor: i === names.length - 1 ? "default" : "pointer",
                opacity: i === names.length - 1 ? 0.25 : 1,
                fontSize: 11,
                lineHeight: 1
              }
            },
            "\u25BC"
          )
        ),
        /* @__PURE__ */ React.createElement(
          "input",
          {
            style: {
              ...inputStyle,
              borderColor: n.trim() && n.trim() === gmName ? gold : muted,
              color: n.trim() && n.trim() === gmName ? gold : inputStyle.color
            },
            value: n,
            onChange: (e) => setName(i, e.target.value),
            placeholder: `Player ${i + 1}`
          }
        ),
        /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => n.trim() && toggleGm(n.trim()),
            disabled: !n.trim(),
            title: "Game master (sits out this round)",
            "aria-label": "Toggle game master",
            style: {
              background: n.trim() && n.trim() === gmName ? gold : "transparent",
              border: `1px solid ${n.trim() && n.trim() === gmName ? gold : muted}`,
              color: n.trim() && n.trim() === gmName ? ink : muted,
              borderRadius: 2,
              width: 46,
              flexShrink: 0,
              cursor: n.trim() ? "pointer" : "default",
              opacity: n.trim() ? 1 : 0.3,
              fontSize: 18
            }
          },
          "\u2605"
        ),
        names.length > 3 && /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => removeName(i),
            style: {
              background: "transparent",
              border: `1px solid ${muted}`,
              color: muted,
              borderRadius: 2,
              width: 46,
              flexShrink: 0,
              cursor: "pointer",
              fontSize: 18
            }
          },
          "\xD7"
        )
      )), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: addName,
          style: {
            ...kicker,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "6px 0",
            color: gold
          }
        },
        "+ add player"
      )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, marginBottom: 30 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("label", { style: label }, "Imposters"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement(
        Stepper,
        {
          value: numImposters,
          min: 1,
          max: maxImposters,
          onChange: setNumImposters
        }
      ))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("label", { style: label }, "Discuss"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement(
        Stepper,
        {
          value: timerSecs / 30,
          min: 1,
          max: 20,
          onChange: (v) => setTimerSecs(v * 30),
          display: fmt(timerSecs)
        }
      )))), !canStart && /* @__PURE__ */ React.createElement("p", { style: { color: muted, fontSize: 13, marginBottom: 14 } }, "Need both words, at least 3 active players (excluding the game master), and a valid imposter count."), /* @__PURE__ */ React.createElement(
        "button",
        {
          style: { ...btn("solid"), opacity: canStart ? 1 : 0.4 },
          disabled: !canStart,
          onClick: startRound
        },
        "Deal the round"
      )));
    }
    if (phase === PHASES.HANDOFF) {
      const a = assignments[turn];
      return /* @__PURE__ */ React.createElement("div", { style: { ...screen, justifyContent: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 420, width: "100%", textAlign: "center" } }, !showingCard ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: kicker }, "Player ", turn + 1, " of ", assignments.length), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 40, margin: "14px 0 6px", fontWeight: 400 } }, "Pass to"), /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            fontSize: 30,
            color: gold,
            marginBottom: 40,
            fontStyle: "italic"
          }
        },
        a.name
      ), /* @__PURE__ */ React.createElement("button", { style: btn("solid"), onClick: () => setShowingCard(true) }, "I'm ", a.name, " \u2014 show my word")) : /* @__PURE__ */ React.createElement(
        WordCard,
        {
          a,
          card,
          cardEdge,
          ink,
          red,
          gold,
          muted,
          kicker
        },
        /* @__PURE__ */ React.createElement(
          "button",
          {
            style: { ...btn("solid"), marginTop: 26 },
            onClick: nextHandoff
          },
          turn + 1 < assignments.length ? "Hide & pass on" : "Hide & start discussion"
        )
      )));
    }
    if (phase === PHASES.TIMER) {
      const low = remaining <= 10 && remaining > 0;
      return /* @__PURE__ */ React.createElement("div", { style: { ...screen, justifyContent: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", maxWidth: 420, width: "100%" } }, /* @__PURE__ */ React.createElement("div", { style: kicker }, "Find the imposter"), /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            fontFamily: "'Courier New', monospace",
            fontSize: 92,
            margin: "18px 0",
            fontWeight: 700,
            color: remaining === 0 ? red : low ? red : card,
            letterSpacing: "0.02em"
          }
        },
        fmt(remaining)
      ), remaining === 0 && /* @__PURE__ */ React.createElement("div", { style: { ...kicker, color: red, marginBottom: 24 } }, "Time's up \u2014 lock your votes"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, marginBottom: 14 } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          style: btn("ghost"),
          onClick: () => setRunning((r) => !r)
        },
        running ? "Pause" : "Resume"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          style: btn("ghost"),
          onClick: () => {
            setRemaining(timerSecs);
            setRunning(true);
          }
        },
        "Restart"
      )), /* @__PURE__ */ React.createElement(
        "button",
        {
          style: btn("solid"),
          onClick: () => {
            setRunning(false);
            setPhase(PHASES.RESULT);
          }
        },
        "Reveal the imposters"
      )));
    }
    if (phase === PHASES.RESULT) {
      const imposters = assignments.filter((a) => a.isImposter);
      return /* @__PURE__ */ React.createElement("div", { style: screen }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 460, width: "100%" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 26 } }, /* @__PURE__ */ React.createElement("div", { style: { ...kicker, color: red } }, "The reveal"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 38, margin: "10px 0 0", fontWeight: 400 } }, imposters.length === 1 ? "The imposter was" : "The imposters were")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, assignments.map((a, i) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: i,
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px",
            borderRadius: 2,
            background: a.isImposter ? red : "rgba(255,255,255,0.04)",
            color: a.isImposter ? card : muted,
            border: a.isImposter ? "none" : `1px solid rgba(255,255,255,0.07)`
          }
        },
        /* @__PURE__ */ React.createElement("span", { style: { fontSize: 19 } }, a.name),
        /* @__PURE__ */ React.createElement(
          "span",
          {
            style: {
              fontFamily: "'Courier New', monospace",
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase"
            }
          },
          a.isImposter ? "imposter" : "crew"
        )
      ))), /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            marginTop: 22,
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            color: muted,
            borderTop: `1px solid rgba(255,255,255,0.1)`,
            paddingTop: 16
          }
        },
        /* @__PURE__ */ React.createElement("span", null, "crew: ", crewWord),
        /* @__PURE__ */ React.createElement("span", { style: { color: red } }, "imposter: ", imposterWord)
      ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 30 } }, /* @__PURE__ */ React.createElement("button", { style: btn("solid"), onClick: newRoundSameSettings }, "Play again"), /* @__PURE__ */ React.createElement("button", { style: btn("ghost"), onClick: () => setPhase(PHASES.SETUP) }, "Edit setup"))));
    }
    return null;
  }
  function Stepper({ value, min, max, onChange, display }) {
    const b = {
      width: 44,
      height: 44,
      borderRadius: 2,
      border: `1px solid ${muted}`,
      background: "transparent",
      color: card,
      fontSize: 22,
      cursor: "pointer",
      fontFamily: "'Courier New', monospace"
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { ...b, opacity: value <= min ? 0.3 : 1 },
        onClick: () => onChange(Math.max(min, value - 1))
      },
      "\u2212"
    ), /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          fontFamily: "'Courier New', monospace",
          fontSize: 22,
          minWidth: 48,
          textAlign: "center"
        }
      },
      display ?? value
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { ...b, opacity: value >= max ? 0.3 : 1 },
        onClick: () => onChange(Math.min(max, value + 1))
      },
      "+"
    ));
  }
  function WordCard({ a, card: card2, cardEdge: cardEdge2, ink: ink2, red: red2, gold: gold2, muted: muted2, kicker, children }) {
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          background: card2,
          color: ink2,
          borderRadius: 4,
          padding: "40px 26px",
          boxShadow: `0 18px 50px rgba(0,0,0,0.5), inset 0 0 0 1px ${cardEdge2}`,
          position: "relative"
        }
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            position: "absolute",
            top: 14,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: "'Courier New', monospace",
            letterSpacing: "0.3em",
            fontSize: 10,
            textTransform: "uppercase",
            color: muted2
          }
        },
        a.name
      ),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            fontFamily: "'Courier New', monospace",
            letterSpacing: "0.28em",
            fontSize: 11,
            textTransform: "uppercase",
            color: muted2,
            marginBottom: 14
          }
        },
        "Your word is"
      ),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.05,
            color: ink2,
            wordBreak: "break-word"
          }
        },
        a.word
      ),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            marginTop: 18,
            fontStyle: "italic",
            fontSize: 15,
            color: muted2
          }
        },
        "Describe it without saying it."
      )
    ), children);
  }
  ReactDOM.createRoot(document.getElementById("app")).render(/* @__PURE__ */ React.createElement(ImposterGame, null));
})();
