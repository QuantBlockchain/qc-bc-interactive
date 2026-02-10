import asyncio
import hashlib
import json
import random
import time
import sqlite3
from datetime import datetime
from typing import Dict, Any, List
import threading
import secrets
import base64

import boto3
from braket.aws import AwsDevice
from braket.circuits import Circuit
from braket.devices import LocalSimulator

from enhanced_quantum_service import EnhancedQuantumService
import os, json, base64, hashlib, secrets
from typing import Dict, List, Tuple

def _shake256(bytes_like: bytes, outlen: int) -> bytes:
    return hashlib.shake_256(bytes_like).digest(outlen)

def _int_to_be(i: int, length: int) -> bytes:
    return i.to_bytes(length, "big", signed=False)

def _sample_small(count: int, bound: int = 1) -> List[int]:
    # Very small entries in [-bound, bound] (toy noise/secret)
    return [secrets.randbelow(2 * bound + 1) - bound for _ in range(count)]

def _prng_matrix_from_seed(seed: bytes, q: int, m: int, n: int) -> List[List[int]]:
    # Deterministic matrix generation from seed (toy XOF expander)
    A = []
    counter = 0
    while len(A) < m:
        row = []
        while len(row) < n:
            block = _shake256(seed + _int_to_be(counter, 4), 2)
            val = int.from_bytes(block, "big") % q
            row.append(val)
            counter += 1
        A.append(row)
    return A

def _mat_vec(A: List[List[int]], s: List[int], q: int) -> List[int]:
    return [sum(aij * sj for aij, sj in zip(ai, s)) % q for ai in A]

def _vec_add(u: List[int], v: List[int], q: int) -> List[int]:
    return [(x + y) % q for x, y in zip(u, v)]

class ToyLWE:
    """
    Educational-only “LWE-like” keypair.
    DO NOT USE IN PRODUCTION.
    """

    def __init__(self, q: int = 12289, n: int = 64, m: int = 64, small_bound: int = 1):
        self.q = q
        self.n = n
        self.m = m
        self.small_bound = small_bound

    def generate_quantum_keypair(self, quantum_seed: int) -> Dict[str, str]:
        """
        Generate a toy, LWE-style keypair. The 'quantum_seed' is mixed as extra entropy.
        Returns base64-encoded JSON blobs for demo parity with your original code.
        """
        # ---------- 1) Build strong seed material (NO time-based seeding) ----------
        # Mix untrusted 'quantum_seed' with OS entropy and a domain label
        domain = b"ToyLWE-KeyGen-v1"
        mix = (
            domain
            + _int_to_be(quantum_seed, 16)       # user-provided "quantum" bits
            + os.urandom(32)                      # strong OS entropy
        )
        # Derive two seeds via XOF: one for secret/error sampling context, one for A
        xof = _shake256(mix, 64)
        seed_sk = xof[:32]
        seed_A  = xof[32:]

        # ---------- 2) Parameters ----------
        q, n, m, B = self.q, self.n, self.m, self.small_bound

        # ---------- 3) Sample small secret s and error e ----------
        # In real schemes: carefully defined distributions & CSPRNG seeded by seed_sk
        # Here we just demonstrate structure; secrets.* already uses OS RNG.
        s = _sample_small(n, bound=B)
        e = _sample_small(m, bound=B)

        # ---------- 4) Derive matrix A deterministically from seed_A ----------
        A = _prng_matrix_from_seed(seed_A, q, m, n)

        # ---------- 5) Compute b = A*s + e (mod q) ----------
        b = _vec_add(_mat_vec(A, s, q), e, q)

        # ---------- 6) Serialize keys (toy format, versioned) ----------
        sk_obj = {
            "version": "toy-lwe-1",
            "q": q, "n": n, "m": m, "small_bound": B,
            "s": s,                                  # PRIVATE: secret vector
        }
        pk_obj = {
            "version": "toy-lwe-1",
            "q": q, "n": n, "m": m,
            # Keep public key compact: store seed for A instead of A itself
            "A_seed": base64.b64encode(seed_A).decode(),
            "b": b,                                  # PUBLIC: b = A*s + e (mod q)
        }

        private_key = base64.b64encode(json.dumps(sk_obj).encode()).decode()
        public_key  = base64.b64encode(json.dumps(pk_obj).encode()).decode()

        return {
            "private_key": private_key,
            "public_key": public_key,
            "algorithm": "ToyLWE-Quantum-Seeded-Demo"
        }



