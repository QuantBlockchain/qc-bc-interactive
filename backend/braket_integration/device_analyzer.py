"""Analyzer for Amazon Braket quantum devices.

This module provides the BraketDeviceAnalyzer class for calculating environmental
impacts using cached device profiles (no AWS SDK required).
"""

from typing import Optional
from qc_env_impact import ImpactCalculator, QuantumComputer
from braket_integration.device_profiles import (
    DEVICE_PROFILES,
    get_device_profile,
)
from braket_integration.models import DeviceImpactResult


class BraketDeviceAnalyzer:
    """Analyzer for Amazon Braket quantum devices.

    This class provides methods for calculating environmental impacts using
    cached device profiles. No AWS SDK required - works fully offline.

    Attributes:
        region: Electricity grid region for environmental calculations
        impact_calculator: ImpactCalculator instance for calculating impacts
    """

    def __init__(self, region: str = "quebec"):
        """Initialize the BraketDeviceAnalyzer.

        Args:
            region: Electricity grid region for environmental impact calculations.
                   Defaults to "quebec".
        """
        self.region = region
        self.impact_calculator = ImpactCalculator(region=region)

    def list_devices(self) -> list[dict]:
        """List available device profiles.

        Returns:
            List of device profile dictionaries
        """
        profiles = []
        for arn, profile in DEVICE_PROFILES.items():
            profiles.append({
                "device_arn": profile.device_arn,
                "provider": profile.provider,
                "device_name": profile.device_name,
                "technology": profile.technology,
                "qec_type": profile.qec_type,
                "default_overhead_factor": profile.default_overhead_factor,
                "multiplexing_factor": profile.multiplexing_factor,
                "cryogenic": profile.cryogenic,
                "location_region": profile.location_region,
            })
        return profiles

    def calculate_impact_from_profile(
        self,
        device_arn: str,
        usage_hours: float,
    ) -> DeviceImpactResult:
        """Calculate environmental impact using cached device profile data.

        This method enables offline calculations without AWS connectivity by using
        only the pre-defined device profiles in DEVICE_PROFILES.

        Args:
            device_arn: Amazon Resource Name of the device
            usage_hours: Number of hours the device will be used

        Returns:
            DeviceImpactResult with device info, profile, and impact calculations

        Raises:
            ValueError: If device profile not found for the given ARN
        """
        # Get device profile - no AWS calls
        profile = get_device_profile(device_arn)
        if profile is None:
            raise ValueError(
                f"Device profile not found: {device_arn}. "
                f"Available profiles: {', '.join(DEVICE_PROFILES.keys())}"
            )

        # Create QuantumComputer from profile
        quantum_computer = QuantumComputer(
            logical_qubits=1,  # Minimum for calculation
            qec_type=profile.qec_type,
            usage_hours=usage_hours,
            overhead_factor=profile.default_overhead_factor,
            multiplexing_factor=profile.multiplexing_factor,
        )

        # Calculate impact
        impact = self.impact_calculator.calculate_quantum(quantum_computer)

        return DeviceImpactResult(
            profile=profile,
            impact=impact,
            usage_hours=usage_hours,
            region=self.region,
            is_projection=False,
        )

    def compare_devices(
        self,
        device_arns: list[str],
        usage_hours: float,
    ) -> dict:
        """Compare environmental impacts across multiple devices.

        Args:
            device_arns: List of device ARNs to compare
            usage_hours: Number of hours to use for all devices

        Returns:
            Dictionary with device results and rankings

        Raises:
            ValueError: If device_arns is empty or any device is not found
        """
        if not device_arns:
            raise ValueError("device_arns cannot be empty")

        # Calculate impacts for all devices
        device_results = []
        for device_arn in device_arns:
            result = self.calculate_impact_from_profile(device_arn, usage_hours)
            device_results.append(result)

        # Create rankings by each indicator
        indicators = {
            "climate_change": "climate_change_tco2eq",
            "ecosystems": "ecosystems_pdf_m2_y",
            "human_health": "human_health_daly",
        }

        rankings = {}
        for indicator_name, attr_name in indicators.items():
            # Sort devices by this indicator (ascending - lower is better)
            sorted_devices = sorted(
                device_results,
                key=lambda d: getattr(d.impact, attr_name)
            )
            # Store ranked device ARNs
            rankings[indicator_name] = [
                d.profile.device_arn for d in sorted_devices
            ]

        # Calculate percentage vs best
        percentage_vs_best = {}
        for indicator_name, attr_name in indicators.items():
            min_impact = min(
                getattr(d.impact, attr_name) for d in device_results
            )
            percentages = {}
            for result in device_results:
                impact_value = getattr(result.impact, attr_name)
                if min_impact == 0:
                    percentages[result.profile.device_arn] = 0.0 if impact_value == 0 else float('inf')
                else:
                    percentages[result.profile.device_arn] = (
                        (impact_value - min_impact) / min_impact * 100
                    )
            percentage_vs_best[indicator_name] = percentages

        return {
            "devices": device_results,
            "usage_hours": usage_hours,
            "region": self.region,
            "rankings": rankings,
            "percentage_vs_best": percentage_vs_best,
        }
