import { useState, useEffect } from "react";
import axios from "axios";
import type { JournalEntry, Insights } from "./types";

interface Props {
  userId: string;
  onSignOut: () => void;
}

const API = "http://localhost:3000/api/journal";

const ambienceConfig: Record<string, { emoji: string; label: string; description: string; color: string }> = {
  forest: {
    emoji: "🌲",
    label: "Forest",
    description: "Rustling leaves, cool shade, birdsong",
    color: "emerald",
  },
  ocean: {
    emoji: "🌊",
    label: "Ocean",
    description: "Waves, salt air, endless horizon",
    color: "cyan",
  },
  mountain: {
    emoji: "🏔️",
    label: "Mountain",
    description: "Cold air, silence, vast stillness",
    color: "slate",
  },
};

const colorMap: Record<string, string> = {
  emerald: "border-emerald-500/50 bg-emerald-900/20 text-emerald-300",
  cyan: "border-cyan-500/50 bg-cyan-900/20 text-cyan-300",
  slate: "border-slate-400/50 bg-slate-700/20 text-slate-300",
};

const colorMapInactive: Record<string, string> = {
  emerald: "hover:border-emerald-500/20 hover:bg-emerald-900/10",
  cyan: "hover:border-cyan-500/20 hover:bg-cyan-900/10",
  slate: "hover:border-slate-400/20 hover:bg-slate-700/10",
};

