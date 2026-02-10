/**
 * Environmental Impact Calculator for Quantum Computing
 *
 * TypeScript implementation of the LCA (Life Cycle Assessment) methodology
 * for calculating environmental impacts of quantum computing devices.
 */

// ============================================================================
// Constants
// ============================================================================

// Power consumption constants (kW)
const COMPRESSOR_POWER_KW = 10.7;
const GHS_POWER_KW = 1.8;
const QEC_CRYOSTAT_POWER_W = 36.0;
const QEC_RACK_POWER_W = 209.0;

// QEC Overhead Factors
const BOSONIC_GKP_OVERHEAD = 7;
const SURFACE_CODE_OVERHEAD = 1000;

// Supported technology types for environmental impact calculation
// Based on Cordier et al. (2024) paper which only studied superconducting quantum computers
export const SUPPORTED_TECHNOLOGIES = ['superconducting'];
export const UNSUPPORTED_TECHNOLOGIES = ['trapped-ion', 'neutral-atom', 'photonic'];

// Check if technology is supported
export function isTechnologySupported(technology: string): boolean {
  return SUPPORTED_TECHNOLOGIES.includes(technology);
}

// Carbon intensity (kg CO2eq per kWh)
export const CARBON_INTENSITY: Record<string, number> = {
  quebec: 0.0017,
  belgium: 0.167,
  global: 0.475,
  usa: 0.386,
};

// Equipment weights (kg)
const EQUIPMENT_WEIGHTS = {
  cryostat: 500.0,
  ghs: 150.0,
  compressor: 200.0,
  qec_rack: 50.0,
};

// Qubits per cryostat scaling factor
const QUBITS_PER_CRYOSTAT = 29.17;

// Production impact factors
const QUANTUM_PRODUCTION_FACTORS = {
  cryostat: {
    climate_change_tco2eq: 2.5,
    ecosystems_pdf_m2_y: 0.0012,
    human_health_daly: 1.2e-6,
  },
  ghs: {
    climate_change_tco2eq: 1.8,
    ecosystems_pdf_m2_y: 0.0008,
    human_health_daly: 8.5e-7,
  },
  compressor: {
    climate_change_tco2eq: 3.2,
    ecosystems_pdf_m2_y: 0.0015,
    human_health_daly: 1.5e-6,
  },
  qec_per_qubit: {
    climate_change_tco2eq: 0.015,
    ecosystems_pdf_m2_y: 7.0e-6,
    human_health_daly: 7.0e-9,
  },
};

// Delivery factors (per kg)
const DELIVERY_FACTORS = {
  climate_change_tco2eq: 0.002,
  ecosystems_pdf_m2_y: 1.0e-6,
  human_health_daly: 1.0e-9,
};

// End-of-life factors (per kg)
const END_OF_LIFE_FACTORS = {
  climate_change_tco2eq: 0.001,
  ecosystems_pdf_m2_y: 5.0e-7,
  human_health_daly: 5.0e-10,
};

// ============================================================================
// Types
// ============================================================================

export interface PhaseBreakdown {
  climate_change_tco2eq: number;
  ecosystems_pdf_m2_y: number;
  human_health_daly: number;
}

export interface ImpactResult {
  climate_change_tco2eq: number;
  ecosystems_pdf_m2_y: number;
  human_health_daly: number;
  production: PhaseBreakdown;
  delivery: PhaseBreakdown;
  use: PhaseBreakdown;
  end_of_life: PhaseBreakdown;
}

export interface DeviceProfile {
  device_arn: string;
  provider: string;
  device_name: string;
  technology: string;
  qec_type: 'bosonic' | 'surface';
  default_overhead_factor: number;
  multiplexing_factor: number;
  cryogenic: boolean;
  location_region: string;
  // Provider-specific factors for differentiation
  qec_efficiency: number; // Lower = better (fewer physical qubits needed for QEC). Based on gate fidelity.
  power_factor: number; // Relative power consumption (1.0 = baseline)
  two_qubit_gate_fidelity: number; // Typical 2-qubit gate fidelity (%)
  qubit_count: number; // Number of physical qubits
}

export interface DeviceImpactResponse {
  device_arn: string;
  device_name: string;
  provider: string;
  technology: string;
  qec_type: string;
  cryogenic: boolean;
  impact: ImpactResult;
  usage_hours: number;
  region: string;
  is_projection: boolean;
  supported: boolean;
  unsupported_reason?: string;
}

