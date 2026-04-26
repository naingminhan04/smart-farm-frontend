import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import {
  addCard,
  adminLogin,
  adminLogout,
  adminMe,
  adminOauthStartUrl,
  adminRegister,
  ApiError,
  clearAdminTokens,
  deleteCard,
  editCard,
  getAdminTokens,
  getCards,
  getDoorState,
  getHistory,
  getLatest,
  setAdminTokens,
  setDoorState
} from "./api";
import { AuthModal } from "./components/AuthModal";
import { CardsPanel } from "./components/CardsPanel";
import { DashboardHeader } from "./components/DashboardHeader";
import { DoorControlCard } from "./components/DoorControlCard";
import { HistoryChartCard } from "./components/HistoryChartCard";
import { MetricCard } from "./components/MetricCard";
import { ShowcaseSection } from "./components/ShowcaseSection";
import type { AdminUser, OAuthProvider, TempHumiRecord } from "./types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type AppTab = "dashboard" | "showcase";

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
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

  function resetCardEditing() {
    setEditingCardNum(null);
    setEditingValue("");
  }

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
      resetCardEditing();
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

  function handleStartEdit(cardNum: string) {
    if (!ensureAdmin()) return;
    setEditingCardNum(cardNum);
    setEditingValue(cardNum);
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

      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
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
        setAuthError(err instanceof Error ? err.message : "Login failed.");
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
        else if (err.status === 409) {
          setAuthError("That username is already taken. Please choose another or sign in.");
        } else {
          setAuthError(`Sign up failed (${err.status}).`);
        }
      } else {
        setAuthError(err instanceof Error ? err.message : "Sign up failed.");
      }
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function startOauth(provider: OAuthProvider) {
    if (authSubmitting) return;
    setAuthError(null);
    window.location.assign(adminOauthStartUrl(provider));
  }

  async function handleAdminLogout() {
    const tokens = getAdminTokens();
    try {
      if (tokens.refreshToken) await adminLogout(tokens.refreshToken);
    } catch {
      // If logout fails, local cleanup still completes the session reset.
    } finally {
      clearAdminTokens();
      setAdmin(null);
      setAuthProvider(null);
      setIsAuthOpen(false);
      resetCardEditing();
    }
  }

  const busy = refreshing || cardSubmitting;
  const lastUpdated = latest?.updatedTime ? new Date(latest.updatedTime) : null;
  const lastUpdatedLabel = lastUpdated ? lastUpdated.toLocaleString() : "No data yet";

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
        <DashboardHeader
          activeTab={activeTab}
          admin={admin}
          lastUpdatedLabel={lastUpdatedLabel}
          manualRefreshing={manualRefreshing}
          onTabChange={setActiveTab}
          onManualRefresh={() => loadData({ manual: true })}
          onOpenAdminSession={openAdminSession}
          onOpenAdminLogin={() => openAdminLogin()}
        />

        {activeTab === "dashboard" ? (
          <>
            {error && (
              <div className="mb-6 animate-fade-up rounded-2xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-sm text-red-100 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-red-300" />
                  <div className="flex-1">{error}</div>
                </div>
              </div>
            )}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard title="Temperature" value={latest?.temperature?.toFixed(1) ?? "--"} unit="C" />
              <MetricCard
                title="Humidity"
                value={latest?.humidity?.toFixed(0) ?? "--"}
                unit="%"
                animationDelayClass="[animation-delay:70ms]"
              />
              <DoorControlCard busy={busy} doorState={doorState} onDoorChange={handleDoor} />
            </section>

            <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <HistoryChartCard
                title="Temperature Chart"
                totalPoints={history.length}
                showingFull={showTempFull}
                recentData={tempRecentData}
                fullData={tempFullData}
                options={chartOptions}
                onShowRecent={() => setShowTempFull(false)}
                onShowFull={() => setShowTempFull(true)}
              />
              <HistoryChartCard
                title="Humidity Chart"
                totalPoints={history.length}
                showingFull={showHumiFull}
                recentData={humiRecentData}
                fullData={humiFullData}
                options={chartOptions}
                animationDelayClass="[animation-delay:80ms]"
                onShowRecent={() => setShowHumiFull(false)}
                onShowFull={() => setShowHumiFull(true)}
              />
            </section>

            <CardsPanel
              admin={admin}
              authChecking={authChecking}
              cardSubmitting={cardSubmitting}
              cards={cards}
              editingCardNum={editingCardNum}
              editingValue={editingValue}
              newCardNum={newCardNum}
              onAddCard={handleAddCard}
              onDeleteCard={handleDeleteCard}
              onEditCard={handleStartEdit}
              onNewCardNumChange={setNewCardNum}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={resetCardEditing}
              onEditingValueChange={setEditingValue}
            />
          </>
        ) : (
          <ShowcaseSection />
        )}

        <footer className="pb-2 pt-6 text-xs text-slate-500">
          {activeTab === "dashboard"
            ? "Smart Farm Dashboard. UI refreshes automatically; manual refresh available above."
            : "Smart Farm Showcase. Diagrams are curated in the frontend now, and videos or more images can be added later."}
        </footer>
      </div>

      <AuthModal
        admin={admin}
        authError={authError}
        authMethodLabel={authMethodLabel}
        authPassword={authPassword}
        authProvider={authProvider}
        authSubmitting={authSubmitting}
        authTab={authTab}
        authUsername={authUsername}
        isOpen={isAuthOpen}
        onAuthPasswordChange={setAuthPassword}
        onAuthTabChange={setAuthTab}
        onAuthUsernameChange={setAuthUsername}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
        onRegister={handleAdminRegister}
        onStartOauth={startOauth}
        onClearAuthError={() => setAuthError(null)}
      />
    </div>
  );
}

export default App;
