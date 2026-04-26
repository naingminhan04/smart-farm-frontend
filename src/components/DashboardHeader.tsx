import { useEffect, useRef, useState } from "react";
import type { AppTab, DashboardHeaderProps } from "../types";
import { cx } from "./utils";

export function DashboardHeader({
  activeTab,
  admin,
  onTabChange,
  onOpenAdminSession,
  onOpenAdminLogin
}: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const navButtonClass = "rounded-md px-2.5 py-1.5 text-sm font-medium transition";
  const navActiveClass = "text-white";
  const navInactiveClass = "text-slate-400 hover:text-slate-200";

  function handleSelectTab(tab: AppTab) {
    onTabChange(tab);
    setMobileMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const previousY = lastScrollYRef.current;

      if (currentY <= 8) {
        setHeaderVisible(true);
      } else if (currentY < previousY) {
        setHeaderVisible(true);
      } else if (currentY > previousY) {
        setHeaderVisible(false);
      }

      lastScrollYRef.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cx(
        "sticky top-0 z-40 mb-6 animate-fade-up transition-transform duration-300",
        headerVisible ? "translate-y-0" : "-translate-y-[120%]"
      )}
    >
      <div className="relative z-40 -mx-4 -mt-6 w-auto border-b border-slate-800 bg-neutral-900 px-4 py-3 shadow-[0_14px_30px_rgba(0,0,0,0.35)] backdrop-blur sm:-mx-6 sm:border sm:border-slate-800 sm:px-5">
        <div className="flex items-center justify-between gap-3 lg:gap-6">
          <div className="min-w-0 flex items-center">
            <h1 className="text-lg font-semibold tracking-tight text-slate-100 sm:text-xl">Smart Farm</h1>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            {admin ? (
              <button
                type="button"
                className={cx(navButtonClass, navInactiveClass)}
                onClick={onOpenAdminSession}
                title={`Admin session: ${admin.username}`}
                aria-label={`Admin session: ${admin.username}`}
              >
                Profile
              </button>
            ) : (
              <button
                type="button"
                className={cx(navButtonClass, navInactiveClass)}
                onClick={onOpenAdminLogin}
                title="Admin login"
                aria-label="Admin login"
              >
                Sign in
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex items-center rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-xs font-medium text-slate-200"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? (
                <span className="relative block h-3.5 w-3.5">
                  <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 rotate-45 bg-slate-300" />
                  <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 -rotate-45 bg-slate-300" />
                </span>
              ) : (
                <span className="flex h-3.5 w-3.5 flex-col justify-between">
                  <span className="h-px w-full bg-slate-300" />
                  <span className="h-px w-full bg-slate-300" />
                  <span className="h-px w-full bg-slate-300" />
                </span>
              )}
            </button>
          </div>

          <div className="hidden flex-wrap items-center gap-2 sm:ml-auto sm:flex sm:justify-end">
            <nav className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectTab("dashboard")}
                className={cx(navButtonClass, activeTab === "dashboard" ? navActiveClass : navInactiveClass)}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => handleSelectTab("feature")}
                className={cx(navButtonClass, activeTab === "feature" ? navActiveClass : navInactiveClass)}
              >
                Feature
              </button>
              <button
                type="button"
                onClick={() => handleSelectTab("showcase")}
                className={cx(navButtonClass, activeTab === "showcase" ? navActiveClass : navInactiveClass)}
              >
                Showcase
              </button>
              {admin ? (
                <button
                  type="button"
                  className={cx(navButtonClass, navInactiveClass)}
                  onClick={onOpenAdminSession}
                  title={`Admin session: ${admin.username}`}
                  aria-label={`Admin session: ${admin.username}`}
                >
                  Profile
                </button>
              ) : (
                <button
                  type="button"
                  className={cx(navButtonClass, navInactiveClass)}
                  onClick={onOpenAdminLogin}
                  title="Admin login"
                  aria-label="Admin login"
                >
                  Sign in
                </button>
              )}
            </nav>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="absolute left-0 right-0 z-50 bg-neutral-900 p-3 sm:hidden">
            <nav className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSelectTab("dashboard")}
                className={cx("w-full text-left", navButtonClass, activeTab === "dashboard" ? navActiveClass : navInactiveClass)}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => handleSelectTab("feature")}
                className={cx("w-full text-left", navButtonClass, activeTab === "feature" ? navActiveClass : navInactiveClass)}
              >
                Feature
              </button>
              <button
                type="button"
                onClick={() => handleSelectTab("showcase")}
                className={cx("w-full text-left", navButtonClass, activeTab === "showcase" ? navActiveClass : navInactiveClass)}
              >
                Showcase
              </button>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
