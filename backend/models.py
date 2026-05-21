from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class AITool(Base):
    __tablename__ = "ai_tools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    use_case = Column(String, nullable=False)
    category = Column(String, nullable=False)
    pricing_type = Column(String, nullable=False)
    rating = Column(Float, default=0)

    reviews = relationship("Review", back_populates="tool", cascade="all, delete")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    tool_id = Column(Integer, ForeignKey("ai_tools.id"))
    user_rating = Column(Integer)
    comment = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending / approved / rejected
    tool = relationship("AITool", back_populates="reviews")