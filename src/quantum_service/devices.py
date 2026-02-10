"""
Quantum Device Management Module

Manages different quantum devices and their capabilities including:
- Local simulators
- AWS managed simulators (SV1)
- Quantum Processing Units (QPUs): IonQ, IQM, QuEra, Rigetti
"""

from typing import Dict, Any, List


class QuantumDeviceManager:
    """
    Manages quantum device configurations and capabilities.

    Supports multiple device types:
    - simulator: Local quantum circuit simulators
    - managed_simulator: AWS managed simulators
    - qpu: Real quantum hardware
    """

    def __init__(self):
        self.devices = self._initialize_devices()

    def _initialize_devices(self) -> Dict[str, Dict[str, Any]]:
        """Initialize device configurations."""
        return {
            'local_simulator': {
                'name': 'Local Simulator',
                'type': 'simulator',
                'arn': 'local://simulator',
                'region': 'local',
                'description': 'Fast local quantum circuit simulator',
                'advantages': [
                    'Immediate results',
                    'No cost',
                    'Always available',
                    'No AWS credentials required'
                ],
                'typical_runtime': '< 1 second',
                'max_qubits': 34,
                'supports_bell_states': True,
                'async_required': False,
                'cost_per_task': 0,
                'cost_per_shot': 0
            },
            'aws_sv1': {
                'name': 'AWS SV1 Simulator',
                'type': 'managed_simulator',
                'arn': 'arn:aws:braket:::device/quantum-simulator/amazon/sv1',
                'region': 'us-east-1',
                'description': 'AWS managed state vector quantum simulator',
                'advantages': [
                    'High performance',
                    'Up to 34 qubits',
                    'Cloud scalability',
                    'No queue wait time'
                ],
                'typical_runtime': '1-5 seconds',
                'max_qubits': 34,
                'supports_bell_states': True,
                'async_required': True,
                'cost_per_task': 0.00,
                'cost_per_shot': 0.00
            },
            'aws_dm1': {
                'name': 'AWS DM1 Simulator',
                'type': 'managed_simulator',
                'arn': 'arn:aws:braket:::device/quantum-simulator/amazon/dm1',
                'region': 'us-east-1',
                'description': 'AWS managed density matrix quantum simulator with noise modeling',
                'advantages': [
                    'Noise modeling',
                    'Up to 17 qubits',
                    'Mixed state simulation',
                    'No queue wait time'
                ],
                'typical_runtime': '1-5 seconds',
                'max_qubits': 17,
                'supports_bell_states': True,
                'async_required': True,
                'cost_per_task': 0.00,
                'cost_per_shot': 0.00
            },
            'aws_tn1': {
                'name': 'AWS TN1 Simulator',
                'type': 'managed_simulator',
                'arn': 'arn:aws:braket:::device/quantum-simulator/amazon/tn1',
                'region': 'us-east-1',
                'description': 'AWS managed tensor network simulator with GPU acceleration',
                'advantages': [
                    'Up to 50 qubits',
                    'GPU-accelerated',
                    'Structured circuits',
                    'No queue wait time'
                ],
                'typical_runtime': '1-10 seconds',
                'max_qubits': 50,
                'supports_bell_states': True,
                'async_required': True,
                'cost_per_task': 0.00,
                'cost_per_shot': 0.00
            },
            'ionq_aria': {
                'name': 'IonQ Aria',
                'type': 'qpu',
                'arn': 'arn:aws:braket:us-east-1::device/qpu/ionq/Aria-1',
                'region': 'us-east-1',
                'description': 'IonQ trapped ion quantum processor',
                'advantages': [
                    'Real quantum hardware',
                    'High fidelity gates',
                    'All-to-all qubit connectivity',
                    'Long coherence times'
                ],
                'typical_runtime': '5-30 minutes',
                'max_qubits': 25,
                'supports_bell_states': True,
                'async_required': True,
                'technology': 'Trapped Ion',
                'cost_per_task': 0.30,
                'cost_per_shot': 0.01
            },
            'ionq_forte': {
                'name': 'IonQ Forte Enterprise',
                'type': 'qpu',
                'arn': 'arn:aws:braket:us-east-1::device/qpu/ionq/Forte-Enterprise-1',
                'region': 'us-east-1',
                'description': 'IonQ trapped ion quantum processor',
                'advantages': [
                    'Real quantum hardware',
                    'High fidelity gates',
                    'All-to-all qubit connectivity',
                    'Long coherence times'
                ],
                'typical_runtime': '5-30 minutes',
                'max_qubits': 32,
                'supports_bell_states': True,
                'async_required': True,
                'technology': 'Trapped Ion',
                'cost_per_task': 0.30,
                'cost_per_shot': 0.01
            },
            'iqm_garnet': {
                'name': 'IQM Garnet',
                'type': 'qpu',
                'arn': 'arn:aws:braket:eu-north-1::device/qpu/iqm/Emerald',
                'region': 'eu-north-1',
                'description': 'IQM superconducting quantum processor',
                'advantages': [
                    'European quantum hardware',
                    'Superconducting qubits',
                    'Fast gate operations',
                    'Low latency in EU'
                ],
                'typical_runtime': '10-45 minutes',
                'max_qubits': 20,
                'supports_bell_states': True,
                'async_required': True,
                'technology': 'Superconducting',
                'cost_per_task': 0.30,
                'cost_per_shot': 0.00145
            },
            'aqt_ibex_q1': {
                'name': 'AQT IBEX Q1',
                'type': 'qpu',
                'arn': 'arn:aws:braket:eu-central-1::device/qpu/aqt/IBEX-Q1',
                'region': 'eu-central-1',
                'description': 'AQT trapped ion quantum processor',
                'advantages': [
                    'High fidelity gates',
                    'All-to-all connectivity',
                    'European technology',
                    'Compact design'
                ],
                'typical_runtime': '5-30 minutes',
                'max_qubits': 12,
                'supports_bell_states': True,
                'async_required': True,
                'technology': 'Trapped Ion',
                'cost_per_task': 0.30,
                'cost_per_shot': 0.01
            },
            'iqm_emerald': {
                'name': 'IQM Emerald',
                'type': 'qpu',
                'arn': 'arn:aws:braket:eu-north-1::device/qpu/iqm/Emerald',
                'region': 'eu-north-1',
                'description': 'IQM 54-qubit superconducting quantum processor',
                'advantages': [
                    'European quantum hardware',
                    '54 superconducting qubits',
                    'Fast gate operations',
                    'Scalable crystal lattice architecture'
                ],
                'typical_runtime': '10-45 minutes',
                'max_qubits': 54,
                'supports_bell_states': True,
                'async_required': True,
                'technology': 'Superconducting',
                'cost_per_task': 0.30,
                'cost_per_shot': 0.00145
            },
            'quera_aquila': {
                'name': 'QuEra Aquila',
                'type': 'qpu',
                'arn': 'arn:aws:braket:us-east-1::device/qpu/quera/Aquila',
                'region': 'us-east-1',
                'description': 'QuEra neutral atom quantum processor',
                'advantages': [
                    'Neutral atom technology',
                    'Programmable atom topology',
                    'Analog quantum simulation',
                    'Large qubit count (256)'
                ],
                'typical_runtime': '15-60 minutes',
                'max_qubits': 256,
                'supports_bell_states': False,  # Uses AHS paradigm
                'async_required': True,
                'technology': 'Neutral Atom',
                'paradigm': 'Analog Hamiltonian Simulation (AHS)',
                'cost_per_task': 0.30,
                'cost_per_shot': 0.01
            },
            'rigetti_ankaa3': {
                'name': 'Rigetti Ankaa-3',
                'type': 'qpu',
                'arn': 'arn:aws:braket:us-west-1::device/qpu/rigetti/Ankaa-3',
                'region': 'us-west-1',
                'description': 'Rigetti superconducting quantum processor',
                'advantages': [
                    'Parametric gates',
                    'Fast execution',
                    'NISQ algorithm support',
                    'Active qubit reset'
                ],
                'typical_runtime': '5-20 minutes',
                'max_qubits': 84,
                'supports_bell_states': True,
                'async_required': True,
                'technology': 'Superconducting',
                'cost_per_task': 0.30,
                'cost_per_shot': 0.00035
            }
        }

    def get_device_info(self, device_id: str) -> Dict[str, Any]:
        """
        Get information about a specific device.

        Args:
            device_id: Device identifier

        Returns:
            Device configuration dict or empty dict if not found
        """
        return self.devices.get(device_id, {})

    def get_available_devices(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all available devices.

        Returns:
            Dict mapping device_id to device configuration
        """
        return self.devices.copy()

    def get_device_by_type(self, device_type: str) -> List[Dict[str, Any]]:
        """
        Get devices filtered by type.

        Args:
            device_type: One of 'simulator', 'managed_simulator', 'qpu'

        Returns:
            List of device configurations with 'id' field added
        """
        return [
            {**device, 'id': device_id}
            for device_id, device in self.devices.items()
            if device['type'] == device_type
        ]

    def get_devices_by_region(self, region: str) -> List[Dict[str, Any]]:
        """
        Get devices available in a specific region.

        Args:
            region: AWS region name

        Returns:
            List of device configurations with 'id' field added
        """
        return [
            {**device, 'id': device_id}
            for device_id, device in self.devices.items()
            if device['region'] == region or device['region'] == 'local'
        ]

    def get_bell_state_capable_devices(self) -> List[Dict[str, Any]]:
        """
        Get devices that support Bell state circuits.

        Returns:
            List of device configurations with 'id' field added
        """
        return [
            {**device, 'id': device_id}
            for device_id, device in self.devices.items()
            if device.get('supports_bell_states', False)
        ]

    def estimate_cost(self, device_id: str, shots: int) -> Dict[str, float]:
        """
        Estimate cost for running a task on a device.

        Args:
            device_id: Device identifier
            shots: Number of shots

        Returns:
            Dict with cost breakdown
        """
        device = self.get_device_info(device_id)
        if not device:
            return {'error': 'Device not found'}

        task_cost = device.get('cost_per_task', 0)
        shot_cost = device.get('cost_per_shot', 0) * shots
        total_cost = task_cost + shot_cost

        return {
            'device_id': device_id,
            'shots': shots,
            'task_cost': task_cost,
            'shot_cost': shot_cost,
            'total_cost': total_cost,
            'currency': 'USD'
        }

    def get_device_status_summary(self) -> Dict[str, Any]:
        """
        Get a summary of all device statuses.

        Returns:
            Summary dict with counts by type
        """
        summary = {
            'total_devices': len(self.devices),
            'by_type': {},
            'by_region': {}
        }

        for device_id, device in self.devices.items():
            # Count by type
            device_type = device['type']
            if device_type not in summary['by_type']:
                summary['by_type'][device_type] = []
            summary['by_type'][device_type].append(device_id)

            # Count by region
            region = device['region']
            if region not in summary['by_region']:
                summary['by_region'][region] = []
            summary['by_region'][region].append(device_id)

        return summary
