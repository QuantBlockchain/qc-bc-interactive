"""
Quantum-Resistant Cryptography Module

Implements post-quantum cryptographic primitives:
- ToyLWE: Educational LWE-based key generation
- QuantumResistantCrypto: High-level crypto operations

WARNING: ToyLWE is for demonstration only, NOT production use!
For production, use standardized PQC algorithms like Kyber/Dilithium.
"""

import os
import json
import base64
import hashlib
import secrets
from typing import Dict, List


def _shake256(bytes_like: bytes, outlen: int) -> bytes:
    """
    SHAKE256 extendable output function.

    Args:
        bytes_like: Input bytes
        outlen: Desired output length

    Returns:
        Derived bytes of specified length
    """
    return hashlib.shake_256(bytes_like).digest(outlen)


def _int_to_be(i: int, length: int) -> bytes:
    """
    Convert integer to big-endian bytes.

    Args:
        i: Integer to convert
        length: Desired byte length

    Returns:
        Big-endian byte representation
    """
    return i.to_bytes(length, "big", signed=False)


def _sample_small(count: int, bound: int = 1) -> List[int]:
    """
    Sample small integers uniformly from [-bound, bound].

    Args:
        count: Number of samples
        bound: Maximum absolute value

    Returns:
        List of sampled integers
    """
    return [secrets.randbelow(2 * bound + 1) - bound for _ in range(count)]


def _prng_matrix_from_seed(seed: bytes, q: int, m: int, n: int) -> List[List[int]]:
    """
    Generate deterministic matrix from seed using XOF.

    This creates a pseudorandom m x n matrix with entries in Z_q.

    Args:
        seed: Random seed bytes
        q: Modulus
        m: Number of rows
        n: Number of columns

    Returns:
        m x n matrix of integers mod q
    """
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
    """
    Matrix-vector multiplication mod q.

    Args:
        A: m x n matrix
        s: n-dimensional vector
        q: Modulus

    Returns:
        m-dimensional result vector
    """
    return [sum(aij * sj for aij, sj in zip(ai, s)) % q for ai in A]


def _vec_add(u: List[int], v: List[int], q: int) -> List[int]:
    """
    Vector addition mod q.

    Args:
        u: First vector
        v: Second vector
        q: Modulus

    Returns:
        Element-wise sum mod q
    """
    return [(x + y) % q for x, y in zip(u, v)]


class ToyLWE:
    """
    Educational LWE-based key generation.

    WARNING: This is a TOY implementation for demonstration purposes.
    DO NOT USE IN PRODUCTION!

    For real applications, use:
    - NIST PQC standards (Kyber, Dilithium)
    - liboqs library
    - AWS KMS with PQ-hybrid algorithms

    The LWE problem: Given (A, b = As + e), find s
    where A is public matrix, s is secret, e is small error.
    """

    # Default parameters (educational, not secure)
    DEFAULT_Q = 12289  # Prime modulus
    DEFAULT_N = 64     # Secret dimension
    DEFAULT_M = 64     # Public key dimension
    DEFAULT_BOUND = 1  # Error bound

    def __init__(self, q: int = None, n: int = None, m: int = None, small_bound: int = None):
        """
        Initialize ToyLWE with parameters.

        Args:
            q: Modulus (prime number)
            n: Secret vector dimension
            m: Public key vector dimension
            small_bound: Bound for small coefficients
        """
        self.q = q or self.DEFAULT_Q
        self.n = n or self.DEFAULT_N
        self.m = m or self.DEFAULT_M
        self.small_bound = small_bound or self.DEFAULT_BOUND

    def generate_quantum_keypair(self, quantum_seed: int) -> Dict[str, str]:
        """
        Generate a toy LWE-style keypair.

        The quantum_seed provides additional entropy from quantum measurements.
        It is mixed with OS entropy for the actual key generation.

        Args:
            quantum_seed: Entropy from quantum random number generation

        Returns:
            Dict with 'private_key', 'public_key', 'algorithm' fields
        """
        # Step 1: Build strong seed material
        # Mix quantum seed with OS entropy and domain separator
        domain = b"ToyLWE-KeyGen-v1"
        mix = (
            domain
            + _int_to_be(quantum_seed, 16)  # Quantum-derived bits
            + os.urandom(32)                 # Strong OS entropy
        )

        # Step 2: Derive seeds via XOF
        xof = _shake256(mix, 64)
        seed_sk = xof[:32]  # For secret sampling context
        seed_A = xof[32:]   # For matrix generation

        # Step 3: Get parameters
        q, n, m, B = self.q, self.n, self.m, self.small_bound

        # Step 4: Sample small secret s and error e
        s = _sample_small(n, bound=B)
        e = _sample_small(m, bound=B)

        # Step 5: Derive matrix A from seed
        A = _prng_matrix_from_seed(seed_A, q, m, n)

        # Step 6: Compute b = A*s + e (mod q)
        b = _vec_add(_mat_vec(A, s, q), e, q)

        # Step 7: Serialize keys
        sk_obj = {
            "version": "toy-lwe-1",
            "q": q,
            "n": n,
            "m": m,
            "small_bound": B,
            "s": s,  # PRIVATE: secret vector
        }

        pk_obj = {
            "version": "toy-lwe-1",
            "q": q,
            "n": n,
            "m": m,
            "A_seed": base64.b64encode(seed_A).decode(),  # Compact: store seed not A
            "b": b,  # PUBLIC: b = A*s + e (mod q)
        }

        private_key = base64.b64encode(json.dumps(sk_obj).encode()).decode()
        public_key = base64.b64encode(json.dumps(pk_obj).encode()).decode()

        return {
            "private_key": private_key,
            "public_key": public_key,
            "algorithm": "ToyLWE-Quantum-Seeded-Demo"
        }

    @staticmethod
    def decode_public_key(public_key: str) -> Dict:
        """Decode a public key from base64."""
        return json.loads(base64.b64decode(public_key).decode())

    @staticmethod
    def decode_private_key(private_key: str) -> Dict:
        """Decode a private key from base64."""
        return json.loads(base64.b64decode(private_key).decode())


