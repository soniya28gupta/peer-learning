import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Flame,
  TrendingUp,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  streak: number;
  sessions_joined: number;
  badges: string[];
}

const Leaderboard = () => {
  const { user } = useAuth();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All Time");

  // Fetch leaderboard users
  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("xp", { ascending: false });

    if (!error && data) {
      setEntries(data as LeaderboardEntry[]);
    }

    setLoading(false);
  };

  // Automatically insert logged-in user into leaderboard
  const ensureUserExists = async () => {
    if (!user) return;

    const { data: existingUser } = await supabase
      .from("leaderboard")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!existingUser) {
      await supabase.from("leaderboard").insert({
        user_id: user.id,
        username:
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Anonymous",
        avatar_url: user.user_metadata?.avatar_url || null,
        xp: 0,
        streak: 0,
        sessions_joined: 0,
        badges: ["New Learner"],
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      await ensureUserExists();
      await fetchLeaderboard();
    };

    init();
  }, [user]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leaderboard",
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const myRank = entries.findIndex((e) => e.user_id === user?.id) + 1;

  const myEntry = entries.find((e) => e.user_id === user?.id);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#041C18]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#041C18] text-white relative overflow-hidden py-10 px-4">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-green-500/20 bg-green-500/10 px-5 py-2 backdrop-blur-xl">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-medium text-green-300">
              Competitive Learning System
            </span>
          </div>

          <h1 className="mt-6 text-5xl font-black tracking-tight">
            Leaderboard
          </h1>

          <p className="mt-4 text-lg text-gray-400">
            Compete. Learn. Grow together.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl">
            <p className="text-sm text-gray-400">Total Learners</p>
            <h2 className="mt-3 text-4xl font-bold text-green-400">
              {entries.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl">
            <p className="text-sm text-gray-400">Your XP</p>
            <h2 className="mt-3 text-4xl font-bold text-yellow-400">
              {myEntry?.xp || 0}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl">
            <p className="text-sm text-gray-400">Your Rank</p>
            <h2 className="mt-3 text-4xl font-bold text-blue-400">
              #{myRank || "-"}
            </h2>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mt-10 flex flex-wrap gap-3">
          {["Weekly", "Monthly", "All Time"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition-all duration-300 ${
                filter === item
                  ? "border-green-400 bg-green-500/20 text-green-300 shadow-lg shadow-green-500/20"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-green-500/30"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {entries.length >= 3 && (
          <div className="mt-16 grid grid-cols-3 gap-6 items-end">
            {[entries[1], entries[0], entries[2]].map((entry, i) => {
              const rank = i === 0 ? 2 : i === 1 ? 1 : 3;

              const podiumHeight =
                rank === 1
                  ? "h-44"
                  : rank === 2
                  ? "h-36"
                  : "h-28";

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white/10 bg-white/10 text-3xl font-bold backdrop-blur-xl">
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt={entry.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        entry.username.charAt(0)
                      )}
                    </div>

                    {rank === 1 && (
                      <div className="absolute -top-3 -right-3 rounded-full bg-yellow-400 p-2 shadow-lg shadow-yellow-400/50">
                        <Medal className="h-5 w-5 text-black" />
                      </div>
                    )}
                  </div>

                  <h3 className="mt-4 text-lg font-bold">
                    {entry.username}
                  </h3>

                  <p className="text-sm text-gray-400">
                    {entry.xp} XP
                  </p>

                  <div
                    className={`mt-5 w-full rounded-t-3xl ${podiumHeight} flex items-end justify-center pb-4 shadow-2xl ${
                      rank === 1
                        ? "bg-gradient-to-b from-yellow-300 to-yellow-600"
                        : rank === 2
                        ? "bg-gradient-to-b from-gray-300 to-gray-500"
                        : "bg-gradient-to-b from-orange-400 to-orange-700"
                    }`}
                  >
                    <span className="text-3xl font-black text-white">
                      #{rank}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="mt-16 space-y-4">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.01 }}
              transition={{ delay: index * 0.03 }}
              className={`rounded-3xl border p-5 backdrop-blur-xl transition-all duration-300 ${
                entry.user_id === user?.id
                  ? "border-green-400 bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                  : "border-white/10 bg-white/5 hover:border-green-500/20"
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                {/* Rank */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold ${
                    index < 3
                      ? "bg-gradient-to-r from-green-400 to-emerald-500 text-black"
                      : "bg-white/10 text-white"
                  }`}
                >
                  #{index + 1}
                </div>

                {/* Avatar */}
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/10 text-xl font-bold">
                  {entry.avatar_url ? (
                    <img
                      src={entry.avatar_url}
                      alt={entry.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    entry.username.charAt(0)
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold">
                      {entry.username}
                    </h3>

                    {entry.user_id === user?.id && (
                      <Badge className="border border-green-400/20 bg-green-500/10 text-green-300">
                        YOU
                      </Badge>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                    <span>🔥 {entry.streak} day streak</span>
                    <span>📚 {entry.sessions_joined} sessions</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                      style={{
                        width: `${Math.min((entry.xp / 2000) * 100, 100)}%`,
                      }}
                    />
                  </div>

                  {/* Badges */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(entry.badges || []).map((badge) => (
                      <Badge
                        key={badge}
                        className="border border-green-500/20 bg-green-500/10 text-green-300"
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* XP */}
                <div className="flex items-center gap-2 rounded-2xl bg-green-500/10 px-4 py-3">
                  <Flame className="h-5 w-5 text-yellow-400" />

                  <div>
                    <p className="text-xs text-gray-400">XP</p>
                    <h2 className="text-xl font-black text-green-400">
                      {entry.xp}
                    </h2>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {entries.length === 0 && (
          <div className="mt-20 flex flex-col items-center justify-center text-center">
            <Trophy className="h-20 w-20 text-green-500/20" />

            <h2 className="mt-6 text-3xl font-bold">
              No rankings yet
            </h2>

            <p className="mt-3 text-gray-400">
              Start learning to appear on leaderboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
