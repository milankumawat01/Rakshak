# Align Rakshak Codebase with Technical Feasibility Report

## Context
The Bhomi Rakshak Technical Feasibility Report outlines the ideal architecture, OCR pipeline, risk scoring, GIS integration, and revenue features. The current codebase (FastAPI + React) has a solid foundation — hybrid OCR, 8-component risk scoring, vault portfolio, auth, payments — but has significant gaps in image pre-processing, GIS/maps, security, and scalability. This plan closes the most impactful gaps in priority order.

---

## Phase 1: OCR Pre-processing Improvements (Highest Priority)
*Every downstream feature depends on extraction quality. These changes target a 15-25% accuracy improvement.*

### 1A. Binarisation + Noise Reduction
- **File:** `backend/app/core/ocr/extractor.py` — `_preprocess_image()`
- Add `opencv-python-headless` to `backend/requirements.txt`
- After grayscale conversion, add: Gaussian blur (3x3) → Otsu binarisation (default) → Sauvola adaptive threshold (fallback for uneven lighting)
- Replace current `ImageOps.autocontrast` with proper OpenCV pipeline

### 1B. Resolution Upscaling for Low-DPI Images
- **File:** `backend/app/core/ocr/extractor.py` — `_preprocess_image()`
- Before max_dim downscale check, add min-resolution check
- If image width < 2480px (below ~300 DPI for A4), upscale with `PIL.Image.resize(LANCZOS)`

### 1C. Shirorekha (Headline) Detection & Removal
- **File:** `backend/app/core/ocr/extractor.py` — new `_remove_shirorekha()` function
- Compute horizontal projection profile of binarised image
- Identify shirorekha rows (top 5% of projection values)
- Thin using `cv2.morphologyEx` with horizontal kernel (~3px)

### 1D. Dual-Engine Comparison (Agreement Scoring)
- **File:** `backend/app/core/ocr/extractor.py` — `extract_khatiyan()`
- Change from fallback-only to always running both engines (when API key available)
- Compute per-field agreement score (matching fields / total fields)
- New confidence formula: `(agreement * 0.6) + (tesseract_conf * 0.2) + (vision_conf * 0.2)`
- Add `OCR_DUAL_ENGINE=true|false` env var (default `false` for dev cost savings)

### 1E. Fuzzy Village Name Matching
- Add `thefuzz[speedup]` to `backend/requirements.txt`
- **File:** `backend/app/core/risk/scorer.py` — replace `_fuzzy_match()` token-overlap with `fuzz.token_sort_ratio()`
- New utility: `backend/app/core/fuzzy_match.py` — village name normalization (transliteration variants)

---

## Phase 2: Risk Scoring Alignment + GIS/Map Integration

### 2A. Realign Risk Scoring Weights
- **File:** `backend/app/core/risk/scorer.py` — `WEIGHTS` dict

| Component | Current | New | Rationale |
|-----------|---------|-----|-----------|
| OCR Confidence | 10% | 15% | OCR quality affects all other scores |
| Tribal Status | 25% | 20% | Hard override handles critical case; 25% over-weights non-override |
| DC Permission | 15% | 10% | Currently mock (always 100); revisit when real API integrated |
| Forest Risk | 15% | 20% | Forest encroachment is serious legal issue in Jharkhand |
| Mutation History | 10% | 10% | Aligned |
| Khatiyan Age | 5% | 10% | Old un-mutated records are real risk signal |
| Chain of Title | 10% | 10% | Aligned |
| PoA Abuse | 10% | 5% | Report omits it, but PoA fraud is real — keep at reduced weight |

### 2B. Interactive Map with Leaflet.js
- Add `leaflet` + `react-leaflet` to `frontend/package.json`
- **New file:** `frontend/src/components/PropertyMap.jsx` — Leaflet map with OpenStreetMap tiles
- **Modify:** `frontend/src/components/PropertyOverviewTab.jsx` — embed PropertyMap
- **Modify:** `frontend/src/pages/VaultDetail.jsx` — pass lat/lng
- **Modify:** `frontend/src/pages/Verify.jsx` — small map in results step