export interface CompareDevicesResponse {
  devices: DeviceImpactResponse[];
  usage_hours: number;
  region: string;
  rankings: Record<string, string[]>;
  percentage_vs_best: Record<string, Record<string, number>>;
}

// ============================================================================
// Device Profiles
// ============================================================================

// Device profiles with provider-specific parameters based on published specifications
// QEC Efficiency: Based on two-qubit gate fidelity - higher fidelity = lower overhead needed
// Reference: IQM Radiance specs, Rigetti Ankaa-3 specs, IonQ published data
export const DEVICE_PROFILES: Record<string, DeviceProfile> = {
  // IonQ Trapped-Ion Devices (high fidelity, but LCA model not applicable)
  'arn:aws:braket:us-east-1::device/qpu/ionq/Aria-1': {
    device_arn: 'arn:aws:braket:us-east-1::device/qpu/ionq/Aria-1',
    provider: 'IonQ',
    device_name: 'Aria-1',
    technology: 'trapped-ion',
    qec_type: 'surface',
    default_overhead_factor: 100,
    multiplexing_factor: 1,
    cryogenic: false,
    location_region: 'us-east-1',
    qec_efficiency: 0.7, // High 2Q fidelity (99.5%+) enables efficient QEC
    power_factor: 0.3, // No cryogenic cooling needed
    two_qubit_gate_fidelity: 99.5,
    qubit_count: 25,
  },
  'arn:aws:braket:us-east-1::device/qpu/ionq/Aria-2': {
    device_arn: 'arn:aws:braket:us-east-1::device/qpu/ionq/Aria-2',
    provider: 'IonQ',
    device_name: 'Aria-2',
    technology: 'trapped-ion',
    qec_type: 'surface',
    default_overhead_factor: 100,
    multiplexing_factor: 1,
    cryogenic: false,
    location_region: 'us-east-1',
    qec_efficiency: 0.7,
    power_factor: 0.3,
    two_qubit_gate_fidelity: 99.5,
    qubit_count: 25,
  },
  'arn:aws:braket:us-east-1::device/qpu/ionq/Forte-1': {
    device_arn: 'arn:aws:braket:us-east-1::device/qpu/ionq/Forte-1',
    provider: 'IonQ',
    device_name: 'Forte-1',
    technology: 'trapped-ion',
    qec_type: 'surface',
    default_overhead_factor: 100,
    multiplexing_factor: 1,
    cryogenic: false,
    location_region: 'us-east-1',
    qec_efficiency: 0.65, // Forte has even higher fidelity
    power_factor: 0.35,
    two_qubit_gate_fidelity: 99.7,
    qubit_count: 32,
  },
  // AQT Trapped-Ion Device
  'arn:aws:braket:eu-central-1::device/qpu/aqt/IBEX-Q1': {
    device_arn: 'arn:aws:braket:eu-central-1::device/qpu/aqt/IBEX-Q1',
    provider: 'AQT',
    device_name: 'IBEX-Q1',
    technology: 'trapped-ion',
    qec_type: 'surface',
    default_overhead_factor: 100,
    multiplexing_factor: 1,
    cryogenic: false,
    location_region: 'eu-central-1',
    qec_efficiency: 0.75,
    power_factor: 0.25, // Compact European design
    two_qubit_gate_fidelity: 99.3,
    qubit_count: 24,
  },
  // IQM Superconducting Devices (high fidelity, documented specs from arXiv:2408.12433)
  'arn:aws:braket:eu-north-1::device/qpu/iqm/Garnet': {
    device_arn: 'arn:aws:braket:eu-north-1::device/qpu/iqm/Garnet',
    provider: 'IQM',
    device_name: 'Garnet',
    technology: 'superconducting',
    qec_type: 'surface',
    default_overhead_factor: 800, // Lower due to high fidelity (99.5% 2Q gates)
    multiplexing_factor: 5, // Better qubit connectivity in square lattice
    cryogenic: true,
    location_region: 'eu-north-1',
    qec_efficiency: 0.85, // High 2Q fidelity (99.5%) = efficient QEC
    power_factor: 1.0, // Documented 24-26 kW
    two_qubit_gate_fidelity: 99.5,
    qubit_count: 20,
  },
  'arn:aws:braket:eu-north-1::device/qpu/iqm/Emerald': {
    device_arn: 'arn:aws:braket:eu-north-1::device/qpu/iqm/Emerald',
    provider: 'IQM',
    device_name: 'Emerald',
    technology: 'superconducting',
    qec_type: 'surface',
    default_overhead_factor: 900, // Slightly higher than Garnet (smaller system)
    multiplexing_factor: 4, // Fewer qubits, less connectivity optimization
    cryogenic: true,
    location_region: 'eu-north-1',
    qec_efficiency: 0.9, // Slightly lower fidelity than flagship Garnet
    power_factor: 0.85, // Smaller system, less power
    two_qubit_gate_fidelity: 99.3,
    qubit_count: 10,
  },
  // Rigetti Superconducting Device (lower 2Q fidelity than IQM based on published specs)
  'arn:aws:braket:us-west-1::device/qpu/rigetti/Ankaa-3': {
    device_arn: 'arn:aws:braket:us-west-1::device/qpu/rigetti/Ankaa-3',
    provider: 'Rigetti',
    device_name: 'Ankaa-3',
    technology: 'superconducting',
    qec_type: 'surface',
    default_overhead_factor: 1100, // Higher due to lower 2Q fidelity (98.4-99%)
    multiplexing_factor: 3, // Different coupling architecture
    cryogenic: true,
    location_region: 'us-west-1',
    qec_efficiency: 1.15, // Lower fidelity requires ~15% more physical qubits
    power_factor: 1.1, // Larger qubit count system
    two_qubit_gate_fidelity: 98.7,
    qubit_count: 84,
  },
  // QuEra Neutral-Atom Device (LCA model not applicable)
  'arn:aws:braket:us-east-1::device/qpu/quera/Aquila': {
    device_arn: 'arn:aws:braket:us-east-1::device/qpu/quera/Aquila',
    provider: 'QuEra',
    device_name: 'Aquila',
    technology: 'neutral-atom',
    qec_type: 'bosonic',
    default_overhead_factor: 7,
    multiplexing_factor: 10,
    cryogenic: false,
    location_region: 'us-east-1',
    qec_efficiency: 0.5, // Excellent for certain QEC codes (zoned architecture)
    power_factor: 0.2, // Room temperature operation
    two_qubit_gate_fidelity: 99.5,
    qubit_count: 256,
  },
};

