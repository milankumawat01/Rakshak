# 🛡 RAKSHAK — Investor Demo Build Prompt
### Localhost Prototype | Gemini Vision | No Cloud | FastAPI + React + SQLite

| Stack | FastAPI + React + SQLite | AI Engine | Tesseract + Gemini Vision |
|---|---|---|---|
| Storage | Local `uploads/` folder | Payment | Razorpay test mode |

> **Paste this file at the start of every Claude Code session.**
> Say: `"Read RAKSHAK_Investor_Demo_Prompt.md and continue from Phase [N]."`
>
> **Goal: A working prototype investors can click through. Ship fast. Polish later.**

---

## SECTION 1 — HOW TO USE WITH CLAUDE CODE

### Session Rules
- Every new session: paste this file, say which Phase you are on.
- After finishing a Phase: write `PROGRESS.md` (format in Section 8).
- Before starting Phase N+1: confirm Phase N runs without errors.
- Commit to git after each Phase. Message format: `feat/phase-N-name`
- If a requirement is unclear: **stop and ask. Never guess.**

### Hard Anti-Hallucination Rules

> 🚫 Claude Code must follow these without exception.

- **NEVER** invent a government API endpoint. Use mock functions with `# TODO` comments.
- **NEVER** hardcode confidence scores. Scores must come from real Gemini API responses.
- **NEVER** skip `try/except` on Gemini calls, file I/O, or DB operations.
- **NEVER** add features outside the current Phase scope.
- **NEVER** use AWS, Redis, or Docker in this build. Localhost only.
- If Gemini returns unexpected JSON: log the raw response and return a safe default — do not crash.

---

## SECTION 2 — WHAT WE ARE BUILDING

Rakshak is a land verification platform for Jharkhand, India. A user uploads a Khatiyan document (land ownership paper). The system OCR-extracts the data, runs risk checks, and returns a colour-coded risk score with a recommendation to APPROVE, REVIEW, or REJECT the transaction.

### Core Input / Output Contract

> This contract never changes. Every Phase is building toward this.

```
INPUT:
  image_file    : JPG / PNG / PDF  (uploaded by user)
  village_name  : string            (typed by user)
  plot_number   : string            (typed by user, corrected after OCR)
  seller_name   : string            (typed by user)
  buyer_tribal  : boolean           (is the buyer tribal?)

OUTPUT:
  {
    "risk_score"     : 18,
    "risk_level"     : "GREEN",         // GREEN / YELLOW / ORANGE / RED
    "recommendation" : "APPROVE",       // APPROVE / REVIEW / REJECT
    "extracted": {
      "plot_number"        : "12345",
      "khata_number"       : "5678",
      "area_bigha"         : 2.5,
      "owner_name"         : "Ram Kumar",
      "tribal_status"      : "T",
      "last_mutation_date" : "2022-05-10"
    },
    "checklist": {
      "tribal_valid"   : true,
      "dc_permission"  : true,
      "forest_clear"   : true,
      "mutation_clean" : true,
      "chain_complete" : true
    },
    "flags"      : [],
    "confidence" : 0.87
  }
```

---

## SECTION 3 — TECH STACK (Prototype Edition)

> Everything runs on localhost. No cloud. No Docker. Just `pip install` and `npm install`.

| Layer | Choice | Why / Notes |
|---|---|---|
| Backend | Python 3.11 + FastAPI | Fast to write, async support, easy to run |
| Database | SQLite (`rakshak.db`) | Zero setup — swap `DATABASE_URL` to Postgres after funding |
| ORM | SQLAlchemy + Alembic | Same schema as production, easy migration later |
| File Storage | Local `uploads/` folder | Replaces AWS S3. Swap after funding. |
| OCR Primary | Tesseract (pytesseract) | Free, offline, works for clean scans |
| OCR Fallback | Gemini Vision (`gemini-1.5-flash`) | Replaces Claude Vision. Free tier: 1500 req/day. |
| Frontend | React 18 + Vite + Tailwind CSS | Fast dev server, hot reload |
| State / API | React Query (TanStack Query) | Polling for async pipeline status |
| Animations | Framer Motion | Risk score gauge, processing screen |
| Payment | Razorpay test mode | Test keys only. No real money. |
| Auth | Phone OTP + JWT | `MOCK_OTP=true` → OTP `123456` always works |

