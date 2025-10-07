"""
tier1_service.py
SAT-YUG : Tier 1 – Strategic Planner
-----------------------------------
Forecasts course demand and balances faculty workload
before semester registration begins.
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List

from sqlalchemy.orm import Session
from sqlalchemy import text

from statsmodels.tsa.statespace.sarimax import SARIMAX
from xgboost import XGBRegressor
import warnings
warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------
# Utility: fetch enrollment and faculty data from DB
# ---------------------------------------------------------------------
def load_historical_data(db: Session) -> pd.DataFrame:
    """
    Load historical enrollments joined with course & faculty info.
    """
    sql = text("""
        SELECT
            c.code AS course_code,
            c.name AS course_name,
            c.semester,
            c.credits,
            f.id AS faculty_id,
            f.name AS faculty_name,
            f.expertise,
            f.workload_cap,
            f.current_workload,
            e.timestamp
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN faculty f ON c.faculty_id = f.id
    """)
    df = pd.read_sql(sql, db.bind)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["year"] = df["timestamp"].dt.year
    df["month"] = df["timestamp"].dt.month
    return df


def aggregate_enrollment(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate enrollment counts per course per semester.
    """
    agg = (
        df.groupby(["course_code", "year", "semester"])
        .size()
        .reset_index(name="enrollments")
    )
    return agg


# ---------------------------------------------------------------------
# Forecasting Functions
# ---------------------------------------------------------------------
def forecast_course_demand(course_df: pd.DataFrame) -> int:
    """
    Hybrid forecast using SARIMA + XGBoost for next semester demand.
    """
    if len(course_df) < 4:
        # Not enough data, use mean fallback
        return int(course_df["enrollments"].mean())

    # --- SARIMA ---
    sarima_pred = None
    try:
        sarima_model = SARIMAX(
            course_df["enrollments"],
            order=(1, 1, 1),
            seasonal_order=(1, 1, 1, 2),
            enforce_stationarity=False,
            enforce_invertibility=False,
        )
        sarima_fit = sarima_model.fit(disp=False)
        sarima_pred = sarima_fit.forecast(steps=1).iloc[0]
    except Exception:
        sarima_pred = course_df["enrollments"].mean()

    # --- XGBoost ---
    try:
        X = course_df[["year", "semester"]]
        y = course_df["enrollments"]
        model = XGBRegressor(
            n_estimators=80,
            learning_rate=0.1,
            max_depth=3,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
        )
        model.fit(X, y)
        next_year = course_df["year"].max() + 1 if course_df["semester"].max() == 2 else course_df["year"].max()
        next_sem = 1 if course_df["semester"].max() == 2 else 2
        pred_xgb = model.predict(np.array([[next_year, next_sem]]))[0]
    except Exception:
        pred_xgb = sarima_pred

    # Weighted hybrid average
    hybrid = 0.6 * sarima_pred + 0.4 * pred_xgb
    return int(max(hybrid, 10))


# ---------------------------------------------------------------------
# Faculty Load Balancing
# ---------------------------------------------------------------------
def compute_faculty_scores(faculty_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute a weighted score for each faculty based on expertise,
    workload, and availability.
    """
    def expertise_score(exp):
        mapping = {"High": 1.0, "Medium": 0.7, "Low": 0.4}
        return mapping.get(str(exp), 0.5)

    faculty_df["expertise_score"] = faculty_df["expertise"].apply(expertise_score)
    faculty_df["availability_score"] = 1 - (faculty_df["current_workload"] / faculty_df["workload_cap"]).clip(0, 1)
    faculty_df["final_score"] = (
        0.6 * faculty_df["expertise_score"]
        + 0.4 * faculty_df["availability_score"]
    )
    return faculty_df.sort_values("final_score", ascending=False)

from models import ForecastResult

def run_tier1_forecast(db: Session) -> Dict[str, Any]:
    """
    Tier 1  Strategic Planner
    Forecast course demand and store results persistently.
    """
    # Step 1: Load and aggregate
    df = load_historical_data(db)
    if df.empty:
        return {"status": "error", "message": "No enrollment data found."}

    enroll_agg = aggregate_enrollment(df)

    # Step 2: Forecast demand
    forecasts = []
    for course_code, sub in enroll_agg.groupby("course_code"):
        demand = forecast_course_demand(sub)
        recommended_sections = max(1, demand // 60)
        course_name = sub["course_name"].iloc[-1]
        forecasts.append({
            "course_code": course_code,
            "course_name": course_name,
            "predicted_enrollment": demand,
            "recommended_sections": recommended_sections
        })
    forecast_df = pd.DataFrame(forecasts)

    # Step 3: Faculty balancing
    fac_df = (
        df[["faculty_id", "faculty_name", "expertise", "workload_cap", "current_workload"]]
        .drop_duplicates()
    )
    fac_scores = compute_faculty_scores(fac_df)

    # Step 4: Assign best faculty
    assignments = []
    for _, course in forecast_df.iterrows():
        best_fac = fac_scores.iloc[0]
        assignments.append({
            "course_code": course["course_code"],
            "course_name": course["course_name"],
            "recommended_faculty": best_fac["faculty_name"],
            "faculty_score": round(best_fac["final_score"], 2)
        })
        fac_scores.loc[fac_scores.index[0], "current_workload"] += 1
        fac_scores = compute_faculty_scores(fac_scores)

    # Step 5: Persist results to DB
    # Clear previous forecasts (optional: keep history)
    db.query(ForecastResult).delete()

    for course, assign in zip(forecast_df.to_dict(orient="records"), assignments):
        entry = ForecastResult(
            course_code=course["course_code"],
            course_name=course["course_name"],
            predicted_enrollment=course["predicted_enrollment"],
            recommended_sections=course["recommended_sections"],
            recommended_faculty=assign["recommended_faculty"],
            faculty_score=assign["faculty_score"]
        )
        db.add(entry)

    db.commit()

    # Step 6: Return summary
    output = {
        "status": "success",
        "generated_at": datetime.utcnow().isoformat(),
        "forecast_results": forecast_df.to_dict(orient="records"),
        "faculty_recommendations": assignments,
        "stored_in_db": True
    }

    return output
