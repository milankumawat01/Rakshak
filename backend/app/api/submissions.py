"""Submission endpoints: upload, status polling, history."""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session

from app.db import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.submission import Submission
from app.models.extraction import KhatiyanExtraction
from app.models.assessment import RiskAssessment
from app.core.pipeline import run_pipeline
from app.core.ocr.extractor import KhatiyanExtraction as KhatiyanExtractionDataclass
from app.core.risk.scorer import calculate_risk
from app.schemas import (
    SubmissionUploadResponse,
    SubmissionDetailOut,
    SubmissionListItem,
    ExtractionOut,
    AssessmentOut,
    OCRCorrectionRequest,
)

router = APIRouter(prefix="/api/submissions", tags=["submissions"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")


@router.post("/upload", response_model=SubmissionUploadResponse)
def upload_submission(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    village_name: str = Form(...),
    plot_number: str = Form(...),
    seller_name: str = Form(...),
    buyer_tribal: bool = Form(False),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Validate file type
    allowed = {".jpg", ".jpeg", ".png", ".pdf"}
    ext = Path(file.filename or "").suffix.lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed. Use: {allowed}")

    # Save file
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        with open(file_path, "wb") as f:
            content = file.file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # Create submission record
    submission_id = str(uuid.uuid4())
    submission = Submission(
        submission_id=submission_id,
        user_id=user.user_id,
        document_file_path=file_path,
        village_name=village_name,
        plot_number=plot_number,
        seller_name=seller_name,
        buyer_tribal=buyer_tribal,
        submission_status="processing",
        pipeline_step="queued",
        payment_status="pending",
    )
    try:
        db.add(submission)
        user.total_submissions = (user.total_submissions or 0) + 1
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create submission")

    # Trigger pipeline in background
    background_tasks.add_task(run_pipeline, submission_id, db)

    return SubmissionUploadResponse(submission_id=submission_id, status="processing")


@router.get("/{submission_id}", response_model=SubmissionDetailOut)
def get_submission(
    submission_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    submission = db.query(Submission).filter(
        Submission.submission_id == submission_id,
        Submission.user_id == user.user_id,
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Load extraction
    extraction_out = None
    db_extraction = db.query(KhatiyanExtraction).filter(
        KhatiyanExtraction.submission_id == submission_id
    ).first()
    if db_extraction:
        extraction_out = ExtractionOut(
            plot_number=db_extraction.plot_number_extracted,
            plot_confidence=db_extraction.plot_confidence or 0.0,
            khata_number=db_extraction.khata_number_extracted,
            khata_confidence=db_extraction.khata_confidence or 0.0,
            area_bigha=db_extraction.area_bigha_extracted,
            area_confidence=db_extraction.area_confidence or 0.0,
            owner_name=db_extraction.owner_name_extracted,
            owner_confidence=db_extraction.owner_confidence or 0.0,
            surname=db_extraction.surname_extracted,
            surname_confidence=db_extraction.surname_confidence or 0.0,
            tribal_status=db_extraction.tribal_status_extracted,
            tribal_confidence=db_extraction.tribal_confidence or 0.0,
            last_mutation_date=db_extraction.last_mutation_date_extracted,
            mutation_confidence=db_extraction.mutation_confidence or 0.0,
            first_registration_date=db_extraction.first_registration_date_extracted,
            first_reg_confidence=db_extraction.first_reg_confidence or 0.0,
            land_use_type=db_extraction.land_use_type_extracted,
            land_use_confidence=db_extraction.land_use_confidence or 0.0,
            mutation_type=db_extraction.mutation_type_extracted,
            mutation_type_confidence=db_extraction.mutation_type_confidence or 0.0,
            village_name=db_extraction.village_name_extracted,
            extraction_language=db_extraction.extraction_language or "mixed",
            overall_confidence=db_extraction.overall_extraction_confidence or 0.0,
            requires_manual_review=db_extraction.requires_manual_review or False,
            vanshavali=db_extraction.vanshavali_extracted,
            co_heirs=db_extraction.co_heirs_extracted,
            dc_permission_ref=db_extraction.dc_permission_ref_extracted,
            poa_count=db_extraction.poa_count_extracted or 0,
        )

    # Load assessment
    assessment_out = None
    db_assessment = db.query(RiskAssessment).filter(
        RiskAssessment.submission_id == submission_id
    ).first()
    if db_assessment:
        assessment_out = AssessmentOut(
            ocr_confidence_score=db_assessment.ocr_confidence_score,
            tribal_status_score=db_assessment.tribal_status_score,
            dc_permission_score=db_assessment.dc_permission_score,
            forest_risk_score=db_assessment.forest_risk_score,
            mutation_history_score=db_assessment.mutation_history_score,
            khatiyan_age_score=db_assessment.khatiyan_age_score,
            chain_of_title_score=db_assessment.chain_of_title_score,
            poa_abuse_score=db_assessment.poa_abuse_score,
            final_risk_score=db_assessment.final_risk_score,
            risk_level=db_assessment.risk_level,
            recommendation=db_assessment.recommendation,
            flags=db_assessment.flags,
            checklist=db_assessment.checklist,
            discrepancies=db_assessment.discrepancies,
            cnt_compliance=db_assessment.cnt_compliance,
        )

    return SubmissionDetailOut(
        submission_id=submission.submission_id,
        user_id=submission.user_id,
        document_file_path=submission.document_file_path,
        village_name=submission.village_name,
        plot_number=submission.plot_number,
        seller_name=submission.seller_name,
        buyer_tribal=submission.buyer_tribal,
        submission_status=submission.submission_status,
        pipeline_step=submission.pipeline_step,
        risk_score=submission.risk_score,
        risk_level=submission.risk_level,
        payment_status=submission.payment_status,
        created_at=submission.created_at,
        extraction=extraction_out,
        assessment=assessment_out,
    )


@router.patch("/{submission_id}/extraction", response_model=SubmissionDetailOut)
def update_extraction(
    submission_id: str,
    corrections: OCRCorrectionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Apply user corrections to OCR extraction and re-run risk assessment."""
    submission = db.query(Submission).filter(
        Submission.submission_id == submission_id,
        Submission.user_id == user.user_id,
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    db_extraction = db.query(KhatiyanExtraction).filter(
        KhatiyanExtraction.submission_id == submission_id
    ).first()
    if not db_extraction:
        raise HTTPException(status_code=404, detail="Extraction not found")

    # Apply corrections to extraction record
    field_map = {
        "plot_number": "plot_number_extracted",
        "khata_number": "khata_number_extracted",
        "area_bigha": "area_bigha_extracted",
        "owner_name": "owner_name_extracted",
        "surname": "surname_extracted",
        "tribal_status": "tribal_status_extracted",
        "last_mutation_date": "last_mutation_date_extracted",
        "land_use_type": "land_use_type_extracted",
        "mutation_type": "mutation_type_extracted",
        "village_name": "village_name_extracted",
        "dc_permission_ref": "dc_permission_ref_extracted",
    }
    correction_data = corrections.model_dump(exclude_unset=True)
    for field, db_col in field_map.items():
        if field in correction_data:
            setattr(db_extraction, db_col, correction_data[field])

    db.commit()

    # Build extraction dataclass from corrected DB record for re-scoring
    extraction_dc = KhatiyanExtractionDataclass(
        plot_number=db_extraction.plot_number_extracted,
        plot_confidence=db_extraction.plot_confidence or 0.0,
        khata_number=db_extraction.khata_number_extracted,
        khata_confidence=db_extraction.khata_confidence or 0.0,
        area_bigha=db_extraction.area_bigha_extracted,
        area_confidence=db_extraction.area_confidence or 0.0,
        owner_name=db_extraction.owner_name_extracted,
        owner_confidence=db_extraction.owner_confidence or 0.0,
        surname=db_extraction.surname_extracted,
        surname_confidence=db_extraction.surname_confidence or 0.0,
        tribal_status=db_extraction.tribal_status_extracted or "UNKNOWN",
        tribal_confidence=db_extraction.tribal_confidence or 0.0,
        last_mutation_date=db_extraction.last_mutation_date_extracted,
        mutation_confidence=db_extraction.mutation_confidence or 0.0,
        first_registration_date=db_extraction.first_registration_date_extracted,
        first_reg_confidence=db_extraction.first_reg_confidence or 0.0,
        land_use_type=db_extraction.land_use_type_extracted,
        land_use_confidence=db_extraction.land_use_confidence or 0.0,
        mutation_type=db_extraction.mutation_type_extracted,
        mutation_type_confidence=db_extraction.mutation_type_confidence or 0.0,
        village_name=db_extraction.village_name_extracted,
        overall_confidence=db_extraction.overall_extraction_confidence or 0.0,
        dc_permission_ref=db_extraction.dc_permission_ref_extracted,
        poa_count=db_extraction.poa_count_extracted or 0,
    )

    # Re-run risk assessment
    risk_result = calculate_risk(
        extraction=extraction_dc,
        buyer_tribal=submission.buyer_tribal,
        village_name=submission.village_name,
        plot_number=submission.plot_number,
        seller_name=submission.seller_name,
    )

    # Update or create assessment record
    import uuid as _uuid
    db_assessment = db.query(RiskAssessment).filter(
        RiskAssessment.submission_id == submission_id
    ).first()
    if db_assessment:
        for key, val in risk_result.items():
            if hasattr(db_assessment, key):
                setattr(db_assessment, key, val)
    else:
        db_assessment = RiskAssessment(
            assessment_id=str(_uuid.uuid4()),
            submission_id=submission_id,
            **{k: v for k, v in risk_result.items() if hasattr(RiskAssessment, k)},
        )
        db.add(db_assessment)

    # Update submission-level fields
    submission.risk_score = risk_result["final_risk_score"]
    submission.risk_level = risk_result["risk_level"]
    db.commit()

    # Return full detail (reuse get_submission logic)
    return get_submission(submission_id, user, db)


@router.delete("/{submission_id}", status_code=204)
def delete_submission(
    submission_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    submission = db.query(Submission).filter(
        Submission.submission_id == submission_id,
        Submission.user_id == user.user_id,
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    db.query(KhatiyanExtraction).filter(KhatiyanExtraction.submission_id == submission_id).delete()
    db.query(RiskAssessment).filter(RiskAssessment.submission_id == submission_id).delete()
    db.delete(submission)
    db.commit()


@router.get("/", response_model=list[SubmissionListItem])
def list_submissions(
    q: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Submission).filter(Submission.user_id == user.user_id)
    if q:
        pattern = f"%{q}%"
        query = query.filter(
            (Submission.village_name.ilike(pattern))
            | (Submission.plot_number.ilike(pattern))
            | (Submission.seller_name.ilike(pattern))
        )
    submissions = query.order_by(Submission.created_at.desc()).all()

    return [
        SubmissionListItem(
            submission_id=s.submission_id,
            village_name=s.village_name,
            plot_number=s.plot_number,
            submission_status=s.submission_status,
            risk_level=s.risk_level,
            risk_score=s.risk_score,
            created_at=s.created_at,
        )
        for s in submissions
    ]
