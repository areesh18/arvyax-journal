import { useState } from "react";

interface Props {
  onLogin: (email: string) => void;
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState("");

  return (
    <div
      className="min-h-screen bg-stone-100 flex items-center justify-center px-4"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="w-full max-w-md space-y-8">

        {/* Branding */}
        <div className="space-y-2">
          <p className="text-stone-400 text-sm tracking-widest uppercase"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            ARVYA.X
          </p>
          <h1
            className="text-4xl font-bold text-stone-900 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Soul Journal
          </h1>
          <p className="text-stone-500 text-base">
            Capture how nature made you feel. Let AI find the pattern.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <label className="block text-stone-600 text-sm font-medium">
            Your email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && email.trim() && onLogin(email.trim())}
            className="w-full border border-stone-300 bg-white rounded-xl px-4 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 text-base"
          />
          <button
            onClick={() => email.trim() && onLogin(email.trim())}
            className="w-full bg-stone-900 hover:bg-stone-700 text-white py-3 rounded-xl font-semibold text-base transition"
          >
            Open My Journal
          </button>
        </div>

        {/* Demo tip */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <p className="text-amber-800 text-sm font-semibold">💡 Demo Tip</p>
          <p className="text-amber-700 text-sm leading-relaxed">
            Use the pre-populated demo account to explore a filled journal with insights already generated. Or enter any email to start fresh.
          </p>
          <button
            onClick={() => setEmail("demo@arvyax.com")}
            className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-medium py-2.5 rounded-lg transition"
          >
            Use demo@arvyax.com →
          </button>
        </div>

        <p className="text-stone-400 text-xs text-center">
          Email acts as your unique ID. No password needed.
          In production, this would use proper authentication.
        </p>

      </div>
    </div>
  );
}