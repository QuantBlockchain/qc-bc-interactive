"""QC Environmental Impact Calculator.

This package provides environmental impact calculations for quantum computers
based on Life Cycle Assessment (LCA) methodology.
"""

from qc_env_impact.models.quantum_computer import QuantumComputer
from qc_env_impact.models.results import ImpactResult, PhaseBreakdown, ComparisonResult
from qc_env_impact.calculator import ImpactCalculator
from qc_env_impact.constants.regions import CARBON_INTENSITY, get_carbon_intensity

__all__ = [
    "QuantumComputer",
    "ImpactResult",
    "PhaseBreakdown",
    "ComparisonResult",
    "ImpactCalculator",
    "CARBON_INTENSITY",
    "get_carbon_intensity",
]
