/* ============================================================
   GLOBAL STATE & PERSISTENCE
   ============================================================ */
function getValidScore(key) {
  var val = parseInt(localStorage.getItem(key), 10);
  return isNaN(val) || val <= 0 ? 501 : val;
}

var congressLegs = parseInt(localStorage.getItem("congressLegs") || "0", 10);
var opponentLegs = parseInt(localStorage.getItem("opponentLegs") || "0", 10);
if (isNaN(congressLegs)) congressLegs = 0;
if (isNaN(opponentLegs)) opponentLegs = 0;

var activeSide = localStorage.getItem("activeSide") || "congress";
var currentMatchIndex = parseInt(localStorage.getItem("currentMatchIndex") || "0", 10);
if (isNaN(currentMatchIndex)) currentMatchIndex = 0;

var congressScore = getValidScore("congressScore");
var opponentScore = getValidScore("opponentScore");

var turnHistory = JSON.parse(localStorage.getItem("scoreHistory") || "[]");
if (!Array.isArray(turnHistory)) turnHistory = [];

var matchSchedule = JSON.parse(localStorage.getItem("matchSchedule") || "[]");

var currentLegStats = JSON.parse(localStorage.getItem("currentLegStats") || JSON.stringify({
  totalScore: 0,
  dartsThrown: 0,
  hundreds: 0,
  oneForties: 0,
  oneEighties: 0,
  checkoutAttempts: 0
}));

/* ============================================================
   CHECKOUT TABLE
   ============================================================ */
var checkoutTable = {
  170: "T20 T20 Bull", 167: "T20 T19 Bull", 164: "T20 T18 Bull", 161: "T20 T17 Bull",
  160: "T20 T20 D20",  158: "T20 T20 D19",  157: "T20 T19 D20",  156: "T20 T20 D18",
  155: "T20 T19 D19",  154: "T20 T18 D20",  153: "T20 T19 D18",  152: "T20 T20 D16",
  151: "T20 T17 D20",  150: "T20 T18 D18",  149: "T20 T19 D16",  148: "T20 T16 D20",
  147: "T20 T17 D18",  146: "T20 T18 D16",  145: "T20 T15 D20",  144: "T20 T20 D12",
  143: "T20 T17 D16",  142: "T20 T14 D20",  141: "T20 T15 D18",  140: "T20 T20 D10",
  139: "T20 T13 D20",  138: "T20 T18 D12",  137: "T19 T16 D16",  136: "T20 T20 D8",
  135: "T20 T15 D15",  134: "T20 T14 D16",  133: "T20 T19 D8",   132: "T20 T16 D12",
  131: "T20 T13 D16",  130: "T20 T18 D8",   129: "T19 T16 D12",  128: "T18 T14 D16",
  127: "T20 T17 D8",   126: "T19 T19 D6",   125: "25 T20 Bull",  124: "T20 T16 D8",
  123: "T19 T16 D8",   122: "T18 T18 D7",   121: "T20 T15 D8",   120: "T20 20 D20",
  119: "T19 12 D22",   118: "T20 18 D20",   117: "T20 17 D20",   116: "T20 16 D20",
  115: "T20 15 D20",   114: "T20 14 D20",   113: "T19 16 D20",   112: "T20 12 D20",
  111: "T20 19 D16",   110: "T20 10 D20",   109: "T19 12 D20",   108: "T20 16 D16",
  107: "T19 10 D20",   106: "T20 10 D18",   105: "T19 16 D16",   104: "T20 12 D16",
  103: "T19 10 D18",   102: "T20 10 D16",   101: "T19 12 D16",   100: "T20 D20",
  99: "T19 10 D16",    98: "T20 D19",       97: "T19 D20",       96: "T20 D18",
  95: "T19 D19",       94: "T18 D20",       93: "T19 D18",       92: "T20 D16",
  91: "T17 D20",       90: "T20 D15",       89: "T19 D16",       88: "T16 D20",
  87: "T17 D18",       86: "T18 D16",       85: "T15 D20",       84: "T20 D12",
  83: "T17 D16",       82: "T14 D20",       81: "T19 D12",       80: "T20 D10",
  79: "T13 D20",       78: "T18 D12",       77: "T15 D16",       76: "T20 D8",
  75: "T17 D12",       74: "T14 D16",       73: "T19 D8",        72: "T16 D12",
  71: "T13 D16",       70: "T18 D8",        69: "T15 D12",       68: "T16 D10",
  67: "T17 D8",        66: "T10 D18",       65: "25 D20",        64: "D32",
  63: "T13 D12",       62: "T10 D16",       61: "T15 D8",        60: "20 D20",
  59: "19 D20",        58: "18 D20",        57: "17 D20",        56: "16 D20",
  55: "15 D20",        54: "14 D20",        53: "13 D20",        52: "12 D20",
  51: "11 D20",        50: "Bull",          49: "9 D20",         48: "16 D16",
  47: "15 D16",        46: "14 D16",        45: "13 D16",        44: "12 D16",
  43: "11 D16",        42: "10 D16",        41: "9 D16",         40: "D20",
  38: "D19",           36: "D18",           34: "D17",           32: "D16",
  30: "D15",           28: "D14",           26: "D13",           24: "D12",
  22: "D11",           20: "D10",           18: "D9",            16: "D8",
  14: "D7",            12: "D6",            10: "D5",            8: "D4",
  6: "D3",             4: "D2",             2: "D1"
};

