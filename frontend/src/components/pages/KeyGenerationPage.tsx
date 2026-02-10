'use client';

import { useEffect, useState, useRef } from 'react';
import { ArrowRight, CheckCircle, Dice5, Key, Fingerprint, Cpu, Shield, Copy, AlertCircle, Loader2 } from 'lucide-react';
import { InfoTooltip, TERM_DEFINITIONS } from '@/components/ui/InfoTooltip';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { DEVICES, PROCESSING_TYPES } from '@/lib/constants';
import { copyToClipboard } from '@/lib/utils';
import { JourneyState } from '@/types';
import { saveQuantumKey, GenerateQuantumKeyResponse } from '@/lib/api';

interface ExtendedJourneyState extends JourneyState {
  sessionId?: string;
}

interface KeyGenerationPageProps {
  state: ExtendedJourneyState;
  onGenerateKeys: () => Promise<GenerateQuantumKeyResponse>;
  onNext: () => void;
}

export function KeyGenerationPage({ state, onGenerateKeys, onNext }: KeyGenerationPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [keyResponse, setKeyResponse] = useState<GenerateQuantumKeyResponse | null>(null);
  const { showToast } = useToast();
  const generationStartedRef = useRef(false);

  const device = DEVICES.find((d) => d.id === state.device);
  const deviceName = device?.name || 'quantum device';

  // Start key generation on mount - wait for API to complete
  useEffect(() => {
    // Skip if keys already exist in state (e.g., after page refresh)
    if (state.publicKey && state.signature) {
      setIsComplete(true);
      setIsLoading(false);
      return;
    }

    if (generationStartedRef.current) return;
    generationStartedRef.current = true;

    const generateAndSaveKeys = async () => {
      setIsLoading(true);
      setGenerationError(null);

      try {
        // Call the quantum key generation API
        const response = await onGenerateKeys();
        setKeyResponse(response);

        if (response.success && !response.async) {
          // Synchronous result - save to backend
          try {
            await saveQuantumKey({
              quantumId: response.quantumId,
              publicKey: response.publicKey,
              signature: response.signature,
              device: response.device,
              jobId: response.jobId,
              sessionId: state.sessionId,
            });
          } catch (saveError) {
            console.error('Error saving quantum key:', saveError);
          }
          // Mark as complete only after API success
          setIsComplete(true);
        } else if (response.async) {
          // Async result for real QPU - show job ID and message
          showToast(response.message || 'Quantum task submitted', 'success');
          setIsComplete(true);
        }
      } catch (error) {
        console.error('Error generating quantum key:', error);
        setGenerationError(error instanceof Error ? error.message : 'Failed to generate key');
        showToast('Error generating quantum key', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    generateAndSaveKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onGenerateKeys, state.sessionId, showToast]);

  const handleCopyPublicKey = async () => {
    if (await copyToClipboard(state.publicKey)) {
      showToast('Public key copied to clipboard', 'success');
    }
  };

  const handleCopySignature = async () => {
    if (await copyToClipboard(state.signature)) {
      showToast('Signature copied to clipboard', 'success');
    }
  };

  const handleCopyAll = async () => {
    const algorithm = keyResponse?.algorithm || 'ToyLWE-Quantum-Seeded';
    const quantumId = keyResponse?.quantumId || state.quantumId;
    const publicKey = keyResponse?.publicKey || state.publicKey;
    const signature = keyResponse?.signature || state.signature;
    const jobId = keyResponse?.jobId || state.jobId;
    const allData = `Algorithm: ${algorithm}\n\nQuantum ID: ${quantumId}\n\nPublic Key:\n${publicKey}\n\nDigital Signature:\n${signature}\n\nDevice: ${deviceName}\nJob ID: ${jobId}`;
    if (await copyToClipboard(allData)) {
      showToast('All cryptographic data copied to clipboard', 'success');
    }
  };

  // Get display values from response or state
  const displayQuantumId = keyResponse?.quantumId || state.quantumId;
  const displayPublicKey = keyResponse?.publicKey || state.publicKey;
  const displaySignature = keyResponse?.signature || state.signature;
  const displayJobId = keyResponse?.jobId || state.jobId;
  const displayAlgorithm = keyResponse?.algorithm || 'ToyLWE-Quantum-Seeded';
  const displayProcessingMethod = keyResponse?.processingMethod || PROCESSING_TYPES[state.device] || 'Quantum Simulation';

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Generating Your Quantum-Resistant Key
        </h2>
        <p className="text-gray-300">
          Your personalized key is being generated using the{' '}
          <span className="text-[#14b8a6] font-medium">{deviceName}</span> you selected.
        </p>
      </div>

      {isLoading && !generationError && (
        <div className="flex flex-col items-center mb-10">
          <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
            <Loader2 className="w-16 h-16 text-[#14b8a6] animate-spin" />
          </div>
          <p className="text-gray-400 text-lg">Generating quantum key...</p>
          <p className="text-gray-500 text-sm mt-2">This may take a few seconds</p>
        </div>
      )}

      {generationError && (
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="text-red-400 w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-red-400 mb-2">Generation Failed</h3>
          <p className="text-gray-400 mb-4">{generationError}</p>
          <div className="flex justify-center">
            <Button onClick={() => window.location.reload()} variant="secondary">
              Try Again
            </Button>
          </div>
        </div>
      )}

      {isComplete && !generationError && (
        <div>
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="text-green-400 w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-green-400 mb-2">Signature Created Successfully!</h3>
            <p className="text-gray-400">Your quantum-resistant digital signature has been generated</p>
          </div>

          {/* Quantum ID Card */}
          <div className="glass-effect rounded-2xl p-6 mb-6 border border-[#14b8a6]/30">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#14b8a6]/20 flex items-center justify-center mr-4">
                <Dice5 className="text-[#14b8a6] w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold inline-flex items-center">
                  Your Quantum ID
                  <InfoTooltip {...TERM_DEFINITIONS.quantum_id} />
                </h4>
                <p className="text-xs text-gray-500">Quantum-generated unique identifier</p>
              </div>
            </div>
            <div className="bg-[#0a0f1a]/50 rounded-lg p-4 text-center">
              <span className="text-3xl font-bold text-[#14b8a6] font-mono">{displayQuantumId}</span>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              This number was derived from{' '}
              <span className="inline-flex items-center">
                quantum superposition
                <InfoTooltip {...TERM_DEFINITIONS.quantum_superposition} />
              </span>{' '}
              measurements on your selected device
            </p>
          </div>

          {/* Cryptographic Keys Card */}
          <div className="glass-effect rounded-2xl p-6 mb-6 border border-blue-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mr-4">
                  <Key className="text-blue-400 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold inline-flex items-center">
                    Quantum-Resistant Keys
                    <InfoTooltip {...TERM_DEFINITIONS.quantum_resistant} />
                  </h4>
                  <p className="text-xs text-gray-500">Post-quantum cryptographic signature</p>
                </div>
              </div>
              <button
                onClick={handleCopyAll}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-all"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy All
              </button>
            </div>

            <div className="space-y-4">
              {/* Algorithm */}
              <div className="bg-[#0a0f1a]/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400 flex items-center">
                    <Cpu className="w-4 h-4 text-purple-400 mr-2" />
                    Algorithm
                    <InfoTooltip {...TERM_DEFINITIONS.lwe_algorithm} />
                  </span>
                  <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs inline-flex items-center">
                    Lattice-Based
                    <InfoTooltip {...TERM_DEFINITIONS.lattice_based} />
                  </span>
                </div>
                <div className="font-mono text-sm text-white">{displayAlgorithm}</div>
                <p className="text-xs text-gray-500 mt-2">
                  Post-quantum digital signature algorithm using lattice-based cryptography seeded with quantum randomness
                </p>
              </div>

              {/* Public Key */}
              <div className="bg-[#0a0f1a]/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400 flex items-center">
                    <Key className="w-4 h-4 text-green-400 mr-2" />
                    Public Key
                    <InfoTooltip {...TERM_DEFINITIONS.public_key} />
                  </span>
                  <button onClick={handleCopyPublicKey} className="text-xs text-gray-500 hover:text-[#14b8a6] transition-colors">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="font-mono text-xs text-gray-300 break-all leading-relaxed max-h-20 overflow-y-auto">
                  {displayPublicKey}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Your public verification key - can be shared openly
                </p>
              </div>

              {/* Digital Signature */}
              <div className="bg-[#0a0f1a]/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400 flex items-center">
                    <Fingerprint className="w-4 h-4 text-amber-400 mr-2" />
                    Digital Signature
                    <InfoTooltip {...TERM_DEFINITIONS.digital_signature} />
                  </span>
                  <button onClick={handleCopySignature} className="text-xs text-gray-500 hover:text-[#14b8a6] transition-colors">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="font-mono text-xs text-gray-300 break-all leading-relaxed max-h-20 overflow-y-auto">
                  {displaySignature}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Your unique digital signature - cryptographically proves your response authenticity
                </p>
              </div>
            </div>
          </div>

          {/* Device Info Card */}
          <div className="glass-effect rounded-2xl p-6 mb-8 border border-cyan-500/30">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mr-4">
                <Cpu className="text-cyan-400 w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold">Device Information</h4>
                <p className="text-xs text-gray-500">Quantum computing platform details</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0f1a]/50 rounded-lg p-3">
                <span className="text-xs text-gray-500 block mb-1">Device</span>
                <span className="text-sm font-medium">{deviceName}</span>
              </div>
              <div className="bg-[#0a0f1a]/50 rounded-lg p-3">
                <span className="text-xs text-gray-500 block mb-1">Processing Type</span>
                <span className="text-sm font-medium">{displayProcessingMethod}</span>
              </div>
              <div className="bg-[#0a0f1a]/50 rounded-lg p-3">
                <span className="text-xs text-gray-500 block mb-1">Job ID</span>
                <span className="text-sm font-mono text-[#14b8a6]">{displayJobId}</span>
              </div>
              <div className="bg-[#0a0f1a]/50 rounded-lg p-3">
                <span className="text-xs text-gray-500 block mb-1">Status</span>
                <span className="text-sm font-medium text-green-400 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </span>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="bg-gradient-to-r from-[#14b8a6]/10 to-blue-500/10 rounded-xl p-5 mb-8 border border-[#14b8a6]/20">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-[#14b8a6] mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-2 inline-flex items-center">
                  About Post-Quantum Security
                  <InfoTooltip {...TERM_DEFINITIONS.post_quantum} />
                </h4>
                <p className="text-sm text-gray-400">
                  Your signature uses{' '}
                  <strong className="text-[#14b8a6] inline-flex items-center">
                    quantum-resistant cryptography
                    <InfoTooltip {...TERM_DEFINITIONS.quantum_resistant} />
                  </strong>{' '}
                  designed to withstand attacks from both classical and future quantum computers.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button onClick={onNext} className="w-full md:w-auto">
              <span>Complete Journey</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
