'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Leaf, Globe, Heart, Factory, Truck, Zap, Recycle,
  ChevronDown, Info, Calculator, BarChart3, Sliders, RefreshCw, AlertCircle, ExternalLink,
  ChevronRight, FileText, Snowflake, Thermometer, Atom, FlaskConical, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTooltip, TERM_DEFINITIONS } from './ui/InfoTooltip';

// Types for API responses
interface PhaseBreakdown {
  climate_change_tco2eq: number;
  ecosystems_pdf_m2_y: number;
  human_health_daly: number;
}

interface ImpactResult {
  climate_change_tco2eq: number;
  ecosystems_pdf_m2_y: number;
  human_health_daly: number;
  production: PhaseBreakdown;
  delivery: PhaseBreakdown;
  use: PhaseBreakdown;
  end_of_life: PhaseBreakdown;
}

interface DeviceImpactResponse {
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
  supported?: boolean;
  unsupported_reason?: string;
}

interface CompareDevicesResponse {
  devices: DeviceImpactResponse[];
  usage_hours: number;
  region: string;
  rankings: Record<string, string[]>;
  percentage_vs_best: Record<string, Record<string, number>>;
}

type Region = 'quebec' | 'belgium' | 'usa' | 'global';

// Constants for UI display
const REGION_LABELS: Record<Region, string> = {
  quebec: 'Quebec, Canada (Hydro)',
  belgium: 'Belgium (EU Mix)',
  usa: 'United States (Average)',
  global: 'Global Average',
};

const CARBON_INTENSITY: Record<Region, number> = {
  quebec: 0.0017,
  belgium: 0.167,
  usa: 0.386,
  global: 0.475,
};

// Device ARN mapping for the selected device IDs
const DEVICE_ARN_MAP: Record<string, string> = {
  ionq_aria: 'arn:aws:braket:us-east-1::device/qpu/ionq/Aria-1',
  ionq_forte: 'arn:aws:braket:us-east-1::device/qpu/ionq/Forte-1',
  aqt_ibex_q1: 'arn:aws:braket:eu-central-1::device/qpu/aqt/IBEX-Q1',
  iqm_garnet: 'arn:aws:braket:eu-north-1::device/qpu/iqm/Garnet',
  iqm_emerald: 'arn:aws:braket:eu-north-1::device/qpu/iqm/Emerald',
  rigetti_ankaa3: 'arn:aws:braket:us-west-1::device/qpu/rigetti/Ankaa-3',
  quera_aquila: 'arn:aws:braket:us-east-1::device/qpu/quera/Aquila',
};

// All available device ARNs for comparison
const ALL_DEVICE_ARNS = [
  'arn:aws:braket:us-east-1::device/qpu/ionq/Aria-1',
  'arn:aws:braket:us-east-1::device/qpu/ionq/Aria-2',
  'arn:aws:braket:us-east-1::device/qpu/ionq/Forte-1',
  'arn:aws:braket:eu-central-1::device/qpu/aqt/IBEX-Q1',
  'arn:aws:braket:eu-north-1::device/qpu/iqm/Garnet',
  'arn:aws:braket:eu-north-1::device/qpu/iqm/Emerald',
  'arn:aws:braket:us-west-1::device/qpu/rigetti/Ankaa-3',
  'arn:aws:braket:us-east-1::device/qpu/quera/Aquila',
];

interface EnvironmentalImpactSectionProps {
  selectedDevice?: string;
}

// Phase colors for visualization
const PHASE_COLORS = {
  production: { bg: 'bg-amber-500', text: 'text-amber-400', label: 'Production' },
  delivery: { bg: 'bg-blue-500', text: 'text-blue-400', label: 'Delivery' },
  use: { bg: 'bg-green-500', text: 'text-green-400', label: 'Use' },
  end_of_life: { bg: 'bg-purple-500', text: 'text-purple-400', label: 'End of Life' },
};

// Technology colors
const TECH_COLORS: Record<string, { bg: string; text: string }> = {
  superconducting: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  'trapped-ion': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  'neutral-atom': { bg: 'bg-green-500/20', text: 'text-green-400' },
};

// Technology icons
function getTechnologyIcon(technology: string, size: number = 16): React.ReactNode {
  const iconProps = { size, className: 'inline-block' };
  switch (technology) {
    case 'superconducting':
      return <Snowflake {...iconProps} className="inline-block text-cyan-400" />;
    case 'trapped-ion':
      return <Thermometer {...iconProps} className="inline-block text-purple-400" />;
    case 'neutral-atom':
      return <Atom {...iconProps} className="inline-block text-green-400" />;
    default:
      return <FlaskConical {...iconProps} className="inline-block text-gray-400" />;
  }
}

// Get technology tooltip definition
function getTechnologyDefinition(technology: string) {
  switch (technology) {
    case 'superconducting':
      return TERM_DEFINITIONS.superconducting;
    case 'trapped-ion':
      return TERM_DEFINITIONS.trapped_ion;
    case 'neutral-atom':
      return TERM_DEFINITIONS.neutral_atom;
    default:
      return TERM_DEFINITIONS.qec;
  }
}

// Format impact value for display
function formatImpactValue(value: number, type: 'climate' | 'ecosystems' | 'health'): string {
  switch (type) {
    case 'climate':
      if (value >= 1000) {
        return `${(value / 1000).toFixed(2)} kt CO2eq`;
      }
      return `${value.toFixed(4)} t CO2eq`;
    case 'ecosystems':
      return `${value.toFixed(6)} PDF.m².y`;
    case 'health':
      return `${value.toExponential(2)} DALY`;
  }
}

