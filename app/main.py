from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import uvicorn
import hashlib
import os
import glob
import time
from datetime import datetime

# Import database configuration
from db_config import SIGNATURE_WALL_DB, QUANTUM_JOBS_DB, EVENT_REGISTRATIONS_DB

from signature_wall_system import QuantumSignatureWallSystem
from enhanced_quantum_service import EnhancedQuantumService, AsyncQuantumJobManager

is_debug = os.getenv("DEBUG", "false").lower() == "true"
if is_debug:
    import debugpy
    debugpy.listen(("0.0.0.0", 5678))
    print("Waiting for debugger to attach...")
    debugpy.wait_for_client()
    print("Debugger attached!")


app = FastAPI(title="Quantum Signature Wall")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "qc-bc-interactive"}

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Setup templates
templates = Jinja2Templates(directory="templates")

# Initialize systems with persistent database paths
signature_wall_system = QuantumSignatureWallSystem()
enhanced_quantum_service = EnhancedQuantumService()
job_manager = AsyncQuantumJobManager(db_path=QUANTUM_JOBS_DB)


def generate_cache_bust_hash():
    """Generate a hash based on static file modification times for cache busting"""
    try:
        # Get all CSS and JS files
        static_files = []
        static_files.extend(glob.glob("static/css/*.css"))
        static_files.extend(glob.glob("static/js/*.js"))

        # Calculate combined hash from file modification times
        hash_input = ""
        for file_path in sorted(static_files):
            if os.path.exists(file_path):
                mtime = str(os.path.getmtime(file_path))
                hash_input += f"{file_path}:{mtime};"

        # Generate short hash
        return hashlib.md5(hash_input.encode()).hexdigest()[:8]
    except Exception as e:
        # Fallback to timestamp
        print(f"Cache bust hash generation failed: {e}")
        return str(int(time.time()))


# Generate cache bust version once at startup
CACHE_BUST_VERSION = generate_cache_bust_hash()
print(f"Cache bust version: {CACHE_BUST_VERSION}")


def render_template_with_cache_bust(template_name: str, request: Request, **context):
    """Helper function to render templates with automatic cache busting"""
    import time
    context.update({
        "request": request,
        "cache_bust": str(int(time.time()))  # Use timestamp for immediate cache invalidation
    })
    return templates.TemplateResponse(template_name, context)


class SignatureRegistration(BaseModel):
    name: str
    message: str
    quantum_device: str = "local_simulator"

