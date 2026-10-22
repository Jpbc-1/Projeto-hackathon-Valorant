import os
import re
import json
import math
import csv
import sqlite3
from collections import defaultdict, Counter

RAW_ROOT = r"c:\Users\T-GAMER\Downloads\Dados .Json"
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database")
JSON_DIR = os.path.join(OUT_DIR, "json")
CSV_DIR = os.path.join(OUT_DIR, "csv")
SQLITE_PATH = os.path.join(OUT_DIR, "valorant_hackathon.sqlite")

# ==============================================================================
# 1. DICIONÁRIOS DE TRADUÇÃO DE UUIDs (VALORANT PADRÃO)
# ==============================================================================

MAPS = {
    "/Game/Maps/Ascent/Ascent": {"name": "Ascent", "slug": "ascent", "sites": 2},
    "/Game/Maps/Pitt/Pitt": {"name": "Pearl", "slug": "pearl", "sites": 2},
    "/Game/Maps/Triad/Triad": {"name": "Haven", "slug": "haven", "sites": 3},
    "/Game/Maps/Jam/Jam": {"name": "Lotus", "slug": "lotus", "sites": 3},
    "/Game/Maps/Bonsai/Bonsai": {"name": "Split", "slug": "split", "sites": 2},
    "/Game/Maps/Foxtrot/Foxtrot": {"name": "Breeze", "slug": "breeze", "sites": 2},
    "/Game/Maps/Canyon/Canyon": {"name": "Fracture", "slug": "fracture", "sites": 2},
    "/Game/Maps/Juliett/Juliett": {"name": "Sunset", "slug": "sunset", "sites": 2},
    "/Game/Maps/Plummet/Plummet": {"name": "Corrode (Summit)", "slug": "summit", "sites": 2},
    "/Game/Maps/Infinity/Infinity": {"name": "Abyss", "slug": "abyss", "sites": 2},
}

AGENTS = {
    "add6443a-41bd-e414-f6ad-e58d267f4e95": {"name": "Jett", "role": "Duelista"},
    "f94c3b30-42be-e959-889c-5aa313dba261": {"name": "Raze", "role": "Duelista"},
    "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc": {"name": "Reyna", "role": "Duelista"},
    "eb93336a-449b-9c1b-0a54-a891f7921d69": {"name": "Phoenix", "role": "Duelista"},
    "7f94d92c-4234-0a36-9646-3a87eb8b5c89": {"name": "Yoru", "role": "Duelista"},
    "bb2a4828-46eb-8cd1-e765-15848195d751": {"name": "Neon", "role": "Duelista"},
    "0e38b510-41a8-5780-5e8f-568b2a4f2d6c": {"name": "Iso", "role": "Duelista"},
    "92eeef5d-43b5-1d4a-8d03-b3927a09034b": {"name": "Waylay", "role": "Duelista"},
    "320b2a48-4d9b-a075-30f1-1f93a9b638fa": {"name": "Sova", "role": "Iniciador"},
    "5f8d3a7f-467b-97f3-062c-13acf203c006": {"name": "Breach", "role": "Iniciador"},
    "6f2a04ca-43e0-be17-7f36-b3908627744d": {"name": "Skye", "role": "Iniciador"},
    "601dbbe7-43ce-be57-2a40-4abd24953621": {"name": "KAY/O", "role": "Iniciador"},
    "dade69b4-4f5a-8528-247b-219e5a1facd6": {"name": "Fade", "role": "Iniciador"},
    "e370fa57-4757-3604-3648-499e1f642d3f": {"name": "Gekko", "role": "Iniciador"},
    "b444168c-4e35-8076-db47-ef9bf368f384": {"name": "Tejo", "role": "Iniciador"},
    "8e253930-4c05-31dd-1b6c-968525494517": {"name": "Omen", "role": "Controlador"},
    "9f0d8ba9-4140-b941-57d3-a7ad57c6b417": {"name": "Brimstone", "role": "Controlador"},
    "707eab51-4836-f488-046a-cda6bf494859": {"name": "Viper", "role": "Controlador"},
    "41fb69c1-4189-7b37-f117-bcaf1e96f1bf": {"name": "Astra", "role": "Controlador"},
    "95b78ed7-4637-86d9-7e41-71ba8c293152": {"name": "Harbor", "role": "Controlador"},
    "1dbf2edd-4729-0984-3115-daa5eed44993": {"name": "Clove", "role": "Controlador"},
    "569fdd95-4d10-43ab-ca70-79becc718b46": {"name": "Sage", "role": "Sentinela"},
    "117ed9e3-49f3-6512-3ccf-0cada7e3823b": {"name": "Cypher", "role": "Sentinela"},
    "1e58de9c-4950-5125-93e9-a0aee9f98746": {"name": "Killjoy", "role": "Sentinela"},
    "22697a3d-45bf-8dd7-4fec-84a9e28c69d7": {"name": "Chamber", "role": "Sentinela"},
    "cc8b64c8-4b25-4ff9-6e7f-37b4da43d235": {"name": "Deadlock", "role": "Sentinela"},
    "efba5359-4016-a1e5-7626-b1ae76895940": {"name": "Vyse", "role": "Sentinela"},
    "df1cb487-4902-002e-5c17-d28e83e78588": {"name": "Veto", "role": "Sentinela"},
}

