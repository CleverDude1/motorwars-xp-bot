import fetch from 'node-fetch';
import { Client, GatewayIntentBits } from 'discord.js';

// ---------- CONFIG ----------
const DISCORD_TOKEN = process.env.DISCORD_TOKEN; // Add via Railway secrets
const CHANNEL_ID = process.env.CHANNEL_ID;       // Discord channel to post
const TRACK_XP_URL = "https://mainserver.serv00.net/games/MotorWars2/track_xp.php";
const DAILY_ARCHIVE_URL = "https://mainserver.serv00.net/games/MotorWars2/reports/daily_archive.json";

// Create Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ---------- UTILITY ----------
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

// ---------- MAIN FUNCTION ----------
async function postDailyLeaderboard() {
  try {
    // 1️⃣ Trigger the PHP script to finalize XP
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

    // 3️⃣ Build leaderboard string
    const sortedPlayers = Object.entries(gains)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // top 10

    let leaderboard = `**MotorWars2 Daily XP Leaderboard (${today})**\n\n`;
    sortedPlayers.forEach(([player, xp], i) => {
      leaderboard += `**${i + 1}. ${player}** — ${xp.toLocaleString()} XP\n`;
    });

    // 4️⃣ Post to Discord
    const channel = await client.channels.fetch(CHANNEL_ID);
    await channel.send(leaderboard);
    console.log("Leaderboard posted to Discord");

  } catch (err) {
    console.error("Error posting leaderboard:", err);
  }
}

// ---------- LOGIN & RUN ----------
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  postDailyLeaderboard();
});

client.login(DISCORD_TOKEN);
