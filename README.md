# TEAMUP

Plataforma de inteligência tática pós-partida desenvolvida para o Hackathon, construída exclusivamente a partir da mineração e engenharia de dados dos **336 arquivos JSON oficiais** do torneio (**68 equipes, 411 jogadores, 6.618 rounds e 46.753 abates**).

O objetivo do projeto é ir além do placar básico de K/D/A e entregar **métricas acionáveis de comissão técnica (Coaching)**: avaliação justa por função tática, disciplina de espaçamento, eficiência econômica e sinergia invisível.

---

## Principais Features (Roteiro para Apresentação)

### 1. Hexágono de Desempenho & Sistema de Pesos por Função (`Jogadores & Pesos`)
No VALORANT competitivo, cobrar *First Kills* de um Sentinela ou cobrar *Assistências* de um Duelista distorce a análise. Por isso, criamos um motor que avalia cada jogador em **6 eixos proporcionais (0 a 100)** e calcula a **Nota Geral Ponderada** de acordo com a função principal jogada:

#### Os 6 Eixos do Hexágono (Escala Proporcional 0–100)
| Atributo | Métrica Base | Fórmula de Normalização | O que mede |
| :--- | :--- | :--- | :--- |
| **Combate** | `ACS` (Pontuação Média) | `ACS / 3.0` | Impacto direto em abates e multikills por round |
| **Consistência** | `KAST%` | `KAST% * 1.1` | % de rounds com Kill, Assist, Sobrevivência ou Trade |
| **Mira** | `HS%` (Headshot) | `HS% * 2.5` | Precisão mecânica de tiros na cabeça |
| **Agressividade** | `First Kills / Round` | `(FK / Rounds) * 450` | Capacidade de abrir o mapa e conquistar o primeiro abate |
| **Dano** | `ADR` (Dano/Round) | `ADR / 1.7` | Volume constante de pressão e dano causado |
| **Suporte** | `Assists / Round` | `(AST / Rounds) * 200` | Preparação de jogadas e assistência tática aos colegas |

#### Pesos por Classe (Soma = 10.0)
- **Duelistas** *(Neon, Jett, Raze, Phoenix, Reyna, Iso)*
  - **Pesos:** Combate `3.0` | Dano `2.5` | Agressividade `2.0` | Mira `1.5` | Consistência `0.5` | Suporte `0.5`
  - **Foco:** Cobrado por abrir espaço (FK) e causar alto volume de dano. Baixo peso em suporte.
- **Iniciadores** *(Fade, Sova, Breach, Skye, Gekko, KAY/O)*
  - **Pesos:** Suporte `3.0` | Consistência `2.0` | Dano `2.0` | Combate `1.5` | Mira `1.0` | Agressividade `0.5`
  - **Foco:** Obrigado a acumular assistências, informação e facilitar a entrada dos duelistas.
- **Controladores** *(Omen, Viper, Brimstone, Astra, Harbor, Clove)*
  - **Pesos:** Consistência `3.0` | Suporte `2.0` | Mira `2.0` | Combate `1.5` | Dano `1.0` | Agressividade `0.5`
  - **Foco:** Morrer cedo é crítico. Valoriza alto KAST% e sobrevivência até o fim do round para manter as fumaças ativas.
- **Sentinelas** *(Killjoy, Cypher, Sage, Deadlock, Vyse)*
  - **Pesos:** Consistência `3.5` | Mira `2.5` | Combate `1.5` | Dano `1.5` | Suporte `1.0` | Agressividade `0.0`
  - **Foco:** Jogo frio de âncora/lurker. **Peso 0.0 em Agressividade** (não é penalizado por não buscar First Kill).
- **Comparador Interativo (Head-to-Head):** Permite sobrepor o polígono de dois jogadores no mesmo gráfico de radar para comparar perfis táticos.

---

### 2. Diagnóstico Coletivo & Os 3 Pilares Táticos (`Análise Tática`)
Painel analítico para identificar rapidamente por que uma equipe ganha ou entrega rounds:

1. **Diagnóstico Automático da Equipe:**
   - Geração automática de cartões classificados por criticidade (**Ponto Forte**, **Destaque Tático**, **Atenção** e **Crítico**) cruzando dados da equipe e apontando nominalmente quais jogadores precisam de ajuste.
