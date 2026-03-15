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
from app.schemas import (
    SubmissionUploadResponse,
    SubmissionDetailOut,
    SubmissionListItem,
    ExtractionOut,
    AssessmentOut,
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
            tribal_status=db_extraction.tribal_status_extracted,
            tribal_confidence=db_extraction.tribal_confidence or 0.0,
            last_mutation_date=db_extraction.last_mutation_date_extracted,
            mutation_confidence=db_extraction.mutation_confidence or 0.0,
            village_name=db_extraction.village_name_extracted,
            extraction_language=db_extraction.extraction_language or "mixed",
            overall_confidence=db_extraction.overall_extraction_confidence or 0.0,
            requires_manual_review=db_extraction.requires_manual_review or False,
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
            final_risk_score=db_assessment.final_risk_score,
            risk_level=db_assessment.risk_level,
            recommendation=db_assessment.recommendation,
            flags=db_assessment.flags,
            checklist=db_assessment.checklist,
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


@router.get("/", response_model=list[SubmissionListItem])
def list_submissions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    submissions = db.query(Submission).filter(
        Submission.user_id == user.user_id
    ).order_by(Submission.created_at.desc()).all()

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
