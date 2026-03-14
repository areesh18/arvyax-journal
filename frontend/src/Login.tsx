import { useState } from "react";

interface Props {
  onLogin: (email: string) => void;
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    if (!email.trim()) return;
    onLogin(email.trim());
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Morning stillness." : hour < 17 ? "Afternoon calm." : "Evening quiet.";

  return (
    <div
      className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Atmospheric glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* Wordmark */}
      <div className="absolute top-8 left-8">
        <p
          className="text-white/90 text-lg font-bold tracking-widest"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          ARVYA.X
        </p>
      </div>

      {/* Main content */}
      <div className="w-full max-w-md space-y-10 relative z-10">

        {/* Hero text */}
        <div className="space-y-4">
          <p className="text-white/30 text-sm tracking-[0.2em] uppercase">{greeting}</p>
          <h1
            className="text-5xl font-bold text-white leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Your Inner World,<br />
            <span className="text-emerald-400">Documented.</span>
          </h1>
          <p className="text-white/40 text-base leading-relaxed max-w-sm">
            After every nature session, your mind holds something worth capturing.
            This is where you keep it.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <label className="text-white/40 text-xs tracking-widest uppercase">
            Your Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 text-sm transition"
          />
          <button
            onClick={handleSubmit}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white py-4 rounded-2xl font-semibold text-sm tracking-wide transition"
          >
            Open My Journal
          </button>
        </div>

        {/* Demo tip */}
        <div className="border border-white/5 rounded-2xl px-5 py-4 space-y-3 bg-white/[0.02]">
          <div className="flex items-start gap-3">
            <span className="text-amber-400 text-sm">💡</span>
            <div className="space-y-1">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">Demo Tip</p>
              <p className="text-white/30 text-xs leading-relaxed">
                Enter any email to start a fresh journal, or load the pre-populated demo account to explore a filled journal with insights.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEmail("demo@arvyax.com");
            }}
            className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400/80 text-xs py-2.5 rounded-xl transition font-medium"
          >
            Use demo@arvyax.com →
          </button>
        </div>

        <p className="text-white/15 text-xs text-center">
          Email = unique user ID. No password. In production, proper auth would replace this.
        </p>
      </div>
    </div>
  );
}