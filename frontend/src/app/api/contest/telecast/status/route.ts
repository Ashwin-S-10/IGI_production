import { NextResponse } from 'next/server';
import { getTelecastState } from '@/lib/telecast-state';

export async function GET() {
  const state = getTelecastState();
  return NextResponse.json(state);
}