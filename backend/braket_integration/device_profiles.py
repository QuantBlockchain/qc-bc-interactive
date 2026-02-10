"""Device profiles for Amazon Braket quantum devices."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class DeviceProfile:
    """Hardware-specific parameters for a quantum device.

    Attributes:
        device_arn: Amazon Resource Name uniquely identifying the device
        provider: Device provider (IonQ, Rigetti, IQM, QuEra, etc.)
        device_name: Human-readable device name
        technology: Technology type (superconducting, trapped-ion, neutral-atom)
        qec_type: Quantum error correction type (bosonic or surface)
        default_overhead_factor: Default QEC overhead factor
        multiplexing_factor: Number of parallel operations
        cryogenic: Whether device requires cryogenic cooling
        location_region: Physical location/region of the device
    """
    device_arn: str
    provider: str
    device_name: str
    technology: str
    qec_type: str
    default_overhead_factor: int
    multiplexing_factor: int
    cryogenic: bool
    location_region: str


# Known device profiles for Amazon Braket quantum devices
DEVICE_PROFILES: dict[str, DeviceProfile] = {
    # IonQ Devices - Trapped-Ion Technology
    "arn:aws:braket:us-east-1::device/qpu/ionq/Aria-1": DeviceProfile(
        device_arn="arn:aws:braket:us-east-1::device/qpu/ionq/Aria-1",
        provider="IonQ",
        device_name="Aria-1",
        technology="trapped-ion",
        qec_type="surface",
        default_overhead_factor=100,
        multiplexing_factor=1,
        cryogenic=False,
        location_region="us-east-1",
    ),
    "arn:aws:braket:us-east-1::device/qpu/ionq/Aria-2": DeviceProfile(
        device_arn="arn:aws:braket:us-east-1::device/qpu/ionq/Aria-2",
        provider="IonQ",
        device_name="Aria-2",
        technology="trapped-ion",
        qec_type="surface",
        default_overhead_factor=100,
        multiplexing_factor=1,
        cryogenic=False,
        location_region="us-east-1",
    ),
    "arn:aws:braket:us-east-1::device/qpu/ionq/Forte-1": DeviceProfile(
        device_arn="arn:aws:braket:us-east-1::device/qpu/ionq/Forte-1",
        provider="IonQ",
        device_name="Forte-1",
        technology="trapped-ion",
        qec_type="surface",
        default_overhead_factor=100,
        multiplexing_factor=1,
        cryogenic=False,
        location_region="us-east-1",
    ),
    # IQM Device - Superconducting Technology
    "arn:aws:braket:eu-north-1::device/qpu/iqm/Garnet": DeviceProfile(
        device_arn="arn:aws:braket:eu-north-1::device/qpu/iqm/Garnet",
        provider="IQM",
        device_name="Garnet",
        technology="superconducting",
        qec_type="surface",
        default_overhead_factor=1000,
        multiplexing_factor=4,
        cryogenic=True,
        location_region="eu-north-1",
    ),
    # Rigetti Device - Superconducting Technology
    "arn:aws:braket:us-west-1::device/qpu/rigetti/Ankaa-3": DeviceProfile(
        device_arn="arn:aws:braket:us-west-1::device/qpu/rigetti/Ankaa-3",
        provider="Rigetti",
        device_name="Ankaa-3",
        technology="superconducting",
        qec_type="surface",
        default_overhead_factor=1000,
        multiplexing_factor=4,
        cryogenic=True,
        location_region="us-west-1",
    ),
    # QuEra Device - Neutral-Atom Technology
    "arn:aws:braket:us-east-1::device/qpu/quera/Aquila": DeviceProfile(
        device_arn="arn:aws:braket:us-east-1::device/qpu/quera/Aquila",
        provider="QuEra",
        device_name="Aquila",
        technology="neutral-atom",
        qec_type="bosonic",
        default_overhead_factor=7,
        multiplexing_factor=10,
        cryogenic=False,
        location_region="us-east-1",
    ),
}


# Technology-based default profiles
TECHNOLOGY_DEFAULTS = {
    "superconducting": {
        "qec_type": "surface",
        "default_overhead_factor": 1000,
        "multiplexing_factor": 4,
        "cryogenic": True,
    },
    "trapped-ion": {
        "qec_type": "surface",
        "default_overhead_factor": 100,
        "multiplexing_factor": 1,
        "cryogenic": False,
    },
    "neutral-atom": {
        "qec_type": "bosonic",
        "default_overhead_factor": 7,
        "multiplexing_factor": 10,
        "cryogenic": False,
    },
}


def get_device_profile(device_arn: str) -> Optional[DeviceProfile]:
    """Get device profile by ARN.

    Args:
        device_arn: Amazon Resource Name of the device

    Returns:
        DeviceProfile if found, None otherwise
    """
    return DEVICE_PROFILES.get(device_arn)


def get_default_profile_for_technology(technology: str) -> dict:
    """Get default profile parameters for a technology type.

    Args:
        technology: Technology type (superconducting, trapped-ion, neutral-atom)

    Returns:
        Dictionary with default QEC type, overhead factor, multiplexing factor,
        and cryogenic flag

    Raises:
        ValueError: If technology is not recognized
    """
    if technology not in TECHNOLOGY_DEFAULTS:
        raise ValueError(
            f"Unknown technology: {technology}. "
            f"Must be one of: {', '.join(TECHNOLOGY_DEFAULTS.keys())}"
        )
    return TECHNOLOGY_DEFAULTS[technology]
