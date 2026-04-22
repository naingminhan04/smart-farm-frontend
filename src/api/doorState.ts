import type { DoorState, DoorStateResponse, DoorStateUpdateResponse } from "../types";
import { ApiError, fetchWithAdminAuth, readMaybeJson, request } from "./base";

export function getDoorState() {
  return request<DoorStateResponse>("/door-state");
}

export async function setDoorState(state: DoorState) {
  const res = await fetchWithAdminAuth("/door-state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state })
  });

  if (!res.ok) {
    const body = await readMaybeJson(res);
    throw new ApiError(`API error: ${res.status}`, res.status, body);
  }

  return (await res.json()) as DoorStateUpdateResponse;
}
