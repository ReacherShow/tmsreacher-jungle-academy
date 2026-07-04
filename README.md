# TMS REACHER: Jungle Academy

An adaptive jungle adventure where kids build mathematical understanding through play, visual models, retrieval practice, review, and rewards.

## v1.5 Learning Loop

This build adds:

- Four visually distinct Purple bandanas with increasing Shiny Rock prices
- Cosmetic equipment slots so Purple's bandana and Monke's gear can appear together
- A smaller full-body Purple who still walks, jumps, spins, and waves
- Large green check and red X answer feedback
- The complete equation after both correct and incorrect attempts
- Guided correction: study a strategy, then retry the same problem
- Multiple learning strategies for each problem type
- Interactive multiplication rows, skip-count paths, and break-apart equations
- A short metacognitive reflection asking which strategy helped
- Spaced review dates that bring facts back over increasing intervals
- A 10-gate daily mission progress track
- Updated Vite dependency with a clean production build and zero high-severity audit findings at verification time

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Netlify

- Base directory: leave blank
- Build command: `npm run build`
- Publish directory: `dist`

Upload the project contents to the GitHub repository root. Do not upload `node_modules`, `dist`, or the ZIP file.

## Product direction

The game should teach through a cycle of:

1. Retrieve an answer.
2. Receive unmistakable feedback.
3. See and manipulate a useful representation.
4. Retry the same idea.
5. Reflect on which strategy helped.
6. Meet the skill again later through spaced review.

See `docs/LEARNING-DESIGN.md` and `docs/SECURITY-PRIVACY-PLAN.md`.