class QuantumResistantCrypto:
    """Quantum-resistant cryptographic operations using quantum random numbers"""

    def __init__(self):
        pass

    def generate_quantum_keypair(self, quantum_seed: int) -> Dict[str, str]:
        """Generate quantum-resistant key pair using quantum random number as seed"""
        # # Use quantum number as entropy for key generation
        # random.seed(quantum_seed + int(time.time()))

        # # Simulate lattice-based cryptography (simplified for demo)
        # # In production, use actual post-quantum algorithms like Kyber or Dilithium

        # # Generate private key from quantum entropy
        # private_key_bytes = secrets.randbits(256).to_bytes(32, 'big')

        # # Generate public key (simplified lattice-based approach)
        # public_key_data = []
        # for i in range(8):
        #     # Use quantum seed to influence key generation
        #     element = (quantum_seed * (i + 1) + secrets.randbits(32)) % (2**16)
        #     public_key_data.append(element)

        # private_key = base64.b64encode(private_key_bytes).decode()
        # public_key = base64.b64encode(json.dumps(public_key_data).encode()).decode()

        lwe = ToyLWE()
        keypair = lwe.generate_quantum_keypair(quantum_seed)

        return {
            'private_key': keypair['private_key'],
            'public_key': keypair['public_key'],
            'algorithm': keypair['algorithm']
        }

    def sign_message(self, message: str, private_key: str, quantum_entropy: int) -> str:
        """Create quantum-resistant digital signature"""
        # Simplified signature scheme using quantum entropy
        message_hash = hashlib.sha256(message.encode()).hexdigest()
        entropy_hash = hashlib.sha256(str(quantum_entropy).encode()).hexdigest()

        # Combine message hash with quantum entropy
        signature_data = f"{message_hash}:{entropy_hash}:{private_key[:16]}"
        signature_hash = hashlib.sha256(signature_data.encode()).hexdigest()

        return base64.b64encode(signature_hash.encode()).decode()

    def verify_signature(self, message: str, signature: str, public_key: str) -> bool:
        """Verify quantum-resistant signature (simplified)"""
        # In a real implementation, this would use proper lattice-based verification
        return len(signature) > 0 and len(public_key) > 0


