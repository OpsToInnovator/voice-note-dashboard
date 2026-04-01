import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import type { DailyStandup, ProcessingResult, ProofPanel } from "@shared/schema";
import {
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ClipboardList,
  FolderKanban,
  ChevronDown,
  ChevronUp,
  Mic,
  ExternalLink,
  Coffee,
  Loader2,
  Sparkles,
  FileText,
  Zap,
  ArrowRight,
  Trophy,
  TrendingUp,
  Compass,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

// --- Helpers ---
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatTime(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Australia/Perth",
  });
}

// --- Nav Tabs (standalone for full-width layout) ---
function StandupNav() {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <div className="flex items-center justify-between mb-8 animate-fade-in delay-1">
      <div className="flex gap-1">
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

// --- KPI Stat Card ---
function StatCard({
  icon,
  label,
  value,
  colorClass,
  danger,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass?: string;
  danger?: boolean;
  delay: string;
}) {
  return (
    <div
      className={`bg-card border rounded-xl p-4 flex flex-col gap-1 transition-all hover:border-primary/40 animate-fade-in ${delay} ${
        danger && value > 0 ? "border-destructive/40" : "border-card-border"
      }`}
      data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span
        className={`font-display text-2xl font-bold tabular-nums leading-tight ${
          danger && value > 0 ? "text-destructive" : colorClass || "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// --- Type Badge ---
function TypeBadge({ type }: { type: string }) {
  if (!type) return null;
  return (
    <span
      className={`text-[10px] font-medium px-2 py-0.5 rounded ${
        type === "Process"
          ? "text-primary bg-primary/10"
          : type === "Immersive"
            ? "text-chart-3 bg-chart-3/10"
            : "text-muted-foreground bg-muted"
      }`}
    >
      {type}
    </span>
  );
}

// --- Priority Badge ---
function PriorityBadge({ priority }: { priority: string }) {
  if (!priority) return null;
  const isHigh = priority.toLowerCase().includes("high") || priority.toLowerCase().includes("urgent");
  const isMedium = priority.toLowerCase().includes("medium");
  return (
    <span
      className={`text-[10px] font-medium px-2 py-0.5 rounded ${
        isHigh
          ? "text-destructive bg-destructive/10"
          : isMedium
            ? "text-chart-3 bg-chart-3/10"
            : "text-muted-foreground bg-muted"
      }`}
    >
      {priority}
    </span>
  );
}

// --- Due Today Section ---
function DueTodaySection({ tasks }: { tasks: DailyStandup["dueToday"] }) {
  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden animate-fade-in delay-3" data-testid="due-today-section">
      <div className="px-5 py-3.5 font-display text-sm font-semibold flex items-center gap-2 border-b border-card-border">
        <span className="w-2 h-2 rounded-full bg-primary" />
        Due Today
      </div>
      {tasks.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">Nothing due today</p>
          <p className="text-[20px] mt-1">🎉</p>
        </div>
      ) : (
        <ul>
          {tasks.map((task, i) => (
            <li
              key={i}
              className="px-5 py-3 border-b border-card-border last:border-b-0 flex items-center gap-3 hover:bg-muted/30 transition-colors"
              data-testid={`due-today-task-${i}`}
            >
              <div className="w-3.5 h-3.5 rounded-full border-2 border-primary/40 flex-shrink-0" />
              <span className="flex-1 text-[13px] font-medium">{task.name}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <TypeBadge type={task.type} />
                <PriorityBadge priority={task.priority} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- Overdue Section ---
function OverdueSection({ tasks }: { tasks: DailyStandup["overdue"] }) {
  if (tasks.length === 0) return null;

  return (
    <div className="bg-card border border-destructive/30 rounded-xl overflow-hidden animate-fade-in delay-4" data-testid="overdue-section">
      <div className="px-5 py-3.5 font-display text-sm font-semibold flex items-center gap-2 border-b border-card-border text-destructive">
        <AlertTriangle className="w-4 h-4" />
        Overdue
      </div>
      <ul>
        {tasks.map((task, i) => (
          <li
            key={i}
            className="px-5 py-3 border-b border-card-border last:border-b-0 flex items-center gap-3 hover:bg-muted/30 transition-colors"
            data-testid={`overdue-task-${i}`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-medium block">{task.name}</span>
              <span className="text-[11px] text-muted-foreground">
                Due {formatDate(task.due)}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <TypeBadge type={task.type} />
              <span className="text-[11px] font-semibold text-destructive tabular-nums whitespace-nowrap">
                {task.daysOverdue}d overdue
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Completed Yesterday Section (collapsible) ---
function CompletedYesterdaySection({ tasks }: { tasks: DailyStandup["completedYesterday"] }) {
  const [expanded, setExpanded] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden animate-fade-in delay-5" data-testid="completed-yesterday-section">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
        data-testid="toggle-completed-yesterday"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-chart-2" />
          <span className="font-display text-sm font-semibold">
            Completed Yesterday
          </span>
          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
            {tasks.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-card-border">
          {tasks.map((task, i) => (
            <div
              key={i}
              className="px-5 py-2.5 border-b border-card-border last:border-b-0 flex items-center gap-3 text-[13px]"
              data-testid={`completed-task-${i}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-chart-2 flex-shrink-0" />
              <span className="flex-1 text-muted-foreground">{task.name}</span>
              <TypeBadge type={task.type} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Project Health Snapshot ---
function ProjectHealthSnapshot({
  health,
  activeCount,
}: {
  health: DailyStandup["projectHealth"];
  activeCount: number;
}) {
  const items = [
    { label: "Healthy", count: health.healthy, color: "bg-chart-2", textColor: "text-chart-2" },
    { label: "Attention", count: health.attention, color: "bg-chart-3", textColor: "text-chart-3" },
    { label: "Stalled", count: health.stalled, color: "bg-destructive", textColor: "text-destructive" },
    { label: "Paused", count: health.paused, color: "bg-muted-foreground", textColor: "text-muted-foreground" },
    { label: "Waiting", count: health.waiting, color: "bg-muted-foreground", textColor: "text-muted-foreground" },
  ].filter((item) => item.count > 0);

  return (
    <div className="bg-card border border-card-border rounded-xl px-5 py-4 animate-fade-in delay-6" data-testid="project-health-section">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-muted-foreground" />
          <span className="font-display text-sm font-semibold">Project Health</span>
        </div>
        <Link
          href="/projects"
          className="text-[11px] text-primary hover:underline flex items-center gap-1"
          data-testid="link-projects-detail"
        >
          View detail
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${item.color}`} />
            <span className={`text-[13px] font-semibold tabular-nums ${item.textColor}`}>
              {item.count}
            </span>
            <span className="text-[12px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
        {items.length === 0 && (
          <span className="text-[13px] text-muted-foreground">
            {activeCount} active projects
          </span>
        )}
      </div>
    </div>
  );
}

// --- Recent Voice Notes ---
function RecentVoiceNotesSection({
  notes,
}: {
  notes: DailyStandup["recentVoiceNotes"];
}) {
  if (notes.length === 0) return null;

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden animate-fade-in delay-7" data-testid="recent-voice-notes-section">
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-card-border">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-primary" />
          <span className="font-display text-sm font-semibold">
            Recent Voice Notes
          </span>
          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
            Last 24h
          </span>
        </div>
        <Link
          href="/"
          className="text-[11px] text-primary hover:underline flex items-center gap-1"
          data-testid="link-voice-notes-detail"
        >
          View all
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <ul>
        {notes.map((note, i) => (
          <li
            key={i}
            className="px-5 py-3 border-b border-card-border last:border-b-0 flex items-center gap-3"
            data-testid={`recent-note-${i}`}
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mic className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-medium block truncate">{note.name}</span>
              <span className="text-[11px] text-muted-foreground">
                {formatTime(note.created)}
              </span>
            </div>
            {note.durationSeconds && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 flex-shrink-0">
                <Clock className="w-3 h-3" />
                {formatDuration(note.durationSeconds)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Priority Badge ---
function PriorityBadgeSmall({ priority }: { priority: string }) {
  if (!priority) return null;
  const isHigh = priority === "High";
  const isMedium = priority === "Medium";
  return (
    <span
      className={`text-[10px] font-medium px-2 py-0.5 rounded ${
        isHigh
          ? "text-destructive bg-destructive/10"
          : isMedium
            ? "text-chart-3 bg-chart-3/10"
            : "text-muted-foreground bg-muted"
      }`}
    >
      {priority}
    </span>
  );
}

// --- Proof Panel Section ---
const identityColors: Record<string, string> = {
  Builder: "text-primary",
  Communicator: "text-chart-3",
  Leader: "text-chart-5",
  Learner: "text-chart-4",
  Craftsman: "text-chart-1",
  Organiser: "text-muted-foreground",
};

const identityBgColors: Record<string, string> = {
  Builder: "bg-primary/10",
  Communicator: "bg-chart-3/10",
  Leader: "bg-chart-5/10",
  Learner: "bg-chart-4/10",
  Craftsman: "bg-chart-1/10",
  Organiser: "bg-muted",
};

function ProofPanelSection() {
  const { data, isLoading, error } = useQuery<ProofPanel>({
    queryKey: ["/api/proof"],
    staleTime: 1800000,
  });

  const [showTasks, setShowTasks] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-5 animate-fade-in delay-6">
        <Skeleton className="h-5 w-40 mb-3" />
        <Skeleton className="h-16 w-full mb-2" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error || !data || data.totalWins === 0) return null;

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden animate-fade-in delay-6">
      {/* Header */}
      <div className="px-5 py-4 border-b border-card-border">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-chart-2" />
          <span className="font-display text-sm font-semibold">Proof</span>
          <span className="text-[11px] text-muted-foreground">
            {data.totalWins} wins · {data.period}
          </span>
        </div>
      </div>

      {/* Identity Domain Rollup */}
      <div className="px-5 py-4 border-b border-card-border">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-3.5 h-3.5 text-chart-3" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-chart-3">Identity reinforced</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.winsByIdentity.map((id) => (
            <div
              key={id.domain}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${identityBgColors[id.domain] || "bg-muted"}`}
            >
              <span className={`text-[13px] font-semibold ${identityColors[id.domain] || "text-muted-foreground"}`}>
                {id.domain}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {id.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pattern Signal */}
      {data.patternSignal && (
        <div className="px-5 py-4 border-b border-card-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Pattern</span>
          </div>
          <p className="text-[13px] leading-relaxed">{data.patternSignal}</p>
        </div>
      )}

      {/* Wins by Project */}
      {data.winsByProject.length > 0 && (
        <div className="px-5 py-3 border-b border-card-border">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {data.winsByProject.map((p) => (
              <span key={p.project} className="text-[12px] text-muted-foreground">
                {p.project}: <span className="font-semibold text-foreground">{p.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expandable task detail */}
      <button
        onClick={() => setShowTasks(!showTasks)}
        className="w-full px-5 py-2.5 flex items-center justify-between text-[12px] text-muted-foreground hover:bg-muted/30 transition-colors"
      >
        <span>{showTasks ? "Hide" : "Show"} task details</span>
        {showTasks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {showTasks && (
        <div className="divide-y divide-card-border">
          {data.tasks.map((task, i) => (
            <div key={i} className="px-5 py-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-3 h-3 text-chart-2 flex-shrink-0" />
                <span className="text-[13px] font-medium">{task.name}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${identityColors[task.identityDomain] || "text-muted-foreground"} ${identityBgColors[task.identityDomain] || "bg-muted"}`}>
                  {task.identityDomain}
                </span>
              </div>
              {task.whatItMoved && (
                <p className="text-[11px] text-muted-foreground ml-5">{task.whatItMoved}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VoiceNoteProcessorSection() {
  const [result, setResult] = useState<ProcessingResult | null>(null);

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/voice-notes/unprocessed-count"],
    staleTime: 300000, // 5 min
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/process-voice-notes");
      return (await res.json()) as ProcessingResult;
    },
    onSuccess: (data) => {
      setResult(data);
      // Refresh unprocessed count
      queryClient.invalidateQueries({ queryKey: ["/api/voice-notes/unprocessed-count"] });
    },
  });

  const unprocessedCount = countData?.count ?? 0;

  return (
    <div
      className="bg-card border border-card-border rounded-xl overflow-hidden animate-fade-in delay-7"
      data-testid="voice-note-processor-section"
    >
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-card-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-display text-sm font-semibold">Process Voice Notes</span>
          {unprocessedCount > 0 && (
            <span className="text-[11px] font-semibold text-primary-foreground bg-primary px-2 py-0.5 rounded-full tabular-nums">
              {unprocessedCount}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        {/* Status message */}
        {!mutation.isPending && !result && (
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted-foreground">
              {unprocessedCount > 0
                ? `${unprocessedCount} voice note${unprocessedCount !== 1 ? "s" : ""} need processing`
                : "All voice notes have been processed"}
            </p>
            <button
              onClick={() => mutation.mutate()}
              disabled={unprocessedCount === 0}
              className="text-[12px] font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              data-testid="button-process-voice-notes"
            >
              <Zap className="w-3.5 h-3.5" />
              Process{unprocessedCount > 10 ? " Next 10" : ""}
            </button>
          </div>
        )}

        {/* Loading state */}
        {mutation.isPending && (
          <div className="flex items-center gap-3 py-2">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <p className="text-[13px] text-muted-foreground">
              Reading voice notes and extracting tasks…
            </p>
          </div>
        )}

        {/* Error state */}
        {mutation.isError && !result && (
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-destructive">
              Failed to process voice notes. Try again.
            </p>
            <button
              onClick={() => mutation.mutate()}
              className="text-[12px] font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              data-testid="button-retry-process"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="flex items-center gap-4 text-[12px]">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{result.notesProcessed}</span> note{result.notesProcessed !== 1 ? "s" : ""} processed
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-primary tabular-nums">{result.tasksCreated}</span> task{result.tasksCreated !== 1 ? "s" : ""} created
              </span>
              {result.notesTitled > 0 && (
                <span className="text-muted-foreground">
                  <span className="font-semibold text-chart-2 tabular-nums">{result.notesTitled}</span> note{result.notesTitled !== 1 ? "s" : ""} titled
                </span>
              )}
            </div>

            {/* Processed notes detail */}
            {result.details.filter(d => d.tasksCreated.length > 0).map((detail) => (
              <div key={detail.id} className="border border-card-border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 flex items-center gap-2 border-b border-card-border">
                  <Mic className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="text-[12px] font-medium truncate">{detail.name}</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded tabular-nums flex-shrink-0">
                    {detail.tasksCreated.length} task{detail.tasksCreated.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <ul>
                  {detail.tasksCreated.map((task, i) => (
                    <li
                      key={i}
                      className="px-4 py-2 border-b border-card-border last:border-b-0 flex items-center gap-2.5"
                      data-testid={`extracted-task-${detail.id}-${i}`}
                    >
                      <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-[12px] flex-1 min-w-0 truncate">{task.name}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <TypeBadge type={task.type} />
                        <PriorityBadgeSmall priority={task.priority} />
                        {task.project && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[120px]">
                            {task.project}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Notes with no tasks extracted */}
            {result.details.filter(d => d.tasksCreated.length === 0).length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {result.details.filter(d => d.tasksCreated.length === 0).length} note{result.details.filter(d => d.tasksCreated.length === 0).length !== 1 ? "s" : ""} had no actionable tasks
              </p>
            )}

            {/* Auto-titled notes */}
            {result.titledNotes.length > 0 && (
              <div className="border border-card-border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 flex items-center gap-2 border-b border-card-border">
                  <FileText className="w-3.5 h-3.5 text-chart-2 flex-shrink-0" />
                  <span className="text-[12px] font-medium">Auto-Titled Notes</span>
                </div>
                <ul>
                  {result.titledNotes.map((note, i) => (
                    <li
                      key={note.id}
                      className="px-4 py-2 border-b border-card-border last:border-b-0 flex items-center gap-2.5 text-[12px]"
                      data-testid={`titled-note-${i}`}
                    >
                      <span className="text-muted-foreground line-through">{note.oldTitle}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{note.newTitle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Process more button */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setResult(null);
                  mutation.reset();
                }}
                className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
                data-testid="button-process-more"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Loading Skeleton ---
function StandupSkeleton() {
  return (
    <div className="h-screen bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-[800px] mx-auto px-6 py-8">
        <Skeleton className="h-5 w-48 mb-8" />
        <Skeleton className="h-10 w-72 mb-2" />
        <Skeleton className="h-5 w-40 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl mb-4" />
        <Skeleton className="h-36 rounded-xl mb-4" />
        <Skeleton className="h-16 rounded-xl mb-4" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </div>
  );
}

// --- Main Standup Page ---
export default function Standup() {
  const { data, isLoading, error } = useQuery<DailyStandup>({
    queryKey: ["/api/standup"],
    staleTime: 1800000, // 30 min
  });

  if (isLoading) return <StandupSkeleton />;

  if (error) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Failed to load standup data.</p>
        </div>
      </div>
    );
  }

  if (!data) return <StandupSkeleton />;

  return (
    <div className="h-screen bg-background overflow-y-auto custom-scrollbar" style={{ overscrollBehavior: "contain" }}>
      <div className="max-w-[800px] mx-auto px-6 py-8">
        {/* Navigation */}
        <StandupNav />

        {/* Header */}
        <div className="mb-8 animate-fade-in delay-1">
          <h1
            className="font-display text-3xl font-bold tracking-tight leading-tight"
            data-testid="standup-greeting"
          >
            {data.greeting}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
            <Coffee className="w-4 h-4" />
            {data.date}
          </p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            label="Completed Yesterday"
            value={data.stats.completedYesterdayCount}
            colorClass="text-chart-2"
            delay="delay-2"
          />
          <StatCard
            icon={<ClipboardList className="w-3.5 h-3.5" />}
            label="Due Today"
            value={data.stats.dueTodayCount}
            colorClass="text-primary"
            delay="delay-2"
          />
          <StatCard
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            label="Overdue"
            value={data.stats.overdueCount}
            danger
            delay="delay-2"
          />
          <StatCard
            icon={<FolderKanban className="w-3.5 h-3.5" />}
            label="Active Projects"
            value={data.stats.activeProjects}
            colorClass="text-foreground"
            delay="delay-2"
          />
        </div>

        {/* Proof — evidence of progress */}
        <ProofPanelSection />

        {/* Today's work */}
        <div className="space-y-4">
          <DueTodaySection tasks={data.dueToday} />

          {/* Overdue */}
          <OverdueSection tasks={data.overdue} />

          {/* Completed Yesterday */}
          <CompletedYesterdaySection tasks={data.completedYesterday} />

          {/* Project Health Snapshot */}
          <ProjectHealthSnapshot
            health={data.projectHealth}
            activeCount={data.stats.activeProjects}
          />

          {/* Recent Voice Notes */}
          <RecentVoiceNotesSection notes={data.recentVoiceNotes} />

          {/* Voice Note Task Extractor */}
          <VoiceNoteProcessorSection />
        </div>
      </div>
    </div>
  );
}
