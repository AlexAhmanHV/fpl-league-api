# FPL Mini-League API

A documented API for a Fantasy Premier League mini-league, built on top of FPL's
unofficial public data. Adds stats FPL itself doesn't show: captain accuracy,
chip usage across a league, and head-to-head comparisons. Ships with a React
dashboard that visualizes it all.

## Run locally

Backend (API + serves the built dashboard):

```bash
npm install
npm run dev
```

API: http://localhost:3000 · Docs (Swagger UI): http://localhost:3000/docs

Frontend, for UI development with hot reload (proxies API calls to :3000):

```bash
cd client
npm install
npm run dev
```

Dev dashboard: http://localhost:5173

To ship UI changes, rebuild the dashboard into `public/`, which the backend
serves statically:

```bash
cd client
npm run build
```

## Endpoints

- `GET /leagues/{league_id}/standings` — current table
- `GET /leagues/{league_id}/history` — points/rank per gameweek for every team
- `GET /leagues/{league_id}/chips` — when each manager played each chip
- `GET /leagues/{league_id}/chip-status` — which chips each team has left, is missing, or already used, per season half
- `GET /leagues/{league_id}/captains?event_id=` — captain picks vs. the optimal captain for that gameweek
- `GET /leagues/{league_id}/transfers?event_id=` — transfers each team made in a gameweek, prices, and points hit
- `GET /head-to-head?entry_a=&entry_b=` — two managers compared gameweek by gameweek

Example league to try: `1092251` (Gamlebyviken Runt).

## Notes

- Built on FPL's unofficial API (`fantasy.premierleague.com/api`), which has no
  official docs and can change without notice.
- Responses are cached in-memory (15–60 min depending on endpoint) to avoid
  hammering FPL's servers.
- Only public/classic leagues work without authentication.

## Deploying (Render)

This is one Web Service — the Express server serves both the API and the
built dashboard from `public/`, so there's nothing to deploy separately.

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Node version: 20.x (set via `engines` in `package.json`)

Render's free tier spins a web service down after ~15 minutes of
inactivity. `.github/workflows/keep-alive.yml` pings `GET /health` (a
no-op endpoint, no FPL calls) every 10 minutes to keep it warm — after
deploying, set the `RENDER_URL` repository variable (Settings → Secrets
and variables → Actions → Variables) to your service's URL, e.g.
`https://fpl-league-api.onrender.com`.

## Stack

- **Backend**: Node.js + Express + TypeScript, with `swagger-ui-express`
  serving the OpenAPI spec at `/docs`.
- **Frontend** (`client/`): React + TypeScript, Vite, Tailwind CSS v4, and
  Framer Motion for animation (spotlight-hover cards, animated line-chart
  draw-in, count-up numbers — in the style of React Bits / Aceternity UI,
  built locally rather than pulled in as dependencies). Built output is
  committed to `public/`, which Express serves statically.
