"""Pydantic request/response models."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# --- Auth ---

class SendOTPRequest(BaseModel):
    phone: str = Field(..., example="+919876543210")


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str


# --- Submissions ---

class SubmissionUploadResponse(BaseModel):
    submission_id: str
    status: str = "processing"


class ExtractionOut(BaseModel):
    plot_number: Optional[str] = None
    plot_confidence: float = 0.0
    khata_number: Optional[str] = None
    khata_confidence: float = 0.0
    area_bigha: Optional[float] = None
    area_confidence: float = 0.0
    owner_name: Optional[str] = None
    owner_confidence: float = 0.0
    surname: Optional[str] = None
    surname_confidence: float = 0.0
    tribal_status: Optional[str] = None
    tribal_confidence: float = 0.0
    last_mutation_date: Optional[str] = None
    mutation_confidence: float = 0.0
    first_registration_date: Optional[str] = None
    first_reg_confidence: float = 0.0
    land_use_type: Optional[str] = None
    land_use_confidence: float = 0.0
    mutation_type: Optional[str] = None
    mutation_type_confidence: float = 0.0
    village_name: Optional[str] = None
    extraction_language: str = "mixed"
    overall_confidence: float = 0.0
    requires_manual_review: bool = True
    vanshavali: Optional[list] = None
    co_heirs: Optional[list] = None
    dc_permission_ref: Optional[str] = None
    poa_count: int = 0


class AssessmentOut(BaseModel):
    ocr_confidence_score: Optional[int] = None
    tribal_status_score: Optional[int] = None
    dc_permission_score: Optional[int] = None
    forest_risk_score: Optional[int] = None
    mutation_history_score: Optional[int] = None
    khatiyan_age_score: Optional[int] = None
    chain_of_title_score: Optional[int] = None
    poa_abuse_score: Optional[int] = None
    final_risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    recommendation: Optional[str] = None
    flags: Optional[list] = None
    checklist: Optional[dict] = None
    discrepancies: Optional[list] = None
    cnt_compliance: Optional[dict] = None


class SubmissionDetailOut(BaseModel):
    submission_id: str
    user_id: str
    document_file_path: Optional[str] = None
    village_name: Optional[str] = None
    plot_number: Optional[str] = None
    seller_name: Optional[str] = None
    buyer_tribal: bool = False
    submission_status: Optional[str] = None
    pipeline_step: Optional[str] = None
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    payment_status: Optional[str] = None
    created_at: Optional[datetime] = None
    extraction: Optional[ExtractionOut] = None
    assessment: Optional[AssessmentOut] = None


class SubmissionListItem(BaseModel):
    submission_id: str
    village_name: Optional[str] = None
    plot_number: Optional[str] = None
    submission_status: Optional[str] = None
    risk_level: Optional[str] = None
    risk_score: Optional[int] = None
    created_at: Optional[datetime] = None


# --- OCR Correction ---

class OCRCorrectionRequest(BaseModel):
    plot_number: Optional[str] = None
    khata_number: Optional[str] = None
    area_bigha: Optional[float] = None
    owner_name: Optional[str] = None
    surname: Optional[str] = None
    tribal_status: Optional[str] = None
    last_mutation_date: Optional[str] = None
    land_use_type: Optional[str] = None
    mutation_type: Optional[str] = None
    village_name: Optional[str] = None
    dc_permission_ref: Optional[str] = None


# --- Vault ---

class VaultCreateRequest(BaseModel):
    submission_id: Optional[str] = None
    property_name: Optional[str] = None
    vault_name: Optional[str] = None  # backward compat alias for property_name
    plot_number: Optional[str] = None
    khata_number: Optional[str] = None
    area_value: Optional[float] = None
    area_unit: Optional[str] = "bigha"
    land_type: Optional[str] = None
    village: Optional[str] = None
    block: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = "Jharkhand"
    pin_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    purchase_price: Optional[float] = None
    purchase_date: Optional[datetime] = None
    circle_rate_at_purchase: Optional[float] = None
    previous_owner: Optional[str] = None
    registration_date: Optional[datetime] = None
    mutation_status: Optional[str] = None
    stamp_duty_paid: Optional[float] = None
    notes: Optional[str] = None
    tags: Optional[list] = None
    share_permission: str = "private"


class VaultUpdateRequest(BaseModel):
    property_name: Optional[str] = None
    vault_name: Optional[str] = None
    plot_number: Optional[str] = None
    khata_number: Optional[str] = None
    area_value: Optional[float] = None
    area_unit: Optional[str] = None
    land_type: Optional[str] = None
    village: Optional[str] = None
    block: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    purchase_price: Optional[float] = None
    purchase_date: Optional[datetime] = None
    circle_rate_at_purchase: Optional[float] = None
    previous_owner: Optional[str] = None
    registration_date: Optional[datetime] = None
    mutation_status: Optional[str] = None
    stamp_duty_paid: Optional[float] = None
    notes: Optional[str] = None
    tags: Optional[list] = None
    share_permission: Optional[str] = None


class DocumentOut(BaseModel):
    doc_id: str
    vault_id: str
    category: str
    file_name: str
    file_url: str
    file_size_mb: Optional[float] = None
    file_type: Optional[str] = None
    uploaded_at: Optional[datetime] = None


class ValueHistoryOut(BaseModel):
    id: str
    vault_id: str
    year: int
    estimated_value: Optional[float] = None
    circle_rate: Optional[float] = None
    calculated_at: Optional[datetime] = None


class VaultOut(BaseModel):
    vault_id: str
    user_id: str
    submission_id: Optional[str] = None
    property_name: Optional[str] = None
    vault_name: Optional[str] = None
    plot_number: Optional[str] = None
    khata_number: Optional[str] = None
    area_value: Optional[float] = None
    area_unit: Optional[str] = None
    area_bigha: Optional[float] = None
    land_type: Optional[str] = None
    village: Optional[str] = None
    village_name: Optional[str] = None
    block: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    purchase_price: Optional[float] = None
    purchase_date: Optional[datetime] = None
    circle_rate_at_purchase: Optional[float] = None
    current_market_value: Optional[float] = None
    current_circle_rate: Optional[float] = None
    previous_owner: Optional[str] = None
    registration_date: Optional[datetime] = None
    mutation_status: Optional[str] = None
    stamp_duty_paid: Optional[float] = None
    risk_level: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[list] = None
    is_favorite: bool = False
    share_permission: Optional[str] = None
    family_members: Optional[list] = None
    documents: list[DocumentOut] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class VaultSummaryOut(BaseModel):
    total_properties: int = 0
    portfolio_value: float = 0.0
    total_profit: float = 0.0
    attention_count: int = 0


class ShareRequest(BaseModel):
    phone: str
    permission: str = "family"


# --- Payment ---

class CreateOrderRequest(BaseModel):
    submission_id: str


class CreateOrderResponse(BaseModel):
    order_id: Optional[str] = None
    amount: Optional[int] = None
    demo_mode: bool = False
    skip_payment: bool = False


class PaymentHistoryOut(BaseModel):
    payment_id: str
    submission_id: Optional[str] = None
    payment_type: Optional[str] = None
    payment_amount: Optional[float] = None
    payment_status: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    payment_date: Optional[datetime] = None
