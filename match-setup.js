/* ============================================================
   GLOBAL STATE & STORAGE
   ============================================================ */
let players = [];
let matchSetup = {
  singles: ["", "", "", ""],
  doubles: [["", ""], ["", ""]],
  reserve: "",
  order: [
    "singles1",
    "singles2",
    "singles3",
    "singles4",
    "doubles1",
    "doubles2",
    "reserve"
  ],
  opponentTeam: ""
};

function loadPlayers() {
  const stored = localStorage.getItem("players") || localStorage.getItem("congressPlayers");
  if (stored) {
    const parsed = JSON.parse(stored);
    players = parsed.map(p => typeof p === "string" ? p : p.name);
  }
}

function savePlayers() {
  localStorage.setItem("players", JSON.stringify(players));
  localStorage.setItem("congressPlayers", JSON.stringify(players));
}

function loadMatchSetup() {
  const stored = localStorage.getItem("matchSetup");
  if (stored) matchSetup = JSON.parse(stored);
  matchSetup.opponentTeam = matchSetup.opponentTeam || "";
}

function saveMatchSetup() {
  localStorage.setItem("matchSetup", JSON.stringify(matchSetup));
}

/* ============================================================
   MATCH TYPE FORMATTER
   ============================================================ */
function formatMatchName(type) {
  switch (type) {
    case "singles1": return "Singles Match 1";
    case "singles2": return "Singles Match 2";
    case "singles3": return "Singles Match 3";
    case "singles4": return "Singles Match 4";
    case "doubles1": return "Doubles Match 1";
    case "doubles2": return "Doubles Match 2";
    case "reserve": return "Reserve Match";
    default: return type || "Match";
  }
}

/* ============================================================
   PLAYER LIST MANAGEMENT
   ============================================================ */
function addPlayerUI() {
  const input = document.getElementById("new-player");
  if (!input) return;
  const name = input.value.trim();
  if (!name) return;

  players.push(name);
  savePlayers();
  renderPlayerList();
  renderSelectors();
  renderSetupSchedule();
  renderMatchSummary();
  input.value = "";
}

function removePlayer(name) {
  players = players.filter(p => p !== name);
  savePlayers();
  renderPlayerList();
  renderSelectors();
  renderSetupSchedule();
  renderMatchSummary();
}

function renderPlayerList() {
  const list = document.getElementById("player-list");
  if (!list) return;
  list.innerHTML = "";

  players.forEach(p => {
    const li = document.createElement("li");
    li.textContent = p + " ";

    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.onclick = () => removePlayer(p);

    li.appendChild(btn);
    list.appendChild(li);
  });
}

/* ============================================================
   SELECTORS (Singles, Doubles, Reserve)
   ============================================================ */
function renderSelectors() {
  renderSingles();
  renderDoubles();
  renderReserve();
}

function renderSingles() {
  const container = document.getElementById("singles-select");
  if (!container) return;
  container.innerHTML = "";

  for (let i = 0; i < 4; i++) {
    const select = document.createElement("select");
    
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "-- Select Player --";
    select.appendChild(defaultOpt);

    players.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      select.appendChild(opt);
    });

    select.value = matchSetup.singles[i] || "";
    select.onchange = () => {
      matchSetup.singles[i] = select.value;
      saveMatchSetup();
      renderMatchSummary();
      renderSetupSchedule();
    };

    container.appendChild(select);
  }
}

function renderDoubles() {
  const t1 = document.getElementById("doubles-team1");
  const t2 = document.getElementById("doubles-team2");

  if (t1) {
    t1.innerHTML = "";
    for (let i = 0; i < 2; i++) {
      const select = createPlayerSelect(matchSetup.doubles[0][i], (val) => {
        matchSetup.doubles[0][i] = val;
        saveMatchSetup();
        renderMatchSummary();
        renderSetupSchedule();
      });
      t1.appendChild(select);
    }
  }

  if (t2) {
    t2.innerHTML = "";
    for (let i = 0; i < 2; i++) {
      const select = createPlayerSelect(matchSetup.doubles[1][i], (val) => {
        matchSetup.doubles[1][i] = val;
        saveMatchSetup();
        renderMatchSummary();
        renderSetupSchedule();
      });
      t2.appendChild(select);
    }
  }
}

function renderReserve() {
  const container = document.getElementById("reserve-select");
  if (!container) return;
  container.innerHTML = "";

  const select = createPlayerSelect(matchSetup.reserve, (val) => {
    matchSetup.reserve = val;
    saveMatchSetup();
    renderMatchSummary();
    renderSetupSchedule();
  });

  container.appendChild(select);
}

function createPlayerSelect(currentVal, onChangeCallback) {
  const select = document.createElement("select");
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "-- Select Player --";
  select.appendChild(defaultOpt);

  players.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  });

  select.value = currentVal || "";
  select.onchange = () => onChangeCallback(select.value);
  return select;
}

/* ============================================================
   SCHEDULE REORDERING (Up / Down & Drag-Drop)
   ============================================================ */
