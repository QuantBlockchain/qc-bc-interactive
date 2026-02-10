"""Data models for Braket device integration."""

from dataclasses import dataclass
from qc_env_impact import ImpactResult
from braket_integration.device_profiles import DeviceProfile


@dataclass
class DeviceImpactResult:
    """Environmental impact result for a specific Braket device.

    Attributes:
        profile: Device profile with hardware-specific parameters
        impact: Environmental impact calculation result
        usage_hours: Number of hours the device was used
        region: Electricity grid region for calculations
        is_projection: True if this is a fault-tolerant projection
    """
    profile: DeviceProfile
    impact: ImpactResult
    usage_hours: float
    region: str
    is_projection: bool
