![Marzban Logo](my-agent/public/risein-logo.svg)

# Marzban: The Agentic Bazaar Merchant

**Marzban** is an autonomous, stateful AI bazaar merchant built on **Next.js 16**, the **Google Gen AI SDK** (`@google/genai`), and **viem**. Operating within a theatrical Persian-inspired marketplace, Marzban negotiates item prices in silver, defends secret reserve floors with dynamic mood-based concessions, enforces strict buyer confirmation gates before payment execution, and signs on-chain machine-to-machine micropayments via the **x402 protocol** on **Base Sepolia**.

---

## What Problem Your AI Agent is Solving

Modern autonomous AI agents face severe reliability, safety, and transactional challenges when interacting with real users and decentralized financial systems:

1. **Unbounded Hallucination & Leaked State in Negotiations:** Typical LLM chatbots readily hallucinate inventory, invent prices, or fold instantly under conversational pressure, revealing sensitive internal costs or accepting absurd offers. Marzban solves this by enforcing an authoritative state machine in `agent/bazaar.ts` where items, base prices, rounds, and reserve floors are deterministic, strictly hidden, and governed by non-linear mood mechanics.
2. **Premature & Unauthorized Automated Purchases:** Autonomous agents with wallet access often execute payments prematurely upon model suggestion without explicit human consent. Marzban implements a conservative **Buyer Confirmation Authorization Gate** that requires explicit, affirmative buyer intent in the current conversation turn while blocking questions, hesitation phrases, price mismatches, and model-contrived same-turn shortcuts.
3. **Machine-to-Machine Autonomous Micropayments (x402):** API services need a standardized, permissionless payment mechanism that does not require human credit cards or API subscriptions. Marzban integrates the **x402 (HTTP 402 Payment Required)** protocol where the agent autonomously handles HTTP 402 challenges, constructs structured payment claims, signs them using viem with EIP-191 personal signatures, and completes settlement idempotently on Base Sepolia.

---

## Tech Stack & Installed Versions

All dependencies and runtime versions are verified against `package.json` and the resolved lockfile:

