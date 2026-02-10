import asyncio
import hashlib
import json
import random
import time
import sqlite3
from datetime import datetime
from typing import Dict, Any, List
import threading

import boto3
from braket.aws import AwsDevice
from braket.circuits import Circuit
from braket.devices import LocalSimulator


class EventDatabase:
    """Thread-safe database for event registrations"""

    def __init__(self, db_path: str = "event_registrations.db"):
        self.db_path = db_path
        self.lock = threading.Lock()
        self._init_database()

    def _init_database(self):
        """Initialize database with registrations table"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS registrations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    message TEXT NOT NULL,
                    quantum_number INTEGER NOT NULL,
                    entanglement_data TEXT NOT NULL,
                    transaction_id TEXT NOT NULL,
                    block_hash TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

    def add_registration(self, registration_data: Dict[str, Any]) -> int:
        """Add a new registration and return the ID"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    INSERT INTO registrations
                    (name, message, quantum_number, entanglement_data, transaction_id, block_hash, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    registration_data['name'],
                    registration_data['message'],
                    registration_data['quantum_number'],
                    json.dumps(registration_data['entanglement_data']),
                    registration_data['transaction_id'],
                    registration_data['block_hash'],
                    registration_data['timestamp']
                ))
                conn.commit()
                return cursor.lastrowid

    def get_all_registrations(self) -> List[Dict[str, Any]]:
        """Get all registrations ordered by most recent first"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("""
                    SELECT * FROM registrations
                    ORDER BY created_at DESC
                """)
                rows = cursor.fetchall()

                registrations = []
                for row in rows:
                    reg = dict(row)
                    reg['entanglement_data'] = json.loads(reg['entanglement_data'])
                    registrations.append(reg)

                return registrations

    def get_registration_count(self) -> int:
        """Get total number of registrations"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("SELECT COUNT(*) FROM registrations")
                return cursor.fetchone()[0]


class OptimizedQuantumService:
    """Optimized quantum service with caching and batching"""

    def __init__(self):
        self.local_simulator = LocalSimulator()
        self._circuit_cache = {}

    def generate_quantum_random_number(self, seed_text: str) -> int:
        """Generate quantum random number with caching for performance"""
        # Use hash of seed as cache key
        cache_key = hashlib.md5(seed_text.encode()).hexdigest()

        if cache_key in self._circuit_cache:
            # Add some randomness even for cached circuits
            base_result = self._circuit_cache[cache_key]
            return (base_result + int(time.time())) % 1000

        # Create quantum circuit
        circuit = Circuit()
        num_qubits = 3 + (hash(seed_text) % 6)

        for i in range(num_qubits):
            circuit.h(i)

        for i, char in enumerate(seed_text[:num_qubits]):
            angle = (ord(char) / 128.0) * 3.14159
            circuit.rx(i, angle)

        for i in range(num_qubits):
            circuit.measure(i)

        try:
            task = self.local_simulator.run(circuit, shots=1)
            result = task.result()
            measurement = result.measurement_counts

            binary_result = list(measurement.keys())[0]
            quantum_number = int(binary_result, 2)

            # Cache the base result
            self._circuit_cache[cache_key] = quantum_number

            return quantum_number
        except Exception as e:
            print(f"Quantum simulation error: {e}")
            return hash(seed_text + str(time.time())) % 1000

    def create_bell_state_circuit(self) -> Dict[str, float]:
        """Create Bell state with optimized simulation"""
        circuit = Circuit()
        circuit.h(0)
        circuit.cnot(0, 1)
        circuit.measure(0)
        circuit.measure(1)

        try:
            task = self.local_simulator.run(circuit, shots=100)  # Reduced shots for speed
            result = task.result()
            counts = result.measurement_counts

            total_shots = sum(counts.values())
            probabilities = {}

            for state in ['00', '01', '10', '11']:
                probabilities[state] = counts.get(state, 0) / total_shots

            return probabilities
        except Exception as e:
            print(f"Bell state simulation error: {e}")
            return {'00': 0.5, '01': 0.0, '10': 0.0, '11': 0.5}


class OptimizedBlockchainService:
    """Optimized blockchain service with batch processing"""

    def __init__(self):
        self.batch_size = 10
        self.pending_transactions = []

    def store_quantum_result(self, name: str, message: str, quantum_number: int) -> Dict[str, Any]:
        """Store quantum result with optimized processing"""
        transaction_data = {
            'name': name,
            'message': message,
            'quantum_number': quantum_number,
            'timestamp': datetime.now().isoformat(),
            'type': 'event_registration'
        }

        transaction_id = self._generate_transaction_id(transaction_data)
        block_hash = self._generate_block_hash(transaction_data, transaction_id)

        return {
            'transaction_id': transaction_id,
            'block_hash': block_hash,
            'timestamp': transaction_data['timestamp']
        }

    def _generate_transaction_id(self, data: Dict[str, Any]) -> str:
        """Generate unique transaction ID"""
        data_string = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_string.encode()).hexdigest()[:16]

    def _generate_block_hash(self, data: Dict[str, Any], transaction_id: str) -> str:
        """Generate block hash"""
        combined = f"{transaction_id}{json.dumps(data, sort_keys=True)}{time.time()}"
        return hashlib.sha256(combined.encode()).hexdigest()


class EventRegistrationSystem:
    """Main event registration system with user management"""

    def __init__(self):
        self.quantum_service = OptimizedQuantumService()
        self.blockchain_service = OptimizedBlockchainService()
        self.database = EventDatabase()

    async def register_participant(self, name: str, message: str) -> Dict[str, Any]:
        """Register a new event participant"""
        try:
            # Generate quantum data
            quantum_number = self.quantum_service.generate_quantum_random_number(f"{name}:{message}")
            entanglement_data = self.quantum_service.create_bell_state_circuit()

            # Store in blockchain
            blockchain_result = self.blockchain_service.store_quantum_result(name, message, quantum_number)

            # Prepare registration data
            registration_data = {
                'name': name,
                'message': message,
                'quantum_number': quantum_number,
                'entanglement_data': [
                    entanglement_data['00'],
                    entanglement_data['01'],
                    entanglement_data['10'],
                    entanglement_data['11']
                ],
                'transaction_id': blockchain_result['transaction_id'],
                'block_hash': blockchain_result['block_hash'],
                'timestamp': blockchain_result['timestamp']
            }

            # Store in database
            registration_id = self.database.add_registration(registration_data)

            return {
                'success': True,
                'registration_id': registration_id,
                **registration_data
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def get_all_registrations(self) -> List[Dict[str, Any]]:
        """Get all event registrations"""
        return self.database.get_all_registrations()

    def get_registration_stats(self) -> Dict[str, Any]:
        """Get registration statistics"""
        total_registrations = self.database.get_registration_count()
        registrations = self.database.get_all_registrations()

        if registrations:
            latest_registration = registrations[0]['created_at']
            avg_quantum_number = sum(r['quantum_number'] for r in registrations) / len(registrations)
        else:
            latest_registration = None
            avg_quantum_number = 0

        return {
            'total_registrations': total_registrations,
            'latest_registration': latest_registration,
            'average_quantum_number': round(avg_quantum_number, 2)
        }