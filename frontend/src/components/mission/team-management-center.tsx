"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  UserMinus,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Eye,
  RefreshCw,
  Search,
  Copy,
  Check,
  User,
  Phone,
  Key,
  X,
} from "lucide-react";
import { MissionButton } from "@/components/ui/button";
import { useTeams, useSubmissionsRound1, useSubmissionsRound2 } from "@/lib/firestore/hooks";
import { AddTeamModal } from "./add-team-modal";

interface FetchedTeam {
  team_id: string;
  team_name: string;
  player1_name: string;
  player2_name: string;
  phone_no: string;
  password: string;
  created_at?: string;
}

export function TeamManagementCenter() {
  const router = useRouter();
  const { teams } = useTeams();
  const { submissions: round1Submissions } = useSubmissionsRound1();
  const { submissions: round2Submissions } = useSubmissionsRound2();

  const [fetchedTeams, setFetchedTeams] = useState<FetchedTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // leaderboard update state (ashwin)
  const [isUpdatingLeaderboard, setIsUpdatingLeaderboard] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // search + copy state (prod)
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch team details
  const fetchTeamDetails = async () => {
    setTeamsLoading(true);
    setTeamsError(null);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_BASE_URL}/api/teams/admin/teams`);
      if (!response.ok) throw new Error("Failed to fetch teams");
      const data = await response.json();
      setFetchedTeams(data.data || []);
    } catch (err: any) {
      setTeamsError(err.message || "Failed to load teams");
      console.error("Error fetching teams:", err);
    } finally {
      setTeamsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [refreshTrigger]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // leaderboard update handler (ashwin)
  const handleUpdateLeaderboard = async () => {
    setIsUpdatingLeaderboard(true);
    setUpdateMessage(null);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_BASE_URL}/api/teams/admin/recalculate-ranks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        setUpdateMessage({
          type: "error",
          message: "Server returned invalid response. Check backend.",
        });
        setTimeout(() => setUpdateMessage(null), 8000);
        return;
      }

      if (response.ok && data.success) {
        setUpdateMessage({ type: "success", message: "Leaderboard updated successfully!" });
      } else {
        setUpdateMessage({
          type: "error",
          message: data.error || data.message || "Failed to update leaderboard",
        });
      }
      setTimeout(() => setUpdateMessage(null), 5000);
    } catch (error) {
      setUpdateMessage({
        type: "error",
        message: `Network error: ${error}`,
      });
      setTimeout(() => setUpdateMessage(null), 8000);
    } finally {
      setIsUpdatingLeaderboard(false);
    }
  };

  // filtered teams (prod)
  const filteredTeams = useMemo(() => {
    return fetchedTeams.filter(
      (team) =>
        team.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.team_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.player1_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.player2_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [fetchedTeams, searchTerm]);

  return (
    <section className="space-y-8 text-white">
      {updateMessage && (
        <div
          className={`border p-4 rounded-2xl ${
            updateMessage.type === "success"
              ? "border-green-500/50 bg-green-500/10"
              : "border-red-500/50 bg-red-500/10"
          }`}
        >
          <div className="flex items-center gap-3">
            {updateMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            <p>{updateMessage.message}</p>
          </div>
        </div>
      )}

      <div className="border border-[#FF6B00]/20 p-8 rounded-3xl">
        <header className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00]">Squad Operations</p>
            <h2 className="mt-2 text-4xl font-bold">Team Management</h2>
          </div>
          <div className="flex gap-3">
            <MissionButton variant="primary" onClick={() => setShowAddTeamModal(true)}>
              <UserPlus className="w-5 h-5" /> Add Team
            </MissionButton>
            <MissionButton
              variant="primary"
              onClick={handleUpdateLeaderboard}
              disabled={isUpdatingLeaderboard}
            >
              <RefreshCw className={`w-5 h-5 ${isUpdatingLeaderboard ? "animate-spin" : ""}`} />
              Update Leaderboard
            </MissionButton>
            <MissionButton variant="secondary" onClick={() => router.back()}>
              Return to Console
            </MissionButton>
          </div>
        </header>
      </div>

      {/* Team Details Content */}
      <div className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl">
        <div className="border-b border-[#FF6B00]/20 pb-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00]">Admin Access Only</p>
              <h3 className="mt-2 text-3xl font-bold text-white" style={{textShadow: "0 0 20px rgba(255, 107, 0, 0.5)"}}>
                Team Details
              </h3>
              <p className="mt-2 text-sm text-white/70">
                View all registered teams with credentials
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search by team name, ID, or player name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={fetchTeamDetails}
              className="w-full pl-12 pr-4 py-3 border border-white/10 bg-black/60 text-white rounded-xl focus:outline-none focus:border-[#FF6B00]/50 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {teamsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-[#FF6B00]/30 border-t-[#FF6B00] rounded-full animate-spin"></div>
              <p className="mt-4 text-white/60">Loading teams...</p>
            </div>
          ) : teamsError ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-400">{teamsError}</p>
              <MissionButton
                variant="secondary"
                className="mt-4"
                onClick={fetchTeamDetails}
              >
                Try Again
              </MissionButton>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-16 w-16 text-white/30 mb-4" />
              <p className="text-white/60">
                {searchTerm ? 'No teams found matching your search' : 'No teams registered yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
              {filteredTeams.map((team) => (
                <article
                  key={team.team_id}
                  className="border border-[#FF6B00]/20 bg-black/40 backdrop-blur-sm p-6 rounded-2xl hover:border-[#FF6B00]/40 transition-all"
                >
                  {/* Team Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white">{team.team_name}</h4>
                      <p className="text-sm text-white/60 mt-1">Team ID: {team.team_id}</p>
                    </div>
                    {team.created_at && (
                      <span className="text-xs text-white/50">
                        Created: {new Date(team.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Team Details Grid */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Player 1 */}
                    <div className="border border-[#FF6B00]/10 bg-black/20 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-[#FF6B00]" />
                        <p className="text-xs uppercase tracking-[0.3em] text-[#FF6B00]/80">Player 1</p>
                      </div>
                      <p className="text-white font-semibold">{team.player1_name}</p>
                    </div>

                    {/* Player 2 */}
                    <div className="border border-[#FF6B00]/10 bg-black/20 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-[#FF6B00]" />
                        <p className="text-xs uppercase tracking-[0.3em] text-[#FF6B00]/80">Player 2</p>
                      </div>
                      <p className="text-white font-semibold">{team.player2_name}</p>
                    </div>

                    {/* Phone Number */}
                    <div className="border border-[#FF6B00]/10 bg-black/20 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-[#FF6B00]" />
                          <p className="text-xs uppercase tracking-[0.3em] text-[#FF6B00]/80">Phone</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(team.phone_no, `phone-${team.team_id}`)}
                          className="text-white/60 hover:text-white transition-colors"
                          title="Copy phone number"
                        >
                          {copiedField === `phone-${team.team_id}` ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-white font-semibold font-mono">{team.phone_no}</p>
                    </div>

                    {/* Password */}
                    <div className="border border-[#FF6B00]/10 bg-black/20 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-[#FF6B00]" />
                          <p className="text-xs uppercase tracking-[0.3em] text-[#FF6B00]/80">Password</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(team.password, `password-${team.team_id}`)}
                          className="text-white/60 hover:text-white transition-colors"
                          title="Copy password"
                        >
                          {copiedField === `password-${team.team_id}` ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-white font-semibold font-mono">{team.password}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {fetchedTeams.length > 0 && (
          <div className="border-t border-[#FF6B00]/20 mt-6 pt-6">
            <p className="text-sm text-white/70">
              Total Teams: <span className="font-bold text-white">{fetchedTeams.length}</span>
              {searchTerm && (
                <span className="ml-2">
                  • Filtered: <span className="font-bold text-white">{filteredTeams.length}</span>
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      <AddTeamModal
        isOpen={showAddTeamModal}
        onClose={() => setShowAddTeamModal(false)}
        onSuccess={() => {
          setRefreshTrigger((p) => p + 1);
          fetchTeamDetails();
        }}
      />
    </section>
  );
}
