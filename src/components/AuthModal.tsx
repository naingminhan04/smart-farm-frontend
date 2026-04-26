import type { AuthModalProps } from "../types";
import { GitHubLogo, GoogleLogo } from "./icons";
import { buttonBase, buttonDanger, buttonMuted, buttonPrimary, inputClass, panelClass } from "./ui";
import { cx } from "./utils";

export function AuthModal({
  admin,
  authError,
  authMethodLabel,
  authPassword,
  authProvider,
  authSubmitting,
  authTab,
  authUsername,
  isOpen,
  onAuthPasswordChange,
  onAuthTabChange,
  onAuthUsernameChange,
  onClose,
  onLogin,
  onLogout,
  onRegister,
  onStartOauth,
  onClearAuthError
}: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/75" aria-label="Close" onClick={onClose} />
      <div className={cx(panelClass, "before:hidden relative z-10 w-full max-w-md")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              {admin ? "Account" : authTab === "signup" ? "Create account" : "Welcome back"}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {admin ? "Your current admin session details." : "Sign up or log in to access admin features."}
            </p>
          </div>
          {!admin ? (
            <button className={buttonMuted} onClick={onClose}>
              Close
            </button>
          ) : null}
        </div>

        {authError && (
          <div className="mt-4 w-full rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
            {authError}
          </div>
        )}
        {admin ? (
          <>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-neutral-700/70 bg-neutral-800/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Logged In User</div>
                <div className="mt-2 text-base font-semibold text-slate-100">{admin.username}</div>
              </div>
              <div className="rounded-2xl border border-neutral-700/70 bg-neutral-800/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Login Method</div>
                <div className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-100">
                  {authProvider === "google" ? <GoogleLogo /> : null}
                  {authProvider === "github" ? <GitHubLogo /> : null}
                  <span>{authMethodLabel}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button className={buttonMuted} onClick={onClose} disabled={authSubmitting}>
                Cancel
              </button>
              <button className={buttonDanger} onClick={onLogout} disabled={authSubmitting}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-4 flex w-full items-center rounded-full border border-neutral-700/70 bg-neutral-800/70 p-1">
              <button
                onClick={() => {
                  onAuthTabChange("login");
                  onClearAuthError();
                }}
                className={cx(
                  "flex-1 rounded-full px-3 py-1 text-xs font-semibold transition",
                  authTab === "login" ? "bg-neutral-100 text-neutral-900" : "text-slate-300 hover:text-slate-100"
                )}
                disabled={authSubmitting}
              >
                Login
              </button>
              <button
                onClick={() => {
                  onAuthTabChange("signup");
                  onClearAuthError();
                }}
                className={cx(
                  "flex-1 rounded-full px-3 py-1 text-xs font-semibold transition",
                  authTab === "signup" ? "bg-neutral-100 text-neutral-900" : "text-slate-300 hover:text-slate-100"
                )}
                disabled={authSubmitting}
              >
                Sign up
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Username</label>
                <input
                  value={authUsername}
                  onChange={(e) => onAuthUsernameChange(e.target.value)}
                  className={cx(inputClass, "mt-2 w-full")}
                  autoComplete="username"
                  disabled={authSubmitting}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <input
                  value={authPassword}
                  onChange={(e) => onAuthPasswordChange(e.target.value)}
                  className={cx(inputClass, "mt-2 w-full")}
                  type="password"
                  autoComplete="current-password"
                  disabled={authSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (authTab === "signup") onRegister();
                      else onLogin();
                    }
                    if (e.key === "Escape") onClose();
                  }}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button className={buttonMuted} onClick={onClose} disabled={authSubmitting}>
                Cancel
              </button>
              {authTab === "signup" ? (
                <button className={buttonPrimary} onClick={onRegister} disabled={authSubmitting}>
                  {authSubmitting ? "Signing up..." : "Sign up"}
                </button>
              ) : (
                <button className={buttonPrimary} onClick={onLogin} disabled={authSubmitting}>
                  {authSubmitting ? "Signing in..." : "Sign in"}
                </button>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Or continue with
              </div>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                className={cx(
                  buttonBase,
                  "w-full border border-[#4285F4]/30 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,244,255,0.95))] text-slate-900 hover:border-[#4285F4]/50"
                )}
                onClick={() => onStartOauth("google")}
                disabled={authSubmitting}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white">
                  <GoogleLogo />
                </span>
                <span className="text-sm font-semibold">
                  {authTab === "signup" ? "Sign up with Google" : "Sign in with Google"}
                </span>
              </button>
              <button
                className={cx(
                  buttonBase,
                  "w-full border border-neutral-700/80 bg-neutral-900 text-neutral-100 hover:border-neutral-500/80 hover:bg-neutral-800"
                )}
                onClick={() => onStartOauth("github")}
                disabled={authSubmitting}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <GitHubLogo />
                </span>
                <span className="text-sm font-semibold">
                  {authTab === "signup" ? "Sign up with GitHub" : "Sign in with GitHub"}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
