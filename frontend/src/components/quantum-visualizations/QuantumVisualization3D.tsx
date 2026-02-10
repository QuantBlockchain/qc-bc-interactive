'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface QuantumVisualization3DProps {
  type: 'cloud' | 'cloud-dm' | 'cloud-gpu' | 'ion' | 'ion-aqt' | 'superconducting' | 'atom' | 'rigetti';
  autoRotate?: boolean;
  className?: string;
}

// Particle component for floating effects
function Particle({ delay, duration, color, size, startX, startY }: {
  delay: number;
  duration: number;
  color: string;
  size: number;
  startX: number;
  startY: number;
}) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        left: `${startX}%`,
        top: `${startY}%`,
        animation: `particleFloat ${duration}s ease-in-out ${delay}s infinite`,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
    />
  );
}

// Energy ring component
function EnergyRing({ delay, color, size }: { delay: number; color: string; size: number }) {
  return (
    <div
      className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        border: `2px solid ${color}`,
        transform: 'translate(-50%, -50%)',
        animation: `energyExpand 3s ease-out ${delay}s infinite`,
        opacity: 0,
      }}
    />
  );
}

// Cloud/Server Visualization - Data Center Style
function CloudVisualization() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Holographic base grid */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-24">
        <div className="holo-grid" />
      </div>

      {/* Floating data particles */}
      {[...Array(20)].map((_, i) => (
        <Particle
          key={i}
          delay={i * 0.3}
          duration={4 + Math.random() * 2}
          color={i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#3b82f6' : '#f97316'}
          size={3 + Math.random() * 4}
          startX={20 + Math.random() * 60}
          startY={20 + Math.random() * 60}
        />
      ))}

      {/* Server rack with 3D effect */}
      <div className="server-rack-3d">
        <div className="server-rack-face front">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="server-unit-3d">
              <div className="server-led-strip">
                <div className="server-led-3d green" style={{ animationDelay: `${i * 0.1}s` }} />
                <div className="server-led-3d blue" style={{ animationDelay: `${i * 0.15}s` }} />
                <div className="server-led-3d orange" style={{ animationDelay: `${i * 0.2}s` }} />
              </div>
              <div className="server-activity-bar" style={{ animationDelay: `${i * 0.2}s` }} />
            </div>
          ))}
        </div>
        <div className="server-rack-face back" />
        <div className="server-rack-face left" />
        <div className="server-rack-face right" />
        <div className="server-rack-face top" />
        <div className="server-rack-face bottom" />
      </div>

      {/* Data flow lines */}
      <div className="data-flow-container">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="data-flow-line"
            style={{
              animationDelay: `${i * 0.4}s`,
              left: `${30 + i * 10}%`,
            }}
          />
        ))}
      </div>

      {/* Holographic display */}
      <div className="holo-display">
        <span className="holo-text">QUANTUM SIM</span>
      </div>
    </div>
  );
}

// DM1 Density Matrix Visualization - Amber server rack + floating rho matrix + noise channels
function CloudDMVisualization() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Holographic base grid - amber */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-24">
        <div className="holo-grid dm-grid" />
      </div>

      {/* Floating data particles - amber tones */}
      {[...Array(16)].map((_, i) => (
        <Particle
          key={i}
          delay={i * 0.3}
          duration={4 + Math.random() * 2}
          color={i % 3 === 0 ? '#f59e0b' : i % 3 === 1 ? '#d97706' : '#fbbf24'}
          size={3 + Math.random() * 4}
          startX={20 + Math.random() * 60}
          startY={20 + Math.random() * 60}
        />
      ))}

      {/* Noise channel waves - unique to DM1 */}
      <div className="dm-noise-container">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="dm-noise-wave" style={{ animationDelay: `${i * 0.7}s`, top: `${25 + i * 18}%` }} />
        ))}
      </div>

      {/* Server rack - amber themed */}
      <div className="server-rack-3d">
        <div className="server-rack-face front dm-front">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="server-unit-3d dm-unit">
              <div className="server-led-strip">
                <div className="server-led-3d amber" style={{ animationDelay: `${i * 0.1}s` }} />
                <div className="server-led-3d yellow" style={{ animationDelay: `${i * 0.15}s` }} />
                <div className="server-led-3d orange" style={{ animationDelay: `${i * 0.2}s` }} />
              </div>
              {/* Density matrix mini-grid */}
              <div className="dm-matrix-grid">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="dm-matrix-cell" style={{ animationDelay: `${(i * 4 + j) * 0.08}s` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="server-rack-face back" />
        <div className="server-rack-face left" />
        <div className="server-rack-face right" />
        <div className="server-rack-face top" />
        <div className="server-rack-face bottom" />
      </div>

      {/* Floating density matrix rho display */}
      <div className="dm-rho-display">
        <div className="dm-rho-symbol">&rho;</div>
        <div className="dm-rho-matrix">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="dm-rho-cell" style={{ animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
        <div className="dm-rho-ring" />
      </div>

      {/* Data flow lines - amber */}
      <div className="data-flow-container">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="data-flow-line dm-flow"
            style={{
              animationDelay: `${i * 0.4}s`,
              left: `${30 + i * 10}%`,
            }}
          />
        ))}
      </div>

      {/* Holographic display */}
      <div className="holo-display">
        <span className="holo-text dm-text">DENSITY MATRIX</span>
      </div>

      {/* Energy rings - amber */}
      {[0, 0.6, 1.2].map((delay, i) => (
        <EnergyRing key={i} delay={delay} color="#f59e0b" size={50 + i * 35} />
      ))}
    </div>
  );
}

