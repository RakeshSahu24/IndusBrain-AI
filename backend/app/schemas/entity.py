from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EntityResponse(BaseModel):
    id: int
    document_id: int
    entity_type: str
    entity_value: str
    page_number: Optional[int] = None
    confidence: Optional[float] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class EntityGroupResponse(BaseModel):
    document_id: int
    document_filename: str
    entities: dict[str, list[EntityResponse]]
