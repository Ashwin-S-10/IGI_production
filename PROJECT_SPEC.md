# IGI Contest Platform - Complete Project Specification

> **Last Updated:** January 22, 2026  
> **Purpose:** Single source of truth for AI agents and developers implementing features without additional context.

---

## 1. Project Mission & Architecture

### 1.1 Vision

The **IGI Contest Platform** is a competitive programming event system themed as a covert intelligence operation. Teams of 2 participants compete through 3 rounds of increasing difficulty, evaluated by Gemini AI for objective scoring.

### 1.2 High-Level Architecture

```
┌──────────────────────────┐         ┌──────────────────────────┐
│   FRONTEND (Next.js)     │         │   BACKEND (Express.js)   │
│   Port: 3000             │ ←────→  │   Port: 4000             │
├──────────────────────────┤  HTTP   ├──────────────────────────┤
│ • React 19 Components    │  JSON   │ • RESTful API Routes     │
│ • TanStack Query         │         │ • Session Management     │
│ • Tailwind CSS           │         │ • Gemini AI Integration  │
│ • Next.js 16 App Router  │         │ • Supabase Database      │
└──────────────────────────┘         └──────────────────────────┘
                                               ↓
                                      ┌──────────────────────────┐
                                      │      Supabase            │
                                      ├──────────────────────────┤
                                      │ • PostgreSQL Database    │
                                      │ • Row Level Security     │
                                      │ • Real-time Subscriptions│
                                      └──────────────────────────┘
```

### 1.3 Tech Stack

| Layer          | Technology                          | Version    |
|----------------|-------------------------------------|------------|
| Frontend       | Next.js (App Router)                | 16.x       |
| UI Framework   | React                               | 19.2       |
| Styling        | Tailwind CSS                        | 4.x        |
| State/Fetching | TanStack Query                      | 5.x        |
| Backend        | Express.js                          | 4.x        |
| Runtime        | Node.js                             | 20+        |
| Database       | Supabase (PostgreSQL)               | -          |
| AI Evaluation  | Google Gemini (gemini-2.5-flash-lite via SDK, gemini-2.5-flash via HTTP) | -          |
| Language       | TypeScript                          | 5.x        |
| Monorepo       | npm Workspaces                      | -          |

---

## 2. Directory Map

