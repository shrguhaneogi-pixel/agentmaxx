```text
                    __  __          _____  ______ ____          _   _ 
                   |  \/  |   /\   |  __ \|___  /|  _ \   /\   | \ | |
                   | \  / |  /  \  | |__) |  / / | |_) | /  \  |  \| |
                   | |\/| | / /\ \ |  _  /  / /  |  _ < / /\ \ | . ` |
                   | |  | |/ ____ \| | \ \ / /__ | |_) / ____ \| |\  |
                   |_|  |_/_/    \_\_|  \_\_____/|____/_/    \_\_| \_|
                       THE AGENTIC BAZAAR MERCHANT & COMMAND CENTER
```

<div align="center">

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.0-149eca?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9.3-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Google Gen AI](https://img.shields.io/badge/@google/genai-2.24.0-4285F4?style=flat-square&logo=google)](https://www.npmjs.com/package/@google/genai)
[![Viem Web3](https://img.shields.io/badge/viem-2.56.9-2030D8?style=flat-square&logo=ethereum)](https://viem.sh/)
[![Network Base Sepolia](https://img.shields.io/badge/Network-Base_Sepolia-0052FF?style=flat-square&logo=coinbase)](https://sepolia.basescan.org/)
[![Automated Tests](https://img.shields.io/badge/Tests-50%2F50_Passing-10B981?style=flat-square&logo=checkmarx)](https://nodejs.org/api/test.html)
[![License MIT](https://img.shields.io/badge/License-MIT-D3F65A?style=flat-square&labelColor=10110F)](./my-agent/LICENSE)

> *"Welcome, traveler, to the Grand Bazaar of Nishapur! I am Marzban—purveyor of rare relics, keeper of confidential reserve floors, and humble servant of honest silver. Inquire of the celestial skies or haggle for the legendary Brass Astrolabe. But heed this counsel: insult my stall with a pittance, and you shall taste the bitter sting of an unforgiving counter-offer!"*

<br>

<video width="100%" max-width="840px" controls preload="metadata" poster="https://img.shields.io/badge/▶_PLAY_DEMO-Marzban_Agentic_Bazaar_Walkthrough-D3F65A?style=for-the-badge&logo=googleplay&logoColor=10110F&labelColor=171915">
  <source src="https://drive.google.com/uc?export=download&id=1Z3U4EBHxnbjpEluNluP2tZgWw0jQn_AF" type="video/webm">
  Your browser does not support the video tag.
</video>

<br>

<p align="center">
  <a href="https://drive.google.com/file/d/1Z3U4EBHxnbjpEluNluP2tZgWw0jQn_AF/preview" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/▶_LAUNCH_DEMO_VIDEO_PLAYER-marzban__demo01.webm-D3F65A?style=for-the-badge&logo=googleplay&logoColor=10110F&labelColor=171915" alt="Launch Demo Video Player">
  </a>
  <a href="https://drive.google.com/file/d/1Z3U4EBHxnbjpEluNluP2tZgWw0jQn_AF/view?usp=sharing" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/Google_Drive-Open_Standalone_Player-4285F4?style=for-the-badge&logo=googledrive&logoColor=white&labelColor=10110F" alt="Open Standalone Player">
  </a>
  <a href="https://drive.google.com/uc?export=download&id=1Z3U4EBHxnbjpEluNluP2tZgWw0jQn_AF" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/Stream_/_Download-WebM_HD-10B981?style=for-the-badge&logo=webrtc&logoColor=white&labelColor=10110F" alt="Direct Stream Download">
  </a>
</p>

> 🎬 **Interactive Video Walkthrough**: Click <kbd>▶ LAUNCH DEMO VIDEO PLAYER</kbd> above to stream the high-definition walkthrough (`marzban_demo01.webm`) in the dedicated player with full-screen playback, showcasing live voiceover negotiation, reserve floor defense, buyer confirmation gating, and autonomous x402 Base Sepolia settlement!

</div>

---

## 📑 Interactive Table of Contents

- [🏛️ Executive Overview](#️-executive-overview)
- [🎬 Interactive Video Demonstration](#-interactive-video-demonstration)
- [🎯 What Problem Marzban Solves](#-what-problem-marzban-solves)
- [⚡ Tech Stack & Verified Versions](#-tech-stack--verified-versions)
- [🛠️ Verified Tool Suite & Verification Matrix](#️-verified-tool-suite--verification-matrix)
- [📦 Collapsible Tool Specifications & Schemas](#-collapsible-tool-specifications--schemas)
- [🧠 Supported AI Models & Dynamic Switching](#-supported-ai-models--dynamic-switching)
- [🚀 Quick Start & Local Setup](#-quick-start--local-setup)
- [🧰 Interactive Troubleshooting Guide](#-interactive-troubleshooting-guide)
  - [Category 1: Installation & Build Errors](#category-1-installation--build-errors)
  - [Category 2: Environment & Credentials](#category-2-environment--credentials)
  - [Category 3: AI Model & Provider Errors](#category-3-ai-model--provider-errors)
  - [Category 4: Tool Invocation & Dispatch Errors](#category-4-tool-invocation--dispatch-errors)
  - [Category 5: Wallet & Filesystem Persistence Errors](#category-5-wallet--filesystem-persistence-errors)
  - [Category 6: Payment & x402 Micropayment Errors](#category-6-payment--x402-micropayment-errors)
  - [Category 7: Application & Deployment Errors](#category-7-application--deployment-errors)
  - [Category 8: Security & Operational Rules](#category-8-security--operational-rules)
- [🗺️ Architecture & Codebase Map](#️-architecture--codebase-map)
- [📜 DevRelay Agent Session Transcript](#-devrelay-agent-session-transcript)
- [📜 License](#-license)

---

## 🏛️ Executive Overview

**Marzban** is an autonomous, stateful AI bazaar merchant application built on **Next.js 16**, the **Google Gen AI SDK** (`@google/genai`), and **viem**. Operating within a theatrical Persian marketplace narrative, Marzban:
- **Negotiates item prices in silver** across a bounded, stateful multi-round engine.
- **Defends secret reserve floors** with non-linear mood mechanics (`cheerful`, `neutral`, `grumpy`).
- **Enforces a conservative Buyer Confirmation Authorization Gate** before initiating any financial transaction.
- **Executes programmatic machine-to-machine micropayments** via the **x402 protocol** with **EIP-191 signatures** on **Base Sepolia**.
- **Delivers a high-density Autonomous Command Center** interface equipped with live execution telemetry, keyboard command palette (<kbd>⌘K</kbd>), and an interactive SVG Brass Astrolabe visual anchor.

---

## 🎬 Interactive Video Demonstration

Watch the complete, unedited demonstration of Marzban's autonomous commerce loop, multi-round negotiation engine, and x402 settlement:

<div align="center">

<video width="100%" max-width="840px" controls preload="metadata" poster="https://img.shields.io/badge/▶_PLAY_DEMO-Marzban_Agentic_Bazaar_Walkthrough-D3F65A?style=for-the-badge&logo=googleplay&logoColor=10110F&labelColor=171915">
  <source src="https://drive.google.com/uc?export=download&id=1Z3U4EBHxnbjpEluNluP2tZgWw0jQn_AF" type="video/webm">
  Your browser does not support the video tag.
</video>

<br>

<p align="center">
  <a href="https://drive.google.com/file/d/1Z3U4EBHxnbjpEluNluP2tZgWw0jQn_AF/preview" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/▶_LAUNCH_DEMO_VIDEO_PLAYER-marzban__demo01.webm-D3F65A?style=for-the-badge&logo=googleplay&logoColor=10110F&labelColor=171915" alt="Launch Demo Video Player">
  </a>
  <a href="https://drive.google.com/file/d/1Z3U4EBHxnbjpEluNluP2tZgWw0jQn_AF/view?usp=sharing" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/Google_Drive-Open_Standalone_Player-4285F4?style=for-the-badge&logo=googledrive&logoColor=white&labelColor=10110F" alt="Open Standalone Player">
  </a>
  <a href="https://drive.google.com/uc?export=download&id=1Z3U4EBHxnbjpEluNluP2tZgWw0jQn_AF" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/Stream_/_Download-WebM_HD-10B981?style=for-the-badge&logo=webrtc&logoColor=white&labelColor=10110F" alt="Direct Stream Download">
  </a>
</p>

</div>

| Walkthrough Milestone | Observable Behavior | Architectural Proof |
| :--- | :--- | :--- |
| **1. Stall Initialization** | Catalog presentation with 6 wares | Zero leakage of wholesale costs or reserve floors |
| **2. Multi-Round Haggling** | Non-linear counter-offers & mood shifts | Concession spread enforces `threshold + safeMargin` |
| **3. Deal Reservation** | Deal locked at agreed price | Temporary reservation with idempotency lock |
| **4. Buyer Authorization Gate** | Model prevented from auto-purchasing | Requires explicit affirmative confirmation from user |
| **5. x402 Micropayment** | HTTP 402 challenge intercepted & settled | Viem signs EIP-191 payload; Base Sepolia verification |

---

## 🎯 What Problem Marzban Solves

Modern autonomous AI agents face severe reliability, safety, and transactional challenges when interacting with real users and decentralized financial systems:

1. **Unbounded Hallucination & Leaked State in Negotiations:** Typical LLM chatbots readily hallucinate inventory, invent prices, or fold instantly under conversational pressure, revealing sensitive internal costs or accepting absurd offers. Marzban solves this by enforcing an authoritative state machine in `agent/bazaar.ts` where items, base prices, rounds, and reserve floors are deterministic, strictly hidden, and governed by non-linear mood mechanics.
2. **Premature & Unauthorized Automated Purchases:** Autonomous agents with wallet access often execute payments prematurely upon model suggestion without explicit human consent. Marzban implements a conservative **Buyer Confirmation Authorization Gate** that requires explicit, affirmative buyer intent in the current conversation turn while blocking questions, hesitation phrases, price mismatches, and model-contrived same-turn shortcuts.
3. **Machine-to-Machine Autonomous Micropayments (x402):** API services need a standardized, permissionless payment mechanism that does not require human credit cards or API subscriptions. Marzban integrates the **x402 (HTTP 402 Payment Required)** protocol where the agent autonomously handles HTTP 402 challenges, constructs structured payment claims, signs them using viem with EIP-191 personal signatures, and completes settlement idempotently on Base Sepolia.

---

## ⚡ Tech Stack & Verified Versions

All dependencies and runtime versions are strictly verified against `package.json` and the resolved lockfile:

| Technology / Package | Verified Version | Purpose in Architecture |
| :--- | :--- | :--- |
| **[Next.js](https://nextjs.org/)** | `16.4.0` | App Router, Server Components, API route handlers, and Webpack build pipeline |
| **[React](https://react.dev/)** | `19.3.0` | Modern React 19 concurrent features and client UI components |
| **[@google/genai](https://www.npmjs.com/package/@google/genai)** | `2.24.0` | Google Gen AI SDK multi-step tool calling orchestration loop |
| **[viem](https://viem.sh/)** | `2.56.9` | EVM keypair generation, EIP-191 personal message signing, Base Sepolia RPC balance checks |
| **[Tailwind CSS](https://tailwindcss.com/)** | `4.3.3` | Tailwind v4 `@theme inline` CSS-first token system and responsive layout grid |
| **[@base-ui/react](https://base-ui.com/)** | `1.8.0` | Accessible unstyled primitives for collapsible accordions and command menus |
| **[lucide-react](https://lucide.dev/)** | `1.48.0` | Technical command center icons and telemetry status symbols |
| **[TypeScript](https://www.typescriptlang.org/)** | `5.9.3` | Strict type validation with `tsc --noEmit` across all agent modules |
| **[Node.js Test Runner](https://nodejs.org/api/test.html)** | `>= 20.0.0` | Native test suite via `node --import jiti/register --test` (50/50 passing) |

---

## 🛠️ Verified Tool Suite & Verification Matrix

Marzban exposes **9 fully verified, production-hardened tools** to the AI model dispatcher. Every tool matches the `@google/genai` JSON schema specification (`parametersJsonSchema`), provides defensive type casting, supports camelCase and snake_case parameter aliases, and handles missing or malformed inputs without crashing the agent loop.

| Tool Identifier | Domain | Action Type | Expected Parameters | Handler Path | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `list_wares` | Commerce | `READ-ONLY` | *None* | `tools.ts` ➔ `listWares()` | **Verified** (Sanitized) |
| `haggle_offer` | Commerce | `STATE-CHANGING` | `itemId` (str), `offer` (int) | `tools.ts` ➔ `haggle()` | **Verified** (42 Invariants) |
| `pay_invoice` | Commerce | `STATE-CHANGING` | `dealId` (str) | `tools.ts` ➔ `verifyBuyerConfirmation()` ➔ `payAndFetch()` | **Verified** (Gate Enforced) |
| `get_receipt` | Commerce | `READ-ONLY` | `receiptId` (str, opt), `dealId` (str, opt) | `tools.ts` ➔ `getReceipt()` | **Verified** (Idempotent) |
| `get_stall_status` | Commerce | `READ-ONLY` | *None* | `tools.ts` ➔ `getStallStatus()` | **Verified** (Sanitized) |
| `get_weather` | Utility | `STATE-CHANGING` | `city` (str) | `tools.ts` ➔ `payAndFetch(/api/weather)` | **Verified** (x402 Flow) |
| `get_my_wallet` | Wallet | `READ-ONLY` | *None* | `tools.ts` ➔ `getWalletBalance()` | **Verified** (Base Sepolia RPC) |
| `get_joke` | Utility | `READ-ONLY` | *None* | `tools.ts` ➔ Joke API / Offline Fallback | **Verified** (Timeout Resilient) |
| `get_country_info` | Utility | `READ-ONLY` | `country` (str) | `tools.ts` ➔ Curated DB + restcountries.com | **Verified** (Curated & Live) |

---

## 📦 Collapsible Tool Specifications & Schemas

Click on any tool below to inspect its exact `@google/genai` parameter declaration, security invariants, and sample directive.

<details>
<summary><b>1. <code>list_wares</code> — Inspect Bazaar Inventory (Read-Only)</b></summary>

<br>

- **Action Type:** `READ-ONLY`
- **Purpose:** Enumerates all items offered for sale in Marzban's stall.
- **Security Invariant:** Strictly filters out `privateCost`, `threshold`, and mood concession calculations.
- **Tool Declaration Schema:**
```json
{
  "name": "list_wares",
  "description": "List all wares available for sale in Marzban's bazaar stall, including asking prices, availability, and remaining negotiation rounds.",
  "parametersJsonSchema": {
    "type": "object",
    "properties": {}
  }
}
```
- **Sample Directive:** *"Show me what wares you have for sale in the bazaar."*

</details>

<details>
<summary><b>2. <code>haggle_offer</code> — Submit Bid in Silver (State-Changing)</b></summary>

<br>

- **Action Type:** `STATE-CHANGING`
- **Purpose:** Propose a price in silver for a specific bazaar ware.
- **Invariants & Negotiation Mechanics:**
  - Enforces positive integer offers (`offer > 0 && Number.isInteger(offer)`).
  - Maximum 4 negotiation rounds per item; rejects further bids unless meeting final asking price.
  - Insulting offers (`offer < 0.70 * privateCost`) degrade mood to `grumpy` and return `rejected_insulting`.
  - Accept threshold formula: `min(basePrice, ceil(privateCost * 1.15 * moodFactor))`.
  - Counter-price guarantee: Always strictly above private threshold (`counterPrice > threshold`).
- **Tool Declaration Schema:**
```json
{
  "name": "haggle_offer",
  "description": "Make a haggle offer on a bazaar ware. Silver prices only. Marzban may accept, counter-offer, or be insulted if offer is too low.",
  "parametersJsonSchema": {
    "type": "object",
    "properties": {
      "itemId": {
        "type": "string",
        "description": "Unique ID of the item (e.g. brass-astrolabe, saffron-tin, silk-scarf, haunted-lamp, spice-box, map-scroll)."
      },
      "offer": {
        "type": "integer",
        "description": "Silver amount offered (positive integer only)."
      }
    },
    "required": ["itemId", "offer"]
  }
}
```
- **Sample Directive:** *"I offer 75 silver for the Brass Astrolabe."*

</details>

<details>
<summary><b>3. <code>pay_invoice</code> — Execute x402 Settlement (State-Changing)</b></summary>

<br>

- **Action Type:** `STATE-CHANGING`
- **Purpose:** Triggers machine-to-machine checkout for an agreed bazaar deal.
- **Critical Security Gate:**
  - Evaluates `verifyBuyerConfirmation(dealId, ctx)`.
  - Blocks payment if user expressed hesitation ("wait", "cancel"), asked a question ("can I pay?"), named a different item, or if the deal was created in the current turn.
- **Concurrency Guard:** Locks deal in `processing` state during `beginPayment()`. On network failure, triggers `failPayment()` to preserve reservation for user retry.
- **Tool Declaration Schema:**
```json
{
  "name": "pay_invoice",
  "description": "Pay for an agreed bazaar deal using the agent's wallet via machine-to-machine x402 payment.",
  "parametersJsonSchema": {
    "type": "object",
    "properties": {
      "dealId": {
        "type": "string",
        "description": "The active deal ID from an accepted haggle (e.g. deal-xxxxxxxx)."
      }
    },
    "required": ["dealId"]
  }
}
```
- **Sample Directive:** *"Yes, I confirm purchase of deal deal-12345678. Proceed with payment."*

</details>

<details>
<summary><b>4. <code>get_receipt</code> — Retrieve Purchase Proof (Read-Only)</b></summary>

<br>

- **Action Type:** `READ-ONLY`
- **Purpose:** Fetches immutable receipt proof for a completed deal.
- **Behavior:** Returns SHA-256 derived Base Sepolia transaction hash (`txHash`), silver price, timestamp, and payer address. Defaults to most recent receipt if unspecified.
- **Tool Declaration Schema:**
```json
{
  "name": "get_receipt",
  "description": "Get a receipt for a completed purchase by receipt ID, deal ID, or item ID.",
  "parametersJsonSchema": {
    "type": "object",
    "properties": {
      "receiptId": { "type": "string", "description": "Receipt ID (e.g. rcpt-xxxxxxxx)" },
      "dealId": { "type": "string", "description": "Associated deal ID" },
      "itemId": { "type": "string", "description": "Associated item ID" }
    }
  }
}
```
- **Sample Directive:** *"Show me the receipt for my last bazaar purchase."*

</details>

<details>
<summary><b>5. <code>get_stall_status</code> — Check Stall Disposition & Metrics (Read-Only)</b></summary>

<br>

- **Action Type:** `READ-ONLY`
- **Purpose:** Inspects merchant mood and operational metrics without leaking margins.
- **Behavior:** Returns sanitized status: `mood` (`cheerful` / `neutral` / `grumpy`), public inventory wares, active pending deals, and completed receipts count.
- **Tool Declaration Schema:**
```json
{
  "name": "get_stall_status",
  "description": "Check the current status of Marzban's bazaar stall: merchant mood, inventory count, pending deals, and sales stats.",
  "parametersJsonSchema": {
    "type": "object",
    "properties": {}
  }
}
```
- **Sample Directive:** *"What is the current mood and status of Marzban's bazaar stall?"*

</details>

<details>
<summary><b>6. <code>get_weather</code> — Query Paid Weather API via x402 (State-Changing)</b></summary>

<br>

- **Action Type:** `STATE-CHANGING`
- **Purpose:** Demonstrates live x402 micropayments on external HTTP endpoints.
- **Execution Path:** Issues GET to `/api/weather`. Catches HTTP 402 challenge (`price: 0.01 USDC`). Wallet signs EIP-191 claim. Retries with `X-PAYMENT` header to unlock live temperature and weather report.
- **Tool Declaration Schema:**
```json
{
  "name": "get_weather",
  "description": "Check current weather for any city. Demonstrates agent-to-agent x402 micropayments.",
  "parametersJsonSchema": {
    "type": "object",
    "properties": {
      "city": { "type": "string", "description": "City name (e.g. Mumbai, Tokyo, London)" }
    },
    "required": ["city"]
  }
}
```
- **Sample Directive:** *"What's the weather in Mumbai?"*

</details>

<details>
<summary><b>7. <code>get_my_wallet</code> — Inspect Base Sepolia Keypair (Read-Only)</b></summary>

<br>

- **Action Type:** `READ-ONLY`
- **Purpose:** Returns the agent's EVM public address and live Base Sepolia testnet balance.
- **Storage Resilience:** Reads address from `.env` (`WALLET_PRIVATE_KEY`), in-memory state, local `.agent-wallet.json`, or ephemeral `/tmp` storage.
- **Tool Declaration Schema:**
```json
{
  "name": "get_my_wallet",
  "description": "Get the agent's wallet address and Base Sepolia testnet balance.",
  "parametersJsonSchema": {
    "type": "object",
    "properties": {}
  }
}
```
- **Sample Directive:** *"What's in your wallet?"*

</details>

<details>
<summary><b>8. <code>get_joke</code> — Programming Humor with Offline Fallback (Read-Only)</b></summary>

<br>

- **Action Type:** `READ-ONLY`
- **Purpose:** Fetches programming humor from external API with 4-second timeout and offline curated fallback protection.
- **Tool Declaration Schema:**
```json
{
  "name": "get_joke",
  "description": "Get a random programming joke.",
  "parametersJsonSchema": {
    "type": "object",
    "properties": {}
  }
}
```
- **Sample Directive:** *"Tell me a programming joke."*

</details>

<details>
<summary><b>9. <code>get_country_info</code> — Country Intelligence Database (Read-Only)</b></summary>

<br>

- **Action Type:** `READ-ONLY`
- **Purpose:** Returns capital, population, region, and local cuisine.
- **Execution Path:** Evaluates against curated fast-path offline database of 24+ countries (India, France, Japan, USA, UAE, etc.), falling back to `restcountries.com` with a 4s timeout.
- **Tool Declaration Schema:**
```json
{
  "name": "get_country_info",
  "description": "Get quick information about a country including capital, population, region, and local dish.",
  "parametersJsonSchema": {
    "type": "object",
    "properties": {
      "country": { "type": "string", "description": "Country name (e.g. Japan, France, India)" }
    },
    "required": ["country"]
  }
}
```
- **Sample Directive:** *"Tell me about Japan."*

</details>

---

## 🧠 Supported AI Models & Dynamic Switching

Marzban is powered by the **Google Gen AI SDK** (`@google/genai` `v2.24.0`). The agent orchestration loop in `my-agent/agent/agent.ts` uses function calling declarations compatible with all modern Gemini models.

### Model Compatibility Matrix

| Model Identifier | Release Type | Default Status | Tool-Calling Support | Optimal Use Case |
| :--- | :--- | :--- | :--- | :--- |
| `gemini-flash-latest` | Dynamic Alias | **Default** | Full (`parametersJsonSchema`) | Ultra-fast reasoning & minimal latency |
| `gemini-2.5-flash` | Production Release | Supported | Full | Superior multi-tool precision & haggling logic |
| `gemini-2.0-flash` | Production Release | Supported | Full | High-speed multi-turn instruction following |
| `gemini-1.5-flash` | Dated Release | Supported | Full | Cost-efficient high-throughput queries |
| `gemini-1.5-pro` | Production Release | Supported | Full | Deep conversational negotiation & nuance |
| `gemini-2.5-pro` | Production Release | Supported | Full | Flagship model for complex structured orchestration |

### Dynamic Model Switching Guide

You can switch the active reasoning model without changing a single line of application code:

1. **Via `.env` Configuration:**
```env
# In my-agent/.env:
GEMINI_MODEL=gemini-2.5-flash
```

2. **Via Dynamic CLI Runtime Flag:**
```bash
# Windows PowerShell
$env:GEMINI_MODEL="gemini-2.0-flash"; npm run dev --prefix my-agent

