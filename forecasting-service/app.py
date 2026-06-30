"""
SmartBrick Demand Forecasting Service — Phase 10A+
Flask microservice: reads UsageHistory from MongoDB, serves Prophet forecasts.
"""

from pathlib import Path

from dotenv import dotenv_values
from flask import Flask, jsonify, request

from forecast import generate_forecast

SERVICE_DIR = Path(__file__).resolve().parent
SERVER_ENV = SERVICE_DIR.parent / "server" / ".env"
LOCAL_ENV = SERVICE_DIR / ".env"

local_vars = dotenv_values(LOCAL_ENV) if LOCAL_ENV.exists() else {}
server_vars = dotenv_values(SERVER_ENV) if SERVER_ENV.exists() else {}

MONGODB_URI = local_vars.get("MONGODB_URI") or server_vars.get("MONGODB_URI") or ""
PORT = int(local_vars.get("PORT") or "5001")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI environment variable is required")

app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/forecast/<site_id>/<material_id>")
def forecast(site_id, material_id):
    weeks_ahead = request.args.get("weeks", default=8, type=int)
    if weeks_ahead < 1 or weeks_ahead > 52:
        return jsonify({"error": "weeks must be between 1 and 52"}), 400

    try:
        forecast_data = generate_forecast(
            site_id,
            material_id,
            weeks_ahead=weeks_ahead,
            mongodb_uri=MONGODB_URI,
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": "Forecast failed", "message": str(exc)}), 500

    return jsonify(
        {
            "siteId": site_id,
            "materialId": material_id,
            "weeksAhead": weeks_ahead,
            "forecast": forecast_data,
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False)
