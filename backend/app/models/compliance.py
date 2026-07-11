from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class ComplianceCheck(Base):
    __tablename__ = "compliance_checks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sop_filename = Column(String(500), nullable=False)
    report_filename = Column(String(500), nullable=False)
    violations = Column(Text, nullable=True)
    missing_steps = Column(Text, nullable=True)
    risk_level = Column(String(20), nullable=True)
    compliance_percentage = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="compliance_checks")