WEAPONS = {
    "29A0CFAB-485B-F5D5-779A-B59F85E204A8": {"name": "Classic", "category": "Sidearm", "cost": 0},
    "42DA8CCC-40D5-AFFC-BEEC-15AA47B42EDA": {"name": "Shorty", "category": "Sidearm", "cost": 300},
    "44D4E95C-4157-0037-81B2-17841BF2E8E3": {"name": "Frenzy", "category": "Sidearm", "cost": 450},
    "1BAA85B4-4C70-1284-64BB-6481DFC3BB4E": {"name": "Ghost", "category": "Sidearm", "cost": 500},
    "410B2E0B-4CEB-1321-1727-20858F7F3477": {"name": "Bandit", "category": "Sidearm", "cost": 600},
    "E336C6B8-418D-9340-D77F-7A9E4CFE0702": {"name": "Sheriff", "category": "Sidearm", "cost": 800},
    "F7E1B454-4AD4-1063-EC0A-159E56B58941": {"name": "Stinger", "category": "SMG", "cost": 1100},
    "462080D1-4035-2937-7C09-27AA2A5C27A7": {"name": "Spectre", "category": "SMG", "cost": 1600},
    "910BE174-449B-C412-AB22-D0873436B21B": {"name": "Bucky", "category": "Shotgun", "cost": 850},
    "EC845BF4-4F79-DDDA-A3DA-0DB3774B2794": {"name": "Judge", "category": "Shotgun", "cost": 1850},
    "AE3DE142-4D85-2547-DD26-4E90BED35CF7": {"name": "Bulldog", "category": "Rifle", "cost": 2050},
    "4ADE7FAA-4CF1-8376-95EF-39884480959B": {"name": "Guardian", "category": "Rifle", "cost": 2250},
    "EE8E8D15-496B-07AC-E5F6-8FAE5D4C7B1A": {"name": "Phantom", "category": "Rifle", "cost": 2900},
    "9C82E19D-4575-0200-1A81-3EACF00CF872": {"name": "Vandal", "category": "Rifle", "cost": 2900},
    "C4883E50-4494-202C-3EC3-6B8A9284F00B": {"name": "Marshal", "category": "Sniper", "cost": 950},
    "5F0AAF7A-4289-3998-D5FF-EB9A5CF7EF5C": {"name": "Outlaw", "category": "Sniper", "cost": 2400},
    "A03B24D3-4319-996D-0F8C-94BBFBA1DFC7": {"name": "Operator", "category": "Sniper", "cost": 4700},
    "8DB0A1BF-4A50-832A-4566-FAAAA6D250CA": {"name": "Rifle Especial", "category": "Rifle", "cost": 2900},
    "55D8A0F4-4274-CA67-FE2C-06AB45EFDF58": {"name": "Ares", "category": "Heavy", "cost": 1600},
    "63E6C2B6-4A8E-869C-3D4C-E38355226584": {"name": "Odin", "category": "Heavy", "cost": 3200},
    "2F59173C-4BED-B6C3-2191-DEA9B58BE9C7": {"name": "Faca (Melee)", "category": "Melee", "cost": 0},
    "856D9A7E-4B06-DC37-15DC-9D809C37CB90": {"name": "Caçador de Cabeças (Chamber Q)", "category": "AbilityWeapon", "cost": 150},
    "39099FB5-4293-DEF4-1E09-2E9080CE7456": {"name": "Tour de Force (Chamber X)", "category": "AbilityWeapon", "cost": 0},
    "95336AE4-45D4-1032-CFAF-6BAD01910607": {"name": "Sobrecarga (Neon X)", "category": "AbilityWeapon", "cost": 0},
    "GrenadeAbility": {"name": "Habilidade (C)", "category": "Ability", "cost": 0},
    "Ability1": {"name": "Habilidade (Q)", "category": "Ability", "cost": 0},
    "Ability2": {"name": "Habilidade (E)", "category": "Ability", "cost": 0},
    "Ultimate": {"name": "Ultimate (X)", "category": "Ability", "cost": 0},
    "": {"name": "Desconhecido / Bomba / Queda", "category": "Other", "cost": 0},
}

ARMORS = {
    "": {"name": "Sem Escudo", "cost": 0},
    "4DEC83D5-4902-9AB3-BED6-A7A390761157": {"name": "Escudo Leve", "cost": 400},
    "B1B9086D-41BD-A516-5D29-E3B34A6F1644": {"name": "Escudo Regenerativo", "cost": 650},
    "822BCAB2-40A2-324E-C137-E09195AD7692": {"name": "Escudo Pesado", "cost": 1000},
}

FILENAME_REGEX = re.compile(
    r"^([A-Z0-9_]+?)_(\d{2}-\d{2}-\d{2})_(.+?)_(\d+)_x_(\d+)_(.+?)_([a-zA-Z]+)\.json$",
    re.IGNORECASE,
)


def classify_team_buy(avg_loadout, round_num):
    if round_num in (0, 12):
        return "Pistol"
    if avg_loadout < 1500:
        return "Eco"
    if avg_loadout < 3300:
        return "Semi-Buy / Forçado"
    return "Full-Buy (Armado)"


def get_attacker_team(round_num):
    """
    No VALORANT padrão:
    - Rounds 0 a 11 (1ª metade): Red é Attacker, Blue é Defender
    - Rounds 12 a 23 (2ª metade): Blue é Attacker, Red é Defender
    - Overtime (round >= 24): alterna a cada round
    Também podemos confirmar via winningTeam e winningTeamRole do próprio round!
    """
    if round_num < 12:
        return "Red"
    elif round_num < 24:
        return "Blue"
    else:
        return "Red" if (round_num - 24) % 2 == 0 else "Blue"


def resolve_attacker_team(r):
    wt = r.get("winningTeam")
    wtr = r.get("winningTeamRole")
    if wt in ("Red", "Blue") and wtr in ("Attacker", "Defender"):
        if wtr == "Attacker":
            return wt
        else:
            return "Blue" if wt == "Red" else "Red"
    return get_attacker_team(r.get("roundNum", 0))


def format_team_name(slug):
    return slug.replace("_", " ").upper()


def parse_tournament_stage(rel_folder, match_code):
    parts = [p for p in rel_folder.split(os.sep) if p and p != "."]
    if not parts:
        return "Geral", "Geral"
    tourney = parts[0]
    if "Univav" in tourney:
        tourney = "Univavá"
    stage = parts[1] if len(parts) > 1 else tourney
    if "Classificat" in stage:
        num = stage.split()[-1]
        stage = f"Classificatória {num}"
    return tourney, stage


