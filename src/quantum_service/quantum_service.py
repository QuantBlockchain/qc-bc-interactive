"""
Enhanced Quantum Service Module

Core quantum computing functionality including:
- Quantum circuit execution (local and AWS Braket)
- Quantum random number generation
- Bell state creation
- Visual property generation
- QuEra Aquila AHS support
"""

import os
import time
import math
import hashlib
import secrets
import random
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

from .credentials import credentials_manager, AWS_SDK_AVAILABLE
from .devices import QuantumDeviceManager
from .crypto import QuantumResistantCrypto

# Configure logging
logger = logging.getLogger(__name__)

# Braket SDK imports
try:
    from braket.aws import AwsDevice
    from braket.circuits import Circuit
    from braket.devices import LocalSimulator
    BRAKET_SDK_AVAILABLE = True
except ImportError:
    BRAKET_SDK_AVAILABLE = False
    logger.warning("Braket SDK not available, using local simulation only")

# AHS imports for QuEra Aquila
try:
    import numpy as np
    from braket.tasks.analog_hamiltonian_simulation_quantum_task_result import (
        AnalogHamiltonianSimulationQuantumTaskResult as AhsResult
    )
    from braket.ahs.atom_arrangement import AtomArrangement
    from braket.ahs.driving_field import DrivingField
    from braket.ahs.analog_hamiltonian_simulation import AnalogHamiltonianSimulation
    from braket.timings.time_series import TimeSeries
    AHS_AVAILABLE = True
except ImportError:
    AHS_AVAILABLE = False
    logger.warning("AHS modules not available, QuEra Aquila support disabled")


