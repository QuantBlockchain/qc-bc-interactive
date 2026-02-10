'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, ArrowLeft, Lock, Unlock, Database, ShieldAlert, AlertTriangle, Bitcoin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface QuantumBlockchainPageProps {
  onPrev: () => void;
  onNext: () => void;
}

const vulnerabilities = [
  { name: 'ECDSA (Wallets)', risk: 95, algorithm: "Shor's", color: '#ef4444' },
  { name: 'RSA-2048', risk: 90, algorithm: "Shor's", color: '#f97316' },
  { name: 'DH Key Exchange', risk: 85, algorithm: "Shor's", color: '#f97316' },
  { name: 'SHA-256 (Mining)', risk: 45, algorithm: "Grover's", color: '#eab308' },
  { name: 'AES-256', risk: 20, algorithm: "Grover's", color: '#22c55e' },
];

const stats = [
  { value: '4M+', label: 'BTC in exposed wallets', sublabel: 'with reused or revealed public keys', color: 'text-red-400' },
  { value: '2030s', label: 'Estimated Q-Day', sublabel: 'when RSA-2048 becomes breakable', color: 'text-yellow-400' },
  { value: '2024', label: 'NIST PQC Standards', sublabel: 'ML-KEM, ML-DSA finalized', color: 'text-[#14b8a6]' },
];

