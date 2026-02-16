# Quantum Blockchain Interactive

<p align="center">
  <b>An interactive web platform connecting quantum computing and blockchain security through a 7-step guided UI journey.</b><br/>
  Built for live demos, workshops, and public engagement.
</p>

<p align="center">
  <a href="./docs/ui-information/Readme.md"><img alt="UI Walkthrough" src="https://img.shields.io/badge/Docs-UI%20Walkthrough-blue"></a>
  <a href="./docs"><img alt="Docs Index" src="https://img.shields.io/badge/Docs-Index-0ea5e9"></a>
  <a href="#getting-started"><img alt="Local Dev" src="https://img.shields.io/badge/Run-Local%20Dev-22c55e"></a>
  <a href="#deployment"><img alt="Deploy" src="https://img.shields.io/badge/Deploy-AWS%20CDK-f59e0b"></a>
</p>

<p align="center">
  <a href="./docs/ui-information/Readme.md">📘 UI Walkthrough</a> ·
  <a href="./docs">📚 Docs</a> ·
  <a href="#architecture">🏗️ Architecture</a> ·
  <a href="#deployment">🚀 Deployment</a> ·
  <a href="/dashboard">🛡️ Admin Dashboard</a>
</p>

---

## What this repository contains

- **UI + Experience documentation** lives in [`/docs`](./docs)  
  - Primary UI reference: [`docs/ui-information/Readme.md`](./docs/ui-information/Readme.md)
- **Deployment + infrastructure code** lives in the rest of the repository (frontend, backend, CDK, scripts)

> ✅ **Nobel Prize references are factual**: the experience references the official Nobel Foundation press release on the 2025 Nobel Prize in Physics.  
> Narrative framing and contributor presentation remain configurable UI copy for different audiences.

---

## Table of contents

