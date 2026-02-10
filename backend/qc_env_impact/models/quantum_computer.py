"""QuantumComputer dataclass for quantum computer configuration.

Implements input validation and calculation methods for quantum computer
environmental impact assessment based on the LCA methodology.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Optional

from qc_env_impact.constants.power import (
    BOSONIC_GKP_OVERHEAD,
    SURFACE_CODE_OVERHEAD,
    COMPRESSOR_POWER_KW,
    GHS_POWER_KW,
    QEC_CRYOSTAT_POWER_W,
    QEC_RACK_POWER_W,
)


# Validation ranges
LOGICAL_QUBITS_MIN = 1
LOGICAL_QUBITS_MAX = 1000
OVERHEAD_FACTOR_MIN = 1
OVERHEAD_FACTOR_MAX = 10000
MULTIPLEXING_FACTOR_MIN = 1
MULTIPLEXING_FACTOR_MAX = 100
USAGE_HOURS_MIN = 0
USAGE_HOURS_MAX = 100000

# Valid QEC types
VALID_QEC_TYPES = ("bosonic", "surface")


@dataclass
class QuantumComputer:
    """Quantum computer configuration for environmental impact calculations.

    Attributes:
        logical_qubits: Number of logical (error-corrected) qubits (1-1000).
        qec_type: Quantum error correction type ("bosonic" or "surface").
        overhead_factor: Custom override for physical qubits per logical qubit (1-10000).
        multiplexing_factor: Factor for sharing electronic equipment across qubits (1-100, default 4).
        usage_hours: Total usage time in hours (0-100000).
    """
    logical_qubits: int
    qec_type: str
    usage_hours: float
    overhead_factor: Optional[int] = None
    multiplexing_factor: int = 4

    def __post_init__(self) -> None:
        """Validate all input parameters after initialization."""
        # Validate logical_qubits
        if not isinstance(self.logical_qubits, int):
            raise TypeError(f"logical_qubits must be an integer, got {type(self.logical_qubits).__name__}")
        if not (LOGICAL_QUBITS_MIN <= self.logical_qubits <= LOGICAL_QUBITS_MAX):
            raise ValueError(
                f"logical_qubits must be between {LOGICAL_QUBITS_MIN} and {LOGICAL_QUBITS_MAX}, "
                f"got {self.logical_qubits}"
            )

        # Validate qec_type
        if self.qec_type not in VALID_QEC_TYPES:
            raise ValueError(
                f"qec_type must be one of {VALID_QEC_TYPES}, got '{self.qec_type}'"
            )

        # Set default overhead_factor based on qec_type if not provided
        if self.overhead_factor is None:
            if self.qec_type == "bosonic":
                object.__setattr__(self, 'overhead_factor', BOSONIC_GKP_OVERHEAD)
            else:  # surface
                object.__setattr__(self, 'overhead_factor', SURFACE_CODE_OVERHEAD)
        else:
            # Validate custom overhead_factor
            if not isinstance(self.overhead_factor, int):
                raise TypeError(f"overhead_factor must be an integer, got {type(self.overhead_factor).__name__}")
            if not (OVERHEAD_FACTOR_MIN <= self.overhead_factor <= OVERHEAD_FACTOR_MAX):
                raise ValueError(
                    f"overhead_factor must be between {OVERHEAD_FACTOR_MIN} and {OVERHEAD_FACTOR_MAX}, "
                    f"got {self.overhead_factor}"
                )

        # Validate multiplexing_factor
        if not isinstance(self.multiplexing_factor, int):
            raise TypeError(f"multiplexing_factor must be an integer, got {type(self.multiplexing_factor).__name__}")
        if not (MULTIPLEXING_FACTOR_MIN <= self.multiplexing_factor <= MULTIPLEXING_FACTOR_MAX):
            raise ValueError(
                f"multiplexing_factor must be between {MULTIPLEXING_FACTOR_MIN} and {MULTIPLEXING_FACTOR_MAX}, "
                f"got {self.multiplexing_factor}"
            )

        # Validate usage_hours
        if not isinstance(self.usage_hours, (int, float)):
            raise TypeError(f"usage_hours must be a number, got {type(self.usage_hours).__name__}")
        if not (USAGE_HOURS_MIN <= self.usage_hours <= USAGE_HOURS_MAX):
            raise ValueError(
                f"usage_hours must be between {USAGE_HOURS_MIN} and {USAGE_HOURS_MAX}, "
                f"got {self.usage_hours}"
            )

    def get_physical_qubits(self) -> int:
        """Calculate the number of physical qubits required.

        Returns:
            int: Number of physical qubits required.
        """
        return self.logical_qubits * self.overhead_factor

    def get_power_consumption_kw(self) -> float:
        """Calculate total power consumption in kilowatts.

        Returns:
            float: Total power consumption in kilowatts (kW).
        """
        physical_qubits = self.get_physical_qubits()

        # Scaled QEC setups based on multiplexing
        qec_setups = physical_qubits / self.multiplexing_factor

        # Number of cryostats (based on paper: 6 cryostats for 175 QEC setups)
        # ~29.17 QEC setups per cryostat
        cryostats = math.ceil(qec_setups / 29.17)

        # Power calculations
        compressor_power = cryostats * COMPRESSOR_POWER_KW
        ghs_power = math.ceil(cryostats / 2) * GHS_POWER_KW
        qec_power = qec_setups * (QEC_CRYOSTAT_POWER_W + QEC_RACK_POWER_W) / 1000

        return compressor_power + ghs_power + qec_power
