"""
Prophet-based demand forecasting from UsageHistory records.
"""

from bson import ObjectId
from bson.errors import InvalidId
from urllib.parse import urlparse

import pandas as pd
from prophet import Prophet
from pymongo import MongoClient


def _database_name(uri: str) -> str:
    path = urlparse(uri).path.lstrip("/")
    return path.split("?")[0] if path else "test"


def _usage_collection(mongodb_uri: str):
    client = MongoClient(mongodb_uri)
    db = client[_database_name(mongodb_uri)]
    return db["usagehistories"]


def _to_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId as exc:
        raise ValueError(f"Invalid id: {value}") from exc


def generate_forecast(site_id, material_id, weeks_ahead=8, mongodb_uri=None):
    """
    Fit Prophet on weekly usage history and forecast the next `weeks_ahead` weeks.

    Returns a list of dicts:
      { date, predictedUsage, lowerBound, upperBound }
    """
    import os

    uri = mongodb_uri or os.getenv("MONGODB_URI")
    if not uri:
        raise ValueError("MONGODB_URI is required")

    collection = _usage_collection(uri)

    cursor = collection.find(
        {
            "site": _to_object_id(site_id),
            "material": _to_object_id(material_id),
        },
        {"date": 1, "quantityUsed": 1, "_id": 0},
    ).sort("date", 1)

    records = list(cursor)
    if len(records) < 4:
        raise ValueError(
            f"Insufficient history ({len(records)} points) for site={site_id}, material={material_id}"
        )

    df = pd.DataFrame(records)
    df = df.rename(columns={"date": "ds", "quantityUsed": "y"})
    df["ds"] = pd.to_datetime(df["ds"]).dt.tz_localize(None)
    df = df.sort_values("ds").reset_index(drop=True)

    # UsageHistory is one point per week (~26 weeks in seed data).
    # Yearly/weekly Prophet seasonality targets sub-annual patterns in daily
    # data, not weekly series — and we honestly lack 12+ months of history
    # for reliable yearly seasonality on this demo dataset.
    model = Prophet(
        yearly_seasonality=False,
        weekly_seasonality=False,
        daily_seasonality=False,
        seasonality_mode="additive",
    )
    model.fit(df)

    last_date = df["ds"].max()
    future_dates = pd.date_range(
        start=last_date + pd.Timedelta(days=7),
        periods=weeks_ahead,
        freq="7D",
    )
    future = pd.DataFrame({"ds": future_dates})
    forecast = model.predict(future)

    results = []
    for _, row in forecast.iterrows():
        predicted = max(0.0, float(row["yhat"]))
        lower = max(0.0, float(row["yhat_lower"]))
        upper = max(0.0, float(row["yhat_upper"]))
        results.append(
            {
                "date": row["ds"].strftime("%Y-%m-%d"),
                "predictedUsage": round(predicted, 2),
                "lowerBound": round(lower, 2),
                "upperBound": round(upper, 2),
            }
        )

    return results