export function QuantumBlockchainPage({ onPrev, onNext }: QuantumBlockchainPageProps) {
  const [animatedRisks, setAnimatedRisks] = useState<number[]>(vulnerabilities.map(() => 0));

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedRisks(vulnerabilities.map((v) => v.risk));
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Quantum Meets <span className="text-[#14b8a6]">Blockchain</span>
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Quantum computing is both a threat and an opportunity for blockchain technology.
          Understanding the risks — and the solutions — is the first step to being quantum ready.
        </p>
      </div>

      {/* ===== Key Stats ===== */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-effect rounded-xl p-4 text-center">
            <p className={`text-2xl md:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-300 font-medium mt-1">{stat.label}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 hidden md:block">{stat.sublabel}</p>
          </div>
        ))}
      </div>

      {/* ===== THREAT Section ===== */}
      <div className="flex items-center mb-3">
        <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
        <h3 className="text-xl font-semibold text-red-400">The Threat</h3>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        Blockchain security relies on mathematical problems that classical computers cannot solve in reasonable time.
        Quantum computers change this equation fundamentally — using Shor&apos;s algorithm to break public-key
        cryptography and Grover&apos;s algorithm to weaken hash functions.
      </p>

      {/* Vulnerability Chart */}
      <div className="glass-effect rounded-xl p-5 md:p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-white flex items-center">
            <ShieldAlert className="w-4 h-4 text-red-400 mr-2" />
            Quantum Vulnerability Index
          </h4>
          <span className="text-xs text-gray-500">Fault-tolerant QC era</span>
        </div>

        <div className="space-y-3">
          {vulnerabilities.map((v, i) => (
            <div key={v.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-300 truncate flex-1">{v.name}</span>
                <span className="text-xs text-gray-500 mx-2 hidden md:inline">{v.algorithm}</span>
                <span className="text-xs font-mono w-10 text-right" style={{ color: v.color }}>
                  {v.risk}%
                </span>
              </div>
              <div className="h-2 bg-[#1f2937] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${animatedRisks[i]}%`,
                    backgroundColor: v.color,
                    boxShadow: `0 0 8px ${v.color}40`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span>Low risk</span>
          <div className="flex-1 mx-3 h-1 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-30" />
          <span>Critical</span>
        </div>
      </div>

      {/* Harvest Timeline */}
      <div className="glass-effect rounded-xl p-5 md:p-6 mb-4">
        <h4 className="font-semibold text-white mb-3 flex items-center">
          <Database className="w-4 h-4 text-red-400 mr-2" />
          &quot;Harvest Now, Decrypt Later&quot;
        </h4>

        <div className="overflow-hidden">
          <svg viewBox="0 0 600 100" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
            <line x1="50" y1="45" x2="550" y2="45" stroke="#374151" strokeWidth="2" />
            <line x1="50" y1="45" x2="550" y2="45" stroke="#ef4444" strokeWidth="1" strokeDasharray="6 4" opacity="0.35">
              <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.5s" repeatCount="indefinite" />
            </line>

            <rect x="30" y="10" width="120" height="26" rx="5" fill="#ef444418" stroke="#ef4444" strokeWidth="0.8" />
            <text x="90" y="27" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="600">Harvest Data</text>

            <rect x="230" y="10" width="140" height="26" rx="5" fill="#f9731618" stroke="#f97316" strokeWidth="0.8" />
            <text x="300" y="27" textAnchor="middle" fill="#f97316" fontSize="10" fontWeight="600">Store Encrypted Data</text>

            <rect x="450" y="10" width="120" height="26" rx="5" fill="#ef444418" stroke="#ef4444" strokeWidth="0.8" />
            <text x="510" y="27" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="600">Quantum Decrypt</text>

            <circle cx="90" cy="45" r="5" fill="#ef4444">
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="300" cy="45" r="5" fill="#f97316" />
            <circle cx="510" cy="45" r="5" fill="#ef4444">
              <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
            </circle>

            <polygon points="155,42 163,45 155,48" fill="#374151" />
            <polygon points="380,42 388,45 380,48" fill="#374151" />

            <text x="90" y="72" textAnchor="middle" fill="#6b7280" fontSize="9">Today</text>
            <text x="300" y="72" textAnchor="middle" fill="#6b7280" fontSize="9">Years of waiting</text>
            <text x="510" y="72" textAnchor="middle" fill="#6b7280" fontSize="9">Q-Day</text>
          </svg>
        </div>

        <p className="text-gray-500 text-xs mt-2">
          Nation-state actors are already recording encrypted blockchain traffic today, stockpiling data
          to decrypt once fault-tolerant quantum computers arrive. Every transaction with an exposed public
          key becomes a future target.
        </p>
      </div>

      {/* Bitcoin-specific callout */}
      <div className="glass-effect rounded-xl p-4 mb-8 border-l-4 border-yellow-500/50">
        <div className="flex items-start space-x-3">
          <Bitcoin className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-400">
            <span className="text-yellow-400 font-medium">Bitcoin example:</span> Early wallets
            (including Satoshi&apos;s ~1.1M BTC) used Pay-to-Public-Key, where the public key is directly
            exposed on-chain. These funds — worth tens of billions — would be immediately vulnerable
            to a quantum attacker running Shor&apos;s algorithm.
          </p>
        </div>
      </div>

      {/* ===== SOLUTION Section ===== */}
      <div className="flex items-center mb-3">
        <ShieldCheck className="w-5 h-5 text-[#14b8a6] mr-2" />
        <h3 className="text-xl font-semibold text-[#14b8a6]">The Solution</h3>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        The cryptography community has been preparing for the post-quantum era. In 2024,
        NIST finalized the first quantum-resistant standards — algorithms based on mathematical
        problems that even quantum computers cannot efficiently solve.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="glass-effect rounded-xl p-5 border-l-4 border-red-500/40">
          <div className="flex items-center mb-3">
            <Unlock className="w-4 h-4 text-red-400 mr-2" />
            <h4 className="font-semibold text-sm text-red-400">Current Blockchain</h4>
          </div>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li className="flex items-start space-x-2">
              <span className="text-red-400 font-bold mt-px">&#xd7;</span>
              <span>ECDSA signatures — <span className="text-red-400">broken</span> by Shor&apos;s</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-red-400 font-bold mt-px">&#xd7;</span>
              <span>RSA key exchange — <span className="text-red-400">factorable</span></span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-yellow-400 font-bold mt-px">~</span>
              <span>SHA-256 — <span className="text-yellow-400">weakened</span> to 128-bit</span>
            </li>
          </ul>
        </div>

        <div className="glass-effect rounded-xl p-5 border-l-4 border-[#14b8a6]/40">
          <div className="flex items-center mb-3">
            <Lock className="w-4 h-4 text-[#14b8a6] mr-2" />
            <h4 className="font-semibold text-sm text-[#14b8a6]">Quantum-Safe Blockchain</h4>
          </div>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li className="flex items-start space-x-2">
              <span className="text-[#14b8a6] font-bold mt-px">&#10003;</span>
              <span>ML-DSA / FALCON <span className="text-[#14b8a6]">lattice signatures</span></span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#14b8a6] font-bold mt-px">&#10003;</span>
              <span>ML-KEM <span className="text-[#14b8a6]">key encapsulation</span></span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#14b8a6] font-bold mt-px">&#10003;</span>
              <span>SHA-3 / SPHINCS+ <span className="text-[#14b8a6]">hash-based crypto</span></span>
            </li>
          </ul>
        </div>
      </div>

      {/* Urgency callout */}
      <div className="glass-effect rounded-xl p-5 mb-8 border-l-4 border-[#14b8a6]">
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-[#14b8a6] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-300 leading-relaxed">
              <span className="text-white font-medium">The migration has already begun.</span> Ethereum
              co-founder Vitalik Buterin proposed quantum-resistant account abstraction in 2024. Google
              Chrome shipped post-quantum TLS (ML-KEM) by default. NIST&apos;s timeline recommends
              all systems transition to PQC by <span className="text-[#14b8a6] font-medium">2035</span>.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              The question is not <em>if</em> blockchain needs quantum-safe cryptography, but <em>how fast</em> it can migrate.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button onClick={onPrev} className="flex items-center space-x-1.5 text-sm text-gray-400 hover:text-white transition-colors py-2 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <Button onClick={onNext} className="w-full md:w-auto">
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