### Prototype Simplifications (explicitly allowed)
- SQLite instead of PostgreSQL — schema is identical, swap `DATABASE_URL` later.
- OTP = always `123456` in dev mode — skip actual SMS integration.
- File upload saves to `uploads/` — no S3 bucket needed.
- Government DB checks return mock data — real integration after funding.
- GIS forest check returns mock "clear" — real MOEF data after funding.
- Payment can be skipped in demo mode with `DEMO_MODE=true` in `.env`

---

## SECTION 4 — PROJECT STRUCTURE

```
rakshak/
  backend/
    app/
      api/
        auth.py              <- OTP login, JWT issue
        submissions.py       <- upload + pipeline trigger
        vault.py             <- save/list/edit saved lands
        payment.py           <- Razorpay order + webhook
      core/
        ocr/
          extractor.py       <- Tesseract + Gemini fallback
          gemini_client.py   <- Gemini Vision API wrapper
        risk/
          scorer.py          <- 7 component scores + aggregator
          mock_govt.py       <- TODO: replace with real API
        pipeline.py          <- orchestrates OCR -> risk -> store
      models/
        user.py
        submission.py
        extraction.py
        assessment.py
        vault.py
        payment.py
      schemas/               <- Pydantic request/response models
      db.py                  <- SQLAlchemy engine (SQLite)
    alembic/
    uploads/                 <- Uploaded Khatiyan images go here
    rakshak.db               <- SQLite database file
    main.py
    requirements.txt
  frontend/
    src/
      pages/
        Landing.jsx
        Verify.jsx           <- 6-step upload flow
        Dashboard.jsx
        VaultDetail.jsx
      components/
        RiskScoreGauge.jsx
        ProcessingScreen.jsx
        OCRResultTable.jsx
        VaultCard.jsx
        ChecklistItem.jsx
    package.json
  .env
  PROGRESS.md
```

### Environment Variables (`.env`)

```
# Backend
DATABASE_URL=sqlite:///./rakshak.db
UPLOAD_DIR=./uploads
JWT_SECRET=change-this-in-production

# Gemini Vision (get free key at aistudio.google.com)
GEMINI_API_KEY=your-gemini-api-key-here

# Payment (test keys from Razorpay dashboard)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-secret-here

# Prototype flags
DEMO_MODE=true        # skips payment gate for investor demo
MOCK_OTP=true         # OTP 123456 always valid
OCR_CONFIDENCE_THRESHOLD=0.75
```

---

## SECTION 5 — BUILD PHASES

> ⚠️ Do Phases in order. Do not skip. Write `PROGRESS.md` after each one.

| # | Phase | Deliverable | Done When |
|---|---|---|---|
| **1** | Scaffold | FastAPI app, SQLite DB, Alembic migrations, `/health` endpoint, `uploads/` folder | App starts, DB created, `/health` → 200 |
| **2** | Gemini OCR Engine | Tesseract extractor + Gemini Vision fallback, `KhatiyanExtraction` model, confidence scoring | Given test image → JSON with >70% confidence |
| **3** | Risk Scorer | 7 component scorers with mock govt data, weighted aggregator, tribal hard override | Returns GREEN/YELLOW/ORANGE/RED from extraction JSON |
| **4** | Backend API | Auth (mock OTP), file upload, async pipeline, report GET, vault CRUD | Can upload image and get report via curl/Postman |
| **5** | Frontend UI | All pages with dark premium UI — landing, 6-step verify flow, dashboard, vault | Investor can click through full flow in browser |
| **6** | Payment | Razorpay test mode. `DEMO_MODE=true` skips payment. Free tier logic. | Test payment completes, report unlocks |

---

### Phase 1 — Scaffold
- Create folder structure exactly as shown in Section 4.
- Set up FastAPI with uvicorn. Entry point: `main.py`
- Configure SQLAlchemy with SQLite. URL from `.env`: `DATABASE_URL`
- Create Alembic migration for all 6 tables.
- Create `uploads/` directory. Mount as static: `GET /uploads/{filename}`
- Add `GET /health` returning `{ "status": "ok", "db": "connected" }`

> ℹ️ Use the same SQLAlchemy column types as production. When we switch to Postgres, only `DATABASE_URL` changes.

---

### Phase 2 — Gemini OCR Engine

**Files:** `app/core/ocr/extractor.py`, `app/core/ocr/gemini_client.py`

#### `gemini_client.py` — Gemini Vision Wrapper

