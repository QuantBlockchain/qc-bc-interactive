"""Amazon Braket device integration for environmental impact calculations."""

from braket_integration.device_profiles import (
    DeviceProfile,
    DEVICE_PROFILES,
    get_device_profile,
    get_default_profile_for_technology,
    TECHNOLOGY_DEFAULTS,
)
from braket_integration.device_analyzer import BraketDeviceAnalyzer
from braket_integration.models import DeviceImpactResult

__all__ = [
    "DeviceProfile",
    "DEVICE_PROFILES",
    "get_device_profile",
    "get_default_profile_for_technology",
    "TECHNOLOGY_DEFAULTS",
    "BraketDeviceAnalyzer",
    "DeviceImpactResult",
]
