"""Authentication endpoints: OTP login, JWT issue, refresh."""

import os
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.schemas import SendOTPRequest, VerifyOTPRequest, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24
MOCK_OTP = os.getenv("MOCK_OTP", "true").lower() == "true"


def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency: extract and validate JWT, return User."""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/send-otp")
def send_otp(req: SendOTPRequest):
    if MOCK_OTP:
        return {"message": "OTP sent (mock)", "phone": req.phone}
    # TODO: Integrate real SMS provider
    return {"message": "OTP sent", "phone": req.phone}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    # Mock OTP validation
    if MOCK_OTP:
        if req.otp != "123456":
            raise HTTPException(status_code=400, detail="Invalid OTP")
    else:
        # TODO: Verify OTP with real provider
        raise HTTPException(status_code=501, detail="Real OTP not implemented")

    # Find or create user
    user = db.query(User).filter(User.phone_number == req.phone).first()
    if not user:
        user = User(
            user_id=str(uuid.uuid4()),
            phone_number=req.phone,
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to create user")

    token = create_access_token(user.user_id)
    return TokenResponse(access_token=token, user_id=user.user_id)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user = get_current_user(credentials, db)
    token = create_access_token(user.user_id)
    return TokenResponse(access_token=token, user_id=user.user_id)
