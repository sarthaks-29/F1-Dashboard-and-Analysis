"""
F1 Dashboard — backend API

A small Flask service that proxies Formula 1 championship data for the
frontend (deployed separately on Vercel). CORS is enabled so the static
frontend can call this API from a different origin.

Local dev:
    python app.py

Production (Render):
    gunicorn app:app
"""

import os

import requests
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Allow the frontend (any origin by default; lock this down with the
# ALLOWED_ORIGINS env var in production, e.g. "https://your-app.vercel.app").
_origins = os.environ.get("ALLOWED_ORIGINS", "*")
CORS(app, resources={r"/api/*": {"origins": _origins}})

# Upstream championship data source.
API_URL = os.environ.get(
    "CHAMPIONSHIP_API_URL",
    "https://formula-telemetry.com/api/api/championship",
)

REQUEST_TIMEOUT = 15  # seconds


@app.route("/")
def health():
    """Simple health check so Render shows the service as live."""
    return jsonify({"status": "ok", "service": "f1-dashboard-backend"})


@app.route("/api/championship")
def championship():
    """Proxy the upstream championship standings as JSON."""
    try:
        response = requests.get(API_URL, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as exc:
        return jsonify({"error": "upstream_request_failed", "detail": str(exc)}), 502


if __name__ == "__main__":
    # Render provides the port via the PORT env var; default to 5000 locally.
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
