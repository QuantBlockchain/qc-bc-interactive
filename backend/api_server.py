#!/usr/bin/env python3
"""FastAPI server for QC Environmental Impact API.

This server exposes the BraketDeviceAnalyzer functionality via REST API endpoints,
enabling frontend applications to calculate environmental impacts in real-time.
"""

import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from qc_env_impact.constants.regions import CARBON_INTENSITY
from braket_integration.device_profiles import (
    DEVICE_PROFILES,
    get_device_profile,
    get_default_profile_for_technology,
)
from braket_integration.device_analyzer import BraketDeviceAnalyzer

app = FastAPI(
    title="QC Environmental Impact API",
    description="API for calculating environmental impacts of quantum computing devices",
    version="1.0.0",
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Pydantic Models for API
# ============================================================================

class PhaseBreakdownResponse(BaseModel):
    """Environmental impact for a single lifecycle phase."""
    climate_change_tco2eq: float
    ecosystems_pdf_m2_y: float
    human_health_daly: float


class ImpactResultResponse(BaseModel):
    """Complete environmental impact result with phase breakdowns."""
    climate_change_tco2eq: float
    ecosystems_pdf_m2_y: float
    human_health_daly: float
    production: PhaseBreakdownResponse
    delivery: PhaseBreakdownResponse
    use: PhaseBreakdownResponse
    end_of_life: PhaseBreakdownResponse


class DeviceProfileResponse(BaseModel):
    """Device profile information."""
    device_arn: str
    provider: str
    device_name: str
    technology: str
    qec_type: str
    default_overhead_factor: int
    multiplexing_factor: int
    cryogenic: bool
    location_region: str


class DeviceImpactResponse(BaseModel):
    """Environmental impact result for a specific device."""
    device_arn: str
    device_name: str
    provider: str
    technology: str
    qec_type: str
    cryogenic: bool
    impact: ImpactResultResponse
    usage_hours: float
    region: str
    is_projection: bool


class CompareDevicesResponse(BaseModel):
    """Response for comparing multiple devices."""
    devices: list[DeviceImpactResponse]
    usage_hours: float
    region: str
    rankings: dict[str, list[str]]
    percentage_vs_best: dict[str, dict[str, float]]


class CalculateImpactRequest(BaseModel):
    """Request body for calculating impact."""
    device_arn: str
    usage_hours: float = Field(gt=0, le=100000)
    logical_qubits: int = Field(default=1, ge=1, le=1000)


class CompareDevicesRequest(BaseModel):
    """Request body for comparing devices."""
    device_arns: list[str]
    usage_hours: float = Field(gt=0, le=100000)
    logical_qubits: int = Field(default=1, ge=1, le=1000)


# ============================================================================
# Helper Functions
# ============================================================================

def convert_impact_result(impact) -> ImpactResultResponse:
    """Convert ImpactResult to API response format."""
    return ImpactResultResponse(
        climate_change_tco2eq=impact.climate_change_tco2eq,
        ecosystems_pdf_m2_y=impact.ecosystems_pdf_m2_y,
        human_health_daly=impact.human_health_daly,
        production=PhaseBreakdownResponse(
            climate_change_tco2eq=impact.production.climate_change_tco2eq,
            ecosystems_pdf_m2_y=impact.production.ecosystems_pdf_m2_y,
            human_health_daly=impact.production.human_health_daly,
        ),
        delivery=PhaseBreakdownResponse(
            climate_change_tco2eq=impact.delivery.climate_change_tco2eq,
            ecosystems_pdf_m2_y=impact.delivery.ecosystems_pdf_m2_y,
            human_health_daly=impact.delivery.human_health_daly,
        ),
        use=PhaseBreakdownResponse(
            climate_change_tco2eq=impact.use.climate_change_tco2eq,
            ecosystems_pdf_m2_y=impact.use.ecosystems_pdf_m2_y,
            human_health_daly=impact.use.human_health_daly,
        ),
        end_of_life=PhaseBreakdownResponse(
            climate_change_tco2eq=impact.end_of_life.climate_change_tco2eq,
            ecosystems_pdf_m2_y=impact.end_of_life.ecosystems_pdf_m2_y,
            human_health_daly=impact.end_of_life.human_health_daly,
        ),
    )


def convert_device_result(result) -> DeviceImpactResponse:
    """Convert DeviceImpactResult to API response format."""
    return DeviceImpactResponse(
        device_arn=result.profile.device_arn,
        device_name=result.profile.device_name,
        provider=result.profile.provider,
        technology=result.profile.technology,
        qec_type=result.profile.qec_type,
        cryogenic=result.profile.cryogenic,
        impact=convert_impact_result(result.impact),
        usage_hours=result.usage_hours,
        region=result.region,
        is_projection=result.is_projection,
    )


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "qc-env-impact-api"}