# Linux / macOS
GEMINI_MODEL=gemini-2.0-flash npm run dev --prefix my-agent
```

> [!NOTE]
> The Command Center header dynamically reports the active model in the telemetry strip (e.g. `ENGINE: gemini-2.5-flash`) with a live pulsing connectivity indicator.

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js:** `v20.0.0` or higher (`node -v` to verify; verified on `v24.19.0`).
- **Gemini API Key:** Obtain a free key from [Google AI Studio](https://aistudio.google.com/apikey).

### 2. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-org/agentmaxx.git
cd agentmaxx/my-agent

# Install dependencies
npm install
```

### 3. Configure Environment Variables
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
# If left blank, simply click <Create wallet> in the web UI.
WALLET_PRIVATE_KEY=
```

> [!WARNING]
> Never commit `.env` or `.agent-wallet.json` to version control. Both root `.gitignore` and `my-agent/.gitignore` explicitly exclude these secret files.

### 4. Run Development Server
```bash
# From my-agent/ directory:
npm run dev

# Or from repository root:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Click <kbd>Create wallet</kbd> in the Setup panel on the left to initialize your agent's cryptographic keypair on Base Sepolia.

### 5. Keyboard Navigation & Shortcuts
- <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd>: Open the global Command Palette.
- <kbd>↑</kbd> / <kbd>↓</kbd>: Navigate commands and quick directives.
- <kbd>Enter ↵</kbd>: Execute directive or select command.
- <kbd>ESC</kbd>: Close modal or clear directive input.

