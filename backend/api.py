import os
import sys
from collections import defaultdict, Counter
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# Garante que a raiz do projeto esteja no sys.path para importar database.loader
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from database import loader

app = FastAPI(
    title="VALORANT Tactical Analytics API - Hackathon",
    description="Back-end em Python (FastAPI) servindo dados táticos de Engajamento, Economia e Impacto Invisível",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache em memória para respostas instantâneas
CACHE = {}


def clamp_score(val: float) -> float:
    return round(max(0.0, min(100.0, val)), 1)


def compute_hexagon(acs: float, kast_pct: float, hs_pct: float, first_kills: int, adr: float, assists: int, rounds_played: int) -> dict:
    rp = max(1, rounds_played)
    combate = clamp_score((acs - 100.0) / 2.0)
    consistencia = clamp_score((kast_pct - 50.0) * 2.0)
    mira = clamp_score((hs_pct - 10.0) * 3.33)
    agressividade = clamp_score((first_kills / rp) * 450.0)
    dano = clamp_score((adr - 70.0) * 1.0)
    suporte = clamp_score((assists / rp) * 200.0)
    overall = round((combate + consistencia + mira + agressividade + dano + suporte) / 6.0, 1)
    return {
        "combate": combate,
        "consistencia": consistencia,
        "mira": mira,
        "agressividade": agressividade,
        "dano": dano,
        "suporte": suporte,
        "overall": overall,
    }


@app.on_event("startup")
def load_cache():
    CACHE["dictionary"] = loader.get_dictionary()
    CACHE["matches"] = loader.get_matches()
    CACHE["teams"] = loader.get_teams_summary()
    CACHE["players"] = loader.get_players_summary()
    CACHE["match_players"] = loader.get_match_players()
    CACHE["rounds"] = loader.get_rounds()
    CACHE["kills"] = loader.get_kills_tactical()
    CACHE["synergy"] = loader.get_synergy_pairs()


def generate_team_coaching_feedback(team: dict, roster_stats: list, synergy: list, econ_stats: dict) -> list:
    """Gera insights automáticos de coaching baseados nos 3 pilares do projeto."""
    feedback = []

    # 1. Frente 1: Engajamento, First Kill, Trades e Espaçamento
    conv_5v4 = team.get("conversion5v4Rate", 0)
    fk_rate = team.get("firstKillRate", 0)
    iso_rate = team.get("isolatedDeathRate", 0)
    trade_rate = team.get("tradedDeathRate", 0)

    if conv_5v4 >= 75:
        feedback.append({
            "pillar": "Engajamento & Espaçamento",
            "type": "positive",
            "title": f"Excelente Conversão de Vantagem 5v4 ({conv_5v4}%)",
            "description": f"Quando a equipe conquista a First Kill (taxa de {fk_rate}% dos rounds), mantém forte disciplina tática e fecha {conv_5v4}% dos rounds."
        })
    elif conv_5v4 < 68:
        feedback.append({
            "pillar": "Engajamento & Espaçamento",
            "type": "warning",
            "title": f"Alerta de Entrega em Vantagem Numérica 5v4 ({conv_5v4}%)",
            "description": f"O time consegue a First Kill em {fk_rate}% dos rounds, mas só converte {conv_5v4}% deles em vitória. Recomenda-se recuar para jogar em crossfire após o primeiro abate."
        })

    if iso_rate > 45:
        worst_iso = max(roster_stats, key=lambda x: x["isolatedDeaths"]) if roster_stats else None
        extra = f" Atenção especial ao posicionamento de {worst_iso['gameName']} ({worst_iso['isolatedDeaths']} mortes isoladas)." if worst_iso else ""
        feedback.append({
            "pillar": "Engajamento & Espaçamento",
            "type": "danger",
            "title": f"Alto Índice de Mortes Isoladas ({iso_rate}% sem Trade)",
            "description": f"Quase metade das mortes ocorrem a mais de 20m de qualquer aliado (distância média: {team.get('avgNearestAllyDistOnDeathMeters', 0)}m), dificultando a troca (taxa de trade em {trade_rate}%).{extra}"
        })
    else:
        feedback.append({
            "pillar": "Engajamento & Espaçamento",
            "type": "positive",
            "title": f"Bom Espaçamento para Trade ({trade_rate}% de mortes vingadas)",
            "description": f"A equipe joga próxima (distância média de {team.get('avgNearestAllyDistOnDeathMeters', 0)}m do aliado na morte) e mantém {100 - iso_rate:.1f}% das mortes dentro de zona de suporte."
        })

    # 2. Frente 2: Termômetro de Economia
    saved_deaths = team.get("postRoundSavedWeaponDeaths", 0)
    anti_eco_throws = team.get("antiEcoThrows", 0)
    thrifty_wins = team.get("thriftyWins", 0)

    if saved_deaths > 0 or anti_eco_throws > 0:
        feedback.append({
            "pillar": "Termômetro de Economia",
            "type": "warning" if (saved_deaths >= 3 or anti_eco_throws >= 2) else "info",
            "title": f"Perdas Econômicas Evitáveis: {saved_deaths} armas salvas perdidas & {anti_eco_throws} entregas vs Eco",
            "description": (
                f"Foram detectadas {saved_deaths} mortes de jogadores armados após o fim objetivo do round (bomba já explodida/desarmada) "
                f"e {anti_eco_throws} derrotas de Full-Buy contra Eco adversário. Por outro lado, o time conquistou {thrifty_wins} rounds Thrifty."
            ),
        })

    # 3. Frente 3: Impacto Invisível (Habilidades, Dano de Suporte e Sinergia)
    if roster_stats:
        top_support = max(roster_stats, key=lambda x: x["supportDamageTotal"])
        top_caster = max(roster_stats, key=lambda x: x["castsPerRound"])
        best_duo = synergy[0] if synergy else None
        duo_txt = (
            f" A dupla de maior química é {best_duo['player1Name'].split('#')[0]} + {best_duo['player2Name'].split('#')[0]} "
            f"({best_duo['sharedAssists']} assistências diretas e {best_duo['tradesDone']} trades mútuos)."
            if best_duo
            else ""
        )
        feedback.append({
            "pillar": "Impacto Invisível (Utilitários & Suporte)",
            "type": "info",
            "title": f"Catalisador Tático: {top_support['gameName']} ({top_support['supportDamageTotal']} dano de suporte)",
            "description": (
                f"{top_support['gameName']} preparou {top_support['supportDamageRounds']} rounds causando 50+ de dano em alvos finalizados por colegas. "
                f"No uso de recursos, {top_caster['gameName']} ({top_caster['topAgent']}) lidera com {top_caster['castsPerRound']} habilidades usadas por round.{duo_txt}"
            ),
        })

    return feedback


@app.get("/api/overview")
def get_overview():
    matches = CACHE["matches"]
    teams = CACHE["teams"]
    players = CACHE["players"]
    rounds = CACHE["rounds"]
    kills = CACHE["kills"]

    map_counts = Counter(m["mapName"] for m in matches)
    tourney_counts = Counter(m["tournament"] for m in matches)

    return {
        "totals": {
            "matches": len(matches),
            "teams": len(teams),
            "players": len(players),
            "rounds": len(rounds),
            "kills": len(kills),
        },
        "mapsBreakdown": [{"mapName": k, "matches": v} for k, v in map_counts.most_common()],
        "tournamentsBreakdown": [{"tournament": k, "matches": v} for k, v in tourney_counts.most_common()],
        "topTeams": teams[:10],
        "topPlayers": players[:10],
    }


@app.get("/api/teams")
def list_teams(search: Optional[str] = Query(None)):
    teams = CACHE["teams"]
    if search:
        s = search.lower()
        teams = [t for t in teams if s in t["teamName"].lower() or s in t["teamSlug"].lower()]
    return teams


@app.get("/api/teams/{team_slug}")
def get_team_detail(team_slug: str):
    ts = team_slug.lower()
    team = next((t for t in CACHE["teams"] if t["teamSlug"] == ts), None)
    if not team:
        raise HTTPException(status_code=404, detail=f"Equipe '{team_slug}' não encontrada")

    # Filtra atuações dos jogadores especificamente por esta equipe
    mp_rows = [r for r in CACHE["match_players"] if r["teamSlug"] == ts]
    p_agg = defaultdict(lambda: {
        "puuid": "",
        "gameName": "",
        "tagLine": "",
        "riotId": "",
        "matchesPlayed": 0,
        "roundsPlayed": 0,
        "kills": 0,
        "deaths": 0,
        "assists": 0,
        "acsSum": 0.0,
        "adrSum": 0.0,
        "kastRounds": 0,
        "headshots": 0,
        "bodyshots": 0,
        "legshots": 0,
        "firstKills": 0,
        "firstDeaths": 0,
        "tradeKills": 0,
        "tradedDeaths": 0,
        "isolatedDeaths": 0,
        "postRoundDeaths": 0,
        "supportDamageTotal": 0,
        "supportDamageRounds": 0,
        "totalAbilityCasts": 0,
        "totalSpent": 0,
        "agents": Counter(),
        "roles": Counter(),
    })

    for r in mp_rows:
        p = p_agg[r["puuid"]]
        p["puuid"] = r["puuid"]
        p["gameName"] = r["gameName"]
        p["tagLine"] = r["tagLine"]
        p["riotId"] = r["riotId"]
        p["matchesPlayed"] += 1
        p["roundsPlayed"] += r["roundsPlayed"]
        p["kills"] += r["kills"]
        p["deaths"] += r["deaths"]
        p["assists"] += r["assists"]
        p["acsSum"] += r["acs"] * r["roundsPlayed"]
        p["adrSum"] += r["adr"] * r["roundsPlayed"]
        p["kastRounds"] += r.get("kastRounds", 0)
        p["headshots"] += r["headshots"]
        p["bodyshots"] += r["bodyshots"]
        p["legshots"] += r["legshots"]
        p["firstKills"] += r["firstKills"]
        p["firstDeaths"] += r["firstDeaths"]
        p["tradeKills"] += r["tradeKills"]
        p["tradedDeaths"] += r["tradedDeaths"]
        p["isolatedDeaths"] += r["isolatedDeaths"]
        p["postRoundDeaths"] += r["postRoundDeaths"]
        p["supportDamageTotal"] += r["supportDamageTotal"]
        p["supportDamageRounds"] += r["supportDamageRounds"]
        p["totalAbilityCasts"] += r["totalAbilityCasts"]
        p["totalSpent"] += r["totalSpent"]
        p["agents"][r["agentName"]] += 1
        p["roles"][r["agentRole"]] += 1

    roster_stats = []
    for puuid, p in p_agg.items():
        rp = max(1, p["roundsPlayed"])
        deaths = max(1, p["deaths"])
        shots = p["headshots"] + p["bodyshots"] + p["legshots"]
        acs_val = round(p["acsSum"] / rp, 1)
        adr_val = round(p["adrSum"] / rp, 1)
        hs_val = round((p["headshots"] / shots) * 100.0, 1) if shots > 0 else 0.0
        kast_val = round((p["kastRounds"] / rp) * 100.0, 1)
        hex_val = compute_hexagon(acs_val, kast_val, hs_val, p["firstKills"], adr_val, p["assists"], rp)
        roster_stats.append({
            "puuid": puuid,
            "gameName": p["gameName"],
            "tagLine": p["tagLine"],
            "riotId": p["riotId"],
            "matchesPlayed": p["matchesPlayed"],
            "roundsPlayed": p["roundsPlayed"],
            "topAgent": p["agents"].most_common(1)[0][0] if p["agents"] else "",
            "topRole": p["roles"].most_common(1)[0][0] if p["roles"] else "",
            "agentsPool": dict(p["agents"]),
            "kills": p["kills"],
            "deaths": p["deaths"],
            "assists": p["assists"],
            "kdRatio": round(p["kills"] / deaths, 2),
            "acs": acs_val,
            "adr": adr_val,
            "kastPercent": kast_val,
            "hsPercent": hs_val,
            "hexagon": hex_val,
            "firstKills": p["firstKills"],
            "firstDeaths": p["firstDeaths"],
            "firstKillDiff": p["firstKills"] - p["firstDeaths"],
            "tradeKills": p["tradeKills"],
            "tradedDeaths": p["tradedDeaths"],
            "isolatedDeaths": p["isolatedDeaths"],
            "isolatedDeathRate": round((p["isolatedDeaths"] / deaths) * 100.0, 1),
            "postRoundDeaths": p["postRoundDeaths"],
            "supportDamageTotal": p["supportDamageTotal"],
            "supportDamageRounds": p["supportDamageRounds"],
            "totalAbilityCasts": p["totalAbilityCasts"],
            "castsPerRound": round(p["totalAbilityCasts"] / rp, 2),
        })

    roster_stats.sort(key=lambda x: x["acs"], reverse=True)

    # Economia por tipo de compra
    team_rounds = [
        r for r in CACHE["rounds"]
        if r["redTeamSlug"] == ts or r["blueTeamSlug"] == ts
    ]
    econ_Tracker = defaultdict(lambda: {"played": 0, "won": 0, "totalLoadout": 0})
    for r in team_rounds:
        is_red = (r["redTeamSlug"] == ts)
        buy_type = r["redBuyType"] if is_red else r["blueBuyType"]
        loadout = r["redLoadoutValue"] if is_red else r["blueLoadoutValue"]
        won = (r["winningTeamSlug"] == ts)
        econ_Tracker[buy_type]["played"] += 1
        if won:
            econ_Tracker[buy_type]["won"] += 1
        econ_Tracker[buy_type]["totalLoadout"] += loadout

    economy_breakdown = []
    for btype in ["Pistol", "Eco", "Semi-Buy / Forçado", "Full-Buy (Armado)"]:
        st = econ_Tracker[btype]
        played = st["played"]
        economy_breakdown.append({
            "buyType": btype,
            "roundsPlayed": played,
            "roundsWon": st["won"],
            "winRate": round((st["won"] / max(1, played)) * 100.0, 1) if played > 0 else 0.0,
            "avgTeamLoadout": round(st["totalLoadout"] / max(1, played), 0) if played > 0 else 0,
        })

    team_synergy = [s for s in CACHE["synergy"] if s["teamSlug"] == ts][:10]
    team_matches = [
        m for m in CACHE["matches"]
        if m["teamRedSlug"] == ts or m["teamBlueSlug"] == ts
    ]

    feedback = generate_team_coaching_feedback(team, roster_stats, team_synergy, economy_breakdown)

    return {
        "summary": team,
        "coachingFeedback": feedback,
        "rosterStats": roster_stats,
        "economyBreakdown": economy_breakdown,
        "synergyPairs": team_synergy,
        "matches": team_matches,
    }


@app.get("/api/matches/{match_id}")
def get_match_detail(match_id: str):
    match = next(
        (m for m in CACHE["matches"] if m["matchId"] == match_id or m["matchCode"] == match_id),
        None,
    )
    if not match:
        raise HTTPException(status_code=404, detail="Partida não encontrada")

    mid = match["matchId"]
    players = [p for p in CACHE["match_players"] if p["matchId"] == mid]
    rounds = [r for r in CACHE["rounds"] if r["matchId"] == mid]
    kills = [k for k in CACHE["kills"] if k["matchId"] == mid]

    return {
        "match": match,
        "players": sorted(players, key=lambda x: x["acs"], reverse=True),
        "rounds": rounds,
        "kills": kills,
    }


@app.get("/api/players")
def list_players(
    team_slug: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
):
    players = CACHE["players"]
    if team_slug:
        ts = team_slug.lower()
        players = [p for p in players if p["teamSlug"] == ts]
    if role:
        rl = role.lower()
        players = [p for p in players if p["topRole"].lower() == rl]
    if search:
        s = search.lower()
        players = [p for p in players if s in p["riotId"].lower() or s in p["teamName"].lower()]
    return players[:limit]
