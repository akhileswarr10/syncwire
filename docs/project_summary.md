# Project Summary: SyncWire

**SyncWire** is a high-performance, AI-driven meeting execution platform designed to automate the transition from verbal discussions to structured, actionable tasks. By integrating cutting-edge Large Language Models (LLMs) with the **Model Context Protocol (MCP)**, SyncWire synchronizes meeting outcomes directly with professional workspace tools like Gmail and Google Calendar.

---

## 1. Executive Summary
In modern organizational workflows, critical action items generated during meetings are often lost or delayed due to manual note-taking and administrative overhead. SyncWire solves this by providing an automated pipeline that ingests meeting transcripts, extracts intelligence using AI, and dispatches tasks to team members in real-time. The system ensures high accountability through a secure "Magic Link" management system and a centralized administrative dashboard.

## 2. Problem Statement
- **Information Loss**: Key decisions made in meetings are frequently forgotten or documented incompletely.
- **Administrative Friction**: Manually creating calendar events and sending assignment emails is time-consuming.
- **Tracking Challenges**: Once tasks are assigned, monitoring their progress across multiple platforms is difficult without a unified interface.

## 3. Technical Architecture
SyncWire is built on a modern, decoupled architecture designed for speed and reliability.

### A. Frontend (Next.js 16 & React 19)
- **Framework**: Next.js 16 with App Router for server-side rendering and optimized performance.
- **Styling**: Tailwind CSS 4 for a custom, sleek dark-mode interface.
- **State Management**: TanStack React Query for efficient server state synchronization and automated refetching of task statuses.

### B. Backend (Node.js & Express.js)
- **API Layer**: Express.js RESTful API handling transcript processing, task management, and authentication via magic tokens.
- **Database**: **Supabase PostgreSQL** for robust, relational data persistence of meetings, tasks, and audit logs.
- **Real-time Processing**: Asynchronous execution flows for AI analysis and MCP service dispatch.

### C. Intelligence Layer (SambaNova & Llama 3.3)
- **AI Core**: Utilizes **Meta-Llama 3.3 70B Instruct** (via SambaNova Cloud) for high-reasoning tasks.
- **Prompt Engineering**: Custom system prompts designed for structured JSON extraction, capturing not just "what" was said, but the "why" and "how" (detailed context).

### D. Integration Layer (Model Context Protocol - MCP)
- **Decoupling**: Uses MCP to isolate external service logic (Gmail/Calendar) from the core backend.
- **Servers**: Custom MCP servers for Gmail (Drafting/Sending) and Google Calendar (Event Creation/Patching) communicating via `stdio` transport.

## 4. Key Features
- **Intelligent Task Extraction**: Automatically identifies assignees, specific task descriptions, and deadlines from unstructured text.
- **Automated Notifications**: Dispatches branded emails via Gmail MCP with full meeting summaries and individual assignments.
- **Calendar Synchronization**: Creates deadline events on Google Calendar with embedded "Magic Links" for easy access.
- **Magic Link System**: Uses 256-bit cryptographically secure tokens to allow assignees to update tasks (Mark Complete / Request Extension) without requiring a platform login.
- **Extension Workflow**: A governed process where assignees can request deadline changes with justification, which admins handle via the dashboard.

## 5. Security & Data Integrity
- **Token-Based Auth**: Access to task updates is restricted to unique, unguessable tokens (`crypto.randomBytes(32)`).
- **Relational Integrity**: Strict PostgreSQL schema with foreign key constraints between meetings and tasks.
- **Safe Database Operations**: Connection pooling and fast-fail network configurations ensure system resilience.

## 6. Conclusion
SyncWire represents the next generation of productivity tools, moving beyond simple transcription to active **execution**. By closing the gap between conversation and coordination, it empowers teams to focus on work rather than administrative overhead.
