"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Search, Users, Phone, Key, User } from "lucide-react";
import { MissionButton } from "@/components/ui/button";

interface Team {
  team_id: string;
  team_name: string;
  player1_name: string;
  player2_name: string;
  phone_no: string;
  password: string;
  created_at?: string;
}

interface TeamDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeamDetailsModal({ isOpen, onClose }: TeamDetailsModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
    }
  }, [isOpen]);

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/teams/admin/teams`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      
      const data = await response.json();
      setTeams(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load teams');
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const filteredTeams = teams.filter(team => 
    team.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.team_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.player1_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.player2_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] border border-[#FF6B00]/30 bg-black/95 backdrop-blur-md rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-[#FF6B00]/20 bg-gradient-to-r from-[#FF6B00]/10 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00]">Admin Access Only</p>
              <h2 className="mt-2 text-3xl font-bold text-white" style={{textShadow: "0 0 20px rgba(255, 107, 0, 0.5)"}}>
                Team Details
              </h2>
              <p className="mt-2 text-sm text-white/70">
                View all registered teams with credentials
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-white/10 bg-black/60 text-white/70 hover:text-white hover:border-[#FF6B00]/50 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search by team name, ID, or player name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-white/10 bg-black/60 text-white rounded-xl focus:outline-none focus:border-[#FF6B00]/50 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-[#FF6B00]/30 border-t-[#FF6B00] rounded-full animate-spin"></div>
              <p className="mt-4 text-white/60">Loading teams...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-400">{error}</p>
              <MissionButton
                variant="secondary"
                className="mt-4"
                onClick={fetchTeams}
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
            <div className="space-y-4">
              {filteredTeams.map((team) => (
                <article
                  key={team.team_id}
                  className="border border-[#FF6B00]/20 bg-black/40 backdrop-blur-sm p-6 rounded-2xl hover:border-[#FF6B00]/40 transition-all"
                >
                  {/* Team Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{team.team_name}</h3>
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
        <div className="border-t border-[#FF6B00]/20 bg-gradient-to-r from-[#FF6B00]/10 to-transparent p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/70">
              Total Teams: <span className="font-bold text-white">{teams.length}</span>
              {searchTerm && (
                <span className="ml-2">
                  • Filtered: <span className="font-bold text-white">{filteredTeams.length}</span>
                </span>
              )}
            </p>
            <MissionButton variant="secondary" onClick={onClose}>
              Close
            </MissionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
