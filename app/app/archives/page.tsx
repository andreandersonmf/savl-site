"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Archive, BarChart3, CalendarDays, Trophy, Users } from "lucide-react";

type MatchStatus = "Scheduled" | "Live" | "Finished";

type Season = {
  id: string;
  name: string;
  slug: string;
  theme_name?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  is_archived?: boolean | null;
  awards_status?: string | null;
  created_at?: string | null;
};

type Team = {
  id: number;
  season_id?: string | null;
  country: string;
  code: string;
  captain_name: string;
  captain_discord: string;
  captain_roblox_id: string;
  approved: boolean;
  group_letter?: string | null;
  brick_color_name?: string | null;
  brick_color_hex?: string | null;
  brick_color_number?: number | null;
};

type MatchRow = {
  id: number;
  season_id?: string | null;
  home_country: string;
  away_country: string;
  stage: string | null;
  match_date: string;
  match_time: string;
  status: MatchStatus;
  home_score: number;
  away_score: number;
  winner_country: string | null;
  set1_home?: number | null;
  set1_away?: number | null;
  set2_home?: number | null;
  set2_away?: number | null;
  set3_home?: number | null;
  set3_away?: number | null;
  set4_home?: number | null;
  set4_away?: number | null;
  set5_home?: number | null;
  set5_away?: number | null;
};

type TeamPlayer = {
  id: number;
  season_id?: string | null;
  team_id: number;
  roblox_username: string;
  roblox_user_id: string;
  discord_username: string;
  role: "Vice Captain" | "Player";
};

type PlayerStat = {
  id?: number;
  season_id?: string | null;
  match_id: number;
  team_country: string;
  player_key: string;
  player_name: string;
  set_number: number;
  spiking_errors: number;
  ape_kills: number;
  ape_attempts: number;
  kills: number;
  attempts: number;
  one_touches: number;
  kill_blocks: number;
  assists: number;
  serve_bfs: number;
  receives: number;
  dives: number;
  aces: number;
  misc_errors: number;
};

type StandingRow = {
  country: string;
  code: string;
  played: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  setDiff: number;
  points: number;
  position: number;
};

type LeaderboardPlayer = {
  player_username: string;
  player_key: string;
  team: string;
  matches_played: number;
  kills: number;
  ape_kills: number;
  assists: number;
  receives: number;
  aces: number;
  blocks: number;
};

type TeamTheme = {
  name: string;
  code: string;
  emoji?: string;
  accent?: string;
};

