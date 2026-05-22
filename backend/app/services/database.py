from sqlmodel import Field, SQLModel, create_engine, Session, select
from typing import Optional, List
import os
import json
from datetime import datetime

# Define the models
class IdeaAnalysis(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    idea: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    market_size: str
    forecast_tam: str
    growth_rate: str
    confidence: str
    verdict: str
    risk_score: str
    raw_data: str # Store the complete JSON as a string for safety

# Database Connection Logic
database_url = os.environ.get("DATABASE_URL")
if database_url:
    # Supabase connection
    # Note: Using SQLAlchemy 2.0+ with Postgres
    engine = create_engine(database_url, echo=False, pool_size=20, max_overflow=0)
else:
    # Fallback to local SQLite if URL is missing
    sqlite_file_name = "launchmint.db"
    sqlite_url = f"sqlite:///{sqlite_file_name}"
    engine = create_engine(sqlite_url, echo=False)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def save_analysis(idea: str, data: dict):
    with Session(engine) as session:
        analysis = IdeaAnalysis(
            idea=idea,
            market_size=data.get("market", {}).get("current_tam", "N/A"),
            forecast_tam=data.get("market", {}).get("forecast_tam", "N/A"),
            growth_rate=data.get("market", {}).get("growth", "N/A"),
            confidence=data.get("market", {}).get("confidence", "Medium"),
            verdict=data.get("god_mode", {}).get("macro_verdict", "No verdict"),
            risk_score=data.get("god_mode", {}).get("risk_score", "Moderate"),
            raw_data=str(data)
        )
        session.add(analysis)
        session.commit()
        session.refresh(analysis)
        return analysis

def get_history(limit: int = 10):
    with Session(engine) as session:
        statement = select(IdeaAnalysis).order_by(IdeaAnalysis.timestamp.desc()).limit(limit)
        results = session.exec(statement)
        return results.all()


# OPT 6: SavedReport table for Battle Room (replaces localStorage)
class SavedReport(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    idea: str = Field(index=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    forecast_tam: str = ""
    growth: str = ""
    risk_score: str = ""
    raw_json: str = ""  # Full RealData JSON as string


def save_report(report: dict) -> SavedReport:
    """Save a report to the SQLite SavedReport table."""
    idea = report.get("idea", "")
    market = report.get("market", {})
    god_mode = report.get("god_mode", {})
    with Session(engine) as session:
        # Delete existing report for same idea (upsert)
        existing = session.exec(select(SavedReport).where(SavedReport.idea == idea)).first()
        if existing:
            session.delete(existing)
            session.commit()
        saved = SavedReport(
            idea=idea,
            forecast_tam=str(market.get("forecast_tam", "")),
            growth=str(market.get("growth", "")),
            risk_score=str(god_mode.get("risk_score", "")),
            raw_json=json.dumps(report),
        )
        session.add(saved)
        session.commit()
        session.refresh(saved)
        return saved


def list_reports(limit: int = 50) -> List[dict]:
    """Return last 50 saved reports ordered by timestamp desc."""
    with Session(engine) as session:
        statement = select(SavedReport).order_by(SavedReport.timestamp.desc()).limit(limit)
        results = session.exec(statement).all()
        return [
            {
                "id": r.id,
                "idea": r.idea,
                "forecast_tam": r.forecast_tam,
                "growth": r.growth,
                "risk_score": r.risk_score,
                "timestamp": r.timestamp.isoformat(),
                "raw_json": r.raw_json,
            }
            for r in results
        ]


def delete_report(idea: str) -> bool:
    """Delete a SavedReport by idea text. Returns True if found and deleted."""
    with Session(engine) as session:
        existing = session.exec(select(SavedReport).where(SavedReport.idea == idea)).first()
        if existing:
            session.delete(existing)
            session.commit()
            return True
        return False
