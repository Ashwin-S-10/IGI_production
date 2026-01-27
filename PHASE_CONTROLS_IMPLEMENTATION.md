# Phase Controls Implementation Summary

## Overview
Implemented a Flag-based round visibility and Round 3 question control system as the single source of truth for contest state management.

## Database Changes

### Updated Schema (supabase-migration.sql)
- Added `Flag` column (SMALLINT, default 0) to rounds table
- Added `timer` column (SMALLINT, nullable) to rounds table
- Updated seed data to include Flag and timer columns

### Flag Semantics
- **Round 1 & 2:**
  - Flag = 0 → Hidden from contestants
  - Flag = 1 → Visible to contestants

- **Round 3:**
  - Flag = 0 → Phase 3 hidden
  - Flag = 1 → Question 1 active (r3-q1)
  - Flag = 2 → Question 2 active (r3-q2)
  - Flag = 3 → Question 3 active (r3-q3)

## Backend Changes

### Type Updates (backend/src/lib/supabase/types.ts)
- Added `Flag: number` field to rounds Row/Insert/Update types
- Added `timer: number | null` field to rounds Row/Insert/Update types

### API Endpoints (backend/src/routes/contest.ts)
- **GET /api/contest/rounds/state** - Returns all rounds with Flag, status, timers
- **PATCH /api/contest/rounds/:roundId** - Updates round Flag, status, start_time, end_time, timer

## Frontend Changes

### Admin Dashboard (frontend/src/components/dashboards/admin-dashboard.tsx)
Complete replacement of Phase Controls section:

#### Round 1 Card
- **Removed:** Upload Questions, Trigger OCR, Generate Passwords buttons
- **Added:** Toggle switch "Enable Round 1" (controls Flag 0/1)

#### Round 2 Card
- **Removed:** Upload Dossiers, Approve Scores buttons
- **Added:** Toggle switch "Enable Round 2" (controls Flag 0/1)

#### Round 3 Card
- **Removed:** Seed Bracket, Start Matches, Judge Pending Duels, Override Result buttons
- **Added:** Question Control Panel with:
  - Question selector (None/Question 1/Question 2/Question 3)
  - Timer input (minutes)
  - Start Question button
  - Current state display showing active question and times

### Contestant Dashboard (frontend/src/components/dashboards/contestant-dashboard.tsx)
- Fetches rounds state from backend
- Filters rounds based on Flag > 0 visibility
- Only displays rounds that are enabled by admin

### Round 3 Workspace (frontend/src/components/mission/round3-question-workspace.tsx)
- Fetches round state from backend to get Flag value
- Dynamically loads question based on Flag (1→r3-q1, 2→r3-q2, 3→r3-q3)
- Calculates timer from end_time in database (not hardcoded)
- Shows loading state while fetching
- Shows "Not Active" message when Flag = 0
- Auto-submits when timer expires

### Shared Question Bank (shared/src/index.ts)
Added 3 Round 3 questions:
1. **r3-q1:** Container With Most Water (two-pointers)
2. **r3-q2:** Longest Substring Without Repeating Characters (sliding-window)
3. **r3-q3:** Merge Intervals (sorting, intervals)

## Data Flow

### Admin Action → Contestant Impact

1. **Admin enables Round 1:**
   - PATCH /api/contest/rounds/round1 with Flag=1
   - Contestants refresh → Round 1 appears on dashboard

2. **Admin starts Round 3 Question 2:**
   - PATCH /api/contest/rounds/round3 with:
     - Flag = 2
     - start_time = NOW()
     - end_time = NOW() + timer_minutes
     - status = 'active'
   - Contestants in Round 3 workspace → Question switches to r3-q2
   - Timer recalculates from end_time
   - Auto-submit triggers when end_time reached

3. **Admin hides Round 2:**
   - PATCH /api/contest/rounds/round2 with Flag=0
   - Contestants refresh → Round 2 disappears from dashboard

## Key Features

### Single Source of Truth
- Database `Flag` field is authoritative
- Frontend never infers state
- Backend never guesses values
- All timers calculated from end_time

### Real-Time Updates
- Admin panel polls every 10 seconds
- Contestant dashboard polls every 10 seconds
- Round 3 workspace polls every 10 seconds
- Immediate sync on manual refresh

### Safety Features
- Confirmation dialogs on critical actions
- Warning that new questions override previous ones
- Loading states during API calls
- Error handling and user feedback
- Disabled controls during updates

## Testing Checklist

- [ ] Admin can toggle Round 1 visibility
- [ ] Admin can toggle Round 2 visibility
- [ ] Admin can select and start Round 3 questions
- [ ] Contestants see only enabled rounds
- [ ] Round 3 displays correct question based on Flag
- [ ] Timers calculate correctly from end_time
- [ ] Auto-submit works on timer expiry
- [ ] Starting new Round 3 question overrides previous one
- [ ] Database updates persist across refreshes
- [ ] Polling keeps all clients in sync

## Migration Steps

1. Run updated supabase-migration.sql to add Flag and timer columns
2. Verify rounds table has Flag=0 for all three rounds
3. Backend will automatically use new API endpoints
4. Frontend will automatically poll and respect Flag values
5. Test admin controls in isolation before live event
6. Verify contestant view with different Flag combinations

## Future Enhancements

- Real-time WebSocket updates instead of polling
- Round 3 bracket visualization
- Auto-advance to next question
- Custom timer per question from admin UI
- Question scheduling (start at specific time)
- Round status history/audit log
