from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, SourceInfo
from app.services.chroma_service import query_similar, generate_answer

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        results = query_similar(
            query=request.question,
            top_k=5,
            where={"user_id": current_user.id},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

    if not results:
        return ChatResponse(
            answer="I couldn't find any relevant information in your documents to answer that question. Please upload relevant documents first or try rephrasing your question.",
            sources=[],
        )

    try:
        result = generate_answer(question=request.question, context_chunks=results)
    except Exception as e:
        err = str(e)
        if "RESOURCE_EXHAUSTED" in err or "quota" in err.lower() or "429" in err:
            return ChatResponse(
                answer="I'm currently rate-limited by the AI service. Please wait a moment and try again.",
                sources=[],
            )
        raise HTTPException(status_code=500, detail=f"Answer generation failed: {str(e)}")

    sources = [
        SourceInfo(
            source=s["source"],
            pages=s.get("pages"),
            chunk_index=s["chunk_index"],
            total_chunks=s["total_chunks"],
            document_id=s["document_id"],
            distance=s.get("distance"),
        )
        for s in result["sources"]
    ]

    return ChatResponse(answer=result["answer"], sources=sources)