class SignatureWallDatabase:
    """Enhanced database for signature wall functionality"""

    def __init__(self, db_path: str = "signature_wall.db"):
        self.db_path = db_path
        self.lock = threading.Lock()
        self._init_database()

    def _init_database(self):
        """Initialize database with enhanced tables"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS signatures (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    response TEXT NOT NULL,
                    quantum_number INTEGER NOT NULL,
                    entanglement_data TEXT NOT NULL,
                    transaction_id TEXT NOT NULL,
                    block_hash TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    public_key TEXT NOT NULL,
                    private_key TEXT NOT NULL,
                    signature TEXT NOT NULL,
                    signature_algorithm TEXT NOT NULL,
                    visual_color TEXT NOT NULL,
                    position_x REAL NOT NULL,
                    position_y REAL NOT NULL,
                    device_id TEXT DEFAULT 'local_simulator',
                    device_name TEXT DEFAULT 'Local Simulator',
                    local_job_id TEXT,
                    device_job_id TEXT,
                    local_quantum_number INTEGER,
                    local_entanglement_data TEXT,
                    device_quantum_number INTEGER,
                    device_entanglement_data TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Add columns to existing table if they don't exist
            try:
                conn.execute("ALTER TABLE signatures ADD COLUMN local_job_id TEXT")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE signatures ADD COLUMN device_job_id TEXT")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE signatures ADD COLUMN local_quantum_number INTEGER")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE signatures ADD COLUMN local_entanglement_data TEXT")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE signatures ADD COLUMN device_quantum_number INTEGER")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE signatures ADD COLUMN device_entanglement_data TEXT")
            except sqlite3.OperationalError:
                pass

            # Add dual signature support columns
            try:
                conn.execute("ALTER TABLE signatures ADD COLUMN local_signature TEXT")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE signatures ADD COLUMN local_public_key TEXT")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE signatures ADD COLUMN local_private_key TEXT")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE signatures ADD COLUMN device_signature TEXT")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE signatures ADD COLUMN device_public_key TEXT")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE signatures ADD COLUMN device_private_key TEXT")
            except sqlite3.OperationalError:
                pass

            conn.commit()

    def add_signature(self, signature_data: Dict[str, Any]) -> int:
        """Add a new signature to the wall"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    INSERT INTO signatures
                    (name, response, quantum_number, entanglement_data, transaction_id,
                     block_hash, timestamp, public_key, private_key, signature,
                     signature_algorithm, visual_color, position_x, position_y,
                     device_id, device_name, local_job_id, device_job_id,
                     local_quantum_number, local_entanglement_data,
                     device_quantum_number, device_entanglement_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    signature_data['name'],
                    signature_data['response'],
                    signature_data['quantum_number'],
                    json.dumps(signature_data['entanglement_data']),
                    signature_data['transaction_id'],
                    signature_data['block_hash'],
                    signature_data['timestamp'],
                    signature_data['public_key'],
                    signature_data['private_key'],
                    signature_data['signature'],
                    signature_data['signature_algorithm'],
                    signature_data['visual_color'],
                    signature_data['position_x'],
                    signature_data['position_y'],
                    signature_data.get('device_id', 'local_simulator'),
                    signature_data.get('device_name', 'Local Simulator'),
                    signature_data.get('local_job_id'),
                    signature_data.get('device_job_id'),
                    signature_data.get('local_quantum_number'),
                    json.dumps(signature_data.get('local_entanglement_data', [])) if signature_data.get('local_entanglement_data') else None,
                    signature_data.get('device_quantum_number'),
                    json.dumps(signature_data.get('device_entanglement_data', [])) if signature_data.get('device_entanglement_data') else None
                ))
                conn.commit()
                return cursor.lastrowid

    def get_all_signatures(self) -> List[Dict[str, Any]]:
        """Get all signatures for the wall"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("""
                    SELECT * FROM signatures
                    ORDER BY created_at DESC
                """)
                rows = cursor.fetchall()

                signatures = []
                for row in rows:
                    sig = dict(row)
                    sig['entanglement_data'] = json.loads(sig['entanglement_data'])

                    # Handle new fields safely
                    if sig.get('local_entanglement_data'):
                        sig['local_entanglement_data'] = json.loads(sig['local_entanglement_data'])
                    if sig.get('device_entanglement_data'):
                        sig['device_entanglement_data'] = json.loads(sig['device_entanglement_data'])

                    signatures.append(sig)

                return signatures

    def get_signature_stats(self) -> Dict[str, Any]:
        """Get signature wall statistics"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                # Total signatures
                cursor = conn.execute("SELECT COUNT(*) FROM signatures")
                total_signatures = cursor.fetchone()[0]

                # Response distribution
                cursor = conn.execute("SELECT response, COUNT(*) FROM signatures GROUP BY response")
                response_distribution = dict(cursor.fetchall())

                # Average quantum number
                cursor = conn.execute("SELECT AVG(quantum_number) FROM signatures")
                avg_quantum = cursor.fetchone()[0] or 0

                return {
                    'total_signatures': total_signatures,
                    'response_distribution': response_distribution,
                    'average_quantum_number': round(avg_quantum, 2)
                }

    def clear_all_signatures(self) -> Dict[str, Any]:
        """Clear all signatures from the database (admin function)"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("SELECT COUNT(*) FROM signatures")
                count_before = cursor.fetchone()[0]

                conn.execute("DELETE FROM signatures")
                conn.commit()

                return {
                    'success': True,
                    'message': f'Cleared {count_before} signatures from the wall',
                    'signatures_removed': count_before
                }


class QuantumSignatureWallSystem:
    """Main system for quantum signature wall with enhanced device support"""

    def __init__(self):
        self.quantum_service = EnhancedQuantumService()
        self.enhanced_quantum_service = EnhancedQuantumService()
        self.crypto_service = QuantumResistantCrypto()
        self.database = SignatureWallDatabase()

    async def register_signature(self, name: str, response: str, quantum_device: str = "local_simulator") -> Dict[str, Any]:
        """Register a new signature on the wall with dual signature generation"""
        try:
            # Use enhanced quantum service for dual device processing
            quantum_result = await self.enhanced_quantum_service.process_quantum_signature(
                name, response, quantum_device
            )

            if not quantum_result['success']:
                return quantum_result

            # Extract quantum data from both sources
            device_result = quantum_result.get('device_result', {})
            local_result = quantum_result.get('local_result', {})
            device_info = quantum_result.get('device_info', {})

            # Get local quantum data (always available immediately)
            local_quantum_number = local_result.get('quantum_number') or quantum_result.get('quantum_number', 0)
            local_entanglement_data = local_result.get('entanglement_data') or quantum_result.get('entanglement_data', [0.5, 0, 0, 0.5])

            # Generate LOCAL signature using local quantum results
            local_keypair = self.crypto_service.generate_quantum_keypair(local_quantum_number)
            local_message_to_sign = f"{name}|{response}|{local_quantum_number}|local"
            local_signature = self.crypto_service.sign_message(
                local_message_to_sign,
                local_keypair['private_key'],
                local_quantum_number
            )

            # Initialize device signature variables
            device_signature = None
            device_keypair = None
            device_quantum_number = device_result.get('quantum_number')
            device_entanglement_data = device_result.get('entanglement_data')

            # Generate DEVICE signature if device results are available
            if device_quantum_number is not None:
                device_keypair = self.crypto_service.generate_quantum_keypair(device_quantum_number)
                device_message_to_sign = f"{name}|{response}|{device_quantum_number}|device"
                device_signature = self.crypto_service.sign_message(
                    device_message_to_sign,
                    device_keypair['private_key'],
                    device_quantum_number
                )

            # Use local results for visual properties and primary display
            visual_props = self.quantum_service.generate_visual_properties(
                local_quantum_number, local_entanglement_data, quantum_device
            )

            # Blockchain data (using local signature for primary blockchain entry)
            timestamp = datetime.now().isoformat()
            transaction_id = hashlib.sha256(f"{name}{response}{timestamp}".encode()).hexdigest()[:16]
            block_hash = hashlib.sha256(f"{transaction_id}{local_signature}".encode()).hexdigest()

            # Prepare signature data with dual signatures
            signature_data = {
                'name': name,
                'response': response,
                'quantum_number': local_quantum_number,  # Primary display uses local
                'entanglement_data': local_entanglement_data,  # Primary display uses local
                'transaction_id': transaction_id,
                'block_hash': block_hash,
                'timestamp': timestamp,
                'public_key': local_keypair['public_key'],  # Primary keys are local
                'private_key': local_keypair['private_key'],
                'signature': local_signature,  # Primary signature is local
                'signature_algorithm': local_keypair['algorithm'],
                'visual_color': visual_props['color'],
                'position_x': visual_props['position_x'],
                'position_y': visual_props['position_y'],
                'device_id': quantum_device,
                'device_name': device_info.get('name', 'Unknown Device'),
                'local_job_id': quantum_result.get('local_job_id'),
                'device_job_id': quantum_result.get('device_job_id'),
                'local_quantum_number': local_quantum_number,
                'local_entanglement_data': local_entanglement_data,
                'device_quantum_number': device_quantum_number,
                'device_entanglement_data': device_entanglement_data,
                # Dual signature fields
                'local_signature': local_signature,
                'local_public_key': local_keypair['public_key'],
                'local_private_key': local_keypair['private_key'],
                'device_signature': device_signature,
                'device_public_key': device_keypair['public_key'] if device_keypair else None,
                'device_private_key': device_keypair['private_key'] if device_keypair else None
            }

            # Store in database
            signature_id = self.database.add_signature(signature_data)

            return {
                'success': True,
                'signature_id': signature_id,
                'visual_properties': visual_props,
                'device_info': device_info,
                'dual_mode': quantum_result.get('dual_mode', False),
                'dual_signatures': {
                    'local': {
                        'signature': local_signature,
                        'quantum_number': local_quantum_number,
                        'public_key': local_keypair['public_key']
                    },
                    'device': {
                        'signature': device_signature,
                        'quantum_number': device_quantum_number,
                        'public_key': device_keypair['public_key'] if device_keypair else None,
                        'available': device_signature is not None
                    }
                },
                'local_job_id': quantum_result.get('local_job_id'),
                'device_job_id': quantum_result.get('device_job_id'),
                **signature_data
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def get_all_signatures(self) -> List[Dict[str, Any]]:
        """Get all signatures for the wall"""
        return self.database.get_all_signatures()

    def get_signature_stats(self) -> Dict[str, Any]:
        """Get signature wall statistics"""
        return self.database.get_signature_stats()

    def clear_all_signatures(self) -> Dict[str, Any]:
        """Clear all signatures from the wall (admin function)"""
        return self.database.clear_all_signatures()

    async def upgrade_signature_with_device_results(self, signature_id: int) -> Dict[str, Any]:
        """Upgrade a signature with device quantum results and generate device signature"""
        try:
            # Get the signature
            signatures = self.database.get_all_signatures()
            signature = next((s for s in signatures if s['id'] == signature_id), None)

            if not signature:
                return {'success': False, 'error': 'Signature not found'}

            # Check if device job exists and is completed
            device_job_id = signature.get('device_job_id')
            if not device_job_id:
                return {'success': False, 'error': 'No device job associated with this signature'}

            # Get job data from enhanced quantum service
            job_manager = self.enhanced_quantum_service.job_manager
            job = job_manager.get_job_by_id(device_job_id)

            if not job:
                return {'success': False, 'error': 'Device job not found'}

            if job.get('status') != 'completed':
                return {'success': False, 'error': f'Device job is {job.get("status", "unknown")}, not completed'}

            if not job.get('result_data'):
                return {'success': False, 'error': 'Device job has no result data'}

            # Parse device results
            import json
            try:
                result_data = json.loads(job['result_data'])
                device_quantum_number = result_data['quantum_number']
                device_entanglement_data = result_data['entanglement_data']
            except Exception as e:
                return {'success': False, 'error': f'Failed to parse device results: {e}'}

            # Generate device signature
            device_keypair = self.crypto_service.generate_quantum_keypair(device_quantum_number)
            device_message_to_sign = f"{signature['name']}|{signature['response']}|{device_quantum_number}|device"
            device_signature = self.crypto_service.sign_message(
                device_message_to_sign,
                device_keypair['private_key'],
                device_quantum_number
            )

            # Update database with device results and signature
            with sqlite3.connect(self.database.db_path) as conn:
                conn.execute("""
                    UPDATE signatures
                    SET device_quantum_number = ?, device_entanglement_data = ?,
                        device_signature = ?, device_public_key = ?, device_private_key = ?
                    WHERE id = ?
                """, (
                    device_quantum_number,
                    json.dumps(device_entanglement_data),
                    device_signature,
                    device_keypair['public_key'],
                    device_keypair['private_key'],
                    signature_id
                ))
                conn.commit()

            return {
                'success': True,
                'message': f'Signature {signature_id} upgraded with device results',
                'device_signature': device_signature,
                'device_quantum_number': device_quantum_number,
                'device_public_key': device_keypair['public_key']
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}