"""
Quantum Service Module

This module provides quantum computing functionality for Lambda-based
quantum key generation, including:
- AWS credentials management (IAM/STS)
- Quantum device management
- Post-quantum cryptography (ToyLWE)
- Quantum circuit execution
- Bell state generation

Note: This package is named 'quantum_service' to avoid conflicts with
the 'braket' package from amazon-braket-sdk.
"""

from .credentials import AWSCredentialsManager, credentials_manager
from .devices import QuantumDeviceManager
from .crypto import ToyLWE, QuantumResistantCrypto
from .quantum_service import EnhancedQuantumService
from .handlers import (
    handler,
    handler_options,
    handler_devices,
    handler_verify_credentials,
    handler_status,
    handler_health,
    get_quantum_service
)

__all__ = [
    # Credentials
    'AWSCredentialsManager',
    'credentials_manager',
    # Devices
    'QuantumDeviceManager',
    # Crypto
    'ToyLWE',
    'QuantumResistantCrypto',
    # Service
    'EnhancedQuantumService',
    # Handlers
    'handler',
    'handler_options',
    'handler_devices',
    'handler_verify_credentials',
    'handler_status',
    'handler_health',
    'get_quantum_service',
]

__version__ = '1.0.0'
