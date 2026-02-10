import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION_CUSTOM || process.env.AWS_REGION || 'us-east-1',
});

// Create document client for easier JSON handling
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Table names from environment variables
export const TABLES = {
  SESSIONS: process.env.SESSIONS_TABLE || 'quantum-futures-sessions',
  SENTIMENTS: process.env.SENTIMENTS_TABLE || 'quantum-futures-sentiments',
  INDUSTRY_VOTES: process.env.INDUSTRY_VOTES_TABLE || 'quantum-futures-industry-votes',
  QUANTUM_KEYS: process.env.QUANTUM_KEYS_TABLE || 'quantum-futures-quantum-keys',
  INVITE_CODES: process.env.INVITE_CODES_TABLE || 'quantum-futures-invite-codes',
  ADMINS: process.env.ADMINS_TABLE || 'quantum-futures-admins',
  FEEDBACK: process.env.FEEDBACK_TABLE || 'quantum-futures-feedback',
};

// S3 bucket name for feedback files
export const FEEDBACK_BUCKET = process.env.FEEDBACK_BUCKET || 'quantum-futures-feedback';

// Session interfaces
export interface Session {
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
  ttl?: number;
}

// Sentiment interfaces
export interface Sentiment {
  id: string;
  word: string;
  sessionId: string;
  createdAt: string;
}

// Industry Vote interfaces
export interface IndustryVote {
  id: string;
  industry: string;
  sessionId: string;
  createdAt: string;
}

// Quantum Key interfaces
export interface QuantumKey {
  quantumId: string;
  sessionId: string;
  publicKey: string;
  signature: string;
  device: string;
  jobId: string;
  createdAt: string;
}

// Invite Code interfaces
export interface InviteCode {
  code: string;
  maxUses: number;
  usedCount: number;
  usedBy?: string[];
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

// Helper functions for DynamoDB operations

export async function createSession(session: Session): Promise<Session> {
  await docClient.send(
    new PutCommand({
      TableName: TABLES.SESSIONS,
      Item: session,
    })
  );
  return session;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLES.SESSIONS,
      Key: { sessionId },
    })
  );
  return (result.Item as Session) || null;
}

export async function updateSession(
  sessionId: string,
  updates: Partial<Session>
): Promise<Session | null> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'sessionId' && value !== undefined) {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }
  });

  if (updateExpressions.length === 0) {
    return getSession(sessionId);
  }

  // Always update the updatedAt timestamp
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLES.SESSIONS,
      Key: { sessionId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return (result.Attributes as Session) || null;
}

// Sentiment functions
export async function createSentiment(sentiment: Sentiment): Promise<Sentiment> {
  await docClient.send(
    new PutCommand({
      TableName: TABLES.SENTIMENTS,
      Item: sentiment,
    })
  );
  return sentiment;
}

export async function getSentimentsByWord(word: string): Promise<Sentiment[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLES.SENTIMENTS,
      IndexName: 'word-index',
      KeyConditionExpression: '#word = :word',
      ExpressionAttributeNames: { '#word': 'word' },
      ExpressionAttributeValues: { ':word': word },
    })
  );
  return (result.Items as Sentiment[]) || [];
}

export async function getAllSentiments(): Promise<Sentiment[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLES.SENTIMENTS,
    })
  );
  return (result.Items as Sentiment[]) || [];
}

export async function getSentimentWordCounts(): Promise<Record<string, number>> {
  const sentiments = await getAllSentiments();
  const counts: Record<string, number> = {};
  sentiments.forEach((s) => {
    const word = s.word.toLowerCase();
    counts[word] = (counts[word] || 0) + 1;
  });
  return counts;
}

// Industry Vote functions
export async function createIndustryVote(vote: IndustryVote): Promise<IndustryVote> {
  await docClient.send(
    new PutCommand({
      TableName: TABLES.INDUSTRY_VOTES,
      Item: vote,
    })
  );
  return vote;
}

export async function getIndustryVoteCounts(): Promise<Record<string, number>> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLES.INDUSTRY_VOTES,
    })
  );
  const votes = (result.Items as IndustryVote[]) || [];
  const counts: Record<string, number> = {};
  votes.forEach((v) => {
    counts[v.industry] = (counts[v.industry] || 0) + 1;
  });
  return counts;
}

export async function getAllIndustryVotes(): Promise<IndustryVote[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLES.INDUSTRY_VOTES,
    })
  );
  return (result.Items as IndustryVote[]) || [];
}

