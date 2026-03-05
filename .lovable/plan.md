# Customer Card Interface Plan

## Overview

Build a full-page **Customer Card** view as a new route `/leads/:id` that serves as the central dashboard for each customer. When a user clicks a row in the Leads table, they navigate to this card instead of opening the edit dialog.

## Files to Create/Modify

### 1. Create `src/pages/CustomerCardPage.tsx` (main page)

- Read account ID from URL params, find account from mock data
- **Top Header**: clinic name, doctor name, location, sales owner, status badge, grade, potential score + right-side quick stats (Total Revenue, Machines Installed, Active Deals, Last Visit) + quick action buttons (Call, LINE, Add Note, Schedule Visit, Create Task)
- **3-column layout** using CSS grid (`grid-cols-[280px_1fr_320px]`)

### 2. Create `src/components/customer-card/CustomerLeftSidebar.tsx`

- Sections with collapsible cards:
  - **Clinic Information**: name, address, province, phone, email, social links
  - **Contact Persons**: list from mockContacts with role, phone, LINE
  - **Internal Notes**: sales notes, strategy, preferences (editable textarea)

### 3. Create `src/components/customer-card/CustomerCenterPanel.tsx`

- Tabs: Overview | Timeline | Deals | Visits | Reports | Tasks
- **Overview**: summary KPI cards (Last Visit, Next Action, Active Deals, Total Revenue, Machines, Last Order)
- **Timeline**: chronological activity feed from mockActivityLogs (icon + date + user + description)
- **Deals**: table of opportunities linked to this account from mockOpportunities
- **Visits**: mock visit records with date, salesperson, purpose, summary
- **Reports**: mock doctor feedback, competitor mentions, objections
- **Tasks**: mock tasks linked to this customer from mockWorkItems

### 4. Create `src/components/customer-card/CustomerRightPanel.tsx`

- Tabs: Devices | Consumables | Service | Purchases | Documents | Marketing
- **Devices**: mock installed machines (name, serial, install date, warranty)
- **Consumables**: cartridge usage mock data
- **Service**: PM visits, repairs mock data
- **Purchases**: purchase history with total lifetime revenue
- **Documents**: file list (contract, quotation, invoice) — display only
- **Marketing**: campaign participation mock data

### 5. Create `src/data/customerCardMockData.ts`

- Additional mock data for the Customer Card: installed devices, consumable usage, service history, visit records, purchase history, documents, marketing campaigns — all linked by account_id

### 6. Modify `src/App.tsx`

- Add route: `<Route path="/leads/:id" element={<CustomerCardPage />} />`

### 7. Modify `src/pages/LeadsPage.tsx`

- Change table row click from `openEdit(account)` to `navigate(/leads/${account.id})`
- Keep the edit dialog available via an "Edit" button on the Customer Card

## Design Approach

- White background, rounded cards with subtle shadows (`shadow-sm`)
- Use existing shadcn components: Card, Tabs, Badge, Table, Button, ScrollArea
- Icons from lucide-react for each section and tab
- Responsive: on smaller screens, stack columns vertically
- Back button to return to `/leads`

## Mock Data Strategy

All data is local mock — no database queries. Each panel references mock arrays filtered by `account_id`.