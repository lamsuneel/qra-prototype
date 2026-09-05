"use client";

import { useRouter } from "next/navigation";

import { useReview } from "@/context/ReviewContext";
import type { Batch } from "@/types";
import { SLABadge } from "@/components/review/Badges";
import { BatchSearch } from "@/components/layout/BatchSearch";

/**
 * Shown on every screen except the profile selector.
 * Left: wordmark. Centre: batch context, review screens only. Right: identity.
 */
export function TopNav({ batch }: { batch?: Batch }) {
  const router = useRouter();
  const { profile, clearProfile } = useReview();

  const switchProfile = () => {
    clearProfile();
    router.push("/legacy");
  };

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3.5 bg-navy px-5">
      <button
        type="button"
        onClick={() => router.push("/legacy/dashboard")}
        className="flex shrink-0 cursor-pointer items-center gap-2 transition-opacity duration-150 hover:opacity-80"
      >
        <span className="flex size-7 items-center justify-center rounded-[5px] bg-navy-accent text-xs font-bold text-white">
          Q
        </span>
        <span className="text-[15px] font-bold tracking-tight text-white">
          QRA
        </span>
      </button>

      {batch ? (
        <div className="mx-auto hidden items-center gap-1.5 rounded-md bg-white/[0.07] px-3.5 py-1 lg:flex">
          <span className="text-[13px] font-semibold text-blue-300">
            {batch.arNumber}
          </span>
          <span className="text-[13px] text-white/30">·</span>
          <span className="text-[13px] text-slate-300">{batch.product}</span>
          <span className="ml-1.5">
            <SLABadge status={batch.slaStatus} label={batch.slaLabel} />
          </span>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <div className="hidden lg:block">
          <BatchSearch />
        </div>
        <span className="hidden text-[13px] text-slate-400 sm:inline">
          {profile?.name}
        </span>
        <span className="hidden rounded-full bg-navy-accent/30 px-2.5 py-0.5 text-[11px] font-medium text-blue-300 md:inline">
          {profile?.roleLabel}
        </span>
        <span className="hidden h-4 w-px bg-white/15 md:inline-block" />
        <button
          type="button"
          onClick={() => router.push("/config")}
          className="cursor-pointer text-xs text-slate-400 transition-colors duration-150 hover:text-white hover:underline"
        >
          Site Config
        </button>
        <button
          type="button"
          onClick={switchProfile}
          className="cursor-pointer rounded border border-navy-accent/50 px-2.5 py-0.5 text-[11px] text-blue-300 transition-colors duration-150 hover:bg-navy-accent hover:text-white"
        >
          Switch Profile
        </button>
      </div>
    </header>
  );
}
