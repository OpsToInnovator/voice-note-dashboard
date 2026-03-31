// TypeScript interfaces for Notion data — no database tables needed
// All data comes from Notion via the external-tool CLI

export interface VoiceNoteListItem {
  id: string;
  name: string;
  noteDate: string | null;
  created: string;
  updated: string;
  durationSeconds: number | null;
  taskCount: number;
  url: string;
}

export interface TaskItem {
  id: string;
  name: string;
  status: string; // "To Do" | "Doing" | "Done"
  type: string; // "Process" | "Immersive" | ""
  location: string;
  priority: string;
  energy: string;
  due: string | null;
  completed: string | null;
  url: string;
}

export interface ParsedContent {
  summary: string;
  keyThreads: { title: string; description: string; icon: string }[];
  insights: string[];
  emergingConcepts: string[];
  tensions: { text: string; context: string }[];
  opportunities: { text: string; context: string }[];
  questions: string[];
  assumptions: string[];
  rawContent: string;
  isStructured: boolean;
}

export interface VoiceNoteDetail {
  id: string;
  name: string;
  noteDate: string | null;
  created: string;
  updated: string;
  durationSeconds: number | null;
  url: string;
  content: ParsedContent;
  tasks: TaskItem[];
}

// --- Project Health Monitor ---

export interface ProjectTaskSummary {
  name: string;
  status: string;
  type: string;
  due: string | null;
}

export interface ProjectHealth {
  id: string;
  name: string;
  status: string; // Planned, On Hold, Doing, Ongoing, Done
  health: 'healthy' | 'attention' | 'stalled' | 'paused' | 'waiting';
  taskCount: number;
  tasksDone: number;
  tasksOverdue: number;
  completionRate: number;
  daysSinceActivity: number;
  targetDeadline: string | null;
  daysUntilDeadline: number | null;
  noteCount: number;
  tag: string;
  url: string;
  tasks: ProjectTaskSummary[];
}

// --- Daily Standup ---

export interface DailyStandup {
  date: string; // "31 Mar 2026"
  greeting: string; // "Good morning" / "Good afternoon" / "Good evening"
  completedYesterday: { name: string; type: string; project: string }[];
  dueToday: { name: string; type: string; project: string; priority: string }[];
  overdue: { name: string; type: string; project: string; due: string; daysOverdue: number }[];
  projectHealth: { healthy: number; attention: number; stalled: number; paused: number; waiting: number };
  recentVoiceNotes: { name: string; created: string; durationSeconds: number | null }[];
  stats: {
    completedYesterdayCount: number;
    dueTodayCount: number;
    overdueCount: number;
    activeProjects: number;
  };
}
