import { adminRefresh } from "./auth";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const ACCESS_TOKEN_KEY = "sf_admin_access_token";
const REFRESH_TOKEN_KEY = "sf_admin_refresh_token";

function normalizeApiBase(input: string) {
  const trimmed = (input || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";

  if (typeof window !== "undefined" && window.location?.protocol === "https:" && trimmed.startsWith("http://")) {
    return `https://${trimmed.slice("http://".length)}`;
  }

  return trimmed;
}

function resolveApiBase() {
  const configured = normalizeApiBase(import.meta.env.VITE_API_BASE || "");
  if (configured) return configured;

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    const isLocalDev = hostname === "localhost" || hostname === "127.0.0.1";

    if (isLocalDev) return "/api";
  }

  return normalizeApiBase("https://smart-farm-backend--naingminhan.replit.app/api");
}

const API_BASE = resolveApiBase();

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || "";
}

export function getApiBase() {
  return API_BASE;
}

export function getApiOrigin() {
  try {
    return new URL(API_BASE, window.location.origin).origin;
  } catch {
    return "";
  }
}

export function getAdminTokens() {
  return { accessToken: getAccessToken(), refreshToken: getRefreshToken() };
}

export function setAdminTokens(tokens: { accessToken: string; refreshToken: string }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearAdminTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function readMaybeJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildNetworkError(err: unknown) {
  const reason = err instanceof Error ? err.message : "Unknown network error";
  return new Error(
    `Failed to fetch from API (${API_BASE}). ${reason}. Check VITE_API_BASE, mixed-content (http vs https), and that the backend is reachable.`
  );
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, options);
  } catch (err) {
    throw buildNetworkError(err);
  }

  if (!res.ok) {
    const body = await readMaybeJson(res);
    throw new ApiError(`API error: ${res.status}`, res.status, body);
  }

  return res.json();
}

export async function fetchWithAdminAuth(path: string, options: RequestInit) {
  const doFetch = (accessToken: string) => {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(`${API_BASE}${path}`, { ...options, headers });
  };

  const accessToken = getAccessToken();
  if (!accessToken) {
    try {
      return await fetch(`${API_BASE}${path}`, options);
    } catch (err) {
      throw buildNetworkError(err);
    }
  }

  let res: Response;
  try {
    res = await doFetch(accessToken);
  } catch (err) {
    throw buildNetworkError(err);
  }

  if (res.status !== 401) return res;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return res;

  try {
    const refreshed = await adminRefresh(refreshToken);
    setAdminTokens({ accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken });
    res = await doFetch(refreshed.accessToken);
    return res;
  } catch {
    return res;
  }
}
