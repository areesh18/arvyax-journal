import { useState, useEffect } from "react";
import axios from "axios";

interface JournalEntry {
  id: number;
  user_id: string;
  ambience: string;
  text: string;
  emotion: string | null;
  keywords: string[] | null;
  summary: string | null;
  created_at: string;
}

interface Insights {
  totalEntries: number;
  topEmotion: string | null;
  mostUsedAmbience: string | null;
  recentKeywords: string[];
}

const API = "http://localhost:3000/api/journal";

const ambienceEmoji: Record<string, string> = {
  forest: "🌲",
  ocean: "🌊",
  mountain: "🏔️",
};

export default function App() {
  const [userId, setUserId] = useState(() => {
    return localStorage.getItem("arvyax_user_id") || "";
  });
  const [emailInput, setEmailInput] = useState("");
  const [ambience, setAmbience] = useState("forest");
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchEntries = async () => {
    if (!userId) return;
    const res = await axios.get(`${API}/${userId}`);
    setEntries(res.data);
    const insightsRes = await axios.get(`${API}/insights/${userId}`);
    setInsights(insightsRes.data);
  };

  useEffect(() => {
    if (userId) fetchEntries();
  }, [userId]);

  const handleSetUser = (email: string) => {
    if (!email) return;
    localStorage.setItem("arvyax_user_id", email);
    setUserId(email);
  };

  const submitEntry = async () => {
    if (!text) return;
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
    const unanalyzed = entries.filter((entry) => entry.emotion === null);
    for (const entry of unanalyzed) {
      await analyzeEntry(entry.id, entry.text);
    }
    setLoading(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem("arvyax_user_id");
    setUserId("");
    setEntries([]);
    setInsights(null);
  };

  // Welcome screen
  if (!userId) {
    return (
      <div
        className="min-h-screen relative overflow-hidden"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Blurred background — shows the main app UI behind */}
        <div className="absolute inset-0 filter blur-sm pointer-events-none select-none opacity-60">
          <div className="bg-stone-800 py-6 px-6">
            <div className="max-w-2xl mx-auto">
              <h1
                className="text-2xl font-bold text-stone-100"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                ArvyaX Journal
              </h1>
              <div className="mt-3 bg-stone-700 rounded-lg px-4 py-3">
                <div className="h-4 w-32 bg-stone-500 rounded" />
              </div>
            </div>
          </div>
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
            <div className="bg-white border border-stone-200 rounded-xl p-5 h-48" />
            <div className="bg-white border border-stone-200 rounded-xl p-5 h-32" />
            <div className="bg-white border border-stone-200 rounded-xl p-5 h-24" />
          </div>
        </div>

        {/* Email form overlay */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-8 w-full max-w-sm space-y-5 shadow-xl">
            <div className="text-center space-y-1">
              <h1
                className="text-3xl font-bold text-stone-800"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                ArvyaX Journal
              </h1>
              <p className="text-stone-500 text-sm">
                Your nature session companion
              </p>
            </div>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="you@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSetUser(emailInput);
                }}
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
              />
              <button
                onClick={() => handleSetUser(emailInput)}
                className="w-full bg-stone-800 text-white py-2.5 rounded-lg hover:bg-stone-700 transition font-medium"
              >
                Get Started
              </button>
            </div>
            <p className="text-xs text-stone-400 text-center">
              No password needed. Just your email.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-serif">
      {/* Header */}
      <div className="bg-stone-800 text-stone-100 py-6 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold tracking-wide">ArvyaX Journal</h1>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded-lg transition"
            >
              Logout
            </button>
          </div>
          <div className="mt-3 bg-stone-700 rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-500 flex items-center justify-center text-sm font-bold">
              {userId[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-stone-400">Signed in as</p>
              <p className="text-sm font-medium">{userId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Insights Panel */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-stone-700">
              Your Insights
            </h2>
            <button
              onClick={fetchEntries}
              className="text-sm text-stone-500 hover:text-stone-700 transition"
            >
              Refresh
            </button>
          </div>
          {insights && insights.totalEntries > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="bg-stone-100 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{insights.totalEntries}</p>
                <p className="text-xs text-stone-500 mt-1">Entries</p>
              </div>
              <div className="bg-stone-100 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">
                  {insights.topEmotion ?? "—"}
                </p>
                <p className="text-xs text-stone-500 mt-1">Top Emotion</p>
              </div>
              <div className="bg-stone-100 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">
                  {ambienceEmoji[insights.mostUsedAmbience ?? ""] ?? "—"}
                </p>
                <p className="text-xs text-stone-500 mt-1">Fav Ambience</p>
              </div>
              <div className="bg-stone-100 rounded-lg p-3 text-center">
                <p className="text-xs text-stone-500 mb-1">Keywords</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {insights.recentKeywords.slice(0, 3).map((k) => (
                    <span
                      key={k}
                      className="text-xs bg-stone-200 rounded-full px-2 py-0.5"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-stone-400 text-sm">
              Analyze your entries to see insights here.
            </p>
          )}
        </div>

        {/* New Entry Form */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
          <h2 className="text-lg font-semibold text-stone-700">New Entry</h2>
          <select
            value={ambience}
            onChange={(e) => setAmbience(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <option value="forest">🌲 Forest</option>
            <option value="ocean">🌊 Ocean</option>
            <option value="mountain">🏔️ Mountain</option>
          </select>
          <textarea
            placeholder="How did your session make you feel?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full border border-stone-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
          />
          <button
            onClick={submitEntry}
            className="w-full bg-stone-800 text-white py-2 rounded-lg hover:bg-stone-700 transition"
          >
            Save Entry
          </button>
          {saved && (
            <p className="text-green-600 text-sm text-center">
              Entry saved successfully!
            </p>
          )}
        </div>

        {/* Entries List */}
        {entries.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-stone-700">
                Previous Entries
              </h2>
              <button
                onClick={analyzeAll}
                disabled={loading}
                className="text-sm bg-stone-800 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700 transition disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Analyze All"}
              </button>
            </div>
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white border border-stone-200 rounded-xl p-5 space-y-2"
              >
                <div className="flex justify-between items-center text-sm text-stone-400">
                  <span>
                    {ambienceEmoji[entry.ambience]} {entry.ambience}
                  </span>
                  <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-stone-700">{entry.text}</p>
                {entry.emotion ? (
                  <div className="bg-stone-50 rounded-lg p-3 space-y-1 text-sm">
                    <p>
                      <span className="text-stone-500">Emotion:</span>{" "}
                      {entry.emotion}
                    </p>
                    <p>
                      <span className="text-stone-500">Keywords:</span>{" "}
                      {entry.keywords?.join(", ")}
                    </p>
                    <p>
                      <span className="text-stone-500">Summary:</span>{" "}
                      {entry.summary}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => analyzeEntry(entry.id, entry.text)}
                    disabled={loading}
                    className="text-sm bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    Analyze
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
