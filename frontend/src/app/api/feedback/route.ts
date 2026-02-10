import { NextRequest, NextResponse } from 'next/server';
import { createFeedback, getAllFeedback, Feedback } from '@/lib/dynamodb';
import { v4 as uuidv4 } from 'uuid';

// GET - Get all feedback (for dashboard)
export async function GET() {
  try {
    const feedback = await getAllFeedback();
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error getting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to get feedback' },
      { status: 500 }
    );
  }
}

// POST - Submit new feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, category, message, files, sessionId } = body;

    if (!category || !message) {
      return NextResponse.json(
        { error: 'Category and message are required' },
        { status: 400 }
      );
    }

    const feedback: Feedback = {
      feedbackId: uuidv4(),
      createdAt: new Date().toISOString(),
      sessionId,
      name: name || undefined,
      email: email || undefined,
      category,
      message,
      files: files || [],
      status: 'pending',
    };

    await createFeedback(feedback);

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
