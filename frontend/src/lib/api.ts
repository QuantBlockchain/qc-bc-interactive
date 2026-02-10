/**
 * API Client for Quantum Futures Backend
 */

const API_BASE = '/api';

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ============================================
// Session API
// ============================================

export interface SessionData {
  sessionId: string;
  consent: boolean;
  sentiment?: string;
  timeframe?: string;
  device?: string;
  industry?: string;
  quantumId?: string;
  publicKey?: string;
  signature?: string;
  jobId?: string;
  currentPage: number;
  createdAt: string;
  updatedAt: string;
}

export async function createSession(data: Partial<SessionData> = {}): Promise<SessionData> {
  return fetchAPI<SessionData>('/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  try {
    return await fetchAPI<SessionData>(`/sessions/${sessionId}`);
  } catch {
    return null;
  }
}

export async function updateSession(
  sessionId: string,
  data: Partial<SessionData>
): Promise<SessionData> {
  return fetchAPI<SessionData>(`/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ============================================
// Sentiments API
// ============================================

export interface SentimentWord {
  word: string;
  count: number;
}

export interface SentimentsResponse {
  words: SentimentWord[];
  total: number;
}

export interface SubmitSentimentResponse {
  sentiment: { id: string; word: string; sessionId: string; createdAt: string };
  words: SentimentWord[];
  total: number;
}

export async function getSentiments(): Promise<SentimentsResponse> {
  return fetchAPI<SentimentsResponse>('/sentiments');
}

export async function submitSentiment(
  word: string,
  sessionId?: string
): Promise<SubmitSentimentResponse> {
  return fetchAPI<SubmitSentimentResponse>('/sentiments', {
    method: 'POST',
    body: JSON.stringify({ word, sessionId }),
  });
}

// ============================================
// Industry Votes API
// ============================================

export interface IndustryVoteResult {
  industry: string;
  count: number;
  percentage: number;
}

export interface IndustryVotesResponse {
  results: IndustryVoteResult[];
  total: number;
}

export interface SubmitVoteResponse {
  vote: { id: string; industry: string; sessionId: string; createdAt: string };
  results: IndustryVoteResult[];
  total: number;
}

export async function getIndustryVotes(): Promise<IndustryVotesResponse> {
  return fetchAPI<IndustryVotesResponse>('/industry-votes');
}

export async function submitIndustryVote(
  industry: string,
  sessionId?: string
): Promise<SubmitVoteResponse> {
  return fetchAPI<SubmitVoteResponse>('/industry-votes', {
    method: 'POST',
    body: JSON.stringify({ industry, sessionId }),
  });
}

// ============================================
// Quantum Keys API
// ============================================

export interface QuantumKeyData {
  quantumId: string;
  sessionId: string;
  publicKey: string;
  signature: string;
  device: string;
  jobId: string;
  createdAt: string;
}

export interface QuantumKeyCountResponse {
  count: number;
}

export interface SaveQuantumKeyResponse {
  key: QuantumKeyData;
  totalKeys: number;
}

export interface GenerateQuantumKeyRequest {
  device: string;
  sentiment?: string;
  timeframe?: string;
  sessionId?: string;
  useRealDevice?: boolean;
}

export interface GenerateQuantumKeyResponse {
  success: boolean;
  async: boolean;
  quantumId: string;
  publicKey: string;
  signature: string;
  jobId: string;
  device: string;
  processingMethod: string;
  algorithm: string;
  quantumNumber: number;
  entanglementData: number[];
  timestamp: string;
  // For async tasks
  taskArn?: string;
  message?: string;
  estimatedTime?: string;
}

export async function getQuantumKeyCount(): Promise<number> {
  const response = await fetchAPI<QuantumKeyCountResponse>('/quantum-keys?count=true');
  return response.count;
}

export async function generateQuantumKey(
  data: GenerateQuantumKeyRequest
): Promise<GenerateQuantumKeyResponse> {
  return fetchAPI<GenerateQuantumKeyResponse>('/quantum-keys/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function saveQuantumKey(data: {
  quantumId: string;
  publicKey: string;
  signature: string;
  device: string;
  jobId: string;
  sessionId?: string;
}): Promise<SaveQuantumKeyResponse> {
  return fetchAPI<SaveQuantumKeyResponse>('/quantum-keys', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// Invite Codes API
// ============================================

export interface InviteCode {
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  createdAt: string;
  isActive: boolean;
}

export interface InviteCodesResponse {
  codes: InviteCode[];
  total: number;
}

export interface ValidateInviteCodeResponse {
  valid: boolean;
  used?: boolean;
  error?: string;
  message?: string;
}

export interface CreateInviteCodeRequest {
  code?: string;
  maxUses?: number;
  expiresInDays?: number;
}

export interface CreateInviteCodeResponse {
  code: InviteCode;
  message: string;
}

export async function getInviteCodes(): Promise<InviteCodesResponse> {
  return fetchAPI<InviteCodesResponse>('/invite-codes');
}

export async function createInviteCode(
  data: CreateInviteCodeRequest = {}
): Promise<CreateInviteCodeResponse> {
  return fetchAPI<CreateInviteCodeResponse>('/invite-codes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteInviteCode(code: string): Promise<{ success: boolean; message: string }> {
  return fetchAPI<{ success: boolean; message: string }>(`/invite-codes/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  });
}

