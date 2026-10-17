# F1 Dashboard

An interactive Formula 1 dashboard with standings, teams, venues/calendar,
and per-circuit track pages.

The project is split into two independently deployable parts:

```
.
├── frontend/   # Static site (HTML/CSS/JS)  → deploy to Vercel
│   ├── index.html, teams.html, venues.html, Standings.html
│   ├── Stands/      # Standings sub-app (fetches the backend API)
│   ├── Tracks/      # Per-circuit pages
│   ├── cars/, circuits/, logos/, lineups/   # Image assets
│   └── vercel.json
└── backend/    # Flask API (championship proxy)  → deploy to Render
    ├── app.py
    ├── requirements.txt
    ├── Procfile
    └── render.yaml
```

## Architecture

- **Frontend (Vercel):** static pages. The standings page calls the backend
  at `/api/championship`. The backend base URL is set in
  `frontend/Stands/Standings.html` (`API_BASE`) and can be overridden at
  runtime via `window.API_BASE`.
- **Backend (Render):** a small Flask service that proxies championship
  standings data and sends CORS headers so the Vercel frontend can call it.

## Deploy

### Backend → Render
1. New Web Service (or Blueprint via `backend/render.yaml`).
2. Root Directory: `backend`
3. Build: `pip install -r requirements.txt`  ·  Start: `gunicorn app:app`
4. Set `ALLOWED_ORIGINS` to your Vercel URL once known.

Current service: `https://f1-dashboard-and-analysis.onrender.com`

### Frontend → Vercel
1. New Project from this repo.
2. Framework Preset: **Other** (static).
3. Root Directory: `frontend`
4. Deploy. `vercel.json` serves `index.html` at `/`.

## Local development

Backend:

```bash
cd backend
pip install -r requirements.txt
python app.py        # http://localhost:5000
```

Frontend: open `frontend/index.html` directly, or serve the `frontend/`
folder with any static server.
