"""Production and lifecycle emission factors for LCA calculations."""

from dataclasses import dataclass
from typing import Dict


@dataclass(frozen=True)
class ImpactFactors:
    """Environmental impact factors for a component or phase."""
    climate_change_tco2eq: float  # tonnes CO2 equivalent
    ecosystems_pdf_m2_y: float    # PDF.m2.y
    human_health_daly: float      # DALY


# Quantum Computer Production Factors (per unit)
QUANTUM_PRODUCTION_FACTORS: Dict[str, ImpactFactors] = {
    # Cryostat production impact per unit
    "cryostat": ImpactFactors(
        climate_change_tco2eq=2.5,
        ecosystems_pdf_m2_y=0.0012,
        human_health_daly=1.2e-6,
    ),
    # Gas Handling System (GHS) production impact per unit
    "ghs": ImpactFactors(
        climate_change_tco2eq=1.8,
        ecosystems_pdf_m2_y=0.0008,
        human_health_daly=8.5e-7,
    ),
    # Compressor production impact per unit
    "compressor": ImpactFactors(
        climate_change_tco2eq=3.2,
        ecosystems_pdf_m2_y=0.0015,
        human_health_daly=1.5e-6,
    ),
    # QEC electronics production impact per physical qubit
    "qec_per_qubit": ImpactFactors(
        climate_change_tco2eq=0.015,
        ecosystems_pdf_m2_y=7.0e-6,
        human_health_daly=7.0e-9,
    ),
}

# Delivery Phase Factors (per kg of equipment)
DELIVERY_FACTORS: ImpactFactors = ImpactFactors(
    climate_change_tco2eq=0.002,
    ecosystems_pdf_m2_y=1.0e-6,
    human_health_daly=1.0e-9,
)

# End-of-Life Phase Factors (per kg of equipment)
END_OF_LIFE_FACTORS: ImpactFactors = ImpactFactors(
    climate_change_tco2eq=0.001,
    ecosystems_pdf_m2_y=5.0e-7,
    human_health_daly=5.0e-10,
)

# Equipment weights (kg) for delivery and end-of-life calculations
EQUIPMENT_WEIGHTS: Dict[str, float] = {
    "cryostat": 500.0,
    "ghs": 150.0,
    "compressor": 200.0,
    "qec_rack": 50.0,  # per rack
    "compute_blade": 15.0,
}

# Scaling factor for cryostats based on QEC setups
# Paper uses 6 cryostats for 175 QEC setups
QUBITS_PER_CRYOSTAT: float = 29.17  # 175 / 6
