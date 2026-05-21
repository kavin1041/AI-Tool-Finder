from pydantic import BaseModel, Field
from typing import Optional

class ToolCreate(BaseModel):
    name: str
    use_case: str
    category: str
    pricing_type: str

class ToolResponse(ToolCreate):
    id: int
    rating: float

    class Config:
        orm_mode = True


class ReviewCreate(BaseModel):
    tool_id: int
    user_rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(ReviewCreate):
    id: int
    status: str

    class Config:
        orm_mode = True