```python
import google.generativeai as genai
import json, re
from pathlib import Path

class GeminiVisionClient:
    MODEL = "gemini-1.5-flash"   # cheapest, fast enough for demo

    PROMPT = """
    You are reading a Jharkhand (India) land document called a Khatiyan.
    Extract ONLY these fields. Return ONLY valid JSON, no explanation.
    {
      "plot_number": "string or null",
      "plot_confidence": 0.0-1.0,
      "khata_number": "string or null",
      "khata_confidence": 0.0-1.0,
      "area_bigha": number_or_null,
      "area_confidence": 0.0-1.0,
      "owner_name": "string or null",
      "owner_confidence": 0.0-1.0,
      "tribal_status": "T or H or UNKNOWN",
      "tribal_confidence": 0.0-1.0,
      "last_mutation_date": "YYYY-MM-DD or null",
      "mutation_confidence": 0.0-1.0,
      "village_name": "string or null",
      "extraction_language": "hindi or english or mixed"
    }
    tribal_status: T=Tribal/ST, H=Non-tribal/OBC/General
    Confidence: 1.0=certain, 0.5=unsure, 0.0=not found
    """

    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(self.MODEL)

    def extract(self, image_path: str) -> dict:
        try:
            img_data = Path(image_path).read_bytes()
            ext = Path(image_path).suffix.lower().strip(".")
            mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg",
                    "png": "image/png", "pdf": "application/pdf"}.get(ext, "image/jpeg")
            response = self.model.generate_content([
                {"mime_type": mime, "data": img_data},
                self.PROMPT
            ])
            raw = response.text.strip()
            raw = re.sub(r"```(?:json)?", "", raw).strip("` \n")
            return json.loads(raw)
        except Exception as e:
            print(f"[Gemini] Error: {e}")
            return {}   # safe empty fallback — never crash
```

#### `extractor.py` — Unified OCR Strategy

```
Strategy:
  1. Run Tesseract (lang=hin+eng, psm=6)  — free, offline
  2. If overall_confidence < THRESHOLD → call Gemini Vision
  3. Merge: take higher confidence value per field
  4. overall_confidence < 0.75 → requires_manual_review = True

KhatiyanExtraction dataclass fields:
  plot_number, plot_confidence
  khata_number, khata_confidence
  area_bigha, area_confidence
  owner_name, owner_confidence
  tribal_status (T/H/UNKNOWN), tribal_confidence
  last_mutation_date, mutation_confidence
  village_name, extraction_language
  overall_confidence, requires_manual_review, raw_text
```

> ℹ️ Install: `pip install pytesseract pillow google-generativeai`
> Tesseract binary: `sudo apt install tesseract-ocr tesseract-ocr-hin` (Ubuntu) or `brew install tesseract tesseract-lang` (Mac)

---

### Phase 3 — Risk Scoring Engine

**Files:** `app/core/risk/scorer.py` + `app/core/risk/mock_govt.py`

#### 7 Component Scores (each 0–100, lower = higher risk)

| Component | Weight | Scoring Logic | Data Source |
|---|---|---|---|
| `ocr_confidence` | 15% | `overall_confidence × 100` | Gemini/Tesseract |
| `tribal_status` | 25% | T + non-tribal buyer = **0 (HARD OVERRIDE)**. T + tribal = 100. H = 80. UNKNOWN = 20 | OCR + `buyer_tribal` input |
| `dc_permission` | 20% | Valid = 100. Expired = 40. Not found = 0 | `mock_govt.py` |
| `forest_risk` | 15% | In forest = 0. Eco-zone = 20. Clear = 100 | `mock_govt.py` |
| `mutation_history` | 10% | >2 mutations in 2yr = 10. Disputed = 0. Clean = 100 | `mock_govt.py` |
| `khatiyan_age` | 5% | Mutation <1yr ago = 100. Never mutated = 10. >10yr = 20 | OCR `mutation_date` |
| `chain_of_title` | 10% | All heirs present = 100. Missing heir = 20. Incomplete = 50 | `mock_govt.py` |

#### Risk Level Thresholds

```
final_score = weighted_average(all_7_components)

0  - 25  →  GREEN   → APPROVE   (safe)
26 - 60  →  YELLOW  → REVIEW    (due diligence needed)
61 - 85  →  ORANGE  → CAUTION   (significant issues)
86 - 100 →  RED     → REJECT    (do not proceed)
```

