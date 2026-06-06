"use client";

import { ExternalLink } from "lucide-react";
import type { Bullet, LessonSection } from "@/lib/types";

function BulletNode({ node, depth }: { node: Bullet; depth: number }) {
  return (
    <li className="leading-relaxed">
      <div className="flex items-start gap-2">
        <span
          className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full"
          style={{
            backgroundColor: depth === 0 ? "#7802df" : "#c9bff0",
          }}
        />
        <span className="text-ink-700">
          {node.href ? (
            <a
              href={node.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-brand-500 hover:underline"
            >
              {node.text}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            node.text
          )}
        </span>
      </div>
      {node.children && node.children.length > 0 && (
        <ul className="mt-1.5 flex flex-col gap-1.5 pl-5">
          {node.children.map((c, i) => (
            <BulletNode key={i} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function LessonSections({ sections }: { sections: LessonSection[] }) {
  return (
    <div className="mt-6 flex flex-col gap-5">
      {sections.map((section, i) => (
        <div key={i} className="rounded-2xl border border-line bg-white p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-500">
            {section.heading}
          </h3>
          <ul className="flex flex-col gap-2">
            {section.bullets.map((node, j) => (
              <BulletNode key={j} node={node} depth={0} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
