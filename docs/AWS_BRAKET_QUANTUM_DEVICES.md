# AWS Braket Quantum Devices Summary

This document summarizes the quantum computing devices available through Amazon Braket, including their specifications, technologies, and characteristics.

---

## Overview

Amazon Braket provides access to quantum processing units (QPUs) from five hardware providers:
- **AQT** - Trapped Ion (Austria)
- **IonQ** - Trapped Ion (USA)
- **IQM** - Superconducting (Finland)
- **QuEra** - Neutral Atom (USA)
- **Rigetti** - Superconducting (USA)

Additionally, AWS offers on-demand and local simulators for development and testing.

---

## QPU Devices

### 1. AQT IBEX-Q1

| Property | Value |
|----------|-------|
| **Provider** | AQT (Alpine Quantum Technologies) |
| **Technology** | Trapped Ion |
| **Paradigm** | Gate-based |
| **Region** | eu-north-1 (Stockholm) |
| **ARN** | `arn:aws:braket:eu-north-1::device/qpu/aqt/Ibex-Q1` |

**Technical Details:**
- Uses ionized calcium (40Ca+) atoms trapped in a radio frequency trap
- Operates at room temperature in two 19-inch datacenter-compatible racks
- Ultra-high vacuum chamber for ion containment
- High-fidelity gates enabled by low heating rates
- Direct optical transition for qubit rotation using narrow linewidth laser
- All-to-all connectivity through long-range Coulomb interaction
- Single-ion addressing and readout via high numerical aperture lens

**Native Gates:** `prx`, `xx`, `rz`

**Supported Gates:** `ccnot`, `cnot`, `cphaseshift`, `cswap`, `swap`, `iswap`, `pswap`, `ecr`, `cy`, `cz`, `xy`, `xx`, `yy`, `zz`, `h`, `i`, `phaseshift`, `rx`, `ry`, `rz`, `s`, `si`, `t`, `ti`, `v`, `vi`, `x`, `y`, `z`, `prx`

---

### 2. IonQ Aria-1 / Forte-1 / Forte-Enterprise-1

| Property | Aria-1 | Forte-1 | Forte-Enterprise-1 |
|----------|--------|---------|-------------------|
| **Provider** | IonQ | IonQ | IonQ |
| **Technology** | Trapped Ion | Trapped Ion | Trapped Ion |
| **Paradigm** | Gate-based | Gate-based | Gate-based |
| **Region** | us-east-1 | us-east-1 | us-east-1 |

**Technical Details:**
- Uses trapped ytterbium (171Yb+) ions
- Ions are spatially confined using microfabricated surface electrode trap
- Qubits are individual ions in ultra-high vacuum chamber
- Atoms cooled to near absolute zero using laser techniques
- Laser pulse sequences for qubit preparation, manipulation, and readout

**Key Advantages:**
- **Ultra-high fidelity** quantum gates (world-leading gate error rates)
- **All-to-all connectivity** - every qubit can interact directly with any other
- **Long coherence times** for stable quantum states
- Scalable from 1 to 100+ qubits using the same fundamental hardware

**Native Gates:** `gpi`, `gpi2`, `ms` (Mølmer-Sørensen gate)

**Supported Gates:** `x`, `y`, `z`, `rx`, `ry`, `rz`, `h`, `cnot`, `s`, `si`, `t`, `ti`, `v`, `vi`, `xx`, `yy`, `zz`, `swap`

---

### 3. IQM Garnet / Emerald

| Property | Garnet | Emerald |
|----------|--------|---------|
| **Provider** | IQM Quantum Computers | IQM Quantum Computers |
| **Technology** | Superconducting Transmon | Superconducting Transmon |
| **Qubits** | 20 | 54 |
| **Topology** | Square/Crystal Lattice | Square/Crystal Lattice |
| **Paradigm** | Gate-based | Gate-based |
| **Region** | eu-north-1 | eu-north-1 |

**Technical Details:**
- Universal gate-model devices based on superconducting transmon qubits
- Square lattice topology (also known as Crystal lattice)
- Operates at temperatures near absolute zero (millikelvin range)
- Excels in scalability and control
- Focused on NISQ (Noisy Intermediate Scale Quantum) applications

**Key Advantages:**
- Low noise physical architecture
- Fast gate operations
- High scalability potential
- Best quality and accuracy for NISQ applications

**Native Gates:** `cz`, `prx`

**Supported Gates:** `ccnot`, `cnot`, `cphaseshift`, `cswap`, `swap`, `iswap`, `pswap`, `ecr`, `cy`, `cz`, `xy`, `xx`, `yy`, `zz`, `h`, `i`, `phaseshift`, `rx`, `ry`, `rz`, `s`, `si`, `t`, `ti`, `v`, `vi`, `x`, `y`, `z`

---

### 4. QuEra Aquila

| Property | Value |
|----------|-------|
| **Provider** | QuEra Computing |
| **Technology** | Neutral Atom (Rydberg) |
| **Qubits** | 256 |
| **Paradigm** | Analog Hamiltonian Simulation |
| **Region** | us-east-1 |
| **ARN** | `arn:aws:braket:us-east-1::device/qpu/quera/Aquila` |

