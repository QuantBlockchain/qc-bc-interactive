'use client';

import { Atom, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  currentPage: number;
  onLogoClick: () => void;
}

export function Header({ currentPage, onLogoClick }: HeaderProps) {
  const steps = [1, 2, 3, 4, 5, 6];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect">
      <div className="max-w-6xl mx-auto px-3 md:px-6 py-2 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center space-x-2 md:space-x-3 cursor-pointer min-h-[36px] md:min-h-[44px]"
            onClick={onLogoClick}
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
              <Atom className="text-white w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="text-base md:text-xl font-semibold">Quantum Futures</span>
          </div>

          {/* Progress Steps - Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    'step-indicator w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-[#1f2937]',
                    index < currentPage && 'completed',
                    index === currentPage && 'active'
                  )}
                >
                  {index < currentPage ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    step
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-8 h-0.5 mx-1',
                      index < currentPage ? 'bg-[#14b8a6]' : 'bg-[#1f2937]'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Mobile Progress - Enhanced with mini progress bar */}
          <div className="md:hidden flex items-center space-x-2">
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    index < currentPage ? 'bg-[#14b8a6]' :
                    index === currentPage ? 'bg-[#14b8a6] animate-pulse' : 'bg-[#1f2937]'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {Math.min(currentPage + 1, 6)}/6
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
