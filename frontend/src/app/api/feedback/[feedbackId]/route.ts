import { NextRequest, NextResponse } from 'next/server';
import { updateFeedbackStatus, deleteFeedback } from '@/lib/dynamodb';

// PATCH - Update feedback status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
  try {
    const { feedbackId } = await params;
    const body = await request.json();
    const { createdAt, status } = body;

    if (!createdAt || !status) {
      return NextResponse.json(
        { error: 'createdAt and status are required' },
        { status: 400 }
      );
    }

    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const feedback = await updateFeedbackStatus(feedbackId, createdAt, status);

    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}

// DELETE - Delete feedback
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
  try {
    const { feedbackId } = await params;
    const { searchParams } = new URL(request.url);
    const createdAt = searchParams.get('createdAt');

    if (!createdAt) {
      return NextResponse.json(
        { error: 'createdAt is required' },
        { status: 400 }
      );
    }

    await deleteFeedback(feedbackId, createdAt);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to delete feedback' },
      { status: 500 }
    );
  }
}
