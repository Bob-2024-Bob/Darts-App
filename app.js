import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBo0Xq73bn7LeS0dFSkvpfpbbU0pXp80Uc",
  authDomain: "team-darts-app.firebaseapp.com",
  projectId: "team-darts-app",
  storageBucket: "team-darts-app.firebasestorage.app",
  messagingSenderId: "180812615155",
  appId: "1:180812615155:web:38cc89978f5f4a4ae6d686",
  measurementId: "G-P8SHGGVFS4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const matchesRef = collection(db, "matches");

const MY_TEAM_NAME = "Congress B";

// Checkout suggestions
const checkouts = {
  170: "T20 T20 Bull", 167: "T20 T19 Bull", 164: "T20 T18 Bull", 160: "T20 T20 D20",
  100: "T20 D20", 80: "T20 D10", 60: "20 D20", 40: "D20", 32: "D16"
};

// Global State
let team1 = { name: MY_TEAM_NAME, legs: 0 };
let team2 = { name: "Opponents", legs: 0 };

let activePlayer = 0;
let starterPlayer = 0;

const players = [
  { name: "Player 1", teamIndex: 0, score: 501, legs: 0, points: 0, darts: 0, tonPlus: 0, tons180: 0, highCheckout: 0 },
  { name: "Opponent 1", teamIndex: 1, score: 501, legs: 0, points: 0, darts: 0, tonPlus: 0, tons180: 0, highCheckout: 0 }
];

let inputBuffer = "";

/* ------------------------------
   SETUP MODAL
------------------------------ */
const setupModal = document.getElementById("setup-modal");

document.getElementById("btn-save-setup").addEventListener("click", () => {
  team1.name = document.getElementById("setup-t0-name").value.trim() || MY_TEAM_NAME;
  team2.name = document.getElementById("setup-t1-name").value.trim() || "Opponents";
  players[0].name = document.getElementById("setup-p0-name").value.trim() || "Player 1";
  players[1].name = document.getElementById("setup-p1-name").value.trim() || "Opponent 1";

  // Reset stats
  players.forEach(p => {
    p.score = 501;
    p.legs = 0;
    p.points = 0;
    p.darts = 0;
    p.tonPlus = 0;
    p.tons180 = 0;
    p.highCheckout = 0;
  });

  team1.legs = 0;
  team2.legs = 0;

  activePlayer = 0;
  starterPlayer = 0;

  setupModal.classList.add("hidden");
  updateUI();
});

document.getElementById("btn-new-match").addEventListener("click", () => {
  setupModal.classList.remove("hidden");
});

/* ------------------------------
   KEYPAD
------------------------------ */
document.querySelectorAll(".btn-num").forEach(btn => {
  btn.addEventListener("click", () => {
    if (inputBuffer.length < 3) {
      inputBuffer += btn.dataset.val;
      document.getElementById("input-buffer").innerText = inputBuffer;
    }
  });
});

document.getElementById("btn-clear").addEventListener("click", () => {
  inputBuffer = "";
  document.getElementById("input-buffer").innerText = "0";
});

document.getElementById("btn-enter").addEventListener("click", () => {
  const turnScore = parseInt(inputBuffer, 10) || 0;

  if (turnScore > 180) {
    alert("Max turn score is 180!");
    inputBuffer = "";
    document.getElementById("input-buffer").innerText = "0";
    return;
  }

  processTurn(turnScore);
  inputBuffer = "";
  document.getElementById("input-buffer").innerText = "0";
});

/* ------------------------------
   PROCESS TURN
------------------------------ */
function processTurn(pts) {
  const p = players[activePlayer];
  const remaining = p.score - pts;

  if (remaining < 0 || remaining === 1) {
    alert(`${p.name} BUSTED!`);
    p.darts += 3;
  } else if (remaining === 0) {
    p.legs += 1;
    p.points += pts;
    p.darts += 3;

    if (pts >= 100 && pts < 180) p.tonPlus++;
    if (pts === 180) p.tons180++;

    if (pts > p.highCheckout) p.highCheckout = pts;

    if (p.teamIndex === 0) team1.legs++;
    else team2.legs++;

    alert(`${p.name} won the leg with a ${pts} checkout!`);
    saveLegResult(p.name, p.teamIndex === 0 ? team1.name : team2.name);
    resetLeg();
    return;
  } else {
    p.score = remaining;
    p.points += pts;
    p.darts += 3;

    if (pts >= 100 && pts < 180) p.tonPlus++;
    if (pts === 180) p.tons180++;
  }

  activePlayer = activePlayer === 0 ? 1 : 0;
  updateUI();
}

