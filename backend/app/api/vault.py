"""Vault CRUD endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.submission import Submission
from app.models.vault import UserVault
from app.schemas import VaultCreateRequest, VaultUpdateRequest, VaultOut

router = APIRouter(prefix="/api/vault", tags=["vault"])


@router.post("/", response_model=VaultOut)
def create_vault_item(
    req: VaultCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify submission belongs to user
    submission = db.query(Submission).filter(
        Submission.submission_id == req.submission_id,
        Submission.user_id == user.user_id,
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    vault_item = UserVault(
        vault_id=str(uuid.uuid4()),
        user_id=user.user_id,
        submission_id=req.submission_id,
        vault_name=req.vault_name,
        plot_number=submission.plot_number,
        village_name=submission.village_name,
        risk_level=submission.risk_level,
        notes=req.notes,
        tags=req.tags,
        share_permission=req.share_permission,
    )
    try:
        db.add(vault_item)
        user.total_vault_items = (user.total_vault_items or 0) + 1
        db.commit()
        db.refresh(vault_item)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create vault item")

    return _vault_to_out(vault_item)


@router.get("/", response_model=list[VaultOut])
def list_vault_items(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = db.query(UserVault).filter(
        UserVault.user_id == user.user_id
    ).order_by(UserVault.created_at.desc()).all()
    return [_vault_to_out(v) for v in items]


@router.get("/{vault_id}", response_model=VaultOut)
def get_vault_item(
    vault_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(UserVault).filter(
        UserVault.vault_id == vault_id,
        UserVault.user_id == user.user_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Vault item not found")
    return _vault_to_out(item)


@router.patch("/{vault_id}", response_model=VaultOut)
def update_vault_item(
    vault_id: str,
    req: VaultUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(UserVault).filter(
        UserVault.vault_id == vault_id,
        UserVault.user_id == user.user_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Vault item not found")

    if req.vault_name is not None:
        item.vault_name = req.vault_name
    if req.notes is not None:
        item.notes = req.notes
    if req.tags is not None:
        item.tags = req.tags
    if req.share_permission is not None:
        item.share_permission = req.share_permission

    try:
        db.commit()
        db.refresh(item)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update vault item")

    return _vault_to_out(item)


@router.delete("/{vault_id}")
def delete_vault_item(
    vault_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(UserVault).filter(
        UserVault.vault_id == vault_id,
        UserVault.user_id == user.user_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Vault item not found")

    try:
        db.delete(item)
        user.total_vault_items = max(0, (user.total_vault_items or 1) - 1)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete vault item")

    return {"message": "Vault item deleted"}


def _vault_to_out(v: UserVault) -> VaultOut:
    return VaultOut(
        vault_id=v.vault_id,
        user_id=v.user_id,
        submission_id=v.submission_id,
        vault_name=v.vault_name,
        plot_number=v.plot_number,
        village_name=v.village_name,
        area_bigha=v.area_bigha,
        risk_level=v.risk_level,
        notes=v.notes,
        tags=v.tags,
        is_favorite=v.is_favorite or False,
        share_permission=v.share_permission,
        family_members=v.family_members,
        created_at=v.created_at,
    )
