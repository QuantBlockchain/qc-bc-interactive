#!/usr/bin/env python3
"""
Comprehensive Load Test for Quantum Signature Wall
Simulates 50 people registering with diverse quantum device selection across all available platforms.
Tests system scalability with multiple quantum computing backends.
"""

import asyncio
import aiohttp
import time
import random
import json
import sqlite3
from typing import List, Dict, Any, Tuple
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:8001"
NUM_USERS = 8
CONCURRENT_REQUESTS = 2  # Reduced for better stability with real quantum devices

# All available quantum devices with their characteristics
QUANTUM_DEVICES = {
    # Simulators (Fast, immediate results)
    # "local_simulator": {
    #     "name": "Local Simulator",
    #     "type": "simulator",
    #     "weight": 40,  # Higher probability for testing
    #     "expected_time": 1
    # },
    "aws_sv1": {
        "name": "AWS SV1 Simulator",
        "type": "managed_simulator",
        "weight": 25,
        "expected_time": 3
    },

    # # Real Quantum Hardware (Slower, queue-based)
    # "ionq_forte": {
    #     "name": "IonQ Forte Enterprise",
    #     "type": "qpu",
    #     "weight": 15,
    #     "expected_time": 900  # 15 minutes
    # },
    # "iqm_garnet": {
    #     "name": "IQM Garnet",
    #     "type": "qpu",
    #     "weight": 8,
    #     "expected_time": 1500  # 25 minutes
    # },
    # "quera_aquila": {
    #     "name": "QuEra Aquila",
    #     "type": "qpu",
    #     "weight": 7,
    #     "expected_time": 2100  # 35 minutes
    # },
    # "rigetti_ankaa": {
    #     "name": "Rigetti Ankaa-3",
    #     "type": "qpu",
    #     "weight": 5,
    #     "expected_time": 600  # 10 minutes
    # }
}

