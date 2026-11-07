# Daily Topper

A study planner that turns a student's syllabus, confidence and exam dates into a daily plan that actually adapts. Built for the BharatCode Build League hackathon.

Daily Topper is a complete, demo-ready web app: a pre-loaded guest student (Riya), a real planner, quizzes that gate task completion, revision sheets, exam mode with backwards scheduling, progress analytics, six paper-notebook themes with matching study soundtracks, and six-language support. It runs with **zero setup** — no keys, no database, no build flags.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Open the app, press **Try as guest**, and you land on Riya's populated dashboard.

```bash
npm run build        # type-check (tsc -b) + production bundle
npm run preview      # serve the production build
npm run lint         # oxlint
```

Node 20+ is recommended. There are no required environment variables.

---

## 5-minute demo script

1. **Landing → Try as guest.** Riya's profile opens with a 6-day streak, 9 covered topics, quiz average 72%, and today's planned slots.
2. **Daily Tasks → Start.** The timer keeps running across pages (and after reload). *Skip* asks for a reason and the planner rebalances. A slot can only be marked done after the 5-question quiz; the result persists on screen.
3. **Study Plan.** Month / week / day views share the same slot store. Missed slots are auto-detected and requeued. Mobile shows an agenda instead of a grid.
4. **Subjects → Physics.** Add a subject, change confidence, upload a PDF (text is extracted in the browser with pdf.js), generate study notes, and toggle topics covered.
5. **Quizzes.** Build a custom quiz from subjects/topics, take it, read the improvement report, retry, or send weak topics into the plan.
6. **Progress.** Study-time area chart, completion pie, quiz trend, confidence bars, 12-week heatmap, and cached revision sheets with copy/print.
7. **Exam Mode.** One click loads a sample schedule, preview is editable, and the plan is rebuilt backwards from exam dates. Exit archives the plan; exams auto-end when their date passes.
8. **Settings.** Language (English, Hindi, Tamil, Telugu, Bengali, Marathi), reminders, export JSON, reset demo, reset all data, delete account, sign out.
9. **Mobile.** Resize below 768px: sidebar becomes bottom tabs, dialogs become bottom sheets, tables become cards, calendar becomes an agenda. Nothing scrolls horizontally at 360px.

---

## What's inside

| Area | Highlights |
| --- | --- |
| Auth | Email/password local accounts, prominent Guest mode, protected routes redirect to `/auth` |
| Onboarding | 4 steps: identity, academics, preferences, subjects — then the first plan is generated |
| Dashboard | Greeting, streak, goal progress, today's tasks, weak topics, exam countdown, quick actions |
| Subjects | Add/delete subjects, confidence rating, detail page with files, study notes and topics |
| Daily Tasks | Persistent timer, content drawer, skip reasons, done gated by a 5-MCQ quiz |
| Study Plan | Month/week/day, mobile agenda, legend, shared slots, missed/skip recovery |
| Progress | Recharts analytics, heatmap, covered topics, revision sheets with copy/print |
| Quizzes | Setup, attempt, result, improvement report, retry, history, add weak topics to plan |
| Exam Mode | Parse or enter a schedule, editable preview, backwards planning, archive, auto-end |
| Settings | Profile, study preferences, language, reminders, export, reset, delete, logout |

### Stack

React 19 + TypeScript + Vite, Tailwind CSS with CSS-variable tokens, hand-written shadcn-style components on Radix primitives, lucide-react icons, React Router, Zustand, Recharts, date-fns, Framer Motion, zod and react-i18next. PDF text extraction uses pdf.js.

The code is organised by feature:

```
src/
  components/    ui/, layout/, shared/ — design system and app shell
  features/      landing, auth, onboarding, dashboard, subjects, tasks,
                 plan, progress, quizzes, exam, settings
  services/      aiService, plannerService, repository, seed, knowledge, fileStore
  store/         Zustand app store (session, data, actions)
  lib/           i18n, utils, file helpers, extraction, feedback
api/ai.ts        serverless AI proxy (provider key stays server-side)
```

---

## Zero-setup data layer

`src/services/repository.ts` exposes one `AppRepository` interface with two adapters:

- **Local (default)** — state in `localStorage`, file blobs in IndexedDB. Guest mode and local accounts work offline.
- **Supabase** — selected automatically when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present. Uses Supabase Auth (email + password, with email confirmation), a single JSONB `app_state` row per user, and a private `uploads` storage bucket.

Persistence is debounced. Local keys:

| Key | Contents |
| --- | --- |
| `dt-guest-session-v1` / `dt-data-guest` | Guest session and Riya's seeded data |
| `dt-accounts-v1` / `dt-session-v1` | Local accounts (salted SHA-256) and session |
| `dt-data-<userId>` | Per-account app data |
| `dt-ai-cache-v1` | Validated AI responses, capped at 160 entries |

Local accounts are a demo convenience, not production auth. Use the Supabase adapter for real accounts.

### Supabase setup (optional)

1. Create a project and enable the **Email** provider (enabled by default).
2. Under **Authentication → URL Configuration**, set the Site URL to your app and add `<your-app-origin>/auth` to the redirect URLs, e.g. `http://localhost:5173/auth`.
3. Leave **Confirm email** on for real verification. Signup now shows a "Check your inbox" screen; opening the emailed link returns to `/auth`, restores the session and continues onboarding. With confirmation off, users log straight in.
4. Run this in the Supabase SQL editor, then set the two `VITE_SUPABASE_*` variables:

