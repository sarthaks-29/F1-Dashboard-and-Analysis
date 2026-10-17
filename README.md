# F1 Dashboard

An interactive Formula 1 dashboard with standings, teams, venues/calendar,
and per-circuit track pages.

> Telemetry, pit-stop, pace-prediction and race-strategy features have been
> moved to a separate project and are no longer part of this repo.

## Project layout

```
.
├── index.html               # Main dashboard entry page
├── teams.html               # Teams page
├── venues.html              # Venues / calendar page
├── Standings.html           # Standings entry (see Stands/ for the sub-app)
├── Stands/                  # Standings sub-app (HTML/CSS/JS + Flask)
├── Tracks/                  # Per-circuit track pages
├── circuits/, cars/, logos/, lineups/   # Image assets
├── background.png, f1.png, f1_logo.jpg  # Shared imagery
```

## Setup

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

## Running

Standings sub-app:

```bash
python Stands/app.py
```

Open `index.html` in your browser (directly or via a static server) to use
the dashboard.
