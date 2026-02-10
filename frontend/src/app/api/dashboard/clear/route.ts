import { NextResponse } from 'next/server';
import { clearAllData } from '@/lib/dynamodb';

// POST /api/dashboard/clear - Clear all data (admin only)
export async function POST() {
  try {
    await clearAllData();

    return NextResponse.json({
      success: true,
      message: 'All data has been cleared',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json(
      { error: 'Failed to clear data' },
      { status: 500 }
    );
  }
}