// Quantum Key functions
export async function createQuantumKey(key: QuantumKey): Promise<QuantumKey> {
  await docClient.send(
    new PutCommand({
      TableName: TABLES.QUANTUM_KEYS,
      Item: key,
    })
  );
  return key;
}

export async function getQuantumKey(quantumId: string): Promise<QuantumKey | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLES.QUANTUM_KEYS,
      Key: { quantumId },
    })
  );
  return (result.Item as QuantumKey) || null;
}

export async function getAllQuantumKeys(): Promise<QuantumKey[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLES.QUANTUM_KEYS,
    })
  );
  return (result.Items as QuantumKey[]) || [];
}

export async function getQuantumKeyCount(): Promise<number> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLES.QUANTUM_KEYS,
      Select: 'COUNT',
    })
  );
  return result.Count || 0;
}

// Invite Code functions
export async function createInviteCode(inviteCode: InviteCode): Promise<InviteCode> {
  await docClient.send(
    new PutCommand({
      TableName: TABLES.INVITE_CODES,
      Item: inviteCode,
    })
  );
  return inviteCode;
}

export async function getInviteCode(code: string): Promise<InviteCode | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLES.INVITE_CODES,
      Key: { code },
    })
  );
  return (result.Item as InviteCode) || null;
}

export async function markInviteCodeUsed(
  code: string,
  sessionId: string
): Promise<InviteCode | null> {
  // First get the current invite code to check usedBy array
  const currentCode = await getInviteCode(code);
  if (!currentCode) return null;

  const usedBy = currentCode.usedBy || [];
  usedBy.push(sessionId);

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLES.INVITE_CODES,
      Key: { code },
      UpdateExpression: 'SET usedCount = usedCount + :one, usedBy = :usedBy',
      ExpressionAttributeValues: {
        ':one': 1,
        ':usedBy': usedBy,
      },
      ReturnValues: 'ALL_NEW',
    })
  );
  return (result.Attributes as InviteCode) || null;
}

export async function getAllInviteCodes(): Promise<InviteCode[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLES.INVITE_CODES,
    })
  );
  return (result.Items as InviteCode[]) || [];
}

export async function deleteInviteCode(code: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLES.INVITE_CODES,
      Key: { code },
    })
  );
}

// Dashboard statistics
export async function getDashboardStats(): Promise<{
  totalSessions: number;
  totalSentiments: number;
  totalIndustryVotes: number;
  totalQuantumKeys: number;
  sentimentCounts: Record<string, number>;
  industryVoteCounts: Record<string, number>;
}> {
  const [sessions, sentiments, industryVotes, quantumKeys] = await Promise.all([
    docClient.send(new ScanCommand({ TableName: TABLES.SESSIONS, Select: 'COUNT' })),
    getAllSentiments(),
    getAllIndustryVotes(),
    docClient.send(new ScanCommand({ TableName: TABLES.QUANTUM_KEYS, Select: 'COUNT' })),
  ]);

  const sentimentCounts: Record<string, number> = {};
  sentiments.forEach((s) => {
    const word = s.word.toLowerCase();
    sentimentCounts[word] = (sentimentCounts[word] || 0) + 1;
  });

  const industryVoteCounts: Record<string, number> = {};
  industryVotes.forEach((v) => {
    industryVoteCounts[v.industry] = (industryVoteCounts[v.industry] || 0) + 1;
  });

  return {
    totalSessions: sessions.Count || 0,
    totalSentiments: sentiments.length,
    totalIndustryVotes: industryVotes.length,
    totalQuantumKeys: quantumKeys.Count || 0,
    sentimentCounts,
    industryVoteCounts,
  };
}

// Clear all data (admin function)
export async function clearAllData(): Promise<void> {
  // Get all items from each table and delete them
  const tables = [
    TABLES.SESSIONS,
    TABLES.SENTIMENTS,
    TABLES.INDUSTRY_VOTES,
    TABLES.QUANTUM_KEYS,
  ];

  for (const tableName of tables) {
    const result = await docClient.send(new ScanCommand({ TableName: tableName }));
    const items = result.Items || [];

    if (items.length === 0) continue;

    // Determine the key attribute name based on table
    let keyAttr = 'id';
    if (tableName === TABLES.SESSIONS) keyAttr = 'sessionId';
    if (tableName === TABLES.QUANTUM_KEYS) keyAttr = 'quantumId';
    if (tableName === TABLES.INVITE_CODES) keyAttr = 'code';

    // Delete in batches of 25
    const batches = [];
    for (let i = 0; i < items.length; i += 25) {
      const batch = items.slice(i, i + 25);
      batches.push(batch);
    }

    for (const batch of batches) {
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: batch.map((item) => ({
              DeleteRequest: {
                Key: { [keyAttr]: item[keyAttr] },
              },
            })),
          },
        })
      );
    }
  }
}

