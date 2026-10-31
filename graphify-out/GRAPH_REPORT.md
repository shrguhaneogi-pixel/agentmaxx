# Graph Report - agentmaxx  (2026-10-31)

## Corpus Check
- 66 files · ~41,968 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .example 1, .css 1)

## Summary
- 575 nodes · 972 edges · 28 communities (23 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2217e897`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- utils.ts
- agent/route.ts
- agentmaxxin
- Marzban: The Agentic Bazaar Merchant
- bazaar.ts
- components.json
- e2e-browser-automation.mjs
- my-agent/package.json
- wallet.ts
- compilerOptions
- attributes
- attributes
- attributes
- BazaarEscrow
- package.json
- nonce.ts
- wallet/route.ts
- Deployment & Production Readiness Guide
- bazaar.test.ts
- tools.ts
- checkout/route.ts
- next
- deploy-escrow.js
- vercel.json
- AGENTS.md
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `Home()` - 22 edges
2. `react` - 18 edges
3. `compilerOptions` - 16 edges
4. `Marzban: The Agentic Bazaar Merchant` - 16 edges
5. `Button()` - 15 edges
6. `lucide-react` - 13 edges
7. `agentmaxxin` - 12 edges
8. `BazaarEscrow` - 10 edges
9. `next` - 10 edges
10. `verifyPayment()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `🔒 Security & Cryptographic Invariants (Strict Policy)` --references--> `redactSensitiveData()`  [INFERRED]
  CONTRIBUTING.md → my-agent/agent/telemetry.ts
- `🔒 Security & Invariant Checklist` --references--> `redactSensitiveData()`  [INFERRED]
  .github/pull_request_template.md → my-agent/agent/telemetry.ts
- `📊 Observability & Telemetry Architecture` --references--> `redactSensitiveData()`  [INFERRED]
  README.md → my-agent/agent/telemetry.ts
- `Status: **YES, Ready for Deployment** (with fixes applied)` --references--> `parsePrivateKey()`  [INFERRED]
  DEPLOYMENT.md → my-agent/agent/wallet.ts
- `🔒 Security & Cryptographic Invariants (Strict Policy)` --references--> `verifyBuyerConfirmation()`  [INFERRED]
  CONTRIBUTING.md → my-agent/agent/bazaar.ts

## Import Cycles
- None detected.

## Communities (28 total, 5 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.06
Nodes (55): Home(), Message, Status, BazaarInventory(), BazaarInventoryProps, PublicWare, WARE_ICONS, BazaarSplineEnvironment() (+47 more)

### Community 1 - "utils.ts"
Cohesion: 0.14
Nodes (20): AstrolabeCanvas(), AstrolabeCanvasProps, AstrolabeFallback(), AstrolabeHUD(), AstrolabeHUDProps, AstrolabeScene(), AstrolabeSceneProps, BazaarAstrolabe3D() (+12 more)

### Community 2 - "agent/route.ts"
Cohesion: 0.06
Nodes (28): 📌 Pull Request Description, Related Issue(s), 📸 Screenshots / Visual Verification (If UI change), 🔒 Security & Invariant Checklist, Summary of Changes, 🧪 Verification Record, AgentContext, AgentRunResult (+20 more)

### Community 3 - "agentmaxxin"
Cohesion: 0.06
Nodes (33): 🎃 Agentmaxxing 2026 Contribution Opportunities, 🤝 Code of Conduct & Questions, Contributing to Marzban (Agentmaxx), Environment Configuration, 🌿 Git Branch & Commit Conventions, Installation, 🚀 Local Development Setup, Prerequisites (+25 more)

### Community 4 - "Marzban: The Agentic Bazaar Merchant"
Cohesion: 0.06
Nodes (32): 1. Clone & Install Dependencies, 1. Cryptographic & EVM Settlement Errors, 2. Configure Environment Variables, 2. Distributed Replay Protection Blocks, 3. Compile & Deploy Escrow Smart Contract, 3. Wallet Filesystem & Serverless EROFS Errors, 4. Agent & LLM Provider Operational Errors, 4. Run Local Development Server (+24 more)

### Community 5 - "bazaar.ts"
Cohesion: 0.10
Nodes (22): BazaarStall, BuyerConfirmationResult, createInitialStall(), Deal, getAllReceipts(), getRandomMood(), getStallStatus(), globalForBazaar (+14 more)

### Community 6 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 7 - "e2e-browser-automation.mjs"
Cohesion: 0.15
Nodes (10): proc, profileDir, CDPClient, getChromePageWsUrl(), main(), submitChatMessage(), waitForAgentTurn(), PUBLIC_DIR (+2 more)

### Community 8 - "my-agent/package.json"
Cohesion: 0.05
Nodes (48): metadata, RootLayout(), BazaarCursor(), dependencies, @base-ui/react@^1.8.0, class-variance-authority@^0.7.1, cn@^0.4.0, @google/genai@^2.24.0 (+40 more)

### Community 9 - "wallet.ts"
Cohesion: 0.18
Nodes (19): buildPaymentMessage(), DEFAULT_VERIFYING_CONTRACT, EIP712_DOMAIN_NAME, EIP712_DOMAIN_VERSION, EIP712_PAYMENT_TYPES, EIP712PaymentMessage, getEIP712Domain(), getVerifyingContract() (+11 more)

### Community 10 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 11 - "attributes"
Cohesion: 0.12
Nodes (16): description, label, options, placeholder, render, value, body, attributes (+8 more)

### Community 12 - "attributes"
Cohesion: 0.12
Nodes (16): description, label, options, placeholder, render, value, body, attributes (+8 more)

### Community 13 - "attributes"
Cohesion: 0.12
Nodes (16): description, label, options, placeholder, value, body, attributes, id (+8 more)

### Community 14 - "BazaarEscrow"
Cohesion: 0.10
Nodes (12): BazaarEscrow, PaymentSettled, consumedNonces, PAYMENT_TYPEHASH, Payment, amount, asset, deadline (+4 more)

### Community 15 - "package.json"
Cohesion: 0.13
Nodes (16): devDependencies, hardhat@^3.0.0, @openzeppelin/contracts@^5.2.0, name, private, scripts, build, compile (+8 more)

### Community 16 - "nonce.ts"
Cohesion: 0.16
Nodes (5): InMemoryNonceStore, NonceClaimResult, NonceStore, resetNonceStore(), UpstashRedisNonceStore

### Community 17 - "wallet/route.ts"
Cohesion: 0.24
Nodes (11): createWallet(), getWalletAddress(), getWalletBalance(), loadAccount(), parsePrivateKey(), readKeyFromFile(), dynamic, GET() (+3 more)

### Community 18 - "Deployment & Production Readiness Guide"
Cohesion: 0.18
Nodes (10): 1. Local Link (Immediate), 2. Live Public Link (Vercel - 2 Minutes), 3. Alternative: Netlify Deployment, 4. Docker Deployment (Self-Hosted), Deployment & Production Readiness Guide, 🔐 Environment Variables Reference, 📋 Evaluation Summary: Is the Project Ready for Deployment?, 🔗 How to Obtain a Working AI Agent Link (+2 more)

### Community 19 - "bazaar.test.ts"
Cohesion: 0.27
Nodes (7): BazaarEscrowABI, calculateCounterPrice(), createDeal(), getItem(), getPrivateAcceptanceThreshold(), haggle(), BASE_SEPOLIA_CHAIN_ID

### Community 20 - "tools.ts"
Cohesion: 0.18
Nodes (10): 🔒 Security & Cryptographic Invariants (Strict Policy), beginPayment(), failPayment(), getReceipt(), verifyBuyerConfirmation(), Tool, OnChainSettlementOptions, OnChainSettlementResult (+2 more)

### Community 21 - "checkout/route.ts"
Cohesion: 0.29
Nodes (9): completePayment(), getDeal(), Receipt, getNonceStore(), CheckoutErrorResponse, CheckoutSuccessResponse, dynamic, GET() (+1 more)

### Community 22 - "next"
Cohesion: 0.20
Nodes (9): verifyPayment(), dynamic, GET(), maxDuration, WeatherErrorResponse, WeatherSuccessResponse, nextConfig, next@^16.4.3 (+1 more)

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `viem` connect `wallet.ts` to `my-agent/package.json`, `nonce.ts`, `bazaar.test.ts`, `tools.ts`, `deploy-escrow.js`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0633964429145152 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `utils.ts`, `agent/route.ts`, `bazaar.ts`, `my-agent/package.json`, `wallet/route.ts`, `bazaar.test.ts`, `checkout/route.ts`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Should `utils.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1408199643493761 - nodes in this community are weakly interconnected._
- **Why does `redactSensitiveData()` connect `agent/route.ts` to `tools.ts`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Should `agent/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0627177700348432 - nodes in this community are weakly interconnected._
- **Should `agentmaxxin` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._