import type { Express } from "express";
import { createServer, type Server } from "http";
import { listVoiceNotes, getVoiceNoteDetail, getTasksForVoiceNote, listProjects, getDailyStandup } from "./notion";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // List all voice notes
  app.get("/api/voice-notes", async (_req, res) => {
    try {
      const notes = await listVoiceNotes();
      res.json(notes);
    } catch (err: any) {
      console.error("Error fetching voice notes:", err);
      res.status(500).json({ error: "Failed to fetch voice notes", message: err.message });
    }
  });

  // Get a specific voice note with parsed content and tasks
  app.get("/api/voice-notes/:id", async (req, res) => {
    try {
      const detail = await getVoiceNoteDetail(req.params.id);
      res.json(detail);
    } catch (err: any) {
      console.error(`Error fetching voice note ${req.params.id}:`, err);
      res.status(500).json({ error: "Failed to fetch voice note detail", message: err.message });
    }
  });

  // Get tasks, optionally filtered by voice note ID
  app.get("/api/tasks", async (req, res) => {
    try {
      const voiceNoteId = req.query.voiceNoteId as string | undefined;
      if (voiceNoteId) {
        const tasks = await getTasksForVoiceNote(voiceNoteId);
        res.json(tasks);
      } else {
        res.json([]);
      }
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      res.status(500).json({ error: "Failed to fetch tasks", message: err.message });
    }
  });

  // Daily standup briefing
  app.get("/api/standup", async (_req, res) => {
    try {
      const standup = await getDailyStandup();
      res.json(standup);
    } catch (err: any) {
      console.error("Error fetching standup:", err);
      res.status(500).json({ error: "Failed to fetch standup data", message: err.message });
    }
  });

  // List all active projects with health scoring
  app.get("/api/projects", async (_req, res) => {
    try {
      const projects = await listProjects();
      res.json(projects);
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      res.status(500).json({ error: "Failed to fetch projects", message: err.message });
    }
  });

  return httpServer;
}
