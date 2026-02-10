import { NextRequest, NextResponse } from 'next/server';
import { validateAdminCredentials, initializeDefaultAdmin } from '@/lib/dynamodb';

// POST /api/admin/login - Admin login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Initialize default admin if not exists
    await initializeDefaultAdmin();

    const admin = await validateAdminCredentials(body.username, body.password);

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate a simple session token (in production, use JWT or proper session management)
    const token = Buffer.from(`${admin.username}:${Date.now()}`).toString('base64');

    const response = NextResponse.json({
      success: true,
      admin: {
        username: admin.username,
        displayName: admin.displayName,
      },
      token,
    });

    // Set cookie for session management
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error during admin login:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
