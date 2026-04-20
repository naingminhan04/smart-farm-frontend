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
import { getCards, getDoorState, getHistory, getLatest, setDoorState, TempHumiRecord } from "./api";
import "./App.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function App() {
  const [latest, setLatest] = useState<TempHumiRecord | null>(null);
  const [history, setHistory] = useState<TempHumiRecord[]>([]);
  const [doorState, setDoorStateValue] = useState("OFF");
  const [cards, setCards] = useState<string[]>([]);
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

  useEffect(() => {
    loadData();
    const id = window.setInterval(loadData, 5000);
    return () => window.clearInterval(id);
  }, []);

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

  const chartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { labels: { color: "#ffffff" } }
    },
    scales: {
      x: { ticks: { color: "#ffffff" } },
      y: { ticks: { color: "#ffffff" } }
    }
  }), []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Smart Farm Dashboard</h1>
        <button onClick={loadData} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="cards-grid">
        <article className="card">
          <h2>Temperature</h2>
          <p className="value">{latest?.temperature?.toFixed(1) ?? "--"} °C</p>
        </article>
        <article className="card">
          <h2>Humidity</h2>
          <p className="value">{latest?.humidity?.toFixed(0) ?? "--"} %</p>
        </article>
        <article className="card">
          <h2>Door State</h2>
          <p className="value">{doorState}</p>
        </article>
      </section>

      <section className="control-panel">
        <button onClick={() => handleDoor("ON")} className="control-button open">
          Open Door
        </button>
        <button onClick={() => handleDoor("OFF")} className="control-button close">
          Close Door
        </button>
      </section>

      <section className="charts-grid">
        <article className="chart-card">
          <h2>Temperature</h2>
          <Line data={showTempFull ? tempFullData : tempRecentData} options={chartOptions} />
          <button className="chart-toggle-button" onClick={() => setShowTempFull((prev) => !prev)}>
            {showTempFull ? "Show recent only" : "Show full history"}
          </button>
        </article>
        <article className="chart-card">
          <h2>Humidity</h2>
          <Line data={showHumiFull ? humiFullData : humiRecentData} options={chartOptions} />
          <button className="chart-toggle-button" onClick={() => setShowHumiFull((prev) => !prev)}>
            {showHumiFull ? "Show recent only" : "Show full history"}
          </button>
        </article>
      </section>

      <section className="table-card">
        <h2>Allowed RFID Cards</h2>
        <ul>
          {cards.length ? cards.map((card) => <li key={card}>{card}</li>) : <li>No cards available.</li>}
        </ul>
      </section>
    </div>
  );
}

export default App;
