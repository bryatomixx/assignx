"use client";

import { Check, ClipboardCheck, ExternalLink, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseVideo, toEmbedUrl, type VideoSource } from "@/lib/video";
import type { Bullet, Chapter } from "@/lib/types";

// ---- Bullet renderer (same visual language as LessonSections) ----
function BulletNode({ node, depth }: { node: Bullet; depth: number }) {
  return (
    <li className="leading-relaxed">
      <div className="flex items-start gap-2">
        <span
          className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: depth === 0 ? "#7802df" : "#c9bff0" }}
        />
        <span className="text-sm text-ink-700">
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

// ---- Inline video for video-tasks (plain embed, independent of the main player) ----
// Provider-aware: works for both YouTube and Loom via toEmbedUrl().
function TaskVideo({ source, title }: { source: VideoSource; title: string }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-line bg-black aspect-video">
      <iframe
        className="h-full w-full"
        src={toEmbedUrl(source)}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}

// ---- Done toggle ----
function TaskDoneButton({
  done,
  onToggle,
}: {
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      className={cn(
        "mt-4 flex w-full items-center justify-center gap-2 rounded-[9px] border px-5 py-2.5 text-sm font-medium transition-colors",
        done
          ? "border-success/30 bg-success/10 text-success"
          : "border-line bg-white text-ink-700 hover:border-brand-300",
      )}
    >
      {done ? (
        <>
          <Check className="h-4 w-4" strokeWidth={2.5} /> Task done (click to undo)
        </>
      ) : (
        <>
          <ClipboardCheck className="h-4 w-4" /> Mark task as done
        </>
      )}
    </button>
  );
}

// ---- Public component ----
export interface ChapterDetailProps {
  chapter: Chapter;
  /** Whether this chapter's task is marked done. */
  taskDone: boolean;
  onToggleTask: () => void;
}

export function ChapterDetail({
  chapter,
  taskDone,
  onToggleTask,
}: ChapterDetailProps) {
  const task = chapter.task;
  const taskVideo = task?.type === "video" ? parseVideo(task.video) : null;
  return (
    <div className="mt-5">
      <h2 className="text-xl font-semibold text-ink-900">{chapter.title}</h2>
      {chapter.description && (
        <p className="mt-2 leading-relaxed text-ink-700">{chapter.description}</p>
      )}

      {task && (
        <div className="mt-5 rounded-2xl border border-line bg-white p-5">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-500">
            {task.type === "video" ? (
              <PlayCircle className="h-3.5 w-3.5" />
            ) : (
              <ClipboardCheck className="h-3.5 w-3.5" />
            )}
            Your task
          </div>
          <p className="text-[15px] font-semibold text-ink-900">{task.title}</p>
          {task.body && (
            <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
              {task.body}
            </p>
          )}

          {taskVideo && <TaskVideo source={taskVideo} title={task.title} />}

          {task.bullets && task.bullets.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {task.bullets.map((node, i) => (
                <BulletNode key={i} node={node} depth={0} />
              ))}
            </ul>
          )}

          <TaskDoneButton done={taskDone} onToggle={onToggleTask} />
        </div>
      )}
    </div>
  );
}
