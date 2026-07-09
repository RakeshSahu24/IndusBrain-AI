import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.config import get_settings
from app.services.parser import extract_text
from app.services.chroma_service import index_document, delete_document_chunks
from app.services.entity_extractor import extract_entities_from_text
from app.services.graph_service import build_graph_from_entities, get_graph_by_document
from app.models.entity import ExtractedEntity
from app.schemas.entity import EntityResponse, EntityGroupResponse

router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
}

INLINE_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
}


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' is not allowed. Allowed: PDF, DOC, DOCX, XLS, XLSX, and image files",
        )

    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    stored_name = f"{uuid.uuid4().hex}{ext}"

    now = datetime.now(timezone.utc)
    upload_dir = os.path.join(
        settings.UPLOAD_DIR,
        str(current_user.id),
        str(now.year),
        f"{now.month:02d}",
        f"{now.day:02d}",
    )
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, stored_name)

    file_size = 0
    with open(file_path, "wb") as f:
        while chunk := file.file.read(1024 * 1024):
            file_size += len(chunk)
            if file_size > max_size:
                f.close()
                os.remove(file_path)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB} MB",
                )
            f.write(chunk)

    doc = Document(
        original_filename=file.filename or stored_name,
        stored_filename=stored_name,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        file_path=file_path,
        user_id=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        text = extract_text(file_path, doc.mime_type)
        if text:
            doc.text_content = text
            db.commit()
            db.refresh(doc)

        if text:
            try:
                num_chunks = index_document(
                    document_id=doc.id,
                    text=text,
                    metadata={
                        "original_filename": doc.original_filename,
                        "mime_type": doc.mime_type,
                        "user_id": doc.user_id,
                    },
                )
            except Exception:
                pass

        entities = None
        try:
            entities = extract_entities_from_text(text)
            for ent in entities:
                db.add(ExtractedEntity(
                    document_id=doc.id,
                    entity_type=ent.get("type", ""),
                    entity_value=ent.get("value", ""),
                    page_number=ent.get("page"),
                    confidence=ent.get("confidence"),
                ))
            db.commit()
        except Exception:
            pass

        if entities:
            try:
                build_graph_from_entities(doc.id, doc.original_filename, entities)
            except Exception:
                pass
    except Exception:
        pass

    return doc


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    try:
        delete_document_chunks(doc.id)
    except Exception:
        pass

    db.query(ExtractedEntity).filter(ExtractedEntity.document_id == doc.id).delete()
    report_id = f"report_{doc.id}"
    try:
        from app.services.graph_service import _get_driver
        driver = _get_driver()
        if driver:
            with driver.session() as session:
                session.run("MATCH (r:Report {id: $rid}) DETACH DELETE r", {"rid": report_id})
                session.run("MATCH (n) WHERE NOT (n)--() DELETE n", {})
            driver.close()
    except Exception:
        pass

    db.delete(doc)
    db.commit()


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk")

    return FileResponse(
        path=doc.file_path,
        filename=doc.original_filename,
        media_type=doc.mime_type,
    )


@router.get("/{document_id}/view")
def view_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk")

    response = FileResponse(path=doc.file_path, media_type=doc.mime_type)
    if doc.mime_type in INLINE_MIME_TYPES:
        response.headers["Content-Disposition"] = f'inline; filename="{doc.original_filename}"'
    else:
        response.headers["Content-Disposition"] = f'attachment; filename="{doc.original_filename}"'
    return response


@router.get("/{document_id}/entities", response_model=list[EntityResponse])
def get_document_entities(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return db.query(ExtractedEntity).filter(ExtractedEntity.document_id == document_id).all()


@router.get("/entities/summary", response_model=EntityGroupResponse)
def get_entities_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    if not docs:
        return EntityGroupResponse(document_id=0, document_filename="", entities={})

    all_entities = (
        db.query(ExtractedEntity)
        .join(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(ExtractedEntity.entity_type)
        .all()
    )

    grouped: dict[str, list[EntityResponse]] = {}
    for ent in all_entities:
        t = ent.entity_type
        if t not in grouped:
            grouped[t] = []
        grouped[t].append(EntityResponse.model_validate(ent))

    first_doc = docs[0]
    return EntityGroupResponse(
        document_id=first_doc.id,
        document_filename=first_doc.original_filename,
        entities=grouped,
    )
