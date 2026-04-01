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

// --- Intelligence Engine ---

export interface IntelligenceContext {
  goals: { name: string; status: string; projectCount: number }[];
  projects: { name: string; status: string; health: string; taskCount: number; tasksDone: number; tasksOverdue: number }[];
  recentTasks: { name: string; status: string; type: string; completed: string | null }[];
  voiceNoteThemes: { name: string; summary: string; date: string }[];
  todayDueCount: number;
  overdueCount: number;
  completedYesterdayCount: number;
}

export interface SystemAuditItem {
  name: string;
  currentType: string; // "Project" | "Goal"
  recommendation: 'keep' | 'demote_to_goal' | 'demote_to_note' | 'merge' | 'archive';
  reasoning: string;
  actionRequired: string;
}

export interface IntelligenceReport {
  primaryFocus: { title: string; reasoning: string; connectedGoal: string };
  patternInsight: { observation: string; evidence: string[] };
  riskFlag: { item: string; reason: string; suggestedAction: string };
  momentumWin: { achievement: string; leverage: string };
  weeklyPriority: { focus: string; reasoning: string };
  systemAudit: {
    summary: string;
    items: SystemAuditItem[];
  };
  summary: string;
  generatedAt: string;
}

export interface ClassifiedTask {
  id: string;
  name: string;
  classification: string;
}

export interface TitledNote {
  id: string;
  oldTitle: string;
  newTitle: string;
  contentPreview: string;
}

// --- Voice Note Task Extractor ---

export interface ProcessedVoiceNote {
  id: string;
  name: string;
  tasksCreated: { name: string; type: string; project: string; priority: string }[];
}

export interface ProcessingResult {
  notesProcessed: number;
  tasksCreated: number;
  notesTitled: number;
  details: ProcessedVoiceNote[];
  titledNotes: TitledNote[];
}
