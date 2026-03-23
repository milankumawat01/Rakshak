"""Vault CRUD endpoints — property portfolio management."""

import os
import uuid
import random
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.submission import Submission
from app.models.vault import UserVault, VaultDocument, VaultValueHistory
from app.schemas import (
    VaultCreateRequest, VaultUpdateRequest, VaultOut, VaultSummaryOut,
    DocumentOut, ValueHistoryOut, ShareRequest,
)

router = APIRouter(prefix="/api/vault", tags=["vault"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
MAX_FILE_SIZE_MB = 10


# ─── Helpers ───────────────────────────────────────────────────────────────────

def _vault_to_out(v: UserVault, docs: list[VaultDocument] | None = None) -> VaultOut:
    return VaultOut(
        vault_id=v.vault_id,
        user_id=v.user_id,
        submission_id=v.submission_id,
        property_name=v.property_name or v.vault_name,
        vault_name=v.vault_name,
        plot_number=v.plot_number,
        khata_number=v.khata_number,
        area_value=v.area_value or v.area_bigha,
        area_unit=v.area_unit or ("bigha" if v.area_bigha else None),
        area_bigha=v.area_bigha,
        land_type=v.land_type,
        village=v.village or v.village_name,
        village_name=v.village_name,
        block=v.block,
        district=v.district,
        state=v.state,
        pin_code=v.pin_code,
        latitude=v.latitude,
        longitude=v.longitude,
        purchase_price=v.purchase_price,
        purchase_date=v.purchase_date,
        circle_rate_at_purchase=v.circle_rate_at_purchase,
        current_market_value=v.current_market_value,
        current_circle_rate=v.current_circle_rate,
        previous_owner=v.previous_owner,
        registration_date=v.registration_date,
        mutation_status=v.mutation_status,
        stamp_duty_paid=v.stamp_duty_paid,
        risk_level=v.risk_level,
        notes=v.notes,
        tags=v.tags,
        is_favorite=v.is_favorite or False,
        share_permission=v.share_permission,
        family_members=v.family_members,
        documents=[_doc_to_out(d) for d in (docs or [])],
        created_at=v.created_at,
        updated_at=v.updated_at,
    )


def _doc_to_out(d: VaultDocument) -> DocumentOut:
    return DocumentOut(
        doc_id=d.doc_id,
        vault_id=d.vault_id,
        category=d.category,
        file_name=d.file_name,
        file_url=d.file_url,
        file_size_mb=d.file_size_mb,
        file_type=d.file_type,
        uploaded_at=d.uploaded_at,
    )


def _generate_value_history(vault_id: str, purchase_price: float, purchase_date: datetime, db: Session):
    """Generate mock yearly value history from purchase date to now."""
    # Clear old history
    db.query(VaultValueHistory).filter(VaultValueHistory.vault_id == vault_id).delete()

    start_year = purchase_date.year
    end_year = datetime.utcnow().year
    value = purchase_price
    circle_rate = purchase_price * 0.7  # mock: circle rate starts at 70% of purchase price

    for year in range(start_year, end_year + 1):
        db.add(VaultValueHistory(
            id=str(uuid.uuid4()),
            vault_id=vault_id,
            year=year,
            estimated_value=round(value, 2),
            circle_rate=round(circle_rate, 2),
            calculated_at=datetime.utcnow(),
        ))
        # Apply growth for next year
        growth = random.uniform(0.06, 0.10)
        circle_growth = random.uniform(0.04, 0.07)
        value *= (1 + growth)
        circle_rate *= (1 + circle_growth)

    # Update current market value on the vault item
    vault_item = db.query(UserVault).filter(UserVault.vault_id == vault_id).first()
    if vault_item:
        vault_item.current_market_value = round(value / (1 + growth), 2)  # last computed value
        vault_item.current_circle_rate = round(circle_rate / (1 + circle_growth), 2)


# ─── Summary (must be before /{vault_id} to avoid route conflict) ─────────────

@router.get("/summary", response_model=VaultSummaryOut)
def get_vault_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = db.query(UserVault).filter(UserVault.user_id == user.user_id).all()

    total = len(items)
    portfolio_value = sum(v.current_market_value or 0 for v in items)
    total_cost = sum(v.purchase_price or 0 for v in items)
    total_profit = portfolio_value - total_cost if portfolio_value > 0 else 0.0
    attention = sum(1 for v in items if v.risk_level in ("RED", "ORANGE"))

    return VaultSummaryOut(
        total_properties=total,
        portfolio_value=round(portfolio_value, 2),
        total_profit=round(total_profit, 2),
        attention_count=attention,
    )


# ─── CRUD ──────────────────────────────────────────────────────────────────────

@router.post("/", response_model=VaultOut)
def create_vault_item(
    req: VaultCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vault_id = str(uuid.uuid4())
    name = req.property_name or req.vault_name

    if req.submission_id:
        # Return existing vault item if already created (e.g. by pipeline)
        existing = db.query(UserVault).filter(
            UserVault.submission_id == req.submission_id,
            UserVault.user_id == user.user_id,
        ).first()
        if existing:
            docs = db.query(VaultDocument).filter(VaultDocument.vault_id == existing.vault_id).all()
            return _vault_to_out(existing, docs)

        # Create from existing submission
        submission = db.query(Submission).filter(
            Submission.submission_id == req.submission_id,
            Submission.user_id == user.user_id,
        ).first()
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")

        vault_item = UserVault(
            vault_id=vault_id,
            user_id=user.user_id,
            submission_id=req.submission_id,
            property_name=name or f"Property — {submission.village_name}",
            vault_name=name or f"Property — {submission.village_name}",
            plot_number=req.plot_number or submission.plot_number,
            village_name=submission.village_name,
            village=req.village or submission.village_name,
            risk_level=submission.risk_level,
            notes=req.notes,
            tags=req.tags,
            share_permission=req.share_permission,
        )
    else:
        # Manual creation (no submission)
        if not name:
            raise HTTPException(status_code=400, detail="property_name is required for manual creation")

        vault_item = UserVault(
            vault_id=vault_id,
            user_id=user.user_id,
            property_name=name,
            vault_name=name,
            plot_number=req.plot_number,
            khata_number=req.khata_number,
            area_value=req.area_value,
            area_unit=req.area_unit,
            area_bigha=req.area_value if req.area_unit == "bigha" else None,
            land_type=req.land_type,
            village=req.village,
            village_name=req.village,
            block=req.block,
            district=req.district,
            state=req.state or "Jharkhand",
            pin_code=req.pin_code,
            latitude=req.latitude,
            longitude=req.longitude,
            purchase_price=req.purchase_price,
            purchase_date=req.purchase_date,
            circle_rate_at_purchase=req.circle_rate_at_purchase,
            previous_owner=req.previous_owner,
            registration_date=req.registration_date,
            mutation_status=req.mutation_status,
            stamp_duty_paid=req.stamp_duty_paid,
            notes=req.notes,
            tags=req.tags,
            share_permission=req.share_permission,
        )

    try:
        db.add(vault_item)
        user.total_vault_items = (user.total_vault_items or 0) + 1
        db.flush()

        # Generate value history if purchase data is available
        if vault_item.purchase_price and vault_item.purchase_date:
            _generate_value_history(vault_id, vault_item.purchase_price, vault_item.purchase_date, db)

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

    # Batch-load documents for all vault items
    vault_ids = [v.vault_id for v in items]
    docs = db.query(VaultDocument).filter(VaultDocument.vault_id.in_(vault_ids)).all() if vault_ids else []
    docs_by_vault = {}
    for d in docs:
        docs_by_vault.setdefault(d.vault_id, []).append(d)

    return [_vault_to_out(v, docs_by_vault.get(v.vault_id, [])) for v in items]


@router.get("/{vault_id}", response_model=VaultOut)
def get_vault_item(
    vault_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Try vault_id first, then fall back to submission_id lookup
    item = db.query(UserVault).filter(
        UserVault.vault_id == vault_id,
        UserVault.user_id == user.user_id,
    ).first()
    if not item:
        item = db.query(UserVault).filter(
            UserVault.submission_id == vault_id,
            UserVault.user_id == user.user_id,
        ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Vault item not found")

    docs = db.query(VaultDocument).filter(VaultDocument.vault_id == item.vault_id).all()
    return _vault_to_out(item, docs)


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

    # Apply all non-None fields
    update_fields = [
        "property_name", "plot_number", "khata_number", "area_value", "area_unit",
        "land_type", "village", "block", "district", "state", "pin_code",
        "latitude", "longitude", "purchase_price", "purchase_date",
        "circle_rate_at_purchase", "previous_owner", "registration_date",
        "mutation_status", "stamp_duty_paid", "notes", "tags", "share_permission",
    ]
    for field in update_fields:
        val = getattr(req, field, None)
        if val is not None:
            setattr(item, field, val)

    # Keep backward-compat columns in sync
    if req.property_name is not None:
        item.vault_name = req.property_name
    if req.vault_name is not None:
        item.vault_name = req.vault_name
        if not req.property_name:
            item.property_name = req.vault_name
    if req.village is not None:
        item.village_name = req.village
    if req.area_value is not None and (req.area_unit or item.area_unit) == "bigha":
        item.area_bigha = req.area_value

    regenerate_history = False
    if req.purchase_price is not None or req.purchase_date is not None:
        regenerate_history = True

    try:
        if regenerate_history and item.purchase_price and item.purchase_date:
            _generate_value_history(vault_id, item.purchase_price, item.purchase_date, db)
        db.commit()
        db.refresh(item)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update vault item")

    docs = db.query(VaultDocument).filter(VaultDocument.vault_id == vault_id).all()
    return _vault_to_out(item, docs)


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
        # Delete related records
        db.query(VaultDocument).filter(VaultDocument.vault_id == vault_id).delete()
        db.query(VaultValueHistory).filter(VaultValueHistory.vault_id == vault_id).delete()
        db.delete(item)
        user.total_vault_items = max(0, (user.total_vault_items or 1) - 1)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete vault item")

    return {"message": "Vault item deleted"}


# ─── Documents ─────────────────────────────────────────────────────────────────

@router.post("/{vault_id}/documents", response_model=DocumentOut)
async def upload_vault_document(
    vault_id: str,
    category: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify ownership
    item = db.query(UserVault).filter(
        UserVault.vault_id == vault_id,
        UserVault.user_id == user.user_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Vault item not found")

    # Validate category
    valid_categories = {"registration", "stamp", "mutation", "khatiyan", "map", "other"}
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {valid_categories}")

    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, and PDF files are allowed")

    # Read and check file size
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_FILE_SIZE_MB}MB limit")

    # Save to disk
    doc_dir = os.path.join(UPLOAD_DIR, "vault_docs", vault_id)
    os.makedirs(doc_dir, exist_ok=True)
    file_id = str(uuid.uuid4())
    saved_name = f"{file_id}{ext}"
    file_path = os.path.join(doc_dir, saved_name)

    with open(file_path, "wb") as f:
        f.write(content)

    # Create DB record
    doc = VaultDocument(
        doc_id=file_id,
        vault_id=vault_id,
        category=category,
        file_name=file.filename or saved_name,
        file_url=f"/uploads/vault_docs/{vault_id}/{saved_name}",
        file_size_mb=round(size_mb, 2),
        file_type=ext.lstrip("."),
        uploaded_at=datetime.utcnow(),
    )
    try:
        db.add(doc)
        db.commit()
        db.refresh(doc)
    except Exception:
        db.rollback()
        # Clean up file on DB failure
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail="Failed to save document")

    return _doc_to_out(doc)


@router.delete("/{vault_id}/documents/{doc_id}")
def delete_vault_document(
    vault_id: str,
    doc_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify ownership
    item = db.query(UserVault).filter(
        UserVault.vault_id == vault_id,
        UserVault.user_id == user.user_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Vault item not found")

    doc = db.query(VaultDocument).filter(
        VaultDocument.doc_id == doc_id,
        VaultDocument.vault_id == vault_id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file from disk
    file_path = os.path.join(UPLOAD_DIR, doc.file_url.lstrip("/uploads/"))
    if os.path.exists(file_path):
        os.remove(file_path)

    try:
        db.delete(doc)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete document")

    return {"message": "Document deleted"}


# ─── Valuation ─────────────────────────────────────────────────────────────────

@router.get("/{vault_id}/valuation", response_model=list[ValueHistoryOut])
def get_vault_valuation(
    vault_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify ownership
    item = db.query(UserVault).filter(
        UserVault.vault_id == vault_id,
        UserVault.user_id == user.user_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Vault item not found")

    history = db.query(VaultValueHistory).filter(
        VaultValueHistory.vault_id == vault_id
    ).order_by(VaultValueHistory.year).all()

    return [
        ValueHistoryOut(
            id=h.id,
            vault_id=h.vault_id,
            year=h.year,
            estimated_value=h.estimated_value,
            circle_rate=h.circle_rate,
            calculated_at=h.calculated_at,
        )
        for h in history
    ]


# ─── Share ─────────────────────────────────────────────────────────────────────

@router.post("/{vault_id}/share")
def share_vault_item(
    vault_id: str,
    req: ShareRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(UserVault).filter(
        UserVault.vault_id == vault_id,
        UserVault.user_id == user.user_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Vault item not found")

    # Update sharing
    item.share_permission = req.permission
    members = item.family_members or []
    if req.phone not in members:
        members.append(req.phone)
    item.family_members = members

    try:
        db.commit()
        db.refresh(item)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update sharing")

    return {"message": "Property shared", "family_members": item.family_members}
