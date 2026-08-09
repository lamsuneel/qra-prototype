"use client";

/**
 * The single global state container for the V2 prototype.
 *
 * No backend, no API, no database, no localStorage. All state lives here in
 * React memory and is lost on refresh — that is intentional.
 *
 * This file imports nothing from next/navigation or any other Next.js API.
 * Pure React only: createContext, useContext, useState, useMemo, useCallback.
 *
 * Review state is tracked per section, not per finding. V2 has no
 * finding-state machine — a reviewer marks a whole section as reviewed.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  applicableSections,
  BATCHES,
  getBatch,
  getSlaProfile,
  getTest,
  SLA_PROFILES,
  type Batch,
  type SectionStatus,
  type SectionType,
  type SlaProfile,
  type SlaProfileId,
} from "@/data/batches";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SessionStatus =
  | "NotStarted"
  | "ContextBuilding"
  | "InProgress"
  | "Paused"
  | "Completed";

/** testId -> sectionType -> status. */
export type SectionStatusMap = Record<string, Record<string, SectionStatus>>;

export interface ReviewSession {
  arNumber: string;
  status: SessionStatus;
  currentTestId: string | null;
  currentSectionType: string | null;
  sectionStatuses: SectionStatusMap;
  reviewerNotes: string;
  sessionStartTime: string;
  lastActiveTime: string;
}

export interface SlaStatus {
  status: "within" | "overdue";
  daysOverdue?: number;
  dueDate: string;
  profileName: string;
  /** Qualifier shown beside the status, e.g. "1 working day past due". */
  detail: string;
}

export interface TestProgress {
  /** Applicable sections only — N/A sections are never counted. */
  total: number;
  reviewed: number;
  remaining: number;
}

export interface BatchProgress {
  totalSections: number;
  reviewedSections: number;
}

interface ReviewContextValue {
  sessions: Record<string, ReviewSession>;
  activeSlaProfileId: SlaProfileId;
  slaProfiles: SlaProfile[];

  startReview: (arNumber: string) => void;
  resumeReview: (arNumber: string) => void;
  setCurrentTest: (arNumber: string, testId: string) => void;
  setCurrentSection: (arNumber: string, sectionType: SectionType) => void;
  markSectionReviewed: (
    arNumber: string,
    testId: string,
    sectionType: SectionType,
  ) => void;
  addNote: (arNumber: string, note: string) => void;
  pauseReview: (arNumber: string) => void;
  completeReview: (arNumber: string) => void;
  setSlaProfile: (profileId: SlaProfileId) => void;

