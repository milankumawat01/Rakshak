"""Orchestration pipeline: OCR -> Risk Scoring -> Store results."""

import uuid
from sqlalchemy.orm import Session

from app.core.ocr.extractor import extract_khatiyan
from app.core.risk.scorer import calculate_risk
from app.models.submission import Submission
from app.models.extraction import KhatiyanExtraction
from app.models.assessment import RiskAssessment


def run_pipeline(submission_id: str, db: Session) -> None:
    """
    Run the full verification pipeline for a submission.
    Called as a BackgroundTask from the upload endpoint.

    Steps:
      1. OCR extraction (Tesseract + Gemini fallback)
      2. Risk scoring (7 components + hard override)
      3. Store extraction + assessment in DB
      4. Update submission status
    """
    submission = db.query(Submission).filter(
        Submission.submission_id == submission_id
    ).first()

    if not submission:
        return

    try:
        # Step 1: OCR Extraction
        submission.pipeline_step = "ocr_extraction"
        db.commit()

        extraction = extract_khatiyan(submission.document_file_path)

        # Store extraction in DB
        db_extraction = KhatiyanExtraction(
            extraction_id=str(uuid.uuid4()),
            submission_id=submission_id,
            ocr_engine_used=extraction.ocr_engine_used,
            plot_number_extracted=extraction.plot_number,
            plot_confidence=extraction.plot_confidence,
            khata_number_extracted=extraction.khata_number,
            area_bigha_extracted=extraction.area_bigha,
            owner_name_extracted=extraction.owner_name,
            tribal_status_extracted=extraction.tribal_status,
            last_mutation_date_extracted=extraction.last_mutation_date,
            overall_extraction_confidence=extraction.overall_confidence,
            requires_manual_review=extraction.requires_manual_review,
            raw_text=extraction.raw_text,
        )
        db.add(db_extraction)
        db.commit()

        # Step 2: Risk Scoring
        submission.pipeline_step = "risk_scoring"
        db.commit()

        risk_result = calculate_risk(
            extraction=extraction,
            buyer_tribal=submission.buyer_tribal,
            village_name=submission.village_name,
            plot_number=submission.plot_number,
        )

        # Store assessment in DB
        db_assessment = RiskAssessment(
            assessment_id=str(uuid.uuid4()),
            submission_id=submission_id,
            ocr_confidence_score=risk_result["ocr_confidence_score"],
            tribal_status_score=risk_result["tribal_status_score"],
            dc_permission_score=risk_result["dc_permission_score"],
            forest_risk_score=risk_result["forest_risk_score"],
            mutation_history_score=risk_result["mutation_history_score"],
            khatiyan_age_score=risk_result["khatiyan_age_score"],
            chain_of_title_score=risk_result["chain_of_title_score"],
            final_risk_score=risk_result["final_risk_score"],
            risk_level=risk_result["risk_level"],
            recommendation=risk_result["recommendation"],
            flags=risk_result["flags"],
            checklist=risk_result["checklist"],
        )
        db.add(db_assessment)

        # Step 3: Update submission with results
        submission.risk_score = risk_result["final_risk_score"]
        submission.risk_level = risk_result["risk_level"]
        submission.submission_status = "completed"
        submission.pipeline_step = "completed"
        db.commit()

    except Exception as e:
        print(f"[Pipeline] Error for submission {submission_id}: {e}")
        try:
            submission.submission_status = "failed"
            submission.pipeline_step = f"error: {str(e)[:200]}"
            db.commit()
        except Exception:
            db.rollback()
