"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MissionButton } from "@/components/ui/button";


function toScoreLabel(score: number | undefined | null) {
  if (score == null) return "—";
  return `${score}`;
}

export function LeaderboardPanel() {
  const router = useRouter();
  const [teamsData, setTeamsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch teams data from Supabase backend
  useEffect(() => {
    const fetchTeamsData = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${API_BASE_URL}/api/teams/admin/teams`);
        if (response.ok) {
          const data = await response.json();
          setTeamsData(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch teams data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamsData();
    const interval = setInterval(fetchTeamsData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const ranked = useMemo(() => {
    if (!teamsData.length) return [];
    
    // Sort by rank (database-calculated)
    return [...teamsData]
      .sort((a, b) => {
        if (a.rank == null && b.rank == null) return 0;
        if (a.rank == null) return 1;
        if (b.rank == null) return -1;
        return a.rank - b.rank;
      })
      .map((team) => ({
        ...team,
        round3Score: (team.round3_1_score || 0) + (team.round3_2_score || 0) + (team.round3_3_score || 0),
      }));
  }, [teamsData]);

  const summary = useMemo(() => {
    const totalSquads = teamsData.length;
    const submissionsR1 = teamsData.filter(t => t.r1_score != null).length;
    const submissionsR2 = teamsData.filter(t => t.r2_score != null).length;
    const submissionsR3 = teamsData.filter(t => 
      (t.round3_1_score != null) || 
      (t.round3_2_score != null) || 
      (t.round3_3_score != null)
    ).length;
    return { totalSquads, submissionsR1, submissionsR2, submissionsR3 };
  }, [teamsData]);

  return (
    <>
      <style jsx>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          
          section {
            padding: 1rem !important;
            margin: 0 !important;
            border: none !important;
            background: white !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          
          header {
            margin-bottom: 0.75rem !important;
          }
          
          header > div:first-child > p:first-child {
            font-size: 8px !important;
            margin-bottom: 0.25rem !important;
          }
          
          header h2 {
            font-size: 18px !important;
            margin-top: 0.25rem !important;
            margin-bottom: 0.5rem !important;
            color: black !important;
            text-shadow: none !important;
          }
          
          header p:nth-child(3) {
            font-size: 10px !important;
            margin-top: 0.25rem !important;
            line-height: 1.3 !important;
            color: #333 !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .stats-grid {
            gap: 0.5rem !important;
            margin-bottom: 0.75rem !important;
          }
          
          .stats-card {
            padding: 0.5rem !important;
            border: 1px solid #ddd !important;
            border-radius: 4px !important;
            background: #f9f9f9 !important;
          }
          
          .stats-card p:first-child {
            font-size: 8px !important;
            color: #666 !important;
          }
          
          .stats-card p:last-child {
            font-size: 14px !important;
            margin-top: 0.25rem !important;
            color: black !important;
          }
          
          table {
            font-size: 10px !important;
            border: 1px solid #ddd !important;
          }
          
          thead {
            background: #f0f0f0 !important;
          }
          
          thead th {
            padding: 0.4rem 0.5rem !important;
            font-size: 9px !important;
            color: black !important;
            border-bottom: 2px solid #ddd !important;
          }
          
          tbody td {
            padding: 0.35rem 0.5rem !important;
            color: black !important;
            border-bottom: 1px solid #eee !important;
          }
          
          tbody tr:hover {
            background: transparent !important;
          }
          
          tbody td > div {
            font-size: 10px !important;
            color: black !important;
          }
          
          tbody td > div:last-child {
            font-size: 8px !important;
            color: #666 !important;
          }
        }
      `}</style>
      
      <section className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md rounded-3xl hover:border-[#FF6B00]/40 transition-all duration-300 space-y-6 p-8 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00]">Live Standings</p>
          <h2 className="mt-2 text-3xl font-bold text-white" style={{textShadow: "0 0 15px rgba(255, 107, 0, 0.3)"}}>Round Performance Snapshot</h2>
          <p className="mt-3 max-w-3xl text-sm text-white/80 leading-relaxed">
            Track calibrated scores as soon as they arrive from the scoring pipeline. Use the export button to snapshot
            the current leaderboard for briefing decks.
          </p>
        </div>
        <div className="flex gap-3 print:hidden">
          <MissionButton
            variant="secondary"
            onClick={() => router.push('/mission')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Console
          </MissionButton>
          <MissionButton
            variant="secondary"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.print();
              }
            }}
          >
            Export Standings
          </MissionButton>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-4 stats-grid">
        <article className="group rounded-2xl border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 hover:bg-black/40 hover:border-[#FF6B00]/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,0,0.2)] stats-card">
          <p className="text-xs uppercase tracking-[0.4em] text-[#FF6B00]/80">Registered Squads</p>
          <p className="mt-3 text-2xl font-bold text-white group-hover:text-[#FF6B00] transition-colors">{summary.totalSquads}</p>
        </article>
        <article className="group rounded-2xl border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 hover:bg-black/40 hover:border-[#FF6B00]/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,0,0.2)] stats-card">
          <p className="text-xs uppercase tracking-[0.4em] text-[#FF6B00]/80">Round 1 Submissions</p>
          <p className="mt-3 text-2xl font-bold text-white group-hover:text-[#FF6B00] transition-colors">{summary.submissionsR1}</p>
        </article>
        <article className="group rounded-2xl border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 hover:bg-black/40 hover:border-[#FF6B00]/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,0,0.2)] stats-card">
          <p className="text-xs uppercase tracking-[0.4em] text-[#FF6B00]/80">Round 2 Submissions</p>
          <p className="mt-3 text-2xl font-bold text-white group-hover:text-[#FF6B00] transition-colors">{summary.submissionsR2}</p>
        </article>
        <article className="group rounded-2xl border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 hover:bg-black/40 hover:border-[#FF6B00]/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,0,0.2)] stats-card">
          <p className="text-xs uppercase tracking-[0.4em] text-[#FF6B00]/80">Round 3 Submissions</p>
          <p className="mt-3 text-2xl font-bold text-white group-hover:text-[#FF6B00] transition-colors">{summary.submissionsR3}</p>
        </article>
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/60">Loading leaderboard...</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm">
          <table className="min-w-full divide-y divide-[#FF6B00]/10 text-sm">
            <thead className="bg-black/40 uppercase tracking-[0.3em] text-[#FF6B00]/80">
              <tr>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Team</th>
                <th className="px-4 py-3 text-left">Round 1</th>
                <th className="px-4 py-3 text-left">Round 2</th>
                <th className="px-4 py-3 text-left">Round 3</th>
                <th className="px-4 py-3 text-left">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FF6B00]/10 text-white/80">
              {ranked.map((team) => (
                <tr key={team.team_id} className="hover:bg-black/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#FF6B00]">
                    {team.rank != null ? `#${team.rank}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{team.team_name}</div>
                    <div className="text-xs uppercase tracking-[0.3em] text-white/40">{team.team_id}</div>
                  </td>
                  <td className="px-4 py-3">{toScoreLabel(team.r1_score)}</td>
                  <td className="px-4 py-3">{toScoreLabel(team.r2_score)}</td>
                  <td className="px-4 py-3">{team.round3Score > 0 ? team.round3Score.toFixed(1) : "—"}</td>
                  <td className="px-4 py-3 font-bold text-[#FF6B00]">
                    {((team.r1_score || 0) + (team.r2_score || 0) + team.round3Score).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
    </>
  );
}