export const TECHNOLOGY_DEFAULTS: Record<string, {
  qec_type: string;
  default_overhead_factor: number;
  multiplexing_factor: number;
  cryogenic: boolean;
  qec_efficiency: number;
  power_factor: number;
}> = {
  superconducting: {
    qec_type: 'surface',
    default_overhead_factor: 1000,
    multiplexing_factor: 4,
    cryogenic: true,
    qec_efficiency: 1.0,
    power_factor: 1.0,
  },
  'trapped-ion': {
    qec_type: 'surface',
    default_overhead_factor: 100,
    multiplexing_factor: 1,
    cryogenic: false,
    qec_efficiency: 0.7,
    power_factor: 0.3,
  },
  'neutral-atom': {
    qec_type: 'bosonic',
    default_overhead_factor: 7,
    multiplexing_factor: 10,
    cryogenic: false,
    qec_efficiency: 0.5,
    power_factor: 0.2,
  },
};

// ============================================================================
// Calculator Functions
// ============================================================================

function getInfrastructureCounts(
  logicalQubits: number,
  overheadFactor: number,
  multiplexingFactor: number
): {
  cryostats: number;
  ghs: number;
  compressors: number;
  qec_setups: number;
  physical_qubits: number;
} {
  const physicalQubits = logicalQubits * overheadFactor;
  const qecSetups = physicalQubits / multiplexingFactor;
  const cryostats = Math.ceil(qecSetups / QUBITS_PER_CRYOSTAT);
  const ghsUnits = Math.ceil(cryostats / 2);
  const compressors = cryostats;

  return {
    cryostats,
    ghs: ghsUnits,
    compressors,
    qec_setups: qecSetups,
    physical_qubits: physicalQubits,
  };
}