```sql
create table if not exists public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "own app state" on public.app_state;
create policy "own app state" on public.app_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

drop policy if exists "own uploads" on storage.objects;
create policy "own uploads" on storage.objects
  for all using (bucket_id = 'uploads' and owner = auth.uid())
  with check (bucket_id = 'uploads' and owner = auth.uid());
```

The built-in email service is limited to **2 emails per hour** per project; signup attempts beyond that show a "Too many attempts" message until the window resets. Configure custom SMTP under **Authentication → Emails** before sharing the app with real users.

If Supabase is unreachable the session simply stays local; the app never hard-fails on a network call.

---

## AI integration

Every AI call lives in **`src/services/aiService.ts`**. The browser never sees a provider key.

```
UI → aiService → POST /api/ai → serverless route → LLM
                       │
                       └─ no key / error / bad JSON → deterministic mock
```

- `api/ai.ts` is a Vercel-style handler that reads `OPENAI_API_KEY` server-side, validates input size, asks for `response_format: json_object`, and returns `{ text }`. It answers `503 {error:'no_key'}` when unconfigured.
- `vite.config.ts` provides the same `/api/ai` route during development, so AI can be tested locally without a separate server.
- `aiService` validates every response with zod, retries once, caches successes, and on any failure returns a **deterministic, seeded mock** built from the bundled topic knowledge base. The demo is never blocked by a missing key, rate limit or invalid model output.
- PDF text is extracted client-side with pdf.js. Audio/video uploads use `VITE_TRANSCRIBE_ENDPOINT` when set, otherwise a mock transcript.

AI surfaces: topic extraction, study content per subject/slot, quiz generation, improvement reports, revision sheets, exam schedule parsing, syllabus parsing, and daily-priority refinement.

### Enabling real AI

Copy `.env.example` to `.env.local`:

```bash
VITE_AI_ENABLED=true
VITE_AI_ENDPOINT=/api/ai
OPENAI_API_KEY=sk-...        # server-side only, never a VITE_ variable
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://api.openai.com/v1
```

Deploy the frontend and `api/ai.ts` together (Vercel picks it up automatically). On another host, point `VITE_AI_ENDPOINT` at any endpoint that accepts `{ system, user }` and returns `{ text }`.

---

## Planner logic

`generatePlan` in `src/services/plannerService.ts` is deterministic and explainable:

- Priority = self-rated weakness + quiz weakness + backlog + exam proximity + revision due.
- Slots fit within the student's daily hours and preferred study window, respect slot length, weekly off day and busy slots (done/running sessions).
- Subjects rotate so one strong subject cannot starve the rest; topics rest at least a day.
- Coverage is stamped so revision is scheduled after a delay, and exam mode allocates backwards from exam dates.
- The plan is rebuilt on skip, missed slot, add/delete subject, rating change, quiz submission, exam change and settings change — while preserving completed and running work.

Missed slots are detected on load and requeued with their topics. Streaks count consecutive study days with at least one completed slot.

---

## Design and accessibility

- Paper notebook palette: paper `#fbfaf4`, ruled blue `#b9d3e6`, margin red `#e8928f`, ink `#23325e`, highlighter `#ffe45c`, tape `#f3d9a4`.
- Six named themes driven by CSS variables, all reachable from the palette menu beside the streak. **Paper & Ink** is the default white notebook; **Forest Notes**, **Honey & Bee**, **Lavender Press** and **Ocean Notes** recolour the same ruled-paper system; **Midnight Ink** is the optional chalk-on-blackboard dark theme. The choice persists, and charts, doodles, focus rings and hard shadows adapt.
- Each theme has its own nature-led study soundscape, synthesised live with the Web Audio API — no audio files, no licensing: *Rain on Paper* (soft rain on a quiet window with a rare distant bird), *Forest Birdsong* (wind, leaves and woodland calls), *Meadow & Bees* (gentle breeze, grass rustle and far-off bees), *Breeze & Chimes* (airy wind chimes), *Ocean Waves* (rolling surf and gulls) and *Night Crickets* (night breeze with cricket pulses). The ambience carries each theme while the tonal layer stays sparse, so no two soundscapes sound alike. The music button beside the theme menu starts/stops it, switching themes crossfades to the new patch, and hovering (or focusing) the button reveals a volume slider. The volume level persists, audio only starts after a click, and it stops on logout.
- Ruled background, handwritten type and taped cards stay consistent across themes.
- Mobile-first: bottom tabs under 768px, sidebar above, bottom-sheet dialogs on small screens, tables become cards, calendar becomes agenda.
- 44px touch targets, focus-visible rings, labelled controls, `aria-label`s on navigation, keyboard-operable Radix primitives, reduced horizontal overflow at 360px.
- Loading skeletons, empty states, toasts and confirmation dialogs for destructive actions.

---

## Acceptance checklist

- [x] Guest login with pre-loaded Riya profile
- [x] 4-step onboarding creates a plan
- [x] Add, delete and re-rate subjects
- [x] Upload and view files; generate study notes
- [x] Start, skip (with reason) and finish tasks — finishing requires a quiz
- [x] Plan edits stay in sync with the calendar and today's tasks
- [x] Missed slots are detected and requeued
- [x] Revision sheet generation, copy and print
- [x] Custom quizzes with improvement report, retry and weak-topic injection
- [x] Exam Mode enter, edit, exit/archive and auto-end
- [x] Language switch persists
- [x] Responsive layouts at 360, 768 and 1280+
- [x] `npm run build` passes with no TypeScript errors

---

Built for the BharatCode Build League. No API keys, accounts or setup are required to explore the full experience.
