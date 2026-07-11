from pydantic import BaseModel
from datetime import datetime


class ComplianceResult(BaseModel):
    violations: list[str]
    missing_steps: list[str]
    risk_level: str
    compliance_percentage: float


class ComplianceResponse(BaseModel):
    id: int
    sop_filename: str
    report_filename: str
    result: ComplianceResult
    created_at: datetime


class ComplianceHistoryItem(BaseModel):
    id: int
    sop_filename: str
    report_filename: str
    risk_level: str | None
    compliance_percentage: float | None
    created_at: datetime

    model_config = {"from_attributes": True}
