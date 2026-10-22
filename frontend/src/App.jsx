import React, { useState, useEffect, useMemo } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

const NAV_ITEMS = [
  { id: "overview", icon: "🏠", label: "Visão Geral & Coach", sub: "Resumo e diagnóstico" },
  { id: "players", icon: "⬢", label: "Jogadores & Hexágono", sub: "Atributos 0 a 100" },
  { id: "pillars", icon: "🧠", label: "Os 3 Pilares Táticos", sub: "Engajamento, Economia e Suporte" },
  { id: "match", icon: "📋", label: "Raio-X de Partida", sub: "Placar e Replay de Rounds" },
];

const HEX_AXES = [
  { key: "combate", label: "COMBATE", desc: "Impacto geral (ACS)", rawFn: (p) => `${p.acs} ACS` },
  { key: "consistencia", label: "CONSISTÊNCIA", desc: "Regularidade (KAST%)", rawFn: (p) => `${p.kastPercent}% KAST` },
  { key: "mira", label: "MIRA", desc: "Precisão técnica (HS%)", rawFn: (p) => `${p.hsPercent}% HS` },
  { key: "agressividade", label: "AGRESSIVIDADE", desc: "Abertura de mapa (First Kills)", rawFn: (p) => `${p.firstKills} FK (${p.roundsPlayed} rds)` },
  { key: "dano", label: "DANO", desc: "Volume de dano (ADR)", rawFn: (p) => `${p.adr} ADR` },
  { key: "suporte", label: "SUPORTE", desc: "Assistências por round", rawFn: (p) => `${p.assists} Assists` },
];

