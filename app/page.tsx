"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ChevronDown, Trophy } from "lucide-react";

type Country = {
  name: string;
  code: string;
};

type Team = {
  id: number;
  country: string;
  code: string;
  captain_name: string;
  captain_discord: string;
  captain_roblox_id: string;
  approved: boolean;
  approved_at?: string | null;
  created_at: string;
};

type MatchStatus = "Scheduled" | "Live" | "Finished";

type MatchRow = {
  id: number;
  home_country: string;
  away_country: string;
  stage: string | null;
  match_date: string;
  match_time: string;
  status: MatchStatus;
  home_score: number;
  away_score: number;
  winner_country: string | null;
  referee_id: number | null;
  media_id: number | null;
  created_at: string;
};

type SelectOption = {
  label: string;
  value: string;
  imageUrl?: string;
  badgeClassName?: string;
};

type MatchDraft = {
  status: MatchStatus;
  stage: string;
  match_date: string;
  match_time: string;
  home_score: number;
  away_score: number;
  referee_id: number | null;
  media_id: number | null;
};

type TeamPlayerRole = "Vice Captain" | "Player";

type TeamPlayer = {
  id: number;
  team_id: number;
  roblox_username: string;
  roblox_user_id: string;
  discord_username: string;
  role: TeamPlayerRole;
  created_at: string;
};

type StaffRole = "Referee" | "Media";

type StaffApplication = {
  id: number;
  role: StaffRole;
  roblox_username: string;
  discord_username: string;
  roblox_user_id: string;
  commitment_confirmed: boolean;
  rulebook_confirmed: boolean;
  approved: boolean;
  approved_at?: string | null;
  created_at: string;
};

