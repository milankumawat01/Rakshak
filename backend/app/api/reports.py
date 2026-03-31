"""Public report endpoints — no authentication required."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.submission import Submission
from app.models.extraction import KhatiyanExtraction
from app.models.assessment import RiskAssessment
from app.schemas import SubmissionDetailOut, ExtractionOut, AssessmentOut

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/{submission_id}/public", response_model=SubmissionDetailOut)
def get_public_report(submission_id: str, db: Session = Depends(get_db)):
    """Get a submission report without authentication (public shareable link)."""
    submission = db.query(Submission).filter(
        Submission.submission_id == submission_id,
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Report not found")

    if submission.submission_status != "completed":
        raise HTTPException(status_code=404, detail="Report not ready yet")

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
        document_file_path=None,  # Don't expose file path publicly
        village_name=submission.village_name,
        plot_number=submission.plot_number,
        seller_name=submission.seller_name,
        buyer_tribal=submission.buyer_tribal,
        submission_status=submission.submission_status,
        pipeline_step=submission.pipeline_step,
        risk_score=submission.risk_score,
        risk_level=submission.risk_level,
        payment_status=None,  # Don't expose payment info publicly
        created_at=submission.created_at,
        extraction=extraction_out,
        assessment=assessment_out,
    )
