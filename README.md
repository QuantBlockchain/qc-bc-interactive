# ⚛️ Quantum Blockchain Interactive

<p align="center">
  <b>
  An interdisciplinary demonstration of post-quantum cryptography, blockchain risk awareness,
  and sustainable distributed trust through interactive user experience and real quantum hardware execution.
  </b>
</p>

<p align="center">
  <i>
  “What I cannot create, I do not understand.”
  </i><br/>
  — Richard Feynman
</p>

<br/>

<p align="center">
  <a href="./docs/ui-information/Readme.md">
    <img alt="UI Walkthrough" src="https://img.shields.io/badge/UI-Experience-blue">
  </a>
  <a href="#getting-started-local-development">
    <img alt="Run Locally" src="https://img.shields.io/badge/Run-Local%20Development-22c55e">
  </a>
  <a href="#cloud-deployment">
    <img alt="Deploy AWS" src="https://img.shields.io/badge/Deploy-AWS%20CDK-f59e0b">
  </a>
</p>

<p align="center">
  ⚛️ Quantum Computing &nbsp;&nbsp;•&nbsp;&nbsp;
  🔐 Post-Quantum Cryptography &nbsp;&nbsp;•&nbsp;&nbsp;
  ⛓️ Blockchain Security &nbsp;&nbsp;•&nbsp;&nbsp;
  ☁️ AWS Braket
</p>

---

## 🌐 Demo Contribution Summary

**Quantum Blockchain Interactive** is a research demonstration exploring the transition toward quantum-resilient blockchain infrastructure through a guided interactive experience.

The platform integrates:

- ⚛️ post-quantum cryptography,
- ⛓️ blockchain security risk awareness,
- ☁️ real quantum hardware execution,

into a unified demonstrator designed for interdisciplinary audiences.

The demo illustrates:

- how advances in quantum computing affect current blockchain cryptographic assumptions,
- how post-quantum cryptographic mechanisms can be introduced through participatory interfaces,
- how infrastructure decisions and stakeholder perception influence adoption dynamics,
- how distributed trust systems evolve under emerging computational paradigms.

Unlike demonstrations focused solely on protocol implementation or algorithmic benchmarking, this system emphasizes the interaction between technical security mechanisms, ecosystem understanding, and adoption processes. Participants experience post-quantum migration through a structured interaction flow culminating in the generation of a quantum-resistant cryptographic artifact using **Amazon Braket**.

---

## 🧭 Overview

Quantum Blockchain Interactive is an interactive web platform designed for:

- 🎤 live demonstrations  
- 🧪 workshops and exhibitions  
- 🌍 public engagement  

The experience connects quantum computing progress, blockchain security challenges, and post-quantum cryptography through a structured user journey.

Participants move from scientific context and risk awareness to participatory interaction and infrastructure exploration, concluding with the generation of a quantum-safe cryptographic key — a personalized **Quantum-Safe Blockchain Passport**.

The project serves simultaneously as:

- 📘 an educational interface for emerging cryptographic transitions,
- 🔬 a research demonstration of interdisciplinary technology adoption,
- 🚀 a deployable interactive system for events and exhibitions.

---

## 📚 Table of Contents

