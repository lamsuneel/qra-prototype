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
import { resultFor } from "@/types";
import type { BatchStatus, Profile, Section, SectionStatus } from "@/types";

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

  /* Progress */
  reviewedCount: (arNumber: string) => number;
  totalSections: (arNumber: string) => number;
  allSectionsReviewed: (arNumber: string) => boolean;
}

const ReviewContext = createContext<ReviewContextValue | null>(null);

const seedBatchStatuses = (): Record<string, BatchStatus> =>
  Object.fromEntries(ALL_BATCHES.map((batch) => [batch.arNumber, batch.status]));

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
  const [reviewed, setReviewed] = useState<Record<string, SectionStatus>>(seedSectionStatuses);
  const [statuses, setStatuses] = useState<Record<string, BatchStatus>>(seedBatchStatuses);
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});

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
  /* Sections                                                         */
  /* ---------------------------------------------------------------- */

  const sectionStatus = useCallback(
    (sectionId: string): SectionStatus => reviewed[sectionId] ?? "NOT_STARTED",
    [reviewed],
  );

  /**
   * A section unlocks once every flagged item in it carries a note. Sections
   * with nothing flagged unlock immediately — there is nothing to confirm.
   */
  const canMarkReviewed = useCallback(
    (section: Section) =>
      section.items
        .filter((item) => resultFor(item) === "FLAGGED")
        .every((item) => (notes[item.id] ?? "").trim().length > 0),
    [notes],
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

  const setBatchStatus = useCallback((arNumber: string, status: BatchStatus) => {
    setStatuses((current) => ({ ...current, [arNumber]: status }));
  }, []);

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
      noteFor,
      setNote,
      isNoted,
      sectionStatus,
      markSectionReviewed,
      canMarkReviewed,
      batchStatus,
      submitForAuthorisation,
      authoriseReview,
      returnToReviewer,
      returnReason,
      reviewedCount,
      totalSections,
      allSectionsReviewed,
    }),
    [
      profile,
      selectProfile,
      clearProfile,
      notes,
      noteFor,
      setNote,
      isNoted,
      sectionStatus,
      markSectionReviewed,
      canMarkReviewed,
      batchStatus,
      submitForAuthorisation,
      authoriseReview,
      returnToReviewer,
      returnReason,
      reviewedCount,
      totalSections,
      allSectionsReviewed,
    ],
  );

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
}

export function useReview(): ReviewContextValue {
  const context = useContext(ReviewContext);
  if (!context) throw new Error("useReview must be used inside a ReviewProvider");
  return context;
}
