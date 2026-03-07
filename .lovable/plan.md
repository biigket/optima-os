

## Problem Analysis

The current Notes display has these UX issues:
1. **AI talking points in Notes** are plain text dumped as a single paragraph (e.g., `💡 คำแนะนำ: 1. ... 2. ... 3. ...`) — hard to read
2. **Notes textarea** in the form is a basic yellow box with no structure
3. **Notes in History Timeline** render as a single `<p>` tag — no formatting for bullet points or sections
4. **No rich formatting** — users can't distinguish between their own notes vs AI-generated talking points

## Plan

### 1. Improve AI Talking Points storage format
- When `applyAiSuggestion` fills Notes, use proper line breaks with markdown-like formatting instead of cramming into one block
- Store talking points separately from user notes using a clear separator (e.g., `---`)

### 2. Render Notes with structured formatting in History Timeline
- In `HistoryTimeline.tsx` `ActivityItem`, parse the notes content:
  - Detect lines starting with numbers (`1.`, `2.`) or bullets (`•`, `-`) and render as a proper `<ul>/<ol>` list
  - Detect `💡 คำแนะนำ:` header and render it as a styled section header
  - Preserve line breaks with `whitespace-pre-line`
- Wrap the notes block in a cleaner card-style container with proper padding and visual hierarchy

### 3. Improve Notes input UX in ActivityForm
- Add a label section divider between "user notes" and "AI talking points" when AI content is present
- Make the Notes textarea taller with `whitespace-pre-line` rendering
- Add a small toolbar or section header when AI content is populated (e.g., a light purple header saying "💡 AI คำแนะนำ" above the AI portion)

### 4. Better visual rendering in the timeline note bubble
- Replace the single `<p>` with a structured block:
  - Numbered items render as an ordered list with left border accent
  - Each point gets its own line with proper spacing
  - Use subtle background differentiation between user notes and AI-generated content

### Files to modify
- `src/components/opportunity-detail/ActivityForm.tsx` — Notes section UI, AI suggestion apply logic
- `src/components/opportunity-detail/HistoryTimeline.tsx` — Notes rendering in ActivityItem