> 🚫 **HARD OVERRIDE:** If `tribal_status_score == 0` (T land + non-tribal buyer), force `risk_level = RED` and `recommendation = REJECT` regardless of `final_score`. This is CNT Act legal compliance — non-negotiable.

#### `mock_govt.py` — Placeholder Until Real APIs

```python
# All functions return mock "all clear" for prototype.
# Replace each function body with real API call after funding.

def check_dc_permission(plot_number, village):
    # TODO: Replace with Jharbhoomi.jharkhand.gov.in API
    return {"exists": True, "valid": True, "score": 100}

def check_forest_boundary(village, plot_number):
    # TODO: Replace with MOEF GIS data
    return {"in_forest": False, "in_eco_zone": False, "score": 100}

def check_mutation_history(plot_number):
    # TODO: Replace with Jharbhoomi mutation records
    return {"mutations": [], "suspicious": False, "score": 100}

def check_chain_of_title(plot_number):
    # TODO: Replace with Jharbhoomi ownership chain
    return {"complete": True, "score": 100}
```

---

### Phase 4 — Backend API

#### Auth
```
POST /api/auth/send-otp
  body: { phone: "+919876543210" }
  MOCK_OTP=true → always succeed, OTP = "123456"

POST /api/auth/verify-otp
  body: { phone, otp }
  → returns { access_token, token_type: "bearer", user_id }

POST /api/auth/refresh
  header: Authorization: Bearer <token>
  → returns new access_token
```

#### Submissions (Core Flow)
```
POST /api/submissions/upload
  multipart: { file, village_name, plot_number, seller_name, buyer_tribal }
  1. Save file to uploads/{uuid}.{ext}
  2. INSERT into submissions (status="processing")
  3. Trigger pipeline as BackgroundTask
  4. Return { submission_id, status: "processing" }

GET /api/submissions/{submission_id}
  → full submission + extraction + risk_assessment
  → frontend polls every 2s until status != "processing"

GET /api/submissions/
  → user's submission history list
```

#### Vault
```
POST   /api/vault/              body: { submission_id, vault_name, notes, tags[], share_permission }
GET    /api/vault/              → list all vault items for user
GET    /api/vault/{vault_id}    → single item detail
PATCH  /api/vault/{vault_id}   → update vault_name / notes / tags
DELETE /api/vault/{vault_id}
```

#### Payment
```
POST /api/payment/create-order
  body: { submission_id }
  DEMO_MODE=true → return { demo_mode: true, skip_payment: true }
  else           → create Razorpay order → return { order_id, amount: 49900 }

POST /api/payment/webhook
  Razorpay webhook → verify HMAC signature → mark submission as paid

GET /api/payment/history → user's payment list
```

> ℹ️ All endpoints except `/auth/*` require Bearer JWT. Rate limit uploads to 5/min per user.

---

## SECTION 6 — FRONTEND UI/UX DIRECTION

> ℹ️ **Premium, dark, modern.** Investors must feel like they are looking at a funded startup — not a government portal.

### Design System

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#0F172A` | Page background, dark navy |
| `--bg-card` | `#1E293B` | Cards, panels, sidebars |
| `--accent` | `#6366F1` (indigo) | CTA buttons, active nav, links |
| `--text-primary` | `#F1F5F9` | Headings, important text |
| `--text-muted` | `#94A3B8` | Labels, secondary info |
| `--green` | `#10B981` | GREEN risk — glowing ring on gauge |
| `--yellow` | `#F59E0B` | YELLOW risk |
| `--orange` | `#F97316` | ORANGE risk |
| `--red` | `#EF4444` | RED risk — pulsing on reject |
| Font heading | Inter | Google Fonts |
| Font mono | DM Mono | Plot#, Khata#, scores, confidence % |
| Radius | 16px cards, 8px inputs | Consistent throughout |
| Theme | **Dark mode default** | Light toggle optional |

---

### Pages to Build (in This Order)

#### 1. Landing Page (`/`)
- Full-viewport hero. Dark navy background with animated floating grid/particles.
- Headline: **"Verify Your Land in 20 Seconds."** Sub: *"AI-powered. Jharkhand government data."*
- One big glowing CTA: `Verify Now — Free`
- Trust bar: `1,000+ lands verified | 99% accuracy | 20-second results`
- How It Works: 3 animated steps — Upload Khatiyan → AI Analysis → Risk Report
- Animated preview: demo GREEN score card fading in (static, no real data)
- Pricing: 3 cards — Free (1/month) | ₹499 per report | ₹299/month Premium

