# LaunchMintAI — Deployment Guide
### Render (Backend) + Vercel (Frontend)

---

## OVERVIEW

| Service | Platform | What It Hosts |
|---------|----------|---------------|
| Backend | Render (Web Service) | FastAPI app — `/analyze`, `/vc_roast`, `/pitch_forge`, `/compare`, `/archive/*`, `/analyze/stream` |
| Frontend | Vercel | React + Vite SPA — all 4 tabs |
| Database | SQLite on Render disk | Battle Room archive (`launchmint.db`) |

**Flow:** User → Vercel (static SPA) → Render API (FastAPI + LLMs + Serper) → Gemini / NIM / Serper

---

## PART 1 — BACKEND: RENDER

### Step 1 — Push Backend to GitHub

Ensure `backend/` is committed and pushed to master:

```powershell
git add backend/
git commit -m "deploy: backend ready for Render"
git push origin master
```

### Step 2 — Create Render Web Service

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo (`LaunchMintAI`)
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `launchmintai-backend` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python -m app.main` (already in `railway.toml`) |
| **Instance Type** | Free (or Starter for always-on) |
| **Region** | Oregon (US West) |

> The `backend/railway.toml` already has `startCommand = "python -m app.main"` — Render picks this up automatically if you point it at the `backend/` root.

### Step 3 — Set Environment Variables on Render

Go to your Render service → **Environment** → add each key:

**Gemini Keys (6 keys):**
```
GEMINI_API_KEY_1 = <your key 1>
GEMINI_API_KEY_2 = <your key 2>
GEMINI_API_KEY_3 = <your key 3>
GEMINI_API_KEY_4 = <your key 4>
GEMINI_API_KEY_5 = <your key 5>
GEMINI_API_KEY_6 = <your key 6>
```

**NIM Keys (6 keys):**
```
NIM_API_KEY_1 = <your key 1>
NIM_API_KEY_2 = <your key 2>
NIM_API_KEY_3 = <your key 3>
NIM_API_KEY_4 = <your key 4>
NIM_API_KEY_5 = <your key 5>
NIM_API_KEY_6 = <your key 6>
```

**Serper Keys (up to 6 keys):**
```
SERPER_API_KEY   = <your key 1>
SERPER_API_KEY_1 = <your key 1>
SERPER_API_KEY_2 = <your key 2>
SERPER_API_KEY_3 = <your key 3>
SERPER_API_KEY_4 = <your key 4>
SERPER_API_KEY_5 = <your key 5>
SERPER_API_KEY_6 = <your key 6>
```

> **Important:** `SERPER_API_KEY` (no number) must also be set — the code checks that as the primary key (`os.getenv("SERPER_API_KEY")`).

### Step 4 — Verify Backend is Live

After deploy completes, Render gives you a URL like:
```
https://launchmintai-backend.onrender.com
```

Test it:
```bash
curl https://launchmintai-backend.onrender.com/health
# Expected: {"status": "ok"} or 200
```

Also test:
```bash
curl -X POST https://launchmintai-backend.onrender.com/vc_roast \
  -H "Content-Type: application/json" \
  -d '{"user_idea": "Uber for dog walking"}'
# Expected: JSON with kill_shot, survival_chance, verdict, etc.
```

### Render Free Tier Notes

| Limitation | Impact |
|------------|--------|
| Spins down after 15 min of inactivity | First request after idle takes 30–60s (cold start) |
| 512 MB RAM | Fine for this app — DS pipeline uses ~200MB peak |
| No persistent disk on free tier | SQLite `launchmint.db` resets on redeploy — Battle Room archive is cleared |
| 750 hrs/month | Enough for one always-on service |

**Cold start fix for portfolio demos:** Keep a browser tab open with the app, or use [UptimeRobot](https://uptimerobot.com) to ping `/health` every 14 minutes (free).

---

## PART 2 — FRONTEND: VERCEL

### Step 1 — Set the API URL Environment Variable Locally

Before deploying, the frontend needs to know the Render backend URL. It reads from `VITE_API_BASE_URL`:

```typescript
// frontend/config.ts
export const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL
  || 'http://127.0.0.1:8000';  // fallback for local dev
```

You do NOT hardcode the URL — you set it in Vercel's environment variables.

### Step 2 — Deploy to Vercel

#### Option A — Vercel CLI (fastest)

```powershell
cd "C:\Users\Jatin\Documents\APP\LaunchMintAI\frontend"
npx vercel
```

Follow the prompts:
- Link to existing project or create new
- **Root directory:** `frontend` (or `.` if you're already in it)
- **Build command:** `vite build`
- **Output directory:** `dist`
- **Framework:** Vite

#### Option B — Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo (`LaunchMintAI`)
3. Configure:

| Setting | Value |
|---------|-------|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `vite build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Step 3 — Set Environment Variable on Vercel

In Vercel project → **Settings** → **Environment Variables**:

```
VITE_API_BASE_URL = https://launchmintai-backend.onrender.com
```

Set for: **Production**, **Preview**, **Development** (all three).

> This is the only env var the frontend needs. All API keys live on the backend (Render), never in the frontend.

### Step 4 — Verify Vercel Config

`frontend/vercel.json` already handles SPA routing correctly:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
This means deep links like `/validator` or `/roast` won't 404 on refresh.

### Step 5 — Redeploy After Env Var Change

If you set `VITE_API_BASE_URL` after the first deploy, trigger a redeploy:
```powershell
npx vercel --prod
```
Or in the Vercel dashboard: **Deployments** → **Redeploy**.

---

