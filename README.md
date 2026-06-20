# AgentGuard Lab

AgentGuard Lab is a local-first launch-readiness console for AI agent workflows. It helps product, operations, security, and platform teams model autonomy, data exposure, tool access, approvals, audit depth, and fallback controls before an agent reaches production.

The project targets a current mainstream need: teams are moving beyond simple AI chat interfaces into agentic workflows, but they still need practical governance, risk scoring, and review artifacts that do not require sending sensitive planning data to another service.

## Features

- Workflow templates for procurement, support triage, and finance close use cases.
- Transparent risk score based on autonomy, data class, external actions, approval mode, audit level, injection exposure, and retention.
- Local persistence through `localStorage`; no backend or API key required.
- Actionable governance recommendations for human gates, audit trails, retention, hostile input, and kill switches.
- Markdown launch-review export for design reviews, compliance conversations, or GitHub issues.
- Responsive dark operations-console UI built for repeated use rather than a marketing landing page.

## Tech Stack

- React 19
- TypeScript
- Vite
- Lucide React icons
- Plain CSS with design tokens

## Run Locally

```bash
npm install
npm run dev
```

Build a production bundle:

```bash
npm run build
```

## Roadmap

- Add shareable JSON import/export.
- Add organization-specific control libraries.
- Add team review assignments and sign-off states.
- Add model/provider policy presets.
- Add optional encrypted local project files.

## License

MIT
