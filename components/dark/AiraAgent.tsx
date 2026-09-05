"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AiraGlyph, SendIcon } from "./Icons";

/**
 * One thing AIRA can answer on this screen.
 *
 * The answer is written against the same fixtures the page renders, so the
 * agent cannot contradict the numbers printed behind it.
 */
export type AiraTopic = {
  id: string;
  /** Offered as a chip, and echoed as the reviewer's turn when chosen. */
  question: string;
  /**
   * Lowercase terms that route a typed question here. Matching is on how many
   * of these appear, so a topic wants distinguishing words rather than many.
   */
  keywords: string[];
  answer: string;
  action?: { label: string; onClick: () => void };
};

type Turn = {
  key: number;
  from: "aira" | "you";
  text: string;
  action?: { label: string; onClick: () => void };
};

/**
 * Which topic a typed question is asking about.
 *
 * Scored on keyword hits rather than matched on a whole phrase: a reviewer
 * types "why are so many samples stuck", not the chip's wording. A tie goes to
 * the earlier topic, which is the order the page considered most important.
 */
const resolve = (asked: string, topics: AiraTopic[]): AiraTopic | undefined => {
  const text = asked.toLowerCase();
  let best: AiraTopic | undefined;
  let bestScore = 0;

  for (const topic of topics) {
    const score = topic.keywords.filter((word) => text.includes(word)).length;
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }

  return best;
};

/**
 * AIRA on a dashboard, as something you can ask rather than only read.
 *
 * It answers from this screen's fixtures and says so when a question falls
 * outside them. That limit is deliberate and visible: an assistant in a QA
 * record that improvises an answer is worse than one that declines, because
 * the reviewer cannot tell the two apart.
 */
