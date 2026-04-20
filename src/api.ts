export interface TempHumiRecord {
  id: number;
  temperature: number | null;
  humidity: number | null;
  updatedTime: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || "https://smart-farm-backend--naingminhan.replit.app/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export function getLatest() {
  return request<TempHumiRecord>("/temp-humi/latest");
}

export function getHistory(limit = 30) {
  return request<TempHumiRecord[]>(`/temp-humi/history?limit=${limit}`);
}

export function getDoorState() {
  return request<{ state: string }>("/door-state");
}

export function setDoorState(state: "ON" | "OFF") {
  return request<{ id: number; state: string; createdAt: string }>("/door-state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state })
  });
}

export function getCards() {
  return request<string[]>("/cards");
}