function getCheckoutText(score) {
  return checkoutTable[score] || "";
}

function saveGameState() {
  localStorage.setItem("congressLegs", congressLegs);
  localStorage.setItem("opponentLegs", opponentLegs);
  localStorage.setItem("activeSide", activeSide);
  localStorage.setItem("currentMatchIndex", currentMatchIndex);
  localStorage.setItem("congressScore", congressScore);
  localStorage.setItem("opponentScore", opponentScore);
  localStorage.setItem("scoreHistory", JSON.stringify(turnHistory));
  localStorage.setItem("currentLegStats", JSON.stringify(currentLegStats));
  localStorage.setItem("matchSchedule", JSON.stringify(matchSchedule));
}

/* ============================================================
   MANUAL ACTIVE SIDE SELECTION
   ============================================================ */
function setActiveSide(side) {
  if (side === "congress" || side === "opponents") {
    activeSide = side;
    saveGameState();
    updateUI();
  }
}

/* ============================================================
   KEYPAD INPUT
   ============================================================ */
function appendKey(num) {
  var input = document.getElementById("score-input-display");
  if (!input) return;
  if (input.value.length < 3) {
    input.value += num;
  }
}

function clearKeypad() {
  var input = document.getElementById("score-input-display");
  if (input) input.value = "";
}

function submitKeypadScore() {
  var input = document.getElementById("score-input-display");
  if (!input || input.value === "") return;
  var score = parseInt(input.value, 10);
  handleScoreInput(score);
  input.value = "";
}

document.addEventListener("keydown", function(e) {
  var input = document.getElementById("score-input-display");
  if (!input) return;

  if (e.key >= "0" && e.key <= "9") {
    appendKey(e.key);
  } else if (e.key === "Enter") {
    e.preventDefault();
    submitKeypadScore();
  } else if (e.key === "Backspace" || e.key === "Delete") {
    e.preventDefault();
    clearKeypad();
  }
});

/* ============================================================
   SCORING LOGIC
   ============================================================ */
function handleScoreInput(score) {
  if (isNaN(score) || score < 0 || score > 180) return;

  var currentMatch = matchSchedule[currentMatchIndex] || {};
  var currentPlayerName = currentMatch.homePlayer || "Congress Player";

  if (activeSide === "congress") {
    if (score > congressScore || congressScore - score === 1) {
      turnHistory.push({ id: Date.now(), side: "congress", score: 0, bust: true });
      activeSide = "opponents";
      saveGameState();
      updateUI();
      return;
    }

    congressScore -= score;
    turnHistory.push({ id: Date.now(), side: "congress", score: score, bust: false });

    currentLegStats.totalScore += score;
    currentLegStats.dartsThrown += 3;

    if (score === 180) currentLegStats.oneEighties++;
    else if (score >= 140) currentLegStats.oneForties++;
    else if (score >= 100) currentLegStats.hundreds++;

    if (congressScore <= 170) currentLegStats.checkoutAttempts++;

    if (congressScore === 0) {
      congressLegs++;
      updatePlayerStatsOnLegEnd(currentPlayerName, true);
      checkLegProgression("congress");
      return;
    }

    activeSide = "opponents";

  } else {
    if (score > opponentScore || opponentScore - score === 1) {
      turnHistory.push({ id: Date.now(), side: "opponents", score: 0, bust: true });
      activeSide = "congress";
      saveGameState();
      updateUI();
      return;
    }

    opponentScore -= score;
    turnHistory.push({ id: Date.now(), side: "opponents", score: score, bust: false });

    if (opponentScore === 0) {
      opponentLegs++;
      updatePlayerStatsOnLegEnd(currentPlayerName, false);
      checkLegProgression("opponents");
      return;
    }

    activeSide = "congress";
  }

  saveGameState();
  updateUI();
}

