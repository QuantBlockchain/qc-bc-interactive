# Quantum Futures Interactive — UI Page Descriptions

This document provides a **technical, implementation-oriented walkthrough** of each user interface screen in **Quantum Futures Interactive**. It is written for engineers, designers, researchers, and reviewers who require a structured understanding of **screen purpose, user flow, captured data, and system intent**.

> ⚠️ **Note:** Some narrative elements (e.g., Nobel Prize references or named individuals) may be prototype storytelling content and should be treated as configurable UI copy rather than verified historical claims.

---

## 📚 Contents

* [UX Flow Summary](#ux-flow-summary)
* [Screens](#screens)

  * [1. 🚀 Welcome](#1--welcome-page-1png)
  * [2. ⚛️ Quantum Meets Blockchain](#2--quantum-meets-blockchain-page-2png)
  * [3. ✅ Experience Overview / Consent](#3--experience-overview--consent-page-3png)
  * [4. 💬 Public Sentiment Input](#4--public-sentiment--input-page-4png)
  * [5. 📊 Sentiment Results & Industry Voting](#5--public-sentiment--results--industry-voting-page-5png)
  * [6. 🧪 Device Selection / Investment Simulation](#6--device-selection--investment-simulation-page-6png)
  * [7. 🔐 Quantum Key Generation Results](#7--quantum-key-generation-results-page-7png)
* [📖 Glossary](#-glossary)

---

## UX Flow Summary

<div style="display:flex; gap:12px; flex-wrap:wrap; align-items:stretch; margin:12px 0;">
  <div style="flex:1; min-width:260px; border:1px solid #e5e7eb; border-radius:12px; padding:12px;">
    <b>🧭 Experience Steps (1 → 6)</b>
    <ul>
      <li>🚀 <b>Step 1:</b> Welcome / context framing</li>
      <li>⚛️ <b>Step 2:</b> Education (quantum threat + PQC mitigation)</li>
      <li>✅ <b>Step 3:</b> Transition + consent gate</li>
      <li>💬 <b>Step 4:</b> Sentiment input</li>
      <li>📊 <b>Step 5:</b> Community results + voting</li>
      <li>🧪 <b>Step 6:</b> Device selection</li>
      <li>🔐 <b>Final:</b> PQ signature generation</li>
    </ul>
  </div>
  <div style="flex:1; min-width:260px; border:1px solid #e5e7eb; border-radius:12px; padding:12px;">
    <b>🗂️ Data Captured</b>
    <ul>
      <li>✅ Consent acknowledgement</li>
      <li>💬 One-word sentiment input</li>
      <li>🗳️ Technology vote</li>
      <li>🧪 Selected device</li>
      <li>🔐 Generated identifier + key metadata</li>
    </ul>
  </div>
</div>

---

## Screens

---

### 1. 🚀 Welcome (`page-1.png`)

<figure style="margin:16px 0; padding:12px; border:1px solid #e5e7eb; border-radius:14px; box-shadow:0 1px 2px rgba(0,0,0,0.06);">
  <img src="page-1.png" alt="Welcome page UI" style="width:100%; border-radius:10px;">
  <figcaption style="margin-top:10px; color:#374151;">
    <b>Figure 1.</b> Welcome screen introducing the experience and presenting featured contributor cards with a primary call-to-action.
  </figcaption>
</figure>

<div style="border-left:4px solid #d1d5db; padding:10px 12px; margin:10px 0;">
  <b>🎯 Purpose</b><br/>
  Establish narrative context and provide the entry point into the guided experience.
</div>

**UI Highlights**

* ⚛️ Introductory framing of quantum computing breakthroughs.
* 👤 Three profile cards with image, affiliation, and contribution summary.
* 🔘 Primary CTA: **Start Journey**.
* 📍 Step indicator: **Step 1 of 6**.

**User Actions**

* Begin flow via **Start Journey**.
* Open additional details via **More** links.

---

### 2. ⚛️ Quantum Meets Blockchain (`page-2.png`)

<figure style="margin:16px 0; padding:12px; border:1px solid #e5e7eb; border-radius:14px; box-shadow:0 1px 2px rgba(0,0,0,0.06);">
  <img src="page-2.png" alt="Quantum meets blockchain UI" style="width:100%; border-radius:10px;">
  <figcaption style="margin-top:10px; color:#374151;">
    <b>Figure 2.</b> Educational module illustrating quantum risk to classical cryptography and post-quantum mitigation approaches.
  </figcaption>
</figure>

<div style="border-left:4px solid #d1d5db; padding:10px 12px; margin:10px 0;">
  <b>🎯 Purpose</b><br/>
  Explain the quantum threat model and introduce post-quantum cryptography as a migration path.
</div>

**Layout**

* ⚠️ **The Threat:** Quantum algorithms affecting classical cryptography.
* 🛡️ **The Solution:** NIST post-quantum standards and alternatives.

**Key Visual Elements**

* 📈 Quantum Vulnerability Index (risk visualization).
* 🔄 Mapping between classical and quantum-safe algorithms.

**Navigation**

* ⬅️ **Back**
* ➡️ **Next**

---

### 3. ✅ Experience Overview / Consent (`page-3.png`)

<figure style="margin:16px 0; padding:12px; border:1px solid #e5e7eb; border-radius:14px; box-shadow:0 1px 2px rgba(0,0,0,0.06);">
  <img src="page-3.png" alt="Experience overview and consent UI" style="width:100%; border-radius:10px;">
  <figcaption style="margin-top:10px; color:#374151;">
    <b>Figure 3.</b> Transition screen outlining upcoming interactive steps and requiring consent before continuing.
  </figcaption>
</figure>

<div style="border-left:4px solid #d1d5db; padding:10px 12px; margin:10px 0;">
  <b>🎯 Purpose</b><br/>
  Transition from educational content into participation while enforcing consent requirements.
</div>

**Upcoming Steps**

1. 💬 Share a quantum computing impression
2. 🗳️ Vote on blockchain technologies
3. 🧪 Choose a quantum device
4. 🔐 Generate a quantum-resistant key

**Consent Gate**

* ✅ Anonymous participation checkbox required.
* 🔒 Data used for research purposes only.
* CTA **Let’s Go** enabled only after consent.

---

### 4. 💬 Public Sentiment — Input (`page-4.png`)

<figure style="margin:16px 0; padding:12px; border:1px solid #e5e7eb; border-radius:14px; box-shadow:0 1px 2px rgba(0,0,0,0.06);">
  <img src="page-4.png" alt="Public sentiment input UI" style="width:100%; border-radius:10px;">
  <figcaption style="margin-top:10px; color:#374151;">
    <b>Figure 4.</b> Single-field sentiment capture asking for a one-word association with quantum computing.
  </figcaption>
</figure>

<div style="border-left:4px solid #d1d5db; padding:10px 12px; margin:10px 0;">
  <b>🎯 Purpose</b><br/>
  Collect lightweight sentiment data suitable for aggregation and visualization.
</div>

**Interaction**

* Prompt requesting a single word.
* ✏️ Text input field.
* ✅ **Submit** / ⬅️ **Back**.

**Implementation Notes**

* Normalize input (trim, case handling).
* Optional filtering and length limits.
* Store anonymously per session.

---

### 5. 📊 Public Sentiment — Results & Industry Voting (`page-5.png`)

<figure style="margin:16px 0; padding:12px; border:1px solid #e5e7eb; border-radius:14px; box-shadow:0 1px 2px rgba(0,0,0,0.06);">
  <img src="page-5.png" alt="Word cloud and voting UI" style="width:100%; border-radius:10px;">
  <figcaption style="margin-top:10px; color:#374151;">
    <b>Figure 5.</b> Aggregated sentiment visualization and technology voting interface with community results.
  </figcaption>
</figure>

<div style="border-left:4px solid #d1d5db; padding:10px 12px; margin:10px 0;">
  <b>🎯 Purpose</b><br/>
  Reflect community input while capturing a prioritized technology preference.
</div>

**Section A — Word Cloud**

* ☁️ Frequency-based visualization.
* Highlighting of user contribution.

**Section B — Technology Voting**

* 🗳️ Single-choice vote across six technologies:

  * Post-Quantum Signatures
  * Quantum Key Distribution
  * Hash-based Cryptography
  * Quantum Random Numbers
  * Quantum-Safe Smart Contracts
  * Zero-Knowledge Proofs

**Community Results**

* 📊 Live bar chart with counts and percentages.

---

### 6. 🧪 Device Selection / Investment Simulation (`page-6.png`)

<figure style="margin:16px 0; padding:12px; border:1px solid #e5e7eb; border-radius:14px; box-shadow:0 1px 2px rgba(0,0,0,0.06);">
  <img src="page-6.png" alt="Device selection and investment simulation UI" style="width:100%; border-radius:10px;">
  <figcaption style="margin-top:10px; color:#374151;">
    <b>Figure 6.</b> Quantum device exploration interface with simulator and QPU comparison plus environmental impact assessment.
  </figcaption>
</figure>

<div style="border-left:4px solid #d1d5db; padding:10px 12px; margin:10px 0;">
  <b>🎯 Purpose</b><br/>
  Introduce real-world tradeoffs between quantum hardware, simulation environments, and sustainability considerations.
</div>

**Device Categories**

* 🖥️ Classical simulators
* ⚛️ Quantum Processing Units (QPUs)

**Displayed Parameters**

* Qubit count
* Gate fidelity / quality metric
* Connectivity model
* Availability status

**Environmental Module**

* 🌱 Methodology selection (LCA or simplified).
* ⚡ Energy usage and carbon comparison.
* 📉 Sustainability scoring.

**Action**

* Select device → **Confirm Investment**.

---

### 7. 🔐 Quantum Key Generation Results (`page-7.png`)

<figure style="margin:16px 0; padding:12px; border:1px solid #e5e7eb; border-radius:14px; box-shadow:0 1px 2px rgba(0,0,0,0.06);">
  <img src="page-7.png" alt="Quantum key generation results UI" style="width:100%; border-radius:10px;">
  <figcaption style="margin-top:10px; color:#374151;">
    <b>Figure 7.</b> Final results screen showing generated identifier, cryptographic output, and device execution metadata.
  </figcaption>
</figure>

<div style="border-left:4px solid #d1d5db; padding:10px 12px; margin:10px 0;">
  <b>🎯 Purpose</b><br/>
  Present a completion artifact summarizing cryptographic output and execution context.
</div>

**Displayed Outputs**

* ✅ Success confirmation banner
* 🔢 Quantum ID
* 🔐 Public key and signature
* ⚙️ Algorithm classification

**Execution Metadata**

* Device name and provider
* Processing type
* Job ID and status

**Completion**

* 📘 Educational note on post-quantum security.
* ✅ **Complete Journey** button.

---

## 📖 Glossary

| Term                                  | Definition                                                                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Quantum Computing**                 | A computing paradigm using quantum mechanical phenomena such as superposition and entanglement to perform computations. |
| **Qubit**                             | The basic unit of quantum information, capable of existing in multiple states simultaneously.                           |
| **PQC (Post-Quantum Cryptography)**   | Cryptographic algorithms designed to remain secure against attacks from quantum computers.                              |
| **Shor’s Algorithm**                  | A quantum algorithm capable of efficiently factoring large integers, threatening RSA and ECC cryptography.              |
| **Grover’s Algorithm**                | A quantum search algorithm that reduces brute-force search complexity.                                                  |
| **ECDSA**                             | Elliptic Curve Digital Signature Algorithm used widely in blockchain systems.                                           |
| **RSA**                               | Public-key cryptographic system based on integer factorization difficulty.                                              |
| **KEM (Key Encapsulation Mechanism)** | Cryptographic method used for secure key exchange in post-quantum systems.                                              |
| **Lattice-Based Cryptography**        | PQC approach based on hardness of lattice problems such as Learning With Errors (LWE).                                  |
| **QPU (Quantum Processing Unit)**     | Hardware device that executes quantum circuits.                                                                         |
| **Quantum Simulator**                 | Classical system that simulates quantum computations.                                                                   |
| **Word Cloud**                        | Visualization where word size represents frequency of occurrence.                                                       |
| **LCA (Life Cycle Assessment)**       | Methodology for evaluating environmental impact across a system’s lifecycle.                                            |
| **Digital Signature**                 | Cryptographic proof verifying authenticity and integrity of data.                                                       |
| **Quantum ID**                        | Identifier derived from quantum or quantum-seeded randomness within the experience.                                     |