```
/
├── package.json              # Root monorepo config with workspace definitions
├── ARCHITECTURE.txt          # Visual architecture diagrams
├── supabase-migration.sql    # Database schema SQL
├── start-dev.sh              # Linux dev startup script
├── start-dev.ps1             # Windows dev startup script
│
├── backend/                  # Express.js API server
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── server.ts         # Express entry point, route registration
│   │   ├── routes/
│   │   │   ├── auth.ts       # Authentication endpoints
│   │   │   ├── contest.ts    # Contest/round endpoints
│   │   │   ├── teams.ts      # Team management endpoints
│   │   │   ├── mission.ts    # Mission tasks endpoint
│   │   │   └── uploads.ts    # File upload endpoint
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   ├── gemini/       # AI evaluation logic
│   │   │   │   ├── api-keys.ts           # API key rotation/fallback
│   │   │   │   ├── client.ts             # Gemini SDK client
│   │   │   │   ├── geminiClient.ts       # Model initialization
│   │   │   │   ├── evaluateService.ts    # Round 1 evaluation
│   │   │   │   ├── evaluationController.ts # Express controller
│   │   │   │   ├── round2-scoring.ts     # Round 2 debugging evaluation
│   │   │   │   └── scoring.ts            # Generic scoring utilities
│   │   │   └── supabase/     # Database layer
│   │   │       ├── client.ts             # Anon client
│   │   │       ├── server.ts             # Admin/service role client
│   │   │       ├── database.ts           # Database class with operations
│   │   │       ├── teams-service.ts      # Team CRUD + rankings
│   │   │       ├── types.ts              # TypeScript database types
│   │   │       └── hooks.ts              # React Query-style hooks
│   │   └── data/
│   │       ├── round1-questions.ts       # Algorithm questions
│   │       ├── round2-questions.ts       # Debugging questions with bugs
│   │       ├── story.ts                  # Narrative content
│   │       └── users.ts                  # Hardcoded admin/soldier users
│
├── frontend/                 # Next.js application
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── vitest.config.ts
│   ├── playwright.config.ts
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx      # Landing redirect
│   │   │   ├── globals.css
│   │   │   ├── landing/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── mission/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── control/          # Admin control center
│   │   │   │   ├── leaderboard/      # Rankings display
│   │   │   │   └── round/            # Round workspace
│   │   │   └── supabase-status/page.tsx
│   │   ├── components/
│   │   │   ├── ui/           # Reusable UI primitives
│   │   │   ├── auth/         # Login components
│   │   │   ├── dashboards/   # Admin/Contestant dashboards
│   │   │   ├── mission/      # Round workspaces, control panels
│   │   │   ├── telecast/     # Video broadcast components
│   │   │   ├── providers/    # Context providers
│   │   │   └── landing/      # Landing page components
│   │   ├── lib/
│   │   │   ├── api-client.ts # HTTP client for backend API
│   │   │   ├── utils.ts
│   │   │   ├── auth/         # Auth utilities
│   │   │   ├── supabase/     # Direct Supabase access (limited)
│   │   │   └── mission/      # Mission-specific utilities
│   │   └── data/
│   │       ├── story.ts      # Frontend story data
│   │       ├── users.ts      # User type definitions
│   │       └── round2-code-snippets.ts
│   └── public/               # Static assets
│       ├── images/
│       └── logo/
│
└── shared/                   # Shared types and utilities
    ├── package.json
    ├── tsconfig.json
    └── src/
        └── index.ts          # RoundQuestion types, question bank
```

---

## 3. API Registry

### 3.1 Base URL
- **Development:** `http://localhost:4000`
- **Production:** Set via `NEXT_PUBLIC_API_URL` environment variable

### 3.2 Authentication Headers
All authenticated requests must include:
```
x-session-id: <sessionId>
```

### 3.3 Complete Endpoint Reference

#### Authentication (`/api/auth`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/auth/commander-login` | Admin login | `{ email: string, password: string }` | `{ success: boolean, user: AuthUser, sessionId: string }` |
| `POST` | `/api/auth/login` | Team/Soldier login | `{ email: string, password: string }` | `{ success: boolean, user: AuthUser, sessionId: string }` |
| `GET` | `/api/auth/session` | Get current session | - | `{ user: AuthUser \| null }` |
| `POST` | `/api/auth/logout` | End session | - | `{ success: boolean }` |

**AuthUser Schema:**
```typescript
{
  email: string;
  role: 'admin' | 'team' | 'soldier';
  teamId?: string;
  displayName: string;
}
```

#### Teams (`/api/teams`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/teams/admin/teams` | Get all teams (admin) | - | `{ success: boolean, data: Team[] }` |
| `POST` | `/api/teams/admin/create` | Create team (admin) | `{ team_name, player1_name, player2_name, phone_no }` | `{ success: boolean, data: { team_id, team_name, password } }` |
| `POST` | `/api/teams/login` | Team login | `{ team_name: string, password: string }` | `{ success: boolean, data: { team_id, team_name } }` |
| `POST` | `/api/teams/round/submit` | Submit round score | `{ team_id, round_number: 1\|2, total_score }` | `{ success: boolean, data: { team_id, round, score, submission_time } }` |
| `GET` | `/api/teams/rankings?round=1\|2\|3` | Get leaderboard | Query: `round` | `{ success: boolean, round: number, data: RankedTeam[] }` |
| `GET` | `/api/teams/:team_id` | Get team with ranks | - | `{ team details with r1_rank, r2_rank }` |

