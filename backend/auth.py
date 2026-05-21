from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = "SECRET123"   # for demo
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="admin/login")

# ---- Fake Admin (for assignment) ----
ADMIN_USER = {
    "username": "admin",
    "hashed_password": pwd_context.hash("admin123")
}

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def authenticate_admin(username: str, password: str):
    if username != ADMIN_USER["username"]:
        return False
    if not verify_password(password, ADMIN_USER["hashed_password"]):
        return False
    return True

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_admin(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("sub") != "admin":
            raise HTTPException(status_code=401, detail="Invalid admin")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")