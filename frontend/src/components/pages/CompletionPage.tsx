'use client';

import { useState } from 'react';
import { Check, Mail, Shield, Fingerprint, Cpu, Key, RotateCcw, Book, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { DEVICES, BLOCKCHAIN_TECHS } from '@/lib/constants';
import { copyToClipboard } from '@/lib/utils';
import { JourneyState } from '@/types';

interface CompletionPageProps {
  state: JourneyState;
  onRestart: () => void;
}

const resources = [
  {
    title: 'AWS Braket Documentation',
    description: 'Official guide for Amazon Braket quantum computing service',
    url: 'https://docs.aws.amazon.com/braket/latest/developerguide/what-is-braket.html'
  },
  {
    title: 'AWS Braket Devices',
    description: 'Explore all available quantum devices and simulators',
    url: 'https://docs.aws.amazon.com/braket/latest/developerguide/braket-devices.html'
  },
  {
    title: 'IonQ Technology',
    description: 'Learn about trapped ion quantum computing',
    url: 'https://ionq.com/technology'
  },
  {
    title: 'IQM Academy',
    description: 'Free tutorials on superconducting quantum computing',
    url: 'https://www.iqmacademy.com/qpu/'
  },
  {
    title: 'QuEra Aquila',
    description: 'Neutral atom quantum computing with 256 qubits',
    url: 'https://www.quera.com/aquila'
  },
  {
    title: 'Rigetti Technology',
    description: 'Superconducting quantum processors',
    url: 'https://www.rigetti.com/what-we-build'
  },
  {
    title: 'NIST Post-Quantum Cryptography',
    description: 'Official standards for quantum-resistant encryption',
    url: 'https://csrc.nist.gov/projects/post-quantum-cryptography'
  },
];

export function CompletionPage({ state, onRestart }: CompletionPageProps) {
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { showToast } = useToast();

  const device = DEVICES.find((d) => d.id === state.device);
  const blockchainTech = BLOCKCHAIN_TECHS.find((i) => i.id === state.industry);
  const issuedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const passportId = state.quantumId || state.signature?.substring(0, 8).toUpperCase() || 'QSP-0000';

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendPassport = async () => {
    if (!isValidEmail) return;

    setIsSending(true);
    // Simulate sending (UI only — no actual email)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSending(false);
    setEmailSent(true);
    showToast('Quantum-Safe Passport sent to your email!', 'success');
  };

  const handleCopyPassport = async () => {
    const passportText = [
      '=== Quantum-Safe Blockchain Passport ===',
      '',
      `Passport ID: ${passportId}`,
      `Issued: ${issuedDate}`,
      `Device: ${device?.name || state.device}`,
      `Technology Vote: ${blockchainTech?.name || state.industry}`,
      `First Thought: "${state.sentiment}"`,
      '',
      `Public Key:`,
      state.publicKey,
      '',
      `Digital Signature:`,
      state.signature,
      '',
      'This passport was generated using quantum-resistant cryptography,',
      'designed to withstand attacks from both classical and quantum computers.',
      '',
      'Powered by Quantum Futures Interactive',
    ].join('\n');

    if (await copyToClipboard(passportText)) {
      showToast('Passport data copied to clipboard', 'success');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-accent flex items-center justify-center animate-pulse-slow">
          <Check className="text-white w-8 h-8" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Your Quantum-Safe Passport</h2>
        <p className="text-gray-300 max-w-xl mx-auto">
          You&apos;ve just generated your first <span className="text-[#14b8a6] font-medium">quantum-resistant digital identity</span> — proof that you&apos;re ready for the post-quantum blockchain era.
        </p>
      </div>

      {/* ===== Passport Card ===== */}
      <div className="relative glass-effect rounded-2xl overflow-hidden mb-8 border border-[#14b8a6]/30">
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#14b8a6] via-blue-500 to-purple-500" />

        <div className="p-6 md:p-8">
          {/* Passport header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Quantum-Safe Blockchain Passport</p>
              <p className="text-2xl font-bold font-mono text-[#14b8a6]">{passportId}</p>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-[#14b8a6]/50 flex items-center justify-center bg-[#14b8a6]/10">
              <Shield className="w-7 h-7 text-[#14b8a6]" />
            </div>
          </div>

          {/* Passport fields */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Issued</p>
              <p className="text-sm text-white">{issuedDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Quantum Device</p>
              <p className="text-sm text-white">{device?.shortName || device?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Technology Vote</p>
              <p className="text-sm text-white">{blockchainTech?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">First Thought</p>
              <p className="text-sm text-white italic truncate">&quot;{state.sentiment || '—'}&quot;</p>
            </div>
          </div>

          {/* Signature block */}
          <div className="bg-[#0a0f1a]/60 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 flex items-center">
                <Fingerprint className="w-3 h-3 mr-1.5 text-amber-400" />
                Digital Signature
              </span>
              <button
                onClick={handleCopyPassport}
                className="text-xs text-gray-500 hover:text-[#14b8a6] transition-colors flex items-center"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </button>
            </div>
            <p className="font-mono text-xs text-gray-400 break-all leading-relaxed line-clamp-2">
              {state.signature || '—'}
            </p>
          </div>

          {/* Public key block */}
          <div className="bg-[#0a0f1a]/60 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Key className="w-3 h-3 mr-1.5 text-green-400" />
              <span className="text-xs text-gray-500">Public Key</span>
            </div>
            <p className="font-mono text-xs text-gray-400 break-all leading-relaxed line-clamp-2">
              {state.publicKey || '—'}
            </p>
          </div>
        </div>

        {/* Bottom seal */}
        <div className="px-6 md:px-8 pb-5 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Cpu className="w-3 h-3" />
            <span>Powered by {device?.vendor || 'AWS'} quantum hardware</span>
          </div>
          <span className="text-xs text-[#14b8a6] font-medium">QUANTUM VERIFIED</span>
        </div>
      </div>

      {/* ===== Storyline: What This Means ===== */}
      <div className="glass-effect rounded-xl p-6 mb-8 border-l-4 border-[#14b8a6]">
        <h3 className="font-semibold text-white mb-3">What does this key mean?</h3>
        <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>
            In today&apos;s blockchain, your wallet is protected by <span className="text-red-400">ECDSA</span> —
            an algorithm that quantum computers will eventually break. When that happens,
            every wallet, every transaction history, every smart contract signed with classical
            cryptography becomes vulnerable.
          </p>
          <p>
            The key you just generated uses <span className="text-[#14b8a6] font-medium">lattice-based
            cryptography</span> seeded by real quantum randomness. It&apos;s resistant to
            both Shor&apos;s and Grover&apos;s algorithms — the two main quantum attack vectors.
            This is the same class of algorithms that <span className="text-[#14b8a6]">NIST standardized in 2024</span> for
            the post-quantum era.
          </p>
          <p>
            Think of this passport as your proof of concept: <span className="text-white font-medium">you&apos;ve
            already created a quantum-safe identity</span> before most of the world even knows
            they need one.
          </p>
        </div>
      </div>

      {/* ===== Email Section ===== */}
      <div className="glass-effect rounded-2xl p-6 md:p-8 mb-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Receive Your Passport</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Enter your email to receive your Quantum-Safe Blockchain Passport,
            including your full cryptographic keys and a summary of your journey.
          </p>
        </div>

        {!emailSent ? (
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && isValidEmail) handleSendPassport(); }}
                disabled={isSending}
                className="flex-1 px-4 py-3 rounded-xl bg-[#0a0f1a]/50 border border-gray-700 text-white placeholder-gray-500 focus:border-[#14b8a6] focus:outline-none transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleSendPassport}
                disabled={!isValidEmail || isSending}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 whitespace-nowrap"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Passport</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              We&apos;ll send your quantum-safe passport and journey summary. No spam, ever.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-green-400 mb-2">Passport Sent!</h4>
            <p className="text-gray-400 text-sm">
              Your Quantum-Safe Blockchain Passport has been sent to <span className="text-white font-medium">{email}</span>.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Check your inbox for your full cryptographic keys and journey details.
            </p>
          </div>
        )}
      </div>

      {/* ===== Next Steps ===== */}
      <div className="glass-effect rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-white mb-4 text-center">What&apos;s Next?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111827]/50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-lg">1</span>
            </div>
            <p className="text-sm text-gray-300 font-medium mb-1">Share</p>
            <p className="text-xs text-gray-500">Show your passport to colleagues — start the conversation about quantum readiness</p>
          </div>
          <div className="bg-[#111827]/50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-lg">2</span>
            </div>
            <p className="text-sm text-gray-300 font-medium mb-1">Learn</p>
            <p className="text-xs text-gray-500">Explore post-quantum cryptography standards from NIST and real quantum devices</p>
          </div>
          <div className="bg-[#111827]/50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#14b8a6]/20 flex items-center justify-center">
              <span className="text-lg">3</span>
            </div>
            <p className="text-sm text-gray-300 font-medium mb-1">Prepare</p>
            <p className="text-xs text-gray-500">Start evaluating quantum-safe migration strategies for your organization</p>
          </div>
        </div>
      </div>

      {/* ===== Actions ===== */}
      <div className="flex flex-col md:flex-row md:flex-wrap justify-center gap-3 md:gap-4 mb-8">
        <Button variant="secondary" onClick={onRestart} className="w-full md:w-auto">
          <RotateCcw className="w-4 h-4" />
          <span>Restart Journey</span>
        </Button>
        <Button onClick={() => setShowResourcesModal(true)} className="w-full md:w-auto">
          <Book className="w-4 h-4" />
          <span>Explore Resources</span>
        </Button>
      </div>

      {/* Resources Modal */}
      <Modal isOpen={showResourcesModal} onClose={() => setShowResourcesModal(false)} className="max-w-lg">
        <h3 className="text-xl font-bold mb-6">Learn More</h3>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {resources.map((resource) => (
            <a
              key={resource.title}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-xl bg-[#111827]/50 hover:bg-[#1f2937]/50 transition-all group"
            >
              <h4 className="font-semibold mb-1 group-hover:text-[#14b8a6] transition-colors">
                {resource.title}
                <span className="text-xs ml-2 text-gray-500">↗</span>
              </h4>
              <p className="text-sm text-gray-400">{resource.description}</p>
            </a>
          ))}
        </div>
      </Modal>
    </div>
  );
}
