"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inter, JetBrains_Mono } from "next/font/google";

import { SITE_NAME } from "@/data/profiles";
import { PageTitle } from "@/components/layout/PageTitle";
import { V3_PROFILES, storeV3Profile } from "@/components/v3/profiles";
import type { V3Profile } from "@/components/v3/profiles";
import { V3_THEME_CSS } from "@/components/v3/theme";

/* The design's two faces, scoped to the v3 subtree. */
const inter = Inter({ subsets: ["latin"], variable: "--v3-font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--v3-font-mono" });

/** The rule under the wordmark and again above the small print. */
function Separator() {
  return (
    <div
      aria-hidden="true"
      className="h-px w-[480px] max-w-full bg-[var(--v3-border-default)]"
    />
  );
}

/* -------------------------------------------------------------------------- */

export default function V3LoginPage() {
  const router = useRouter();

  /* Which card was clicked. Held so the others can step back while the route
     changes, rather than leaving three live-looking cards under a cursor that
     no longer does anything. */
  const [chosen, setChosen] = useState<string | null>(null);

  const choose = (profile: V3Profile) => {
    if (chosen) return;
    setChosen(profile.id);
    storeV3Profile(profile);
    router.push("/v3/dashboard");
  };

  return (
    <div
      className={`v3-root ${inter.variable} ${mono.variable} flex min-h-dvh flex-col items-center justify-center bg-[var(--v3-bg-base)] px-6 py-10 text-[var(--v3-text-primary)]`}
    >
      <style dangerouslySetInnerHTML={{ __html: V3_THEME_CSS }} />
      <PageTitle />

      {/* Masthead ------------------------------------------------------- */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-[14px]">
          <span className="flex size-[52px] shrink-0 items-center justify-center rounded-[10px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-surface)] text-[20px] font-bold tracking-[-0.5px] text-[var(--v3-text-primary)]">
            QRA
          </span>
          <span className="text-[28px] font-bold tracking-[-0.6px] text-[var(--v3-text-primary)]">
            QRA
          </span>
        </div>

        <p className="mt-1.5 text-center text-[13px] tracking-[0.01em] text-[var(--v3-text-secondary)]">
          Quality Review Assistant
        </p>

        <div className="my-6">
          <Separator />
        </div>

        <h1 className="text-center text-[14px] font-medium text-[var(--v3-text-primary)]">
          Select your profile to continue
        </h1>
        <p className="mt-1 text-center text-[11px] text-[var(--v3-text-muted)] italic">
          Pharmaceutical QA analytical batch release review &middot; {SITE_NAME}{" "}
          demo
        </p>
      </div>

      {/* The three desks ------------------------------------------------ */}
      <div className="mt-8 flex flex-row gap-4">
        {V3_PROFILES.map((profile, index) => {
          const isChosen = chosen === profile.id;
          /* The clicked card stays nearly lit while the others step back, so
             the fade reads as "this one" rather than as the screen dimming. */
          const fade = chosen
            ? isChosen
              ? "opacity-60"
              : "opacity-[0.35]"
            : "";

          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => choose(profile)}
              disabled={chosen !== null}
              aria-label={`Sign in as ${profile.name}, ${profile.role}`}
              style={{ animationDelay: `${(index + 1) * 60}ms` }}
              className={`v3-fade-up group relative flex w-[200px] cursor-pointer flex-col items-center rounded-[16px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] px-7 py-8 transition-all duration-150 ease-in-out hover:-translate-y-0.5 hover:border-[var(--v3-border-strong)] hover:bg-[var(--v3-bg-card-hover)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--v3-accent)] active:translate-y-0 active:shadow-none disabled:pointer-events-none disabled:cursor-wait ${fade}`}
            >
              <span
                className="flex size-16 shrink-0 items-center justify-center rounded-full text-[18px] font-bold text-white"
                style={{ background: profile.avatarColour }}
              >
                {profile.initials}
              </span>

              <span className="mt-4 text-center text-[14px] leading-snug font-semibold text-[var(--v3-text-primary)]">
                {profile.name}
              </span>
              <span className="mt-1 text-center text-[11px] text-[var(--v3-text-secondary)]">
                {profile.role}
              </span>
              <span className="mt-0.5 text-center text-[10px] text-[var(--v3-text-muted)]">
                {profile.sub}
              </span>

              <span
                className="mt-3 rounded-[4px] border px-2 py-0.5 text-[8px] font-semibold tracking-[0.06em] uppercase"
                style={{
                  background: profile.badgeBg,
                  borderColor: profile.badgeBorder,
                  color: profile.badgeText,
                }}
              >
                {profile.badgeLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Small print ----------------------------------------------------- */}
      <div className="mt-12 flex flex-col items-center">
        <p className="text-center text-[11px] text-[var(--v3-text-muted)]">
          {SITE_NAME} &middot; Demo Environment
        </p>
        <div className="my-4">
          <Separator />
        </div>
        <p className="text-center text-[10px] leading-[1.8] text-[var(--v3-text-muted)]">
          QRA v3.0 &mdash; Demo Environment &middot; Not for clinical use
          &middot; {SITE_NAME}
        </p>
      </div>
    </div>
  );
}
