import { useEffect, useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Chart as ChartJS,
  CategoryScale,
  type ChartOptions,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import {
  addCard,
  acknowledgeIntruderAlert,
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
  getIntruderAlerts,
  getLatest,
  markIntruderAlertEmergency,
  setAdminTokens,
  setDoorState
} from "./api";
import { AuthModal } from "./components/AuthModal";
import { DashboardOverview } from "./components/DashboardOverview";
import { DashboardHeader } from "./components/DashboardHeader";
import { FeatureSection } from "./components/FeatureSection";
import { IntruderAlertModal } from "./components/IntruderAlertModal";
import { ShowcasePlaceholderSection } from "./components/ShowcasePlaceholderSection";
import { getAuthActionErrorMessage, getDashboardErrorMessage, normalizeAuthErrorMessage } from "./lib/errorMessages";
import type { AdminUser, AppTab, IntruderAlertRecord, OAuthProvider, TempHumiRecord } from "./types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const AUTH_PROVIDER_STORAGE_KEY = "smartfarm.authProvider";
const OAUTH_RETURN_TAB_STORAGE_KEY = "smartfarm.oauthReturnTab";
const DEFAULT_TAB: AppTab = "dashboard";

function sanitizeHistoryRecords(records: TempHumiRecord[]) {
  return records.map((record, index, source) => {
    const previous = source[index - 1];
    const next = source[index + 1];

    const shouldHideIsolatedDrop = (value: number | null, key: "temperature" | "humidity") => {
      if (value === null || value > 0 || !previous || !next) return false;

      const previousValue = previous[key];
      const nextValue = next[key];

      return previousValue !== null && previousValue > 0 && nextValue !== null && nextValue > 0;
    };

    return {
      ...record,
      temperature: shouldHideIsolatedDrop(record.temperature, "temperature") ? null : record.temperature,
      humidity: shouldHideIsolatedDrop(record.humidity, "humidity") ? null : record.humidity
    };
  });
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return AudioContextClass ? new AudioContextClass() : null;
}

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(DEFAULT_TAB);
  const [latest, setLatest] = useState<TempHumiRecord | null>(null);
  const [history, setHistory] = useState<TempHumiRecord[]>([]);
  const [doorState, setDoorStateValue] = useState("OFF");
  const [cards, setCards] = useState<string[]>([]);
  const [newCardNum, setNewCardNum] = useState("");
  const [editingCardNum, setEditingCardNum] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [cardSubmitting, setCardSubmitting] = useState(false);
  const [doorSubmitting, setDoorSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTempFull, setShowTempFull] = useState(false);
  const [showHumiFull, setShowHumiFull] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [activeIntruderAlert, setActiveIntruderAlert] = useState<IntruderAlertRecord | null>(null);
  const [intruderAlertHistory, setIntruderAlertHistory] = useState<IntruderAlertRecord[]>([]);
  const [intruderActionSubmitting, setIntruderActionSubmitting] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [authProvider, setAuthProvider] = useState<OAuthProvider | "password" | null>(() => {
    const raw = window.localStorage.getItem(AUTH_PROVIDER_STORAGE_KEY);
    return raw === "google" || raw === "github" || raw === "password" ? raw : null;
  });
  const audioContextRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);

  async function unlockAlarmAudio() {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = getAudioContext();
      }

      const audioContext = audioContextRef.current;
      if (!audioContext) return false;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // iPhone Safari often needs one gesture-triggered sound to fully unlock Web Audio.
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.02);

      setAudioUnlocked(audioContext.state === "running");
      return audioContext.state === "running";
    } catch {
      return false;
    }
  }

  function clearProtectedAdminData() {
    setActiveIntruderAlert(null);
    setIntruderAlertHistory([]);
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab]);

  async function loadData(includeProtected = Boolean(admin)) {
    setRefreshing(true);

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
      toast.error(getDashboardErrorMessage(err, "Unable to load dashboard data. Please try again."), {
        id: "dashboard-load-error"
      });
      setRefreshing(false);
      return;
    }

    if (!includeProtected) {
      clearProtectedAdminData();
      setRefreshing(false);
      return;
    }

    try {
      const intruderData = await getIntruderAlerts();
      setActiveIntruderAlert(intruderData.activeAlert);
      setIntruderAlertHistory(intruderData.history);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearProtectedAdminData();
        handleUnauthorizedSession();
        return;
      }
      toast.error(getDashboardErrorMessage(err, "Unable to load admin-only history and intruder alerts right now."), {
        id: "admin-dashboard-load-error"
      });
    } finally {
      setRefreshing(false);
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

  function handleUnauthorizedSession() {
    clearAdminTokens();
    setAdmin(null);
    clearProtectedAdminData();
    openAdminLogin("Session expired. Please login again.");
  }

  async function handleDoor(state: "ON" | "OFF") {
    if (!ensureAdmin("Admin login required to control the door.")) return;
    setDoorSubmitting(true);
    try {
      await setDoorState(state);
      await loadData();
      toast.success(state === "ON" ? "Door opened" : "Door closed");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorizedSession();
        return;
      }
      toast.error(getDashboardErrorMessage(err, "Unable to update the door right now. Please try again."), {
        id: "door-update-error"
      });
    } finally {
      setDoorSubmitting(false);
    }
  }

  async function handleAddCard() {
    if (!ensureAdmin()) return;
    const cardNum = newCardNum.trim().toUpperCase();
    if (!cardNum) {
      toast.error("Card number cannot be empty");
      return;
    }

    setCardSubmitting(true);
    try {
      await addCard(cardNum);
      setNewCardNum("");
      await loadData();
      toast.success("Card added");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorizedSession();
        return;
      }
      toast.error(getDashboardErrorMessage(err, "Unable to add the card right now. Please try again."), {
        id: "card-add-error"
      });
    } finally {
      setCardSubmitting(false);
    }
  }

  async function handleSaveEdit(cardNum: string) {
    if (!ensureAdmin()) return;
    const nextCardNum = editingValue.trim().toUpperCase();
    if (!nextCardNum) {
      toast.error("Card number cannot be empty");
      return;
    }

    setCardSubmitting(true);
    try {
      await editCard(cardNum, nextCardNum);
      resetCardEditing();
      await loadData();
      toast.success("Card updated");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorizedSession();
        return;
      }
      toast.error(getDashboardErrorMessage(err, "Unable to update the card right now. Please try again."), {
        id: "card-edit-error"
      });
    } finally {
      setCardSubmitting(false);
    }
  }

  async function handleDeleteCard(cardNum: string) {
    if (!ensureAdmin()) return;
    setCardSubmitting(true);
    try {
      await deleteCard(cardNum);
      await loadData();
      toast.success("Card deleted");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorizedSession();
        return;
      }
      toast.error(getDashboardErrorMessage(err, "Unable to delete the card right now. Please try again."), {
        id: "card-delete-error"
      });
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
    void loadData(Boolean(admin));
    const id = window.setInterval(() => {
      void loadData(Boolean(admin));
    }, 5000);
    return () => window.clearInterval(id);
  }, [admin]);

  useEffect(() => {
    if (history.length === 0 || chartReady) return;
    const id = window.setTimeout(() => setChartReady(true), 40);
    return () => window.clearTimeout(id);
  }, [chartReady, history.length]);

  useEffect(() => {
    const unlockAudio = () => {
      void unlockAlarmAudio();
    };

    if (audioUnlocked) return;

    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);
    window.addEventListener("click", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [audioUnlocked]);

  useEffect(() => {
    const stopAlarm = () => {
      if (alarmIntervalRef.current !== null) {
        window.clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    };

    const playBurst = () => {
      const audioContext = audioContextRef.current;
      if (!audioContext || audioContext.state !== "running") return;

      const now = audioContext.currentTime;
      const gain = audioContext.createGain();
      gain.connect(audioContext.destination);
      gain.gain.setValueAtTime(0.0001, now);

      const pulseFrequencies = [740, 980, 740];
      pulseFrequencies.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const pulseStart = now + index * 0.2;
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(frequency, pulseStart);
        oscillator.connect(gain);
        oscillator.start(pulseStart);
        oscillator.stop(pulseStart + 0.14);
      });

      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
    };

    stopAlarm();

    if (!activeIntruderAlert || !audioUnlocked || !audioContextRef.current) return stopAlarm;

    playBurst();
    alarmIntervalRef.current = window.setInterval(playBurst, 900);
    return stopAlarm;
  }, [activeIntruderAlert, audioUnlocked]);

  useEffect(() => {
    return () => {
      if (alarmIntervalRef.current !== null) {
        window.clearInterval(alarmIntervalRef.current);
      }
      void audioContextRef.current?.close();
    };
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
          if (me.admin) {
            const raw = window.localStorage.getItem(AUTH_PROVIDER_STORAGE_KEY);
            if (raw === "google" || raw === "github" || raw === "password") setAuthProvider(raw);
          }
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
      const storedTab = window.localStorage.getItem(OAUTH_RETURN_TAB_STORAGE_KEY);
      const returnTab: AppTab =
        storedTab === "feature" || storedTab === "showcase" || storedTab === "dashboard"
          ? storedTab
          : DEFAULT_TAB;
      const accessToken = params.get("accessToken") || "";
      const refreshToken = params.get("refreshToken") || "";
      const error = params.get("error") || "";

      const finalizeOauthRedirect = () => {
        window.localStorage.removeItem(OAUTH_RETURN_TAB_STORAGE_KEY);
        window.history.replaceState({}, "", "/");
        setActiveTab(returnTab);
      };

      if (error) {
        setAuthError(normalizeAuthErrorMessage(error) ?? "OAuth login could not be completed.");
        setIsAuthOpen(true);
        finalizeOauthRedirect();
        return;
      }

      if (!accessToken || !refreshToken) {
        setAuthError("OAuth callback is missing login tokens.");
        setIsAuthOpen(true);
        finalizeOauthRedirect();
        return;
      }

      try {
        setAdminTokens({ accessToken, refreshToken });
        const me = await adminMe();
        if (cancelled) return;

        if (me.admin) {
          setAdmin({ id: me.admin.id, username: me.admin.username });
          const provider = (params.get("provider") as OAuthProvider | null) || null;
          setAuthProvider(provider);
          if (provider) window.localStorage.setItem(AUTH_PROVIDER_STORAGE_KEY, provider);
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
        finalizeOauthRedirect();
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
      window.localStorage.setItem(AUTH_PROVIDER_STORAGE_KEY, "password");
      setAuthPassword("");
      setIsAuthOpen(false);
      void loadData(true);
    } catch (err) {
      setAuthError(getAuthActionErrorMessage("login", err));
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
      window.localStorage.setItem(AUTH_PROVIDER_STORAGE_KEY, "password");
      setAuthPassword("");
      setIsAuthOpen(false);
      void loadData(true);
    } catch (err) {
      setAuthError(getAuthActionErrorMessage("signup", err));
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function startOauth(provider: OAuthProvider) {
    if (authSubmitting) return;
    setAuthError(null);
    window.localStorage.setItem(OAUTH_RETURN_TAB_STORAGE_KEY, activeTab);
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
      window.localStorage.removeItem(AUTH_PROVIDER_STORAGE_KEY);
      setIsAuthOpen(false);
      resetCardEditing();
      clearProtectedAdminData();
    }
  }

  const busy = doorSubmitting;
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
        fill: false,
        spanGaps: true
      }
    ]
  });

  const sanitizedHistory = useMemo(() => sanitizeHistoryRecords(history), [history]);

  const tempRecentData = useMemo(
    () => buildChartData(sanitizedHistory.slice(-15), "temperature", "Temperature (Recent)", "#f87171"),
    [sanitizedHistory]
  );
  const tempFullData = useMemo(
    () => buildChartData(sanitizedHistory, "temperature", "Temperature (Full)", "#fb7185"),
    [sanitizedHistory]
  );
  const humiRecentData = useMemo(
    () => buildChartData(sanitizedHistory.slice(-15), "humidity", "Humidity (Recent)", "#60a5fa"),
    [sanitizedHistory]
  );
  const humiFullData = useMemo(
    () => buildChartData(sanitizedHistory, "humidity", "Humidity (Full)", "#60a5fa"),
    [sanitizedHistory]
  );

  const chartOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      animation: false,
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

  async function handleAcknowledgeIntruderAlert() {
    if (!activeIntruderAlert) return;
    setIntruderActionSubmitting(true);
    try {
      await acknowledgeIntruderAlert(activeIntruderAlert.id);
      setActiveIntruderAlert(null);
      await loadData();
      toast.success("Intruder alert acknowledged");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorizedSession();
        return;
      }
      toast.error(getDashboardErrorMessage(err, "Unable to acknowledge the intruder alert right now."), {
        id: "intruder-alert-acknowledge-error"
      });
    } finally {
      setIntruderActionSubmitting(false);
    }
  }

  async function handleAcknowledgeIntruderAlertById(id: number) {
    setIntruderActionSubmitting(true);
    try {
      await acknowledgeIntruderAlert(id);
      setActiveIntruderAlert(null);
      await loadData();
      toast.success("Intruder alert acknowledged");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorizedSession();
        return;
      }
      toast.error(getDashboardErrorMessage(err, "Unable to acknowledge the intruder alert right now."), {
        id: "intruder-alert-acknowledge-error"
      });
    } finally {
      setIntruderActionSubmitting(false);
    }
  }

  async function handleDialEmergency() {
    if (!activeIntruderAlert) return;
    setIntruderActionSubmitting(true);
    try {
      await markIntruderAlertEmergency(activeIntruderAlert.id);
      setActiveIntruderAlert(null);
      await loadData();
      window.location.assign("tel:911");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorizedSession();
        return;
      }
      toast.error(getDashboardErrorMessage(err, "Unable to start the emergency action right now."), {
        id: "intruder-alert-emergency-error"
      });
    } finally {
      setIntruderActionSubmitting(false);
    }
  }

  async function handleDialEmergencyById(id: number) {
    setIntruderActionSubmitting(true);
    try {
      await markIntruderAlertEmergency(id);
      setActiveIntruderAlert(null);
      await loadData();
      window.location.assign("tel:911");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorizedSession();
        return;
      }
      toast.error(getDashboardErrorMessage(err, "Unable to start the emergency action right now."), {
        id: "intruder-alert-emergency-error"
      });
    } finally {
      setIntruderActionSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-neutral-900 font-sans text-neutral-100 antialiased">
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3400,
          style: {
            background: "#171717",
            color: "#f5f5f5",
            border: "1px solid #404040",
            borderRadius: "12px",
            padding: "12px 14px",
            minWidth: "min(calc(100vw - 32px), 520px)",
            maxWidth: "min(calc(100vw - 32px), 520px)",
            boxSizing: "border-box"
          }
        }}
      />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-[-140px] h-[420px] w-[420px] animate-slow-float rounded-full bg-neutral-100/5 blur-3xl" />
        <div className="absolute -bottom-28 right-[-120px] h-[460px] w-[460px] animate-slow-float rounded-full bg-blue-300/10 blur-3xl [animation-delay:1.2s]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(147,197,253,0.08),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
        <DashboardHeader
          activeTab={activeTab}
          admin={admin}
          onTabChange={setActiveTab}
          onOpenAdminSession={openAdminSession}
          onOpenAdminLogin={() => openAdminLogin()}
        />

        {activeTab === "dashboard" ? (
          <DashboardOverview
            latest={latest}
            history={history}
            intruderAlertHistory={intruderAlertHistory}
            busy={busy}
            intruderActionSubmitting={intruderActionSubmitting}
            doorState={doorState}
            showTempFull={showTempFull}
            showHumiFull={showHumiFull}
            tempRecentData={tempRecentData}
            tempFullData={tempFullData}
            humiRecentData={humiRecentData}
            humiFullData={humiFullData}
            chartOptions={chartOptions}
            chartReady={chartReady}
            admin={admin}
            authChecking={authChecking}
            cardSubmitting={cardSubmitting}
            cards={cards}
            editingCardNum={editingCardNum}
            editingValue={editingValue}
            newCardNum={newCardNum}
            onDoorChange={handleDoor}
            onShowTempRecent={() => setShowTempFull(false)}
            onShowTempFull={() => setShowTempFull(true)}
            onShowHumiRecent={() => setShowHumiFull(false)}
            onShowHumiFull={() => setShowHumiFull(true)}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onEditCard={handleStartEdit}
            onNewCardNumChange={setNewCardNum}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={resetCardEditing}
            onEditingValueChange={setEditingValue}
            onOpenAdminLogin={() => openAdminLogin()}
            onAcknowledgeIntruderAlert={handleAcknowledgeIntruderAlertById}
            onDialEmergencyIntruderAlert={handleDialEmergencyById}
          />
        ) : activeTab === "feature" ? (
          <FeatureSection />
        ) : (
          <ShowcasePlaceholderSection />
        )}

        <footer className="pb-2 pt-6 text-xs text-zinc-500">
          {activeTab === "dashboard"
            ? "Smart Farm Dashboard."
            : activeTab === "feature"
              ? "Smart Farm Feature diagrams."
              : "Smart Farm Showcase."}
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

      <IntruderAlertModal
        alert={admin ? activeIntruderAlert : null}
        canPlaySound={audioUnlocked}
        busy={intruderActionSubmitting}
        onEnableSound={() => void unlockAlarmAudio()}
        onAcknowledge={handleAcknowledgeIntruderAlert}
        onDialEmergency={handleDialEmergency}
      />
    </div>
  );
}

export default App;
