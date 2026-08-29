import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { apiRequest } from "@/lib/queryClient";
import type { ThoughtRecord } from "@shared/thoughtOs";
import {
  DESTINATION_COPY,
  OPERATING_SEQUENCE,
  PROCESS_TRUST,
  PROPOSITION,
  SAMPLE_THOUGHTS,
  TIER_COPY,
} from "@shared/thoughtOs";
import {
  Sun,
  Moon,
  Brain,
  Zap,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Scale,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { CoachPanel } from "@/components/coach-panel";

function ThinkNav() {
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

function DestinationBadge({ destination }: { destination: ThoughtRecord["destination"] }) {
  const tone =
    destination === "DELETE"
      ? "text-muted-foreground bg-muted"
      : destination === "STORE"
        ? "text-muted-foreground bg-muted"
        : destination === "EXECUTE"
          ? "text-primary bg-primary/10"
          : destination === "DECIDE"
            ? "text-chart-3 bg-chart-3/10"
            : "text-primary bg-primary/10";
  return (
    <span className={`text-[11px] font-semibold tracking-wider px-2 py-0.5 rounded ${tone}`} data-testid="destination-badge">
      {destination}
    </span>
  );
}

function RecordView({
  record,
  onConfirmMeaning,
}: {
  record: ThoughtRecord;
  onConfirmMeaning: (id: string) => void;
}) {
  return (
    <div className="space-y-4" data-testid="thought-record">
      <div className="bg-card border border-card-border rounded-xl px-5 py-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Destination
          </span>
          <DestinationBadge destination={record.destination} />
        </div>
        <p className="text-[14px] font-medium leading-snug" data-testid="destination-reason">
          {record.destinationReason}
        </p>
        <p className="text-[12px] text-muted-foreground mt-2 flex items-start gap-1.5">
          <Scale className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          {TIER_COPY[record.tier].label}. {TIER_COPY[record.tier].who}
        </p>
      </div>

      <div className="bg-card border border-card-border rounded-xl px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Original
        </p>
        <p className="text-[13px] leading-relaxed" data-testid="thought-original">
          {record.original}
        </p>
      </div>

      {record.interpretation.parts.length > 0 ? (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-card-border">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Interpretation
            </span>
          </div>
          <dl className="divide-y divide-card-border">
            {record.interpretation.parts.map((part, i) => (
              <div key={`${part.kind}-${i}`} className="px-5 py-3">
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {part.kind}
                </dt>
                <dd className="text-[13px] mt-1 leading-relaxed">{part.text}</dd>
              </div>
            ))}
          </dl>
          {record.interpretation.missingEvidence ? (
            <p className="px-5 py-3 text-[12px] text-chart-3 border-t border-card-border">
              Missing evidence: {record.interpretation.missingEvidence}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-card border border-card-border rounded-xl px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Agency
          </p>
          <p className="text-[13px] font-medium capitalize">{record.agency.disposition}</p>
          <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{record.agency.reason}</p>
        </div>
        <div className="bg-card border border-card-border rounded-xl px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Substance
          </p>
          <p className="text-[13px] font-medium capitalize">{record.substance.verdict}</p>
          <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{record.substance.reason}</p>
        </div>
      </div>

      {record.reconstructions.length > 0 ? (
        <div className="bg-card border border-card-border rounded-xl px-5 py-4" data-testid="meaning-options">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            What you might be trying to think
          </p>
          <p className="text-[12px] text-muted-foreground mb-3">
            Confirm the closest meaning. Different meanings produce different interventions.
          </p>
          <div className="space-y-2">
            {record.reconstructions.map((option) => {
              const selected = record.confirmedMeaningId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onConfirmMeaning(option.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                    selected
                      ? "border-primary/50 bg-primary/10"
                      : "border-card-border hover:border-primary/30"
                  }`}
                  data-testid={`meaning-${option.id}`}
                >
                  <span className="text-[12px] font-semibold">
                    {option.label}. {option.idea}
                  </span>
                  <span className="text-[12px] text-muted-foreground block mt-0.5 leading-relaxed">
                    {option.intervention}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {record.destination !== "DELETE" && record.destination !== "STORE" ? (
        <div className="bg-card border border-card-border rounded-xl px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Stress-test · {record.family}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {record.stressKit.map((lens) => (
              <span key={lens} className="text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground">
                {lens}
              </span>
            ))}
          </div>
          {record.framework ? (
            <p className="text-[12px] text-muted-foreground mt-2">
              Framework: {record.framework.id.replace(/_/g, " ")} — {record.framework.reason}
            </p>
          ) : null}
        </div>
      ) : null}

      {record.container ? (
        <div className="bg-card border border-card-border rounded-xl px-5 py-4" data-testid="thought-container">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Container
          </p>
          <p className="text-[14px] font-medium">{record.container.objective}</p>
          <ol className="mt-3 space-y-1.5 list-decimal list-inside">
            {record.container.sequence.map((step) => (
              <li key={step} className="text-[13px] leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-1">
            Guardrails
          </p>
          <ul className="space-y-1">
            {record.container.guardrails.map((rule) => (
              <li key={rule} className="text-[12px] text-muted-foreground flex gap-2">
                <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {rule}
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-muted-foreground mt-3">
            Cadence: {record.container.cadence} · Exit: {record.container.exit}
          </p>
        </div>
      ) : null}

      <CoachPanel coach={record.coach} />

      {record.firstAction ? (
        <div className="bg-card border border-primary/30 rounded-xl px-5 py-4" data-testid="thought-first-action">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              {record.tier === 3 ? "Recommended first action" : "First action"}
            </span>
          </div>
          <p className="text-[14px] font-medium leading-snug">{record.firstAction.nextStep}</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            {record.firstAction.timeOrTrigger}
            {record.firstAction.definitionOfDone ? ` · Done when: ${record.firstAction.definitionOfDone}` : ""}
          </p>
        </div>
      ) : null}

      <div className="bg-card border border-card-border rounded-xl px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Learning
        </p>
        {record.learning.expected ? (
          <p className="text-[13px] mb-2">{record.learning.expected}</p>
        ) : null}
        <ul className="space-y-1">
          {record.learning.questions.map((q) => (
            <li key={q} className="text-[12px] text-muted-foreground">
              {q}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Think() {
  const [content, setContent] = useState("");
  const [record, setRecord] = useState<ThoughtRecord | null>(null);

  const process = useMutation({
    mutationFn: async (confirmedMeaningId?: string | null) => {
      const res = await apiRequest("POST", "/api/thoughts/process", {
        content,
        confirmedMeaningId: confirmedMeaningId ?? null,
      });
      return (await res.json()) as ThoughtRecord;
    },
    onSuccess: (data) => setRecord(data),
  });

  return (
    <div className="h-screen bg-background overflow-y-auto custom-scrollbar" style={{ overscrollBehavior: "contain" }}>
      <div className="max-w-[800px] mx-auto px-6 py-8">
        <ThinkNav />

        <div className="mb-6 animate-fade-in delay-1">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-primary" />
            <h1 className="font-display text-3xl font-bold tracking-tight" data-testid="think-heading">
              Think
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{PROPOSITION}</p>
          <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">{PROCESS_TRUST}</p>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-6" data-testid="operating-sequence">
          {OPERATING_SEQUENCE.map((step, i) => (
            <span key={step.id} className="flex items-center gap-1.5">
              <span className="text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground" title={step.question}>
                {step.label}
              </span>
              {i < OPERATING_SEQUENCE.length - 1 ? (
                <span className="text-[11px] text-muted-foreground">→</span>
              ) : null}
            </span>
          ))}
        </div>

        <div className="bg-card border border-card-border rounded-xl p-4 mb-4">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="thought-input">
            Capture — speak or write naturally
          </label>
          <textarea
            id="thought-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-[13px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="I keep thinking we should change how we price this…"
            data-testid="thought-input"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SAMPLE_THOUGHTS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setContent(sample.text);
                  setRecord(null);
                }}
                className="text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground"
                data-testid={`sample-thought-${sample.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {sample.label}
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={() => process.mutate(null)}
              disabled={!content.trim() || process.isPending}
              className="text-[12px] font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5"
              data-testid="button-process-thought"
            >
              {process.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Decide what happens next
            </button>
          </div>
          {process.isError ? (
            <p className="text-[12px] text-destructive mt-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Couldn’t process the thought. Try again.
            </p>
          ) : null}
        </div>

        {record ? (
          <RecordView record={record} onConfirmMeaning={(id) => process.mutate(id)} />
        ) : (
          <p className="text-[12px] text-muted-foreground px-1">
            Every thought gets a destination: {Object.keys(DESTINATION_COPY).join(", ")}. Not every thought becomes a
            project.
          </p>
        )}
      </div>
    </div>
  );
}
