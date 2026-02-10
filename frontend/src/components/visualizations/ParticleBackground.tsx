'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  left: string;
  top: string;
  delay: string;
  opacity: number;
}

export function ParticleBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className="floating-particles">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.delay,
            opacity: particle.opacity,
          }}
        />
      ))}
    </div>
  );
}
