"""
SmartBrick Demand Forecasting Service — Phase 10A+
Flask microservice: reads UsageHistory from MongoDB, serves Prophet forecasts.
"""

import os
from urllib.parse import urlparse

from dotenv import load_dotenv
from flask import Flask, jsonify
from pymongo import MongoClient

load_dotenv()

app = Flask(__name__)

PORT = int(os.getenv("PORT", "5001"))
MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI environment variable is required")


def _database_name(uri: str) -> str:
    """Match Mongoose default when URI has no path segment."""
    path = urlparse(uri).path.lstrip("/")
    return path.split("?")[0] if path else "test"


mongo_client = MongoClient(MONGODB_URI)
db = mongo_client[_database_name(MONGODB_URI)]
usage_history = db["usagehistories"]


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False)
