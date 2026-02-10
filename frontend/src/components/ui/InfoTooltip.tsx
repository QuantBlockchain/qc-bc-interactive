'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  term: string;
  definition: string;
  details?: string;
  source?: string;
  className?: string;
  iconSize?: 'sm' | 'md';
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowLeftPx: number;
}

export function InfoTooltip({
  term,
  definition,
  details,
  source,
  className,
  iconSize = 'sm',
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Ensure we're on the client side for portal and detect mobile
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate tooltip position (desktop only)
  const updatePosition = useCallback(() => {
    if (!buttonRef.current || isMobile) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const tooltipWidth = 288; // w-72 = 18rem = 288px
    const padding = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Button center position
    const buttonCenterX = rect.left + rect.width / 2;

    // Calculate tooltip left position (top-left corner, no transform)
    let tooltipLeft = buttonCenterX - tooltipWidth / 2;

    // Check if tooltip would overflow on the right
    if (tooltipLeft + tooltipWidth > viewportWidth - padding) {
      tooltipLeft = viewportWidth - padding - tooltipWidth;
    }

    // Check if tooltip would overflow on the left
    if (tooltipLeft < padding) {
      tooltipLeft = padding;
    }

    // Arrow should point to button center, relative to tooltip left
    const arrowLeftPx = buttonCenterX - tooltipLeft;

    // Calculate vertical position - prefer below, but go above if not enough space
    let top = rect.bottom + 8;

    // Estimate tooltip height (rough estimate)
    const estimatedTooltipHeight = 200;

    // If tooltip would go below viewport, position it above the button
    if (top + estimatedTooltipHeight > viewportHeight - padding) {
      top = rect.top - estimatedTooltipHeight - 8;
      if (top < padding) {
        // If still doesn't fit, just position below and let it scroll
        top = rect.bottom + 8;
      }
    }

    setPosition({ top, left: tooltipLeft, arrowLeftPx });
  }, [isMobile]);

  // Update position when opening, close on scroll (desktop only)
  useEffect(() => {
    if (!isOpen || isMobile) return;

    // Initial position
    updatePosition();

    // Close tooltip on scroll (standard UX pattern)
    const handleScroll = () => {
      setIsOpen(false);
    };

    // Update position on resize
    const handleResize = () => {
      updatePosition();
    };

    // Listen to scroll on window and all parent elements (capture phase)
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, isMobile, updatePosition]);

  // Close tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when mobile bottom sheet is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  // Desktop tooltip content
  const desktopTooltipContent = isOpen && !isMobile && position && (
    <>
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          'fixed z-[9999] w-72 p-4 rounded-lg shadow-xl',
          'bg-gray-900/95 backdrop-blur-sm border border-white/10',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}
        style={{
          top: position.top,
          left: position.left,
        }}
        role="tooltip"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrow */}
        <div
          className="absolute -top-2"
          style={{ left: position.arrowLeftPx, transform: 'translateX(-50%)' }}
        >
          <div className="w-4 h-4 rotate-45 bg-gray-900/95 border-l border-t border-white/10" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-white text-sm pr-2">{term}</h4>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Definition */}
        <p className="text-sm text-gray-300 leading-relaxed">{definition}</p>

        {/* Additional details */}
        {details && (
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{details}</p>
        )}

        {/* Source */}
        {source && (
          <p className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-white/10">
            Source: {source}
          </p>
        )}
      </div>
    </>
  );

  // Mobile bottom sheet content
  const mobileBottomSheetContent = isOpen && isMobile && (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(false);
        }}
      />

      {/* Bottom Sheet */}
      <div
        ref={tooltipRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[9999]',
          'bg-[#1a1f2e] border-t border-white/10 rounded-t-xl',
          'slide-in-from-bottom',
          'max-h-[60vh] overflow-y-auto'
        )}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-8 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Content */}
        <div className="px-4 pb-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-white text-sm">{term}</h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Definition */}
          <p className="text-sm text-gray-300 leading-relaxed">{definition}</p>

          {/* Additional details */}
          {details && (
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{details}</p>
          )}

          {/* Source */}
          {source && (
            <p className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-white/10">
              Source: {source}
            </p>
          )}
        </div>
      </div>
    </>
  );

  return (
    <span className={cn('relative inline-flex items-center', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-colors',
          'hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50',
          iconSize === 'sm' ? 'w-4 h-4 ml-1' : 'w-5 h-5 ml-1.5'
        )}
        aria-label={`Learn more about ${term}`}
      >
        <Info
          className={cn(
            'text-gray-400 hover:text-blue-400 transition-colors cursor-pointer',
            iconSize === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
          )}
        />
      </button>

      {/* Render tooltip/bottom sheet in portal */}
      {mounted && createPortal(
        <>
          {desktopTooltipContent}
          {mobileBottomSheetContent}
        </>,
        document.body
      )}
    </span>
  );
}

