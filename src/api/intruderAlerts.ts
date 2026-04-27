import type { IntruderAlertFeed, IntruderAlertRecord } from "../types";
import { ApiError, fetchWithAdminAuth, readMaybeJson } from "./base";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function pickString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function pickNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function pickBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeAdminBrief(value: unknown, fallbackUsername?: unknown) {
  const record = asRecord(value);
  if (!record) {
    const username = pickString(fallbackUsername);
    return username ? { id: 0, username } : null;
  }

  const username =
    pickString(record.username) ??
    pickString(record.userName) ??
    pickString(record.name) ??
    pickString(fallbackUsername);
  if (!username) return null;

  return {
    id: pickNumber(record.id) ?? 0,
    username
  };
}

function normalizeIntruderAlertRecord(value: unknown): IntruderAlertRecord {
  const record = asRecord(value);
  if (!record) {
    throw new Error("Invalid intruder alert payload");
  }

  const acknowledgedBy =
    normalizeAdminBrief(record.acknowledgedBy, record.acknowledgedByUsername ?? record.acknowledged_by_username) ??
    null;
  const emergencyDialedBy =
    normalizeAdminBrief(record.emergencyDialedBy, record.emergencyDialedByUsername ?? record.emergency_dialed_by_username) ??
    null;

  return {
    id: pickNumber(record.id) ?? 0,
    source: pickString(record.source) ?? "",
    message: pickString(record.message) ?? "",
    detectedAt: pickString(record.detectedAt ?? record.detected_at) ?? "",
    clearedAt: pickString(record.clearedAt ?? record.cleared_at),
    acknowledgedAt: pickString(record.acknowledgedAt ?? record.acknowledged_at),
    acknowledgedById: pickNumber(record.acknowledgedById ?? record.acknowledged_by_id),
    acknowledgedBy,
    acknowledgedByUsername:
      pickString(record.acknowledgedByUsername ?? record.acknowledged_by_username) ?? acknowledgedBy?.username ?? null,
    emergencyDialedAt: pickString(record.emergencyDialedAt ?? record.emergency_dialed_at),
    emergencyDialedById: pickNumber(record.emergencyDialedById ?? record.emergency_dialed_by_id),
    emergencyDialedBy,
    emergencyDialedByUsername:
      pickString(record.emergencyDialedByUsername ?? record.emergency_dialed_by_username) ??
      emergencyDialedBy?.username ??
      null,
    createdAt: pickString(record.createdAt ?? record.created_at) ?? "",
    updatedAt: pickString(record.updatedAt ?? record.updated_at) ?? "",
    requiresAction:
      pickBoolean(
        record.requiresAction,
        !pickString(record.acknowledgedAt ?? record.acknowledged_at) && !pickString(record.emergencyDialedAt ?? record.emergency_dialed_at)
      )
  };
}

export async function getIntruderAlerts() {
  const res = await fetchWithAdminAuth("/intruder-alerts", {
    method: "GET"
  });

  if (!res.ok) {
    const body = await readMaybeJson(res);
    throw new ApiError(`API error: ${res.status}`, res.status, body);
  }

  const body = (await res.json()) as { activeAlert: unknown; history: unknown[] };
  return {
    activeAlert: body.activeAlert ? normalizeIntruderAlertRecord(body.activeAlert) : null,
    history: Array.isArray(body.history) ? body.history.map(normalizeIntruderAlertRecord) : []
  } satisfies IntruderAlertFeed;
}

export async function acknowledgeIntruderAlert(id: number) {
  const res = await fetchWithAdminAuth(`/intruder-alerts/${id}/acknowledge`, {
    method: "POST"
  });

  if (!res.ok) {
    const body = await readMaybeJson(res);
    throw new ApiError(`API error: ${res.status}`, res.status, body);
  }

  return normalizeIntruderAlertRecord(await res.json());
}

export async function markIntruderAlertEmergency(id: number) {
  const res = await fetchWithAdminAuth(`/intruder-alerts/${id}/emergency`, {
    method: "POST"
  });

  if (!res.ok) {
    const body = await readMaybeJson(res);
    throw new ApiError(`API error: ${res.status}`, res.status, body);
  }

  return normalizeIntruderAlertRecord(await res.json());
}
