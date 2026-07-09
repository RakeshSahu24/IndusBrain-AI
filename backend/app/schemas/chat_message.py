from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ChatMessageResponse(BaseModel):
    id: int
    user_id: int
    role: str
    content: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}