/* ============================================================
   STAT TRACKING
   ============================================================ */
function updatePlayerStatsOnLegEnd(playerName, won) {
  if (!playerName) return;

  var currentMatch = matchSchedule[currentMatchIndex] || {};
  var matchType = (currentMatch.title || currentMatch.type || "").toLowerCase();

  if (matchType.includes("double") || playerName.includes("&")) {
    return;
  }

  var players = JSON.parse(localStorage.getItem("congressPlayers") || "[]");
  var targetName = playerName.trim().toLowerCase();

  players.forEach(function(player) {
    if (player.name.trim().toLowerCase() === targetName) {
      player.totalScore += currentLegStats.totalScore;
      player.dartsThrown += currentLegStats.dartsThrown;
      player.hundreds += currentLegStats.hundreds;
      player.oneForties += currentLegStats.oneForties;
      player.oneEighties += currentLegStats.oneEighties;
      player.checkoutAttempts += currentLegStats.checkoutAttempts;

      if (won) {
        player.legsWon = (player.legsWon || 0) + 1;
        player.checkoutsHit = (player.checkoutsHit || 0) + 1;
      } else {
        player.legsLost = (player.legsLost || 0) + 1;
      }
    }
  });

  localStorage.setItem("congressPlayers", JSON.stringify(players));
}

function checkLegProgression(winnerSide) {
  congressScore = 501;
  opponentScore = 501;
  turnHistory = [];
  currentLegStats = { totalScore: 0, dartsThrown: 0, hundreds: 0, oneForties: 0, oneEighties: 0, checkoutAttempts: 0 };

  var isCasual = localStorage.getItem("isCasualMode") === "true";

  if (isCasual) {
    // 🎯 CASUAL MODE: Alternate active side on each leg, never force-end the match or show Bull-Up modal
    var totalLegsPlayed = congressLegs + opponentLegs;
    activeSide = (totalLegsPlayed % 2 === 0) ? "congress" : "opponents";

    // Hide Bull modal if it happens to be visible
    var bullModal = document.getElementById("bull-modal") || document.getElementById("bull-off-modal");
    if (bullModal) bullModal.style.display = "none";
  } else {
    // 🏆 OFFICIAL LEAGUE MODE
    var totalLegsInMatch = (congressLegs + opponentLegs) % 3;

    if (totalLegsInMatch === 2) {
      showBullUpModal();
    } else if (totalLegsInMatch === 0) {
      currentMatchIndex++;
      activeSide = "congress";
    } else {
      activeSide = winnerSide === "congress" ? "opponents" : "congress";
    }
  }

  saveGameState();
  updateUI();
}

/* ============================================================
   CASUAL MODE TOGGLE & STAT SAFEGUARD
   ============================================================ */