function moveMatchUpSetup(index) {
  if (index <= 0 || index >= matchSetup.order.length) return;
  const temp = matchSetup.order[index];
  matchSetup.order[index] = matchSetup.order[index - 1];
  matchSetup.order[index - 1] = temp;

  saveMatchSetup();
  renderSetupSchedule();
  renderMatchSummary();
}

function moveMatchDownSetup(index) {
  if (index < 0 || index >= matchSetup.order.length - 1) return;
  const temp = matchSetup.order[index];
  matchSetup.order[index] = matchSetup.order[index + 1];
  matchSetup.order[index + 1] = temp;

  saveMatchSetup();
  renderSetupSchedule();
  renderMatchSummary();
}

function renderSetupSchedule() {
  const scheduleContainer = document.getElementById("setup-schedule-list") || document.getElementById("schedule-container");
  if (!scheduleContainer) return;

  scheduleContainer.innerHTML = "";

  matchSetup.order.forEach((type, idx) => {
    const div = document.createElement("div");
    div.className = "setup-schedule-item";
    div.style.cssText = "display: flex; gap: 8px; align-items: center; margin-bottom: 8px;";

    const label = document.createElement("span");
    label.innerText = (idx + 1) + ". " + formatMatchName(type);
    label.style.width = "160px";

    const btnGroup = document.createElement("div");
    btnGroup.className = "schedule-buttons";

    if (idx > 0) {
      const upBtn = document.createElement("button");
      upBtn.innerText = "▲";
      upBtn.type = "button";
      upBtn.onclick = () => moveMatchUpSetup(idx);
      btnGroup.appendChild(upBtn);
    }

    if (idx < matchSetup.order.length - 1) {
      const downBtn = document.createElement("button");
      downBtn.innerText = "▼";
      downBtn.type = "button";
      downBtn.onclick = () => moveMatchDownSetup(idx);
      btnGroup.appendChild(downBtn);
    }

    div.appendChild(label);
    div.appendChild(btnGroup);
    scheduleContainer.appendChild(div);
  });
}

function renderMatchOrder() {
  const list = document.getElementById("match-order-list");
  if (!list) return;
  list.innerHTML = "";

  matchSetup.order.forEach(type => {
    const li = document.createElement("li");
    li.textContent = formatMatchName(type);
    li.draggable = true;

    li.ondragstart = e => e.dataTransfer.setData("text/plain", type);
    li.ondragover = e => e.preventDefault();
    li.ondrop = e => {
      const dragged = e.dataTransfer.getData("text/plain");
      reorderMatches(dragged, type);
      renderMatchOrder();
      renderSetupSchedule();
      renderMatchSummary();
    };

    list.appendChild(li);
  });
}

function reorderMatches(dragged, target) {
  const arr = matchSetup.order;
  const from = arr.indexOf(dragged);
  const to = arr.indexOf(target);
  if (from !== -1 && to !== -1) {
    arr.splice(to, 0, arr.splice(from, 1)[0]);
    saveMatchSetup();
  }
}

/* ============================================================
   MATCH SUMMARY
   ============================================================ */
function renderMatchSummary() {
  const list = document.getElementById("match-summary");
  if (!list) return;
  list.innerHTML = "";

  const opp = document.createElement("li");
  opp.textContent = "Opponents: " + (matchSetup.opponentTeam || "—");
  list.appendChild(opp);

  matchSetup.order.forEach(type => {
    const li = document.createElement("li");
    li.textContent = formatMatchSummary(type);
    list.appendChild(li);
  });
}

function formatMatchSummary(type) {
  switch (type) {
    case "singles1": return `Singles 1: ${matchSetup.singles[0] || "—"}`;
    case "singles2": return `Singles 2: ${matchSetup.singles[1] || "—"}`;
    case "singles3": return `Singles 3: ${matchSetup.singles[2] || "—"}`;
    case "singles4": return `Singles 4: ${matchSetup.singles[3] || "—"}`;
    case "doubles1": return `Doubles 1: ${matchSetup.doubles[0].filter(Boolean).join(" & ") || "—"}`;
    case "doubles2": return `Doubles 2: ${matchSetup.doubles[1].filter(Boolean).join(" & ") || "—"}`;
    case "reserve": return `Reserve: ${matchSetup.reserve || "—"}`;
    default: return `${type}: —`;
  }
}

/* ============================================================
   SAVE & INITIALIZATION
   ============================================================ */
function saveMatchSetupUI() {
  const oppInput = document.getElementById("opponent-team-name");
  if (oppInput) matchSetup.opponentTeam = oppInput.value;
  saveMatchSetup();
  renderMatchSummary();
  alert("Match setup saved!");
}

function startMatch() {
  saveMatchSetup();
  window.location.href = "index.html";
}

function goBack() {
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  loadPlayers();
  loadMatchSetup();
  renderPlayerList();
  renderSelectors();
  renderSetupSchedule();
  renderMatchOrder();
  renderMatchSummary();
});