export async function validateInviteCode(
  code: string,
  useCode: boolean = false,
  sessionId?: string
): Promise<ValidateInviteCodeResponse> {
  return fetchAPI<ValidateInviteCodeResponse>('/invite-codes/validate', {
    method: 'POST',
    body: JSON.stringify({ code, useCode, sessionId }),
  });
}

// ============================================
// Dashboard API
// ============================================

export interface DashboardStats {
  sessions: number;
  sentiments: number;
  industryVotes: number;
  quantumKeys: number;
  topSentiments: SentimentWord[];
  industryVoteCounts: Record<string, number>;
  industryPercentages: Record<string, number>;
  timestamp: string;
}

export interface ExportData {
  sessions: SessionData[];
  sentiments: Array<{ id: string; word: string; sessionId: string; createdAt: string }>;
  industryVotes: Array<{ id: string; industry: string; sessionId: string; createdAt: string }>;
  quantumKeys: QuantumKeyData[];
  exportedAt: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchAPI<DashboardStats>('/dashboard/stats');
}

export async function exportAllData(): Promise<ExportData> {
  return fetchAPI<ExportData>('/dashboard/export');
}

export async function clearAllData(): Promise<{ success: boolean; message: string }> {
  return fetchAPI<{ success: boolean; message: string }>('/dashboard/clear', {
    method: 'POST',
  });
}

// ============================================
// Feedback API
// ============================================

export interface FeedbackFile {
  fileName: string;
  fileKey: string;
  fileSize: number;
  fileType: string;
}

export interface FeedbackData {
  feedbackId: string;
  createdAt: string;
  sessionId?: string;
  name?: string;
  email?: string;
  category: string;
  message: string;
  files?: FeedbackFile[];
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface FeedbackListResponse {
  feedback: FeedbackData[];
}

export interface SubmitFeedbackRequest {
  name?: string;
  email?: string;
  category: string;
  message: string;
  files?: FeedbackFile[];
  sessionId?: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
}

export async function getAllFeedback(): Promise<FeedbackListResponse> {
  return fetchAPI<FeedbackListResponse>('/feedback');
}

export async function submitFeedback(data: SubmitFeedbackRequest): Promise<{ success: boolean; feedback: FeedbackData }> {
  return fetchAPI<{ success: boolean; feedback: FeedbackData }>('/feedback', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getUploadUrl(fileName: string, fileType: string): Promise<UploadUrlResponse> {
  return fetchAPI<UploadUrlResponse>('/feedback/upload-url', {
    method: 'POST',
    body: JSON.stringify({ fileName, fileType }),
  });
}

export async function getDownloadUrl(fileKey: string): Promise<DownloadUrlResponse> {
  return fetchAPI<DownloadUrlResponse>(`/feedback/upload-url?fileKey=${encodeURIComponent(fileKey)}`);
}

export async function updateFeedbackStatus(
  feedbackId: string,
  createdAt: string,
  status: FeedbackData['status']
): Promise<{ success: boolean; feedback: FeedbackData }> {
  return fetchAPI<{ success: boolean; feedback: FeedbackData }>(`/feedback/${feedbackId}`, {
    method: 'PATCH',
    body: JSON.stringify({ createdAt, status }),
  });
}

export async function deleteFeedback(
  feedbackId: string,
  createdAt: string
): Promise<{ success: boolean }> {
  return fetchAPI<{ success: boolean }>(`/feedback/${feedbackId}?createdAt=${encodeURIComponent(createdAt)}`, {
    method: 'DELETE',
  });
}
