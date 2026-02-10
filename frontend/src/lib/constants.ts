import { DeviceInfo, BlockchainTechOption, NobelLaureate, WordCloudWord } from '@/types';

export const DEVICES: DeviceInfo[] = [
  // === SIMULATORS ===
  {
    id: 'aws_sv1',
    name: 'Amazon Braket SV1',
    shortName: 'AWS SV1',
    type: 'State Vector Simulator',
    category: 'simulator',
    subcategory: 'cpu',
    icon: 'Server',
    iconBg: 'bg-orange-600/20',
    features: ['Up to 34 qubits', 'Noise-free simulation', 'Full state visibility'],
    runtime: '~seconds to minutes',
    color: 'orange',
    visualization: 'cloud',
    content: `
<p><strong>Technology Overview:</strong></p>
<p>Amazon Braket SV1 is a fully managed, high-performance <strong>State Vector quantum circuit simulator</strong> that runs on AWS's powerful cloud infrastructure. Unlike physical quantum computers, SV1 uses classical supercomputing resources to mathematically simulate quantum behavior with perfect precision.</p>

<p><strong>How State Vector Simulation Works:</strong></p>
<p>The simulator maintains the complete quantum state vector in memory, tracking all 2<sup>n</sup> probability amplitudes for n qubits simultaneously. This enables:</p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li>Perfect visibility into quantum superposition states</li>
<li>Exact probability amplitude calculations</li>
<li>No decoherence or gate errors</li>
<li>Deterministic, reproducible results</li>
</ul>

<p><strong>Technical Specifications:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Maximum Qubits:</strong> 34 (circuit depth dependent)</li>
<li><strong>Gate Set:</strong> Universal gate support including H, CNOT, T, Rx, Ry, Rz</li>
<li><strong>Regions:</strong> us-east-1, us-west-1, us-west-2, eu-west-2</li>
<li><strong>Pricing:</strong> $0.00075 per task + $0.075 per minute</li>
</ul>

<p><strong>Ideal Use Cases:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li>Algorithm development and debugging</li>
<li>Educational exploration of quantum concepts</li>
<li>Benchmarking before QPU deployment</li>
<li>Variational algorithms (VQE, QAOA) prototyping</li>
</ul>

<p class="text-orange-400 mt-3 font-semibold">✨ Perfect for beginners — experience quantum computing without hardware noise!</p>

<p class="mt-3 text-xs"><strong>Learn More:</strong> <a href="https://docs.aws.amazon.com/braket/latest/developerguide/braket-devices.html" target="_blank" class="text-blue-400 hover:underline">AWS Braket Devices</a> | <a href="https://aws.amazon.com/braket/quantum-computers/" target="_blank" class="text-blue-400 hover:underline">AWS Braket Overview</a></p>`,
  },
  {
    id: 'aws_dm1',
    name: 'Amazon Braket DM1',
    shortName: 'AWS DM1',
    type: 'Density Matrix Simulator',
    category: 'simulator',
    subcategory: 'cpu',
    icon: 'Grid3x3',
    iconBg: 'bg-amber-600/20',
    features: ['Up to 17 qubits', 'Noise modeling', 'Mixed state simulation'],
    runtime: '~seconds to minutes',
    color: 'orange',
    visualization: 'cloud-dm',
    content: `
<p><strong>Technology Overview:</strong></p>
<p>Amazon Braket DM1 is a <strong>Density Matrix simulator</strong> that can model quantum circuits with realistic noise. Unlike state vector simulators, DM1 tracks the full density matrix, enabling simulation of decoherence and gate errors.</p>

<p><strong>How Density Matrix Simulation Works:</strong></p>
<p>The simulator maintains a density matrix ρ (rho) that represents:</p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li>Mixed quantum states (statistical ensembles)</li>
<li>Decoherence effects from environment interaction</li>
<li>Noise channels (depolarizing, dephasing, amplitude damping)</li>
<li>Realistic error rates matching real QPUs</li>
</ul>

<p><strong>Technical Specifications:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Maximum Qubits:</strong> 17 (density matrix scales as 4<sup>n</sup>)</li>
<li><strong>Noise Models:</strong> Depolarizing, dephasing, bit-flip, custom</li>
<li><strong>Gate Set:</strong> Universal gate support</li>
<li><strong>Pricing:</strong> $0.00075 per task + $0.075 per minute</li>
</ul>

<p><strong>Ideal Use Cases:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li>Testing algorithm robustness to noise</li>
<li>Error mitigation technique development</li>
<li>Comparing ideal vs realistic performance</li>
<li>Quantum error correction research</li>
</ul>

<p class="text-amber-400 mt-3 font-semibold">Essential for understanding how noise affects your quantum algorithms!</p>

<p class="mt-3 text-xs"><strong>Learn More:</strong> <a href="https://docs.aws.amazon.com/braket/latest/developerguide/braket-devices.html" target="_blank" class="text-blue-400 hover:underline">AWS Braket Devices</a></p>`,
  },
  {
    id: 'aws_tn1',
    name: 'Amazon Braket TN1',
    shortName: 'AWS TN1',
    type: 'Tensor Network Simulator',
    category: 'simulator',
    subcategory: 'gpu',
    icon: 'Boxes',
    iconBg: 'bg-lime-600/20',
    features: ['Up to 50 qubits', 'GPU-accelerated', 'Structured circuits'],
    runtime: '~minutes',
    color: 'green',
    visualization: 'cloud-gpu',
    content: `
<p><strong>Technology Overview:</strong></p>
<p>Amazon Braket TN1 is a <strong>Tensor Network simulator</strong> powered by NVIDIA GPUs. It uses advanced tensor contraction algorithms to simulate certain quantum circuits with up to 50 qubits — far beyond what state vector simulators can handle.</p>

<p><strong>How Tensor Network Simulation Works:</strong></p>
<p>Instead of storing the full quantum state, TN1 represents the circuit as a network of tensors:</p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Tensor Decomposition:</strong> Quantum gates become tensor operations</li>
<li><strong>GPU Acceleration:</strong> NVIDIA cuQuantum SDK for fast contraction</li>
<li><strong>Memory Efficient:</strong> Only computes needed amplitudes</li>
<li><strong>Structured Circuits:</strong> Best for circuits with limited entanglement</li>
</ul>

<p><strong>Technical Specifications:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Maximum Qubits:</strong> 50 (circuit structure dependent)</li>
<li><strong>Backend:</strong> NVIDIA A100/V100 GPUs</li>
<li><strong>SDK:</strong> Powered by NVIDIA cuQuantum</li>
<li><strong>Pricing:</strong> $0.00075 per task + $0.275 per minute</li>
</ul>

<p><strong>Ideal Use Cases:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li>Large-scale variational algorithms (QAOA, VQE)</li>
<li>Circuits with local/nearest-neighbor gates</li>
<li>Quantum machine learning circuits</li>
<li>Benchmarking against larger qubit counts</li>
</ul>

<p class="text-lime-400 mt-3 font-semibold">🚀 GPU-powered simulation for larger quantum circuits!</p>

<p class="mt-3 text-xs"><strong>Learn More:</strong> <a href="https://docs.aws.amazon.com/braket/latest/developerguide/braket-devices.html" target="_blank" class="text-blue-400 hover:underline">AWS Braket Devices</a> | <a href="https://developer.nvidia.com/cuquantum-sdk" target="_blank" class="text-blue-400 hover:underline">NVIDIA cuQuantum</a></p>`,
  },
  // === QPU: UNIVERSAL GATE-MODEL / ION-TRAP ===
  {
    id: 'ionq_aria',
    name: 'IonQ Aria',
    shortName: 'IonQ Aria',
    type: 'Trapped Ion QPU',
    category: 'qpu',
    subcategory: 'ion-trap',
    paradigm: 'gate-model',
    vendor: 'IonQ',
    icon: 'Atom',
    iconBg: 'bg-purple-600/20',
    features: ['25 algorithmic qubits', 'All-to-all connectivity', '#AQ 25'],
    runtime: '~10+ min',
    color: 'purple',
    visualization: 'ion',
    content: `
<p><strong>Technology Overview:</strong></p>
<p>IonQ Aria represents the cutting edge of <strong>trapped ion quantum computing</strong>, using individual ytterbium-171 (<sup>171</sup>Yb<sup>+</sup>) atoms as qubits. These atoms are suspended in an ultra-high vacuum chamber using precisely tuned electromagnetic fields, creating one of the most stable qubit platforms available.</p>

<p><strong>How Trapped Ion Computing Works:</strong></p>
<p>The quantum processor operates through a sophisticated process:</p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Ion Trapping:</strong> Electromagnetic fields confine ions in a linear chain</li>
<li><strong>Laser Cooling:</strong> Atoms cooled to near absolute zero (~μK)</li>
<li><strong>State Manipulation:</strong> Precisely timed laser pulses perform quantum gates</li>
<li><strong>Entanglement:</strong> Mølmer-Sørensen gates create ion-ion entanglement</li>
<li><strong>Readout:</strong> Fluorescence detection measures qubit states</li>
</ul>

<p><strong>Technical Specifications:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Algorithmic Qubits (#AQ):</strong> 25</li>
<li><strong>Connectivity:</strong> All-to-all (any qubit pairs directly)</li>
<li><strong>1Q Gate Fidelity:</strong> >99.5%</li>
<li><strong>2Q Gate Fidelity:</strong> >97%</li>
<li><strong>Native Gates:</strong> GPI, GPI2, MS (Mølmer-Sørensen)</li>
<li><strong>Region:</strong> us-east-1</li>
</ul>

<p><strong>Key Advantages:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li>No SWAP operations needed — direct qubit interaction</li>
<li>Identical qubits — atoms are nature's perfect copies</li>
<li>Long coherence times (seconds vs microseconds)</li>
<li>High gate fidelity for complex algorithms</li>
</ul>

<p class="text-purple-400 mt-3 font-semibold">Trapped ions are leading candidates for fault-tolerant quantum computing!</p>

<p class="mt-3 text-xs"><strong>Learn More:</strong> <a href="https://docs.aws.amazon.com/braket/latest/developerguide/braket-submit-tasks.html#braket-qpu-partner-ionq" target="_blank" class="text-blue-400 hover:underline">IonQ on AWS Braket</a> | <a href="https://ionq.com/technology" target="_blank" class="text-blue-400 hover:underline">IonQ Technology</a></p>`,
  },
  {
    id: 'ionq_forte',
    name: 'IonQ Forte',
    shortName: 'IonQ Forte',
    type: 'Trapped Ion QPU',
    category: 'qpu',
    subcategory: 'ion-trap',
    paradigm: 'gate-model',
    vendor: 'IonQ',
    icon: 'Zap',
    iconBg: 'bg-violet-600/20',
    features: ['36 algorithmic qubits', 'All-to-all connectivity', '#AQ 36'],
    runtime: '~10+ min',
    color: 'purple',
    visualization: 'ion',
    content: `
<p><strong>Technology Overview:</strong></p>
<p>IonQ Forte is IonQ's most powerful commercially available quantum computer, featuring <strong>36 algorithmic qubits (#AQ)</strong> — a 44% improvement over Aria. It uses the same proven trapped ion technology with ytterbium-171 atoms but with enhanced performance and fidelity.</p>

<p><strong>Key Improvements Over Aria:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>#AQ 36:</strong> Higher algorithmic qubit count for deeper circuits</li>
<li><strong>Improved Fidelity:</strong> Enhanced gate operations</li>
<li><strong>Better Coherence:</strong> Longer quantum state preservation</li>
<li><strong>Enterprise Ready:</strong> Production-grade reliability</li>
</ul>

<p><strong>Technical Specifications:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Algorithmic Qubits (#AQ):</strong> 36</li>
<li><strong>Technology:</strong> Trapped Yb+ ions</li>
<li><strong>Connectivity:</strong> All-to-all (any qubit pair)</li>
<li><strong>Native Gates:</strong> GPI, GPI2, MS</li>
<li><strong>Region:</strong> us-east-1</li>
</ul>

<p class="text-violet-400 mt-3 font-semibold">⚡ IonQ's flagship QPU — the highest #AQ commercially available!</p>

<p class="mt-3 text-xs"><strong>Learn More:</strong> <a href="https://docs.aws.amazon.com/braket/latest/developerguide/braket-submit-tasks.html#braket-qpu-partner-ionq" target="_blank" class="text-blue-400 hover:underline">IonQ on AWS Braket</a> | <a href="https://ionq.com/quantum-systems/forte" target="_blank" class="text-blue-400 hover:underline">IonQ Forte</a></p>`,
  },
  {
    id: 'aqt_ibex_q1',
    name: 'AQT IBEX Q1',
    shortName: 'AQT IBEX Q1',
    type: 'Trapped Ion QPU',
    category: 'qpu',
    subcategory: 'ion-trap',
    paradigm: 'gate-model',
    vendor: 'AQT',
    icon: 'Atom',
    iconBg: 'bg-indigo-600/20',
    features: ['12 qubits', 'High fidelity gates', 'European technology'],
    runtime: '~10+ min',
    color: 'purple',
    visualization: 'ion-aqt',
    content: `
<p><strong>Technology Overview:</strong></p>
<p>AQT IBEX Q1 is a <strong>trapped ion quantum computer</strong> developed by Alpine Quantum Technologies (AQT) in Austria. It uses calcium-40 (<sup>40</sup>Ca<sup>+</sup>) ions confined in a linear Paul trap, manipulated by precisely controlled laser pulses.</p>

<p><strong>How AQT's Trapped Ion System Works:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Ion Species:</strong> Calcium-40 ions (optical qubits)</li>
<li><strong>Trap Type:</strong> Linear Paul trap with RF confinement</li>
<li><strong>Laser Control:</strong> Individual addressing of each ion</li>
<li><strong>Entanglement:</strong> Mølmer-Sørensen gates via motional modes</li>
<li><strong>Readout:</strong> State-dependent fluorescence detection</li>
</ul>

<p><strong>Technical Specifications:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Qubits:</strong> 12 trapped calcium ions</li>
<li><strong>Connectivity:</strong> All-to-all</li>
<li><strong>1Q Gate Fidelity:</strong> >99.5%</li>
<li><strong>2Q Gate Fidelity:</strong> >98%</li>
<li><strong>Native Gates:</strong> R, RXX (Mølmer-Sørensen)</li>
<li><strong>Region:</strong> eu-central-1 (Frankfurt)</li>
</ul>

<p><strong>Key Advantages:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li>High-fidelity quantum operations</li>
<li>Fully connected qubit topology</li>
<li>European quantum technology leader</li>
<li>Compact, rack-mounted system design</li>
</ul>

<p class="text-indigo-400 mt-3 font-semibold">🇪🇺 European trapped ion excellence from the Alps!</p>

<p class="mt-3 text-xs"><strong>Learn More:</strong> <a href="https://docs.aws.amazon.com/braket/latest/developerguide/braket-submit-tasks.html" target="_blank" class="text-blue-400 hover:underline">AWS Braket</a> | <a href="https://www.aqt.eu/qc-systems/" target="_blank" class="text-blue-400 hover:underline">AQT Systems</a></p>`,
  },
  // === QPU: UNIVERSAL GATE-MODEL / SUPERCONDUCTING ===
  {
    id: 'iqm_garnet',
    name: 'IQM Garnet',
    shortName: 'IQM Garnet',
    type: 'Superconducting QPU',
    category: 'qpu',
    subcategory: 'superconducting',
    paradigm: 'gate-model',
    vendor: 'IQM',
    icon: 'Gem',
    iconBg: 'bg-cyan-600/20',
    features: ['20 transmon qubits', 'Square lattice topology', 'European technology'],
    runtime: '~10+ min',
    color: 'cyan',
    visualization: 'superconducting',
    content: `
<p><strong>Technology Overview:</strong></p>
<p>IQM Garnet is a <strong>superconducting quantum processor</strong> developed by IQM Quantum Computers in Finland. It uses transmon qubits — artificial atoms created from superconducting circuits that exhibit quantum behavior when cooled to temperatures colder than outer space.</p>

<p><strong>How Superconducting Qubits Work:</strong></p>
<p>The quantum processor operates in an extreme environment:</p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Dilution Refrigerator:</strong> Cools chip to ~15 millikelvin (0.015K)</li>
<li><strong>Josephson Junctions:</strong> Create non-linear quantum oscillators</li>
<li><strong>Microwave Control:</strong> Nanosecond pulses manipulate qubit states</li>
<li><strong>Flux Tuning:</strong> Magnetic fields adjust qubit frequencies</li>
<li><strong>Dispersive Readout:</strong> Resonators measure qubit states</li>
</ul>

<p><strong>Technical Specifications:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Qubits:</strong> 20 superconducting transmon qubits</li>
<li><strong>Topology:</strong> Square (Crystal) lattice with nearest-neighbor coupling</li>
<li><strong>Gate Speed:</strong> ~20-50 nanoseconds (single-qubit)</li>
<li><strong>Native Gates:</strong> CZ (controlled-Z), PRX (parameterized rotation)</li>
<li><strong>Operating Temperature:</strong> 15 mK</li>
<li><strong>Region:</strong> eu-north-1 (Stockholm)</li>
</ul>

<p><strong>Key Advantages:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li>Extremely fast gate operations (nanoseconds)</li>
<li>Mature fabrication technology (lithographic)</li>
<li>Scalable architecture design</li>
<li>Strong European quantum sovereignty</li>
</ul>

<p class="text-cyan-400 mt-3 font-semibold">Superconducting qubits power the world's most advanced quantum computers!</p>

<p class="mt-3 text-xs"><strong>Learn More:</strong> <a href="https://docs.aws.amazon.com/braket/latest/developerguide/braket-submit-tasks.html#braket-qpu-partner-iqm" target="_blank" class="text-blue-400 hover:underline">IQM on AWS Braket</a> | <a href="https://www.iqmacademy.com/qpu/" target="_blank" class="text-blue-400 hover:underline">IQM Academy</a> | <a href="https://www.meetiqm.com/technology" target="_blank" class="text-blue-400 hover:underline">IQM Technology</a></p>`,
  },
  {
    id: 'iqm_emerald',
    name: 'IQM Emerald',
    shortName: 'IQM Emerald',
    type: 'Superconducting QPU',
    category: 'qpu',
    subcategory: 'superconducting',
    paradigm: 'gate-model',
    vendor: 'IQM',
    icon: 'Hexagon',
    iconBg: 'bg-emerald-600/20',
    features: ['54 transmon qubits', 'Crystal lattice', 'High scalability'],
    runtime: '~10+ min',
    color: 'emerald',
    visualization: 'superconducting',
    content: `
<p><strong>Technology Overview:</strong></p>
<p>IQM Emerald is IQM's flagship <strong>54-qubit superconducting quantum processor</strong>, representing a significant scale-up from the 20-qubit Garnet. Built on the same Crystal lattice architecture, Emerald demonstrates IQM's path toward quantum advantage with European technology.</p>

<p><strong>Architecture Design:</strong></p>
<p>The processor features IQM's signature approach:</p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Crystal Topology:</strong> Square lattice enabling efficient compilation</li>
<li><strong>Transmon Qubits:</strong> Aluminum/niobium superconducting circuits</li>
<li><strong>Scalable Design:</strong> Modular architecture for future expansion</li>
<li><strong>Coplanar Waveguides:</strong> High-quality resonator readout</li>
<li><strong>Through-Silicon Vias:</strong> 3D signal routing for density</li>
</ul>

<p><strong>Technical Specifications:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Qubits:</strong> 54 superconducting transmon qubits</li>
<li><strong>Topology:</strong> Square (Crystal) lattice</li>
<li><strong>Native Gates:</strong> CZ, PRX</li>
<li><strong>Operating Temperature:</strong> ~15 mK</li>
<li><strong>Control:</strong> IQM's proprietary quantum control stack</li>
<li><strong>Region:</strong> eu-north-1 (Stockholm)</li>
</ul>

<p><strong>Advantages Over Garnet:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li>2.7× more qubits for larger circuits</li>
<li>Same proven architecture and gate set</li>
<li>Deeper quantum circuits possible</li>
<li>Better suited for NISQ algorithms</li>
</ul>

<p class="text-emerald-400 mt-3 font-semibold">💎 IQM's largest processor — European quantum at scale!</p>

<p class="mt-3 text-xs"><strong>Learn More:</strong> <a href="https://docs.aws.amazon.com/braket/latest/developerguide/braket-submit-tasks.html#braket-qpu-partner-iqm" target="_blank" class="text-blue-400 hover:underline">IQM on AWS Braket</a> | <a href="https://www.iqmacademy.com/qpu/" target="_blank" class="text-blue-400 hover:underline">IQM Academy</a> | <a href="https://www.meetiqm.com/technology" target="_blank" class="text-blue-400 hover:underline">IQM Technology</a></p>`,
  },
  {
    id: 'rigetti_ankaa3',
    name: 'Rigetti Ankaa-3',
    shortName: 'Rigetti Ankaa-3',
    type: 'Superconducting QPU',
    category: 'qpu',
    subcategory: 'superconducting',
    paradigm: 'gate-model',
    vendor: 'Rigetti',
    icon: 'Target',
    iconBg: 'bg-red-600/20',
    features: ['84 qubits', '99.9% 1Q fidelity', 'Tunable couplers'],
    runtime: '~10+ min',
    color: 'red',
    visualization: 'rigetti',
    content: `
<p><strong>Technology Overview:</strong></p>
<p>Rigetti Ankaa-3 represents the latest generation of <strong>tunable superconducting quantum processors</strong>, manufactured at Rigetti's own Fab-1 quantum foundry. The 84-qubit system features innovative tunable couplers that enable high-fidelity two-qubit gates and reduced crosstalk.</p>

<p><strong>How Tunable Coupling Works:</strong></p>
<p>The processor uses advanced superconducting circuit design:</p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Transmon Qubits:</strong> Charge-insensitive superconducting qubits</li>
<li><strong>Tunable Couplers:</strong> Adjustable qubit-qubit interaction strength</li>
<li><strong>iSWAP Gates:</strong> Native entangling operation</li>
<li><strong>Multi-Chip Scaling:</strong> Tileable architecture for future expansion</li>
<li><strong>FPGA Control:</strong> Real-time, low-latency pulse generation</li>
</ul>

<p><strong>Technical Specifications:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Qubits:</strong> 84 superconducting qubits</li>
<li><strong>T1 (Energy Relaxation):</strong> 22 μs</li>
<li><strong>T2 (Dephasing):</strong> 19 μs</li>
<li><strong>1-Qubit Gate Fidelity:</strong> 99.9%</li>
<li><strong>2-Qubit Gate Fidelity:</strong> 99.0%</li>
<li><strong>Native Gates:</strong> RX, RZ, iSWAP</li>
<li><strong>Pulse Control:</strong> Full OpenPulse support</li>
<li><strong>Region:</strong> us-west-1</li>
</ul>

<p><strong>Key Innovations:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li>Industry-leading gate fidelities</li>
<li>Scalable multi-chip architecture</li>
<li>Low-latency hybrid quantum-classical</li>
<li>Quantum error correction research platform</li>
</ul>

<p class="text-red-400 mt-3 font-semibold">🚀 Rigetti's most powerful processor — pushing the boundaries of quantum!</p>

<p class="mt-3 text-xs"><strong>Learn More:</strong> <a href="https://docs.aws.amazon.com/braket/latest/developerguide/braket-submit-tasks.html#braket-qpu-partner-rigetti" target="_blank" class="text-blue-400 hover:underline">Rigetti on AWS Braket</a> | <a href="https://www.rigetti.com/what-we-build" target="_blank" class="text-blue-400 hover:underline">Rigetti Technology</a></p>`,
  },
  // === QPU: ANALOG / NEUTRAL ATOM ===
  {
    id: 'quera_aquila',
    name: 'QuEra Aquila',
    shortName: 'QuEra Aquila',
    type: 'Neutral Atom QPU',
    category: 'qpu',
    subcategory: 'neutral-atom',
    paradigm: 'analog',
    vendor: 'QuEra',
    icon: 'Microscope',
    iconBg: 'bg-green-600/20',
    features: ['256 Rydberg qubits', 'Programmable geometry', 'Analog simulation'],
    runtime: '~10+ min',
    color: 'green',
    visualization: 'atom',
    content: `
<p><strong>Technology Overview:</strong></p>
<p>QuEra Aquila is the world's first publicly accessible <strong>neutral atom quantum computer</strong>, featuring an unprecedented 256 qubits. It uses rubidium-87 (<sup>87</sup>Rb) atoms trapped by optical tweezers — highly focused laser beams that act as "optical pincers" to hold individual atoms in precise positions.</p>

<p><strong>How Neutral Atom Computing Works:</strong></p>
<p>The processor leverages Rydberg physics for quantum operations:</p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Optical Tweezers:</strong> Focused lasers trap atoms in 2D arrays</li>
<li><strong>Rydberg Excitation:</strong> UV lasers excite atoms to high-energy states</li>
<li><strong>Blockade Effect:</strong> Excited atoms prevent neighbors from excitation</li>
<li><strong>Programmable Layout:</strong> Atoms can be rearranged dynamically</li>
<li><strong>Global Control:</strong> Laser fields drive coherent quantum evolution</li>
</ul>

<p><strong>Technical Specifications:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li><strong>Qubits:</strong> 256 neutral atom qubits</li>
<li><strong>Paradigm:</strong> Analog Hamiltonian Simulation (AHS)</li>
<li><strong>Processor Area:</strong> 76μm × 75μm</li>
<li><strong>Minimum Spacing:</strong> 4μm between atoms</li>
<li><strong>Rabi Frequency:</strong> 0 - 2.5 × 2π MHz</li>
<li><strong>Detuning Range:</strong> -20 to +20 × 2π MHz</li>
<li><strong>Region:</strong> us-east-1</li>
</ul>

<p><strong>Unique Capabilities:</strong></p>
<ul class="list-disc list-inside ml-2 space-y-1">
<li>Highest qubit count on any cloud quantum platform</li>
<li>Natural simulation of quantum many-body physics</li>
<li>Arbitrary 2D atom arrangements</li>
<li>Ideal for optimization and materials science</li>
</ul>

<p class="text-green-400 mt-3 font-semibold">🌟 256 qubits — the largest publicly accessible quantum processor!</p>

<p class="mt-3 text-xs"><strong>Learn More:</strong> <a href="https://docs.aws.amazon.com/braket/latest/developerguide/braket-submit-tasks.html#braket-qpu-partner-quera" target="_blank" class="text-blue-400 hover:underline">QuEra on AWS Braket</a> | <a href="https://www.quera.com/aquila" target="_blank" class="text-blue-400 hover:underline">QuEra Aquila</a></p>`,
  },
];

