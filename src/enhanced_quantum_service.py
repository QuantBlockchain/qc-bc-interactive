import asyncio
import hashlib
import json
import random
import time
import sqlite3
from datetime import datetime
from typing import Dict, Any, List, Optional
import threading
import secrets
import base64
import logging
import boto3
from braket.aws import AwsDevice
from braket.circuits import Circuit
from braket.devices import LocalSimulator
import math
import numpy as np
from typing import Dict, Tuple, Optional
# AHS imports (current SDK style)
from braket.tasks.analog_hamiltonian_simulation_quantum_task_result import (
    AnalogHamiltonianSimulationQuantumTaskResult as AhsResult
)
from braket.ahs.atom_arrangement import AtomArrangement
from braket.ahs.driving_field import DrivingField
from braket.ahs.analog_hamiltonian_simulation import AnalogHamiltonianSimulation
from braket.timings.time_series import TimeSeries

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class QuantumDeviceManager:
    """Manages different quantum devices and their capabilities"""

    def __init__(self):
        self.devices = {
            'local_simulator': {
                'name': 'Local Simulator',
                'type': 'simulator',
                'arn': 'local://simulator',
                'region': 'local',
                'description': 'Fast local quantum circuit simulator',
                'advantages': ['Immediate results', 'No cost', 'Always available'],
                'typical_runtime': '< 1 second',
                'max_qubits': 34,
                'supports_bell_states': True,
                'async_required': False
            },
            'aws_sv1': {
                'name': 'AWS SV1 Simulator',
                'type': 'managed_simulator',
                'arn': 'arn:aws:braket:::device/quantum-simulator/amazon/sv1',
                'region': 'us-east-1',
                'description': 'AWS managed state vector quantum simulator',
                'advantages': ['High performance', 'Up to 34 qubits', 'Cloud scalability'],
                'typical_runtime': '1-5 seconds',
                'max_qubits': 34,
                'supports_bell_states': True,
                'async_required': True
            },
            'ionq_forte': {
                'name': 'IonQ Forte Enterprise',
                'type': 'qpu',
                'arn': 'arn:aws:braket:us-east-1::device/qpu/ionq/Forte-Enterprise-1',
                'region': 'us-east-1',
                'description': 'IonQ trapped ion quantum processor',
                'advantages': ['Real quantum hardware', 'High fidelity', 'All-to-all connectivity'],
                'typical_runtime': '5-30 minutes',
                'max_qubits': 32,
                'supports_bell_states': True,
                'async_required': True
            },
            'iqm_garnet': {
                'name': 'IQM Garnet',
                'type': 'qpu',
                'arn': 'arn:aws:braket:eu-north-1::device/qpu/iqm/Emerald',
                'region': 'eu-north-1',
                'description': 'IQM superconducting quantum processor',
                'advantages': ['European quantum hardware', 'Superconducting qubits', 'Fast gates'],
                'typical_runtime': '10-45 minutes',
                'max_qubits': 20,
                'supports_bell_states': True,
                'async_required': True
            },
            'quera_aquila': {
                'name': 'QuEra Aquila',
                'type': 'qpu',
                'arn': 'arn:aws:braket:us-east-1::device/qpu/quera/Aquila',
                'region': 'us-east-1',
                'description': 'QuEra neutral atom quantum processor',
                'advantages': ['Neutral atom technology', 'Programmable topology', 'Analog quantum simulation'],
                'typical_runtime': '15-60 minutes',
                'max_qubits': 256,
                'supports_bell_states': False,  # Different paradigm
                'async_required': True
            },
            'rigetti_ankaa3': {
                'name': 'Rigetti Ankaa-3',
                'type': 'qpu',
                'arn': 'arn:aws:braket:us-west-1::device/qpu/rigetti/Ankaa-3',
                'region': 'us-west-1',
                'description': 'Rigetti superconducting quantum processor',
                'advantages': ['Parametric gates', 'Fast execution', 'NISQ algorithms'],
                'typical_runtime': '5-20 minutes',
                'max_qubits': 84,
                'supports_bell_states': True,
                'async_required': True
            }
        }

    def get_device_info(self, device_id: str) -> Dict[str, Any]:
        """Get information about a specific device"""
        return self.devices.get(device_id, {})

    def get_available_devices(self) -> Dict[str, Dict[str, Any]]:
        """Get all available devices"""
        return self.devices

    def get_device_by_type(self, device_type: str) -> List[Dict[str, Any]]:
        """Get devices by type (simulator, managed_simulator, qpu)"""
        return [
            {**device, 'id': device_id}
            for device_id, device in self.devices.items()
            if device['type'] == device_type
        ]


