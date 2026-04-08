# Optima OS — CRM & ERP for Doublo Distribution Thailand

## Stack
- React 18 + TypeScript + Vite + Bun
- Supabase (auth + PostgreSQL + edge functions)
- shadcn/ui + TailwindCSS + Radix UI
- lucide-react for icons
- @tanstack/react-query for data fetching
- react-router-dom v6 for routing
- Built via Lovable, now continuing in Claude Code

## Business context
B2B medical device distribution CRM for Doublo (HIFU+RF device by Hironic Thailand).
Sales team covers geographic zones: BKK1, BKK2, BKK3, BKK4, BKK5.
Primary users: sales reps, sales managers, service technicians.

Key entities:
- Customer/Clinic (lead → customer lifecycle)
- Opportunity (sales pipeline with stages)
- Quotation → Contract → Payment (ERP flow)
- Install Base (Doublo device units placed at clinics)
- Cartridge / Consumables (สิ้นเปลือง sold per treatment)
- Service Ticket (maintenance, repair)
- Campaign (pre-CRM outreach tracking)
- Visit (field sales check-in and reports)

## Directory structure
src/
  components/
    layout/         ← AppLayout.tsx (sidebar nav), ChangePasswordDialog.tsx
    campaign/       ← Campaign Tracker components
    customer-card/  ← Customer profile components
    dashboard/      ← Dashboard widgets
    install-base/   ← Device install base components
    opportunities/  ← Pipeline list components
    opportunity-detail/ ← Detail page components
    payments/       ← Payment components
    quotations/     ← Quotation components
    ui/             ← shadcn/ui primitives
    ...
  pages/            ← 49 page components (one per route)
  hooks/            ← useMockAuth, useRolePermissions, etc.
  integrations/
    supabase/       ← client.ts, types.ts (auto-generated)
  types/            ← TypeScript type definitions
  lib/              ← utils.ts (cn helper)

## Key files to know
- src/components/layout/AppLayout.tsx  → sidebar nav, layout shell
- src/App.tsx                          → all route definitions
- src/integrations/supabase/client.ts  → Supabase client instance
- src/hooks/useMockAuth.ts             → auth state
- src/hooks/useRolePermissions.ts      → role-based nav visibility

## Current issues to fix (priority order)
1. SIDEBAR: 11 navGroups → reduce to 5 logical groups (see target below)
2. CHATBOT: ChatbotPage is standalone page → convert to FloatingCopilot panel in AppLayout
3. CONTEXT: No side peek panel → add CustomerSidePeek Sheet on OpportunityDetailPage
4. AI: No suggestions → add AiNextStepBanner on OpportunityDetailPage
5. UX: Page-per-entity navigation → reduce clicks with inline panels

## NavGroups target structure (5 groups)
Reduce from current 11 groups to these 5:

1. HOME
   - แดชบอร์ด        /
   - Optima AI       /chatbot

2. SALES PIPELINE
   - Campaign Tracker   /campaign-tracker
   - ลูกค้า             /leads
   - โอกาสขาย          /opportunities
   - สาธิตสินค้า        /demos

3. ERP / FINANCE
   - ใบเสนอราคา        /quotations
   - สัญญาซื้อขาย       /contracts
   - การชำระเงิน        /payments
   - คลังสินค้า         /inventory
   - พยากรณ์            /forecast
   - วิเคราะห์          /analytics

4. DEVICES & SERVICE
   - Install Base       /install-base
   - วัสดุสิ้นเปลือง    /consumables
   - ซ่อมบำรุง          /maintenance
   - QC สินค้า          /qc-stock

5. TEAM & OPS
   - แผนเยี่ยมรายสัปดาห์  /weekly-plan
   - เช็คอินเยี่ยมลูกค้า  /visit-checkin
   - รายงานเยี่ยมลูกค้า   /visit-reports
   - งาน                  /tasks
   - ปฏิทิน               /calendar
   - เช็คอินทำงาน          /work-checkin
   - สรุปการเข้างาน        /attendance
   - ตั้งค่า               /settings

## Coding conventions
- ALWAYS read the target file fully before editing
- ALWAYS check src/types/ for existing types before creating new ones
- Use existing shadcn components: Sheet, Dialog, Card, Badge, Skeleton, Button
- Use useQuery from @tanstack/react-query for ALL Supabase data fetching
- New components → src/components/{feature}/ComponentName.tsx
- Never delete existing route definitions in App.tsx
- Keep all existing Thai text labels exactly as-is
- Run: bun run type-check after every change to catch TS errors
- Supabase queries use: import { supabase } from '@/integrations/supabase/client'

## Anthropic API (for AI features)
Model: claude-sonnet-4-20250514
Endpoint: https://api.anthropic.com/v1/messages
Use for: FloatingCopilot chat, AiNextStepBanner, AI Quotation Draft
Pass current page context in system prompt for context-aware responses.
Thai language responses preferred for end users.

## FloatingCopilot spec (Task 2)
File: src/components/layout/FloatingCopilot.tsx
- shadcn Sheet, side=right, width 400px
- Floating trigger: bottom-right corner, z-50, fixed position
- Keyboard: Ctrl+K to toggle
- Context: useLocation() + useParams() → inject into system prompt
- System prompt template:
  "คุณคือ Optima AI ผู้ช่วย CRM สำหรับทีมขาย Doublo Thailand
   หน้าปัจจุบัน: {pathname}
   Context: {entityData}
   ตอบเป็นภาษาไทย กระชับ ตรงประเด็น"
- Add to AppLayout.tsx so it appears on all authenticated pages
- Keep /chatbot route as full-page fallback

## CustomerSidePeek spec (Task 3)
File: src/components/opportunity-detail/CustomerSidePeek.tsx
- Trigger: click customer name on OpportunityDetailPage
- shadcn Sheet, side=right, width 420px
- Show: customer info, last 3 quotations, installed devices, outstanding amount
- Use Skeleton loading while fetching
- "View full profile" link → navigate to /leads/{id}

## Commands
bun dev          → start dev server (http://localhost:5173)
bun run build    → production build
bun run type-check → TypeScript check (no emit)
bun run lint     → ESLint
