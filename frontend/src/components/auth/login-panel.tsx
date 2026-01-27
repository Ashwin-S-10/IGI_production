"use client";

import { FormEvent, useEffect, useState, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { MissionButton } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { authApi, teamsApi } from "@/lib/api-client";

type LoginPanelProps = {
  defaultMode?: "login" | "register";
};

// Card content component remains outside to prevent remounting
const CardContent = ({ 
  isCommander, 
  email, 
  setEmail, 
  password, 
  setPassword, 
  passwordVisible, 
  setPasswordVisible, 
  handleSubmit, 
  loading, 
  error, 
  info,
  usernameInputRef,
  passwordInputRef,
  shouldAutoFocus
}: { 
  isCommander: boolean;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  passwordVisible: boolean;
  setPasswordVisible: (value: boolean) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
  info: string | null;
  usernameInputRef: React.RefObject<HTMLInputElement | null>;
  passwordInputRef: React.RefObject<HTMLInputElement | null>;
  shouldAutoFocus: boolean;
}) => (
  <>
    {/* Corner accents */}
    <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-[#FF6B00]/40" />
    <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-[#FF6B00]/40" />
    <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-[#FF6B00]/40" />
    <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-[#FF6B00]/40" />

    {/* Subtle animated border glow */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 border border-[#FF6B00]/0 shadow-[0_0_20px_rgba(255,107,0,0.3)] animate-pulse" />
    </div>

    {/* Subtle scanning line effect */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
      <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-[#FF6B00]/40 to-transparent animate-scan" />
    </div>

    <div className="p-8 relative z-10">
      <h3 className="text-2xl text-white font-light tracking-[0.2em] uppercase mb-6">
        Access Control
      </h3>

      {/* Role Display */}
      <div className="space-y-2 mb-6 select-none">
        <label className="text-[#FF6B00]/90 font-light uppercase tracking-widest text-xs">
          Role Selection
        </label>
        <div className="bg-black/40 px-5 py-3 border border-[#FF6B00]/20 hover:border-[#FF6B00]/40 transition-colors backdrop-blur-md">
          <span className="text-white/90 font-light tracking-wide">
            {isCommander ? 'Commander' : 'Soldier'}
          </span>
          <p className="text-[#FF6B00]/60 text-xs mt-1">
            Click anywhere on card to switch to {isCommander ? 'Soldier' : 'Commander'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[#FF6B00]/90 font-light uppercase tracking-widest text-xs">
            Username
          </label>
          <input
            type="text"
            ref={usernameInputRef}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder={isCommander ? "Enter commander username" : "Enter username"}
            className={cn(
              "w-full bg-black/40 border text-white placeholder:text-gray-600 focus:outline-none transition-all h-12 tracking-wide px-4",
              // Logic: Glow if focused OR if it has text
              email.length > 0 
                ? "border-[#FF6B00]/60 ring-1 ring-[#FF6B00]/30 shadow-[0_0_10px_rgba(255,107,0,0.2)]" 
                : "border-[#FF6B00]/30 focus:border-[#FF6B00]/60 focus:ring-1 focus:ring-[#FF6B00]/30"
            )}
            autoFocus={shouldAutoFocus}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[#FF6B00]/90 font-light uppercase tracking-widest text-xs">
            Password
          </label>
          <div className="relative">
            <input
              type={passwordVisible ? "text" : "password"}
              ref={passwordInputRef}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Enter password"
              className={cn(
                "w-full bg-black/40 border text-white placeholder:text-gray-600 focus:outline-none transition-all h-12 tracking-wide px-4 pr-12",
                // Logic: Glow if focused OR if it has text
                password.length > 0
                  ? "border-[#FF6B00]/60 ring-1 ring-[#FF6B00]/30 shadow-[0_0_10px_rgba(255,107,0,0.2)]"
                  : "border-[#FF6B00]/30 focus:border-[#FF6B00]/60 focus:ring-1 focus:ring-[#FF6B00]/30"
              )}
              required
            />
            <button
              type="button"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 flex items-center text-[#FF6B00]/50 transition hover:text-[#FF6B00]"
              onClick={(e) => {
                e.stopPropagation();
                setPasswordVisible(!passwordVisible);
              }}
            >
              {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full bg-gradient-to-r from-[#FF6B00]/80 to-[#CC3300]/80 hover:from-[#FF6B00] hover:to-[#CC3300] text-white font-light uppercase tracking-[0.3em] py-4 text-sm shadow-lg shadow-[#FF6B00]/30 border border-[#FF6B00]/40 transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {loading ? 'Authenticating...' : 'Enter'}
        </button>

        {/* Credentials reference */}
        <div className="mt-6 p-5 bg-black/30 border border-[#FF6B00]/20 text-xs text-[#FF6B00]/80 space-y-2.5 font-light backdrop-blur-sm">
          <p className="text-[#FF6B00]/90 uppercase tracking-widest text-[10px] mb-3 font-normal">
            Credentials Reference
          </p>
          {isCommander ? (
            <p className="leading-relaxed">
              Commander: Username <span className="text-white font-normal">agentalpha@foss.ops</span> / Password{' '}
              <span className="text-white font-normal">192837</span>
            </p>
          ) : (
            <>
              <p className="leading-relaxed">
                Test Account: <span className="text-white font-normal">agenttest@foss.ops</span> / Password{' '}
                <span className="text-white font-normal">123456</span>
              </p>
              <p className="leading-relaxed">
                Teams: Username format{' '}
                <span className="text-[#FF6B00] font-normal italic">teamname@igifosscit</span> / Password: IGI-xxx (provided during registration)
              </p>
            </>
          )}
        </div>

        {(error || info) && (
          <p
            className={cn(
              "border p-3 text-sm mt-4 backdrop-blur-md",
              error ? "border-[#8B1A1A] bg-[#8B1A1A]/20 text-red-400" : "border-[#FF6B00]/50 bg-[#FF6B00]/10 text-[#FF6B00]",
            )}
          >
            {error ?? info}
          </p>
        )}
      </form>
    </div>
  </>
);

export function LoginPanel({ defaultMode = "login" }: LoginPanelProps = {}) {
  const router = useRouter();
  const { user, role, refresh } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasFlippedOnce, setHasFlippedOnce] = useState(false);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      router.replace("/landing");
    }
  }, [user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    setLoading(true);
    try {
      if (mode === "register") {
        setInfo("Command provisions new agents manually. Contact HQ to receive your clearance.");
        return;
      }
      
      // Call different endpoints based on role
      if (isFlipped) {
        // Commander login
        await authApi.commanderLogin(email, password);
      } else {
        // Soldier/Team login - both use /api/auth/login which handles teams ending with @igifosscit
        await authApi.login(email, password);
      }
      
      await refresh();
      router.replace("/landing");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ filter: 'brightness(0.5) contrast(1.1)' }}
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60 z-0" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-0" />

      {/* FOSS Logo - Top Left */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
        <img src="/images/foss-cit-logo.jpeg" alt="FOSS Logo" className="h-12 w-auto" />
        <span className="text-[#FF0000] text-2xl font-bold tracking-wider uppercase" style={{ textShadow: '0 0 10px rgba(255, 0, 0, 0.5)' }}>
          I'M GOING INN
        </span>
      </div>

      {/* Login Content */}
      <div className="container relative z-10 mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto">
          {/* Professional title */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 
              className="text-5xl font-bold text-white mb-2 tracking-wider"
              style={{
                textShadow: '0 0 30px rgba(255, 107, 0, 0.6), 0 0 60px rgba(255, 107, 0, 0.3)'
              }}
            >
              TACTICAL ACCESS
            </h1>
            <p className="text-[#FF6B00] text-sm font-semibold tracking-[0.3em] uppercase mt-4">
              Authorized Personnel Only
            </p>
          </div>

          {/* Flip Card Container */}
          <div 
            className="relative bg-transparent animate-slide-up overflow-visible cursor-pointer"
            style={{ perspective: '1000px', height: '650px' }} // Fixed height to ensure rotation axis is stable
            onClick={(e) => {
              const target = e.target as HTMLElement;
              // Only flip if NOT clicking on inputs, buttons, or selecting text
              if (!target.closest('input') && !target.closest('button') && !target.closest('form') && window.getSelection()?.toString() === '') {
                setIsFlipped(!isFlipped);
                if (!hasFlippedOnce) {
                  setHasFlippedOnce(true);
                }
              }
            }}
          >
            {/* Flip container */}
            <div
              className="relative w-full h-full transition-transform duration-700 shadow-2xl shadow-[#FF6B00]/10"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front - Soldier Card */}
              <div
                className="absolute inset-0 w-full h-full bg-[#09090b] border border-[#FF6B00]/20 backdrop-blur-sm"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <CardContent 
                  isCommander={false}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  passwordVisible={passwordVisible}
                  setPasswordVisible={setPasswordVisible}
                  handleSubmit={handleSubmit}
                  loading={loading}
                  error={error}
                  info={info}
                  usernameInputRef={usernameInputRef}
                  passwordInputRef={passwordInputRef}
                  shouldAutoFocus={!hasFlippedOnce}
                />
              </div>

              {/* Back - Commander Card - MIRRORING FIXED */}
              <div
                className="absolute inset-0 w-full h-full bg-[#09090b] border border-[#FF6B00]/20 backdrop-blur-sm"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                {/* Removed scaleX(-1) wrapper - standard rotateY(180deg) handles direction correctly */}
                <CardContent 
                  isCommander={true}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  passwordVisible={passwordVisible}
                  setPasswordVisible={setPasswordVisible}
                  handleSubmit={handleSubmit}
                  loading={loading}
                  error={error}
                  info={info}
                  usernameInputRef={usernameInputRef}
                  passwordInputRef={passwordInputRef}
                  shouldAutoFocus={false}
                />
              </div>
            </div>
          </div>

          {/* Story button below card */}
          {role !== "guest" && (
            <div className="flex justify-center mt-8">
              <MissionButton onClick={() => router.replace("/landing")}>
                Enter Mission Room
              </MissionButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}