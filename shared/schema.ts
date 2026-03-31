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
