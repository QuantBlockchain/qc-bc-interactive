"""
Database configuration for EFS persistence
"""
import os

# Database directory for EFS persistence
DB_DIR = os.environ.get('DB_DIR', '/app/data')

# Ensure database directory exists
os.makedirs(DB_DIR, exist_ok=True)

# Database paths
SIGNATURE_WALL_DB = os.path.join(DB_DIR, 'signature_wall.db')
QUANTUM_JOBS_DB = os.path.join(DB_DIR, 'quantum_jobs.db')
EVENT_REGISTRATIONS_DB = os.path.join(DB_DIR, 'event_registrations.db')

print(f"Database directory: {DB_DIR}")
print(f"Signature wall DB: {SIGNATURE_WALL_DB}")
print(f"Quantum jobs DB: {QUANTUM_JOBS_DB}")
print(f"Event registrations DB: {EVENT_REGISTRATIONS_DB}")