export default function Journal({ userId, onSignOut }: Props) {
  const [ambience, setAmbience] = useState("forest");
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDemoNotice, setShowDemoNotice] = useState(userId === "demo@arvyax.com");
  const [loaded, setLoaded] = useState(false);

  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = userId.split("@")[0];

  const fetchEntries = async () => {
    const res = await axios.get(`${API}/${userId}`);
    setEntries(res.data);
    const insightsRes = await axios.get(`${API}/insights/${userId}`);
    setInsights(insightsRes.data);
    setLoaded(true);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const submitEntry = async () => {
    if (!text.trim()) return;
    await axios.post(API, { userId, ambience, text });
    setText("");
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    fetchEntries();
  };

  const analyzeEntry = async (entryId: number, entryText: string) => {
    await axios.post(`${API}/analyze`, { entryId, text: entryText });
    await fetchEntries();
  };

  const analyzeAll = async () => {
    setLoading(true);
    const unanalyzed = entries.filter((e) => e.emotion === null);
    for (const entry of unanalyzed) {
      await analyzeEntry(entry.id, entry.text);
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen bg-zinc-950 text-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Top bar */}
      <div className="border-b border-white/5 px-6 py-4 sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <p
            className="text-white font-bold tracking-widest text-sm"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            ARVYA.X
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold">
                {userId[0].toUpperCase()}
              </div>
              <p className="text-white/40 text-xs hidden sm:block">{userId}</p>
            </div>
            <button
              onClick={onSignOut}
              className="text-white/20 hover:text-white/50 text-xs border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">

        {/* Hero greeting */}
        <div className="space-y-1">
          <p className="text-white/30 text-sm tracking-widest uppercase">Soul Journal</p>
          <h1
            className="text-4xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {timeGreeting}, <span className="text-emerald-400">{displayName}.</span>
          </h1>
          <p className="text-white/30 text-sm">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Demo notice */}
        {loaded && showDemoNotice && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4 flex justify-between items-start gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-300">👋 Demo Account</p>
              <p className="text-xs text-amber-300/60 leading-relaxed">
                Pre-populated with forest, ocean and mountain sessions — all analyzed.
                Explore insights or add new entries to see it update live.
              </p>
            </div>
            <button
              onClick={() => setShowDemoNotice(false)}
              className="text-amber-500/40 hover:text-amber-300 transition text-base leading-none shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* New user welcome */}
        {loaded && !showDemoNotice && entries.length === 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-5 space-y-2">
            <p className="text-white/70 text-sm font-semibold">Your journal is empty.</p>
            <p className="text-white/30 text-xs leading-relaxed">
              After your next ArvyaX session — forest, ocean or mountain — write how it made you feel.
              The AI will decode your emotion and build your mental wellness picture over time.
            </p>
          </div>
        )}

        {/* Insights */}
        {insights && insights.totalEntries > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-white/30 text-xs tracking-widest uppercase">Your Patterns</p>
              <button
                onClick={fetchEntries}
                className="text-white/20 hover:text-white/50 text-xs transition"
              >
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-white">{insights.totalEntries}</p>
                <p className="text-white/30 text-xs mt-1">Sessions</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-base font-bold text-emerald-400 leading-tight">
                  {insights.topEmotion ?? "—"}
                </p>
                <p className="text-white/30 text-xs mt-1">Top Emotion</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl">
                  {ambienceConfig[insights.mostUsedAmbience ?? ""]?.emoji ?? "—"}
                </p>
                <p className="text-white/30 text-xs mt-1">
                  {ambienceConfig[insights.mostUsedAmbience ?? ""]?.label ?? "Ambience"}
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white/30 text-xs mb-2">Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {insights.recentKeywords.slice(0, 3).map((k) => (
                    <span
                      key={k}
                      className="text-xs bg-emerald-900/40 text-emerald-400 rounded-full px-2 py-0.5"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Entry */}
        <div className="space-y-4">
          <p className="text-white/30 text-xs tracking-widest uppercase">New Entry</p>

          {/* Ambience selector */}
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(ambienceConfig).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setAmbience(key)}
                className={`rounded-2xl p-4 text-left border transition ${
                  ambience === key
                    ? colorMap[val.color]
                    : `border-white/10 bg-white/[0.02] text-white/30 ${colorMapInactive[val.color]}`
                }`}
              >
                <p className="text-2xl mb-2">{val.emoji}</p>
                <p className="text-sm font-semibold">{val.label}</p>
                <p className="text-xs opacity-60 mt-0.5 leading-snug">{val.description}</p>
              </button>
            ))}
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <textarea
              placeholder="What did you feel during your session? Write freely..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white/80 placeholder-white/15 focus:outline-none focus:border-emerald-500/30 resize-none text-sm leading-relaxed transition"
            />
            <div className="flex justify-between items-center">
              <p className="text-white/15 text-xs">{text.length} characters</p>
              <button
                onClick={submitEntry}
                disabled={!text.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium text-sm transition active:scale-[0.98]"
              >
                Save Entry
              </button>
            </div>
            {saved && (
              <p className="text-emerald-400 text-xs">✓ Entry saved successfully</p>
            )}
          </div>
        </div>

        {/* Past Sessions */}
        {entries.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-white/30 text-xs tracking-widest uppercase">Past Sessions</p>
              <button
                onClick={analyzeAll}
                disabled={loading}
                className="text-xs border border-emerald-500/20 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40 px-3 py-1.5 rounded-lg transition disabled:opacity-30"
              >
                {loading ? "Analyzing..." : "Analyze All"}
              </button>
            </div>

            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden"
              >
                {/* Entry header */}
                <div className="px-5 pt-5 pb-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span>{ambienceConfig[entry.ambience]?.emoji}</span>
                    <span className="text-white/40 text-xs capitalize">{entry.ambience}</span>
                  </div>
                  <span className="text-white/20 text-xs">
                    {new Date(entry.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Entry text */}
                <div className="px-5 pb-4">
                  <p className="text-white/60 text-sm leading-relaxed">{entry.text}</p>
                </div>

                {/* Analysis or button */}
                {entry.emotion ? (
                  <div className="border-t border-white/5 px-5 py-4 bg-black/20 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/20 uppercase tracking-widest">Emotion</span>
                      <span className="text-sm font-semibold text-emerald-400">{entry.emotion}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.keywords?.map((k) => (
                        <span
                          key={k}
                          className="text-xs bg-white/5 border border-white/10 text-white/30 rounded-full px-2.5 py-0.5"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                    <p className="text-white/20 text-xs italic leading-relaxed">{entry.summary}</p>
                  </div>
                ) : (
                  <div className="border-t border-white/5 px-5 py-3">
                    <button
                      onClick={() => analyzeEntry(entry.id, entry.text)}
                      disabled={loading}
                      className="text-xs text-white/30 hover:text-white/60 transition disabled:opacity-20"
                    >
                      + Analyze with AI
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-white/10 text-xs">ARVYA.X Soul Journal · Built for ArvyaX Assignment</p>
        </div>

      </div>
    </div>
  );
}