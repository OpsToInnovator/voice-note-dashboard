import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { apiRequest } from "@/lib/queryClient";
import type { ApplyFrameworkResult, FrameworkId, FrameworkMeta } from "@shared/frameworks";
import {
  DEFAULT_BIG_GOAL_FRAMEWORK,
  FRAMEWORKS,
  GOAL_STACK,
  SAMPLE_GOALS,
  recommendFramework,
} from "@shared/frameworks";
import {
  Sun,
  Moon,
  Map,
  Zap,
  Loader2,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import { Link, useLocation } from "wouter";

function GoalsNav() {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <div className="flex items-center justify-between mb-8 animate-fade-in delay-1">
      <div className="flex gap-1 flex-wrap">
        <Link
          href="/think"
          className={`text-[12px] px-3 py-1.5 rounded-md transition-colors ${
            location === "/think"
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          data-testid="nav-think"
        >
          Think
        </Link>
        <Link
          href="/standup"
          className={`text-[12px] px-3 py-1.5 rounded-md transition-colors ${
            location === "/standup"
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          data-testid="nav-standup"
        >
          Standup
        </Link>
        <Link
          href="/"
          className={`text-[12px] px-3 py-1.5 rounded-md transition-colors ${
            location === "/"
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          data-testid="nav-voice-notes"
        >
          Voice Notes
        </Link>
        <Link
          href="/projects"
          className={`text-[12px] px-3 py-1.5 rounded-md transition-colors ${
            location === "/projects"
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          data-testid="nav-projects"
        >
          Projects
        </Link>
        <Link
          href="/intelligence"
          className={`text-[12px] px-3 py-1.5 rounded-md transition-colors ${
            location === "/intelligence"
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          data-testid="nav-intelligence"
        >
          Intelligence
        </Link>
        <Link
          href="/goals"
          className={`text-[12px] px-3 py-1.5 rounded-md transition-colors ${
            location === "/goals"
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          data-testid="nav-goals"
        >
          Goals
        </Link>
      </div>
      <button
        onClick={toggle}
        className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        data-testid="theme-toggle"
      >
        {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function FrameworkChip({
  fw,
  selected,
  onSelect,
}: {
  fw: FrameworkMeta;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
        selected
          ? "border-primary/50 bg-primary/10"
          : "border-card-border bg-card hover:border-primary/30"
      }`}
      data-testid={`framework-chip-${fw.id}`}
    >
      <span className="text-[12px] font-semibold block">{fw.name}</span>
      <span className="text-[11px] text-muted-foreground leading-snug block mt-0.5">{fw.challenge}</span>
    </button>
  );
}

function PlanView({ result }: { result: ApplyFrameworkResult }) {
  const { plan, recommendation } = result;
  const meta = FRAMEWORKS.find((f) => f.id === plan.frameworkId);

  return (
    <div className="space-y-4" data-testid="framework-plan">
      <div className="bg-card border border-card-border rounded-xl px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1">
          {meta?.name}
        </p>
        <h2 className="font-display text-lg font-semibold leading-snug" data-testid="plan-title">
          {plan.title}
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
          {recommendation.reason}
        </p>
        {plan.whyThisFramework ? (
          <p className="text-[13px] mt-2 leading-relaxed">{plan.whyThisFramework}</p>
        ) : null}
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-card-border">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Canvas
          </span>
        </div>
        <dl className="divide-y divide-card-border">
          {plan.layers
            .filter((layer) => layer.value)
            .map((layer) => (
              <div key={layer.key} className="px-5 py-3">
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {layer.label}
                </dt>
                <dd className="text-[13px] mt-1 leading-relaxed">{layer.value}</dd>
              </div>
            ))}
        </dl>
      </div>

      {plan.commitments.length > 0 ? (
        <div className="bg-card border border-card-border rounded-xl px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            This week · {plan.commitments.length} commitment{plan.commitments.length !== 1 ? "s" : ""}
          </p>
          <ul className="space-y-1.5">
            {plan.commitments.map((c) => (
              <li key={c} className="text-[13px] flex gap-2">
                <span className="text-primary mt-0.5">→</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        className="bg-card border border-primary/30 rounded-xl px-5 py-4"
        data-testid="plan-first-action"
      >
        <div className="flex items-center gap-2 mb-2">
          <ArrowRight className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            First action
          </span>
        </div>
        <p className="text-[14px] font-medium leading-snug">{plan.firstAction.nextStep}</p>
        <div className="flex items-center gap-1.5 mt-2 text-[12px] text-muted-foreground">
          <CalendarClock className="w-3.5 h-3.5" />
          <span>{plan.firstAction.timeOrTrigger || "No time block yet"}</span>
        </div>
        {plan.firstAction.definitionOfDone ? (
          <p className="text-[12px] text-muted-foreground mt-1">
            Done when: {plan.firstAction.definitionOfDone}
          </p>
        ) : null}
      </div>

      {plan.obstaclePlan ? (
        <div className="bg-card border border-card-border rounded-xl px-5 py-4" data-testid="plan-if-then">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            If–then
          </p>
          <p className="text-[13px] leading-relaxed">
            If {plan.obstaclePlan.trigger}, then I will {plan.obstaclePlan.response}.
          </p>
        </div>
      ) : null}

      {plan.review ? (
        <p className="text-[12px] text-muted-foreground px-1">Review: {plan.review}</p>
      ) : null}

      {plan.lint.weak ? (
        <div
          className="border border-chart-3/40 bg-chart-3/10 rounded-xl px-5 py-3"
          data-testid="plan-lint"
        >
          <p className="text-[12px] font-medium text-chart-3 mb-1">Still motion, not a finish line</p>
          <ul className="text-[12px] text-muted-foreground space-y-0.5">
            {plan.lint.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function Goals() {
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<FrameworkId | "auto">("auto");
  const [result, setResult] = useState<ApplyFrameworkResult | null>(null);

  const catalog = useQuery<{ frameworks: FrameworkMeta[] }>({
    queryKey: ["/api/frameworks"],
    staleTime: Infinity,
  });

  const frameworks = catalog.data?.frameworks ?? FRAMEWORKS;

  const live = useMemo(() => recommendFramework(content), [content]);

  const apply = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/frameworks/apply", {
        content,
        frameworkId: selected,
      });
      return (await res.json()) as ApplyFrameworkResult;
    },
    onSuccess: (data) => setResult(data),
  });

  const selectedMeta = selected === "auto" ? null : frameworks.find((f) => f.id === selected);

  return (
    <div className="h-screen bg-background overflow-y-auto custom-scrollbar" style={{ overscrollBehavior: "contain" }}>
      <div className="max-w-[800px] mx-auto px-6 py-8">
        <GoalsNav />

        <div className="mb-6 animate-fade-in delay-1">
          <div className="flex items-center gap-2 mb-1">
            <Map className="w-4 h-4 text-primary" />
            <h1 className="font-display text-3xl font-bold tracking-tight" data-testid="goals-heading">
              Goals
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Divergent frameworks, one finish line: a next action another person could verify. Planning
            without that leaf is avoidance.
          </p>
        </div>

        <div
          className="flex flex-wrap gap-1.5 mb-6 animate-fade-in delay-2"
          data-testid="goal-stack"
        >
          {GOAL_STACK.map((level, i) => (
            <span key={level.id} className="flex items-center gap-1.5">
              <span className="text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground">
                {level.label}
              </span>
              {i < GOAL_STACK.length - 1 ? (
                <span className="text-[11px] text-muted-foreground">→</span>
              ) : null}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6" data-testid="framework-catalog">
          <button
            type="button"
            onClick={() => setSelected("auto")}
            className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
              selected === "auto"
                ? "border-primary/50 bg-primary/10"
                : "border-card-border bg-card hover:border-primary/30"
            }`}
            data-testid="framework-chip-auto"
          >
            <span className="text-[12px] font-semibold block">Auto-route</span>
            <span className="text-[11px] text-muted-foreground leading-snug block mt-0.5">
              Code picks from the challenge. Default for a big goal: {frameworks.find((f) => f.id === DEFAULT_BIG_GOAL_FRAMEWORK)?.name}.
            </span>
          </button>
          {frameworks.map((fw) => (
            <FrameworkChip
              key={fw.id}
              fw={fw}
              selected={selected === fw.id}
              onSelect={() => setSelected(fw.id)}
            />
          ))}
        </div>

        {selectedMeta ? (
          <p className="text-[12px] text-muted-foreground mb-4" data-testid="framework-use-when">
            {selectedMeta.sequence}. {selectedMeta.useWhen}.
          </p>
        ) : null}

        <div className="bg-card border border-card-border rounded-xl p-4 mb-4">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="goal-input">
            Goal, thought, or voice note
          </label>
          <textarea
            id="goal-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-[13px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="By 30 November I will have sold three paid diagnostic engagements…"
            data-testid="goal-input"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SAMPLE_GOALS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setContent(sample.text);
                  setSelected("auto");
                  setResult(null);
                }}
                className="text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground"
                data-testid={`sample-goal-${sample.frameworkId}`}
              >
                {sample.label}
              </button>
            ))}
          </div>
          {content.trim() ? (
            <p className="text-[12px] text-muted-foreground mt-3" data-testid="live-route">
              Likely: <span className="text-foreground font-medium">{FRAMEWORKS.find((f) => f.id === live.id)?.name}</span>
              {" — "}
              {live.reason}
            </p>
          ) : null}
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={() => apply.mutate()}
              disabled={!content.trim() || apply.isPending}
              className="text-[12px] font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5"
              data-testid="button-apply-framework"
            >
              {apply.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Apply framework
            </button>
          </div>
          {apply.isError ? (
            <p className="text-[12px] text-destructive mt-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Couldn’t apply the framework. Try again.
            </p>
          ) : null}
        </div>

        {result ? <PlanView result={result} /> : null}
      </div>
    </div>
  );
}