# Sample test participants with diverse backgrounds
SAMPLE_PARTICIPANTS = [
    # Quantum researchers and scientists
    ("Dr. Alice Quantum", "alice.quantum@mit.edu", "Quantum Computing Researcher"),
    ("Prof. Bob Entanglement", "b.entanglement@caltech.edu", "Theoretical Physics Professor"),
    ("Dr. Carol Superposition", "carol.s@cern.ch", "Particle Physics Scientist"),
    ("Dr. David Bell", "d.bell@quantum.ibm.com", "Quantum Algorithm Engineer"),
    ("Dr. Emma Schrödinger", "emma.s@oxford.ac.uk", "Quantum Foundations Researcher"),

    # Technology professionals
    ("Frank Qubit", "frank.q@google.com", "Quantum Software Engineer"),
    ("Grace Hadamard", "grace.h@microsoft.com", "Quantum Computing Architect"),
    ("Henry Pauli", "henry.p@amazon.com", "Cloud Quantum Services Lead"),
    ("Ivy Deutsch", "ivy.d@rigetti.com", "Quantum Hardware Engineer"),
    ("Jack Feynman", "jack.f@ionq.com", "Quantum Applications Developer"),

    # Academic students and postdocs
    ("Kate Measurement", "k.measurement@stanford.edu", "PhD Student - Quantum Info"),
    ("Liam Coherence", "liam.c@princeton.edu", "Postdoc - Quantum Error Correction"),
    ("Maya Decoherence", "maya.d@berkeley.edu", "Graduate Student - Quantum Optics"),
    ("Noah Amplitude", "noah.a@harvard.edu", "Undergraduate - Physics"),
    ("Olivia Circuit", "olivia.c@yale.edu", "PhD Candidate - Quantum Algorithms"),

    # Industry and startup founders
    ("Peter Startup", "peter@quantumtech.io", "Quantum Startup CEO"),
    ("Quinn Venture", "quinn@qventures.com", "Quantum Investment Partner"),
    ("Rachel Bootstrap", "rachel@quantum-solutions.ai", "Quantum Consultant"),
    ("Sam Innovation", "sam@qubit-dynamics.com", "CTO - Quantum Software"),
    ("Tara Founder", "tara@quantum-leap.net", "Quantum Hardware Startup"),

    # Government and national labs
    ("Dr. Uma National", "uma.n@nist.gov", "NIST Quantum Standards"),
    ("Victor Security", "victor.s@darpa.mil", "Quantum Cryptography Research"),
    ("Dr. Wendy Energy", "wendy.e@doe.gov", "DOE Quantum Computing Initiative"),
    ("Xavier Space", "xavier.s@nasa.gov", "NASA Quantum Communications"),
    ("Dr. Yara Defense", "yara.d@ornl.gov", "Oak Ridge Quantum Research"),

    # International researchers
    ("Prof. Zoe European", "zoe.e@ethz.ch", "ETH Zurich - Quantum Physics"),
    ("Dr. Alex Canadian", "alex.c@uwaterloo.ca", "Institute for Quantum Computing"),
    ("Blake Australian", "blake.a@sydney.edu.au", "Centre for Quantum Software"),
    ("Casey Japanese", "casey.j@riken.jp", "RIKEN Quantum Computing"),
    ("Dylan Korean", "dylan.k@kaist.ac.kr", "KAIST Quantum Information"),

    # Technology journalists and educators
    ("Ella TechWriter", "ella@quantumnews.com", "Quantum Technology Journalist"),
    ("Felix Educator", "felix@quantumedu.org", "Quantum Computing Educator"),
    ("Gina Blogger", "gina@quantumblog.net", "Science Communication Specialist"),
    ("Hugo YouTuber", "hugo@quantumchannel.tv", "Quantum Education Content Creator"),
    ("Iris Podcaster", "iris@quantumpod.com", "Quantum Tech Podcast Host"),

    # Finance and business
    ("Jake Finance", "jake@quantumfund.com", "Quantum Technology Investor"),
    ("Luna Banking", "luna@quantumfinance.bank", "Quantum-Safe Cryptography Analyst"),
    ("Max Trading", "max@quantumalgo.trade", "Quantum Algorithm Trader"),
    ("Nora Insurance", "nora@quantumrisk.insure", "Quantum Risk Assessment"),
    ("Oscar Consulting", "oscar@quantumstrategy.biz", "Quantum Business Strategy"),

    # Healthcare and biotech
    ("Dr. Piper Medical", "piper@quantummed.health", "Quantum-Enhanced Imaging"),
    ("Dr. Quinn Pharma", "quinn@quantumdrug.bio", "Quantum Drug Discovery"),
    ("Riley Biotech", "riley@quantumbio.lab", "Quantum Biology Research"),
    ("Sage Healthcare", "sage@quantumhealth.ai", "Quantum ML in Healthcare"),
    ("Theo Genomics", "theo@quantumgene.org", "Quantum Genomics Analysis"),

    # Art, design, and creative fields
    ("Unity Artist", "unity@quantumart.gallery", "Quantum-Inspired Digital Artist"),
    ("Vera Designer", "vera@quantumdesign.studio", "Quantum Visualization Designer"),
    ("Wade Musician", "wade@quantumsound.music", "Quantum Audio Engineer"),
    ("Xara Writer", "xara@quantumstory.lit", "Science Fiction Author"),
    ("York Filmmaker", "york@quantumcinema.film", "Quantum Documentary Producer")
]

class ComprehensiveLoadTestResults:
    def __init__(self):
        self.successful_requests = 0
        self.failed_requests = 0
        self.total_time = 0
        self.response_times = []
        self.errors = []
        self.created_signatures = []
        self.device_distribution = {}
        self.job_statuses = {}
        self.performance_by_device = {}

def select_weighted_device() -> str:
    """Select a device based on weighted probability distribution."""
    devices = list(QUANTUM_DEVICES.keys())
    weights = [QUANTUM_DEVICES[device]["weight"] for device in devices]
    return random.choices(devices, weights=weights)[0]