#### 2. Verify Flow (`/verify`) — 6 Steps, Single Page with Step Transitions
- **Step 1 — Upload:** Animated drag-and-drop zone. Dotted border pulses on hover. Shows thumbnail on drop.
- **Step 2 — Details:** Clean form — Village, Plot#, Seller name, toggle "Is buyer tribal?"
- **Step 3 — Processing:** Dark screen. 4 parallel animated bars — OCR Extraction | CNT Status | Forest Check | Mutation History. Each bar fills when that task completes (real API poll). **No fake loading.**
- **Step 4 — OCR Review:** Table of extracted fields. Confidence badge per row (green >85%, yellow 60–85%, red <60%). Each field editable. Button: "Looks Good" or "Edit".
- **Step 5 — Payment:** `DEMO_MODE=true` → "Demo Mode — Payment Skipped". Else Razorpay checkout.
- **Step 6 — Report:** See below.

#### 3. Risk Report Screen — Make This the Best Screen in the App

> 🚫 Investors will screenshot this. Every pixel matters.

- Giant **circular SVG gauge** — ring animates 0 → final score on load. Ring colour = risk level. Score counts up with Framer Motion.
- **Glowing badge:** `🟢 GREEN — LOW RISK` or `🔴 RED — REJECT` with matching `box-shadow` glow.
- **Full-width recommendation banner:** colour-coded — APPROVE / REVIEW / REJECT.
- Two columns: extracted data table (with confidence pills) | 7-component bar chart (Recharts).
- **Checklist:** 5 rows with animated ✓ / ✗ / ⚠ icons + description.
- **Action bar:** `[Download PDF]` `[Save to Vault]` `[Share Link]` `[Verify Another]`

#### 4. Dashboard (`/dashboard`)
- Sticky dark sidebar: logo + nav icons (Dashboard, Vault, Verify, History, Settings).
- Top stats: 3 cards — Total Vault Items | Attention Needed | Verifications This Month
- Vault grid (2 col): card per plot — nickname, village, risk badge, last verified, [View] [Re-verify]
- Activity timeline: last 5 actions
- Subscription status bar at bottom of sidebar

#### 5. Vault Detail (`/vault/:id`)
- Same report layout as Step 6.
- Edit panel: rename, notes, tags, privacy (Private / Family / Public).
- Family access: add member by phone.
- Re-verify button.

---

### Key Components

```
RiskScoreGauge.jsx
  props: { score: number, level: "GREEN"|"YELLOW"|"ORANGE"|"RED" }
  SVG circle with strokeDashoffset animation via Framer Motion
  Outer glow: box-shadow 0 0 40px <risk-color>88

ProcessingScreen.jsx
  props: { submissionId, onComplete }
  Polls GET /api/submissions/{id} every 2s
  4 progress bars fill based on real pipeline_step field
  DO NOT use setTimeout fake progress

OCRResultTable.jsx
  props: { extraction, onEdit }
  Each row: field label | editable input | confidence pill
  Pill colors: green >0.85, yellow 0.60–0.85, red <0.60

ChecklistItem.jsx
  props: { label, status: "pass"|"fail"|"warn", description }
  Animated icon on mount via Framer Motion

RiskBreakdownChart.jsx
  Recharts HorizontalBar — all 7 component scores
  Bar colour matches score (green high, red low)
```

> ℹ️ Use **Framer Motion** for all animations. **Tailwind CSS** for styling. **React Query** for API polling.

### Responsive
- **1280px+:** Full sidebar, 2-column vault grid
- **768px:** Collapsible sidebar (hamburger), 1-column vault
- **360px:** Bottom tab nav, full-width cards

---

## SECTION 7 — DATABASE SCHEMA

> Use SQLite for prototype. Identical column types → `DATABASE_URL` swap = migration to Postgres.