// Pre-defined term definitions based on the LCA research paper
export const TERM_DEFINITIONS = {
  lca: {
    term: 'Life Cycle Assessment (LCA)',
    definition:
      'A methodology to evaluate the environmental impacts of a product or system throughout its entire life cycle, from raw material extraction to end-of-life disposal.',
    details:
      'LCA considers all stages: production of materials, manufacturing, transportation, use phase energy consumption, and disposal or recycling.',
    source: 'ISO 14040/14044 Standards',
  },
  climate_change: {
    term: 'Climate Change (tCO2eq)',
    definition:
      'Measures the global warming potential in tonnes of CO2 equivalent. This indicator aggregates all greenhouse gas emissions weighted by their warming effect relative to CO2.',
    details:
      'For example, methane has ~28x the warming potential of CO2 over 100 years. The total is expressed in tCO2eq for comparison.',
    source: 'IPCC AR5 GWP100',
  },
  ecosystems: {
    term: 'Ecosystems Impact (PDF.m².y)',
    definition:
      'Potentially Disappeared Fraction of species per square meter per year. Measures biodiversity loss risk from environmental stressors.',
    details:
      'This indicator captures impacts on terrestrial and aquatic ecosystems, including effects from pollution, land use change, and resource extraction.',
    source: 'ReCiPe 2016 Endpoint Method',
  },
  human_health: {
    term: 'Human Health (DALY)',
    definition:
      'Disability-Adjusted Life Years. Measures the loss of healthy life years due to disease, disability, or premature death caused by environmental impacts.',
    details:
      'One DALY = one lost year of healthy life. Includes impacts from air pollution, toxic substances, climate change effects, and ozone depletion.',
    source: 'WHO Global Burden of Disease',
  },
  production_phase: {
    term: 'Production Phase',
    definition:
      'The manufacturing stage of quantum hardware, including extraction of raw materials, component fabrication, and system assembly.',
    details:
      'For quantum computers, this includes production of cryogenic systems, laser sources, vacuum chambers, control electronics, and specialized materials like superconducting circuits.',
    source: 'Cordier et al., 2024',
  },
  delivery_phase: {
    term: 'Delivery Phase',
    definition:
      'Transportation of quantum hardware from manufacturing facilities to deployment sites, including packaging and logistics.',
    details:
      'Includes all transportation modes (air, sea, road) and associated energy consumption and emissions.',
    source: 'Cordier et al., 2024',
  },
  use_phase: {
    term: 'Use Phase',
    definition:
      'The operational stage when the quantum computer is running computations. Includes electricity consumption for the QPU, cooling systems, and control electronics.',
    details:
      'For superconducting qubits, cryogenic cooling to ~15mK dominates power consumption. The carbon intensity of the local electricity grid significantly affects this impact.',
    source: 'Cordier et al., 2024',
  },
  end_of_life: {
    term: 'End-of-Life Phase',
    definition:
      'Disposal, recycling, or decommissioning of quantum hardware at the end of its useful life.',
    details:
      'Includes electronic waste processing, recovery of valuable materials, and proper disposal of specialized components.',
    source: 'Cordier et al., 2024',
  },
  qec: {
    term: 'Quantum Error Correction (QEC)',
    definition:
      'Techniques to protect quantum information from errors due to decoherence and noise. QEC encodes logical qubits into multiple physical qubits.',
    details:
      'Different QEC codes have different overhead factors - the ratio of physical qubits needed per logical qubit. This significantly impacts resource requirements.',
    source: 'Cordier et al., 2024',
  },
  surface_code: {
    term: 'Surface Code',
    definition:
      'A leading quantum error correction code using a 2D array of physical qubits. Requires approximately 1000-10000 physical qubits per logical qubit.',
    details:
      'Well-suited for superconducting and trapped-ion systems due to its nearest-neighbor connectivity requirements. High overhead but very fault-tolerant.',
    source: 'Fowler et al., 2012',
  },
  bosonic: {
    term: 'Bosonic QEC',
    definition:
      'Quantum error correction using bosonic modes (harmonic oscillators). Achieves error correction with fewer physical resources than surface codes.',
    details:
      'Used by neutral-atom systems with optical cavities. The QEC overhead factor is typically 10-100x lower than surface codes, significantly reducing environmental impact.',
    source: 'Cordier et al., 2024',
  },
  carbon_intensity: {
    term: 'Carbon Intensity',
    definition:
      'The amount of CO2 equivalent emissions per unit of electricity generated (kg CO2eq/kWh). Varies greatly by region and energy mix.',
    details:
      'Quebec (hydro): 0.0017 kg/kWh | Belgium (EU): 0.167 kg/kWh | USA: 0.386 kg/kWh | Global: 0.475 kg/kWh. Location choice can reduce use-phase impact by 100x+.',
    source: 'IEA Electricity Maps 2023',
  },
  cryogenic: {
    term: 'Cryogenic Cooling',
    definition:
      'Ultra-low temperature cooling required by superconducting qubits. Dilution refrigerators maintain temperatures around 10-20 millikelvin.',
    details:
      'Consumes 10-25 kW of electrical power continuously. The cooling requirement is a major contributor to the use-phase environmental impact of superconducting systems.',
    source: 'Cordier et al., 2024',
  },
  superconducting: {
    term: 'Superconducting Qubits',
    definition:
      'Quantum bits made from superconducting circuits operating near absolute zero. Used by IBM, Google, Rigetti, and IQM.',
    details:
      'Advantages: fast gate operations (~20ns), good scalability. Disadvantages: requires cryogenic cooling, shorter coherence times. Typical fidelity: 99.5%+.',
    source: 'Industry technical specifications',
  },
  trapped_ion: {
    term: 'Trapped-Ion Qubits',
    definition:
      'Quantum bits using individual ions (charged atoms) suspended in electromagnetic traps and manipulated with lasers.',
    details:
      'Used by IonQ, Quantinuum, and AQT. Advantages: longest coherence times, high gate fidelity (99.9%+), all-to-all connectivity. Disadvantages: slower gate speeds.',
    source: 'Industry technical specifications',
  },
  neutral_atom: {
    term: 'Neutral-Atom Qubits',
    definition:
      'Quantum bits using neutral atoms held in optical tweezer arrays. Atoms interact via Rydberg states for entanglement.',
    details:
      'Used by QuEra, Pasqal, and Atom Computing. Advantages: large qubit counts (1000+), no cryogenic cooling needed, efficient bosonic QEC. Emerging technology with high potential.',
    source: 'Industry technical specifications',
  },
  overhead_factor: {
    term: 'QEC Overhead Factor',
    definition:
      'The number of physical qubits required to encode one logical (error-corrected) qubit. A key metric for fault-tolerant quantum computing.',
    details:
      'Surface code: ~1000-10000x overhead | Bosonic codes: ~10-100x overhead. Lower overhead means fewer resources and lower environmental impact for the same computation.',
    source: 'Cordier et al., 2024',
  },
  // Quantum Key Generation Terms
  quantum_id: {
    term: 'Quantum ID',
    definition:
      'A unique identifier generated from quantum random number generation (QRNG). Created by measuring qubits in superposition states.',
    details:
      'Unlike classical random numbers which are deterministic (pseudo-random), quantum random numbers are fundamentally unpredictable due to quantum mechanics.',
    source: 'Quantum Computing Fundamentals',
  },
  quantum_resistant: {
    term: 'Quantum-Resistant Cryptography',
    definition:
      'Cryptographic algorithms designed to be secure against attacks from both classical computers and future quantum computers.',
    details:
      'Also called Post-Quantum Cryptography (PQC). NIST has standardized algorithms like CRYSTALS-Kyber and CRYSTALS-Dilithium for this purpose.',
    source: 'NIST PQC Standardization',
  },
  lattice_based: {
    term: 'Lattice-Based Cryptography',
    definition:
      'A family of cryptographic constructions based on the hardness of lattice problems. Considered quantum-resistant because no efficient quantum algorithm is known to solve these problems.',
    details:
      'Examples include Learning With Errors (LWE), Ring-LWE, and Module-LWE. These form the basis of NIST-standardized post-quantum algorithms.',
    source: 'NIST PQC Standards',
  },
  public_key: {
    term: 'Public Key',
    definition:
      'The publicly shareable part of an asymmetric key pair. Used by others to verify your digital signatures or encrypt messages to you.',
    details:
      'In post-quantum cryptography, public keys are typically larger than classical RSA/ECC keys due to the mathematical structures involved.',
    source: 'Public Key Infrastructure',
  },
  digital_signature: {
    term: 'Digital Signature',
    definition:
      'A cryptographic mechanism that proves the authenticity and integrity of a message. Only the private key holder can create valid signatures.',
    details:
      'Digital signatures provide: 1) Authentication (proves who signed), 2) Integrity (detects tampering), 3) Non-repudiation (signer cannot deny signing).',
    source: 'Cryptography Standards',
  },
  quantum_superposition: {
    term: 'Quantum Superposition',
    definition:
      'A fundamental quantum mechanical phenomenon where a qubit exists in multiple states simultaneously until measured.',
    details:
      'When measured, the superposition "collapses" to a definite state (0 or 1) with probabilities determined by the quantum state amplitudes. This is the source of true quantum randomness.',
    source: 'Quantum Mechanics',
  },
  lwe_algorithm: {
    term: 'LWE (Learning With Errors)',
    definition:
      'A lattice-based cryptographic problem that forms the foundation of many quantum-resistant encryption schemes.',
    details:
      'The problem involves distinguishing between random linear equations and equations with small errors added. Its hardness is based on the difficulty of certain lattice problems.',
    source: 'Regev, 2005',
  },
  qrng: {
    term: 'Quantum Random Number Generator',
    definition:
      'A device or algorithm that generates truly random numbers using quantum mechanical phenomena like superposition and measurement.',
    details:
      'Unlike classical PRNGs which are deterministic, QRNGs produce fundamentally unpredictable outputs certified by the laws of quantum physics.',
    source: 'Quantum Information Science',
  },
  post_quantum: {
    term: 'Post-Quantum Security',
    definition:
      'Security that remains effective even against adversaries with access to large-scale quantum computers capable of running Shor\'s algorithm.',
    details:
      'Classical cryptography like RSA and ECC can be broken by quantum computers. Post-quantum algorithms are designed to resist both classical and quantum attacks.',
    source: 'NIST PQC Project',
  },
} as const;

export default InfoTooltip;