function calculateProduction(
  logicalQubits: number,
  overheadFactor: number,
  multiplexingFactor: number
): PhaseBreakdown {
  const counts = getInfrastructureCounts(logicalQubits, overheadFactor, multiplexingFactor);

  const cryostatImpact = {
    climate_change_tco2eq: counts.cryostats * QUANTUM_PRODUCTION_FACTORS.cryostat.climate_change_tco2eq,
    ecosystems_pdf_m2_y: counts.cryostats * QUANTUM_PRODUCTION_FACTORS.cryostat.ecosystems_pdf_m2_y,
    human_health_daly: counts.cryostats * QUANTUM_PRODUCTION_FACTORS.cryostat.human_health_daly,
  };

  const ghsImpact = {
    climate_change_tco2eq: counts.ghs * QUANTUM_PRODUCTION_FACTORS.ghs.climate_change_tco2eq,
    ecosystems_pdf_m2_y: counts.ghs * QUANTUM_PRODUCTION_FACTORS.ghs.ecosystems_pdf_m2_y,
    human_health_daly: counts.ghs * QUANTUM_PRODUCTION_FACTORS.ghs.human_health_daly,
  };

  const compressorImpact = {
    climate_change_tco2eq: counts.compressors * QUANTUM_PRODUCTION_FACTORS.compressor.climate_change_tco2eq,
    ecosystems_pdf_m2_y: counts.compressors * QUANTUM_PRODUCTION_FACTORS.compressor.ecosystems_pdf_m2_y,
    human_health_daly: counts.compressors * QUANTUM_PRODUCTION_FACTORS.compressor.human_health_daly,
  };

  const qecImpact = {
    climate_change_tco2eq: counts.physical_qubits * QUANTUM_PRODUCTION_FACTORS.qec_per_qubit.climate_change_tco2eq,
    ecosystems_pdf_m2_y: counts.physical_qubits * QUANTUM_PRODUCTION_FACTORS.qec_per_qubit.ecosystems_pdf_m2_y,
    human_health_daly: counts.physical_qubits * QUANTUM_PRODUCTION_FACTORS.qec_per_qubit.human_health_daly,
  };

  return {
    climate_change_tco2eq:
      cryostatImpact.climate_change_tco2eq +
      ghsImpact.climate_change_tco2eq +
      compressorImpact.climate_change_tco2eq +
      qecImpact.climate_change_tco2eq,
    ecosystems_pdf_m2_y:
      cryostatImpact.ecosystems_pdf_m2_y +
      ghsImpact.ecosystems_pdf_m2_y +
      compressorImpact.ecosystems_pdf_m2_y +
      qecImpact.ecosystems_pdf_m2_y,
    human_health_daly:
      cryostatImpact.human_health_daly +
      ghsImpact.human_health_daly +
      compressorImpact.human_health_daly +
      qecImpact.human_health_daly,
  };
}

function calculateDelivery(
  logicalQubits: number,
  overheadFactor: number,
  multiplexingFactor: number
): PhaseBreakdown {
  const counts = getInfrastructureCounts(logicalQubits, overheadFactor, multiplexingFactor);

  const totalWeight =
    counts.cryostats * EQUIPMENT_WEIGHTS.cryostat +
    counts.ghs * EQUIPMENT_WEIGHTS.ghs +
    counts.compressors * EQUIPMENT_WEIGHTS.compressor +
    Math.ceil(counts.qec_setups) * EQUIPMENT_WEIGHTS.qec_rack;

  return {
    climate_change_tco2eq: totalWeight * DELIVERY_FACTORS.climate_change_tco2eq,
    ecosystems_pdf_m2_y: totalWeight * DELIVERY_FACTORS.ecosystems_pdf_m2_y,
    human_health_daly: totalWeight * DELIVERY_FACTORS.human_health_daly,
  };
}

function calculateUse(
  logicalQubits: number,
  overheadFactor: number,
  multiplexingFactor: number,
  usageHours: number,
  region: string,
  powerFactor: number = 1.0 // Provider-specific power consumption factor
): PhaseBreakdown {
  const counts = getInfrastructureCounts(logicalQubits, overheadFactor, multiplexingFactor);

  // Calculate power consumption with provider-specific power factor
  const compressorPower = counts.cryostats * COMPRESSOR_POWER_KW * powerFactor;
  const ghsPower = Math.ceil(counts.cryostats / 2) * GHS_POWER_KW * powerFactor;
  const qecPower = counts.qec_setups * (QEC_CRYOSTAT_POWER_W + QEC_RACK_POWER_W) / 1000 * powerFactor;
  const totalPowerKw = compressorPower + ghsPower + qecPower;

  // Calculate energy consumption in kWh
  const energyKwh = totalPowerKw * usageHours;

  // Get carbon intensity for region
  const carbonIntensity = CARBON_INTENSITY[region.toLowerCase()] || CARBON_INTENSITY.global;

  // Climate change impact: energy × carbon intensity / 1000 (to get tonnes)
  const climateChange = energyKwh * carbonIntensity / 1000;

  // Ecosystems and human health impacts scale with energy consumption
  const ecosystems = energyKwh * 2.0e-7;
  const humanHealth = energyKwh * 2.0e-10;

  return {
    climate_change_tco2eq: climateChange,
    ecosystems_pdf_m2_y: ecosystems,
    human_health_daly: humanHealth,
  };
}