| Table | Key Columns |
|---|---|
| `users` | `user_id UUID PK`, `phone_number`, `name`, `email`, `user_type ENUM(citizen/broker/govt)`, `subscription_plan ENUM(free/basic/premium)`, `subscription_expires`, `total_submissions`, `total_vault_items`, `registration_date` |
| `submissions` | `submission_id UUID PK`, `user_id FK`, `document_file_path` (local), `village_name`, `plot_number`, `seller_name`, `buyer_tribal BOOL`, `submission_status ENUM(processing/completed/failed)`, `pipeline_step VARCHAR`, `risk_score INT`, `risk_level ENUM`, `payment_status ENUM` |
| `khatiyan_extractions` | `extraction_id UUID PK`, `submission_id FK`, `ocr_engine_used`, `plot_number_extracted`, `plot_confidence FLOAT`, `khata_number_extracted`, `area_bigha_extracted`, `owner_name_extracted`, `tribal_status_extracted`, `last_mutation_date_extracted`, `overall_extraction_confidence`, `requires_manual_review BOOL`, `raw_text TEXT` |
| `risk_assessment` | `assessment_id UUID PK`, `submission_id FK`, `ocr_confidence_score INT`, `tribal_status_score INT`, `dc_permission_score INT`, `forest_risk_score INT`, `mutation_history_score INT`, `khatiyan_age_score INT`, `chain_of_title_score INT`, `final_risk_score INT`, `risk_level ENUM`, `recommendation ENUM`, `flags JSONB`, `checklist JSONB` |
| `user_vault` | `vault_id UUID PK`, `user_id FK`, `submission_id FK`, `vault_name`, `plot_number`, `village_name`, `area_bigha`, `risk_level`, `notes TEXT`, `tags JSONB`, `is_favorite BOOL`, `share_permission ENUM(private/family/public)`, `family_members JSONB` |
| `payment_history` | `payment_id UUID PK`, `user_id FK`, `submission_id FK`, `payment_type ENUM`, `payment_amount`, `payment_status ENUM`, `razorpay_order_id`, `razorpay_payment_id`, `payment_date` |

---

## SECTION 8 — PROGRESS TRACKING (`PROGRESS.md`)

> Write this after every Phase. Read it first when resuming a session.

```markdown
# Rakshak — Build Progress

## Current Phase: [N] — [Name]
## Status: IN_PROGRESS / COMPLETED

## Completed
- [x] Phase 1 — Scaffold  (main.py, db.py, models/, alembic/)
- [x] Phase 2 — OCR Engine  (ocr/extractor.py, ocr/gemini_client.py)

## Next Step
Start Phase 3: create app/core/risk/scorer.py
First test: python -m pytest tests/test_risk.py

## Blockers
- Need sample Khatiyan images from client to tune OCR
- Jharbhoomi API: using mock until real credentials arrive

## Last Commit
feat/phase-2-gemini-ocr-engine

## Run Commands
Backend:  cd backend && uvicorn main:app --reload --port 8000
Frontend: cd frontend && npm run dev
Test:     cd backend && python -m pytest
```

---

## SECTION 9 — QUICK START COMMANDS

### Backend Setup
```bash
cd rakshak/backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install fastapi uvicorn sqlalchemy alembic pytesseract pillow
pip install google-generativeai python-jose passlib python-multipart
pip install razorpay python-dotenv pytest httpx

# Install Tesseract binary
sudo apt install tesseract-ocr tesseract-ocr-hin   # Ubuntu
brew install tesseract tesseract-lang               # Mac

alembic upgrade head
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd rakshak/frontend
npm create vite@latest . -- --template react
npm install
npm install tailwindcss @tailwindcss/vite framer-motion
npm install @tanstack/react-query axios recharts react-router-dom
npm install react-dropzone react-hot-toast lucide-react
npm run dev                     # runs at http://localhost:5173
```

### Get Gemini API Key (Free)
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with Google account
3. Click "Get API Key" → "Create API key"
4. Paste into `.env` as `GEMINI_API_KEY`
5. Free tier: **1500 req/day** on `gemini-1.5-flash` — enough for demo

---

## SECTION 10 — OUT OF SCOPE FOR THIS PROTOTYPE

> 🚫 Do not build any of the following. If you find yourself doing so, stop.

- AWS S3, Redis, Docker, Kubernetes — not needed until post-funding
- Real SMS OTP — `MOCK_OTP=true` is enough for demo
- WhatsApp bot — demo it verbally, build post-funding
- Admin government dashboard — future phase
- Hindi UI language toggle — future phase
- Real GIS/MOEF integration — mock is fine
- Real Jharbhoomi API — mock is fine
- Court case database — out of MVP scope
- Email notifications, mobile app, broker API — all post-funding

---

> **Start with Phase 1. Ask before you assume. Build what is here — nothing more.**
>
> *The goal is a prototype investors can click through. Every decision should serve that goal.*
>
> **Good luck. Build fast. 🚀**