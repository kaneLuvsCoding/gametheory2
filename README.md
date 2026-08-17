# 🕶️ Under the Table: Cartel & Price-Fixing Arena

## 🤖 AI Agent System Prompt
You are an expert full-stack developer. Your task is to initialize, architect, and build **"Under the Table"**, a 4 to 6-player real-time web-based economic strategy board game grounded in Game Theory principles (Oligopoly Theory, N-Person Prisoner's Dilemma, and Schelling's Strategic Moves).

The core dynamic revolves around **cartel price agreements**, **secret undercutting**, and **retaliatory price wars**. The backend must act as an authoritative state machine to enforce simultaneous secret submissions and prevent client-side inspection.

---

## 🛠️ Tech Stack Requirements
*   **Frontend:** React (scaffolded with Vite), Tailwind CSS for dashboard & board UI.
*   **Backend:** Node.js, Express, Socket.io (for low-latency real-time state sync, chat channels, and turn timers).
*   **Database & Auth:** Supabase (PostgreSQL) for user authentication, match records, and persistent leaderboards.
*   **In-Memory State (Optional/Recommended):** In-memory JavaScript Map or Redis for active round timers and buffered secret submissions.
*   **Version Control:** Git (Initialize repository immediately).

---

## 📖 Core Game Rules & Mechanics

### Match Setup
*   **Players:** 4 to 6 Merchants per lobby.
*   **Game Length:** 6 Rounds.
*   **Starting Capital:** Each player starts with $5,000 and 100 crates of commodity goods.

### The 3-Phase Round Loop
1.  **Phase 1: The Public Summit (60s):**
    *   Open lobby chat.
    *   Players negotiate and vote on an official non-binding **"Cartel Price Floor"** (e.g., $50/crate).
2.  **Phase 2: The Secret Dispatch (20s):**
    *   Each player privately locks in their actual dispatch price ($10 to $100) and quantity of crates to offer.
    *   *Optional Action:* Spend $300 to hire an **Informant (Audit)** targeting one opponent to inspect their locked price during resolution.
3.  **Phase 3: Market Resolution & Price Reveal (15s):**
    *   The market automatically buys from the lowest priced offers first.
    *   **Equal Pricing:** If multiple players offer the lowest price, demand is split equally among them.
    *   **Undercutting:** If one player undercuts the cartel, they capture the sales volume, while players who held the high price sell nothing and pay warehouse holding costs (-$200).
    *   **Price War Crash:** If multiple players dump goods at cost ($10), market value crashes and margins collapse.

### Win Condition
The player with the highest total net worth (Liquid Cash + Remaining Inventory Value) at the end of Round 6 wins.

---

## 🏗️ Architecture & Implementation Steps

### Step 1: Project Scaffolding
1.  Initialize a Git repository.
2.  Create `client/` folder: Scaffold React app with Vite and install `tailwindcss`, `socket.io-client`, `@supabase/supabase-js`, `lucide-react`.
3.  Create `server/` folder: Scaffold Node.js project and install `express`, `socket.io`, `cors`, `dotenv`.
4.  Configure Supabase client in `client/src/lib/supabase.js`.

### Step 2: Server-Authoritative State Engine
In `server/game/roomManager.js`, implement a `GameRoom` class tracking:
*   `roomId`, `players` (ID, name, balance, inventory, auditedTarget).
*   `currentPhase` (`LOBBY`, `SUMMIT`, `SECRET_DISPATCH`, `MARKET_REVEAL`, `GAME_OVER`).
*   `cartelAgreedPrice` (number).
*   `secretSubmissions` (Map: playerId -> { price, quantity, auditTarget }).
*   `priceHistory` (array of previous round results for the public ledger).

### Step 3: WebSocket Event Handlers
Implement the following events in `server/index.js`:
*   `join_room` / `create_room`: Handles lobby matchmaking.
*   `propose_cartel_price`: Real-time voting during the Summit phase.
*   `submit_secret_order`: Buffers private player prices without broadcasting to opponents.
*   `phase_timer_tick`: Emits remaining seconds for active phase.
*   `market_resolved`: Emits calculated profits, losses, and audit reports to all clients.

### Step 4: Verification & Smoke Test
Run a Node.js test script to simulate 4 mock players submitting orders in a test match to verify the economic resolution math (fair split vs. single undercut vs. multi-way price crash) before implementing the React frontend UI.
