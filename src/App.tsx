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
  deleteCard,
  editCard,
  getCards,
  getDoorState,
  getHistory,
  getLatest,
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
    try {
      await setDoorState(state);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change door state");
    }
  }

  async function handleAddCard() {
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
      setError(err instanceof Error ? err.message : "Failed to add card");
    } finally {
      setCardSubmitting(false);
    }
  }

  async function handleSaveEdit(cardNum: string) {
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
      setError(err instanceof Error ? err.message : "Failed to edit card");
    } finally {
      setCardSubmitting(false);
    }
  }

  async function handleDeleteCard(cardNum: string) {
    setCardSubmitting(true);
    setError(null);
    try {
      await deleteCard(cardNum);
      await loadData();
    } catch (err) {
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

  const busy = refreshing || cardSubmitting;

  const lastUpdated = latest?.updatedTime ? new Date(latest.updatedTime) : null;
  const lastUpdatedLabel = lastUpdated ? lastUpdated.toLocaleString() : "No data yet";

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
            <span className={badgeClass}>{cards.length} cards</span>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={newCardNum}
              onChange={(event) => setNewCardNum(event.target.value)}
              placeholder="Enter card number"
              className={inputClass}
            />
            <button onClick={handleAddCard} disabled={cardSubmitting} className={buttonPrimary}>
              Add Card
            </button>
          </div>

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
    </div>
  );
}

export default App;