export default function App() {
  const [overview, setOverview] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeamSlug, setSelectedTeamSlug] = useState("");
  const [teamDetail, setTeamDetail] = useState(null);

  const [activePage, setActivePage] = useState("overview");
  const [activePillar, setActivePillar] = useState("engagement"); // "engagement" | "economy" | "invisible"

  const [selectedPlayerPuuid, setSelectedPlayerPuuid] = useState("");
  const [comparePlayerPuuid, setComparePlayerPuuid] = useState("");

  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [matchDetail, setMatchDetail] = useState(null);
  const [selectedRoundNum, setSelectedRoundNum] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/overview`).then((r) => r.json()),
      fetch(`${API_BASE}/teams`).then((r) => r.json()),
    ])
      .then(([ovData, teamsData]) => {
        setOverview(ovData);
        setTeams(teamsData);
        if (teamsData.length > 0) {
          setSelectedTeamSlug(teamsData[0].teamSlug);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Não foi possível conectar ao servidor Python em http://127.0.0.1:8000");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedTeamSlug) return;
    fetch(`${API_BASE}/teams/${selectedTeamSlug}`)
      .then((r) => r.json())
      .then((data) => {
        setTeamDetail(data);
        if (data.rosterStats && data.rosterStats.length > 0) {
          setSelectedPlayerPuuid(data.rosterStats[0].puuid);
          setComparePlayerPuuid("");
        }
        if (data.matches && data.matches.length > 0) {
          setSelectedMatchId(data.matches[0].matchId);
        }
      });
  }, [selectedTeamSlug]);

  useEffect(() => {
    if (!selectedMatchId) return;
    fetch(`${API_BASE}/matches/${selectedMatchId}`)
      .then((r) => r.json())
      .then((data) => {
        setMatchDetail(data);
        setSelectedRoundNum(0);
      });
  }, [selectedMatchId]);

  if (loading) {
    return (
      <div className="center-screen">
        <div className="loader" />
        <h2>Carregando Plataforma VALORANT Analytics...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="center-screen">
        <div className="error-box">
          <h2>⚠️ Servidor Back-end Offline</h2>
          <p>{error}</p>
          <code>python -m uvicorn backend.api:app --host 127.0.0.1 --port 8000</code>
        </div>
      </div>
    );
  }

  const summary = teamDetail?.summary;
  const roster = teamDetail?.rosterStats || [];
  const selectedPlayer = roster.find((p) => p.puuid === selectedPlayerPuuid) || roster[0];
  const comparePlayer = roster.find((p) => p.puuid === comparePlayerPuuid) || null;

  return (
    <div className="layout-shell">
      {/* MENU LATERAL FIXO (SIDEBAR) */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="badge-riot">VALORANT // COACH</span>
          <h2>Tactical Hub</h2>
        </div>

        {/* SELETOR GLOBAL DE EQUIPE */}
        <div className="sidebar-team-box">
          <label>EQUIPE SELECIONADA</label>
          <select
            value={selectedTeamSlug}
            onChange={(e) => setSelectedTeamSlug(e.target.value)}
          >
            {teams.map((t) => (
              <option key={t.teamSlug} value={t.teamSlug}>
                {t.teamName} ({t.matchesWon}V - {t.matchWinRate}%)
              </option>
            ))}
          </select>
        </div>

        {/* NAVEGAÇÃO EM 4 TELAS LIMPAS */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${activePage === item.id ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <div className="nav-text">
                <strong>{item.label}</strong>
                <small>{item.sub}</small>
              </div>
            </button>
          ))}
        </nav>

        {/* RESUMO DA BASE NO RODAPÉ DA SIDEBAR */}
        {overview && (
          <div className="sidebar-footer">
            <div><span>Partidas na Base:</span> <strong>{overview.totals.matches}</strong></div>
            <div><span>Equipes Mapeadas:</span> <strong>{overview.totals.teams}</strong></div>
            <div><span>Jogadores:</span> <strong>{overview.totals.players}</strong></div>
            <div><span>Abates Processados:</span> <strong>{overview.totals.kills.toLocaleString("pt-BR")}</strong></div>
          </div>
        )}
      </aside>

      {/* ÁREA PRINCIPAL (1 FOCO POR TELA) */}
      <main className="main-stage">
        {summary && teamDetail && (
          <>
            {/* =========================================================
                TELA 1: VISÃO GERAL DO TIME & FEEDBACK DO COACH
               ========================================================= */}
            {activePage === "overview" && (
              <div className="page-view">
                <header className="page-header">
                  <div>
                    <span className="eyebrow">VISÃO GERAL DA EQUIPE</span>
                    <h1>{summary.teamName}</h1>
                  </div>
                  <div className="header-quick-stats">
                    <div className="hq-item">
                      <span>Partidas</span>
                      <strong>{summary.matchesWon}V / {summary.matchesPlayed}J</strong>
                    </div>
                    <div className="hq-item">
                      <span>Winrate Geral</span>
                      <strong className="c-cyan">{summary.matchWinRate}%</strong>
                    </div>
                    <div className="hq-item">
                      <span>K/D Coletivo</span>
                      <strong>{summary.teamKd}</strong>
                    </div>
                  </div>
                </header>

                {/* KPI CARDS PRINCIPAIS */}
                <section className="kpi-grid-4">
                  <div className="kpi-card">
                    <span className="kpi-title">Winrate no Ataque</span>
                    <strong className="kpi-num">{summary.attackWinRate}%</strong>
                    <small>Pós-plant: {summary.postPlantWinRate}% ({summary.plants} plants)</small>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-title">Winrate na Defesa</span>
                    <strong className="kpi-num">{summary.defenseWinRate}%</strong>
                    <small>Retake winrate: {summary.retakeWinRate}%</small>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-title">Conversão 5v4 (Pós-FK)</span>
                    <strong className="kpi-num c-green">{summary.conversion5v4Rate}%</strong>
                    <small>First Kill em {summary.firstKillRate}% dos rounds</small>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-title">Rounds Pistol</span>
                    <strong className="kpi-num">{summary.pistolWinRate}%</strong>
                    <small>Viradas 4v5: {summary.comeback4v5Rate}%</small>
                  </div>
                </section>

                {/* DIAGNÓSTICO AUTOMÁTICO DE COACHING */}
                <section className="section-block">
                  <div className="block-title">
                    <h2>🧠 Diagnóstico Automático do Coach</h2>
                    <p>Principais pontos fortes e correções prioritárias identificadas nos dados da equipe</p>
                  </div>
                  <div className="coach-cards-list">
                    {teamDetail.coachingFeedback.map((fb, idx) => (
                      <div key={idx} className={`coach-card status-${fb.type}`}>
                        <span className="coach-tag">{fb.pillar}</span>
                        <h3>{fb.title}</h3>
                        <p>{fb.description}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* DESEMPENHO POR MAPA */}
                <section className="section-block">
                  <div className="block-title">
                    <h2>🗺️ Domínio de Mapas</h2>
                    <p>Aproveitamento histórico da equipe em cada mapa disputado no torneio</p>
                  </div>
                  <div className="maps-grid">
                    {Object.entries(summary.mapsStats).map(([mName, ms]) => (
                      <div key={mName} className="map-stat-card">
                        <div className="map-top">
                          <strong>{mName}</strong>
                          <span className={ms.winRate >= 50 ? "c-green" : "c-red"}>
                            {ms.winRate}%
                          </span>
                        </div>
                        <div className="bar-bg">
                          <div
                            className={`bar-fill ${ms.winRate >= 50 ? "fill-green" : "fill-red"}`}
                            style={{ width: `${ms.winRate}%` }}
                          />
                        </div>
                        <small>{ms.won} vitórias em {ms.played} partidas</small>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* =========================================================
                TELA 2: JOGADORES & HEXÁGONO DE HABILIDADES (0 A 100)
               ========================================================= */}
            {activePage === "players" && (
              <div className="page-view">
                <header className="page-header">
                  <div>
                    <span className="eyebrow">ANÁLISE INDIVIDUAL PADRONIZADA (0 A 100)</span>
                    <h1>Elenco & Hexágono — {summary.teamName}</h1>
                  </div>
                </header>

                <div className="players-split-view">
                  {/* LISTA DE CARDS DOS JOGADORES À ESQUERDA */}
                  <div className="roster-cards-col">
                    <h3 className="col-label">Selecione um Jogador ({roster.length})</h3>
                    <div className="player-cards-stack">
                      {roster.map((p) => {
                        const active = selectedPlayer?.puuid === p.puuid;
                        return (
                          <div
                            key={p.puuid}
                            className={`player-select-card ${active ? "selected" : ""}`}
                            onClick={() => setSelectedPlayerPuuid(p.puuid)}
                          >
                            <div className="psc-left">
                              <div className="psc-name">
                                <strong>{p.gameName}</strong>
                                <span>#{p.tagLine}</span>
                              </div>
                              <div className="psc-meta">
                                <span className="agent-pill">{p.topAgent} • {p.topRole}</span>
                                <small>{p.matchesPlayed} partidas ({p.roundsPlayed} rds)</small>
                              </div>
                            </div>
                            <div className="psc-right">
                              <span className="ovr-label">OVERALL</span>
                              <strong className="ovr-score">{p.hexagon?.overall ?? "-"}</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* HEXÁGONO GRANDE E DETALHES À DIREITA */}
                  {selectedPlayer && selectedPlayer.hexagon && (
                    <div className="hexagon-showcase">
                      <div className="hex-showcase-top">
                        <div>
                          <span className="agent-pill">{selectedPlayer.topAgent} ({selectedPlayer.topRole})</span>
                          <h2>
                            {selectedPlayer.gameName}
                            <span className="tag-muted">#{selectedPlayer.tagLine}</span>
                          </h2>
                        </div>
                        <div className="compare-picker">
                          <label>Comparar no gráfico:</label>
                          <select
                            value={comparePlayerPuuid}
                            onChange={(e) => setComparePlayerPuuid(e.target.value)}
                          >
                            <option value="">Nenhum (Apenas {selectedPlayer.gameName})</option>
                            {roster
                              .filter((p) => p.puuid !== selectedPlayer.puuid)
                              .map((p) => (
                                <option key={p.puuid} value={p.puuid}>
                                  {p.gameName} ({p.topAgent} — OVR {p.hexagon?.overall})
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      <div className="hex-Showcase-body">
                        {/* RADAR SVG GRANDE */}
                        <div className="hex-chart-box">
                          <PlayerHexagonChart
                            player={selectedPlayer}
                            comparePlayer={comparePlayer}
                          />
                        </div>

                        {/* BARRAS EXPLICATIVAS DOS 6 ATRIBUTOS */}
                        <div className="hex-bars-box">
                          <h3>Notas dos 6 Atributos (Escala 0 a 100)</h3>
                          {HEX_AXES.map((ax) => {
                            const val1 = selectedPlayer.hexagon[ax.key] ?? 0;
                            const val2 = comparePlayer?.hexagon?.[ax.key] ?? null;
                            return (
                              <div key={ax.key} className="attr-row">
                                <div className="attr-head">
                                  <div>
                                    <strong>{ax.label}</strong>
                                    <span className="attr-desc"> — {ax.desc} ({ax.rawFn(selectedPlayer)})</span>
                                  </div>
                                  <div className="attr-scores">
                                    <strong className="c-cyan">{val1}</strong>
                                    {val2 !== null && (
                                      <strong className="c-gold"> vs {val2}</strong>
                                    )}
                                  </div>
                                </div>
                                <div className="bar-bg">
                                  <div
                                    className="bar-fill fill-cyan"
                                    style={{ width: `${val1}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =========================================================
                TELA 3: OS 3 PILARES TÁTICOS (1 PILAR POR VEZ, SEM POLUIÇÃO)
               ========================================================= */}
            {activePage === "pillars" && (
              <div className="page-view">
                <header className="page-header">
                  <div>
                    <span className="eyebrow">ANÁLISE PROFUNDA POR FRENTE TÁTICA</span>
                    <h1>Os 3 Pilares Coletivos — {summary.teamName}</h1>
                  </div>
                </header>

                {/* SELETOR DE PILAR (SUB-ABAS GRANDES) */}
                <div className="pillar-switcher">
                  <button
                    className={`ps-btn ${activePillar === "engagement" ? "active" : ""}`}
                    onClick={() => setActivePillar("engagement")}
                  >
                    <strong>1. Eficiência de Engajamento</strong>
                    <span>First Kills, Trades (&lt;3.5s) e Isolamento</span>
                  </button>
                  <button
                    className={`ps-btn ${activePillar === "economy" ? "active" : ""}`}
                    onClick={() => setActivePillar("economy")}
                  >
                    <strong>2. Termômetro de Economia</strong>
                    <span>Aproveitamento por Compra e Armas Perdidas</span>
                  </button>
                  <button
                    className={`ps-btn ${activePillar === "invisible" ? "active" : ""}`}
                    onClick={() => setActivePillar("invisible")}
                  >
                    <strong>3. O Impacto Invisível</strong>
                    <span>Utilitários, Dano de Suporte e Duplas</span>
                  </button>
                </div>

                {/* CONTEÚDO DO PILAR 1: ENGAJAMENTO */}
                {activePillar === "engagement" && (
                  <div className="pillar-detail-stage">
                    <div className="kpi-grid-4">
                      <div className="kpi-card">
                        <span className="kpi-title">Taxa de First Kill</span>
                        <strong className="kpi-num">{summary.firstKillRate}%</strong>
                        <small>{summary.firstKills} FK conquistadas vs {summary.firstDeaths} FD</small>
                      </div>
                      <div className="kpi-card">
                        <span className="kpi-title">Conversão de Vantagem 5v4</span>
                        <strong className="kpi-num c-green">{summary.conversion5v4Rate}%</strong>
                        <small>% de vitórias após pegar a 1ª kill</small>
                      </div>
                      <div className="kpi-card">
                        <span className="kpi-title">Taxa de Trade (&lt; 3.5s)</span>
                        <strong className="kpi-num c-cyan">{summary.tradedDeathRate}%</strong>
                        <small>{summary.tradeKills} abates de vingança imediata</small>
                      </div>
                      <div className="kpi-card">
                        <span className="kpi-title">Mortes Isoladas (&gt;20m)</span>
                        <strong className="kpi-num c-gold">{summary.isolatedDeathRate}%</strong>
                        <small>Distância média do aliado ao morrer: {summary.avgNearestAllyDistOnDeathMeters}m</small>
                      </div>
                    </div>

                    <div className="section-block">
                      <div className="block-title">
                        <h2>Engajamento & Espaçamento por Jogador</h2>
                        <p>Quem abre espaço para o time vs. quem morre isolado sem possibilidade de trade</p>
                      </div>
                      <table className="clean-table">
                        <thead>
                          <tr>
                            <th>Jogador</th>
                            <th>Agente</th>
                            <th>First Kills (FK)</th>
                            <th>First Deaths (FD)</th>
                            <th>Saldo FK/FD</th>
                            <th>Trades Feitos</th>
                            <th>Mortes Vingadas</th>
                            <th>Mortes Isoladas (&gt;20m s/ trade)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roster.map((p) => (
                            <tr key={p.puuid}>
                              <td><strong>{p.gameName}</strong> <span className="tag-muted">#{p.tagLine}</span></td>
                              <td>{p.topAgent} ({p.topRole})</td>
                              <td className="c-green"><strong>{p.firstKills}</strong></td>
                              <td className="c-red">{p.firstDeaths}</td>
                              <td className={p.firstKillDiff >= 0 ? "c-green" : "c-red"}>
                                <strong>{p.firstKillDiff > 0 ? `+${p.firstKillDiff}` : p.firstKillDiff}</strong>
                              </td>
                              <td>{p.tradeKills}</td>
                              <td>{p.tradedDeaths}</td>
                              <td className={p.isolatedDeathRate > 45 ? "c-red" : ""}>
                                {p.isolatedDeaths} ({p.isolatedDeathRate}%)
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* CONTEÚDO DO PILAR 2: ECONOMIA */}
                {activePillar === "economy" && (
                  <div className="pillar-detail-stage">
                    <div className="kpi-grid-3">
                      <div className="kpi-card">
                        <span className="kpi-title">Armas Caras Perdidas Pós-Round</span>
                        <strong className="kpi-num c-red">{summary.postRoundSavedWeaponDeaths}</strong>
                        <small>Mortes após detonação/defuse custando armamento salvo</small>
                      </div>
                      <div className="kpi-card">
                        <span className="kpi-title">Entregas Armado vs Eco (Throws)</span>
                        <strong className="kpi-num c-gold">{summary.antiEcoThrows}</strong>
                        <small>Rounds Full-Buy perdidos contra Eco adversário</small>
                      </div>
                      <div className="kpi-card">
                        <span className="kpi-title">Vitórias Econômicas (Thrifty)</span>
                        <strong className="kpi-num c-green">{summary.thriftyWins}</strong>
                        <small>Rounds Eco vencidos contra Full-Buy inimigo</small>
                      </div>
                    </div>

                    <div className="section-block">
                      <div className="block-title">
                        <h2>Eficiência por Tipo de Compra</h2>
                        <p>Taxa de vitória da equipe de acordo com o investimento de créditos no round</p>
                      </div>
                      <div className="econ-cards-grid">
                        {teamDetail.economyBreakdown.map((eb) => (
                          <div key={eb.buyType} className="econ-detail-card">
                            <span className="econ-type-label">{eb.buyType}</span>
                            <strong className="econ-win-big">{eb.winRate}%</strong>
                            <div className="bar-bg">
                              <div className="bar-fill fill-gold" style={{ width: `${eb.winRate}%` }} />
                            </div>
                            <p>{eb.roundsWon} vitórias em {eb.roundsPlayed} rounds</p>
                            <small>Loadout médio: {eb.avgTeamLoadout.toLocaleString("pt-BR")} créditos</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* CONTEÚDO DO PILAR 3: IMPACTO INVISÍVEL */}
                {activePillar === "invisible" && (
                  <div className="pillar-detail-stage">
                    <div className="two-equal-cols">
                      <div className="section-block">
                        <div className="block-title">
                          <h2>🔮 Uso de Utilitários & Dano de Suporte</h2>
                          <p>Jogadores que preparam os abates causando dano e usando habilidades</p>
                        </div>
                        <table className="clean-table">
                          <thead>
                            <tr>
                              <th>Jogador</th>
                              <th>Função</th>
                              <th>Habs / Round</th>
                              <th>Assists</th>
                              <th>Dano de Suporte</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roster.map((p) => (
                              <tr key={p.puuid}>
                                <td><strong>{p.gameName}</strong></td>
                                <td>{p.topAgent} ({p.topRole})</td>
                                <td className="c-cyan"><strong>{p.castsPerRound}</strong></td>
                                <td>{p.assists}</td>
                                <td>
                                  <strong>{p.supportDamageTotal}</strong>{" "}
                                  <small className="tag-muted">({p.supportDamageRounds} rds 50+)</small>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="section-block">
                        <div className="block-title">
                          <h2>🤝 Matriz de Sinergia de Duplas</h2>
                          <p>Pares de jogadores que mais combinam assistências e trades diretos</p>
                        </div>
                        <div className="duo-cards-list">
                          {teamDetail.synergyPairs.slice(0, 6).map((s, idx) => (
                            <div key={idx} className="duo-row-card">
                              <div className="duo-rank">#{idx + 1}</div>
                              <div className="duo-info">
                                <strong>
                                  {s.player1Name.split("#")[0]} &amp; {s.player2Name.split("#")[0]}
                                </strong>
                                <small>
                                  {s.sharedAssists} assistências diretas + {s.tradesDone} trades em dupla
                                </small>
                              </div>
                              <div className="duo-total">
                                <strong>{s.totalSynergyEvents}</strong>
                                <span>ações</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================
                TELA 4: RAIO-X DE PARTIDA (PLACAR + REPLAY DE ROUNDS)
               ========================================================= */}
            {activePage === "match" && (
              <div className="page-view">
                <header className="page-header">
                  <div>
                    <span className="eyebrow">ANÁLISE PÓS-JOGO DETALHADA</span>
                    <h1>Raio-X da Partida &amp; Replay de Rounds</h1>
                  </div>
                  <div className="match-select-box">
                    <label>Escolha a Partida:</label>
                    <select
                      value={selectedMatchId}
                      onChange={(e) => setSelectedMatchId(e.target.value)}
                    >
                      {teamDetail.matches.map((m) => (
                        <option key={m.matchId} value={m.matchId}>
                          [{m.tournament}] {m.teamRedName} {m.teamRedScore} x {m.teamBlueScore} {m.teamBlueName} ({m.mapName})
                        </option>
                      ))}
                    </select>
                  </div>
                </header>

                {matchDetail && (
                  <>
                    {/* PLACAR DESTAQUE DA PARTIDA */}
                    <div className="match-scoreboard-banner">
                      <div className="msb-team red">
                        <span>EQUIPE 1</span>
                        <strong>{matchDetail.match.teamRedName}</strong>
                      </div>
                      <div className="msb-score">
                        <span className="s-num c-red">{matchDetail.match.teamRedScore}</span>
                        <div className="msb-map-badge">
                          <strong>Mapa: {matchDetail.match.mapName}</strong>
                          <small>{matchDetail.match.gameLengthMinutes} min • {matchDetail.match.totalRounds} rounds</small>
                        </div>
                        <span className="s-num c-blue">{matchDetail.match.teamBlueScore}</span>
                      </div>
                      <div className="msb-team blue">
                        <span>EQUIPE 2</span>
                        <strong>{matchDetail.match.teamBlueName}</strong>
                      </div>
                    </div>

                    {/* SELETOR VISUAL DE ROUNDS (1 A N) + KILL FEED DO ROUND */}
                    <div className="section-block">
                      <div className="block-title">
                        <h2>🎬 Linha do Tempo Interativa — Clique em um Round para inspecionar</h2>
                        <p>Veja quem venceu cada round, a decisão econômica das equipes e a ordem exata das eliminações</p>
                      </div>

                      <div className="rounds-strip">
                        {matchDetail.rounds.map((r) => {
                          const isRedWin = r.winningTeamColor === "Red";
                          const isSelected = selectedRoundNum === r.roundNum;
                          return (
                            <button
                              key={r.roundNum}
                              className={`round-pill-btn ${isRedWin ? "win-red" : "win-blue"} ${isSelected ? "selected" : ""}`}
                              onClick={() => setSelectedRoundNum(r.roundNum)}
                            >
                              <span className="rp-num">R{r.roundNum + 1}</span>
                              <span className="rp-dot" />
                            </button>
                          );
                        })}
                      </div>

                      {(() => {
                        const activeRound =
                          matchDetail.rounds.find((r) => r.roundNum === selectedRoundNum) ||
                          matchDetail.rounds[0];
                        const roundKills = matchDetail.kills.filter(
                          (k) => k.roundNum === activeRound?.roundNum
                        );
                        if (!activeRound) return null;

                        return (
                          <div className="round-inspector-box">
                            <div className="ri-summary">
                              <div className="ri-header-badge">
                                <h3>Round #{activeRound.roundNum + 1}</h3>
                                <span className={activeRound.winningTeamColor === "Red" ? "c-red" : "c-blue"}>
                                  Vitória de {activeRound.winningTeamSlug.toUpperCase()} ({activeRound.roundResult})
                                </span>
                              </div>

                              <div className="ri-econ-compare">
                                <div className="ri-team-econ">
                                  <small>{matchDetail.match.teamRedName}</small>
                                  <strong>{activeRound.redBuyType}</strong>
                                  <span>Loadout: {activeRound.redLoadoutValue.toLocaleString("pt-BR")} cr</span>
                                </div>
                                <div className="ri-vs">VS</div>
                                <div className="ri-team-econ">
                                  <small>{matchDetail.match.teamBlueName}</small>
                                  <strong>{activeRound.blueBuyType}</strong>
                                  <span>Loadout: {activeRound.blueLoadoutValue.toLocaleString("pt-BR")} cr</span>
                                </div>
                              </div>

                              <div className="ri-tactical-verdict">
                                <div>
                                  <span>🗡️ First Kill do Round:</span>
                                  <strong>
                                    {activeRound.firstKillerName.split("#")[0]} eliminou {activeRound.firstVictimName.split("#")[0]}
                                  </strong>
                                </div>
                                <div>
                                  <span>📊 Vantagem 5v4:</span>
                                  <strong className={activeRound.converted5v4 ? "c-green" : "c-gold"}>
                                    {activeRound.converted5v4
                                      ? "✓ Equipe com First Kill converteu o round"
                                      : "⚡ Equipe em desvantagem (4v5) virou o round!"}
                                  </strong>
                                </div>
                              </div>
                            </div>

                            {/* SEQUÊNCIA CRONOLÓGICA DE ABATES DO ROUND (KILL FEED) */}
                            <div className="ri-killfeed">
                              <h4>Sequência de Eliminações no Round #{activeRound.roundNum + 1}</h4>
                              <div className="killfeed-list">
                                {roundKills.map((k, idx) => (
                                  <div key={idx} className="kf-item">
                                    <span className="kf-time">{k.timeSeconds}s</span>
                                    <div className="kf-actors">
                                      <strong>{k.killerName.split("#")[0]}</strong>{" "}
                                      <small className="tag-muted">({k.killerAgent})</small>
                                      <span className="kf-weapon">[{k.weaponName}]</span>
                                      <strong>{k.victimName.split("#")[0]}</strong>{" "}
                                      <small className="tag-muted">({k.victimAgent})</small>
                                    </div>
                                    <div className="kf-badges">
                                      {k.isFirstKill && <span className="kf-tag tag-fk">FIRST KILL</span>}
                                      {k.isTradeKill && <span className="kf-tag tag-trade">TRADE &lt;3.5s</span>}
                                      {k.isIsolatedDeath && (
                                        <span className="kf-tag tag-iso">
                                          ISOLADO ({k.nearestAllyDistMeters}m)
                                        </span>
                                      )}
                                      {k.isPostPlant && <span className="kf-tag tag-plant">PÓS-PLANT</span>}
                                      {k.isPostRoundSavedWeaponLoss && (
                                        <span className="kf-tag tag-fk">ARMA SALVA PERDIDA</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* TABELA DE DESEMPENHO DOS 10 JOGADORES NA PARTIDA */}
                    <div className="section-block">
                      <div className="block-title">
                        <h2>📋 Placar Tático dos Jogadores na Partida</h2>
                        <p>Comparativo individual completo entre as duas equipes neste jogo</p>
                      </div>
                      <table className="clean-table">
                        <thead>
                          <tr>
                            <th>Equipe</th>
                            <th>Jogador</th>
                            <th>Agente</th>
                            <th>Nota Hex</th>
                            <th>ACS</th>
                            <th>K / D / A</th>
                            <th>KAST%</th>
                            <th>ADR</th>
                            <th>HS%</th>
                            <th>FK / FD</th>
                            <th>Trades</th>
                            <th>Dano Suporte</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matchDetail.players.map((mp) => (
                            <tr key={mp.puuid}>
                              <td>
                                <strong className={mp.teamColor === "Red" ? "c-red" : "c-blue"}>
                                  {mp.teamName}
                                </strong>
                              </td>
                              <td><strong>{mp.gameName}</strong> <span className="tag-muted">#{mp.tagLine}</span></td>
                              <td>{mp.agentName} ({mp.agentRole})</td>
                              <td><strong className="c-cyan">{mp.hexagon?.overall ?? "-"}</strong></td>
                              <td><strong>{mp.acs}</strong></td>
                              <td>{mp.kills} / {mp.deaths} / {mp.assists}</td>
                              <td className="c-cyan"><strong>{mp.kastPercent}%</strong></td>
                              <td>{mp.adr}</td>
                              <td>{mp.hsPercent}%</td>
                              <td>
                                <span className="c-green">{mp.firstKills}</span> / <span className="c-red">{mp.firstDeaths}</span>
                              </td>
                              <td>{mp.tradeKills}</td>
                              <td>{mp.supportDamageTotal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function PlayerHexagonChart({ player, comparePlayer = null }) {
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 115;

  const getPoint = (index, value0to100, radius = maxR) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 6;
    const r = (Math.max(0, Math.min(100, value0to100)) / 100) * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const buildPolygonPoints = (hexObj) =>
    HEX_AXES.map((ax, i) => {
      const [x, y] = getPoint(i, hexObj?.[ax.key] ?? 0);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

  return (
    <div className="hex-svg-container">
      <svg viewBox={`0 0 ${size} ${size}`} className="hex-svg-large">
        {[25, 50, 75, 100].map((lvl) => {
          const pts = HEX_AXES.map((_, i) => {
            const [x, y] = getPoint(i, lvl);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(" ");
          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke={lvl === 100 ? "#334155" : "#1e293b"}
              strokeWidth={lvl === 100 ? "1.5" : "1"}
            />
          );
        })}

        {HEX_AXES.map((_, i) => {
          const [x, y] = getPoint(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#1e293b" strokeWidth="1" />;
        })}

        {comparePlayer && comparePlayer.hexagon && (
          <polygon
            points={buildPolygonPoints(comparePlayer.hexagon)}
            fill="rgba(245, 158, 11, 0.22)"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeDasharray="5 3"
          />
        )}

        <polygon
          points={buildPolygonPoints(player.hexagon)}
          fill="rgba(0, 245, 212, 0.26)"
          stroke="#00f5d4"
          strokeWidth="3"
        />

        {HEX_AXES.map((ax, i) => {
          const val = player.hexagon?.[ax.key] ?? 0;
          const [px, py] = getPoint(i, val);
          const [lx, ly] = getPoint(i, 142);
          return (
            <React.Fragment key={ax.key}>
              <circle cx={px} cy={py} r="5" fill="#ff4655" stroke="#fff" strokeWidth="1.5" />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ece8e1"
                fontSize="11"
                fontWeight="700"
              >
                {ax.label} ({val})
              </text>
            </React.Fragment>
          );
        })}
      </svg>

      {comparePlayer && (
        <div className="hex-legend-row">
          <span className="c-cyan">■ {player.gameName} (OVR {player.hexagon.overall})</span>
          <span className="c-gold">■ {comparePlayer.gameName} (OVR {comparePlayer.hexagon.overall})</span>
        </div>
      )}
    </div>
  );
}

function KillScatterPlot({ kills, filter = "all" }) {
  const filteredKills = useMemo(() => {
    if (!kills) return [];
    if (filter === "fk") return kills.filter((k) => k.isFirstKill);
    if (filter === "trade") return kills.filter((k) => k.isTradeKill);
    if (filter === "iso") return kills.filter((k) => k.isIsolatedDeath);
    return kills;
  }, [kills, filter]);

  const bounds = useMemo(() => {
    if (!kills || kills.length === 0) return { minX: -5000, maxX: 5000, minY: -5000, maxY: 5000 };
    const xs = kills.map((k) => k.victimX);
    const ys = kills.map((k) => k.victimY);
    return {
      minX: Math.min(...xs) - 500,
      maxX: Math.max(...xs) + 500,
      minY: Math.min(...ys) - 500,
      maxY: Math.max(...ys) + 500,
    };
  }, [kills]);

  const width = 560;
  const height = 420;

  return (
    <div className="scatter-container">
      <svg viewBox={`0 0 ${width} ${height}`} className="map-canvas">
        <rect width={width} height={height} fill="#0a1019" rx="10" />
        {[0.2, 0.4, 0.6, 0.8].map((g) => (
          <React.Fragment key={g}>
            <line x1={width * g} y1={0} x2={width * g} y2={height} stroke="#162232" strokeDasharray="4" />
            <line x1={0} y1={height * g} x2={width} y2={height * g} stroke="#162232" strokeDasharray="4" />
          </React.Fragment>
        ))}
        {filteredKills.map((k, i) => {
          const cx = ((k.victimX - bounds.minX) / Math.max(1, bounds.maxX - bounds.minX)) * (width - 48) + 24;
          const cy = ((k.victimY - bounds.minY) / Math.max(1, bounds.maxY - bounds.minY)) * (height - 48) + 24;
          let color = "#64748b";
          let r = 5;
          if (k.isFirstKill) {
            color = "#ff4655";
            r = 7;
          } else if (k.isTradeKill) {
            color = "#00f5d4";
            r = 6;
          } else if (k.isIsolatedDeath) {
            color = "#f59e0b";
            r = 6;
          }
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.9} stroke="#0a1019" strokeWidth="1.2">
              <title>
                Round #{k.roundNum + 1} ({k.timeSeconds}s): {k.killerName} ({k.killerAgent}) eliminou {k.victimName} ({k.victimAgent}) com {k.weaponName}
              </title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
