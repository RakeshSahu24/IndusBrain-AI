import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.rca import RCAnalysis
from app.schemas.rca import RCARequest, RCAResponse, RCAResult, RCAHistoryItem
from app.services.rca_service import perform_rca

router = APIRouter(prefix="/rca", tags=["rca"])


@router.post("", response_model=RCAResponse)
def analyze_incident(
    request: RCARequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not request.incident_description.strip():
        raise HTTPException(status_code=400, detail="Incident description cannot be empty")

    try:
        result = perform_rca(
            incident_description=request.incident_description,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        err = str(e)
        if "RESOURCE_EXHAUSTED" in err or "quota" in err.lower() or "429" in err:
            raise HTTPException(
                status_code=429,
                detail="AI service rate-limited. Please wait a moment and try again.",
            )
        raise HTTPException(status_code=500, detail=f"RCA analysis failed: {str(e)}")

    analysis = RCAnalysis(
        user_id=current_user.id,
        incident_description=request.incident_description,
        possible_causes=json.dumps(result["possible_causes"]),
        similar_incidents=json.dumps(result["similar_historical_incidents"]),
        recommendations=json.dumps(result["recommendations"]),
        preventive_actions=json.dumps(result["preventive_actions"]),
        confidence_score=result["confidence_score"],
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return RCAResponse(
        id=analysis.id,
        incident_description=analysis.incident_description,
        result=RCAResult(
            possible_causes=result["possible_causes"],
            similar_historical_incidents=result["similar_historical_incidents"],
            recommendations=result["recommendations"],
            preventive_actions=result["preventive_actions"],
            confidence_score=result["confidence_score"],
        ),
        created_at=analysis.created_at,
    )


@router.get("/history", response_model=list[RCAHistoryItem])
def get_rca_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(RCAnalysis)
        .filter(RCAnalysis.user_id == current_user.id)
        .order_by(RCAnalysis.created_at.desc())
        .all()
    )


@router.get("/{analysis_id}", response_model=RCAResponse)
def get_rca_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = db.query(RCAnalysis).filter(RCAnalysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="RCA analysis not found")
    if analysis.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this analysis")

    return RCAResponse(
        id=analysis.id,
        incident_description=analysis.incident_description,
        result=RCAResult(
            possible_causes=json.loads(analysis.possible_causes or "[]"),
            similar_historical_incidents=json.loads(analysis.similar_incidents or "[]"),
            recommendations=json.loads(analysis.recommendations or "[]"),
            preventive_actions=json.loads(analysis.preventive_actions or "[]"),
            confidence_score=analysis.confidence_score or 0.0,
        ),
        created_at=analysis.created_at,
    )
