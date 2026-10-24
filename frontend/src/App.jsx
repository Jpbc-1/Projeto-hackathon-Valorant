import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

const HEX_AXES = [
  { key: "combate", label: "Combate", rawFn: (p) => `${p.acs} ACS` },
  { key: "consistencia", label: "Consistência", rawFn: (p) => `${p.kastPercent}% KAST` },
  { key: "mira", label: "Mira", rawFn: (p) => `${p.hsPercent}% HS` },
  { key: "agressividade", label: "Agressividade", rawFn: (p) => `${p.firstKills} FK` },
  { key: "dano", label: "Dano", rawFn: (p) => `${p.adr} ADR` },
  { key: "suporte", label: "Suporte", rawFn: (p) => `${p.assists} AST` },
];

const ROLE_META = {
  Duelista: { code: "DUEL", color: "#ff4655", iconUrl: "/roles/duelista.png" },
  Iniciador: { code: "INIC", color: "#10b981", iconUrl: "/roles/iniciador.png" },
  Controlador: { code: "CTRL", color: "#38bdf8", iconUrl: "/roles/controlador.png" },
  Sentinela: { code: "SENT", color: "#f59e0b", iconUrl: "/roles/sentinela.png" },
};

const STATUS_LABELS = {
  positive: { text: "PONTO FORTE", color: "#10b981" },
  warning: { text: "ATENÇÃO", color: "#f59e0b" },
  danger: { text: "CRÍTICO", color: "#ff4655" },
  info: { text: "DESTAQUE TÁTICO", color: "#38bdf8" },
};

