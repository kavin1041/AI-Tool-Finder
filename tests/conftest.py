import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# -------------------------------------------------
# ADD PROJECT ROOT TO PYTHON PATH (CRITICAL FIX)
# -------------------------------------------------
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.database import Base
from backend.main import app, get_db

# -------------------------------------------------
# TEST DATABASE
# -------------------------------------------------
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(bind=engine)

Base.metadata.create_all(bind=engine)

# -------------------------------------------------
# OVERRIDE DB DEPENDENCY
# -------------------------------------------------
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# -------------------------------------------------
# TEST CLIENT
# -------------------------------------------------
@pytest.fixture
def client():
    return TestClient(app)

