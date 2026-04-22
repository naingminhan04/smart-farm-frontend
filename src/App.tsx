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
  adminOauthBootstrapToken,
  adminOauthStartUrl,
  adminRegister,
  adminLogout,
  adminMe,
  ApiError,
  clearAdminTokens,
  deleteCard,
  editCard,
  getApiOrigin,
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
  const [showTempFull, setShowTempFull] = useState(false);
  const [showHumiFull, setShowHumiFull] = useState(false);

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authSetupToken, setAuthSetupToken] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");

  async function loadData() {
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
    const expectedOrigin = getApiOrigin();

    function onMessage(event: MessageEvent) {
      if (!expectedOrigin || event.origin !== expectedOrigin) return;
      const data = event.data as any;
      if (!data || typeof data !== "object") return;

      if (data.type === "sf_admin_oauth") {
        if (typeof data.accessToken === "string" && typeof data.refreshToken === "string") {
          setAdminTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        }
        if (data.admin && typeof data.admin.username === "string" && typeof data.admin.id === "number") {
          setAdmin({ id: data.admin.id, username: data.admin.username });
        }
        setAuthPassword("");
        setAuthError(null);
        setIsAuthOpen(false);
        return;
      }

      if (data.type === "sf_admin_oauth_error") {
        setAuthError(typeof data.error === "string" ? data.error : "OAuth failed.");
        setIsAuthOpen(true);
        return;
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const busy = refreshing || cardSubmitting;

  const lastUpdated = latest?.updatedTime ? new Date(latest.updatedTime) : null;
  const lastUpdatedLabel = lastUpdated ? lastUpdated.toLocaleString() : "No data yet";

  function openAdminLogin(reason?: string) {
    setAuthError(reason ?? null);
    setAuthTab("login");
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
      const result = await adminRegister(username, authPassword, authSetupToken.trim());
      setAdminTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
      setAdmin(result.admin);
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

    setAuthSubmitting(true);
    setAuthError(null);

    try {
      let bootstrapToken: string | undefined;
      if (authTab === "signup") {
        const setupToken = authSetupToken.trim();
        if (!setupToken) {
          setAuthError("Setup token is required for OAuth sign up.");
          return;
        }
        const bt = await adminOauthBootstrapToken(setupToken);
        bootstrapToken = bt.bootstrapToken;
      }

      const url = adminOauthStartUrl(provider, bootstrapToken);
      const popup = window.open(
        url,
        "sf_admin_oauth",
        "popup=yes,width=520,height=680,menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes"
      );

      if (!popup) {
        setAuthError("Popup blocked. Please allow popups for this site.");
        return;
      }

      popup.focus();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) setAuthError("An admin already exists. Use OAuth login instead.");
        else if (err.status === 401) setAuthError("Invalid setup token.");
        else setAuthError(`OAuth failed (${err.status}).`);
      } else {
        setAuthError("OAuth failed.");
      }
    } finally {
      setAuthSubmitting(false);
    }
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
      setEditingCardNum(null);
      setEditingValue("");
    }
  }

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
              {admin ? (
                <button
                  className={buttonMuted}
                  onClick={() => openAdminLogin(`Signed in as ${admin.username}.`)}
                  title="Admin session"
                >
                  Admin
                </button>
              ) : (
                <button className={buttonMuted} onClick={() => openAdminLogin()} title="Admin login">
                  Admin
                </button>
              )}
              <button onClick={loadData} disabled={refreshing} className={buttonPrimary}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
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
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
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
                  {admin ? "Admin Session" : authTab === "signup" ? "Create Admin" : "Admin Login"}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Required for door control and RFID card management.
                </p>
              </div>
              <div className="flex gap-2">
                {admin ? (
                  <button className={buttonDanger} onClick={handleAdminLogout} disabled={authSubmitting}>
                    Logout
                  </button>
                ) : null}
                <button className={buttonMuted} onClick={() => setIsAuthOpen(false)}>
                  Close
                </button>
              </div>
            </div>

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

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                className={cx(buttonMuted, "w-full")}
                onClick={() => startOauth("google")}
                disabled={authSubmitting || (authTab === "signup" && !authSetupToken.trim())}
                title={authTab === "signup" && !authSetupToken.trim() ? "Setup token required for OAuth sign up" : ""}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-xs font-black">
                  G
                </span>
                Continue with Google
              </button>
              <button
                className={cx(buttonMuted, "w-full")}
                onClick={() => startOauth("github")}
                disabled={authSubmitting || (authTab === "signup" && !authSetupToken.trim())}
                title={authTab === "signup" && !authSetupToken.trim() ? "Setup token required for OAuth sign up" : ""}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-xs font-black">
                  GH
                </span>
                Continue with GitHub
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">or</div>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {authError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                {authError}
              </div>
            )}

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
              {authTab === "signup" ? (
                <div>
                  <label className="text-xs font-semibold text-slate-300">Setup Token</label>
                  <input
                    value={authSetupToken}
                    onChange={(e) => setAuthSetupToken(e.target.value)}
                    className={cx(inputClass, "mt-2 w-full")}
                    placeholder="ADMIN_SETUP_TOKEN"
                    disabled={authSubmitting}
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Only OAuth sign up uses the setup token. Username/password sign up works without it.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button className={buttonMuted} onClick={() => setIsAuthOpen(false)} disabled={authSubmitting}>
                Cancel
              </button>
              {authTab === "signup" ? (
                <button className={buttonPrimary} onClick={handleAdminRegister} disabled={authSubmitting}>
                  {authSubmitting ? "Creating..." : "Create admin"}
                </button>
              ) : (
                <button className={buttonPrimary} onClick={handleAdminLogin} disabled={authSubmitting}>
                  {authSubmitting ? "Signing in..." : "Sign in"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
