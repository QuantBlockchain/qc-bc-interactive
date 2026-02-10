import { NextResponse } from 'next/server';
import { exportAllData } from '@/lib/dynamodb';

// GET /api/dashboard/export - Export all data
export async function GET() {
  try {
    const data = await exportAllData();

    return NextResponse.json(data, {
      headers: {
        'Content-Disposition': `attachment; filename="quantum-futures-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
