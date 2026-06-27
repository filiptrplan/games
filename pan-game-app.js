(() => {
  const $ = (s) => document.querySelector(s);
  const shuffle = (a) => {
    a = [...a];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const state = {
    screen: "setup",
    teams: ["Team 1", "Team 2"],
    rounds: ["Describe freely", "Pantomime", "One word only", "Sounds only", "Face only"],
    words: [],
    pan: [],
    scores: {},
    roundScores: {},
    round: 0,
    team: 0,
    current: null,
    skipped: false,
    left: 60,
    tick: null,
  };

  function setScreen(screen) { state.screen = screen; render(); }
  function stopTimer() { clearInterval(state.tick); state.tick = null; }
  function startTimer() {
    stopTimer();
    state.left = 60;
    state.skipped = false;
    state.current = draw();
    state.tick = setInterval(() => {
      state.left--;
      if (state.left <= 0 || !state.current) endTurn();
      else render();
    }, 1000);
    setScreen("turn");
  }
  function draw() { return state.pan.pop() || null; }
  function nextTeam() { state.team = (state.team + 1) % state.teams.length; }
  function startGame() {
    state.teams = state.teams.map((x) => x.trim()).filter(Boolean);
    state.rounds = state.rounds.map((x) => x.trim()).filter(Boolean);
    state.scores = Object.fromEntries(state.teams.map((t) => [t, 0]));
    state.roundScores = Object.fromEntries(state.teams.map((t) => [t, 0]));
    state.words = [];
    setScreen("words");
  }
  function beginRound() {
    state.roundScores = Object.fromEntries(state.teams.map((t) => [t, 0]));
    state.pan = shuffle(state.words);
    setScreen("handoff");
  }
  function guessed() {
    state.roundScores[state.teams[state.team]]++;
    state.current = draw();
    if (!state.current) endTurn();
    else render();
  }
  function skip() {
    if (state.skipped || !state.current) return;
    state.skipped = true;
    state.pan.unshift(state.current); // ponytail: one skip returns the slip to the pan; fair enough for party play.
    state.current = draw();
    if (!state.current) endTurn();
    else render();
  }
  function awardRound() {
    const best = Math.max(...state.teams.map((t) => state.roundScores[t] || 0));
    const winners = state.teams.filter((t) => (state.roundScores[t] || 0) === best);
    winners.forEach((t) => state.scores[t] += winners.length === 1 ? 1 : 0.5);
  }
  function endTurn() {
    stopTimer();
    if (!state.pan.length && !state.current) {
      awardRound();
      state.round++;
      if (state.round >= state.rounds.length) setScreen("done");
      else setScreen("roundDone");
      return;
    }
    if (state.current) state.pan.unshift(state.current);
    state.current = null;
    nextTeam();
    setScreen("handoff");
  }

  const field = (value, oninput, placeholder = "") => `<input value="${esc(value)}" placeholder="${placeholder}" oninput="${oninput}">`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function renderSetup() {
    return `<div class="kicker">Pass the phone</div><h1>Pan Game</h1><p>Team guessing, one-minute turns, customizable harder rounds, one skip per turn.</p>
      <div class="card list">
        <h2>Setup</h2>
        <label>Teams</label>${state.teams.map((t,i)=>`<div class="row">${field(t,`app.team(${i},this.value)`,`Team ${i+1}`)}<button class="icon-btn" onclick="app.rmTeam(${i})" aria-label="Remove team">×</button></div>`).join("")}
        <button class="btn secondary" onclick="app.addTeam()">+ add team</button>
        <label>Rounds</label>${state.rounds.map((r,i)=>`<div class="pill"><span>${esc(r)}</span><span class="row" style="flex:0 0 auto"><button class="icon-btn" onclick="app.moveRound(${i},${i-1})" aria-label="Move round up">↑</button><button class="icon-btn" onclick="app.moveRound(${i},${i+1})" aria-label="Move round down">↓</button><button class="icon-btn" onclick="app.rmRound(${i})" aria-label="Delete round">×</button></span></div>`).join("")}
        <div class="row"><input id="newRound" placeholder="New round, e.g. Hum only"><button class="btn secondary" onclick="app.addRound()">Add</button></div>
        <button class="btn" ${state.teams.filter(Boolean).length<2||!state.rounds.filter(Boolean).length?"disabled":""} onclick="app.start()">Start writing words</button>
      </div>`;
  }
  function renderWords() {
    return `<div class="card"><div class="kicker">${state.words.length} slips in the pan</div><h2>Write slips</h2><p class="muted">Type a word, put it in, then pass to whoever is writing next.</p><input id="word" autofocus placeholder="secret word"><div class="actions"><button class="btn" onclick="app.addWord()">Put it in the pan</button><button class="btn secondary" ${state.words.length?"":"disabled"} onclick="app.readyCheck()">Start game</button></div></div>`;
  }
  function renderHandoff() {
    return `<div class="dark card"><div class="kicker">${esc(state.rounds[state.round])}</div><h2>Pass to ${esc(state.teams[state.team])}</h2><p>Pick a speaker yourselves, then start.</p><div class="score">${scoreHtml()}</div><button class="btn" onclick="app.startTurn()">Start 1 minute</button></div>`;
  }
  function renderTurn() {
    return `<div class="card"><div class="kicker">${esc(state.teams[state.team])} · ${esc(state.rounds[state.round])}</div><div class="timer">${fmt(state.left)}</div><div class="word">${esc(state.current || "Pan empty")}</div><div class="row"><button class="btn good" onclick="app.guessed()">Guessed</button><button class="btn hot" ${state.skipped?"disabled":""} onclick="app.skip()">Skip</button></div><div class="actions"><button class="btn secondary" onclick="app.endTurn()">End turn</button></div></div>`;
  }
  const scoreHtml = () => state.teams.map((t) => `<div><b>${esc(t)}</b><br>${state.scores[t] || 0} pts <span class="muted small">· ${state.roundScores[t] || 0} guessed</span></div>`).join("");
  function renderRoundDone() {
    return `<div class="dark card"><div class="kicker">Round complete</div><h2>Next: ${esc(state.rounds[state.round])}</h2><div class="score">${scoreHtml()}</div><button class="btn" onclick="app.beginRound()">Refill the pan</button></div>`;
  }
  function renderDone() {
    const winner = [...state.teams].sort((a,b)=>(state.scores[b]||0)-(state.scores[a]||0))[0];
    return `<div class="dark card"><div class="kicker">Game over</div><h2>${esc(winner)} wins</h2><div class="score">${scoreHtml()}</div><button class="btn" onclick="location.reload()">New game</button></div>`;
  }
  function render() {
    $("#app").innerHTML = state.screen === "setup" ? renderSetup() : state.screen === "words" ? renderWords() : state.screen === "handoff" ? renderHandoff() : state.screen === "turn" ? renderTurn() : state.screen === "roundDone" ? renderRoundDone() : renderDone();
    if (state.screen === "words") setTimeout(() => $("#word")?.focus(), 0);
  }

  window.app = {
    team: (i,v) => state.teams[i] = v,
    addTeam: () => { state.teams.push(""); render(); },
    rmTeam: (i) => { if (state.teams.length > 2) state.teams.splice(i,1); render(); },
    addRound: () => {
      const input = $("#newRound");
      const round = input.value.trim();
      if (!round) return;
      state.rounds.push(round);
      render();
    },
    rmRound: (i) => { state.rounds.splice(i, 1); render(); },
    moveRound: (from, to) => {
      if (to < 0 || to >= state.rounds.length) return;
      const [round] = state.rounds.splice(from, 1);
      state.rounds.splice(to, 0, round);
      render();
    },
    start: startGame,
    addWord: () => {
      const word = $("#word").value.trim();
      if (!word) return;
      state.words.push(word);
      render();
    },
    beginRound,
    readyCheck: () => {
      if (confirm("Everyone done writing slips and ready to start? You won't add more words after this.")) beginRound();
    },
    startTurn: startTimer,
    guessed,
    skip,
    endTurn,
  };

  console.assert(fmt(61) === "1:01", "timer format");
  console.assert(new Set(shuffle([1,2,3])).size === 3, "shuffle keeps slips");
  render();
})();