## PART 3 — UPDATING AFTER CODE CHANGES

### Update Backend (Render)

Push to GitHub master — Render auto-deploys on every push to the connected branch:

```powershell
git add backend/
git commit -m "fix: update backend"
git push origin master
```

Render detects the push → runs `pip install -r requirements.txt` → restarts with `python -m app.main`.

### Update Frontend (Vercel)

```powershell
git add frontend/
git commit -m "fix: update frontend"
git push origin master
```

Vercel detects the push → runs `vite build` → deploys the new `dist/`.

**Or manually:**
```powershell
cd frontend
npx vercel --prod
```

---

## PART 4 — CORS CONFIGURATION

Backend (`main.py`) currently allows all origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # open for portfolio — lock down for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

For a portfolio project, `allow_origins=["*"]` is fine. For production, replace with:
```python
allow_origins=[
    "https://your-app.vercel.app",
    "https://your-custom-domain.com"
]
```

---

## PART 5 — INTERVIEW QUESTIONS ABOUT DEPLOYMENT

**Q: Why Render for backend and Vercel for frontend?**

A: Render supports Python/FastAPI natively — it reads `requirements.txt`, runs `pip install`, and starts the uvicorn server from `python -m app.main`. Vercel is optimized for static frontends and Vite builds — it detects the framework automatically, runs `vite build`, and serves the `dist/` folder from a global CDN. Using each platform for what it's best at is the right choice over trying to host both on one platform.

**Q: How does the frontend know where the backend is?**

A: `frontend/config.ts` reads `VITE_API_BASE_URL` from the build-time environment (injected by Vite at build time, not runtime). In Vercel, this is set as a project environment variable. In local dev, it falls back to `http://127.0.0.1:8000`. The key insight: Vite `import.meta.env` variables are baked into the compiled JS bundle at build time — they are not read at runtime like Node.js `process.env`. This means if you change `VITE_API_BASE_URL` in Vercel, you must trigger a redeploy for the change to take effect.

**Q: What happens to the Battle Room archive on Render free tier?**

A: SQLite `launchmint.db` is stored on the container's ephemeral filesystem. On Render free tier, the disk is not persistent — every redeploy wipes it. For a portfolio demo, this is acceptable since Battle Room is demonstrated live. For production, the fix is: (1) upgrade to Render's paid persistent disk ($0.25/GB/month), or (2) migrate from SQLite to PostgreSQL using Render's managed Postgres add-on (free 1GB tier available).

**Q: How do you handle the cold start problem on Render free tier?**

A: The free tier spins down after 15 minutes of inactivity. The first request after idle hits a 30–60 second cold start. Three mitigations: (1) UptimeRobot pings `/health` every 14 minutes — keeps the service warm for free. (2) Show a loading state in the frontend with a "warming up..." message if the first health check takes >5 seconds. (3) Upgrade to Render Starter ($7/month) which never sleeps. For a portfolio project, option 1 is sufficient.

**Q: Why is `VITE_API_BASE_URL` the only frontend env var?**

A: All sensitive API keys (Gemini, NIM, Serper) live exclusively on the backend. The frontend is a static SPA served from Vercel's CDN — any `VITE_` variable gets compiled into the JavaScript bundle and is visible to anyone who views the page source. Never put API keys in frontend env vars. The frontend only needs the backend URL, which is not sensitive.

**Q: How does Vercel handle React Router / client-side routing?**

A: `frontend/vercel.json` has a catch-all rewrite rule: all paths `(.*)` rewrite to `/index.html`. This means when a user refreshes at `/roast` or `/validator`, Vercel serves `index.html` instead of returning 404. React's router then reads the URL and renders the correct tab. Without this rule, every direct URL hit would 404.

**Q: What is `python -m app.main` and why not `uvicorn app.main:app`?**

A: Both work — `python -m app.main` runs the `if __name__ == "__main__"` block in `main.py` which starts uvicorn programmatically with the right host/port settings. This is more portable — the port can be read from `$PORT` (which Render injects automatically) inside the Python code. `uvicorn app.main:app --host 0.0.0.0 --port $PORT` would also work but is more fragile if the Render-injected `$PORT` is not handled correctly.

---

## PART 6 — DEPLOY CHECKLIST

Before every deploy, run through this:

```
Backend (Render):
[ ] All env vars set (6 Gemini + 6 NIM + 6 Serper + SERPER_API_KEY)
[ ] requirements.txt includes all packages (slowapi, sse-starlette, aiohttp, etc.)
[ ] python -m app.main runs locally without errors
[ ] /health endpoint returns 200
[ ] Test one endpoint: POST /vc_roast with a simple idea

Frontend (Vercel):
[ ] VITE_API_BASE_URL set to Render backend URL (not localhost)
[ ] vite build runs without TypeScript errors
[ ] vercel.json rewrite rule present
[ ] All 4 tabs load correctly after deploy
[ ] No console errors referencing localhost:8000
```

---

## PART 7 — QUICK REFERENCE URLS

| Resource | URL Pattern |
|----------|------------|
| Render dashboard | `dashboard.render.com` |
| Your backend | `https://launchmintai-backend.onrender.com` |
| Vercel dashboard | `vercel.com/dashboard` |
| Your frontend | `https://launchmintai.vercel.app` (or custom domain) |
| Health check | `https://launchmintai-backend.onrender.com/health` |

---

*Document created: 2026-05-19 — covers Render + Vercel deployment for LaunchMintAI portfolio project*
*Applicable for: Applied Data Scientist + Forward Deployed Engineer interview preparation*