class TokenValidation(BaseModel):
    token: str

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Serve the main landing page"""
    return render_template_with_cache_bust("index.html", request)

@app.get("/ux", response_class=HTMLResponse)
async def home(request: Request):
    """Serve the ux page"""
    return render_template_with_cache_bust("ux/index.html", request)


@app.get("/wall", response_class=HTMLResponse)
async def signature_wall(request: Request):
    """Serve the quantum signature wall page"""
    return render_template_with_cache_bust("wall.html", request)


@app.get("/signup", response_class=HTMLResponse)
async def signup_page(request: Request):
    """Serve the signature creation page"""
    return render_template_with_cache_bust("signup.html", request)

@app.post("/api/validate-signup-token")
async def validate_signup_token(token_data: TokenValidation):
    """Validate the signup access token"""
    # Get token from environment variable or use default
    valid_token = os.getenv("SIGNUP_ACCESS_TOKEN", "QC2024BRAKET")

    if token_data.token == valid_token:
        return {
            "success": True,
            "message": "Token validated successfully"
        }
    else:
        return {
            "success": False,
            "message": "Invalid access token"
        }

@app.get("/jobs", response_class=HTMLResponse)
async def jobs_page(request: Request):
    """Serve the job monitoring page"""
    return render_template_with_cache_bust("jobs.html", request)


@app.post("/register")
async def register_signature(signature_registration: SignatureRegistration):
    """Register a new quantum signature with device selection"""
    result = await signature_wall_system.register_signature(
        signature_registration.name,
        signature_registration.message,
        signature_registration.quantum_device
    )
    return result


@app.get("/signatures")
async def get_signatures():
    """Get all signatures for the wall"""
    signatures = signature_wall_system.get_all_signatures()
    return signatures


@app.get("/stats")
async def get_signature_stats():
    """Get signature wall statistics"""
    stats = signature_wall_system.get_signature_stats()
    return stats


@app.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request):
    """Serve the admin page"""
    return render_template_with_cache_bust("admin.html", request)


@app.get("/jobs/stats")
async def get_job_stats():
    """Get quantum job statistics"""
    return job_manager.get_job_stats()


@app.get("/jobs/active")
async def get_active_jobs():
    """Get currently active quantum jobs"""
    return job_manager.get_active_jobs()


@app.get("/jobs/recent")
async def get_recent_jobs():
    """Get recent quantum job history"""
    return job_manager.get_recent_jobs()


@app.get("/jobs/device-stats")
async def get_device_stats():
    """Get device performance statistics"""
    return job_manager.get_device_stats()


@app.get("/jobs/categories")
async def get_job_categories():
    """Get job statistics by device category"""
    device_manager = enhanced_quantum_service.device_manager
    categories = {
        "simulator": {"name": "Local Simulators", "devices": [], "total_jobs": 0, "active": 0, "completed": 0, "failed": 0},
        "managed_simulator": {"name": "Cloud Simulators", "devices": [], "total_jobs": 0, "active": 0, "completed": 0, "failed": 0},
        "qpu": {"name": "Quantum Hardware", "devices": [], "total_jobs": 0, "active": 0, "completed": 0, "failed": 0}
    }

    # Get device info and job stats
    all_devices = device_manager.get_available_devices()
    device_stats = job_manager.get_device_stats()
    job_status_stats = job_manager.get_job_status_by_device()

    for device_id, device_info in all_devices.items():
        device_type = device_info['type']
        if device_type in categories:
            device_data = {
                "id": device_id,
                "name": device_info['name'],
                "description": device_info['description'],
                "jobs": device_stats.get(device_id, {"jobs": 0, "avg_time": "N/A"})["jobs"],
                "avg_time": device_stats.get(device_id, {"jobs": 0, "avg_time": "N/A"})["avg_time"],
                "status_breakdown": job_status_stats.get(device_id, {"active": 0, "completed": 0, "failed": 0})
            }
            categories[device_type]["devices"].append(device_data)
            categories[device_type]["total_jobs"] += device_data["jobs"]
            categories[device_type]["active"] += device_data["status_breakdown"]["active"]
            categories[device_type]["completed"] += device_data["status_breakdown"]["completed"]
            categories[device_type]["failed"] += device_data["status_breakdown"]["failed"]

    return categories


@app.get("/jobs/enhanced-stats")
async def get_enhanced_job_stats():
    """Get enhanced job statistics with device categorization"""
    basic_stats = job_manager.get_job_stats()
    device_stats = job_manager.get_device_stats()

    # Calculate processing stats
    total_signatures = len(signature_wall_system.get_all_signatures())
    total_jobs = basic_stats["active"] + basic_stats["completed"] + basic_stats["failed"]

    return {
        **basic_stats,
        "total_signatures": total_signatures,
        "total_jobs": total_jobs,
        "tracking_coverage": f"{(total_jobs / total_signatures * 100):.1f}%" if total_signatures > 0 else "0%",
        "device_breakdown": device_stats,
        "performance_summary": {
            "fastest_device": None,
            "slowest_device": None,
            "most_used_device": None
        }
    }


@app.get("/jobs/{job_id}")
async def get_job_details(job_id: str):
    """Get detailed information about a specific job"""
    job = job_manager.get_job_by_id(job_id)
    if job:
        return {"success": True, **job}
    return {"success": False, "error": "Job not found"}


@app.get("/job-status/{job_id}")
async def get_job_status(job_id: str):
    """Get status information for a specific quantum job"""
    job = job_manager.get_job_by_id(job_id)
    if job:
        # Return simplified status information
        return {
            "success": True,
            "job_id": job_id,
            "status": job.get("status", "unknown"),
            "message": f"Job {job.get('status', 'unknown')}",
            "estimated_completion": job.get("estimated_completion"),
            "created_at": job.get("created_at"),
            "completed_at": job.get("completed_at"),
            "error_message": job.get("error_message"),
            "result_data": job.get("result_data")
        }
    return {"success": False, "status": "not_found", "message": "Job not found"}


@app.get("/debug/signatures")
async def debug_signatures():
    """Debug endpoint to see signature data"""
    signatures = signature_wall_system.get_all_signatures()
    return {"signatures": signatures}


@app.get("/debug/job/{job_id}")
async def debug_job(job_id: str):
    """Debug endpoint to see job data"""
    job = job_manager.get_job_by_id(job_id)
    return {"job": job}


@app.post("/admin/update-device-results")
async def update_device_results():
    """Update signatures with completed device results"""
    try:
        import sqlite3
        updated_count = 0

        # Get all signatures that have device jobs but no device results
        signatures = signature_wall_system.get_all_signatures()

        for signature in signatures:
            if (signature.get('device_job_id') and
                signature.get('device_quantum_number') is None):

                # Get the job data
                job = job_manager.get_job_by_id(signature['device_job_id'])
                if job and job.get('status') == 'completed' and job.get('result_data'):
                    try:
                        import json
                        result_data = json.loads(job['result_data'])

                        # Update the signature with device results
                        with sqlite3.connect(SIGNATURE_WALL_DB) as conn:
                            conn.execute("""
                                UPDATE signatures
                                SET device_quantum_number = ?, device_entanglement_data = ?
                                WHERE id = ?
                            """, (
                                result_data['quantum_number'],
                                json.dumps(result_data['entanglement_data']),
                                signature['id']
                            ))
                            conn.commit()
                            updated_count += 1
                            print(f"Updated signature {signature['id']} with device results")
                    except Exception as e:
                        print(f"Error updating signature {signature['id']}: {e}")

        return {
            "success": True,
            "message": f"Updated {updated_count} signatures with device results",
            "updated_count": updated_count
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/devices")
async def get_available_devices():
    """Get list of available quantum devices"""
    return enhanced_quantum_service.get_available_devices()


@app.post("/admin/upgrade-signature/{signature_id}")
async def upgrade_signature_with_device_results(signature_id: int):
    """Upgrade a signature with device quantum results"""
    result = await signature_wall_system.upgrade_signature_with_device_results(signature_id)
    return result


@app.get("/admin/data-consistency")
async def check_data_consistency():
    """Check data consistency between signatures, jobs, and wall display"""
    try:
        # Get all signatures
        signatures = signature_wall_system.get_all_signatures()
        signature_count = len(signatures)

        # Get all job statistics
        job_stats = job_manager.get_job_stats()
        recent_jobs = job_manager.get_recent_jobs()
        total_jobs = len(recent_jobs)

        # Get wall stats
        wall_stats = signature_wall_system.get_signature_stats()
        wall_display_count = wall_stats['total_signatures']

        # Expected relationships
        expected_jobs = signature_count * 2  # Each signature should have local + device job

        # Validate job references in signatures
        job_reference_issues = []
        orphaned_signatures = []
        job_ids_from_signatures = set()

        for signature in signatures:
            local_job_id = signature.get('local_job_id')
            device_job_id = signature.get('device_job_id')

            # Check if signature has required job IDs
            if not local_job_id:
                job_reference_issues.append(f"Signature {signature['id']} ({signature['name']}) missing local_job_id")
            else:
                job_ids_from_signatures.add(local_job_id)

            if not device_job_id:
                job_reference_issues.append(f"Signature {signature['id']} ({signature['name']}) missing device_job_id")
            else:
                job_ids_from_signatures.add(device_job_id)

            # Check if referenced jobs actually exist
            if local_job_id:
                local_job = job_manager.get_job_by_id(local_job_id)
                if not local_job:
                    orphaned_signatures.append(f"Signature {signature['id']} references non-existent local job {local_job_id}")

            if device_job_id:
                device_job = job_manager.get_job_by_id(device_job_id)
                if not device_job:
                    orphaned_signatures.append(f"Signature {signature['id']} references non-existent device job {device_job_id}")

        # Check for orphaned jobs (jobs not referenced by any signature)
        orphaned_jobs = []
        job_ids_from_jobs = {job['job_id'] for job in recent_jobs}

        for job_id in job_ids_from_jobs:
            if job_id not in job_ids_from_signatures:
                job = job_manager.get_job_by_id(job_id)
                orphaned_jobs.append(f"Job {job_id} ({job.get('device_id', 'unknown')}) not referenced by any signature")

        # Data consistency checks
        consistency_issues = []

        if signature_count != wall_display_count:
            consistency_issues.append(f"Signature count mismatch: DB has {signature_count}, wall shows {wall_display_count}")

        if total_jobs != expected_jobs:
            consistency_issues.append(f"Job count mismatch: Expected {expected_jobs} jobs for {signature_count} signatures, found {total_jobs}")

        # Calculate health score
        total_checks = 4  # signature count, job count, job references, orphaned data
        issues_count = (
            (1 if signature_count != wall_display_count else 0) +
            (1 if total_jobs != expected_jobs else 0) +
            (1 if job_reference_issues else 0) +
            (1 if orphaned_jobs or orphaned_signatures else 0)
        )
        health_score = ((total_checks - issues_count) / total_checks) * 100

        return {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'health_score': round(health_score, 1),
            'summary': {
                'signatures_in_db': signature_count,
                'signatures_on_wall': wall_display_count,
                'total_quantum_jobs': total_jobs,
                'expected_jobs': expected_jobs,
                'active_jobs': job_stats['active'],
                'completed_jobs': job_stats['completed'],
                'failed_jobs': job_stats['failed']
            },
            'consistency_status': {
                'signature_wall_sync': signature_count == wall_display_count,
                'job_count_correct': total_jobs == expected_jobs,
                'all_job_references_valid': len(job_reference_issues) == 0,
                'no_orphaned_data': len(orphaned_jobs) == 0 and len(orphaned_signatures) == 0
            },
            'issues': {
                'consistency_issues': consistency_issues,
                'job_reference_issues': job_reference_issues,
                'orphaned_signatures': orphaned_signatures,
                'orphaned_jobs': orphaned_jobs
            },
            'recommendations': generate_consistency_recommendations(
                consistency_issues, job_reference_issues, orphaned_signatures, orphaned_jobs
            )
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

def generate_consistency_recommendations(consistency_issues, job_reference_issues, orphaned_signatures, orphaned_jobs):
    """Generate recommendations based on data consistency issues"""
    recommendations = []

    if consistency_issues:
        recommendations.append("🔄 Run data refresh to sync signature counts")

    if job_reference_issues:
        recommendations.append("🔧 Update signatures with missing job references")

    if orphaned_signatures:
        recommendations.append("🗑️ Clean up signatures referencing non-existent jobs")

    if orphaned_jobs:
        recommendations.append("🧹 Remove orphaned jobs not associated with signatures")

    if not any([consistency_issues, job_reference_issues, orphaned_signatures, orphaned_jobs]):
        recommendations.append("✅ Data is consistent - no action needed")

    return recommendations


@app.post("/admin/fix-data-consistency")
async def fix_data_consistency():
    """Attempt to fix data consistency issues automatically"""
    try:
        consistency_check = await check_data_consistency()

        if not consistency_check['success']:
            return consistency_check

        fixes_applied = []

        # Fix 1: Remove orphaned jobs
        orphaned_jobs = consistency_check['issues']['orphaned_jobs']
        for orphan_msg in orphaned_jobs:
            # Extract job ID from message
            job_id = orphan_msg.split('Job ')[1].split(' ')[0]
            try:
                # Note: We would need to implement delete_job in job_manager
                # For now, just log the issue
                fixes_applied.append(f"Identified orphaned job for cleanup: {job_id}")
            except Exception as e:
                fixes_applied.append(f"Failed to remove orphaned job {job_id}: {e}")

        # Fix 2: Log missing job references (manual fix needed)
        job_ref_issues = consistency_check['issues']['job_reference_issues']
        for issue in job_ref_issues:
            fixes_applied.append(f"Manual fix needed: {issue}")

        # Recheck consistency after fixes
        post_fix_check = await check_data_consistency()

        return {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'fixes_applied': fixes_applied,
            'pre_fix_health_score': consistency_check['health_score'],
            'post_fix_health_score': post_fix_check['health_score'],
            'improvement': round(post_fix_check['health_score'] - consistency_check['health_score'], 1)
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }


@app.post("/admin/clear")
async def clear_all_data():
    """Clear all signatures and quantum jobs (admin function)"""
    # Clear signatures
    signature_result = signature_wall_system.clear_all_signatures()

    # Clear quantum jobs
    job_result = job_manager.clear_all_jobs()

    # Return comprehensive result
    return {
        'success': True,
        'message': f'Cleared {signature_result["signatures_removed"]} signatures and {job_result["jobs_removed"]} quantum jobs',
        'signatures_removed': signature_result['signatures_removed'],
        'jobs_removed': job_result['jobs_removed'],
        'total_items_cleared': signature_result['signatures_removed'] + job_result['jobs_removed']
    }


def main():
    print("Starting Quantum Signature Wall Server...")
    uvicorn.run(app, host="0.0.0.0", port=8001)


if __name__ == "__main__":
    main()
