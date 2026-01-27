import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // In production, this would update the database
    console.log('📺 Telecast marked as viewed by team:', teamId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking telecast as viewed:', error);
    return NextResponse.json(
      { error: 'Failed to mark telecast as viewed' },
      { status: 500 }
    );
  }
}