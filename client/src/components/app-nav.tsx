import { Moon, Sun } from "lucide-react";
import { Link, useLocation } from "wouter";
import { BrandLockup, BrandMark, BrandWordmark } from "@/components/brand-mark";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/think", label: "Think", testId: "nav-think" },
  { href: "/standup", label: "Standup", testId: "nav-standup" },
  { href: "/", label: "Voice Notes", testId: "nav-voice-notes" },
  { href: "/projects", label: "Projects", testId: "nav-projects" },
  { href: "/intelligence", label: "Intelligence", testId: "nav-intelligence" },
  { href: "/goals", label: "Goals", testId: "nav-goals" },
] as const;

export function NavLinks({ className }: { className?: string }) {
  const [location] = useLocation();

  return (
    <nav className={cn("flex gap-1 flex-wrap", className)} aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const active = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-[12px] px-3 py-1.5 rounded-md transition-colors",
              active
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
            data-testid={item.testId}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className={cn(
        "w-7 h-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0",
        className,
      )}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      data-testid="theme-toggle"
    >
      {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
    </button>
  );
}

export function AppNav() {
  const { theme } = useTheme();

  return (
    <div className="flex items-center justify-between gap-3 mb-8 animate-fade-in delay-1">
      <div className="flex items-center gap-4 min-w-0 flex-wrap">
        <BrandLockup compact variant={theme === "light" ? "navy" : "gradient"} />
        <NavLinks />
      </div>
      <ThemeToggle />
    </div>
  );
}

export function SidebarBrandHeader({
  subtitle,
  titleTestId = "app-title",
}: {
  subtitle: string;
  titleTestId?: string;
}) {
  const { theme } = useTheme();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
      <div className="flex items-center gap-2.5 min-w-0">
        <BrandMark
          variant={theme === "light" ? "navy" : "gradient"}
          className="h-7 w-auto"
          title="ApexForm Life"
        />
        <div className="min-w-0">
          <h1 className="truncate" data-testid={titleTestId}>
            <BrandWordmark className="text-sm" />
          </h1>
          <p className="text-[11px] text-muted-foreground font-mono truncate">{subtitle}</p>
        </div>
      </div>
      <ThemeToggle />
    </div>
  );
}