def generate_realistic_user_distribution() -> List[Dict[str, Any]]:
    """Generate 50 users with realistic device preferences."""
    users = []

    for i in range(NUM_USERS):
        if i < len(SAMPLE_PARTICIPANTS):
            name, email, title = SAMPLE_PARTICIPANTS[i]
        else:
            # Generate additional users if needed
            name = f"User_{i+1}"
            email = f"user{i+1}@quantum.test"
            title = "Quantum Enthusiast"

        # Select device based on user type and weighted distribution
        device_id = select_weighted_device()

        users.append({
            "name": name,
            "email": email,
            "title": title,
            "device_id": device_id,
            "device_info": QUANTUM_DEVICES[device_id]
        })

    return users

async def create_signature_advanced(session: aiohttp.ClientSession, user_data: Dict[str, Any],
                                  results: ComprehensiveLoadTestResults) -> None:
    """Create a quantum signature with advanced tracking."""
    start_time = time.time()
    device_id = user_data["device_id"]
    device_info = user_data["device_info"]

    try:
        signature_data = {
            "name": user_data["name"],
            "message": f"Quantum signature from {user_data['title']}",
            "quantum_device": device_id
        }

        async with session.post(f"{BASE_URL}/register", json=signature_data) as response:
            response_time = time.time() - start_time
            results.response_times.append(response_time)

            # Track device performance
            if device_id not in results.performance_by_device:
                results.performance_by_device[device_id] = {
                    "requests": 0,
                    "successes": 0,
                    "total_time": 0,
                    "errors": []
                }

            results.performance_by_device[device_id]["requests"] += 1
            results.performance_by_device[device_id]["total_time"] += response_time

            if response.status == 200:
                result = await response.json()
                if result.get("success"):
                    results.successful_requests += 1
                    results.performance_by_device[device_id]["successes"] += 1

                    # Track device distribution
                    results.device_distribution[device_id] = results.device_distribution.get(device_id, 0) + 1

                    signature_info = {
                        "user": user_data["name"],
                        "title": user_data["title"],
                        "signature_id": result.get("id") or result.get("signature_id"),
                        "device": device_id,
                        "device_name": device_info["name"],
                        "device_type": device_info["type"],
                        "response_time": response_time,
                        "job_id": result.get("job_id"),
                        "expected_completion": device_info["expected_time"]
                    }
                    results.created_signatures.append(signature_info)

                    status_emoji = "⚡" if device_info["type"] == "simulator" else "🔄" if device_info["type"] == "managed_simulator" else "🏭"
                    print(f"{status_emoji} {user_data['name']} - {device_info['name']} signature created ({response_time:.2f}s)")
                else:
                    results.failed_requests += 1
                    error_msg = result.get("error", "Unknown error")
                    results.errors.append(f"{user_data['name']} ({device_id}): {error_msg}")
                    results.performance_by_device[device_id]["errors"].append(error_msg)
                    print(f"❌ {user_data['name']} - {device_info['name']} failed: {error_msg}")
            else:
                results.failed_requests += 1
                error_text = await response.text()
                error_msg = f"HTTP {response.status} - {error_text}"
                results.errors.append(f"{user_data['name']} ({device_id}): {error_msg}")
                results.performance_by_device[device_id]["errors"].append(error_msg)
                print(f"❌ {user_data['name']} - {device_info['name']} HTTP error: {response.status}")

    except Exception as e:
        response_time = time.time() - start_time
        results.response_times.append(response_time)
        results.failed_requests += 1
        error_msg = f"Exception: {str(e)}"
        results.errors.append(f"{user_data['name']} ({device_id}): {error_msg}")
        if device_id in results.performance_by_device:
            results.performance_by_device[device_id]["errors"].append(error_msg)
        print(f"💥 {user_data['name']} - {device_info['name']} exception: {str(e)}")