**Technical Details:**
- First publicly accessible neutral-atom quantum computer (launched November 2022)
- Uses Rubidium atoms as qubits
- Atoms manipulated using optical tweezers (laser beams)
- Processor dimensions: 76μm x 75μm
- Minimal atom distance: 4μm
- Rabi frequency range: 0-2.5 2π MHz
- Global Rydberg detuning range: -20 to 20 2π MHz

**Key Advantages:**
- **High scalability** - 256 qubits available
- **Programmable layout** - dynamic qubit spatial rearrangement
- **All-to-all connectivity** through Rydberg interactions
- Natural fit for physics simulations (Ising model, materials science)
- Analog mode operation with flexible Hamiltonian configurations

**Use Cases:**
- Quantum simulation of physical systems
- Optimization problems
- Machine learning workflows
- String breaking simulations
- Quantum reservoir learning

---

### 5. Rigetti Ankaa-3

| Property | Value |
|----------|-------|
| **Provider** | Rigetti Computing |
| **Technology** | Superconducting |
| **Qubits** | 84 |
| **Paradigm** | Gate-based |
| **Region** | us-west-1 |
| **ARN** | `arn:aws:braket:us-west-1::device/qpu/rigetti/Ankaa-3` |

**Technical Specifications:**
- T1 Lifetime: 22μs
- T2 Lifetime: 19μs
- Single-qubit gate fidelity: 99.9%
- Two-qubit gate fidelity: 99.0%
- Deployed: December 20, 2024

**Technical Details:**
- All-tunable superconducting qubits
- Scalable multi-chip technology
- Tileable, tunable-coupler based architecture
- Custom "Fab-1" quantum integrated circuit foundry
- 3D integration with through-silicon vias
- Superconducting materials: aluminum, indium, niobium
- Cryogenic control systems with FPGA-based hardware
- Operates at millikelvin temperatures

**Key Advantages:**
- **Faster operation times** - nanosecond-level gate execution
- **Improved fidelities** through tunable couplers
- **Pulse-level control** available
- Quantum error correction readiness
- Hybrid quantum-classical computing capabilities

**Native Gates:** `rx`, `rz`, `iswap`

**Supported Gates:** `cz`, `xy`, `ccnot`, `cnot`, `cphaseshift`, `cswap`, `h`, `i`, `iswap`, `phaseshift`, `pswap`, `rx`, `ry`, `rz`, `s`, `si`, `swap`, `t`, `ti`, `x`, `y`, `z`

**Frame Types:** `flux_tx`, `charge_tx`, `readout_rx`, `readout_tx`

---

## AWS Simulators

### On-Demand Simulators

| Simulator | Type | Max Qubits | Regions |
|-----------|------|------------|---------|
| **SV1** | State Vector | 34 | us-east-1, us-west-1, us-west-2, eu-west-2 |
| **DM1** | Density Matrix | 17 | us-east-1, us-west-1, us-west-2, eu-west-2 |
| **TN1** | Tensor Network | 50 | us-east-1, us-west-2, eu-west-2 |

### Local Simulators

| Simulator | Type | Description |
|-----------|------|-------------|
| **braket_sv** | State Vector | Default local simulator |
| **braket_dm** | Density Matrix | Noise simulation capable |
| **braket_ahs** | AHS | Analog Hamiltonian Simulation |

---

## Technology Comparison

| Technology | Temperature | Gate Speed | Connectivity | Scalability | Error Rate |
|------------|-------------|------------|--------------|-------------|------------|
| **Trapped Ion** | Room temp / Cold | ~ms | All-to-all | Medium | Very Low |
| **Superconducting** | ~15 mK | ~ns | Nearest neighbor | High | Low |
| **Neutral Atom** | ~μK | ~μs | Programmable | Very High | Medium |

---

## 3D Visualization Concepts

### Trapped Ion (IonQ, AQT)
- Linear chain of glowing ions suspended in electromagnetic trap
- Laser beams hitting individual ions
- Purple/violet glow representing quantum states
- Pulsing effects for gate operations

### Superconducting (IQM, Rigetti)
- Chip-like structure with visible qubit nodes
- Square/hexagonal lattice topology
- Connection lines between coupled qubits
- Cyan/blue glow for superconducting effects
- Frost/cold visual effects

### Neutral Atom (QuEra)
- 2D array of atoms held by optical tweezers
- Red/green laser beams from above
- Atoms arranged in programmable patterns
- Rydberg excitation visual effects

### Cloud Simulator (AWS SV1)
- Server rack visualization
- Data flow animations
- Processing status LEDs
- Cloud/network effects

---

## References

- [Amazon Braket Supported Devices](https://docs.aws.amazon.com/braket/latest/developerguide/braket-devices.html)
- [Submitting Quantum Tasks to QPUs](https://docs.aws.amazon.com/braket/latest/developerguide/braket-submit-tasks.html)
- [AWS Braket Quantum Computers](https://aws.amazon.com/braket/quantum-computers/)
- [IonQ Technology](https://ionq.com/technology)
- [Rigetti What We Build](https://www.rigetti.com/what-we-build)
- [QuEra Aquila](https://www.quera.com/aquila)
- [IQM Products](https://www.meetiqm.com/products)