### 6. Verify Automated Test Suite
```bash
# Run the complete 50-test verification suite
npm test --prefix my-agent

# Run strict TypeScript type check
npm run type-check --prefix my-agent

# Run production build
npm run build --prefix my-agent
```

---

## 🧰 Interactive Troubleshooting Guide

Click on any category below to reveal exact symptoms, codebase root causes, diagnostic commands, and concrete solutions.

### Category 1: Installation & Build Errors

<details>
<summary><b>Problem 1.1: Node.js Version Incompatibility (&lt; v20.0.0)</b></summary>

<br>

- **Symptoms:** `SyntaxError: Unexpected token '?'` or `Error: Node.js version unsupported`.
- **Root Cause:** Next.js 16 and modern ECMAScript modules require Node.js `>= 20.0.0`.
- **How to Diagnose:** Run `node -v` in your terminal.
- **Solution:** Install Node.js LTS (v20 or v22) using [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm):
  ```bash
  nvm install 22
  nvm use 22
  ```
- **Verification:** Run `node -v` and confirm output starts with `v20.` or `v22.`.

</details>

<details>
<summary><b>Problem 1.2: Turbopack Build Conflicts on Windows</b></summary>

<br>

- **Symptoms:** `next build` hangs or fails with Turbopack PostCSS worker errors on Windows.
- **Root Cause:** Next.js 16 defaults to Turbopack in some CLI flows where Windows symlinks and child processes conflict.
- **How to Diagnose:** Inspect `package.json` build scripts.
- **Solution:** Use the configured production build script: `next build --webpack`.
- **Verification:** Run `npm run build --prefix my-agent` and observe `✓ Compiled successfully`.

