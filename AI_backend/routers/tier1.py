# routes/tier1.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import ForecastResult
from services.tier1_prediction_service import run_tier1_forecast

router = APIRouter(prefix="/tier1", tags=["Tier 1 – Strategic Planner"])

@router.get("/forecast/run")
def run_forecast(db: Session = Depends(get_db)):
    """
    Run Tier 1 forecasting process and store results in DB.
    """
    return run_tier1_forecast(db)

@router.get("/forecast/results")
def get_forecast_results(db: Session = Depends(get_db)):
    """
    Retrieve most recent forecast results.
    """
    results = db.query(ForecastResult).order_by(ForecastResult.created_at.desc()).limit(50).all()
    return [r.__dict__ for r in results]
