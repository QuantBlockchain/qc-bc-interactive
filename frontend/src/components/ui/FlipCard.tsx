'use client';

import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  className?: string;
}

export function FlipCard({ front, back, className }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={cn('flip-card sdg-flip-card', isFlipped && 'flipped', className)}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className="flip-card-inner">
        <div className="flip-card-front p-2 md:p-4 text-center">
          {front}
        </div>
        <div className="flip-card-back p-2 md:p-3">
          {back}
        </div>
      </div>
    </div>
  );
}