  getSession: (arNumber: string) => ReviewSession | null;
  getSlaStatus: (arNumber: string) => SlaStatus | null;
  getProgress: (arNumber: string, testId: string) => TestProgress;
  getAllTestsProgress: (arNumber: string) => BatchProgress;
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

const now = () => formatTimestamp(new Date());

/* -------------------------------------------------------------------------- */
/* Session construction                                                       */
/* -------------------------------------------------------------------------- */

/** When Batch C's paused session was opened and last touched. */
const SEEDED_START_TIME = "31-Jul-2026 10:15";
const SEEDED_LAST_ACTIVE = "31-Jul-2026 17:35";

/**
 * Every applicable section of every test, set to NotStarted.
 * N/A sections are omitted — they can never be reviewed.
 */
function freshSectionStatuses(batch: Batch): SectionStatusMap {
  const map: SectionStatusMap = {};
  for (const test of batch.tests) {
    const perTest: Record<string, SectionStatus> = {};
    for (const section of applicableSections(test)) {
      perTest[section.type] = "NotStarted";
    }
    map[test.id] = perTest;
  }
  return map;
}

function newSession(batch: Batch, timestamp: string): ReviewSession {
  return {
    arNumber: batch.arNumber,
    // V2 has no assembly screen — a fresh review is immediately in progress.
    status: "InProgress",
    currentTestId: null,
    currentSectionType: null,
    sectionStatuses: freshSectionStatuses(batch),
    reviewerNotes: "",
    sessionStartTime: timestamp,
    lastActiveTime: timestamp,
  };
}

/**
 * Batch C ships as a paused session so the cold resume demo works on first
 * load. The seed is read from the batch data rather than duplicated here.
 *
 * Batches without a sessionState have no session until startReview() runs.
 */
function seededSessions(): Record<string, ReviewSession> {
  const sessions: Record<string, ReviewSession> = {};

  for (const batch of BATCHES) {
    const seed = batch.sessionState;
    if (!seed) continue;

    sessions[batch.arNumber] = {
      arNumber: batch.arNumber,
      status: "Paused",
      currentTestId: seed.currentTestId,
      currentSectionType: seed.currentSectionType,
      sectionStatuses: {
        ...freshSectionStatuses(batch),
        [seed.currentTestId]: { ...seed.sectionStatuses },
      },
      reviewerNotes: seed.reviewerNotes ?? "",
      sessionStartTime: SEEDED_START_TIME,
      lastActiveTime: SEEDED_LAST_ACTIVE,
    };
  }

  return sessions;
}

const EMPTY_TEST_PROGRESS: TestProgress = { total: 0, reviewed: 0, remaining: 0 };

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

const ReviewContext = createContext<ReviewContextValue | null>(null);

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Record<string, ReviewSession>>(
    () => seededSessions(),
  );
  const [activeSlaProfileId, setActiveSlaProfileId] = useState<SlaProfileId>(
    "shrikrishna-site",
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

    // Replaces any existing session outright. This is what makes typing a
    // paused AR number restart the review rather than resume it.
    setSessions((current) => ({
      ...current,
      [batch.arNumber]: newSession(batch, now()),
    }));
  }, []);

  const resumeReview = useCallback(
    (arNumber: string) => {
      // Deliberately leaves sectionStatuses and position untouched.
      patchSession(arNumber, (session) => ({
        ...session,
        status: "InProgress",
        lastActiveTime: now(),
      }));
    },
    [patchSession],
  );

  const setCurrentTest = useCallback(
    (arNumber: string, testId: string) => {
      patchSession(arNumber, (session) => ({
        ...session,
        status: session.status === "Completed" ? session.status : "InProgress",
        currentTestId: testId,
        currentSectionType: null,
        lastActiveTime: now(),
      }));
    },
    [patchSession],
  );

  const setCurrentSection = useCallback(
    (arNumber: string, sectionType: SectionType) => {
      patchSession(arNumber, (session) => ({
        ...session,
        currentSectionType: sectionType,
        lastActiveTime: now(),
      }));
    },
    [patchSession],
  );

  const markSectionReviewed = useCallback(
    (arNumber: string, testId: string, sectionType: SectionType) => {
      patchSession(arNumber, (session) => ({
        ...session,
        sectionStatuses: {
          ...session.sectionStatuses,
          [testId]: {
            ...session.sectionStatuses[testId],
            [sectionType]: "Reviewed",
          },
        },
        lastActiveTime: now(),
      }));
    },
    [patchSession],
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

  const setSlaProfile = useCallback((profileId: SlaProfileId) => {
    setActiveSlaProfileId(profileId);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Derived values                                                         */
  /* ---------------------------------------------------------------------- */

  const getSession = useCallback(
    (arNumber: string): ReviewSession | null => sessions[arNumber] ?? null,
    [sessions],
  );

  const getSlaStatus = useCallback(
    (arNumber: string): SlaStatus | null => {
      const batch = getBatch(arNumber);
      if (!batch) return null;

      const assessment = batch.slaByProfile[activeSlaProfileId];
      const overdue = assessment.status === "Overdue";

      return {
        status: overdue ? "overdue" : "within",
        daysOverdue: assessment.daysOverdue,
        dueDate: assessment.deadline,
        profileName: getSlaProfile(activeSlaProfileId).name,
        detail: assessment.detail,
      };
    },
    [activeSlaProfileId],
  );

  const getProgress = useCallback(
    (arNumber: string, testId: string): TestProgress => {
      const test = getTest(arNumber, testId);
      if (!test) return EMPTY_TEST_PROGRESS;

      const applicable = applicableSections(test);
      const statuses = sessions[arNumber]?.sectionStatuses[testId] ?? {};

      const reviewed = applicable.filter(
        (section) => statuses[section.type] === "Reviewed",
      ).length;

      return {
        total: applicable.length,
        reviewed,
        remaining: applicable.length - reviewed,
      };
    },
    [sessions],
  );

  const getAllTestsProgress = useCallback(
    (arNumber: string): BatchProgress => {
      const batch = getBatch(arNumber);
      if (!batch) return { totalSections: 0, reviewedSections: 0 };

      let totalSections = 0;
      let reviewedSections = 0;

      for (const test of batch.tests) {
        const progress = getProgress(arNumber, test.id);
        totalSections += progress.total;
        reviewedSections += progress.reviewed;
      }

      return { totalSections, reviewedSections };
    },
    [getProgress],
  );

  const value = useMemo<ReviewContextValue>(
    () => ({
      sessions,
      activeSlaProfileId,
      slaProfiles: SLA_PROFILES,
      startReview,
      resumeReview,
      setCurrentTest,
      setCurrentSection,
      markSectionReviewed,
      addNote,
      pauseReview,
      completeReview,
      setSlaProfile,
      getSession,
      getSlaStatus,
      getProgress,
      getAllTestsProgress,
    }),
    [
      sessions,
      activeSlaProfileId,
      startReview,
      resumeReview,
      setCurrentTest,
      setCurrentSection,
      markSectionReviewed,
      addNote,
      pauseReview,
      completeReview,
      setSlaProfile,
      getSession,
      getSlaStatus,
      getProgress,
      getAllTestsProgress,
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
