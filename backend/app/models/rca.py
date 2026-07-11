from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class RCAnalysis(Base):
    __tablename__ = "rca_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    incident_description = Column(Text, nullable=False)
    possible_causes = Column(Text, nullable=True)
    similar_incidents = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    preventive_actions = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="rca_analyses")
