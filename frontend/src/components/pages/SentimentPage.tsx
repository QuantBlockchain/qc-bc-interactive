'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Loader2, FileSignature, KeyRound, Hash, Dices, ShieldCheck, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { COMMUNITY_WORDS, BLOCKCHAIN_TECHS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { submitSentiment, getSentiments, SentimentWord, submitIndustryVote, getIndustryVotes, IndustryVoteResult } from '@/lib/api';

interface SentimentPageProps {
  sentiment: string;
  sessionId?: string;
  industry: string;
  onSentimentChange: (sentiment: string) => void;
  onIndustryChange: (industry: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

// Desktop positions - elliptical distribution around center
const DESKTOP_POSITIONS = [
  { x: -130, y: -50, size: 'lg' },
  { x: 120, y: -45, size: 'lg' },
  { x: -110, y: 55, size: 'lg' },
  { x: 125, y: 50, size: 'lg' },
  { x: -180, y: -20, size: 'md' },
  { x: 175, y: -15, size: 'md' },
  { x: -50, y: -95, size: 'md' },
  { x: 55, y: -90, size: 'md' },
  { x: -55, y: 95, size: 'md' },
  { x: 60, y: 90, size: 'md' },
  { x: -200, y: -70, size: 'sm' },
  { x: 195, y: -65, size: 'sm' },
  { x: -195, y: 65, size: 'sm' },
  { x: 200, y: 60, size: 'sm' },
  { x: 0, y: -115, size: 'sm' },
  { x: 0, y: 110, size: 'sm' },
];

// Mobile positions - compact elliptical layout
const MOBILE_POSITIONS = [
  { x: -75, y: -35, size: 'md' },
  { x: 70, y: -30, size: 'md' },
  { x: -65, y: 40, size: 'md' },
  { x: 72, y: 35, size: 'md' },
  { x: -100, y: 0, size: 'sm' },
  { x: 95, y: 5, size: 'sm' },
  { x: -30, y: -65, size: 'sm' },
  { x: 35, y: -60, size: 'sm' },
  { x: -35, y: 65, size: 'sm' },
  { x: 40, y: 60, size: 'sm' },
];

const WORD_COLORS = [
  '#60a5fa', '#f472b6', '#4ade80', '#a78bfa', '#fbbf24',
  '#22d3ee', '#fb923c', '#818cf8', '#34d399', '#f87171',
  '#38bdf8', '#a3e635', '#e879f9', '#2dd4bf', '#fcd34d', '#c084fc',
];

const iconMap: Record<string, React.ElementType> = {
  FileSignature,
  KeyRound,
  Hash,
  Dices,
  ShieldCheck,
  Eye,
};

const colorMap: Record<string, string> = {
  blue: 'text-blue-400',
  teal: 'text-teal-400',
  green: 'text-green-400',
  purple: 'text-purple-400',
  amber: 'text-amber-400',
  red: 'text-red-400',
};

const bgColorMap: Record<string, string> = {
  post_quantum_signatures: 'bg-blue-500',
  qkd: 'bg-teal-500',
  hash_crypto: 'bg-green-500',
  quantum_random: 'bg-purple-500',
  quantum_safe_contracts: 'bg-amber-500',
  zkp: 'bg-red-500',
};

export function SentimentPage({ sentiment, sessionId, industry, onSentimentChange, onIndustryChange, onPrev, onNext }: SentimentPageProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWordCloud, setShowWordCloud] = useState(false);
  const [communityWords, setCommunityWords] = useState<SentimentWord[]>([]);
  const [totalCount, setTotalCount] = useState(1);
  const [visibleWords, setVisibleWords] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const cloudRef = useRef<HTMLDivElement>(null);

  // Blockchain voting state
  const [showVoting, setShowVoting] = useState(false);
  const [showVoteResults, setShowVoteResults] = useState(!!industry);
  const [isVoteSubmitting, setIsVoteSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(!!industry);
  const [voteResults, setVoteResults] = useState<IndustryVoteResult[]>([]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getMaxWords = () => {
    if (typeof window === 'undefined') return DESKTOP_POSITIONS.length;
    if (window.innerWidth < 380) return 6;
    if (window.innerWidth < 480) return 8;
    return isMobile ? MOBILE_POSITIONS.length : DESKTOP_POSITIONS.length;
  };

  const POSITIONS = isMobile ? MOBILE_POSITIONS : DESKTOP_POSITIONS;

  // Load existing sentiments on mount
  useEffect(() => {
    const loadSentiments = async () => {
      try {
        const data = await getSentiments();
        if (data.words.length > 0) {
          setCommunityWords(data.words.slice(0, POSITIONS.length));
          setTotalCount(data.total);
        }
      } catch (error) {
        console.error('Error loading sentiments:', error);
      }
    };
    loadSentiments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load existing votes on mount
  useEffect(() => {
    const loadVotes = async () => {
      try {
        const data = await getIndustryVotes();
        if (data.results.length > 0) {
          setVoteResults(data.results);
        }
      } catch (error) {
        console.error('Error loading votes:', error);
      }
    };
    loadVotes();
  }, []);

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    setIsSubmitting(true);
    onSentimentChange(inputValue.trim());

    try {
      const response = await submitSentiment(inputValue.trim(), sessionId);

      if (response.words && response.words.length > 0) {
        setCommunityWords(response.words.slice(0, POSITIONS.length));
        setTotalCount(response.total);
      }

      setShowWordCloud(true);

      const wordsToShow = response.words?.length > 0 ? response.words : COMMUNITY_WORDS;
      wordsToShow.slice(0, POSITIONS.length).forEach((_, index) => {
        setTimeout(() => {
          setVisibleWords((prev) => [...prev, index]);
        }, index * 100 + 500);
      });

      // Show voting section after word cloud animation
      const delay = (Math.min(wordsToShow.length, POSITIONS.length) * 100) + 1000;
      setTimeout(() => setShowVoting(true), delay);
    } catch (error) {
      console.error('Error submitting sentiment:', error);
      setShowWordCloud(true);
      COMMUNITY_WORDS.forEach((_, index) => {
        setTimeout(() => {
          setVisibleWords((prev) => [...prev, index]);
        }, index * 100 + 500);
      });
      setTimeout(() => setShowVoting(true), 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleTechSelect = async (techId: string) => {
    if (isVoteSubmitting) return;

    onIndustryChange(techId);

    if (hasVoted) return;

    setIsVoteSubmitting(true);

    try {
      const response = await submitIndustryVote(techId, sessionId);
      setHasVoted(true);

      if (response.results && response.results.length > 0) {
        setVoteResults(response.results);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    } finally {
      setIsVoteSubmitting(false);
      setTimeout(() => setShowVoteResults(true), 300);
    }
  };

  const displayWords = communityWords.length > 0
    ? communityWords.map((w, i) => ({
        text: w.word,
        weight: w.count,
        color: WORD_COLORS[i % WORD_COLORS.length],
      }))
    : COMMUNITY_WORDS;

  // Prepare vote display results — always show all 6 blockchain techs
  const voteCountMap: Record<string, { count: number; percentage: number }> = {};
  voteResults.forEach((r) => { voteCountMap[r.industry] = { count: r.count, percentage: r.percentage }; });

  const displayVoteResults = voteResults.length > 0
    ? BLOCKCHAIN_TECHS.map((tech) => {
        const data = voteCountMap[tech.id] || { count: 0, percentage: 0 };
        return {
          id: tech.id,
          name: tech.name,
          color: bgColorMap[tech.id] || 'bg-gray-500',
          count: data.count,
          percentage: data.percentage,
        };
      }).sort((a, b) => b.count - a.count || BLOCKCHAIN_TECHS.findIndex((t) => t.id === a.id) - BLOCKCHAIN_TECHS.findIndex((t) => t.id === b.id))
    : [];

  // Determine if we can continue (need both sentiment and industry)
  const canContinue = !!sentiment && !!industry;

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Public Sentiment
        </h2>
        <p className="text-xl text-gray-300">
          What&apos;s the first word that comes to mind when you hear{' '}
          <span className="text-[#14b8a6] font-medium">&quot;quantum computing&quot;</span>?
        </p>
      </div>

      {!showWordCloud && (
        <>
          <div className="max-w-xl mx-auto mb-8">
            <input
              type="text"
              placeholder="Type your word here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSubmitting}
              className="word-cloud-input w-full px-6 py-4 rounded-xl text-lg text-white placeholder-gray-500"
            />
          </div>

          <div className="flex items-center justify-center gap-6 mb-8">
            <button onClick={onPrev} className="flex items-center space-x-1.5 text-sm text-gray-400 hover:text-white transition-colors py-2 cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <Button onClick={handleSubmit} disabled={!inputValue.trim() || isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Submit</span>
              )}
            </Button>
          </div>
        </>
      )}

      {showWordCloud && (
        <div>
          <div className="glass-effect rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Community Responses</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span className="inline-block w-2 h-2 rounded-full bg-[#14b8a6] animate-pulse" />
                <span>{totalCount}</span> responses
              </div>
            </div>

            <div
              ref={cloudRef}
              className="word-cloud-canvas rounded-xl bg-gradient-to-br from-[#0a0f1a]/50 to-[#0d1520]/50 border border-gray-800/50"
            >
              <div className="word-cloud-inner relative">
                {/* User word in center */}
                <div className="user-word-container">
                  <div className="user-word-ring" />
                  <div className="user-word-ring" />
                  <div className="user-word-ring" />
                  <span
                    className="user-word-text"
                    style={{
                      fontSize: isMobile ? '18px' : '24px',
                      fontWeight: 700,
                      color: '#14b8a6',
                      background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(13, 148, 136, 0.08))',
                      padding: isMobile ? '8px 14px' : '10px 20px',
                      borderRadius: '10px',
                      border: '2px solid rgba(20, 184, 166, 0.5)',
                      textShadow: '0 0 15px rgba(20, 184, 166, 0.4)',
                      maxWidth: isMobile ? '110px' : '160px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'inline-block',
                      textAlign: 'center',
                    }}
                    title={sentiment}
                  >
                    {sentiment}
                  </span>
                </div>

                {/* Community words */}
                {displayWords.map((word, index) => {
                  const maxWords = getMaxWords();
                  if (index >= POSITIONS.length || index >= maxWords) return null;
                  const pos = POSITIONS[index];
                  const isVisible = visibleWords.includes(index);

                  return (
                    <span
                      key={`${word.text}-${index}`}
                      className={`cloud-word size-${pos.size} float-${(index % 3) + 1} ${isVisible ? 'visible' : ''}`}
                      style={{
                        left: `calc(50% + ${pos.x}px)`,
                        top: `calc(50% + ${pos.y}px)`,
                        color: word.color,
                        animationDelay: `${index * 0.12}s`,
                        maxWidth: isMobile ? '75px' : '110px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={word.text}
                    >
                      {word.text}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center space-x-8 text-xs text-gray-400">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#14b8a6] shadow-lg shadow-[#14b8a6]/50" />
                <span>Your response</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="flex space-x-0.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="w-2 h-2 rounded-full bg-pink-400" />
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </span>
                <span>Community</span>
              </div>
            </div>
          </div>

          {/* Blockchain Tech Voting Section */}
          {showVoting && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">
                  Which Blockchain Quantum Technology Matters Most?
                </h3>
                <p className="text-gray-400 text-sm">
                  Vote for the technology you believe will be most important for securing blockchain against quantum threats.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {BLOCKCHAIN_TECHS.map((item) => {
                  const Icon = iconMap[item.icon];
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'industry-option glass-effect rounded-xl p-5 text-center border-2 border-transparent cursor-pointer',
                        industry === item.id && 'selected',
                        isVoteSubmitting && 'opacity-50 pointer-events-none'
                      )}
                      onClick={() => handleTechSelect(item.id)}
                    >
                      {Icon && <Icon className={cn('w-8 h-8 mx-auto mb-3', colorMap[item.color])} />}
                      <h4 className="font-semibold text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                    </div>
                  );
                })}
              </div>

              {showVoteResults && displayVoteResults.length > 0 && (
                <div className="glass-effect rounded-2xl p-6 mb-8 animate-fade-in-up">
                  <h3 className="text-lg font-semibold mb-4">Community Votes</h3>
                  <div className="space-y-3">
                    {displayVoteResults.map((result) => (
                      <div key={result.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-300 truncate flex-1">{result.name}</span>
                          <span className="text-xs text-gray-500 ml-2">{result.count} votes</span>
                        </div>
                        <div className="flex items-center">
                          <div className="flex-1 h-3 bg-[#1f2937] rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-500', result.color)}
                              style={{ width: `${Math.max(result.percentage, result.count > 0 ? 2 : 0)}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-sm text-gray-400 ml-2">{result.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-6">
                <button onClick={onPrev} className="flex items-center space-x-1.5 text-sm text-gray-400 hover:text-white transition-colors py-2 cursor-pointer">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <Button onClick={onNext} disabled={!canContinue} className="w-full md:w-auto">
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Show continue button if voting hasn't appeared yet but sentiment is done */}
          {!showVoting && (
            <div className="flex justify-center gap-3">
              <Button variant="secondary" onClick={onPrev} className="w-full md:w-auto">
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <Button onClick={onNext} disabled={!canContinue} className="w-full md:w-auto">
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
