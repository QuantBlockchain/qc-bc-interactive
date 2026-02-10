import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createSession, Session } from '@/lib/dynamodb';

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const sessionId = uuidv4();
    const now = new Date();

    // TTL: 30 days from now
    const ttl = Math.floor(now.getTime() / 1000) + 30 * 24 * 60 * 60;

    const session: Session = {
      sessionId,
      consent: body.consent ?? false,
      currentPage: body.currentPage ?? 0,
      sentiment: body.sentiment,
      timeframe: body.timeframe,
      device: body.device,
      industry: body.industry,
      quantumId: body.quantumId,
      publicKey: body.publicKey,
      signature: body.signature,
      jobId: body.jobId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      ttl,
    };

    const createdSession = await createSession(session);

    return NextResponse.json(createdSession, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
