"use client";

/**
 * The single global state container for the prototype.
 *
 * No backend, no API, no database, no localStorage. All state lives here in
 * React memory and is lost on refresh — that is intentional.
 *
 * This file imports nothing from next/navigation or any other Next.js API.
 * Pure React only: createContext, useContext, useState, useMemo, useCallback.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getBatch, type Batch, type RuleResult } from "@/data/batches";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type FindingState = "Pending" | "Acknowledged" | "Escalated";

export type SessionStatus =
  | "NotStarted"
  | "ContextBuilding"
  | "ReadyForReview"
  | "InReview"
  | "Paused"
  | "Completed";

export interface ReviewSession {
  arNumber: string;
  status: SessionStatus;
  /**
   * Keyed by rule id — "RULE-001", "RULE-013". Findings and rules share one
   * identifier namespace across the prototype; see note in ReviewContext docs.
   */
  findingStates: Record<string, FindingState>;
  reviewerNotes: string;
  checklistPosition: string | null;
  sessionStartTime: string;
  lastActiveTime: string;
}

export interface ReviewProgress {
  /** Findings the reviewer has acted on: Acknowledged + Escalated. */
  addressed: number;
  /** Rules evaluated for this AR. Always 10. */
  total: number;
  /** Rules that raised a finding. */
  findings: number;
  /** Rules that did not raise a finding. */
  compliant: number;
  acknowledged: number;
  pending: number;
  escalated: number;
  /**
   * compliant + addressed. Compliant rules need no reviewer action, so this is
   * the numerator that lets "N / 10 rules addressed" actually reach 10 / 10.
   * `addressed` above is the raw finding count, exactly as specified.
   */
  rulesAddressed: number;
}

export interface ReviewDuration {
  minutes: number;
  /** Rendered form for the Review Summary, e.g. "18 minutes". */
  label: string;
}

interface ReviewContextValue {
  sessions: Record<string, ReviewSession>;

  startReview: (arNumber: string) => void;
  setStatus: (arNumber: string, status: SessionStatus) => void;
  acknowledgeFinding: (arNumber: string, findingId: string) => void;
  escalateFinding: (arNumber: string, findingId: string) => void;
  addNote: (arNumber: string, note: string) => void;
  pauseReview: (arNumber: string) => void;
  resumeReview: (arNumber: string) => void;
  completeReview: (arNumber: string) => void;

  getSession: (arNumber: string) => ReviewSession | null;
  getFindingState: (arNumber: string, findingId: string) => FindingState;
  getProgress: (arNumber: string) => ReviewProgress;
  getNextPendingFinding: (arNumber: string) => string | null;
  getDuration: (arNumber: string) => ReviewDuration | null;
}

/* -------------------------------------------------------------------------- */
/* Timestamps                                                                 */
/* -------------------------------------------------------------------------- */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const pad = (value: number) => String(value).padStart(2, "0");

