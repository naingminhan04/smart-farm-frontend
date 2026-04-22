import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import {
  addCard,
  AdminUser,
  adminLogin,
  adminOauthStartUrl,
  adminRegister,
  adminLogout,
  adminMe,
  ApiError,
  clearAdminTokens,
  deleteCard,
  editCard,
  getAdminTokens,
  getCards,
  getDoorState,
  getHistory,
  getLatest,
  OAuthProvider,
  setAdminTokens,
  setDoorState,
  TempHumiRecord
} from "./api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const panelClass = cx(
  "group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl",
  "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(800px_circle_at_20%_0%,rgba(56,189,248,0.14),transparent_60%)] before:opacity-0 before:transition-opacity before:duration-500 group-hover:before:opacity-100"
);

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-sky-400/30";
const buttonPrimary = cx(buttonBase, "bg-sky-500/90 text-white hover:bg-sky-400");
const buttonMuted = cx(buttonBase, "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10");
const buttonDanger = cx(buttonBase, "bg-red-500/90 text-white hover:bg-red-400");

const inputClass = cx(
  "min-w-[180px] flex-1 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-[10px] text-slate-100 placeholder:text-slate-500",
  "outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
);

const badgeClass = cx(
  "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200"
);

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3 14.7 2 12 2 6.9 2 2.8 6.4 2.8 11.8S6.9 21.5 12 21.5c6.1 0 9.1-4.3 9.1-6.5 0-.4 0-.8-.1-1.1H12Z"
      />
      <path
        fill="#34A853"
        d="M2.8 11.8c0 1.7.6 3.3 1.7 4.6l3-2.3c-.4-.7-.7-1.5-.7-2.3s.2-1.6.7-2.3l-3-2.3c-1.1 1.3-1.7 2.9-1.7 4.6Z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.5c2.7 0 4.9-.9 6.5-2.5l-3.2-2.5c-.9.6-2 .9-3.3.9-2.5 0-4.6-1.7-5.4-4l-3.1 2.4c1.7 3.4 5 5.7 8.5 5.7Z"
      />
      <path
        fill="#4285F4"
        d="M18.5 19c1.8-1.7 2.6-4.2 2.6-7.2 0-.7-.1-1.2-.2-1.7H12v3.9h5.5c-.1 1-.7 2.6-2.3 3.6l3.3 1.4Z"
      />
    </svg>
  );
}

function GitHubLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.6v-2.1c-3.3.8-4-1.4-4-1.4-.6-1.5-1.4-1.9-1.4-1.9-1.2-.8.1-.8.1-.8 1.3.1 2 .9 2 .9 1.2 2 3.1 1.4 3.8 1.1.1-.9.5-1.4.8-1.7-2.7-.3-5.5-1.4-5.5-6A4.8 4.8 0 0 1 6.8 8c-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1a4.8 4.8 0 0 1 1.3 3.3c0 4.6-2.8 5.6-5.5 6 .5.4.9 1.1.9 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 flex-none" fill="none" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 20a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function App() {
  const [latest, setLatest] = useState<TempHumiRecord | null>(null);
  const [history, setHistory] = useState<TempHumiRecord[]>([]);
  const [doorState, setDoorStateValue] = useState("OFF");
  const [cards, setCards] = useState<string[]>([]);
  const [newCardNum, setNewCardNum] = useState("");
  const [editingCardNum, setEditingCardNum] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [cardSubmitting, setCardSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [showTempFull, setShowTempFull] = useState(false);
  const [showHumiFull, setShowHumiFull] = useState(false);

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [authProvider, setAuthProvider] = useState<OAuthProvider | "password" | null>(null);

  async function loadData(options?: { manual?: boolean }) {
    const isManual = options?.manual ?? false;
    if (isManual) setManualRefreshing(true);
    setRefreshing(true);
    setError(null);
    try {
      const [latestData, historyData, stateData, cardData] = await Promise.all([
        getLatest(),
        getHistory(30),
        getDoorState(),
        getCards()
      ]);
      setLatest(latestData);
      setHistory(historyData);
      setDoorStateValue(stateData.state);
      setCards(cardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setRefreshing(false);
      if (isManual) setManualRefreshing(false);
    }
  }

  async function handleDoor(state: "ON" | "OFF") {
    if (!ensureAdmin("Admin login required to control the door.")) return;
    try {
      await setDoorState(state);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminTokens();
        setAdmin(null);
        openAdminLogin("Session expired. Please login again.");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to change door state");
    }
  }

  async function handleAddCard() {
    if (!ensureAdmin()) return;
    const cardNum = newCardNum.trim().toUpperCase();
    if (!cardNum) {
      setError("Card number cannot be empty");
      return;
    }
    setCardSubmitting(true);
    setError(null);
    try {
      await addCard(cardNum);
      setNewCardNum("");
      await loadData();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminTokens();
        setAdmin(null);
        openAdminLogin("Session expired. Please login again.");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to add card");
    } finally {
      setCardSubmitting(false);
    }
  }

  async function handleSaveEdit(cardNum: string) {
    if (!ensureAdmin()) return;
    const nextCardNum = editingValue.trim().toUpperCase();
    if (!nextCardNum) {
      setError("Card number cannot be empty");
      return;
    }
    setCardSubmitting(true);
    setError(null);
    try {
      await editCard(cardNum, nextCardNum);
      setEditingCardNum(null);
      setEditingValue("");
      await loadData();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminTokens();
        setAdmin(null);
        openAdminLogin("Session expired. Please login again.");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to edit card");
    } finally {
      setCardSubmitting(false);
    }
  }

  async function handleDeleteCard(cardNum: string) {
    if (!ensureAdmin()) return;
    setCardSubmitting(true);
    setError(null);
    try {
      await deleteCard(cardNum);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminTokens();
        setAdmin(null);
        openAdminLogin("Session expired. Please login again.");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to delete card");
    } finally {
      setCardSubmitting(false);
    }
  }

  useEffect(() => {
    loadData();
    const id = window.setInterval(loadData, 5000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tokens = getAdminTokens();
        if (!tokens.accessToken && !tokens.refreshToken) {
          if (!cancelled) setAdmin(null);
          return;
        }
        const me = await adminMe();
        if (!cancelled) {
          setAdmin(me.admin ? { id: me.admin.id, username: me.admin.username } : null);
        }
      } catch {
        clearAdminTokens();
        if (!cancelled) setAdmin(null);
      } finally {
        if (!cancelled) setAuthChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function handleOauthCallbackRedirect() {
      if (window.location.pathname !== "/auth/callback") return;

      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      const accessToken = params.get("accessToken") || "";
      const refreshToken = params.get("refreshToken") || "";
      const error = params.get("error") || "";

      if (error) {
        setAuthError(error);
        setIsAuthOpen(true);
        window.history.replaceState({}, "", "/");
        return;
      }

      if (!accessToken || !refreshToken) {
        setAuthError("OAuth callback is missing login tokens.");
        setIsAuthOpen(true);
        window.history.replaceState({}, "", "/");
        return;
      }

      try {
        setAdminTokens({ accessToken, refreshToken });
        const me = await adminMe();
        if (cancelled) return;

        if (me.admin) {
          setAdmin({ id: me.admin.id, username: me.admin.username });
          setAuthProvider((params.get("provider") as OAuthProvider | null) || null);
          setAuthError(null);
          setIsAuthOpen(false);
        } else {
          clearAdminTokens();
          setAuthError("OAuth login completed, but no admin profile was returned.");
          setIsAuthOpen(true);
        }
      } catch {
        if (cancelled) return;
        clearAdminTokens();
        setAuthError("OAuth login could not be completed.");
        setIsAuthOpen(true);
      } finally {
        window.history.replaceState({}, "", "/");
      }
    }

    void handleOauthCallbackRedirect();

    return () => {
      cancelled = true;
    };
  }, []);

  const busy = refreshing || cardSubmitting;

  const lastUpdated = latest?.updatedTime ? new Date(latest.updatedTime) : null;
  const lastUpdatedLabel = lastUpdated ? lastUpdated.toLocaleString() : "No data yet";

  function openAdminLogin(reason?: string) {
    setAuthError(reason ?? null);
    setAuthTab("login");
    setIsAuthOpen(true);
  }

  function openAdminSession() {
    setAuthError(null);
    setIsAuthOpen(true);
  }

  function ensureAdmin(reason?: string) {
    if (admin) return true;
    openAdminLogin(reason ?? "Admin login required to manage cards.");
    return false;
  }

  async function handleAdminLogin() {
    const username = authUsername.trim();
    if (!username || !authPassword) {
      setAuthError("Username and password are required.");
      return;
    }

    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const result = await adminLogin(username, authPassword);
      setAdminTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
      setAdmin(result.admin);
      setAuthProvider("password");
      setAuthPassword("");
      setIsAuthOpen(false);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setAuthError("Invalid username or password.");
        else if (err.status === 400) setAuthError("Username and password are required.");
        else setAuthError(`Login failed (${err.status}).`);
      } else {
        setAuthError("Login failed.");
      }
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleAdminRegister() {
    const username = authUsername.trim();
    if (!username || !authPassword) {
      setAuthError("Username and password are required.");
      return;
    }

    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const result = await adminRegister(username, authPassword);
      setAdminTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
      setAdmin(result.admin);
      setAuthProvider("password");
      setAuthPassword("");
      setIsAuthOpen(false);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) setAuthError("Username must be 3-64 characters and password at least 8 characters.");
        else if (err.status === 409) setAuthError("That username is already taken. Please choose another or sign in.");
        else setAuthError(`Sign up failed (${err.status}).`);
      } else {
        setAuthError("Sign up failed.");
      }
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function startOauth(provider: OAuthProvider) {
    if (authSubmitting) return;

    setAuthError(null);
    const url = adminOauthStartUrl(provider);
    window.location.assign(url);
  }

  async function handleAdminLogout() {
    const tokens = getAdminTokens();
    try {
      if (tokens.refreshToken) await adminLogout(tokens.refreshToken);
    } catch {
      // If logout fails (network), still clear local tokens.
    } finally {
      clearAdminTokens();
      setAdmin(null);
      setAuthProvider(null);
      setIsAuthOpen(false);
      setEditingCardNum(null);
      setEditingValue("");
    }
  }

  const authMethodLabel =
    authProvider === "google"
      ? "Google"
      : authProvider === "github"
        ? "GitHub"
        : authProvider === "password"
          ? "Username & Password"
          : "Unknown";

  const buildChartData = (
    records: TempHumiRecord[],
    key: "temperature" | "humidity",
    label: string,
    color: string
  ) => ({
    labels: records.map((row) => new Date(row.updatedTime).toLocaleTimeString()),
    datasets: [
      {
        label,
        data: records.map((row) => row[key]),
        borderColor: color,
        tension: 0.3,
        fill: false
      }
    ]
  });

  const tempRecentData = useMemo(
    () => buildChartData(history.slice(-15), "temperature", "Temperature (Recent)", "#f87171"),
    [history]
  );

  const tempFullData = useMemo(
    () => buildChartData(history, "temperature", "Temperature (Full)", "#fb7185"),
    [history]
  );

  const humiRecentData = useMemo(
    () => buildChartData(history.slice(-15), "humidity", "Humidity (Recent)", "#60a5fa"),
    [history]
  );

  const humiFullData = useMemo(
    () => buildChartData(history, "humidity", "Humidity (Full)", "#38bdf8"),
    [history]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { labels: { color: "#e2e8f0" } }
      },
      scales: {
        x: {
          ticks: { color: "#cbd5e1" },
          grid: { color: "rgba(148,163,184,0.12)" }
        },
        y: {
          ticks: { color: "#cbd5e1" },
          grid: { color: "rgba(148,163,184,0.12)" }
        }
      }
    }),
    []
  );

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-[-140px] h-[420px] w-[420px] animate-slow-float rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-28 right-[-120px] h-[460px] w-[460px] animate-slow-float rounded-full bg-emerald-500/10 blur-3xl [animation-delay:1.2s]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.10),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                <svg viewBox="0 0 24 24" className="h-full w-full text-sky-300" fill="none" aria-hidden="true">
                  <path
                    d="M5 17c2.2 0 3.4-1.4 4.4-2.7C10.5 12.9 11.5 12 13 12c2.3 0 3.7 2 6 2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7 7l2.5 2.5L12 7l2.5 2.5L17 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.9rem]">Smart Farm Dashboard</h1>
                <p className="mt-1 text-sm text-slate-300">
                  Live environment telemetry, access control, and door automation.
                </p>
              </div>
            </div>
          </div>

          <div className="animate-fade-up [animation-delay:80ms]">
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <span className={badgeClass}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-soft-pulse rounded-full bg-emerald-400/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Updated: {lastUpdatedLabel}
              </span>
              <button onClick={() => loadData({ manual: true })} disabled={manualRefreshing} className={buttonPrimary}>
                <svg
                  viewBox="0 0 24 24"
                  className={cx("h-4 w-4", manualRefreshing && "animate-spin")}
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M20 12a8 8 0 1 1-2.34-5.66"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 4v6h-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Refresh
              </button>
              {admin ? (
                <button
                  className={cx(
                    buttonBase,
                    "h-11 w-11 min-h-11 min-w-11 shrink-0 rounded-2xl px-0",
                    "border border-emerald-300/35 bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                  )}
                  onClick={openAdminSession}
                  title={`Admin session: ${admin.username}`}
                  aria-label={`Admin session: ${admin.username}`}
                >
                  <span className="inline-flex h-6 w-6 flex-none items-center justify-center">
                    <ProfileIcon />
                  </span>
                </button>
              ) : (
                <button
                  className={cx(
                    buttonBase,
                    "h-11 w-11 min-h-11 min-w-11 shrink-0 rounded-2xl px-0",
                    "border border-sky-300/30 bg-sky-400 text-slate-950 hover:bg-sky-300"
                  )}
                  onClick={() => openAdminLogin()}
                  title="Admin login"
                  aria-label="Admin login"
                >
                  <span className="inline-flex h-6 w-6 flex-none items-center justify-center">
                    <ProfileIcon />
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 animate-fade-up rounded-2xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-sm text-red-100 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-red-300" />
              <div className="flex-1">{error}</div>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className={cx(panelClass, "animate-fade-up")}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300">Temperature</h2>
              <span className={badgeClass}>Sensor</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight">
                {latest?.temperature?.toFixed(1) ?? "--"}
              </span>
              <span className="text-sm font-semibold text-slate-400">C</span>
            </div>
          </article>

          <article className={cx(panelClass, "animate-fade-up [animation-delay:70ms]")}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300">Humidity</h2>
              <span className={badgeClass}>Sensor</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight">
                {latest?.humidity?.toFixed(0) ?? "--"}
              </span>
              <span className="text-sm font-semibold text-slate-400">%</span>
            </div>
          </article>

          <article className={cx(panelClass, "animate-fade-up [animation-delay:140ms]")}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300">Door State</h2>
              <span
                className={cx(
                  badgeClass,
                  doorState === "ON"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                    : "border-slate-400/20 bg-white/5 text-slate-200"
                )}
              >
                {doorState === "ON" ? "OPEN" : "CLOSED"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => handleDoor("ON")}
                disabled={busy}
                className={cx(
                  buttonBase,
                  "flex-1 border border-emerald-400/20 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15",
                  doorState === "ON" && "ring-2 ring-emerald-400/25"
                )}
              >
                Open
              </button>
              <button
                onClick={() => handleDoor("OFF")}
                disabled={busy}
                className={cx(
                  buttonBase,
                  "flex-1 border border-red-400/20 bg-red-400/10 text-red-100 hover:bg-red-400/15",
                  doorState === "OFF" && "ring-2 ring-red-400/25"
                )}
              >
                Close
              </button>
            </div>
          </article>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className={cx(panelClass, "animate-fade-up")}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Temperature Chart</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {showTempFull ? "Full history" : "Recent view"} ({showTempFull ? history.length : Math.min(15, history.length)} points)
                </p>
              </div>
              <div className="flex w-full items-center rounded-full border border-white/10 bg-white/5 p-1 sm:w-auto">
                <button
                  onClick={() => setShowTempFull(false)}
                  className={cx(
                    "flex-1 rounded-full px-3 py-1 text-xs font-semibold transition sm:flex-none",
                    showTempFull ? "text-slate-300 hover:text-slate-100" : "bg-white/10 text-slate-100"
                  )}
                >
                  Recent
                </button>
                <button
                  onClick={() => setShowTempFull(true)}
                  className={cx(
                    "flex-1 rounded-full px-3 py-1 text-xs font-semibold transition sm:flex-none",
                    showTempFull ? "bg-white/10 text-slate-100" : "text-slate-300 hover:text-slate-100"
                  )}
                >
                  Full
                </button>
              </div>
            </div>
            <div className="mt-4 max-w-full">
              <Line data={showTempFull ? tempFullData : tempRecentData} options={chartOptions} />
            </div>
          </article>

          <article className={cx(panelClass, "animate-fade-up [animation-delay:80ms]")}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Humidity Chart</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {showHumiFull ? "Full history" : "Recent view"} ({showHumiFull ? history.length : Math.min(15, history.length)} points)
                </p>
              </div>
              <div className="flex w-full items-center rounded-full border border-white/10 bg-white/5 p-1 sm:w-auto">
                <button
                  onClick={() => setShowHumiFull(false)}
                  className={cx(
                    "flex-1 rounded-full px-3 py-1 text-xs font-semibold transition sm:flex-none",
                    showHumiFull ? "text-slate-300 hover:text-slate-100" : "bg-white/10 text-slate-100"
                  )}
                >
                  Recent
                </button>
                <button
                  onClick={() => setShowHumiFull(true)}
                  className={cx(
                    "flex-1 rounded-full px-3 py-1 text-xs font-semibold transition sm:flex-none",
                    showHumiFull ? "bg-white/10 text-slate-100" : "text-slate-300 hover:text-slate-100"
                  )}
                >
                  Full
                </button>
              </div>
            </div>
            <div className="mt-4 max-w-full">
              <Line data={showHumiFull ? humiFullData : humiRecentData} options={chartOptions} />
            </div>
          </article>
        </section>

        <section className={cx(panelClass, "mt-6 animate-fade-up")}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Allowed RFID Cards</h2>
              <p className="mt-1 text-xs text-slate-400">Manage access cards for the door controller.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className={badgeClass}>{cards.length} cards</span>
              {authChecking ? <span className={badgeClass}>Checking admin...</span> : null}
              {admin ? (
                <span className={cx(badgeClass, "border-emerald-400/30 bg-emerald-400/10 text-emerald-100")}>
                  Admin: {admin.username}
                </span>
              ) : (
                <span className={cx(badgeClass, "border-amber-300/30 bg-amber-300/10 text-amber-50")}>
                  Admin locked
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={newCardNum}
              onChange={(event) => setNewCardNum(event.target.value)}
              placeholder="Enter card number"
              className={inputClass}
              disabled={!admin || cardSubmitting}
            />
            <button
              onClick={handleAddCard}
              disabled={cardSubmitting}
              className={buttonPrimary}
            >
              Add Card
            </button>
          </div>
          {!admin && (
            <p className="mt-2 text-xs text-slate-400">
              Login is required to add, edit, or delete cards. Sensor and door features remain public.
            </p>
          )}

          <div className="mt-5">
            <ul className="space-y-2">
              {cards.length ? (
                cards.map((card) => {
                  const isEditing = editingCardNum === card;
                  return (
                    <li
                      key={card}
                      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/[0.07] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-400">Card</div>
                        {isEditing ? (
                          <input
                            value={editingValue}
                            onChange={(event) => setEditingValue(event.target.value)}
                            className={cx(inputClass, "mt-2 w-full")}
                            disabled={!admin || cardSubmitting}
                          />
                        ) : (
                          <div className="mt-1 break-all text-sm font-semibold tracking-wide text-slate-100">
                            {card}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(card)}
                              disabled={cardSubmitting}
                              className={buttonPrimary}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingCardNum(null);
                                setEditingValue("");
                              }}
                              disabled={cardSubmitting}
                              className={buttonMuted}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                if (!ensureAdmin()) return;
                                setEditingCardNum(card);
                                setEditingValue(card);
                              }}
                              disabled={cardSubmitting}
                              className={buttonMuted}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCard(card)}
                              disabled={cardSubmitting}
                              className={buttonDanger}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  No cards available.
                </li>
              )}
            </ul>
          </div>
        </section>

        <footer className="pb-2 pt-6 text-xs text-slate-500">
          Smart Farm Dashboard. UI refreshes automatically; manual refresh available above.
        </footer>
      </div>

      {isAuthOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setIsAuthOpen(false)}
          />
          <div className={cx(panelClass, "relative z-10 w-full max-w-md")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight">
                  {admin ? "Account" : authTab === "signup" ? "Create account" : "Welcome back"}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {admin ? "Your current admin session details." : "Use the same fields below for either sign up or login."}
                </p>
              </div>
              {!admin ? (
                <button className={buttonMuted} onClick={() => setIsAuthOpen(false)}>
                  Close
                </button>
              ) : null}
            </div>

            {authError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                {authError}
              </div>
            )}
            {admin ? (
              <>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Logged In User
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-100">{admin.username}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Login Method
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-100">
                      {authProvider === "google" ? <GoogleLogo /> : null}
                      {authProvider === "github" ? <GitHubLogo /> : null}
                      <span>{authMethodLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button className={buttonMuted} onClick={() => setIsAuthOpen(false)} disabled={authSubmitting}>
                    Cancel
                  </button>
                  <button className={buttonDanger} onClick={handleAdminLogout} disabled={authSubmitting}>
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-4 flex w-full items-center rounded-full border border-white/10 bg-white/5 p-1">
                  <button
                    onClick={() => {
                      setAuthTab("login");
                      setAuthError(null);
                    }}
                    className={cx(
                      "flex-1 rounded-full px-3 py-1 text-xs font-semibold transition",
                      authTab === "login" ? "bg-white/10 text-slate-100" : "text-slate-300 hover:text-slate-100"
                    )}
                    disabled={authSubmitting}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setAuthTab("signup");
                      setAuthError(null);
                    }}
                    className={cx(
                      "flex-1 rounded-full px-3 py-1 text-xs font-semibold transition",
                      authTab === "signup" ? "bg-white/10 text-slate-100" : "text-slate-300 hover:text-slate-100"
                    )}
                    disabled={authSubmitting}
                  >
                    Sign up
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Username</label>
                    <input
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      className={cx(inputClass, "mt-2 w-full")}
                      autoComplete="username"
                      disabled={authSubmitting}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    <input
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className={cx(inputClass, "mt-2 w-full")}
                      type="password"
                      autoComplete="current-password"
                      disabled={authSubmitting}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (authTab === "signup") handleAdminRegister();
                          else handleAdminLogin();
                        }
                        if (e.key === "Escape") setIsAuthOpen(false);
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button className={buttonMuted} onClick={() => setIsAuthOpen(false)} disabled={authSubmitting}>
                    Cancel
                  </button>
                  {authTab === "signup" ? (
                    <button className={buttonPrimary} onClick={handleAdminRegister} disabled={authSubmitting}>
                      {authSubmitting ? "Signing up..." : "Sign up"}
                    </button>
                  ) : (
                    <button className={buttonPrimary} onClick={handleAdminLogin} disabled={authSubmitting}>
                      {authSubmitting ? "Signing in..." : "Sign in"}
                    </button>
                  )}
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Or continue with
                  </div>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    className={cx(
                      buttonBase,
                      "w-full border border-[#4285F4]/30 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,244,255,0.95))] text-slate-900 hover:border-[#4285F4]/50"
                    )}
                    onClick={() => startOauth("google")}
                    disabled={authSubmitting}
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white">
                      <GoogleLogo />
                    </span>
                    <span className="text-sm font-semibold">
                      {authTab === "signup" ? "Sign up with Google" : "Sign in with Google"}
                    </span>
                  </button>
                  <button
                    className={cx(
                      buttonBase,
                      "w-full border border-slate-700/80 bg-[linear-gradient(135deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))] text-white hover:border-slate-500/80 hover:bg-[linear-gradient(135deg,rgba(51,65,85,0.96),rgba(15,23,42,1))]"
                    )}
                    onClick={() => startOauth("github")}
                    disabled={authSubmitting}
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                      <GitHubLogo />
                    </span>
                    <span className="text-sm font-semibold">
                      {authTab === "signup" ? "Sign up with GitHub" : "Sign in with GitHub"}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
