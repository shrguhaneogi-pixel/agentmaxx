# Agentmaxx 🚀

An autonomous AI Agent starter kit built with **Next.js**, **Google Gemini**, and **viem** on **Base Sepolia**. The agent reasons through tasks, invokes modular tools, and cryptographically signs micro-payments using its own crypto wallet via the **x402** protocol.

---

## 🌐 Working AI Agent Links

| Environment | Access Link | Description |
| :--- | :--- | :--- |
| **Local Development** | [http://localhost:3000](http://localhost:3000) | Live interactive chat with wallet setup & tool inspector |
| **Production Deployment** | Deploy to [Vercel](https://vercel.com) / [Netlify](https://netlify.com) | See [Deployment Guide](#-one-click-production-deployment) below to obtain your live public `.vercel.app` link |

---

## ⚡ Quick Start (Local Run)

1. **Clone & install dependencies:**
   ```bash
   cd agentmaxx/my-agent
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` in `my-agent/`:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-flash-latest
   WALLET_PRIVATE_KEY= # (Optional: specify 0x... or click 'Create wallet' in UI)
   ```
   > Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

3. **Start the application:**
   ```bash
   # From the repository root:
   npm run dev

   # Or inside my-agent/:
   cd my-agent && npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000). Click **"Create wallet"** in the Setup panel and start chatting with the agent!

---

## 🚀 One-Click Production Deployment

The core application resides in the `my-agent/` directory.

### Deploying to Vercel (Recommended)

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), select **Import Git Repository**.
3. In **Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select **`my-agent`** *(Crucial)*.
4. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API Key from Google AI Studio.
   - `WALLET_PRIVATE_KEY` *(Optional but recommended for serverless)*: An EVM test private key starting with `0x`.
   - `GEMINI_MODEL` *(Optional)*: `gemini-flash-latest`.
5. Click **Deploy**.
6. Vercel will generate your live production URL: `https://<your-project>.vercel.app`.

For comprehensive instructions covering Netlify, Railway, and Docker, refer to [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 🛠 Features & Capabilities

- 🤖 **Autonomous Multi-Step Agent**: Uses `@google/genai` to dynamically select and execute tools up to 5 iterative steps.
- 💳 **x402 Machine-to-Machine Payments**: Demonstrates HTTP 402 Payment Required where the agent signs micro-payment claims with viem without human intervention.
- 🧰 **Extensible Tools Suite**:
  - `get_weather`: Calls a mock paid weather API, signs a 0.01 USDC x402 payment, and unlocks live data.
  - `get_my_wallet`: Queries the agent's EVM wallet address and Base Sepolia testnet ETH balance.
  - `get_joke`: Fetches programming jokes with offline fallback.
  - `get_country_info`: Queries capital, population, region, and authentic local cuisine with curated destination intelligence and fallback redundancy for travel queries.
- 🎨 **Modern Cyberpunk UI**: Built with Tailwind CSS, shadcn/ui components, and JetBrains Mono typography.

---

## 📁 Repository Structure

```text
agentmaxx/
├── package.json              # Root project scripts (proxies build/dev to my-agent)
├── DEPLOYMENT.md             # Production deployment instructions & checklist
├── README.md                 # Project overview and guide
└── my-agent/                 # Next.js Application Core
    ├── agent/
    │   ├── agent.ts          # Core Gemini agent loop & tool orchestration
    │   ├── tools.ts          # Tool definitions and execution handlers
    │   └── wallet.ts         # Agent wallet generation, signing & x402 verification
    ├── app/
    │   ├── api/
    │   │   ├── agent/route.ts   # Agent chat API endpoint
    │   │   ├── wallet/route.ts  # Wallet creation & balance endpoint
    │   │   └── weather/route.ts # Mock x402 paid weather API
    │   ├── layout.tsx        # App layout and custom fonts
    │   └── page.tsx          # Main interactive dashboard UI
    ├── components/           # shadcn/ui React components
    ├── .env.example          # Environment variable template
    └── package.json          # Next.js dependencies and scripts
```

---

## 🛡 License

MIT License. See [LICENSE](./my-agent/LICENSE).
