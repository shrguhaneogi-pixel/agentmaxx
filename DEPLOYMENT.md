# Deployment & Production Readiness Guide

This guide details the evaluation and steps required to take **Agentmaxx** to production.

---

## 📋 Evaluation Summary: Is the Project Ready for Deployment?

### Status: **YES, Ready for Deployment** (with fixes applied)

| Checkpoint | Status | Details |
| :--- | :--- | :--- |
| **Next.js Production Build** | ✅ Passed | App Router Turbopack / Webpack compilation without TypeScript errors. |
| **Serverless Filesystem Resilience** | ✅ Resolved | Added multi-path persistence (`process.cwd()`, `os.tmpdir()` `/tmp`) and in-memory fallback so wallet persists on warm lambdas and never crashes with `EROFS`. |
| **Serverless Timeout & Dynamic Route Config** | ✅ Resolved | Configured `export const maxDuration = 60` and `dynamic = "force-dynamic"` to give multi-step AI tool chains adequate execution time on serverless hosts. |
| **Reverse Proxy / Origin Routing** | ✅ Resolved | Updated `app/api/agent/route.ts` to parse comma-separated multi-tier proxy headers (`x-forwarded-host`, `x-forwarded-proto`) and localhost/127.0.0.1 origins for reliable x402 tool calls. |
| **Tool Robustness & API Deprecation Fix** | ✅ Resolved | Added an offline curated database for `get_country_info` (resolving REST Countries v1-v4 deprecation/shutdown) with capitals, populations, and cuisines; offline jokes fallback for `get_joke`; and Base Sepolia RPC timeout guards for `get_my_wallet`. |
| **Monorepo / Root Setup** | ✅ Resolved | Configured root `package.json` with proxy scripts (`build`, `dev`, `start`, `type-check`), eliminated parent workspace filter collision (`npm warn workspaces my-agent in filter set`), and removed orphaned root lockfile. |
| **Environment Variable Security & Parsing** | ✅ Protected | Added `parsePrivateKey` to sanitize whitespace and ensure `0x` formatting. `.env` and `.agent-wallet.json` are strictly gitignored. |

---

## 🔗 How to Obtain a Working AI Agent Link

### 1. Local Link (Immediate)
Run the application locally to test the complete loop:
```bash
# In the repository root
npm run dev
```
Access the working link in your browser:
👉 **`http://localhost:3000`**

---

### 2. Live Public Link (Vercel - 2 Minutes)

Vercel is the recommended hosting platform for Next.js applications:

1. **Push your code to GitHub**:
   Ensure all changes are committed and pushed to your remote repository.

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your `agentmaxx` repository.

3. **Configure Project Settings** *(Crucial Step)*:
   - **Framework Preset**: Next.js
   - **Root Directory**: Click `Edit` and select **`my-agent`**.
   *(Because the Next.js app is located in the `my-agent` subfolder, setting the root directory to `my-agent` ensures zero-config building and routing).*

4. **Add Environment Variables**:
   Under **Environment Variables**, configure:
   - `GEMINI_API_KEY`: `your_gemini_api_key` (Required — from [Google AI Studio](https://aistudio.google.com/apikey))
   - `GEMINI_MODEL`: `gemini-flash-latest` (Optional)
   - `WALLET_PRIVATE_KEY`: `0x...` *(Recommended for serverless: provide a test private key so the agent wallet persists across stateless lambda instances)*

5. **Deploy**:
   - Click **Deploy**.
   - Once build finishes, Vercel gives you your live working public agent link:
     👉 **`https://<your-project-name>.vercel.app`**

---

### 3. Alternative: Netlify Deployment

1. Go to [netlify.com](https://netlify.com) and click **"Add new site" > "Import an existing project"**.
2. Select your repository.
3. Configure build settings:
   - **Base directory**: `my-agent`
   - **Build command**: `npm run build`
   - **Publish directory**: `my-agent/.next`
4. In **Site Configuration > Environment Variables**, add `GEMINI_API_KEY` and `WALLET_PRIVATE_KEY`.
5. Deploy site.

---

### 4. Docker Deployment (Self-Hosted)

If deploying to Railway, Render, or a VPS with Docker, you can run from `my-agent`:

```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app
COPY my-agent/package*.json ./
RUN npm ci
COPY my-agent/ ./
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔐 Environment Variables Reference

| Variable | Required | Scope | Description |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | Server | Google Gemini API key for agent reasoning and tool dispatching. |
| `GEMINI_MODEL` | No | Server | Defaults to `gemini-flash-latest`. |
| `WALLET_PRIVATE_KEY` | Recommended | Server | 0x-prefixed hex private key. If set, persists across all serverless instances. |

---

## ✅ Pre-Deployment Verification Checklist

- [x] Run `npm run build` inside `my-agent` — passes with 0 errors.
- [x] Test tool calls (`get_weather`, `get_my_wallet`, `get_joke`, `get_country_info`).
- [x] Validate `.agent-wallet.json` and `.env` are in `.gitignore`.
- [x] Ensure `createWallet()` gracefully handles read-only filesystems and falls back to `/tmp` and in-memory.
- [x] Ensure origin baseUrl dynamically adapts to production domain and handles multi-tier proxy headers.
- [x] Configure serverless timeout (`maxDuration = 60`) and `dynamic = "force-dynamic"` on API routes.
- [x] Validate request body parsing and 400 Bad Request handling for malformed agent calls.
- [x] Configure root package.json proxy scripts (`build`, `dev`, `start`, `type-check`) for clean monorepo management without parent workspace collisions.
