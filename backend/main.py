from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

import backend.models as models
import backend.schemas as schemas
import crud

from backend.database import SessionLocal, engine
from auth import authenticate_admin, create_access_token, get_current_admin

# -------------------------------------------------
# App setup
# -------------------------------------------------

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Tool Finder API")


# -------------------------------------------------
# Database Dependency
# -------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------------------------------
# AUTHENTICATION
# -------------------------------------------------

@app.post("/admin/login",tags=["Admin - Auth"])
def admin_login(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Admin Login
    username: admin
    password: admin123
    """
    if not authenticate_admin(form_data.username, form_data.password):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    token = create_access_token({"sub": "admin"})
    return {
        "access_token": token,
        "token_type": "bearer"
    }


# -------------------------------------------------
# USER APIs
# -------------------------------------------------

@app.get("/tools", response_model=list[schemas.ToolResponse],tags=["User - Tools"])
def get_tools(
    category: str | None = None,
    pricing: str | None = None,
    min_rating: float | None = None,
    db: Session = Depends(get_db)
):
    """
    Fetch all tools or filter by category, pricing, rating
    """
    return crud.filter_tools(db, category, pricing, min_rating)


@app.post("/review", response_model=schemas.ReviewResponse , tags=["User - Reviews"])
def submit_review(
    review: schemas.ReviewCreate,
    db: Session = Depends(get_db)
):
    """
    User submits a review (status = pending)
    """
    tool = db.query(models.AITool).filter(models.AITool.id == review.tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    new_review = models.Review(**review.dict())
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review


# -------------------------------------------------
# ADMIN APIs (PROTECTED)
# -------------------------------------------------

@app.post("/admin/tool", response_model=schemas.ToolResponse , tags=["Admin - Tools"])
def add_tool(
    tool: schemas.ToolCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    Admin adds a new AI tool
    """
    new_tool = models.AITool(**tool.dict())
    db.add(new_tool)
    db.commit()
    db.refresh(new_tool)
    return new_tool


@app.put("/admin/tool/{tool_id}",tags=["Admin - Tools"])
def update_tool(
    tool_id: int,
    tool: schemas.ToolCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    Admin updates tool details
    """
    db_tool = db.query(models.AITool).filter(models.AITool.id == tool_id).first()
    if not db_tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    for key, value in tool.dict().items():
        setattr(db_tool, key, value)

    db.commit()
    return {"message": "Tool updated successfully"}


@app.delete("/admin/tool/{tool_id}",tags=["Admin - Tools"])
def delete_tool(
    tool_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    Admin deletes a tool
    """
    tool = db.query(models.AITool).filter(models.AITool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    db.delete(tool)
    db.commit()
    return {"message": "Tool deleted successfully"}


@app.put("/admin/review/{review_id}/{status}",tags=["Admin - Reviews"])
def moderate_review(
    review_id: int,
    status: str,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    Admin approves or rejects reviews
    Allowed status: approved / rejected
    """
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be approved or rejected")

    review.status = status
    db.commit()

    if status == "approved":
        crud.recalculate_rating(db, review.tool_id)

    return {"message": f"Review {status} successfully"}

@app.get("/admin/reviews",tags=["Admin - Reviews"])
def view_reviews(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    reviews = db.query(models.Review).all()

    return [
        {
            "review_id": r.id,
            "tool_id": r.tool_id,
            "rating": r.user_rating,
            "comment": r.comment,
            "status": r.status
        }
        for r in reviews
    ]


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (good for development)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, etc.)
    allow_headers=["*"],  # Allows all headers
)