function startCasualMatch(homeName, awayName) {
  var p1 = homeName ? homeName.trim() : "Player 1";
  var p2 = awayName ? awayName.trim() : "Player 2";

  // Set casual flags and player names
  localStorage.setItem("isCasualMode", "true");
  localStorage.setItem("skipBullOff", "true"); // <-- Disables Bull-Off Modal
  localStorage.setItem("casualPlayer1", p1);
  localStorage.setItem("casualPlayer2", p2);
  localStorage.setItem("opponentTeamName", p2);

  // Simple 1-match schedule container
  var casualSchedule = [{
    title: "Casual Game",
    type: "Casual",
    homePlayer: p1,
    awayPlayer: p2
  }];

  localStorage.setItem("matchSchedule", JSON.stringify(casualSchedule));
  localStorage.setItem("currentMatchIndex", "0");

  // Reset scores and leg counts
  congressLegs = 0;
  opponentLegs = 0;
  congressScore = 501;
  opponentScore = 501;
  turnHistory = [];
  activeSide = "congress"; // First throw goes to Player 1 by default

  localStorage.setItem("congressLegs", "0");
  localStorage.setItem("opponentLegs", "0");
  localStorage.setItem("congressScore", "501");
  localStorage.setItem("opponentScore", "501");
  localStorage.setItem("turnHistory", "[]");
  localStorage.setItem("activeSide", "congress");

  if (typeof saveGameState === "function") {
    saveGameState();
  }

  window.location.href = "index.html";
}

// UPDATE existing stat tracking function to skip if casual mode is active
function updatePlayerStatsOnLegEnd(playerName, won) {
  // SAFEGUARD: Do NOT update stats if in Casual Mode!
  var isCasual = localStorage.getItem("isCasualMode") === "true";
  if (isCasual || !playerName) return;

  var currentMatch = matchSchedule[currentMatchIndex] || {};
  var matchType = (currentMatch.title || currentMatch.type || "").toLowerCase();

  if (matchType.includes("double") || playerName.includes("&")) {
    return;
  }

  var players = JSON.parse(localStorage.getItem("congressPlayers") || "[]");
  var targetName = playerName.trim().toLowerCase();

  players.forEach(function(player) {
    if (player.name.trim().toLowerCase() === targetName) {
      player.totalScore += currentLegStats.totalScore;
      player.dartsThrown += currentLegStats.dartsThrown;
      player.hundreds += currentLegStats.hundreds;
      player.oneForties += currentLegStats.oneForties;
      player.oneEighties += currentLegStats.oneEighties;
      player.checkoutAttempts += currentLegStats.checkoutAttempts;

      if (won) {
        player.legsWon = (player.legsWon || 0) + 1;
        player.checkoutsHit = (player.checkoutsHit || 0) + 1;
      } else {
        player.legsLost = (player.legsLost || 0) + 1;
      }
    }
  });

  localStorage.setItem("congressPlayers", JSON.stringify(players));
}

/* ============================================================
   EDIT SCORES & RESET
   ============================================================ */
function editScore(id) {
  var item = turnHistory.find(function(h) { return h.id === id; });
  if (!item) return;

  var newScoreStr = prompt("Edit score entry:", item.score);
  if (newScoreStr === null) return;
  var newScore = parseInt(newScoreStr, 10);

  if (isNaN(newScore) || newScore < 0 || newScore > 180) {
    alert("Invalid score.");
    return;
  }

  var diff = newScore - item.score;

  if (item.side === "congress") {
    if (congressScore - diff < 2 && congressScore - diff !== 0) {
      alert("Invalid edit (causes bust).");
      return;
    }
    congressScore -= diff;
  } else {
    if (opponentScore - diff < 2 && opponentScore - diff !== 0) {
      alert("Invalid edit (causes bust).");
      return;
    }
    opponentScore -= diff;
  }

  item.score = newScore;
  item.bust = false;
  saveGameState();
  updateUI();
}

function resetMatchScores() {
  if (confirm("Reset night's leg scores and current leg back to 501?")) {
    congressLegs = 0;
    opponentLegs = 0;
    congressScore = 501;
    opponentScore = 501;
    activeSide = "congress";
    currentMatchIndex = 0;
    turnHistory = [];
    currentLegStats = { totalScore: 0, dartsThrown: 0, hundreds: 0, oneForties: 0, oneEighties: 0, checkoutAttempts: 0 };
    saveGameState();
    updateUI();
  }
}

/* ============================================================
   BULL UP MODAL & UI RENDER
   ============================================================ */
function selectBullWinner(winner) {
  activeSide = winner;
  hideBullUpModal();
  saveGameState();
  updateUI();
}

function showBullUpModal() {
  var modal = document.getElementById("bull-up-modal");
  if (modal) modal.style.display = "flex";
}

