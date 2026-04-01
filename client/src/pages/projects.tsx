import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import type { ProjectHealth } from "@shared/schema";
import {
  Sun,
  Moon,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Target,
  CalendarClock,
  ListTodo,
  Activity,
  TrendingUp,
  Pause,
  Timer,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Link, useLocation } from "wouter";

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

// Colors matching existing dashboard
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
        muted: "#27272a",
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
        muted: "#f4f4f5",
      };
}

const healthOrder: Record<string, number> = {
  stalled: 0,
  attention: 1,
  healthy: 2,
  waiting: 3,
  paused: 4,
};

const healthConfig: Record<
  string,
  { dot: string; bg: string; text: string; label: string }
> = {
  healthy: {
    dot: "bg-chart-2",
    bg: "bg-chart-2/10",
    text: "text-chart-2",
    label: "Healthy",
  },
  attention: {
    dot: "bg-chart-3",
    bg: "bg-chart-3/10",
    text: "text-chart-3",
    label: "Needs Attention",
  },
  stalled: {
    dot: "bg-destructive",
    bg: "bg-destructive/10",
    text: "text-destructive",
    label: "Stalled",
  },
  paused: {
    dot: "bg-muted-foreground",
    bg: "bg-muted-foreground/10",
    text: "text-muted-foreground",
    label: "Paused",
  },
  waiting: {
    dot: "bg-muted-foreground",
    bg: "bg-muted-foreground/10",
    text: "text-muted-foreground",
    label: "Waiting",
  },
};

const statusConfig: Record<string, { bg: string; text: string }> = {
  Doing: { bg: "bg-chart-2/10", text: "text-chart-2" },
  Ongoing: { bg: "bg-chart-3/10", text: "text-chart-3" },
  Planned: { bg: "bg-primary/10", text: "text-primary" },
  "On Hold": { bg: "bg-muted", text: "text-muted-foreground" },
  Done: { bg: "bg-chart-2/10", text: "text-chart-2" },
};