2. **Pilar 01 — Engajamento & Espaçamento:**
   - **Taxa de First Kill, Conversão de Vantagem 5v4 e Viradas em 4v5.**
   - **Cálculo Euclidiano de Espaçamento $(X, Y)$:** Mede a distância exata em metros entre o jogador abatido e o aliado vivo mais próximo no milissegundo da morte.
   - **Barra Empilhada de Disciplina:** Compara a % de **Mortes Trocadas (< 3.5s)** contra **Mortes Isoladas (> 20m de qualquer aliado e sem Trade)**.
   - **Saldo de Abertura (`FK - FD`):** Tabela individual com o saldo de First Kills vs First Deaths e contagem de mortes isoladas por jogador.
3. **Pilar 02 — Termômetro de Economia:**
   - **Winrate por Tipo de Compra:** Classificação automática do valor de *loadout* da equipe em **Pistol**, **Eco (< 7.5k)**, **Semi-Buy / Forçado (7.5k–16.5k)** e **Full-Buy / Armado (> 16.5k)**.
   - **Armas Caras Perdidas Pós-Round:** Detecta jogadores com Vandal/Phantom/Operator que morreram **depois** que a Spike já havia explodido ou sido desarmada.
   - **Entregas Armado vs Eco & Rounds Thrifty:** Monitora quantas vezes o time perdeu armado contra Eco inimigo e quantas vezes venceu em desvantagem econômica.
4. **Pilar 03 — Impacto Invisível & Sinergia:**
   - **Ranking de Duplas de Sinergia:** Mapeia os pares de jogadores que mais combinam **Assistências Diretas + Trades Mútuos**.
   - **Dano de Suporte:** Contabiliza rounds em que o jogador causou **50+ de dano** em um inimigo que foi finalizado por um companheiro.
   - **Volume de Utilitários:** Média de habilidades utilizadas por round (`hab/r`) por jogador.

---

### 3. Replay e Linha do Tempo de Rounds (`Histórico de Rounds`)
- Seleção de qualquer uma das partidas disputadas pela equipe no torneio (com identificação do campeonato, mapa e placar).
- Navegação round a round (`R1` a `R24+`) indicando a cor do lado vencedor (`Ataque/Red` ou `Defesa/Blue`).
- Resumo tático do round (Vencedor, condição de vitória, autor da First Kill, se o 5v4 foi convertido ou se houve virada 4v5 e economia de ambos os lados).
- **Killfeed Tático Cronológico:** Lista cada abate com o segundo exato do round (`timeSeconds`), agentes, arma utilizada e tags automáticas de contexto (`FK`, `TRADE`, `ISOLADO`).

---

## Arquitetura & Pipeline de Dados (100% Local)

O projeto respeita rigorosamente a regra de **não consumir APIs externas**:
1. **Extração e Tradução (`scripts/organize_database.py`):**
   - Lê os 336 arquivos `.json` brutos da Riot.
   - Traduz todos os UUIDs internos para nomes oficiais de **28 Agentes, 21 Armas, Escudos e 10 Mapas** (`database/json/dictionary.json`).
   - Associa os nomes reais das equipes universitárias (extraídos dos nomes dos arquivos) aos lados `Red` e `Blue` validando a recorrência dos `PUUIDs` de cada elenco.
2. **Banco de Dados Analítico (`database/json/`):**
   - `teams_summary.json` (68 equipes)
   - `players_summary.json` (411 jogadores)
   - `matches.json` (336 partidas)
   - `match_players.json` (3.360 atuações individuais)
   - `rounds.json` (6.618 rounds)
   - `kills_tactical.json` (46.753 abates com coordenadas e flags táticas)
   - `synergy_pairs.json` (1.092 pares de sinergia)
3. **Back-end (`backend/api.py`):** API REST em **Python (FastAPI)** servindo os cálculos ponderados e diagnósticos em tempo real na porta `8000`.
4. **Front-end (`frontend/src/App.jsx` & `App.css`):** Interface editorial inspirada no *VLR.gg*, construída em **React + Vite** na porta `5173`.

---

## Como Rodar o Projeto

Certifique-se de ter **Python 3.10+** e **Node.js 18+** instalados. Abra **2 terminais** na pasta raiz do projeto:

### Terminal 1 — Back-end (Python / FastAPI)
```powershell
pip install fastapi uvicorn
python -m uvicorn backend.api:app --host 127.0.0.1 --port 8000
```
- API rodando em: `http://127.0.0.1:8000`
- Documentação Swagger: `http://127.0.0.1:8000/docs`

### Terminal 2 — Front-end (React / Vite)
```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
- Interface disponível em: **`http://127.0.0.1:5173`**