/* ------------------------------
   UPDATE UI
------------------------------ */
function updateUI() {
  document.getElementById("t0-name").innerText = team1.name;
  document.getElementById("t1-name").innerText = team2.name;

  document.getElementById("t0-player-indicator").innerText = players[0].name;
  document.getElementById("t1-player-indicator").innerText = players[1].name;

  document.getElementById("t0-score").innerText = players[0].score;
  document.getElementById("t1-score").innerText = players[1].score;

  document.getElementById("t0-checkout").innerText = checkouts[players[0].score] || "";
  document.getElementById("t1-checkout").innerText = checkouts[players[1].score] || "";

  document.getElementById("t0-legs").innerText = players[0].legs;
  document.getElementById("t1-legs").innerText = players[1].legs;

  document.getElementById("t0-evening-name").innerText = team1.name;
  document.getElementById("t1-evening-name").innerText = team2.name;

  document.getElementById("t0-evening-score").innerText = team1.legs;
  document.getElementById("t1-evening-score").innerText = team2.legs;

  document.getElementById("team-0-card").classList.toggle("active-thrower", activePlayer === 0);
  document.getElementById("team-1-card").classList.toggle("active-thrower", activePlayer === 1);
}

/* ------------------------------
   RESET LEG
------------------------------ */
function resetLeg() {
  players[0].score = 501;
  players[1].score = 501;

  starterPlayer = starterPlayer === 0 ? 1 : 0;
  activePlayer = starterPlayer;

  updateUI();
}

/* ------------------------------
   SAVE LEG TO FIRESTORE
------------------------------ */
async function saveLegResult(winnerPlayer, winnerTeam) {
  const record = {
    team1Name: team1.name,
    team2Name: team2.name,
    p1Name: players[0].name,
    p2Name: players[1].name,
    winner: winnerPlayer,
    teamWinner: winnerTeam,
    p1Avg: parseFloat(calculateAvg(players[0])),
    p2Avg: parseFloat(calculateAvg(players[1])),
    p1Points: players[0].points,
    p1Darts: players[0].darts,
    p1TonPlus: players[0].tonPlus,
    p1Tons180: players[0].tons180,
    p1HighOut: players[0].highCheckout,
    p2Points: players[1].points,
    p2Darts: players[1].darts,
    p2TonPlus: players[1].tonPlus,
    p2Tons180: players[1].tons180,
    p2HighOut: players[1].highCheckout,
    createdAt: serverTimestamp()
  };

  await addDoc(matchesRef, record);
}

function calculateAvg(p) {
  return p.darts > 0 ? ((p.points / p.darts) * 3).toFixed(2) : "0.00";
}

/* ------------------------------
   DELETE MATCH
------------------------------ */
window.deleteMatch = async function(id) {
  if (confirm("Delete this match?")) {
    await deleteDoc(doc(db, "matches", id));
  }
};

/* ------------------------------
   FIRESTORE REALTIME LISTENER
------------------------------ */
const q = query(matchesRef, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  const historyList = document.getElementById("history-list");
  const teamStatsList = document.getElementById("team-stats-list");

  historyList.innerHTML = "";
  teamStatsList.innerHTML = "";

  const teamPlayerStats = {};

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const docId = docSnapshot.id;

    // History Table
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${data.winner}</strong></td>
      <td>${data.p1Name} vs ${data.p2Name}</td>
      <td>${data.p1Avg ? data.p1Avg.toFixed(2) : "-"}</td>
      <td><button class="btn-delete" onclick="deleteMatch('${docId}')">Delete</button></td>
    `;
    historyList.appendChild(tr);

    // Congress B Stats
    const isTeam1Congress = data.team1Name.toLowerCase() === MY_TEAM_NAME.toLowerCase();
    const isTeam2Congress = data.team2Name.toLowerCase() === MY_TEAM_NAME.toLowerCase();

    if (isTeam1Congress) {
      trackPlayerStats(teamPlayerStats, data.p1Name, data.winner === data.p1Name, data.p1Points, data.p1Darts, data.p1TonPlus, data.p1Tons180, data.p1HighOut);
    }

    if (isTeam2Congress) {
      trackPlayerStats(teamPlayerStats, data.p2Name, data.winner === data.p2Name, data.p2Points, data.p2Darts, data.p2TonPlus, data.p2Tons180, data.p2HighOut);
    }
  });

  // Render Stats
  Object.keys(teamPlayerStats).forEach(playerName => {
    const stat = teamPlayerStats[playerName];
    const avg = stat.totalDarts > 0 ? ((stat.totalPoints / stat.totalDarts) * 3).toFixed(2) : "0.00";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${playerName}</strong></td>
      <td>${avg}</td>
      <td>${stat.tonPlus}</td>
      <td>${stat.tons180}</td>
      <td>${stat.highOut}</td>
      <td>${stat.matches}</td>
      <td>${stat.legsWon} / ${stat.legsLost}</td>
    `;
    teamStatsList.appendChild(tr);
  });
});

function trackPlayerStats(statsObj, playerName, isWin, points, darts, tonPlus, tons180, highOut) {
  if (!statsObj[playerName]) {
    statsObj[playerName] = {
      matches: 0,
      legsWon: 0,
      legsLost: 0,
      totalPoints: 0,
      totalDarts: 0,
      tonPlus: 0,
      tons180: 0,
      highOut: 0
    };
  }

  const p = statsObj[playerName];
  p.matches++;

  if (isWin) p.legsWon++;
  else p.legsLost++;

  p.totalPoints += points || 0;
  p.totalDarts += darts || 0;
  p.tonPlus += tonPlus || 0;
  p.tons180 += tons180 || 0;

  if (highOut > p.highOut) p.highOut = highOut;
}

// Initial UI
updateUI();
