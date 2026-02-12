# Quantum Futures Interactive — UI Page Descriptions

## Page 1: Welcome Page (`page-1.png`)

**Concise:** This is the welcome page introducing the 2025 Nobel Prize in Physics for quantum computing breakthroughs, featuring three laureates (John Clarke, Michel Devoret, John Martinis) with a "Start Journey" button to begin the interactive experience.

**Detailed:** The welcome page serves as the entry point for the Quantum Futures Interactive platform. It highlights the 2025 Nobel Prize in Physics, awarded for pioneering experiments in macroscopic quantum tunneling and energy quantization in superconducting circuits. Three laureate cards are displayed — John Clarke (UC Berkeley), Michel Devoret (Yale University), and John Martinis (UC Santa Barbara) — each with a photo, affiliation, brief contribution summary, and a "More" link for additional details. A summary paragraph at the bottom explains how their work enabled artificial atoms from superconducting circuits, forming the qubits in today's quantum computers and their implications for blockchain security. The user can click "Start Journey" to proceed, and a step indicator at the top shows this is step 1 of 6.

---

## Page 2: Quantum Meets Blockchain (`page-2.png`)

**Concise:** This educational page explains the threat quantum computing poses to current blockchain cryptography and presents NIST's post-quantum cryptographic standards as the solution, with a vulnerability index showing how exposed various algorithms are.

**Detailed:** The page is divided into two major sections: "The Threat" and "The Solution." The threat section explains that blockchain security relies on mathematical problems classical computers cannot solve, but quantum computers using Shor's and Grover's algorithms can break them. A Quantum Vulnerability Index visualizes the risk levels of common cryptographic algorithms (ECDSA, RSA-2048, DH Key Exchange, SHA-256, AES-256) with color-coded progress bars. A Bitcoin example illustrates real-world exposure. The solution section describes NIST's finalized post-quantum-resistant algorithms and compares current blockchain cryptography with quantum-safe alternatives (ML-DSA/FALCON, ML-KEM, SHA-3/SPHINCS+). A migration note references Ethereum's Vitalik Buterin and Google Chrome's adoption of post-quantum TLS. The user can navigate with "Back" and "Next" buttons.

---

## Page 3: Experience Overview / Consent (`page-3.png`)

**Concise:** This transition page outlines the four upcoming interactive steps (share thoughts, vote on technologies, choose a quantum device, generate a key) and asks the user to consent to anonymous participation before proceeding.

**Detailed:** Titled "Time to Experience Quantum," this page bridges the educational content and the hands-on interactive portion. It presents a "What's Next" card listing four steps the user will complete: (1) share thoughts on quantum computing, (2) vote on blockchain quantum technologies, (3) choose a real quantum device, and (4) generate a quantum-resistant key. Below the steps, a consent checkbox informs the user that participation is anonymous and voluntary, and that data collected will be used for research purposes only. The checkbox must be agreed to before proceeding. The step indicator at the top shows this is step 3 of 6, and the user can click "Let's Go" to continue or "Back" to return.

---

## Page 4: Public Sentiment — Input (`page-4.png`)

**Concise:** This page asks the user to type the first word that comes to mind when they hear "quantum computing" and submit their response.

**Detailed:** The Public Sentiment page collects user sentiment data about quantum computing. It displays a simple prompt: "What's the first word that comes to mind when you hear 'quantum computing'?" with a text input field where the user types their response. In the screenshot, the word "expensive" has been entered as an example. The interface is minimalist and focused, keeping the user's attention on the single task of providing their word association. The step indicator shows this is step 4 of 6, and the user can click "Submit" to send their response or "Back" to return to the previous page.

---

## Page 5: Public Sentiment — Results & Industry Voting (`page-5.png`)

**Concise:** This page displays a word cloud of community sentiment responses and lets the user vote on which blockchain quantum technology they believe matters most, with live community vote results shown as a bar chart.

**Detailed:** After submitting their sentiment word, the user sees the aggregated community responses visualized as a word cloud, where word size reflects frequency (words like "magic," "expensive," "cool" are visible). A legend distinguishes the user's own response from community responses. Below the word cloud, the "Which Blockchain Quantum Technology Matters Most?" section presents six technology cards to vote on: Post-Quantum Signatures, Quantum Key Distribution, Hash-based Cryptography, Quantum Random Numbers, Quantum-Safe Smart Contracts, and Zero-Knowledge Proofs — each with a brief description. A "Community Votes" bar chart at the bottom shows real-time voting results with percentages and vote counts for each technology. The user can click "Continue" to proceed after voting.

---

## Page 6: Device Selection / Investment Simulation (`page-6.png`)

**Concise:** This page presents a simulated investment scenario where the user explores and selects from real quantum devices (classical simulators and QPUs), reviews environmental impact calculations, and confirms their device choice.

**Detailed:** Titled "Invest in a Quantum Device," this page asks the user to imagine investing $1,000,000 USD in one quantum device. The top section displays Classical Simulators (AWS SV1, DM1, TN1) with specs like qubit count, cost per task, and capabilities. Below that, Quantum Processing Unit (QPU) cards show real hardware options — IonQ Aria, IonQ Forte, AQT, IQM Garnet, IQM Emerald, Rigetti Ankaa-3, and QuEra Aquila — each with qubit count, gate fidelity, connectivity type, and status indicators. An Environmental Impact section includes a calculator with selectable methodology (LCA or simplified), region parameters, and a device comparison table showing energy usage, carbon footprint, and sustainability scores. A detailed quantum computing news/analysis section and device summary appear at the bottom. The user selects a device and clicks "Confirm Investment" to proceed.

---

## Page 7: Quantum Key Generation Results (`page-7.png`)

**Concise:** This final results page displays the user's successfully generated quantum-resistant digital signature, including their unique Quantum ID, cryptographic keys, device information, and a button to complete the journey.

**Detailed:** The page confirms that the user's personalized quantum-resistant key has been generated using their selected device (Amazon Braket SV1 in this example) with a "Signature Created Successfully!" banner. It shows a Quantum ID (a quantum-generated unique identifier displaying "0.2266"), derived from quantum superposition measurements. The Quantum-Resistant Keys section displays the algorithm used (ToyLWE-Quantum-Seeded-Demo with Lattice-Based classification), the full public key string, and the digital signature. A Device Information card summarizes the quantum device name, processing type (AWS Braket), job ID, and completion status. An "About Post-Quantum Security" note explains that the signature uses quantum-resistant cryptography designed to withstand attacks from both classical and future quantum computers. The user clicks "Complete Journey" to finish the experience.