</details>

<details>
<summary><b>Problem 1.3: Windows OneDrive / Background Process File Locking (<code>EPERM</code>)</b></summary>

<br>

- **Symptoms:** `Error: EPERM: operation not permitted, mkdir ...\.next\server\app\...` during build or static page generation.
- **Root Cause:** Cloud synchronization clients (e.g. Microsoft OneDrive, Dropbox) or active antivirus scanners lock transient chunk files in `.next`.
- **How to Diagnose:** Check if the repository resides within a OneDrive/cloud-synced folder path.
- **Solution:** Pause cloud sync during builds or purge the stale cache:
  ```powershell
  # PowerShell cache purge:
  Remove-Item -Recurse -Force my-agent\.next -ErrorAction SilentlyContinue
  npm run build --prefix my-agent
  ```
- **Verification:** Build proceeds through compilation and static page generation cleanly.

</details>

---

### Category 2: Environment & Credentials

<details>
<summary><b>Problem 2.1: Missing or Empty <code>GEMINI_API_KEY</code></b></summary>

<br>

- **Symptoms:** Chat API returns HTTP 500 with `GEMINI_API_KEY is not configured. Set GEMINI_API_KEY in your environment variables or .env file.`
- **Root Cause:** The server runtime cannot locate `process.env.GEMINI_API_KEY`.
- **How to Diagnose:** Verify that `my-agent/.env` exists and contains a non-empty `GEMINI_API_KEY` string.
- **Solution:** Add your key to `my-agent/.env` and restart the server:
  ```env
  GEMINI_API_KEY=AIzaSy...
  ```
