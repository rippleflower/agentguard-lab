# Product Brief: AgentGuard Lab

## Why this project

AI agent adoption is shifting from demos into operational workflows. The gap is not another chat UI; the gap is a lightweight way to decide whether an agent should be allowed to act, what data it may touch, which tools it can invoke, and which controls need to exist before launch.

AgentGuard Lab focuses on that review moment. The product is now framed as a decision tool, not a generic risk dashboard: the user should be able to tell whether a workflow is ready for a limited pilot, which risks are blocking launch, and which controls should be added next.

## Target users

- Product managers preparing an agent pilot.
- Security reviewers checking data exposure and tool permissions.
- Operations teams converting manual workflows into assisted workflows.
- Platform teams creating internal AI governance habits.

## Core loop

1. Pick or create an agent workflow.
2. Describe its mission and owner.
3. Set autonomy, access, data sensitivity, approvals, logging, and fallback controls.
4. Review readiness score, risk-driver bars, and recommended controls.
5. Switch between English and Chinese when reviewing with different teams.
6. Export a Markdown launch review.

## Design stance

The UI is intentionally an operations console, not a landing page. It prioritizes dense scanning, clear status states, fast editing, and durable visual hierarchy. The aesthetic direction is industrial, dark, and controlled, matching the risk/governance domain.

## Latest usability improvements

- The hero now states the concrete goal: decide whether an AI agent can enter pilot.
- A goal card lists the three decisions the tool is designed to answer.
- The insights panel includes visual risk-driver bars so the score is explainable at a glance.
- The interface can switch between English and Chinese, and the selected language is saved locally.
