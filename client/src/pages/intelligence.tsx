import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/lib/theme";
import type { IntelligenceReport, ClassifiedTask, SystemAuditItem, TitledNote } from "@shared/schema";
import {
  Sun,
  Moon,
  Brain,
  Target,
  Eye,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Sparkles,
  RefreshCw,
  Zap,
  ListChecks,
  CheckCircle2,
  Loader2,
  Shield,
  Archive,
  ArrowDownToLine,
  Merge,
  ChevronDown,
  ChevronUp,
  FileEdit,
  ArrowRight,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

// --- Helpers ---
function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// --- Nav Tabs ---
function IntelligenceNav() {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <div className="flex items-center justify-between mb-8 animate-fade-in delay-1">
      <div className="flex gap-1">
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

// --- Loading Skeleton ---
function IntelligenceSkeleton() {
  return (
    <div className="h-screen bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <Skeleton className="h-5 w-48 mb-8" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-32 mb-8" />
        {/* Summary banner */}
        <Skeleton className="h-20 rounded-xl mb-6" />
        {/* Primary focus */}
        <Skeleton className="h-44 rounded-xl mb-6" />
        {/* Two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}

// --- Card Components ---

function SummaryBanner({ summary }: { summary: string }) {
  return (
    <div
      className="bg-primary/8 border border-primary/20 rounded-xl px-5 py-4 mb-6 animate-fade-in delay-2"
      data-testid="summary-banner"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <p className="text-[14px] font-medium leading-relaxed text-foreground">
          {summary}
        </p>
      </div>
    </div>
  );
}

function PrimaryFocusCard({ data }: { data: IntelligenceReport["primaryFocus"] }) {
  return (
    <div
      className="bg-card border-l-[3px] border-l-primary border border-card-border rounded-xl p-5 mb-6 animate-fade-in delay-3"
      data-testid="primary-focus-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          Primary Focus
        </span>
      </div>
      <h3 className="font-display text-lg font-bold tracking-tight mb-2">
        {data.title}
      </h3>
      <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
        {data.reasoning}
      </p>
      {data.connectedGoal && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            Goal: {data.connectedGoal}
          </span>
        </div>
      )}
    </div>
  );
}

function PatternInsightCard({ data }: { data: IntelligenceReport["patternInsight"] }) {
  return (
    <div
      className="bg-card border-l-[3px] border-l-chart-3 border border-card-border rounded-xl p-5 animate-fade-in delay-4"
      data-testid="pattern-insight-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-chart-3" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-chart-3">
          Pattern Insight
        </span>
      </div>
      <p className="text-[13px] leading-relaxed mb-3">
        {data.observation}
      </p>
      {data.evidence.length > 0 && (
        <ul className="space-y-1.5">
          {data.evidence.map((e, i) => (
            <li key={i} className="text-[12px] text-muted-foreground flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-chart-3 mt-1.5 flex-shrink-0" />
              {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RiskFlagCard({ data }: { data: IntelligenceReport["riskFlag"] }) {
  return (
    <div
      className="bg-card border-l-[3px] border-l-destructive border border-card-border rounded-xl p-5 animate-fade-in delay-4"
      data-testid="risk-flag-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
          Risk Flag
        </span>
      </div>
      <p className="text-[13px] font-semibold mb-1.5">
        {data.item}
      </p>
      <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
        {data.reason}
      </p>
      {data.suggestedAction && (
        <div className="bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2">
          <p className="text-[12px] text-foreground">
            <span className="font-semibold">Action: </span>
            {data.suggestedAction}
          </p>
        </div>
      )}
    </div>
  );
}

function MomentumWinCard({ data }: { data: IntelligenceReport["momentumWin"] }) {
  return (
    <div
      className="bg-card border-l-[3px] border-l-chart-2 border border-card-border rounded-xl p-5 animate-fade-in delay-5"
      data-testid="momentum-win-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-chart-2" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-chart-2">
          Momentum Win
        </span>
      </div>
      <p className="text-[13px] font-semibold mb-1.5">
        {data.achievement}
      </p>
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        {data.leverage}
      </p>
    </div>
  );
}

function WeeklyPriorityCard({ data }: { data: IntelligenceReport["weeklyPriority"] }) {
  return (
    <div
      className="bg-card border-l-[3px] border-l-chart-5 border border-card-border rounded-xl p-5 animate-fade-in delay-5"
      data-testid="weekly-priority-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-chart-5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-chart-5">
          Weekly Priority
        </span>
      </div>
      <p className="text-[13px] font-semibold mb-1.5">
        {data.focus}
      </p>
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        {data.reasoning}
      </p>
    </div>
  );
}

// --- System Audit Section ---
const auditIcons: Record<string, typeof Shield> = {
  keep: CheckCircle2,
  demote_to_goal: ArrowDownToLine,
  demote_to_note: ArrowDownToLine,
  merge: Merge,
  archive: Archive,
};

const auditColors: Record<string, string> = {
  keep: "text-chart-2",
  demote_to_goal: "text-chart-3",
  demote_to_note: "text-muted-foreground",
  merge: "text-primary",
  archive: "text-muted-foreground",
};

const auditLabels: Record<string, string> = {
  keep: "Keep as Project",
  demote_to_goal: "Move to Goals",
  demote_to_note: "Move to Notes",
  merge: "Merge",
  archive: "Archive",
};

function SystemAuditSection({ audit }: { audit: { summary: string; items: SystemAuditItem[] } }) {
  const [expanded, setExpanded] = useState(false);
  
  const actionItems = audit.items.filter(i => i.recommendation !== 'keep');
  const keepItems = audit.items.filter(i => i.recommendation === 'keep');

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden animate-fade-in delay-6" data-testid="system-audit">
      <div className="px-5 py-4 border-b border-card-border">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">System Audit</span>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {actionItems.length} action{actionItems.length !== 1 ? 's' : ''} recommended
          </span>
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          {audit.summary}
        </p>
      </div>

      {/* Action items first — things that need changing */}
      {actionItems.length > 0 && (
        <div className="divide-y divide-card-border">
          {actionItems.map((item, i) => {
            const Icon = auditIcons[item.recommendation] || AlertTriangle;
            const colorClass = auditColors[item.recommendation] || "text-muted-foreground";
            const label = auditLabels[item.recommendation] || item.recommendation;
            return (
              <div key={i} className="px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-sm font-semibold">{item.name}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${colorClass} bg-muted`}>
                        {label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Currently: {item.currentType}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                      {item.reasoning}
                    </p>
                    {item.actionRequired && (
                      <p className="text-[12px] text-foreground mt-1">
                        <span className="font-medium">Action:</span> {item.actionRequired}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Healthy items — collapsible */}
      {keepItems.length > 0 && (
        <div className="border-t border-card-border">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-5 py-2.5 flex items-center justify-between text-[12px] text-muted-foreground hover:bg-muted/30 transition-colors"
          >
            <span>{keepItems.length} project{keepItems.length !== 1 ? 's' : ''} confirmed as valid</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {expanded && (
            <div className="divide-y divide-card-border">
              {keepItems.map((item, i) => (
                <div key={i} className="px-5 py-2.5 flex items-center gap-3">
                  <CheckCircle2 className="w-3.5 h-3.5 text-chart-2 flex-shrink-0" />
                  <span className="text-[12px] font-medium">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{item.reasoning}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Task Classifier Section ---
function TaskClassifierSection() {
  const [results, setResults] = useState<ClassifiedTask[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tasks/classify");
      return res.json();
    },
    onSuccess: (data) => {
      setResults(data.classified || []);
    },
  });

  return (
    <div
      className="bg-card border border-card-border rounded-xl overflow-hidden animate-fade-in delay-6 mt-6"
      data-testid="task-classifier-section"
    >
      <div className="px-5 py-4 flex items-center justify-between border-b border-card-border">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-muted-foreground" />
          <span className="font-display text-sm font-semibold">Task Auto-Classifier</span>
          <span className="text-[11px] text-muted-foreground">
            Assigns Process/Immersive to unclassified tasks
          </span>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="text-[12px] font-medium px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          data-testid="classify-tasks-button"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Classifying…
            </>
          ) : (
            <>
              <Zap className="w-3 h-3" />
              Classify Tasks
            </>
          )}
        </button>
      </div>

      {mutation.isPending && (
        <div className="px-5 py-6 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!mutation.isPending && results.length > 0 && (
        <div className="divide-y divide-card-border">
          {results.map((task, i) => (
            <div
              key={task.id}
              className="px-5 py-3 flex items-center gap-3"
              data-testid={`classified-task-${i}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-chart-2 flex-shrink-0" />
              <span className="flex-1 text-[13px] font-medium truncate">{task.name}</span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                  task.classification === "Process"
                    ? "text-primary bg-primary/10"
                    : "text-chart-3 bg-chart-3/10"
                }`}
              >
                {task.classification}
              </span>
            </div>
          ))}
        </div>
      )}

      {!mutation.isPending && results.length === 0 && !mutation.isIdle && (
        <div className="px-5 py-6 text-center">
          <p className="text-[13px] text-muted-foreground">
            All tasks already have P/I classifications.
          </p>
        </div>
      )}

      {mutation.isError && (
        <div className="px-5 py-4">
          <p className="text-[12px] text-destructive">
            Failed to classify tasks. Please try again.
          </p>
        </div>
      )}
    </div>
  );
}

// --- Note Auto-Titler Section ---
function NoteTitlerSection() {
  const [results, setResults] = useState<TitledNote[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notes/auto-title");
      return res.json();
    },
    onSuccess: (data) => {
      setResults(data.titled || []);
    },
  });

  return (
    <div
      className="bg-card border border-card-border rounded-xl overflow-hidden animate-fade-in delay-6 mt-6"
      data-testid="note-titler-section"
    >
      <div className="px-5 py-4 flex items-center justify-between border-b border-card-border">
        <div className="flex items-center gap-2">
          <FileEdit className="w-4 h-4 text-muted-foreground" />
          <span className="font-display text-sm font-semibold">Auto-Title Notes</span>
          <span className="text-[11px] text-muted-foreground">
            Names untitled notes from content
          </span>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="text-[12px] font-medium px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          data-testid="title-notes-button"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Zap className="w-3 h-3" />
              Title Notes
            </>
          )}
        </button>
      </div>

      {mutation.isPending && (
        <div className="px-5 py-6 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!mutation.isPending && results.length > 0 && (
        <div className="divide-y divide-card-border">
          {results.map((note, i) => (
            <div
              key={note.id}
              className="px-5 py-3"
              data-testid={`titled-note-${i}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[12px] text-muted-foreground line-through">
                  {note.oldTitle || "Untitled"}
                </span>
                <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="text-[13px] font-semibold text-primary">
                  {note.newTitle}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/60 truncate">
                {note.contentPreview}
              </p>
            </div>
          ))}
        </div>
      )}

      {!mutation.isPending && results.length === 0 && !mutation.isIdle && (
        <div className="px-5 py-6 text-center">
          <p className="text-[13px] text-muted-foreground">
            All notes already have titles.
          </p>
        </div>
      )}

      {mutation.isError && (
        <div className="px-5 py-4">
          <p className="text-[12px] text-destructive">
            Failed to generate titles. Please try again.
          </p>
        </div>
      )}
    </div>
  );
}

// --- Main Intelligence Page ---
export default function Intelligence() {
  const { data, isLoading, error, refetch, isFetching } = useQuery<IntelligenceReport>({
    queryKey: ["/api/intelligence"],
    staleTime: Infinity, // Manual refresh only
    enabled: false, // Don't auto-fetch on page load
    retry: 1,
  });

  // Show a "Run Analysis" prompt if no cached data
  const hasData = !!data;

  if (isLoading) return <IntelligenceSkeleton />;

  if (error) {
    return (
      <div className="h-screen bg-background overflow-y-auto custom-scrollbar">
        <div className="max-w-[900px] mx-auto px-6 py-8">
          <IntelligenceNav />
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle className="w-8 h-8 text-destructive mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Failed to generate intelligence report.</p>
            <button
              onClick={() => refetch()}
              className="text-[12px] font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              data-testid="retry-button"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasData && !isFetching) {
    return (
      <div className="h-screen bg-background overflow-y-auto custom-scrollbar">
        <div className="max-w-[900px] mx-auto px-6 py-8">
          <IntelligenceNav />
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-lg font-semibold mb-2">Weekly Intelligence Review</h2>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6 leading-relaxed">
              Run this once a week to get a full analysis of your goals, projects, patterns, and system health. Uses your OpenAI API.
            </p>
            <button
              onClick={() => refetch()}
              className="text-sm font-medium px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Run Analysis
            </button>
          </div>

          {/* Tools still available without running analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <TaskClassifierSection />
            <NoteTitlerSection />
          </div>
        </div>
      </div>
    );
  }

  if (isFetching && !data) return <IntelligenceSkeleton />;
  if (!data) return <IntelligenceSkeleton />;

  return (
    <div className="h-screen bg-background overflow-y-auto custom-scrollbar" style={{ overscrollBehavior: "contain" }}>
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Navigation */}
        <IntelligenceNav />

        {/* Header */}
        <div className="mb-6 animate-fade-in delay-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Brain className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <h1
                  className="font-display text-xl font-bold tracking-tight"
                  data-testid="intelligence-title"
                >
                  Intelligence
                </h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {data.generatedAt ? `Updated ${timeAgo(data.generatedAt)}` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50 flex items-center gap-1.5"
              data-testid="refresh-button"
            >
              <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Banner */}
        <SummaryBanner summary={data.summary} />

        {/* Primary Focus */}
        <PrimaryFocusCard data={data.primaryFocus} />

        {/* Row: Pattern Insight + Risk Flag */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <PatternInsightCard data={data.patternInsight} />
          <RiskFlagCard data={data.riskFlag} />
        </div>

        {/* Row: Momentum Win + Weekly Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MomentumWinCard data={data.momentumWin} />
          <WeeklyPriorityCard data={data.weeklyPriority} />
        </div>

        {/* System Audit */}
        {data.systemAudit && data.systemAudit.items && data.systemAudit.items.length > 0 && (
          <SystemAuditSection audit={data.systemAudit} />
        )}

        {/* Task Classifier */}
        {/* Tools Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TaskClassifierSection />
          <NoteTitlerSection />
        </div>
      </div>
    </div>
  );
}
