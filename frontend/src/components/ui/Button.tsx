'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-full font-medium flex items-center justify-center space-x-2 transition-all cursor-pointer',
        // Size variants
        size === 'sm' && 'px-4 py-2 text-sm',
        size === 'md' && 'px-6 py-3',
        size === 'lg' && 'px-8 py-4 text-lg',
        // Mobile-friendly touch target (min 48px height)
        'min-h-[48px] md:min-h-0',
        // Style variants
        variant === 'primary' && 'btn-primary text-white',
        variant === 'secondary' && 'btn-secondary',
        // Full width option
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