export function V3AiraAgent({
  scope,
  greeting,
  topics,
}: {
  /** What AIRA can see from here. Shown under its name, and in the decline. */
  scope: string;
  greeting: string;
  topics: AiraTopic[];
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string[]>([]);
  const [turns, setTurns] = useState<Turn[]>([
    { key: 0, from: "aira", text: greeting },
  ]);

  const nextKey = useRef(1);
  const foot = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  /* Chips drop off as they are used, so the list shrinks towards the questions
     that have not been answered yet rather than repeating what is on screen. */
  const remaining = useMemo(
    () => topics.filter((topic) => !asked.includes(topic.id)),
    [topics, asked],
  );

  /* The newest turn, not the top of the thread, is what the reader wants. */
  useEffect(() => {
    foot.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const say = (theirs: string, topic: AiraTopic | undefined) => {
    const reply: Turn = topic
      ? {
          key: nextKey.current + 1,
          from: "aira",
          text: topic.answer,
          action: topic.action,
        }
      : {
          key: nextKey.current + 1,
          from: "aira",
          /* Naming what it does hold turns a dead end into a next step, and
             keeps the decline from reading as a failure to understand. */
          text: `I can only answer from ${scope}, and I do not have that here. What I can account for on this screen: ${topics
            .map((topic) => topic.question.replace(/\?$/, ""))
            .join("; ")}.`,
        };

    setTurns((current) => [
      ...current,
      { key: nextKey.current, from: "you", text: theirs },
      reply,
    ]);
    nextKey.current += 2;
    if (topic) setAsked((current) => [...current, topic.id]);
  };

  const submit = () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    setQuestion("");
    say(trimmed, resolve(trimmed, topics));
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ask AIRA about ${scope}`}
        className="fixed right-6 bottom-6 z-30 flex cursor-pointer items-center gap-2 rounded-full border border-[var(--v3-aira-border)] bg-[var(--v3-aira-bg)] py-2.5 pr-4 pl-3.5 text-[12px] font-semibold text-[var(--v3-aira-name)] shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-colors duration-[120ms] hover:bg-[rgba(124,92,252,0.18)] focus-visible:ring-2 focus-visible:ring-[var(--v3-aira)] focus-visible:outline-none"
      >
        <span className="text-[var(--v3-aira)]">
          <AiraGlyph size={15} />
        </span>
        Ask AIRA
      </button>
    );
  }

  return (
    <aside
      aria-label="AIRA"
      className="fixed right-6 bottom-6 z-30 flex h-[min(72vh,560px)] w-[380px] flex-col overflow-hidden rounded-[14px] border border-[var(--v3-aira-border)] bg-[var(--v3-bg-surface)] shadow-[0_16px_48px_rgba(0,0,0,0.55)]"
    >
      {/* Who is speaking, and what it can see ------------------------------ */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-[var(--v3-border-default)] px-4 py-3">
        <span className="text-[var(--v3-aira)]">
          <AiraGlyph size={15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--v3-aira-name)]">
            AIRA
            <span
              aria-hidden="true"
              className="v3-aira-dot size-[5px] rounded-full bg-[var(--v3-aira)]"
            />
          </span>
          <span className="block truncate text-[10px] text-[var(--v3-text-muted)]">
            Reading {scope}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close AIRA"
          className="cursor-pointer rounded-[4px] px-1.5 py-0.5 text-[15px] leading-none text-[var(--v3-text-muted)] transition-colors duration-[120ms] hover:text-[var(--v3-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--v3-aira)] focus-visible:outline-none"
        >
          &times;
        </button>
      </div>

      {/* The thread -------------------------------------------------------- */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5">
        <div className="flex flex-col gap-3">
          {turns.map((turn) =>
            turn.from === "you" ? (
              <div key={turn.key} className="flex justify-end">
                <p className="max-w-[85%] rounded-[10px] rounded-br-[3px] bg-[var(--v3-bg-card-hover)] px-3 py-2 text-[11px] leading-[1.55] text-[var(--v3-text-primary)]">
                  {turn.text}
                </p>
              </div>
            ) : (
              <div key={turn.key} className="flex">
                <div className="max-w-[92%] rounded-[10px] rounded-bl-[3px] border border-[var(--v3-aira-border)] bg-[var(--v3-aira-bg)] px-3 py-2">
                  <p className="text-[11px] leading-[1.6] text-[var(--v3-aira-text)]">
                    {turn.text}
                  </p>
                  {turn.action ? (
                    <button
                      type="button"
                      onClick={turn.action.onClick}
                      className="mt-2 cursor-pointer text-[11px] font-semibold text-[var(--v3-aira-name)] hover:underline"
                    >
                      {turn.action.label} &rarr;
                    </button>
                  ) : null}
                </div>
              </div>
            ),
          )}
          <div ref={foot} />
        </div>
      </div>

      {/* What it is ready to answer ---------------------------------------- */}
      {remaining.length > 0 ? (
        <div className="shrink-0 border-t border-[var(--v3-border-subtle)] px-3.5 pt-2.5 pb-1">
          <div className="flex flex-wrap gap-1.5">
            {remaining.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => {
                  setQuestion("");
                  say(topic.question, topic);
                  field.current?.focus();
                }}
                className="cursor-pointer rounded-[5px] border border-[var(--v3-border-strong)] px-2 py-[3px] text-[10px] text-[var(--v3-text-secondary)] transition-colors duration-[120ms] hover:border-[var(--v3-aira-border)] hover:text-[var(--v3-aira-name)] focus-visible:ring-2 focus-visible:ring-[var(--v3-aira)] focus-visible:outline-none"
              >
                {topic.question}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Asking ------------------------------------------------------------ */}
      <div className="shrink-0 px-3.5 pt-2 pb-3">
        <div className="relative">
          <input
            ref={field}
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            aria-label={`Ask AIRA about ${scope}`}
            placeholder="Ask AIRA about this dashboard..."
            className="v3-ask w-full rounded-[6px] border border-[var(--v3-aira-border)] bg-[var(--v3-bg-input)] py-2 pr-10 pl-3 text-[11px] text-[var(--v3-text-primary)] transition-colors duration-[120ms] outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={question.trim() === ""}
            aria-label="Send"
            className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[var(--v3-aira)] text-white transition-opacity duration-[120ms] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendIcon />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[9px] text-[var(--v3-text-muted)]">
          AIRA answers from this screen&rsquo;s record. Nothing here is a
          release decision.
        </p>
      </div>
    </aside>
  );
}