**Teams Schema:**
create table public.teams (
  team_id text not null,
  team_name text not null,
  player1_name text not null,
  player2_name text not null,
  phone_no text not null,
  password text not null,
  r1_score integer null default 0,
  r1_submission_time timestamp without time zone null,
  r2_score integer null default 0,
  r2_submission_time timestamp without time zone null,
  created_at timestamp without time zone null default now(),
  round3_1_score numeric(3, 1) null,
  round3_1_timestamp timestamp with time zone null,
  round3_2_score numeric(3, 1) null,
  round3_2_timestamp timestamp with time zone null,
  round3_3_score numeric(3, 1) null,
  round3_3_timestamp timestamp with time zone null,
  rank integer null,
  constraint teams_pkey primary key (team_id),
  constraint teams_rank_unique unique (rank),
  constraint teams_team_name_key unique (team_name),
  constraint teams_r1_score_check check (
    (
      (r1_score >= 0)
      and (r1_score < 100)
    )
  ),
  constraint teams_r2_score_check check (
    (
      (r2_score >= 0)
      and (r2_score < 100)
    )
  )
) TABLESPACE pg_default;

#### Contest (`/api/contest`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/contest/state` | Get contest state | - | `{ currentRound, status }` |
| `GET` | `/api/contest/story-ack` | Check story acknowledgment | - | `{ acknowledged: boolean }` |
| `POST` | `/api/contest/story-ack` | Acknowledge story | - | `{ success: boolean }` |

**Telecast:**

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/contest/telecast/status` | Get telecast status | - | `{ active, triggeredAt, timestamp, videoPath }` |
| `POST` | `/api/contest/telecast/trigger` | Start telecast (admin) | `{ videoPath?: string }` | `{ success: boolean, videoPath }` |
| `POST` | `/api/contest/telecast/clear` | Clear telecast (admin) | - | `{ success: boolean }` |
| `POST` | `/api/contest/telecast/mark-viewed` | Mark viewed by team | `{ teamId: string }` | `{ success: boolean }` |

**Round 1 - Algorithm Challenge:**

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/contest/round1/questions` | Get questions (no answers) | - | `{ questions: Round1Question[] }` |
| `POST` | `/api/contest/round1/evaluate` | Evaluate single answer | `{ user_id, question, user_answer }` | `{ score: number (0-10), analysis: string }` |
| `POST` | `/api/contest/round1/submit` | Final submission | `{ team_id, round_id, total_score, submitted_at }` | `{ success: boolean }` |
| `POST` | `/api/contest/round1/analyze` | Analyze round 1 (placeholder) | `{ any }` | `{ success: boolean }` |

**Round 2 - Debugging Challenge:**

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/contest/round2/questions` | Get questions (no bug explanations) | - | `{ questions: Round2Question[] }` |
| `POST` | `/api/contest/round2/submit-answer` | Evaluate debugging answer | `{ question_id, user_answer, language? }` | `{ score, identifiedErrors[], analysis, reason }` |
| `POST` | `/api/contest/round2/submit` | Final submission | `{ team_id, total_score, submitted_at? }` | `{ success: boolean, score }` |

**Round 3 - Bracket Duels:**

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/contest/round3/bracket` | Get bracket structure | - | `{ bracket: BracketStructure, topEight: Team[] }` |
| `POST` | `/api/contest/round3/submit` | Submit duel answer | `{ duel_id, team_id, answer, question_id }` | `{ success: boolean, submission }` |
| `POST` | `/api/contest/round3/judge` | Judge duel (admin) | `{ duel_id, question, solution_a, solution_b, team_a_id, team_b_id }` | `{ success, judgment, winner_team_id }` |
| `POST` | `/api/contest/round3/bracket/update` | Update bracket | `{ duel_id, winner_team_id, stage }` | `{ success, next_stage }` |

**Admin:**

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/contest/admin/clear-round2` | Clear all Round 2 data | - | `{ success: boolean, count: number }` |

#### Mission (`/api/mission`)

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/api/mission/tasks` | Get mission tasks | `{ tasks: Task[] }` |

#### Uploads (`/api/uploads`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/uploads/create` | Create upload | Upload data | `{ success: boolean }` |

---

## 4. Function Reference

### 4.1 AI Evaluation Functions