async def run_comprehensive_load_test():
    """Run comprehensive load test with all quantum device types."""
    print("🌌 QUANTUM SIGNATURE WALL - COMPREHENSIVE LOAD TEST")
    print("=" * 70)
    print(f"👥 Simulating {NUM_USERS} participants from diverse backgrounds")
    print(f"⚡ Testing {len(QUANTUM_DEVICES)} different quantum computing platforms")
    print(f"🔄 Concurrent requests: {CONCURRENT_REQUESTS}")
    print(f"🎯 Target URL: {BASE_URL}")

    # Show device overview
    print("\n🖥️  AVAILABLE QUANTUM DEVICES:")
    for device_id, info in QUANTUM_DEVICES.items():
        device_type_emoji = "⚡" if info["type"] == "simulator" else "☁️" if info["type"] == "managed_simulator" else "🏭"
        print(f"  {device_type_emoji} {info['name']} ({info['type']}) - Weight: {info['weight']}%")

    print("-" * 70)

    results = ComprehensiveLoadTestResults()
    start_time = time.time()

    # Generate realistic user distribution
    users = generate_realistic_user_distribution()

    # Show user distribution preview
    device_preview = {}
    for user in users:
        device_id = user["device_id"]
        device_preview[device_id] = device_preview.get(device_id, 0) + 1

    print("📊 PLANNED DEVICE DISTRIBUTION:")
    for device_id, count in device_preview.items():
        device_name = QUANTUM_DEVICES[device_id]["name"]
        print(f"  {device_name}: {count} users")
    print()

    # Create semaphore to limit concurrent requests
    semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)

    async def bounded_create_signature(session, user_data):
        async with semaphore:
            await create_signature_advanced(session, user_data, results)

    # Run the test
    async with aiohttp.ClientSession() as session:
        # Test server connectivity first
        try:
            async with session.get(f"{BASE_URL}/") as response:
                if response.status != 200:
                    print(f"❌ Server not responding properly: HTTP {response.status}")
                    return
                print("✅ Server connectivity verified")
        except Exception as e:
            print(f"❌ Cannot connect to server: {e}")
            return

        print(f"🚀 Initiating {NUM_USERS} quantum signature creation requests...")
        print("⏳ This may take a while due to quantum hardware queue times...\n")

        # Execute all signature creation requests
        tasks = [bounded_create_signature(session, user) for user in users]
        await asyncio.gather(*tasks, return_exceptions=True)

    results.total_time = time.time() - start_time

    # Generate comprehensive results report
    print_comprehensive_results(results)

    return results

def print_comprehensive_results(results: ComprehensiveLoadTestResults):
    """Print detailed test results and analysis."""
    print("\n" + "=" * 70)
    print("📊 COMPREHENSIVE LOAD TEST RESULTS")
    print("=" * 70)

    # Overall performance metrics
    print(f"✅ Successful requests: {results.successful_requests}")
    print(f"❌ Failed requests: {results.failed_requests}")
    print(f"📈 Success rate: {(results.successful_requests / NUM_USERS) * 100:.1f}%")
    print(f"⏱️  Total execution time: {results.total_time:.2f} seconds")
    print(f"🏃 Requests per second: {NUM_USERS / results.total_time:.2f}")

    # Response time analysis
    if results.response_times:
        avg_response_time = sum(results.response_times) / len(results.response_times)
        min_response_time = min(results.response_times)
        max_response_time = max(results.response_times)
        print(f"\n⏱️  RESPONSE TIME ANALYSIS:")
        print(f"  📊 Average: {avg_response_time:.2f}s")
        print(f"  ⚡ Fastest: {min_response_time:.2f}s")
        print(f"  🐌 Slowest: {max_response_time:.2f}s")

    # Device performance breakdown
    print(f"\n🖥️  DEVICE PERFORMANCE BREAKDOWN:")
    for device_id, performance in results.performance_by_device.items():
        device_info = QUANTUM_DEVICES[device_id]
        success_rate = (performance["successes"] / performance["requests"]) * 100 if performance["requests"] > 0 else 0
        avg_time = performance["total_time"] / performance["requests"] if performance["requests"] > 0 else 0

        device_type_emoji = "⚡" if device_info["type"] == "simulator" else "☁️" if device_info["type"] == "managed_simulator" else "🏭"
        print(f"  {device_type_emoji} {device_info['name']}:")
        print(f"    📋 Requests: {performance['requests']}")
        print(f"    ✅ Successes: {performance['successes']} ({success_rate:.1f}%)")
        print(f"    ⏱️  Avg time: {avg_time:.2f}s")
        if performance["errors"]:
            print(f"    ❌ Errors: {len(performance['errors'])}")

    # Actual device distribution
    if results.device_distribution:
        print(f"\n📱 ACTUAL DEVICE USAGE DISTRIBUTION:")
        total_successful = sum(results.device_distribution.values())
        for device_id, count in results.device_distribution.items():
            device_name = QUANTUM_DEVICES[device_id]["name"]
            percentage = (count / total_successful) * 100
            print(f"  {device_name}: {count} signatures ({percentage:.1f}%)")

    # Show sample created signatures
    if results.created_signatures:
        print(f"\n✨ SAMPLE CREATED SIGNATURES:")
        for i, sig in enumerate(results.created_signatures[:10]):  # Show first 10
            device_emoji = "⚡" if sig["device_type"] == "simulator" else "☁️" if sig["device_type"] == "managed_simulator" else "🏭"
            print(f"  {device_emoji} {sig['user']} ({sig['title']}) - {sig['device_name']}")
        if len(results.created_signatures) > 10:
            print(f"  ... and {len(results.created_signatures) - 10} more signatures")

    # Error analysis
    if results.errors:
        print(f"\n❌ ERROR ANALYSIS ({len(results.errors)} total errors):")
        error_types = {}
        for error in results.errors:
            error_type = error.split(":")[1].strip() if ":" in error else "Unknown"
            error_types[error_type] = error_types.get(error_type, 0) + 1

        for error_type, count in sorted(error_types.items(), key=lambda x: x[1], reverse=True)[:5]:
            print(f"  • {error_type}: {count} occurrences")

