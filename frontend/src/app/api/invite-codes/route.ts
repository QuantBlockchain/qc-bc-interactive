import { NextRequest, NextResponse } from 'next/server';
import { createInviteCode, getAllInviteCodes, InviteCode } from '@/lib/dynamodb';

// Helper to generate random code
function generateRandomCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/invite-codes - List all invite codes (admin only)
export async function GET() {
  try {
    const codes = await getAllInviteCodes();
    // Sort by createdAt descending
    codes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      codes,
      total: codes.length,
    });
  } catch (error) {
    console.error('Error listing invite codes:', error);
    return NextResponse.json(
      { error: 'Failed to list invite codes' },
      { status: 500 }
    );
  }
}

// POST /api/invite-codes - Create a new invite code (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate code if not provided
    const code = body.code?.trim().toUpperCase() || generateRandomCode();

    // Calculate expiration date
    let expiresAt: string | undefined;
    if (body.expiresInDays && typeof body.expiresInDays === 'number') {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + body.expiresInDays);
      expiresAt = expirationDate.toISOString();
    }

    const inviteCode: InviteCode = {
      code,
      maxUses: body.maxUses || 1,
      usedCount: 0,
      usedBy: [],
      createdAt: new Date().toISOString(),
      expiresAt,
      isActive: true,
    };

    const createdCode = await createInviteCode(inviteCode);

    return NextResponse.json({
      code: createdCode,
      message: `Invite code "${code}" created successfully`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invite code:', error);
    return NextResponse.json(
      { error: 'Failed to create invite code' },
      { status: 500 }
    );
  }
}
