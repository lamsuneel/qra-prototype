"use client";

/**
 * The single global state container for QRA.
 *
 * Everything lives in React memory: profile selection, reviewer notes, section
 * review status, batch status. No database, no backend, no API routes, no
 * session persistence — a refresh returns to the profile selector, which is
 * the intended demo behaviour.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ALL_BATCHES, getBatch, orderedSections } from "@/data";
import { getProfile } from "@/data/profiles";
import {
  isValidPnc,
  requiresConfirmation,
  requiresNote,
  requiresPnc,
} from "@/types";
import type {
  BatchStatus,
  CorrectionRecord,
  Profile,
  Section,
  SectionStatus,
} from "@/types";

interface ReviewContextValue {
  /* Profile */
  profile: Profile | null;
  selectProfile: (profileId: string) => void;
  clearProfile: () => void;

  /* Reviewer notes — keyed by CheckItem id */
  notes: Record<string, string>;
  noteFor: (itemId: string) => string;
  setNote: (itemId: string, note: string) => void;
  isNoted: (itemId: string) => boolean;

  /* PNC numbers — keyed by CheckItem id, for results that are not usable */
  pncFor: (itemId: string) => string;
  setPnc: (itemId: string, pnc: string) => void;
  hasPnc: (itemId: string) => boolean;

  /* Acceptability conditions the reviewer has confirmed — by CheckItem id */
  isConfirmed: (itemId: string) => boolean;
  setConfirmed: (itemId: string, confirmed: boolean) => void;

  /* Section review status — keyed by Section id */
  sectionStatus: (sectionId: string) => SectionStatus;
  markSectionReviewed: (sectionId: string) => void;
  canMarkReviewed: (section: Section) => boolean;

  /* Batch workflow */
  batchStatus: (arNumber: string) => BatchStatus;
  submitForAuthorisation: (arNumber: string) => void;
  authoriseReview: (arNumber: string) => void;
  returnToReviewer: (arNumber: string, reason: string) => void;
  returnReason: (arNumber: string) => string;
  requestRecheck: (arNumber: string, reason: string) => void;
  correctionHistory: (arNumber: string) => CorrectionRecord[];

  /* Progress */
  reviewedCount: (arNumber: string) => number;
  totalSections: (arNumber: string) => number;
  allSectionsReviewed: (arNumber: string) => boolean;
}

const ReviewContext = createContext<ReviewContextValue | null>(null);

const seedBatchStatuses = (): Record<string, BatchStatus> =>
  Object.fromEntries(
    ALL_BATCHES.map((batch) => [batch.arNumber, batch.status]),
  );

/**
 * A batch that arrives already submitted carries the notes its reviewer wrote
 * before submitting. Seeding them keeps those notes visible to the approver.
 */
const seedNotes = (): Record<string, string> =>
  Object.fromEntries(
    ALL_BATCHES.flatMap((batch) =>
      batch.sections.flatMap((section) =>
        section.items
          .filter((item) => item.reviewerNote)
          .map((item) => [item.id, item.reviewerNote as string]),
      ),
    ),
  );

