# Quantum Blockchain Interactive
 
An interactive web platform that guides users through the intersection of quantum computing and blockchain security. Built for live events and workshops, the experience connects the 2025 Nobel Prize in Physics to real quantum hardware on AWS Braket, culminating in the generation of a quantum-resistant cryptographic key — your personal **Quantum-Safe Blockchain Passport**.

## The Experience

Users progress through a 7-step guided journey:

| Step | Page | Description |
|------|------|-------------|
| 0 | **Nobel Prize** | 2025 Physics laureates (Clarke, Devoret, Martinis) and the superconducting circuits that enabled quantum computing |
| 1 | **Quantum Meets Blockchain** | Interactive threat analysis: vulnerability index, "Harvest Now Decrypt Later" timeline, classical vs. quantum-safe comparison |
| 2 | **Time to Experience Quantum** | Consent, invite code validation, and journey preview |
| 3 | **Public Sentiment** | Word cloud contribution + community blockchain technology vote across 6 post-quantum technologies |
| 4 | **Device Selection** | Choose from 10 real quantum devices across 4 hardware paradigms, each with interactive 3D visualizations |
| 5 | **Key Generation** | Generate a quantum-resistant cryptographic key using the selected device via Amazon Braket |
| 6 | **Quantum-Safe Passport** | Receive a personalized certificate with your quantum key, journey summary, storyline, and email delivery |

An admin dashboard is available at `/dashboard` for managing sessions, invite codes, and viewing aggregated analytics.

## Features

### Nobel Prize Context

The journey begins with the 2025 Nobel Prize in Physics, awarded to John Clarke, Michel Devoret, and John Martinis for demonstrating macroscopic quantum tunneling and energy quantization in superconducting circuits. Each laureate is presented with their portrait, affiliation, key contribution, and an expandable biography explaining how their work enabled modern quantum computers.

### Quantum-Blockchain Threat Analysis

An educational page that makes the quantum threat to blockchain tangible through:

- **Quantum Vulnerability Index** — Animated bar chart showing risk levels for ECDSA, RSA, DH, SHA-256, and AES under fault-tolerant quantum computing
- **"Harvest Now, Decrypt Later"** — SVG timeline illustrating how nation-state actors stockpile encrypted data today for future quantum decryption
- **Key Statistics** — 4M+ BTC in exposed wallets, estimated Q-Day in the 2030s, NIST PQC standards finalized in 2024
- **Bitcoin Case Study** — Concrete example of Satoshi's early P2PK wallets as quantum-vulnerable assets
- **Side-by-Side Comparison** — Current blockchain cryptography (broken) vs. quantum-safe alternatives (NIST-standardized)
- **Migration Context** — Real-world examples: Ethereum's quantum-resistant proposals, Chrome's ML-KEM deployment, NIST's 2035 transition timeline

### Community Sentiment & Voting

Users contribute a word to a real-time community word cloud, then vote on which blockchain quantum technology matters most:

- Post-Quantum Signatures
- Quantum Key Distribution
- Hash-based Cryptography
- Quantum Random Numbers
- Quantum-Safe Smart Contracts
- Zero-Knowledge Proofs

Live community results are displayed as animated bar charts with vote counts and percentages.

### Quantum Device Selection

Users choose from 10 real quantum computing devices available through Amazon Braket, spanning 4 hardware paradigms:

| Paradigm | Devices | Qubits |
|----------|---------|--------|
| Simulators | SV1, DM1, TN1 | Up to 50 |
| Ion Trap | IonQ Aria, IonQ Forte, AQT IBEX Q1 | 12 -- 36 |
| Superconducting | IQM Garnet, IQM Emerald, Rigetti Ankaa-3 | 20 -- 84 |
| Neutral Atom | QuEra Aquila | 256 |

Each device card includes detailed specifications, technology explanations, and an interactive 3D visualization of the hardware paradigm.

### Quantum Key Generation

The selected device is used to generate a quantum-resistant digital signature through Amazon Braket. The key generation process uses lattice-based cryptography (ToyLWE) seeded with quantum randomness, producing:

- A quantum-generated unique ID
- A post-quantum public key
- A digital signature
- Full device and algorithm metadata

### Quantum-Safe Blockchain Passport

The final page frames the generated key as a **Quantum-Safe Blockchain Passport** — a visual certificate that includes:

- Passport ID derived from quantum randomness
- Journey data (device, vote, sentiment)
- Truncated public key and digital signature with copy functionality
- A narrative explaining what the key means in the context of blockchain's post-quantum migration
- Email input to "receive" the passport (UI-ready, backend integration pending)
- Actionable next steps: Share, Learn, Prepare

### Admin Dashboard

A protected dashboard at `/dashboard` provides:

- Session count and activity metrics
- Top sentiment words and voting distribution
- Invite code management (create, delete, track usage)
- User feedback review with file attachment support
- Full data export capability

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for deployment)
- AWS CLI configured with appropriate credentials
- AWS CDK v2 (`npm install -g aws-cdk`)

### Local Development

```bash
# Install dependencies
cd frontend
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your AWS region and admin API key

# Start dev server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AWS_REGION` | No | `us-east-1` | AWS region for DynamoDB and Braket |
| `ADMIN_API_KEY` | Yes | &mdash; | API key for admin dashboard authentication |
| `DDB_TABLE_SESSIONS` | No | `qc-bc-sessions` | DynamoDB table name override |
| `DDB_TABLE_SENTIMENTS` | No | `qc-bc-sentiments` | DynamoDB table name override |
| `DDB_TABLE_INDUSTRY_VOTES` | No | `qc-bc-industry-votes` | DynamoDB table name override |
| `DDB_TABLE_QUANTUM_KEYS` | No | `qc-bc-quantum-keys` | DynamoDB table name override |
| `DDB_TABLE_INVITE_CODES` | No | `qc-bc-invite-codes` | DynamoDB table name override |

## Architecture

Single-stack serverless deployment on AWS, managed by CDK:

```
CloudFront (CDN)  →  API Gateway (HTTP)  →  Lambda (Next.js / Docker ARM64)
                                                  │
                                      ┌───────────┼───────────┐
                                  DynamoDB     Lambda       S3
                                 (7 tables)   (Braket)  (feedback)
```

- **Frontend** — Next.js 15 App Router, compiled as a standalone Docker image running inside Lambda via [Lambda Web Adapter](https://github.com/awslabs/aws-lambda-web-adapter). All API routes are server-side; no AWS credentials are exposed to the browser.
- **Data** — 7 DynamoDB on-demand tables (sessions, sentiments, votes, keys, invite codes, admins, feedback). User sessions are persisted and restored automatically.
- **Quantum** — Key generation is delegated to a dedicated Lambda that calls Amazon Braket. Supports both simulators and real QPU hardware.
- **Infrastructure** — A single AWS CDK stack (`QcBcInteractiveCdkStack`) provisions everything. One-command deploy via `./deploy.sh`.

## Deployment

```bash
# From project root
./deploy.sh
```

After deployment, the CloudFront distribution URL will be displayed in the stack outputs.
