import { NextRequest, NextResponse } from 'next/server';
import { getInviteCode, markInviteCodeUsed } from '@/lib/dynamodb';

// POST /api/invite-codes/validate - Validate and optionally use an invite code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.code || typeof body.code !== 'string') {
      return NextResponse.json(
        { error: 'Invite code is required', valid: false },
        { status: 400 }
      );
    }

    const code = body.code.toUpperCase();
    const inviteCode = await getInviteCode(code);

    if (!inviteCode) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid invite code',
      });
    }

    // Check if code is active
    if (!inviteCode.isActive) {
      return NextResponse.json({
        valid: false,
        error: 'Invite code is no longer active',
      });
    }

    // Check if all uses have been exhausted
    if (inviteCode.usedCount >= inviteCode.maxUses) {
      return NextResponse.json({
        valid: false,
        error: 'Invite code has reached maximum uses',
      });
    }

    // Check if expired
    if (inviteCode.expiresAt && new Date(inviteCode.expiresAt) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'Invite code has expired',
      });
    }

    // If useCode is true, increment the usage count
    if (body.useCode === true && body.sessionId) {
      await markInviteCodeUsed(code, body.sessionId);
      return NextResponse.json({
        valid: true,
        used: true,
        message: 'Invite code validated and usage recorded',
      });
    }

    return NextResponse.json({
      valid: true,
      message: 'Invite code is valid',
    });
  } catch (error) {
    console.error('Error validating invite code:', error);
    return NextResponse.json(
      { error: 'Failed to validate invite code', valid: false },
      { status: 500 }
    );
  }
}
