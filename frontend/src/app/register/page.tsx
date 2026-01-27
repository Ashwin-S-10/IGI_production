
import { LoginPanel } from "@/components/auth/login-panel";

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen bg-black bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: 'url(/images/landing-bg.jpg)' }}>
      <div className="w-full max-w-xl bg-black/70 rounded-xl p-10 shadow-lg border border-[#FF6B00]/30 backdrop-blur-md">
        <LoginPanel defaultMode="register" />
      </div>
    </div>
  );
}
