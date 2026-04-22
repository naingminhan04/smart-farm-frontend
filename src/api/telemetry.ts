import type { TempHumiRecord } from "../types";
import { request } from "./base";

export function getLatest() {
  return request<TempHumiRecord>("/temp-humi/latest");
}

export function getHistory(limit = 30) {
  return request<TempHumiRecord[]>(`/temp-humi/history?limit=${limit}`);
}
