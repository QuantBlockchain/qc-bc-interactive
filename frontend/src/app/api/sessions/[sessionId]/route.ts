import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSession } from '@/lib/dynamodb';

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

// GET /api/sessions/[sessionId] - Get a session by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { sessionId } = await context.params;

    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

// PUT /api/sessions/[sessionId] - Update a session
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { sessionId } = await context.params;
    const body = await request.json();

    const existingSession = await getSession(sessionId);
    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const updatedSession = await updateSession(sessionId, body);

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[sessionId] - Partial update a session
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { sessionId } = await context.params;
    const body = await request.json();

    const existingSession = await getSession(sessionId);
    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const updatedSession = await updateSession(sessionId, body);

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
