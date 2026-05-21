from sqlalchemy.orm import Session
from backend.models import AITool, Review
from sqlalchemy import func

def recalculate_rating(db: Session, tool_id: int):
    avg = db.query(func.avg(Review.user_rating))\
        .filter(Review.tool_id == tool_id, Review.status == "approved")\
        .scalar()

    tool = db.query(AITool).filter(AITool.id == tool_id).first()
    tool.rating = round(avg or 0, 2)
    db.commit()


def filter_tools(db, category=None, pricing=None, min_rating=None):
    query = db.query(AITool)

    if category:
        query = query.filter(AITool.category == category)
    if pricing:
        query = query.filter(AITool.pricing_type == pricing)
    if min_rating:
        query = query.filter(AITool.rating >= min_rating)

    return query.all()