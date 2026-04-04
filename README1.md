<p align="center">
  <img src="https://img.shields.io/badge/SyncWire-MCP%20Meeting%20Executioner-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIwdi02TTYgMjBWMTBNMTggMjBWNE0xMiAxNGE0IDQgMCAxIDAgMC04IDQgNCAwIDAgMCAwIDgiWiIvPjwvc3ZnPg==&logoColor=white" alt="SyncWire Banner" />
</p>

<h1 align="center">⚡ SyncWire</h1>
<p align="center">
  <strong>AI-Powered Meeting-to-Task Executioner with MCP Integration</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4479A1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/SambaNova_AI-10B981?style=flat-square&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/MCP_Protocol-8B5CF6?style=flat-square&logo=protocol&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Workspace-4285F4?style=flat-square&logo=google&logoColor=white" />
</p>

<p align="center">
  SyncWire transforms raw meeting transcripts into structured, actionable tasks — automatically assigning them to team members, sending email notifications via Gmail, and creating deadline events on Google Calendar — all powered by AI and the <strong>Model Context Protocol (MCP)</strong>.
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Magic Link System](#-magic-link-system)
- [MCP Server Details](#-mcp-server-details)
- [Screenshots](#-screenshots)
- [License](#-license)

---

## 🔍 Overview

In most organizations, meetings generate action items that get lost in notes. **SyncWire** solves this by creating an automated pipeline:

1. **Paste or upload** a meeting transcript.
2. **AI analyzes** the transcript using SambaNova's Meta-Llama 3.3 70B model — extracting tasks, assignees, deadlines, and context.
3. **Tasks are stored** in a Supabase PostgreSQL database with cryptographically secure magic tokens.
4. **Gmail notifications** are sent to each assignee with task details and a unique magic link.
5. **Google Calendar events** are created at each task's deadline with full context.
6. **Assignees self-serve** via the magic link to mark tasks complete or request deadline extensions.
7. **Admins review** extension requests on the dashboard and approve them, which automatically updates the calendar event and notifies the assignee.

---

## 🏗 Architecture

<p align="center">
  <img src="docs/architecture.png" alt="SyncWire Architecture Diagram" width="800" />
</p>

```
┌──────────────────┐       HTTP        ┌──────────────────────────┐
│                  │  ──────────────▶  │                          │
│   Next.js 16     │                   │   Express.js Backend     │
│   Frontend       │  ◀──────────────  │   (Port 5000)            │
│   (Port 3000)    │       JSON        │                          │
│                  │                   │  ┌────────────────────┐  │
└──────────────────┘                   │  │  Meeting Processor │  │
                                       │  │  (AI Service)      │  │
                                       │  └────────┬───────────┘  │
                                       │           │              │
                                       │    ┌──────▼──────┐       │
                                       │    │ SambaNova   │       │
                                       │    │ Llama 3.3   │       │
                                       │    │ 70B Instruct│       │
                                       │    └─────────────┘       │
                                       │                          │
                                       │  ┌────────────────────┐  │
                                       │  │   MCP Client       │  │
                                       │  │   (stdio transport)│  │
                                       │  └───┬────────────┬───┘  │
                                       └──────┼────────────┼──────┘
                                              │            │
                                     ┌────────▼───┐  ┌─────▼────────┐
                                     │ Gmail MCP  │  │ Calendar MCP │
                                     │ Server     │  │ Server       │
                                     └────────┬───┘  └─────┬────────┘
                                              │            │
                                     ┌────────▼────────────▼────────┐
                                     │    Google Workspace APIs     │
                                     │   (Gmail + Calendar v3)     │
                                     └─────────────────────────────┘

                                     ┌─────────────────────────────┐
                                     │     Supabase PostgreSQL     │
                                     │   meetings  |  tasks        │
                                     └─────────────────────────────┘
```

### Data Flow

1. **Transcript Ingestion** — The frontend sends raw transcript text to `POST /api/process`.
2. **AI Analysis** — The backend forwards the transcript to SambaNova's Llama 3.3 70B model with a structured prompt. The AI returns a JSON object containing the meeting title, summary, participant emails, and extracted tasks with deadlines.
3. **Database Persistence** — A meeting record is created, and each task is saved with a unique 256-bit magic token.
4. **MCP Orchestration** — The backend's MCP client spawns Gmail and Calendar MCP servers as child processes using `stdio` transport, then calls their tools (`send_email`, `create_event`) to dispatch notifications.
5. **Magic Link Delivery** — Each assignee receives an email containing a unique link (`/task-update/:token`) to self-manage their task.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Task Extraction** | Automatically identifies tasks, assignees, deadlines, and context from unstructured meeting text using Meta-Llama 3.3 70B |
| 📧 **Automated Gmail Notifications** | Sends meeting summaries to all participants and individual task assignment emails with magic links |
| 📅 **Google Calendar Integration** | Creates all-day or timed deadline events on Google Calendar with task details and magic links in the description |
| 🔗 **Magic Link System** | Cryptographically secure, token-based links allow assignees to mark tasks complete or request extensions without logging in |
| ⏰ **Extension Request Workflow** | Assignees can request deadline extensions with a reason; admins approve from the dashboard, which patches the calendar event and sends a notification |
| 🔌 **MCP Architecture** | Uses the Model Context Protocol for standardized, decoupled communication between the backend and external services (Gmail, Calendar) |
| 🎨 **Modern Dashboard** | Sleek dark-mode UI built with Next.js 16, React 19, and Tailwind CSS 4 — with real-time search, filtering, modals, and animated progress steppers |

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment |
| **Express.js 5** | HTTP server and REST API |
| **Supabase (PostgreSQL)** | Relational database (meetings & tasks) |
| **OpenAI SDK** | Client for SambaNova API (OpenAI-compatible) |
| **@modelcontextprotocol/sdk** | MCP client and server implementation |
| **googleapis** | Google OAuth 2.0 + Gmail + Calendar APIs |
| **dotenv** | Environment variable management |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with App Router |
| **React 19** | UI library |
| **TypeScript 5** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **TanStack React Query** | Server state management with auto-refetch |
| **Lucide React** | Icon library |

### AI & Infrastructure
| Technology | Purpose |
|---|---|
| **SambaNova Cloud** | AI inference platform |
| **Meta-Llama 3.3 70B Instruct** | Large language model for transcript analysis |
| **MCP (Model Context Protocol)** | Standardized AI ↔ tool communication |

---

## 📁 Project Structure

```
syncwire/
├── src/                          # Backend source code
│   ├── index.js                  # Express server entry point & API routes
│   ├── db/
│   │   ├── connection.js         # MySQL connection pool configuration
│   │   └── schema.sql            # Database schema (meetings + tasks tables)
│   ├── mcp/
│   │   └── client.js             # MCP client — spawns and manages MCP server connections
│   ├── mcp-servers/
│   │   ├── gmail.js              # Gmail MCP Server — send_email tool via Google APIs
│   │   └── calendar.js           # Calendar MCP Server — create_event & patch_event tools
│   ├── services/
│   │   └── meetingProcessor.js   # Core AI service — transcript analysis, DB writes, MCP dispatch
│   └── scripts/
│       └── init_db.js            # Database initialization script
│
├── frontend/                     # Next.js frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx        # Root layout with Providers and metadata
│   │   │   ├── page.tsx          # Main dashboard page (New Meeting / Task Archive)
│   │   │   ├── globals.css       # Global Tailwind CSS styles
│   │   │   └── task-update/
│   │   │       └── [token]/
│   │   │           └── page.tsx  # Magic link page — complete task or request extension
│   │   ├── components/
│   │   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   │   ├── TranscriptInput.tsx  # Transcript paste/upload with animated stepper
│   │   │   ├── TaskTable.tsx     # Task archive with search, filters, and modals
│   │   │   └── Providers.tsx     # React Query provider wrapper
│   │   └── lib/
│   │       └── utils.ts          # Utility functions (cn for class merging)
│   ├── public/                   # Static assets & PWA manifest
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   └── architecture.png          # Architecture diagram
├── .env                          # Environment variables (not committed)
├── credentials.json              # Google OAuth credentials (not committed)
├── token_gmail.json              # Gmail OAuth token (not committed)
├── token_calendar.json           # Calendar OAuth token (not committed)
├── package.json                  # Backend dependencies
├── alter.js                      # DB migration utility
├── .gitignore
└── README.md
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed on your system:

| Requirement | Version |
|---|---|
| **Node.js** | v18.0+ |
| **npm** | v9.0+ |
| **Supabase Account** | For PostgreSQL hosting |
| **Google Cloud Project** | With Gmail API and Calendar API enabled |

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/akhileswarr10/syncwire.git
cd syncwire
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Set Up Supabase Database

1. Create a new project on [Supabase](https://supabase.com/).
2. Get your **PostgreSQL Connection String** from Project Settings → Database.
3. Add the connection string to your `.env` file (see below).

```bash
# Initialize tables using the provided script
npm run init-db
```

### 5. Set Up Google Cloud Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or use an existing one).
3. Enable the **Gmail API** and **Google Calendar API**.
4. Navigate to **APIs & Services → Credentials**.
5. Create an **OAuth 2.0 Client ID** (type: Desktop App).
6. Download the credentials JSON and save it as `credentials.json` in the project root.

### 6. Get a SambaNova API Key

1. Sign up at [SambaNova Cloud](https://cloud.sambanova.ai/).
2. Generate an API key from your dashboard.

---

## ⚙ Configuration

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
PORT=5000

# MCP Server Commands
GMAIL_MCP_SERVER_COMMAND=node src/mcp-servers/gmail.js
GOOGLE_CALENDAR_MCP_SERVER_COMMAND=node src/mcp-servers/calendar.js
GMAIL_OAUTH_PORT=3002
CALENDAR_OAUTH_PORT=3001

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json

# SambaNova AI
SAMBANOVA_API_KEY=your_sambanova_api_key
SAMBANOVA_BASE_URL=https://api.sambanova.ai/v1
SAMBANOVA_MODEL=Meta-Llama-3.3-70B-Instruct
```

---

## 🖥 Usage

### Start the Backend Server

```bash
npm start
```

The Express server starts on `http://localhost:5000`. On first launch, if Gmail or Calendar tokens are missing, the server will open your browser for Google OAuth authorization.

### Start the Frontend

```bash
cd frontend
npm run dev
```

The Next.js dashboard opens on `http://localhost:3000`.

### Workflow

1. **Open the Dashboard** at `http://localhost:3000`.
2. Click **"New Meeting"** in the sidebar.
3. **Paste a meeting transcript** or upload a `.txt` / `.vtt` file.
4. Click **"Run Executioner"** — watch the animated stepper progress:
   - Step 1: AI parses the transcript
   - Step 2: Tasks are saved to PostgreSQL
   - Step 3: Email + Calendar notifications are sent
5. Switch to **"Task Archive"** to see all extracted tasks with search and status filters.
6. Assignees click their **magic link** (from the email) to mark tasks complete or request extensions.
7. Admins see extension requests highlighted in amber on the archive and can **approve** them.

---

## 📡 API Reference

### Transcript Processing

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/process` | Process a meeting transcript through the AI pipeline |

**Request Body:**
```json
{
  "transcript": "Meeting transcript text...",
  "recipient_emails": ["user@example.com"],
  "manual_assignee": "override@example.com"
}
```

### Task Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks` | Fetch all tasks with meeting details |
| `GET` | `/api/tasks/token/:token` | Fetch a task by its magic token |
| `POST` | `/api/tasks/update-status` | Update task status (complete, etc.) |
| `POST` | `/api/tasks/request-extension` | Submit a deadline extension request |
| `POST` | `/api/tasks/approve-extension` | Admin: Approve extension + sync calendar |

---

## 🔗 Magic Link System

Each task is assigned a **256-bit cryptographically random token** (`crypto.randomBytes(32)`). This token forms a unique, unguessable URL:

```
http://localhost:3000/task-update/<64-char-hex-token>
```

When an assignee opens this link, they see:
- The full task description and context
- The origin meeting title and summary
- The current deadline
- Buttons to **mark as completed** or **request an extension** (with reason and proposed new deadline)

No login is required — the token itself authenticates the request.

---

## 🔌 MCP Server Details

SyncWire uses the **Model Context Protocol** to decouple external service integrations from the core backend. Each MCP server runs as a child process communicating via `stdio` transport.

### Gmail MCP Server (`src/mcp-servers/gmail.js`)

| Tool | Parameters | Description |
|---|---|---|
| `send_email` | `to`, `subject`, `body` | Sends an email via the Gmail API using OAuth 2.0 |

### Calendar MCP Server (`src/mcp-servers/calendar.js`)

| Tool | Parameters | Description |
|---|---|---|
| `create_event` | `summary`, `description`, `start_time`, `end_time`, `attendees` | Creates a Google Calendar event (supports all-day and timed events) |
| `patch_event` | `event_id`, `summary`, `description`, `start_time`, `end_time` | Updates specific fields of an existing event |

Both servers handle OAuth 2.0 flows automatically — on first use, they open a browser window for Google authorization and save tokens locally for subsequent runs.

---

## 🗄 Database Schema

### `meetings` table
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL (PK) | Meeting ID |
| `title` | VARCHAR(255) | AI-extracted meeting title |
| `summary` | TEXT | AI-generated 3-paragraph summary |
| `transcript` | TEXT | Original meeting transcript |
| `date` | TIMESTAMPTZ | Processing timestamp |
| `created_at` | TIMESTAMPTZ | Record creation time |

### `tasks` table
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL (PK) | Task ID |
| `meeting_id` | INT (FK → meetings.id) | Parent meeting reference |
| `assignee_email` | VARCHAR(255) | Task assignee's email |
| `description` | TEXT | Short task description |
| `detailed_context` | TEXT | AI-extracted context from the transcript |
| `deadline` | TIMESTAMPTZ | Task deadline |
| `email_status` | VARCHAR(20) | `pending` \| `sent` \| `failed` |
| `task_status` | VARCHAR(20) | `pending` \| `in_progress` \| `completed` |
| `magic_token` | VARCHAR(255) | 256-bit hex token for secure access |
| `calendar_event_id` | VARCHAR(255) | Google Calendar event ID for patching |
| `reason_for_delay` | TEXT | Assignee's extension reason |
| `requested_deadline` | TIMESTAMPTZ | Proposed new deadline |

---

## 🖼 Screenshots

> **Dashboard — New Meeting View**: Paste transcript and trigger the AI executioner with an animated multi-step progress indicator.

> **Task Archive**: Search, filter, and manage all extracted tasks. View full transcripts and task details in modals. Extension requests are highlighted for admin review.

> **Magic Link Page**: Assignees land on a secure, standalone page to complete tasks or request extensions — no login required.

---

## 📄 License

This project is released under the [ISC License](https://opensource.org/licenses/ISC).

---

<p align="center">
  Built with ⚡ by <a href="https://github.com/akhileswarr10">@akhileswarr10</a>
</p>
