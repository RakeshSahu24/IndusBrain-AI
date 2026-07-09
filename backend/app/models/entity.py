from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.database import Base


class ExtractedEntity(Base):
    __tablename__ = "extracted_entities"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_value = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", backref="extracted_entities")
