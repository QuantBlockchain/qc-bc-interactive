"""
Lambda Quantum Keys - Entry Point

This module serves as the main entry point for the Lambda function.
All implementation details are organized in the `quantum_service` package.

Package Structure:
    quantum_service/
    ├── __init__.py         # Package exports
    ├── credentials.py      # AWS IAM/STS credential management
    ├── devices.py          # Quantum device configurations
    ├── crypto.py           # Post-quantum cryptography (ToyLWE)
    ├── quantum_service.py  # Core quantum computing service
    └── handlers.py         # Lambda function handlers

Handlers:
    - handler: Main quantum signature generation
    - handler_options: CORS preflight requests
    - handler_devices: List available quantum devices
    - handler_verify_credentials: Verify AWS Braket permissions
    - handler_status: Service status information
    - handler_health: Health check endpoint

Usage:
    # In Lambda configuration, set handler to one of:
    # - lambda_quantum_keys.handler
    # - lambda_quantum_keys.handler_devices
    # - lambda_quantum_keys.handler_verify_credentials

Environment Variables:
    - BRAKET_ASSUME_ROLE_ARN: Optional role ARN for cross-account access
    - BRAKET_EXTERNAL_ID: Optional external ID for role assumption

IAM Permissions Required:
    - braket:SearchDevices
    - braket:GetDevice
    - braket:CreateQuantumTask
    - braket:GetQuantumTask
    - braket:CancelQuantumTask
    - s3:PutObject (for amazon-braket-* buckets)
    - s3:GetObject (for amazon-braket-* buckets)
"""

# Re-export all handlers from the quantum_service package
from quantum_service.handlers import (
    handler,
    handler_options,
    handler_devices,
    handler_verify_credentials,
    handler_status,
    handler_health,
    get_quantum_service,
)

# Re-export key classes for direct usage
from quantum_service.credentials import AWSCredentialsManager, credentials_manager
from quantum_service.devices import QuantumDeviceManager
from quantum_service.crypto import ToyLWE, QuantumResistantCrypto
from quantum_service.quantum_service import EnhancedQuantumService

# Package metadata
__version__ = '1.0.0'
__author__ = 'Quantum Signature Wall Team'

__all__ = [
    # Lambda Handlers
    'handler',
    'handler_options',
    'handler_devices',
    'handler_verify_credentials',
    'handler_status',
    'handler_health',
    'get_quantum_service',
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
]


# ============================================================================
# Local Testing Support
# ============================================================================

if __name__ == "__main__":
    import json

    print("=" * 60)
    print("Quantum Key Generator - Local Test")
    print("=" * 60)

    # Test 1: Basic signature generation
    print("\n[Test 1] Basic signature generation with local simulator...")
    test_event = {
        'body': json.dumps({
            'device': 'local_simulator',
            'name': 'Test User',
            'message': 'Hello Quantum World',
        })
    }

    result = handler(test_event, None)
    response = json.loads(result['body'])

    print(f"Status Code: {result['statusCode']}")
    print(f"Success: {response.get('success')}")
    print(f"Quantum Number: {response.get('quantum_number')}")
    print(f"Device: {response.get('device_name')}")
    print(f"Algorithm: {response.get('algorithm')}")

    # Test 2: List devices
    print("\n[Test 2] List available devices...")
    devices_result = handler_devices({}, None)
    devices_response = json.loads(devices_result['body'])

    print(f"Total devices: {devices_response.get('device_count')}")
    for device_id, info in devices_response.get('devices', {}).items():
        print(f"  - {device_id}: {info.get('name')} ({info.get('status')})")

    # Test 3: Verify credentials
    print("\n[Test 3] Verify AWS credentials...")
    cred_result = handler_verify_credentials({}, None)
    cred_response = json.loads(cred_result['body'])

    print(f"Credentials valid: {cred_response.get('success')}")
    if not cred_response.get('success'):
        print(f"Error: {cred_response.get('error')}")
        print(f"Suggestion: {cred_response.get('suggestion')}")

    # Test 4: Service status
    print("\n[Test 4] Service status...")
    status_result = handler_status({}, None)
    status_response = json.loads(status_result['body'])

    if status_response.get('success'):
        status = status_response.get('status', {})
        print(f"Braket SDK available: {status.get('braket_sdk_available')}")
        print(f"AWS SDK available: {status.get('aws_sdk_available')}")
        print(f"Local simulator ready: {status.get('local_simulator_ready')}")
        print(f"AWS devices: {status.get('aws_devices_initialized', [])}")

    print("\n" + "=" * 60)
    print("Tests completed!")
    print("=" * 60)
