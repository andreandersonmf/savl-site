"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

type PlayerProfile = {
  id: string;
  auth_user_id?: string | null;
  discord_id?: string | null;
  discord_username?: string | null;
  discord_global_name?: string | null;
  roblox_username?: string | null;
  roblox_user_id?: string | null;
  avatar_url?: string | null;
  site_role?: string | null;
};

type TeamTransaction = {
  id: string;
  team_name?: string | null;
  transaction_type?: string | null;
  requested_role?: string | null;
  status?: string | null;
  source?: string | null;
  player_discord_id?: string | null;
  player_discord_username?: string | null;
  requester_discord_id?: string | null;
  requester_discord_username?: string | null;
  handled_by_discord_username?: string | null;
  roblox_username?: string | null;
  roblox_user_id?: string | null;
  reason?: string | null;
  created_at?: string | null;
};

function getDiscordIdentity(session: Session | null) {
  const user = session?.user;
  if (!user) return null;

  const identity = user.identities?.find((item) => item.provider === "discord") as any;
  const identityData = identity?.identity_data ?? {};
  const metadata = user.user_metadata ?? {};
  const source = { ...metadata, ...identityData } as Record<string, any>;

  const discordId =
    identity?.provider_id ??
    source.provider_id ??
    source.sub ??
    source.id ??
    source.user_id ??
    null;

  const username =
    source.preferred_username ??
    source.user_name ??
    source.username ??
    source.name ??
    user.email ??
    null;

  const globalName = source.global_name ?? source.full_name ?? source.name ?? null;
  const avatarUrl = source.avatar_url ?? source.picture ?? null;

  return {
    discordId: discordId ? String(discordId) : null,
    username: username ? String(username).replace(/^@/, "") : null,
    globalName: globalName ? String(globalName) : null,
    avatarUrl: avatarUrl ? String(avatarUrl) : null,
  };
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function ProfilePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [transactions, setTransactions] = useState<TeamTransaction[]>([]);
  const [robloxUsername, setRobloxUsername] = useState("");
  const [robloxUserId, setRobloxUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const discordIdentity = useMemo(() => getDiscordIdentity(session), [session]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await syncProfile(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      await syncProfile(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function syncProfile(currentSession: Session | null) {
    if (!supabase || !currentSession?.user) return;

    const identity = getDiscordIdentity(currentSession);
    const payload = {
      auth_user_id: currentSession.user.id,
      discord_id: identity?.discordId,
      discord_username: identity?.username,
      discord_global_name: identity?.globalName,
      avatar_url: identity?.avatarUrl,
    };

    let nextProfile: PlayerProfile | null = null;

    if (identity?.discordId) {
      const existing = await supabase
        .from("profiles")
        .select("*")
        .eq("discord_id", identity.discordId)
        .maybeSingle();

      if (existing.error) {
        setNotice(`Profile table is not ready yet: ${existing.error.message}`);
        return;
      }

      if (existing.data) {
        const updated = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", existing.data.id)
          .select("*")
          .maybeSingle();

        if (updated.error) {
          setNotice(updated.error.message);
          return;
        }

        nextProfile = updated.data as PlayerProfile;
      }
    }

    if (!nextProfile) {
      const { data, error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "auth_user_id" })
        .select("*")
        .maybeSingle();

      if (error) {
        setNotice(`Profile table is not ready yet: ${error.message}`);
        return;
      }

      nextProfile = data as PlayerProfile;
    }
    setProfile(nextProfile);
    setRobloxUsername(nextProfile.roblox_username ?? "");
    setRobloxUserId(nextProfile.roblox_user_id ?? "");
    await loadTransactions(nextProfile.discord_id ?? identity?.discordId ?? null);
  }

  async function loadTransactions(discordId: string | null) {
    if (!supabase || !discordId) return;

    const { data, error } = await supabase
      .from("team_transactions")
      .select("*")
      .or(`player_discord_id.eq.${discordId},requester_discord_id.eq.${discordId},handled_by_discord_id.eq.${discordId}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setNotice(`Transactions table is not ready yet: ${error.message}`);
      return;
    }

    setTransactions((data ?? []) as TeamTransaction[]);
  }

  async function saveRoblox(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !profile) return;

    const cleanUsername = robloxUsername.trim();
    const cleanUserId = robloxUserId.trim();

    if (!cleanUsername || !/^\d+$/.test(cleanUserId)) {
      setNotice("Enter a Roblox username and numeric User ID.");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from("profiles")
      .update({
        roblox_username: cleanUsername,
        roblox_user_id: cleanUserId,
      })
      .eq("id", profile.id)
      .select("*")
      .maybeSingle();

    setSaving(false);

    if (error) {
      setNotice(error.message);
      return;
    }

    setProfile(data as PlayerProfile);
    setNotice("Roblox account linked successfully.");
  }

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setTransactions([]);
  }

  if (loading) {
    return <main className="min-h-screen bg-[#03110D] p-10 text-white">Loading profile...</main>;
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-[#03110D] px-6 py-10 text-white">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-[#0B1712] p-8">
          <h1 className="text-4xl font-black">Profile</h1>
          <p className="mt-4 text-white/70">You need to log in with Discord before opening your SAVL profile.</p>
          <Link href="/login" className="mt-6 inline-flex rounded-2xl bg-[#5865F2] px-6 py-3 font-bold text-white">
            Login with Discord
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#03110D] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
            SAVL Profile
          </Link>
          <div className="flex flex-wrap gap-2 text-sm text-white/70">
            <Link href="/" className="rounded-xl border border-white/10 px-4 py-2 hover:bg-white/5">Home</Link>
            <Link href="/stats" className="rounded-xl border border-white/10 px-4 py-2 hover:bg-white/5">Stats</Link>
            <Link href="/admin" className="rounded-xl border border-white/10 px-4 py-2 hover:bg-white/5">Admin</Link>
            <button onClick={logout} className="rounded-xl border border-red-400/20 px-4 py-2 text-red-200 hover:bg-red-400/10">Log Out</button>
          </div>
        </nav>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[#0B1712] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Discord Identity</p>
            <div className="mt-5 flex items-center gap-4">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Discord avatar" className="h-16 w-16 rounded-full border border-white/10 object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full border border-white/10 bg-white/10" />
              )}
              <div>
                <h1 className="text-2xl font-black">{profile?.discord_global_name || profile?.discord_username || discordIdentity?.username || "Discord User"}</h1>
                <p className="text-sm text-white/50">Discord ID: {profile?.discord_id || discordIdentity?.discordId || "Not detected"}</p>
              </div>
            </div>

            <form onSubmit={saveRoblox} className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Linked Roblox</p>
              <div className="mt-4 space-y-4">
                <label className="block text-sm text-white/70">
                  Roblox Username
                  <input value={robloxUsername} onChange={(e) => setRobloxUsername(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#03110D] px-4 py-3 outline-none focus:border-emerald-400/40" placeholder="xImTutu" />
                </label>
                <label className="block text-sm text-white/70">
                  Roblox User ID
                  <input value={robloxUserId} onChange={(e) => setRobloxUserId(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#03110D] px-4 py-3 outline-none focus:border-emerald-400/40" placeholder="123456789" />
                </label>
                <button disabled={saving} className="rounded-2xl bg-emerald-500 px-5 py-3 font-bold text-black disabled:opacity-50">
                  {saving ? "Saving..." : "Save Roblox Link"}
                </button>
              </div>
            </form>

            {notice ? <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">{notice}</p> : null}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0B1712] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Transactions</p>
                <h2 className="mt-2 text-3xl font-black">Your Discord Transactions</h2>
              </div>
              <button onClick={() => loadTransactions(profile?.discord_id ?? discordIdentity?.discordId ?? null)} className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/10">
                Refresh
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {transactions.length === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-white/60">
                  No transactions found yet.
                </div>
              ) : (
                transactions.map((item) => (
                  <article key={item.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-white/40">{item.transaction_type || "transaction"}</p>
                        <h3 className="mt-1 text-xl font-bold">{item.team_name || "Unknown Team"}</h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${item.status === "accepted" ? "bg-emerald-400/15 text-emerald-300" : item.status === "denied" ? "bg-red-400/15 text-red-300" : "bg-yellow-400/15 text-yellow-200"}`}>
                        {item.status || "pending"}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-white/65 md:grid-cols-2">
                      <p>Player: {item.player_discord_username || item.player_discord_id || "—"}</p>
                      <p>Role: {item.requested_role || "—"}</p>
                      <p>Roblox: {item.roblox_username || "—"}</p>
                      <p>Requested by: {item.requester_discord_username || "—"}</p>
                      <p>Created: {formatDate(item.created_at)}</p>
                    </div>
                    {item.reason ? <p className="mt-3 rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{item.reason}</p> : null}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