export const BLOCKCHAIN_TECHS: BlockchainTechOption[] = [
  { id: 'post_quantum_signatures', name: 'Post-Quantum Signatures', description: 'Lattice-based digital signatures', icon: 'FileSignature', color: 'blue' },
  { id: 'qkd', name: 'Quantum Key Distribution', description: 'Physics-guaranteed key exchange', icon: 'KeyRound', color: 'teal' },
  { id: 'hash_crypto', name: 'Hash-based Cryptography', description: 'Quantum-resistant hash functions', icon: 'Hash', color: 'green' },
  { id: 'quantum_random', name: 'Quantum Random Numbers', description: 'True randomness from quantum', icon: 'Dices', color: 'purple' },
  { id: 'quantum_safe_contracts', name: 'Quantum-Safe Smart Contracts', description: 'Future-proof smart contracts', icon: 'ShieldCheck', color: 'amber' },
  { id: 'zkp', name: 'Zero-Knowledge Proofs', description: 'Privacy-preserving verification', icon: 'Eye', color: 'red' },
];

export const NOBEL_LAUREATES_2025: NobelLaureate[] = [
  {
    name: 'John Clarke',
    affiliation: 'UC Berkeley',
    contribution: 'Demonstrated macroscopic quantum tunneling in superconducting circuits and invented the SQUID — the most sensitive magnetic sensor ever built',
    bio: 'British-American physicist. Pioneer of superconducting quantum devices since the 1960s. His SQUID (Superconducting Quantum Interference Device) proved that quantum effects can exist at macroscopic scales, laying the experimental groundwork for superconducting qubits.',
    initial: 'C',
    photo: '/laureates/clarke.jpg',
  },
  {
    name: 'Michel Devoret',
    affiliation: 'Yale University',
    contribution: 'Proved that electrical circuits can behave quantum-mechanically and demonstrated energy quantization in superconducting circuits',
    bio: 'French-American physicist. In the 1980s–90s, his experiments at CEA-Saclay showed that a simple electrical circuit — when cooled to millikelvins — obeys quantum mechanics. This was the conceptual breakthrough that made "artificial atoms" from circuits possible.',
    initial: 'D',
    photo: '/laureates/devoret.webp',
  },
  {
    name: 'John Martinis',
    affiliation: 'UC Santa Barbara',
    contribution: 'Built the first high-fidelity superconducting qubit and led the 2019 Google quantum supremacy experiment with 53 qubits',
    bio: 'American physicist. Transformed superconducting circuits from lab curiosities into practical quantum processors. At Google, his team demonstrated quantum computational advantage for the first time — completing in 200 seconds a task that would take classical supercomputers thousands of years.',
    initial: 'M',
    photo: '/laureates/martinis.jpg',
  },
];

