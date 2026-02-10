"""
Lambda Handlers Module

AWS Lambda function handlers for quantum key generation API:
- handler: Main quantum signature generation
- handler_options: CORS preflight
- handler_devices: List available devices
- handler_verify_credentials: Verify AWS permissions
"""

import json
import base64
import logging
import traceback
from typing import Dict, Any, Optional

from .credentials import credentials_manager
from .quantum_service import EnhancedQuantumService

# Configure logging
logger = logging.getLogger(__name__)

# Global service instance (reused across Lambda invocations for performance)
_quantum_service: Optional[EnhancedQuantumService] = None


def get_quantum_service() -> EnhancedQuantumService:
    """
    Get or create the quantum service instance.

    Uses lazy initialization to improve cold start time.
    Instance is reused across Lambda invocations.

    Returns:
        EnhancedQuantumService instance
    """
    global _quantum_service
    if _quantum_service is None:
        logger.info("Initializing EnhancedQuantumService...")
        _quantum_service = EnhancedQuantumService()
        logger.info("EnhancedQuantumService initialized")
    return _quantum_service


def _parse_request_body(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse request body from various Lambda event formats.

    Supports:
    - API Gateway REST API
    - API Gateway HTTP API (v2)
    - Lambda Function URL
    - Direct Lambda invocation

    Args:
        event: Lambda event dict

    Returns:
        Parsed body as dict
    """
    body = {}
    raw_body = event.get('body')

    # Handle base64 encoded body (Function URL / API Gateway)
    if event.get('isBase64Encoded', False) and raw_body:
        try:
            raw_body = base64.b64decode(raw_body).decode('utf-8')
            logger.debug(f"Decoded base64 body")
        except Exception as e:
            logger.warning(f"Failed to decode base64 body: {e}")

    # Parse the body
    if raw_body:
        if isinstance(raw_body, str):
            try:
                body = json.loads(raw_body)
            except json.JSONDecodeError as e:
                logger.warning(f"JSON decode error: {e}")
                body = {}
        elif isinstance(raw_body, dict):
            body = raw_body
    elif 'body' not in event:
        # Direct invocation - extract parameters from event
        excluded_keys = {
            'requestContext', 'headers', 'routeKey', 'rawPath',
            'rawQueryString', 'isBase64Encoded', 'version',
            'pathParameters', 'stageVariables', 'multiValueHeaders'
        }
        body = {k: v for k, v in event.items() if k not in excluded_keys}

    return body


def _build_response(status_code: int, body: Dict[str, Any],
                    extra_headers: Dict[str, str] = None) -> Dict[str, Any]:
    """
    Build Lambda response with CORS headers.

    Args:
        status_code: HTTP status code
        body: Response body dict
        extra_headers: Additional headers

    Returns:
        Lambda response dict
    """
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': '*',
    }

    if extra_headers:
        headers.update(extra_headers)

    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps(body)
    }


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for quantum key generation.

    Supports multiple input formats:
    - API Gateway/Function URL: body in event['body']
    - Direct invocation: parameters in event directly

    Request Parameters:
    - device: Quantum device ID (default: 'local_simulator')
    - name/sessionId: User identifier
    - message/sentiment: User message
    - timeframe: Optional timeframe parameter
    - verify_aws: If true, include AWS verification status

    Response:
    - success: bool
    - quantum_id: Normalized quantum identifier
    - quantum_number: Raw quantum random number
    - entanglement_data: Bell state probabilities
    - public_key: Generated public key (base64)
    - private_key: Generated private key (base64)
    - signature: Digital signature (base64)
    - algorithm: Cryptographic algorithm used
    - device_id/device_name/device_type: Device info
    - transaction_id/block_hash: Blockchain-like identifiers
    - timestamp: Generation timestamp
    - job_id: Unique job identifier
    - visual_properties: Display properties
    - processing_method: 'AWS Braket' or 'Local Simulation'

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API Gateway compatible response
    """
    logger.info(f"Received event type: {type(event)}")
    logger.debug(f"Event: {json.dumps(event, default=str)}")

    try:
        # Parse request body
        body = _parse_request_body(event)
        logger.info(f"Parsed request parameters")

        # Extract parameters with fallbacks
        device = body.get('device', 'local_simulator')
        name = body.get('sessionId',
                       body.get('session_id',
                               body.get('name', 'anonymous')))
        message = body.get('sentiment',
                          body.get('message', ''))
        timeframe = body.get('timeframe', '')

        # Combine message with timeframe if provided
        if timeframe:
            message = f"{message}:{timeframe}"

        # Get quantum service and process signature
        service = get_quantum_service()
        result = service.process_quantum_signature(name, message, device)

        # Add AWS verification status if requested
        if body.get('verify_aws', False):
            result['aws_verification'] = credentials_manager.verify_braket_permissions()

        # Add service status if requested
        if body.get('include_status', False):
            result['service_status'] = service.get_service_status()

        logger.info(f"Generated result for device {device}: success={result.get('success')}")

        return _build_response(200, result)

    except Exception as e:
        error_msg = str(e)
        stack_trace = traceback.format_exc()
        logger.error(f"Handler error: {error_msg}")
        logger.error(f"Stack trace: {stack_trace}")

        return _build_response(500, {
            'success': False,
            'error': error_msg,
            'trace': stack_trace
        })


def handler_options(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle CORS preflight (OPTIONS) requests.

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        CORS response
    """
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Max-Age': '86400',  # Cache preflight for 24 hours
        },
        'body': ''
    }


def handler_devices(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handler to list available quantum devices.

    Response includes device configurations and availability status.

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        Device list response
    """
    try:
        service = get_quantum_service()
        devices = service.device_manager.get_available_devices()

        # Add availability status to each device
        for device_id, device_info in devices.items():
            if device_id == 'local_simulator':
                device_info['status'] = 'Always Available'
                device_info['aws_configured'] = False
            elif device_id in service._aws_devices:
                device_info['status'] = 'AWS Connected'
                device_info['aws_configured'] = True
            else:
                device_info['status'] = 'Requires AWS Configuration'
                device_info['aws_configured'] = False

        return _build_response(200, {
            'success': True,
            'devices': devices,
            'device_count': len(devices)
        })

    except Exception as e:
        logger.error(f"handler_devices error: {e}")
        return _build_response(500, {
            'success': False,
            'error': str(e)
        })


def handler_verify_credentials(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handler to verify AWS Braket credentials.

    Checks if the Lambda execution role has proper Braket permissions.

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        Verification result
    """
    try:
        result = credentials_manager.verify_braket_permissions()

        status_code = 200 if result['success'] else 403

        return _build_response(status_code, result)

    except Exception as e:
        logger.error(f"handler_verify_credentials error: {e}")
        return _build_response(500, {
            'success': False,
            'error': str(e)
        })


def handler_status(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handler to get service status.

    Returns detailed status of the quantum service including:
    - SDK availability
    - Initialized devices
    - Cache status

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        Status response
    """
    try:
        service = get_quantum_service()
        status = service.get_service_status()

        # Add credentials status
        cred_status = credentials_manager.verify_braket_permissions()
        status['credentials'] = cred_status

        return _build_response(200, {
            'success': True,
            'status': status
        })

    except Exception as e:
        logger.error(f"handler_status error: {e}")
        return _build_response(500, {
            'success': False,
            'error': str(e)
        })


def handler_health(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Health check handler.

    Simple endpoint for load balancer health checks.

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        Health status
    """
    return _build_response(200, {
        'status': 'healthy',
        'service': 'quantum-key-generator'
    })
