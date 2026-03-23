"""Orchestration pipeline: OCR -> Risk Scoring -> Store results."""

import uuid
from sqlalchemy.orm import Session

from app.core.ocr.extractor import extract_khatiyan
from app.core.risk.scorer import calculate_risk
from app.models.submission import Submission
from app.models.extraction import KhatiyanExtraction
from app.models.assessment import RiskAssessment
from app.models.vault import UserVault


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
            khata_confidence=extraction.khata_confidence,
            area_bigha_extracted=extraction.area_bigha,
            area_confidence=extraction.area_confidence,
            owner_name_extracted=extraction.owner_name,
            owner_confidence=extraction.owner_confidence,
            surname_extracted=extraction.surname,
            surname_confidence=extraction.surname_confidence,
            tribal_status_extracted=extraction.tribal_status,
            tribal_confidence=extraction.tribal_confidence,
            last_mutation_date_extracted=extraction.last_mutation_date,
            mutation_confidence=extraction.mutation_confidence,
            first_registration_date_extracted=extraction.first_registration_date,
            first_reg_confidence=extraction.first_reg_confidence,
            land_use_type_extracted=extraction.land_use_type,
            land_use_confidence=extraction.land_use_confidence,
            mutation_type_extracted=extraction.mutation_type,
            mutation_type_confidence=extraction.mutation_type_confidence,
            village_name_extracted=extraction.village_name,
            extraction_language=extraction.extraction_language,
            overall_extraction_confidence=extraction.overall_confidence,
            requires_manual_review=extraction.requires_manual_review,
            raw_text=extraction.raw_text,
            vanshavali_extracted=extraction.vanshavali,
            co_heirs_extracted=extraction.co_heirs,
            dc_permission_ref_extracted=extraction.dc_permission_ref,
            poa_count_extracted=extraction.poa_count,
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
            seller_name=submission.seller_name,
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
            poa_abuse_score=risk_result["poa_abuse_score"],
            final_risk_score=risk_result["final_risk_score"],
            risk_level=risk_result["risk_level"],
            recommendation=risk_result["recommendation"],
            flags=risk_result["flags"],
            checklist=risk_result["checklist"],
            discrepancies=risk_result["discrepancies"],
            cnt_compliance=risk_result["cnt_compliance"],
        )
        db.add(db_assessment)

        # Step 3: Update submission with results
        submission.risk_score = risk_result["final_risk_score"]
        submission.risk_level = risk_result["risk_level"]
        submission.submission_status = "completed"
        submission.pipeline_step = "completed"
        db.commit()

        # Step 4: Auto-create vault entry so History links work
        existing_vault = db.query(UserVault).filter(
            UserVault.submission_id == submission_id,
            UserVault.user_id == submission.user_id,
        ).first()
        if not existing_vault:
            # Prefer submission fields, fall back to OCR extraction
            village = submission.village_name or extraction.village_name or "Property"
            plot = submission.plot_number or extraction.plot_number or "—"
            vault_name = f"{village} - Plot {plot}"
            vault_item = UserVault(
                vault_id=str(uuid.uuid4()),
                user_id=submission.user_id,
                submission_id=submission_id,
                vault_name=vault_name,
                property_name=vault_name,
                plot_number=plot if plot != "—" else None,
                village_name=village if village != "Property" else None,
                village=village if village != "Property" else None,
                risk_level=risk_result["risk_level"],
                khata_number=extraction.khata_number,
                area_bigha=extraction.area_bigha,
            )
            db.add(vault_item)
            db.commit()

        # Also backfill submission fields from OCR if they were empty
        if not submission.village_name and extraction.village_name:
            submission.village_name = extraction.village_name
        if not submission.plot_number and extraction.plot_number:
            submission.plot_number = extraction.plot_number
        if submission.village_name or submission.plot_number:
            db.commit()

    except Exception as e:
        print(f"[Pipeline] Error for submission {submission_id}: {e}")
        try:
            submission.submission_status = "failed"
            submission.pipeline_step = f"error: {str(e)[:200]}"
            db.commit()
        except Exception:
            db.rollback()