class EnhancedQuantumService:
    """
    Enhanced quantum service with multi-device support.

    Features:
    - Local simulation (always available)
    - AWS Braket device integration
    - Quantum random number generation
    - Bell state entanglement measurement
    - QuEra Aquila AHS support
    - Result caching for performance
    """

    def __init__(self):
        """Initialize the quantum service."""
        self.device_manager = QuantumDeviceManager()
        self.crypto_service = QuantumResistantCrypto()
        self._circuit_cache: Dict[str, int] = {}
        self._aws_devices: Dict[str, Any] = {}
        self._local_simulator = None

        # Initialize local simulator
        self._initialize_local_simulator()

        # Initialize AWS devices
        self._initialize_aws_devices()

    def _initialize_local_simulator(self):
        """Initialize the local Braket simulator."""
        if BRAKET_SDK_AVAILABLE:
            try:
                self._local_simulator = LocalSimulator()
                logger.info("Local Braket simulator initialized")
            except Exception as e:
                logger.warning(f"Could not initialize local simulator: {e}")

    def _initialize_aws_devices(self):
        """Initialize AWS Braket devices with credentials."""
        if not BRAKET_SDK_AVAILABLE or not AWS_SDK_AVAILABLE:
            logger.info("AWS Braket or boto3 not available, using local simulation only")
            return

        try:
            # Verify permissions first
            perm_check = credentials_manager.verify_braket_permissions()
            if not perm_check['success']:
                logger.warning(f"Braket permissions check failed: {perm_check.get('error')}")
                return

            # Initialize each AWS device
            for device_id, device_info in self.device_manager.devices.items():
                if device_info['arn'].startswith('arn:aws:braket'):
                    self._init_single_device(device_id, device_info)

        except Exception as e:
            logger.error(f"AWS device initialization failed: {e}")

    def _init_single_device(self, device_id: str, device_info: Dict[str, Any]):
        """Initialize a single AWS device."""
        try:
            device_region = device_info.get('region', 'us-east-1')

            # Get session for the device's region
            session = credentials_manager.get_session(device_region)
            if not session:
                return

            # Set region for Braket SDK
            original_region = os.environ.get('AWS_DEFAULT_REGION')
            os.environ['AWS_DEFAULT_REGION'] = device_region

            try:
                self._aws_devices[device_id] = AwsDevice(device_info['arn'])
                logger.info(f"Initialized AWS device: {device_info['name']} in {device_region}")
            finally:
                # Restore original region
                if original_region:
                    os.environ['AWS_DEFAULT_REGION'] = original_region
                elif 'AWS_DEFAULT_REGION' in os.environ:
                    del os.environ['AWS_DEFAULT_REGION']

        except Exception as e:
            logger.warning(f"Could not initialize {device_id}: {e}")

    def _should_use_aws_device(self, device_id: str, device_info: Dict[str, Any]) -> bool:
        """
        Check if we should execute on the actual AWS device vs local simulator.

        QPU devices (IonQ, Rigetti, IQM, QuEra, AQT) are NOT executed directly
        because they require minutes to hours to complete, which exceeds the
        API Gateway / Lambda timeout limits in the synchronous call chain.

        AWS managed simulators (SV1, DM1, TN1) complete in seconds and can
        be used directly.
        """
        if device_id == 'local_simulator':
            return False
        if device_id not in self._aws_devices:
            return False
        return device_info.get('type') in ('managed_simulator', 'simulator')

    # -------------------------------------------------------------------------
    # Local Simulation (No SDK Required)
    # -------------------------------------------------------------------------

    def simulate_quantum_local(self, num_qubits: int, shots: int, seed: str) -> Dict[str, int]:
        """
        Local quantum simulation without Braket SDK.

        Uses hash-based pseudorandom generation to simulate
        quantum measurement outcomes.

        Args:
            num_qubits: Number of qubits to simulate
            shots: Number of measurement shots
            seed: Random seed string

        Returns:
            Dict mapping bitstring outcomes to counts
        """
        counts = {}
        for shot in range(shots):
            shot_hash = hashlib.sha256(f"{seed}_{shot}".encode()).hexdigest()
            result = ''
            for i in range(num_qubits):
                hex_part = shot_hash[i * 2:i * 2 + 2]
                val = int(hex_part, 16)
                result += '0' if val < 128 else '1'
            counts[result] = counts.get(result, 0) + 1
        return counts

    # -------------------------------------------------------------------------
    # Quantum Random Number Generation
    # -------------------------------------------------------------------------

    def generate_quantum_random_number(self, device_id: str, seed_text: str) -> int:
        """
        Generate quantum random number with device-specific characteristics.

        Args:
            device_id: Quantum device to use
            seed_text: Seed for circuit parameterization

        Returns:
            Quantum-derived random integer
        """
        # Check cache
        cache_key = hashlib.md5(f"{device_id}_{seed_text}".encode()).hexdigest()
        if cache_key in self._circuit_cache:
            base_result = self._circuit_cache[cache_key]
            return (base_result + int(time.time())) % 1000

        device_info = self.device_manager.get_device_info(device_id)

        # Special handling for QuEra Aquila (AHS paradigm)
        if "quera" in device_id and AHS_AVAILABLE:
            try:
                quantum_number = self._ahs_quantum_number(device_id, seed_text)
                self._circuit_cache[cache_key] = quantum_number
                return quantum_number
            except Exception as e:
                logger.error(f"AHS execution error: {e}")

        # Use Braket SDK if available
        if BRAKET_SDK_AVAILABLE and self._local_simulator:
            try:
                quantum_number = self._generate_with_braket(device_id, seed_text, device_info)
                self._circuit_cache[cache_key] = quantum_number
                return quantum_number
            except Exception as e:
                logger.error(f"Braket circuit execution error: {e}")

        # Fallback to local simulation
        return self._generate_with_local_sim(device_id, seed_text, device_info, cache_key)

    def _generate_with_braket(self, device_id: str, seed_text: str,
                               device_info: Dict[str, Any]) -> int:
        """Generate random number using Braket SDK."""
        num_qubits = min(4 + (hash(seed_text) % 4), device_info.get('max_qubits', 8))

        circuit = Circuit()

        # Create quantum superposition
        for i in range(num_qubits):
            circuit.h(i)

        # Add entanglement
        for i in range(num_qubits - 1):
            circuit.cnot(i, i + 1)

        # Device-specific optimizations
        if 'ionq' in device_id:
            # IonQ has all-to-all connectivity
            for i in range(min(num_qubits, 3)):
                for j in range(i + 1, min(num_qubits, 3)):
                    circuit.cnot(i, j)

        # Parameterized rotations based on input
        for i, char in enumerate(seed_text[:num_qubits]):
            angle = (ord(char) / 128.0) * 3.14159
            circuit.ry(i, angle)

        # Measure all qubits
        for i in range(num_qubits):
            circuit.measure(i)

        # Execute on appropriate device
        return self._execute_circuit(circuit, device_id, shots=10)

    def _generate_with_local_sim(self, device_id: str, seed_text: str,
                                  device_info: Dict[str, Any], cache_key: str) -> int:
        """Generate random number using local simulation."""
        num_qubits = min(8, device_info.get('max_qubits', 8))
        counts = self.simulate_quantum_local(num_qubits, 100, seed_text)

        # Extract most common result
        max_count = 0
        max_state = '0' * num_qubits
        for state, count in counts.items():
            if count > max_count:
                max_count = count
                max_state = state

        quantum_number = int(max_state, 2)
        self._circuit_cache[cache_key] = quantum_number
        return quantum_number

    def _execute_circuit(self, circuit: Any, device_id: str, shots: int = 10) -> int:
        """
        Execute circuit on specified device.

        Args:
            circuit: Braket Circuit object
            device_id: Target device
            shots: Number of shots

        Returns:
            Integer from binary measurement result
        """
        try:
            device_info = self.device_manager.get_device_info(device_id)
            if self._should_use_aws_device(device_id, device_info):
                # Use AWS managed simulator (SV1, DM1, TN1)
                return self._execute_on_aws_device(circuit, device_id, shots)
            else:
                # Use local simulator (for QPU devices and fallback)
                task = self._local_simulator.run(circuit, shots=shots)
                result = task.result()
                measurement = result.measurement_counts
                binary_result = list(measurement.keys())[0]
                return int(binary_result, 2)

        except Exception as e:
            logger.error(f"Circuit execution failed: {e}")
            # Fallback to hash
            circuit_hash = hashlib.md5(str(circuit).encode()).hexdigest()
            return int(circuit_hash[:8], 16) % 1000

    def _execute_on_aws_device(self, circuit: Any, device_id: str, shots: int) -> int:
        """Execute circuit on AWS managed simulator with waiting."""
        aws_device = self._aws_devices[device_id]
        task = aws_device.run(circuit, shots=shots)

        device_info = self.device_manager.get_device_info(device_id)
        if device_info.get('async_required', False):
            # Wait for completion (managed simulators typically finish in seconds)
            max_wait_time = 300  # 5 min max for simulators
            start_time = time.time()

            while task.state() not in ['COMPLETED', 'FAILED', 'CANCELLED']:
                if time.time() - start_time > max_wait_time:
                    raise Exception(f"Task timeout after {max_wait_time} seconds")
                time.sleep(2)

        result = task.result()
        measurement = result.measurement_counts
        binary_result = list(measurement.keys())[0]
        return int(binary_result, 2)

    # -------------------------------------------------------------------------
    # QuEra Aquila AHS Support
    # -------------------------------------------------------------------------

    def _ahs_quantum_number(self, device_id: str, seed_text: str) -> int:
        """
        Generate quantum number using Analog Hamiltonian Simulation.

        QuEra Aquila uses a different paradigm than gate-based quantum computing.
        It performs analog quantum simulation with neutral atoms.

        Args:
            device_id: Device identifier
            seed_text: Seed for parameterization

        Returns:
            Quantum-derived integer
        """
        if not AHS_AVAILABLE:
            raise Exception("AHS modules not available")

        STATE_TO_BIT = {"g": "0", "r": "1", "e": "0"}

        def create_ahs_program(seed: str, num_atoms: int = 8):
            um = 1e-6  # micrometers

            # Atom register (1D chain)
            register = AtomArrangement()
            for i in range(num_atoms):
                register.add(np.array([i * 5 * um, 0.0]))

            # Global driving field parameters
            T = 4e-6  # Total time
            base = 1.0 + (abs(hash(seed)) % 5)
            omega_max = min(1580000, 2 * math.pi * base * 1e6)
            delta_span = 2 * math.pi * 1e6

            # Time series for Rabi frequency, detuning, phase
            omega = TimeSeries().put(0.0, 0.0).put(T/2, omega_max).put(T, 0.0)
            delta = TimeSeries().put(0.0, -delta_span).put(T, +delta_span)
            phi = TimeSeries().put(0.0, 0.0).put(T, 0.0)

            drive = DrivingField(amplitude=omega, detuning=delta, phase=phi)
            return AnalogHamiltonianSimulation(register=register, hamiltonian=drive)

        def spin_config_to_int(spin_config: str) -> int:
            bitstr = "".join(STATE_TO_BIT.get(ch, "0") for ch in spin_config)
            return int(bitstr, 2) if bitstr else 0

        seed = f"{device_id}_{seed_text}"
        program = create_ahs_program(seed)

        if 'quera_aquila' in self._aws_devices:
            aquila = self._aws_devices['quera_aquila']
            program = program.discretize(aquila)
            task = aquila.run(program, shots=10)

            # Wait for result
            max_wait = 3600
            start = time.time()
            while task.state() not in ['COMPLETED', 'FAILED', 'CANCELLED']:
                if time.time() - start > max_wait:
                    raise Exception("AHS task timeout")
                time.sleep(10)

            result = task.result()
            counts = AhsResult.from_object(result).get_counts() or {}

            if counts:
                top_cfg = max(counts.items(), key=lambda kv: kv[1])[0]
                return spin_config_to_int(top_cfg)

        # Fallback
        return hash(seed) % 1000

    # -------------------------------------------------------------------------
    # Bell State Generation
    # -------------------------------------------------------------------------

    def create_bell_state(self, device_id: str) -> List[float]:
        """
        Create Bell state and measure probability distribution.

        Bell state: |Φ+⟩ = (|00⟩ + |11⟩) / √2

        Ideal probabilities: P(00)=0.5, P(01)=0, P(10)=0, P(11)=0.5

        Args:
            device_id: Quantum device to use

        Returns:
            List of probabilities [P(00), P(01), P(10), P(11)]
        """
        device_info = self.device_manager.get_device_info(device_id)

        # QuEra doesn't support Bell states (different paradigm)
        if not device_info.get('supports_bell_states', True):
            return [0.5, 0.0, 0.0, 0.5]

        if BRAKET_SDK_AVAILABLE and self._local_simulator:
            try:
                return self._create_bell_with_braket(device_id, device_info)
            except Exception as e:
                logger.error(f"Bell state error: {e}")

        # Fallback to local simulation
        return self._create_bell_with_local_sim(device_id)

    def _create_bell_with_braket(self, device_id: str, device_info: Dict[str, Any]) -> List[float]:
        """Create Bell state using Braket SDK."""
        circuit = Circuit()
        circuit.h(0)
        circuit.cnot(0, 1)
        circuit.measure(0)
        circuit.measure(1)

        shots = 200 if device_info['type'] in ('simulator', 'managed_simulator') else 1000

        if self._should_use_aws_device(device_id, device_info):
            aws_device = self._aws_devices[device_id]
            task = aws_device.run(circuit, shots=shots)

            if device_info.get('async_required', False):
                max_wait = 3600
                start = time.time()
                while task.state() not in ['COMPLETED', 'FAILED', 'CANCELLED']:
                    if time.time() - start > max_wait:
                        raise Exception("Bell state task timeout")
                    time.sleep(5)
        else:
            task = self._local_simulator.run(circuit, shots=shots)

        result = task.result()
        counts = result.measurement_counts
        total = sum(counts.values())

        return [
            counts.get('00', 0) / total,
            counts.get('01', 0) / total,
            counts.get('10', 0) / total,
            counts.get('11', 0) / total
        ]

    def _create_bell_with_local_sim(self, device_id: str) -> List[float]:
        """Create Bell state using local simulation."""
        seed = f"bell_{device_id}_{time.time()}"
        counts = self.simulate_quantum_local(2, 100, seed)
        total = sum(counts.values())

        return [
            counts.get('00', 0) / total,
            counts.get('01', 0) / total,
            counts.get('10', 0) / total,
            counts.get('11', 0) / total
        ]

    # -------------------------------------------------------------------------
    # Visual Properties Generation
    # -------------------------------------------------------------------------

    def generate_visual_properties(self, quantum_number: int, entanglement_data: List[float],
                                   device_id: str = "local_simulator") -> Dict[str, Any]:
        """
        Generate visual properties for signature display.

        Uses quantum data to derive:
        - Color (HSL based on device and quantum number)
        - Position (based on quantum number)
        - Animation parameters

        Args:
            quantum_number: Quantum random number
            entanglement_data: Bell state probabilities
            device_id: Device used for generation

        Returns:
            Dict with visual properties
        """
        device_info = self.device_manager.get_device_info(device_id)

        # Base color using golden angle for good distribution
        hue = (quantum_number * 137.5) % 360

        # Device-specific color modifications
        hue = self._apply_device_color_shift(hue, device_id)

        # Saturation and lightness from entanglement data
        saturation = 70 + (sum(entanglement_data) * 30)
        lightness = 45 + (entanglement_data[0] * 20 if entanglement_data else 0)

        # Position based on quantum number
        position_x = 10 + (quantum_number * 137.5 % 80)
        position_y = 10 + ((quantum_number * 61.8) % 80)

        # Size factor from entanglement
        size_factor = 0.8 + (entanglement_data[3] * 0.4 if len(entanglement_data) > 3 else 0.2)

        return {
            'color': f"hsl({hue:.1f}, {saturation:.1f}%, {lightness:.1f}%)",
            'position_x': position_x,
            'position_y': position_y,
            'pulse_speed': 2 + (quantum_number % 3),
            'size_factor': size_factor,
            'device_indicator': device_info.get('type', 'unknown')
        }

    def _apply_device_color_shift(self, base_hue: float, device_id: str) -> float:
        """Apply device-specific color shift."""
        shifts = {
            'ionq': 60,      # Blue-green
            'iqm': 120,      # Green
            'quera': 180,    # Red/Cyan
            'rigetti': 240,  # Purple
            'aws': 300       # Magenta
        }

        for key, shift in shifts.items():
            if key in device_id:
                return (base_hue + shift) % 360

        return base_hue

    # -------------------------------------------------------------------------
    # Combined Quantum Operations (Single Task)
    # -------------------------------------------------------------------------

    def generate_combined_quantum_data(self, device_id: str, seed_text: str) -> Dict[str, Any]:
        """
        Generate both quantum random number and Bell state in a SINGLE quantum task.

        This combines two operations into one circuit to reduce Braket costs:
        - Qubits 0-5: Random number generation (Hadamard + entanglement + rotation)
        - Qubits 6-7: Bell state (Hadamard + CNOT)

        Args:
            device_id: Quantum device to use
            seed_text: Seed for circuit parameterization

        Returns:
            Dict with 'quantum_number' and 'entanglement_data'
        """
        device_info = self.device_manager.get_device_info(device_id)

        # QuEra doesn't support this circuit paradigm
        if "quera" in device_id:
            quantum_number = self._ahs_quantum_number(device_id, seed_text) if AHS_AVAILABLE else \
                            int(hashlib.md5(seed_text.encode()).hexdigest()[:8], 16) % 1000
            return {
                'quantum_number': quantum_number,
                'entanglement_data': [0.5, 0.0, 0.0, 0.5]  # Ideal Bell state
            }

        if BRAKET_SDK_AVAILABLE and self._local_simulator:
            try:
                return self._generate_combined_with_braket(device_id, seed_text, device_info)
            except Exception as e:
                logger.error(f"Combined quantum execution error: {e}")

        # Fallback to local simulation
        return self._generate_combined_with_local_sim(device_id, seed_text, device_info)

    def _generate_combined_with_braket(self, device_id: str, seed_text: str,
                                        device_info: Dict[str, Any]) -> Dict[str, Any]:
        """Generate combined quantum data using Braket SDK in a single circuit."""
        # Use 6 qubits for random number + 2 qubits for Bell state = 8 total
        num_random_qubits = 6
        bell_qubit_0 = 6
        bell_qubit_1 = 7

        circuit = Circuit()

        # === Random Number Generation (qubits 0-5) ===
        # Create superposition
        for i in range(num_random_qubits):
            circuit.h(i)

        # Add entanglement chain
        for i in range(num_random_qubits - 1):
            circuit.cnot(i, i + 1)

        # Parameterized rotations based on seed
        for i, char in enumerate(seed_text[:num_random_qubits]):
            angle = (ord(char) / 128.0) * 3.14159
            circuit.ry(i, angle)

        # === Bell State (qubits 6-7) ===
        circuit.h(bell_qubit_0)
        circuit.cnot(bell_qubit_0, bell_qubit_1)

        # Measure all qubits
        for i in range(8):
            circuit.measure(i)

        # Execute circuit
        shots = 100 if device_info['type'] in ('simulator', 'managed_simulator') else 100

        if self._should_use_aws_device(device_id, device_info):
            # Use AWS managed simulator (SV1, DM1, TN1) — completes in seconds
            aws_device = self._aws_devices[device_id]
            task = aws_device.run(circuit, shots=shots)

            if device_info.get('async_required', False):
                max_wait = 300  # 5 min max for simulators
                start = time.time()
                while task.state() not in ['COMPLETED', 'FAILED', 'CANCELLED']:
                    if time.time() - start > max_wait:
                        raise Exception("Combined quantum task timeout")
                    time.sleep(2)
        else:
            # Use local simulator (for QPU devices and fallback)
            task = self._local_simulator.run(circuit, shots=shots)

        result = task.result()
        counts = result.measurement_counts

        # Parse results
        # Random number from qubits 0-5 (first 6 bits)
        random_sum = 0
        total_shots = sum(counts.values())

        for bitstring, count in counts.items():
            # Bitstring is in reverse order (qubit 7 is leftmost)
            # Extract bits for random number (positions 2-7 in 8-bit string)
            random_bits = bitstring[2:8] if len(bitstring) >= 8 else bitstring[-6:]
            random_sum += int(random_bits, 2) * count

        quantum_number = int(random_sum / total_shots) % 1000

        # Bell state probabilities from qubits 6-7 (first 2 bits)
        bell_counts = {'00': 0, '01': 0, '10': 0, '11': 0}
        for bitstring, count in counts.items():
            bell_bits = bitstring[0:2] if len(bitstring) >= 2 else '00'
            bell_counts[bell_bits] = bell_counts.get(bell_bits, 0) + count

        entanglement_data = [
            bell_counts['00'] / total_shots,
            bell_counts['01'] / total_shots,
            bell_counts['10'] / total_shots,
            bell_counts['11'] / total_shots
        ]

        return {
            'quantum_number': quantum_number,
            'entanglement_data': entanglement_data
        }

    def _generate_combined_with_local_sim(self, device_id: str, seed_text: str,
                                           device_info: Dict[str, Any]) -> Dict[str, Any]:
        """Generate combined quantum data using local simulation."""
        # Use existing local simulation methods as fallback
        seed = f"{device_id}:{seed_text}:{time.time()}"
        random.seed(seed)

        # Generate quantum number
        quantum_number = random.randint(0, 999)

        # Generate Bell state probabilities (with realistic noise)
        noise = random.uniform(0.02, 0.08)
        entanglement_data = [
            0.5 - noise/2,
            noise/4,
            noise/4,
            0.5 - noise/2
        ]

        return {
            'quantum_number': quantum_number,
            'entanglement_data': entanglement_data
        }

    # -------------------------------------------------------------------------
    # Main Processing Entry Point
    # -------------------------------------------------------------------------

    def process_quantum_signature(self, name: str, message: str, device_id: str) -> Dict[str, Any]:
        """
        Process complete quantum signature generation.

        This is the main entry point that orchestrates:
        1. Quantum random number generation
        2. Bell state measurement
        3. Key pair generation
        4. Digital signature creation
        5. Visual property generation
        6. Blockchain-like identifiers

        Args:
            name: User/signer name
            message: Message to sign
            device_id: Quantum device to use

        Returns:
            Complete signature result dict
        """
        try:
            device_info = self.device_manager.get_device_info(device_id)
            if not device_info:
                return {'success': False, 'error': f'Unknown device: {device_id}'}

            # Generate seed
            seed = f"{name}:{message}:{time.time()}"

            # Step 1 & 2: Generate quantum random number AND Bell state in SINGLE task
            # This reduces Braket costs by 50% (1 task instead of 2)
            quantum_data = self.generate_combined_quantum_data(device_id, seed)
            quantum_number = quantum_data['quantum_number']
            entanglement_data = quantum_data['entanglement_data']

            # Step 3: Generate quantum-resistant keypair
            keypair = self.crypto_service.generate_quantum_keypair(quantum_number)

            # Step 4: Generate digital signature
            message_to_sign = f"{name}|{message}|{quantum_number}|{device_id}"
            signature = self.crypto_service.sign_message(
                message_to_sign,
                keypair['private_key'],
                quantum_number
            )

            # Step 5: Generate visual properties
            visual_props = self.generate_visual_properties(
                quantum_number, entanglement_data, device_id
            )

            # Step 6: Generate blockchain-like identifiers
            timestamp = datetime.now().isoformat()
            transaction_id = hashlib.sha256(
                f"{name}{message}{timestamp}".encode()
            ).hexdigest()[:16]
            block_hash = hashlib.sha256(
                f"{transaction_id}{signature}".encode()
            ).hexdigest()

            # Generate quantum ID and job ID
            num_qubits = min(8, device_info.get('max_qubits', 8))
            quantum_id = f"{quantum_number / (2 ** num_qubits):.4f}"
            job_id = f"QJ-{datetime.now().year}-{secrets.randbelow(9999):04d}"

            # Determine processing method
            if self._should_use_aws_device(device_id, device_info):
                processing_method = 'AWS Braket'
            else:
                processing_method = 'Local Simulation'

            return {
                'success': True,
                'quantum_id': quantum_id,
                'quantum_number': quantum_number,
                'entanglement_data': entanglement_data,
                'public_key': keypair['public_key'],
                'private_key': keypair['private_key'],
                'signature': signature,
                'algorithm': keypair['algorithm'],
                'device_id': device_id,
                'device_name': device_info['name'],
                'device_type': device_info['type'],
                'transaction_id': transaction_id,
                'block_hash': block_hash,
                'timestamp': timestamp,
                'job_id': job_id,
                'visual_properties': visual_props,
                'processing_method': processing_method
            }

        except Exception as e:
            logger.error(f"Quantum signature processing error: {e}")
            return {'success': False, 'error': str(e)}

    def clear_cache(self):
        """Clear the circuit result cache."""
        self._circuit_cache.clear()
        logger.info("Cleared quantum circuit cache")

    def get_service_status(self) -> Dict[str, Any]:
        """Get service status information."""
        return {
            'braket_sdk_available': BRAKET_SDK_AVAILABLE,
            'aws_sdk_available': AWS_SDK_AVAILABLE,
            'ahs_available': AHS_AVAILABLE,
            'local_simulator_ready': self._local_simulator is not None,
            'aws_devices_initialized': list(self._aws_devices.keys()),
            'cache_size': len(self._circuit_cache)
        }
