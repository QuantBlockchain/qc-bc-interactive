"""Result dataclasses for environmental impact calculations."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Dict, Any


@dataclass
class SubsystemBreakdown:
    """Environmental impact breakdown by subsystem."""
    subsystems: Dict[str, "PhaseBreakdown"] = field(default_factory=dict)

    def total(self) -> "PhaseBreakdown":
        """Calculate total impact by summing all subsystems."""
        total = PhaseBreakdown()
        for breakdown in self.subsystems.values():
            total = total + breakdown
        return total

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "subsystems": {
                name: breakdown.to_dict()
                for name, breakdown in self.subsystems.items()
            }
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SubsystemBreakdown":
        """Create from dictionary."""
        return cls(
            subsystems={
                name: PhaseBreakdown.from_dict(breakdown_data)
                for name, breakdown_data in data["subsystems"].items()
            }
        )


@dataclass
class PhaseBreakdown:
    """Environmental impact for a single lifecycle phase.

    Attributes:
        climate_change_tco2eq: Climate change impact in tonnes CO2 equivalent.
        ecosystems_pdf_m2_y: Ecosystems impact in PDF.m2.y.
        human_health_daly: Human health impact in DALY.
    """
    climate_change_tco2eq: float = 0.0
    ecosystems_pdf_m2_y: float = 0.0
    human_health_daly: float = 0.0

    def __add__(self, other: PhaseBreakdown) -> PhaseBreakdown:
        """Add two phase breakdowns together."""
        if not isinstance(other, PhaseBreakdown):
            return NotImplemented
        return PhaseBreakdown(
            climate_change_tco2eq=self.climate_change_tco2eq + other.climate_change_tco2eq,
            ecosystems_pdf_m2_y=self.ecosystems_pdf_m2_y + other.ecosystems_pdf_m2_y,
            human_health_daly=self.human_health_daly + other.human_health_daly,
        )

    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary for JSON serialization."""
        return {
            "climate_change_tco2eq": self.climate_change_tco2eq,
            "ecosystems_pdf_m2_y": self.ecosystems_pdf_m2_y,
            "human_health_daly": self.human_health_daly,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, float]) -> PhaseBreakdown:
        """Create from dictionary."""
        return cls(
            climate_change_tco2eq=data["climate_change_tco2eq"],
            ecosystems_pdf_m2_y=data["ecosystems_pdf_m2_y"],
            human_health_daly=data["human_health_daly"],
        )


@dataclass
class ImpactResult:
    """Complete environmental impact result with phase breakdowns.

    Attributes:
        climate_change_tco2eq: Total climate change impact in tonnes CO2 equivalent.
        ecosystems_pdf_m2_y: Total ecosystems impact in PDF.m2.y.
        human_health_daly: Total human health impact in DALY.
        production: Impact from production/manufacturing phase.
        delivery: Impact from transportation/delivery phase.
        use: Impact from operational use phase.
        end_of_life: Impact from disposal/recycling phase.
    """
    climate_change_tco2eq: float = 0.0
    ecosystems_pdf_m2_y: float = 0.0
    human_health_daly: float = 0.0
    production: PhaseBreakdown = field(default_factory=PhaseBreakdown)
    delivery: PhaseBreakdown = field(default_factory=PhaseBreakdown)
    use: PhaseBreakdown = field(default_factory=PhaseBreakdown)
    end_of_life: PhaseBreakdown = field(default_factory=PhaseBreakdown)

    def total(self) -> ImpactResult:
        """Calculate total impact by summing all phases."""
        total_breakdown = self.production + self.delivery + self.use + self.end_of_life
        return ImpactResult(
            climate_change_tco2eq=total_breakdown.climate_change_tco2eq,
            ecosystems_pdf_m2_y=total_breakdown.ecosystems_pdf_m2_y,
            human_health_daly=total_breakdown.human_health_daly,
            production=self.production,
            delivery=self.delivery,
            use=self.use,
            end_of_life=self.end_of_life,
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "climate_change_tco2eq": self.climate_change_tco2eq,
            "ecosystems_pdf_m2_y": self.ecosystems_pdf_m2_y,
            "human_health_daly": self.human_health_daly,
            "production": self.production.to_dict(),
            "delivery": self.delivery.to_dict(),
            "use": self.use.to_dict(),
            "end_of_life": self.end_of_life.to_dict(),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> ImpactResult:
        """Create from dictionary."""
        return cls(
            climate_change_tco2eq=data["climate_change_tco2eq"],
            ecosystems_pdf_m2_y=data["ecosystems_pdf_m2_y"],
            human_health_daly=data["human_health_daly"],
            production=PhaseBreakdown.from_dict(data["production"]),
            delivery=PhaseBreakdown.from_dict(data["delivery"]),
            use=PhaseBreakdown.from_dict(data["use"]),
            end_of_life=PhaseBreakdown.from_dict(data["end_of_life"]),
        )

    def to_json(self) -> str:
        """Serialize to JSON string."""
        return json.dumps(self.to_dict(), indent=2)

    @classmethod
    def from_json(cls, json_str: str) -> ImpactResult:
        """Deserialize from JSON string."""
        return cls.from_dict(json.loads(json_str))


@dataclass
class ComparisonResult:
    """Comparison of quantum vs classical environmental impacts."""
    quantum: ImpactResult
    classical: ImpactResult

    def percentage_difference(self) -> Dict[str, float]:
        """Calculate percentage difference between classical and quantum impacts."""
        result = {}

        # Climate change
        if self.classical.climate_change_tco2eq != 0:
            result["climate_change"] = (
                (self.classical.climate_change_tco2eq - self.quantum.climate_change_tco2eq)
                / self.classical.climate_change_tco2eq * 100
            )
        else:
            result["climate_change"] = 0.0 if self.quantum.climate_change_tco2eq == 0 else float('-inf')

        # Ecosystems
        if self.classical.ecosystems_pdf_m2_y != 0:
            result["ecosystems"] = (
                (self.classical.ecosystems_pdf_m2_y - self.quantum.ecosystems_pdf_m2_y)
                / self.classical.ecosystems_pdf_m2_y * 100
            )
        else:
            result["ecosystems"] = 0.0 if self.quantum.ecosystems_pdf_m2_y == 0 else float('-inf')

        # Human health
        if self.classical.human_health_daly != 0:
            result["human_health"] = (
                (self.classical.human_health_daly - self.quantum.human_health_daly)
                / self.classical.human_health_daly * 100
            )
        else:
            result["human_health"] = 0.0 if self.quantum.human_health_daly == 0 else float('-inf')

        return result

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "quantum": self.quantum.to_dict(),
            "classical": self.classical.to_dict(),
            "percentage_difference": self.percentage_difference(),
        }
