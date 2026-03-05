

# Customer-Centric Opportunity System Plan

## Overview
Transform the Opportunities module into a **customer-centric** system where every opportunity must be linked to a customer. Add a Kanban board view, Customer Select modal, and a structured Create Opportunity form.

## Changes

### 1. Create `src/components/opportunities/CustomerSelectModal.tsx`
- Modal with search bar (clinic name, phone, location)
- Filter chips: Prospect / Customer / Dormant
- Result list showing: clinic name, location, status badge, assigned sale, last activity
- "Select" button per row
- "Create New Customer" button at bottom → opens existing add-customer dialog, then auto-selects
- Uses same mock account data from LeadsPage

### 2. Create `src/components/opportunities/CreateOpportunityForm.tsx`
- **Sticky customer header** at top: clinic name (clickable link to `/leads/:id`), status badge, sales owner, quick actions (View Card, Add Contact)
- Form fields:
  - Opportunity Type: DEVICE / CONSUMABLE (required, radio or select)
  - Product (from mock product catalog, required)
  - Deal Value (required for DEVICE)
  - Quantity (required for CONSUMABLE)
  - Stage (auto-default: NEW_LEAD for DEVICE, CONTACTED for CONSUMABLE)
  - Probability (auto-mapped by stage, shown as read-only for non-managers)
  - Expected close date
  - Lead source
  - Notes
  - **Next Activity Type** + **Next Activity Date** (required — Save disabled without these)
- Contact check: if selected customer has no contacts, show warning dialog "กรุณาเพิ่มผู้ติดต่อก่อนสร้างโอกาสขาย" with button to add contact
- On save → toast success, add to local state, redirect/close

### 3. Create `src/components/opportunities/OpportunityKanban.tsx`
- Kanban board with columns per stage: ใหม่ → ติดต่อแล้ว → นัดสาธิต → สาธิตแล้ว → เจรจา → ปิดได้ → ปิดไม่ได้
- Cards show: clinic name (prominent), product, deal value, sales owner, days in stage
- **Stuck deal indicator**: red dot/icon if stage unchanged > 14 days (compare `created_at`)
- **Warning icon** if no next activity set
- Filter bar: All / Device / Consumable type filter
- Clicking card → navigate to opportunity detail or expand inline

### 4. Create `src/pages/OpportunityDetailPage.tsx`
- Show full opportunity details with link back to Customer Card
- Customer header section (same sticky header pattern)
- Stage timeline visualization
- Activity log section
- Edit capability

### 5. Rewrite `src/pages/OpportunitiesPage.tsx`
- Replace table-only view with toggle: **Kanban** (default) / **Table** view
- "เพิ่มโอกาสขาย" button → opens **CustomerSelectModal** first → then **CreateOpportunityForm**
- Keep existing filter bar (stage tabs) for table view
- Add opportunity type filter (All / Device / Consumable)

### 6. Update `src/pages/CustomerCardPage.tsx`
- Add "สร้างโอกาสขาย" button in the deals tab and in the action bar
- Opens CreateOpportunityForm pre-filled with current customer (skip CustomerSelectModal)

### 7. Update `src/App.tsx`
- Add route `/opportunities/:id` → OpportunityDetailPage

### 8. Update `src/types/index.ts`
- Add `opportunity_type?: 'DEVICE' | 'CONSUMABLE'` to Opportunity interface
- Add `next_activity_type?: string` and `next_activity_date?: string` fields

### 9. Update `src/data/mockData.ts`
- Add `opportunity_type` and `next_activity` fields to existing mock opportunities

## UX Flow Summary

```text
User clicks "เพิ่มโอกาสขาย"
         │
         ▼
┌─────────────────────┐
│ Customer Select Modal│
│ - Search / Filter    │
│ - Select or Create   │
└────────┬────────────┘
         │ customer selected
         ▼
  ┌── Has contacts? ──┐
  │ No                 │ Yes
  ▼                    ▼
 Warning dialog   Create Opportunity Form
 "Add contact     (customer header sticky)
  first"          + required next activity
                       │
                       ▼
                  Save → Kanban/Detail
```

## Design
- Kanban columns: rounded cards with shadow-sm, color-coded top border by stage
- Drag-and-drop: visual only (no library needed initially — click to change stage)
- Mobile: Kanban scrolls horizontally, form stacks vertically
- Stuck deals: small red clock icon on card
- Customer name always most prominent text on opportunity cards

