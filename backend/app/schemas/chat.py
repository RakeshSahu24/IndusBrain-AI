from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str


class SourceInfo(BaseModel):
    source: str
    pages: str | None = None
    chunk_index: int
    total_chunks: int
    document_id: int
    distance: float | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceInfo]
