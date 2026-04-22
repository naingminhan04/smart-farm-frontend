import type {
  AdminProfileResponse,
  AdminRefreshResponse,
  AdminSessionResponse,
  OAuthProvider
} from "../types";
import { ApiError, fetchWithAdminAuth, getApiBase, readMaybeJson, request } from "./base";

export async function adminLogin(username: string, password: string) {
  return request<AdminSessionResponse>("/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
}

export async function adminRegister(username: string, password: string) {
  return request<AdminSessionResponse>("/admin/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
}

export function adminOauthStartUrl(provider: OAuthProvider) {
  const url = new URL(`${getApiBase()}/auth/${provider}`, window.location.origin);
  return url.toString();
}

export async function adminMe() {
  const res = await fetchWithAdminAuth("/admin/me", { method: "GET" });

  if (!res.ok) {
    const body = await readMaybeJson(res);
    throw new ApiError(`API error: ${res.status}`, res.status, body);
  }

  return (await res.json()) as AdminProfileResponse;
}

export async function adminRefresh(refreshToken: string) {
  return request<AdminRefreshResponse>("/admin/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });
}

export async function adminLogout(refreshToken: string) {
  const res = await fetch(`${getApiBase()}/admin/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });

  if (!res.ok && res.status !== 204) {
    const body = await readMaybeJson(res);
    throw new ApiError(`API error: ${res.status}`, res.status, body);
  }
}
