# Brief 09 (second pass): Anthropic's late-Sep/Oct 2026 claude.dev guides

**Method note.** These three posts are hosted on claude.dev, which this environment's network policy blocks. Their existence, titles, dates and URLs come from the claude.com blog index, which was fetched directly on 2026-10-11 ([claude.com/blog](https://claude.com/blog)). Their content comes only from search-result summaries of third-party write-ups, so treat every detail below as **secondary**.

## 1. "Building effective agent automations" (claude.dev, 8 Oct 2026)

- **URL:** https://claude.dev/blog/building-effective-agent-automations/ (listed on claude.com/blog; not fetched).
- **What it is:** a walkthrough of a reference implementation, a scheduled Claude Managed Agents automation. It is a "daily brief" agent that reads Slack and GitHub and posts one short summary to Slack each weekday. The post sets out **six rules** for avoiding common failure modes.
- **The six rules, as a third-party guide lists them** ([aicatchup](https://aicatchup.com/practices/scheduled-claude-agent-automations), secondary):
  1. Keep **bookmarks**, so each run knows where the last one stopped.
  2. **Unreadable is not quiet**: treat a failed source read as a failure, not as "nothing happened".
  3. **Re-check before posting**: verify each item against its live source.
  4. **Confirm, then record**: update state only after the action succeeds.
  5. Keep **preferences read-only**.
  6. Apply **least privilege**.
- **Scheduled Managed Agents** (secondary):
  - They run on a cron schedule with minute-level granularity and bill to your API organization, with a per-run dollar cap.
  - Each time the schedule fires, the agent starts a fresh session, completes its task, and exits ([inventivehq](https://inventivehq.com/blog/claude-managed-agents-scheduled-routines)).
- **Which surface to use:** the guide suggests **Claude Code routines** for repository work covered by a Claude plan, and **Managed Agents scheduled deployments** for automations that are products in their own right (secondary).

## 2. "Claude Code in the cloud: a field guide to cloud sessions" (claude.dev, 6 Oct 2026)

- **URL:** https://claude.dev/blog/claude-code-in-the-cloud/ (listed on claude.com/blog; not fetched).
- **What it covers:** what changes when Claude Code runs on its own machine, the workflows that benefit, and connecting GitHub.
- **Facts from secondary write-ups:**
  - Each cloud session starts from a fresh clone, so user-level config does not carry over. Project-level CLAUDE.md, rules, skills and agents do, so **commit shared configuration to the repo**.
  - `--teleport` pulls a cloud session down into your terminal. You cannot push an existing terminal session up; `claude --cloud "task"` starts a fresh cloud session instead.
  - The cloud VM pulls the **remote branch**, not your local working tree, so push local commits first.
  - Without a remote or the GitHub App, Claude Code can upload a bundle, which excludes untracked files.
  - Sources: [SmartScope](https://smartscope.blog/en/blog/claude-code-cloud-sessions-credit-2026/), [wmedia](https://wmedia.es/en/tips/claude-code-cloud-sessions-from-browser), [toolnavs (FR)](https://toolnavs.com/fr/article/2359).
- **Trial credit (single secondary source, unverified):** a one-time cloud-session credit of $100 for Pro and $250 for Max, announced 23 Sep 2026, claimable until 7 Oct and expiring 4 Nov.

## 3. "Automating eval design and hillclimbing with Claude" (claude.dev, Lance Martin, ~28 Sep 2026)

- **URL:** https://claude.dev/blog/automating-eval-design-and-hillclimbing/ (listed on claude.com/blog; not fetched).
- **What it adds** to the `claude-api` skill:
  - `/claude-api build-eval` interviews you and builds an eval inside your codebase.
  - **`hillclimb`** loops: make one change, score it, and keep it only if the score rises.
  - It holds out a test set the hillclimber never reads, and reverts patches that only help the training split.
- **Reported results** (vendor-reported, via secondary write-ups):
  - A customer-support eval became more accurate at roughly **one-fifth the cost per ticket**.
  - Claude improved Anthropic's own `claude-api` skill from about **66% to 88%**.
- **Caveat** from the write-ups: inspect the cases, the grader and the transcripts before trusting a reported gain.
- Sources: [The Neuron](https://www.theneuron.ai/explainer-articles/anthropic-built-a-better-way-to-improve-ai-agents-without-fooling-yourself/), [aicatchup](https://aicatchup.com/news/claude-code-automated-evals-hillclimb), [Arize](https://arize.com/?p=32658).
- **Related Code with Claude session:** ["You should build evaluation engineers instead of evaluation sets"](https://claude.com/code-with-claude/session/sf-ext-you-should-build-evaluation-engineers-instead-of-evaluation-sets).

## Why these matter for the report

- **Automations:** Anthropic's own rules for unattended agents (bookmarks, "unreadable is not quiet", re-check before acting, confirm then record, least privilege) generalize to `/loop`, routines and home cron agents (§6.7, §8).
- **Evals:** `build-eval` + `hillclimb` productizes the "build evals from your failures; hold out a test set" advice (§4.1 principle 9; §12 step 21).
- **Cloud sessions:** they reward committing shared configuration (CLAUDE.md, rules, skills, agents) to the repo. Remember to push before starting a cloud session.
