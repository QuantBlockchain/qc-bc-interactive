"""Constants for environmental impact calculations."""

from qc_env_impact.constants.power import (
    COMPRESSOR_POWER_KW,
    GHS_POWER_KW,
    QEC_CRYOSTAT_POWER_W,
    QEC_RACK_POWER_W,
    BOSONIC_GKP_OVERHEAD,
    SURFACE_CODE_OVERHEAD,
)
from qc_env_impact.constants.emissions import (
    ImpactFactors,
    QUANTUM_PRODUCTION_FACTORS,
    DELIVERY_FACTORS,
    END_OF_LIFE_FACTORS,
    EQUIPMENT_WEIGHTS,
    QUBITS_PER_CRYOSTAT,
)
from qc_env_impact.constants.regions import (
    CARBON_INTENSITY,
    DEFAULT_REGION,
    get_carbon_intensity,
    get_supported_regions,
)

__all__ = [
    "COMPRESSOR_POWER_KW",
    "GHS_POWER_KW",
    "QEC_CRYOSTAT_POWER_W",
    "QEC_RACK_POWER_W",
    "BOSONIC_GKP_OVERHEAD",
    "SURFACE_CODE_OVERHEAD",
    "ImpactFactors",
    "QUANTUM_PRODUCTION_FACTORS",
    "DELIVERY_FACTORS",
    "END_OF_LIFE_FACTORS",
    "EQUIPMENT_WEIGHTS",
    "QUBITS_PER_CRYOSTAT",
    "CARBON_INTENSITY",
    "DEFAULT_REGION",
    "get_carbon_intensity",
    "get_supported_regions",
]
