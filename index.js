import fetch from 'node-fetch';

// ---------- CONFIG ----------
const WEBHOOK_URL = process.env.WEBHOOK_URL; // Add via Railway secrets
const TRACK_XP_URL = "https://mainserver.serv00.net/games/MotorWars2/track_xp.php";
const DAILY_ARCHIVE_URL = "https://mainserver.serv00.net/games/MotorWars2/reports/daily_archive.json";

// ---------- UTILITY ----------
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

// ---------- MAIN FUNCTION ----------
async function postDailyLeaderboard() {
  try {
    // 1️⃣ Trigger PHP to finalize XP
    await fetch(TRACK_XP_URL);
    console.log("track_xp.php executed successfully");

    // 2️⃣ Fetch daily archive
    const archive = await fetchJson(DAILY_ARCHIVE_URL);

    const today = new Date().toISOString().split('T')[0];
    if (!archive[today]) {
      console.log("No XP data for today yet");
      return;
    }

    const gains = archive[today];

    // 3️⃣ Build leaderboard string (top 10)
    const sortedPlayers = Object.entries(gains)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    let leaderboard = `**MotorWars2 Daily XP Leaderboard (${today})**\n\n`;
    sortedPlayers.forEach(([player, xp], i) => {
      leaderboard += `**${i + 1}. ${player}** — ${xp.toLocaleString()} XP\n`;
    });

    // 4️⃣ Send to Discord webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: leaderboard })
    });

    if (!response.ok) throw new Error(`Webhook failed: ${response.status}`);
    console.log("Leaderboard posted via webhook");

  } catch (err) {
    console.error("Error posting leaderboard:", err);
  }
}

// ---------- RUN ----------
postDailyLeaderboard();