- [Experience (UI Journey)](#experience-ui-journey)
- [Features (UI Modules)](#features-ui-modules)
- [Docs](#docs)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [Deployment](#deployment)

---

## Experience (UI Journey)

The platform is a **7-step guided UI flow** that introduces quantum risk to blockchain, collects community inputs, and culminates in a post-quantum outcome artifact (“Quantum-Safe Blockchain Passport”).

**Canonical UI spec**: see [`docs/ui-information/Readme.md`](./docs/ui-information/Readme.md)

| Step | Page | UI goal (high-level) | Detailed spec |
|------|------|----------------------|--------------|
| 0 | **Nobel Prize** | Context framing via 2025 Nobel Prize (Physics) | [`docs/ui-information/Readme.md#1--welcome-page-1png`](./docs/ui-information/Readme.md#1--welcome-page-1png) |
| 1 | **Quantum Meets Blockchain** | Risk education + PQC framing | [`docs/ui-information/Readme.md#2--quantum-meets-blockchain-page-2png`](./docs/ui-information/Readme.md#2--quantum-meets-blockchain-page-2png) |
| 2 | **Time to Experience Quantum** | Consent + session gating | [`docs/ui-information/Readme.md#3--experience-overview--consent-page-3png`](./docs/ui-information/Readme.md#3--experience-overview--consent-page-3png) |
| 3 | **Public Sentiment** | Capture perception signal | [`docs/ui-information/Readme.md#4--public-sentiment--input-page-4png`](./docs/ui-information/Readme.md#4--public-sentiment--input-page-4png) |
| 4 | **Community Results & Voting** | Aggregate + prioritize technologies | [`docs/ui-information/Readme.md#5--public-sentiment--results--industry-voting-page-5png`](./docs/ui-information/Readme.md#5--public-sentiment--results--industry-voting-page-5png) |
| 5 | **Device Selection** | Explore tradeoffs + choose hardware | [`docs/ui-information/Readme.md#6--device-selection--investment-simulation-page-6png`](./docs/ui-information/Readme.md#6--device-selection--investment-simulation-page-6png) |
| 6 | **Key + Passport Output** | Generate artifact + present result | [`docs/ui-information/Readme.md#7--quantum-key-generation-results-page-7png`](./docs/ui-information/Readme.md#7--quantum-key-generation-results-page-7png) |

> Admin UI is available at **`/dashboard`** for managing sessions, invite codes, and analytics.

---

## Features (UI Modules)

This section describes **what the UI shows and collects**. Engineering/deployment details are covered below and in `/docs`.

### 1) Nobel Prize context module
UI presents laureate cards and explains how superconducting circuits enabled modern quantum computing, grounding the experience in real scientific milestones.

### 2) Quantum–blockchain threat analysis module
UI visualizes quantum risk (e.g., “Harvest Now, Decrypt Later” storyline and classical vs. quantum-safe comparison) and introduces PQC as a migration path.

### 3) Consent + transparency gate
UI enforces informed participation and clarifies data handling before allowing progression.

### 4) Community sentiment + voting module
UI collects a one-word sentiment signal and a single-choice prioritization vote, then renders aggregated results.

### 5) Device selection + tradeoff exploration module
UI supports choosing a device (simulator/QPU) and communicates tradeoffs such as availability and sustainability implications.

### 6) Key generation + passport output module
UI presents a demonstrative post-quantum output artifact, including device metadata and a shareable “passport” presentation.

---

## Docs

- **UI specification**: [`docs/ui-information/Readme.md`](./docs/ui-information/Readme.md)
- Docs folder index: [`/docs`](./docs)

If you are looking for **“how the UI works”**, start with the UI specification above.  
If you are looking for **“how to run or deploy”**, continue below.

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker (for deployment)
- AWS CLI configured with appropriate credentials
- AWS CDK v2 (`npm install -g aws-cdk`)

### Local Development

```bash
cd frontend
npm install

cp .env.example .env.local
# Edit .env.local with your AWS region and admin API key

npm run dev
````

App runs at `http://localhost:3000`.

---

## Environment Variables

| Variable                   | Required | Default                | Description                                |
| -------------------------- | -------- | ---------------------- | ------------------------------------------ |
| `AWS_REGION`               | No       | `us-east-1`            | AWS region for DynamoDB and Braket         |
| `ADMIN_API_KEY`            | Yes      | —                      | API key for admin dashboard authentication |
| `DDB_TABLE_SESSIONS`       | No       | `qc-bc-sessions`       | DynamoDB table name override               |
| `DDB_TABLE_SENTIMENTS`     | No       | `qc-bc-sentiments`     | DynamoDB table name override               |
| `DDB_TABLE_INDUSTRY_VOTES` | No       | `qc-bc-industry-votes` | DynamoDB table name override               |
| `DDB_TABLE_QUANTUM_KEYS`   | No       | `qc-bc-quantum-keys`   | DynamoDB table name override               |
| `DDB_TABLE_INVITE_CODES`   | No       | `qc-bc-invite-codes`   | DynamoDB table name override               |

---

## Architecture

Single-stack serverless deployment on AWS, managed by CDK:

```text
CloudFront (CDN)  →  API Gateway (HTTP)  →  Lambda (Next.js / Docker ARM64)
                                                  │
                                      ┌───────────┼───────────┐
                                  DynamoDB     Lambda       S3
                                 (7 tables)   (Braket)  (feedback)
```

* **Frontend** — Next.js App Router, compiled as a standalone Docker image running inside Lambda via Lambda Web Adapter. API routes are server-side; no AWS credentials are exposed to the browser.
* **Data** — DynamoDB on-demand tables (sessions, sentiments, votes, keys, invite codes, admins, feedback). Sessions can be persisted and restored.
* **Quantum** — Key generation is delegated to a dedicated Lambda that calls Amazon Braket (simulators + QPUs).
* **Infrastructure** — A single AWS CDK stack provisions the system. One-command deploy via `./deploy.sh`.

---

## Deployment

```bash
./deploy.sh
```

After deployment, the CloudFront distribution URL will be displayed in the stack outputs.
