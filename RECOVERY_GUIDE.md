# 🛰️ NOVA - Project Recovery & Re-entry Guide

If you delete and reinstall Antigravity (or use a different system), follow these steps to restore the **System Pilot** context.

## 1. Local Files Location
The entire project is stored here:
`C:\Users\Owais\Downloads\nova main`

## 2. Directory Structure
- **Root:** `nova main/` (Contains memory files: `gemini.md`, `findings.md`, `progress.md`)
- **Frontend:** `nova main/nova-frontend/` (React/Vite app)
- **Backend:** `nova main/nova-backend/` (Node.js/Bun server)
- **Docs:** `nova main/architecture/` (SOPs and technical docs)

## 3. How to Restore Context (Re-entry)
When you open Antigravity again, give it this exact command:

> "I am working on the Nova project located at `C:\Users\Owais\Downloads\nova main`. Read the `gemini.md` and `task_plan.md` in the root and resume the current task."

## 4. Why this works
By keeping `gemini.md` in your project root (instead of just in the computer's memory), the AI can "read your mind" and remember exactly where we left off, what the data schemas are, and what the rules of the project are.

## 5. External Links (Backups)
- **GitHub:** [In Progress - Check `progress.md`]
- **Netlify:** (If deployed)
- **Supabase:** (Database)
