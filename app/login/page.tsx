"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { KeyRound, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useAcademy } from "@/lib/store/AcademyProvider";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithCode } = useAcademy();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = loginWithCode(code);
    if (!user) {
      setError(true);
      return;
    }
    router.push(user.role === "admin" ? "/admin" : "/classroom");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[760px] -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-100 via-brand-50 to-transparent blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center"
      >
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand text-white">
          <KeyRound className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-2xl">Enter your access code</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Members sign in with the code from their welcome email.
        </p>

        <form onSubmit={submit} className="mt-6">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(false);
            }}
            inputMode="numeric"
            placeholder="• • • •"
            className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-center text-2xl font-semibold tracking-[0.4em] text-ink-900 outline-none focus:border-brand-300"
          />
          {error && (
            <p className="mt-2 text-sm font-medium text-red-600">
              That code didn&apos;t match. Try again.
            </p>
          )}
          <Button size="lg" className="mt-4 w-full" type="submit">
            Enter <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-5 rounded-xl bg-surface-2 px-4 py-3 text-xs text-ink-500">
          Demo codes — Member: <span className="font-semibold">1234</span> ·
          Admin: <span className="font-semibold">9999</span>
        </div>

        <Link
          href="/classroom/30-day-challenge"
          className="mt-4 inline-block text-sm font-medium text-brand-500 hover:underline"
        >
          Or browse the free course →
        </Link>
      </motion.div>
    </div>
  );
}