@app.get("/devices", response_model=list[DeviceProfileResponse])
async def list_devices():
    """List all available device profiles."""
    profiles = []
    for arn, profile in DEVICE_PROFILES.items():
        profiles.append(DeviceProfileResponse(
            device_arn=profile.device_arn,
            provider=profile.provider,
            device_name=profile.device_name,
            technology=profile.technology,
            qec_type=profile.qec_type,
            default_overhead_factor=profile.default_overhead_factor,
            multiplexing_factor=profile.multiplexing_factor,
            cryogenic=profile.cryogenic,
            location_region=profile.location_region,
        ))
    return profiles


@app.get("/devices/{device_arn:path}", response_model=DeviceProfileResponse)
async def get_device(device_arn: str):
    """Get a specific device profile by ARN."""
    profile = get_device_profile(device_arn)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Device not found: {device_arn}")

    return DeviceProfileResponse(
        device_arn=profile.device_arn,
        provider=profile.provider,
        device_name=profile.device_name,
        technology=profile.technology,
        qec_type=profile.qec_type,
        default_overhead_factor=profile.default_overhead_factor,
        multiplexing_factor=profile.multiplexing_factor,
        cryogenic=profile.cryogenic,
        location_region=profile.location_region,
    )


@app.get("/regions")
async def get_regions():
    """Get available electricity grid regions."""
    return {
        "regions": list(CARBON_INTENSITY.keys()),
        "carbon_intensity": CARBON_INTENSITY,
    }


@app.post("/calculate", response_model=DeviceImpactResponse)
async def calculate_impact(
    request: CalculateImpactRequest,
    region: str = Query(default="quebec", description="Electricity grid region"),
):
    """Calculate environmental impact for a single device."""
    profile = get_device_profile(request.device_arn)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail=f"Device not found: {request.device_arn}. Available devices: {list(DEVICE_PROFILES.keys())}"
        )

    try:
        analyzer = BraketDeviceAnalyzer(region=region)
        result = analyzer.calculate_impact_from_profile(
            device_arn=request.device_arn,
            usage_hours=request.usage_hours,
        )
        return convert_device_result(result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/compare", response_model=CompareDevicesResponse)
async def compare_devices(
    request: CompareDevicesRequest,
    region: str = Query(default="quebec", description="Electricity grid region"),
):
    """Compare environmental impacts across multiple devices."""
    if not request.device_arns:
        raise HTTPException(status_code=400, detail="device_arns cannot be empty")

    # Validate all devices exist
    for arn in request.device_arns:
        if not get_device_profile(arn):
            raise HTTPException(
                status_code=404,
                detail=f"Device not found: {arn}. Available devices: {list(DEVICE_PROFILES.keys())}"
            )

    try:
        analyzer = BraketDeviceAnalyzer(region=region)
        comparison = analyzer.compare_devices(
            device_arns=request.device_arns,
            usage_hours=request.usage_hours,
        )

        return CompareDevicesResponse(
            devices=[convert_device_result(r) for r in comparison["devices"]],
            usage_hours=comparison["usage_hours"],
            region=comparison["region"],
            rankings=comparison["rankings"],
            percentage_vs_best=comparison["percentage_vs_best"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/technology-defaults")
async def get_technology_defaults():
    """Get default parameters for each technology type."""
    return {
        "superconducting": get_default_profile_for_technology("superconducting"),
        "trapped-ion": get_default_profile_for_technology("trapped-ion"),
        "neutral-atom": get_default_profile_for_technology("neutral-atom"),
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