function calculateEndOfLife(
  logicalQubits: number,
  overheadFactor: number,
  multiplexingFactor: number
): PhaseBreakdown {
  const counts = getInfrastructureCounts(logicalQubits, overheadFactor, multiplexingFactor);

  const totalWeight =
    counts.cryostats * EQUIPMENT_WEIGHTS.cryostat +
    counts.ghs * EQUIPMENT_WEIGHTS.ghs +
    counts.compressors * EQUIPMENT_WEIGHTS.compressor +
    Math.ceil(counts.qec_setups) * EQUIPMENT_WEIGHTS.qec_rack;

  return {
    climate_change_tco2eq: totalWeight * END_OF_LIFE_FACTORS.climate_change_tco2eq,
    ecosystems_pdf_m2_y: totalWeight * END_OF_LIFE_FACTORS.ecosystems_pdf_m2_y,
    human_health_daly: totalWeight * END_OF_LIFE_FACTORS.human_health_daly,
  };
}

export function calculateImpact(
  logicalQubits: number,
  qecType: 'bosonic' | 'surface',
  usageHours: number,
  region: string,
  overheadFactor?: number,
  multiplexingFactor: number = 4,
  powerFactor: number = 1.0 // Provider-specific power factor
): ImpactResult {
  // Set default overhead factor based on QEC type
  const actualOverheadFactor = overheadFactor ?? (qecType === 'bosonic' ? BOSONIC_GKP_OVERHEAD : SURFACE_CODE_OVERHEAD);

  const production = calculateProduction(logicalQubits, actualOverheadFactor, multiplexingFactor);
  const delivery = calculateDelivery(logicalQubits, actualOverheadFactor, multiplexingFactor);
  const use = calculateUse(logicalQubits, actualOverheadFactor, multiplexingFactor, usageHours, region, powerFactor);
  const endOfLife = calculateEndOfLife(logicalQubits, actualOverheadFactor, multiplexingFactor);

  return {
    climate_change_tco2eq:
      production.climate_change_tco2eq +
      delivery.climate_change_tco2eq +
      use.climate_change_tco2eq +
      endOfLife.climate_change_tco2eq,
    ecosystems_pdf_m2_y:
      production.ecosystems_pdf_m2_y +
      delivery.ecosystems_pdf_m2_y +
      use.ecosystems_pdf_m2_y +
      endOfLife.ecosystems_pdf_m2_y,
    human_health_daly:
      production.human_health_daly +
      delivery.human_health_daly +
      use.human_health_daly +
      endOfLife.human_health_daly,
    production,
    delivery,
    use,
    end_of_life: endOfLife,
  };
}