export const COMMUNITY_WORDS: WordCloudWord[] = [
  { text: 'Future', weight: 90, color: '#60a5fa' },
  { text: 'Revolutionary', weight: 85, color: '#f472b6' },
  { text: 'Innovation', weight: 80, color: '#4ade80' },
  { text: 'Computing', weight: 75, color: '#a78bfa' },
  { text: 'Powerful', weight: 70, color: '#fbbf24' },
  { text: 'Technology', weight: 68, color: '#22d3ee' },
  { text: 'Exciting', weight: 60, color: '#fb923c' },
  { text: 'Science', weight: 58, color: '#818cf8' },
  { text: 'Fast', weight: 55, color: '#34d399' },
  { text: 'Complex', weight: 50, color: '#f87171' },
  { text: 'Progress', weight: 48, color: '#38bdf8' },
  { text: 'Hope', weight: 45, color: '#a3e635' },
  { text: 'Change', weight: 42, color: '#e879f9' },
  { text: 'Speed', weight: 40, color: '#2dd4bf' },
  { text: 'Challenge', weight: 35, color: '#fcd34d' },
  { text: 'Mysterious', weight: 32, color: '#c084fc' },
];

export const GENERATION_STATUSES = [
  'Initializing quantum circuits...',
  'Preparing entangled qubits...',
  'Running post-quantum algorithm...',
  'Applying error correction...',
  'Finalizing cryptographic key...',
];

export const PROCESSING_TYPES: Record<string, string> = {
  aws_sv1: 'State Vector Simulation',
  aws_dm1: 'Density Matrix Simulation',
  aws_tn1: 'Tensor Network Simulation',
  ionq_aria: 'Trapped Ion QPU',
  ionq_forte: 'Trapped Ion QPU',
  aqt_ibex_q1: 'Trapped Ion QPU',
  iqm_garnet: 'Superconducting QPU',
  iqm_emerald: 'Superconducting QPU',
  rigetti_ankaa3: 'Superconducting QPU',
  quera_aquila: 'Neutral Atom QPU',
};
