"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Lock } from "lucide-react";
import type { Module } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function LockedGate({ module }: { module?: Module }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-16">
      <Link
        href="/classroom"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> Classroom
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mt-6 overflow-hidden rounded-3xl border border-line bg-white"
      >
        <div
          className="flex flex-col items-center gap-3 px-6 py-14 text-center text-white"
          style={{ backgroundImage: "linear-gradient(135deg,#7802DF,#FF0BD6)" }}
        >
          <motion.div
            initial={{ rotate: -8, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 14 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur"
          >
            <Lock className="h-8 w-8" />
          </motion.div>
          <h1 className="text-2xl text-white sm:text-3xl">
            {module ? module.title : "This module"} is locked
          </h1>
          <p className="max-w-md text-white/85">
            This is a partner-only module. Ask your AssignX admin to unlock it,
            or keep building with the free course.
          </p>
          <Link href="/classroom/30-day-challenge" className="mt-2">
            <Button variant="secondary" size="lg">
              Back to the free course
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