// Export all data (admin function)
export async function exportAllData(): Promise<{
  sessions: Session[];
  sentiments: Sentiment[];
  industryVotes: IndustryVote[];
  quantumKeys: QuantumKey[];
  exportedAt: string;
}> {
  const [sessions, sentiments, industryVotes, quantumKeys] = await Promise.all([
    docClient.send(new ScanCommand({ TableName: TABLES.SESSIONS })),
    docClient.send(new ScanCommand({ TableName: TABLES.SENTIMENTS })),
    docClient.send(new ScanCommand({ TableName: TABLES.INDUSTRY_VOTES })),
    docClient.send(new ScanCommand({ TableName: TABLES.QUANTUM_KEYS })),
  ]);

  return {
    sessions: (sessions.Items as Session[]) || [],
    sentiments: (sentiments.Items as Sentiment[]) || [],
    industryVotes: (industryVotes.Items as IndustryVote[]) || [],
    quantumKeys: (quantumKeys.Items as QuantumKey[]) || [],
    exportedAt: new Date().toISOString(),
  };
}

// Admin interfaces
export interface Admin {
  username: string;
  password: string; // Plain text for now, can be hashed later
  displayName: string;
  createdAt: string;
  lastLoginAt?: string;
}

// Admin functions
export async function getAdmin(username: string): Promise<Admin | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLES.ADMINS,
      Key: { username },
    })
  );
  return (result.Item as Admin) || null;
}

export async function createAdmin(admin: Admin): Promise<Admin> {
  await docClient.send(
    new PutCommand({
      TableName: TABLES.ADMINS,
      Item: admin,
    })
  );
  return admin;
}

export async function updateAdminLastLogin(username: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.ADMINS,
      Key: { username },
      UpdateExpression: 'SET lastLoginAt = :lastLoginAt',
      ExpressionAttributeValues: {
        ':lastLoginAt': new Date().toISOString(),
      },
    })
  );
}

export async function validateAdminCredentials(
  username: string,
  password: string
): Promise<Admin | null> {
  const admin = await getAdmin(username);
  if (!admin) return null;
  if (admin.password !== password) return null;

  // Update last login time
  await updateAdminLastLogin(username);

  return admin;
}

// Initialize default admin if not exists
export async function initializeDefaultAdmin(): Promise<void> {
  const defaultAdmin = await getAdmin('admin');
  if (!defaultAdmin) {
    await createAdmin({
      username: 'admin',
      password: 'admin123', // Default password, change in DynamoDB
      displayName: 'Administrator',
      createdAt: new Date().toISOString(),
    });
  }
}

// Feedback interfaces
export interface FeedbackFile {
  fileName: string;
  fileKey: string;
  fileSize: number;
  fileType: string;
}

export interface Feedback {
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

// Feedback functions
export async function createFeedback(feedback: Feedback): Promise<Feedback> {
  await docClient.send(
    new PutCommand({
      TableName: TABLES.FEEDBACK,
      Item: feedback,
    })
  );
  return feedback;
}

export async function getFeedback(feedbackId: string, createdAt: string): Promise<Feedback | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLES.FEEDBACK,
      Key: { feedbackId, createdAt },
    })
  );
  return (result.Item as Feedback) || null;
}

export async function getAllFeedback(): Promise<Feedback[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLES.FEEDBACK,
    })
  );
  // Sort by createdAt descending (newest first)
  const feedback = (result.Items as Feedback[]) || [];
  return feedback.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateFeedbackStatus(
  feedbackId: string,
  createdAt: string,
  status: Feedback['status']
): Promise<Feedback | null> {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLES.FEEDBACK,
      Key: { feedbackId, createdAt },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
      ReturnValues: 'ALL_NEW',
    })
  );
  return (result.Attributes as Feedback) || null;
}

export async function deleteFeedback(feedbackId: string, createdAt: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLES.FEEDBACK,
      Key: { feedbackId, createdAt },
    })
  );
}
