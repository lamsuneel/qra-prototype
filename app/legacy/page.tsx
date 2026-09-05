"use client";

import { useRouter } from "next/navigation";

import { PROFILES, SITE_NAME } from "@/data/profiles";
import { PageTitle } from "@/components/layout/PageTitle";
import { useReview } from "@/context/ReviewContext";

/**
 * Profile selector. No password, no session — selecting a profile sets React
 * context and routes to the screen that role starts on.
 */
export default function LoginPage() {
  const router = useRouter();
  const { selectProfile } = useReview();

  const choose = (profileId: string, role: string) => {
    selectProfile(profileId);
    if (role === "APPROVER") router.push("/legacy/management/gm-qa");
    else if (role === "CQO") router.push("/legacy/management");
    else router.push("/legacy/dashboard");
  };

  return (
    /* pb pushes the content block up so it sits at roughly 45% of the
       viewport rather than dead centre. */
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-app-bg px-6 pt-10 pb-[10vh]">
      <PageTitle />
      <div className="mb-2 flex items-center gap-2.5">
        <span className="flex size-11 items-center justify-center rounded-lg bg-navy text-[19px] font-bold text-white">
          Q
        </span>
        <div>
          <div className="text-2xl leading-none font-bold tracking-tight text-navy">
            NeuraTrace
          </div>
          <div className="mt-1 text-[11px] tracking-wide text-source-text">
            Quality Review Assistant
          </div>
        </div>
      </div>

      <p className="mt-7 text-sm text-source-text">
        Select your profile to continue
      </p>
      <p className="mt-2 mb-6 text-center text-[13px] text-source-text italic">
        Pharmaceutical QA analytical batch release review — PharmaCo India Unit
        7 Demo
      </p>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {PROFILES.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => choose(profile.id, profile.role)}
            aria-label={`Select profile: ${profile.name}, ${profile.roleLabel}`}
            className="w-[220px] cursor-pointer rounded-[10px] border-[1.5px] border-slate-200 bg-white px-5 py-7 text-center transition-all duration-150 hover:-translate-y-0.5 hover:border-navy-accent hover:shadow-[0_4px_20px_rgba(31,56,100,0.13)] focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <span
              className="mx-auto mb-3.5 flex size-13 items-center justify-center rounded-full text-[15px] font-semibold text-white"
              style={{ backgroundColor: profile.avatarColour }}
            >
              {profile.initials}
            </span>
            <span className="block text-sm font-semibold text-slate-900">
              {profile.name}
            </span>
            <span className="mt-1 block text-xs text-source-text">
              {profile.roleLabel}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-8 text-[11px] text-slate-400">
        {SITE_NAME} · Demo Environment
      </p>

      <p className="absolute inset-x-0 bottom-4 text-center text-[11px] text-[#9CA3AF]">
        NeuraTrace v2.1 — Demo Environment · Not for clinical use · {SITE_NAME}
      </p>
    </div>
  );
}
