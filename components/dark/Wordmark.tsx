/**
 * The product mark.
 *
 * One component rather than a copy per screen: a wordmark that drifts between
 * the sign-in screen and the bar above every other screen reads as two
 * products. Size is the caller's business, colour is not.
 */
export function DarkWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      <span className="text-[var(--v3-text-primary)]">Neura</span>
      <span className="text-[var(--v3-brand)]">Trace</span>
    </span>
  );
}