- **Verification:** Refresh [http://localhost:3000](http://localhost:3000) and verify that the Header displays `ENGINE: ...` with a pulsing green indicator.

</details>

<details>
<summary><b>Problem 2.2: Ethereum Address Accidental Paste in <code>WALLET_PRIVATE_KEY</code></b></summary>

<br>

- **Symptoms:** Wallet falls back to generated key or balance returns unexpected address.
- **Root Cause:** Pasting a 42-character public address (`0x...`) instead of a 66-character (32-byte) hex private key. `wallet.ts` validates private keys with `/^0x[0-9a-fA-F]{64}$/`.
- **How to Diagnose:** Inspect `WALLET_PRIVATE_KEY` in `my-agent/.env`. Count characters (an address is 42 chars; a private key is 66 chars including `0x`).
- **Solution:** Provide a 32-byte private key or leave `WALLET_PRIVATE_KEY` blank and click <kbd>Create wallet</kbd> in the UI.
- **Verification:** Run `npm test --prefix my-agent` to verify `parsePrivateKey` accepts valid hex keys.

</details>

---

### Category 3: AI Model & Provider Errors

<details>
<summary><b>Problem 3.1: Model Quota or Rate-Limit Exhaustion (HTTP 429 / 503)</b></summary>

<br>

- **Symptoms:** Chat returns `503 Service Unavailable` or `429 Too Many Requests`.
- **Root Cause:** Free-tier Gemini quota limits reached on Google AI Studio.
- **How to Diagnose:** Inspect terminal logs for `RESOURCE_EXHAUSTED` or `UNAVAILABLE`.
- **Solution:** `agent/agent.ts` automatically retries 503 and 429 errors once after a 1500ms backoff. If persistent, switch to an alternative model:
  ```env
  GEMINI_MODEL=gemini-2.0-flash
  ```
- **Verification:** Resend query after backoff window.

</details>

<details>
<summary><b>Problem 3.2: Safety Filter Blocking</b></summary>

<br>

- **Symptoms:** Chat returns `The response was blocked by model safety filters (reason: SAFETY)`.
- **Root Cause:** Google safety classifiers flagged prompt content or output candidates.
- **How to Diagnose:** `agent/agent.ts` captures `promptFeedback.blockReason` and candidate `finishReason` (`SAFETY`, `BLOCKLIST`, `SPII`).
- **Solution:** Rephrase the query to avoid sensitive trigger words. The agent loop handles this gracefully without throwing uncaught exceptions.
- **Verification:** Prompt the agent with ordinary bazaar commerce queries (e.g. "Browse wares").

</details>

---

### Category 4: Tool Invocation & Dispatch Errors

<details>
<summary><b>Problem 4.1: Missing Required Parameter on Tool Dispatch</b></summary>

<br>

- **Symptoms:** Tool execution step returns `{ error: "Missing required parameter: itemId" }` or `{ error: "Missing required parameter: dealId" }`.
- **Root Cause:** The AI model invoked a tool without supplying required parameters.
- **How to Diagnose:** Inspect the tool call arguments in the chat UI inspector badge.
- **Solution:** `agent/tools.ts` normalizes both camelCase and snake_case parameters (`itemId` and `item_id`, `dealId` and `deal_id`). Ensure prompt clearly identifies the target item.
- **Verification:** Run `npm test --prefix my-agent` — aliases are tested in `supports snake_case and camelCase aliases`.

</details>

<details>
<summary><b>Problem 4.2: Payment Authorization Denied by Buyer Confirmation Gate</b></summary>

<br>

- **Symptoms:** Agent replies: `Payment authorization denied: Buyer indicated hesitation... Ask the buyer for explicit confirmation before proceeding to checkout.`
- **Root Cause:** Buyer asked a question (e.g. "Can I pay?"), expressed hesitation ("wait, cancel"), named another item, or attempted same-turn checkout.
- **How to Diagnose:** Inspect `lastUserMessage` in the turn context.
- **Solution:** Provide explicit, unambiguous affirmative confirmation in your chat message:
  > *"Yes, proceed to checkout"* or *"Confirm purchase of the agreed deal."*
- **Verification:** Verified across 13 dedicated gate tests in `bazaar.test.ts`.

</details>

<details>
<summary><b>Problem 4.3: Model-Generated Null or Undefined Tool Arguments Payload</b></summary>

<br>

- **Symptoms:** `TypeError: Cannot read properties of null (reading 'itemId')` or unhandled exceptions when model omits tool argument object.
- **Root Cause:** Model or custom caller invoked tool handlers with `null` or omitted arguments payload.
- **How to Diagnose:** Inspect tool execution telemetry step or check server crash logs.
- **Solution:** Tool handlers in `agent/tools.ts` guard inputs defensively with `safeArgs = (args && typeof args === "object" ? args : {})`.
- **Code-level Fix:** Implemented across `haggle_offer`, `pay_invoice`, `get_receipt`, `get_weather`, and `get_country_info` in `agent/tools.ts`.
- **Verification:** Verified in automated test `handles null and undefined tool argument payloads gracefully across all tools without crashing` in `bazaar.test.ts`.

</details>

---

### Category 5: Wallet & Filesystem Persistence Errors

<details>
<summary><b>Problem 5.1: Read-Only Filesystem in Serverless (<code>EROFS</code>)</b></summary>

<br>

- **Symptoms:** Server logs show `Error: EROFS: read-only file system, open '.agent-wallet.json'`.
- **Root Cause:** Serverless cloud environments (such as Vercel AWS Lambda runtimes) have read-only root directories.
- **How to Diagnose:** Observe filesystem write errors during `/api/wallet` POST requests.
- **Solution:** `agent/wallet.ts` stores wallets with a multi-tier fallback:
  1. `inMemoryPrivateKey` (always writable in-process memory).
  2. `os.tmpdir()` (`/tmp/.agent-wallet.json` writable in serverless).
  3. Local `.agent-wallet.json` wrapped in a non-fatal `try/catch`.
- **Code-level Fix:** Implemented in `createWallet()` and `loadAccount()` in `agent/wallet.ts`.
- **Verification:** Calling `createWallet()` in an ephemeral or read-only directory succeeds without throwing.

</details>

---

### Category 6: Payment & x402 Micropayment Errors

<details>
<summary><b>Problem 6.1: HTTP 402 Challenge Parsing Failure</b></summary>

<br>

- **Symptoms:** `API request failed: 402 Payment Required`.
- **Root Cause:** Client did not sign the 402 payment challenge or wallet was uninitialized.
- **How to Diagnose:** Check network response headers in browser DevTools or inspect `payAndFetch` logs.
- **Solution:** Click <kbd>Create wallet</kbd> in the Setup panel. `payAndFetch` automatically catches HTTP 402, extracts price (`0.01 USDC`) and `payTo`, signs with Viem EIP-191, and resends request with `X-PAYMENT` base64 header.
- **Verification:** Query "What's the weather in Mumbai?" and observe signed payment in execution telemetry.

</details>

<details>
<summary><b>Problem 6.2: Concurrent Double-Payment Attempt</b></summary>

<br>

- **Symptoms:** `A payment is already currently processing for deal "deal-xxxxxxxx"`.
- **Root Cause:** Rapid consecutive clicks or multiple tool calls dispatched simultaneously for the same deal.
- **How to Diagnose:** Inspect `deal.paymentState` in stall status.
- **Solution:** `beginPayment()` locks the deal state to `processing`. Wait for initial payment completion or receipt return.
- **Verification:** Tested in `locks deal during beginPayment to prevent concurrent double-payments` in `bazaar.test.ts`.

</details>

<details>
<summary><b>Problem 6.3: Relative URL Resolution &amp; Trailing Slash Pathing (<code>TypeError: Failed to parse URL</code>)</b></summary>

<br>

- **Symptoms:** Server-side tool execution throws `TypeError: Failed to parse URL from /api/...` or creates double-slash resource paths (e.g. `//api/bazaar/checkout`).
- **Root Cause:** Unlike browser `window.fetch`, Node.js global `fetch` strictly requires absolute URLs with a valid protocol. Additionally, unstripped trailing slashes on `baseUrl` produced malformed double slashes.
- **How to Diagnose:** Inspect server logs for `Failed to parse URL` when executing `pay_invoice` or `get_weather`.
- **Solution:** `payAndFetch` in `agent/wallet.ts` normalizes target URLs with `new URL(url, defaultBase)` (`http://localhost:3000`) before invoking `fetch(resolvedUrl)`, and sanitizes duplicate leading slashes in `resource`. Tool callers strip trailing slashes (`cleanBase = rawBase.replace(/\/+$/, "")`).
- **Code-level Fix:** Implemented in `payAndFetch` (`agent/wallet.ts`) and `pay_invoice` / `get_weather` (`agent/tools.ts`).
- **Verification:** Verified in automated test `strips trailing slashes from baseUrl and handles get_weather connection failures safely` in `bazaar.test.ts`.

</details>

---

### Category 7: Application & Deployment Errors

<details>
<summary><b>Problem 7.1: Port 3000 Collision</b></summary>

<br>

- **Symptoms:** `Error: listen EADDRINUSE: address already in use :::3000`.
- **Root Cause:** Another instance of Next.js or a different background process is holding port 3000.
- **How to Diagnose:** Run `netstat -ano | findstr 3000` (Windows) or `lsof -i :3000` (macOS/Linux).
- **Solution:** Start server on an alternative port:
  ```bash
  npm run dev --prefix my-agent -- -p 3001
  ```
- **Verification:** Open [http://localhost:3001](http://localhost:3001).

</details>

<details>
<summary><b>Problem 7.2: Vercel Deployment Incorrect Root Directory</b></summary>

<br>

- **Symptoms:** Vercel build fails with `No Next.js version could be detected in the root directory`.
- **Root Cause:** Next.js application core lives in `my-agent/`, not the root directory.
- **How to Diagnose:** Inspect Vercel Project Settings ➔ General ➔ Root Directory.
- **Solution:** Set Vercel Root Directory to **`my-agent`**.
- **Verification:** Vercel deployment logs show `▲ Next.js 16.4.0` compilation.

</details>

---

### Category 8: Security & Operational Rules

<details>
<summary><b>Problem 8.1: Accidental Git Commit of Private Key or Credentials</b></summary>

<br>

- **Symptoms:** Git detects modified `.env` or `.agent-wallet.json`.
- **Root Cause:** Missing or misconfigured `.gitignore` entries.
- **How to Diagnose:** Run `git status` to check untracked/staged files.
- **Solution:** Both root `.gitignore` and `my-agent/.gitignore` strictly ignore `.env`, `.env.*` (except `.env.example`), and `.agent-wallet.json`.
- **Prevention:** Never run `git add -A` or remove `.gitignore` exclusions.
- **Verification:** Run `git status` and verify secrets remain untracked.

</details>

---

## 🗺️ Architecture & Codebase Map

```text
agentmaxx/
├── package.json                   # Root scripts proxying dev/build/test to my-agent
├── DEPLOYMENT.md                  # Comprehensive Vercel & serverless deployment guide
├── README.md                      # Theatrical interactive architecture, tools & troubleshooting portal
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
    │   ├── command-palette.tsx    # Modal keyboard command center (⌘K / Ctrl+K)
    │   ├── header.tsx             # Live telemetry strip (Engine, Base Sepolia, Wallet)
    │   ├── hero.tsx               # Protocol status ribbon
    │   ├── setup-panel.tsx        # Guided prerequisite checklist & wallet creation
    │   ├── tools-panel.tsx        # Categorized tool capability registry
    │   └── ui/                    # Base UI / Tailwind CSS component primitives
    ├── public/
    │   └── risein-logo.svg        # Verified SVG branding asset
    ├── tests/
    │   └── bazaar.test.ts         # 50-test comprehensive verification test suite
    ├── .env.example               # Safe environment variable configuration template
    ├── next.config.ts             # Next.js configuration (Webpack, optimization)
    ├── package.json               # Dependencies and test/build scripts
    └── tsconfig.json              # TypeScript strict configuration
```

---

## 📜 DevRelay Agent Session Transcript

The architectural integrity, cryptographic boundaries, and stateful negotiation mechanics of this codebase were evaluated and verified in the **AntiGravity Codebase Technical Evaluation** session. The complete interactive transcript is indexed and embeddable via **DevRelay**:

<details open>
<summary><b>Session Record: AntiGravity Codebase Technical Evaluation (ID: <code>edbaa0f3-b8a5-4b8d-8d96-361e8fb086fe</code>)</b></summary>

<br>

### 🌐 DEV / Forem Native Liquid Embed
When publishing technical documentation or engineering retrospectives on [DEV (dev.to)](https://dev.to), embed the complete interactive agent session using DEV's native Liquid tag:

```liquid
{% agent_session edbaa0f3-b8a5-4b8d-8d96-361e8fb086fe %}
```

Or embed a specific contiguous range of messages (0-indexed slice):

```liquid
{% agent_session edbaa0f3-b8a5-4b8d-8d96-361e8fb086fe 0..5 %}
```

---

### 💻 Antigravity IDE Interactive Replay
In the Google Antigravity IDE environment, launch the live interactive transcript, prompt sequence, tool execution trace, and validation artifacts:

- 🚀 **[Open Interactive Session in Antigravity](conversation://edbaa0f3-b8a5-4b8d-8d96-361e8fb086fe)**
- 📄 **Transcript Source**: `file:///C:/Users/Dell/.gemini/antigravity/brain/edbaa0f3-b8a5-4b8d-8d96-361e8fb086fe/.system_generated/logs/transcript.jsonl`
- 📑 **Evaluation Walkthrough**: [walkthrough.md](file:///C:/Users/Dell/.gemini/antigravity/brain/edbaa0f3-b8a5-4b8d-8d96-361e8fb086fe/walkthrough.md)

---

### 📊 Evaluated Invariants & Architectural Findings

| Architectural Domain | Evaluated Invariant | Verification Result |
| :--- | :--- | :--- |
| **Monorepo Layout** | Root scripts delegating to `my-agent/` (Next.js 16 App Router) | **Verified** — Turbo/Webpack build pipelines operate cleanly from both root and workspace |
| **Bazaar State Machine** | 6 deterministic wares, non-linear mood formula, 4-round limit | **Verified** — Base prices and reserve floors dynamically calculated; floor never disclosed |
| **Floor-Hiding Guarantee** | Counter-offers strictly enforce `Math.max(2, Math.floor((base - threshold) * 0.1))` | **Verified** — Zero leakage of wholesale costs or private margins in any negotiation state |
| **Buyer Authorization Gate** | Multi-tier context analysis blocking unauthorized automatic checkout | **Verified** — Agent cannot trigger `pay_invoice` without affirmative user confirmation |
| **x402 Micropayments** | HTTP 402 challenge, EIP-191 Viem signing, Base Sepolia settlement | **Verified** — Machine-to-machine payment protocol verified with idempotent deal completion |
| **Automated Test Coverage** | 50 comprehensive unit and integration tests | **50/50 Passing** — 100% test pass rate with zero flaky assertions |

---

### 🛠️ DevRelay CLI Commands
Query or export this session directly from your local terminal:

```bash
# Retrieve full session details via DevRelay CLI
devrelay sessions get edbaa0f3-b8a5-4b8d-8d96-361e8fb086fe

# List all saved agent sessions
devrelay sessions list
```

</details>

---

## 📜 License

Distributed under the **MIT License**. See [LICENSE](./my-agent/LICENSE) for terms.

