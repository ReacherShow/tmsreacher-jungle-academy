# TMS REACHER: Jungle Academy v1.6

A Netlify-ready React/Vite learning game focused on adaptive, visual, and playful elementary mathematics.

## What is new

- Guided 10-gate expedition: warm up, learn, practice, apply, Teach Purple, and finish
- Correct/incorrect feedback replaces the question in place, so the next action is immediately visible
- Skip-for-now flow that schedules the skill for supported review
- Concrete–Pictorial–Abstract learning strip
- Interactive equal-group counters
- Repeated-jump number line
- Dynamic arrays and 10 × 10 multiplication-pattern grids
- Friendlier “start with 5/10 groups” model instead of a dense break-apart equation
- Application story challenges
- Teach Purple explanation challenges
- Mastery tracking across recall, visual modeling, application, explanation, and retention
- Redesigned avatar shop with categories, item tiles, a live preview, and a clear buy/equip action
- Curriculum review plan at `docs/CURRICULUM-REVIEW.md`

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Netlify settings:

- Build command: `npm run build`
- Publish directory: `dist`
- Base directory: leave blank

Do not upload `node_modules`, `dist`, or a package lock generated through a private package registry.
