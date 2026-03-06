

## Plan: Refactor TasksPage — Live Data + Calendar View

### Overview
Replace mock data in TasksPage with live data from the `activities` table, joined with `opportunities` (for stage) and `contacts` (for authority phone). Add two view modes: **List** and **Calendar** with drag-and-drop.

### Data Flow
Each activity links to an opportunity via `opportunity_id`. The opportunity has `authority_contact_id` and `stage`. We join `contacts` to get the phone number for click-to-call.

```text
activities → opportunities (stage, authority_contact_id) → contacts (name, phone)
           → accounts (clinic_name)
```

### 1. Fetch Data (TasksPage)
- Query `activities` with all fields, ordered by `activity_date asc`
- Query `opportunities` to get `stage`, `authority_contact_id`, `account_id` per opportunity
- Query `contacts` for authority contacts to get `name` and `phone`
- Query `accounts` for clinic names
- Build a merged list with all needed display fields

### 2. List View (default tab)
- **Filter**: Show only `is_done = false` by default (hide completed)
- **Columns/Row data**:
  - Circle checkbox to mark as done (updates `is_done` to `true` in DB)
  - Activity title (ชื่อกิจกรรม)
  - Activity date + start_time — end_time
  - Authority contact name + phone icon (click-to-call via `tel:` link)
  - Priority badge
  - Stage badge (from opportunity) — clickable, navigates to `/opportunities/:id`
  - Due date (activity_date)
- On mark-as-done: `supabase.from('activities').update({ is_done: true }).eq('id', activityId)`

### 3. Calendar View (second tab)
- Install `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction` for drag-and-drop calendar
- Map activities to calendar events using `activity_date`, `start_time`, `end_time`
- **Event card content**:
  - Activity title as headline
  - Authority contact + phone icon (click-to-call)
  - Priority badge
  - Mark-as-done circle
  - If `is_done = true`: render with `opacity-40`
- **Drag & Drop**: On event drop, update `activity_date`, `start_time`, `end_time` in DB

### 4. Tab Switching
- Use existing `Tabs` component with two tabs: "รายการ" (List) and "ปฏิทิน" (Calendar)

### Files Changed
- **`src/pages/TasksPage.tsx`** — Complete rewrite: remove mock data, add Supabase queries, two-tab layout (List + Calendar)
- **`package.json`** — Add FullCalendar packages

### Dependencies to Add
- `@fullcalendar/react`
- `@fullcalendar/daygrid`
- `@fullcalendar/timegrid`
- `@fullcalendar/interaction`

