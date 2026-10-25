# Contributing to Marzban (Agentmaxx)

Welcome, traveler and open-source engineer! We are thrilled you want to contribute to **Marzban: The Agentic Bazaar Merchant**. This repository is actively participating in **Hacktoberfest 2026** as a premier open-source AI agent and Web3 framework.

Whether you are implementing new agent tools, hardening cryptographic settlement, optimizing UI responsiveness, or enhancing telemetry, this guide details our architecture, coding conventions, testing protocols, and GitOps standards.

---

## 🧭 Repository Identity & Architecture

- **Project Root:** Root workspace orchestrating the Next.js App Router project located in `my-agent/` and Solidity smart contracts in `contracts/`.
- **Primary Agent Engine:** `my-agent/agent/` (Gemini ReAct orchestration, tools, stateful bazaar engine, Viem wallet, telemetry).
- **Frontend App Router:** `my-agent/app/` (Bazaar night aesthetic with crimson `#7A1022`, aged parchment `#F4F1EA`, metallic brass `#C5A059`, and interactive cursor).
- **Web3 Protocol:** EIP-712 typed structured data payment authorizations and Base Sepolia (`chainId: 84532`) on-chain escrow contract (`contracts/BazaarEscrow.sol`).

---

## 🔒 Security & Cryptographic Invariants (Strict Policy)

**CRITICAL RULES FOR ALL CONTRIBUTORS:**

1. **NEVER COMMIT SECRETS OR PRIVATE KEYS:**
   - Never commit `.env`, `.agent-wallet.json`, private keys, seed phrases, or Gemini API keys.
   - All tests must use mock private keys or ephemeral test accounts.
   - Telemetry must strictly redact 64-hex private keys and authorization headers via `redactSensitiveData()`.

2. **PRESERVE CRYPTOGRAPHIC & SETTLEMENT INVARIANTS:**
   - EIP-712 domain: `chainId: 84532` (Base Sepolia), contract address: `0x2222222222222222222222222222222222222222`.
   - Never alter the `Payment` EIP-712 type schema without ensuring 1:1 cryptographic parity with `BazaarEscrow.sol`'s `PAYMENT_TYPEHASH`.
   - The conservative buyer confirmation gate in `agent/bazaar.ts` (`verifyBuyerConfirmation`) must NEVER be relaxed. Immediate same-turn model executions without explicit affirmative buyer consent are prohibited.

3. **STRICT FLOOR PRIVACY:**
   - Marzban's private cost and acceptance thresholds (`min(basePrice, ceil(cost * 1.15 * moodFactor))`) must NEVER leak to the client or public tools.
   - Counter-offers must remain strictly greater than the private floor.

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js:** `v20.x` or `v24.x` (tested on Node `v24.19.0`)
- **npm:** `v10.x` or higher
- **Git**

### Installation
```bash
# Clone the repository
git clone https://github.com/agentmaxx/agentmaxx.git
cd agentmaxx

# Install dependencies in root and my-agent
npm install
cd my-agent && npm install && cd ..
```

### Environment Configuration
Copy `.env.example` in `my-agent/`:
```bash
cp my-agent/.env.example my-agent/.env
```

Key environment variables:
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google AI Studio API key | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini LLM model | `gemini-flash-latest` |
| `BASE_SEPOLIA_RPC` | Base Sepolia RPC endpoint | `https://sepolia.base.org` |
| `NEXT_PUBLIC_SPLINE_SCENE_URL` | Optional Spline 3D scene URL | *(Optional)* |

---

## 🧪 Verification & Testing Protocol

Before submitting any Pull Request, ensure all quality gates pass:

```bash
# 1. Run full automated test suite (69 tests covering EIP-712, escrow, tools, replay protection, telemetry)
npm test

# 2. Run TypeScript static type checking
npm run type-check

# 3. Verify production compilation
npm run build
```

**Never weaken, skip, or delete existing tests to force a green result.**

---

## 🎃 Hacktoberfest 2026 Contribution Opportunities

We welcome high-quality contributions in the following areas:

1. **AI Agent Tool Adapters (`my-agent/agent/tools.ts`):**
   - Implement decentralized receipt storage adapter (e.g. IPFS / Arweave receipt notarization).
   - Add ERC-20 token payment settlement options alongside native ETH.
   - Integrate market sentiment or simulated weather oracle tools.

2. **Observability & Telemetry (`my-agent/agent/telemetry.ts`):**
   - Add OpenTelemetry OTLP exporter for decentralized agent telemetry.
   - Enhance ReAct iteration depth tracking and token consumption estimators.

3. **Frontend & Thematic 3D UX (`my-agent/components/`):**
   - Create additional interactive Spline 3D bazaar stalls or night caravan themes.
   - Add audio-tactile sound effects (antique coin clinks, parchment rustles) with user mute toggles.
   - Enhance keyboard navigation and screen-reader accessibility for complex bargaining feeds.

4. **Smart Contract & Protocol Enhancements (`contracts/`):**
   - Add multi-token escrow support in Solidity.
   - Gas optimization benchmarks for `BazaarEscrow.sol`.

---

## 🌿 Git Branch & Commit Conventions

Follow atomic, Conventional Commits:

- `feat(...)`: New features or tools
- `fix(...)`: Bug fixes or security remediations
- `test(...)`: Adding or updating test suites
- `docs(...)`: Documentation or issue template updates
- `refactor(...)`: Non-breaking internal structure improvements

Branch naming:
- `feature/<short-description>`
- `fix/<short-description>`
- `hacktoberfest/<issue-id>-<short-description>`

---

## 🤝 Code of Conduct & Questions

We strive to build a welcoming, inclusive, and technically rigorous community. Be respectful, constructive, and curious.

If you encounter issues or have questions, open a GitHub Issue or reach out via our community discussions!
