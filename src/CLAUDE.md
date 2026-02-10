# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Quantum Signature Wall application - an advanced interactive demo showcasing quantum computing, blockchain technology, and post-quantum cryptography. The application generates quantum-resistant digital signatures and displays them in a stunning 3D visualization wall.

## Development Commands

### Package Management
- **Add dependencies**: `uv add <package-name>` - Add new pip packages
- **Start application**: `uv run python main.py` - Runs the FastAPI server on port 8001
- **Execute any Python script**: `uv run python <script.py>` - Execute Python files

### Python Environment
- Python version: 3.13+ (specified in `.python-version`)
- Uses `uv` for package management instead of pip/poetry

## Architecture Overview

This is a multi-layered application with distinct separation between quantum computing, cryptography, and visualization systems.

### Core System Architecture

**Multi-Service Architecture:**
1. **Quantum Layer** (`signature_wall_system.py`, `enhanced_quantum_service.py`) - Device management and quantum computation
2. **Web Layer** (`main.py`) - FastAPI backend with comprehensive REST endpoints
3. **Presentation Layer** (`templates/`, `static/`) - Multi-page interactive frontend

**Key Service Components:**
- **QuantumSignatureWallSystem**: Main orchestrator for signature generation and wall management
- **EnhancedQuantumService**: Advanced quantum device management with AWS Braket integration
- **QuantumDeviceManager**: Device abstraction layer supporting local simulators and AWS quantum computers
- **AsyncQuantumJobManager**: Job queuing and monitoring system for quantum computations
- **QuantumResistantCrypto**: Post-quantum cryptography implementation

### Key Components

**Backend Systems:**
- **main.py**: FastAPI application with endpoints for signatures, jobs, devices, and admin functions
- **signature_wall_system.py**: Primary quantum signature system with post-quantum cryptography
- **enhanced_quantum_service.py**: Advanced device management supporting local simulators and AWS Braket quantum computers
- **event_system.py**: Legacy event registration system (may be deprecated)
- **quantum_blockchain.py**: Basic quantum blockchain implementation (legacy)

**Frontend Architecture:**
- **templates/index.html**: Landing page with platform overview and navigation
- **templates/signup.html**: Signature creation interface with device selection
- **templates/wall.html**: Interactive 3D signature wall visualization
- **templates/jobs.html**: Quantum job monitoring and device statistics dashboard
- **templates/admin.html**: Administrative interface for system management
- **static/css/style.css**: Advanced CSS with quantum animations and glassmorphism effects
- **static/js/**: Page-specific JavaScript modules with quantum visualizations

### Database Architecture

**Multi-Database System:**
- **signature_wall.db**: Primary database for quantum signatures with cryptographic keys and visual properties
- **quantum_jobs.db**: Job management and device performance tracking
- **event_registrations.db**: Legacy database for original event system

**Key Database Schema:**
- **signatures table**: quantum_number, entanglement_data, public_key, private_key, signature, visual_color, position_x, position_y, device_id, device_name, job_id
- All databases use SQLite with threading locks for concurrent access

### Quantum Computing Integration

**Multi-Device Support:**
- **Local Simulator**: Fast development testing with immediate results
- **AWS SV1**: Managed state vector simulator for high-performance quantum circuits
- **AWS quantum computers**: Real quantum hardware support (IonQ, Rigetti, etc.)
- Device abstraction layer allows seamless switching between simulators and hardware

**Quantum Circuit Architecture:**
- Bell state circuits for quantum entanglement demonstrations
- Quantum random number generation for cryptographic seed material
- Asynchronous job management for long-running quantum computations
- Device performance tracking and optimization

**Quantum-Resistant Cryptography:**
- Post-quantum lattice-based key generation using quantum entropy
- Digital signatures resistant to quantum computer attacks
- Each signature uses quantum measurements for cryptographic randomness

### Visualization System

**3D Signature Wall:**
- Signatures positioned based on quantum entanglement coordinates
- Dynamic color generation from quantum state probabilities
- Real-time interactive cards with hover effects and modal details
- Animated quantum particle background with glassmorphism design
- Multi-page architecture: landing page, signature creation, wall visualization, job monitoring, admin dashboard

## System Evolution

The project has evolved through three major phases:
1. **Basic Demo** - Simple quantum number generation with blockchain storage (`quantum_blockchain.py`)
2. **Event Registration** - Optimized for multiple users with participant management (`event_system.py`)
3. **Signature Wall** - Advanced visualization with quantum-resistant cryptography (`signature_wall_system.py`, `enhanced_quantum_service.py`)

Current implementation focuses on the Signature Wall system with enhanced device support while maintaining compatibility with legacy systems.

## Development Notes

- Application runs on port 8001 by default (`uv run python main.py`)
- Multiple SQLite databases are created automatically on first run (signature_wall.db, quantum_jobs.db, event_registrations.db)
- Quantum simulations use local simulator for development (no AWS credentials required)
- For AWS Braket devices, configure AWS credentials and select device in the frontend
- Frontend uses Chart.js for quantum entanglement visualizations
- CSS includes extensive quantum-themed animations and effects
- Each page has dedicated JavaScript modules in static/js/
- use uv run to run your python code, use uv add to add missing packages