- **Framework:** [Next.js](https://nextjs.org/) `16.4.0` (declared `^16.3.6`, App Router, Webpack/Turbopack runtime)
- **UI & Component Architecture:** [React](https://react.dev/) `19.3.0` & `react-dom` `19.3.0`
- **Styling & Design System:** [Tailwind CSS](https://tailwindcss.com/) `4.3.3` (with `@tailwindcss/postcss` `4.3.3`, `tw-animate-css` `1.4.0`)
- **Primitive Components:** `@base-ui/react` `1.8.0`, `lucide-react` `1.48.0`, `class-variance-authority` `0.7.1`
- **AI Model Orchestration:** [Google Gen AI SDK](https://www.npmjs.com/package/@google/genai) (`@google/genai`) `2.24.0`
- **Web3 & Cryptography:** [viem](https://viem.sh/) `2.56.9` (Base Sepolia testnet, EIP-191 signing, address derivation)
- **TypeScript:** [TypeScript](https://www.typescriptlang.org/) `5.9.3` (strict type-checking via `tsc --noEmit`)
- **Test Runner & Execution:** [Node.js Test Runner](https://nodejs.org/api/test.html) with [jiti](https://github.com/unjs/jiti) `2.4.2` (`node --import jiti/register --test`)
- **Runtime Environment:** [Node.js](https://nodejs.org/) `>= 20.0.0` (verified on Node `v24.19.0`)

---

## Agent Capabilities & Verified Tool Suite

Marzban exposes **9 fully verified, production-hardened tools** to the AI model dispatcher. Every tool matches the `@google/genai` JSON schema specification (`parametersJsonSchema`), provides defensive type casting, supports camelCase and snake_case parameter aliases, and handles missing or malformed inputs without crashing the agent loop.

### Tool Verification Matrix

| Tool Name | Category | Action Type | Schema & Parameters | Execution Path & Handlers | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `list_wares` | Commerce | Read-Only | `{ type: "object", properties: {} }` | `tools.ts` -> `listWares()` in `bazaar.ts` | **Verified** (Unit & Integration) |
| `haggle_offer` | Commerce | State-Changing | `itemId` (string, req), `offer` (integer, req) | `tools.ts` -> `haggle(itemId, offer)` in `bazaar.ts` | **Verified** (42 Tests Suite) |
| `pay_invoice` | Commerce | State-Changing | `dealId` (string, req) | `tools.ts` -> `verifyBuyerConfirmation()` -> `beginPayment()` -> `payAndFetch(/api/bazaar/checkout)` | **Verified** (Gate & State Machine) |
| `get_receipt` | Commerce | Read-Only | `receiptId` (str, opt), `dealId` (str, opt), `itemId` (str, opt) | `tools.ts` -> `getReceipt(id)` in `bazaar.ts` | **Verified** (Idempotency Tested) |
| `get_stall_status` | Commerce | Read-Only | `{ type: "object", properties: {} }` | `tools.ts` -> `getStallStatus()` in `bazaar.ts` | **Verified** (Sanitization Verified) |
| `get_weather` | Utility | State-Changing | `city` (string, req) | `tools.ts` -> `payAndFetch(/api/weather?city=...)` | **Verified** (x402 Flow Verified) |
| `get_my_wallet` | Wallet | Read-Only | `{ type: "object", properties: {} }` | `tools.ts` -> `getWalletAddress()` & `getWalletBalance()` in `wallet.ts` | **Verified** (Base Sepolia RPC) |
| `get_joke` | Utility | Read-Only | `{ type: "object", properties: {} }` | `tools.ts` -> official joke API with 4s timeout & offline fallback | **Verified** (Resilience Tested) |
| `get_country_info` | Utility | Read-Only | `country` (string, req) | `tools.ts` -> offline curated 24-country DB + restcountries.com API | **Verified** (Curated & Live Tested) |

---

### Detailed Tool Specifications

#### 1. `list_wares`
- **Purpose:** Inspect all wares offered in Marzban's stall.
- **Parameters:** None.
- **Behavior & Security:** Returns public wares (`id`, `name`, `description`, `basePrice`, `askingPrice`, `availability`, `roundsConsumed`, `roundsRemaining`). **Strictly sanitizes and omits** `privateCost`, `threshold`, and internal margin formulas.

#### 2. `haggle_offer`
- **Purpose:** Submit a bid in silver for a specific item.
- **Parameters:**
  - `itemId` (string, required): Item identifier (`brass-astrolabe`, `saffron-tin`, `silk-scarf`, `haunted-lamp`, `spice-box`, `map-scroll`). Also accepts normalized titles (e.g., "Brass Astrolabe").
  - `offer` (integer, required): Positive integer silver amount.
- **Behavior & Invariants:**
  - Rejects zero, negative, floating-point, or non-numeric offers.
  - Returns `negotiation_closed` if 4 rounds are exhausted and offer is below standing asking price.
  - Returns `rejected_insulting` if offer is below 70% of cost (degrades merchant mood).
  - Returns `accepted` if offer meets or exceeds private threshold: `min(basePrice, ceil(privateCost * 1.15 * moodFactor))`. Agrees price at `min(offer, askingPrice)` and reserves item.
  - Returns `counter` with counter price strictly above private floor: `counterPrice > threshold`.

#### 3. `pay_invoice`
- **Purpose:** Trigger checkout and execute machine-to-machine x402 payment using the agent's wallet.
- **Parameters:**
  - `dealId` (string, required): Active pending deal identifier (`deal-xxxxxxxx`).
- **Authorization Gate:** Evaluates `verifyBuyerConfirmation(dealId, ctx)`. Fails if the user hesitated ("wait", "don't pay"), asked a question, proposed a different price, named another item, or if the deal was created in the current turn.
- **Concurrency & State Guard:** Locks deal in `processing` state via `beginPayment()`. On network failure, triggers `failPayment()` to ensure the item **remains reserved** for user retry.

#### 4. `get_receipt`
- **Purpose:** Retrieve proof of completed purchase.
- **Parameters:**
  - `receiptId` (string, optional): Specific receipt identifier (`rcpt-xxxxxxxx`).
  - `dealId` (string, optional): Associated deal identifier.
  - `itemId` (string, optional): Associated item identifier.
- **Behavior:** Returns receipt metadata including SHA-256 derived Base Sepolia transaction hash (`txHash`), silver price, timestamp, and payer address. Defaults to most recent receipt if unspecified.

#### 5. `get_stall_status`
- **Purpose:** Check stall operational metrics and merchant disposition.
- **Parameters:** None.
- **Behavior:** Returns current `mood` (`cheerful`, `neutral`, `grumpy`), public inventory wares, active pending deals, and total completed receipts count.

#### 6. `get_weather`
- **Purpose:** Query paid city weather data demonstrating HTTP 402 micropayments.
- **Parameters:**
  - `city` (string, required): City name (e.g. `Mumbai`, `London`, `Tokyo`).
- **Behavior:** Issues GET to `/api/weather`. Receives HTTP 402 challenge (`price: 0.01 USDC`). Wallet signs EIP-191 authorization. Retries with `X-PAYMENT` header to unlock live temperature and conditions.

#### 7. `get_my_wallet`
- **Purpose:** Query the agent's EVM wallet address and live testnet balance.
- **Parameters:** None.
- **Behavior:** Reads address from `.env` (`WALLET_PRIVATE_KEY`), in-memory state, local `.agent-wallet.json`, or ephemeral `/tmp` storage. Queries Base Sepolia via Viem RPC (`eth_getBalance`) with timeout protection.

#### 8. `get_joke`
- **Purpose:** Provide programming humor.
- **Parameters:** None.
- **Behavior:** Fetches from `official-joke-api.appspot.com` with 4-second timeout. If offline or rate-limited, safely returns curated fallback joke without throwing uncaught exceptions.

#### 9. `get_country_info`
- **Purpose:** Query country capital, population, region, and local cuisine.
- **Parameters:**
  - `country` (string, required): Country name.
- **Behavior:** Fast-path matches against curated local database of 24+ countries (including India, France, Japan, USA, UAE, etc.). Falls back to `restcountries.com` with a 4s timeout. Validates empty inputs and returns actionable guidance.

---

## Supported AI Models & Versioning

Marzban is powered by the **Google Gen AI SDK** (`@google/genai` `v2.24.0`). The agent orchestration loop in `my-agent/agent/agent.ts` uses function calling declarations compatible with all modern Gemini models.

### Model Matrix

| Model Identifier | Version / Alias | Status | Tool-Calling Support | Description |
| :--- | :--- | :--- | :--- | :--- |
| `gemini-flash-latest` | Default Alias | **Default** | Full (`parametersJsonSchema`) | Ultra-fast multimodal reasoning, recommended for lowest latency. |
| `gemini-2.5-flash` | Production Release | Supported | Full | Latest Gemini 2.5 Flash model with superior reasoning and tool precision. |
| `gemini-2.0-flash` | Production Release | Supported | Full | High-speed 2.0 series model with robust multi-turn instruction following. |
| `gemini-1.5-flash` | Dated Release | Supported | Full | High-throughput, cost-efficient model. |
| `gemini-1.5-pro` | Production Release | Supported | Full | Complex reasoning model for deep conversational negotiation. |
| `gemini-2.5-pro` | Production Release | Supported | Full | Flagship reasoning engine with advanced structured output capabilities. |

### How to Switch Models

Configure the model via the `GEMINI_MODEL` environment variable in `my-agent/.env`:

```bash
# In my-agent/.env:
GEMINI_MODEL=gemini-2.5-flash
```

Or pass it dynamically when running the application:

```bash
# Windows PowerShell
$env:GEMINI_MODEL="gemini-2.0-flash"; npm run dev

# Linux / macOS
GEMINI_MODEL=gemini-2.0-flash npm run dev
```

Restart the development server after modifying `.env`. The UI header will display the active engine identifier with a live status indicator.

---

## Quick Start & Local Setup

### 1. Prerequisites
- **Node.js:** `v20.0.0` or higher (`node -v` to check; v24.19.0 verified).
- **Gemini API Key:** Free key from [Google AI Studio](https://aistudio.google.com/apikey).

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-org/agentmaxx.git
cd agentmaxx/my-agent

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` inside `my-agent/`:
```bash
cp .env.example .env
```

Edit `my-agent/.env`:
```env
# Required: Your Google Gemini API Key
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Optional: AI Model Selector (defaults to gemini-flash-latest)
GEMINI_MODEL=gemini-flash-latest

# Optional: An existing EVM test private key (64 hex characters starting with 0x)
# If omitted, click "Create wallet" in the web UI.
WALLET_PRIVATE_KEY=
```

### 4. Run Development Server
```bash
# From my-agent/ directory:
npm run dev

# Or from repository root:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Click **Create wallet** in the Setup panel to initialize the agent's cryptographic wallet.

### 5. Running the Automated Test Suite
```bash
# Run the 48-test verification suite
npm test --prefix my-agent

# Run strict TypeScript type check
npm run type-check --prefix my-agent

# Run production build
npm run build --prefix my-agent
```

---

## Comprehensive Troubleshooting & Common Errors

### Category 1: Installation & Build Errors

#### Problem 1.1: Node.js Version Incompatibility
- **Symptoms:** `SyntaxError: Unexpected token '?'` or `Error: Node.js version unsupported`.
- **Root Cause:** Next.js 16 and modern ECMAScript dependencies require Node.js `>= 20.0.0`.
- **How to Diagnose:** Run `node -v` in your terminal.
- **Solution:** Install Node.js LTS (v20 or v22) using [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm):
  ```bash
  nvm install 22
  nvm use 22
  ```
- **Verification:** Run `node -v` and confirm output starts with `v20.` or `v22.`.

#### Problem 1.2: Turbopack Build Conflicts on Windows
- **Symptoms:** `next build` hangs or fails with Turbopack compilation errors.
- **Root Cause:** Next.js 16 defaults to Turbopack in some CLI flows where native symlinks or webpack configurations are required.
- **How to Diagnose:** Check `package.json` scripts.
- **Solution:** Use the configured production build script: `next build --webpack`.
- **Verification:** Run `npm run build --prefix my-agent` and observe `✓ Compiled successfully`.

#### Problem 1.3: Windows OneDrive / Background Process File Locking (`EPERM`)
- **Symptoms:** `Error: EPERM: operation not permitted, mkdir ...\.next\server\app\...` during build or prerendering.
- **Root Cause:** Cloud synchronization clients (e.g., Microsoft OneDrive, Dropbox) or active antivirus scanners lock transient chunk files in `.next` while the Next.js compiler is generating static segments.
- **How to Diagnose:** Check if the repository resides within a OneDrive/cloud-synced folder path.
- **Solution:** Pause cloud sync during builds or purge the stale cache:
  ```powershell
  # PowerShell cache purge:
  Remove-Item -Recurse -Force my-agent\.next -ErrorAction SilentlyContinue
  npm run build --prefix my-agent
  ```
- **Verification:** Build proceeds through compilation and static page generation.

---

### Category 2: Environment & Credentials

#### Problem 2.1: Missing or Empty `GEMINI_API_KEY`
- **Symptoms:** Chat API returns HTTP 500 with `GEMINI_API_KEY is not configured. Set GEMINI_API_KEY in your environment variables or .env file.`
- **Root Cause:** The server runtime cannot locate `process.env.GEMINI_API_KEY`.
- **How to Diagnose:** Verify that `my-agent/.env` exists and contains a non-empty `GEMINI_API_KEY` string.
- **Solution:** Add your key to `my-agent/.env` and restart the server:
  ```env
  GEMINI_API_KEY=AIzaSy...
  ```
- **Verification:** Refresh [http://localhost:3000](http://localhost:3000) and verify that the Header displays `ENGINE: ...` with a pulsing green indicator.

#### Problem 2.2: Ethereum Address Accidental Paste in `WALLET_PRIVATE_KEY`
- **Symptoms:** Wallet falls back to generated key or balance returns unexpected address.
- **Root Cause:** Pasting a 42-character public address (`0x...`) instead of a 66-character (32-byte) hex private key. `wallet.ts` validates private keys with `/^0x[0-9a-fA-F]{64}$/`.
- **How to Diagnose:** Inspect `WALLET_PRIVATE_KEY` in `my-agent/.env`. Count characters (an address is 42 chars; a private key is 66 chars including `0x`).
- **Solution:** Provide a 32-byte private key or leave `WALLET_PRIVATE_KEY` blank and click **Create wallet** in the UI.
- **Verification:** Run `npm test --prefix my-agent` to verify `parsePrivateKey` accepts valid hex keys.

---

### Category 3: AI Model & Provider Errors

#### Problem 3.1: Model Quota or Rate-Limit Exhaustion (HTTP 429 / 503)
- **Symptoms:** Chat returns `503 Service Unavailable` or `429 Too Many Requests`.
- **Root Cause:** Free-tier Gemini quota limits reached on Google AI Studio.
- **How to Diagnose:** Inspect terminal logs for `RESOURCE_EXHAUSTED` or `UNAVAILABLE`.
- **Solution:** `agent/agent.ts` automatically retries 503 and 429 errors once after a 1500ms backoff. If persistent, switch to another model:
  ```env
  GEMINI_MODEL=gemini-2.0-flash
  ```
- **Verification:** Resend query after backoff window.

#### Problem 3.2: Safety Filter Blocking
- **Symptoms:** Chat returns `The response was blocked by model safety filters (reason: SAFETY)`.
- **Root Cause:** Google safety classifiers flagged prompt content or output candidates.
- **How to Diagnose:** `agent/agent.ts` captures `promptFeedback.blockReason` and candidate `finishReason` (`SAFETY`, `BLOCKLIST`, `SPII`).
- **Solution:** Rephrase the query to avoid sensitive trigger words. The agent loop handles this gracefully without throwing uncaught exceptions.
- **Verification:** Prompt the agent with ordinary bazaar commerce queries (e.g., "Browse wares").

---

### Category 4: Tool Invocation Errors

#### Problem 4.1: Missing Required Parameter on Tool Dispatch
- **Symptoms:** Tool execution step returns `{ error: "Missing required parameter: itemId" }` or `{ error: "Missing required parameter: dealId" }`.
- **Root Cause:** The AI model invoked a tool without supplying required parameters.
- **How to Diagnose:** Inspect the tool call arguments in the chat UI inspector badge.
- **Solution:** `agent/tools.ts` normalizes both camelCase and snake_case parameters (`itemId` and `item_id`, `dealId` and `deal_id`). Ensure prompt clearly identifies the target item.
- **Verification:** Run `npm test --prefix my-agent` — aliases are tested in `supports snake_case and camelCase aliases`.

#### Problem 4.2: Payment Authorization Denied by Buyer Confirmation Gate
- **Symptoms:** Agent replies: `Payment authorization denied: Buyer indicated hesitation... Ask the buyer for explicit confirmation before proceeding to checkout.`
- **Root Cause:** Buyer asked a question (e.g. "Can I pay?"), expressed hesitation ("wait, cancel"), named another item, or attempted same-turn checkout.
- **How to Diagnose:** Inspect `lastUserMessage` in the turn context.
- **Solution:** Provide explicit, unambiguous affirmative confirmation in your chat message:
  > *"Yes, proceed to checkout"* or *"Confirm purchase of the agreed deal."*
- **Verification:** Verified across 13 dedicated gate tests in `bazaar.test.ts`.

---

### Category 5: Wallet & Filesystem Persistence Errors

#### Problem 5.1: Read-Only Filesystem in Serverless (`EROFS`)
- **Symptoms:** Server logs show `Error: EROFS: read-only file system, open '.agent-wallet.json'`.
- **Root Cause:** Serverless cloud environments (such as Vercel AWS Lambda runtimes) have read-only root directories.
- **How to Diagnose:** Observe filesystem write errors during `/api/wallet` POST requests.
- **Solution:** `agent/wallet.ts` stores wallets with a multi-tier fallback:
  1. `inMemoryPrivateKey` (always writable in-process memory).
  2. `os.tmpdir()` (`/tmp/.agent-wallet.json` writable in serverless).
  3. Local `.agent-wallet.json` wrapped in a non-fatal `try/catch`.
- **Code-level Fix:** Implemented in `createWallet()` and `loadAccount()` in `agent/wallet.ts`.
- **Verification:** Calling `createWallet()` in an ephemeral or read-only directory succeeds without throwing.

---

### Category 6: Payment & x402 Micropayment Errors

#### Problem 6.1: HTTP 402 Challenge Parsing Failure
- **Symptoms:** `API request failed: 402 Payment Required`.
- **Root Cause:** Client did not sign the 402 payment challenge or wallet was uninitialized.
- **How to Diagnose:** Check network response headers in browser DevTools or inspect `payAndFetch` logs.
- **Solution:** Click **Create wallet** in the Setup panel. `payAndFetch` automatically catches HTTP 402, extracts price (`0.01 USDC`) and `payTo`, signs with Viem EIP-191, and resends request with `X-PAYMENT` base64 header.
- **Verification:** Query "What's the weather in Mumbai?" and observe signed payment in execution telemetry.

#### Problem 6.2: Concurrent Double-Payment Attempt
- **Symptoms:** `A payment is already currently processing for deal "deal-xxxxxxxx"`.
- **Root Cause:** Rapid consecutive clicks or multiple tool calls dispatched simultaneously for the same deal.
- **How to Diagnose:** Inspect `deal.paymentState` in stall status.
- **Solution:** `beginPayment()` locks the deal state to `processing`. Wait for initial payment completion or receipt return.
- **Verification:** Tested in `locks deal during beginPayment to prevent concurrent double-payments` in `bazaar.test.ts`.

---

### Category 7: Application & Deployment Errors

#### Problem 7.1: Port 3000 Collision
- **Symptoms:** `Error: listen EADDRINUSE: address already in use :::3000`.
- **Root Cause:** Another instance of Next.js or a different background process is holding port 3000.
- **How to Diagnose:** Run `netstat -ano | findstr 3000` (Windows) or `lsof -i :3000` (macOS/Linux).
- **Solution:** Start server on an alternative port:
  ```bash
  npm run dev --prefix my-agent -- -p 3001
  ```
- **Verification:** Open [http://localhost:3001](http://localhost:3001).

#### Problem 7.2: Vercel Deployment Incorrect Root Directory
- **Symptoms:** Vercel build fails with `No Next.js version could be detected in the root directory`.
- **Root Cause:** Next.js application core lives in `my-agent/`, not the root directory.
- **How to Diagnose:** Inspect Vercel Project Settings -> General -> Root Directory.
- **Solution:** Set Vercel Root Directory to **`my-agent`**.
- **Verification:** Vercel deployment logs show `▲ Next.js 16.4.0` compilation.

---

### Category 8: Security & Operational Rules

#### Problem 8.1: Accidental Git Commit of Private Key or Credentials
- **Symptoms:** Git detects modified `.env` or `.agent-wallet.json`.
- **Root Cause:** Missing or misconfigured `.gitignore` entries.
- **How to Diagnose:** Run `git status` to check untracked/staged files.
- **Solution:** Both root `.gitignore` and `my-agent/.gitignore` strictly ignore `.env`, `.env.*` (except `.env.example`), and `.agent-wallet.json`.
- **Prevention:** Never run `git add -A` or remove `.gitignore` exclusions.
- **Verification:** Run `git status` and verify secrets remain untracked.

---

## Architecture & Codebase Map

```text
agentmaxx/
├── package.json                   # Root scripts proxying dev/build/test to my-agent
├── DEPLOYMENT.md                  # Comprehensive Vercel & serverless deployment guide
├── README.md                      # Authoritative architecture, tools & troubleshooting guide
└── my-agent/                      # Next.js 16 Application Root
    ├── agent/
    │   ├── agent.ts               # Core Gemini multi-step reasoning loop & safety handler
    │   ├── bazaar.ts              # Authoritative stateful stall, floor hiding & confirmation gate
    │   ├── tools.ts               # 9 verified tool declarations and execution handlers
    │   └── wallet.ts              # Viem wallet management, EIP-191 signing & x402 verification
    ├── app/
    │   ├── api/
    │   │   ├── agent/route.ts     # POST/GET agent conversation & tool telemetry endpoint
    │   │   ├── bazaar/checkout/   # x402 paid checkout endpoint for agreed bazaar deals
    │   │   ├── wallet/route.ts    # Wallet initialization & Base Sepolia balance endpoint
    │   │   └── weather/route.ts   # Mock x402 paid weather endpoint
    │   ├── layout.tsx             # Root layout with fonts and metadata
    │   └── page.tsx               # Reactive command center UI
    ├── components/
    │   ├── chat/                  # Chat console, message bubbles & execution badges
    │   ├── command-palette.tsx    # Modal keyboard command center
    │   ├── header.tsx             # Live telemetry strip (Engine, Base Sepolia, Wallet)
    │   ├── hero.tsx               # Protocol status ribbon
    │   ├── setup-panel.tsx        # Guided prerequisite checklist & wallet creation
    │   ├── tools-panel.tsx        # Categorized tool capability registry
    │   └── ui/                    # Base UI / Tailwind CSS component primitives
    ├── public/
    │   └── risein-logo.svg        # Verified SVG branding asset
    ├── tests/
    │   └── bazaar.test.ts         # 48-test comprehensive verification test suite
    ├── .env.example               # Safe environment variable configuration template
    ├── next.config.ts             # Next.js configuration (Webpack, optimization)
    ├── package.json               # Dependencies and test/build scripts
    └── tsconfig.json              # TypeScript strict configuration
```

---

## License

MIT License. See [LICENSE](./my-agent/LICENSE).