const COUNTRIES: Country[] = [
  { name: "Argentina", code: "ar" },
  { name: "Australia", code: "au" },
  { name: "Brazil", code: "br" },
  { name: "Canada", code: "ca" },
  { name: "Chile", code: "cl" },
  { name: "China", code: "cn" },
  { name: "Colombia", code: "co" },
  { name: "Cuba", code: "cu" },
  { name: "Dominican Republic", code: "do" },
  { name: "Egypt", code: "eg" },
  { name: "France", code: "fr" },
  { name: "Germany", code: "de" },
  { name: "Iran", code: "ir" },
  { name: "Italy", code: "it" },
  { name: "Japan", code: "jp" },
  { name: "Mexico", code: "mx" },
  { name: "Netherlands", code: "nl" },
  { name: "Peru", code: "pe" },
  { name: "Philippines", code: "ph" },
  { name: "Poland", code: "pl" },
  { name: "Portugal", code: "pt" },
  { name: "Russia", code: "ru" },
  { name: "Serbia", code: "rs" },
  { name: "Slovenia", code: "si" },
  { name: "South Korea", code: "kr" },
  { name: "Spain", code: "es" },
  { name: "Thailand", code: "th" },
  { name: "Turkey", code: "tr" },
  { name: "Ukraine", code: "ua" },
  { name: "United Kingdom", code: "gb" },
  { name: "United States", code: "us" },
  { name: "Venezuela", code: "ve" },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getCountryByName(name: string) {
  return (
    COUNTRIES.find(
      (country) => normalizeText(country.name) === normalizeText(name),
    ) || null
  );
}

function getFlagUrl(code: string) {
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

function getStatusBadgeClass(status: MatchStatus) {
  if (status === "Live") return "border-red-400/20 bg-red-400/10 text-red-300";
  if (status === "Finished") return "border-white/15 bg-white/10 text-white";
  return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
}

function scrollToSection(id: string) {
  const element = document.getElementById(id);
  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  setTimeout(() => {
    const headerOffset = 96;
    window.scrollBy({
      top: -headerOffset,
      behavior: "smooth",
    });
  }, 50);
}

function Avatar({
  robloxUserId,
  name,
}: {
  robloxUserId: string;
  name: string;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAvatar() {
      if (!/^\d+$/.test(robloxUserId.trim())) {
        setAvatarUrl(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(
          `/api/roblox-avatar?userId=${encodeURIComponent(robloxUserId.trim())}`,
          { cache: "no-store" },
        );

        const data = await response.json();

        if (!cancelled) {
          setAvatarUrl(data?.imageUrl ?? null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setAvatarUrl(null);
          setLoading(false);
        }
      }
    }

    loadAvatar();

    return () => {
      cancelled = true;
    };
  }, [robloxUserId]);

  if (loading) {
    return (
      <div className="h-10 w-10 animate-pulse rounded-full border border-white/10 bg-white/5" />
    );
  }

  if (!avatarUrl) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold text-white/70">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={`${name} Roblox avatar`}
      className="h-10 w-10 rounded-full border border-white/10 object-cover"
      onError={() => setAvatarUrl(null)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

function SelectPicker({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((option) => option.value === value) || null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition duration-200 hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
      >
        <span className="flex min-w-0 items-center gap-3">
          {selected?.imageUrl ? (
            <img
              src={selected.imageUrl}
              alt={`${selected.label} icon`}
              className="h-5 w-7 rounded-sm object-cover"
            />
          ) : null}

          {selected?.badgeClassName ? (
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${selected.badgeClassName}`}
            >
              {selected.label}
            </span>
          ) : (
            <span
              className={`truncate ${selected ? "text-white" : "text-white/45"}`}
            >
              {selected ? selected.label : placeholder}
            </span>
          )}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/60 transition duration-200 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      {open ? (
        <div className="absolute z-40 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#081712] p-2 shadow-2xl shadow-black/40">
          {options.length === 0 ? (
            <div className="px-3 py-3 text-sm text-white/50">
              No options available
            </div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-white transition duration-150 hover:bg-emerald-400/10 active:scale-[0.99]"
              >
                {option.imageUrl ? (
                  <img
                    src={option.imageUrl}
                    alt={`${option.label} icon`}
                    className="h-5 w-7 rounded-sm object-cover"
                  />
                ) : null}

                {option.badgeClassName ? (
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${option.badgeClassName}`}
                  >
                    {option.label}
                  </span>
                ) : (
                  <span>{option.label}</span>
                )}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function AnimatedNavButton({
  label,
  targetId,
}: {
  label: string;
  targetId: string;
}) {
  return (
    <NavScrollLink
      label={label}
      targetId={targetId}
      className="rounded-xl px-2 py-1 text-sm text-white/80 transition duration-200 hover:-translate-y-0.5 hover:bg-white/5 hover:text-white active:translate-y-0.5"
    />
  );
}

function TeamCard({
  team,
  players,
  expanded,
  onToggle,
}: {
  team: Team;
  players: TeamPlayer[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 transition duration-200 hover:-translate-y-1 hover:bg-white/[0.07]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full rounded-[1rem] text-left focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        aria-expanded={expanded}
        aria-label={expanded ? `Hide roster for ${team.country}` : `View roster for ${team.country}`}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0D1F18]">
            <img
              src={getFlagUrl(team.code)}
              alt={`${team.country} flag`}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold">{team.country}</h3>
            <div className="mt-2 flex items-center gap-3 text-sm text-white/70">
              <Avatar
                robloxUserId={team.captain_roblox_id}
                name={team.captain_name}
              />
              <div className="min-w-0">
                <p className="truncate">Captain {team.captain_name}</p>
                <p className="truncate text-white/55">
                  @{team.captain_discord}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-emerald-300">
              {expanded ? "Hide roster" : "View roster"} • {players.length + 1}{" "}
              members
            </p>
          </div>
        </div>
      </button>

      {expanded ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#081712] p-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Team Roster
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Avatar
                robloxUserId={team.captain_roblox_id}
                name={team.captain_name}
              />
              <div className="min-w-0">
                <p className="font-semibold text-white">{team.captain_name}</p>
                <p className="text-sm text-white/60">@{team.captain_discord}</p>
              </div>
              <span className="ml-auto rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Captain
              </span>
            </div>

            {players.length === 0 ? (
              <p className="text-sm text-white/55">
                No extra players added yet.
              </p>
            ) : (
              players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <Avatar
                    robloxUserId={player.roblox_user_id}
                    name={player.roblox_username}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      {player.roblox_username}
                    </p>
                    <p className="text-sm text-white/60">
                      @{player.discord_username}
                    </p>
                  </div>
                  <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/75">
                    {player.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ScheduleCard({
  match,
  getStaffById,
}: {
  match: MatchRow;
  getStaffById: (staffId: number | null) => StaffApplication | null;
}) {
  const homeCountry = getCountryByName(match.home_country);
  const awayCountry = getCountryByName(match.away_country);
  const referee = getStaffById(match.referee_id);
  const media = getStaffById(match.media_id);
  const resultStyles = getMatchResultStyles(match);

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-[#0B1712] p-5 md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {homeCountry ? (
              <img
                src={getFlagUrl(homeCountry.code)}
                alt={`${match.home_country} flag`}
                className="h-5 w-7 rounded-sm object-cover"
              />
            ) : null}
            <span className={`truncate ${match.status === "Finished" ? resultStyles.homeClass : "text-white"}`}>
              {match.home_country}
            </span>
          </div>
          <p className="my-2 text-xs uppercase tracking-[0.2em] text-white/40">
            vs
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold">
            {awayCountry ? (
              <img
                src={getFlagUrl(awayCountry.code)}
                alt={`${match.away_country} flag`}
                className="h-5 w-7 rounded-sm object-cover"
              />
            ) : null}
            <span className={`truncate ${match.status === "Finished" ? resultStyles.awayClass : "text-white"}`}>
              {match.away_country}
            </span>
          </div>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${getStatusBadgeClass(match.status)}`}
        >
          {match.status}
        </span>
      </div>
      {match.stage ? (
        <div className="mt-4">
          <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            {match.stage}
          </span>
        </div>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/75">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            Date
          </p>
          <p className="mt-1 font-medium">{formatDate(match.match_date)}</p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            Time
          </p>
          <p className="mt-1 font-medium">{match.match_time} BRT</p>
        </div>
      </div>

      {match.status === "Finished" ? (
        <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-3 text-sm text-white/75">
          Final score:{" "}
          <span className="font-semibold text-white">
            {match.home_score}-{match.away_score}
          </span>
        </div>
      ) : null}
      {referee || media ? (
        <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            Match Staff
          </p>

          <div className="mt-3 space-y-3">
            {referee ? (
              <div className="flex items-center gap-3">
                <Avatar
                  robloxUserId={referee.roblox_user_id}
                  name={referee.roblox_username}
                />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Referee: {referee.roblox_username}
                  </p>
                  <p className="text-xs text-white/60">
                    @{referee.discord_username}
                  </p>
                </div>
              </div>
            ) : null}

            {media ? (
              <div className="flex items-center gap-3">
                <Avatar
                  robloxUserId={media.roblox_user_id}
                  name={media.roblox_username}
                />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Media: {media.roblox_username}
                  </p>
                  <p className="text-xs text-white/60">
                    @{media.discord_username}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NavScrollLink({
  label,
  targetId,
  className = "",
}: {
  label: string;
  targetId: string;
  className?: string;
}) {
  return (
    <a
      href={`#${targetId}`}
      onClick={(e) => {
        e.preventDefault();
        scrollToSection(targetId);
      }}
      className={className}
    >
      {label}
    </a>
  );
}

function getMatchResultStyles(match: MatchRow) {
  const homeWon = match.home_score > match.away_score;
  const awayWon = match.away_score > match.home_score;

  return {
    homeClass:
      homeWon
        ? "font-bold text-emerald-300"
        : awayWon
          ? "font-semibold text-red-300"
          : "font-semibold text-white",
    awayClass:
      awayWon
        ? "font-bold text-emerald-300"
        : homeWon
          ? "font-semibold text-red-300"
          : "font-semibold text-white",
  };
}

function StandingsCard({
  team,
}: {
  team: {
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
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-[#0B1712] p-5 md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-sm font-bold text-emerald-300">
            {team.position}
          </div>
          <div className="flex items-center gap-3">
            <img
              src={getFlagUrl(team.code)}
              alt={`${team.country} flag`}
              className="h-5 w-7 rounded-sm object-cover"
            />
            <span className="font-semibold text-white">{team.country}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
          <Trophy className="h-3.5 w-3.5" />
          {team.points} pts
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-white/75">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            W-L
          </p>
          <p className="mt-1 font-semibold text-white">
            {team.wins}-{team.losses}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            Sets
          </p>
          <p className="mt-1 font-semibold text-white">
            {team.setsWon}-{team.setsLost}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            SD
          </p>
          <p className="mt-1 font-semibold text-white">
            {team.setDiff > 0 ? `+${team.setDiff}` : team.setDiff}
          </p>
        </div>
      </div>
    </div>
  );
}

function getStaffRoleLabel(role: StaffRole) {
  return role === "Referee" ? "Referee" : "Media";
}

export default function SAVLSitePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [adminNotice, setAdminNotice] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | MatchStatus>("All");
  const [filterStage, setFilterStage] = useState("All");
  const [adminLogged, setAdminLogged] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [matchDrafts, setMatchDrafts] = useState<Record<number, MatchDraft>>(
    {},
  );
  const [submittingTeam, setSubmittingTeam] = useState(false);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [selectedAdminTeamId, setSelectedAdminTeamId] = useState<number | null>(
    null,
  );
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [togglingRegistrations, setTogglingRegistrations] = useState(false);

  const [playerForm, setPlayerForm] = useState({
    team_id: "",
    roblox_username: "",
    roblox_user_id: "",
    discord_username: "",
    role: "Player" as TeamPlayerRole,
  });

  const [registerForm, setRegisterForm] = useState({
    country: "",
    captain_name: "",
    captain_discord: "",
    captain_roblox_id: "",
  });

  const [registerConfirmations, setRegisterConfirmations] = useState({
    captain_commitment: false,
    in_discord_server: false,
  });

  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const [adminTeamForm, setAdminTeamForm] = useState({
    country: "",
    captain_name: "",
    captain_discord: "",
    captain_roblox_id: "",
  });

  const [matchForm, setMatchForm] = useState({
    home_country: "",
    away_country: "",
    stage: "",
    match_date: "",
    match_time: "",
    status: "Scheduled" as MatchStatus,
    home_score: "0",
    away_score: "0",
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: null | (() => Promise<void> | void);
  }>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    onConfirm: null,
  });

  const [staffApplications, setStaffApplications] = useState<StaffApplication[]>(
    [],
  );

  const [submittingStaffApplication, setSubmittingStaffApplication] =
    useState(false);

  const [staffRegisterForm, setStaffRegisterForm] = useState({
    role: "" as "" | StaffRole,
    roblox_username: "",
    discord_username: "",
    roblox_user_id: "",
  });

  const [staffConfirmations, setStaffConfirmations] = useState({
    commitment_confirmed: false,
    rulebook_confirmed: false,
  });

  async function reloadTeams() {
    if (!supabase) return;

    const result = await supabase
      .from("teams")
      .select("*")
      .order("country", { ascending: true });
    if (!result.error && result.data) {
      setTeams(result.data as Team[]);
    }
  }

  function showSuccessDialog(title: string, message: string) {
    setSuccessDialog({
      open: true,
      title,
      message,
    });
  }

  async function handleAdminLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) return;

    const { error } = await supabase.auth.signInWithPassword({
      email: adminEmail.trim(),
      password: adminPassword,
    });

    if (error) {
      showNotice(error.message, true);
      return;
    }

    setAdminLogged(true);
    setAdminEmail("");
    setAdminPassword("");
    await reloadTeams();
    await reloadMatches();
    await reloadTeamPlayers();
    await reloadLeagueSettings();
    await reloadStaffApplications();
    showNotice("Admin unlocked.", true);
  }

  async function handleAdminLogout() {
    if (!supabase) return;

    await supabase.auth.signOut();
    setAdminLogged(false);
    await reloadTeams();
    await reloadMatches();
    await reloadTeamPlayers();
    await reloadLeagueSettings();
    await reloadStaffApplications();
    showNotice("Admin locked.", true);
  }

  async function reloadMatches() {
    if (!supabase) return;

    const result = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: true })
      .order("match_time", { ascending: true });

    if (!result.error && result.data) {
      const rows = result.data as MatchRow[];
      setMatches(rows);
      setMatchDrafts(
        Object.fromEntries(
          rows.map((match) => [
            match.id,
            {
              status: match.status,
              stage: match.stage ?? "",
              match_date: match.match_date,
              match_time: match.match_time,
              home_score: match.home_score,
              away_score: match.away_score,
              referee_id: match.referee_id ?? null,
              media_id: match.media_id ?? null,
            }
          ]),
        ),
      );
    }
  }

  useEffect(() => {
    async function loadData() {
      if (!supabase) {
        setLoading(false);
        setNotice("Configure Supabase to enable submissions.");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setAdminLogged(!!session);

      await Promise.all([
        reloadTeams(),
        reloadMatches(),
        reloadTeamPlayers(),
        reloadLeagueSettings(),
        reloadStaffApplications(),
      ]);
      setLoading(false);
    }

    loadData();
  }, []);

  const availableCountries = useMemo(() => {
    const used = new Set(teams.map((team) => normalizeText(team.country)));
    return COUNTRIES.filter(
      (country) => !used.has(normalizeText(country.name)),
    );
  }, [teams]);

  const approvedTeams = useMemo(() => {
    return teams.filter((team) => team.approved);
  }, [teams]);

  const pendingTeams = useMemo(() => {
    return teams.filter((team) => !team.approved);
  }, [teams]);

  const statusOptions = useMemo<SelectOption[]>(() => {
    return [
      {
        label: "Scheduled",
        value: "Scheduled",
        badgeClassName: getStatusBadgeClass("Scheduled"),
      },
      {
        label: "Live",
        value: "Live",
        badgeClassName: getStatusBadgeClass("Live"),
      },
      {
        label: "Finished",
        value: "Finished",
        badgeClassName: getStatusBadgeClass("Finished"),
      },
    ];
  }, []);

  const countryOptions = useMemo<SelectOption[]>(() => {
    return availableCountries.map((country) => ({
      label: country.name,
      value: country.name,
      imageUrl: getFlagUrl(country.code),
    }));
  }, [availableCountries]);

  const registeredCountryOptions = useMemo<SelectOption[]>(() => {
    return approvedTeams.map((team) => ({
      label: team.country,
      value: team.country,
      imageUrl: getFlagUrl(team.code),
    }));
  }, [approvedTeams]);

  const availableStages = useMemo(() => {
    const stages = Array.from(
      new Set(
        matches
          .map((match) => match.stage?.trim())
          .filter((stage): stage is string => Boolean(stage)),
      ),
    );

    return stages.sort((a, b) => a.localeCompare(b));
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const statusOk = filterStatus === "All" || match.status === filterStatus;
      const stageOk =
        filterStage === "All" || (match.stage?.trim() ?? "") === filterStage;
      return statusOk && stageOk;
    });
  }, [filterStatus, filterStage, matches]);

  const standings = useMemo(() => {
    const map = new Map<
      string,
      {
        country: string;
        code: string;
        played: number;
        wins: number;
        losses: number;
        setsWon: number;
        setsLost: number;
        setDiff: number;
        points: number;
      }
    >();

    for (const team of approvedTeams) {
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
  }, [approvedTeams, matches]);

  const approvedStaff = useMemo(() => {
    return staffApplications.filter((staff) => staff.approved);
  }, [staffApplications]);

  const pendingStaff = useMemo(() => {
    return staffApplications.filter((staff) => !staff.approved);
  }, [staffApplications]);

  const approvedReferees = useMemo(() => {
    return approvedStaff.filter((staff) => staff.role === "Referee");
  }, [approvedStaff]);

  const approvedMediaMembers = useMemo(() => {
    return approvedStaff.filter((staff) => staff.role === "Media");
  }, [approvedStaff]);

  const staffRoleOptions: SelectOption[] = [
    { label: "Referee", value: "Referee" },
    { label: "Media", value: "Media" },
  ];

  const refereeOptions = useMemo<SelectOption[]>(() => {
    return approvedReferees.map((staff) => ({
      label: `${staff.roblox_username} (@${staff.discord_username})`,
      value: String(staff.id),
    }));
  }, [approvedReferees]);

  const mediaOptions = useMemo<SelectOption[]>(() => {
    return approvedMediaMembers.map((staff) => ({
      label: `${staff.roblox_username} (@${staff.discord_username})`,
      value: String(staff.id),
    }));
  }, [approvedMediaMembers]);

  function showNotice(text: string, isAdmin = false) {
    if (isAdmin) {
      setAdminNotice(text);
      window.setTimeout(() => setAdminNotice(""), 3500);
      return;
    }

    setNotice(text);
    window.setTimeout(() => setNotice(""), 3500);
  }

  function handleMatchFormChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setMatchForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateMatchDraft(matchId: number, patch: Partial<MatchDraft>) {
    setMatchDrafts((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        ...patch,
      },
    }));
  }

  function getPlayersByTeam(teamId: number) {
    return teamPlayers.filter((player) => player.team_id === teamId);
  }

  function getStaffById(staffId: number | null) {
    if (!staffId) return null;
    return staffApplications.find((staff) => staff.id === staffId) ?? null;
  }

  function openConfirmDialog({
    title,
    message,
    confirmLabel = "Confirm",
    onConfirm,
  }: {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void> | void;
  }) {
    setConfirmDialog({
      open: true,
      title,
      message,
      confirmLabel,
      onConfirm,
    });
  }

  const roleOptions: SelectOption[] = [
    { label: "Vice Captain", value: "Vice Captain" },
    { label: "Player", value: "Player" },
  ];

  async function handleApproveStaffApplication(staffId: number) {
    if (!supabase) return;

    const { error } = await supabase
      .from("staff_applications")
      .update({
        approved: true,
        approved_at: new Date().toISOString(),
      })
      .eq("id", staffId);

    if (error) {
      showNotice(error.message, true);
      return;
    }

    await reloadStaffApplications();
    showNotice("Staff application approved successfully.", true);
  }

  async function handleDeleteStaffApplication(staffId: number) {
    if (!supabase) return;

    const { error } = await supabase
      .from("staff_applications")
      .delete()
      .eq("id", staffId);

    if (error) {
      showNotice(error.message, true);
      return;
    }

    await reloadStaffApplications();
    await reloadMatches();
    showNotice("Staff application removed.", true);
  }

  async function handleApproveTeam(teamId: number) {
    if (!supabase) return;

    const { error } = await supabase
      .from("teams")
      .update({
        approved: true,
        approved_at: new Date().toISOString(),
      })
      .eq("id", teamId);

    if (error) {
      showNotice(error.message, true);
      return;
    }

    await reloadTeams();
    showNotice("Team approved successfully.", true);
  }

  async function submitTeam(
    payload: {
      country: string;
      captain_name: string;
      captain_discord: string;
      captain_roblox_id: string;
    },
    isAdmin = false,
  ) {
    if (!supabase) {
      showNotice("Supabase is not configured yet.", isAdmin);
      return false;
    }

    if (!isAdmin && !registrationsOpen) {
      showNotice("Team registrations are currently closed.", false);
      return false;
    }

    const selectedCountry = getCountryByName(payload.country);
    if (!selectedCountry) {
      showNotice("Select a valid country.", isAdmin);
      return false;
    }

    if (
      teams.some(
        (team) =>
          normalizeText(team.country) === normalizeText(payload.country),
      )
    ) {
      showNotice("This country is already registered.", isAdmin);
      return false;
    }

    const cleanCaptain = payload.captain_name.trim();
    const cleanDiscord = payload.captain_discord.trim().replace(/^@/, "");
    const cleanRobloxReference = payload.captain_roblox_id.trim();

    if (!/^\d+$/.test(cleanRobloxReference)) {
      showNotice("Enter a valid Roblox User ID (numbers only).", isAdmin);
      return false;
    }

    if (!cleanCaptain || !cleanDiscord || !cleanRobloxReference) {
      showNotice("Fill in all fields before submitting.", isAdmin);
      return false;
    }

    const { error } = await supabase.from("teams").insert({
      country: selectedCountry.name,
      code: selectedCountry.code,
      captain_name: cleanCaptain,
      captain_discord: cleanDiscord,
      captain_roblox_id: cleanRobloxReference,
      approved: isAdmin,
      approved_at: isAdmin ? new Date().toISOString() : null,
    });

    if (error) {
      showNotice(error.message, isAdmin);
      return false;
    }

    await reloadTeams();

    if (isAdmin) {
      showNotice(`${selectedCountry.name} registered successfully.`, true);
    } else {
      showSuccessDialog(
        "Registration Submitted",
        `${selectedCountry.name} has been submitted successfully and is now awaiting admin approval.`,
      );
    }

    return true;
  }

  async function handleStaffRegisterSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!supabase) {
      showNotice("Supabase is not configured yet.");
      return;
    }

    const cleanRole = staffRegisterForm.role;
    const cleanRobloxUsername = staffRegisterForm.roblox_username.trim();
    const cleanDiscord = staffRegisterForm.discord_username.trim().replace(/^@/, "");
    const cleanRobloxUserId = staffRegisterForm.roblox_user_id.trim();

    if (
      !cleanRole ||
      !cleanRobloxUsername ||
      !cleanDiscord ||
      !cleanRobloxUserId
    ) {
      showNotice("Fill in all Referee / Media fields before submitting.");
      return;
    }

    if (!/^\d+$/.test(cleanRobloxUserId)) {
      showNotice("Enter a valid Roblox User ID (numbers only).");
      return;
    }

    if (
      !staffConfirmations.commitment_confirmed ||
      !staffConfirmations.rulebook_confirmed
    ) {
      showNotice("You must accept both confirmations before submitting.");
      return;
    }

    setSubmittingStaffApplication(true);

    const { error } = await supabase.from("staff_applications").insert({
      role: cleanRole,
      roblox_username: cleanRobloxUsername,
      discord_username: cleanDiscord,
      roblox_user_id: cleanRobloxUserId,
      commitment_confirmed: true,
      rulebook_confirmed: true,
      approved: false,
      approved_at: null,
    });

    setSubmittingStaffApplication(false);

    if (error) {
      showNotice(error.message);
      return;
    }

    await reloadStaffApplications();

    setStaffRegisterForm({
      role: "",
      roblox_username: "",
      discord_username: "",
      roblox_user_id: "",
    });

    setStaffConfirmations({
      commitment_confirmed: false,
      rulebook_confirmed: false,
    });

    showSuccessDialog(
      "Application Submitted",
      `Your ${cleanRole} application has been submitted successfully and is now awaiting admin approval.`,
    );
  }

  async function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!registrationsOpen) {
      showNotice("Team registrations are currently closed.");
      return;
    }

    const { country, captain_name, captain_discord, captain_roblox_id } =
      registerForm;

    if (
      !country ||
      !captain_name.trim() ||
      !captain_discord.trim() ||
      !captain_roblox_id.trim()
    ) {
      showNotice("Fill in all fields before submitting.");
      return;
    }

    if (
      !registerConfirmations.captain_commitment ||
      !registerConfirmations.in_discord_server
    ) {
      showNotice(
        "You must confirm captain commitment and Discord server presence before submitting.",
      );
      return;
    }

    setSubmittingTeam(true);
    const ok = await submitTeam(registerForm);
    setSubmittingTeam(false);

    if (ok) {
      setRegisterForm({
        country: "",
        captain_name: "",
        captain_discord: "",
        captain_roblox_id: "",
      });

      setRegisterConfirmations({
        captain_commitment: false,
        in_discord_server: false,
      });
    }
  }

  async function handleAdminAddTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { country, captain_name, captain_discord, captain_roblox_id } =
      adminTeamForm;
    if (
      !country ||
      !captain_name.trim() ||
      !captain_discord.trim() ||
      !captain_roblox_id.trim()
    ) {
      showNotice("Fill in all team fields.", true);
      return;
    }

    const ok = await submitTeam(adminTeamForm, true);
    if (ok) {
      setAdminTeamForm({
        country: "",
        captain_name: "",
        captain_discord: "",
        captain_roblox_id: "",
      });
    }
  }

  async function handleDeleteTeam(teamId: number) {
    if (!supabase) return;

    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (error) {
      showNotice(error.message, true);
      return;
    }

    await reloadTeams();
    showNotice("Team removed.", true);
  }

  async function handleCreateMatch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      showNotice("Supabase is not configured yet.", true);
      return;
    }

    if (
      !matchForm.home_country ||
      !matchForm.away_country ||
      !matchForm.stage.trim() ||
      !matchForm.match_date ||
      !matchForm.match_time
    ) {
      showNotice("Fill in all match fields.", true);
      return;
    }

    if (matchForm.home_country === matchForm.away_country) {
      showNotice("Home and away teams must be different.", true);
      return;
    }

    const homeScore = Number(matchForm.home_score);
    const awayScore = Number(matchForm.away_score);
    const winnerCountry =
      matchForm.status === "Finished"
        ? homeScore > awayScore
          ? matchForm.home_country
          : awayScore > homeScore
            ? matchForm.away_country
            : null
        : null;

    const { error } = await supabase.from("matches").insert({
      home_country: matchForm.home_country,
      away_country: matchForm.away_country,
      stage: matchForm.stage.trim(),
      match_date: matchForm.match_date,
      match_time: matchForm.match_time,
      status: matchForm.status,
      home_score: homeScore,
      away_score: awayScore,
      winner_country: winnerCountry,
      referee_id: null,
      media_id: null,
    });

    if (error) {
      showNotice(error.message, true);
      return;
    }

    await reloadMatches();
    setMatchForm({
      home_country: "",
      away_country: "",
      stage: "",
      match_date: "",
      match_time: "",
      status: "Scheduled",
      home_score: "0",
      away_score: "0",
    });
    showNotice("Match created successfully.", true);
  }

  async function saveMatchDraft(matchId: number) {
    if (!supabase) return;

    const current = matches.find((match) => match.id === matchId);
    const draft = matchDrafts[matchId];
    if (!current || !draft) return;

    const winnerCountry =
      draft.status === "Finished"
        ? draft.home_score > draft.away_score
          ? current.home_country
          : draft.away_score > draft.home_score
            ? current.away_country
            : null
        : null;

    const { error } = await supabase
      .from("matches")
      .update({
        status: draft.status,
        stage: draft.stage,
        match_date: draft.match_date,
        match_time: draft.match_time,
        home_score: draft.home_score,
        away_score: draft.away_score,
        winner_country: winnerCountry,
        referee_id: draft.referee_id,
        media_id: draft.media_id,
      })
      .eq("id", matchId);

    if (error) {
      showNotice(error.message, true);
      return;
    }

    await reloadMatches();
    showNotice("Match updated.", true);
  }

  async function handleDeleteMatch(matchId: number) {
    if (!supabase) return;

    const { error } = await supabase.from("matches").delete().eq("id", matchId);
    if (error) {
      showNotice(error.message, true);
      return;
    }

    await reloadMatches();
    showNotice("Match removed.", true);
  }

  async function reloadTeamPlayers() {
    if (!supabase) return;

    const result = await supabase
      .from("team_players")
      .select("*")
      .order("created_at", { ascending: true });

    if (!result.error && result.data) {
      setTeamPlayers(result.data as TeamPlayer[]);
    }
  }

  async function reloadStaffApplications() {
    if (!supabase) return;

    const result = await supabase
      .from("staff_applications")
      .select("*")
      .order("created_at", { ascending: true });

    if (!result.error && result.data) {
      setStaffApplications(result.data as StaffApplication[]);
    }
  }

  async function handleAddPlayer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) return;

    const cleanTeamId = Number(playerForm.team_id);
    const cleanUsername = playerForm.roblox_username.trim();
    const cleanUserId = playerForm.roblox_user_id.trim();
    const cleanDiscord = playerForm.discord_username.trim().replace(/^@/, "");

    if (
      !cleanTeamId ||
      !cleanUsername ||
      !cleanUserId ||
      !cleanDiscord ||
      !playerForm.role
    ) {
      showNotice("Fill in all player fields.", true);
      return;
    }

    if (!/^\d+$/.test(cleanUserId)) {
      showNotice("Enter a valid Roblox User ID (numbers only).", true);
      return;
    }

    const payload = {
      team_id: cleanTeamId,
      roblox_username: cleanUsername,
      roblox_user_id: cleanUserId,
      discord_username: cleanDiscord,
      role: playerForm.role,
    };

    const { error } = await supabase.from("team_players").insert(payload);

    if (error) {
      showNotice(error.message, true);
      return;
    }

    await reloadTeamPlayers();

    setPlayerForm({
      team_id: "",
      roblox_username: "",
      roblox_user_id: "",
      discord_username: "",
      role: "Player",
    });

    showNotice("Player added successfully.", true);
  }

  async function handleUpdatePlayer(
    playerId: number,
    updated: Partial<TeamPlayer>,
  ) {
    if (!supabase) return;

    const cleanedUpdate: Partial<TeamPlayer> = { ...updated };

    if (typeof cleanedUpdate.roblox_username === "string") {
      cleanedUpdate.roblox_username = cleanedUpdate.roblox_username.trim();
      if (!cleanedUpdate.roblox_username) return;
    }

    if (typeof cleanedUpdate.discord_username === "string") {
      cleanedUpdate.discord_username = cleanedUpdate.discord_username
        .trim()
        .replace(/^@/, "");
      if (!cleanedUpdate.discord_username) return;
    }

    if (typeof cleanedUpdate.roblox_user_id === "string") {
      cleanedUpdate.roblox_user_id = cleanedUpdate.roblox_user_id.trim();
      if (!/^\d+$/.test(cleanedUpdate.roblox_user_id)) return;
    }

    const { error } = await supabase
      .from("team_players")
      .update(cleanedUpdate)
      .eq("id", playerId);

    if (error) {
      showNotice(error.message, true);
      return;
    }

    await reloadTeamPlayers();
    showNotice("Player updated successfully.", true);
  }

  async function handleDeletePlayer(playerId: number) {
    if (!supabase) return;

    const { error } = await supabase
      .from("team_players")
      .delete()
      .eq("id", playerId);

    if (error) {
      showNotice(error.message, true);
      return;
    }

    await reloadTeamPlayers();
    showNotice("Player removed.", true);
  }

  async function reloadLeagueSettings() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("league_settings")
      .select("registrations_open")
      .eq("id", 1)
      .single();

    if (!error && data) {
      setRegistrationsOpen(data.registrations_open);
    }
  }

  async function handleToggleRegistrations() {
    if (!supabase) return;

    setTogglingRegistrations(true);

    const nextValue = !registrationsOpen;

    const { error } = await supabase
      .from("league_settings")
      .update({
        registrations_open: nextValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    setTogglingRegistrations(false);

    if (error) {
      showNotice(error.message, true);
      return;
    }

    setRegistrationsOpen(nextValue);
    showNotice(
      nextValue
        ? "Team registrations are now open."
        : "Team registrations are now closed.",
      true,
    );
  }

  return (
    <div className="min-h-screen bg-[#03110D] text-white selection:bg-emerald-400/20 selection:text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#03110D]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
              <Image
                src="/savl-logo.jpg"
                alt="SAVL logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <p className="truncate text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300 md:text-base">
              South America Volleyball League
            </p>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <AnimatedNavButton label="Home" targetId="home" />
            <AnimatedNavButton label="Teams" targetId="teams" />
            <AnimatedNavButton label="Schedule" targetId="schedule" />
            <AnimatedNavButton label="Standings" targetId="standings" />
            <AnimatedNavButton label="Register" targetId="register" />
            <AnimatedNavButton label="Admin" targetId="admin" />
          </nav>
        </div>
      </header>

      <main>
        {/* CORREÇÃO: Adicionado o id="home" para o botão de scroll funcionar */}
        <section id="home" className="relative overflow-hidden scroll-mt-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.22),transparent_40%)]" />

          <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
            <div>
              <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                Roblox Volleyball 4.2 League
              </span>

              <h1 className="mt-6 text-5xl font-black leading-none tracking-tight md:text-7xl">
                South America
                <span className="block text-emerald-300">
                  Volleyball League
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-white/70 md:text-lg">
                SAVL is a Volleyball 4.2 league created by xImTutu, focused on
                organized fixtures and a clean competitive experience for
                players, captains, and staff.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <NavScrollLink
                  label="Register Team"
                  targetId="register"
                  className="rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-black transition duration-200 hover:-translate-y-1 hover:scale-[1.02] active:translate-y-0.5"
                />

                <NavScrollLink
                  label="View Matches"
                  targetId="schedule"
                  className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-semibold transition duration-200 hover:-translate-y-1 hover:bg-white/10 active:translate-y-0.5"
                />
              </div>

              <div className="mt-10 grid max-w-lg grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-black">6v6</p>
                  <p className="text-sm text-white/60">Format</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-black">BRT</p>
                  <p className="text-sm text-white/60">Timezone</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-black">{approvedTeams.length}</p>
                  <p className="text-sm text-white/60">Registered</p>
                </div>
              </div>

              {notice ? (
                <p className="mt-5 text-sm text-emerald-300">{notice}</p>
              ) : null}
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-8 shadow-2xl shadow-black/30">
                <div className="rounded-[1.5rem] border border-emerald-400/15 bg-[#062019] p-8 text-center">
                  <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-[2rem] border border-white/10 bg-[#03110D]">
                    <Image
                      src="/savl-logo.jpg"
                      alt="SAVL logo"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-6 text-sm uppercase tracking-[0.35em] text-emerald-300">
                    Official League Hub
                  </p>
                  <p className="mt-3 text-white/65">
                    Built for registrations, standings, schedule viewing, and
                    admin control in one clean page.
                  </p>
                  {/* CORREÇÃO: Ícones do Discord e YouTube com cores oficiais */}
                  <div className="relative z-20 mt-6 flex items-center justify-center gap-6">
                    <a
                      href="https://discord.gg/uvVkWBq74Q"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center gap-2"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#5865F2]/10 text-[#5865F2] transition duration-200 group-hover:-translate-y-1 group-hover:bg-[#5865F2] group-hover:text-white">
                        <img
                          src="/discord.png"
                          alt="Discord"
                          className="h-6 w-6"
                        />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-[#5865F2]">
                        Discord
                      </span>
                    </a>

                    <a
                      href="https://www.youtube.com/channel/UCfaCI_phe5ug5_sWA9Ozavw"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center gap-2"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#FF0000]/10 text-[#FF0000] transition duration-200 group-hover:-translate-y-1 group-hover:bg-[#FF0000] group-hover:text-white">
                        <img
                          src="/youtube.png"
                          alt="YouTube"
                          className="h-6 w-6"
                        />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-[#FF0000]">
                        YouTube
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="teams"
          className="mx-auto max-w-7xl scroll-mt-28 px-6 py-16"
        >
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                League Teams
              </p>
              <h2 className="mt-2 text-3xl font-black md:text-4xl">
                Registered Teams
              </h2>
            </div>

            <button
              type="button"
              onClick={() => scrollToSection("register")}
              className="text-sm font-medium text-white/70 transition duration-200 hover:-translate-y-0.5 hover:text-white active:translate-y-0.5"
            >
              Add your team
            </button>
          </div>

          {loading ? (
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-10 text-center text-white/60">
              Loading teams...
            </div>
          ) : approvedTeams.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
              <p className="text-lg font-semibold text-white">
                No teams registered yet
              </p>
              <p className="mt-2 text-white/60">
                Once captains submit their teams and an admin approves them,
                they will appear here with flags and avatars.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {approvedTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  players={getPlayersByTeam(team.id)}
                  expanded={expandedTeamId === team.id}
                  onToggle={() =>
                    setExpandedTeamId((prev) =>
                      prev === team.id ? null : team.id,
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section id="schedule" className="scroll-mt-28 bg-white/[0.03] py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                  Fixtures
                </p>
                <h2 className="mt-2 text-3xl font-black md:text-4xl">
                  Upcoming Matches
                </h2>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="min-w-[220px]">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    Filter by status
                  </label>
                  <SelectPicker
                    value={filterStatus}
                    onChange={(value) =>
                      setFilterStatus(value as "All" | MatchStatus)
                    }
                    options={[
                      { label: "All statuses", value: "All" },
                      ...statusOptions,
                    ]}
                    placeholder="Select status"
                  />
                </div>

                <div className="min-w-[240px]">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    Filter by stage
                  </label>
                  <SelectPicker
                    value={filterStage}
                    onChange={setFilterStage}
                    options={[
                      { label: "All stages", value: "All" },
                      ...availableStages.map((stage) => ({
                        label: stage,
                        value: stage,
                      })),
                    ]}
                    placeholder="Select stage"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus("All");
                    setFilterStage("All");
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition duration-200 hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            <div className="space-y-4 md:hidden">
              {filteredMatches.length === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-[#0B1712] px-6 py-8 text-white/60">
                  No matches added yet. Use the admin panel to create them.
                </div>
              ) : (
                filteredMatches.map((match) => (
                  <ScheduleCard
                    key={match.id}
                    match={match}
                    getStaffById={getStaffById}
                  />
                ))
              )}
            </div>

            <div className="hidden overflow-hidden rounded-[2rem] border border-white/10 bg-[#0B1712] md:block">
              <div className="grid grid-cols-[2.2fr_1fr_1fr_1fr] border-b border-white/10 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                <span>Match</span>
                <span>Date</span>
                <span>Time</span>
                <span>Status</span>
              </div>

              {filteredMatches.length === 0 ? (
                <div className="px-6 py-8 text-white/60">
                  No matches added yet. Use the admin panel to create them.
                </div>
              ) : (
                filteredMatches.map((match) => {
                  const homeCountry = getCountryByName(match.home_country);
                  const awayCountry = getCountryByName(match.away_country);
                  const resultStyles = getMatchResultStyles(match);
                  const referee = getStaffById(match.referee_id);
                  const media = getStaffById(match.media_id);

                  return (
                    <div
                      key={match.id}
                      className="grid grid-cols-[2.2fr_1fr_1fr_1fr] items-center border-b border-white/5 px-6 py-5 text-sm last:border-none"
                    >
                      <div>
                        {match.stage ? (
                          <p className="mb-1 text-xs uppercase tracking-[0.18em] text-emerald-300">
                            {match.stage}
                          </p>
                        ) : null}

                        <p className="mt-1 flex items-center gap-3 font-semibold text-white">
                          <span className={`inline-flex items-center gap-2 ${match.status === "Finished" ? resultStyles.homeClass : "text-white"}`}>
                            {homeCountry ? (
                              <img
                                src={getFlagUrl(homeCountry.code)}
                                alt={`${match.home_country} flag`}
                                className="h-5 w-7 rounded-sm object-cover"
                              />
                            ) : null}
                            {match.home_country}
                          </span>

                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
                            VS
                          </span>

                          <span className={`inline-flex items-center gap-2 ${match.status === "Finished" ? resultStyles.awayClass : "text-white"}`}>
                            {awayCountry ? (
                              <img
                                src={getFlagUrl(awayCountry.code)}
                                alt={`${match.away_country} flag`}
                                className="h-5 w-7 rounded-sm object-cover"
                              />
                            ) : null}
                            {match.away_country}
                          </span>
                        </p>
                        {match.status === "Finished" ? (
                          <p className="mt-1 text-xs text-white/55">
                            Final score: {match.home_score} - {match.away_score}
                          </p>
                        ) : null}
                        {referee || media ? (
                          <div className="mt-3 space-y-2">
                            {referee ? (
                              <div className="flex items-center gap-2 text-xs text-white/70">
                                <Avatar
                                  robloxUserId={referee.roblox_user_id}
                                  name={referee.roblox_username}
                                />
                                <span>
                                  <span className="font-semibold text-white">Referee:</span>{" "}
                                  {referee.roblox_username} • @{referee.discord_username}
                                </span>
                              </div>
                            ) : null}

                            {media ? (
                              <div className="flex items-center gap-2 text-xs text-white/70">
                                <Avatar
                                  robloxUserId={media.roblox_user_id}
                                  name={media.roblox_username}
                                />
                                <span>
                                  <span className="font-semibold text-white">Media:</span>{" "}
                                  {media.roblox_username} • @{media.discord_username}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-white/75">
                        {formatDate(match.match_date)}
                      </div>
                      <div className="text-white/75">
                        {match.match_time} BRT
                      </div>
                      <div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${getStatusBadgeClass(match.status)}`}
                        >
                          {match.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section
          id="standings"
          className="mx-auto max-w-7xl scroll-mt-28 px-6 py-16"
        >
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
              League Table
            </p>
            <h2 className="mt-2 text-3xl font-black md:text-4xl">Standings</h2>
          </div>

          <div className="space-y-4 md:hidden">
            {standings.length === 0 ? (
              <div className="rounded-[1.5rem] border border-white/10 bg-[#0B1712] px-6 py-8 text-white/60">
                Standings will appear after teams register and matches are
                finished.
              </div>
            ) : (
              standings.map((team) => (
                <StandingsCard key={team.country} team={team} />
              ))
            )}
          </div>

        <div className="hidden overflow-hidden rounded-[2rem] border border-white/10 bg-[#0B1712] md:block">
          <div className="grid grid-cols-[0.5fr_2fr_0.8fr_0.8fr_0.8fr_0.9fr_0.9fr_0.9fr_0.9fr] border-b border-white/10 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
            <span>#</span>
            <span>Team</span>
            <span>P</span>
            <span>W</span>
            <span>L</span>
            <span>SW</span>
            <span>SL</span>
            <span>SD</span>
            <span>PTS</span>
          </div>

          {standings.length === 0 ? (
            <div className="px-6 py-8 text-white/60">
              Standings will appear after teams register and matches are finished.
            </div>
          ) : (
            standings.map((team) => (
              <div
                key={team.country}
                className="grid grid-cols-[0.5fr_2fr_0.8fr_0.8fr_0.8fr_0.9fr_0.9fr_0.9fr_0.9fr] items-center border-b border-white/5 px-6 py-5 text-sm last:border-none"
              >
                <span className="font-semibold text-white">{team.position}</span>
                <span className="flex items-center gap-3 font-semibold text-white">
                  <img
                    src={getFlagUrl(team.code)}
                    alt={`${team.country} flag`}
                    className="h-5 w-7 rounded-sm object-cover"
                  />
                  {team.country}
                </span>
                <span className="text-white/75">{team.played}</span>
                <span className="text-white/75">{team.wins}</span>
                <span className="text-white/75">{team.losses}</span>
                <span className="text-white/75">{team.setsWon}</span>
                <span className="text-white/75">{team.setsLost}</span>
                <span className="text-white/75">
                  {team.setDiff > 0 ? `+${team.setDiff}` : team.setDiff}
                </span>
                <span className="font-semibold text-emerald-300">{team.points}</span>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 hidden rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/60 md:block">
          <p>
            <strong>P</strong>: Played • <strong>W</strong>: Wins • <strong>L</strong>: Losses •{" "}
            <strong>SW</strong>: Sets Won • <strong>SL</strong>: Sets Lost •{" "}
            <strong>SD</strong>: Set Difference • <strong>PTS</strong>: Points
          </p>
          <p className="mt-2">
            <strong>Points system:</strong> 3 points for a 3-0 or 3-1 win, 2 points for a 3-2 win, 1 point for a 2-3 loss.
          </p>
        </div>
        </section>

        <section
          id="register"
          className="mx-auto max-w-7xl scroll-mt-28 px-6 py-16"
        >
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                Join The League
              </p>
              <h2 className="mt-2 text-3xl font-black md:text-4xl">
                Team Registration
              </h2>
              <p className="mt-4 max-w-lg text-white/70">
                Choose one available country, add captain info and Roblox User
                ID. The roster will be handled outside the site.
              </p>

              <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                  Available countries
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {availableCountries.map((country) => (
                    <span
                      key={country.code}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0B1712] px-3 py-2 text-sm text-white/75"
                    >
                      <img
                        src={getFlagUrl(country.code)}
                        alt={`${country.name} flag`}
                        className="h-4 w-6 rounded-sm object-cover"
                      />
                      {country.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              {!registrationsOpen ? (
                <div className="mb-6 rounded-[1.5rem] border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
                  Team registrations are currently closed. New teams cannot be
                  submitted at this time.
                </div>
              ) : null}

              <form
                onSubmit={handleRegisterSubmit}
                className="rounded-[2rem] border border-white/10 bg-[#0B1712] p-6 md:p-8"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Country
                    </label>
                    <SelectPicker
                      value={registerForm.country}
                      onChange={(value) =>
                        setRegisterForm((prev) => ({ ...prev, country: value }))
                      }
                      options={countryOptions}
                      placeholder="Select a country"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Captain Roblox Username
                    </label>
                    <input
                      value={registerForm.captain_name}
                      onChange={(e) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          captain_name: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                      placeholder="xImTutu"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Captain Discord Username
                    </label>
                    <input
                      value={registerForm.captain_discord}
                      onChange={(e) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          captain_discord: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                      placeholder="ximtutu"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Captain Roblox User ID
                    </label>
                    <input
                      value={registerForm.captain_roblox_id}
                      onChange={(e) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          captain_roblox_id: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                      placeholder="123456789"
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    Registration Confirmation
                  </p>

                  <div className="mt-4 space-y-4">
                    <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#081712] p-4 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={registerConfirmations.captain_commitment}
                        onChange={(e) =>
                          setRegisterConfirmations((prev) => ({
                            ...prev,
                            captain_commitment: e.target.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-emerald-500"
                      />
                      <span>
                        I confirm that I am committed to the role of captain and
                        responsible for my team during the league.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#081712] p-4 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={registerConfirmations.in_discord_server}
                        onChange={(e) =>
                          setRegisterConfirmations((prev) => ({
                            ...prev,
                            in_discord_server: e.target.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-emerald-500"
                      />
                      <span>
                        I confirm that I am in the official SAVL Discord server
                        and understand that all players must also be there:{" "}
                        <a
                          href="https://discord.com/invite/uvVkWBq74Q"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-emerald-300 underline underline-offset-4"
                        >
                          Join Discord
                        </a>
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    submittingTeam ||
                    !registrationsOpen ||
                    !registerConfirmations.captain_commitment ||
                    !registerConfirmations.in_discord_server
                  }
                  className="mt-6 w-full rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-black transition duration-200 hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
                >
                  {!registrationsOpen
                    ? "Registrations Closed"
                    : submittingTeam
                      ? "Submitting..."
                      : "Submit Registration"}
                </button>
              </form>
            </div>
          </div>
          <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                Staff Applications
              </p>
              <h2 className="mt-2 text-3xl font-black md:text-4xl">
                Referee / Media Registration
              </h2>
              <p className="mt-4 max-w-lg text-white/70">
                Apply to join SAVL staff as a Referee or Media member. Approved
                applications will appear in the admin panel and can be assigned
                to upcoming matches.
              </p>

              <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                  Staff roles
                </p>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-[#0B1712] p-4">
                    <p className="font-semibold text-white">Referee</p>
                    <p className="mt-1 text-sm text-white/65">
                      Responsible for officiating matches fairly and enforcing
                      the league rules with neutrality.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#0B1712] p-4">
                    <p className="font-semibold text-white">Media</p>
                    <p className="mt-1 text-sm text-white/65">
                      Responsible for streaming or recording matches with clear
                      quality and reliable performance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <form
                onSubmit={handleStaffRegisterSubmit}
                className="rounded-[2rem] border border-white/10 bg-[#0B1712] p-6 md:p-8"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Application Type
                    </label>
                    <SelectPicker
                      value={staffRegisterForm.role}
                      onChange={(value) =>
                        setStaffRegisterForm((prev) => ({
                          ...prev,
                          role: value as StaffRole,
                        }))
                      }
                      options={staffRoleOptions}
                      placeholder="Select Referee or Media"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Roblox Username
                    </label>
                    <input
                      value={staffRegisterForm.roblox_username}
                      onChange={(e) =>
                        setStaffRegisterForm((prev) => ({
                          ...prev,
                          roblox_username: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                      placeholder="Roblox username"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Discord Username
                    </label>
                    <input
                      value={staffRegisterForm.discord_username}
                      onChange={(e) =>
                        setStaffRegisterForm((prev) => ({
                          ...prev,
                          discord_username: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                      placeholder="discorduser"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Roblox User ID
                    </label>
                    <input
                      value={staffRegisterForm.roblox_user_id}
                      onChange={(e) =>
                        setStaffRegisterForm((prev) => ({
                          ...prev,
                          roblox_user_id: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                      placeholder="123456789"
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    Application Confirmation
                  </p>

                  <div className="mt-4 space-y-4">
                    <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#081712] p-4 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={staffConfirmations.commitment_confirmed}
                        onChange={(e) =>
                          setStaffConfirmations((prev) => ({
                            ...prev,
                            commitment_confirmed: e.target.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-emerald-500"
                      />
                      <span>
                        {staffRegisterForm.role === "Media"
                          ? "I confirm that I have a computer and setup capable of recording or streaming SAVL matches with good visual quality, stability, and responsibility."
                          : "I confirm that I understand the responsibility of being a Referee and will officiate matches fairly, impartially, and according to league standards without favoring either side."}
                      </span>
                    </label>

                    <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#081712] p-4 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={staffConfirmations.rulebook_confirmed}
                        onChange={(e) =>
                          setStaffConfirmations((prev) => ({
                            ...prev,
                            rulebook_confirmed: e.target.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-emerald-500"
                      />
                      <span>
                        I confirm that I am familiar with the league rules and
                        the RVL rulebook:{" "}
                        <a
                          href="https://docs.google.com/document/d/1daPK-6Ud4KnbRPuuALMqET1YUfhgHcvNV8_bTHJcacY/edit?usp=sharing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-emerald-300 underline underline-offset-4"
                        >
                          View Rulebook
                        </a>
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    submittingStaffApplication ||
                    !staffRegisterForm.role ||
                    !staffConfirmations.commitment_confirmed ||
                    !staffConfirmations.rulebook_confirmed
                  }
                  className="mt-6 w-full rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-black transition duration-200 hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
                >
                  {submittingStaffApplication
                    ? "Submitting..."
                    : "Submit Staff Application"}
                </button>
              </form>
            </div>
          </div>
        </section>

        <section id="admin" className="scroll-mt-28 bg-white/[0.03] py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                  Admin Panel
                </p>
                <h2 className="mt-2 text-3xl font-black md:text-4xl">
                  League Control
                </h2>
                <p className="mt-3 max-w-2xl text-white/65">
                  Manage teams, create matches, and edit final results here.
                </p>
              </div>

              {adminLogged ? (
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0.5"
                >
                  Lock Admin
                </button>
              ) : null}
            </div>

            {!adminLogged ? (
              <form
                onSubmit={handleAdminLogin}
                className="max-w-xl rounded-[2rem] border border-white/10 bg-[#0B1712] p-6"
              >
                <label className="mb-2 block text-sm font-medium text-white/70">
                  Admin email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="mb-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                  placeholder="admin@email.com"
                />

                <label className="mb-2 block text-sm font-medium text-white/70">
                  Admin password
                </label>
                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                    placeholder="Enter password"
                  />
                  <button
                    type="submit"
                    className="rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-black transition duration-200 hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0.5"
                  >
                    Unlock
                  </button>
                </div>

                {adminNotice ? (
                  <p className="mt-3 text-sm text-emerald-300">{adminNotice}</p>
                ) : null}
              </form>
            ) : (
              <div className="space-y-8">
                <div className="rounded-[2rem] border border-white/10 bg-[#0B1712] p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xl font-bold text-white">
                        Team registrations
                      </p>
                      <p className="mt-2 text-sm text-white/65">
                        Control whether new teams can submit registration forms
                        on the site.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                          registrationsOpen
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : "border-red-400/20 bg-red-400/10 text-red-300"
                        }`}
                      >
                        {registrationsOpen ? "Open" : "Closed"}
                      </span>

                      <button
                        type="button"
                        onClick={handleToggleRegistrations}
                        disabled={togglingRegistrations}
                        className={`rounded-2xl px-5 py-3 text-sm font-semibold transition duration-200 ${
                          registrationsOpen
                            ? "border border-red-400/20 bg-red-400/10 text-red-300 hover:-translate-y-0.5 hover:bg-red-400/15"
                            : "bg-emerald-500 text-black hover:-translate-y-0.5 hover:scale-[1.01]"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {togglingRegistrations
                          ? "Updating..."
                          : registrationsOpen
                            ? "Close Registrations"
                            : "Open Registrations"}
                      </button>
                    </div>
                  </div>
                </div>
                {adminNotice ? (
                  <p className="text-sm text-emerald-300">{adminNotice}</p>
                ) : null}

                <div className="grid gap-8 lg:grid-cols-2">
                  <form
                    onSubmit={handleAdminAddTeam}
                    className="rounded-[2rem] border border-white/10 bg-[#0B1712] p-6"
                  >
                    <p className="text-xl font-bold">Add team manually</p>
                    <div className="mt-5 grid gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/70">
                          Team
                        </label>
                        <SelectPicker
                          value={adminTeamForm.country}
                          onChange={(value) =>
                            setAdminTeamForm((prev) => ({
                              ...prev,
                              country: value,
                            }))
                          }
                          options={countryOptions}
                          placeholder="Select a country"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/70">
                          Captain Roblox Username
                        </label>
                        <input
                          value={adminTeamForm.captain_name}
                          onChange={(e) =>
                            setAdminTeamForm((prev) => ({
                              ...prev,
                              captain_name: e.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                          placeholder="Captain Roblox Username"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/70">
                          Discord
                        </label>
                        <input
                          value={adminTeamForm.captain_discord}
                          onChange={(e) =>
                            setAdminTeamForm((prev) => ({
                              ...prev,
                              captain_discord: e.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                          placeholder="discorduser"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/70">
                          Roblox User ID
                        </label>
                        <input
                          value={adminTeamForm.captain_roblox_id}
                          onChange={(e) =>
                            setAdminTeamForm((prev) => ({
                              ...prev,
                              captain_roblox_id: e.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                          placeholder="123456789"
                        />
                      </div>

                      <button
                        type="submit"
                        className="rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-black transition duration-200 hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0.5"
                      >
                        Add Team
                      </button>
                    </div>
                  </form>

                  <form
                    onSubmit={handleCreateMatch}
                    className="rounded-[2rem] border border-white/10 bg-[#0B1712] p-6"
                  >
                    <p className="text-xl font-bold">Create match</p>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/70">
                          Home Country
                        </label>
                        <SelectPicker
                          value={matchForm.home_country}
                          onChange={(value) =>
                            setMatchForm((prev) => ({
                              ...prev,
                              home_country: value,
                            }))
                          }
                          options={registeredCountryOptions}
                          placeholder="Select home country"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/70">
                          Away Country
                        </label>
                        <SelectPicker
                          value={matchForm.away_country}
                          onChange={(value) =>
                            setMatchForm((prev) => ({
                              ...prev,
                              away_country: value,
                            }))
                          }
                          options={registeredCountryOptions}
                          placeholder="Select away country"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-white/70">
                          Stage
                        </label>
                        <input
                          type="text"
                          name="stage"
                          value={matchForm.stage}
                          onChange={handleMatchFormChange}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                          placeholder="Qualifiers Round 1"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/70">
                          Date
                        </label>
                        <input
                          type="date"
                          name="match_date"
                          value={matchForm.match_date}
                          onChange={handleMatchFormChange}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/70">
                          Time
                        </label>
                        <input
                          type="time"
                          name="match_time"
                          value={matchForm.match_time}
                          onChange={handleMatchFormChange}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-white/70">
                          Status
                        </label>
                        <SelectPicker
                          value={matchForm.status}
                          onChange={(value) =>
                            setMatchForm((prev) => ({
                              ...prev,
                              status: value as MatchStatus,
                            }))
                          }
                          options={statusOptions}
                          placeholder="Select status"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-white/70">
                            Home Score
                          </label>
                          <input
                            type="number"
                            min="0"
                            name="home_score"
                            value={matchForm.home_score}
                            onChange={handleMatchFormChange}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-white/70">
                            Away Score
                          </label>
                          <input
                            type="number"
                            min="0"
                            name="away_score"
                            value={matchForm.away_score}
                            onChange={handleMatchFormChange}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <button
                          type="submit"
                          className="w-full rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-black transition duration-200 hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0.5"
                        >
                          Create Match
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="rounded-[2rem] border border-white/10 bg-[#0B1712] p-6">
                    <p className="mb-4 text-xl font-bold">Team approvals</p>

                      <div className="space-y-6">
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">
                              Pending Registrations
                            </p>
                            <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                              {pendingTeams.length}
                            </span>
                          </div>

                          <div className="space-y-4">
                            {pendingTeams.length === 0 ? (
                              <p className="text-white/60">No pending teams.</p>
                            ) : (
                              pendingTeams.map((team) => (
                                <div
                                  key={team.id}
                                  className="rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.04] p-4"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={getFlagUrl(team.code)}
                                          alt={`${team.country} flag`}
                                          className="h-8 w-11 rounded-md object-cover"
                                        />
                                        <div>
                                          <p className="font-semibold">{team.country}</p>
                                          <div className="mt-1 flex items-center gap-2 text-sm text-white/70">
                                            <Avatar
                                              robloxUserId={team.captain_roblox_id}
                                              name={team.captain_name}
                                            />
                                            <span className="truncate">
                                              {team.captain_name} • @{team.captain_discord}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleApproveTeam(team.id)}
                                        className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition duration-200 hover:-translate-y-0.5 hover:scale-[1.01] active:translate-y-0.5"
                                      >
                                        Approve
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          openConfirmDialog({
                                            title: "Reject Registration",
                                            message: `Are you sure you want to reject ${team.country}'s registration?`,
                                            confirmLabel: "Reject",
                                            onConfirm: () => handleDeleteTeam(team.id),
                                          })
                                        }
                                        className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition duration-200 hover:-translate-y-0.5 hover:bg-red-400/15 active:translate-y-0.5"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                              Approved Teams
                            </p>
                            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                              {approvedTeams.length}
                            </span>
                          </div>

                          <div className="space-y-4">
                            {approvedTeams.length === 0 ? (
                              <p className="text-white/60">No approved teams yet.</p>
                            ) : (
                              approvedTeams.map((team) => (
                                <div
                                  key={team.id}
                                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={getFlagUrl(team.code)}
                                          alt={`${team.country} flag`}
                                          className="h-8 w-11 rounded-md object-cover"
                                        />
                                        <div>
                                          <p className="font-semibold">{team.country}</p>
                                          <div className="mt-1 flex items-center gap-2 text-sm text-white/70">
                                            <Avatar
                                              robloxUserId={team.captain_roblox_id}
                                              name={team.captain_name}
                                            />
                                            <span className="truncate">
                                              {team.captain_name} • @{team.captain_discord}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedAdminTeamId(team.id);
                                          setPlayerForm({
                                            team_id: String(team.id),
                                            roblox_username: "",
                                            roblox_user_id: "",
                                            discord_username: "",
                                            role: "Player",
                                          });
                                          scrollToSection("admin");
                                        }}
                                        className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-400/15 active:translate-y-0.5"
                                      >
                                        Add Player
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          openConfirmDialog({
                                            title: "Remove Team",
                                            message: `Are you sure you want to remove ${team.country}? This action cannot be undone.`,
                                            confirmLabel: "Remove",
                                            onConfirm: () => handleDeleteTeam(team.id),
                                          })
                                        }
                                        className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition duration-200 hover:-translate-y-0.5 hover:bg-red-400/15 active:translate-y-0.5"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">
                              Pending Referee / Media
                            </p>
                            <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                              {pendingStaff.length}
                            </span>
                          </div>

                          <div className="space-y-4">
                            {pendingStaff.length === 0 ? (
                              <p className="text-white/60">
                                No pending Referee / Media applications.
                              </p>
                            ) : (
                              pendingStaff.map((staff) => (
                                <div
                                  key={staff.id}
                                  className="rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.04] p-4"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-3">
                                        <Avatar
                                          robloxUserId={staff.roblox_user_id}
                                          name={staff.roblox_username}
                                        />
                                        <div>
                                          <p className="font-semibold text-white">
                                            {staff.roblox_username}
                                          </p>
                                          <p className="text-sm text-white/70">
                                            @{staff.discord_username}
                                          </p>
                                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-300">
                                            Pending {getStaffRoleLabel(staff.role)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleApproveStaffApplication(staff.id)}
                                        className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition duration-200 hover:-translate-y-0.5 hover:scale-[1.01] active:translate-y-0.5"
                                      >
                                        Approve
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          openConfirmDialog({
                                            title: "Reject Staff Application",
                                            message: `Are you sure you want to reject ${staff.roblox_username}'s ${staff.role} application?`,
                                            confirmLabel: "Reject",
                                            onConfirm: () => handleDeleteStaffApplication(staff.id),
                                          })
                                        }
                                        className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition duration-200 hover:-translate-y-0.5 hover:bg-red-400/15 active:translate-y-0.5"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                              Referee&apos;s and Media&apos;s
                            </p>
                            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                              {approvedStaff.length}
                            </span>
                          </div>

                          <div className="space-y-4">
                            {approvedStaff.length === 0 ? (
                              <p className="text-white/60">
                                No approved Referee / Media yet.
                              </p>
                            ) : (
                              approvedStaff.map((staff) => (
                                <div
                                  key={staff.id}
                                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex min-w-0 items-center gap-3">
                                      <Avatar
                                        robloxUserId={staff.roblox_user_id}
                                        name={staff.roblox_username}
                                      />
                                      <div className="min-w-0">
                                        <p className="font-semibold text-white">
                                          {staff.roblox_username}
                                        </p>
                                        <p className="text-sm text-white/60">
                                          @{staff.discord_username}
                                        </p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-300">
                                          {staff.role}
                                        </p>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openConfirmDialog({
                                          title: "Remove Staff",
                                          message: `Are you sure you want to remove ${staff.roblox_username} from approved staff? Assigned matches will lose this reference.`,
                                          confirmLabel: "Remove",
                                          onConfirm: () => handleDeleteStaffApplication(staff.id),
                                        })
                                      }
                                      className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition duration-200 hover:-translate-y-0.5 hover:bg-red-400/15 active:translate-y-0.5"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <form
                          onSubmit={handleAddPlayer}
                          className="rounded-[2rem] border border-white/10 bg-[#0B1712] p-6"
                        >
                          <p className="text-xl font-bold">Add player to roster</p>

                          <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                              <label className="mb-2 block text-sm font-medium text-white/70">
                                Team
                              </label>
                              <SelectPicker
                                value={playerForm.team_id}
                                onChange={(value) =>
                                  setPlayerForm((prev) => ({
                                    ...prev,
                                    team_id: value,
                                  }))
                                }
                                options={approvedTeams.map((team) => ({
                                  label: team.country,
                                  value: String(team.id),
                                  imageUrl: getFlagUrl(team.code),
                                }))}
                                placeholder="Select approved team"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-white/70">
                                Roblox Username
                              </label>
                              <input
                                value={playerForm.roblox_username}
                                onChange={(e) =>
                                  setPlayerForm((prev) => ({
                                    ...prev,
                                    roblox_username: e.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                                placeholder="Player Roblox Username"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-white/70">
                                Discord Username
                              </label>
                              <input
                                value={playerForm.discord_username}
                                onChange={(e) =>
                                  setPlayerForm((prev) => ({
                                    ...prev,
                                    discord_username: e.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                                placeholder="discorduser"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-white/70">
                                Roblox User ID
                              </label>
                              <input
                                value={playerForm.roblox_user_id}
                                onChange={(e) =>
                                  setPlayerForm((prev) => ({
                                    ...prev,
                                    roblox_user_id: e.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30 focus:border-emerald-400/40"
                                placeholder="123456789"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-white/70">
                                Role
                              </label>
                              <SelectPicker
                                value={playerForm.role}
                                onChange={(value) =>
                                  setPlayerForm((prev) => ({
                                    ...prev,
                                    role: value as TeamPlayerRole,
                                  }))
                                }
                                options={roleOptions}
                                placeholder="Select role"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <button
                                type="submit"
                                className="w-full rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-black transition duration-200 hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0.5"
                              >
                                Add Player
                              </button>
                            </div>
                          </div>
                        </form>

                        <div className="rounded-[2rem] border border-white/10 bg-[#0B1712] p-6">
                          <p className="mb-4 text-xl font-bold">Edit team rosters</p>

                          <div className="space-y-4">
                            {approvedTeams.length === 0 ? (
                              <p className="text-white/60">No approved teams yet.</p>
                            ) : (
                              approvedTeams.map((team) => {
                                const players = getPlayersByTeam(team.id);
                                const isOpen = selectedAdminTeamId === team.id;

                                return (
                                  <div
                                    key={team.id}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedAdminTeamId((prev) =>
                                          prev === team.id ? null : team.id,
                                        )
                                      }
                                      className="flex w-full items-center justify-between gap-4 rounded-[1rem] text-left focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                                      aria-expanded={isOpen}
                                      aria-label={
                                        isOpen
                                          ? `Hide roster for ${team.country}`
                                          : `Edit roster for ${team.country}`
                                      }
                                    >
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={getFlagUrl(team.code)}
                                          alt={`${team.country} flag`}
                                          className="h-8 w-11 rounded-md object-cover"
                                        />
                                        <div>
                                          <p className="font-semibold text-white">{team.country}</p>
                                          <p className="text-sm text-white/55">
                                            {players.length + 1} roster members
                                          </p>
                                        </div>
                                      </div>

                                      <span className="text-sm text-emerald-300">
                                        {isOpen ? "Hide roster" : "Edit roster"}
                                      </span>
                                    </button>

                                    {isOpen ? (
                                      <div className="mt-4 space-y-3">
                                        <div className="rounded-2xl border border-white/10 bg-[#081712] p-3">
                                          <div className="flex items-center gap-3">
                                            <Avatar
                                              robloxUserId={team.captain_roblox_id}
                                              name={team.captain_name}
                                            />
                                            <div>
                                              <p className="font-semibold text-white">
                                                {team.captain_name}
                                              </p>
                                              <p className="text-sm text-white/60">
                                                @{team.captain_discord}
                                              </p>
                                            </div>
                                            <span className="ml-auto rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                                              Captain
                                            </span>
                                          </div>
                                        </div>

                                        {players.length === 0 ? (
                                          <p className="text-sm text-white/60">
                                            No extra players added yet.
                                          </p>
                                        ) : (
                                          players.map((player) => (
                                            <div
                                              key={player.id}
                                              className="rounded-2xl border border-white/10 bg-[#081712] p-4"
                                            >
                                              <div className="grid gap-3 md:grid-cols-2">
                                                <input
                                                  defaultValue={player.roblox_username}
                                                  onBlur={(e) =>
                                                    handleUpdatePlayer(player.id, {
                                                      roblox_username: e.target.value.trim(),
                                                    })
                                                  }
                                                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                                                  placeholder="Roblox Username"
                                                />

                                                <input
                                                  defaultValue={player.discord_username}
                                                  onBlur={(e) =>
                                                    handleUpdatePlayer(player.id, {
                                                      discord_username: e.target.value
                                                        .trim()
                                                        .replace(/^@/, ""),
                                                    })
                                                  }
                                                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                                                  placeholder="Discord Username"
                                                />

                                                <input
                                                  defaultValue={player.roblox_user_id}
                                                  onBlur={(e) =>
                                                    handleUpdatePlayer(player.id, {
                                                      roblox_user_id: e.target.value.trim(),
                                                    })
                                                  }
                                                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                                                  placeholder="Roblox User ID"
                                                />

                                                <select
                                                  defaultValue={player.role}
                                                  onChange={(e) =>
                                                    handleUpdatePlayer(player.id, {
                                                      role: e.target.value as TeamPlayerRole,
                                                    })
                                                  }
                                                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                                                >
                                                  <option value="Vice Captain">Vice Captain</option>
                                                  <option value="Player">Player</option>
                                                </select>
                                              </div>

                                              <div className="mt-3 flex justify-end">
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    openConfirmDialog({
                                                      title: "Remove Player",
                                                      message: `Are you sure you want to remove ${player.roblox_username} from the roster?`,
                                                      confirmLabel: "Remove",
                                                      onConfirm: () => handleDeletePlayer(player.id),
                                                    })
                                                  }
                                                  className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition duration-200 hover:bg-red-400/15"
                                                >
                                                  Remove Player
                                                </button>
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })
                            )}
                        </div>
                        </div>
                      </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-[#0B1712] p-6">
                    <p className="mb-4 text-xl font-bold">Manage matches</p>
                    <div className="space-y-4">
                      {matches.length === 0 ? (
                        <p className="text-white/60">No matches created yet.</p>
                      ) : (
                        matches.map((match) => {
                          const draft = matchDrafts[match.id];

                          return (
                            <div
                              key={match.id}
                              className="rounded-2xl border border-white/10 bg-white/5 p-4"
                            >
                              <div className="grid gap-4">
                                <div className="flex flex-wrap items-center gap-3">
                                  {draft?.stage || match.stage ? (
                                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                                      {draft?.stage || match.stage}
                                    </span>
                                  ) : null}

                                  <span className="font-semibold">
                                    {match.home_country} vs {match.away_country}
                                  </span>
                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${getStatusBadgeClass(draft?.status ?? match.status)}`}
                                  >
                                    {draft?.status ?? match.status}
                                  </span>
                                </div>

                                <div>
                                  <label className="mb-2 block text-sm text-white/70">
                                    Stage
                                  </label>
                                  <input
                                    type="text"
                                    value={draft?.stage ?? match.stage ?? ""}
                                    onChange={(e) =>
                                      updateMatchDraft(match.id, {
                                        stage: e.target.value,
                                      })
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-[#0B1712] px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30"
                                    placeholder="Semifinals"
                                  />
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                  <div>
                                    <label className="mb-2 block text-sm text-white/70">
                                      Status
                                    </label>
                                    <SelectPicker
                                      value={draft?.status ?? match.status}
                                      onChange={(value) =>
                                        updateMatchDraft(match.id, {
                                          status: value as MatchStatus,
                                        })
                                      }
                                      options={statusOptions}
                                      placeholder="Select status"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-sm text-white/70">
                                      Date
                                    </label>
                                    <input
                                      type="date"
                                      value={
                                        draft?.match_date ?? match.match_date
                                      }
                                      onChange={(e) =>
                                        updateMatchDraft(match.id, {
                                          match_date: e.target.value,
                                        })
                                      }
                                      className="w-full rounded-2xl border border-white/10 bg-[#0B1712] px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-sm text-white/70">
                                      Time
                                    </label>
                                    <input
                                      type="time"
                                      value={
                                        draft?.match_time ?? match.match_time
                                      }
                                      onChange={(e) =>
                                        updateMatchDraft(match.id, {
                                          match_time: e.target.value,
                                        })
                                      }
                                      className="w-full rounded-2xl border border-white/10 bg-[#0B1712] px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="mb-2 block text-sm text-white/70">
                                        {match.home_country}
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={
                                          draft?.home_score ?? match.home_score
                                        }
                                        onChange={(e) =>
                                          updateMatchDraft(match.id, {
                                            home_score: Number(e.target.value),
                                          })
                                        }
                                        className="w-full rounded-2xl border border-white/10 bg-[#0B1712] px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-sm text-white/70">
                                        {match.away_country}
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={
                                          draft?.away_score ?? match.away_score
                                        }
                                        onChange={(e) =>
                                          updateMatchDraft(match.id, {
                                            away_score: Number(e.target.value),
                                          })
                                        }
                                        className="w-full rounded-2xl border border-white/10 bg-[#0B1712] px-4 py-3 outline-none transition duration-200 hover:border-emerald-400/30"
                                      />
                                    </div>
                                  </div>
                                <div>
                                  <label className="mb-2 block text-sm text-white/70">
                                    Referee
                                  </label>
                                  <SelectPicker
                                    value={draft?.referee_id ? String(draft.referee_id) : ""}
                                    onChange={(value) =>
                                      updateMatchDraft(match.id, {
                                        referee_id: value ? Number(value) : null,
                                      })
                                    }
                                    options={refereeOptions}
                                    placeholder="Select referee"
                                  />
                                </div>

                                <div>
                                  <label className="mb-2 block text-sm text-white/70">
                                    Media
                                  </label>
                                  <SelectPicker
                                    value={draft?.media_id ? String(draft.media_id) : ""}
                                    onChange={(value) =>
                                      updateMatchDraft(match.id, {
                                        media_id: value ? Number(value) : null,
                                      })
                                    }
                                    options={mediaOptions}
                                    placeholder="Select media"
                                  />
                                </div>
                                </div>
                                {(getStaffById(draft?.referee_id ?? match.referee_id) ||
                                  getStaffById(draft?.media_id ?? match.media_id)) ? (
                                  <div className="rounded-2xl border border-white/10 bg-[#081712] p-4">
                                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                                      Assigned Match Staff
                                    </p>

                                    <div className="space-y-3">
                                      {getStaffById(draft?.referee_id ?? match.referee_id) ? (
                                        <div className="flex items-center gap-3">
                                          <Avatar
                                            robloxUserId={
                                              getStaffById(
                                                draft?.referee_id ?? match.referee_id,
                                              )!.roblox_user_id
                                            }
                                            name={
                                              getStaffById(
                                                draft?.referee_id ?? match.referee_id,
                                              )!.roblox_username
                                            }
                                          />
                                          <div>
                                            <p className="font-semibold text-white">
                                              Referee:{" "}
                                              {
                                                getStaffById(
                                                  draft?.referee_id ?? match.referee_id,
                                                )!.roblox_username
                                              }
                                            </p>
                                            <p className="text-sm text-white/60">
                                              @
                                              {
                                                getStaffById(
                                                  draft?.referee_id ?? match.referee_id,
                                                )!.discord_username
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      ) : null}

                                      {getStaffById(draft?.media_id ?? match.media_id) ? (
                                        <div className="flex items-center gap-3">
                                          <Avatar
                                            robloxUserId={
                                              getStaffById(
                                                draft?.media_id ?? match.media_id,
                                              )!.roblox_user_id
                                            }
                                            name={
                                              getStaffById(
                                                draft?.media_id ?? match.media_id,
                                              )!.roblox_username
                                            }
                                          />
                                          <div>
                                            <p className="font-semibold text-white">
                                              Media:{" "}
                                              {
                                                getStaffById(
                                                  draft?.media_id ?? match.media_id,
                                                )!.roblox_username
                                              }
                                            </p>
                                            <p className="text-sm text-white/60">
                                              @
                                              {
                                                getStaffById(
                                                  draft?.media_id ?? match.media_id,
                                                )!.discord_username
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : null}

                                <div className="flex flex-wrap gap-3">
                                  <button
                                    type="button"
                                    onClick={() => saveMatchDraft(match.id)}
                                    className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition duration-200 hover:-translate-y-0.5 hover:scale-[1.01] active:translate-y-0.5"
                                  >
                                    Save Changes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openConfirmDialog({
                                        title: "Delete Match",
                                        message: `Are you sure you want to delete ${match.home_country} vs ${match.away_country}?`,
                                        confirmLabel: "Delete",
                                        onConfirm: () => handleDeleteMatch(match.id),
                                      })
                                    }
                                    className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition duration-200 hover:-translate-y-0.5 hover:bg-red-400/15 active:translate-y-0.5"
                                  >
                                    Delete Match
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#06100C]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-white">SAVL</p>
            <p>South America Volleyball League</p>
          </div>

          <div className="flex gap-3">
            <AnimatedNavButton label="Schedule" targetId="schedule" />
            <AnimatedNavButton label="Register" targetId="register" />
            <AnimatedNavButton label="Admin" targetId="admin" />
          </div>
        </div>
      </footer>
      {successDialog.open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-emerald-400/25 bg-[#071A13] p-6 shadow-[0_20px_80px_rgba(16,185,129,0.18)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/15">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-emerald-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-black text-white">
                  {successDialog.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  {successDialog.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setSuccessDialog({
                    open: false,
                    title: "",
                    message: "",
                  })
                }
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition duration-200 hover:-translate-y-0.5 hover:scale-[1.01] active:translate-y-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {confirmDialog.open ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-red-400/20 bg-[#071A13] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <h3 className="text-xl font-black text-white">{confirmDialog.title}</h3>
            <p className="mt-3 text-sm leading-6 text-white/75">
              {confirmDialog.message}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setConfirmDialog({
                    open: false,
                    title: "",
                    message: "",
                    confirmLabel: "Confirm",
                    onConfirm: null,
                  })
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog({
                    open: false,
                    title: "",
                    message: "",
                    confirmLabel: "Confirm",
                    onConfirm: null,
                  });
                  if (action) await action();
                }}
                className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm font-semibold text-red-300 transition duration-200 hover:bg-red-400/15 focus:outline-none focus:ring-2 focus:ring-red-400/40"
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
