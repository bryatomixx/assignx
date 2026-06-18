"use client";

// Next.js 16 App Router: useRouter from 'next/navigation', useSearchParams needs Suspense.
// Docs read: use-router.md, use-search-params.md

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tab control types
// ---------------------------------------------------------------------------

type Tab = "signin" | "signup";

// ---------------------------------------------------------------------------
// PasswordChangedBanner -- reads ?msg=password-changed from URL
// ---------------------------------------------------------------------------

function PasswordChangedBanner() {
  const params = useSearchParams();
  if (params.get("msg") !== "password-changed") return null;
  return (
    <div
      role="status"
      className="mb-5 flex items-start gap-2.5 rounded-xl bg-success/10 px-4 py-3 text-sm text-success"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <span>Your password has been updated. Sign in with your new password.</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldGroup: label + input pattern
// ---------------------------------------------------------------------------

function FieldGroup({
  id,
  label,
  type = "text",
  autoComplete,
  value,
  onChange,
  placeholder,
  error,
  hint,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  hint?: React.ReactNode;
}) {
  // For password fields, allow toggling the value between hidden and visible.
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);
  const inputType = isPassword && revealed ? "text" : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-ink-700"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-xl border bg-surface-2 px-4 py-3 text-[15px] outline-none transition-colors",
            "focus:border-brand-300 focus:ring-2 focus:ring-brand-100",
            isPassword && "pr-11",
            error ? "border-red-400" : "border-line",
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            tabIndex={-1}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-400 transition-colors hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p className="text-[11px] text-ink-300">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-[13px] font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sign In form
// ---------------------------------------------------------------------------

function SignInForm({ onSwitchTab }: { onSwitchTab: () => void }) {
  const router = useRouter();
  const { signIn } = useAcademy();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
    if (!password) return "Password is required.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valErr = validate();
    if (valErr) { setError(valErr); return; }

    setLoading(true);
    setError(null);
    const result = await signIn({ email: email.trim(), password });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // Redirect based on the resolved user's role returned by signIn (not stale
    // closure state).
    router.push(result.user?.role === "admin" ? "/dashboard" : "/classroom");
  };

  // Map specific error patterns to actionable messages with a sign-up prompt.
  const renderError = () => {
    if (!error) return null;
    const isAlreadyExists = error.toLowerCase().includes("already exists");
    return (
      <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        {isAlreadyExists ? (
          <>
            An account with this email already exists.{" "}
            <button
              type="button"
              onClick={onSwitchTab}
              className="font-semibold underline"
            >
              Sign in instead
            </button>
          </>
        ) : (
          error
        )}
      </div>
    );
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {renderError()}

      <FieldGroup
        id="signin-email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(v) => { setEmail(v); setError(null); }}
        placeholder="you@example.com"
      />
      <FieldGroup
        id="signin-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(v) => { setPassword(v); setError(null); }}
        placeholder="••••••••"
      />

      <p className="text-[12px] text-ink-300">
        Forgot your password? Contact your administrator.
      </p>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Sign Up form
// ---------------------------------------------------------------------------

function SignUpForm({ onSwitchTab }: { onSwitchTab: () => void }) {
  const router = useRouter();
  const { signUp } = useAcademy();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!trimmedName) {
      errs.name = "Full name is required.";
    } else if (trimmedName.length < 2 || trimmedName.length > 80) {
      errs.name = "Name must be between 2 and 80 characters.";
    }
    if (!email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address.";
    }
    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }
    if (!confirm) {
      errs.confirm = "Please confirm your password.";
    } else if (confirm !== password) {
      errs.confirm = "Passwords do not match.";
    }
    return errs;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    setFieldErrors({});
    setGlobalError(null);

    const result = await signUp({
      name: name.trim(),
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (result.error) {
      setGlobalError(result.error);
      // If the account already exists, switch to the Sign In tab (design intent).
      if (result.error.toLowerCase().includes("already exists")) {
        onSwitchTab();
      }
      return;
    }

    // Redirect based on the resolved user's role returned by signUp (not stale
    // closure state).
    router.push(result.user?.role === "admin" ? "/dashboard" : "/classroom");
  };

  const renderGlobalError = () => {
    if (!globalError) return null;
    const isAlreadyExists = globalError.toLowerCase().includes("already exists");
    return (
      <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        {isAlreadyExists ? (
          <>
            An account with this email already exists.{" "}
            <button
              type="button"
              onClick={onSwitchTab}
              className="font-semibold underline"
            >
              Sign in instead
            </button>
          </>
        ) : (
          globalError
        )}
      </div>
    );
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {renderGlobalError()}

      <FieldGroup
        id="signup-name"
        label="Full name"
        type="text"
        autoComplete="name"
        value={name}
        onChange={(v) => { setName(v); setFieldErrors((p) => ({ ...p, name: "" })); }}
        placeholder="Jane Smith"
        error={fieldErrors.name}
      />
      <FieldGroup
        id="signup-email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(v) => { setEmail(v); setFieldErrors((p) => ({ ...p, email: "" })); }}
        placeholder="you@example.com"
        error={fieldErrors.email}
        hint="Use the same email address associated with your agency account."
      />
      <FieldGroup
        id="signup-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(v) => { setPassword(v); setFieldErrors((p) => ({ ...p, password: "" })); }}
        placeholder="Min. 8 characters"
        error={fieldErrors.password}
      />
      <FieldGroup
        id="signup-confirm"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(v) => { setConfirm(v); setFieldErrors((p) => ({ ...p, confirm: "" })); }}
        placeholder="Repeat your password"
        error={fieldErrors.confirm}
      />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main login page (wrapped in Suspense for useSearchParams)
// ---------------------------------------------------------------------------

function LoginInner() {
  const router = useRouter();
  const { currentUser, authLoading } = useAcademy();
  const [tab, setTab] = useState<Tab>("signin");

  // If already authenticated, send the user to their home by role. Guarded by
  // authLoading so we do not redirect before the session resolves.
  useEffect(() => {
    if (!authLoading && currentUser) {
      router.replace(currentUser.role === "admin" ? "/dashboard" : "/classroom");
    }
  }, [authLoading, currentUser, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      {/* Background blob */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[760px] -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-100 via-brand-50 to-transparent blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-[420px]"
      >
        {/* Segmented tab control -- above the card */}
        <div
          role="tablist"
          aria-label="Authentication options"
          className="mb-3 flex rounded-xl bg-surface-3 p-1"
        >
          <button
            role="tab"
            aria-selected={tab === "signin"}
            aria-controls="panel-signin"
            id="tab-signin"
            type="button"
            onClick={() => setTab("signin")}
            className={cn(
              "flex-1 rounded-[9px] py-2 text-sm font-semibold transition-all",
              tab === "signin"
                ? "bg-white text-ink-900 shadow-sm"
                : "text-ink-500 hover:text-ink-700",
            )}
          >
            Sign In
          </button>
          <button
            role="tab"
            aria-selected={tab === "signup"}
            aria-controls="panel-signup"
            id="tab-signup"
            type="button"
            onClick={() => setTab("signup")}
            className={cn(
              "flex-1 rounded-[9px] py-2 text-sm font-semibold transition-all",
              tab === "signup"
                ? "bg-white text-ink-900 shadow-sm"
                : "text-ink-500 hover:text-ink-700",
            )}
          >
            Sign Up
          </button>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-line bg-white p-8">
          {/* Logo (links out to the main AssignX website) */}
          <div className="mb-6 flex justify-center">
            <a
              href="https://www.assignx.ai"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="AssignX website"
            >
              <Logo className="h-20" />
            </a>
          </div>

          {/* Password changed banner (reads ?msg param) */}
          <Suspense>
            <PasswordChangedBanner />
          </Suspense>

          {/* Sign In panel */}
          <div
            role="tabpanel"
            id="panel-signin"
            aria-labelledby="tab-signin"
            hidden={tab !== "signin"}
          >
            {tab === "signin" && (
              <SignInForm onSwitchTab={() => setTab("signup")} />
            )}
          </div>

          {/* Sign Up panel */}
          <div
            role="tabpanel"
            id="panel-signup"
            aria-labelledby="tab-signup"
            hidden={tab !== "signup"}
          >
            {tab === "signup" && (
              <SignUpForm onSwitchTab={() => setTab("signin")} />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
