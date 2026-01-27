"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Key, RefreshCw, Copy, Eye, EyeOff, Shield, Users } from "lucide-react";
import { MissionButton } from "@/components/ui/button";
import { useRounds, useTeams } from "@/lib/firestore/hooks";

interface PasswordEntry {
  id: string;
  round: string;
  password: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  usageCount: number;
}

export function MissionPasswordsCenter() {
  const router = useRouter();
  const { rounds } = useRounds();
  const { teams } = useTeams();
  const [selectedRound, setSelectedRound] = useState<string>('round2');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock password data - in real implementation, this would come from API
  const [passwords, setPasswords] = useState<PasswordEntry[]>([
    {
      id: '1',
      round: 'round2',
      password: 'ALPHA-BRAVO-7749',
      createdAt: new Date(Date.now() - 86400000),
      isActive: true,
      usageCount: 12
    },
    {
      id: '2',
      round: 'round3',
      password: 'DELTA-ECHO-9921',
      createdAt: new Date(Date.now() - 43200000),
      isActive: true,
      usageCount: 8
    }
  ]);

  const roundPasswords = useMemo(() => {
    return passwords.filter(p => p.round === selectedRound);
  }, [passwords, selectedRound]);

  const stats = useMemo(() => {
    const totalPasswords = passwords.length;
    const activePasswords = passwords.filter(p => p.isActive).length;
    type Password = (typeof passwords)[number];
    const totalUsage = passwords.reduce((sum: number, p: Password) => sum + p.usageCount, 0);
    const qualifiedTeams = teams.filter(t => typeof t.round1_score === 'number' && t.round1_score >= 7).length;

    return { totalPasswords, activePasswords, totalUsage, qualifiedTeams };
  }, [passwords, teams]);

  const generatePassword = () => {
    const words = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL'];
    const word1 = words[Math.floor(Math.random() * words.length)];
    const word2 = words[Math.floor(Math.random() * words.length)];
    const numbers = Math.floor(1000 + Math.random() * 9000);
    return `${word1}-${word2}-${numbers}`;
  };

  const handleGeneratePassword = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      const newPassword: PasswordEntry = {
        id: Date.now().toString(),
        round: selectedRound,
        password: generatePassword(),
        createdAt: new Date(),
        isActive: true,
        usageCount: 0
      };

      setPasswords(prev => [newPassword, ...prev]);
      alert(`New password generated for ${selectedRound.toUpperCase()}!`);
    } catch (error) {
      console.error('Failed to generate password:', error);
      alert('Failed to generate password. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokePassword = (passwordId: string) => {
    if (confirm('Revoke this password? Teams using it will lose access.')) {
      setPasswords(prev => 
        prev.map(p => p.id === passwordId ? { ...p, isActive: false } : p)
      );
    }
  };

  const handleCopyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    alert('Password copied to clipboard!');
  };

  const togglePasswordVisibility = (passwordId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [passwordId]: !prev[passwordId]
    }));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  return (
    <section className="space-y-8 text-white">
      {/* Header Section */}
      <div className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00]">Access Control</p>
            <h2 className="mt-2 text-4xl font-bold text-white" style={{textShadow: "0 0 20px rgba(255, 107, 0, 0.5)"}}>Mission Passwords</h2>
            <p className="mt-3 max-w-3xl text-sm text-white/80">
              Generate and manage round passwords for qualified teams. Control access to advanced mission phases.
            </p>
          </div>
          <MissionButton variant="secondary" onClick={() => router.back()}>
            Return to Console
          </MissionButton>
        </header>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <article className="border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
          <LockKeyhole className="mb-4 h-10 w-10 text-[#FF6B00]" />
          <p className="text-xs uppercase tracking-[0.4em] text-[#FF6B00]/80">Total Passwords</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.totalPasswords}</p>
        </article>
        
        <article className="border border-green-500/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
          <Shield className="mb-4 h-10 w-10 text-green-400" />
          <p className="text-xs uppercase tracking-[0.4em] text-green-400/80">Active</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.activePasswords}</p>
        </article>
        
        <article className="border border-blue-500/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
          <Users className="mb-4 h-10 w-10 text-blue-400" />
          <p className="text-xs uppercase tracking-[0.4em] text-blue-400/80">Total Usage</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.totalUsage}</p>
        </article>
        
        <article className="border border-purple-500/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
          <Key className="mb-4 h-10 w-10 text-purple-400" />
          <p className="text-xs uppercase tracking-[0.4em] text-purple-400/80">Qualified Teams</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.qualifiedTeams}</p>
        </article>
      </div>

      {/* Password Generation */}
      <div className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl">
        <h3 className="text-2xl font-bold text-white mb-6" style={{textShadow: "0 0 15px rgba(255, 107, 0, 0.3)"}}>Generate New Password</h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-bold text-white mb-3">Target Round</label>
            <div className="space-y-2">
              {rounds.map((round) => (
                <label key={round.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="selectedRound"
                    value={round.id}
                    checked={selectedRound === round.id}
                    onChange={(e) => setSelectedRound(e.target.value)}
                    className="text-[#FF6B00]"
                  />
                  <span className="text-white">{round.name}</span>
                  <span className="text-xs text-white/60">({round.status})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <MissionButton
              variant="primary"
              disabled={isGenerating}
              onClick={handleGeneratePassword}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate Password'}
            </MissionButton>
            <p className="text-xs text-white/60 mt-2">
              Creates a secure password for {selectedRound.toUpperCase()} access
            </p>
          </div>
        </div>
      </div>

      {/* Password Management */}
      <div className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white" style={{textShadow: "0 0 15px rgba(255, 107, 0, 0.3)"}}>
            Password Management
          </h3>
          <div className="flex gap-2">
            {['round1', 'round2', 'round3'].map((round) => (
              <button
                key={round}
                onClick={() => setSelectedRound(round)}
                className={`px-4 py-2 rounded-xl text-xs transition-all ${
                  selectedRound === round
                    ? 'bg-[#FF6B00] text-black font-bold'
                    : 'border border-[#FF6B00]/20 text-white hover:border-[#FF6B00]/40'
                }`}
              >
                {round.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {roundPasswords.map((passwordEntry) => (
            <article
              key={passwordEntry.id}
              className="border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-white">
                      {passwordEntry.round.toUpperCase()} Password
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      passwordEntry.isActive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {passwordEntry.isActive ? 'ACTIVE' : 'REVOKED'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <code className="bg-black/40 px-3 py-1 rounded text-[#FF6B00] font-mono">
                        {showPasswords[passwordEntry.id] 
                          ? passwordEntry.password 
                          : '••••••••••••••••'
                        }
                      </code>
                      <button
                        onClick={() => togglePasswordVisibility(passwordEntry.id)}
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        {showPasswords[passwordEntry.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 text-sm text-white/70">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[#FF6B00]/60">Created</p>
                      <p>{formatDate(passwordEntry.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[#FF6B00]/60">Usage Count</p>
                      <p>{passwordEntry.usageCount} teams</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[#FF6B00]/60">Status</p>
                      <p>{passwordEntry.isActive ? 'Active' : 'Revoked'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-6">
                  <MissionButton
                    variant="secondary"
                    className="text-xs"
                    onClick={() => handleCopyPassword(passwordEntry.password)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </MissionButton>
                  
                  {passwordEntry.isActive && (
                    <MissionButton
                      variant="danger"
                      className="text-xs"
                      onClick={() => handleRevokePassword(passwordEntry.id)}
                    >
                      Revoke
                    </MissionButton>
                  )}
                </div>
              </div>
            </article>
          ))}

          {roundPasswords.length === 0 && (
            <div className="text-center py-12">
              <LockKeyhole className="mx-auto h-16 w-16 text-white/30 mb-4" />
              <p className="text-white/60">No passwords generated for {selectedRound.toUpperCase()} yet</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}