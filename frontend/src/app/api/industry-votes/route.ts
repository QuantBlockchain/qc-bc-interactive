import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createIndustryVote, getIndustryVoteCounts, getAllIndustryVotes, IndustryVote } from '@/lib/dynamodb';

// Blockchain tech IDs (new) + legacy industry IDs (backward compat)
const BLOCKCHAIN_TECH_IDS = ['post_quantum_signatures', 'qkd', 'hash_crypto', 'quantum_random', 'quantum_safe_contracts', 'zkp'];
const LEGACY_INDUSTRY_IDS = ['finance', 'healthcare', 'cybersecurity', 'logistics', 'energy', 'ai'];
const ALL_VALID_IDS = [...BLOCKCHAIN_TECH_IDS, ...LEGACY_INDUSTRY_IDS];

// GET /api/industry-votes - Get industry vote counts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('all') === 'true';

    if (includeAll) {
      const votes = await getAllIndustryVotes();
      return NextResponse.json({
        votes,
        total: votes.length,
      });
    }

    const voteCounts = await getIndustryVoteCounts();

    // Calculate total only among blockchain tech votes (ignore legacy)
    const blockchainTotal = BLOCKCHAIN_TECH_IDS.reduce((sum, id) => sum + (voteCounts[id] || 0), 0);

    // Always return all blockchain tech options (even with 0 votes)
    const results = BLOCKCHAIN_TECH_IDS.map((industry) => {
      const count = voteCounts[industry] || 0;
      const percentage = blockchainTotal > 0 ? Math.round((count / blockchainTotal) * 100) : 0;
      return { industry, count, percentage };
    });

    // Sort by count descending, then by ID for stable order at 0
    results.sort((a, b) => b.count - a.count || BLOCKCHAIN_TECH_IDS.indexOf(a.industry) - BLOCKCHAIN_TECH_IDS.indexOf(b.industry));

    return NextResponse.json({
      results,
      total: blockchainTotal,
    });
  } catch (error) {
    console.error('Error getting industry votes:', error);
    return NextResponse.json(
      { error: 'Failed to get industry votes' },
      { status: 500 }
    );
  }
}

// POST /api/industry-votes - Create a new industry vote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.industry || !ALL_VALID_IDS.includes(body.industry)) {
      return NextResponse.json(
        { error: 'Valid industry/blockchain tech is required', validOptions: ALL_VALID_IDS },
        { status: 400 }
      );
    }

    const vote: IndustryVote = {
      id: uuidv4(),
      industry: body.industry,
      sessionId: body.sessionId || 'anonymous',
      createdAt: new Date().toISOString(),
    };

    const createdVote = await createIndustryVote(vote);

    // Get updated vote counts
    const voteCounts = await getIndustryVoteCounts();
    const blockchainTotal = BLOCKCHAIN_TECH_IDS.reduce((sum, id) => sum + (voteCounts[id] || 0), 0);

    const results = BLOCKCHAIN_TECH_IDS.map((industry) => {
      const count = voteCounts[industry] || 0;
      const percentage = blockchainTotal > 0 ? Math.round((count / blockchainTotal) * 100) : 0;
      return { industry, count, percentage };
    });

    results.sort((a, b) => b.count - a.count || BLOCKCHAIN_TECH_IDS.indexOf(a.industry) - BLOCKCHAIN_TECH_IDS.indexOf(b.industry));

    return NextResponse.json({
      vote: createdVote,
      results,
      total: blockchainTotal,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating industry vote:', error);
    return NextResponse.json(
      { error: 'Failed to create industry vote' },
      { status: 500 }
    );
  }
}
