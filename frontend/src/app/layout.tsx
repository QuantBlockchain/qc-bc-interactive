import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quantum Futures - Human-AI Interaction Experience',
  description: 'Explore the foundations of quantum computing, post-quantum security, and future applications.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="gradient-bg min-h-screen text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
