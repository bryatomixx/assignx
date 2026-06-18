"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TemplateItem } from "@/lib/types";

/** A single collapsible template with a copy-to-clipboard button. */
function AccordionItem({
  item,
  open,
  onToggle,
}: {
  item: TemplateItem;
  open: boolean;
  onToggle: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(item.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300"
      >
        <span className="font-semibold text-ink-900">{item.title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-line"
          >
            <div className="flex items-center justify-end px-4 pt-2.5">
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="max-h-[30rem] overflow-y-auto whitespace-pre-line px-4 pb-4 pt-2 text-sm leading-relaxed text-ink-700">
              {item.body}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Accordion of templates (e.g. the AI agent script library). */
export function LessonAccordion({ templates }: { templates: TemplateItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mt-5 flex flex-col gap-2">
      {templates.map((item) => (
        <AccordionItem
          key={item.id}
          item={item}
          open={openId === item.id}
          onToggle={() => setOpenId(openId === item.id ? null : item.id)}
        />
      ))}
    </div>
  );
}
