import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createSentiment, getSentimentWordCounts, getAllSentiments, Sentiment } from '@/lib/dynamodb';

// GET /api/sentiments - Get sentiment word counts or all sentiments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('all') === 'true';

    if (includeAll) {
      const sentiments = await getAllSentiments();
      return NextResponse.json({
        sentiments,
        total: sentiments.length,
      });
    }

    const wordCounts = await getSentimentWordCounts();

    // Transform to array sorted by count
    const sortedWords = Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      words: sortedWords,
      total: sortedWords.reduce((sum, w) => sum + w.count, 0),
    });
  } catch (error) {
    console.error('Error getting sentiments:', error);
    return NextResponse.json(
      { error: 'Failed to get sentiments' },
      { status: 500 }
    );
  }
}

// POST /api/sentiments - Create a new sentiment entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.word || typeof body.word !== 'string') {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      );
    }

    const sentiment: Sentiment = {
      id: uuidv4(),
      word: body.word.trim().toLowerCase(),
      sessionId: body.sessionId || 'anonymous',
      createdAt: new Date().toISOString(),
    };

    const createdSentiment = await createSentiment(sentiment);

    // Get updated word counts
    const wordCounts = await getSentimentWordCounts();
    const sortedWords = Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      sentiment: createdSentiment,
      words: sortedWords,
      total: sortedWords.reduce((sum, w) => sum + w.count, 0),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating sentiment:', error);
    return NextResponse.json(
      { error: 'Failed to create sentiment' },
      { status: 500 }
    );
  }
}
