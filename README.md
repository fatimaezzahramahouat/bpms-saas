# 🚀 NexFlow — BPMS SaaS Platform

> **NexFlow** is a full-stack Business Process Management System (BPMS) SaaS platform. It enables organizations to manage recruitment workflows, candidates, job offers, process instances, AI-powered candidate analysis, and team collaboration — all in one place.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Environment Variables](#-environment-variables)
  - [Backend `.env`](#backend-env)
  - [Frontend `.env`](#frontend-env)
- [Installation & Setup](#-installation--setup)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Setup the Backend](#2-setup-the-backend)
  - [3. Setup the Frontend](#3-setup-the-frontend)
- [Running the Project](#-running-the-project)
- [API Overview](#-api-overview)
- [Database (Prisma + Supabase)](#-database-prisma--supabase)
- [External Services](#-external-services)
- [Troubleshooting](#-troubleshooting)

---

## 🛠 Tech Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Frontend    | React 19, TypeScript, Vite, TailwindCSS v4       |
| Backend     | Node.js, Express 5, TypeScript, ts-node-dev      |
| Database    | PostgreSQL via **Supabase** + **Prisma ORM**     |
| Auth        | JWT, Google OAuth 2.0 (Passport.js)              |
| AI          | Groq SDK (LLM), Google Gemini API                |
| Storage     | Supabase Storage (file/document uploads)         |
| Styling     | TailwindCSS, Lucide React, Recharts, ReactFlow   |

---

## 📁 Project Structure

```
projet_final_BPMS/
├── backend/                  # Express + TypeScript API server
│   ├── prisma/
│   │   └── schema.prisma     # Database schema (Prisma)
│   ├── src/
│   │   ├── app.ts            # Express app setup & routes
│   │   ├── server.ts         # Entry point (port 5000)
│   │   ├── config/           # Passport, etc.
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Auth, error handling
│   │   ├── repositories/     # DB access layer
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic
│   │   ├── schemas/          # Zod validation schemas
│   │   └── utils/            # Helper utilities
│   ├── uploads/              # Local file uploads folder
│   ├── .env                  # Backend environment variables ← YOU MUST CREATE THIS
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                 # React + Vite SPA
    ├── src/
    │   ├── app/              # App-level config & routing
    │   ├── features/         # Feature modules (auth, workflows, jobs…)
    │   ├── layouts/          # Page layouts
    │   ├── shared/           # Shared components & hooks
    │   └── styles/           # Global styles
    ├── .env                  # Frontend environment variables ← YOU MUST CREATE THIS
    ├── vite.config.ts
    └── package.json
```

---

## ✅ Prerequisites

Make sure you have the following installed before starting:

| Tool        | Minimum Version | Check Command           |
|-------------|-----------------|-------------------------|
| Node.js     | v18+            | `node -v`               |
| npm         | v9+             | `npm -v`                |
| Git         | any             | `git --version`         |

You also need accounts for the following services (all free tiers available):

- [Supabase](https://supabase.com) — PostgreSQL database + file storage
- [Groq](https://console.groq.com) — AI/LLM API key
- [Google Cloud Console](https://console.cloud.google.com) — OAuth 2.0 credentials (for Google login)
- [Google AI Studio](https://aistudio.google.com/app/apikey) — Gemini API key (optional, for AI features)

---

## 🔑 Environment Variables

### Backend `.env`

Create a file at `backend/.env` with the following content:

```env
# ─────────────────────────────────────────────────────────────────────────────
# DATABASE (Supabase PostgreSQL)
# Get these from: https://supabase.com → Your Project → Settings → Database
# ─────────────────────────────────────────────────────────────────────────────

# Pooled connection (used by Prisma at runtime via PgBouncer)
DATABASE_URL="postgresql://postgres.<YOUR_PROJECT_REF>:<YOUR_DB_PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres?connect_timeout=30&connection_limit=20&pgbouncer=true"

# Direct connection (used by Prisma migrations)
DIRECT_URL="postgresql://postgres.<YOUR_PROJECT_REF>:<YOUR_DB_PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres?connect_timeout=30"

# ─────────────────────────────────────────────────────────────────────────────
# JWT
# A strong random secret string (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# ─────────────────────────────────────────────────────────────────────────────
JWT_SECRET=your_strong_jwt_secret_here

# ─────────────────────────────────────────────────────────────────────────────
# FRONTEND URL (for CORS)
# ─────────────────────────────────────────────────────────────────────────────
FRONTEND_URL="http://localhost:3000"

# ─────────────────────────────────────────────────────────────────────────────
# SUPABASE
# Get from: https://supabase.com → Your Project → Settings → API
# ─────────────────────────────────────────────────────────────────────────────
SUPABASE_URL="https://<YOUR_PROJECT_REF>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"

# ─────────────────────────────────────────────────────────────────────────────
# GROQ AI API KEY
# Get from: https://console.groq.com/keys
# ─────────────────────────────────────────────────────────────────────────────
GROQ_API_KEY=your_groq_api_key_here

# ─────────────────────────────────────────────────────────────────────────────
# GOOGLE OAUTH 2.0
# Get from: https://console.cloud.google.com → APIs & Services → Credentials
# Create an OAuth 2.0 Client ID (Web application)
# Authorized redirect URI: http://localhost:5000/api/auth/google/callback
# ─────────────────────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

---

### Frontend `.env`

Create a file at `frontend/.env` with the following content:

```env
# ─────────────────────────────────────────────────────────────────────────────
# BACKEND API URL
# ─────────────────────────────────────────────────────────────────────────────
VITE_API_URL=http://localhost:5000

# ─────────────────────────────────────────────────────────────────────────────
# GOOGLE GEMINI API KEY (for AI features in the frontend)
# Get from: https://aistudio.google.com/app/apikey
# ─────────────────────────────────────────────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/fatimaezzahramahouat/bpms-saas.git
cd projet_final_BPMS
```

---

### 2. Setup the Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create and fill your .env file (see Environment Variables section above)
# Then run the Prisma migration to create all database tables:
npx prisma generate
npx prisma migrate deploy

# (Optional) Open Prisma Studio to browse your database:
npx prisma studio
```

---

### 3. Setup the Frontend

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Create and fill your .env file (see Environment Variables section above)
```

---

## ▶️ Running the Project

Open **two terminal windows** and run each simultaneously:

### Terminal 1 — Backend (port 5000)

```bash
cd backend
npm run dev
```

> The backend will start on `http://localhost:5000`  
> You should see: `Server running on port 5000`

---

### Terminal 2 — Frontend (port 3000)

```bash
cd frontend
npm run dev
```

> The frontend will start on `http://localhost:3000`  
> Open your browser at **http://localhost:3000**

---

### Production Build

```bash
# Backend
cd backend
npm run build        # Compiles TypeScript → dist/
npm start            # Runs compiled JS (node dist/server.js)

# Frontend
cd frontend
npm run build        # Outputs to dist/
npm run preview      # Preview the production build locally
```

---

## 🌐 API Overview

Base URL: `http://localhost:5000`

| Method | Endpoint                     | Description                    |
|--------|------------------------------|--------------------------------|
| GET    | `/api/health`                | Health check                   |
| POST   | `/api/auth/register`         | Register a new organisation    |
| POST   | `/api/auth/login`            | Login with email/password      |
| GET    | `/api/auth/google`           | Google OAuth login             |
| GET    | `/api/organisation`          | Get organisation info          |
| GET    | `/api/users`                 | List users in organisation     |
| GET    | `/api/joboffers`             | List job offers                |
| POST   | `/api/joboffers`             | Create a job offer             |
| GET    | `/api/candidates`            | List candidates                |
| GET    | `/api/applications`          | List applications              |
| GET    | `/api/workflows`             | List workflows                 |
| POST   | `/api/workflows`             | Create a workflow              |
| GET    | `/api/process`               | List process instances         |
| GET    | `/api/tasks`                 | List tasks                     |
| POST   | `/api/analyze-candidate`     | AI analysis of a candidate     |
| POST   | `/api/generate-bpms`         | AI-generated BPMS diagram      |
| GET    | `/api/stats`                 | Dashboard statistics           |
| GET    | `/api/notifications`         | User notifications             |

---

## 🗄️ Database (Prisma + Supabase)

The project uses **Prisma ORM** with **Supabase PostgreSQL**.

### Key Models

| Model             | Description                                   |
|-------------------|-----------------------------------------------|
| `Organisation`    | Top-level tenant (company/org)                |
| `User`            | Members of an organisation (Admin, RH, etc.)  |
| `JobOffer`        | Job postings created by the org               |
| `Candidate`       | Applicants applying to job offers             |
| `Application`     | Link between a Candidate and a JobOffer       |
| `Workflow`        | BPMS workflow definition (nodes + edges)      |
| `ProcessInstance` | A running instance of a workflow              |
| `Task`            | Individual tasks within a process instance    |
| `AIAnalysis`      | AI scoring results for candidates             |
| `Notification`    | In-app notification for a user                |
| `Document`        | Uploaded files (CVs, contracts, etc.)         |

### Useful Prisma Commands

```bash
# Re-generate Prisma client after schema changes
npx prisma generate

# Create a new migration from schema changes
npx prisma migrate dev --name describe_your_change

# Apply migrations in production
npx prisma migrate deploy

# Reset the database (⚠️ destroys all data)
npx prisma migrate reset

# Open Prisma Studio (visual DB browser)
npx prisma studio
```

---

## 🔗 External Services

### Supabase Setup
1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. Go to **Settings → Database** to find your connection strings (`DATABASE_URL` and `DIRECT_URL`).
3. Go to **Settings → API** to find your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
4. Go to **Storage** and create a bucket named `documents` (or `uploads`) for file uploads.

### Groq API
1. Create a free account at [https://console.groq.com](https://console.groq.com).
2. Go to **API Keys** and create a new key.
3. Copy it into `backend/.env` as `GROQ_API_KEY`.

### Google OAuth 2.0
1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a project → **APIs & Services → Credentials → Create OAuth 2.0 Client ID**.
3. Set application type to **Web application**.
4. Add to **Authorized redirect URIs**: `http://localhost:5000/api/auth/google/callback`
5. Copy `Client ID` and `Client Secret` into `backend/.env`.

### Google Gemini API
1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. Generate a new API key.
3. Copy it into `frontend/.env` as `GEMINI_API_KEY`.

---

## 🐛 Troubleshooting

| Problem | Solution |
|--------|---------|
| `Cannot connect to database` | Check your `DATABASE_URL` in `backend/.env`. Make sure the Supabase password is correct and the project is active. |
| `Prisma client not generated` | Run `npx prisma generate` inside the `backend/` folder. |
| `CORS error on frontend` | Make sure `FRONTEND_URL` in `backend/.env` matches the URL where your frontend runs (`http://localhost:3000`). |
| `Google login not working` | Verify `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and that the redirect URI is set in Google Cloud Console. |
| Port already in use | Kill the process: `npx kill-port 5000` or `npx kill-port 3000` |
| `ts-node-dev` errors | Make sure TypeScript devDependencies are installed: `npm install` in `backend/`. |
| Frontend shows blank page | Check browser console for errors. Make sure backend is running on port 5000. |

---

## 👥 Team

**Group D — NexFlow BPMS**

---

## 📄 License

This project is developed for academic purposes as part of a final project submission.