export default function App() {
  const [overview, setOverview] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeamSlug, setSelectedTeamSlug] = useState("");
  const [teamDetail, setTeamDetail] = useState(null);

  const [activeView, setActiveView] = useState("players");
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
        setError("Servidor offline em http://127.0.0.1:8000");
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
      <div className="state-screen">
        <span>Carregando base de dados...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-screen">
        <div className="err-box">
          <h2>API Indisponível</h2>
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
  const roleInfo = ROLE_META[selectedPlayer?.topRole] || ROLE_META.Duelista;

  return (
    <div className="vlr-layout">
      <header className="vlr-topbar">
        <div className="vlr-topbar-inner">
          <div className="vlr-brand">
            <span className="vlr-brand-bar" />
            <strong>TEAMUP</strong>
            <span className="vlr-brand-meta">
              {overview ? `${overview.totals.matches} jogos / ${overview.totals.teams} times` : ""}
            </span>
          </div>

          <nav className="vlr-nav">
            <button
              className={activeView === "players" ? "vlr-nav-btn active" : "vlr-nav-btn"}
              onClick={() => setActiveView("players")}
            >
              Jogadores &amp; Pesos
            </button>
            <button
              className={activeView === "coaching" ? "vlr-nav-btn active" : "vlr-nav-btn"}
              onClick={() => setActiveView("coaching")}
            >
              Análise Tática
            </button>
            <button
              className={activeView === "matches" ? "vlr-nav-btn active" : "vlr-nav-btn"}
              onClick={() => setActiveView("matches")}
            >
              Histórico de Rounds
            </button>
          </nav>

          <div className="vlr-team-picker">
            <label htmlFor="team-select">Equipe</label>
            <select
              id="team-select"
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
        </div>
      </header>

      {summary && teamDetail && (
        <main className="vlr-container">
          {/* CABEÇALHO DIRETO DA EQUIPE */}
          <section className="vlr-team-header">
            <div className="vlr-team-title">
              <h1>{summary.teamName}</h1>
              <span>
                {summary.matchesPlayed} partidas disputadas ({summary.roundsPlayed} rounds)
              </span>
            </div>

            <div className="vlr-kpi-strip">
              <div className="vlr-kpi">
                <span className="vlr-kpi-label">Winrate</span>
                <strong className="vlr-kpi-val c-red">{summary.matchWinRate}%</strong>
                <small>
                  {summary.matchesWon}V - {summary.matchesPlayed - summary.matchesWon}D
                </small>
              </div>
              <div className="vlr-kpi">
                <span className="vlr-kpi-label">Conversão 5v4</span>
                <strong className="vlr-kpi-val c-green">{summary.conversion5v4Rate}%</strong>
                <small>Pós First Kill</small>
              </div>
              <div className="vlr-kpi">
                <span className="vlr-kpi-label">Trades &lt;3.5s</span>
                <strong className="vlr-kpi-val c-blue">{summary.tradedDeathRate}%</strong>
                <small>Mortes trocadas</small>
              </div>
              <div className="vlr-kpi">
                <span className="vlr-kpi-label">ATK / DEF</span>
                <strong className="vlr-kpi-val">
                  {summary.attackWinRate}% / {summary.defenseWinRate}%
                </strong>
                <small>Lados do mapa</small>
              </div>
            </div>
          </section>

          {/* =========================================================
              ABA 1: JOGADORES & PESOS POR FUNÇÃO
             ========================================================= */}
          {activeView === "players" && selectedPlayer && selectedPlayer.hexagon && (
            <div className="vlr-players-grid">
              {/* TABELA DE ELENCO À ESQUERDA */}
              <aside className="vlr-panel">
                <div className="vlr-panel-header">
                  <span>ELENCO</span>
                  <span>NOTA</span>
                </div>
                <div className="vlr-roster-table">
                  {roster.map((p) => {
                    const isSel = p.puuid === selectedPlayer.puuid;
                    const rMeta = ROLE_META[p.topRole] || ROLE_META.Duelista;
                    return (
                      <div
                        key={p.puuid}
                        className={`vlr-roster-row ${isSel ? "active" : ""}`}
                        onClick={() => setSelectedPlayerPuuid(p.puuid)}
                      >
                        <span
                          className="vlr-role-bar"
                          style={{ backgroundColor: rMeta.color }}
                        />
                        <img
                          src={rMeta.iconUrl}
                          alt={p.topRole}
                          className="vlr-role-icon-sm"
                        />
                        <div className="vlr-roster-main">
                          <div className="vlr-roster-name">
                            <strong>{p.gameName}</strong>
                            <small>#{p.tagLine}</small>
                          </div>
                          <div className="vlr-roster-sub">
                            <span style={{ color: rMeta.color, fontWeight: 700 }}>{p.topRole}</span>
                            <span className="vlr-dot">·</span>
                            <span>{p.topAgent}</span>
                            <span className="vlr-dot">·</span>
                            <span>K/D {p.kdRatio}</span>
                          </div>
                        </div>
                        <div className="vlr-roster-score">
                          <strong style={{ color: isSel ? rMeta.color : "#fff" }}>
                            {p.hexagon?.overall}
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </aside>

              {/* PAINEL PRINCIPAL DO JOGADOR */}
              <section className="vlr-panel">
                <div className="vlr-player-top">
                  <div className="vlr-player-top-left">
                    <div
                      className="vlr-role-badge-lg"
                      style={{ borderColor: roleInfo.color }}
                    >
                      <img
                        src={roleInfo.iconUrl}
                        alt={selectedPlayer.topRole}
                        className="vlr-role-icon-lg"
                      />
                    </div>
                    <div>
                      <div className="vlr-player-meta">
                        <span
                          className="vlr-role-code"
                          style={{ borderColor: roleInfo.color, color: roleInfo.color }}
                        >
                          {selectedPlayer.topRole.toUpperCase()}
                        </span>
                        <span className="vlr-agent-label">
                          Agente principal: <strong>{selectedPlayer.topAgent}</strong> ({selectedPlayer.matchesPlayed} J / {selectedPlayer.roundsPlayed} Rds)
                        </span>
                      </div>
                      <h2 className="vlr-player-title">
                        {selectedPlayer.gameName} <small>#{selectedPlayer.tagLine}</small>
                      </h2>
                      <p className="vlr-role-rule">{selectedPlayer.hexagon.focus}</p>
                    </div>
                  </div>

                  <div className="vlr-overall-block">
                    <span>NOTA GERAL</span>
                    <strong style={{ color: roleInfo.color }}>
                      {selectedPlayer.hexagon.overall}
                    </strong>
                  </div>
                </div>

                <div className="vlr-player-body">
                  {/* RADAR */}
                  <div className="vlr-radar-col">
                    <PlayerHexagonChart
                      player={selectedPlayer}
                      comparePlayer={comparePlayer}
                      accentColor={roleInfo.color}
                    />
                    <div className="vlr-compare-bar">
                      <label htmlFor="cmp-select">Comparar com:</label>
                      <select
                        id="cmp-select"
                        value={comparePlayerPuuid}
                        onChange={(e) => setComparePlayerPuuid(e.target.value)}
                      >
                        <option value="">Nenhum</option>
                        {roster
                          .filter((p) => p.puuid !== selectedPlayer.puuid)
                          .map((p) => (
                            <option key={p.puuid} value={p.puuid}>
                              {p.gameName} ({p.topRole} - {p.hexagon?.overall})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* TABELA DE ATRIBUTOS E PESOS */}
                  <div className="vlr-weights-col">
                    <div className="vlr-table-head">
                      <span>ATRIBUTO</span>
                      <span>ESTATÍSTICA BASE</span>
                      <span>PESO</span>
                      <span>NOTA</span>
                    </div>

                    <div className="vlr-attr-rows">
                      {HEX_AXES.map((ax) => {
                        const score = selectedPlayer.hexagon[ax.key] ?? 0;
                        const cmpScore = comparePlayer?.hexagon?.[ax.key] ?? null;
                        const weight = selectedPlayer.hexagon?.weights?.[ax.key] ?? 1.0;
                        const isZero = weight === 0;

                        return (
                          <div key={ax.key} className={`vlr-attr-row ${isZero ? "muted" : ""}`}>
                            <div className="vlr-attr-line">
                              <span className="vlr-attr-label">{ax.label}</span>
                              <span className="vlr-attr-raw">{ax.rawFn(selectedPlayer)}</span>
                              <span className={`vlr-weight-val ${weight >= 2.0 ? "high" : ""}`}>
                                {weight.toFixed(1)}x
                              </span>
                              <span className="vlr-attr-score">
                                <strong>{score}</strong>
                                {cmpScore !== null && <small> / {cmpScore}</small>}
                              </span>
                            </div>
                            <div className="vlr-progress">
                              <div
                                className="vlr-progress-bar"
                                style={{
                                  width: `${score}%`,
                                  backgroundColor: isZero ? "#3f4654" : roleInfo.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* =========================================================
              ABA 2: ANÁLISE TÁTICA VISUAL (3 PILARES + DIAGNÓSTICO)
             ========================================================= */}
          {activeView === "coaching" && (
            <div className="vlr-section-stack">
              {/* DIAGNÓSTICO EM DESTAQUE NO TOPO COM CORES POR CRITICIDADE */}
              <section className="vlr-panel">
                <div className="vlr-panel-header">
                  <span>DIAGNÓSTICO AUTOMÁTICO DA EQUIPE</span>
                  <span>BASEADO EM {summary.roundsPlayed} ROUNDS</span>
                </div>
                <div className="vlr-diag-grid">
                  {teamDetail.coachingFeedback.map((fb, i) => {
                    const st = STATUS_LABELS[fb.type] || STATUS_LABELS.info;
                    return (
                      <div
                        key={i}
                        className="vlr-diag-card"
                        style={{ borderLeftColor: st.color }}
                      >
                        <div className="vlr-diag-top">
                          <span className="vlr-diag-pillar">{fb.pillar}</span>
                          <span
                            className="vlr-diag-tag"
                            style={{ color: st.color, borderColor: st.color }}
                          >
                            {st.text}
                          </span>
                        </div>
                        <h4>{fb.title}</h4>
                        <p>{fb.description}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* OS 3 PILARES COM GRÁFICOS DE BARRAS, MEDIDORES E DESTAQUES */}
              <div className="vlr-three-cols">
                {/* PILAR 1: ENGAJAMENTO & ESPAÇAMENTO */}
                <section className="vlr-panel">
                  <div className="vlr-panel-header">
                    <span className="c-red">01 / ENGAJAMENTO &amp; ESPAÇAMENTO</span>
                    <span>FIRST KILL &amp; TRADES</span>
                  </div>

                  <div className="vlr-pillar-body">
                    {/* MEDIDORES PRINCIPAIS */}
                    <div className="vlr-metric-bars">
                      <div className="vlr-mbar-item">
                        <div className="vlr-mbar-head">
                          <span>Taxa de First Kill ({summary.firstKills} FK)</span>
                          <strong className="c-red">{summary.firstKillRate}%</strong>
                        </div>
                        <div className="vlr-progress">
                          <div
                            className="vlr-progress-bar"
                            style={{ width: `${summary.firstKillRate}%`, background: "#ff4655" }}
                          />
                        </div>
                      </div>

                      <div className="vlr-mbar-item">
                        <div className="vlr-mbar-head">
                          <span>Conversão de Vantagem 5v4</span>
                          <strong className="c-green">{summary.conversion5v4Rate}%</strong>
                        </div>
                        <div className="vlr-progress">
                          <div
                            className="vlr-progress-bar"
                            style={{ width: `${summary.conversion5v4Rate}%`, background: "#10b981" }}
                          />
                        </div>
                      </div>

                      <div className="vlr-mbar-item">
                        <div className="vlr-mbar-head">
                          <span>Virada em Desvantagem 4v5</span>
                          <strong className="c-blue">{summary.comeback4v5Rate}%</strong>
                        </div>
                        <div className="vlr-progress">
                          <div
                            className="vlr-progress-bar"
                            style={{ width: `${summary.comeback4v5Rate}%`, background: "#38bdf8" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* BARRA DIVIDIDA: MORTES TROCADAS VS ISOLADAS */}
                    <div className="vlr-split-box">
                      <div className="vlr-split-title">
                        <span>DISCIPLINA DE ESPAÇAMENTO NAS MORTES</span>
                        <strong>Média: {summary.avgNearestAllyDistOnDeathMeters}m do aliado</strong>
                      </div>
                      <div className="vlr-stacked-bar">
                        <div
                          className="vlr-sb-seg bg-blue"
                          style={{ width: `${summary.tradedDeathRate}%` }}
                          title={`Trades <3.5s: ${summary.tradedDeathRate}%`}
                        />
                        <div
                          className="vlr-sb-seg bg-neutral"
                          style={{
                            width: `${Math.max(
                              0,
                              100 - summary.tradedDeathRate - summary.isolatedDeathRate
                            )}%`,
                          }}
                        />
                        <div
                          className="vlr-sb-seg bg-amber"
                          style={{ width: `${summary.isolatedDeathRate}%` }}
                          title={`Mortes Isoladas >20m: ${summary.isolatedDeathRate}%`}
                        />
                      </div>
                      <div className="vlr-split-legend">
                        <span className="c-blue">
                          Trocadas (&lt;3.5s): <strong>{summary.tradedDeathRate}%</strong>
                        </span>
                        <span className="c-amber">
                          Isoladas (&gt;20m): <strong>{summary.isolatedDeathRate}%</strong>
                        </span>
                      </div>
                    </div>

                    {/* SALDO DE ABERTURA POR JOGADOR */}
                    <div className="vlr-subtable">
                      <div className="vlr-subtable-head">
                        <span>JOGADOR</span>
                        <span>FK / FD</span>
                        <span>ISOLADO</span>
                      </div>
                      {roster.map((p) => {
                        const diff = p.firstKillDiff;
                        return (
                          <div key={p.puuid} className="vlr-subtable-row">
                            <span className="vlr-st-name">{p.gameName}</span>
                            <span className={diff >= 0 ? "c-green" : "c-red"}>
                              {p.firstKills}FK / {p.firstDeaths}FD ({diff >= 0 ? `+${diff}` : diff})
                            </span>
                            <span className="c-amber">{p.isolatedDeaths}x</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* PILAR 2: TERMÔMETRO DE ECONOMIA */}
                <section className="vlr-panel">
                  <div className="vlr-panel-header">
                    <span className="c-amber">02 / TERMÔMETRO DE ECONOMIA</span>
                    <span>COMPRAS &amp; DISCIPLINA</span>
                  </div>

                  <div className="vlr-pillar-body">
                    <div className="vlr-metric-bars">
                      {teamDetail.economyBreakdown.map((eb) => {
                        const barColor =
                          eb.winRate >= 60
                            ? "#10b981"
                            : eb.winRate >= 40
                            ? "#38bdf8"
                            : "#f59e0b";
                        return (
                          <div key={eb.buyType} className="vlr-mbar-item">
                            <div className="vlr-mbar-head">
                              <div>
                                <span>{eb.buyType}</span>
                                <small className="vlr-mbar-sub">
                                  {" "}
                                  ({eb.roundsWon}V / {eb.roundsPlayed}J · ~{eb.avgTeamLoadout} cr)
                                </small>
                              </div>
                              <strong style={{ color: barColor }}>{eb.winRate}%</strong>
                            </div>
                            <div className="vlr-progress">
                              <div
                                className="vlr-progress-bar"
                                style={{ width: `${eb.winRate}%`, background: barColor }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* CARTÕES DE ALERTA ECONÔMICO */}
                    <div className="vlr-econ-alerts">
                      <div className="vlr-econ-card border-red">
                        <div>
                          <span className="vlr-ec-label">ARMAS CARAS PERDIDAS PÓS-ROUND</span>
                          <small>Mortes após explosão/defuse da Spike</small>
                        </div>
                        <strong className="c-red">{summary.postRoundSavedWeaponDeaths}</strong>
                      </div>

                      <div className="vlr-econ-card border-amber">
                        <div>
                          <span className="vlr-ec-label">ENTREGAS ARMADO VS ECO</span>
                          <small>Derrotas de Full-Buy contra Eco inimigo</small>
                        </div>
                        <strong className="c-amber">{summary.antiEcoThrows}</strong>
                      </div>

                      <div className="vlr-econ-card border-green">
                        <div>
                          <span className="vlr-ec-label">ROUNDS THRIFTY VENCIDOS</span>
                          <small>Vitórias econômicas contra Full-Buy</small>
                        </div>
                        <strong className="c-green">{summary.thriftyWins}</strong>
                      </div>
                    </div>
                  </div>
                </section>

                {/* PILAR 3: IMPACTO INVISÍVEL & SINERGIA */}
                <section className="vlr-panel">
                  <div className="vlr-panel-header">
                    <span className="c-blue">03 / IMPACTO INVISÍVEL &amp; SINERGIA</span>
                    <span>ASSISTS, TRADES &amp; UTILITÁRIOS</span>
                  </div>

                  <div className="vlr-pillar-body">
                    <div className="vlr-metric-bars">
                      {teamDetail.synergyPairs.slice(0, 5).map((s, idx) => {
                        const maxEvents = Math.max(
                          1,
                          teamDetail.synergyPairs[0]?.totalSynergyEvents || 1
                        );
                        const pct = Math.round((s.totalSynergyEvents / maxEvents) * 100);
                        return (
                          <div key={idx} className="vlr-mbar-item">
                            <div className="vlr-mbar-head">
                              <span>
                                #{idx + 1} {s.player1Name.split("#")[0]} +{" "}
                                {s.player2Name.split("#")[0]}
                              </span>
                              <strong className="c-blue">
                                {s.totalSynergyEvents}{" "}
                                <small className="vlr-mbar-sub">
                                  ({s.sharedAssists}A / {s.tradesDone}T)
                                </small>
                              </strong>
                            </div>
                            <div className="vlr-progress">
                              <div
                                className="vlr-progress-bar"
                                style={{ width: `${pct}%`, background: "#38bdf8" }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* SUPORTE E UTILITÁRIOS POR JOGADOR */}
                    <div className="vlr-subtable">
                      <div className="vlr-subtable-head">
                        <span>JOGADOR</span>
                        <span>DANO SUPORTE</span>
                        <span>HAB / ROUND</span>
                      </div>
                      {roster.map((p) => (
                        <div key={p.puuid} className="vlr-subtable-row">
                          <span className="vlr-st-name">
                            {p.gameName} <small>({p.topAgent})</small>
                          </span>
                          <span className="c-blue">
                            {p.supportDamageTotal} ({p.supportDamageRounds} rds)
                          </span>
                          <span>{p.castsPerRound} hab/r</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* =========================================================
              ABA 3: HISTÓRICO DE PARTIDAS & ROUNDS
             ========================================================= */}
          {activeView === "matches" && (
            <section className="vlr-panel">
              <div className="vlr-match-bar">
                <span className="vlr-section-label">SELECIONAR PARTIDA</span>
                <select
                  className="vlr-match-select"
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                >
                  {teamDetail.matches.map((m) => (
                    <option key={m.matchId} value={m.matchId}>
                      [{m.tournament}] {m.teamRedName} {m.teamRedScore} x {m.teamBlueScore}{" "}
                      {m.teamBlueName} — {m.mapName}
                    </option>
                  ))}
                </select>
              </div>

              {matchDetail && (
                <div className="vlr-match-content">
                  <div className="vlr-rounds-strip">
                    {matchDetail.rounds.map((r) => {
                      const isRed = r.winningTeamColor === "Red";
                      const isSel = selectedRoundNum === r.roundNum;
                      return (
                        <button
                          key={r.roundNum}
                          className={`vlr-round-btn ${isRed ? "win-red" : "win-blue"} ${
                            isSel ? "active" : ""
                          }`}
                          onClick={() => setSelectedRoundNum(r.roundNum)}
                        >
                          R{r.roundNum + 1}
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
                      <div className="vlr-round-detail">
                        <div className="vlr-round-summary">
                          <div className="vlr-panel-header">
                            <span>ROUND {activeRound.roundNum + 1}</span>
                            <span>{activeRound.roundResult}</span>
                          </div>
                          <div className="vlr-round-body">
                            <div className="vlr-data-row">
                              <span>Vencedor</span>
                              <strong>{activeRound.winningTeamSlug.toUpperCase()}</strong>
                            </div>
                            <div className="vlr-data-row">
                              <span>First Kill</span>
                              <strong>
                                {activeRound.firstKillerName.split("#")[0]} sobre{" "}
                                {activeRound.firstVictimName.split("#")[0]}
                              </strong>
                            </div>
                            <div className="vlr-data-row">
                              <span>Situação Pós-FK</span>
                              <strong
                                className={activeRound.converted5v4 ? "c-green" : "c-amber"}
                              >
                                {activeRound.converted5v4
                                  ? "5v4 Convertido"
                                  : "Round Virado (4v5)"}
                              </strong>
                            </div>
                            <div className="vlr-data-row">
                              <span>{matchDetail.match.teamRedName}</span>
                              <strong>
                                {activeRound.redBuyType} ({activeRound.redLoadoutValue})
                              </strong>
                            </div>
                            <div className="vlr-data-row">
                              <span>{matchDetail.match.teamBlueName}</span>
                              <strong>
                                {activeRound.blueBuyType} ({activeRound.blueLoadoutValue})
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="vlr-killfeed">
                          <div className="vlr-panel-header">
                            <span>TEMPO</span>
                            <span>ABATE</span>
                            <span>ARMA</span>
                            <span>CONTEXTO</span>
                          </div>
                          {roundKills.map((k, i) => (
                            <div key={i} className="vlr-kf-row">
                              <span className="vlr-kf-time">{k.timeSeconds}s</span>
                              <span className="vlr-kf-combat">
                                <strong>{k.killerName.split("#")[0]}</strong>{" "}
                                <small>({k.killerAgent})</small>
                                <span className="vlr-kf-sep">/</span>
                                <strong>{k.victimName.split("#")[0]}</strong>{" "}
                                <small>({k.victimAgent})</small>
                              </span>
                              <span className="vlr-kf-weapon">{k.weaponName}</span>
                              <span className="vlr-kf-tags">
                                {k.isFirstKill && <em className="tag-fk">FK</em>}
                                {k.isTradeKill && <em className="tag-tr">TRADE</em>}
                                {k.isIsolatedDeath && <em className="tag-iso">ISOLADO</em>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </section>
          )}
        </main>
      )}
    </div>
  );
}

function PlayerHexagonChart({ player, comparePlayer = null, accentColor = "#ff4655" }) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 106;

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
    <div className="vlr-radar-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} className="vlr-radar-svg">
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
              stroke="#2a2e39"
              strokeWidth="1"
            />
          );
        })}

        {HEX_AXES.map((_, i) => {
          const [x, y] = getPoint(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#2a2e39" strokeWidth="1" />;
        })}

        {comparePlayer && comparePlayer.hexagon && (
          <polygon
            points={buildPolygonPoints(comparePlayer.hexagon)}
            fill="rgba(226, 232, 240, 0.1)"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}

        <polygon
          points={buildPolygonPoints(player.hexagon)}
          fill={accentColor}
          fillOpacity="0.2"
          stroke={accentColor}
          strokeWidth="2"
        />

        {HEX_AXES.map((ax, i) => {
          const val = player.hexagon?.[ax.key] ?? 0;
          const [px, py] = getPoint(i, val);
          const [lx, ly] = getPoint(i, 134);
          return (
            <React.Fragment key={ax.key}>
              <circle cx={px} cy={py} r="3.5" fill={accentColor} />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#cbd5e1"
                fontSize="10.5"
                fontWeight="700"
              >
                {ax.label} ({val})
              </text>
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
}
