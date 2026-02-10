import { NextRequest, NextResponse } from 'next/server';
import { createQuantumKey, getQuantumKey, getAllQuantumKeys, getQuantumKeyCount, QuantumKey } from '@/lib/dynamodb';

// GET /api/quantum-keys - Get quantum keys or count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quantumId = searchParams.get('quantumId');
    const countOnly = searchParams.get('count') === 'true';

    if (quantumId) {
      const key = await getQuantumKey(quantumId);
      if (!key) {
        return NextResponse.json(
          { error: 'Quantum key not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(key);
    }

    if (countOnly) {
      const count = await getQuantumKeyCount();
      return NextResponse.json({ count });
    }

    const keys = await getAllQuantumKeys();
    return NextResponse.json({
      keys,
      total: keys.length,
    });
  } catch (error) {
    console.error('Error getting quantum keys:', error);
    return NextResponse.json(
      { error: 'Failed to get quantum keys' },
      { status: 500 }
    );
  }
}

// POST /api/quantum-keys - Create a new quantum key record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.quantumId || !body.publicKey || !body.signature) {
      return NextResponse.json(
        { error: 'quantumId, publicKey, and signature are required' },
        { status: 400 }
      );
    }

    // Check if quantumId already exists
    const existingKey = await getQuantumKey(body.quantumId);
    if (existingKey) {
      return NextResponse.json(
        { error: 'Quantum ID already exists' },
        { status: 409 }
      );
    }

    const quantumKey: QuantumKey = {
      quantumId: body.quantumId,
      sessionId: body.sessionId || 'anonymous',
      publicKey: body.publicKey,
      signature: body.signature,
      device: body.device || 'unknown',
      jobId: body.jobId || '',
      createdAt: new Date().toISOString(),
    };

    const createdKey = await createQuantumKey(quantumKey);

    // Get updated count
    const count = await getQuantumKeyCount();

    return NextResponse.json({
      key: createdKey,
      totalKeys: count,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating quantum key:', error);
    return NextResponse.json(
      { error: 'Failed to create quantum key' },
      { status: 500 }
    );
  }
}
