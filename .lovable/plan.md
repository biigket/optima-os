

# Opportunity Module — Add Functional Features

## Overview
Add drag-and-drop stage changes, quick stage editing, inline actions, and other interactive functionality to the Opportunity module.

## Changes

### 1. Drag & Drop on Kanban (`OpportunityKanban.tsx`)
- Lift `opportunities` state up: pass `onStageChange(oppId, newStage)` callback from `OpportunitiesPage`
- Implement native HTML5 drag-and-drop (no library needed):
  - `draggable` on each `KanbanCard`
  - `onDragStart` sets `oppId` in dataTransfer
  - Each column acts as a drop zone with `onDragOver` + `onDrop`
  - Visual feedback: highlight column border on drag-over, ghost opacity on dragged card
- On drop: call `onStageChange` → update state + show toast "ย้าย [clinic] → [stage]"
- Log stage change in a local `stageHistory` array (for future timeline)

### 2. Quick Actions on Kanban Cards (`OpportunityKanban.tsx`)
- Add a hover-visible action row at bottom of each card:
  - **Phone** icon → toast "โทรหา [clinic]"
  - **Calendar** icon → toast "นัดกิจกรรม"  
  - **MoreHorizontal** → dropdown with "แก้ไข", "เปลี่ยน Stage", "Mark Won/Lost"
- Prevent card click navigation when clicking action buttons (`e.stopPropagation()`)

### 3. Stage Change on Detail Page (`OpportunityDetailPage.tsx`)
- Make stage path segments clickable
- On click → confirm dialog "ย้ายไป [stage]?" → update local state + toast
- Add "Mark Won" / "Mark Lost" buttons in the header area

### 4. Inline Edit on Detail Page (`OpportunityDetailPage.tsx`)
- Add edit button next to Deal Info section
- Opens a dialog/inline form to edit: expected_value, close_date, notes, next_activity_type, next_activity_date
- Save updates local state + toast

### 5. Update State Management (`OpportunitiesPage.tsx`)
- Pass `setOpportunities` updater to Kanban and Detail via props or shared state
- `onStageChange` handler: finds opportunity by ID, updates stage, re-renders Kanban
- Wire route params so Detail page can also update the shared opportunities array

### 6. Add "Reason Stuck" dropdown
- When a deal is stuck (>14 days), show a small dropdown on the card: "รอราคา / รอผู้ตัดสินใจ / รอ finance / รอ training / อื่นๆ"
- Store as `stuck_reason` on the opportunity object

## Technical Notes
- Using native HTML5 drag-and-drop keeps bundle size small — no new dependencies
- All state changes are local (mock data) — ready for database migration later
- Drop zones use `e.preventDefault()` on `dragOver` to allow drops

