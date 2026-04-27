import type { IntruderAlertFeed, IntruderAlertRecord } from "../types";
import { ApiError, fetchWithAdminAuth, readMaybeJson } from "./base";

export async function getIntruderAlerts() {
  const res = await fetchWithAdminAuth("/intruder-alerts", {
    method: "GET"
  });

  if (!res.ok) {
    const body = await readMaybeJson(res);
    throw new ApiError(`API error: ${res.status}`, res.status, body);
  }

  return (await res.json()) as IntruderAlertFeed;
}

export async function acknowledgeIntruderAlert(id: number) {
  const res = await fetchWithAdminAuth(`/intruder-alerts/${id}/acknowledge`, {
    method: "POST"
  });

  if (!res.ok) {
    const body = await readMaybeJson(res);
    throw new ApiError(`API error: ${res.status}`, res.status, body);
  }

  return (await res.json()) as IntruderAlertRecord;
}

export async function markIntruderAlertEmergency(id: number) {
  const res = await fetchWithAdminAuth(`/intruder-alerts/${id}/emergency`, {
    method: "POST"
  });

  if (!res.ok) {
    const body = await readMaybeJson(res);
    throw new ApiError(`API error: ${res.status}`, res.status, body);
  }

  return (await res.json()) as IntruderAlertRecord;
}