class QuantumResistantCrypto:
    """
    High-level quantum-resistant cryptographic operations.

    Provides:
    - Key generation using quantum entropy
    - Digital signatures
    - Signature verification
    """

    def __init__(self):
        """Initialize with default ToyLWE instance."""
        self.lwe = ToyLWE()

    def generate_quantum_keypair(self, quantum_seed: int) -> Dict[str, str]:
        """
        Generate quantum-resistant key pair.

        Args:
            quantum_seed: Entropy from quantum random number generation

        Returns:
            Dict with 'private_key', 'public_key', 'algorithm'
        """
        return self.lwe.generate_quantum_keypair(quantum_seed)

    def sign_message(self, message: str, private_key: str, quantum_entropy: int) -> str:
        """
        Create a digital signature.

        This is a simplified signature scheme for demonstration.
        Real implementations should use Dilithium or similar.

        Args:
            message: Message to sign
            private_key: Signer's private key
            quantum_entropy: Additional entropy from quantum source

        Returns:
            Base64-encoded signature
        """
        # Hash the message
        message_hash = hashlib.sha256(message.encode()).hexdigest()

        # Hash the quantum entropy
        entropy_hash = hashlib.sha256(str(quantum_entropy).encode()).hexdigest()

        # Combine with private key material
        signature_data = f"{message_hash}:{entropy_hash}:{private_key[:16]}"
        signature_hash = hashlib.sha256(signature_data.encode()).hexdigest()

        return base64.b64encode(signature_hash.encode()).decode()

    def verify_signature(self, message: str, signature: str, public_key: str) -> bool:
        """
        Verify a digital signature.

        Note: This is a simplified verification for demonstration.
        Real verification requires proper cryptographic protocols.

        Args:
            message: Original message
            signature: Signature to verify
            public_key: Signer's public key

        Returns:
            True if signature appears valid (simplified check)
        """
        # Simplified verification - just check non-empty
        # Real implementation would verify cryptographically
        if not signature or not public_key:
            return False

        try:
            # Decode signature
            decoded_sig = base64.b64decode(signature).decode()
            # Check it's a valid hex string (SHA256 output)
            int(decoded_sig, 16)
            return True
        except Exception:
            return False

    def create_signature_bundle(self, name: str, message: str,
                                quantum_number: int, device_id: str) -> Dict[str, str]:
        """
        Create a complete signature bundle with keys and signature.

        Args:
            name: Signer name
            message: Message content
            quantum_number: Quantum random number
            device_id: Quantum device identifier

        Returns:
            Dict with keypair and signature
        """
        # Generate keypair
        keypair = self.generate_quantum_keypair(quantum_number)

        # Create message to sign
        message_to_sign = f"{name}|{message}|{quantum_number}|{device_id}"

        # Sign the message
        signature = self.sign_message(
            message_to_sign,
            keypair['private_key'],
            quantum_number
        )

        return {
            'public_key': keypair['public_key'],
            'private_key': keypair['private_key'],
            'signature': signature,
            'algorithm': keypair['algorithm'],
            'signed_message': message_to_sign
        }
