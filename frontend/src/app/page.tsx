'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { ToastProvider } from '@/components/ui/Toast';
import { ParticleBackground } from '@/components/visualizations/ParticleBackground';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { NobelPrizePage } from '@/components/pages/NobelPrizePage';
import { QuantumBlockchainPage } from '@/components/pages/QuantumBlockchainPage';
import { QuantumReadyPage } from '@/components/pages/QuantumReadyPage';
import { SentimentPage } from '@/components/pages/SentimentPage';
import { DeviceSelectionPage } from '@/components/pages/DeviceSelectionPage';
import { KeyGenerationPage } from '@/components/pages/KeyGenerationPage';
import { CompletionPage } from '@/components/pages/CompletionPage';
import { FeedbackButton } from '@/components/FeedbackButton';
import { useJourneyState } from '@/hooks/useJourneyState';

export default function Home() {
  const {
    state,
    isLoading,
    setConsent,
    setSentiment,
    setDevice,
    setIndustry,
    generateKeys,
    nextPage,
    prevPage,
    restart,
  } = useJourneyState();

  // Track previous page to detect page changes
  const prevPageRef = useRef(state.currentPage);

  // Scroll to top when page changes
  useEffect(() => {
    if (prevPageRef.current !== state.currentPage) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 0);
      prevPageRef.current = state.currentPage;
    }
  }, [state.currentPage]);

  const renderPage = () => {
    switch (state.currentPage) {
      case 0:
        return (
          <NobelPrizePage
            onNext={nextPage}
          />
        );
      case 1:
        return (
          <QuantumBlockchainPage
            onPrev={prevPage}
            onNext={nextPage}
          />
        );
      case 2:
        return (
          <QuantumReadyPage
            consent={state.consent}
            sessionId={state.sessionId}
            onConsentChange={setConsent}
            onPrev={prevPage}
            onNext={nextPage}
          />
        );
      case 3:
        return (
          <SentimentPage
            sentiment={state.sentiment}
            sessionId={state.sessionId}
            industry={state.industry}
            onSentimentChange={setSentiment}
            onIndustryChange={setIndustry}
            onPrev={prevPage}
            onNext={nextPage}
          />
        );
      case 4:
        return (
          <DeviceSelectionPage
            device={state.device}
            onDeviceChange={setDevice}
            onPrev={prevPage}
            onNext={nextPage}
          />
        );
      case 5:
        return (
          <KeyGenerationPage
            state={state}
            onGenerateKeys={generateKeys}
            onNext={nextPage}
          />
        );
      case 6:
        return <CompletionPage state={state} onRestart={restart} />;
      default:
        return null;
    }
  };

  // Show loading state while session is being initialized
  if (isLoading) {
    return (
      <ToastProvider>
        <ParticleBackground />
        <div className="relative z-10 min-h-screen flex flex-col">
          <Header
            currentPage={0}
            onLogoClick={() => {}}
          />
          <main className="flex-1 container mx-auto px-6 py-8 pt-24 md:pt-28 max-w-4xl flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[#14b8a6] animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Initializing your quantum journey...</p>
            </div>
          </main>
          <Footer />
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <ParticleBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        <Header
          currentPage={state.currentPage}
          onLogoClick={restart}
        />

        <main className="flex-1 container mx-auto px-6 py-8 pt-24 md:pt-28 max-w-4xl">
          <div className="animate-fade-in-up">
            {renderPage()}
          </div>
        </main>

        <Footer />

        {/* Feedback Button */}
        <FeedbackButton sessionId={state.sessionId} />
      </div>
    </ToastProvider>
  );
}
