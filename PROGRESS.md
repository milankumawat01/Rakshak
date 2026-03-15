# Rakshak — Build Progress

## Current Phase: 6 — Payment
## Status: COMPLETED

## Completed
- [x] Phase 1 — Scaffold (main.py, db.py, models/, alembic/, /health endpoint)
- [x] Phase 2 — OCR Engine (ocr/gemini_client.py, ocr/extractor.py)
- [x] Phase 3 — Risk Scorer (risk/scorer.py, risk/mock_govt.py)
- [x] Phase 4 — Backend API (auth, submissions, vault, payment, pipeline)
- [x] Phase 5 — Frontend UI (React + Vite + Tailwind, all pages + components)
- [x] Phase 6 — Payment (Razorpay test mode, DEMO_MODE skip, free tier logic)

## All Phases Complete

## Blockers
- Need sample Khatiyan images from client to tune OCR
- Tesseract binary must be installed on system
- Replace GEMINI_API_KEY with real key in .env
- Replace Razorpay test keys with real keys for production

## Last Commit
feat/phase-6-payment

## Run Commands
Backend:  cd backend && source venv/Scripts/activate && uvicorn main:app --reload --port 8000
Frontend: cd frontend && npm run dev
Test:     Open http://localhost:5173 in browser
