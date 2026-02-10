'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NOBEL_LAUREATES_2025 } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface NobelPrizePageProps {
  onNext: () => void;
}

export function NobelPrizePage({ onNext }: NobelPrizePageProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div>
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <Award className="w-8 h-8 text-yellow-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          2025 Nobel Prize in <span className="text-yellow-400">Physics</span>
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Awarded for pioneering experiments that demonstrated
          <span className="text-yellow-400 font-medium"> macroscopic quantum tunneling and energy quantization </span>
          in superconducting circuits — the foundation of today&apos;s quantum computers.
        </p>
      </div>

      {/* Laureate Cards — horizontal 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {NOBEL_LAUREATES_2025.map((laureate, index) => (
          <div key={laureate.name} className="glass-effect rounded-xl overflow-hidden flex flex-col">
            <div className="p-5 flex-1">
              {/* Photo */}
              <div className="w-20 h-20 mx-auto mb-3 rounded-full border-2 border-yellow-500/50 overflow-hidden bg-gradient-to-br from-yellow-500/20 to-amber-600/20">
                <Image
                  src={laureate.photo}
                  alt={laureate.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Name + affiliation */}
              <div className="text-center mb-3">
                <h3 className="font-bold text-xl text-white">{laureate.name}</h3>
                <p className="text-xs text-yellow-400/80 mt-0.5">{laureate.affiliation}</p>
              </div>

              {/* Contribution */}
              <p className="text-xs text-gray-400 text-center leading-relaxed">{laureate.contribution}</p>
            </div>

            {/* Expand toggle */}
            <button
              onClick={() => toggleExpand(index)}
              className="w-full px-4 py-2 flex items-center justify-center space-x-1 text-[11px] text-gray-500 hover:text-yellow-400 transition-colors border-t border-white/5 hover:bg-white/[0.02]"
            >
              <span>{expandedIndex === index ? 'Less' : 'More'}</span>
              {expandedIndex === index ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {/* Expanded bio */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-300',
                expandedIndex === index ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="px-5 pb-4 pt-1">
                <p className="text-xs text-gray-500 leading-relaxed">{laureate.bio}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Significance Callout */}
      <div className="glass-effect rounded-xl p-6 mb-8 border-l-4 border-yellow-500">
        <p className="text-gray-300 text-sm leading-relaxed">
          Their work proved that a macroscopic electrical circuit — cooled to near absolute zero — can behave
          like a single quantum particle. This made it possible to engineer
          <span className="text-yellow-400 font-medium"> artificial atoms from superconducting circuits</span>,
          which today form the qubits inside quantum computers from Google, IBM, and others.
          These machines now threaten classical cryptography and promise to revolutionize
          <span className="text-[#14b8a6] font-medium"> blockchain security</span>.
        </p>
      </div>

      <div className="flex justify-center">
        <Button onClick={onNext} className="w-full md:w-auto">
          <span>Start Journey</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
