import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/lib/theme";
import type { VoiceNoteListItem, VoiceNoteDetail } from "@shared/schema";
import {
  Mic,
  Sun,
  Moon,
  CheckCircle2,
  ChevronRight,
  Clock,
  ListTodo,
  Lightbulb,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

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

// Colors that match the static dashboard
function useChartColors() {
  const { theme } = useTheme();
  return theme === "dark"
    ? {
        accent: "#4f98a3",
        success: "#6daa45",
        warning: "#e8af34",
        error: "#dd6974",
        purple: "#a86fdf",
        surface: "#18181b",
        text: "#e4e4e7",
        textMuted: "#8b8b94",
        border: "#2e2e33",
      }
    : {
        accent: "#01696f",
        success: "#437a22",
        warning: "#964219",
        error: "#a13544",
        purple: "#7c3aed",
        surface: "#ffffff",
        text: "#1c1c1e",
        textMuted: "#6b6b73",
        border: "#e2e2e0",
      };
}

// --- Nav Tabs ---
function NavTabs() {
  const [location] = useLocation();
  return (
    <div className="px-3 py-2 border-b border-sidebar-border flex gap-1">
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
    </div>
  );
}

// --- Sidebar ---
function VoiceNoteSidebar({
  notes,
  isLoading,
  selectedId,
  onSelect,
}: {
  notes: VoiceNoteListItem[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { theme, toggle } = useTheme();

  return (
    <div
      className="flex flex-col h-full bg-sidebar border-r border-sidebar-border"
      style={{ width: 300 }}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary flex items-center justify-center">
            <Mic className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-sm font-semibold tracking-tight" data-testid="app-title">
              Voice Notes
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {isLoading ? "Loading…" : `${notes.length} notes`}
            </p>
          </div>
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

      {/* Nav tabs */}
      <NavTabs />

      {/* Sidebar List */}
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-2">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-2.5 mb-1">
                <Skeleton className="h-4 w-3/4 mb-1.5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                onClick={() => onSelect(note.id)}
                className={`w-full text-left rounded-lg px-3 py-2.5 mb-0.5 transition-all group ${
                  selectedId === note.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted border border-transparent"
                }`}
                data-testid={`sidebar-note-${note.id}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[13px] font-medium line-clamp-2 leading-tight ${
                      selectedId === note.id ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {note.name}
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 flex-shrink-0 ml-2 transition-opacity ${
                      selectedId === note.id
                        ? "text-primary opacity-100"
                        : "text-muted-foreground opacity-0 group-hover:opacity-100"
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                  {note.noteDate && <span>{formatDate(note.noteDate)}</span>}
                  {note.durationSeconds && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDuration(note.durationSeconds)}
                      </span>
                    </>
                  )}
                  {note.taskCount > 0 && (
                    <>
                      <span>·</span>
                      <span>{note.taskCount} tasks</span>
                    </>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// --- KPI Card ---
function KpiCard({
  label,
  value,
  sub,
  colorClass,
  delay,
}: {
  label: string;
  value: string | number;
  sub: string;
  colorClass?: string;
  delay: string;
}) {
  return (
    <div
      className={`bg-card border border-card-border rounded-xl p-4 flex flex-col gap-0.5 transition-all hover:border-primary hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.12)] animate-fade-in ${delay}`}
      data-testid={`kpi-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`font-display text-2xl font-bold tabular-nums leading-tight ${colorClass || "text-foreground"}`}
      >
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground/60">{sub}</span>
    </div>
  );
}

// --- Donut Chart ---
function TypeDonutChart({ tasks }: { tasks: VoiceNoteDetail["tasks"] }) {
  const colors = useChartColors();
  const processCount = tasks.filter((t) => t.type === "Process").length;
  const immersiveCount = tasks.filter((t) => t.type === "Immersive").length;
  const otherCount = tasks.length - processCount - immersiveCount;

  const data = [
    { name: "Process", value: processCount },
    { name: "Immersive", value: immersiveCount },
    ...(otherCount > 0 ? [{ name: "Other", value: otherCount }] : []),
  ].filter((d) => d.value > 0);

  const chartColors = [colors.accent, colors.warning, colors.textMuted];

  if (data.length === 0) return null;

  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="mb-3">
        <h3 className="font-display text-sm font-semibold">Task Type Distribution</h3>
        <p className="text-[11px] text-muted-foreground">Process vs Immersive work</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={2}
            stroke={colors.surface}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={chartColors[i % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              fontSize: 12,
              color: colors.text,
            }}
            formatter={(value: number, name: string) => [
              `${value} tasks (${Math.round((value / tasks.length) * 100)}%)`,
              name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: colors.textMuted, fontSize: 12 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Thread Bar Chart ---
function ThreadBarChart({ tasks, threads }: { tasks: VoiceNoteDetail["tasks"]; threads: VoiceNoteDetail["content"]["keyThreads"] }) {
  const colors = useChartColors();
  const chartColors = [colors.accent, colors.purple, colors.warning, colors.success, colors.error];

  // Group tasks by thread name (approximate matching)
  const threadData = threads.map((thread, i) => {
    const threadWords = thread.title.toLowerCase().split(/\s+/);
    const matchCount = tasks.filter((task) => {
      const taskName = task.name.toLowerCase();
      return threadWords.some(
        (w) => w.length > 3 && taskName.includes(w)
      );
    }).length;
    return {
      name: thread.title.length > 20 ? thread.title.slice(0, 20) + "…" : thread.title,
      count: matchCount || Math.ceil(tasks.length / threads.length),
      fill: chartColors[i % chartColors.length],
    };
  });

  if (threadData.length === 0) return null;

  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="mb-3">
        <h3 className="font-display text-sm font-semibold">Tasks by Thread</h3>
        <p className="text-[11px] text-muted-foreground">Grouped by key theme</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={threadData}
          layout="vertical"
          margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.border + "40"}
            horizontal={false}
          />
          <XAxis type="number" tick={{ fontSize: 11, fill: colors.textMuted }} />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 11, fill: colors.textMuted }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              fontSize: 12,
              color: colors.text,
            }}
            formatter={(value: number) => [`${value} tasks`]}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
            {threadData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Task Breakdown Stacked Bar ---
function TaskBreakdownChart({ tasks }: { tasks: VoiceNoteDetail["tasks"] }) {
  const colors = useChartColors();

  const data = tasks.map((task) => ({
    name: task.name.length > 18 ? task.name.slice(0, 18) + "…" : task.name,
    Process: task.type === "Process" ? 1 : 0,
    Immersive: task.type === "Immersive" ? 1 : 0,
    Other: task.type !== "Process" && task.type !== "Immersive" ? 1 : 0,
  }));

  if (data.length === 0) return null;

  return (
    <div className="bg-card border border-card-border rounded-xl p-4 col-span-2">
      <div className="mb-3">
        <h3 className="font-display text-sm font-semibold">Task Breakdown</h3>
        <p className="text-[11px] text-muted-foreground">
          Each task categorised by type
        </p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 40 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.border + "40"}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: colors.textMuted }}
            angle={-35}
            textAnchor="end"
            interval={0}
            height={60}
          />
          <YAxis hide domain={[0, 1]} />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              fontSize: 12,
              color: colors.text,
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={30}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar
            dataKey="Process"
            stackId="a"
            fill={colors.accent}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="Immersive"
            stackId="a"
            fill={colors.warning}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Key Threads Section ---
function KeyThreadsSection({ threads }: { threads: VoiceNoteDetail["content"]["keyThreads"] }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (threads.length === 0) return null;

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden animate-fade-in delay-4">
      <div className="px-4 py-3 font-display text-sm font-semibold flex items-center gap-2 border-b border-card-border">
        <span className="w-2 h-2 rounded-full bg-primary" />
        Key Threads
      </div>
      <ul>
        {threads.map((thread, i) => (
          <li
            key={i}
            className="border-b border-card-border last:border-b-0"
          >
            <button
              className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              data-testid={`thread-${i}`}
            >
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-sm flex-shrink-0">
                {thread.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-sm font-semibold">
                  {thread.title}
                </div>
                {(expandedIdx === i || !thread.description) ? null : (
                  <div className="text-[13px] text-muted-foreground line-clamp-1 mt-0.5">
                    {thread.description}
                  </div>
                )}
                {expandedIdx === i && thread.description && (
                  <div className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                    {thread.description}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 text-muted-foreground mt-1">
                {expandedIdx === i ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Insight/Tension/Opportunity Cards ---
function InsightGrid({ content }: { content: VoiceNoteDetail["content"] }) {
  const cards: {
    type: "insight" | "tension" | "opportunity";
    text: string;
    context: string;
  }[] = [];

  content.insights.forEach((text) =>
    cards.push({ type: "insight", text, context: "" })
  );
  content.tensions.forEach((t) =>
    cards.push({ type: "tension", text: t.text, context: t.context })
  );
  content.opportunities.forEach((o) =>
    cards.push({ type: "opportunity", text: o.text, context: o.context })
  );

  if (cards.length === 0) return null;

  const config = {
    insight: {
      border: "border-l-primary",
      tag: "text-primary bg-primary/10",
      icon: <Lightbulb className="w-3 h-3" />,
    },
    tension: {
      border: "border-l-destructive",
      tag: "text-destructive bg-destructive/10",
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    opportunity: {
      border: "border-l-chart-2",
      tag: "text-chart-2 bg-chart-2/10",
      icon: <Sparkles className="w-3 h-3" />,
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in delay-5">
      {cards.map((card, i) => {
        const c = config[card.type];
        return (
          <div
            key={i}
            className={`bg-card border border-card-border ${c.border} border-l-[3px] rounded-xl p-4 flex flex-col gap-2`}
            data-testid={`${card.type}-card-${i}`}
          >
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded w-fit flex items-center gap-1 ${c.tag}`}
            >
              {c.icon}
              {card.type}
            </span>
            <div className="text-sm leading-relaxed">{card.text}</div>
            {card.context && (
              <div className="text-[13px] text-muted-foreground leading-relaxed">
                {card.context}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Task Table ---
function TaskTable({ tasks }: { tasks: VoiceNoteDetail["tasks"] }) {
  if (tasks.length === 0) return null;

  const doneCount = tasks.filter((t) => t.status === "Done").length;

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden animate-fade-in delay-6">
      <div className="px-4 py-3 font-display text-sm font-semibold flex items-center gap-2 border-b border-card-border">
        <span
          className={`w-2 h-2 rounded-full ${
            doneCount === tasks.length ? "bg-chart-2" : "bg-chart-3"
          }`}
        />
        All Tasks — {doneCount} of {tasks.length} Complete
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" data-testid="task-table">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-left w-10">
                #
              </th>
              <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-left">
                Task
              </th>
              <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-left">
                Type
              </th>
              <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-left">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => (
              <tr
                key={task.id}
                className="border-b border-card-border last:border-b-0 hover:bg-muted/30 transition-colors"
                data-testid={`task-row-${task.id}`}
              >
                <td className="px-4 py-2.5 text-[13px] text-muted-foreground">
                  {i + 1}
                </td>
                <td className="px-4 py-2.5 text-[13px]">{task.name}</td>
                <td className="px-4 py-2.5">
                  {task.type ? (
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                        task.type === "Process"
                          ? "text-primary bg-primary/10"
                          : task.type === "Immersive"
                          ? "text-chart-3 bg-chart-3/10"
                          : "text-muted-foreground bg-muted"
                      }`}
                    >
                      {task.type}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {task.status === "Done" ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-chart-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Done
                    </span>
                  ) : task.status === "Doing" ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-chart-3">
                      <Clock className="w-3.5 h-3.5" />
                      In Progress
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ListTodo className="w-3.5 h-3.5" />
                      To Do
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Questions Section ---
function QuestionsSection({ questions }: { questions: string[] }) {
  if (questions.length === 0) return null;

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden animate-fade-in delay-7">
      <div className="px-4 py-3 font-display text-sm font-semibold flex items-center gap-2 border-b border-card-border">
        <span className="w-2 h-2 rounded-full bg-chart-3" />
        Questions to Explore
      </div>
      <ul>
        {questions.map((q, i) => (
          <li
            key={i}
            className="px-4 py-2.5 border-b border-card-border last:border-b-0 flex items-center gap-3 text-[13px]"
            data-testid={`question-${i}`}
          >
            <HelpCircle className="w-4 h-4 text-chart-3 flex-shrink-0" />
            {q}
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Raw Content Fallback ---
function RawContentView({ content }: { content: string }) {
  // Clean up the raw content from XML-like tags
  const cleaned = content
    .replace(/<page[^>]*>/g, "")
    .replace(/<\/page>/g, "")
    .replace(/<ancestor-path>[\s\S]*?<\/ancestor-path>/g, "")
    .replace(/<properties>[\s\S]*?<\/properties>/g, "")
    .replace(/<\/?content>/g, "")
    .replace(/^Here is the result.*?\n/gm, "")
    .trim();

  return (
    <div className="bg-card border border-card-border rounded-xl p-5 animate-fade-in delay-2">
      <div className="font-display text-sm font-semibold mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        Note Content
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed whitespace-pre-wrap">
        {cleaned}
      </div>
    </div>
  );
}

// --- Empty State ---
function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="text-center max-w-md px-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
          <Mic className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-display text-lg font-semibold mb-2">
          Voice Note Dashboard
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Select a voice note from the sidebar to view its summary, tasks,
          insights, and analytics.
        </p>
      </div>
    </div>
  );
}

// --- Detail Loading Skeleton ---
function DetailSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

// --- Main Detail View ---
function VoiceNoteDetailView({ noteId }: { noteId: string }) {
  const { data: detail, isLoading, error } = useQuery<VoiceNoteDetail>({
    queryKey: ["/api/voice-notes", noteId],
    enabled: !!noteId,
    staleTime: 60000,
  });

  if (isLoading) return <DetailSkeleton />;
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Failed to load voice note.</p>
        </div>
      </div>
    );
  }
  if (!detail) return <EmptyState />;

  const { content, tasks } = detail;
  const doneCount = tasks.filter((t) => t.status === "Done").length;
  const completionPct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="p-5 space-y-4">
      {/* Header with note info */}
      <div className="flex items-start justify-between animate-fade-in delay-1">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight leading-tight max-w-2xl" data-testid="note-title">
            {detail.name}
          </h2>
          <p className="text-[12px] text-muted-foreground mt-1 flex items-center gap-2">
            {detail.noteDate && <span>{formatDate(detail.noteDate)}</span>}
            {detail.durationSeconds && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {formatDuration(detail.durationSeconds)}
                </span>
              </>
            )}
            {tasks.length > 0 && (
              <>
                <span>·</span>
                <span>{tasks.length} tasks</span>
              </>
            )}
            {content.keyThreads.length > 0 && (
              <>
                <span>·</span>
                <span>{content.keyThreads.length} threads</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Summary bar */}
      {content.summary && (
        <div
          className="bg-card border border-card-border rounded-xl px-4 py-3 text-sm leading-relaxed text-muted-foreground animate-fade-in delay-1"
          data-testid="summary-bar"
        >
          <span className="font-semibold text-foreground">Focus: </span>
          {content.summary}
        </div>
      )}

      {/* KPI Row — only show if we have tasks or structured content */}
      {(tasks.length > 0 || content.isStructured) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard
            label="Tasks"
            value={tasks.length}
            sub="Generated"
            colorClass="text-primary"
            delay="delay-2"
          />
          <KpiCard
            label="Completed"
            value={`${completionPct}%`}
            sub={`${doneCount} of ${tasks.length}`}
            colorClass="text-chart-2"
            delay="delay-2"
          />
          <KpiCard
            label="Threads"
            value={content.keyThreads.length}
            sub="Key themes"
            delay="delay-2"
          />
          <KpiCard
            label="Insights"
            value={content.insights.length}
            sub="Notable"
            delay="delay-2"
          />
          <KpiCard
            label="Tensions"
            value={content.tensions.length}
            sub="Identified"
            colorClass="text-chart-3"
            delay="delay-2"
          />
          <KpiCard
            label="Opportunities"
            value={content.opportunities.length}
            sub="Latent"
            colorClass="text-chart-2"
            delay="delay-2"
          />
        </div>
      )}

      {/* Charts — only show if tasks exist */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in delay-3">
          <TypeDonutChart tasks={tasks} />
          {content.keyThreads.length > 0 && (
            <ThreadBarChart tasks={tasks} threads={content.keyThreads} />
          )}
          <TaskBreakdownChart tasks={tasks} />
        </div>
      )}

      {/* Key Threads */}
      <KeyThreadsSection threads={content.keyThreads} />

      {/* Insights, Tensions, Opportunities */}
      <InsightGrid content={content} />

      {/* Task Table */}
      <TaskTable tasks={tasks} />

      {/* Questions */}
      <QuestionsSection questions={content.questions} />

      {/* Assumptions */}
      {content.assumptions.length > 0 && (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden animate-fade-in delay-7">
          <div className="px-4 py-3 font-display text-sm font-semibold flex items-center gap-2 border-b border-card-border">
            <span className="w-2 h-2 rounded-full bg-chart-4" />
            Assumptions Being Made
          </div>
          <ul>
            {content.assumptions.map((a, i) => (
              <li
                key={i}
                className="px-4 py-2.5 border-b border-card-border last:border-b-0 text-[13px] text-muted-foreground"
              >
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw content fallback for unstructured notes */}
      {!content.isStructured && content.rawContent && (
        <RawContentView content={content.rawContent} />
      )}
    </div>
  );
}

// --- Main Dashboard ---
export default function Dashboard() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: notes = [], isLoading } = useQuery<VoiceNoteListItem[]>({
    queryKey: ["/api/voice-notes"],
    staleTime: 60000,
  });

  return (
    <div className="flex h-screen bg-background">
      <VoiceNoteSidebar
        notes={notes}
        isLoading={isLoading}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ overscrollBehavior: "contain" }}>
        {selectedId ? (
          <VoiceNoteDetailView noteId={selectedId} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
