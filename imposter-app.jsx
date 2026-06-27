const { useState, useEffect, useRef } = React;

// ── palette ──────────────────────────────────────────────
// Deep ink table, warm card stock, a single signal-red for the imposter beat.
const ink = "#15131a";
const card = "#f5efe2";
const cardEdge = "#e6dcc6";
const red = "#d23a2e";
const gold = "#caa24a";
const muted = "#8a8276";

const PHASES = {
  SETUP: "setup",
  HANDOFF: "handoff",
  REVEAL: "reveal",
  TIMER: "timer",
  RESULT: "result",
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

  // setup state
  const [crewWord, setCrewWord] = useState("");
  const [imposterWord, setImposterWord] = useState("");
  const [names, setNames] = useState(["", "", ""]);
  const [gmName, setGmName] = useState(null); // name string of game master, or null
  const [numImposters, setNumImposters] = useState(1);
  const [timerSecs, setTimerSecs] = useState(120);

  // round state
  const [assignments, setAssignments] = useState([]); // [{name, isImposter, word}]
  const [turn, setTurn] = useState(0);
  const [showingCard, setShowingCard] = useState(false);

  // timer state
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const tick = useRef(null);

  // reorder
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

  const setName = (i, v) =>
    setNames((p) => p.map((n, idx) => (idx === i ? v : n)));
  const addName = () => setNames((p) => [...p, ""]);
  const removeName = (i) => setNames((p) => p.filter((_, idx) => idx !== i));
  const toggleGm = (name) =>
    setGmName((cur) => (cur === name ? null : name));

  const canStart =
    crewWord.trim() &&
    imposterWord.trim() &&
    activeNames.length >= 3 &&
    numImposters >= 1 &&
    numImposters <= maxImposters;

  function startRound() {
    const idxs = shuffle(activeNames.map((_, i) => i)).slice(0, numImposters);
    const impSet = new Set(idxs);
    const a = activeNames.map((name, i) => ({
      name,
      isImposter: impSet.has(i),
      word: impSet.has(i) ? imposterWord.trim() : crewWord.trim(),
    }));
    setAssignments(a);
    setTurn(0);
    setShowingCard(false);
    setPhase(PHASES.HANDOFF);
  }

  // keep imposter count within range as players/GM change
  useEffect(() => {
    if (numImposters > maxImposters) setNumImposters(maxImposters);
  }, [maxImposters, numImposters]);

  // timer engine
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
      }, 1000);
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

  const fmt = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── shared styles ──────────────────────────────────────
  const screen = {
    minHeight: "100vh",
    background: `radial-gradient(120% 80% at 50% -10%, #241f2e 0%, ${ink} 55%)`,
    color: card,
    fontFamily: "'Georgia', 'Times New Roman', serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "28px 18px 48px",
    boxSizing: "border-box",
  };
  const kicker = {
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    fontSize: 11,
    color: gold,
  };
  const btn = (variant = "solid") => ({
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontSize: 13,
    padding: "15px 22px",
    borderRadius: 2,
    border: variant === "ghost" ? `1px solid ${muted}` : "none",
    background:
      variant === "solid" ? card : variant === "danger" ? red : "transparent",
    color:
      variant === "solid" ? ink : variant === "danger" ? card : card,
    cursor: "pointer",
    width: "100%",
    fontWeight: 700,
  });

  // ── SETUP ──────────────────────────────────────────────
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
      padding: "13px 14px",
    };
    const label = { ...kicker, display: "block", marginBottom: 8 };

    return (
      <div style={screen}>
        <div style={{ maxWidth: 460, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div style={kicker}>One word is a lie</div>
            <h1
              style={{
                fontSize: 46,
                margin: "8px 0 0",
                fontWeight: 400,
                letterSpacing: "-0.02em",
              }}
            >
              The Imposter
            </h1>
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={label}>The crew's word</label>
            <input
              style={inputStyle}
              value={crewWord}
              onChange={(e) => setCrewWord(e.target.value)}
              placeholder="what most players see"
            />
          </div>

          <div style={{ marginBottom: 26 }}>
            <label style={{ ...label, color: red }}>The imposter's word</label>
            <input
              style={{ ...inputStyle, borderColor: red }}
              value={imposterWord}
              onChange={(e) => setImposterWord(e.target.value)}
              placeholder="the lie they're handed"
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={label}>Players</label>
            <p
              style={{
                color: muted,
                fontSize: 12,
                margin: "-2px 0 10px",
                fontStyle: "italic",
              }}
            >
              Tap ★ to set a game master — they sit out the round.
            </p>
            {names.map((n, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 8,
                  alignItems: "stretch",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flexShrink: 0,
                    gap: 2,
                  }}
                >
                  <button
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    style={{
                      background: "transparent",
                      border: `1px solid ${muted}`,
                      color: muted,
                      borderRadius: 2,
                      width: 32,
                      flex: 1,
                      cursor: i === 0 ? "default" : "pointer",
                      opacity: i === 0 ? 0.25 : 1,
                      fontSize: 11,
                      lineHeight: 1,
                    }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => move(i, i + 1)}
                    disabled={i === names.length - 1}
                    aria-label="Move down"
                    style={{
                      background: "transparent",
                      border: `1px solid ${muted}`,
                      color: muted,
                      borderRadius: 2,
                      width: 32,
                      flex: 1,
                      cursor: i === names.length - 1 ? "default" : "pointer",
                      opacity: i === names.length - 1 ? 0.25 : 1,
                      fontSize: 11,
                      lineHeight: 1,
                    }}
                  >
                    ▼
                  </button>
                </div>
                <input
                  style={{
                    ...inputStyle,
                    borderColor: n.trim() && n.trim() === gmName ? gold : muted,
                    color:
                      n.trim() && n.trim() === gmName ? gold : inputStyle.color,
                  }}
                  value={n}
                  onChange={(e) => setName(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                />
                <button
                  onClick={() => n.trim() && toggleGm(n.trim())}
                  disabled={!n.trim()}
                  title="Game master (sits out this round)"
                  aria-label="Toggle game master"
                  style={{
                    background:
                      n.trim() && n.trim() === gmName ? gold : "transparent",
                    border: `1px solid ${
                      n.trim() && n.trim() === gmName ? gold : muted
                    }`,
                    color:
                      n.trim() && n.trim() === gmName ? ink : muted,
                    borderRadius: 2,
                    width: 46,
                    flexShrink: 0,
                    cursor: n.trim() ? "pointer" : "default",
                    opacity: n.trim() ? 1 : 0.3,
                    fontSize: 18,
                  }}
                >
                  ★
                </button>
                {names.length > 3 && (
                  <button
                    onClick={() => removeName(i)}
                    style={{
                      background: "transparent",
                      border: `1px solid ${muted}`,
                      color: muted,
                      borderRadius: 2,
                      width: 46,
                      flexShrink: 0,
                      cursor: "pointer",
                      fontSize: 18,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addName}
              style={{
                ...kicker,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "6px 0",
                color: gold,
              }}
            >
              + add player
            </button>
          </div>

          <div style={{ display: "flex", gap: 14, marginBottom: 30 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>Imposters</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Stepper
                  value={numImposters}
                  min={1}
                  max={maxImposters}
                  onChange={setNumImposters}
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Discuss</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Stepper
                  value={timerSecs / 30}
                  min={1}
                  max={20}
                  onChange={(v) => setTimerSecs(v * 30)}
                  display={fmt(timerSecs)}
                />
              </div>
            </div>
          </div>

          {!canStart && (
            <p style={{ color: muted, fontSize: 13, marginBottom: 14 }}>
              Need both words, at least 3 active players (excluding the game
              master), and a valid imposter count.
            </p>
          )}
          <button
            style={{ ...btn("solid"), opacity: canStart ? 1 : 0.4 }}
            disabled={!canStart}
            onClick={startRound}
          >
            Deal the round
          </button>
        </div>
      </div>
    );
  }

  // ── HANDOFF ────────────────────────────────────────────
  if (phase === PHASES.HANDOFF) {
    const a = assignments[turn];
    return (
      <div style={{ ...screen, justifyContent: "center" }}>
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          {!showingCard ? (
            <>
              <div style={kicker}>
                Player {turn + 1} of {assignments.length}
              </div>
              <h2 style={{ fontSize: 40, margin: "14px 0 6px", fontWeight: 400 }}>
                Pass to
              </h2>
              <div
                style={{
                  fontSize: 30,
                  color: gold,
                  marginBottom: 40,
                  fontStyle: "italic",
                }}
              >
                {a.name}
              </div>
              <button style={btn("solid")} onClick={() => setShowingCard(true)}>
                I'm {a.name} — show my word
              </button>
            </>
          ) : (
            <WordCard
              a={a}
              card={card}
              cardEdge={cardEdge}
              ink={ink}
              red={red}
              gold={gold}
              muted={muted}
              kicker={kicker}
            >
              <button
                style={{ ...btn("solid"), marginTop: 26 }}
                onClick={nextHandoff}
              >
                {turn + 1 < assignments.length
                  ? "Hide & pass on"
                  : "Hide & start discussion"}
              </button>
            </WordCard>
          )}
        </div>
      </div>
    );
  }

  // ── TIMER ──────────────────────────────────────────────
  if (phase === PHASES.TIMER) {
    const low = remaining <= 10 && remaining > 0;
    return (
      <div style={{ ...screen, justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 420, width: "100%" }}>
          <div style={kicker}>Find the imposter</div>
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 92,
              margin: "18px 0",
              fontWeight: 700,
              color: remaining === 0 ? red : low ? red : card,
              letterSpacing: "0.02em",
            }}
          >
            {fmt(remaining)}
          </div>
          {remaining === 0 && (
            <div style={{ ...kicker, color: red, marginBottom: 24 }}>
              Time's up — lock your votes
            </div>
          )}
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <button
              style={btn("ghost")}
              onClick={() => setRunning((r) => !r)}
            >
              {running ? "Pause" : "Resume"}
            </button>
            <button
              style={btn("ghost")}
              onClick={() => {
                setRemaining(timerSecs);
                setRunning(true);
              }}
            >
              Restart
            </button>
          </div>
          <button
            style={btn("solid")}
            onClick={() => {
              setRunning(false);
              setPhase(PHASES.RESULT);
            }}
          >
            Reveal the imposters
          </button>
        </div>
      </div>
    );
  }

  // ── RESULT ─────────────────────────────────────────────
  if (phase === PHASES.RESULT) {
    const imposters = assignments.filter((a) => a.isImposter);
    return (
      <div style={screen}>
        <div style={{ maxWidth: 460, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <div style={{ ...kicker, color: red }}>The reveal</div>
            <h2 style={{ fontSize: 38, margin: "10px 0 0", fontWeight: 400 }}>
              {imposters.length === 1
                ? "The imposter was"
                : "The imposters were"}
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {assignments.map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                  borderRadius: 2,
                  background: a.isImposter ? red : "rgba(255,255,255,0.04)",
                  color: a.isImposter ? card : muted,
                  border: a.isImposter
                    ? "none"
                    : `1px solid rgba(255,255,255,0.07)`,
                }}
              >
                <span style={{ fontSize: 19 }}>{a.name}</span>
                <span
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 12,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  {a.isImposter ? "imposter" : "crew"}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 22,
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "'Courier New', monospace",
              fontSize: 13,
              color: muted,
              borderTop: `1px solid rgba(255,255,255,0.1)`,
              paddingTop: 16,
            }}
          >
            <span>crew: {crewWord}</span>
            <span style={{ color: red }}>imposter: {imposterWord}</span>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
            <button style={btn("solid")} onClick={newRoundSameSettings}>
              Play again
            </button>
            <button style={btn("ghost")} onClick={() => setPhase(PHASES.SETUP)}>
              Edit setup
            </button>
          </div>
        </div>
      </div>
    );
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
    fontFamily: "'Courier New', monospace",
  };
  return (
    <>
      <button
        style={{ ...b, opacity: value <= min ? 0.3 : 1 }}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <span
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 22,
          minWidth: 48,
          textAlign: "center",
        }}
      >
        {display ?? value}
      </span>
      <button
        style={{ ...b, opacity: value >= max ? 0.3 : 1 }}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </>
  );
}

function WordCard({ a, card, cardEdge, ink, red, gold, muted, kicker, children }) {
  return (
    <div>
      <div
        style={{
          background: card,
          color: ink,
          borderRadius: 4,
          padding: "40px 26px",
          boxShadow: `0 18px 50px rgba(0,0,0,0.5), inset 0 0 0 1px ${cardEdge}`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: "'Courier New', monospace",
            letterSpacing: "0.3em",
            fontSize: 10,
            textTransform: "uppercase",
            color: muted,
          }}
        >
          {a.name}
        </div>
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            letterSpacing: "0.28em",
            fontSize: 11,
            textTransform: "uppercase",
            color: muted,
            marginBottom: 14,
          }}
        >
          Your word is
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.05,
            color: ink,
            wordBreak: "break-word",
          }}
        >
          {a.word}
        </div>
        <div
          style={{
            marginTop: 18,
            fontStyle: "italic",
            fontSize: 15,
            color: muted,
          }}
        >
          Describe it without saying it.
        </div>
      </div>
      {children}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<ImposterGame />);
