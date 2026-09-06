# Orbit Desk

Orbit Desk is a local-first personal operating system for daily planning, study tracking, maintenance, and approval-gated app actions.

## Run it

```bash
npm install
npm run dev
```

## Android alarms

Orbit includes Android-only Capacitor Local Notifications. No iOS platform is included.

```bash
npm run android:sync
npm run android:open
```

Enable alarms inside the app and grant Android notification permission. Scheduled todos and events can fire while Orbit is closed. Android may still apply battery-optimization rules, so allow Orbit to run alarms reliably in system settings.

## Data strategy

Supabase is the best fit for the next production step. Orbit needs relational data for tasks, schedules, study sessions, approvals, activity logs, and connected accounts. Supabase provides Postgres, row-level security, authentication, realtime updates, and server-side functions in one stack.

- **Supabase:** recommended for the core database and user accounts.
- **Firebase:** a good alternative for a mobile-first product, but its document model is less natural for reporting across schedules, approvals, and activity logs.
- **Pinecone:** not a primary database. Use it later only for semantic search across notes, messages, and study material.

For the Mess-21 ecosystem connection, add its Supabase URL and anon key as `VITE_MESS21_SUPABASE_URL` and `VITE_MESS21_SUPABASE_ANON_KEY`. Keep those separate from Orbit's own `VITE_SUPABASE_*` values. The integration uses the signed-in Firebase UID as `expenses.added_by`, inserts into Mess-21's `expenses` table, and reads the inserted row back before reporting success.

The current UI uses `src/lib/storage.js` as a local-first adapter. Replace its implementation with Supabase queries once authentication and the schema are ready.

Run `supabase/schema.sql` in the Supabase SQL editor. Because login is handled by Firebase, configure Firebase as a third-party JWT provider in Supabase before enabling the RLS policies. The client forwards the current Firebase ID token to Supabase; Supabase then maps its `sub` claim to `auth.uid()`.

## Safety boundary

The app treats actions that change external data as approvals. Every database mutation helper requires `confirmed: true`; calls without it throw before reaching Supabase. The AI approval button is the only current path that supplies this confirmation. Reads do not require confirmation. The messenger connector remains intentionally unimplemented until the core planner, monitoring, and approval flows are stable.

`plyer` is not needed for this app. Orbit runs in React in the browser and Android, so browser notifications and Capacitor Local Notifications are the appropriate notification APIs. A Python `plyer` layer would only make sense if Orbit later adds a Python desktop service.
