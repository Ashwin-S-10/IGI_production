import { NextRequest, NextResponse } from 'next/server';
import { triggerTelecast } from '@/lib/telecast-state';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoPath = '/infovid.mp4', title } = body;

    // Update telecast state
    const newState = triggerTelecast(videoPath, title);

    console.log('🚀 Telecast triggered:', newState);
    
    return NextResponse.json({ 
      success: true, 
      videoPath: newState.videoPath,
      title: newState.title,
      timestamp: newState.timestamp 
    });
  } catch (error) {
    console.error('Error triggering telecast:', error);
    return NextResponse.json(
      { error: 'Failed to trigger telecast' },
      { status: 500 }
    );
  }
}

// GET support for easy testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoPath = searchParams.get('video_path') || searchParams.get('videoPath') || '/infovid.mp4';
  const title = searchParams.get('title') || 'Video Broadcast';
  
  try {
    // Update telecast state
    const newState = triggerTelecast(videoPath, title);

    console.log('🚀 Telecast triggered via GET:', newState);
    
    return NextResponse.json({ 
      success: true, 
      videoPath: newState.videoPath,
      title: newState.title,
      timestamp: newState.timestamp 
    });
  } catch (error) {
    console.error('Error triggering telecast:', error);
    return NextResponse.json(
      { error: 'Failed to trigger telecast' },
      { status: 500 }
    );
  }
}