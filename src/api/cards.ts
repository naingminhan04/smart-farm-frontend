import type { CardResponse } from "../types";
import { ApiError, fetchWithAdminAuth, readMaybeJson, request } from "./base";

export function getCards() {
  return request<string[]>("/cards");
}

export async function addCard(cardNum: string) {
  const res = await fetchWithAdminAuth("/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardNum })
  });

  if (!res.ok) {
    const body = await readMaybeJson(res);
    throw new ApiError(`API error: ${res.status}`, res.status, body);
  }

  return (await res.json()) as CardResponse;
}

export async function editCard(currentCardNum: string, nextCardNum: string) {
  const res = await fetchWithAdminAuth(`/cards/${encodeURIComponent(currentCardNum)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardNum: nextCardNum })
  });

  if (!res.ok) {
    const body = await readMaybeJson(res);
    throw new ApiError(`API error: ${res.status}`, res.status, body);
  }

  return (await res.json()) as CardResponse;
}

export async function deleteCard(cardNum: string) {
  const res = await fetchWithAdminAuth(`/cards/${encodeURIComponent(cardNum)}`, { method: "DELETE" });

  if (!res.ok) {
    const body = await readMaybeJson(res);
    throw new ApiError(`API error: ${res.status}`, res.status, body);
  }
}
