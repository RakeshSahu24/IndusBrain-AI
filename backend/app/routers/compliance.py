import json
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.compliance import ComplianceCheck
from app.schemas.compliance import ComplianceResponse, ComplianceResult, ComplianceHistoryItem
from app.services.compliance_service import check_compliance
from app.services.parser import extract_text
from app.config import get_settings

router = APIRouter(prefix="/compliance", tags=["compliance"])
settings = get_settings()

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/plain",
}


@router.post("/check", response_model=ComplianceResponse)
def check_compliance_route(
    sop: UploadFile = File(...),
    report: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if sop.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"SOP file type '{sop.content_type}' not supported")
    if report.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Report file type '{report.content_type}' not supported")

    upload_dir = os.path.join(settings.UPLOAD_DIR, "compliance", str(current_user.id))
    os.makedirs(upload_dir, exist_ok=True)

    sop_ext = os.path.splitext(sop.filename or "sop")[1] or ".pdf"
    sop_path = os.path.join(upload_dir, f"{uuid.uuid4().hex}{sop_ext}")
    with open(sop_path, "wb") as f:
        while chunk := sop.file.read(1024 * 1024):
            f.write(chunk)

    report_ext = os.path.splitext(report.filename or "report")[1] or ".pdf"
    report_path = os.path.join(upload_dir, f"{uuid.uuid4().hex}{report_ext}")
    with open(report_path, "wb") as f:
        while chunk := report.file.read(1024 * 1024):
            f.write(chunk)

    sop_text = extract_text(sop_path, sop.content_type or "")
    report_text = extract_text(report_path, report.content_type or "")

    if not sop_text:
        raise HTTPException(status_code=400, detail="Could not extract text from SOP document")
    if not report_text:
        raise HTTPException(status_code=400, detail="Could not extract text from Inspection Report")

    try:
        result = check_compliance(sop_text=sop_text, report_text=report_text)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        err = str(e)
        if "RESOURCE_EXHAUSTED" in err or "quota" in err.lower() or "429" in err:
            raise HTTPException(status_code=429, detail="AI service rate-limited. Please wait and try again.")
        raise HTTPException(status_code=500, detail=f"Compliance check failed: {str(e)}")

    check = ComplianceCheck(
        user_id=current_user.id,
        sop_filename=sop.filename or "sop",
        report_filename=report.filename or "report",
        violations=json.dumps(result["violations"]),
        missing_steps=json.dumps(result["missing_steps"]),
        risk_level=result["risk_level"],
        compliance_percentage=result["compliance_percentage"],
    )
    db.add(check)
    db.commit()
    db.refresh(check)

    return ComplianceResponse(
        id=check.id,
        sop_filename=check.sop_filename,
        report_filename=check.report_filename,
        result=ComplianceResult(
            violations=result["violations"],
            missing_steps=result["missing_steps"],
            risk_level=result["risk_level"],
            compliance_percentage=result["compliance_percentage"],
        ),
        created_at=check.created_at,
    )


@router.get("/history", response_model=list[ComplianceHistoryItem])
def get_compliance_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ComplianceCheck)
        .filter(ComplianceCheck.user_id == current_user.id)
        .order_by(ComplianceCheck.created_at.desc())
        .all()
    )


@router.get("/{check_id}", response_model=ComplianceResponse)
def get_compliance_check(
    check_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check = db.query(ComplianceCheck).filter(ComplianceCheck.id == check_id).first()
    if not check:
        raise HTTPException(status_code=404, detail="Compliance check not found")
    if check.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    return ComplianceResponse(
        id=check.id,
        sop_filename=check.sop_filename,
        report_filename=check.report_filename,
        result=ComplianceResult(
            violations=json.loads(check.violations or "[]"),
            missing_steps=json.loads(check.missing_steps or "[]"),
            risk_level=check.risk_level or "Unknown",
            compliance_percentage=check.compliance_percentage or 0.0,
        ),
        created_at=check.created_at,
    )
