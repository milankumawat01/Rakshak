"""Authentication endpoints: Email OTP signup/login, JWT issue, profile."""

import os
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.core.email_otp import generate_and_send_otp, verify_otp
from app.schemas import (
    SignupRequest, VerifySignupRequest, LoginRequest, VerifyLoginRequest,
    TokenResponse, UserProfileOut, UpdateProfileRequest,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

# Temporary store for pending signups: {email: {name, phone_number}}
_pending_signups: dict = {}


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


@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    """Start signup: validate email is unique, send OTP."""
    existing = db.query(User).filter(User.email == req.email).first()
    if existing and existing.is_verified:
        raise HTTPException(status_code=409, detail="Email already registered")

    # If unverified user exists, allow re-signup
    if existing and not existing.is_verified:
        db.delete(existing)
        db.commit()

    # Store pending signup data
    _pending_signups[req.email] = {
        "name": req.name,
        "phone_number": req.phone_number,
    }

    success = generate_and_send_otp(req.email)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP")

    return {"message": "OTP sent to email", "email": req.email}


@router.post("/verify-signup", response_model=TokenResponse)
def verify_signup(req: VerifySignupRequest, db: Session = Depends(get_db)):
    """Verify signup OTP, create user, issue JWT."""
    if not verify_otp(req.email, req.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    pending = _pending_signups.pop(req.email, None)
    if not pending:
        raise HTTPException(status_code=400, detail="No pending signup for this email. Please start signup again.")

    user = User(
        user_id=str(uuid.uuid4()),
        email=req.email,
        name=pending["name"],
        phone_number=pending.get("phone_number"),
        is_verified=True,
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create user")

    token = create_access_token(user.user_id)
    return TokenResponse(
        access_token=token, user_id=user.user_id,
        name=user.name, email=user.email,
    )


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Start login: check user exists, send OTP."""
    user = db.query(User).filter(User.email == req.email, User.is_verified == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email")

    success = generate_and_send_otp(req.email)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP")

    return {"message": "OTP sent to email", "email": req.email}


@router.post("/verify-login", response_model=TokenResponse)
def verify_login(req: VerifyLoginRequest, db: Session = Depends(get_db)):
    """Verify login OTP, issue JWT."""
    if not verify_otp(req.email, req.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user = db.query(User).filter(User.email == req.email, User.is_verified == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = create_access_token(user.user_id)
    return TokenResponse(
        access_token=token, user_id=user.user_id,
        name=user.name, email=user.email,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user = get_current_user(credentials, db)
    token = create_access_token(user.user_id)
    return TokenResponse(
        access_token=token, user_id=user.user_id,
        name=user.name, email=user.email,
    )


@router.get("/me", response_model=UserProfileOut)
def get_profile(user: User = Depends(get_current_user)):
    """Get current user profile."""
    return UserProfileOut(
        user_id=user.user_id,
        name=user.name,
        email=user.email,
        phone_number=user.phone_number,
        user_type=user.user_type,
        subscription_plan=user.subscription_plan,
        total_submissions=user.total_submissions or 0,
        total_vault_items=user.total_vault_items or 0,
        registration_date=user.registration_date,
    )


@router.patch("/me", response_model=UserProfileOut)
def update_profile(
    req: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user profile."""
    if req.name is not None:
        user.name = req.name
    if req.phone_number is not None:
        user.phone_number = req.phone_number
    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update profile")

    return UserProfileOut(
        user_id=user.user_id,
        name=user.name,
        email=user.email,
        phone_number=user.phone_number,
        user_type=user.user_type,
        subscription_plan=user.subscription_plan,
        total_submissions=user.total_submissions or 0,
        total_vault_items=user.total_vault_items or 0,
        registration_date=user.registration_date,
    )


@router.post("/logout")
def logout():
    """Logout (stateless JWT — client-side token removal)."""
    return {"message": "Logged out"}
