'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { JourneyState } from '@/types';
import { createSession, updateSession, getSession, generateQuantumKey, GenerateQuantumKeyResponse } from '@/lib/api';

// Extended state with sessionId
interface ExtendedJourneyState extends JourneyState {
  sessionId: string;
}

const initialState: ExtendedJourneyState = {
  sessionId: '',
  currentPage: 0,
  consent: false,
  sentiment: '',
  timeframe: '',
  device: '',
  industry: '',
  quantumId: '',
  publicKey: '',
  signature: '',
  jobId: '',
};

const SESSION_STORAGE_KEY = 'quantum-futures-session-id';

export function useJourneyState() {
  const [state, setState] = useState<ExtendedJourneyState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or restore session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        // Check for existing session in localStorage
        const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);

        if (storedSessionId) {
          // Try to restore existing session
          const existingSession = await getSession(storedSessionId);
          if (existingSession) {
            setState({
              sessionId: existingSession.sessionId,
              currentPage: existingSession.currentPage,
              consent: existingSession.consent,
              sentiment: existingSession.sentiment || '',
              timeframe: existingSession.timeframe || '',
              device: existingSession.device || '',
              industry: existingSession.industry || '',
              quantumId: existingSession.quantumId || '',
              publicKey: existingSession.publicKey || '',
              signature: existingSession.signature || '',
              jobId: existingSession.jobId || '',
            });
            setIsLoading(false);
            return;
          }
        }

        // Create new session
        const newSession = await createSession({ consent: false, currentPage: 0 });
        localStorage.setItem(SESSION_STORAGE_KEY, newSession.sessionId);
        setState((prev) => ({ ...prev, sessionId: newSession.sessionId }));
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  // Sync state to backend (debounced)
  const syncToBackend = useCallback(async (newState: Partial<ExtendedJourneyState>) => {
    if (!state.sessionId) return;

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce the sync
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await updateSession(state.sessionId, newState);
      } catch (error) {
        console.error('Error syncing session:', error);
      }
    }, 500);
  }, [state.sessionId]);

  const setConsent = useCallback((consent: boolean) => {
    setState((prev) => {
      const newState = { ...prev, consent };
      syncToBackend({ consent });
      return newState;
    });
  }, [syncToBackend]);

  const setSentiment = useCallback((sentiment: string) => {
    setState((prev) => {
      const newState = { ...prev, sentiment };
      syncToBackend({ sentiment });
      return newState;
    });
  }, [syncToBackend]);

  const setDevice = useCallback((device: string) => {
    setState((prev) => {
      const newState = { ...prev, device };
      syncToBackend({ device });
      return newState;
    });
  }, [syncToBackend]);

  const setIndustry = useCallback((industry: string) => {
    setState((prev) => {
      const newState = { ...prev, industry };
      syncToBackend({ industry });
      return newState;
    });
  }, [syncToBackend]);

  const nextPage = useCallback(() => {
    setState((prev) => {
      const newPage = Math.min(prev.currentPage + 1, 6);
      const newState = { ...prev, currentPage: newPage };
      syncToBackend({ currentPage: newPage });
      return newState;
    });
  }, [syncToBackend]);

  const prevPage = useCallback(() => {
    setState((prev) => {
      const newPage = Math.max(prev.currentPage - 1, 0);
      const newState = { ...prev, currentPage: newPage };
      syncToBackend({ currentPage: newPage });
      return newState;
    });
  }, [syncToBackend]);

  const generateKeys = useCallback(async (): Promise<GenerateQuantumKeyResponse> => {
    const response = await generateQuantumKey({
      device: state.device || 'aws_sv1',
      sentiment: state.sentiment,
      timeframe: state.timeframe,
      sessionId: state.sessionId,
      useRealDevice: false,
    });

    if (response.success && !response.async) {
      setState((prev) => {
        const newState = {
          ...prev,
          quantumId: response.quantumId,
          publicKey: response.publicKey,
          signature: response.signature,
          jobId: response.jobId,
        };
        syncToBackend({
          quantumId: response.quantumId,
          publicKey: response.publicKey,
          signature: response.signature,
          jobId: response.jobId,
        });
        return newState;
      });
    }

    return response;
  }, [state.device, state.sentiment, state.timeframe, state.sessionId, syncToBackend]);

  const restart = useCallback(async () => {
    try {
      const newSession = await createSession({ consent: false, currentPage: 0 });
      localStorage.setItem(SESSION_STORAGE_KEY, newSession.sessionId);
      setState({
        ...initialState,
        sessionId: newSession.sessionId,
      });
    } catch (error) {
      console.error('Error creating new session:', error);
      setState(initialState);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    isLoading,
    setConsent,
    setSentiment,
    setDevice,
    setIndustry,
    nextPage,
    prevPage,
    generateKeys,
    restart,
  };
}
