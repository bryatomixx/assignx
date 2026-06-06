# AssignX | Agency Partners Academy

A Skool-style learning academy for AssignX agency partners, styled after
[assignx.ai](https://assignx.ai) (purple/magenta, Inter Tight + Inter).

> Frontend-only with a mock data layer (`lib/mock` + `lib/store`) backed by
> `localStorage`, designed to be swapped for a real backend (e.g. Supabase) later.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 · Framer Motion · lucide-react

## Features

- **Free course — "30 Days Challenge"**: Orientation + 4 weeks of lessons, each
  with material and homework (nested bullets + links).
- **Locked partner modules**: shown with a padlock; access granted per-member.
- **Lessons**: video placeholder, notes, resources, "Mark as complete", and
  "Mark homework as done".
- **Code login** (`/login`): demo member code `1234`, admin code `9999`.
- **Admin panel** (`/admin`, not linked publicly): track each partner's progress
  and homework, unlock/lock courses (all or individually), pause/reactivate, and
  remove partners. ("Send reminder" is a placeholder.)

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

Use the sidebar **"Switch user"** to move between admin and members, and
**"Reset demo"** to restore the seed data.
