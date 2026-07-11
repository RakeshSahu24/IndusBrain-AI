from pydantic import BaseModel
from datetime import datetime


class RCARequest(BaseModel):
    incident_description: str


class RCAResult(BaseModel):
    possible_causes: list[str]
    similar_historical_incidents: list[dict]
    recommendations: list[str]
    preventive_actions: list[str]
    confidence_score: float


class RCAResponse(BaseModel):
    id: int
    incident_description: str
    result: RCAResult
    created_at: datetime


class RCAHistoryItem(BaseModel):
    id: int
    incident_description: str
    confidence_score: float | None
    created_at: datetime

    class Config:
        from_attributes = True