// Check if device has environmental data
function hasEnvironmentalData(deviceId?: string): boolean {
  return deviceId ? deviceId in DEVICE_ARN_MAP : false;
}

// API call to compare devices
async function fetchCompareDevices(
  deviceArns: string[],
  usageHours: number,
  region: string,
  overheadFactor?: number | null
): Promise<CompareDevicesResponse> {
  const body: Record<string, unknown> = {
    action: 'compare',
    device_arns: deviceArns,
    usage_hours: usageHours,
    logical_qubits: 1,
    region,
  };
  if (overheadFactor !== null && overheadFactor !== undefined) {
    body.overhead_factor = overheadFactor;
  }

  const response = await fetch('/api/env-impact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch comparison data');
  }

  return response.json();
}

// API call to calculate single device impact
async function fetchDeviceImpact(
  deviceArn: string,
  usageHours: number,
  region: string,
  overheadFactor?: number | null
): Promise<DeviceImpactResponse> {
  const body: Record<string, unknown> = {
    action: 'calculate',
    device_arn: deviceArn,
    usage_hours: usageHours,
    logical_qubits: 1,
    region,
  };
  if (overheadFactor !== null && overheadFactor !== undefined) {
    body.overhead_factor = overheadFactor;
  }

  const response = await fetch('/api/env-impact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch device impact');
  }

  return response.json();
}

// Calculation Formulas Collapsible Section
function CalculationFormulasSection() {
  const [isFormulaExpanded, setIsFormulaExpanded] = useState(false);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsFormulaExpanded(!isFormulaExpanded)}
        className="w-full flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15 transition-colors text-left"
      >
        <ChevronRight
          className={cn(
            'w-4 h-4 text-purple-400 transition-transform duration-200',
            isFormulaExpanded && 'rotate-90'
          )}
        />
        <FileText className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-purple-300">Calculation Formulas</span>
        <span className="text-xs text-gray-500 ml-auto">
          {isFormulaExpanded ? 'Click to collapse' : 'Click to expand'}
        </span>
      </button>

      <div
        className={cn(
          'transition-all duration-300',
          isFormulaExpanded ? 'opacity-100 mt-3' : 'max-h-0 opacity-0 overflow-hidden'
        )}
      >
        <div className="p-4 rounded-lg bg-gray-900/50 border border-white/10 space-y-4 text-xs">
          {/* Infrastructure Scaling */}
          <div>
            <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Infrastructure Scaling
            </h5>
            <div className="space-y-1.5 font-mono text-gray-300 bg-black/30 p-3 rounded">
              <p><span className="text-cyan-400">N_physical</span> = N_logical × Overhead_factor</p>
              <p><span className="text-cyan-400">N_qec</span> = N_physical / Multiplexing_factor</p>
              <p><span className="text-cyan-400">N_cryostats</span> = ceil(N_qec / 29.17)</p>
              <p><span className="text-cyan-400">N_ghs</span> = ceil(N_cryostats / 2)</p>
              <p><span className="text-cyan-400">N_compressors</span> = N_cryostats</p>
            </div>
            <p className="text-gray-500 mt-1.5">
              QEC overhead: Surface code ~1000x, Bosonic ~7x
            </p>
          </div>

          {/* Production Phase */}
          <div>
            <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Production Phase Impact
            </h5>
            <div className="font-mono text-gray-300 bg-black/30 p-3 rounded">
              <p><span className="text-amber-400">I_prod</span> = &Sigma;(N_equipment × Factor_equipment)</p>
            </div>
            <div className="text-gray-500 mt-1.5 grid grid-cols-2 gap-x-4">
              <p>Cryostat: 2.5 tCO2eq/unit</p>
              <p>GHS: 1.8 tCO2eq/unit</p>
              <p>Compressor: 3.2 tCO2eq/unit</p>
              <p>QEC/qubit: 0.015 tCO2eq</p>
            </div>
          </div>

          {/* Use Phase */}
          <div>
            <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Use Phase Impact
            </h5>
            <div className="space-y-1.5 font-mono text-gray-300 bg-black/30 p-3 rounded">
              <p><span className="text-green-400">P_total</span> = N_cryo × 10.7kW + N_ghs × 1.8kW + N_qec × 0.245kW</p>
              <p><span className="text-green-400">E_total</span> = P_total × Usage_hours (kWh)</p>
              <p><span className="text-green-400">I_use</span> = E_total × Carbon_intensity / 1000 (tCO2eq)</p>
            </div>
            <div className="text-gray-500 mt-1.5">
              <p>Carbon intensity varies by region (kg CO2eq/kWh):</p>
              <p className="mt-1">Quebec: 0.0017 | Belgium: 0.167 | USA: 0.386 | Global: 0.475</p>
            </div>
          </div>

          {/* Delivery & End-of-Life */}
          <div>
            <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Delivery &amp; End-of-Life Impact
            </h5>
            <div className="space-y-1.5 font-mono text-gray-300 bg-black/30 p-3 rounded">
              <p><span className="text-blue-400">W_total</span> = N_cryo × 500kg + N_ghs × 150kg + N_comp × 200kg + N_qec × 50kg</p>
              <p><span className="text-blue-400">I_delivery</span> = W_total × 0.002 tCO2eq/kg</p>
              <p><span className="text-purple-400">I_eol</span> = W_total × 0.001 tCO2eq/kg</p>
            </div>
          </div>

          {/* Total Impact */}
          <div>
            <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              Total Environmental Impact
            </h5>
            <div className="font-mono text-gray-300 bg-black/30 p-3 rounded">
              <p><span className="text-white">I_total</span> = I_production + I_delivery + I_use + I_end_of_life</p>
            </div>
          </div>

          {/* Note */}
          <div className="pt-2 border-t border-white/10 text-gray-500">
            <p>
              Similar formulas apply for Ecosystems (PDF.m².y) and Human Health (DALY) indicators
              with different conversion factors. See the research paper for complete methodology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// QEC Overhead presets by technology type