export function calculateDeviceImpact(
  deviceArn: string,
  usageHours: number,
  region: string,
  customOverheadFactor?: number
): DeviceImpactResponse {
  const profile = DEVICE_PROFILES[deviceArn];
  if (!profile) {
    throw new Error(`Device not found: ${deviceArn}`);
  }

  // Check if technology is supported
  const supported = isTechnologySupported(profile.technology);

  if (!supported) {
    // Return response with zero impact and unsupported flag
    const zeroImpact: ImpactResult = {
      climate_change_tco2eq: 0,
      ecosystems_pdf_m2_y: 0,
      human_health_daly: 0,
      production: { climate_change_tco2eq: 0, ecosystems_pdf_m2_y: 0, human_health_daly: 0 },
      delivery: { climate_change_tco2eq: 0, ecosystems_pdf_m2_y: 0, human_health_daly: 0 },
      use: { climate_change_tco2eq: 0, ecosystems_pdf_m2_y: 0, human_health_daly: 0 },
      end_of_life: { climate_change_tco2eq: 0, ecosystems_pdf_m2_y: 0, human_health_daly: 0 },
    };

    return {
      device_arn: profile.device_arn,
      device_name: profile.device_name,
      provider: profile.provider,
      technology: profile.technology,
      qec_type: profile.qec_type,
      cryogenic: profile.cryogenic,
      impact: zeroImpact,
      usage_hours: usageHours,
      region,
      is_projection: false,
      supported: false,
      unsupported_reason: `The LCA model (Cordier et al. 2024) was developed specifically for superconducting quantum computers. ${profile.technology} technology requires separate LCA studies for accurate environmental impact assessment.`,
    };
  }

  // Calculate effective overhead factor:
  // - If custom overhead is provided, apply device's QEC efficiency factor
  //   (devices with higher fidelity need fewer physical qubits for same logical qubits)
  // - Otherwise use device's default overhead which already includes efficiency
  const baseOverhead = customOverheadFactor ?? profile.default_overhead_factor;
  const effectiveOverhead = customOverheadFactor
    ? Math.round(baseOverhead * profile.qec_efficiency) // Apply device-specific QEC efficiency
    : baseOverhead; // Device default already accounts for efficiency

  const impact = calculateImpact(
    1, // logical qubits (minimum for calculation)
    profile.qec_type,
    usageHours,
    region,
    effectiveOverhead,
    profile.multiplexing_factor,
    profile.power_factor // Use device-specific power factor
  );

  return {
    device_arn: profile.device_arn,
    device_name: profile.device_name,
    provider: profile.provider,
    technology: profile.technology,
    qec_type: profile.qec_type,
    cryogenic: profile.cryogenic,
    impact,
    usage_hours: usageHours,
    region,
    is_projection: false,
    supported: true,
  };
}

export function compareDevices(
  deviceArns: string[],
  usageHours: number,
  region: string,
  customOverheadFactor?: number
): CompareDevicesResponse {
  if (deviceArns.length === 0) {
    throw new Error('device_arns cannot be empty');
  }

  // Calculate impacts for all devices
  const deviceResults = deviceArns.map((arn) => calculateDeviceImpact(arn, usageHours, region, customOverheadFactor));

  // Create rankings by each indicator
  const indicators = {
    climate_change: 'climate_change_tco2eq' as const,
    ecosystems: 'ecosystems_pdf_m2_y' as const,
    human_health: 'human_health_daly' as const,
  };

  const rankings: Record<string, string[]> = {};
  const percentageVsBest: Record<string, Record<string, number>> = {};

  for (const [indicatorName, attrName] of Object.entries(indicators)) {
    // Filter to only supported devices for ranking and percentage calculations
    const supportedResults = deviceResults.filter((d) => d.supported !== false);

    // Sort supported devices by this indicator (ascending - lower is better)
    const sortedSupported = [...supportedResults].sort(
      (a, b) => a.impact[attrName] - b.impact[attrName]
    );

    // Sort all devices (supported first, then unsupported)
    const sortedDevices = [
      ...sortedSupported,
      ...deviceResults.filter((d) => d.supported === false),
    ];
    rankings[indicatorName] = sortedDevices.map((d) => d.device_arn);

    // Calculate percentage vs best (only among supported devices)
    const supportedImpacts = supportedResults.map((d) => d.impact[attrName]);
    const minImpact = supportedImpacts.length > 0 ? Math.min(...supportedImpacts) : 0;

    const percentages: Record<string, number> = {};
    for (const result of deviceResults) {
      if (result.supported === false) {
        // Unsupported devices get null/undefined percentage (will show as N/A)
        percentages[result.device_arn] = NaN;
      } else {
        const impactValue = result.impact[attrName];
        if (minImpact === 0) {
          percentages[result.device_arn] = impactValue === 0 ? 0 : Infinity;
        } else {
          percentages[result.device_arn] = ((impactValue - minImpact) / minImpact) * 100;
        }
      }
    }
    percentageVsBest[indicatorName] = percentages;
  }

  return {
    devices: deviceResults,
    usage_hours: usageHours,
    region,
    rankings,
    percentage_vs_best: percentageVsBest,
  };
}

export function getDevices(): DeviceProfile[] {
  return Object.values(DEVICE_PROFILES);
}

export function getRegions(): { regions: string[]; carbon_intensity: Record<string, number> } {
  return {
    regions: Object.keys(CARBON_INTENSITY),
    carbon_intensity: CARBON_INTENSITY,
  };
}

export function getTechnologyDefaults(): Record<string, {
  qec_type: string;
  default_overhead_factor: number;
  multiplexing_factor: number;
  cryogenic: boolean;
}> {
  return TECHNOLOGY_DEFAULTS;
}