def write_csv(filepath, rows, fieldnames):
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main():
    os.makedirs(JSON_DIR, exist_ok=True)
    os.makedirs(CSV_DIR, exist_ok=True)

    matches_list = []
    match_players_list = []
    rounds_list = []
    kills_tactical_list = []

    # Aggregators for Teams and Players
    team_agg = defaultdict(lambda: {
        "teamSlug": "",
        "teamName": "",
        "matchesPlayed": 0,
        "matchesWon": 0,
        "roundsPlayed": 0,
        "roundsWon": 0,
        "attackRoundsPlayed": 0,
        "attackRoundsWon": 0,
        "defenseRoundsPlayed": 0,
        "defenseRoundsWon": 0,
        "pistolRoundsPlayed": 0,
        "pistolRoundsWon": 0,
        "firstKills": 0,
        "firstDeaths": 0,
        "roundsWithFirstKill": 0,
        "roundsWonAfterFirstKill": 0,  # Conversão 5v4
        "roundsWithFirstDeath": 0,
        "roundsWonAfterFirstDeath": 0,  # Retorno 4v5
        "totalKills": 0,
        "totalDeaths": 0,
        "tradeKills": 0,
        "tradedDeaths": 0,
        "isolatedDeaths": 0,  # Mortes a > 20m (2000 unidades) de qualquer aliado
        "sumNearestAllyDistOnDeath": 0.0,
        "countDeathsWithAlly": 0,
        "postRoundSavedWeaponDeaths": 0,  # Mortes após detonação/defuse da spike
        "antiEcoThrows": 0,  # Perdeu Full-Buy contra Eco
        "thriftyWins": 0,  # Ganhou Eco contra Full-Buy
        "plants": 0,
        "postPlantWins": 0,
        "retakeAttempts": 0,
        "retakeWins": 0,
        "maps": defaultdict(lambda: {"played": 0, "won": 0}),
        "roster": set(),
    })

    player_agg = defaultdict(lambda: {
        "puuid": "",
        "gameName": "",
        "tagLine": "",
        "primaryTeamSlug": Counter(),
        "matchesPlayed": 0,
        "matchesWon": 0,
        "roundsPlayed": 0,
        "kills": 0,
        "deaths": 0,
        "assists": 0,
        "score": 0,
        "totalDamage": 0,
        "headshots": 0,
        "bodyshots": 0,
        "legshots": 0,
        "firstKills": 0,
        "firstDeaths": 0,
        "tradeKills": 0,
        "tradedDeaths": 0,
        "isolatedDeaths": 0,
        "postRoundDeaths": 0,
        "supportDamageRounds": 0,  # Rounds em que causou >=50 dano sem pegar a kill e o alvo morreu
        "supportDamageTotal": 0,
        "grenadeCasts": 0,
        "ability1Casts": 0,
        "ability2Casts": 0,
        "ultimateCasts": 0,
        "agentsPlayed": Counter(),
        "rolesPlayed": Counter(),
        "weaponsKills": Counter(),
    })

    # Sinergia de duplas (assistências + trades)
    synergy_agg = defaultdict(lambda: {
        "teamSlug": "",
        "player1Puuid": "",
        "player1Name": "",
        "player2Puuid": "",
        "player2Name": "",
        "sharedAssists": 0,
        "tradesDone": 0,
        "totalSynergyEvents": 0,
    })

    all_files = []
    for dirpath, _, filenames in os.walk(RAW_ROOT):
        for f in sorted(filenames):
            if f.lower().endswith(".json"):
                all_files.append((dirpath, f))

    print(f"Processando {len(all_files)} arquivos JSON...")

    for dirpath, filename in all_files:
        filepath = os.path.join(dirpath, filename)
        rel_dir = os.path.relpath(dirpath, RAW_ROOT)

        m = FILENAME_REGEX.match(filename)
        if not m:
            continue
        match_code, date_str, t1_slug, s1_str, s2_str, t2_slug, map_slug_file = m.groups()
        s1, s2 = int(s1_str), int(s2_str)
        t1_slug = t1_slug.lower()
        t2_slug = t2_slug.lower()
        tourney, stage = parse_tournament_stage(rel_dir, match_code)

        with open(filepath, "r", encoding="utf-8") as jf:
            data = json.load(jf)

        match_info = data.get("matchInfo", {})
        match_id = match_info.get("matchId", match_code)
        map_id = match_info.get("mapId", "")
        map_meta = MAPS.get(map_id, {"name": map_slug_file.capitalize(), "slug": map_slug_file.lower(), "sites": 2})

        teams_raw = {t["teamId"]: t for t in data.get("teams", []) if t.get("teamId") in ("Red", "Blue")}
        red_won_rounds = teams_raw.get("Red", {}).get("roundsWon", 0)
        blue_won_rounds = teams_raw.get("Blue", {}).get("roundsWon", 0)

        # Associa t1_slug e t2_slug a Red e Blue pelo placar exato
        if s1 == red_won_rounds and s2 == blue_won_rounds:
            team_red_slug, team_blue_slug = t1_slug, t2_slug
        else:
            team_red_slug, team_blue_slug = t2_slug, t1_slug

        team_slug_by_color = {"Red": team_red_slug, "Blue": team_blue_slug}
        team_name_by_color = {
            "Red": format_team_name(team_red_slug),
            "Blue": format_team_name(team_blue_slug),
        }

        winning_color = "Red" if teams_raw.get("Red", {}).get("won") else "Blue"
        winning_team_slug = team_slug_by_color[winning_color]

        # Mapeia jogadores da partida
        players_in_match = {}
        for p in data.get("players", []):
            if p.get("isObserver") or p.get("teamId") not in ("Red", "Blue"):
                continue
            puuid = p["puuid"]
            c_id = p.get("characterId")
            agent_meta = AGENTS.get(c_id, {"name": "Desconhecido", "role": "Flex"})
            t_color = p["teamId"]
            t_slug = team_slug_by_color[t_color]
            t_name = team_name_by_color[t_color]
            full_name = f"{p.get('gameName', '')}#{p.get('tagLine', '')}"

            players_in_match[puuid] = {
                "puuid": puuid,
                "gameName": p.get("gameName", ""),
                "tagLine": p.get("tagLine", ""),
                "riotId": full_name,
                "teamColor": t_color,
                "teamSlug": t_slug,
                "teamName": t_name,
                "characterId": c_id,
                "agentName": agent_meta["name"],
                "agentRole": agent_meta["role"],
                "accountLevel": p.get("accountLevel", 0),
                "stats": p.get("stats", {}),
                # Contadores táticos por partida
                "firstKills": 0,
                "firstDeaths": 0,
                "tradeKills": 0,
                "tradedDeaths": 0,
                "isolatedDeaths": 0,
                "sumAllyDistOnDeath": 0.0,
                "deathsWithAllyCount": 0,
                "postRoundDeaths": 0,
                "totalDamage": 0,
                "headshots": 0,
                "bodyshots": 0,
                "legshots": 0,
                "supportDamageTotal": 0,
                "supportDamageRounds": 0,
                "totalSpent": 0,
                "totalLoadoutValue": 0,
            }

        # Atualiza agregados básicos de partida nos times
        for color in ("Red", "Blue"):
            tslug = team_slug_by_color[color]
            tname = team_name_by_color[color]
            ta = team_agg[tslug]
            ta["teamSlug"] = tslug
            ta["teamName"] = tname
            ta["matchesPlayed"] += 1
            won_match = (color == winning_color)
            if won_match:
                ta["matchesWon"] += 1
            ta["maps"][map_meta["name"]]["played"] += 1
            if won_match:
                ta["maps"][map_meta["name"]]["won"] += 1

        # Processa round a round
        round_results = data.get("roundResults", [])
        total_rounds = len(round_results)

        for r in round_results:
            r_num = r.get("roundNum", 0)
            r_result = r.get("roundResult", "")
            r_ceremony = r.get("roundCeremony", "")
            r_winner_color = r.get("winningTeam", "")
            r_winner_slug = team_slug_by_color.get(r_winner_color, "")
            attacker_color = resolve_attacker_team(r)
            defender_color = "Blue" if attacker_color == "Red" else "Red"

            plant_time = r.get("plantRoundTime") or 0
            defuse_time = r.get("defuseRoundTime") or 0
            plant_site = r.get("plantSite") or ""
            was_planted = plant_time > 0

            # Economia e Dano no round
            team_loadout = {"Red": 0, "Blue": 0}
            team_spent = {"Red": 0, "Blue": 0}
            round_kills_raw = []
            round_damage_by_attacker = defaultdict(list)
            player_weapon_in_round = {}
            player_armor_in_round = {}
            player_loadout_in_round = {}

            for ps in r.get("playerStats", []):
                puuid = ps.get("puuid")
                if puuid not in players_in_match:
                    continue
                p_info = players_in_match[puuid]
                p_color = p_info["teamColor"]

                econ = ps.get("economy", {})
                lv = econ.get("loadoutValue", 0) or 0
                sp = econ.get("spent", 0) or 0
                w_id = (econ.get("weapon") or "").upper()
                a_id = (econ.get("armor") or "").upper()

                team_loadout[p_color] += lv
                team_spent[p_color] += sp
                p_info["totalSpent"] += sp
                p_info["totalLoadoutValue"] += lv

                player_weapon_in_round[puuid] = WEAPONS.get(w_id, {"name": w_id or "Classic", "category": "Other"})["name"]
                player_armor_in_round[puuid] = ARMORS.get(a_id, {"name": "Sem Escudo"})["name"]
                player_loadout_in_round[puuid] = lv

                # Dano causado no round
                for dmg_entry in ps.get("damage", []):
                    d_val = dmg_entry.get("damage", 0) or 0
                    hs = dmg_entry.get("headshots", 0) or 0
                    bs = dmg_entry.get("bodyshots", 0) or 0
                    ls = dmg_entry.get("legshots", 0) or 0
                    p_info["totalDamage"] += d_val
                    p_info["headshots"] += hs
                    p_info["bodyshots"] += bs
                    p_info["legshots"] += ls
                    round_damage_by_attacker[puuid].append({
                        "receiver": dmg_entry.get("receiver"),
                        "damage": d_val,
                    })

                for k in ps.get("kills", []):
                    round_kills_raw.append(k)

            # Ordena abates do round cronologicamente
            round_kills_raw.sort(key=lambda x: x.get("timeSinceRoundStartMillis", 0))

            # Identifica quem morreu no round e quem matou quem
            victims_killer = {}
            for k in round_kills_raw:
                victims_killer[k.get("victim")] = k.get("killer")

            # Calcula Dano de Suporte (causou >= 40 de dano em alguém que morreu para um aliado)
            for attacker_puuid, dmg_list in round_damage_by_attacker.items():
                if attacker_puuid not in players_in_match:
                    continue
                supp_dmg_this_round = 0
                for d_item in dmg_list:
                    rec = d_item["receiver"]
                    dmg_v = d_item["damage"]
                    if rec in victims_killer and victims_killer[rec] != attacker_puuid:
                        supp_dmg_this_round += dmg_v
                if supp_dmg_this_round > 0:
                    players_in_match[attacker_puuid]["supportDamageTotal"] += supp_dmg_this_round
                    if supp_dmg_this_round >= 50:
                        players_in_match[attacker_puuid]["supportDamageRounds"] += 1

            # Processa eventos táticos de Kill (First Kill, Trade, Distância de suporte, Pós-plant, Mortes Pós-Round)
            first_kill_color = ""
            first_killer_puuid = ""
            first_victim_puuid = ""
            trade_window_ms = 3500  # 3.5 segundos para configurar Trade

            # Determina o timestamp de encerramento objetivo do round (detonação = plant + 45000ms, ou defuseRoundTime)
            objective_end_ms = None
            if r_result == "Bomb detonated" and plant_time > 0:
                objective_end_ms = plant_time + 45000
            elif r_result == "Bomb defused" and defuse_time > 0:
                objective_end_ms = defuse_time

            for idx, k in enumerate(round_kills_raw):
                k_time = k.get("timeSinceRoundStartMillis", 0) or 0
                killer = k.get("killer", "")
                victim = k.get("victim", "")
                if killer not in players_in_match or victim not in players_in_match:
                    continue

                killer_info = players_in_match[killer]
                victim_info = players_in_match[victim]
                k_color = killer_info["teamColor"]
                v_color = victim_info["teamColor"]

                is_first_kill = (idx == 0)
                if is_first_kill:
                    first_kill_color = k_color
                    first_killer_puuid = killer
                    first_victim_puuid = victim
                    killer_info["firstKills"] += 1
                    victim_info["firstDeaths"] += 1
                    team_agg[killer_info["teamSlug"]]["firstKills"] += 1
                    team_agg[victim_info["teamSlug"]]["firstDeaths"] += 1

                # Verifica se este abate foi um TRADE de um aliado morto até 3.5s antes pelo victim atual
                is_trade_kill = False
                for prev_idx in range(idx - 1, -1, -1):
                    prev_k = round_kills_raw[prev_idx]
                    prev_time = prev_k.get("timeSinceRoundStartMillis", 0) or 0
                    if k_time - prev_time > trade_window_ms:
                        break
                    if prev_k.get("killer") == victim:
                        is_trade_kill = True
                        break

                # Verifica se a morte do victim foi VINGADA (Traded) em até 3.5s depois
                was_traded = False
                traded_by_puuid = ""
                for next_idx in range(idx + 1, len(round_kills_raw)):
                    next_k = round_kills_raw[next_idx]
                    next_time = next_k.get("timeSinceRoundStartMillis", 0) or 0
                    if next_time - k_time > trade_window_ms:
                        break
                    if next_k.get("victim") == killer:
                        was_traded = True
                        traded_by_puuid = next_k.get("killer", "")
                        break

                if is_trade_kill:
                    killer_info["tradeKills"] += 1
                    team_agg[killer_info["teamSlug"]]["tradeKills"] += 1
                if was_traded:
                    victim_info["tradedDeaths"] += 1
                    team_agg[victim_info["teamSlug"]]["tradedDeaths"] += 1
                    if traded_by_puuid in players_in_match and traded_by_puuid != victim:
                        p1, p2 = sorted([victim, traded_by_puuid])
                        syn_key = (victim_info["teamSlug"], p1, p2)
                        s_entry = synergy_agg[syn_key]
                        s_entry["teamSlug"] = victim_info["teamSlug"]
                        s_entry["player1Puuid"] = p1
                        s_entry["player1Name"] = players_in_match[p1]["riotId"]
                        s_entry["player2Puuid"] = p2
                        s_entry["player2Name"] = players_in_match[p2]["riotId"]
                        s_entry["tradesDone"] += 1
                        s_entry["totalSynergyEvents"] += 1

                # Calcula distância da vítima para o aliado vivo mais próximo no instante da morte
                v_loc = k.get("victimLocation", {})
                vx, vy = v_loc.get("x", 0), v_loc.get("y", 0)
                min_ally_dist = None
                for ploc in k.get("playerLocations", []):
                    p_id = ploc.get("puuid")
                    if p_id != victim and p_id in players_in_match:
                        if players_in_match[p_id]["teamColor"] == v_color:
                            ax = ploc.get("location", {}).get("x", 0)
                            ay = ploc.get("location", {}).get("y", 0)
                            dist = math.hypot(vx - ax, vy - ay)
                            if min_ally_dist is None or dist < min_ally_dist:
                                min_ally_dist = dist

                is_isolated_death = False
                if min_ally_dist is not None:
                    victim_info["sumAllyDistOnDeath"] += min_ally_dist
                    victim_info["deathsWithAllyCount"] += 1
                    team_agg[victim_info["teamSlug"]]["sumNearestAllyDistOnDeath"] += min_ally_dist
                    team_agg[victim_info["teamSlug"]]["countDeathsWithAlly"] += 1
                    # > 2000 unidades (~20 metros no Valorant) sem ser vingado = Morte Isolada
                    if min_ally_dist > 2000 and not was_traded:
                        is_isolated_death = True
                        victim_info["isolatedDeaths"] += 1
                        team_agg[victim_info["teamSlug"]]["isolatedDeaths"] += 1

                # Verifica se foi morte após fim objetivo do round (perdendo arma guardada/salva)
                is_post_round_death = False
                if (objective_end_ms is not None and k_time >= objective_end_ms - 500) or k_time > 100000:
                    if player_loadout_in_round.get(victim, 0) >= 1600:
                        is_post_round_death = True
                        victim_info["postRoundDeaths"] += 1
                        team_agg[victim_info["teamSlug"]]["postRoundSavedWeaponDeaths"] += 1

                # Traduz arma/habilidade que finalizou a kill
                fd = k.get("finishingDamage", {})
                dmg_type = fd.get("damageType", "")
                raw_item = fd.get("damageItem", "")
                w_lookup = WEAPONS.get(raw_item.upper(), WEAPONS.get(raw_item, {"name": raw_item or dmg_type, "category": dmg_type}))
                weapon_used_name = w_lookup["name"]
                player_agg[killer]["weaponsKills"][weapon_used_name] += 1

                # Contabiliza sinergia de assistências
                assistants = [a for a in k.get("assistants", []) if a in players_in_match]
                for a_puuid in assistants:
                    if players_in_match[a_puuid]["teamColor"] == k_color and a_puuid != killer:
                        p1, p2 = sorted([killer, a_puuid])
                        syn_key = (killer_info["teamSlug"], p1, p2)
                        s_entry = synergy_agg[syn_key]
                        s_entry["teamSlug"] = killer_info["teamSlug"]
                        s_entry["player1Puuid"] = p1
                        s_entry["player1Name"] = players_in_match[p1]["riotId"]
                        s_entry["player2Puuid"] = p2
                        s_entry["player2Name"] = players_in_match[p2]["riotId"]
                        s_entry["sharedAssists"] += 1
                        s_entry["totalSynergyEvents"] += 1

                kills_tactical_list.append({
                    "matchId": match_id,
                    "matchCode": match_code,
                    "mapName": map_meta["name"],
                    "roundNum": r_num,
                    "timeSeconds": round(k_time / 1000.0, 2),
                    "killerPuuid": killer,
                    "killerName": killer_info["riotId"],
                    "killerTeam": killer_info["teamSlug"],
                    "killerAgent": killer_info["agentName"],
                    "victimPuuid": victim,
                    "victimName": victim_info["riotId"],
                    "victimTeam": victim_info["teamSlug"],
                    "victimAgent": victim_info["agentName"],
                    "weaponName": weapon_used_name,
                    "damageType": dmg_type,
                    "isFirstKill": is_first_kill,
                    "isTradeKill": is_trade_kill,
                    "wasTraded": was_traded,
                    "nearestAllyDistMeters": round(min_ally_dist / 100.0, 1) if min_ally_dist is not None else None,
                    "isIsolatedDeath": is_isolated_death,
                    "isPostPlant": (was_planted and k_time >= plant_time),
                    "isPostRoundSavedWeaponLoss": is_post_round_death,
                    "victimLoadoutLost": player_loadout_in_round.get(victim, 0),
                    "victimX": vx,
                    "victimY": vy,
                    "assistantsCount": len(assistants),
                })

            # Classificação econômica do round por equipe
            red_avg_loadout = round(team_loadout["Red"] / 5.0, 0)
            blue_avg_loadout = round(team_loadout["Blue"] / 5.0, 0)
            red_buy_type = classify_team_buy(red_avg_loadout, r_num)
            blue_buy_type = classify_team_buy(blue_avg_loadout, r_num)
            buy_by_color = {"Red": red_buy_type, "Blue": blue_buy_type}

            # Atualiza métricas táticas de round nas equipes
            for color in ("Red", "Blue"):
                tslug = team_slug_by_color[color]
                opp_color = "Blue" if color == "Red" else "Red"
                ta = team_agg[tslug]
                ta["roundsPlayed"] += 1
                won_r = (r_winner_color == color)
                if won_r:
                    ta["roundsWon"] += 1

                if color == attacker_color:
                    ta["attackRoundsPlayed"] += 1
                    if won_r:
                        ta["attackRoundsWon"] += 1
                    if was_planted:
                        ta["plants"] += 1
                        if won_r:
                            ta["postPlantWins"] += 1
                else:
                    ta["defenseRoundsPlayed"] += 1
                    if won_r:
                        ta["defenseRoundsWon"] += 1
                    if was_planted:
                        ta["retakeAttempts"] += 1
                        if won_r:
                            ta["retakeWins"] += 1

                if r_num in (0, 12):
                    ta["pistolRoundsPlayed"] += 1
                    if won_r:
                        ta["pistolRoundsWon"] += 1

                if first_kill_color == color:
                    ta["roundsWithFirstKill"] += 1
                    if won_r:
                        ta["roundsWonAfterFirstKill"] += 1
                elif first_kill_color == opp_color:
                    ta["roundsWithFirstDeath"] += 1
                    if won_r:
                        ta["roundsWonAfterFirstDeath"] += 1

                # Anti-eco throw & Thrifty
                if buy_by_color[color] == "Full-Buy (Armado)" and buy_by_color[opp_color] == "Eco" and not won_r:
                    ta["antiEcoThrows"] += 1
                if buy_by_color[color] == "Eco" and buy_by_color[opp_color] == "Full-Buy (Armado)" and won_r:
                    ta["thriftyWins"] += 1

            rounds_list.append({
                "matchId": match_id,
                "matchCode": match_code,
                "tournament": tourney,
                "stage": stage,
                "mapName": map_meta["name"],
                "roundNum": r_num,
                "roundResult": r_result,
                "roundCeremony": r_ceremony,
                "winningTeamColor": r_winner_color,
                "winningTeamSlug": r_winner_slug,
                "attackerTeamSlug": team_slug_by_color[attacker_color],
                "defenderTeamSlug": team_slug_by_color[defender_color],
                "wasPlanted": was_planted,
                "plantTimeSeconds": round(plant_time / 1000.0, 2) if was_planted else None,
                "plantSite": plant_site,
                "firstKillTeamSlug": team_slug_by_color.get(first_kill_color, ""),
                "firstKillerName": players_in_match[first_killer_puuid]["riotId"] if first_killer_puuid in players_in_match else "",
                "firstVictimName": players_in_match[first_victim_puuid]["riotId"] if first_victim_puuid in players_in_match else "",
                "converted5v4": (r_winner_color == first_kill_color) if first_kill_color else None,
                "redTeamSlug": team_red_slug,
                "redLoadoutValue": team_loadout["Red"],
                "redSpent": team_spent["Red"],
                "redBuyType": red_buy_type,
                "blueTeamSlug": team_blue_slug,
                "blueLoadoutValue": team_loadout["Blue"],
                "blueSpent": team_spent["Blue"],
                "blueBuyType": blue_buy_type,
            })

        # Consolida jogadores da partida
        for puuid, p_info in players_in_match.items():
            st = p_info["stats"]
            r_played = st.get("roundsPlayed", total_rounds) or total_rounds
            kills = st.get("kills", 0) or 0
            deaths = st.get("deaths", 0) or 0
            assists = st.get("assists", 0) or 0
            score = st.get("score", 0) or 0
            ab = st.get("abilityCasts") or {}
            g_casts = ab.get("grenadeCasts", 0) or 0
            a1_casts = ab.get("ability1Casts", 0) or 0
            a2_casts = ab.get("ability2Casts", 0) or 0
            u_casts = ab.get("ultimateCasts", 0) or 0
            total_casts = g_casts + a1_casts + a2_casts + u_casts

            total_shots = p_info["headshots"] + p_info["bodyshots"] + p_info["legshots"]
            hs_pct = round((p_info["headshots"] / total_shots) * 100.0, 1) if total_shots > 0 else 0.0
            acs = round(score / r_played, 1) if r_played > 0 else 0.0
            adr = round(p_info["totalDamage"] / r_played, 1) if r_played > 0 else 0.0
            kd = round(kills / max(1, deaths), 2)
            avg_ally_dist_m = (
                round((p_info["sumAllyDistOnDeath"] / p_info["deathsWithAllyCount"]) / 100.0, 1)
                if p_info["deathsWithAllyCount"] > 0
                else 0.0
            )
            won_m = (p_info["teamColor"] == winning_color)

            match_players_list.append({
                "matchId": match_id,
                "matchCode": match_code,
                "tournament": tourney,
                "stage": stage,
                "date": date_str,
                "mapName": map_meta["name"],
                "puuid": puuid,
                "gameName": p_info["gameName"],
                "tagLine": p_info["tagLine"],
                "riotId": p_info["riotId"],
                "teamSlug": p_info["teamSlug"],
                "teamName": p_info["teamName"],
                "teamColor": p_info["teamColor"],
                "wonMatch": won_m,
                "agentName": p_info["agentName"],
                "agentRole": p_info["agentRole"],
                "roundsPlayed": r_played,
                "kills": kills,
                "deaths": deaths,
                "assists": assists,
                "kdRatio": kd,
                "acs": acs,
                "adr": adr,
                "hsPercent": hs_pct,
                "headshots": p_info["headshots"],
                "bodyshots": p_info["bodyshots"],
                "legshots": p_info["legshots"],
                "firstKills": p_info["firstKills"],
                "firstDeaths": p_info["firstDeaths"],
                "tradeKills": p_info["tradeKills"],
                "tradedDeaths": p_info["tradedDeaths"],
                "isolatedDeaths": p_info["isolatedDeaths"],
                "avgNearestAllyDistOnDeathMeters": avg_ally_dist_m,
                "postRoundDeaths": p_info["postRoundDeaths"],
                "supportDamageTotal": p_info["supportDamageTotal"],
                "supportDamageRounds": p_info["supportDamageRounds"],
                "grenadeCasts": g_casts,
                "ability1Casts": a1_casts,
                "ability2Casts": a2_casts,
                "ultimateCasts": u_casts,
                "totalAbilityCasts": total_casts,
                "castsPerRound": round(total_casts / r_played, 2) if r_played > 0 else 0.0,
                "totalSpent": p_info["totalSpent"],
                "damagePer1000Credits": round((p_info["totalDamage"] / max(1, p_info["totalSpent"])) * 1000.0, 1),
            })

            # Atualiza agregados globais de time e jogador
            team_agg[p_info["teamSlug"]]["totalKills"] += kills
            team_agg[p_info["teamSlug"]]["totalDeaths"] += deaths
            team_agg[p_info["teamSlug"]]["roster"].add(p_info["riotId"])

            pa = player_agg[puuid]
            pa["puuid"] = puuid
            pa["gameName"] = p_info["gameName"]
            pa["tagLine"] = p_info["tagLine"]
            pa["primaryTeamSlug"][p_info["teamSlug"]] += 1
            pa["matchesPlayed"] += 1
            if won_m:
                pa["matchesWon"] += 1
            pa["roundsPlayed"] += r_played
            pa["kills"] += kills
            pa["deaths"] += deaths
            pa["assists"] += assists
            pa["score"] += score
            pa["totalDamage"] += p_info["totalDamage"]
            pa["headshots"] += p_info["headshots"]
            pa["bodyshots"] += p_info["bodyshots"]
            pa["legshots"] += p_info["legshots"]
            pa["firstKills"] += p_info["firstKills"]
            pa["firstDeaths"] += p_info["firstDeaths"]
            pa["tradeKills"] += p_info["tradeKills"]
            pa["tradedDeaths"] += p_info["tradedDeaths"]
            pa["isolatedDeaths"] += p_info["isolatedDeaths"]
            pa["postRoundDeaths"] += p_info["postRoundDeaths"]
            pa["supportDamageRounds"] += p_info["supportDamageRounds"]
            pa["supportDamageTotal"] += p_info["supportDamageTotal"]
            pa["grenadeCasts"] += g_casts
            pa["ability1Casts"] += a1_casts
            pa["ability2Casts"] += a2_casts
            pa["ultimateCasts"] += u_casts
            pa["agentsPlayed"][p_info["agentName"]] += 1
            pa["rolesPlayed"][p_info["agentRole"]] += 1

        matches_list.append({
            "matchId": match_id,
            "matchCode": match_code,
            "tournament": tourney,
            "stage": stage,
            "date": date_str,
            "mapId": map_id,
            "mapName": map_meta["name"],
            "mapSlug": map_meta["slug"],
            "gameLengthMinutes": round((match_info.get("gameLengthMillis", 0) or 0) / 60000.0, 1),
            "totalRounds": total_rounds,
            "teamRedSlug": team_red_slug,
            "teamRedName": team_name_by_color["Red"],
            "teamRedScore": red_won_rounds,
            "teamBlueSlug": team_blue_slug,
            "teamBlueName": team_name_by_color["Blue"],
            "teamBlueScore": blue_won_rounds,
            "winningTeamSlug": winning_team_slug,
            "winningTeamName": format_team_name(winning_team_slug),
            "sourceFile": os.path.join(rel_dir, filename),
        })

    # ==============================================================================
    # 2. FINALIZA RESUMOS DE EQUIPES, JOGADORES E DUPLAS
    # ==============================================================================
    teams_summary = []
    for tslug, ta in sorted(team_agg.items(), key=lambda x: x[1]["matchesWon"], reverse=True):
        r_played = max(1, ta["roundsPlayed"])
        m_played = max(1, ta["matchesPlayed"])
        deaths = max(1, ta["totalDeaths"])
        fk_rounds = max(1, ta["roundsWithFirstKill"])
        fd_rounds = max(1, ta["roundsWithFirstDeath"])
        atk_rounds = max(1, ta["attackRoundsPlayed"])
        def_rounds = max(1, ta["defenseRoundsPlayed"])
        pistol_rounds = max(1, ta["pistolRoundsPlayed"])
        plants = max(1, ta["plants"])
        retakes = max(1, ta["retakeAttempts"])

        maps_formatted = {
            mname: {
                "played": mstats["played"],
                "won": mstats["won"],
                "winRate": round((mstats["won"] / max(1, mstats["played"])) * 100.0, 1),
            }
            for mname, mstats in ta["maps"].items()
        }

        teams_summary.append({
            "teamSlug": tslug,
            "teamName": ta["teamName"],
            "matchesPlayed": ta["matchesPlayed"],
            "matchesWon": ta["matchesWon"],
            "matchWinRate": round((ta["matchesWon"] / m_played) * 100.0, 1),
            "roundsPlayed": ta["roundsPlayed"],
            "roundsWon": ta["roundsWon"],
            "roundWinRate": round((ta["roundsWon"] / r_played) * 100.0, 1),
            "attackWinRate": round((ta["attackRoundsWon"] / atk_rounds) * 100.0, 1),
            "defenseWinRate": round((ta["defenseRoundsWon"] / def_rounds) * 100.0, 1),
            "pistolWinRate": round((ta["pistolRoundsWon"] / pistol_rounds) * 100.0, 1),
            "firstKills": ta["firstKills"],
            "firstDeaths": ta["firstDeaths"],
            "firstKillRate": round((ta["roundsWithFirstKill"] / r_played) * 100.0, 1),
            "conversion5v4Rate": round((ta["roundsWonAfterFirstKill"] / fk_rounds) * 100.0, 1),
            "comeback4v5Rate": round((ta["roundsWonAfterFirstDeath"] / fd_rounds) * 100.0, 1),
            "totalKills": ta["totalKills"],
            "totalDeaths": ta["totalDeaths"],
            "teamKd": round(ta["totalKills"] / deaths, 2),
            "tradeKills": ta["tradeKills"],
            "tradedDeaths": ta["tradedDeaths"],
            "tradedDeathRate": round((ta["tradedDeaths"] / deaths) * 100.0, 1),
            "isolatedDeaths": ta["isolatedDeaths"],
            "isolatedDeathRate": round((ta["isolatedDeaths"] / deaths) * 100.0, 1),
            "avgNearestAllyDistOnDeathMeters": (
                round((ta["sumNearestAllyDistOnDeath"] / ta["countDeathsWithAlly"]) / 100.0, 1)
                if ta["countDeathsWithAlly"] > 0
                else 0.0
            ),
            "postRoundSavedWeaponDeaths": ta["postRoundSavedWeaponDeaths"],
            "antiEcoThrows": ta["antiEcoThrows"],
            "thriftyWins": ta["thriftyWins"],
            "plants": ta["plants"],
            "postPlantWinRate": round((ta["postPlantWins"] / plants) * 100.0, 1) if ta["plants"] > 0 else 0.0,
            "retakeAttempts": ta["retakeAttempts"],
            "retakeWinRate": round((ta["retakeWins"] / retakes) * 100.0, 1) if ta["retakeAttempts"] > 0 else 0.0,
            "roster": sorted(list(ta["roster"])),
            "mapsStats": maps_formatted,
        })

    players_summary = []
    for puuid, pa in sorted(player_agg.items(), key=lambda x: x[1]["kills"], reverse=True):
        r_played = max(1, pa["roundsPlayed"])
        m_played = max(1, pa["matchesPlayed"])
        deaths = max(1, pa["deaths"])
        total_shots = pa["headshots"] + pa["bodyshots"] + pa["legshots"]
        main_team = pa["primaryTeamSlug"].most_common(1)[0][0] if pa["primaryTeamSlug"] else ""
        top_agent = pa["agentsPlayed"].most_common(1)[0][0] if pa["agentsPlayed"] else ""
        top_role = pa["rolesPlayed"].most_common(1)[0][0] if pa["rolesPlayed"] else ""
        top_weapon = pa["weaponsKills"].most_common(1)[0][0] if pa["weaponsKills"] else ""
        total_casts = pa["grenadeCasts"] + pa["ability1Casts"] + pa["ability2Casts"] + pa["ultimateCasts"]

        players_summary.append({
            "puuid": puuid,
            "gameName": pa["gameName"],
            "tagLine": pa["tagLine"],
            "riotId": f"{pa['gameName']}#{pa['tagLine']}",
            "teamSlug": main_team,
            "teamName": format_team_name(main_team),
            "matchesPlayed": pa["matchesPlayed"],
            "matchesWon": pa["matchesWon"],
            "matchWinRate": round((pa["matchesWon"] / m_played) * 100.0, 1),
            "roundsPlayed": pa["roundsPlayed"],
            "topAgent": top_agent,
            "topRole": top_role,
            "topWeapon": top_weapon,
            "kills": pa["kills"],
            "deaths": pa["deaths"],
            "assists": pa["assists"],
            "kdRatio": round(pa["kills"] / deaths, 2),
            "acs": round(pa["score"] / r_played, 1),
            "adr": round(pa["totalDamage"] / r_played, 1),
            "hsPercent": round((pa["headshots"] / total_shots) * 100.0, 1) if total_shots > 0 else 0.0,
            "firstKills": pa["firstKills"],
            "firstDeaths": pa["firstDeaths"],
            "firstKillDiff": pa["firstKills"] - pa["firstDeaths"],
            "tradeKills": pa["tradeKills"],
            "tradedDeaths": pa["tradedDeaths"],
            "isolatedDeaths": pa["isolatedDeaths"],
            "isolatedDeathRate": round((pa["isolatedDeaths"] / deaths) * 100.0, 1),
            "postRoundDeaths": pa["postRoundDeaths"],
            "supportDamageTotal": pa["supportDamageTotal"],
            "supportDamageRounds": pa["supportDamageRounds"],
            "totalAbilityCasts": total_casts,
            "castsPerRound": round(total_casts / r_played, 2),
            "agentsPool": dict(pa["agentsPlayed"]),
            "weaponsBreakdown": dict(pa["weaponsKills"]),
        })

    synergy_list = sorted(synergy_agg.values(), key=lambda x: x["totalSynergyEvents"], reverse=True)

    # ==============================================================================
    # 3. SALVA OS JSONS ESTRUTURADOS
    # ==============================================================================
    dictionary_payload = {
        "maps": MAPS,
        "agents": AGENTS,
        "weapons": WEAPONS,
        "armors": ARMORS,
    }

    datasets = {
        "dictionary.json": dictionary_payload,
        "matches.json": matches_list,
        "teams_summary.json": teams_summary,
        "players_summary.json": players_summary,
        "match_players.json": match_players_list,
        "rounds.json": rounds_list,
        "kills_tactical.json": kills_tactical_list,
        "synergy_pairs.json": synergy_list,
    }

    for fname, content in datasets.items():
        out_path = os.path.join(JSON_DIR, fname)
        with open(out_path, "w", encoding="utf-8") as f:
            if fname == "kills_tactical.json":
                json.dump(content, f, ensure_ascii=False, separators=(",", ":"))
            else:
                json.dump(content, f, ensure_ascii=False, indent=2)
        print(f"Salvo JSON: {out_path} ({len(content) if isinstance(content, list) else len(content.keys())} registros)")

    # ==============================================================================
    # 4. SALVA OS CSVs PARA PANDAS / EXCEL / POWERBI
    # ==============================================================================
    csv_tables = [
        ("matches.csv", matches_list),
        ("teams_summary.csv", [
            {k: (json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else v) for k, v in row.items()}
            for row in teams_summary
        ]),
        ("players_summary.csv", [
            {k: (json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else v) for k, v in row.items()}
            for row in players_summary
        ]),
        ("match_players.csv", match_players_list),
        ("rounds.csv", rounds_list),
        ("kills_tactical.csv", kills_tactical_list),
        ("synergy_pairs.csv", synergy_list),
    ]

    for csv_name, rows in csv_tables:
        if rows:
            write_csv(os.path.join(CSV_DIR, csv_name), rows, list(rows[0].keys()))

    # ==============================================================================
    # 5. CRIA BANCO SQLITE RELACIONAL E INDEXADO
    # ==============================================================================
    if os.path.exists(SQLITE_PATH):
        os.remove(SQLITE_PATH)

    conn = sqlite3.connect(SQLITE_PATH)
    cur = conn.cursor()

    for table_name, rows in [
        ("matches", matches_list),
        ("teams_summary", [
            {k: (json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else v) for k, v in row.items()}
            for row in teams_summary
        ]),
        ("players_summary", [
            {k: (json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else v) for k, v in row.items()}
            for row in players_summary
        ]),
        ("match_players", match_players_list),
        ("rounds", rounds_list),
        ("kills_tactical", kills_tactical_list),
        ("synergy_pairs", synergy_list),
    ]:
        if not rows:
            continue
        cols = list(rows[0].keys())
        col_defs = ", ".join([f'"{c}"' for c in cols])
        placeholders = ", ".join(["?" for _ in cols])
        cur.execute(f'CREATE TABLE "{table_name}" ({col_defs})')
        values = [tuple(r.get(c) for c in cols) for r in rows]
        cur.executemany(f'INSERT INTO "{table_name}" VALUES ({placeholders})', values)

    cur.execute('CREATE INDEX idx_mp_team ON match_players(teamSlug)')
    cur.execute('CREATE INDEX idx_mp_puuid ON match_players(puuid)')
    cur.execute('CREATE INDEX idx_rounds_match ON rounds(matchId)')
    cur.execute('CREATE INDEX idx_kills_match ON kills_tactical(matchId)')
    cur.execute('CREATE INDEX idx_kills_killer_team ON kills_tactical(killerTeam)')
    cur.execute('CREATE INDEX idx_kills_victim_team ON kills_tactical(victimTeam)')
    conn.commit()
    conn.close()
    print(f"Banco SQLite criado com sucesso em: {SQLITE_PATH}")


if __name__ == "__main__":
    main()
