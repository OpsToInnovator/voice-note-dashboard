import { useId } from "react";
import { cn } from "@/lib/utils";

/** Canonical commercial home — used for lockup links and house credit. */
export const APEXFORM_LIFE_URL = "https://apexformlife.com";

const MARK_PATH =
  "M0,43.765C3.286,29.989,14.955,10.421,28.082,1.365l10.528,17.529L60.358,0c-3.493,10.48-11.046,19.229-20.03,26.524l-12.097-17.345C19.468,20.605,11.814,32.459,0,43.765Z";

export type BrandMarkVariant = "gradient" | "navy" | "white";

export function BrandMark({
  className,
  variant = "gradient",
  title = "ApexForm Life",
}: {
  className?: string;
  variant?: BrandMarkVariant;
  title?: string;
}) {
  const gradId = useId().replace(/:/g, "");
  const fill =
    variant === "navy" ? "#0B0D12" : variant === "white" ? "#F3F7FF" : `url(#${gradId})`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60.358 43.765"
      className={cn("shrink-0", className)}
      role="img"
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {variant === "gradient" ? (
        <defs>
          <linearGradient
            id={gradId}
            x1="0"
            y1="43.765"
            x2="60.358"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#4FE3FF" />
            <stop offset="0.18" stopColor="#6B8CFF" />
            <stop offset="0.42" stopColor="#7D7AFC" />
            <stop offset="0.62" stopColor="#9B86E6" />
            <stop offset="0.80" stopColor="#C79AB0" />
            <stop offset="1" stopColor="#F4B544" />
          </linearGradient>
        </defs>
      ) : null}
      <path d={MARK_PATH} fill={fill} />
    </svg>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display tracking-tight leading-none", className)}>
      <span className="font-semibold text-foreground">ApexForm</span>
      <span className="font-medium text-primary"> Life</span>
    </span>
  );
}

export function BrandLockup({
  className,
  compact = false,
  variant = "gradient",
  href = APEXFORM_LIFE_URL,
}: {
  className?: string;
  compact?: boolean;
  variant?: BrandMarkVariant;
  href?: string | null;
}) {
  const mark = (
    <>
      <BrandMark
        variant={variant}
        className={compact ? "h-6 w-auto" : "h-7 w-auto"}
        title="ApexForm Life"
      />
      <BrandWordmark className={compact ? "text-[13px]" : "text-[15px]"} />
    </>
  );

  if (!href) {
    return <span className={cn("inline-flex items-center gap-2 min-w-0", className)}>{mark}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 min-w-0 rounded-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label="ApexForm Life — official site"
      data-testid="brand-home-link"
    >
      {mark}
    </a>
  );
}

export function HouseCredit({ className }: { className?: string }) {
  return (
    <p className={cn("text-[11px] text-muted-foreground leading-snug", className)} data-testid="house-credit">
      Open engine of{" "}
      <a
        href={APEXFORM_LIFE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline underline-offset-2"
      >
        ApexForm Life
      </a>
      <span aria-hidden="true"> · </span>
      AFOS™ &amp; Paradigm
    </p>
  );
}
