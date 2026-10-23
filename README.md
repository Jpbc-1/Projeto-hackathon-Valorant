# 🎯 VALORANT Tactical Coach — Hackathon Analytics

Plataforma de diagnóstico tático e coaching pós-partida construída sobre a base oficial de **336 partidas** (68 equipes, 411 jogadores e 46.753 abates) do campeonato universitário.

---

## 🛠️ Pré-requisitos

Certifique-se de ter instalado na máquina:
- **Python 3.10+** ([Download Python](https://www.python.org/downloads/))
- **Node.js 18+** ([Download Node.js](https://nodejs.org/))

---

## 🚀 Como rodar o projeto (Passo a Passo)

Você vai precisar de **2 terminais abertos** na pasta raiz do projeto (`Projeto-hackathon-Valorant`): um para o **Back-end (Python)** e outro para o **Front-end (React)**.

### 1️⃣ Terminal 1 — Ligando o Back-end (Python / FastAPI)

Na pasta raiz do projeto, instale o `fastapi` e o `uvicorn` (só precisa fazer na primeira vez) e inicie o servidor:

```powershell
# Instala as dependências da API
pip install fastapi uvicorn

# Inicia o servidor Python na porta 8000
python -m uvicorn backend.api:app --host 127.0.0.1 --port 8000
```
> ✅ O back-end estará rodando em: `http://127.0.0.1:8000` (Documentação interativa em `http://127.0.0.1:8000/docs`).

---

### 2️⃣ Terminal 2 — Ligando o Front-end (React / Vite)

Abra um **segundo terminal**, entre na pasta `frontend`, instale os pacotes (só na primeira vez) e rode o projeto:

```powershell
# Entra na pasta do front-end
cd frontend

# Instala as dependências do React (só na 1ª vez)
npm install

# Inicia o servidor de desenvolvimento do React
npm run dev
```
> ✅ Agora é só abrir no navegador: **`http://127.0.0.1:5173`** (ou `http://localhost:5173`).

---

## 📂 Estrutura do Projeto

```text
Projeto-hackathon-Valorant/
├── backend/
│   └── api.py                  # API FastAPI + Motor de Feedback Automático de Coaching
├── database/
│   ├── json/                   # Base de dados já tratada, traduzida e pronta para uso (commited no Git)
│   │   ├── dictionary.json     # Tradução de UUIDs (28 Agentes, 21 Armas, Escudos e 10 Mapas)
│   │   ├── teams_summary.json  # Estatísticas consolidadas das 68 equipes
│   │   ├── players_summary.json# Estatísticas + Hexágono (0-100) dos 411 jogadores
│   │   ├── matches.json        # Metadados das 336 partidas
│   │   ├── match_players.json  # Desempenho individual por partida
│   │   ├── rounds.json         # Histórico de 6.618 rounds (economia, 5v4, plants)
│   │   ├── kills_tactical.json # 46.753 kills com First Kill, Trade, Isolamento e Coordenadas
│   │   └── synergy_pairs.json  # Matriz de sinergia de duplas (assists + trades)
│   ├── loader.py               # Helper para puxar dados facilmente em Python
│   └── loader.js               # Helper para puxar dados facilmente em Node/JS
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Interface dividida em 4 telas (Visão Geral, Hexágono, 3 Pilares e Replay)
│   │   └── App.css             # Estilização temática VALORANT
│   └── package.json
└── scripts/
    └── organize_database.py    # Script ETL que processou os 336 JSONs brutos originais
```

---

## 🧭 O que tem em cada tela do Dashboard?

1. **🏠 Visão Geral & Coach:** KPIs gerais da equipe, domínio de mapas e **Diagnóstico Automático do Coach** (alertas de entregas 5v4, mortes isoladas, perdas econômicas e destaques táticos).
2. **⬢ Jogadores & Hexágono (0 a 100):** Perfil de cada jogador nos 6 atributos (*Combate, Consistência/KAST%, Mira/HS%, Agressividade/FK, Dano/ADR e Suporte/Assists*), com opção de sobrepor dois jogadores no mesmo gráfico.
3. **🧠 Os 3 Pilares Táticos:**
   - **1. Eficiência de Engajamento:** First Kills, Conversão 5v4, Trades (< 3.5s) e Mortes Isoladas (> 20m sem trade).
   - **2. Termômetro de Economia:** Aproveitamento em *Pistol, Eco, Forçado e Armado*, entregas contra Eco e armas caras perdidas após o fim do round.
   - **3. O Impacto Invisível:** Uso de habilidades por round, Dano de Suporte (50+ de dano finalizado por colega) e Matriz de Duplas.
4. **📋 Raio-X de Partida:** Seletor de round interativo (`R1` a `R24`) com o *Kill Feed* segundo a segundo e o placar completo da partida.