- [Experience (UI Journey)](#experience-ui-journey)
- [System Architecture](#system-architecture)
- [Configuration](#configuration)
- [Getting Started (Local Development)](#getting-started-local-development)
- [Cloud Deployment](#cloud-deployment)

---

## 🎮 Experience (UI Journey)

The application presents a **7-page guided interaction flow** that progressively introduces quantum computing concepts and blockchain security implications while remaining accessible to mixed technical audiences.

👉 Detailed UI documentation:  
[`docs/ui-information/Readme.md`](./docs/ui-information/Readme.md)

---

### 🗺️ Journey Overview

| Page | Screen | Experience Goal | UI Module |
|------|--------|----------------|-----------|
| **Page 1** | Nobel Prize Context | Establish scientific grounding | Scientific context module |
| **Page 2** | Quantum Meets Blockchain | Explain quantum threat and PQC transition | Threat analysis module |
| **Page 3** | Experience Overview / Consent | Establish transparency and participation rules | Consent & session module |
| **Page 4** | Public Sentiment | Capture perception and engagement | Sentiment input module |
| **Page 5** | Results & Industry Voting | Aggregate community priorities | Voting & visualization module |
| **Page 6** | Device Selection | Explore infrastructure and hardware tradeoffs | Device exploration module |
| **Page 7** | Quantum-Safe Passport | Present cryptographic outcome artifact | Key generation & result module |

---

### 🧩 Experience Design Principles

The interaction flow mirrors real-world technology adoption and post-quantum transition processes.

| Design Principle | Pages | Role in Experience |
|------------------|-------|-------------------|
| **Context → Understanding** | Pages 1–2 | Establish shared scientific and security context |
| **Participation → Reflection** | Pages 3–5 | Transform learning into interaction and feedback |
| **Decision → Outcome** | Pages 6–7 | Connect infrastructure choices to cryptographic results |

This progression allows participants to understand post-quantum migration as both a technical and socio-technical transition involving research, engineering, governance, and investment perspectives.

---

### 🛠️ Admin Dashboard

A protected dashboard at `/dashboard` provides:

- 📊 session monitoring and activity metrics
- 🔑 invite code management
- ☁️ sentiment and voting aggregation
- 📝 feedback review and export

---

## 🏗️ System Architecture

The repository contains both the interactive frontend and the infrastructure required to deploy it as a serverless application on AWS.

```

CloudFront (CDN)
↓
API Gateway (HTTP)
↓
Lambda (Next.js / Docker ARM64)
│
┌──────┼────────────┐
DynamoDB        Lambda        S3
(data)          (Braket)     (feedback)

````

### Components

- **Frontend** — Next.js App Router running inside AWS Lambda.
- **API Layer** — Server-side API routes; credentials remain private.
- **Data Layer** — DynamoDB tables for sessions, sentiments, votes, keys, and invite codes.
- **Quantum Integration** — Lambda invoking Amazon Braket simulators or QPUs.
- **Infrastructure** — Provisioned using a single AWS CDK stack.

---

## ⚙️ Configuration

Application behavior is configured through environment variables used in both local development and cloud deployment.

### 💻 Local Configuration

Create:

```bash
frontend/.env.local
````

Example:

```bash
AWS_REGION=us-east-1
ADMIN_API_KEY=your-key
```

### ☁️ Cloud Configuration

Environment variables are injected into Lambda functions through AWS CDK during deployment. These values remain server-side and are never exposed to the browser.

| Variable                   | Required | Default                | Description                        |
| -------------------------- | -------- | ---------------------- | ---------------------------------- |
| `AWS_REGION`               | No       | `us-east-1`            | AWS region for DynamoDB and Braket |
| `ADMIN_API_KEY`            | Yes      | —                      | Admin dashboard authentication     |
| `DDB_TABLE_SESSIONS`       | No       | `qc-bc-sessions`       | Sessions table                     |
| `DDB_TABLE_SENTIMENTS`     | No       | `qc-bc-sentiments`     | Sentiment storage                  |
| `DDB_TABLE_INDUSTRY_VOTES` | No       | `qc-bc-industry-votes` | Voting storage                     |
| `DDB_TABLE_QUANTUM_KEYS`   | No       | `qc-bc-quantum-keys`   | Generated keys                     |
| `DDB_TABLE_INVITE_CODES`   | No       | `qc-bc-invite-codes`   | Invite code storage                |

---

## 🚀 Getting Started (Local Development)

Run the application locally for development or testing.

### Prerequisites

* Node.js 20+
* Docker
* AWS CLI configured
* AWS CDK v2

### Run Locally

```bash
cd frontend
npm install

cp .env.example .env.local
npm run dev
```

Application runs at:

```
http://localhost:3000
```

---

## ☁️ Cloud Deployment

Deploy the application to AWS using CDK:

```bash
./deploy.sh
```

Deployment performs:

1. Frontend container build
2. Infrastructure provisioning via AWS CDK
3. Lambda, API Gateway, DynamoDB, and CloudFront configuration
4. Output of the public application URL

After deployment, the application runs fully serverlessly and is ready for live demonstrations or production use.

