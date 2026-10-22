import React, { useState, useEffect, useMemo } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

export default function App() {
  const [overview, setOverview] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeamSlug, setSelectedTeamSlug] = useState("");
  const [teamDetail, setTeamDetail] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [matchDetail, setMatchDetail] = useState(null);
  const [activeTab, setActiveTab] = useState("team"); // "team" | "match" | "compare"
  const [compareTeamSlug, setCompareTeamSlug] = useState("");
  const [compareDetail, setCompareDetail] = useState(null);
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
          if (teamsData.length > 1) {
            setCompareTeamSlug(teamsData[1].teamSlug);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Não foi possível conectar ao back-end Python em http://127.0.0.1:8000");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedTeamSlug) return;
    fetch(`${API_BASE}/teams/${selectedTeamSlug}`)
      .then((r) => r.json())
      .then((data) => {
        setTeamDetail(data);
        if (data.matches && data.matches.length > 0) {
          setSelectedMatchId(data.matches[0].matchId);
        }
      });
  }, [selectedTeamSlug]);

  useEffect(() => {
    if (!compareTeamSlug) return;
    fetch(`${API_BASE}/teams/${compareTeamSlug}`)
      .then((r) => r.json())
      .then((data) => setCompareDetail(data));
  }, [compareTeamSlug]);

  useEffect(() => {
    if (!selectedMatchId) return;
    fetch(`${API_BASE}/matches/${selectedMatchId}`)
      .then((r) => r.json())
      .then((data) => setMatchDetail(data));
  }, [selectedMatchId]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <h2>Carregando Base Tática VALORANT...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>⚠️ {error}</h2>
        <p>Verifique se o servidor FastAPI está rodando na porta 8000.</p>
      </div>
    );
  }

  const summary = teamDetail?.summary;

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="topbar">
        <div className="brand">
          <span className="val-badge">VAL // HACKATHON</span>
          <h1>Diagnóstico Tático & Coaching Coletivo</h1>
        </div>
        {overview && (
          <div className="global-pills">
            <div className="pill">
              <strong>{overview.totals.matches}</strong> Partidas
            </div>
            <div className="pill">
              <strong>{overview.totals.teams}</strong> Equipes
            </div>
            <div className="pill">
              <strong>{overview.totals.players}</strong> Jogadores
            </div>
            <div className="pill">
              <strong>{overview.totals.rounds.toLocaleString("pt-BR")}</strong> Rounds
            </div>
            <div className="pill">
              <strong>{overview.totals.kills.toLocaleString("pt-BR")}</strong> Abates Mapeados
            </div>
          </div>
        )}
      </header>

      {/* BARRA DE CONTROLES E ABAS */}
      <section className="controls-bar">
        <div className="team-selector">
          <label>Equipe em Análise:</label>
          <select
            value={selectedTeamSlug}
            onChange={(e) => setSelectedTeamSlug(e.target.value)}
          >
            {teams.map((t) => (
              <option key={t.teamSlug} value={t.teamSlug}>
                {t.teamName} ({t.matchesWon}V / {t.matchesPlayed}J — {t.matchWinRate}%)
              </option>
            ))}
          </select>
        </div>

        <div className="tabs">
          <button
            className={activeTab === "team" ? "tab active" : "tab"}
            onClick={() => setActiveTab("team")}
          >
            📊 Diagnóstico da Equipe (3 Pilares)
          </button>
          <button
            className={activeTab === "match" ? "tab active" : "tab"}
            onClick={() => setActiveTab("match")}
          >
            🎯 Raio-X de Partida & Mapa (X, Y)
          </button>
          <button
            className={activeTab === "compare" ? "tab active" : "tab"}
            onClick={() => setActiveTab("compare")}
          >
            ⚔️ Comparador de Equipes
          </button>
        </div>
      </section>

      {/* ABA 1: DIAGNÓSTICO COMPLETO DA EQUIPE */}
      {activeTab === "team" && summary && teamDetail && (
        <main className="dashboard-content">
          {/* FEEDBACK AUTOMÁTICO DE COACHING */}
          <section className="coaching-section">
            <div className="section-header">
              <h2>🧠 Feedback Automático de Coaching — {summary.teamName}</h2>
              <span className="subtitle">
                Insights gerados em Python cruzando First Kills, Trades, Coordenadas, Economia e Utilitários
              </span>
            </div>
            <div className="feedback-grid">
              {teamDetail.coachingFeedback.map((fb, i) => (
                <div key={i} className={`feedback-card ${fb.type}`}>
                  <div className="fb-pillar">{fb.pillar}</div>
                  <h3>{fb.title}</h3>
                  <p>{fb.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* OS 3 PILARES TÁTICOS */}
          <div className="pillars-grid">
            {/* PILAR 1: ENGAJAMENTO E ESPAÇAMENTO */}
            <div className="pillar-box">
              <div className="pillar-tag tag-red">1. Eficiência de Engajamento & Espaçamento</div>
              <div className="metrics-row">
                <div className="metric-card">
                  <span className="m-label">Conversão 5v4 (Pós-First Kill)</span>
                  <span className="m-value highlight-green">{summary.conversion5v4Rate}%</span>
                  <small>Taxa de FK: {summary.firstKillRate}% dos rounds</small>
                </div>
                <div className="metric-card">
                  <span className="m-label">Virada 4v5 (Pós-First Death)</span>
                  <span className="m-value">{summary.comeback4v5Rate}%</span>
                  <small>{summary.firstKills} FK vs {summary.firstDeaths} FD</small>
                </div>
                <div className="metric-card">
                  <span className="m-label">Mortes Vingadas (Trade &lt; 3.5s)</span>
                  <span className="m-value highlight-cyan">{summary.tradedDeathRate}%</span>
                  <small>{summary.tradeKills} Trades aplicados</small>
                </div>
                <div className="metric-card">
                  <span className="m-label">Mortes Isoladas (&gt;20m s/ Trade)</span>
                  <span className="m-value highlight-warn">{summary.isolatedDeathRate}%</span>
                  <small>Dist. média aliado: {summary.avgNearestAllyDistOnDeathMeters}m</small>
                </div>
              </div>
              <div className="sub-metrics">
                <span>🗡️ Winrate Ataque: <strong>{summary.attackWinRate}%</strong></span>
                <span>🛡️ Winrate Defesa: <strong>{summary.defenseWinRate}%</strong></span>
                <span>💣 Pós-Plant Win: <strong>{summary.postPlantWinRate}%</strong> ({summary.plants} plants)</span>
                <span>🔄 Retake Win: <strong>{summary.retakeWinRate}%</strong></span>
              </div>
            </div>

            {/* PILAR 2: TERMÔMETRO DE ECONOMIA */}
            <div className="pillar-box">
              <div className="pillar-tag tag-gold">2. Termômetro de Economia & Disciplina</div>
              <div className="econ-bars">
                {teamDetail.economyBreakdown.map((eb) => (
                  <div key={eb.buyType} className="econ-row">
                    <div className="econ-label">
                      <strong>{eb.buyType}</strong>
                      <span>{eb.roundsWon}/{eb.roundsPlayed} rounds ({eb.winRate}%)</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(100, eb.winRate)}%` }}
                      />
                    </div>
                    <small className="econ-sub">Loadout médio da equipe: {eb.avgTeamLoadout.toLocaleString("pt-BR")} créditos</small>
                  </div>
                ))}
              </div>
              <div className="sub-metrics">
                <span>💀 Armas Caras Perdidas Pós-Round: <strong className="text-danger">{summary.postRoundSavedWeaponDeaths}</strong></span>
                <span>⚠️ Entregas Armado vs Eco: <strong className="text-danger">{summary.antiEcoThrows}</strong></span>
                <span>💎 Vitórias Eco (Thrifty): <strong className="text-success">{summary.thriftyWins}</strong></span>
              </div>
            </div>
          </div>

          {/* PILAR 3: IMPACTO INVISÍVEL + TABELA DO ELENCO */}
          <div className="two-col-layout">
            <div className="roster-panel">
              <div className="pillar-tag tag-purple">
                3. Desempenho Individual, Espaçamento & Impacto Invisível (Elenco)
              </div>
              <div className="table-wrapper">
                <table className="tactical-table">
                  <thead>
                    <tr>
                      <th>Jogador</th>
                      <th>Agente Principal</th>
                      <th>ACS</th>
                      <th>K/D</th>
                      <th>HS%</th>
                      <th title="First Kills / First Deaths">FK / FD</th>
                      <th title="Trades feitos / Mortes vingadas">Trades (F/V)</th>
                      <th title="Mortes a mais de 20m de qualquer aliado sem trade">Mortes Isoladas</th>
                      <th title="Mortes após fim do round perdendo arma cara">Mortes Pós-Round</th>
                      <th title="Dano causado em inimigos finalizados por aliados">Dano Suporte</th>
                      <th title="Habilidades usadas por round">Habs / Round</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamDetail.rosterStats.map((p) => (
                      <tr key={p.puuid}>
                        <td className="player-cell">
                          <strong>{p.gameName}</strong>
                          <span className="tag">#{p.tagLine}</span>
                        </td>
                        <td>
                          <span className={`role-badge role-${p.topRole.toLowerCase()}`}>
                            {p.topAgent} ({p.topRole})
                          </span>
                        </td>
                        <td><strong>{p.acs}</strong></td>
                        <td className={p.kdRatio >= 1 ? "pos" : "neg"}>{p.kdRatio}</td>
                        <td>{p.hsPercent}%</td>
                        <td>
                          <span className="pos">{p.firstKills}</span> / <span className="neg">{p.firstDeaths}</span>
                        </td>
                        <td>{p.tradeKills} / {p.tradedDeaths}</td>
                        <td>
                          <span className={p.isolatedDeathRate > 45 ? "neg" : ""}>
                            {p.isolatedDeaths} ({p.isolatedDeathRate}%)
                          </span>
                        </td>
                        <td>{p.postRoundDeaths}</td>
                        <td className="support-col">
                          <strong>{p.supportDamageTotal}</strong> <small>({p.supportDamageRounds} rds)</small>
                        </td>
                        <td><strong>{p.castsPerRound}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SINERGIA DE DUPLAS E MAPAS */}
            <div className="side-panel">
              <div className="card-block">
                <h3>🤝 Top Duplas de Sinergia (Assists + Trades)</h3>
                <ul className="synergy-list">
                  {teamDetail.synergyPairs.slice(0, 5).map((s, idx) => (
                    <li key={idx}>
                      <div className="duo-names">
                        <strong>{s.player1Name.split("#")[0]}</strong> + <strong>{s.player2Name.split("#")[0]}</strong>
                      </div>
                      <div className="duo-stats">
                        <span className="badge-syn">{s.totalSynergyEvents} ações conjuntas</span>
                        <small>{s.sharedAssists} assists • {s.tradesDone} trades</small>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card-block">
                <h3>🗺️ Desempenho por Mapa</h3>
                <ul className="map-list">
                  {Object.entries(summary.mapsStats).map(([mName, ms]) => (
                    <li key={mName}>
                      <span><strong>{mName}</strong> ({ms.won}V / {ms.played}J)</span>
                      <span className={ms.winRate >= 50 ? "pos" : "neg"}>
                        <strong>{ms.winRate}%</strong>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ABA 2: RAIO-X DE PARTIDA & MAPA DE COORDENADAS */}
      {activeTab === "match" && teamDetail && (
        <main className="dashboard-content">
          <div className="match-picker-bar">
            <label>Selecione uma Partida de {summary?.teamName}:</label>
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
            >
              {teamDetail.matches.map((m) => (
                <option key={m.matchId} value={m.matchId}>
                  [{m.tournament} - {m.stage}] {m.teamRedName} {m.teamRedScore} x {m.teamBlueScore} {m.teamBlueName} ({m.mapName})
                </option>
              ))}
            </select>
          </div>

          {matchDetail && (
            <div className="match-detail-grid">
              {/* MAPA DE CALOR / POSIÇÕES (X,Y) */}
              <div className="card-block">
                <h3>📍 Mapa Tático de Abates ({matchDetail.match.mapName}) — playerLocations (x, y)</h3>
                <p className="hint-text">
                  Cada ponto representa a coordenada exata de um abate na partida:
                  <span className="dot-legend fk">● First Kill</span>
                  <span className="dot-legend trade">● Trade Kill (&lt;3.5s)</span>
                  <span className="dot-legend iso">● Morte Isolada (&gt;20m)</span>
                </p>
                <KillScatterPlot kills={matchDetail.kills} />
              </div>

              {/* LINHA DO TEMPO DE ROUNDS E ECONOMIA */}
              <div className="card-block">
                <h3>⏱️ Linha do Tempo de Rounds (Economia & Conversão 5v4)</h3>
                <div className="rounds-scroll">
                  <table className="tactical-table compact">
                    <thead>
                      <tr>
                        <th>Rd</th>
                        <th>Vencedor</th>
                        <th>Resultado</th>
                        <th>First Kill</th>
                        <th>5v4 Convertido?</th>
                        <th>Compra {matchDetail.match.teamRedName}</th>
                        <th>Compra {matchDetail.match.teamBlueName}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchDetail.rounds.map((r) => (
                        <tr key={r.roundNum}>
                          <td><strong>#{r.roundNum + 1}</strong></td>
                          <td>
                            <span className={r.winningTeamColor === "Red" ? "team-red" : "team-blue"}>
                              {r.winningTeamSlug.toUpperCase()}
                            </span>
                          </td>
                          <td>{r.roundResult} {r.plantSite ? `(Site ${r.plantSite})` : ""}</td>
                          <td>{r.firstKillerName.split("#")[0]} → {r.firstVictimName.split("#")[0]}</td>
                          <td>
                            {r.converted5v4 ? (
                              <span className="pos">Sim (Converteu)</span>
                            ) : (
                              <span className="neg">Não (Virou 4v5)</span>
                            )}
                          </td>
                          <td>{r.redBuyType} ({r.redLoadoutValue})</td>
                          <td>{r.blueBuyType} ({r.blueLoadoutValue})</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ABA 3: COMPARADOR DE EQUIPES */}
      {activeTab === "compare" && summary && compareDetail && (
        <main className="dashboard-content">
          <div className="match-picker-bar">
            <label>Comparar <strong>{summary.teamName}</strong> contra:</label>
            <select
              value={compareTeamSlug}
              onChange={(e) => setCompareTeamSlug(e.target.value)}
            >
              {teams.map((t) => (
                <option key={t.teamSlug} value={t.teamSlug}>
                  {t.teamName} ({t.matchesWon}V / {t.matchesPlayed}J)
                </option>
              ))}
            </select>
          </div>

          <div className="compare-box">
            <CompareRow
              label="Winrate de Partidas"
              v1={summary.matchWinRate}
              v2={compareDetail.summary.matchWinRate}
              suffix="%"
            />
            <CompareRow
              label="Taxa de First Kill por Round"
              v1={summary.firstKillRate}
              v2={compareDetail.summary.firstKillRate}
              suffix="%"
            />
            <CompareRow
              label="Conversão de Vantagem 5v4"
              v1={summary.conversion5v4Rate}
              v2={compareDetail.summary.conversion5v4Rate}
              suffix="%"
            />
            <CompareRow
              label="Virada em Desvantagem 4v5"
              v1={summary.comeback4v5Rate}
              v2={compareDetail.summary.comeback4v5Rate}
              suffix="%"
            />
            <CompareRow
              label="Taxa de Mortes Vingadas (Trade < 3.5s)"
              v1={summary.tradedDeathRate}
              v2={compareDetail.summary.tradedDeathRate}
              suffix="%"
            />
            <CompareRow
              label="Taxa de Mortes Isoladas (>20m sem Trade)"
              v1={summary.isolatedDeathRate}
              v2={compareDetail.summary.isolatedDeathRate}
              suffix="%"
              invertBetter
            />
            <CompareRow
              label="Winrate Pós-Plant (Ataque)"
              v1={summary.postPlantWinRate}
              v2={compareDetail.summary.postPlantWinRate}
              suffix="%"
            />
            <CompareRow
              label="Winrate em Retakes (Defesa)"
              v1={summary.retakeWinRate}
              v2={compareDetail.summary.retakeWinRate}
              suffix="%"
            />
          </div>
        </main>
      )}
    </div>
  );
}

function CompareRow({ label, v1, v2, suffix = "", invertBetter = false }) {
  const t1Better = invertBetter ? v1 < v2 : v1 > v2;
  const t2Better = invertBetter ? v2 < v1 : v2 > v1;
  return (
    <div className="compare-row">
      <div className={`c-val left ${t1Better ? "winner" : ""}`}>
        {v1}{suffix}
      </div>
      <div className="c-label">{label}</div>
      <div className={`c-val right ${t2Better ? "winner" : ""}`}>
        {v2}{suffix}
      </div>
    </div>
  );
}

function KillScatterPlot({ kills }) {
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
  const height = 400;

  return (
    <div className="scatter-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="map-svg">
        <rect width={width} height={height} fill="#0b121e" rx="10" />
        {/* Grid lines */}
        {[0.2, 0.4, 0.6, 0.8].map((g) => (
          <React.Fragment key={g}>
            <line x1={width * g} y1={0} x2={width * g} y2={height} stroke="#1b2738" strokeDasharray="4" />
            <line x1={0} y1={height * g} x2={width} y2={height * g} stroke="#1b2738" strokeDasharray="4" />
          </React.Fragment>
        ))}
        {kills.map((k, i) => {
          const cx = ((k.victimX - bounds.minX) / Math.max(1, bounds.maxX - bounds.minX)) * (width - 40) + 20;
          const cy = ((k.victimY - bounds.minY) / Math.max(1, bounds.maxY - bounds.minY)) * (height - 40) + 20;
          let color = "#64748b";
          let r = 4.5;
          if (k.isFirstKill) {
            color = "#ff4655";
            r = 6.5;
          } else if (k.isTradeKill) {
            color = "#00f5d4";
            r = 5.5;
          } else if (k.isIsolatedDeath) {
            color = "#f59e0b";
            r = 5.5;
          }
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.85} stroke="#0f1923" strokeWidth="1">
              <title>
                Rd #{k.roundNum + 1} ({k.timeSeconds}s): {k.killerName} ({k.killerAgent}) matou {k.victimName} ({k.victimAgent}) com {k.weaponName}
                {k.isFirstKill ? " [FIRST KILL]" : ""}
                {k.isTradeKill ? " [TRADE]" : ""}
                {k.isIsolatedDeath ? ` [MORTE ISOLADA - aliado a ${k.nearestAllyDistMeters}m]` : ""}
              </title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
