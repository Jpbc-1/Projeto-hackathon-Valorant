import os
import json
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_DIR = os.path.join(BASE_DIR, "json")
SQLITE_PATH = os.path.join(BASE_DIR, "valorant_hackathon.sqlite")


def _load_json(filename):
    with open(os.path.join(JSON_DIR, filename), "r", encoding="utf-8") as f:
        return json.load(f)


def get_dictionary():
    """Retorna os dicionários de tradução (mapas, agentes, armas, escudos)."""
    return _load_json("dictionary.json")


def get_matches(tournament=None, team_slug=None, map_name=None):
    """Retorna a lista de partidas (336 partidas), com filtros opcionais."""
    matches = _load_json("matches.json")
    if tournament:
        matches = [m for m in matches if m["tournament"].lower() == tournament.lower()]
    if team_slug:
        ts = team_slug.lower()
        matches = [m for m in matches if m["teamRedSlug"] == ts or m["teamBlueSlug"] == ts]
    if map_name:
        mn = map_name.lower()
        matches = [m for m in matches if mn in m["mapName"].lower() or mn == m["mapSlug"]]
    return matches


def get_teams_summary(team_slug=None):
    """Retorna o resumo consolidado das 68 equipes (ou de uma equipe específica)."""
    teams = _load_json("teams_summary.json")
    if team_slug:
        ts = team_slug.lower()
        for t in teams:
            if t["teamSlug"] == ts or ts in t["teamName"].lower():
                return t
        return None
    return teams


def get_players_summary(team_slug=None, role=None):
    """Retorna o resumo consolidado dos 411 jogadores, filtrável por time ou função."""
    players = _load_json("players_summary.json")
    if team_slug:
        ts = team_slug.lower()
        players = [p for p in players if p["teamSlug"] == ts]
    if role:
        rl = role.lower()
        players = [p for p in players if p["topRole"].lower() == rl]
    return players


def get_match_players(match_id=None, team_slug=None, puuid=None):
    """Retorna o desempenho detalhado por partida (3.360 registros)."""
    rows = _load_json("match_players.json")
    if match_id:
        rows = [r for r in rows if r["matchId"] == match_id or r["matchCode"] == match_id]
    if team_slug:
        ts = team_slug.lower()
        rows = [r for r in rows if r["teamSlug"] == ts]
    if puuid:
        rows = [r for r in rows if r["puuid"] == puuid]
    return rows


def get_rounds(match_id=None, team_slug=None):
    """Retorna todos os 6.618 rounds com economia, first kill e pós-plant."""
    rows = _load_json("rounds.json")
    if match_id:
        rows = [r for r in rows if r["matchId"] == match_id or r["matchCode"] == match_id]
    if team_slug:
        ts = team_slug.lower()
        rows = [r for r in rows if r["redTeamSlug"] == ts or r["blueTeamSlug"] == ts]
    return rows


def get_kills_tactical(match_id=None, team_slug=None):
    """Retorna os 46.753 eventos de abate com First Kill, Trade, Distância de Aliado e Coordenadas."""
    rows = _load_json("kills_tactical.json")
    if match_id:
        rows = [r for r in rows if r["matchId"] == match_id or r["matchCode"] == match_id]
    if team_slug:
        ts = team_slug.lower()
        rows = [r for r in rows if r["killerTeam"] == ts or r["victimTeam"] == ts]
    return rows


def get_synergy_pairs(team_slug=None):
    """Retorna os pares de sinergia (assistências + trades em dupla) por equipe."""
    rows = _load_json("synergy_pairs.json")
    if team_slug:
        ts = team_slug.lower()
        rows = [r for r in rows if r["teamSlug"] == ts]
    return rows


def query_sql(sql_query, params=()):
    """Executa uma query SQL diretamente no banco SQLite e retorna lista de dicts."""
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(sql_query, params)
    result = [dict(row) for row in cur.fetchall()]
    conn.close()
    return result
