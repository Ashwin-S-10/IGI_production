import { NextResponse } from 'next/server';
import { clearTelecast } from '@/lib/telecast-state';

export async function POST() {
  try {
    // Clear telecast state
    const newState = clearTelecast();

    console.log('🛑 Telecast cleared');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing telecast:', error);
    return NextResponse.json(
      { error: 'Failed to clear telecast' },
      { status: 500 }
    );
  }
}