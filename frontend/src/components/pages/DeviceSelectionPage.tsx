'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ArrowRight, ArrowLeft, Check, Clock, Info, Wrench, Play, Pause, ChevronDown, Cpu, Zap, Monitor,
  Server, Grid3x3, Boxes, Atom, Gem, Microscope, Target, Hexagon, LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EnvironmentalImpactSection } from '@/components/EnvironmentalImpactSection';
import { QuantumVisualization3D } from '@/components/quantum-visualizations';
import { DEVICES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { DeviceInfo, DeviceSubcategory, QPUParadigm, QPUTechnology } from '@/types';

// Icon mapping for device icons
const DEVICE_ICONS: Record<string, LucideIcon> = {
  Server,
  Grid3x3,
  Boxes,
  Atom,
  Gem,
  Microscope,
  Target,
  Hexagon,
  Zap,
};

interface DeviceSelectionPageProps {
  device: string;
  onDeviceChange: (device: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

// Subcategory display configuration
const SUBCATEGORY_CONFIG: Record<DeviceSubcategory, { label: string; color: string; bgColor: string }> = {
  'cpu': { label: 'CPU', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  'gpu': { label: 'GPU', color: 'text-lime-400', bgColor: 'bg-lime-500/20' },
  'ion-trap': { label: 'Ion-Trap', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  'superconducting': { label: 'Superconducting', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  'neutral-atom': { label: 'Neutral Atom', color: 'text-green-400', bgColor: 'bg-green-500/20' },
};

// Paradigm display configuration
const PARADIGM_CONFIG: Record<QPUParadigm, { label: string; description: string; color: string; bgColor: string }> = {
  'gate-model': {
    label: 'Universal Gate-Model',
    description: 'Discrete quantum gate operations',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20'
  },
  'analog': {
    label: 'Analog',
    description: 'Continuous Hamiltonian evolution',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20'
  },
};

// QPU technology grouping order within each paradigm
const GATE_MODEL_TECH_ORDER: QPUTechnology[] = ['ion-trap', 'superconducting'];
const ANALOG_TECH_ORDER: QPUTechnology[] = ['neutral-atom'];

export function DeviceSelectionPage({ device, onDeviceChange, onPrev, onNext }: DeviceSelectionPageProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedDeviceInfo, setSelectedDeviceInfo] = useState<DeviceInfo | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    simulator: true,
    qpu: true,
  });

  // 3D visualization state
  const [autoRotate, setAutoRotate] = useState(true);

  // Group devices by category, paradigm, and technology
  const groupedDevices = useMemo(() => {
    const simulators = DEVICES.filter(d => d.category === 'simulator');
    const qpuDevices = DEVICES.filter(d => d.category === 'qpu');

    // Group QPU by paradigm first, then by technology
    const gateModelDevices = qpuDevices.filter(d => d.paradigm === 'gate-model');
    const analogDevices = qpuDevices.filter(d => d.paradigm === 'analog');

    // Group gate-model devices by technology
    const gateModelByTech = GATE_MODEL_TECH_ORDER.reduce((acc, tech) => {
      const devices = gateModelDevices.filter(d => d.subcategory === tech);
      if (devices.length > 0) {
        acc[tech] = devices;
      }
      return acc;
    }, {} as Record<string, DeviceInfo[]>);

    // Group analog devices by technology
    const analogByTech = ANALOG_TECH_ORDER.reduce((acc, tech) => {
      const devices = analogDevices.filter(d => d.subcategory === tech);
      if (devices.length > 0) {
        acc[tech] = devices;
      }
      return acc;
    }, {} as Record<string, DeviceInfo[]>);

    return {
      simulators,
      gateModel: { devices: gateModelDevices, byTech: gateModelByTech },
      analog: { devices: analogDevices, byTech: analogByTech },
    };
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleDeviceInfo = (deviceItem: DeviceInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDeviceInfo(deviceItem);
    setShowInfoModal(true);
    // Reset 3D state when opening modal
    setAutoRotate(true);
  };

  const toggleAutoRotate = useCallback(() => {
    setAutoRotate((prev) => !prev);
  }, []);

  const selectedDevice = DEVICES.find((d) => d.id === device);

  // Render a single device card
  const renderDeviceCard = (deviceItem: DeviceInfo) => (
    <div
      key={deviceItem.id}
      className={cn(
        'device-card glass-effect rounded-2xl p-5 border-2 border-transparent relative cursor-pointer transition-all',
        device === deviceItem.id && 'selected'
      )}
      onClick={() => onDeviceChange(deviceItem.id)}
    >
      <button
        className="device-info-btn"
        onClick={(e) => handleDeviceInfo(deviceItem, e)}
      >
        <Info className="w-3 h-3 text-[#14b8a6]" />
      </button>

      {deviceItem.maintenance && (
        <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs flex items-center">
          <Wrench className="w-3 h-3 mr-1" />
          Maintenance
        </div>
      )}

      {/* Subcategory badge */}
      <div className={cn(
        'absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1',
        SUBCATEGORY_CONFIG[deviceItem.subcategory].bgColor,
        SUBCATEGORY_CONFIG[deviceItem.subcategory].color,
        deviceItem.maintenance && 'top-10'
      )}>
        {deviceItem.subcategory === 'cpu' && <Cpu className="w-3 h-3" />}
        {deviceItem.subcategory === 'gpu' && <Monitor className="w-3 h-3" />}
        {SUBCATEGORY_CONFIG[deviceItem.subcategory].label}
      </div>

      <div className={cn('flex items-center mb-3', 'mt-6')}>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mr-3', deviceItem.iconBg)}>
          {(() => {
            const IconComponent = DEVICE_ICONS[deviceItem.icon];
            return IconComponent ? <IconComponent className="w-6 h-6" /> : null;
          })()}
        </div>
        <div>
          <h3 className="text-base font-bold">{deviceItem.shortName}</h3>
          <span className="text-xs text-gray-400">{deviceItem.type}</span>
        </div>
      </div>

      <ul className="text-gray-300 space-y-1.5 text-xs">
        {deviceItem.features.slice(0, 3).map((feature, index) => (
          <li key={index} className="flex items-center">
            <Check className="w-3 h-3 text-green-400 mr-2 flex-shrink-0" />
            {feature}
          </li>
        ))}
        <li className="flex items-center">
          <Clock className="w-3 h-3 text-blue-400 mr-2 flex-shrink-0" />
          Runtime: {deviceItem.runtime}
        </li>
      </ul>
    </div>
  );

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Invest in a Quantum Device
        </h2>
        <p className="text-xl text-gray-300">
          Suppose you have <span className="text-[#14b8a6] font-bold">$1,000,000 USD</span> to invest
          in one quantum device.
        </p>
        <p className="text-gray-400 mt-2">
          Explore each device&apos;s description and choose the one you believe holds the most promise.
        </p>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-4 mb-8">
        {/* Simulators Section */}
        <div className="glass-effect rounded-2xl overflow-hidden">
          <button
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            onClick={() => toggleSection('simulator')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-orange-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">Classical Simulators</h3>
                <p className="text-sm text-gray-400">CPU & GPU-accelerated quantum simulation</p>
              </div>
              <span className="ml-3 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium">
                {groupedDevices.simulators.length} devices
              </span>
            </div>
            <ChevronDown className={cn(
              'w-5 h-5 text-gray-400 transition-transform duration-300',
              expandedSections.simulator && 'rotate-180'
            )} />
          </button>

          <div className={cn(
            'transition-all duration-300',
            expandedSections.simulator ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          )}>
            <div className="px-6 pt-2 pb-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedDevices.simulators.map(renderDeviceCard)}
              </div>
            </div>
          </div>
        </div>

        {/* QPU Section */}
        <div className="glass-effect rounded-2xl overflow-hidden">
          <button
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            onClick={() => toggleSection('qpu')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">Quantum Processing Unit (QPU)</h3>
                <p className="text-sm text-gray-400">Real quantum hardware</p>
              </div>
              <span className="ml-3 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                {groupedDevices.gateModel.devices.length + groupedDevices.analog.devices.length} devices
              </span>
            </div>
            <ChevronDown className={cn(
              'w-5 h-5 text-gray-400 transition-transform duration-300',
              expandedSections.qpu && 'rotate-180'
            )} />
          </button>

          <div className={cn(
            'transition-all duration-300',
            expandedSections.qpu ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          )}>
            <div className="px-6 pt-2 pb-6 space-y-6">
              {/* Universal Gate-Model Section */}
              {groupedDevices.gateModel.devices.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-700/50">
                    <div className={cn('px-3 py-1 rounded-lg', PARADIGM_CONFIG['gate-model'].bgColor)}>
                      <span className={cn('text-sm font-semibold', PARADIGM_CONFIG['gate-model'].color)}>
                        {PARADIGM_CONFIG['gate-model'].label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {PARADIGM_CONFIG['gate-model'].description}
                    </span>
                  </div>

                  {GATE_MODEL_TECH_ORDER.map(tech => {
                    const devices = groupedDevices.gateModel.byTech[tech];
                    if (!devices || devices.length === 0) return null;

                    const config = SUBCATEGORY_CONFIG[tech];
                    return (
                      <div key={tech} className="ml-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={cn('w-1 h-4 rounded-full', config.bgColor.replace('/20', ''))} />
                          <h4 className={cn('text-sm font-medium', config.color)}>
                            {config.label}
                          </h4>
                          <span className="text-xs text-gray-500">
                            ({devices.length} device{devices.length > 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {devices.map(renderDeviceCard)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Analog Section */}
              {groupedDevices.analog.devices.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-700/50">
                    <div className={cn('px-3 py-1 rounded-lg', PARADIGM_CONFIG['analog'].bgColor)}>
                      <span className={cn('text-sm font-semibold', PARADIGM_CONFIG['analog'].color)}>
                        {PARADIGM_CONFIG['analog'].label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {PARADIGM_CONFIG['analog'].description}
                    </span>
                  </div>

                  {ANALOG_TECH_ORDER.map(tech => {
                    const devices = groupedDevices.analog.byTech[tech];
                    if (!devices || devices.length === 0) return null;

                    const config = SUBCATEGORY_CONFIG[tech];
                    return (
                      <div key={tech} className="ml-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={cn('w-1 h-4 rounded-full', config.bgColor.replace('/20', ''))} />
                          <h4 className={cn('text-sm font-medium', config.color)}>
                            {config.label}
                          </h4>
                          <span className="text-xs text-gray-500">
                            ({devices.length} device{devices.length > 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {devices.map(renderDeviceCard)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Environmental Impact Section */}
        <EnvironmentalImpactSection selectedDevice={device} />
      </div>

      {selectedDevice && (
        <div className="glass-effect rounded-xl p-4 mb-6 border-l-4 border-[#14b8a6]">
          <p className="text-gray-300 flex items-center">
            <Info className="w-4 h-4 text-[#14b8a6] mr-2" />
            You selected: <span className="font-bold text-[#14b8a6] ml-1">{selectedDevice.name}</span>
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-6">
        <button onClick={onPrev} className="flex items-center space-x-1.5 text-sm text-gray-400 hover:text-white transition-colors py-2 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <Button onClick={onNext} disabled={!device} className="w-full md:w-auto">
          <span>Confirm Investment</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Device Info Modal */}
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        className="max-w-[650px]"
      >
        {selectedDeviceInfo && (
          <>
            <div className="flex items-center mb-4">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mr-3', selectedDeviceInfo.iconBg)}>
                {(() => {
                  const IconComponent = DEVICE_ICONS[selectedDeviceInfo.icon];
                  return IconComponent ? <IconComponent className="w-6 h-6" /> : null;
                })()}
              </div>
              <div>
                <h3 className="text-xl font-bold">{selectedDeviceInfo.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-400">{selectedDeviceInfo.type}</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-medium',
                    SUBCATEGORY_CONFIG[selectedDeviceInfo.subcategory].bgColor,
                    SUBCATEGORY_CONFIG[selectedDeviceInfo.subcategory].color
                  )}>
                    {SUBCATEGORY_CONFIG[selectedDeviceInfo.subcategory].label}
                  </span>
                </div>
              </div>
            </div>

            {/* 3D Quantum Visualization - Enhanced */}
            <QuantumVisualization3D
              type={selectedDeviceInfo.visualization}
              autoRotate={autoRotate}
              className="mb-5"
            />

            {/* Control Panel */}
            <div className="flex justify-center gap-2 mb-5">
              <button
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  autoRotate
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                )}
                onClick={toggleAutoRotate}
              >
                {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
              </button>
            </div>

            <div
              className="text-gray-300 text-sm space-y-4 max-h-60 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: selectedDeviceInfo.content }}
            />

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowInfoModal(false)} className="px-6 py-2 text-sm">
                Got it
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