class AsyncQuantumJobManager:
    """Manages asynchronous quantum jobs"""

    def __init__(self, db_path: str = "quantum_jobs.db"):
        self.db_path = db_path
        self.lock = threading.Lock()
        self._init_database()
        self.active_jobs = {}

    def _init_database(self):
        """Initialize job tracking database"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS quantum_jobs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id TEXT UNIQUE NOT NULL,
                    signature_id INTEGER,
                    device_id TEXT NOT NULL,
                    device_arn TEXT NOT NULL,
                    user_name TEXT NOT NULL,
                    user_message TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    submitted_at DATETIME,
                    completed_at DATETIME,
                    result_data TEXT,
                    error_message TEXT,
                    estimated_completion DATETIME
                )
            """)
            conn.commit()

    def create_job(self, device_id: str, device_arn: str, user_name: str, user_message: str) -> str:
        """Create a new quantum job"""
        job_id = f"qjob_{int(time.time())}_{secrets.token_hex(8)}"

        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO quantum_jobs
                    (job_id, device_id, device_arn, user_name, user_message, status)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (job_id, device_id, device_arn, user_name, user_message, 'created'))
                conn.commit()

        return job_id

    def update_job_status(self, job_id: str, status: str, **kwargs):
        """Update job status and additional data"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                # Build dynamic update query
                set_clauses = ['status = ?']
                values = [status]

                for key, value in kwargs.items():
                    if key in ['submitted_at', 'completed_at', 'result_data', 'error_message', 'estimated_completion', 'signature_id']:
                        set_clauses.append(f'{key} = ?')
                        values.append(value)

                values.append(job_id)

                conn.execute(f"""
                    UPDATE quantum_jobs
                    SET {', '.join(set_clauses)}
                    WHERE job_id = ?
                """, values)
                conn.commit()

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job information"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("SELECT * FROM quantum_jobs WHERE job_id = ?", (job_id,))
                row = cursor.fetchone()
                return dict(row) if row else None

    def get_pending_jobs(self) -> List[Dict[str, Any]]:
        """Get all pending jobs"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("""
                    SELECT * FROM quantum_jobs
                    WHERE status IN ('created', 'submitted', 'running')
                    ORDER BY created_at ASC
                """)
                return [dict(row) for row in cursor.fetchall()]

    def get_recent_jobs(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent jobs"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("""
                    SELECT * FROM quantum_jobs
                    ORDER BY created_at DESC
                    LIMIT ?
                """, (limit,))
                return [dict(row) for row in cursor.fetchall()]

    def get_job_stats(self) -> Dict[str, Any]:
        """Get job statistics"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row

                # Count jobs by status
                cursor = conn.execute("""
                    SELECT status, COUNT(*) as count FROM quantum_jobs
                    GROUP BY status
                """)
                status_counts = dict(cursor.fetchall())

                # Calculate average duration for completed jobs
                cursor = conn.execute("""
                    SELECT AVG(JULIANDAY(completed_at) - JULIANDAY(created_at)) * 24 * 60 as avg_minutes
                    FROM quantum_jobs
                    WHERE status = 'completed' AND completed_at IS NOT NULL
                """)
                avg_duration_result = cursor.fetchone()
                avg_duration = avg_duration_result[0] if avg_duration_result[0] else 0

                return {
                    'active': status_counts.get('running', 0) + status_counts.get('submitted', 0) + status_counts.get('created', 0),
                    'completed': status_counts.get('completed', 0),
                    'failed': status_counts.get('failed', 0),
                    'avg_duration': f"{avg_duration:.1f} min" if avg_duration > 0 else "N/A"
                }

    def get_active_jobs(self) -> List[Dict[str, Any]]:
        """Get active jobs with user information"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("""
                    SELECT j.*, 'Unknown User' as user_name
                    FROM quantum_jobs j
                    WHERE j.status IN ('created', 'submitted', 'running')
                    ORDER BY j.created_at ASC
                """)
                return [dict(row) for row in cursor.fetchall()]

    def get_device_stats(self) -> Dict[str, Any]:
        """Get device performance statistics"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("""
                    SELECT device_id,
                           COUNT(*) as jobs,
                           AVG(CASE
                               WHEN status = 'completed' AND completed_at IS NOT NULL
                               THEN (JULIANDAY(completed_at) - JULIANDAY(created_at)) * 24 * 60
                               ELSE NULL
                           END) as avg_time
                    FROM quantum_jobs
                    GROUP BY device_id
                """)

                device_stats = {}
                for row in cursor.fetchall():
                    row_dict = dict(row)
                    avg_time = row_dict['avg_time']
                    # Ensure avg_time is positive and meaningful
                    if avg_time is not None and avg_time > 0:
                        avg_time_str = f"{avg_time:.1f}"
                    else:
                        avg_time_str = "N/A"

                    device_stats[row_dict['device_id']] = {
                        'jobs': row_dict['jobs'],
                        'avg_time': avg_time_str
                    }

                return device_stats

    def get_job_status_by_device(self) -> Dict[str, Dict[str, int]]:
        """Get job status breakdown by device"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("""
                    SELECT device_id, status, COUNT(*) as count
                    FROM quantum_jobs
                    GROUP BY device_id, status
                """)

                device_status = {}
                for row in cursor.fetchall():
                    device_id = row['device_id']
                    status = row['status']
                    count = row['count']

                    if device_id not in device_status:
                        device_status[device_id] = {"active": 0, "completed": 0, "failed": 0}

                    if status in ['created', 'submitted', 'running']:
                        device_status[device_id]["active"] += count
                    elif status == 'completed':
                        device_status[device_id]["completed"] += count
                    elif status == 'failed':
                        device_status[device_id]["failed"] += count

                return device_status

    def get_job_stats(self) -> Dict[str, Any]:
        """Get overall job statistics"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("""
                    SELECT
                        SUM(CASE WHEN status IN ('created', 'submitted', 'running') THEN 1 ELSE 0 END) as active,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                        AVG(CASE
                            WHEN status = 'completed' AND completed_at IS NOT NULL
                            THEN (JULIANDAY(completed_at) - JULIANDAY(created_at)) * 24 * 60
                            ELSE NULL
                        END) as avg_duration
                    FROM quantum_jobs
                """)
                row = cursor.fetchone()

                avg_time = row['avg_duration']
                avg_duration_str = f"{avg_time:.1f} min" if avg_time and avg_time > 0 else "N/A"

                return {
                    "active": row['active'] or 0,
                    "completed": row['completed'] or 0,
                    "failed": row['failed'] or 0,
                    "avg_duration": avg_duration_str
                }

    def clear_all_jobs(self) -> Dict[str, Any]:
        """Clear all quantum jobs from the database (admin function)"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("SELECT COUNT(*) FROM quantum_jobs")
                count_before = cursor.fetchone()[0]
                conn.execute("DELETE FROM quantum_jobs")
                conn.commit()
                return {
                    'success': True,
                    'message': f'Cleared {count_before} quantum jobs',
                    'jobs_removed': count_before
                }

    def get_job_by_id(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job details by ID"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("""
                    SELECT *, 'Unknown User' as user_name FROM quantum_jobs
                    WHERE job_id = ?
                """, (job_id,))
                row = cursor.fetchone()
                return dict(row) if row else None


class EnhancedQuantumService:
    """Enhanced quantum service with multi-device support"""

    def __init__(self):
        self.local_simulator = LocalSimulator()
        self.device_manager = QuantumDeviceManager()
        self.job_manager = AsyncQuantumJobManager()
        self._circuit_cache = {}
        self._aws_devices = {}
        self._aws_session = None
        self._initialize_aws_session()

    async def process_quantum_signature(self, name: str, response: str, quantum_device: str) -> Dict[str, Any]:
        """Process quantum signature with dual device generation - main entry point"""
        try:
            device_info = self.device_manager.get_device_info(quantum_device)
            if not device_info:
                return {
                    'success': False,
                    'error': f'Unknown quantum device: {quantum_device}'
                }

            # Always create two separate quantum tasks:
            # Task 1: Local simulator (always runs immediately)
            local_job_id = self.job_manager.create_job(
                'local_simulator', 'local://simulator', name, f"{response}_local"
            )

            # Task 2: User-selected device
            device_job_id = self.job_manager.create_job(
                quantum_device, device_info['arn'], name, f"{response}_device"
            )

            # Process local simulator immediately
            start_time = datetime.now()
            self.job_manager.update_job_status(local_job_id, 'running')

            seed = f"{name}:{response}:local:{time.time()}"
            local_quantum_number = await self._generate_quantum_random_number('local_simulator', seed)
            local_entanglement_data = await self._create_bell_state_circuit('local_simulator')

            end_time = datetime.now()
            duration_ms = (end_time - start_time).total_seconds() * 1000

            local_result = {
                'quantum_number': local_quantum_number,
                'entanglement_data': local_entanglement_data,
                'device_name': 'Local Simulator',
                'device_type': 'simulator',
                'processing_time_ms': duration_ms
            }

            self.job_manager.update_job_status(
                local_job_id, 'completed',
                completed_at=end_time.isoformat(),
                result_data=json.dumps(local_result)
            )

            # Handle user-selected device
            if device_info.get('async_required', False):
                # Start background task for user-selected device
                asyncio.create_task(self._process_quantum_job_for_signature(device_job_id, quantum_device, name, response))

                # Return response with both job IDs
                return {
                    'success': True,
                    'dual_mode': True,
                    'quantum_number': local_quantum_number,  # Use local for immediate display
                    'entanglement_data': local_entanglement_data,  # Use local for immediate display
                    'local_job_id': local_job_id,
                    'device_job_id': device_job_id,
                    'device_info': {
                        'name': device_info['name'],
                        'device_job_id': device_job_id,
                        'local_job_id': local_job_id,
                        'type': device_info['type'],
                        'estimated_completion': self._estimate_completion_time(device_info)
                    },
                    'local_result': local_result
                }
            else:
                # Process user device immediately (for non-async devices like local_simulator)
                start_time = datetime.now()
                self.job_manager.update_job_status(device_job_id, 'running')

                device_seed = f"{name}:{response}:device:{time.time()}"
                device_quantum_number = await self._generate_quantum_random_number(quantum_device, device_seed)
                device_entanglement_data = await self._create_bell_state_circuit(quantum_device)

                end_time = datetime.now()
                duration_ms = (end_time - start_time).total_seconds() * 1000

                device_result = {
                    'quantum_number': device_quantum_number,
                    'entanglement_data': device_entanglement_data,
                    'device_name': device_info['name'],
                    'device_type': device_info['type'],
                    'processing_time_ms': duration_ms
                }

                self.job_manager.update_job_status(
                    device_job_id, 'completed',
                    completed_at=end_time.isoformat(),
                    result_data=json.dumps(device_result)
                )

                return {
                    'success': True,
                    'dual_mode': True,
                    'quantum_number': local_quantum_number,  # Use local for display
                    'entanglement_data': local_entanglement_data,  # Use local for display
                    'local_job_id': local_job_id,
                    'device_job_id': device_job_id,
                    'device_info': {
                        'name': device_info['name'],
                        'device_job_id': device_job_id,
                        'local_job_id': local_job_id
                    },
                    'local_result': local_result,
                    'device_result': device_result
                }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def generate_visual_properties(self, quantum_number: int, entanglement_data: List[float], device_id: str = "local_simulator") -> Dict[str, Any]:
        """Generate visual properties for signature wall - public interface"""
        return self._generate_device_specific_visuals(device_id, quantum_number, entanglement_data)

    async def generate_quantum_signature_async(self, device_id: str, name: str, message: str) -> Dict[str, Any]:
        """Generate quantum signature with device selection"""
        device_info = self.device_manager.get_device_info(device_id)

        if not device_info:
            raise ValueError(f"Unknown device: {device_id}")

        if device_info['async_required'] and device_id != 'local_simulator':
            # Create async job for real quantum hardware
            job_id = self.job_manager.create_job(
                device_id, device_info['arn'], name, message
            )

            # Start background task
            asyncio.create_task(self._process_quantum_job(job_id, device_id, name, message))

            return {
                'success': True,
                'async': True,
                'job_id': job_id,
                'device': device_info,
                'estimated_completion': self._estimate_completion_time(device_info),
                'message': f'Quantum job submitted to {device_info["name"]}. Processing will take approximately {device_info["typical_runtime"]}.'
            }
        else:
            # Process immediately for local simulator
            return await self._generate_signature_sync(device_id, name, message)

    async def _process_quantum_job(self, job_id: str, device_id: str, name: str, message: str):
        """Process quantum job asynchronously"""
        try:
            device_info = self.device_manager.get_device_info(device_id)

            # Update job status to submitted
            self.job_manager.update_job_status(
                job_id, 'submitted',
                submitted_at=datetime.now().isoformat(),
                estimated_completion=self._estimate_completion_time(device_info)
            )

            # Simulate quantum processing (in real implementation, this would use actual AWS Braket)
            await self._simulate_quantum_processing(job_id, device_info)

            # Generate results
            result = await self._generate_signature_sync(device_id, name, message, job_id)

            # Update job with results
            self.job_manager.update_job_status(
                job_id, 'completed',
                completed_at=datetime.now().isoformat(),
                result_data=json.dumps(result),
                signature_id=result.get('signature_id')
            )

            logger.info(f"Quantum job {job_id} completed successfully")

        except Exception as e:
            logger.error(f"Quantum job {job_id} failed: {str(e)}")
            self.job_manager.update_job_status(
                job_id, 'failed',
                completed_at=datetime.now().isoformat(),
                error_message=str(e)
            )

    async def _process_quantum_job_for_signature(self, job_id: str, device_id: str, name: str, response: str):
        """Process quantum job asynchronously for signature creation"""
        try:
            device_info = self.device_manager.get_device_info(device_id)

            # Update job status to submitted
            self.job_manager.update_job_status(
                job_id, 'submitted',
                submitted_at=datetime.now().isoformat(),
                estimated_completion=self._estimate_completion_time(device_info)
            )

            # Simulate quantum processing
            await self._simulate_quantum_processing(job_id, device_info)

            # Generate quantum results
            seed = f"{name}:{response}:{time.time()}"
            quantum_number = await self._generate_quantum_random_number(device_id, seed)
            entanglement_data = await self._create_bell_state_circuit(device_id)

            # Create the result data
            result = {
                'quantum_number': quantum_number,
                'entanglement_data': entanglement_data,
                'device_name': device_info['name'],
                'device_type': device_info['type']
            }

            # Update job with results
            self.job_manager.update_job_status(
                job_id, 'completed',
                completed_at=datetime.now().isoformat(),
                result_data=json.dumps(result)
            )

            # Update the signature database with device results
            await self._update_signature_with_device_results(job_id, quantum_number, entanglement_data)

            logger.info(f"Quantum signature job {job_id} completed successfully on {device_info['name']}")

        except Exception as e:
            logger.error(f"Quantum signature job {job_id} failed: {str(e)}")
            self.job_manager.update_job_status(
                job_id, 'failed',
                completed_at=datetime.now().isoformat(),
                error_message=str(e)
            )

    async def _update_signature_with_device_results(self, device_job_id: str, quantum_number: int, entanglement_data: list):
        """Update signature database with device quantum results and generate device signature"""
        try:
            from signature_wall_system import SignatureWallDatabase, QuantumResistantCrypto
            database = SignatureWallDatabase()
            crypto_service = QuantumResistantCrypto()

            # Find signature with this device_job_id
            import sqlite3
            with sqlite3.connect(database.db_path) as conn:
                # Get the signature data first
                cursor = conn.execute("""
                    SELECT id, name, response FROM signatures
                    WHERE device_job_id = ?
                """, (device_job_id,))
                signature_row = cursor.fetchone()

                if signature_row:
                    signature_id, name, response = signature_row

                    # Generate device signature using device quantum results
                    device_keypair = crypto_service.generate_quantum_keypair(quantum_number)
                    device_message_to_sign = f"{name}|{response}|{quantum_number}|device"
                    device_signature = crypto_service.sign_message(
                        device_message_to_sign,
                        device_keypair['private_key'],
                        quantum_number
                    )

                    # Update with device results and signature
                    conn.execute("""
                        UPDATE signatures
                        SET device_quantum_number = ?, device_entanglement_data = ?,
                            device_signature = ?, device_public_key = ?, device_private_key = ?
                        WHERE device_job_id = ?
                    """, (
                        quantum_number,
                        json.dumps(entanglement_data),
                        device_signature,
                        device_keypair['public_key'],
                        device_keypair['private_key'],
                        device_job_id
                    ))
                    conn.commit()
                    logger.info(f"Updated signature {signature_id} with device results and device signature for job {device_job_id}")
                else:
                    logger.warning(f"No signature found for device job {device_job_id}")

        except Exception as e:
            logger.error(f"Failed to update signature with device results: {e}")

    async def _simulate_quantum_processing(self, job_id: str, device_info: Dict[str, Any]):
        """Simulate quantum processing delay"""
        # Update to running status
        self.job_manager.update_job_status(job_id, 'running')

        # Simulate processing time based on device type
        if device_info['type'] == 'managed_simulator':
            await asyncio.sleep(2)  # 2 seconds for AWS SV1
        elif device_info['type'] == 'qpu':
            # Simulate queue wait + execution time
            if 'ionq' in device_info['arn']:
                await asyncio.sleep(5)  # 5 seconds (simulated)
            elif 'iqm' in device_info['arn']:
                await asyncio.sleep(7)  # 7 seconds (simulated)
            elif 'quera' in device_info['arn']:
                await asyncio.sleep(10)  # 10 seconds (simulated)
            elif 'rigetti' in device_info['arn']:
                await asyncio.sleep(4)  # 4 seconds (simulated)

    async def _generate_signature_sync(self, device_id: str, name: str, message: str, job_id: str = None) -> Dict[str, Any]:
        """Generate signature synchronously"""
        device_info = self.device_manager.get_device_info(device_id)

        # Generate quantum data with device-specific characteristics
        seed = f"{name}:{message}:{time.time()}"
        quantum_number = await self._generate_quantum_random_number(device_id, seed)
        entanglement_data = await self._create_bell_state_circuit(device_id)

        # Import the rest of the signature creation logic
        from signature_wall_system import QuantumResistantCrypto, SignatureWallDatabase, QuantumSignatureWallSystem

        crypto_service = QuantumResistantCrypto()
        database = SignatureWallDatabase()

        # Generate quantum-resistant keypair
        keypair = crypto_service.generate_quantum_keypair(quantum_number)

        # Create digital signature
        message_to_sign = f"{name}|{message}|{quantum_number}|{device_id}"
        signature = crypto_service.sign_message(
            message_to_sign,
            keypair['private_key'],
            quantum_number
        )

        # Generate visual properties with device-specific enhancements
        visual_props = self._generate_device_specific_visuals(device_id, quantum_number, entanglement_data)

        # Blockchain data
        timestamp = datetime.now().isoformat()
        transaction_id = hashlib.sha256(f"{name}{message}{timestamp}{device_id}".encode()).hexdigest()[:16]
        block_hash = hashlib.sha256(f"{transaction_id}{signature}".encode()).hexdigest()

        # Prepare signature data
        signature_data = {
            'name': name,
            'response': message,
            'quantum_number': quantum_number,
            'entanglement_data': entanglement_data,
            'transaction_id': transaction_id,
            'block_hash': block_hash,
            'timestamp': timestamp,
            'public_key': keypair['public_key'],
            'private_key': keypair['private_key'],
            'signature': signature,
            'signature_algorithm': f"{keypair['algorithm']}-{device_id}",
            'visual_color': visual_props['color'],
            'position_x': visual_props['position_x'],
            'position_y': visual_props['position_y'],
            'device_id': device_id,
            'device_name': device_info['name'],
            'job_id': job_id
        }

        # Store in database
        signature_id = database.add_signature(signature_data)

        return {
            'success': True,
            'async': False,
            'signature_id': signature_id,
            'device': device_info,
            'visual_properties': visual_props,
            **signature_data
        }
    
    async def _ahs_from_seed(self, device_id: str, seed_text: str) -> int:
        # Map AHS per-site states to bits: 'g' (ground)->0, 'r' (Rydberg)->1, 'e' (empty)->0
        STATE_TO_BIT = {"g": "0", "r": "1", "e": "0"}

        def ahs_from_seed(seed_text: str, num_atoms: int = 8) -> AnalogHamiltonianSimulation:
            um = 1e-6  # micrometers in meters

            # 1) Atom register (simple 1D chain; you can choose any layout you want)
            register = AtomArrangement()
            for i in range(num_atoms):
                register.add(np.array([i * 5 * um, 0.0]))

            # 2) Global driving field (Ω, Δ, φ) with seed-conditioned ramps
            T = 4e-6
            base = 1.0 + (abs(hash(seed_text)) % 5)
            omega_max = min(1580000, 2 * math.pi * base * 1e6)
            delta_span = 2 * math.pi * 1e6

            omega = TimeSeries().put(0.0, 0.0).put(T/2, omega_max).put(T, 0.0)
            delta = TimeSeries().put(0.0, -delta_span).put(T, +delta_span)
            phi   = TimeSeries().put(0.0, 0.0).put(T, 0.0)

            drive = DrivingField(amplitude=omega, detuning=delta, phase=phi)

            # 3) Build the AHS program object
            ahs_program = AnalogHamiltonianSimulation(register=register, hamiltonian=drive)
            return ahs_program
        

        def _spin_config_to_int(spin_config: str, mapping: Dict[str, str] = STATE_TO_BIT) -> int:
            """Convert an AHS spin configuration (e.g., 'grrg') to an integer."""
            bitstr = "".join(mapping.get(ch, "0") for ch in spin_config)
            return int(bitstr, 2) if bitstr else 0

        def _extract_counts_to_int(result) -> Tuple[Dict[str, int], int]:
            """
            Use the SDK helper to aggregate AHS shot results to counts, then
            return (counts, int_of_most_probable_configuration).
            """
            counts = AhsResult.from_object(result).get_counts() or {}
            if not counts:
                return {}, 0
            # Pick the most frequent configuration
            top_cfg = max(counts.items(), key=lambda kv: kv[1])[0]
            return counts, _spin_config_to_int(top_cfg)
        seed_text = f"{device_id}_{seed_text}"
        program = ahs_from_seed(seed_text)
        aquila = AwsDevice("arn:aws:braket:us-east-1::device/qpu/quera/Aquila")
        # Round values as required by device precision
        program = program.discretize(aquila)
        task = aquila.run(program, shots=10)
        def _wait_and_fetch():
            try:
                res = task.result()
                return res
            except Exception as e:
                # If it’s still running after our timeout, attempt best-effort cancel
                try:
                    task.cancel()
                except Exception:
                    pass
                # Attach failure reason if present
                try:
                    reason = getattr(task, "failure_reason", None) or task.metadata().get("failureReason")
                except Exception:
                    reason = None
                if reason:
                    raise RuntimeError(f"Quantum task failed: {reason}") from e
                raise

        result = await asyncio.to_thread(_wait_and_fetch)

        # Convert AHS result -> counts -> integer
        counts, value = _extract_counts_to_int(result)
        return value

    async def _generate_quantum_random_number(self, device_id: str, seed_text: str) -> int:
        """Generate quantum random number with device-specific characteristics"""

        
        cache_key = hashlib.md5(f"{device_id}_{seed_text}".encode()).hexdigest()

        if cache_key in self._circuit_cache:
            base_result = self._circuit_cache[cache_key]
            return (base_result + int(time.time())) % 1000
        
        if "quera" in device_id:
            try:
                # Use appropriate device based on device_id
                quantum_number = await self._ahs_from_seed(device_id, seed_text)
                self._circuit_cache[cache_key] = quantum_number
                return quantum_number
            except Exception as e:
                logger.error(f"Quantum execution error on {device_id}: {e}")
                # Fallback to deterministic hash
                return hash(seed_text + str(time.time())) % 1000

        device_info = self.device_manager.get_device_info(device_id)

        # Adjust circuit based on device capabilities
        num_qubits = min(4 + (hash(seed_text) % 4), device_info['max_qubits'])

        circuit = Circuit()

        # Create quantum superposition
        for i in range(num_qubits):
            circuit.h(i)

        # Add entanglement for better randomness
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

        try:
            # Use appropriate device based on device_id
            quantum_number = await self._execute_on_device(circuit, device_id, shots=10)
            self._circuit_cache[cache_key] = quantum_number
            return quantum_number
        except Exception as e:
            logger.error(f"Quantum execution error on {device_id}: {e}")
            # Fallback to deterministic hash
            return hash(seed_text + str(time.time())) % 1000

    async def _create_bell_state_circuit(self, device_id: str) -> List[float]:
        """Create Bell state circuit with device-specific optimizations"""
        device_info = self.device_manager.get_device_info(device_id)

        if not device_info.get('supports_bell_states', True):
            # For devices that don't support Bell states, return simulated data
            return [0.5, 0.0, 0.0, 0.5]

        circuit = Circuit()
        circuit.h(0)
        circuit.cnot(0, 1)
        circuit.measure(0)
        circuit.measure(1)

        try:
            # Use appropriate device based on device_id
            shots = 200 if device_info['type'] == 'simulator' else 1000
            probabilities = await self._execute_bell_state_on_device(circuit, device_id, shots)
            return probabilities
        except Exception as e:
            logger.error(f"Bell state execution error on {device_id}: {e}")
            return [0.5, 0.0, 0.0, 0.5]

    def _generate_device_specific_visuals(self, device_id: str, quantum_number: int, entanglement_data: List[float]) -> Dict[str, Any]:
        """Generate visual properties with device-specific enhancements"""
        device_info = self.device_manager.get_device_info(device_id)

        # Base color calculation
        hue = (quantum_number * 137.5) % 360

        # Device-specific color modifications
        if 'ionq' in device_id:
            hue = (hue + 60) % 360  # Shift towards blue-green for IonQ
        elif 'iqm' in device_id:
            hue = (hue + 120) % 360  # Shift towards green for IQM
        elif 'quera' in device_id:
            hue = (hue + 180) % 360  # Shift towards red for QuEra
        elif 'rigetti' in device_id:
            hue = (hue + 240) % 360  # Shift towards purple for Rigetti
        elif 'aws' in device_id:
            hue = (hue + 300) % 360  # Shift towards magenta for AWS

        saturation = 70 + (sum(entanglement_data) * 30)
        lightness = 45 + (entanglement_data[0] * 20)

        # Generate collision-free position
        position_x, position_y = self._generate_collision_free_position(device_id, quantum_number)

        return {
            'color': f"hsl({hue:.1f}, {saturation:.1f}%, {lightness:.1f}%)",
            'position_x': position_x,
            'position_y': position_y,
            'pulse_speed': 2 + (quantum_number % 3),
            'size_factor': 0.8 + (entanglement_data[3] * 0.4),
            'device_indicator': device_info['type']
        }

    def _generate_collision_free_position(self, device_id: str, quantum_number: int) -> tuple[float, float]:
        """Generate a position that doesn't collide with existing signatures and accounts for breathing state"""
        # Get existing signatures to check for collisions
        from signature_wall_system import SignatureWallDatabase
        database = SignatureWallDatabase()
        existing_signatures = database.get_all_signatures()

        # Calculate dynamic card dimensions based on number of signatures (matching frontend logic)
        num_signatures = len(existing_signatures) + 1  # +1 for the new signature being added

        # Use responsive container dimensions that match frontend logic EXACTLY
        # Frontend: containerWidth = container.offsetWidth || window.innerWidth * 0.9
        # Frontend: containerHeight = Math.max(600, window.innerHeight * 0.8)
        #
        # To match frontend exactly, we need to estimate typical browser viewport sizes:
        # - Most users have 1920x1080 or 1366x768 screens
        # - Typical browser viewport: ~90% of screen width, ~80% of screen height
        # - Frontend container.offsetWidth is usually the full viewport width * 0.9
        #
        # Use adaptive estimates based on common screen resolutions:
        estimated_viewport_width = 1400  # Conservative estimate for most modern screens
        estimated_viewport_height = 900  # Conservative estimate for most modern screens

        container_width = estimated_viewport_width   # Matches frontend containerWidth calculation
        container_height = max(600, int(estimated_viewport_height * 0.8))  # Matches frontend Math.max(600, height * 0.8)

        # Dynamic sizing logic (matching frontend calculateAdaptiveLayout)
        if num_signatures <= 4:
            # Large signatures for few items - use 2x2 grid potential
            card_width = max(280, min(400, container_width / 2.8))
            card_height = max(180, min(240, container_height / 2.8))
            min_spacing = 30
        elif num_signatures <= 6:
            # Medium-large signatures - use 3x2 grid potential
            card_width = max(250, min(350, container_width / 3.2))
            card_height = max(160, min(220, container_height / 2.6))
            min_spacing = 25
        elif num_signatures <= 9:
            # Medium signatures - use 3x3 grid potential
            card_width = max(220, min(300, container_width / 3.8))
            card_height = max(140, min(190, container_height / 3.2))
            min_spacing = 20
        elif num_signatures <= 12:
            # Smaller signatures - use 4x3 grid potential
            card_width = max(200, min(260, container_width / 4.5))
            card_height = max(130, min(170, container_height / 3.8))
            min_spacing = 15
        else:
            # Dense layout for many signatures
            card_width = max(180, min(220, container_width / 5.5))
            card_height = max(120, min(150, container_height / 4.5))
            min_spacing = 12

        # Convert card dimensions to percentage and add breathing state buffer
        card_width_pct = (card_width / container_width) * 100
        card_height_pct = (card_height / container_height) * 100

        # Add extra buffer for breathing state effects
        # CSS breathing animation: scale(1.02) + :before pseudo-element (6px total: 3px on each side)
        scale_buffer = 1.02  # Actual CSS scale transform
        pseudo_element_px = 6  # :before element extends 3px on each side (total 6px)

        # Convert pseudo-element pixels to percentage
        pseudo_element_width_pct = (pseudo_element_px / container_width) * 100
        pseudo_element_height_pct = (pseudo_element_px / container_height) * 100

        # Calculate effective dimensions with both scale and pseudo-element buffers
        effective_width_pct = (card_width_pct * scale_buffer) + pseudo_element_width_pct
        effective_height_pct = (card_height_pct * scale_buffer) + pseudo_element_height_pct
        spacing_pct = (min_spacing / container_width) * 100

        # Prefer center positioning - define center-biased regions with safe margins
        center_x, center_y = 50, 50  # Center of container

        # Create concentric zones for center-biased placement (very conservative bounds)
        zones = [
            {'x_range': (30, 70), 'y_range': (30, 70), 'weight': 0.7},  # Inner zone (safe center area)
            {'x_range': (20, 80), 'y_range': (20, 80), 'weight': 0.2},  # Middle zone
            {'x_range': (15, 85), 'y_range': (15, 85), 'weight': 0.1}   # Outer zone (safe margins)
        ]

        # Device clustering regions within center preference (very conservative)
        device_regions = {
            'local_simulator': {'x_range': (20, 50), 'y_range': (20, 50)},
            'aws_sv1': {'x_range': (50, 80), 'y_range': (20, 50)},
            'ionq_forte': {'x_range': (20, 50), 'y_range': (50, 80)},
            'iqm_garnet': {'x_range': (50, 80), 'y_range': (50, 80)},
            'quera_aquila': {'x_range': (30, 70), 'y_range': (30, 70)},
            'rigetti_ankaa': {'x_range': (25, 75), 'y_range': (25, 75)}
        }

        # Get device region or use default (wider for unknown devices)
        device_region = device_regions.get(device_id, {'x_range': (10, 90), 'y_range': (10, 90)})

        # Use quantum number as deterministic seed for reproducible positioning
        random.seed(quantum_number)

        # Try center-biased positioning first
        max_attempts = 150
        for attempt in range(max_attempts):
            # Choose zone based on attempt number (prefer center first)
            if attempt < 50:
                zone = zones[0]  # Inner zone
            elif attempt < 100:
                zone = zones[1]  # Middle zone
            else:
                zone = zones[2]  # Outer zone

            # Intersect zone with device region for focused placement
            effective_x_min = max(zone['x_range'][0], device_region['x_range'][0])
            effective_x_max = min(zone['x_range'][1], device_region['x_range'][1])
            effective_y_min = max(zone['y_range'][0], device_region['y_range'][0])
            effective_y_max = min(zone['y_range'][1], device_region['y_range'][1])

            # Ensure we have valid ranges
            if effective_x_max <= effective_x_min or effective_y_max <= effective_y_min:
                continue

            if attempt < 75:
                # First 75 attempts: try systematic grid positions within zone
                grid_size = 8  # 8x8 grid for better coverage
                grid_x = attempt % grid_size
                grid_y = attempt // grid_size

                if grid_x < grid_size and grid_y < grid_size:
                    # Calculate grid position
                    x_range = effective_x_max - effective_x_min - effective_width_pct
                    y_range = effective_y_max - effective_y_min - effective_height_pct

                    if x_range > 0 and y_range > 0:
                        candidate_x = effective_x_min + (grid_x / max(1, grid_size - 1)) * x_range
                        candidate_y = effective_y_min + (grid_y / max(1, grid_size - 1)) * y_range

                        # Add small random offset for visual variety while staying centered
                        candidate_x += random.uniform(-2, 2)
                        candidate_y += random.uniform(-2, 2)
                    else:
                        continue
                else:
                    continue
            else:
                # Remaining attempts: random within effective zone with center bias
                if effective_x_max - effective_x_min > effective_width_pct and effective_y_max - effective_y_min > effective_height_pct:
                    candidate_x = random.uniform(
                        effective_x_min,
                        effective_x_max - effective_width_pct
                    )
                    candidate_y = random.uniform(
                        effective_y_min,
                        effective_y_max - effective_height_pct
                    )
                else:
                    continue

            # Ensure bounds with breathing state consideration and very safe margins
            candidate_x = max(12, min(88 - effective_width_pct, candidate_x))
            candidate_y = max(12, min(88 - effective_height_pct, candidate_y))

            # Check for collisions with existing signatures using effective (breathing) dimensions
            collision_found = False
            for existing in existing_signatures:
                # Calculate distance between candidate and existing position
                dx = abs(candidate_x - existing['position_x'])
                dy = abs(candidate_y - existing['position_y'])

                # Check if rectangles would overlap (with breathing state buffer and spacing)
                if (dx < effective_width_pct + spacing_pct and
                    dy < effective_height_pct + spacing_pct):
                    collision_found = True
                    break

            if not collision_found:
                return candidate_x, candidate_y

        # Fallback: if no collision-free position found, use improved spiral placement
        return self._generate_center_spiral_position(len(existing_signatures), effective_width_pct, effective_height_pct)

    def _generate_center_spiral_position(self, signature_count: int, effective_width_pct: float, effective_height_pct: float) -> tuple[float, float]:
        """Generate position using center-biased spiral pattern as fallback when collision detection fails"""
        import math

        # Center of the container
        center_x, center_y = 50, 50

        # Spiral parameters optimized for center placement
        angle = signature_count * 0.8  # Adjust for tighter/looser spiral
        radius = 8 + (signature_count * 2.5)  # Expanding radius from center

        # Calculate spiral position from center
        spiral_x = center_x + radius * math.cos(angle)
        spiral_y = center_y + radius * math.sin(angle)

        # Ensure within bounds with breathing state consideration and very safe margins
        spiral_x = max(12, min(88 - effective_width_pct, spiral_x))
        spiral_y = max(12, min(88 - effective_height_pct, spiral_y))

        return spiral_x, spiral_y

    def _estimate_completion_time(self, device_info: Dict[str, Any]) -> str:
        """Estimate completion time based on device"""
        base_time = datetime.now()

        if device_info['type'] == 'simulator':
            minutes = 0
        elif device_info['type'] == 'managed_simulator':
            minutes = 1
        elif 'ionq' in device_info['arn']:
            minutes = 15
        elif 'iqm' in device_info['arn']:
            minutes = 25
        elif 'quera' in device_info['arn']:
            minutes = 35
        elif 'rigetti' in device_info['arn']:
            minutes = 10
        else:
            minutes = 20

        estimated_time = base_time.timestamp() + (minutes * 60)
        return datetime.fromtimestamp(estimated_time).isoformat()

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a quantum job"""
        return self.job_manager.get_job(job_id)

    def get_pending_jobs(self) -> List[Dict[str, Any]]:
        """Get all pending quantum jobs"""
        return self.job_manager.get_pending_jobs()

    def get_recent_jobs(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent quantum jobs"""
        return self.job_manager.get_recent_jobs(limit)

    def _initialize_aws_session(self):
        """Initialize AWS session and devices"""
        try:
            # Try to create AWS session - will use default credentials or environment
            self._aws_session = boto3.Session()

            # Test AWS connectivity by trying to list regions
            ec2 = self._aws_session.client('ec2', region_name='us-east-1')

            # Cache AWS devices for performance
            for device_id, device_info in self.device_manager.devices.items():
                if device_info['arn'].startswith('arn:aws:braket'):
                    try:
                        # Create AWS Braket device with proper region configuration
                        device_region = device_info.get('region', 'us-east-1')

                        # Set default region environment variable for Braket
                        import os
                        original_region = os.environ.get('AWS_DEFAULT_REGION')
                        os.environ['AWS_DEFAULT_REGION'] = device_region

                        self._aws_devices[device_id] = AwsDevice(
                            device_info['arn']
                        )

                        # Restore original region if it existed
                        if original_region:
                            os.environ['AWS_DEFAULT_REGION'] = original_region
                        elif 'AWS_DEFAULT_REGION' in os.environ:
                            del os.environ['AWS_DEFAULT_REGION']

                        logger.info(f"Initialized AWS device: {device_info['name']} ({device_id}) in region {device_region}")
                    except Exception as e:
                        logger.warning(f"Could not initialize AWS device {device_id}: {e}")

        except Exception as e:
            logger.warning(f"AWS initialization failed: {e}. Will use local simulators only.")
            self._aws_session = None

    async def _verify_braket_task(self, task_arn: str) -> Dict[str, Any]:
        """Verify AWS Braket task creation using AWS CLI"""
        try:
            import subprocess
            result = subprocess.run([
                'aws', 'braket', 'get-quantum-task',
                '--quantum-task-arn', task_arn
            ], capture_output=True, text=True, timeout=30)

            if result.returncode == 0:
                task_info = json.loads(result.stdout)
                return {
                    'verified': True,
                    'task_arn': task_arn,
                    'status': task_info.get('quantumTaskStatus', 'UNKNOWN'),
                    'device_arn': task_info.get('deviceArn', ''),
                    'creation_time': task_info.get('createdAt', ''),
                    'shots': task_info.get('shots', 0)
                }
            else:
                return {
                    'verified': False,
                    'error': result.stderr,
                    'task_arn': task_arn
                }
        except Exception as e:
            return {
                'verified': False,
                'error': str(e),
                'task_arn': task_arn
            }

    async def _execute_on_device(self, circuit: Circuit, device_id: str, shots: int = 10) -> int:
        """Execute circuit on specified device and return quantum random number"""
        device_info = self.device_manager.get_device_info(device_id)

        try:
            if device_id == 'local_simulator':
                # Use local simulator
                task = self.local_simulator.run(circuit, shots=shots)
                result = task.result()
                measurement = result.measurement_counts
                binary_result = list(measurement.keys())[0]
                return int(binary_result, 2)

            elif device_id in self._aws_devices and self._aws_session:
                # Use real AWS Braket device
                aws_device = self._aws_devices[device_id]

                # Check device availability
                device_status = await self._check_device_availability(device_id)
                if not device_status['available']:
                    logger.warning(f"Device {device_id} not available: {device_status['reason']}")
                    # Fall back to AWS SV1 simulator if available
                    if 'aws_sv1' in self._aws_devices:
                        aws_device = self._aws_devices['aws_sv1']
                        logger.info(f"Falling back to AWS SV1 simulator")
                    else:
                        raise Exception(f"Device {device_id} unavailable and no fallback available")

                # Submit to AWS Braket
                task = aws_device.run(circuit, shots=shots)

                # For real devices, we need to wait for completion
                if device_info['async_required']:
                    # Wait for completion with timeout
                    await asyncio.sleep(0.1)  # Small delay before checking
                    wait_hours = 1
                    max_wait_time = wait_hours * 60 * 60  # 1 hour max wait
                    start_time = time.time()

                    while task.state() not in ['COMPLETED', 'FAILED', 'CANCELLED']:
                        if time.time() - start_time > max_wait_time:
                            raise Exception(f"Task timeout after {max_wait_time} seconds")
                        await asyncio.sleep(5)  # Check every 5 seconds

                result = task.result()
                measurement = result.measurement_counts
                binary_result = list(measurement.keys())[0]
                return int(binary_result, 2)

            else:
                # Fallback to local simulator if AWS not available
                logger.warning(f"AWS device {device_id} not available, using local simulator")
                task = self.local_simulator.run(circuit, shots=shots)
                result = task.result()
                measurement = result.measurement_counts
                binary_result = list(measurement.keys())[0]
                return int(binary_result, 2)

        except Exception as e:
            logger.error(f"Circuit execution failed on {device_id}: {e}")
            # Ultimate fallback to deterministic calculation
            circuit_hash = hashlib.md5(str(circuit).encode()).hexdigest()
            return int(circuit_hash[:8], 16) % 1000

    async def _execute_bell_state_on_device(self, circuit: Circuit, device_id: str, shots: int) -> List[float]:
        """Execute Bell state circuit on specified device and return probabilities"""
        device_info = self.device_manager.get_device_info(device_id)

        try:
            if device_id == 'local_simulator':
                # Use local simulator
                task = self.local_simulator.run(circuit, shots=shots)
                result = task.result()
                counts = result.measurement_counts

            elif device_id in self._aws_devices and self._aws_session:
                # Use real AWS Braket device
                aws_device = self._aws_devices[device_id]

                # Check device availability
                device_status = await self._check_device_availability(device_id)
                if not device_status['available']:
                    logger.warning(f"Device {device_id} not available: {device_status['reason']}")
                    # Fall back to AWS SV1 simulator if available
                    if 'aws_sv1' in self._aws_devices:
                        aws_device = self._aws_devices['aws_sv1']
                        logger.info(f"Falling back to AWS SV1 simulator for Bell state")
                    else:
                        raise Exception(f"Device {device_id} unavailable and no fallback available")

                # Submit to AWS Braket
                task = aws_device.run(circuit, shots=shots)

                # For real devices, wait for completion
                if device_info['async_required']:
                    await asyncio.sleep(0.1)
                    wait_time_hours = 1
                    max_wait_time = wait_time_hours * 60 * 60
                    start_time = time.time()

                    while task.state() not in ['COMPLETED', 'FAILED', 'CANCELLED']:
                        if time.time() - start_time > max_wait_time:
                            raise Exception(f"Bell state task timeout after {max_wait_time} seconds")
                        await asyncio.sleep(5)

                result = task.result()
                counts = result.measurement_counts

            else:
                # Fallback to local simulator
                logger.warning(f"AWS device {device_id} not available, using local simulator for Bell state")
                task = self.local_simulator.run(circuit, shots=shots)
                result = task.result()
                counts = result.measurement_counts

            # Process measurement counts into probabilities
            total_shots = sum(counts.values())
            probabilities = []

            for state in ['00', '01', '10', '11']:
                probabilities.append(counts.get(state, 0) / total_shots)

            return probabilities

        except Exception as e:
            logger.error(f"Bell state execution failed on {device_id}: {e}")
            # Return ideal Bell state probabilities as fallback
            return [0.5, 0.0, 0.0, 0.5]

    async def _check_device_availability(self, device_id: str) -> Dict[str, Any]:
        """Check if a quantum device is available"""
        device_info = self.device_manager.get_device_info(device_id)

        if device_id == 'local_simulator':
            return {'available': True, 'reason': 'Local simulator always available'}

        if not self._aws_session or device_id not in self._aws_devices:
            return {'available': False, 'reason': 'AWS session not initialized or device not found'}

        try:
            aws_device = self._aws_devices[device_id]

            # For simulators, assume they're always available
            if device_info['type'] in ['simulator', 'managed_simulator']:
                return {'available': True, 'reason': 'Simulator device'}

            # For QPUs, check if they're online
            # Note: In real implementation, you would check device.is_available
            # For now, we'll do a basic connectivity check

            # Simulate device availability check
            device_status = {
                'ionq_forte': random.choice([True, True, True, False]),  # 75% available
                'iqm_garnet': random.choice([True, True, False]),        # 67% available
                'quera_aquila': random.choice([True, False]),            # 50% available
                'rigetti_ankaa': random.choice([True, True, True, False]) # 75% available
            }

            is_available = device_status.get(device_id, True)

            if is_available:
                return {'available': True, 'reason': 'Device online and accepting jobs'}
            else:
                return {'available': False, 'reason': 'Device offline or maintenance mode'}

        except Exception as e:
            logger.error(f"Error checking device availability for {device_id}: {e}")
            return {'available': False, 'reason': f'Availability check failed: {str(e)}'}

    def get_available_devices(self) -> Dict[str, Dict[str, Any]]:
        """Get available devices with enhanced status information"""
        devices = self.device_manager.get_available_devices()

        # Add real-time availability information
        for device_id, device_info in devices.items():
            if device_id == 'local_simulator':
                device_info['status'] = 'Always Available'
                device_info['aws_configured'] = False
            elif self._aws_session and device_id in self._aws_devices:
                device_info['status'] = 'AWS Connected'
                device_info['aws_configured'] = True
            elif device_info['arn'].startswith('arn:aws:braket'):
                device_info['status'] = 'AWS Not Configured'
                device_info['aws_configured'] = False
            else:
                device_info['status'] = 'Available'
                device_info['aws_configured'] = False

        return devices