// --- KPI Card ---
function KpiCard({
  label,
  value,
  sub,
  colorClass,
  icon,
  delay,
}: {
  label: string;
  value: string | number;
  sub: string;
  colorClass?: string;
  icon: React.ReactNode;
  delay: string;
}) {
  return (
    <div
      className={`bg-card border border-card-border rounded-xl p-4 flex flex-col gap-0.5 transition-all hover:border-primary hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.12)] animate-fade-in ${delay}`}
      data-testid={`kpi-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span
        className={`font-display text-2xl font-bold tabular-nums leading-tight ${colorClass || "text-foreground"}`}
      >
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground/60">{sub}</span>
    </div>
  );
}

// --- Health Donut Chart ---
function HealthDonutChart({ projects }: { projects: ProjectHealth[] }) {
  const colors = useChartColors();
  const healthCounts = {
    healthy: projects.filter((p) => p.health === "healthy").length,
    attention: projects.filter((p) => p.health === "attention").length,
    stalled: projects.filter((p) => p.health === "stalled").length,
    paused: projects.filter(
      (p) => p.health === "paused" || p.health === "waiting"
    ).length,
  };

  const data = [
    { name: "Healthy", value: healthCounts.healthy },
    { name: "Needs Attention", value: healthCounts.attention },
    { name: "Stalled", value: healthCounts.stalled },
    { name: "Paused/Waiting", value: healthCounts.paused },
  ].filter((d) => d.value > 0);

  const chartColors = [colors.success, colors.warning, colors.error, colors.textMuted];

  if (data.length === 0) return null;

  return (
    <div className="bg-card border border-card-border rounded-xl p-4 animate-fade-in delay-3">
      <div className="mb-3">
        <h3 className="font-display text-sm font-semibold">Health Overview</h3>
        <p className="text-[11px] text-muted-foreground">
          Project status distribution
        </p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
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
              `${value} project${value !== 1 ? "s" : ""}`,
              name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: colors.textMuted, fontSize: 12 }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Project Card ---
function ProjectCard({ project }: { project: ProjectHealth }) {
  const [expanded, setExpanded] = useState(false);
  const hc = healthConfig[project.health] || healthConfig.healthy;
  const sc = statusConfig[project.status] || statusConfig.Doing;
  const pct =
    project.taskCount > 0
      ? Math.round((project.tasksDone / project.taskCount) * 100)
      : 0;

  return (
    <div
      className="bg-card border border-card-border rounded-xl overflow-hidden transition-all hover:border-primary/30"
      data-testid={`project-card-${project.id}`}
    >
      <div className="p-4">
        {/* Top row: health dot + name + status badge */}
        <div className="flex items-start gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${hc.dot}`}
            title={hc.label}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-sm font-semibold leading-tight line-clamp-2">
                {project.name}
              </h3>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded flex-shrink-0 ${sc.bg} ${sc.text}`}
              >
                {project.status}
              </span>
            </div>

            {/* Tag if available — hide raw Notion IDs */}
            {project.tag && !/^[a-f0-9]{32}$/.test(project.tag) && (
              <span className="text-[10px] text-muted-foreground/60 mt-0.5 block truncate">
                {project.tag}
              </span>
            )}

            {/* Progress bar */}
            {project.taskCount > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">
                    {project.tasksDone} / {project.taskCount} tasks
                  </span>
                  <span
                    className={`text-[11px] font-medium tabular-nums ${
                      pct === 100 ? "text-chart-2" : "text-foreground"
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct === 100
                        ? "bg-chart-2"
                        : pct > 50
                          ? "bg-primary"
                          : pct > 0
                            ? "bg-chart-3"
                            : "bg-muted-foreground/30"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Meta line */}
            <div className="flex items-center gap-2 mt-2.5 text-[11px] text-muted-foreground flex-wrap">
              <span className="flex items-center gap-0.5">
                <ListTodo className="w-3 h-3" />
                {project.taskCount} tasks
              </span>
              {project.tasksOverdue > 0 && (
                <span className="flex items-center gap-0.5 text-destructive font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  {project.tasksOverdue} overdue
                </span>
              )}
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {project.daysSinceActivity}d ago
              </span>
              {project.noteCount > 0 && (
                <span>{project.noteCount} notes</span>
              )}
            </div>

            {/* Deadline */}
            {project.targetDeadline && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                <CalendarClock className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Due {formatDate(project.targetDeadline)}
                </span>
                {project.daysUntilDeadline !== null && (
                  <span
                    className={`font-medium ${
                      project.daysUntilDeadline < 0
                        ? "text-destructive"
                        : project.daysUntilDeadline <= 7
                          ? "text-chart-3"
                          : "text-muted-foreground"
                    }`}
                  >
                    {project.daysUntilDeadline < 0
                      ? `${Math.abs(project.daysUntilDeadline)}d overdue`
                      : `${project.daysUntilDeadline}d remaining`}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable task list */}
      {project.tasks.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 text-[11px] text-muted-foreground hover:bg-muted/50 transition-colors flex items-center justify-between border-t border-card-border"
            data-testid={`toggle-tasks-${project.id}`}
          >
            <span>
              {expanded ? "Hide" : "Show"} {project.tasks.length} tasks
            </span>
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          {expanded && (
            <div className="border-t border-card-border">
              {project.tasks.map((task, i) => (
                <div
                  key={i}
                  className="px-4 py-2 flex items-center gap-3 text-[12px] border-b border-card-border last:border-b-0"
                >
                  {task.status === "Done" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-chart-2 flex-shrink-0" />
                  ) : task.status === "Doing" ? (
                    <Clock className="w-3.5 h-3.5 text-chart-3 flex-shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 flex-shrink-0" />
                  )}
                  <span
                    className={`flex-1 truncate ${task.status === "Done" ? "text-muted-foreground line-through" : ""}`}
                  >
                    {task.name}
                  </span>
                  {task.type && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        task.type === "Process"
                          ? "text-primary bg-primary/10"
                          : task.type === "Immersive"
                            ? "text-chart-3 bg-chart-3/10"
                            : "text-muted-foreground bg-muted"
                      }`}
                    >
                      {task.type}
                    </span>
                  )}
                  {task.due && (
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {formatDate(task.due)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Open in Notion */}
      {project.url && (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block px-4 py-2 text-[11px] text-primary hover:bg-primary/5 transition-colors flex items-center gap-1 border-t border-card-border"
          data-testid={`open-notion-${project.id}`}
        >
          <ExternalLink className="w-3 h-3" />
          Open in Notion
        </a>
      )}
    </div>
  );
}

// --- Loading Skeleton ---
function ProjectsSkeleton() {
  return (
    <div className="p-5 space-y-4">
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// --- Sidebar ---
function ProjectsSidebar({
  projects,
  isLoading,
}: {
  projects: ProjectHealth[];
  isLoading: boolean;
}) {
  const { theme, toggle } = useTheme();
  const [location] = useLocation();

  const healthyCt = projects.filter((p) => p.health === "healthy").length;
  const attentionCt = projects.filter((p) => p.health === "attention").length;
  const stalledCt = projects.filter((p) => p.health === "stalled").length;
  const pausedCt = projects.filter(
    (p) => p.health === "paused" || p.health === "waiting"
  ).length;

  return (
    <div
      className="flex flex-col h-full bg-sidebar border-r border-sidebar-border"
      style={{ width: 300 }}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary flex items-center justify-center">
            <FolderKanban className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1
              className="font-display text-sm font-semibold tracking-tight"
              data-testid="app-title"
            >
              Projects
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {isLoading ? "Loading\u2026" : `${projects.length} active`}
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          data-testid="theme-toggle"
        >
          {theme === "dark" ? (
            <Sun className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Nav tabs */}
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

      {/* Health summary in sidebar */}
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-3 space-y-1">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-2.5 mb-1">
                <Skeleton className="h-4 w-3/4 mb-1.5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : (
            <>
              {/* Health breakdown */}
              <div className="pb-2 mb-2 border-b border-sidebar-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-2 px-1">
                  Health Breakdown
                </p>
                {[
                  {
                    label: "Healthy",
                    count: healthyCt,
                    color: "bg-chart-2",
                    textColor: "text-chart-2",
                  },
                  {
                    label: "Attention",
                    count: attentionCt,
                    color: "bg-chart-3",
                    textColor: "text-chart-3",
                  },
                  {
                    label: "Stalled",
                    count: stalledCt,
                    color: "bg-destructive",
                    textColor: "text-destructive",
                  },
                  {
                    label: "Paused/Waiting",
                    count: pausedCt,
                    color: "bg-muted-foreground",
                    textColor: "text-muted-foreground",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 px-1 py-1"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${item.color}`}
                    />
                    <span className="text-[12px] text-muted-foreground flex-1">
                      {item.label}
                    </span>
                    <span
                      className={`text-[12px] font-semibold tabular-nums ${item.textColor}`}
                    >
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>

              {/* Project list in sidebar */}
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1.5 px-1">
                All Projects
              </p>
              {projects.map((proj) => {
                const hc = healthConfig[proj.health] || healthConfig.healthy;
                return (
                  <div
                    key={proj.id}
                    className="rounded-lg px-3 py-2.5 mb-0.5 border border-transparent hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${hc.dot}`}
                      />
                      <span className="text-[13px] font-medium line-clamp-1 leading-tight text-foreground">
                        {proj.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground pl-4">
                      <span>{proj.status}</span>
                      <span>&middot;</span>
                      <span>{proj.tasksDone}/{proj.taskCount}</span>
                      {proj.tasksOverdue > 0 && (
                        <>
                          <span>&middot;</span>
                          <span className="text-destructive">{proj.tasksOverdue} overdue</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// --- Main Projects Page ---
export default function Projects() {
  const { data: projects = [], isLoading, error } = useQuery<ProjectHealth[]>({
    queryKey: ["/api/projects"],
    staleTime: 1800000, // 30 min
  });

  // Sort projects: stalled first, then attention, healthy, paused/waiting
  const sortedProjects = [...projects].sort(
    (a, b) =>
      (healthOrder[a.health] ?? 99) - (healthOrder[b.health] ?? 99)
  );

  const totalTasks = projects.reduce((s, p) => s + p.taskCount, 0);
  const totalDone = projects.reduce((s, p) => s + p.tasksDone, 0);
  const totalOverdue = projects.reduce((s, p) => s + p.tasksOverdue, 0);
  const overallCompletion =
    totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
  const stalledCount = projects.filter((p) => p.health === "stalled").length;

  return (
    <div className="flex h-screen bg-background">
      <ProjectsSidebar projects={sortedProjects} isLoading={isLoading} />
      <div
        className="flex-1 overflow-y-auto custom-scrollbar"
        style={{ overscrollBehavior: "contain" }}
      >
        {isLoading ? (
          <ProjectsSkeleton />
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Failed to load projects.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Summary bar */}
            <div
              className="bg-card border border-card-border rounded-xl px-4 py-3 text-sm text-muted-foreground animate-fade-in delay-1"
              data-testid="summary-bar"
            >
              <span className="font-semibold text-foreground">
                {projects.length} Active Projects
              </span>
              {" \u00b7 "}
              <span>{totalTasks} Tasks</span>
              {" \u00b7 "}
              <span className={totalOverdue > 0 ? "text-destructive font-medium" : ""}>
                {totalOverdue} Overdue
              </span>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard
                label="Active Projects"
                value={projects.length}
                sub="Non-archived"
                icon={<FolderKanban className="w-3.5 h-3.5" />}
                colorClass="text-primary"
                delay="delay-2"
              />
              <KpiCard
                label="Completion"
                value={`${overallCompletion}%`}
                sub={`${totalDone} of ${totalTasks} tasks`}
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                colorClass="text-chart-2"
                delay="delay-2"
              />
              <KpiCard
                label="Overdue"
                value={totalOverdue}
                sub="Tasks past due"
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
                colorClass={totalOverdue > 0 ? "text-destructive" : undefined}
                delay="delay-2"
              />
              <KpiCard
                label="Stalled"
                value={stalledCount}
                sub="Projects inactive"
                icon={<Pause className="w-3.5 h-3.5" />}
                colorClass={stalledCount > 0 ? "text-destructive" : undefined}
                delay="delay-2"
              />
            </div>

            {/* Health Chart */}
            <HealthDonutChart projects={projects} />

            {/* Project Cards Grid */}
            <div>
              <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-2 animate-fade-in delay-4">
                <span className="w-2 h-2 rounded-full bg-primary" />
                All Projects
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>

            {/* Empty state */}
            {projects.length === 0 && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                    <FolderKanban className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="font-display text-lg font-semibold mb-2">
                    No Active Projects
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Create a project in Notion to see it here with health
                    monitoring.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