function hideBullUpModal() {
  var modal = document.getElementById("bull-up-modal");
  if (modal) modal.style.display = "none";
}

  /* ============================================================
     HEADER & TEAM NAME UPDATES (CASUAL VS LEAGUE MODE)
     ============================================================ */
function updateUI() {
  var isCasual = localStorage.getItem("isCasualMode") === "true";

  // 1. Team/Player Names Display
  var cCardHeader = document.querySelector("#congress-card h2");
  var oCardHeader = document.getElementById("opponent-team-display");
  var cPlayerSub = document.getElementById("current-player-display");
  var oPlayerSub = document.getElementById("current-opponent-display");

  if (isCasual) {
    var p1 = localStorage.getItem("casualPlayer1") || "Player 1";
    var p2 = localStorage.getItem("casualPlayer2") || "Player 2";

    if (cCardHeader) cCardHeader.innerText = p1;
    if (oCardHeader) oCardHeader.innerText = p2;
    if (cPlayerSub) cPlayerSub.innerText = p1;
    if (oPlayerSub) oPlayerSub.innerText = p2;
  } else {
    var opponentTeamName = localStorage.getItem("opponentTeamName") || "Opponents";
    if (cCardHeader) cCardHeader.innerText = "Congress B";
    if (oCardHeader) oCardHeader.innerText = opponentTeamName;

    // Refresh Schedule from localStorage for League Mode
    matchSchedule = JSON.parse(localStorage.getItem("matchSchedule") || "[]");
    var currentMatch = matchSchedule[currentMatchIndex] || {};

    if (cPlayerSub) cPlayerSub.innerText = currentMatch.homePlayer || "Congress Player";
    if (oPlayerSub) oPlayerSub.innerText = currentMatch.awayPlayer || opponentTeamName;
  }

  // Update Bull Modal Button Text
  var modalOppBtn = document.getElementById("bull-modal-opp-btn");
  if (modalOppBtn) {
    modalOppBtn.innerText = isCasual 
      ? (localStorage.getItem("casualPlayer2") || "Player 2") 
      : (localStorage.getItem("opponentTeamName") || "Opponents");
  }

  // 2. Legs & Current Scores
  var cLegsEl = document.getElementById("congress-legs");
  var oLegsEl = document.getElementById("opponent-legs");
  var cScoreEl = document.getElementById("congress-score");
  var oScoreEl = document.getElementById("opponent-score");

  if (cLegsEl) cLegsEl.innerText = congressLegs;
  if (oLegsEl) oLegsEl.innerText = opponentLegs;

  if (cScoreEl) cScoreEl.innerText = congressScore > 0 ? congressScore : 501;
  if (oScoreEl) oScoreEl.innerText = opponentScore > 0 ? opponentScore : 501;

  // 3. Checkouts
  var cCheckEl = document.getElementById("congress-checkout");
  var oCheckEl = document.getElementById("opponent-checkout");

  if (cCheckEl) cCheckEl.innerText = getCheckoutText(congressScore);
  if (oCheckEl) oCheckEl.innerText = getCheckoutText(opponentScore);

  // 4. Active Turn Highlighting
  var cCard = document.getElementById("congress-card");
  var oCard = document.getElementById("opponent-card");

  if (cCard && oCard) {
    if (activeSide === "congress") {
      cCard.classList.add("active-turn");
      oCard.classList.remove("active-turn");
    } else {
      oCard.classList.add("active-turn");
      cCard.classList.remove("active-turn");
    }
  }

  // 5. Turn History List
  var cHistoryEl = document.getElementById("congress-history");
  var oHistoryEl = document.getElementById("opponent-history");

  if (cHistoryEl && oHistoryEl) {
    cHistoryEl.innerHTML = "";
    oHistoryEl.innerHTML = "";

    turnHistory.slice().reverse().forEach(function(item) {
      var row = document.createElement("div");
      row.className = "history-item";
      var labelText = item.bust ? "BUST" : item.score;
      
      row.innerHTML = '<span>' + labelText + '</span> <button onclick="event.stopPropagation(); editScore(' + item.id + ')">Edit</button>';

      if (item.side === "congress") {
        cHistoryEl.appendChild(row);
      } else {
        oHistoryEl.appendChild(row);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", function() {
  updateUI();
});