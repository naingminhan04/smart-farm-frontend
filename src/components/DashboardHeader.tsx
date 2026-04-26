import type { AdminUser } from "../types";
import { ProfileIcon } from "./icons";
import { badgeClass, buttonBase, buttonPrimary } from "./ui";
import { cx } from "./utils";

type DashboardHeaderProps = {
  activeTab: "dashboard" | "showcase";
  admin: AdminUser | null;
  lastUpdatedLabel: string;
  manualRefreshing: boolean;
  onTabChange: (tab: "dashboard" | "showcase") => void;
  onManualRefresh: () => void;
  onOpenAdminSession: () => void;
  onOpenAdminLogin: () => void;
};

export function DashboardHeader({
  activeTab,
  admin,
  lastUpdatedLabel,
  manualRefreshing,
  onTabChange,
  onManualRefresh,
  onOpenAdminSession,
  onOpenAdminLogin
}: DashboardHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <svg viewBox="0 0 24 24" className="h-full w-full text-sky-300" fill="none" aria-hidden="true">
              <path
                d="M5 17c2.2 0 3.4-1.4 4.4-2.7C10.5 12.9 11.5 12 13 12c2.3 0 3.7 2 6 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M7 7l2.5 2.5L12 7l2.5 2.5L17 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.9rem]">Smart Farm Dashboard</h1>
            <p className="mt-1 text-sm text-slate-300">
              Live environment telemetry, access control, and door automation.
            </p>
            <div className="mt-4 inline-flex rounded-2xl border border-white/10 bg-slate-900/70 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
              <button
                type="button"
                onClick={() => onTabChange("dashboard")}
                className={cx(
                  "rounded-xl px-4 py-2 text-sm font-semibold transition",
                  activeTab === "dashboard" ? "bg-sky-400 text-slate-950" : "text-slate-300 hover:bg-white/5"
                )}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => onTabChange("showcase")}
                className={cx(
                  "rounded-xl px-4 py-2 text-sm font-semibold transition",
                  activeTab === "showcase" ? "bg-emerald-400 text-slate-950" : "text-slate-300 hover:bg-white/5"
                )}
              >
                Showcase
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-fade-up [animation-delay:80ms]">
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {activeTab === "dashboard" ? (
            <>
              <span className={badgeClass}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-soft-pulse rounded-full bg-emerald-400/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Updated: {lastUpdatedLabel}
              </span>
              <button onClick={onManualRefresh} disabled={manualRefreshing} className={buttonPrimary}>
                <svg
                  viewBox="0 0 24 24"
                  className={cx("h-4 w-4", manualRefreshing && "animate-spin")}
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M20 12a8 8 0 1 1-2.34-5.66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path
                    d="M20 4v6h-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Refresh
              </button>
            </>
          ) : (
            <span className={badgeClass}>Curated project diagrams and future media</span>
          )}
          {admin ? (
            <button
              className={cx(
                buttonBase,
                "h-11 w-11 min-h-11 min-w-11 shrink-0 rounded-2xl px-0",
                "border border-emerald-300/35 bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              )}
              onClick={onOpenAdminSession}
              title={`Admin session: ${admin.username}`}
              aria-label={`Admin session: ${admin.username}`}
            >
              <span className="inline-flex h-6 w-6 flex-none items-center justify-center">
                <ProfileIcon />
              </span>
            </button>
          ) : (
            <button
              className={cx(
                buttonBase,
                "h-11 w-11 min-h-11 min-w-11 shrink-0 rounded-2xl px-0",
                "border border-sky-300/30 bg-sky-400 text-slate-950 hover:bg-sky-300"
              )}
              onClick={onOpenAdminLogin}
              title="Admin login"
              aria-label="Admin login"
            >
              <span className="inline-flex h-6 w-6 flex-none items-center justify-center">
                <ProfileIcon />
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