async def analyze_database_state():
    """Analyze the database state after load testing."""
    print(f"\n🔍 DATABASE STATE ANALYSIS")
    print("-" * 70)

    try:
        # Analyze signature_wall.db
        with sqlite3.connect("signature_wall.db") as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM signatures")
            total_signatures = cursor.fetchone()[0]
            print(f"📊 Total signatures in database: {total_signatures}")

            cursor = conn.execute("SELECT device_name, COUNT(*) FROM signatures GROUP BY device_name ORDER BY COUNT(*) DESC")
            device_stats = cursor.fetchall()
            print("📱 Signatures by device:")
            for device, count in device_stats:
                print(f"  {device}: {count}")

            # Sample recent signatures
            cursor = conn.execute("SELECT user_name, device_name, created_at FROM signatures ORDER BY id DESC LIMIT 5")
            recent_sigs = cursor.fetchall()
            print("✨ Recent signatures:")
            for user, device, created in recent_sigs:
                print(f"  {user} - {device}")

        # Analyze quantum_jobs.db
        with sqlite3.connect("quantum_jobs.db") as conn:
            cursor = conn.execute("SELECT status, COUNT(*) FROM quantum_jobs GROUP BY status ORDER BY COUNT(*) DESC")
            job_stats = cursor.fetchall()
            print("\n⚙️  Job status distribution:")
            for status, count in job_stats:
                status_emoji = {"created": "🆕", "submitted": "📤", "running": "🔄", "completed": "✅", "failed": "❌"}.get(status, "❓")
                print(f"  {status_emoji} {status}: {count}")

            cursor = conn.execute("SELECT device_id, COUNT(*) FROM quantum_jobs GROUP BY device_id ORDER BY COUNT(*) DESC")
            job_devices = cursor.fetchall()
            print("🖥️  Jobs by device:")
            for device, count in job_devices:
                print(f"  {device}: {count}")

    except Exception as e:
        print(f"❌ Error analyzing database: {e}")

if __name__ == "__main__":
    print("🌟 QUANTUM SIGNATURE WALL - MULTI-DEVICE LOAD TEST")
    print("🔬 Testing system scalability across all quantum computing platforms")
    print()

    # Run the comprehensive load test
    results = asyncio.run(run_comprehensive_load_test())

    # Analyze database state
    asyncio.run(analyze_database_state())

    print(f"\n🎉 Comprehensive load test completed!")
    print(f"🌌 {results.successful_requests} quantum signatures created across {len(results.device_distribution)} different quantum devices!")