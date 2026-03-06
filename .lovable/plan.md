

## Plan: Restyle Calendar Events to Match Reference

The reference image shows a cleaner calendar event card style with:
- Activity type icon (phone icon for calls, utensils for meals, etc.) next to the title
- Title displayed prominently with truncation
- Time range shown as "12:15 PM → 1:15 PM"
- Priority icon (red upward arrows for HIGH) on the right
- Green filled checkmark for done / gray circle for undone, positioned on the right
- Left colored border accent on timed events
- Clean card-like appearance with light blue background

### Changes to `src/pages/TasksPage.tsx`

1. **Add activity type icon mapping** — Map `activity_type` (CALL, MEETING, TASK, DEADLINE, DEMO) to lucide icons (Phone, Users, ClipboardList, AlertCircle, Monitor)
2. **Redesign `eventContent` renderer**:
   - **Row 1**: Activity type icon + title (truncated) + priority icon (if HIGH) + done/undone circle/checkmark on the right
   - **Row 2**: Time range formatted as "HH:MM AM → HH:MM PM" (or keep 24h format matching locale)
   - Layout: icon + title left-aligned, priority + done status right-aligned
3. **Add left border color** per activity type via inline style or className on the event wrapper

### Changes to `src/index.css`

- Adjust `.fc-event` styling for more padding, left border accent, and card-like feel matching the reference
- Ensure all-day events (no time) display as compact chips like the top event in the reference

### Files Changed
- `src/pages/TasksPage.tsx` — Update eventContent renderer, add icon mapping
- `src/index.css` — Adjust event card styling

