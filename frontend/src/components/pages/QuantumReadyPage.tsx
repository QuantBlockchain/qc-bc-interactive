'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageCircle, Cpu, Key, ArrowRight, ArrowLeft, KeyRound, Loader2, CheckCircle, XCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { validateInviteCode } from '@/lib/api';

interface QuantumReadyPageProps {
  consent: boolean;
  sessionId?: string;
  onConsentChange: (consent: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
}

const journeySteps = [
  { icon: MessageCircle, label: 'Share your thoughts on quantum computing', color: 'text-blue-400' },
  { icon: Sparkles, label: 'Vote on blockchain quantum technologies', color: 'text-purple-400' },
  { icon: Cpu, label: 'Choose a real quantum device', color: 'text-cyan-400' },
  { icon: Key, label: 'Generate a quantum-resistant key', color: 'text-[#14b8a6]' },
];

export function QuantumReadyPage({ consent, sessionId, onConsentChange, onPrev, onNext }: QuantumReadyPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showModal]);

  const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setInviteCode(value);
    if (isValidCode !== null) {
      setIsValidCode(null);
      setValidationError(null);
    }
  };

  const handleValidateCode = async () => {
    if (!inviteCode.trim()) return;

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await validateInviteCode(inviteCode.trim(), true, sessionId);

      if (result.valid) {
        setIsValidCode(true);
        setTimeout(() => {
          setShowModal(false);
          onNext();
        }, 800);
      } else {
        setIsValidCode(false);
        setValidationError(result.error || 'Invalid invite code');
      }
    } catch {
      setIsValidCode(false);
      setValidationError('Failed to validate invite code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inviteCode.trim() && !isValidating) {
      handleValidateCode();
    }
  };

  const handleGoClick = () => {
    if (!consent) return;
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (!isValidating) {
      setShowModal(false);
      setInviteCode('');
      setIsValidCode(null);
      setValidationError(null);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#14b8a6]/20 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-[#14b8a6]" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Time to Experience <span className="text-[#14b8a6]">Quantum</span>
        </h2>
        <p className="text-xl text-gray-300 max-w-xl mx-auto leading-relaxed">
          Now that you understand the stakes, let&apos;s put quantum computing into your hands.
        </p>
      </div>

      {/* Journey Preview */}
      <div className="glass-effect rounded-2xl p-6 md:p-8 mb-8 w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-6 text-center">What&apos;s Next</h3>
        <div className="space-y-4">
          {journeySteps.map((step, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-[#111827] flex items-center justify-center flex-shrink-0 border border-gray-700">
                <span className="text-sm font-bold text-gray-400">{index + 1}</span>
              </div>
              <div className="flex items-center space-x-3 flex-1">
                <step.icon className={`w-5 h-5 ${step.color} flex-shrink-0`} />
                <span className="text-gray-300 text-sm">{step.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consent */}
      <div className="glass-effect rounded-2xl p-6 mb-8 w-full max-w-lg">
        <div className="flex items-start space-x-4">
          <input
            type="checkbox"
            id="consent-checkbox"
            className="checkbox-custom mt-1"
            checked={consent}
            onChange={(e) => onConsentChange(e.target.checked)}
          />
          <label htmlFor="consent-checkbox" className="text-gray-300 cursor-pointer">
            I agree to participate. Your participation is anonymous and voluntary. Data collected will be used for research purposes only.
          </label>
        </div>
      </div>

      <div className="flex items-center justify-center w-full gap-6">
        <button onClick={onPrev} className="flex items-center space-x-1.5 text-sm text-gray-400 hover:text-white transition-colors py-2 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <Button onClick={handleGoClick} disabled={!consent} className="w-full md:w-auto">
          <span>Let&apos;s Go</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {!consent && (
        <p className="text-center text-gray-500 text-sm mt-4">
          Please agree to participate to continue
        </p>
      )}

      {/* Invite Code Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleCloseModal}
          />

          <div className="relative glass-effect rounded-xl md:rounded-2xl p-5 md:p-8 max-w-md w-full animate-fade-in-up">
            <button
              onClick={handleCloseModal}
              disabled={isValidating}
              className="absolute top-3 right-3 md:top-4 md:right-4 p-1.5 md:p-2 rounded-lg hover:bg-gray-700/50 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="text-center mb-4 md:mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-full bg-[#14b8a6]/20 flex items-center justify-center">
                <KeyRound className="w-6 h-6 md:w-8 md:h-8 text-[#14b8a6]" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">Enter Invite Code</h2>
              <p className="text-gray-400 text-xs md:text-sm">
                Please enter your invite code to access the quantum journey experience.
              </p>
            </div>

            <div className="mb-4 md:mb-6">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Enter invite code..."
                  value={inviteCode}
                  onChange={handleInviteCodeChange}
                  onKeyPress={handleKeyPress}
                  disabled={isValidating || isValidCode === true}
                  className="w-full px-4 py-3 md:py-4 rounded-lg md:rounded-xl bg-[#0a0f1a]/50 border border-gray-700 text-white text-center text-lg md:text-xl placeholder-gray-500 focus:border-[#14b8a6] focus:outline-none transition-colors uppercase tracking-widest disabled:opacity-50"
                />
                {isValidCode !== null && (
                  <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2">
                    {isValidCode ? (
                      <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
                    )}
                  </div>
                )}
              </div>

              {validationError && (
                <p className="text-red-400 text-xs md:text-sm mt-2 md:mt-3 text-center">{validationError}</p>
              )}
              {isValidCode === true && (
                <p className="text-green-400 text-xs md:text-sm mt-2 md:mt-3 text-center">
                  Code verified! Starting your journey...
                </p>
              )}
            </div>

            <button
              onClick={handleValidateCode}
              disabled={!inviteCode.trim() || isValidating || isValidCode === true}
              className="w-full py-3 md:py-4 rounded-lg md:rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm md:text-base"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : isValidCode === true ? (
                <>
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Verified!</span>
                </>
              ) : (
                <>
                  <span>Verify & Continue</span>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