#### `evaluateAnswer(question: string, userAnswer: string): Promise<EvaluationResult>`
**Location:** `backend/src/lib/gemini/evaluateService.ts`

**Purpose:** Round 1 algorithm answer evaluation using Gemini AI.

**Input:**
- `question`: The problem statement
- `userAnswer`: User's algorithm/pseudocode solution

**Output:**
```typescript
{
  score: number;      // 0-10
  analysis: string;   // Feedback (max 50 words)
}
```

**Behavior:**
- Uses `gemini-2.0-flash-exp` model
- Automatic API key rotation on rate limits
- Validates score to 0-10 range
- Filters third-person language from analysis

---

#### `scoreDebuggingAnswerWithGemini(...): Promise<EvaluationResult>`
**Location:** `backend/src/lib/gemini/round2-scoring.ts`

**Purpose:** Round 2 debugging evaluation - scores bug identification accuracy.

**Input:**
```typescript
(
  questionTitle: string,
  questionDescription: string,
  codeSnippet: string,
  userAnswer: string,
  language: string   // 'python' | 'c' | 'cpp' | 'java'
)
```

**Output:**
```typescript
{
  identifiedErrors: Array<{
    error_description: string;
    fix_description: string;
    identification_score: number;  // 0-7
    fix_score: number;             // 0-3
  }>;
  score: number;      // 0-10 (normalized)
  analysis: string;   // Performance feedback
  reason: string;     // Scoring explanation
}
```

**Scoring Logic:**
- Each bug: 7 marks for identification + 3 marks for fix
- If 2 bugs: Total 20 marks, normalized to 0-10
- If 1 bug: Total 10 marks
- Partial credit awarded liberally

---

### 4.2 API Key Management

#### `callGeminiWithFallback(endpoint: string, requestBody: any): Promise<Response>`
**Location:** `backend/src/lib/gemini/api-keys.ts`

**Purpose:** Make Gemini API calls with automatic failover on rate limiting.

**Behavior:**
1. Starts with primary API key
2. On HTTP 429, switches to next key
3. Retries up to 5 keys
4. Resets to first key for each new request

**Key Priority:**
1. `GEMINI_API_KEY` (env)
2. `GEMINI_API_KEY_2` (env)
3-5. Hardcoded fallback keys

---

### 4.3 Database Functions

#### `getRankings(roundNumber: 1 | 2 | 3): Promise<RankedTeam[]>`
**Location:** `backend/src/lib/supabase/teams-service.ts`

**Purpose:** Fetch leaderboard for a specific round.

**Output:**
```typescript
// For Round 1 & 2:
{
  rank: number;
  team_id: string;
  team_name: string;
  player1_name: string;
  player2_name: string;
  score: number;
  submission_time: string | null;
}

// For Round 3 (adds):
{
  combined_score: number;
  r1_score: number;
  r2_score: number;
  qualified: boolean;  // Top 8
}
```

**Ranking Rules:**
1. Higher score ranks first
2. Earlier submission breaks ties
3. Null submissions rank last

---

#### `createTeam(data): Promise<{ team_id, team_name, password }>`
**Location:** `backend/src/lib/supabase/teams-service.ts`

**Purpose:** Admin creates a new team.

**Auto-generation:**
- `team_id`: `TEAM-{base36_timestamp}-{random4}`
- `team_name`: `{input}@igifosscit`
- `password`: `IGI-{025 + teamCount*4}` (e.g., IGI-025, IGI-029, IGI-033)

---

#### `submitRoundScore(teamId, roundNumber, totalScore): Promise<SubmissionResult>`
**Location:** `backend/src/lib/supabase/teams-service.ts`

**Purpose:** Submit final score for a round.

**Validation:**
- Score must be 0-99
- Cannot submit twice for same round
- Team must exist

---

#### `scoreAnswerWithGemini(question, expectedAnswer, answer): Promise<number>`
**Location:** `backend/src/lib/gemini/scoring.ts`

**Purpose:** Generic scoring function using direct HTTP API (no SDK dependencies).

