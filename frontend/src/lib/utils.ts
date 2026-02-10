import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function generateQuantumId(): string {
  return (Math.random() * 0.5 + 0.25).toFixed(4);
}

export function generatePublicKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let key = '';
  for (let i = 0; i < 256; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export function generateSignature(): string {
  const hexChars = '0123456789abcdef';
  let signature = '0x';
  for (let i = 0; i < 128; i++) {
    signature += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
  }
  return signature;
}

export function generateJobId(): string {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `QJ-${year}-${num}`;
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
}
