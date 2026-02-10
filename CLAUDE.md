# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quantum Futures Interactive — a full-stack quantum computing demonstration platform. Users go through a guided journey: welcome → device selection → sentiment collection → industry prediction voting → quantum key generation → key display → completion. There's also an admin dashboard.

The project has three independent codebases in one repo:
1. **Frontend** (`frontend/`) — Next.js 15 app with React 18, Tailwind CSS v4, deployed as Lambda + CloudFront
2. **Python Backend** (`src/`, `app/`, `backend/`) — FastAPI services for quantum computing, deployed on ECS Fargate
3. **Infrastructure** (`lib/`, `bin/`) — AWS CDK TypeScript stacks managing both deployments

## Common Commands

### Frontend (run from `frontend/`)
```bash
npm run dev          # Next.js dev server
npm run build        # Production build (standalone output for Lambda)
npm run lint         # ESLint (v9 flat config, extends next/core-web-vitals + next/typescript)
```

### Python Backend (run from `src/`)
```bash
uv run python main.py           # Start FastAPI server on port 8001
uv add <package>                # Add Python dependency (uses uv, not pip)
uv run python <script.py>       # Run any Python script
```

### CDK Infrastructure (run from project root)
```bash
npm run build        # Compile CDK TypeScript (tsc)
npm run watch        # Watch mode compilation
npm test             # Jest tests for CDK stacks
cdk diff             # Preview infrastructure changes
cdk deploy           # Deploy stacks
cdk synth            # Generate CloudFormation templates
```

### Deployment
```bash
./deploy.sh              # Deploy to AWS (Lambda + CloudFront)
```

## Architecture

### Frontend (`frontend/src/`)

Next.js App Router with `output: 'standalone'` for Lambda Web Adapter deployment.

**Page flow** — The main page (`app/page.tsx`) renders a multi-step journey managed by `useJourneyState` hook. Steps are individual page components in `components/pages/`:
`WelcomePage → DeviceSelectionPage → SentimentPage → IndustryPredictionPage → KeyGenerationPage → QuantumKeysPage → CompletionPage`

The admin dashboard is a separate route at `app/dashboard/`.

**API routes** (`app/api/`) — Next.js route handlers that talk directly to DynamoDB:
- `sessions/` — Session lifecycle (create, get, complete)
- `sentiments/` — User sentiment word tracking
- `industry-votes/` — Industry prediction voting
- `quantum-keys/` — Key generation (invokes Lambda for actual quantum computation)
- `invite-codes/` — Access code management (admin-protected)
- `env-impact/` — Environmental impact calculations
- `feedback/` — User feedback with S3 file uploads
- `admin/` — Admin authentication
- `health/` — Health check

**State management** — React Context + custom hooks (`hooks/`, `contexts/`). No external state library.

**Styling** — Tailwind CSS v4 via PostCSS. Dark theme only (`<html lang="en" className="dark">`). Path alias: `@/*` → `./src/*`.

**Key AWS SDK clients** used directly in API routes: DynamoDB, Lambda, S3, Braket.

### Python Backend (`src/`)

FastAPI application with quantum computing capabilities:

- `main.py` — REST API endpoints for signatures, jobs, devices, admin
- `signature_wall_system.py` — Quantum signature generation with post-quantum cryptography
- `enhanced_quantum_service.py` — Device management, AWS Braket integration, job queuing
- `quantum_service/` — Modular quantum service package (devices, credentials, crypto, handlers)

Uses SQLite databases (auto-created on first run): `signature_wall.db`, `quantum_jobs.db`, `event_registrations.db`.

Python >=3.12, <3.13. Package management via `uv` (pyproject.toml in `src/`).

### CDK Infrastructure (`lib/`)

Main stack:
- `frontend-serverless-stack.ts` — `QcBcInteractiveCdkStack`: Lambda (with Web Adapter) + API Gateway + CloudFront + DynamoDB tables

CDK entry point: `bin/qc-bc-interactive-cdk.js`. CDK app uses `ts-node` via `cdk.json`.

### DynamoDB Tables (created by frontend CDK stack)

`qc-bc-sessions`, `qc-bc-sentiments`, `qc-bc-industry-votes`, `qc-bc-quantum-keys`, `qc-bc-invite-codes`, `qc-bc-admins`, `qc-bc-feedback`

### Environment Variables

Frontend uses `frontend/.env.local` (see `frontend/.env.example`):
- `AWS_REGION` — AWS region (default: us-east-1)
- `ADMIN_API_KEY` — Required for admin API protection
- `DDB_TABLE_*` — Optional DynamoDB table name overrides
- `ENV_IMPACT_API_URL` — Backend environmental impact API endpoint

## Key Patterns

- Frontend API routes handle DynamoDB operations server-side (no direct client DB access)
- Quantum key generation is delegated from frontend API route → AWS Lambda → Braket
- The Python backend (`src/`) and Next.js frontend (`frontend/`) are independently deployable
- All quantum device definitions live in `frontend/src/lib/constants.ts` (simulators: SV1, DM1, TN1; QPUs: IonQ Aria/Forte, AQT, IQM Garnet/Emerald, Rigetti Ankaa-3, QuEra Aquila)
- Documentation and comments are often in Chinese