const ELEMENT_THEMES: TeamTheme[] = [
  { name: "Fire", code: "element-fire", emoji: "🔥", accent: "#ef4444" },
  { name: "Water", code: "element-water", emoji: "💧", accent: "#38bdf8" },
  { name: "Thunder", code: "element-thunder", emoji: "⚡", accent: "#facc15" },
  { name: "Earth", code: "element-earth", emoji: "⛰️", accent: "#a16207" },
  { name: "Wind", code: "element-wind", emoji: "🌪️", accent: "#7dd3fc" },
  { name: "Ice", code: "element-ice", emoji: "❄️", accent: "#93c5fd" },
  { name: "Shadow", code: "element-shadow", emoji: "🌑", accent: "#7c3aed" },
  { name: "Light", code: "element-light", emoji: "✨", accent: "#fde68a" },
  { name: "Nature", code: "element-nature", emoji: "🌿", accent: "#22c55e" },
  { name: "Metal", code: "element-metal", emoji: "⚙️", accent: "#94a3b8" },
  { name: "Poison", code: "element-poison", emoji: "☠️", accent: "#a855f7" },
  { name: "Crystal", code: "element-crystal", emoji: "💎", accent: "#67e8f9" },
  { name: "Storm", code: "element-storm", emoji: "⛈️", accent: "#60a5fa" },
  { name: "Lava", code: "element-lava", emoji: "🌋", accent: "#f97316" },
  { name: "Ocean", code: "element-ocean", emoji: "🌊", accent: "#0284c7" },
  { name: "Solar", code: "element-solar", emoji: "☀️", accent: "#f59e0b" },
  { name: "Lunar", code: "element-lunar", emoji: "🌙", accent: "#c4b5fd" },
  { name: "Eclipse", code: "element-eclipse", emoji: "🌘", accent: "#8b5cf6" },
  { name: "Plasma", code: "element-plasma", emoji: "🔮", accent: "#ec4899" },
  { name: "Frost", code: "element-frost", emoji: "🧊", accent: "#bfdbfe" },
  { name: "Sand", code: "element-sand", emoji: "🏜️", accent: "#fbbf24" },
  { name: "Gravity", code: "element-gravity", emoji: "🪐", accent: "#6366f1" },
  { name: "Spirit", code: "element-spirit", emoji: "👻", accent: "#d8b4fe" },
  { name: "Smoke", code: "element-smoke", emoji: "💨", accent: "#64748b" },
  { name: "Venom", code: "element-venom", emoji: "🐍", accent: "#84cc16" },
  { name: "Aurora", code: "element-aurora", emoji: "🌌", accent: "#2dd4bf" },
  { name: "Radiance", code: "element-radiance", emoji: "🌟", accent: "#fef08a" },
  { name: "Void", code: "element-void", emoji: "🕳️", accent: "#111827" },
  { name: "Meteor", code: "element-meteor", emoji: "☄️", accent: "#fb7185" },
  { name: "Stone", code: "element-stone", emoji: "🪨", accent: "#78716c" },
  { name: "Ember", code: "element-ember", emoji: "🔥", accent: "#ea580c" },
  { name: "Tempest", code: "element-tempest", emoji: "🌩️", accent: "#38bdf8" },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getElementThemeByCode(code: string) {
  return ELEMENT_THEMES.find((theme) => normalizeText(theme.code) === normalizeText(code)) ?? null;
}

function createElementBadgeDataUri(theme: TeamTheme) {
  const accent = theme.accent ?? "#10B981";
  const label = theme.emoji ?? theme.name.slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="110" viewBox="0 0 160 110"><defs><radialGradient id="g" cx="30%" cy="20%" r="90%"><stop offset="0" stop-color="${accent}" stop-opacity="0.95"/><stop offset="0.55" stop-color="#0B1712"/><stop offset="1" stop-color="#03110D"/></radialGradient></defs><rect width="160" height="110" rx="24" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="46">${label}</text><text x="50%" y="90" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="800" fill="white" opacity="0.92">${theme.name.toUpperCase()}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getTeamImageUrl(code: string) {
  const elementTheme = getElementThemeByCode(code);
  if (elementTheme) return createElementBadgeDataUri(elementTheme);
  return `https://flagcdn.com/w160/${code}.png`;
}

function formatDate(date: string) {
  if (!date) return "-";

  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

function getMatchSets(match: MatchRow) {
  return [
    { home: match.set1_home ?? null, away: match.set1_away ?? null },
    { home: match.set2_home ?? null, away: match.set2_away ?? null },
    { home: match.set3_home ?? null, away: match.set3_away ?? null },
    { home: match.set4_home ?? null, away: match.set4_away ?? null },
    { home: match.set5_home ?? null, away: match.set5_away ?? null },
  ];
}

function calculatePointsTotals(match: MatchRow) {
  return getMatchSets(match).reduce(
    (total, set) => {
      if (set.home === null || set.away === null) return total;
      return {
        homePoints: total.homePoints + set.home,
        awayPoints: total.awayPoints + set.away,
      };
    },
    { homePoints: 0, awayPoints: 0 },
  );
}

function buildStandings(teams: Team[], matches: MatchRow[]): StandingRow[] {
  const map = new Map<string, Omit<StandingRow, "position">>();

  for (const team of teams) {
    map.set(team.country, {
      country: team.country,
      code: team.code,
      played: 0,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      setDiff: 0,
      points: 0,
    });
  }

  for (const match of matches) {
    if (match.status !== "Finished") continue;
    const home = map.get(match.home_country);
    const away = map.get(match.away_country);
    if (!home || !away) continue;

    const homeSets = match.home_score;
    const awaySets = match.away_score;

    home.played += 1;
    away.played += 1;
    home.setsWon += homeSets;
    home.setsLost += awaySets;
    away.setsWon += awaySets;
    away.setsLost += homeSets;
    home.setDiff = home.setsWon - home.setsLost;
    away.setDiff = away.setsWon - away.setsLost;

    if (homeSets > awaySets) {
      home.wins += 1;
      away.losses += 1;
      if (homeSets === 3 && awaySets === 2) {
        home.points += 2;
        away.points += 1;
      } else {
        home.points += 3;
      }
    } else if (awaySets > homeSets) {
      away.wins += 1;
      home.losses += 1;
      if (awaySets === 3 && homeSets === 2) {
        away.points += 2;
        home.points += 1;
      } else {
        away.points += 3;
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff;
      if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;
      return a.country.localeCompare(b.country);
    })
    .map((team, index) => ({ ...team, position: index + 1 }));
}

function buildLeaderboard(stats: PlayerStat[]): LeaderboardPlayer[] {
  const map = new Map<string, LeaderboardPlayer & { matchIds: Set<number> }>();

  for (const row of stats) {
    const key = `${row.player_key}-${normalizeText(row.team_country)}`;
    const existing = map.get(key);

    if (existing) {
      existing.matchIds.add(row.match_id);
      existing.matches_played = existing.matchIds.size;
      existing.kills += row.kills;
      existing.ape_kills += row.ape_kills;
      existing.assists += row.assists;
      existing.receives += row.receives;
      existing.aces += row.aces;
      existing.blocks += row.kill_blocks + row.one_touches;
    } else {
      map.set(key, {
        player_username: row.player_name,
        player_key: row.player_key,
        team: row.team_country,
        matches_played: 1,
        kills: row.kills,
        ape_kills: row.ape_kills,
        assists: row.assists,
        receives: row.receives,
        aces: row.aces,
        blocks: row.kill_blocks + row.one_touches,
        matchIds: new Set([row.match_id]),
      });
    }
  }

  return Array.from(map.values())
    .map(({ matchIds, ...player }) => player)
    .sort((a, b) => {
      const aScore = a.kills + a.ape_kills + a.assists + a.receives + a.aces + a.blocks;
      const bScore = b.kills + b.ape_kills + b.assists + b.receives + b.aces + b.blocks;
      if (bScore !== aScore) return bScore - aScore;
      return a.player_username.localeCompare(b.player_username);
    });
}

export default function ArchivesPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const selectedSeason = useMemo(() => {
    return seasons.find((season) => season.id === selectedSeasonId) ?? null;
  }, [seasons, selectedSeasonId]);

  const standings = useMemo(() => buildStandings(teams, matches), [teams, matches]);
  const leaderboard = useMemo(() => buildLeaderboard(stats), [stats]);
  const finishedMatches = useMemo(
    () => matches.filter((match) => match.status === "Finished"),
    [matches],
  );

  async function loadSeasons() {
    if (!supabase) {
      setNotice("Configure Supabase to load archived seasons.");
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("seasons")
      .select("*")
      .eq("is_archived", true)
      .order("created_at", { ascending: false });

    if (error) {
      setNotice(error.message);
      setLoading(false);
      return;
    }

    const archivedSeasons = (data ?? []) as Season[];
    setSeasons(archivedSeasons);

    if (archivedSeasons.length > 0) {
      const firstSeasonId = archivedSeasons[0].id;
      setSelectedSeasonId(firstSeasonId);
      await loadSeasonData(firstSeasonId);
    } else {
      setNotice("No archived seasons found yet.");
      setLoading(false);
    }
  }

  async function loadSeasonData(seasonId: string) {
    if (!supabase || !seasonId) return;

    setLoading(true);

    const [teamsResult, matchesResult, playersResult, statsResult] = await Promise.all([
      supabase
        .from("teams")
        .select("*")
        .eq("season_id", seasonId)
        .order("country", { ascending: true }),
      supabase
        .from("matches")
        .select("*")
        .eq("season_id", seasonId)
        .order("match_date", { ascending: true })
        .order("match_time", { ascending: true }),
      supabase
        .from("team_players")
        .select("*")
        .eq("season_id", seasonId)
        .order("created_at", { ascending: true }),
      supabase
        .from("match_player_stats")
        .select("*")
        .eq("season_id", seasonId)
        .order("team_country", { ascending: true })
        .order("player_name", { ascending: true }),
    ]);

    if (teamsResult.error) setNotice(teamsResult.error.message);
    if (matchesResult.error) setNotice(matchesResult.error.message);
    if (playersResult.error) setNotice(playersResult.error.message);
    if (statsResult.error) setNotice(statsResult.error.message);

    setTeams((teamsResult.data ?? []) as Team[]);
    setMatches((matchesResult.data ?? []) as MatchRow[]);
    setPlayers((playersResult.data ?? []) as TeamPlayer[]);
    setStats((statsResult.data ?? []) as PlayerStat[]);
    setLoading(false);
  }

  useEffect(() => {
    loadSeasons();
  }, []);

  return (
    <div className="min-h-screen bg-[#03110D] text-white selection:bg-emerald-400/20 selection:text-white">
      <header className="border-b border-white/10 bg-[#03110D]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
              South America Volleyball League
            </p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">Season Archives</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Back Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                <Archive className="h-4 w-4" />
                Archived Seasons
              </span>
              <h2 className="mt-5 text-4xl font-black md:text-6xl">
                {selectedSeason?.name ?? "Archive"}
              </h2>
              <p className="mt-4 max-w-2xl text-white/65">
                Frozen history for past seasons: teams, standings, match history,
                stats, and awards status.
              </p>
            </div>

            {seasons.length > 0 ? (
              <select
                value={selectedSeasonId}
                onChange={(event) => {
                  setSelectedSeasonId(event.target.value);
                  loadSeasonData(event.target.value);
                }}
                className="rounded-2xl border border-white/10 bg-[#0B1712] px-4 py-3 text-white outline-none"
              >
                {seasons.map((season) => (
                  <option key={season.id} value={season.id} className="bg-[#081712]">
                    {season.name} {season.theme_name ? `• ${season.theme_name}` : ""}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          {notice ? (
            <p className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
              {notice}
            </p>
          ) : null}
        </section>

        {selectedSeason ? (
          <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Theme", value: selectedSeason.theme_name ?? "-", icon: Trophy },
              { label: "Teams", value: teams.length, icon: Users },
              { label: "Matches", value: matches.length, icon: CalendarDays },
              { label: "Stats Rows", value: stats.length, icon: BarChart3 },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <Icon className="h-5 w-5 text-emerald-300" />
                  <p className="mt-4 text-3xl font-black">{card.value}</p>
                  <p className="text-sm text-white/55">{card.label}</p>
                </div>
              );
            })}
          </section>
        ) : null}

        {loading ? (
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-white/70">
            Loading archive...
          </div>
        ) : selectedSeason ? (
          <>
            <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#0B1712] p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                    Awards
                  </p>
                  <h3 className="mt-2 text-2xl font-black">Season Awards</h3>
                </div>
                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-amber-200">
                  {selectedSeason.awards_status === "completed" ? "Completed" : "Coming Soon"}
                </span>
              </div>
              <p className="mt-4 text-white/65">
                {selectedSeason.awards_status === "completed"
                  ? "Awards for this archived season are marked as completed."
                  : "This season is archived, but the awards ceremony/results are still pending."}
              </p>
            </section>

            <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#0B1712] p-6">
              <h3 className="text-2xl font-black">Final Standings</h3>
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-[0.18em] text-white/45">
                    <tr>
                      <th className="py-3 pr-4">#</th>
                      <th className="py-3 pr-4">Team</th>
                      <th className="py-3 pr-4">P</th>
                      <th className="py-3 pr-4">W</th>
                      <th className="py-3 pr-4">L</th>
                      <th className="py-3 pr-4">Set Diff</th>
                      <th className="py-3 pr-4">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {standings.map((team) => (
                      <tr key={team.country}>
                        <td className="py-3 pr-4 font-bold text-emerald-300">{team.position}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <img src={getTeamImageUrl(team.code)} alt="" className="h-6 w-8 rounded object-cover" />
                            <span className="font-semibold">{team.country}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">{team.played}</td>
                        <td className="py-3 pr-4">{team.wins}</td>
                        <td className="py-3 pr-4">{team.losses}</td>
                        <td className="py-3 pr-4">{team.setDiff}</td>
                        <td className="py-3 pr-4 font-black">{team.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[2rem] border border-white/10 bg-[#0B1712] p-6">
                <h3 className="text-2xl font-black">Teams</h3>
                <div className="mt-5 space-y-3">
                  {teams.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/55">No teams found for this season.</div>
                  ) : null}
                  {teams.map((team) => {
                    const rosterCount = players.filter((player) => player.team_id === team.id).length + 1;
                    return (
                      <div key={team.id}>
                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-3">
                          <img src={getTeamImageUrl(team.code)} alt="" className="h-10 w-12 rounded-lg object-cover" />
                          <div>
                            <p className="font-bold">{team.country}</p>
                            <p className="text-sm text-white/55">Captain {team.captain_name}</p>
                          </div>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/65">
                          {rosterCount} members
                        </span>
                        </div>
                        <div className="mt-2 rounded-2xl border border-white/10 bg-black/10 p-3 text-sm text-white/60">
                        <p className="font-semibold text-white/80">Roster</p>
                        <p className="mt-1">Captain: {team.captain_name} • @{team.captain_discord}</p>
                        {players.filter((player) => player.team_id === team.id).length > 0 ? (
                          <div className="mt-2 space-y-1">
                            {players.filter((player) => player.team_id === team.id).map((player) => (
                              <p key={player.id}>
                                {player.role}: {player.roblox_username} • @{player.discord_username}
                              </p>
                            ))}
                          </div>
                        ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-[#0B1712] p-6">
                <h3 className="text-2xl font-black">Archived Player Stats</h3>
                <div className="mt-5 max-h-[720px] space-y-3 overflow-y-auto pr-1">
                  {leaderboard.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/55">No player stats found for this season.</div>
                  ) : null}
                  {leaderboard.map((player, index) => (
                    <div key={`${player.player_key}-${player.team}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">#{index + 1}</p>
                          <p className="text-lg font-black">{player.player_username}</p>
                          <p className="text-sm text-white/55">{player.team} • {player.matches_played} matches</p>
                        </div>
                        <p className="text-2xl font-black text-emerald-300">{player.kills + player.ape_kills + player.assists + player.receives + player.aces + player.blocks}</p>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-white/65 md:grid-cols-6">
                        <span>K {player.kills}</span>
                        <span>Ape {player.ape_kills}</span>
                        <span>Ast {player.assists}</span>
                        <span>Rec {player.receives}</span>
                        <span>Aces {player.aces}</span>
                        <span>Blk {player.blocks}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#0B1712] p-6">
              <h3 className="text-2xl font-black">Match History</h3>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {finishedMatches.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/55">No finished matches found for this season.</div>
                ) : null}
                {finishedMatches.map((match) => {
                  const { homePoints, awayPoints } = calculatePointsTotals(match);
                  return (
                    <div key={match.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                        {formatDate(match.match_date)} {match.stage ? `• ${match.stage}` : ""}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-4">
                        <span className="font-bold">{match.home_country}</span>
                        <span className="text-xl font-black">{match.home_score}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-4">
                        <span className="font-bold">{match.away_country}</span>
                        <span className="text-xl font-black">{match.away_score}</span>
                      </div>
                      <p className="mt-3 text-sm text-white/50">Points: {homePoints} - {awayPoints}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
