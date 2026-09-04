from sqlmodel import Field, SQLModel, create_engine, Session, select
from typing import Optional, List
import os
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

# SQLite DB file
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