const QEC_OVERHEAD_BY_TECHNOLOGY: Record<string, {
  presets: Array<{ value: number; label: string; description: string; isDefault?: boolean }>;
  defaultValue: number;
  minLog: number;
  maxLog: number;
  description: string;
}> = {
  'superconducting': {
    presets: [
      { value: 100, label: '100x', description: 'Optimistic estimate' },
      { value: 500, label: '500x', description: 'Improved surface code' },
      { value: 1000, label: '1000x', description: 'Standard surface code', isDefault: true },
      { value: 5000, label: '5000x', description: 'Conservative estimate' },
      { value: 10000, label: '10000x', description: 'High overhead' },
    ],
    defaultValue: 1000,
    minLog: 2, // 100
    maxLog: 4, // 10000
    description: 'Superconducting qubits use surface code QEC with ~1000x typical overhead',
  },
  'trapped-ion': {
    presets: [
      { value: 50, label: '50x', description: 'Optimistic estimate' },
      { value: 100, label: '100x', description: 'Improved connectivity', isDefault: true },
      { value: 500, label: '500x', description: 'Standard surface code' },
      { value: 1000, label: '1000x', description: 'Conservative estimate' },
    ],
    defaultValue: 100,
    minLog: 1.7, // ~50
    maxLog: 3, // 1000
    description: 'Trapped-ion qubits benefit from all-to-all connectivity, reducing overhead to ~100x',
  },
  'neutral-atom': {
    presets: [
      { value: 1, label: '1x', description: 'No QEC (NISQ)' },
      { value: 7, label: '7x', description: 'GKP bosonic code', isDefault: true },
      { value: 20, label: '20x', description: 'Improved bosonic code' },
      { value: 100, label: '100x', description: 'Surface code fallback' },
    ],
    defaultValue: 7,
    minLog: 0, // 1
    maxLog: 2, // 100
    description: 'Neutral-atom systems use efficient bosonic codes with ~7x typical overhead',
  },
};

// Default fallback for unknown technologies
const DEFAULT_QEC_CONFIG = {
  presets: [
    { value: 1, label: '1x', description: 'No QEC' },
    { value: 100, label: '100x', description: 'Low overhead' },
    { value: 1000, label: '1000x', description: 'Standard', isDefault: true },
    { value: 10000, label: '10000x', description: 'High overhead' },
  ],
  defaultValue: 1000,
  minLog: 0,
  maxLog: 4,
  description: 'Adjust QEC overhead factor based on error correction scheme',
};

// Get device technology from device ID
function getDeviceTechnology(deviceId?: string): string | null {
  if (!deviceId) return null;

  // Map device IDs to technology
  const deviceTechMap: Record<string, string> = {
    ionq_aria: 'trapped-ion',
    ionq_forte: 'trapped-ion',
    aqt_ibex_q1: 'trapped-ion',
    iqm_garnet: 'superconducting',
    iqm_emerald: 'superconducting',
    rigetti_ankaa3: 'superconducting',
    quera_aquila: 'neutral-atom',
  };

  return deviceTechMap[deviceId] || null;
}