**Input:**
- `question`: The problem statement
- `expectedAnswer`: The expected correct answer
- `answer`: User's submitted answer

**Output:** `number` (0-10)

**Model Used:** `gemini-2.5-flash` via direct HTTP API

**Use Case:** Legacy/alternative scoring when SDK is unavailable.

---

#### `getGeminiModel(): GenerativeModel`
**Location:** `backend/src/lib/gemini/geminiClient.ts`

**Purpose:** Get configured Gemini model instance for SDK-based calls.

**Configuration:**
```typescript
{
  model: 'models/gemini-2.5-flash-lite',
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 200,
    topP: 0.8,
    topK: 40
  }
}
```

---

#### `reinitializeWithNextKey(): boolean`
**Location:** `backend/src/lib/gemini/geminiClient.ts`

**Purpose:** Reinitialize Gemini client with next API key for rate limit handling.

**Returns:** `true` if successfully switched, `false` if no more keys available.

---

### 4.4 Frontend API Client

**Location:** `frontend/src/lib/api-client.ts`

**Exported Objects:**
- `authApi` - Authentication methods
- `contestApi` - Contest/round methods
- `missionApi` - Mission tasks
- `uploadsApi` - File uploads

**Session Management:**
- `setSessionId(id)` - Store in localStorage
- `getSessionId()` - Retrieve current session
- All requests auto-include `x-session-id` header

---

### 4.5 Database Class Methods

**Location:** `backend/src/lib/supabase/database.ts`

The `SupabaseDatabase` class provides these operations:

| Method | Purpose |
|--------|---------|
| `getTeams()` | Fetch all teams |
| `getTeam(id)` | Fetch single team |
| `createTeam(team)` | Create new team |
| `updateTeam(id, updates)` | Update team fields |
| `deleteTeam(id)` | Remove team |
| `getRounds()` | Fetch round configurations |
| `updateRound(id, updates)` | Update round status |
| `getSubmissionsRound1(teamId?)` | Fetch Round 1 submissions |
| `createSubmissionRound1(submission)` | Create Round 1 submission |
| `getSubmissionsRound2(teamId?)` | Fetch Round 2 submissions |
| `createSubmissionRound2(submission)` | Create Round 2 submission |
| `clearAllRound2Submissions()` | Admin: Clear all Round 2 data |
| `getAIJobs()` | Fetch AI evaluation jobs |
| `createAIJob(job)` | Create AI job record |
| `updateAIJob(id, updates)` | Update job progress/status |
| `getTelecastStatus()` | Get active telecast |
| `triggerTelecast(videoPath)` | Start telecast broadcast |
| `clearTelecast()` | Stop active telecast |
| `markTelecastViewed(teamId)` | Record team viewed telecast |
| `subscribeToTelecast(callback)` | Real-time telecast updates |
| `subscribeToRounds(callback)` | Real-time round updates |
| `subscribeToTeams(callback)` | Real-time team updates |

---

## 5. State Machine: Contest Flow

### 5.1 Contest Phases

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   SETUP     │────→│   ROUND 1   │────→│    ROUND 2      │────→│   ROUND 3   │
│  (pending)  │     │  Algorithm  │     │    Debugging    │     │   Bracket   │
└─────────────┘     └─────────────┘     └─────────────────┘     └─────────────┘
                          │                     │                      │
                          ↓                     ↓                      ↓
                    teams.r1_score        teams.r2_score         Bracket State
                    teams.r1_submission_time  teams.r2_submission_time  (in-memory)
