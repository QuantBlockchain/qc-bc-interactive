'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export function Modal({ isOpen, onClose, children, className, showCloseButton = true }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          'glass-effect rounded-xl md:rounded-2xl p-4 md:p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto animate-fade-in-up relative',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:top-4 md:right-4 text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-4"
      onClick={onClose}
    >
      <div
        className="glass-effect rounded-xl md:rounded-2xl p-4 md:p-6 max-w-md w-full animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4 md:mb-6">
          <div
            className={cn(
              'w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-full flex items-center justify-center',
              variant === 'danger' && 'bg-red-500/20'
            )}
          >
            <span className="text-xl md:text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold mb-2">{title}</h3>
          <p className="text-gray-400 text-sm">{message}</p>
        </div>
        <div className="flex space-x-2 md:space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 md:py-3 rounded-lg bg-[#1f2937] hover:bg-[#374151] transition-all text-sm md:text-base"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              'flex-1 py-2.5 md:py-3 rounded-lg transition-all text-sm md:text-base',
              variant === 'danger' && 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
