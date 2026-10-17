# F1 Dashboard — Backend

Flask API service for the F1 Dashboard. Deployed on **Render**; the static
frontend is deployed separately on **Vercel** and calls this service.

## Endpoints

| Method | Path                 | Description                              |
|--------|----------------------|------------------------------------------|
| GET    | `/`                  | Health check (`{"status": "ok", ...}`)   |
| GET    | `/api/championship`  | Proxied championship standings (JSON)    |

## Environment variables

| Variable               | Default                                              | Purpose                                             |
|------------------------|------------------------------------------------------|-----------------------------------------------------|
| `ALLOWED_ORIGINS`      | `*`                                                  | CORS origin(s). Set to your Vercel URL in prod.     |
| `CHAMPIONSHIP_API_URL` | `https://formula-telemetry.com/api/api/championship` | Upstream data source.                               |
| `PORT`                 | `5000` (local) / set by Render                       | Port the server binds to.                           |

## Local development

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

Visit http://localhost:5000/api/championship

## Deploy to Render

Option A — Blueprint (recommended): commit this folder, then in Render choose
**New > Blueprint** and point it at the repo. `render.yaml` configures the service.

Option B — Manual: create a new **Web Service**, set:
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app`

After deploy, set `ALLOWED_ORIGINS` to your Vercel domain
(e.g. `https://your-app.vercel.app`) and note the service URL
(e.g. `https://f1-dashboard-backend.onrender.com`) — the frontend fetches
`<service-url>/api/championship`.
