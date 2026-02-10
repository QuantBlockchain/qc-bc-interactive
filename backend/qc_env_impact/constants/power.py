"""Power consumption constants for quantum computers."""

# Compressor power consumption in kW (per compressor unit)
COMPRESSOR_POWER_KW: float = 10.7

# Gas Handling System (GHS) power consumption in kW
# Each GHS operates 2 compressors
GHS_POWER_KW: float = 1.8

# Quantum Error Correction (QEC) electronics power consumption
# Power per physical qubit in the cryostat (Watts)
QEC_CRYOSTAT_POWER_W: float = 36.0

# Power per physical qubit in the racks (Watts)
QEC_RACK_POWER_W: float = 209.0

# QEC Overhead Factors (physical qubits per logical qubit)
BOSONIC_GKP_OVERHEAD: int = 7
SURFACE_CODE_OVERHEAD: int = 1000