### 2C. Geocoding for Village Names
- **New file:** `backend/app/core/geocoding.py` — Nominatim API wrapper (free, rate-limited 1 req/sec)
- **Modify:** `backend/app/core/pipeline.py` — auto-geocode village after OCR extraction

### 2D. Forest Boundary Overlay
- **New file:** `frontend/public/data/jharkhand-forests.geojson` — static forest boundaries from open data
- **Modify:** `PropertyMap.jsx` — render GeoJSON as semi-transparent red overlay
- Add `shapely` to `backend/requirements.txt`
- **Modify:** `backend/app/core/risk/mock_govt.py` — replace `check_forest_boundary()` with real point-in-polygon check using shapely

---

## Phase 3: Security Hardening + Testing Foundation

### 3A. Audit Logging
- **New files:** `backend/app/models/audit.py` + `backend/app/core/audit.py`
- AuditLog model: `id, user_id, action, resource_type, resource_id, details (JSON), ip_address, timestamp`
- New Alembic migration
- Add audit calls in `backend/app/api/submissions.py` and `backend/app/api/vault.py`

### 3B. Environment Security
- Verify `.env` is in `.gitignore`
- Create `.env.example` with placeholder values and comments
- Document production deployment requirements (PostgreSQL, HTTPS via reverse proxy, secure JWT secret)

### 3C. Test Foundation
- **New files:**
  - `backend/tests/conftest.py` — fixtures (in-memory SQLite, TestClient, mock user)
  - `backend/tests/test_risk_scorer.py` — unit tests for each `_score_*` function, weight sum, hard override, CNT compliance
  - `backend/tests/test_ocr_extractor.py` — test regex patterns, `_merge_extractions`, `_preprocess_image`
  - `backend/tests/test_tribal_surnames.py` — test surname detection with known data

---

## Phase 4: Architecture Improvements (When Scaling)

### 4A. Task Queue (arq + Redis)
- Replace `BackgroundTasks` in `backend/app/api/submissions.py` with `arq` async task queue
- **New files:** `backend/app/tasks/worker.py`, `backend/app/tasks/config.py`
- **Modify:** `backend/app/core/pipeline.py` — create own DB session instead of receiving one
- Fallback to synchronous when Redis unavailable (development)

### 4B. Vanshavali Reconstruction
- **New file:** `backend/app/core/vanshavali.py`
- Build directed graph from extracted ancestry chain
- Validate: no cycles, no generation gaps, plausible relationships
- Flag anomalies in assessment results

---

## Phase 5: Deferred (Post Product-Market Fit)
These are documented in the report but NOT recommended for immediate implementation:
- **Blockchain Recording** — Polygon/Hyperledger hash storage (needs paying customers first)
- **WhatsApp Bot** — Twilio integration (needs user research)
- **Government Dashboard** — Batch verification UI (needs signed MOU)
- **Script Identification CNN** — Hindi/Odia/Bengali detection (Vision API handles this)
- **Training Data Feedback Loop** — Tesseract fine-tuning (needs 500+ corrections)
- **Legal Services Marketplace** — Lawyer referrals (needs partnerships)
- **Digital Land Passport** — Premium blockchain-backed certificate (needs blockchain first)

---

## New Dependencies Summary

**Backend (`requirements.txt`):**
- `opencv-python-headless` — binarisation, morphology, blur
- `thefuzz[speedup]` — fuzzy village name matching
- `shapely` — forest boundary point-in-polygon
- `arq` — async task queue (Phase 4)

**Frontend (`package.json`):**
- `leaflet` + `react-leaflet` — interactive maps

---

## Verification Plan
1. **OCR accuracy**: Compare extraction accuracy on 5 held-out Khatiyan samples before/after Phase 1 changes
2. **Risk scoring**: Run existing submissions through updated scorer, verify weight changes produce expected shifts
3. **Maps**: Verify Leaflet renders with OpenStreetMap tiles, marker appears at correct coordinates
4. **Forest overlay**: Upload a known forest-area property, verify map shows red overlay and `check_forest_boundary()` returns `in_forest: True`
5. **Tests**: `pytest backend/tests/` passes all unit tests
6. **Audit**: Verify audit logs are created after document upload, OCR correction, and vault operations
