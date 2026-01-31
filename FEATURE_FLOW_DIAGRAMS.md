# Download Teams (Excel) - Feature Flow Diagram

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ADMIN USER ON TEAM MANAGEMENT PAGE               │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   SEES DOWNLOAD BUTTON   │
                    │ "Download Teams (Excel)" │
                    │  (with FileDown icon)    │
                    └──────────────────────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │   CLICKS BUTTON      │
                       │ Button shows pulse   │
                       │   animation starts   │
                       └──────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   FRONTEND ACTION        │
                    │ handleDownloadExcel()    │
                    │ called                   │
                    └──────────────────────────┘
                                  │
                                  ▼
        ┌─────────────────────────────────────────────────────┐
        │   SEND GET REQUEST TO BACKEND                       │
        │   /api/teams/admin/export-excel                     │
        └─────────────────────────────────────────────────────┘
                                  │
                                  ▼
        ┌─────────────────────────────────────────────────────┐
        │   BACKEND PROCESSING                                │
        │   ├─ Fetch all teams from Supabase                  │
        │   ├─ Create ExcelJS workbook                        │
        │   ├─ Add styled header row                          │
        │   ├─ Add team data rows (alternating colors)        │
        │   ├─ Freeze header row                              │
        │   ├─ Generate Excel buffer                          │
        │   └─ Return with proper headers                     │
        └─────────────────────────────────────────────────────┘
                                  │
                                  ▼
        ┌─────────────────────────────────────────────────────┐
        │   HTTP RESPONSE                                     │
        │   Status: 200 OK                                    │
        │   Headers:                                          │
        │   ├─ Content-Type: application/vnd.openxml...      │
        │   ├─ Content-Disposition: attachment;              │
        │   │  filename="teams_2026-01-29.xlsx"              │
        │   └─ Content-Length: [file-size]                   │
        │   Body: [Binary Excel file data]                    │
        └─────────────────────────────────────────────────────┘
                                  │
                                  ▼
        ┌─────────────────────────────────────────────────────┐
        │   FRONTEND PROCESSING                               │
        │   ├─ Receive blob response                          │
        │   ├─ Extract filename from headers                  │
        │   ├─ Create object URL from blob                    │
        │   ├─ Create temporary anchor element                │
        │   ├─ Trigger download                               │
        │   ├─ Remove anchor element                          │
        │   └─ Revoke object URL                              │
        └─────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   FILE DOWNLOADED        │
                    │ Filename: teams_2026-...│
                    │ Format: .xlsx            │
                    │ Location: Downloads/     │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   USER OPENS FILE        │
                    │ In Excel / Google Sheets │
                    │ / Compatible Software    │
                    └──────────────────────────┘