```

### 5.2 Round 1 - Algorithm Challenge

**Flow:**
1. Team accesses `/mission/round` workspace
2. Frontend fetches questions via `GET /api/contest/round1/questions`
3. For each answer:
   - Frontend calls `POST /api/contest/round1/evaluate`
   - Gemini AI scores (0-10) and provides analysis
   - Score stored in localStorage: `round1_scores`
4. On final submit:
   - Frontend calculates total score
   - Calls `POST /api/contest/round1/submit` with `{ team_id, total_score }`
   - Backend updates `teams.r1_score`, `teams.r1_submission_time`

**Database Changes:**
- `teams.r1_score` = Sum of individual question scores (0-99)
- `teams.r1_submission_time` = ISO timestamp

---

### 5.3 Round 2 - Debugging Challenge

**Flow:**
1. Team views buggy code snippets (Python, C, C++, Java)
2. For each question:
   - Contestant describes bugs found
   - `POST /api/contest/round2/submit-answer` evaluates with Gemini
   - Returns detailed `identifiedErrors[]` breakdown
   - Stored in localStorage: `round2_question_{N}_score`
3. On final submit:
   - Total calculated (sum of per-question scores)
   - `POST /api/contest/round2/submit` saves to database
   - Backend normalizes to 0-100 if needed

**Database Changes:**
- `teams.r2_score` = Normalized score (0-99)
- `teams.r2_submission_time` = ISO timestamp

---

### 5.4 Round 3 - Bracket Duels

**Flow:**
1. Admin triggers bracket generation
2. Top 8 teams (by combined R1+R2 score) qualify
3. Bracket structure:
   - Quarter-finals (4 matches)
   - Semi-finals (2 matches)
   - Final (1 match)
4. For each duel:
   - Both teams submit solutions
   - Admin judges via `POST /api/contest/round3/judge`
   - Winner advances via `POST /api/contest/round3/bracket/update`

**Seeding:**
```
QF1: Seed 1 vs Seed 8
QF2: Seed 4 vs Seed 5
QF3: Seed 2 vs Seed 7
QF4: Seed 3 vs Seed 6
```

**Bracket Generation via `getRound3Rankings()` (internal):**
```typescript
// Located in: backend/src/lib/supabase/teams-service.ts
// Returns teams sorted by combined R1+R2 score with 'qualified' flag for top 8
{
  rank: number;
  team_id: string;
  team_name: string;
  combined_score: number;  // r1_score + r2_score
  r1_score: number;
  r2_score: number;
  qualified: boolean;      // true for top 8
}
```

---

## 6. Database Schema

### 6.1 Core Tables

#### `teams`
```sql
CREATE TABLE teams (
  team_id TEXT PRIMARY KEY,
  team_name TEXT UNIQUE NOT NULL,
  player1_name TEXT NOT NULL,
  player2_name TEXT NOT NULL,
  phone_no TEXT NOT NULL,
  password TEXT NOT NULL,
  r1_score INTEGER DEFAULT 0 CHECK (r1_score >= 0 AND r1_score < 100),
  r1_submission_time TIMESTAMP,
  r2_score INTEGER DEFAULT 0 CHECK (r2_score >= 0 AND r2_score < 100),
  r2_submission_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `rounds`
```sql
CREATE TABLE rounds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'active', 'completed')),
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `telecast`
```sql
CREATE TABLE telecast (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  active BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMPTZ,
  timestamp BIGINT,
  video_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `submissions_round1` / `submissions_round2`
```sql
CREATE TABLE submissions_round1 (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  score DECIMAL(3,1),
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE submissions_round2 (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  total_score DECIMAL(3,1),
  bug_results JSONB,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `ai_jobs`
```sql
CREATE TABLE ai_jobs (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  round TEXT,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress INTEGER CHECK (progress >= 0 AND progress <= 100),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `telecast_viewers`
```sql
CREATE TABLE telecast_viewers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Coding Standards & Boundaries

### 7.1 ✅ ALWAYS DO

1. **Use TypeScript types everywhere**
   - All function parameters and returns must be typed
   - Use types from `backend/src/lib/supabase/types.ts` for database entities
   - Use `shared/src/index.ts` for cross-workspace types

2. **Follow monorepo workspace pattern**
   - Import shared types: `import { RoundQuestion } from '@project/shared'`
   - Never duplicate types between workspaces

3. **Maintain security boundaries**
   - Never send `expected_answer` or `bug_explanation` to frontend
   - All scoring logic runs on backend only
   - Service role key only in backend

4. **Session-based authentication**
   - Store sessionId in localStorage (frontend)
   - Include `x-session-id` header in all authenticated requests
   - Validate session on backend before sensitive operations

5. **Use environment variables for configuration**
   ```
   NEXT_PUBLIC_* - Safe for frontend
   SUPABASE_SERVICE_ROLE_KEY - Backend only
   GEMINI_API_KEY - Backend only
   ```

6. **Error handling pattern**
   ```typescript
   try {
     // operation
   } catch (error) {
     console.error('[context] Error:', error);
     res.status(500).json({ error: 'User-friendly message' });
   }
   ```

---

### 7.2 ❌ NEVER DO

1. **Never hardcode secrets in source code**
   - Exception: Fallback Gemini API keys are acceptable for demo purposes
   - Production must use environment variables only

2. **Never move backend scoring logic to frontend**
   - All Gemini API calls must be from backend
   - Frontend receives only scores and analysis, never answers

3. **Never use legacy Firestore/GCP code**
   - The codebase has migrated to Supabase
   - Remove any remaining Firebase client code
   - `firebase-admin` is only for legacy compatibility (remove when possible)

4. **Never expose team passwords after creation**
   - Password only returned once during `POST /api/teams/admin/create`
   - Never included in `GET /api/teams/rankings`

5. **Never call Supabase directly from frontend for writes**
   - All mutations go through backend API
   - Frontend Supabase access is read-only for real-time subscriptions

6. **Never skip TypeScript compilation checks**
   - Backend must compile with `tsc`
   - Fix type errors, don't use `any` unless absolutely necessary

---

## 8. Environment Variables

### 8.1 Backend (`.env`)

```env
# Server
PORT=4000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Gemini AI
GEMINI_API_KEY=AIza...
GEMINI_API_KEY_2=AIza...  # Optional secondary key

# Legacy (remove when possible)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### 8.2 Frontend (`.env.local`)

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:4000

# Supabase (read-only access)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 9. Commands Reference

### 9.1 Development

```bash
# Start both frontend and backend (Linux)
./start-dev.sh

# Start both frontend and backend (Windows)
pwsh -File start-dev.ps1

# Or separately:
cd backend && npm run dev     # Backend on :4000
cd frontend && npm run dev    # Frontend on :3000
```

### 9.2 Building

```bash
# Build all workspaces
cd backend && npm run build
cd frontend && npm run build

# Production start
cd backend && npm start
cd frontend && npm start
```

### 9.3 Testing

```bash
# Frontend unit tests
cd frontend && npm test

# E2E tests (requires both servers running)
cd frontend && npm run test:e2e

# Backend API test
cd backend && tsx test-teams-api.ts
```

### 9.4 Database

```bash
# Run migrations (copy/paste into Supabase SQL Editor)
# File: supabase-migration.sql

# Test Supabase connection
cd backend && tsx test-supabase-connection.ts
```

### 9.5 Linting

```bash
cd frontend && npm run lint
cd backend && npm run lint
```

---

## 10. Authentication Credentials

### 10.1 Commander (Admin)
- **Email:** `agentalpha@foss.ops`
- **Password:** `192837`
- **Role:** `admin`

### 10.2 Teams
- **Format:** `{teamname}@igifosscit`
- **Password:** Auto-generated (IGI-025, IGI-029, etc.)
- **Role:** `team`

### 10.3 Soldiers (Legacy)
- Defined in `backend/src/data/users.ts`
- Uses scrypt password hashing
- **Role:** `soldier`

---

## 11. Key Component Locations

| Component | Location | Purpose |
|-----------|----------|---------|
| Login Panel | `frontend/src/components/auth/login-panel.tsx` | Team/Admin authentication |
| Admin Dashboard | `frontend/src/components/dashboards/admin-dashboard.tsx` | Control center access |
| Contestant Dashboard | `frontend/src/components/dashboards/contestant-dashboard.tsx` | Round workspace access |
| Round 1 Workspace | `frontend/src/components/mission/round-workspace.tsx` | Algorithm submission |
| Round 1 Review | `frontend/src/components/mission/round1-review.tsx` | Admin submission review |
| Round 2 Workspace | `frontend/src/components/mission/round2-workspace-new.tsx` | Debugging submission |
| Round 3 Workspace | `frontend/src/components/mission/round3-workspace.tsx` | Bracket duel submission |
| Round 3 Judge Panel | `frontend/src/components/mission/round3-judge-panel.tsx` | Admin duel judging |
| Leaderboard | `frontend/src/components/mission/leaderboard-panel.tsx` | Rankings display |
| Control Center | `frontend/src/components/mission/control-center.tsx` | Admin controls |
| AI Scoring Center | `frontend/src/components/mission/ai-scoring-center.tsx` | Evaluation monitoring |
| Team Management | `frontend/src/components/mission/team-management-center.tsx` | Team CRUD |
| Add Team Modal | `frontend/src/components/mission/add-team-modal.tsx` | Team creation modal |
| Team Details Modal | `frontend/src/components/mission/team-details-modal.tsx` | Team credentials view |
| Mission Passwords | `frontend/src/components/mission/mission-passwords-center.tsx` | Password generation |
| Submissions Intel | `frontend/src/components/mission/submissions-intel-center.tsx` | Submission monitoring |
| Mission Shell | `frontend/src/components/mission/mission-shell.tsx` | Mission layout wrapper |

---

## 12. Data Flow Diagrams

### 12.1 Round 1 Evaluation Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │     │     Backend     │     │    Gemini AI    │
│  (Workspace)    │     │   (/contest)    │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ POST /evaluate        │                       │
         │ {question, answer}    │                       │
         │──────────────────────→│                       │
         │                       │  generateContent()    │
         │                       │──────────────────────→│
         │                       │                       │
         │                       │  {score, analysis}    │
         │                       │←──────────────────────│
         │ {score, analysis}     │                       │
         │←──────────────────────│                       │
         │                       │                       │
         │ Store in localStorage │                       │
         │                       │                       │
```

### 12.2 Team Creation Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Admin Panel    │     │     Backend     │     │    Supabase     │
│                 │     │   (/teams)      │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ POST /admin/create    │                       │
         │ {team_name, players}  │                       │
         │──────────────────────→│                       │
         │                       │ Generate team_id      │
         │                       │ Generate password     │
         │                       │                       │
         │                       │ INSERT INTO teams     │
         │                       │──────────────────────→│
         │                       │                       │
         │                       │    team row           │
         │                       │←──────────────────────│
         │ {team_id, password}   │                       │
         │←──────────────────────│                       │
         │                       │                       │
         │ Display password once │                       │
         │                       │                       │
```

---

## 13. Troubleshooting Guide

### 13.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `CORS error` | Backend not running or wrong port | Ensure backend runs on :4000, check `FRONTEND_URL` |
| `Gemini rate limit` | API quota exceeded | System auto-rotates keys; wait or add more keys |
| `Session null` | localStorage cleared or expired | Re-login; check `x-session-id` header |
| `Team not found` | Wrong team_id format | Use full `TEAM-xxx-xxx` format |
| `Score already submitted` | Duplicate submission attempt | Each round only allows one submission per team |

### 13.2 Debug Logging

Backend logs all requests:
```
[2026-01-22T10:00:00.000Z] POST /api/contest/round1/evaluate
[Round1 Evaluation] Starting with 5 API keys available
[Gemini API] Attempt 1/5 using key #1
```

---

## 14. Future Considerations

### 14.1 Planned Improvements
- [ ] Redis session storage for production
- [ ] WebSocket for real-time leaderboard updates
- [ ] Rate limiting middleware
- [ ] Admin audit logging
- [ ] Backup Gemini model fallback (gemini-pro)

### 14.2 Technical Debt
- Remove legacy Firebase dependencies
- Consolidate database types between migration SQL and TypeScript
- Add comprehensive backend test suite

---

*This specification is the authoritative reference for the IGI Contest Platform. All implementations should conform to the patterns and constraints documented here.*