const fs = require("fs");
const path = require("path");

const JSON_DIR = path.join(__dirname, "json");

function loadJson(filename) {
  const filePath = path.join(JSON_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

module.exports = {
  getDictionary: () => loadJson("dictionary.json"),
  getMatches: () => loadJson("matches.json"),
  getTeamsSummary: () => loadJson("teams_summary.json"),
  getPlayersSummary: () => loadJson("players_summary.json"),
  getMatchPlayers: () => loadJson("match_players.json"),
  getRounds: () => loadJson("rounds.json"),
  getKillsTactical: () => loadJson("kills_tactical.json"),
  getSynergyPairs: () => loadJson("synergy_pairs.json"),
};
