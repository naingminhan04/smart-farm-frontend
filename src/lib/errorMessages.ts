import { ApiError } from "../api";
import type { AuthTab } from "../types";

export function normalizeAuthErrorMessage(error: string | null | undefined) {
  if (!error) return null;

  const trimmed = error.trim();
  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase();

  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return "Unable to connect. Please try again.";
  }

  if (normalized.includes("api error: 400")) {
    return "Please check your details and try again.";
  }

  if (normalized.includes("api error: 401") || normalized.includes("unauthorized")) {
    return "Your login details were not accepted. Please try again.";
  }

  if (normalized.includes("api error: 409")) {
    return "That username is already taken. Please choose another or sign in.";
  }

  if (normalized.includes("api error: 5")) {
    return "Something went wrong on our side. Please try again.";
  }

  return trimmed;
}

export function getDashboardErrorMessage(err: unknown, fallback = "Something went wrong. Please try again.") {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Your session expired. Please sign in again.";
    if (err.status === 403) return "You do not have permission to do that.";
    if (err.status === 404) return "We could not find what you were looking for.";
    if (err.status >= 500) return "Something went wrong on our side. Please try again.";
    return fallback;
  }

  if (err instanceof Error) {
    const message = err.message.trim().toLowerCase();

    if (message.includes("no internet connection")) {
      return "No internet connection. Please check your connection and try again.";
    }

    if (
      message.includes("unable to connect") ||
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("connecting to the server")
    ) {
      return "Unable to connect. Please try again.";
    }

    return fallback;
  }

  return fallback;
}

export function getAuthActionErrorMessage(action: AuthTab, err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 400) {
      return action === "signup"
        ? "Username must be 3-64 characters and password at least 8 characters."
        : "Please enter both your username and password.";
    }

    if (err.status === 401) {
      return "Invalid username or password.";
    }

    if (err.status === 409) {
      return "That username is already taken. Please choose another or sign in.";
    }

    if (err.status >= 500) {
      return "Something went wrong on our side. Please try again.";
    }

    return "Something went wrong. Please try again.";
  }

  if (err instanceof Error) {
    return normalizeAuthErrorMessage(err.message) ?? "Something went wrong. Please try again.";
  }

  return "Something went wrong. Please try again.";
}
