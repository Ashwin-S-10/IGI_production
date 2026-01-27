import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/database";

export async function GET() {
  try {
    const teams = await db.getTeams();
    return NextResponse.json({ teams });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const team = await db.createTeam(body);
    return NextResponse.json({ team });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