// TN1 GPU Tensor Network Visualization - GPU card + tensor contraction + compute waves
function CloudGPUVisualization() {
  const tensorNodes = [
    { x: 20, y: 30 }, { x: 40, y: 20 }, { x: 60, y: 30 },
    { x: 80, y: 20 }, { x: 30, y: 55 }, { x: 50, y: 50 },
    { x: 70, y: 55 }, { x: 40, y: 80 }, { x: 60, y: 75 },
  ];

  const tensorEdges = [
    [20,30,40,20], [40,20,60,30], [60,30,80,20],
    [20,30,30,55], [40,20,50,50], [60,30,50,50], [80,20,70,55],
    [30,55,50,50], [50,50,70,55],
    [30,55,40,80], [50,50,60,75], [70,55,60,75],
    [40,80,60,75],
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Holographic base grid - green */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-24">
        <div className="holo-grid gpu-grid" />
      </div>

      {/* Floating particles - green tones */}
      {[...Array(16)].map((_, i) => (
        <Particle
          key={i}
          delay={i * 0.25}
          duration={3 + Math.random() * 2}
          color={i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#84cc16' : '#a3e635'}
          size={3 + Math.random() * 4}
          startX={15 + Math.random() * 70}
          startY={15 + Math.random() * 70}
        />
      ))}

      {/* Horizontal compute waves - unique to GPU */}
      <div className="gpu-compute-waves">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="gpu-compute-wave" style={{ animationDelay: `${i * 0.3}s`, top: `${15 + i * 14}%` }} />
        ))}
      </div>

      {/* GPU card - wider, shorter shape */}
      <div className="gpu-card-3d">
        <div className="gpu-card-face front">
          {/* Processing core grid */}
          <div className="gpu-core-grid">
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className="gpu-core"
                style={{ animationDelay: `${i * 0.06}s` }}
              />
            ))}
          </div>
          {/* GPU heatsink fins */}
          <div className="gpu-heatsink">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="gpu-fin" />
            ))}
          </div>
        </div>
        <div className="gpu-card-face back" />
        <div className="gpu-card-face left" />
        <div className="gpu-card-face right" />
        <div className="gpu-card-face top" />
        <div className="gpu-card-face bottom" />
      </div>

      {/* Tensor network graph overlay */}
      <div className="tensor-network-overlay">
        <svg className="tensor-svg" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="tensorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#84cc16" stopOpacity="0.6" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          {/* Tensor edges with contraction pulse */}
          {tensorEdges.map(([x1, y1, x2, y2], i) => (
            <line key={`e-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="url(#tensorGrad)" strokeWidth="1.5" className="tensor-edge"
              style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
          {/* Tensor nodes with glow */}
          {tensorNodes.map((node, i) => (
            <g key={i}>
              <circle cx={node.x} cy={node.y} r="5" className="tensor-node-glow"
                style={{ animationDelay: `${i * 0.15}s` }} />
              <circle cx={node.x} cy={node.y} r="3" className="tensor-node"
                style={{ animationDelay: `${i * 0.15}s` }} />
            </g>
          ))}
          {/* Contraction spark traveling along edges */}
          {[0, 3, 7, 10].map((edgeIdx) => {
            const [x1, y1, x2, y2] = tensorEdges[edgeIdx];
            return (
              <circle key={`s-${edgeIdx}`} r="2" className="tensor-contraction-spark">
                <animateMotion dur="1.5s" repeatCount="indefinite" begin={`${edgeIdx * 0.2}s`}
                  path={`M${x1},${y1} L${x2},${y2}`} />
              </circle>
            );
          })}
        </svg>
      </div>

      {/* NVIDIA badge */}
      <div className="gpu-badge">
        <span className="gpu-badge-text">CUDA</span>
      </div>

      {/* Holographic display */}
      <div className="holo-display">
        <span className="holo-text gpu-text">GPU TENSOR</span>
      </div>
    </div>
  );
}

// Ion Trap Visualization - Enhanced with quantum effects
function IonVisualization() {
  const ions = [
    { x: 20, delay: 0 },
    { x: 35, delay: 0.2 },
    { x: 50, delay: 0.4 },
    { x: 65, delay: 0.6 },
    { x: 80, delay: 0.8 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Laser sources from top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-8">
        {ions.map((ion, i) => (
          <div key={i} className="laser-source-3d" style={{ animationDelay: `${ion.delay}s` }}>
            <div className="laser-beam-3d" style={{ animationDelay: `${ion.delay}s` }} />
          </div>
        ))}
      </div>

      {/* Electromagnetic field visualization */}
      <div className="em-field-3d">
        <div className="em-field-ring ring-1" />
        <div className="em-field-ring ring-2" />
        <div className="em-field-ring ring-3" />
      </div>

      {/* Ion trap chamber with 3D effect */}
      <div className="ion-trap-3d">
        <div className="trap-electrode left" />
        <div className="trap-electrode right" />

        {/* Ion chain */}
        <div className="ion-chain">
          {ions.map((ion, i) => (
            <div
              key={i}
              className="ion-3d"
              style={{
                left: `${ion.x}%`,
                animationDelay: `${ion.delay}s`,
              }}
            >
              {/* Quantum state visualization */}
              <div className="ion-state" style={{ animationDelay: `${ion.delay}s` }} />
              <div className="ion-glow" style={{ animationDelay: `${ion.delay}s` }} />

              {/* Entanglement lines to neighbors */}
              {i < ions.length - 1 && (
                <div
                  className="entanglement-line"
                  style={{
                    width: '40px',
                    animationDelay: `${ion.delay + 0.1}s`,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Energy rings */}
      {[0, 0.5, 1].map((delay, i) => (
        <EnergyRing key={i} delay={delay} color="#a855f7" size={60 + i * 40} />
      ))}

      {/* Label */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
        <span className="quantum-label purple">Yb⁺ Ion Chain</span>
      </div>
    </div>
  );
}

// AQT Ion Trap Visualization - Ca+ ions, indigo/blue, compact rack-mounted chamber
// Uses fully independent CSS classes (aqt-*) to avoid specificity conflicts with IonQ
function IonAQTVisualization() {
  const ions = [
    { x: 22, delay: 0 },
    { x: 41, delay: 0.2 },
    { x: 59, delay: 0.4 },
    { x: 78, delay: 0.6 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Laser sources - indigo/blue */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-8">
        {ions.map((_, i) => (
          <div key={i} className="aqt-laser" style={{ animationDelay: `${ions[i].delay}s` }}>
            <div className="aqt-beam" style={{ animationDelay: `${ions[i].delay}s` }} />
          </div>
        ))}
      </div>

      {/* RF field oscillation lines */}
      <div className="aqt-rf-field">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="aqt-rf-line" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>

      {/* EM field rings - indigo */}
      <div className="aqt-em-field">
        <div className="aqt-em-ring aqt-em-r1" />
        <div className="aqt-em-ring aqt-em-r2" />
        <div className="aqt-em-ring aqt-em-r3" />
      </div>

      {/* Rack-mount housing */}
      <div className="aqt-rack-housing">
        <div className="aqt-rack-panel left" />
        <div className="aqt-rack-panel right" />
        <div className="aqt-rack-indicator" />
      </div>

      {/* Compact rectangular trap chamber */}
      <div className="aqt-trap-3d">
        {/* Electrodes */}
        <div className="aqt-elec aqt-elec-l" />
        <div className="aqt-elec aqt-elec-r" />
        <div className="aqt-rf-rail top" />
        <div className="aqt-rf-rail bottom" />

        {/* Ion chain — fully independent from IonQ classes */}
        <div className="aqt-ion-chain">
          {ions.map((ion, i) => (
            <div key={i} className="aqt-ion" style={{ left: `${ion.x}%`, animationDelay: `${ion.delay}s` }}>
              <div className="aqt-ion-core" style={{ animationDelay: `${ion.delay}s` }} />
              <div className="aqt-ion-orbit" style={{ animationDelay: `${ion.delay}s` }} />
              {i < ions.length - 1 && (
                <div className="aqt-entangle" style={{ animationDelay: `${ion.delay + 0.1}s` }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fluorescence detection */}
      <div className="aqt-fluorescence">
        {ions.map((ion, i) => (
          <div key={i} className="aqt-fluor-dot" style={{ left: `${28 + i * 15}%`, animationDelay: `${ion.delay + 0.3}s` }} />
        ))}
        <div className="aqt-detector-bar" />
      </div>

      {/* Energy rings */}
      {[0, 0.5, 1].map((delay, i) => (
        <EnergyRing key={i} delay={delay} color="#6366f1" size={60 + i * 40} />
      ))}

      {/* Label */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
        <span className="quantum-label indigo">&#x2074;&#x2070;Ca&#x207A; Ion Chain</span>
      </div>
    </div>
  );
}

// Superconducting Visualization - Cryogenic chip
function SuperconductingVisualization() {
  const qubits = [...Array(16)].map((_, i) => ({
    row: Math.floor(i / 4),
    col: i % 4,
    delay: i * 0.1,
  }));

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Cryogenic chamber effect */}
      <div className="cryo-chamber">
        <div className="cryo-ring ring-1" />
        <div className="cryo-ring ring-2" />
        <div className="cryo-ring ring-3" />
        <div className="cryo-vapor" />
      </div>

      {/* 3D Chip */}
      <div className="chip-3d">
        <div className="chip-face front">
          <div className="chip-surface">
            {/* Qubit grid */}
            <div className="qubit-grid-3d">
              {qubits.map((qubit, i) => (
                <div
                  key={i}
                  className="qubit-3d"
                  style={{
                    animationDelay: `${qubit.delay}s`,
                    gridRow: qubit.row + 1,
                    gridColumn: qubit.col + 1,
                  }}
                >
                  <div className="qubit-core" style={{ animationDelay: `${qubit.delay}s` }} />
                  <div className="qubit-ring" style={{ animationDelay: `${qubit.delay}s` }} />
                </div>
              ))}
            </div>

            {/* Coupling lines */}
            <svg className="coupling-svg" viewBox="0 0 100 100">
              {/* Horizontal connections */}
              {[0, 1, 2, 3].map((row) =>
                [0, 1, 2].map((col) => (
                  <line
                    key={`h-${row}-${col}`}
                    x1={15 + col * 25}
                    y1={15 + row * 25}
                    x2={35 + col * 25}
                    y2={15 + row * 25}
                    className="coupling-line-svg"
                    style={{ animationDelay: `${(row * 3 + col) * 0.1}s` }}
                  />
                ))
              )}
              {/* Vertical connections */}
              {[0, 1, 2].map((row) =>
                [0, 1, 2, 3].map((col) => (
                  <line
                    key={`v-${row}-${col}`}
                    x1={15 + col * 25}
                    y1={15 + row * 25}
                    x2={15 + col * 25}
                    y2={35 + row * 25}
                    className="coupling-line-svg"
                    style={{ animationDelay: `${(row * 4 + col) * 0.1}s` }}
                  />
                ))
              )}
            </svg>
          </div>
        </div>
        <div className="chip-face back" />
        <div className="chip-face left" />
        <div className="chip-face right" />
        <div className="chip-face top" />
        <div className="chip-face bottom" />
      </div>

      {/* Temperature indicator */}
      <div className="temp-indicator">
        <span className="temp-value">15 mK</span>
        <div className="temp-bar">
          <div className="temp-fill" />
        </div>
      </div>

      {/* Microwave pulses */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="microwave-pulse"
          style={{
            animationDelay: `${i * 0.5}s`,
            left: `${20 + i * 20}%`,
          }}
        />
      ))}
    </div>
  );
}

// Neutral Atom Visualization - Optical tweezer array
function AtomVisualization() {
  const atoms = [
    { x: 25, y: 25 }, { x: 50, y: 25 }, { x: 75, y: 25 },
    { x: 25, y: 50 }, { x: 50, y: 50 }, { x: 75, y: 50 },
    { x: 25, y: 75 }, { x: 50, y: 75 }, { x: 75, y: 75 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Vacuum chamber */}
      <div className="vacuum-chamber">
        <div className="vacuum-glass" />
      </div>

      {/* Laser array from top */}
      <div className="tweezer-laser-array">
        {atoms.map((atom, i) => (
          <div
            key={`laser-${i}`}
            className="tweezer-laser-3d"
            style={{
              left: `${atom.x}%`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Atom grid */}
      <div className="atom-grid-3d">
        {atoms.map((atom, i) => (
          <div
            key={i}
            className="atom-3d"
            style={{
              left: `${atom.x}%`,
              top: `${atom.y}%`,
              animationDelay: `${i * 0.15}s`,
            }}
          >
            <div className="atom-core-3d" style={{ animationDelay: `${i * 0.15}s` }} />
            <div className="atom-electron-orbit" style={{ animationDelay: `${i * 0.2}s` }} />
            <div className="atom-rydberg-state" style={{ animationDelay: `${i * 0.25}s` }} />
          </div>
        ))}

        {/* Rydberg blockade interactions */}
        <svg className="rydberg-svg" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="rydbergGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          {/* Diagonal interactions */}
          <line x1="25" y1="25" x2="50" y2="50" stroke="url(#rydbergGrad)" strokeWidth="2" className="rydberg-line" />
          <line x1="50" y1="25" x2="75" y2="50" stroke="url(#rydbergGrad)" strokeWidth="2" className="rydberg-line" style={{ animationDelay: '0.3s' }} />
          <line x1="25" y1="50" x2="50" y2="75" stroke="url(#rydbergGrad)" strokeWidth="2" className="rydberg-line" style={{ animationDelay: '0.6s' }} />
          <line x1="50" y1="50" x2="75" y2="75" stroke="url(#rydbergGrad)" strokeWidth="2" className="rydberg-line" style={{ animationDelay: '0.9s' }} />
        </svg>
      </div>

      {/* Label */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
        <span className="quantum-label green">⁸⁷Rb Atom Array</span>
      </div>
    </div>
  );
}

// Rigetti Visualization - Hexagonal qubit layout
function RigettiVisualization() {
  const hexQubits = [
    { x: 50, y: 15 },
    { x: 30, y: 32 }, { x: 70, y: 32 },
    { x: 15, y: 50 }, { x: 50, y: 50 }, { x: 85, y: 50 },
    { x: 30, y: 68 }, { x: 70, y: 68 },
    { x: 50, y: 85 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Dilution refrigerator layers */}
      <div className="dilution-fridge">
        <div className="fridge-layer layer-1" />
        <div className="fridge-layer layer-2" />
        <div className="fridge-layer layer-3" />
      </div>

      {/* Chip with hexagonal layout */}
      <div className="rigetti-chip-3d">
        <div className="rigetti-surface">
          {/* Hexagonal qubits */}
          {hexQubits.map((qubit, i) => (
            <div
              key={i}
              className="hex-qubit-3d"
              style={{
                left: `${qubit.x}%`,
                top: `${qubit.y}%`,
                animationDelay: `${i * 0.12}s`,
              }}
            >
              <div className="hex-core" style={{ animationDelay: `${i * 0.12}s` }} />
              <div className="hex-junction" />
            </div>
          ))}

          {/* Tunable coupler lines */}
          <svg className="coupler-svg" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="couplerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            {/* Connection lines */}
            <line x1="50" y1="15" x2="30" y2="32" stroke="url(#couplerGrad)" strokeWidth="2" className="coupler-line" />
            <line x1="50" y1="15" x2="70" y2="32" stroke="url(#couplerGrad)" strokeWidth="2" className="coupler-line" style={{ animationDelay: '0.1s' }} />
            <line x1="30" y1="32" x2="15" y2="50" stroke="url(#couplerGrad)" strokeWidth="2" className="coupler-line" style={{ animationDelay: '0.2s' }} />
            <line x1="30" y1="32" x2="50" y2="50" stroke="url(#couplerGrad)" strokeWidth="2" className="coupler-line" style={{ animationDelay: '0.3s' }} />
            <line x1="70" y1="32" x2="50" y2="50" stroke="url(#couplerGrad)" strokeWidth="2" className="coupler-line" style={{ animationDelay: '0.4s' }} />
            <line x1="70" y1="32" x2="85" y2="50" stroke="url(#couplerGrad)" strokeWidth="2" className="coupler-line" style={{ animationDelay: '0.5s' }} />
            <line x1="15" y1="50" x2="30" y2="68" stroke="url(#couplerGrad)" strokeWidth="2" className="coupler-line" style={{ animationDelay: '0.6s' }} />
            <line x1="50" y1="50" x2="30" y2="68" stroke="url(#couplerGrad)" strokeWidth="2" className="coupler-line" style={{ animationDelay: '0.7s' }} />
            <line x1="50" y1="50" x2="70" y2="68" stroke="url(#couplerGrad)" strokeWidth="2" className="coupler-line" style={{ animationDelay: '0.8s' }} />
            <line x1="85" y1="50" x2="70" y2="68" stroke="url(#couplerGrad)" strokeWidth="2" className="coupler-line" style={{ animationDelay: '0.9s' }} />
            <line x1="30" y1="68" x2="50" y2="85" stroke="url(#couplerGrad)" strokeWidth="2" className="coupler-line" style={{ animationDelay: '1s' }} />
            <line x1="70" y1="68" x2="50" y2="85" stroke="url(#couplerGrad)" strokeWidth="2" className="coupler-line" style={{ animationDelay: '1.1s' }} />
          </svg>
        </div>
      </div>

      {/* iSWAP gate indicators */}
      {[0, 0.3, 0.6, 0.9].map((delay, i) => (
        <div
          key={i}
          className="iswap-indicator"
          style={{
            animationDelay: `${delay}s`,
            left: `${35 + i * 10}%`,
            top: `${40 + (i % 2) * 20}%`,
          }}
        />
      ))}

      {/* Temperature */}
      <div className="temp-indicator rigetti">
        <span className="temp-value">10 mK</span>
      </div>
    </div>
  );
}

export function QuantumVisualization3D({
  type,
  autoRotate = true,
  className,
}: QuantumVisualization3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 15, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Auto rotation
  useEffect(() => {
    if (!autoRotate || isDragging) return;

    const interval = setInterval(() => {
      setRotation((prev) => ({
        ...prev,
        y: (prev.y + 0.3) % 360,
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [autoRotate, isDragging]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastPos.current.x;
    const deltaY = e.clientY - lastPos.current.y;

    setRotation((prev) => ({
      x: Math.max(-30, Math.min(30, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5,
    }));

    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const renderVisualization = () => {
    switch (type) {
      case 'cloud':
        return <CloudVisualization />;
      case 'cloud-dm':
        return <CloudDMVisualization />;
      case 'cloud-gpu':
        return <CloudGPUVisualization />;
      case 'ion':
        return <IonVisualization />;
      case 'ion-aqt':
        return <IonAQTVisualization />;
      case 'superconducting':
        return <SuperconductingVisualization />;
      case 'atom':
        return <AtomVisualization />;
      case 'rigetti':
        return <RigettiVisualization />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('quantum-viz-container', className)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background effects */}
      <div className="viz-bg-grid" />
      <div className="viz-bg-glow" />

      {/* 3D Scene */}
      <div
        className="viz-scene"
        style={{
          transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {renderVisualization()}
      </div>

      {/* Scanline effect */}
      <div className="viz-scanline" />

      {/* Corner decorations */}
      <div className="viz-corner top-left" />
      <div className="viz-corner top-right" />
      <div className="viz-corner bottom-left" />
      <div className="viz-corner bottom-right" />
    </div>
  );
}

export default QuantumVisualization3D;
