"use client";

import { useState } from "react";
import { X, UserPlus, Check, AlertTriangle } from "lucide-react";
import { MissionButton } from "@/components/ui/button";

interface AddTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CreatedTeamCredentials {
  team_id: string;
  team_name: string;
  password: string;
}

export function AddTeamModal({ isOpen, onClose, onSuccess }: AddTeamModalProps) {
  const [formData, setFormData] = useState({
    team_name: "",
    player1_name: "",
    player2_name: "",
    phone_no: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTeam, setCreatedTeam] = useState<CreatedTeamCredentials | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.team_name.trim()) {
      setError("Team Name is required");
      return false;
    }
    if (!formData.player1_name.trim()) {
      setError("Player 1 Name is required");
      return false;
    }
    if (!formData.player2_name.trim()) {
      setError("Player 2 Name is required");
      return false;
    }
    if (!formData.phone_no.trim()) {
      setError("Phone Number is required");
      return false;
    }
    return true;
  };

  const verifyBackendResponse = (data: any): boolean => {
    // Verify team_name ends with '@igifosscit'
    if (!data.team_name || !data.team_name.endsWith('@igifosscit')) {
      console.error('Backend verification failed: team_name does not end with @igifosscit', data);
      return false;
    }

    // Verify password is non-empty
    if (!data.password || typeof data.password !== 'string' || data.password.trim() === '') {
      console.error('Backend verification failed: password is empty', data);
      return false;
    }

    // Verify team_id is present
    if (!data.team_id) {
      console.error('Backend verification failed: team_id is missing', data);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/teams/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          throw new Error('Team ID or Team Name already exists');
        }
        throw new Error(result.error || result.message || 'Failed to create team');
      }

      // Verify backend response
      if (!result.success || !result.data) {
        throw new Error('Team creation failed. Invalid backend response.');
      }

      // Strict verification of backend behavior
      if (!verifyBackendResponse(result.data)) {
        throw new Error('Team creation failed. Backend did not process team correctly.');
      }

      // Success - show credentials
      setCreatedTeam(result.data);
      
    } catch (err: any) {
      console.error('Error creating team:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (createdTeam) {
      // Team was successfully created, trigger refresh
      onSuccess();
    }
    
    // Reset form
    setFormData({
      team_name: "",
      player1_name: "",
      player2_name: "",
      phone_no: "",
    });
    setCreatedTeam(null);
    setError(null);
    onClose();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl border border-[#FF6B00]/30 bg-black/95 backdrop-blur-md rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-[#FF6B00]/20 bg-gradient-to-r from-[#FF6B00]/10 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00]">Admin Operations</p>
              <h2 className="mt-2 text-3xl font-bold text-white" style={{textShadow: "0 0 20px rgba(255, 107, 0, 0.5)"}}>
                {createdTeam ? "Team Created Successfully" : "Add New Team"}
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 rounded-xl border border-white/10 bg-black/60 text-white/70 hover:text-white hover:border-[#FF6B00]/50 transition-all disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {createdTeam ? (
            /* Success State - Show Credentials */
            <div className="space-y-6">
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="text-center mb-6">
                <p className="text-white/80">Team has been created. Save these credentials:</p>
              </div>

              <div className="space-y-4">
                {/* Team ID */}
                <div className="border border-[#FF6B00]/20 bg-black/40 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-[#FF6B00]/80 mb-2">Team ID</p>
                      <p className="text-lg font-bold text-white font-mono">{createdTeam.team_id}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(createdTeam.team_id)}
                      className="ml-4 p-2 rounded-lg border border-white/10 bg-black/60 text-white/70 hover:text-white hover:border-[#FF6B00]/50 transition-all"
                      title="Copy team ID"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Team Name */}
                <div className="border border-[#FF6B00]/20 bg-black/40 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-[#FF6B00]/80 mb-2">Team Name</p>
                      <p className="text-lg font-bold text-white font-mono">{createdTeam.team_name}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(createdTeam.team_name)}
                      className="ml-4 p-2 rounded-lg border border-white/10 bg-black/60 text-white/70 hover:text-white hover:border-[#FF6B00]/50 transition-all"
                      title="Copy team name"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className="border border-[#FF6B00]/20 bg-black/40 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-[#FF6B00]/80 mb-2">Password</p>
                      <p className="text-lg font-bold text-white font-mono">{createdTeam.password}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(createdTeam.password)}
                      className="ml-4 p-2 rounded-lg border border-white/10 bg-black/60 text-white/70 hover:text-white hover:border-[#FF6B00]/50 transition-all"
                      title="Copy password"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Warning */}
                <div className="border border-yellow-500/20 bg-yellow-500/5 p-4 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-200/90">
                      Save these credentials now. The password cannot be retrieved later.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <MissionButton variant="primary" onClick={handleClose}>
                  Done
                </MissionButton>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="border border-red-500/30 bg-red-500/10 p-4 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {/* Team Name */}
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-[#FF6B00]/80 mb-2">
                  Team Name * <span className="text-white/50 normal-case">(base name only)</span>
                </label>
                <input
                  type="text"
                  value={formData.team_name}
                  onChange={(e) => handleChange('team_name', e.target.value)}
                  placeholder="e.g., TeamAlpha"
                  disabled={loading}
                  className="w-full px-4 py-3 border border-white/10 bg-black/60 text-white rounded-xl focus:outline-none focus:border-[#FF6B00]/50 transition-all disabled:opacity-50"
                  required
                />
                <p className="mt-2 text-xs text-white/50">
                  Note: '@igifosscit' will be automatically appended by the system
                </p>
              </div>

              {/* Player Names */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs uppercase tracking-[0.3em] text-[#FF6B00]/80 mb-2">
                    Player 1 Name *
                  </label>
                  <input
                    type="text"
                    value={formData.player1_name}
                    onChange={(e) => handleChange('player1_name', e.target.value)}
                    placeholder="e.g., John Doe"
                    disabled={loading}
                    className="w-full px-4 py-3 border border-white/10 bg-black/60 text-white rounded-xl focus:outline-none focus:border-[#FF6B00]/50 transition-all disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.3em] text-[#FF6B00]/80 mb-2">
                    Player 2 Name *
                  </label>
                  <input
                    type="text"
                    value={formData.player2_name}
                    onChange={(e) => handleChange('player2_name', e.target.value)}
                    placeholder="e.g., Jane Smith"
                    disabled={loading}
                    className="w-full px-4 py-3 border border-white/10 bg-black/60 text-white rounded-xl focus:outline-none focus:border-[#FF6B00]/50 transition-all disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-[#FF6B00]/80 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone_no}
                  onChange={(e) => handleChange('phone_no', e.target.value)}
                  placeholder="e.g., 1234567890"
                  disabled={loading}
                  className="w-full px-4 py-3 border border-white/10 bg-black/60 text-white rounded-xl focus:outline-none focus:border-[#FF6B00]/50 transition-all disabled:opacity-50"
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <MissionButton
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </MissionButton>
                <MissionButton
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Create Team
                    </>
                  )}
                </MissionButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
