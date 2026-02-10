import { NextRequest, NextResponse } from 'next/server';
import { getInviteCode, deleteInviteCode } from '@/lib/dynamodb';

type RouteContext = {
  params: Promise<{ code: string }>;
};

// GET /api/invite-codes/[code] - Get invite code details
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { code } = await context.params;
    const upperCode = code.toUpperCase();

    const inviteCode = await getInviteCode(upperCode);

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(inviteCode);
  } catch (error) {
    console.error('Error getting invite code:', error);
    return NextResponse.json(
      { error: 'Failed to get invite code' },
      { status: 500 }
    );
  }
}

// DELETE /api/invite-codes/[code] - Delete an invite code (admin only)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { code } = await context.params;
    const upperCode = code.toUpperCase();

    // Check if code exists first
    const inviteCode = await getInviteCode(upperCode);
    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code not found' },
        { status: 404 }
      );
    }

    await deleteInviteCode(upperCode);

    return NextResponse.json({
      success: true,
      message: `Invite code "${upperCode}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting invite code:', error);
    return NextResponse.json(
      { error: 'Failed to delete invite code' },
      { status: 500 }
    );
  }
}