export function EnvironmentalImpactSection({ selectedDevice }: EnvironmentalImpactSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'comparison' | 'calculator'>('comparison');

  // Input state (user adjustable parameters)
  const [usageHours, setUsageHours] = useState(1000);
  const [region, setRegion] = useState<Region>('quebec');
  const [overheadFactor, setOverheadFactor] = useState<number | null>(null); // null = use device default
  const [useCustomOverhead, setUseCustomOverhead] = useState(false);

  // Calculation results state (updated when user clicks Calculate)
  const [comparisonData, setComparisonData] = useState<CompareDevicesResponse | null>(null);
  const [selectedDeviceImpact, setSelectedDeviceImpact] = useState<DeviceImpactResponse | null>(null);
  const [calculatedParams, setCalculatedParams] = useState<{
    usageHours: number;
    region: Region;
    overheadFactor: number | null;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if current inputs differ from last calculated params
  const hasChanges = !calculatedParams ||
    calculatedParams.usageHours !== usageHours ||
    calculatedParams.region !== region ||
    calculatedParams.overheadFactor !== (useCustomOverhead ? overheadFactor : null);

  // Calculate function - called when user clicks the button
  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    setError(null);

    const effectiveOverhead = useCustomOverhead ? overheadFactor : null;

    try {
      // Fetch comparison data for all devices
      const comparison = await fetchCompareDevices(ALL_DEVICE_ARNS, usageHours, region, effectiveOverhead);
      setComparisonData(comparison);

      // Fetch selected device impact if applicable
      if (selectedDevice && hasEnvironmentalData(selectedDevice)) {
        const deviceArn = DEVICE_ARN_MAP[selectedDevice];
        const deviceImpact = await fetchDeviceImpact(deviceArn, usageHours, region, effectiveOverhead);
        setSelectedDeviceImpact(deviceImpact);
      } else {
        setSelectedDeviceImpact(null);
      }

      setCalculatedParams({ usageHours, region, overheadFactor: effectiveOverhead });
    } catch (err) {
      console.error('Failed to fetch environmental impact data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsCalculating(false);
    }
  }, [usageHours, region, selectedDevice, useCustomOverhead, overheadFactor]);

  // Calculate on mount and when selectedDevice changes
  useEffect(() => {
    handleCalculate();
  }, [selectedDevice]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update QEC overhead factor default when device changes
  useEffect(() => {
    if (useCustomOverhead) {
      const technology = getDeviceTechnology(selectedDevice);
      const qecConfig = technology ? QEC_OVERHEAD_BY_TECHNOLOGY[technology] : DEFAULT_QEC_CONFIG;
      setOverheadFactor(qecConfig.defaultValue);
    }
  }, [selectedDevice]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get phase percentages for selected device
  const phasePercentages = useMemo(() => {
    if (!selectedDeviceImpact) return null;
    const total = selectedDeviceImpact.impact.climate_change_tco2eq;
    if (total === 0) {
      return { production: 0, delivery: 0, use: 0, end_of_life: 0 };
    }
    return {
      production: (selectedDeviceImpact.impact.production.climate_change_tco2eq / total) * 100,
      delivery: (selectedDeviceImpact.impact.delivery.climate_change_tco2eq / total) * 100,
      use: (selectedDeviceImpact.impact.use.climate_change_tco2eq / total) * 100,
      end_of_life: (selectedDeviceImpact.impact.end_of_life.climate_change_tco2eq / total) * 100,
    };
  }, [selectedDeviceImpact]);

  return (
    <div className="glass-effect rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-white">Environmental Impact</h3>
            <p className="text-sm text-gray-400">Compare environmental footprint of quantum devices</p>
          </div>
          <span className="ml-3 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium inline-flex items-center">
            LCA Analysis
            <InfoTooltip {...TERM_DEFINITIONS.lca} />
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-gray-400 transition-transform duration-300',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Content */}
      <div
        className={cn(
          'transition-all duration-300',
          isExpanded ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        )}
      >
        <div className="px-6 pt-2 pb-6">
          {/* Methodology Note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-300">
              <p>
                Environmental impacts calculated using Life Cycle Assessment (LCA) methodology based on
                the research paper{' '}
                <a
                  href="https://arxiv.org/abs/2411.00118"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                >
                  &quot;Scaling up to Problem Sizes: An Environmental Life Cycle Assessment of
                  Quantum Computing&quot;
                  <ExternalLink className="w-3 h-3" />
                </a>{' '}
                (Cordier et al., 2024).
              </p>
              <p className="mt-1 text-gray-400">
                Impacts include production, delivery, use, and end-of-life phases.
              </p>
            </div>
          </div>

          {/* Calculation Formulas Section */}
          <CalculationFormulasSection />

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-6">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-300">
                <p className="font-medium">Error fetching environmental data</p>
                <p className="mt-1 text-red-400">{error}</p>
                <p className="mt-2 text-gray-400">
                  Make sure the Python API server is running at the configured URL.
                </p>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <button
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'comparison'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              )}
              onClick={() => setActiveTab('comparison')}
            >
              <BarChart3 className="w-4 h-4" />
              Device Comparison
            </button>
            <button
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'calculator'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              )}
              onClick={() => setActiveTab('calculator')}
            >
              <Calculator className="w-4 h-4" />
              Interactive Calculator
            </button>
          </div>

          {/* Parameter Controls */}
          <div className="p-4 rounded-lg bg-white/5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-white">Calculation Parameters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Usage Hours</label>
                <input
                  type="number"
                  value={usageHours}
                  onChange={(e) => setUsageHours(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={100000}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">1 - 100,000 hours</span>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 flex items-center">
                  Region (Carbon Intensity)
                  <InfoTooltip {...TERM_DEFINITIONS.carbon_intensity} />
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as Region)}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500"
                >
                  {Object.entries(REGION_LABELS).map(([key, label]) => (
                    <option key={key} value={key} className="bg-gray-900">
                      {label}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-gray-500 mt-1 block">{CARBON_INTENSITY[region]} kg CO2eq/kWh</span>
              </div>
            </div>

            {/* QEC Overhead Factor - Only show for superconducting devices */}
            {(() => {
              const technology = getDeviceTechnology(selectedDevice);
              // Only show QEC slider for superconducting technology (the only supported one)
              const isTechSupported = technology === 'superconducting';
              const qecConfig = technology ? QEC_OVERHEAD_BY_TECHNOLOGY[technology] : DEFAULT_QEC_CONFIG;

              // If technology is not supported, show a simplified info box
              if (technology && !isTechSupported) {
                return (
                  <div className="mb-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-medium text-orange-300">QEC Overhead Not Applicable</span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      The LCA model only supports superconducting quantum computers. QEC overhead calculations
                      for {technology} technology are not available as this requires a separate environmental study.
                    </p>
                  </div>
                );
              }

              return (
                <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-400 flex items-center">
                      QEC Overhead Factor
                      <InfoTooltip {...TERM_DEFINITIONS.overhead_factor} />
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">
                        {useCustomOverhead ? 'Custom' : 'Device Default'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustomOverhead(!useCustomOverhead);
                          if (!useCustomOverhead && overheadFactor === null) {
                            setOverheadFactor(qecConfig.defaultValue);
                          }
                        }}
                        className={cn(
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900',
                          useCustomOverhead ? 'bg-green-500' : 'bg-gray-600'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform',
                            useCustomOverhead ? 'translate-x-[18px]' : 'translate-x-[3px]'
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Technology indicator */}
                  {technology && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{getTechnologyIcon(technology)}</span>
                      <span className="text-xs text-gray-400">
                        {technology.charAt(0).toUpperCase() + technology.slice(1).replace('-', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        (Default: {qecConfig.defaultValue}x)
                      </span>
                    </div>
                  )}

                  {useCustomOverhead && (
                    <div className="space-y-3">
                      {/* Preset buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        {qecConfig.presets.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => setOverheadFactor(preset.value)}
                            className={cn(
                              'px-2 py-1 rounded text-[10px] transition-colors',
                              overheadFactor === preset.value
                                ? 'bg-green-500 text-white'
                                : preset.isDefault
                                ? 'bg-green-500/30 text-green-300 hover:bg-green-500/40 ring-1 ring-green-500/50'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            )}
                            title={preset.description}
                          >
                            {preset.label}
                            {preset.isDefault && ' ★'}
                          </button>
                        ))}
                      </div>

                      {/* Slider */}
                      <div>
                        <input
                          type="range"
                          min={qecConfig.minLog * 10}
                          max={qecConfig.maxLog * 10}
                          step={1}
                          value={Math.log10(overheadFactor || qecConfig.defaultValue) * 10}
                          onChange={(e) => setOverheadFactor(Math.round(Math.pow(10, parseInt(e.target.value) / 10)))}
                          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                        <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                          <span>{Math.round(Math.pow(10, qecConfig.minLog))}x</span>
                          <span>{Math.round(Math.pow(10, (qecConfig.minLog + qecConfig.maxLog) / 2))}x</span>
                          <span>{Math.round(Math.pow(10, qecConfig.maxLog))}x</span>
                        </div>
                      </div>

                      {/* Current value display */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Current overhead:</span>
                        <span className="font-mono text-green-400 font-medium">{overheadFactor?.toLocaleString()}x</span>
                      </div>

                      <p className="text-[10px] text-gray-500">
                        {qecConfig.description}
                      </p>
                      <p className="text-[10px] text-cyan-400/80 mt-1 flex items-start gap-1">
                        <Lightbulb size={12} className="flex-shrink-0 mt-0.5" />
                        <span>Different providers have different QEC efficiency based on gate fidelity.
                        Check the &quot;Eff. Overhead&quot; column in the comparison table.</span>
                      </p>
                    </div>
                  )}

                  {!useCustomOverhead && (
                    <p className="text-[10px] text-gray-500">
                      {qecConfig.description}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
                hasChanges
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20',
                isCalculating && 'opacity-70 cursor-not-allowed'
              )}
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  {hasChanges ? 'Calculate Impact' : 'Recalculate'}
                </>
              )}
            </button>
            {calculatedParams && (
              <p className="text-[10px] text-gray-500 mt-2 text-center">
                Last calculated: {calculatedParams.usageHours.toLocaleString()} hours, {REGION_LABELS[calculatedParams.region]}
              </p>
            )}
          </div>

          {activeTab === 'comparison' && comparisonData && (
            <DeviceComparisonView
              comparisonData={comparisonData}
              selectedDevice={selectedDevice}
              usageHours={usageHours}
              customOverhead={useCustomOverhead ? overheadFactor : null}
            />
          )}

          {activeTab === 'comparison' && !comparisonData && !isCalculating && !error && (
            <div className="text-center py-8">
              <RefreshCw className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Click &quot;Calculate Impact&quot; to load comparison data</p>
            </div>
          )}

          {activeTab === 'calculator' && selectedDeviceImpact && phasePercentages && (
            <CalculatorView
              deviceData={selectedDeviceImpact}
              phasePercentages={phasePercentages}
              region={region}
            />
          )}

          {activeTab === 'calculator' && (!selectedDevice || !hasEnvironmentalData(selectedDevice)) && (
            <div className="text-center py-8">
              <Leaf className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                Select a QPU device above to see detailed environmental impact analysis.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Environmental data is available for: IonQ Aria, IonQ Forte, IQM Garnet, Rigetti Ankaa-3, QuEra Aquila
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// QEC Efficiency by device ARN (based on gate fidelity - higher fidelity = lower overhead needed)
// Source: IQM arXiv:2408.12433, Rigetti specs (Dec 2024)
const DEVICE_QEC_EFFICIENCY: Record<string, { efficiency: number; fidelity: string }> = {
  'arn:aws:braket:eu-north-1::device/qpu/iqm/Garnet': { efficiency: 0.85, fidelity: '99.5%' },
  'arn:aws:braket:eu-north-1::device/qpu/iqm/Emerald': { efficiency: 0.9, fidelity: '99.3%' },
  'arn:aws:braket:us-west-1::device/qpu/rigetti/Ankaa-3': { efficiency: 1.15, fidelity: '98.7%' },
};

// Device Comparison Table
function DeviceComparisonView({
  comparisonData,
  selectedDevice,
  usageHours,
  customOverhead,
}: {
  comparisonData: CompareDevicesResponse;
  selectedDevice?: string;
  usageHours: number;
  customOverhead: number | null;
}) {
  // Sort devices by climate change impact
  const sortedDevices = [...comparisonData.devices].sort(
    (a, b) => a.impact.climate_change_tco2eq - b.impact.climate_change_tco2eq
  );

  const selectedDeviceArn = selectedDevice ? DEVICE_ARN_MAP[selectedDevice] : null;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-green-400" />
        Device Comparison ({usageHours.toLocaleString()} hours usage)
      </h4>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-gray-400 font-medium">Device</th>
              <th className="text-left py-2 px-3 text-gray-400 font-medium">Provider</th>
              <th className="text-left py-2 px-3 text-gray-400 font-medium">
                <span className="inline-flex items-center">
                  Technology
                  <InfoTooltip {...TERM_DEFINITIONS.qec} />
                </span>
              </th>
              {customOverhead && (
                <th className="text-right py-2 px-3 text-gray-400 font-medium">
                  <span className="inline-flex items-center justify-end">
                    Eff. Overhead
                    <InfoTooltip
                      term="Effective Overhead"
                      definition="The actual QEC overhead after applying device-specific efficiency. Higher gate fidelity means fewer physical qubits needed for error correction."
                    />
                  </span>
                </th>
              )}
              <th className="text-right py-2 px-3 text-gray-400 font-medium">
                <span className="inline-flex items-center justify-end">
                  Climate Impact
                  <InfoTooltip {...TERM_DEFINITIONS.climate_change} />
                </span>
              </th>
              <th className="text-right py-2 px-3 text-gray-400 font-medium">vs Best</th>
            </tr>
          </thead>
          <tbody>
            {sortedDevices.map((item) => {
              const percentageDiff = comparisonData.percentage_vs_best.climate_change?.[item.device_arn] || 0;
              const isSupported = item.supported !== false;
              const supportedDevices = sortedDevices.filter(d => d.supported !== false);
              const supportedIndex = supportedDevices.findIndex(d => d.device_arn === item.device_arn);

              return (
                <tr
                  key={item.device_arn}
                  className={cn(
                    'border-b border-white/5 transition-colors',
                    item.device_arn === selectedDeviceArn && 'bg-green-500/10',
                    isSupported && supportedIndex === 0 && 'bg-emerald-500/5',
                    !isSupported && 'opacity-60'
                  )}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span>{getTechnologyIcon(item.technology)}</span>
                      <span className={cn('font-medium', isSupported ? 'text-white' : 'text-gray-400')}>{item.device_name}</span>
                      {isSupported && supportedIndex === 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400">
                          Best
                        </span>
                      )}
                      {item.device_arn === selectedDeviceArn && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400">
                          Selected
                        </span>
                      )}
                      {!isSupported && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-400">
                          Not Supported
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-300">{item.provider}</td>
                  <td className="py-3 px-3">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs inline-flex items-center',
                        TECH_COLORS[item.technology]?.bg,
                        TECH_COLORS[item.technology]?.text
                      )}
                    >
                      {item.technology}
                      <InfoTooltip {...getTechnologyDefinition(item.technology)} />
                    </span>
                  </td>
                  {customOverhead && (
                    <td className="py-3 px-3 text-right font-mono">
                      {isSupported ? (() => {
                        const deviceInfo = DEVICE_QEC_EFFICIENCY[item.device_arn];
                        if (deviceInfo) {
                          const effectiveOverhead = Math.round(customOverhead * deviceInfo.efficiency);
                          return (
                            <div className="flex flex-col items-end">
                              <span className={cn(
                                'text-white',
                                deviceInfo.efficiency < 1 ? 'text-emerald-400' : deviceInfo.efficiency > 1 ? 'text-amber-400' : ''
                              )}>
                                {effectiveOverhead.toLocaleString()}x
                              </span>
                              <span className="text-[9px] text-gray-500">
                                {deviceInfo.fidelity} fidelity
                              </span>
                            </div>
                          );
                        }
                        return <span className="text-white">{customOverhead.toLocaleString()}x</span>;
                      })() : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right font-mono">
                    {isSupported ? (
                      <span className="text-white">{formatImpactValue(item.impact.climate_change_tco2eq, 'climate')}</span>
                    ) : (
                      <span className="text-gray-500 text-xs">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {!isSupported ? (
                      <span className="text-gray-500 text-xs">—</span>
                    ) : supportedIndex === 0 ? (
                      <span className="text-emerald-400 font-medium">baseline</span>
                    ) : (
                      <span className="text-amber-400">+{percentageDiff.toFixed(0)}%</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Visual Bar Chart */}
      <div className="mt-6 space-y-3">
        <h5 className="text-xs font-medium text-gray-400 uppercase">
          Climate Impact Comparison (Supported Devices Only)
        </h5>
        {sortedDevices.map((item) => {
          const isSupported = item.supported !== false;
          const supportedDevices = sortedDevices.filter(d => d.supported !== false);
          const maxImpact = supportedDevices[supportedDevices.length - 1]?.impact.climate_change_tco2eq || 1;
          const barWidth = isSupported ? (item.impact.climate_change_tco2eq / maxImpact) * 100 : 0;

          return (
            <div key={item.device_arn} className={cn('flex items-center gap-3 group', !isSupported && 'opacity-50')}>
              <div className="w-24 text-xs text-gray-300 truncate group-hover:text-white transition-colors">{item.device_name}</div>
              <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                {isSupported ? (
                  <div
                    className={cn(
                      'h-full rounded transition-all duration-500 ease-out flex items-center justify-end pr-2',
                      item.device_arn === selectedDeviceArn
                        ? 'bg-gradient-to-r from-green-600 to-green-400'
                        : TECH_COLORS[item.technology]?.bg.replace('/20', '/60')
                    )}
                    style={{ width: `${barWidth}%` }}
                  >
                    <span className="text-[10px] font-mono text-white/80 tabular-nums transition-all duration-300">
                      {item.impact.climate_change_tco2eq.toFixed(4)}
                    </span>
                  </div>
                ) : (
                  <div className="h-full flex items-center px-2">
                    <span className="text-[10px] text-gray-500">Not supported by LCA model</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Technology Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {['superconducting', 'trapped-ion', 'neutral-atom'].map((tech) => {
          const techDevices = sortedDevices.filter((d) => d.technology === tech);
          if (techDevices.length === 0) return null;
          const supportedDevices = techDevices.filter(d => d.supported !== false);
          const isSupported = supportedDevices.length > 0;
          const avgImpact = isSupported
            ? supportedDevices.reduce((sum, d) => sum + d.impact.climate_change_tco2eq, 0) / supportedDevices.length
            : 0;

          return (
            <div
              key={tech}
              className={cn(
                'p-4 rounded-lg border',
                TECH_COLORS[tech]?.bg,
                'border-white/10',
                !isSupported && 'opacity-60'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getTechnologyIcon(tech)}</span>
                <span className={cn('font-medium text-sm inline-flex items-center', TECH_COLORS[tech]?.text)}>
                  {tech.charAt(0).toUpperCase() + tech.slice(1).replace('-', ' ')}
                  <InfoTooltip {...getTechnologyDefinition(tech)} />
                </span>
                {!isSupported && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-orange-500/20 text-orange-400 ml-1">
                    Not Supported
                  </span>
                )}
              </div>
              {isSupported ? (
                <>
                  <div className="text-xs text-gray-400">
                    Avg. Climate Impact:{' '}
                    <span className="text-white font-mono">{avgImpact.toFixed(4)} t CO2eq</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {supportedDevices.length} device{supportedDevices.length > 1 ? 's' : ''}
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-500">
                  LCA model not available for this technology
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* LCA Model Limitation Note */}
      <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-300">
            <p className="font-medium text-orange-300">LCA Model Limitation</p>
            <p className="mt-1 text-gray-400">
              The environmental impact model (Cordier et al. 2024) was developed specifically for
              <strong className="text-cyan-400"> superconducting </strong> quantum computers.
              Technologies like <strong className="text-purple-400">trapped-ion</strong> and
              <strong className="text-green-400"> neutral-atom</strong> have different characteristics
              (e.g., no cryogenic cooling) and require separate LCA studies for accurate assessment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Calculator View with Phase Breakdown
function CalculatorView({
  deviceData,
  phasePercentages,
  region,
}: {
  deviceData: DeviceImpactResponse;
  phasePercentages: { production: number; delivery: number; use: number; end_of_life: number };
  region: Region;
}) {
  const isSupported = deviceData.supported !== false;

  // Show unsupported message if device technology is not supported
  if (!isSupported) {
    return (
      <div className="space-y-6">
        {/* Device Summary */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{getTechnologyIcon(deviceData.technology)}</span>
            <div>
              <h4 className="font-bold text-white">{deviceData.provider} {deviceData.device_name}</h4>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-xs inline-flex items-center',
                  TECH_COLORS[deviceData.technology]?.bg,
                  TECH_COLORS[deviceData.technology]?.text
                )}
              >
                {deviceData.technology}
                <InfoTooltip {...getTechnologyDefinition(deviceData.technology)} />
              </span>
            </div>
          </div>
        </div>

        {/* Not Supported Warning */}
        <div className="p-6 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="w-12 h-12 text-orange-400 mb-4" />
            <h4 className="text-lg font-bold text-orange-300 mb-2">Technology Not Supported</h4>
            <p className="text-sm text-gray-300 max-w-md">
              {deviceData.unsupported_reason || `Environmental impact calculation is not available for ${deviceData.technology} quantum computers.`}
            </p>
            <div className="mt-4 p-3 rounded bg-white/5 text-xs text-gray-400">
              <p><strong>Supported technologies:</strong> Superconducting (IQM, Rigetti)</p>
              <p className="mt-1"><strong>Not supported:</strong> Trapped-ion (IonQ, AQT), Neutral-atom (QuEra)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Device Summary */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{getTechnologyIcon(deviceData.technology)}</span>
          <div>
            <h4 className="font-bold text-white">{deviceData.provider} {deviceData.device_name}</h4>
            <span
              className={cn(
                'px-2 py-0.5 rounded text-xs inline-flex items-center',
                TECH_COLORS[deviceData.technology]?.bg,
                TECH_COLORS[deviceData.technology]?.text
              )}
            >
              {deviceData.technology}
              <InfoTooltip {...getTechnologyDefinition(deviceData.technology)} />
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-gray-400 inline-flex items-center">
              QEC Type
              <InfoTooltip
                {...(deviceData.qec_type === 'bosonic'
                  ? TERM_DEFINITIONS.bosonic
                  : deviceData.qec_type === 'surface'
                  ? TERM_DEFINITIONS.surface_code
                  : TERM_DEFINITIONS.qec)}
              />
            </span>
            <div className="text-white font-medium mt-1">{deviceData.qec_type}</div>
          </div>
          <div>
            <span className="text-gray-400 inline-flex items-center">
              Cryogenic
              <InfoTooltip {...TERM_DEFINITIONS.cryogenic} />
            </span>
            <div className="text-white font-medium mt-1">{deviceData.cryogenic ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <span className="text-gray-400 inline-flex items-center">
              Region
              <InfoTooltip {...TERM_DEFINITIONS.carbon_intensity} />
            </span>
            <div className="text-white font-medium mt-1">{REGION_LABELS[region]}</div>
          </div>
        </div>
      </div>

      {/* Environmental Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium text-amber-400 inline-flex items-center">
              Climate Change
              <InfoTooltip {...TERM_DEFINITIONS.climate_change} />
            </span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatImpactValue(deviceData.impact.climate_change_tco2eq, 'climate')}
          </div>
          <p className="text-xs text-gray-400 mt-1">Global warming potential</p>
        </div>

        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-green-400 inline-flex items-center">
              Ecosystems
              <InfoTooltip {...TERM_DEFINITIONS.ecosystems} />
            </span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatImpactValue(deviceData.impact.ecosystems_pdf_m2_y, 'ecosystems')}
          </div>
          <p className="text-xs text-gray-400 mt-1">Potentially disappeared fraction</p>
        </div>

        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-red-400" />
            <span className="text-sm font-medium text-red-400 inline-flex items-center">
              Human Health
              <InfoTooltip {...TERM_DEFINITIONS.human_health} />
            </span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatImpactValue(deviceData.impact.human_health_daly, 'health')}
          </div>
          <p className="text-xs text-gray-400 mt-1">Disability-adjusted life years</p>
        </div>
      </div>

      {/* Phase Breakdown */}
      <div>
        <h5 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Factory className="w-4 h-4 text-gray-400" />
          Lifecycle Phase Breakdown (Climate Change)
          <InfoTooltip {...TERM_DEFINITIONS.lca} />
        </h5>

        {/* Phase Bar */}
        <div className="h-8 rounded-lg overflow-hidden flex mb-4">
          {Object.entries(phasePercentages).map(([phase, percentage]) => (
            <div
              key={phase}
              className={cn(
                'h-full flex items-center justify-center text-[10px] font-medium text-white transition-all',
                PHASE_COLORS[phase as keyof typeof PHASE_COLORS]?.bg
              )}
              style={{ width: `${Math.max(percentage, 0.5)}%` }}
              title={`${PHASE_COLORS[phase as keyof typeof PHASE_COLORS]?.label}: ${percentage.toFixed(1)}%`}
            >
              {percentage > 10 && `${percentage.toFixed(0)}%`}
            </div>
          ))}
        </div>

        {/* Phase Legend & Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'production', icon: Factory, value: deviceData.impact.production.climate_change_tco2eq, definition: TERM_DEFINITIONS.production_phase },
            { key: 'delivery', icon: Truck, value: deviceData.impact.delivery.climate_change_tco2eq, definition: TERM_DEFINITIONS.delivery_phase },
            { key: 'use', icon: Zap, value: deviceData.impact.use.climate_change_tco2eq, definition: TERM_DEFINITIONS.use_phase },
            { key: 'end_of_life', icon: Recycle, value: deviceData.impact.end_of_life.climate_change_tco2eq, definition: TERM_DEFINITIONS.end_of_life },
          ].map(({ key, icon: Icon, value, definition }) => (
            <div
              key={key}
              className="p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    PHASE_COLORS[key as keyof typeof PHASE_COLORS]?.bg
                  )}
                />
                <Icon className={cn('w-3 h-3', PHASE_COLORS[key as keyof typeof PHASE_COLORS]?.text)} />
                <span className="text-xs text-gray-400 inline-flex items-center">
                  {PHASE_COLORS[key as keyof typeof PHASE_COLORS]?.label}
                  <InfoTooltip {...definition} />
                </span>
              </div>
              <div className="font-mono text-sm text-white">
                {value.toFixed(4)} t CO2eq
              </div>
              <div className="text-[10px] text-gray-500">
                {phasePercentages[key as keyof typeof phasePercentages].toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-white/10">
        <h5 className="text-sm font-semibold text-white mb-3">Key Insights</h5>
        <ul className="text-xs text-gray-300 space-y-2">
          {phasePercentages.production > 50 && (
            <li className="flex items-start gap-2">
              <Factory className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong className="text-amber-400">Production dominates</strong> the environmental
                footprint ({phasePercentages.production.toFixed(1)}%). Manufacturing quantum hardware
                requires significant resources.
              </span>
            </li>
          )}
          {phasePercentages.use > 10 && (
            <li className="flex items-start gap-2">
              <Zap className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong className="text-green-400">Use phase</strong> accounts for{' '}
                {phasePercentages.use.toFixed(1)}% of impact. Operating in {REGION_LABELS[region]} with
                carbon intensity of {CARBON_INTENSITY[region]} kg CO2eq/kWh affects this.
              </span>
            </li>
          )}
          {deviceData.cryogenic && (
            <li className="flex items-start gap-2">
              <Snowflake size={18} className="text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-cyan-400">Cryogenic cooling</strong> is required for this
                superconducting device, significantly increasing power consumption.
              </span>
            </li>
          )}
          {deviceData.technology === 'neutral-atom' && (
            <li className="flex items-start gap-2">
              <Atom size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-green-400">Neutral-atom technology</strong> with bosonic QEC
                has the lowest overhead factor, resulting in lower environmental impact.
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default EnvironmentalImpactSection;
