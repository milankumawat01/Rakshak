# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rakshak is a land verification platform for Jharkhand, India. It AI-analyzes Khatiyan documents (land ownership papers) to provide risk assessments using Claude Vision OCR via OpenRouter and an 8-component risk scoring system with CNT Act (Chota Nagpur Tenancy Act) compliance. Built with FastAPI + React + SQLite. Includes a WhatsApp bot via Meta Business API.

## Development Commands

```bash
# Backend (auto-reload)
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Frontend (hot reload on :5173, proxies /api to :8000)
cd frontend && npm run dev

# Both together (VSCode task "Start Dev" runs both)

# Database migrations
cd backend && alembic revision --autogenerate -m "description"
cd backend && alembic upgrade head

# Tests
cd backend && pytest

# Production build
cd frontend && npm run build

# Deploy
bash deploy/deploy.sh
```

## Architecture

### Backend (`backend/`)

FastAPI application. Entry point: `main.py`.

**Core pipeline** (`app/core/pipeline.py`): Orchestrates Upload → OCR Extraction → Risk Scoring → Database Storage with real-time status tracking via `pipeline_step`.

**OCR** (`app/core/ocr/`): Single-engine via OpenRouter API using Claude Vision (`anthropic/claude-sonnet-4-20250514`). `openrouter_client.py` handles image/PDF→base64→API call. `extractor.py` maps API response to `KhatiyanExtraction` dataclass with per-field confidence scores.

**Risk scoring** (`app/core/risk/scorer.py`): 8 weighted components (OCR confidence 10%, tribal status 25%, DC permission 15%, forest risk 15%, mutation history 10%, khatiyan age 5%, chain of title 10%, PoA abuse 10%). **Hard override**: tribal land (T) + non-tribal buyer = score 0, RED/REJECT regardless of other scores. Thresholds: 0-25 GREEN, 26-60 YELLOW, 61-85 ORANGE, 86-100 RED.

**Auth** (`app/api/auth.py`): Email-based OTP authentication. Signup (name+email+phone → email OTP → JWT), Login (email → OTP → JWT). OTP service in `app/core/email_otp.py` (SMTP or mock mode). JWT HS256 with 24hr expiry.

**WhatsApp bot** (`app/core/whatsapp/`): Meta Cloud API integration. `client.py` sends text/buttons/lists. `handler.py` routes messages (registered: view reports/upload docs, unregistered: guided registration). `states.py` manages conversation state machine. Webhook at `/api/whatsapp/webhook`.

**Public reports** (`app/api/reports.py`): Unauthenticated endpoint `GET /api/reports/{id}/public` for shareable report links.

**Tribal detection** (`app/core/tribal_surnames.py`): 50+ Jharkhand ST surname database as fallback when OCR fails to extract T/H marker.

**Government APIs** (`app/core/risk/mock_govt.py`): Currently mocked (DC permission, forest boundary, mutation history, chain of title). To be replaced with real Jharbhoomi/MOEF integrations.

**API routes** (`app/api/`): auth (email OTP + JWT), submissions (upload/retrieve/correct/search), vault (CRUD + documents + sharing), payment (Razorpay), reports (public), whatsapp (webhook).

**Models** (`app/models/`): User (email+name required, phone optional, is_verified, whatsapp_phone), Submission, KhatiyanExtraction, RiskAssessment, UserVault, PaymentHistory. UUIDs for all PKs.

### Frontend (`frontend/`)

React 19 + Vite + Tailwind CSS. Dark theme with custom color tokens defined in `src/index.css`.

**Auth pages**: `Signup.jsx` (name+email+phone → OTP), `Login.jsx` (email → OTP), `Profile.jsx` (view/edit).

**Main flow**: `src/pages/Verify.jsx` — 6-step wizard (Upload → Details → Processing → OCR Review → Payment → Report).

**Public reports**: `PublicReport.jsx` — unauthenticated report viewer at `/report/:submissionId`.

**State management**: React Query for server state, React Context for auth (`lib/auth.jsx` — stores token, userId, userName, userEmail) and i18n (`lib/i18n.jsx`, English/Hindi).

**API client**: `src/lib/api.js` — Axios with JWT interceptor and auto-logout on 401 (redirects to `/login`).

**Risk visualization**: `src/lib/riskColors.js` for color/label mappings. GREEN=#10B981, YELLOW=#F59E0B, ORANGE=#F97316, RED=#EF4444.

### Deployment (`deploy/`)

PM2 via `ecosystem.config.js`, nginx reverse proxy, systemd service. Production at 152.67.14.19.

## Environment Variables

Set in `.env` at project root. Key flags:
- `DEMO_MODE=true` — skips payment gate
- `MOCK_OTP=true` — OTP always 123456, skips email sending
- `OCR_CONFIDENCE_THRESHOLD=0.85` — below this triggers manual review
- `OPENROUTER_API_KEY` — for Claude Vision OCR
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` — email OTP
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — payment (test mode)
- `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN` — WhatsApp bot

## Key Conventions

- Risk levels are always ALL_CAPS strings: GREEN, YELLOW, ORANGE, RED
- All database IDs are UUID strings (String(36))
- Backend status enums: processing/completed/failed for submissions, queued/ocr_extraction/risk_scoring/vault_save for pipeline steps
- Auth is email-based OTP (no passwords). User model requires email+name, phone is optional.
- Frontend components are PascalCase .jsx files; hooks use `use` prefix
- i18n keys use dot-separated paths; translations in `src/lib/translations/`
- Vite dev server proxies `/api` and `/uploads` to backend on port 8000
- Public report URLs: `/report/{submission_id}` (UUID-based, no auth required)
