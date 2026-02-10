"""Main ImpactCalculator class for environmental impact calculations."""

from __future__ import annotations

from qc_env_impact.models.quantum_computer import QuantumComputer
from qc_env_impact.models.results import ImpactResult
from qc_env_impact.engine.quantum_engine import QuantumImpactEngine
from qc_env_impact.constants.regions import DEFAULT_REGION, get_carbon_intensity


class ImpactCalculator:
    """Main calculator for environmental impact assessment.

    Provides methods to calculate environmental impacts for quantum computers.

    Supported regions:
        - "quebec": Quebec, Canada (very low carbon, hydro-based)
        - "belgium": Belgium
        - "usa": United States average
        - "global": Global average
    """

    def __init__(self, region: str = DEFAULT_REGION) -> None:
        """Initialize the impact calculator.

        Args:
            region: Electricity grid region for use-phase calculations.
        """
        # Validate region by attempting to get carbon intensity
        get_carbon_intensity(region)
        self.region = region
        self._quantum_engine = QuantumImpactEngine(region=region)

    def calculate_quantum(self, qc: QuantumComputer) -> ImpactResult:
        """Calculate environmental impact for a quantum computer.

        Args:
            qc: Quantum computer configuration.

        Returns:
            ImpactResult with all phase breakdowns and totals.
        """
        return self._quantum_engine.calculate(qc)
