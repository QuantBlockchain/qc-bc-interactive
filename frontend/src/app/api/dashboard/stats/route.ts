import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/dynamodb';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET() {
  try {
    const stats = await getDashboardStats();

    // Calculate percentages for industry votes
    const totalIndustryVotes = stats.totalIndustryVotes;
    const industryPercentages: Record<string, number> = {};

    for (const [industry, count] of Object.entries(stats.industryVoteCounts)) {
      industryPercentages[industry] = totalIndustryVotes > 0
        ? Math.round((count / totalIndustryVotes) * 100)
        : 0;
    }

    // Get top sentiments
    const topSentiments = Object.entries(stats.sentimentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    return NextResponse.json({
      sessions: stats.totalSessions,
      sentiments: stats.totalSentiments,
      industryVotes: stats.totalIndustryVotes,
      quantumKeys: stats.totalQuantumKeys,
      topSentiments,
      industryVoteCounts: stats.industryVoteCounts,
      industryPercentages,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard statistics' },
      { status: 500 }
    );
  }
}