```

## Excel File Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│                         EXCEL FILE CONTENT                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ╔════════════════════════════════════════════════════════════════╗ │
│  ║                    HEADER ROW (Frozen)                        ║ │
│  ║ Orange Background #FF6B00                                     ║ │
│  ║ ┌────────┬──────────┬──────────┬──────────┬───────┬──────┐  ║ │
│  ║ │Team ID │Team Name │ Player 1 │ Player 2 │ Phone │ Pass │  ║ │
│  ║ │        │          │          │          │       │ word │  ║ │
│  ║ ├────────┼──────────┼──────────┼──────────┼───────┼──────┤  ║ │
│  ║ │   ...  │   ...    │   ...    │   ...    │  ...  │  ...  │  ║ │
│  ║ └────────┴──────────┴──────────┴──────────┴───────┴──────┘  ║ │
│  ║                                                              ║ │
│  ║  ┌────────┬──────────┬──────────┬──────────┬───────┬──────┐  ║ │
│  ║  │TEAM... │MyTeam@ig │ John Doe │Jane Smith│555-123│IGI-0 │  ║ │
│  ║  │        │          │          │          │       │ 25   │  ║ │
│  ║  │ White  │  White   │  White   │  White   │White  │White │  ║ │
│  ║  ├────────┼──────────┼──────────┼──────────┼───────┼──────┤  ║ │
│  ║  │TEAM... │MyTeam2@i │ Alice    │ Bob      │555-456│IGI-0 │  ║ │
│  ║  │        │          │          │          │       │ 29   │  ║ │
│  ║  │ Gray   │  Gray    │  Gray    │  Gray    │ Gray  │ Gray │  ║ │
│  ║  ├────────┼──────────┼──────────┼──────────┼───────┼──────┤  ║ │
│  ║  │  ...   │   ...    │   ...    │   ...    │  ...  │ ...  │  ║ │
│  ║  │        │          │          │          │       │      │  ║ │
│  ║  │Repeat  │ Repeat   │ Repeat   │ Repeat   │Repeat │Repeat│  ║ │
│  ║  └────────┴──────────┴──────────┴──────────┴───────┴──────┘  ║ │
│  ║                                                              ║ │
│  ║  Additional Columns:                                         ║ │
│  ║  • R1 Score (Round 1)                                        ║ │
│  ║  • R2 Score (Round 2)                                        ║ │
│  ║  • Created At (Timestamp)                                    ║ │
│  ║                                                              ║ │
│  ╚════════════════════════════════════════════════════════════════╝ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
                        ┌─────────────────────┐
                        │  DOWNLOAD BUTTON    │
                        │    CLICKED          │
                        └─────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
            ┌──────────────────┐     ┌──────────────────┐
            │  API RESPONDS    │     │  NETWORK ERROR   │
            │  200 OK          │     │  (timeout, etc)  │
            │  [Excel file]    │     │                  │
            └──────────────────┘     └──────────────────┘
                    │                           │
                    ▼                           ▼
            ┌──────────────────┐     ┌──────────────────┐
            │  CONVERT TO      │     │  DISPLAY ERROR   │
            │  BLOB            │     │  MESSAGE         │
            │                  │     │                  │
            │  SUCCESS ✓       │     │  "Failed to      │
            └──────────────────┘     │  download..."    │
                    │                │                  │
                    ▼                └──────────────────┘
            ┌──────────────────┐
            │  CREATE          │
            │  DOWNLOAD        │
            │  LINK            │
            └──────────────────┘
                    │
                    ▼
            ┌──────────────────┐
            │  TRIGGER         │
            │  DOWNLOAD        │
            │                  │
            │  File saved to   │
            │  ~/Downloads/    │
            │  teams_[DATE].   │
            │  xlsx            │
            └──────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│           TEAM MANAGEMENT CENTER COMPONENT (Frontend)               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  HEADER SECTION                                            │   │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌────────────┐   │   │
│  │  │  Add Team Btn   │  │ Update LB Btn│  │ Download ✓ │   │   │
│  │  │                 │  │              │  │ Excel Btn  │   │   │
│  │  │                 │  │              │  │ (NEW!)     │   │   │
│  │  └─────────────────┘  └──────────────┘  └────────────┘   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  STATE MANAGEMENT                                          │   │
│  │  • fetchedTeams: Team[]                                    │   │
│  │  • isDownloadingExcel: boolean (NEW!)                      │   │
│  │  • downloadError: string | null (NEW!)                     │   │
│  │  • [other existing state]                                  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  EVENT HANDLERS                                            │   │
│  │  • handleDownloadExcel() ◄── (NEW!)                        │   │
│  │  • handleUpdateLeaderboard()                               │   │
│  │  • copyToClipboard()                                       │   │
│  │  • [other handlers]                                        │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  ERROR MESSAGE DISPLAY (NEW!)                              │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │ ⚠️ Download Failed                                │   │   │
│  │  │ [Error message details]                           │   │   │
│  │  │ (Shows if downloadError is set)                   │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  TEAM DETAILS SECTION                                      │   │
│  │  (Existing functionality - unchanged)                      │   │
│  │  • Search functionality                                    │   │
│  │  • Team list display                                       │   │
│  │  • Copy to clipboard buttons                               │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Backend API Endpoint Flow

```
REQUEST
└─ GET /api/teams/admin/export-excel
   ├─ Query all teams from Supabase
   │  └─ getAllTeams() → teams[]
   │
   ├─ Create Excel Workbook
   │  └─ new ExcelJS.Workbook()
   │
   ├─ Add Worksheet "Teams"
   │  └─ workbook.addWorksheet('Teams')
   │
   ├─ Define Columns (9 columns)
   │  ├─ Team ID
   │  ├─ Team Name
   │  ├─ Player 1 Name
   │  ├─ Player 2 Name
   │  ├─ Phone Number
   │  ├─ Password
   │  ├─ Round 1 Score
   │  ├─ Round 2 Score
   │  └─ Created At
   │
   ├─ Style Header Row
   │  ├─ Background: #FF6B00
   │  ├─ Text: White, Bold, 12pt
   │  └─ Alignment: Centered
   │
   ├─ Add Team Data Rows
   │  ├─ For each team in teams[]
   │  ├─ Alternate background colors
   │  └─ Left-align content
   │
   ├─ Format Special Fields
   │  ├─ Convert timestamp to locale string
   │  ├─ Default missing scores to 0
   │  └─ Preserve all text data
   │
   ├─ Freeze Header Row
   │  └─ worksheet.views = [{ state: 'frozen', ySplit: 1 }]
   │
   ├─ Generate Buffer
   │  └─ const buffer = await workbook.xlsx.writeBuffer()
   │
   └─ Return Response
      ├─ Status: 200 OK
      ├─ Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
      ├─ Content-Disposition: attachment; filename="teams_YYYY-MM-DD.xlsx"
      ├─ Content-Length: buffer.length
      └─ Body: Binary Excel file data
```

## Data Flow Summary

```
┌──────────────┐
│ Admin User   │
└──────┬───────┘
       │
       │ (1) Click Download Button
       ▼
┌──────────────────────────────┐
│ Frontend:                    │
│ handleDownloadExcel()        │
└──────────┬───────────────────┘
           │
           │ (2) GET /api/teams/admin/export-excel
           ▼
┌──────────────────────────────┐
│ Backend:                     │
│ GET /admin/export-excel      │
└──────────┬───────────────────┘
           │
           │ (3) Query Database
           ▼
┌──────────────────────────────┐
│ Supabase:                    │
│ SELECT * FROM teams          │
└──────────┬───────────────────┘
           │
           │ (4) Return Team Data
           ▼
┌──────────────────────────────┐
│ Backend:                     │
│ Generate Excel File          │
│ (ExcelJS)                    │
└──────────┬───────────────────┘
           │
           │ (5) Return Binary Data + Headers
           ▼
┌──────────────────────────────┐
│ Frontend:                    │
│ Process Blob                 │
│ Trigger Download             │
└──────────┬───────────────────┘
           │
           │ (6) Save File
           ▼
┌──────────────────────────────┐
│ Browser Downloads:           │
│ ~/Downloads/teams_YYYY-MM-DD │
│ .xlsx                        │
└──────────────────────────────┘
           │
           │ (7) User Opens in Excel
           ▼
┌──────────────────────────────┐
│ Formatted Excel File         │
│ with all team data           │
│ styled and ready             │
└──────────────────────────────┘
```

---

**Visual Diagrams for Developer Reference**
**Implementation Date:** January 29, 2026
