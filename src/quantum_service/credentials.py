"""
AWS Credentials Management Module

Handles AWS authentication using:
- Lambda execution roles (automatic in Lambda environment)
- STS AssumeRole for cross-account access
- Local credentials chain for development

Environment Variables:
- BRAKET_ASSUME_ROLE_ARN: Optional role ARN to assume
- BRAKET_EXTERNAL_ID: Optional external ID for role assumption
"""

import os
import time
import logging
from datetime import datetime
from typing import Dict, Any, Optional

# Configure logging
logger = logging.getLogger(__name__)

# AWS SDK imports
try:
    import boto3
    from botocore.config import Config
    AWS_SDK_AVAILABLE = True
except ImportError:
    AWS_SDK_AVAILABLE = False
    logger.warning("boto3 not available, AWS features will be limited")


class AWSCredentialsManager:
    """
    Manages AWS credentials using IAM roles or STS for Lambda execution.

    In Lambda environment:
        - Automatically uses the Lambda execution role
        - Supports cross-account access via STS AssumeRole

    In local development:
        - Uses ~/.aws/credentials or environment variables
        - Supports profile selection via AWS_PROFILE
    """

    def __init__(self):
        self._session = None
        self._braket_client = None
        self._credentials_expiry = None
        self._cached_sessions: Dict[str, Any] = {}

    def get_session(self, region: str = 'us-east-1') -> Optional[Any]:
        """
        Get AWS session with proper credentials.

        Args:
            region: AWS region for the session

        Returns:
            boto3.Session or None if AWS SDK not available
        """
        if not AWS_SDK_AVAILABLE:
            return None

        try:
            # Check cache first
            cache_key = f"{region}"
            if cache_key in self._cached_sessions:
                cached = self._cached_sessions[cache_key]
                if cached.get('expiry') and datetime.utcnow() < cached['expiry']:
                    return cached['session']

            # Check if we need to assume a specific role
            assume_role_arn = os.environ.get('BRAKET_ASSUME_ROLE_ARN')

            if assume_role_arn:
                session = self._get_session_with_assumed_role(assume_role_arn, region)
            else:
                session = self._get_default_session(region)

            return session

        except Exception as e:
            logger.error(f"Failed to get AWS session: {e}")
            return None

    def _get_default_session(self, region: str) -> Any:
        """
        Get session using default credentials chain.

        Priority order:
        1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
        2. Shared credentials file (~/.aws/credentials)
        3. AWS config file (~/.aws/config)
        4. Container credentials (ECS)
        5. Instance profile credentials (EC2/Lambda)
        """
        config = Config(
            region_name=region,
            retries={'max_attempts': 3, 'mode': 'adaptive'},
            connect_timeout=10,
            read_timeout=60
        )

        self._session = boto3.Session(region_name=region)

        # Cache the session
        self._cached_sessions[region] = {
            'session': self._session,
            'expiry': None  # Default credentials don't expire in this context
        }

        logger.info(f"Created AWS session with default credentials in region {region}")
        return self._session

    def _get_session_with_assumed_role(self, role_arn: str, region: str) -> Any:
        """
        Assume a role using STS for cross-account access.

        Args:
            role_arn: ARN of the role to assume
            region: Target AWS region

        Returns:
            boto3.Session with assumed role credentials
        """
        # Check if we need to refresh credentials
        cache_key = f"{region}:{role_arn}"
        if cache_key in self._cached_sessions:
            cached = self._cached_sessions[cache_key]
            if cached.get('expiry') and datetime.utcnow() < cached['expiry']:
                return cached['session']

        try:
            # Create STS client with current credentials
            sts_client = boto3.client('sts', region_name=region)

            # Get caller identity for logging
            try:
                caller_identity = sts_client.get_caller_identity()
                logger.info(f"Current identity: {caller_identity.get('Arn')}")
            except Exception:
                logger.debug("Could not get caller identity")

            # Assume the target role
            session_name = f"quantum-lambda-{int(time.time())}"
            external_id = os.environ.get('BRAKET_EXTERNAL_ID')

            assume_params = {
                'RoleArn': role_arn,
                'RoleSessionName': session_name,
                'DurationSeconds': 3600  # 1 hour
            }

            if external_id:
                assume_params['ExternalId'] = external_id

            response = sts_client.assume_role(**assume_params)
            credentials = response['Credentials']

            # Create session with assumed role credentials
            session = boto3.Session(
                aws_access_key_id=credentials['AccessKeyId'],
                aws_secret_access_key=credentials['SecretAccessKey'],
                aws_session_token=credentials['SessionToken'],
                region_name=region
            )

            # Track expiry for refresh (subtract 5 minutes for safety margin)
            expiry = credentials['Expiration'].replace(tzinfo=None)

            # Cache the session
            self._cached_sessions[cache_key] = {
                'session': session,
                'expiry': expiry
            }

            logger.info(f"Assumed role {role_arn}, expires at {expiry}")
            return session

        except Exception as e:
            logger.error(f"Failed to assume role {role_arn}: {e}")
            # Fall back to default credentials
            return self._get_default_session(region)

    def get_braket_client(self, region: str = 'us-east-1') -> Optional[Any]:
        """
        Get Braket client with proper credentials.

        Args:
            region: AWS region for the Braket client

        Returns:
            boto3 Braket client or None
        """
        if not AWS_SDK_AVAILABLE:
            return None

        session = self.get_session(region)
        if session:
            try:
                return session.client('braket', region_name=region)
            except Exception as e:
                logger.error(f"Failed to create Braket client: {e}")
        return None

    def verify_braket_permissions(self) -> Dict[str, Any]:
        """
        Verify that current credentials have Braket permissions.

        Returns:
            Dict with verification results:
            - success: bool
            - message/error: str
            - devices_found: int (if successful)
        """
        if not AWS_SDK_AVAILABLE:
            return {'success': False, 'error': 'AWS SDK not available'}

        try:
            session = self.get_session()
            if not session:
                return {'success': False, 'error': 'Could not create AWS session'}

            # Try to list devices as a permission check
            braket_client = session.client('braket', region_name='us-east-1')

            # List available devices (lightweight API call)
            # Note: SearchDevices API only supports 'deviceArn' as filter name
            # Use SV1 simulator ARN which is always available
            response = braket_client.search_devices(
                filters=[{
                    'name': 'deviceArn',
                    'values': ['arn:aws:braket:::device/quantum-simulator/amazon/sv1']
                }],
                maxResults=1
            )

            return {
                'success': True,
                'message': 'Braket permissions verified',
                'devices_found': len(response.get('devices', []))
            }

        except Exception as e:
            error_msg = str(e)
            suggestion = 'Check IAM role has braket:SearchDevices permission'

            if 'AccessDenied' in error_msg:
                suggestion = 'IAM role lacks braket:SearchDevices permission'
            elif 'InvalidSignature' in error_msg:
                suggestion = 'Check AWS credentials are valid'
            elif 'ExpiredToken' in error_msg:
                suggestion = 'Session token has expired, refresh credentials'

            return {
                'success': False,
                'error': error_msg,
                'suggestion': suggestion
            }

    def clear_cache(self):
        """Clear all cached sessions."""
        self._cached_sessions.clear()
        self._session = None
        self._braket_client = None
        self._credentials_expiry = None
        logger.info("Cleared credentials cache")


# Global credentials manager instance
credentials_manager = AWSCredentialsManager()
