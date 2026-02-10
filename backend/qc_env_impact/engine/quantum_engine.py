"""Quantum computer environmental impact calculation engine."""

from __future__ import annotations

import math

from qc_env_impact.models.quantum_computer import QuantumComputer
from qc_env_impact.models.results import ImpactResult, PhaseBreakdown, SubsystemBreakdown
from qc_env_impact.constants.emissions import (
    QUANTUM_PRODUCTION_FACTORS,
    DELIVERY_FACTORS,
    END_OF_LIFE_FACTORS,
    EQUIPMENT_WEIGHTS,
    QUBITS_PER_CRYOSTAT,
)
from qc_env_impact.constants.regions import get_carbon_intensity, DEFAULT_REGION


class QuantumImpactEngine:
    """Engine for calculating quantum computer environmental impacts."""

    def __init__(self, region: str = DEFAULT_REGION):
        """Initialize the quantum impact engine.

        Args:
            region: Electricity grid region for use-phase calculations.
        """
        self.region = region
        self.carbon_intensity = get_carbon_intensity(region)

    def _get_infrastructure_counts(self, qc: QuantumComputer) -> dict:
        """Calculate infrastructure component counts."""
        physical_qubits = qc.get_physical_qubits()
        qec_setups = physical_qubits / qc.multiplexing_factor
        cryostats = math.ceil(qec_setups / QUBITS_PER_CRYOSTAT)
        ghs_units = math.ceil(cryostats / 2)
        compressors = cryostats  # One compressor per cryostat

        return {
            "cryostats": cryostats,
            "ghs": ghs_units,
            "compressors": compressors,
            "qec_setups": qec_setups,
            "physical_qubits": physical_qubits,
        }

    def calculate_production(self, qc: QuantumComputer) -> PhaseBreakdown:
        """Calculate production phase environmental impact."""
        counts = self._get_infrastructure_counts(qc)

        # Cryostat production
        cryostat_factors = QUANTUM_PRODUCTION_FACTORS["cryostat"]
        cryostat_impact = PhaseBreakdown(
            climate_change_tco2eq=counts["cryostats"] * cryostat_factors.climate_change_tco2eq,
            ecosystems_pdf_m2_y=counts["cryostats"] * cryostat_factors.ecosystems_pdf_m2_y,
            human_health_daly=counts["cryostats"] * cryostat_factors.human_health_daly,
        )

        # GHS production
        ghs_factors = QUANTUM_PRODUCTION_FACTORS["ghs"]
        ghs_impact = PhaseBreakdown(
            climate_change_tco2eq=counts["ghs"] * ghs_factors.climate_change_tco2eq,
            ecosystems_pdf_m2_y=counts["ghs"] * ghs_factors.ecosystems_pdf_m2_y,
            human_health_daly=counts["ghs"] * ghs_factors.human_health_daly,
        )

        # Compressor production
        compressor_factors = QUANTUM_PRODUCTION_FACTORS["compressor"]
        compressor_impact = PhaseBreakdown(
            climate_change_tco2eq=counts["compressors"] * compressor_factors.climate_change_tco2eq,
            ecosystems_pdf_m2_y=counts["compressors"] * compressor_factors.ecosystems_pdf_m2_y,
            human_health_daly=counts["compressors"] * compressor_factors.human_health_daly,
        )

        # QEC electronics production (per physical qubit)
        qec_factors = QUANTUM_PRODUCTION_FACTORS["qec_per_qubit"]
        qec_impact = PhaseBreakdown(
            climate_change_tco2eq=counts["physical_qubits"] * qec_factors.climate_change_tco2eq,
            ecosystems_pdf_m2_y=counts["physical_qubits"] * qec_factors.ecosystems_pdf_m2_y,
            human_health_daly=counts["physical_qubits"] * qec_factors.human_health_daly,
        )

        return cryostat_impact + ghs_impact + compressor_impact + qec_impact

    def calculate_delivery(self, qc: QuantumComputer) -> PhaseBreakdown:
        """Calculate delivery phase environmental impact."""
        counts = self._get_infrastructure_counts(qc)

        # Calculate total equipment weight
        total_weight = (
            counts["cryostats"] * EQUIPMENT_WEIGHTS["cryostat"] +
            counts["ghs"] * EQUIPMENT_WEIGHTS["ghs"] +
            counts["compressors"] * EQUIPMENT_WEIGHTS["compressor"] +
            math.ceil(counts["qec_setups"]) * EQUIPMENT_WEIGHTS["qec_rack"]
        )

        return PhaseBreakdown(
            climate_change_tco2eq=total_weight * DELIVERY_FACTORS.climate_change_tco2eq,
            ecosystems_pdf_m2_y=total_weight * DELIVERY_FACTORS.ecosystems_pdf_m2_y,
            human_health_daly=total_weight * DELIVERY_FACTORS.human_health_daly,
        )

    def calculate_use(self, qc: QuantumComputer) -> PhaseBreakdown:
        """Calculate use phase environmental impact."""
        # Calculate energy consumption in kWh
        power_kw = qc.get_power_consumption_kw()
        energy_kwh = power_kw * qc.usage_hours

        # Climate change impact: energy x carbon intensity / 1000 (to get tonnes)
        climate_change = energy_kwh * self.carbon_intensity / 1000

        # Ecosystems and human health impacts scale with energy consumption
        ecosystems = energy_kwh * 2.0e-7  # PDF.m2.y per kWh
        human_health = energy_kwh * 2.0e-10  # DALY per kWh

        return PhaseBreakdown(
            climate_change_tco2eq=climate_change,
            ecosystems_pdf_m2_y=ecosystems,
            human_health_daly=human_health,
        )

    def calculate_end_of_life(self, qc: QuantumComputer) -> PhaseBreakdown:
        """Calculate end-of-life phase environmental impact."""
        counts = self._get_infrastructure_counts(qc)

        # Calculate total equipment weight
        total_weight = (
            counts["cryostats"] * EQUIPMENT_WEIGHTS["cryostat"] +
            counts["ghs"] * EQUIPMENT_WEIGHTS["ghs"] +
            counts["compressors"] * EQUIPMENT_WEIGHTS["compressor"] +
            math.ceil(counts["qec_setups"]) * EQUIPMENT_WEIGHTS["qec_rack"]
        )

        return PhaseBreakdown(
            climate_change_tco2eq=total_weight * END_OF_LIFE_FACTORS.climate_change_tco2eq,
            ecosystems_pdf_m2_y=total_weight * END_OF_LIFE_FACTORS.ecosystems_pdf_m2_y,
            human_health_daly=total_weight * END_OF_LIFE_FACTORS.human_health_daly,
        )

    def calculate(self, qc: QuantumComputer) -> ImpactResult:
        """Calculate complete environmental impact for a quantum computer."""
        production = self.calculate_production(qc)
        delivery = self.calculate_delivery(qc)
        use = self.calculate_use(qc)
        end_of_life = self.calculate_end_of_life(qc)

        # Sum all phases for totals
        total = production + delivery + use + end_of_life

        return ImpactResult(
            climate_change_tco2eq=total.climate_change_tco2eq,
            ecosystems_pdf_m2_y=total.ecosystems_pdf_m2_y,
            human_health_daly=total.human_health_daly,
            production=production,
            delivery=delivery,
            use=use,
            end_of_life=end_of_life,
        )