const seedSectionStatuses = (): Record<string, SectionStatus> =>
  Object.fromEntries(
    ALL_BATCHES.flatMap((batch) =>
      batch.sections.map((section) => [section.id, section.status]),
    ),
  );

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>(seedNotes);
  const [pncs, setPncs] = useState<Record<string, string>>({});
  const [confirmed, setConfirmedState] = useState<Record<string, boolean>>({});
  const [reviewed, setReviewed] =
    useState<Record<string, SectionStatus>>(seedSectionStatuses);
  const [statuses, setStatuses] =
    useState<Record<string, BatchStatus>>(seedBatchStatuses);
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>(
    {},
  );
  const [corrections, setCorrections] = useState<
    Record<string, CorrectionRecord[]>
  >({});

  /* ---------------------------------------------------------------- */
  /* Profile                                                          */
  /* ---------------------------------------------------------------- */

  const selectProfile = useCallback((profileId: string) => {
    setProfile(getProfile(profileId) ?? null);
  }, []);

  /**
   * Switching profile clears who you are, not what has been done. A review
   * submitted for authorisation has to still be waiting when the approver
   * signs in, and the notes the reviewer wrote have to still be readable on
   * the exception cards — that handoff is the whole point of two roles.
   *
   * Nothing is persisted: a page reload still returns an empty session.
   */
  const clearProfile = useCallback(() => {
    setProfile(null);
  }, []);

  /* ---------------------------------------------------------------- */
  /* Notes                                                            */
  /* ---------------------------------------------------------------- */

  const noteFor = useCallback((itemId: string) => notes[itemId] ?? "", [notes]);

  const setNote = useCallback((itemId: string, note: string) => {
    setNotes((current) => ({ ...current, [itemId]: note }));
  }, []);

  const isNoted = useCallback(
    (itemId: string) => (notes[itemId] ?? "").trim().length > 0,
    [notes],
  );

  /* ---------------------------------------------------------------- */
  /* PNC numbers                                                      */
  /* ---------------------------------------------------------------- */

  const pncFor = useCallback((itemId: string) => pncs[itemId] ?? "", [pncs]);

  const setPnc = useCallback((itemId: string, pnc: string) => {
    setPncs((current) => ({ ...current, [itemId]: pnc.trim() }));
  }, []);

  /**
   * Only a well-formed PNC counts. An unusable result is closed out by
   * raising one in the site's own system, so a placeholder in this field
   * would be a worse record than an empty one.
   */
  const hasPnc = useCallback(
    (itemId: string) => isValidPnc(pncs[itemId] ?? ""),
    [pncs],
  );

  /* ---------------------------------------------------------------- */
  /* Acceptability conditions                                         */
  /* ---------------------------------------------------------------- */

  const isConfirmed = useCallback(
    (itemId: string) => confirmed[itemId] === true,
    [confirmed],
  );

  const setConfirmed = useCallback((itemId: string, value: boolean) => {
    setConfirmedState((current) => ({ ...current, [itemId]: value }));
  }, []);

  /* ---------------------------------------------------------------- */
  /* Sections                                                         */
  /* ---------------------------------------------------------------- */

  const sectionStatus = useCallback(
    (sectionId: string): SectionStatus => reviewed[sectionId] ?? "NOT_STARTED",
    [reviewed],
  );

  /**
   * A section unlocks once everything outstanding in it has been answered:
   * every flagged entry and every entry QRA could not conclude carries an
   * observation, and every unusable result carries a PNC number. Sections
   * where everything came back compliant unlock immediately.
   */
  const canMarkReviewed = useCallback(
    (section: Section) => {
      const noted = section.items
        .filter(requiresNote)
        .every((item) => (notes[item.id] ?? "").trim().length > 0);

      /* An unusable result waits on a PNC number, not an observation. */
      const numbered = section.items
        .filter(requiresPnc)
        .every((item) => isValidPnc(pncs[item.id] ?? ""));

      /* An acceptability rule waits on the condition being confirmed. */
      const conditionsMet = section.items
        .filter(requiresConfirmation)
        .every((item) => confirmed[item.id] === true);

      return noted && numbered && conditionsMet;
    },
    [notes, pncs, confirmed],
  );

  const markSectionReviewed = useCallback((sectionId: string) => {
    setReviewed((current) => ({ ...current, [sectionId]: "REVIEWED" }));
  }, []);

  /* ---------------------------------------------------------------- */
  /* Batch workflow                                                   */
  /* ---------------------------------------------------------------- */

  const batchStatus = useCallback(
    (arNumber: string): BatchStatus => statuses[arNumber] ?? "NEEDS_REVIEW",
    [statuses],
  );

  const setBatchStatus = useCallback(
    (arNumber: string, status: BatchStatus) => {
      setStatuses((current) => ({ ...current, [arNumber]: status }));
    },
    [],
  );

  const submitForAuthorisation = useCallback(
    (arNumber: string) => setBatchStatus(arNumber, "AWAITING_AUTHORISATION"),
    [setBatchStatus],
  );

  const authoriseReview = useCallback(
    (arNumber: string) => setBatchStatus(arNumber, "REVIEW_AUTHORISED"),
    [setBatchStatus],
  );

  const returnToReviewer = useCallback(
    (arNumber: string, reason: string) => {
      setBatchStatus(arNumber, "RETURNED_TO_REVIEWER");
      setReturnReasons((current) => ({ ...current, [arNumber]: reason }));
    },
    [setBatchStatus],
  );

  const returnReason = useCallback(
    (arNumber: string) => returnReasons[arNumber] ?? "",
    [returnReasons],
  );

  /**
   * Send the batch back to the lab, and keep what it was sent back for. The
   * reason outlives the request: it is what tells the next reviewer where to
   * look when the batch returns looking clean.
   */
  const requestRecheck = useCallback(
    (arNumber: string, reason: string) => {
      setBatchStatus(arNumber, "RETURNED_FOR_CORRECTION");
      setCorrections((current) => ({
        ...current,
        [arNumber]: [
          ...(current[arNumber] ?? []),
          {
            returnedOn: "30-Aug-2026",
            returnedBy: profile?.name ?? "QA Reviewer",
            reason,
          },
        ],
      }));
    },
    [profile, setBatchStatus],
  );

  const correctionHistory = useCallback(
    (arNumber: string) => corrections[arNumber] ?? [],
    [corrections],
  );

  /* ---------------------------------------------------------------- */
  /* Progress                                                         */
  /* ---------------------------------------------------------------- */

  const totalSections = useCallback((arNumber: string) => {
    const batch = getBatch(arNumber);
    return batch ? orderedSections(batch).length : 0;
  }, []);

  const reviewedCount = useCallback(
    (arNumber: string) => {
      const batch = getBatch(arNumber);
      if (!batch) return 0;
      return orderedSections(batch).filter(
        (section) => reviewed[section.id] === "REVIEWED",
      ).length;
    },
    [reviewed],
  );

  const allSectionsReviewed = useCallback(
    (arNumber: string) => {
      const total = totalSections(arNumber);
      return total > 0 && reviewedCount(arNumber) === total;
    },
    [reviewedCount, totalSections],
  );

  const value = useMemo<ReviewContextValue>(
    () => ({
      profile,
      selectProfile,
      clearProfile,
      notes,
      pncs,
      confirmed,
      noteFor,
      setNote,
      isNoted,
      pncFor,
      setPnc,
      hasPnc,
      isConfirmed,
      setConfirmed,
      sectionStatus,
      markSectionReviewed,
      canMarkReviewed,
      batchStatus,
      submitForAuthorisation,
      authoriseReview,
      returnToReviewer,
      returnReason,
      requestRecheck,
      correctionHistory,
      reviewedCount,
      totalSections,
      allSectionsReviewed,
    }),
    [
      profile,
      selectProfile,
      clearProfile,
      notes,
      pncs,
      confirmed,
      noteFor,
      setNote,
      isNoted,
      pncFor,
      setPnc,
      hasPnc,
      isConfirmed,
      setConfirmed,
      sectionStatus,
      markSectionReviewed,
      canMarkReviewed,
      batchStatus,
      submitForAuthorisation,
      authoriseReview,
      returnToReviewer,
      returnReason,
      requestRecheck,
      correctionHistory,
      reviewedCount,
      totalSections,
      allSectionsReviewed,
    ],
  );

  return (
    <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>
  );
}

export function useReview(): ReviewContextValue {
  const context = useContext(ReviewContext);
  if (!context)
    throw new Error("useReview must be used inside a ReviewProvider");
  return context;
}
