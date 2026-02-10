import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/dynamodb';

// GET /api/admin/verify - Verify admin session
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: 'No token found' },
        { status: 401 }
      );
    }

    // Decode the token to get username
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [username] = decoded.split(':');

      if (!username) {
        return NextResponse.json(
          { authenticated: false, error: 'Invalid token' },
          { status: 401 }
        );
      }

      // Verify admin exists
      const admin = await getAdmin(username);
      if (!admin) {
        return NextResponse.json(
          { authenticated: false, error: 'Admin not found' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        authenticated: true,
        admin: {
          username: admin.username,
          displayName: admin.displayName,
        },
      });
    } catch {
      return NextResponse.json(
        { authenticated: false, error: 'Invalid token format' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error verifying admin:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