/** Formats a Date as "03-Aug-2026 14:32" — the format used across the data. */
export function formatTimestamp(date: Date): string {
  return (
    `${pad(date.getDate())}-${MONTHS[date.getMonth()]}-${date.getFullYear()}` +
    ` ${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** Parses "03-Aug-2026 14:32" back to epoch ms. Returns null if unparseable. */
function parseTimestamp(value: string): number | null {
  const match = /^(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const month = MONTHS.indexOf(match[2]);
  if (month < 0) return null;

  return new Date(
    Number(match[3]),
    month,
    Number(match[1]),
    Number(match[4]),
    Number(match[5]),
  ).getTime();
}

const now = () => formatTimestamp(new Date());

/* -------------------------------------------------------------------------- */
/* Initial state                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Batch C ships as a paused session so the cold resume demo works on first
 * load, without anyone having to run Task C Part 1 first.
 *
 * Batch A and Batch B have no session. One is created only by startReview().
 */
const SEEDED_SESSIONS: Record<string, ReviewSession> = {
  "AR-2026-000123": {
    arNumber: "AR-2026-000123",
    status: "Paused",
    findingStates: {
      "RULE-001": "Acknowledged",
      "RULE-013": "Pending",
    },
    reviewerNotes: "",
    checklistPosition: "RULE-013",
    sessionStartTime: "31-Jul-2026 10:15",
    lastActiveTime: "31-Jul-2026 17:35",
  },
};

/**
 * A brand new review starts with every finding Pending.
 *
 * `initialStatus` in the batch data is the seed for Batch C's *paused* session
 * only — replaying it here would hand Shrikrishna a fresh review with RULE-001
 * already acknowledged, which contradicts a restart being a restart.
 */
function freshFindingStates(batch: Batch): Record<string, FindingState> {
  const states: Record<string, FindingState> = {};
  for (const result of batch.results) {
    if (result.outcome === "Finding") {
      states[result.ruleId] = "Pending";
    }
  }
  return states;
}

const findingsOf = (batch: Batch): RuleResult[] =>
  batch.results.filter((result) => result.outcome === "Finding");

const EMPTY_PROGRESS: ReviewProgress = {
  addressed: 0,
  total: 0,
  findings: 0,
  compliant: 0,
  acknowledged: 0,
  pending: 0,
  escalated: 0,
  rulesAddressed: 0,
};

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

const ReviewContext = createContext<ReviewContextValue | null>(null);

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Record<string, ReviewSession>>(
    () => SEEDED_SESSIONS,
  );

  /** Applies a patch to one session. No-ops if the session does not exist. */
  const patchSession = useCallback(
    (arNumber: string, patch: (session: ReviewSession) => ReviewSession) => {
      setSessions((current) => {
        const session = current[arNumber];
        if (!session) return current;
        return { ...current, [arNumber]: patch(session) };
      });
    },
    [],
  );

  /* ---------------------------------------------------------------------- */
  /* Actions                                                                */
  /* ---------------------------------------------------------------------- */

  const startReview = useCallback((arNumber: string) => {
    const batch = getBatch(arNumber);
    if (!batch) return;

    const timestamp = now();

    // Replaces any existing session outright. This is what makes typing a
    // paused AR number restart the review rather than resume it.
    setSessions((current) => ({
      ...current,
      [batch.arNumber]: {
        arNumber: batch.arNumber,
        status: "ContextBuilding",
        findingStates: freshFindingStates(batch),
        reviewerNotes: "",
        checklistPosition: null,
        sessionStartTime: timestamp,
        lastActiveTime: timestamp,
      },
    }));
  }, []);

  const setStatus = useCallback(
    (arNumber: string, status: SessionStatus) => {
      patchSession(arNumber, (session) => ({ ...session, status }));
    },
    [patchSession],
  );

  const setFindingState = useCallback(
    (arNumber: string, findingId: string, state: FindingState) => {
      patchSession(arNumber, (session) => ({
        ...session,
        findingStates: { ...session.findingStates, [findingId]: state },
        checklistPosition: findingId,
        lastActiveTime: now(),
      }));
    },
    [patchSession],
  );

  const acknowledgeFinding = useCallback(
    (arNumber: string, findingId: string) => {
      setFindingState(arNumber, findingId, "Acknowledged");
    },
    [setFindingState],
  );

  const escalateFinding = useCallback(
    (arNumber: string, findingId: string) => {
      setFindingState(arNumber, findingId, "Escalated");
    },
    [setFindingState],
  );

  const addNote = useCallback(
    (arNumber: string, note: string) => {
      patchSession(arNumber, (session) => ({
        ...session,
        reviewerNotes: note,
        lastActiveTime: now(),
      }));
    },
    [patchSession],
  );

  const pauseReview = useCallback(
    (arNumber: string) => {
      patchSession(arNumber, (session) => ({
        ...session,
        status: "Paused",
        lastActiveTime: now(),
      }));
    },
    [patchSession],
  );

  const resumeReview = useCallback(
    (arNumber: string) => {
      // Deliberately leaves findingStates and checklistPosition untouched.
      patchSession(arNumber, (session) => ({
        ...session,
        status: "InReview",
        lastActiveTime: now(),
      }));
    },
    [patchSession],
  );

  const completeReview = useCallback(
    (arNumber: string) => {
      patchSession(arNumber, (session) => ({
        ...session,
        status: "Completed",
        lastActiveTime: now(),
      }));
    },
    [patchSession],
  );

  /* ---------------------------------------------------------------------- */
  /* Derived values                                                         */
  /* ---------------------------------------------------------------------- */

  const getSession = useCallback(
    (arNumber: string): ReviewSession | null => sessions[arNumber] ?? null,
    [sessions],
  );

  const getFindingState = useCallback(
    (arNumber: string, findingId: string): FindingState => {
      const fromSession = sessions[arNumber]?.findingStates[findingId];
      if (fromSession) return fromSession;

      // No session yet — fall back to the seed recorded in the batch data.
      const result = getBatch(arNumber)?.results.find(
        (candidate) => candidate.ruleId === findingId,
      );
      return result?.initialStatus ?? "Pending";
    },
    [sessions],
  );

  const getProgress = useCallback(
    (arNumber: string): ReviewProgress => {
      const batch = getBatch(arNumber);
      if (!batch) return EMPTY_PROGRESS;

      const findings = findingsOf(batch);
      const compliant = batch.results.length - findings.length;

      let acknowledged = 0;
      let escalated = 0;
      let pending = 0;

      for (const finding of findings) {
        switch (getFindingState(arNumber, finding.ruleId)) {
          case "Acknowledged":
            acknowledged += 1;
            break;
          case "Escalated":
            escalated += 1;
            break;
          default:
            pending += 1;
        }
      }

      const addressed = acknowledged + escalated;

      return {
        addressed,
        total: batch.results.length,
        findings: findings.length,
        compliant,
        acknowledged,
        pending,
        escalated,
        rulesAddressed: compliant + addressed,
      };
    },
    [getFindingState],
  );

  const getNextPendingFinding = useCallback(
    (arNumber: string): string | null => {
      const batch = getBatch(arNumber);
      if (!batch) return null;

      const next = findingsOf(batch).find(
        (finding) => getFindingState(arNumber, finding.ruleId) === "Pending",
      );
      return next?.ruleId ?? null;
    },
    [getFindingState],
  );

  const getDuration = useCallback(
    (arNumber: string): ReviewDuration | null => {
      const session = sessions[arNumber];
      if (!session) return null;

      const start = parseTimestamp(session.sessionStartTime);
      const end = parseTimestamp(session.lastActiveTime);
      if (start === null || end === null) return null;

      const minutes = Math.max(0, Math.round((end - start) / 60000));
      if (minutes < 1) return { minutes: 0, label: "Less than a minute" };
      if (minutes < 60) {
        return { minutes, label: `${minutes} minute${minutes === 1 ? "" : "s"}` };
      }

      const hours = Math.floor(minutes / 60);
      const rest = minutes % 60;
      const label =
        rest === 0
          ? `${hours} hour${hours === 1 ? "" : "s"}`
          : `${hours} hour${hours === 1 ? "" : "s"} ${rest} minutes`;
      return { minutes, label };
    },
    [sessions],
  );

  const value = useMemo<ReviewContextValue>(
    () => ({
      sessions,
      startReview,
      setStatus,
      acknowledgeFinding,
      escalateFinding,
      addNote,
      pauseReview,
      resumeReview,
      completeReview,
      getSession,
      getFindingState,
      getProgress,
      getNextPendingFinding,
      getDuration,
    }),
    [
      sessions,
      startReview,
      setStatus,
      acknowledgeFinding,
      escalateFinding,
      addNote,
      pauseReview,
      resumeReview,
      completeReview,
      getSession,
      getFindingState,
      getProgress,
      getNextPendingFinding,
      getDuration,
    ],
  );

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
}

export function useReview(): ReviewContextValue {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error("useReview must be used inside a ReviewProvider");
  }
  return context;
}
