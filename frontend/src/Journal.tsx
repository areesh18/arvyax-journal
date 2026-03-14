import { useState, useEffect } from "react";
import axios from "axios";
import type { JournalEntry, Insights } from "./types";

interface Props {
  userId: string;
  onSignOut: () => void;
}

const API = "http://localhost:3000/api/journal";

const ambienceConfig: Record<
  string,
  { emoji: string; label: string; description: string }
> = {
  forest: {
    emoji: "🌲",
    label: "Forest",
    description: "Leaves, birdsong, cool shade",
  },
  ocean: {
    emoji: "🌊",
    label: "Ocean",
    description: "Waves, salt air, horizon",
  },
  mountain: {
    emoji: "🏔️",
    label: "Mountain",
    description: "Silence, cold air, vastness",
  },
};

export default function Journal({ userId, onSignOut }: Props) {
  const [ambience, setAmbience] = useState("forest");
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showDemoNotice, setShowDemoNotice] = useState(
    userId === "demo@arvyax.com",
  );

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = userId.split("@")[0];

  const fetchEntries = async () => {
    setFetching(true);
    const res = await axios.get(`${API}/${userId}`);
    setEntries(res.data);
    const insightsRes = await axios.get(`${API}/insights/${userId}`);
    setInsights(insightsRes.data);
    setLoaded(true);
    setFetching(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const submitEntry = async () => {
    if (!text.trim()) return;
    setSaving(true);
    await axios.post(API, { userId, ambience, text });
    setText("");
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
    fetchEntries();
  };
  const analyzeEntry = async (entryId: number, entryText: string) => {
    setLoadingId(entryId);
    await axios.post(`${API}/analyze`, { entryId, text: entryText });
    await fetchEntries();
    setLoadingId(null);
  };

  const analyzeAll = async () => {
    setLoading(true);
    const unanalyzed = entries.filter((e) => e.emotion === null);
    for (const entry of unanalyzed) {
      setLoadingId(entry.id);
      await axios.post(`${API}/analyze`, {
        entryId: entry.id,
        text: entry.text,
      });
      await fetchEntries();
    }
    setLoadingId(null);
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen bg-stone-100"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1
            className="text-xl font-bold text-stone-900"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            ARVYA.X Soul Journal
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-sm font-bold">
                {userId[0].toUpperCase()}
              </div>
              <p className="text-stone-500 text-sm hidden sm:block">{userId}</p>
            </div>
            <button
              onClick={onSignOut}
              className="text-sm text-stone-500 hover:text-stone-800 border border-stone-300 px-3 py-1.5 rounded-lg transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Greeting */}
        <div>
          <p className="text-stone-400 text-sm">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h2
            className="text-3xl font-bold text-stone-900 mt-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {greeting}, <span className="text-emerald-600">{displayName}.</span>
          </h2>
        </div>
        {fetching && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-stone-200 rounded-xl p-5 animate-pulse"
              >
                <div className="h-3 bg-stone-200 rounded w-1/4 mb-3" />
                <div className="h-3 bg-stone-200 rounded w-full mb-2" />
                <div className="h-3 bg-stone-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}
        {/* Demo notice */}
        {loaded && showDemoNotice && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex justify-between items-start gap-4">
            <div>
              <p className="text-amber-800 font-semibold text-sm">
                👋 This is a Demo Account
              </p>
              <p className="text-amber-700 text-sm mt-1 leading-relaxed">
                Pre-populated with forest, ocean and mountain sessions — all
                analyzed. Explore insights below or add new entries.
              </p>
            </div>
            <button
              onClick={() => setShowDemoNotice(false)}
              className="text-amber-400 hover:text-amber-700 text-xl leading-none"
            >
              ✕
            </button>
          </div>
        )}

        {/* New user welcome */}
        {loaded && !showDemoNotice && entries.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl px-5 py-5 space-y-2">
            <p className="text-stone-800 font-semibold text-base">
              Your journal is empty.
            </p>
            <p className="text-stone-500 text-sm leading-relaxed">
              After your next ArvyaX session, write how it made you feel below.
              Hit <strong>Save Entry</strong>, then <strong>Analyze</strong> to
              let AI detect your emotion. Over time, your insights will build up
              here.
            </p>
          </div>
        )}

        {/* Insights */}
        {insights && insights.totalEntries > 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-stone-800 font-semibold text-base">
                Your Insights
              </h3>
              <button
                onClick={fetchEntries}
                className="text-stone-400 hover:text-stone-700 text-sm transition"
              >
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="bg-stone-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-stone-900">
                  {insights.totalEntries}
                </p>
                <p className="text-stone-400 text-xs mt-1">Sessions</p>
              </div>
              <div className="bg-stone-50 rounded-xl p-4 text-center">
                <p className="text-base font-bold text-emerald-600">
                  {insights.topEmotion ?? "—"}
                </p>
                <p className="text-stone-400 text-xs mt-1">Top Emotion</p>
              </div>
              <div className="bg-stone-50 rounded-xl p-4 text-center">
                <p className="text-2xl">
                  {ambienceConfig[insights.mostUsedAmbience ?? ""]?.emoji ??
                    "—"}
                </p>
                <p className="text-stone-400 text-xs mt-1">
                  {ambienceConfig[insights.mostUsedAmbience ?? ""]?.label ??
                    "Ambience"}
                </p>
              </div>
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-stone-400 text-xs mb-2">Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {insights.recentKeywords.slice(0, 3).map((k) => (
                    <span
                      key={k}
                      className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5"
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
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
          <h3 className="text-stone-800 font-semibold text-base">New Entry</h3>

          {/* Ambience selector */}
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(ambienceConfig).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setAmbience(key)}
                className={`rounded-xl p-4 text-left border transition ${
                  ambience === key
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-stone-200 bg-stone-50 hover:border-stone-300"
                }`}
              >
                <p className="text-2xl">{val.emoji}</p>
                <p
                  className={`text-sm font-semibold mt-2 ${ambience === key ? "text-emerald-700" : "text-stone-700"}`}
                >
                  {val.label}
                </p>
                <p className="text-xs text-stone-400 mt-0.5 leading-snug">
                  {val.description}
                </p>
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            placeholder="How did your session make you feel? Write freely..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full border border-stone-200 bg-stone-50 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none text-sm leading-relaxed"
          />

          <div className="flex justify-between items-center">
            <p className="text-stone-400 text-xs">{text.length} characters</p>
            <button
              onClick={submitEntry}
              disabled={!text.trim() || saving}
              className="bg-stone-900 hover:bg-stone-700 disabled:opacity-30 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin h-3 w-3 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Entry"
              )}
            </button>
          </div>
          {saved && <p className="text-emerald-600 text-sm">✓ Entry saved</p>}
        </div>

        {/* Past sessions */}
        {entries.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-stone-800 font-semibold text-base">
                Past Sessions
              </h3>
              <button
                onClick={analyzeAll}
                disabled={loading}
                className="text-sm bg-stone-900 hover:bg-stone-700 text-white px-4 py-2 rounded-xl transition disabled:opacity-30"
              >
                {loading ? "Analyzing..." : "Analyze All"}
              </button>
            </div>

            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden"
              >
                {/* Entry header */}
                <div className="px-5 py-4 flex justify-between items-center border-b border-stone-100">
                  <span className="text-stone-600 text-sm flex items-center gap-2">
                    {ambienceConfig[entry.ambience]?.emoji}
                    <span className="capitalize font-medium">
                      {entry.ambience}
                    </span>
                  </span>
                  <span className="text-stone-400 text-sm">
                    {new Date(entry.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Entry text */}
                <div className="px-5 py-4">
                  <p className="text-stone-700 text-sm leading-relaxed">
                    {entry.text}
                  </p>
                </div>

                {/* Analysis */}
                {entry.emotion ? (
                  <div className="border-t border-stone-100 bg-stone-50 px-5 py-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400 text-xs uppercase tracking-widest">
                        Emotion
                      </span>
                      <span className="text-emerald-600 font-semibold text-sm">
                        {entry.emotion}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.keywords?.map((k) => (
                        <span
                          key={k}
                          className="text-xs bg-white border border-stone-200 text-stone-500 rounded-full px-2.5 py-0.5"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                    <p className="text-stone-400 text-xs italic leading-relaxed">
                      {entry.summary}
                    </p>
                  </div>
                ) : (
                  <div className="border-t border-stone-100 px-5 py-3">
                    <button
                      onClick={() => analyzeEntry(entry.id, entry.text)}
                      disabled={loadingId === entry.id || loading}
                      className="text-sm text-stone-500 hover:text-stone-900 font-medium transition disabled:opacity-30 flex items-center gap-2"
                    >
                      {loadingId === entry.id ? (
                        <>
                          <svg
                            className="animate-spin h-3 w-3 text-stone-400"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>
                          Analyzing...
                        </>
                      ) : (
                        "+ Analyze with AI"
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-stone-300 text-xs text-center pb-6">
          ARVYA.X Soul Journal · Built for ArvyaX Full-Stack Assignment
        </p>
      </div>
    </div>
  );
}
