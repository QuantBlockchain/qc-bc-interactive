"""Carbon intensity factors by electricity grid region."""

from typing import Dict, List

# Carbon intensity in kg CO2eq per kWh by region
CARBON_INTENSITY: Dict[str, float] = {
    "quebec": 0.0017,    # Very low carbon (hydro-dominated)
    "belgium": 0.167,    # European mix
    "global": 0.475,     # Global average
    "usa": 0.386,        # US average
}

# Default region for calculations
DEFAULT_REGION: str = "quebec"


def get_carbon_intensity(region: str) -> float:
    """Get carbon intensity for a given region.

    Args:
        region: The electricity grid region name (case-insensitive).

    Returns:
        Carbon intensity in kg CO2eq per kWh.

    Raises:
        ValueError: If the region is not supported.
    """
    region_lower = region.lower()
    if region_lower not in CARBON_INTENSITY:
        valid_regions = ", ".join(sorted(CARBON_INTENSITY.keys()))
        raise ValueError(
            f"Unknown region '{region}'. Valid regions are: {valid_regions}"
        )
    return CARBON_INTENSITY[region_lower]


def get_supported_regions() -> List[str]:
    """Get list of supported electricity grid regions.

    Returns:
        List of supported region names.
    """
    return list(CARBON_INTENSITY.keys())
