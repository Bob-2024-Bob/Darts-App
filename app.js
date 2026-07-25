import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Replace with your Firebase Config Keys
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

const checkouts = {
  170: "T20 T20 Bull", 167: "T20 T19 Bull", 164: "T20 T18 Bull", 160: "T20 T20 D20",
  100: "T20 D20", 80: "T20 D10", 60: "20 D20", 40: "D20", 32: "D16"
};

// Global App State
let team1 = { name: MY_TEAM_NAME, legs: 0 };
let team2 = { name: "Opponent Team", legs: 0 };

let activePlayer = 0; 
let starterPlayer = 0; 

const players = [
  { name: "Player 1", teamIndex: 0, score: 501, legs: 0, points: 0, darts: 0, tonPlus: 0, tons180: 0, highCheckout: 0 },
  { name: "Player 2", teamIndex: 1, score: 501, legs: 0, points: 0, darts: 0, tonPlus: 0, tons180: 0, highCheckout: 0 }
];

let inputBuffer = "";

// Setup Modal
const setupModal = document.getElementById("setup-modal");
document.getElementById("btn-save-setup").addEventListener("click", () => {
  team1.name = document.getElementById("setup-t0-name").value.trim() || MY_TEAM_NAME;
  team2.name = document.getElementById("setup-t1-name").value.trim() || "Opponents";
  players[0].name = document.getElementById("setup-p0-name").value.trim() || "Player 1";
  players[1].name = document.getElementById("setup-p1-name").value.trim() || "Opponent 1";

  // Reset stats
  players.forEach(p => {
    p.legs = 0;
    p.points = 0;
    p.darts = 0;
    p.tonPlus = 0;
    p.tons180 = 0;
    p.highCheckout = 0;
  });

  // Hide modal
  document.getElementById("setup-modal").classList.add("hidden");

  // Setup Modal
const setupModal = document.getElementById("setup-modal");

document.getElementById("btn-save-setup").addEventListener("click", () => {
  team1.name = document.getElementById("setup-t0-name").value.trim() || MY_TEAM_NAME;
  team2.name = document.getElementById("setup-t1-name").value.trim() || "Opponents";
  players[0].name = document.getElementById("setup-p0-name").value.trim() || "Player 1";
  players[1].name = document.getElementById("setup-p1-name").value.trim() || "Opponent 1";

  // Reset player stats for new match session
  players.forEach(p => {
    p.legs = 0;
    p.points = 0;
    p.darts = 0;
    p.tonPlus = 0;
    p.tons180 = 0;
    p.highCheckout = 0;
  });

  setupModal.classList.add("hidden");
  updateUI();
});

document.getElementById("btn-new-match").addEventListener("click", () => {
  setupModal.classList.remove("hidden");
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

    // Track 100+ & 180s for finishing turn
    if (pts >= 100 && pts < 180) p.tonPlus += 1;
    if (pts === 180) p.tons180 += 1;

    // Track High Checkout
    if (pts > p.highCheckout) p.highCheckout = pts;

    if (p.teamIndex === 0) team1.legs += 1;
    else team2.legs += 1;

    alert(`${p.name} won the leg with a ${pts} checkout!`);
    saveLegResult(p.name, p.teamIndex === 0 ? team1.name : team2.name);
    resetLeg();
    return;
  } else {
    p.score = remaining;
    p.points += pts;
    p.darts += 3;

    // Track 100+ and 180s
    if (pts >= 100 && pts < 180) p.tonPlus += 1;
    if (pts === 180) p.tons180 += 1;
  }

  activePlayer = activePlayer === 0 ? 1 : 0;
  updateUI();
}

function updateUI() {
  // TEAM NAMES
  document.getElementById("t0-name").innerText = team1.name;
  document.getElementById("t1-name").innerText = team2.name;

  // PLAYER NAMES
  document.getElementById("t0-player-indicator").innerText = players[0].name;
  document.getElementById("t1-player-indicator").innerText = players[1].name;

  // SCORES
  document.getElementById("t0-score").innerText = players[0].score;
  document.getElementById("t1-score").innerText = players[1].score;

  // CHECKOUT SUGGESTIONS
  document.getElementById("t0-checkout").innerText = checkouts[players[0].score] || "";
  document.getElementById("t1-checkout").innerText = checkouts[players[1].score] || "";

  // LEGS WON
  document.getElementById("t0-legs").innerText = players[0].legs;
  document.getElementById("t1-legs").innerText = players[1].legs;

  // EVENING SCOREBOARD (top bar)
  document.getElementById("t0-evening-name").innerText = team1.name;
  document.getElementById("t1-evening-name").innerText = team2.name;
  document.getElementById("t0-evening-score").innerText = team1.legs;
  document.getElementById("t1-evening-score").innerText = team2.legs;

  // ACTIVE PLAYER HIGHLIGHT
  document.getElementById("team-0-card").classList.toggle("active-thrower", activePlayer === 0);
  document.getElementById("team-1-card").classList.toggle("active-thrower", activePlayer === 1);
}


function calculateAvg(p) {
  return p.darts > 0 ? ((p.points / p.darts) * 3).toFixed(2) : "0.00";
}

function resetLeg() {
  players[0].score = 501;
  players[1].score = 501;
  starterPlayer = starterPlayer === 0 ? 1 : 0;
  activePlayer = starterPlayer;
  updateUI();
}

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

// Global Delete Handler
window.deleteMatch = async function(id) {
  if (confirm("Are you sure you want to delete this match record?")) {
    await deleteDoc(doc(db, "matches", id));
  }
};

// Realtime Firestore Sync
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

    // 1. Populate History Table
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${data.winner}</strong></td>
      <td>${data.p1Name} vs ${data.p2Name}</td>
      <td>${data.p1Avg ? data.p1Avg.toFixed(2) : '-'}</td>
      <td><button class="btn-delete" onclick="deleteMatch('${docId}')">Delete</button></td>
    `;
    historyList.appendChild(tr);

    // 2. Filter & Aggregate ONLY for Congress B Players
    const isTeam1Congress = data.team1Name && data.team1Name.trim().toLowerCase() === MY_TEAM_NAME.toLowerCase();
    const isTeam2Congress = data.team2Name && data.team2Name.trim().toLowerCase() === MY_TEAM_NAME.toLowerCase();

    // Check Player 1
    if (isTeam1Congress && data.p1Name) {
      const isWon = data.winner === data.p1Name;
      trackPlayerStats(teamPlayerStats, data.p1Name, isWon, data.p1Points, data.p1Darts, data.p1TonPlus, data.p1Tons180, data.p1HighOut);
    }

    // Check Player 2
    if (isTeam2Congress && data.p2Name) {
      const isWon = data.winner === data.p2Name;
      trackPlayerStats(teamPlayerStats, data.p2Name, isWon, data.p2Points, data.p2Darts, data.p2TonPlus, data.p2Tons180, data.p2HighOut);
    }
  });

  // Render Congress B Detailed Performance Table
  Object.keys(teamPlayerStats).forEach(playerName => {
    const stat = teamPlayerStats[playerName];
    const overallAvg = stat.totalDarts > 0 ? ((stat.totalPoints / stat.totalDarts) * 3).toFixed(2) : "0.00";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${playerName}</strong></td>
      <td><strong>${overallAvg}</strong></td>
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
      matches: 0, legsWon: 0, legsLost: 0, 
      totalPoints: 0, totalDarts: 0, 
      tonPlus: 0, tons180: 0, highOut: 0 
    };
  }
  const p = statsObj[playerName];
  p.matches += 1;
  if (isWin) p.legsWon += 1;
  else p.legsLost += 1;

  if (points) p.totalPoints += points;
  if (darts) p.totalDarts += darts;
  if (tonPlus) p.tonPlus += tonPlus;
  if (tons180) p.tons180 += tons180;
  if (highOut && highOut > p.highOut) p.highOut = highOut;
}

updateUI();
})