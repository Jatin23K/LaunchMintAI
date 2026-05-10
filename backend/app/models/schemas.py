from pydantic import BaseModel
from typing import List, Dict, Optional, Union, Any

class IdeaRequest(BaseModel): idea: str
class VCRoastRequest(BaseModel): idea: str
class PitchForgeRequest(BaseModel): idea: str

class MarketData(BaseModel):
    current_tam: str
    forecast_tam: str
    growth: str
    confidence: str
    source_name: str
    source_url: str
    size: Optional[str] = "N/A"
    current_year: Optional[str] = "2025"
    forecast_year: Optional[str] = "2030"
    timing: Optional[Dict[str, str]] = None
    veracity_quote: Optional[str] = "No verified quote available."

class Competitor(BaseModel):
    name: str
    url: str
    kill_strategy: str
    market_fin: Optional[Dict[str, str]] = None
    technical_infra: Optional[Dict[str, str]] = None
    product_intel: Optional[Dict[str, str]] = None
    sentiment: Optional[Union[str, Dict[str, str]]] = "TBD"
    marketing: Optional[Union[str, Dict[str, str]]] = "TBD"
    weakness: Optional[str] = "N/A"

class GodMode(BaseModel):
    macro_verdict: str
    swarm_summary: str
    swot: Dict[str, List[str]]
    risk_score: str

class ForensicMetadata(BaseModel):
    confidence_score: float  # 0.0 to 1.0
    veracity_index: float    # Weighted authority score
    source_diversity: int    # Count of unique high-authority domains
    reasoning_trace: List[str] # Chain-of-thought data points
    bias_assessment: Optional[str] = "Neutral"

class IdeaAnalysisReport(BaseModel):
    market: MarketData
    competitors: List[Competitor]
    god_mode: GodMode
    idea: str
    forensics: Optional[ForensicMetadata] = None
    citations: Optional[List[Dict[str, str]]] = []
    dept_legal: Optional[List[str]] = []
    dept_product: Optional[List[str]] = []
    dept_marketing: Optional[List[str]] = []
    dept_finance: Optional[List[str]] = []

class VCRoastResponse(BaseModel):
    roast: str
    fatal_flaws: List[str]
    skeptic_verdict: str
    prob_failure: str
    market_rejection_reasons: List[str]

class BattleManeuver(BaseModel):
    title: str
    description: str
    impact: str
    risk: str

class WarRoomResponse(BaseModel):
    battle_plan: str
    offensive_maneuvers: List[BattleManeuver]
    defensive_maneuvers: List[BattleManeuver]
    resource_allocation: Dict[str, str]

class PitchDeckSlide(BaseModel):
    title: str
    content: str
    visual_suggestion: str

class PitchForgeResponse(BaseModel):
    narrative_hook: str
    elevator_pitch: str
    deck_structure: List[PitchDeckSlide]
    investor_q_and_a: List[Dict[str, str]]
