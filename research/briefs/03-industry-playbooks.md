# Industry playbooks for agentic coding outside Anthropic: OpenAI, Google, Microsoft/GitHub, AWS, Meta, Cursor, Cognition, tool vendors and large engineering orgs (state as of 2026-10-11)

**Evidence tags used throughout**
- **[P✓]**: primary source; I fetched and read its content this session.
- **[P~]**: primary URL seen in search results. I know its content only from search snippets or summaries.
- **[S]**: secondary source seen this session (press, newsletter, aggregator, third-party blog).
- **[K]**: from my prior knowledge (training data to about mid-2026) and **not re-verified this session**. Under the citation rules no URL is given for these, and the important ones are listed again in §7.

**Outcome tags**
- *(vendor-reported)*: a vendor making claims about its own product.
- *(self-reported)*: a company describing its own internal use.
- *(independent)*: a third party.

**Limitations of this pass.** The session's shared web-search budget ran out after about 33 searches. WebFetch could only resolve github.com and raw.githubusercontent.com; openai.com, cursor.com, arxiv.org, github.blog, docs.github.com and others failed DNS. Coverage is therefore uneven:
- **Strongest:** OpenAI, Google/DORA, GitHub/Microsoft and AWS, because most of their primary docs live in GitHub repos.
- **Weakest:** Cursor, Cognition, Stripe, Spotify, StrongDM, Shopify, Airbnb, Uber and Coinbase. These lean heavily on [K] and need a verification pass (see §7).

---

## 1. Top takeaways

1. **"Harness engineering" is the main 2026 frame.** Engineers stop writing code and instead design the environment: context, tools, constraints and feedback loops. OpenAI's internal experiment ran five months, shipped an internal beta with no hand-written code, and produced about 1M lines of code. The team grew from 3 to 7 engineers and averaged about 3.5 PRs per engineer per day *(self-reported)*. [openai.com/index/harness-engineering](https://openai.com/index/harness-engineering/) (Feb 2026)
2. **The root instruction file should be a map, not an encyclopedia.** OpenAI tried "one big AGENTS.md" and abandoned it. They moved to an AGENTS.md of about 100 lines that serves as a table of contents into a structured `docs/` system of record, backed by custom linters and structural tests whose error messages are written for the agent. [secondary eval of the post](https://raw.githubusercontent.com/FlorianBruniaux/claude-code-ultimate-guide/main/docs/resource-evaluations/2026-02-11-openai-harness-engineering.md)
3. **AGENTS.md is now the de facto cross-vendor standard.** OpenAI donated it to the Linux Foundation's Agentic AI Foundation (AAIF) on 9 Dec 2025, alongside MCP and goose. The agents.md site lists 23 compatible tools and says "used by over 60k open-source projects." Precedence rule: "The closest AGENTS.md to the edited file wins; explicit user chat prompts override everything." [agents.md FAQ source](https://raw.githubusercontent.com/agentsmd/agents.md/main/components/FAQSection.tsx), [OpenAI AAIF post](https://openai.com/blog/agentic-ai-foundation)
4. **Put only non-inferable facts in context files.** Addy Osmani (Google) argues against `/init`-generated files, citing ETH Zurich's AGENTS.md study: LLM-generated files cut task success by about 2–3% and raised cost by 20% or more, while developer-written files added about 4%. (These figures come via a secondary digest. A separate digest of the paper later retracted its own summary numbers pending a re-check of the paper's sections 4.1–4.3, and results vary by agent and dataset, so treat them as preliminary.) [Addy anti-/init summary](https://raw.githubusercontent.com/FlorianBruniaux/claude-code-ultimate-guide/main/docs/resource-evaluations/076-addy-osmani-agents-md-init-antipattern.md), [arXiv 2602.11988](https://arxiv.org/html/2602.11988v1)
5. **For knowledge the agent must have, a static index beat on-demand skills.** In Vercel's eval of 19 Next.js 16 tasks, an 8KB docs index in AGENTS.md passed 100%. Skills scored 53% by default (no better than the 53% baseline) and 79% with explicit "use the skill" instructions, mainly because skills often weren't invoked *(vendor eval, small n)*. The 56% figure is ambiguous across retellings: the digest says "auto-invoked only 56%"; my recollection of the original is "never invoked in 56% of cases". [Vercel blog](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals) (Jan 2026)
6. **Use the tools the model was trained on.** OpenAI's Codex prompting guide (gpt-5.3-codex):
   - use the exact `apply_patch` implementation and `rg`; batch and parallelize reads;
   - default to `medium` reasoning, `high`/`xhigh` only for the hardest work;
   - remove prompting for upfront plans and preambles;
   - truncate tool output to about 10k tokens, keeping head and tail.

   [Codex Prompting Guide](https://raw.githubusercontent.com/openai/openai-cookbook/main/examples/gpt-5/codex_prompting_guide.ipynb)
7. **Agents need to verify their own work.** GitHub's official guidance: "If the agent can build, test, and validate its changes in its environment, it's more likely to produce mergeable pull requests." Pre-install dependencies with `copilot-setup-steps.yml` rather than letting the agent discover them "by trial and error." [GitHub docs](https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/cloud-agent/get-the-best-results.md)
8. **Review is now the bottleneck, and vendors are adding tooling for it.**
   - GitHub ships `gh stack` for stacked PRs ("Review quality also degrades as pull request size increases").
   - It publishes an AI-specific review checklist ("Be skeptical of code that 'looks right' but doesn't match your intent").
   - Copilot CLI added a cross-model "rubber duck" critic.

   [stacked PRs](https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/stack-ai-generated-code-in-pull-requests.md), [rubber duck](https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/copilot-cli/rubber-duck.md)
9. **OpenAI's "software factory" uses risk-tiered agent review after merge.** It runs parallel domain review agents, a mandatory human only for high-risk changes, per-change deploy agents, and "Perf Factory" agents that fix production regressions. All figures are self-reported, and no defect or change-failure rates are published. [Pragmatic Engineer](https://newsletter.pragmaticengineer.com/p/openai-software-factory) (15 Sep 2026)
10. **Agentic usage is compounding** (OpenAI-data paper):
    - Codex active users grew more than 5x in H1 2026.
    - More than 10% of users run 3 or more concurrent agents a week.
    - 26.6% use skills.
    - The share of users submitting tasks estimated at more than 8 human-hours rose about 10x.

    [arXiv 2606.26959](https://arxiv.org/abs/2606.26959) (Jun 2026)
11. **Google: AI-generated share is rising fast, but velocity gains are modest.** Pichai: about 75% of new code is AI-generated and engineer-approved (Apr 2026), up from 25% in Oct 2024. Google's own RCT found about 21% faster task time (n=96, wide CI), and Pichai has cited about 10% engineering velocity as the metric that matters. [Semafor](https://www.semafor.com/article/04/24/2026/google-ceo-says-75-of-companys-new-code-is-ai-generated), [RCT arXiv](https://arxiv.org/abs/2410.12944v3)
12. **DORA: AI amplifies whatever system it lands in.** In 2025, 90% of respondents used AI (+14 points), throughput improved but instability still rose, and seven "AI Capabilities" amplify the gains:
    - clear AI stance
    - healthy data ecosystems
    - AI-accessible internal data
    - strong version control
    - small batches
    - user-centric focus
    - quality internal platforms

    The 2026 ROI report models a J-curve dip, which DORA calls "tuition". [blog.google DORA](https://blog.google/innovation-and-ai/technology/developers-tools/dora-report-2025/), [DORA ROI](https://cloud.google.com/resources/content/dora-roi-of-ai-assisted-software-development)
13. **Spec-driven development is now mainstream tooling:**
    - GitHub spec-kit: about 141k stars, constitution → specify → plan → tasks → implement → converge.
    - AWS AI-DLC: 5 phases, 33 stages, approval gates, a 118-event audit trail, runs in Claude Code, Codex, Cursor, Copilot and Kiro.
    - Kiro Specs.
    - Google Conductor ("Measure twice, code once").

    [spec-kit](https://github.com/github/spec-kit), [AI-DLC](https://github.com/awslabs/aidlc-workflows)
14. **Large orgs converge on background agents started from where work lives** (Slack, issues, Linear boards), running in isolated sandboxes and returning PRs with "proof of work":
    - OpenAI open-sourced Symphony (Linear board → isolated autonomous runs → CI status, review feedback, walkthrough videos).
    - Ramp's Inspect inspired an open-source clone.

    [openai/symphony](https://github.com/openai/symphony), [Ramp post](https://builders.ramp.com/post/why-we-built-our-background-agent)
15. **Guardrails are least privilege plus normal repo governance.** By default the Copilot agent "can't push to a default branch or merge pull requests," is subject to rulesets, cannot read Actions secrets, and runs on fresh VMs. Protect agent config files with CODEOWNERS. [GitHub guardrails](https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/cloud-agent/build-guardrails.md)
16. **Continuous "garbage collection" loops are a first-class practice.** OpenAI runs doc-gardening agents and quality grades. GitHub Agentic Workflows run on read-only tokens, with "safe outputs" as the only writes and a per-run credit cap (`max-ai-credits`, default 1,000 AIC = $10). [GitHub Agentic Workflows](https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/about-github-agentic-workflows.md)
17. **Turn feedback into infrastructure.** Ryan Lopopolo, author of the OpenAI harness post: "Stable lessons move into their earliest durable owner." His playbook runs baseline → earliest failed handoff → smallest owning fix → fresh rerun → retain, revise or remove. [lopopolo/harness-engineering](https://github.com/lopopolo/harness-engineering/tree/trunk/docs)
18. **Encode taste as lint rules, not prose.** Factory published its agent-steering ESLint rules: file organization, test-file requirements, structured logging, API middleware. It notes that "All code in this repository is fully AI-generated," and tells readers to build their own rules. [Factory-AI/eslint-plugin](https://github.com/Factory-AI/eslint-plugin)
19. **Single-agent vs multi-agent is the biggest open disagreement.**
    - Toward parallelism: Copilot `/fleet`, Antigravity's Manager view, and Codex users running 3+ agents.
    - Toward one agent: Lopopolo's "Give one agent the whole job," and Cognition's "Don't build multi-agents" [K].
    - OpenAI's Codex lead observed that longer-running agents lead people to run *fewer* parallel tasks.

    [Pragmatic Engineer factory summary](https://github.com/FlorianBruniaux/claude-code-ultimate-guide/blob/main/guide/workflows/agentic-software-factories.md)
20. **Memory is becoming verifiable, not just persistent.** Copilot Memory stores repository facts "with citations pointing to the code that supports them," re-checks them against the current branch before use, and deletes unused facts after 28 days. [Copilot Memory](https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/copilot-memory.md)

---

## 2. Detailed findings

### 2.1 OpenAI (Codex CLI, IDE, cloud and app; AGENTS.md; harness engineering)

**Harness engineering (Ryan Lopopolo, 11 Feb 2026).**
- **The experiment.** A five-month internal experiment built and shipped an internal beta with no manually written code. Codex wrote application logic, CI configuration and observability tooling. The post estimates about a tenth of the hand-coding time and roughly 1M lines of code [P~] [openai.com](https://openai.com/index/harness-engineering/); [InfoQ](https://www.infoq.com/news/2026/02/openai-harness-engineering-codex) [S].
- **Throughput (secondary sources only).** About 1,500 PRs. The team grew from 3 to 7, averaging about 3.5 PRs per engineer per day and rising as it grew. These figures are *self-reported*; the 1,500 PR total is not confirmed against the post [S] [alexlavaee.me](https://alexlavaee.me/blog/openai-agent-first-codebase-learnings/), [yage.ai](https://yage.ai/share/harness-engineering-survey-en-20260312.html).
- **Context architecture.**
  - The team abandoned a monolithic AGENTS.md because it "crowds out the task, the code, and the relevant docs."
  - It now uses an AGENTS.md of about 100 lines as a map into `docs/`: `design-docs/`, `exec-plans/` (`active/`, `completed/`, tech-debt tracker), `generated/`, `product-specs/`, `references/`, plus `ARCHITECTURE.md` and `SECURITY.md`.
  - Principle: "What the agent can't see doesn't exist."
  - Sources: [P~] snippet, plus a secondary evaluation [S] ([eval](https://raw.githubusercontent.com/FlorianBruniaux/claude-code-ultimate-guide/main/docs/resource-evaluations/2026-02-11-openai-harness-engineering.md)).
- **Mechanical enforcement.**
  - Custom linters and structural tests, plus a small set of "taste invariants," with lint error messages written to be readable by the agent.
  - A layered domain architecture (Types → Config → Repo → Service → Runtime → UI) is enforced by lints from day one [S].
  - "Golden principles" are opinionated, mechanical rules such as preferring shared utilities and validating data at boundaries. Recurring background agents scan for drift, update quality grades (`QUALITY_SCORE.md`), and open small refactor PRs. A doc-gardening agent opens PRs when docs drift from code [P~/S].
- **Legibility to the agent.**
  - Codex drives the UI through the Chrome DevTools Protocol (screenshots, DOM, flows).
  - Each git worktree gets its own ephemeral logs/metrics/traces stack (Vector, VictoriaLogs/Metrics, a traces backend), which the agent queries with LogQL, PromQL and TraceQL. This is reported by one secondary source, so treat it as lower confidence [S].
- **Review and merge.**
  - Codex reviews its own change locally and requests more agent reviews locally and in the cloud. It responds to human or agent feedback and iterates until the agent reviewers are satisfied; the post calls this a "Ralph Wiggum Loop."
  - "Humans may review pull requests, but aren't required to… we've pushed almost all review effort towards being handled agent-to-agent" [P~ snippet].
  - Merge philosophy at agent throughput: fixes are cheap and waiting is expensive (paraphrase) [S].

**Lopopolo's follow-up corpus (personal repo, 2026) [P✓].** These are twelve theses from the post's author, worth quoting because they are the most explicit statement of the method ([docs index](https://github.com/lopopolo/harness-engineering/tree/trunk/docs)):
- "Treat the chosen model and coding agent as a black box during one adoption epoch."
- "Humans provide direction, judgment, and consequential authority" (the "give one agent the whole job" thesis).
- "Keep a large navigable knowledge store and a small active working set."
- "Code the agent reads becomes prompt material."
- "Keep capability and authority as separate contracts."
- "Match evidence to the user or operational claim."
- "Stable lessons move into their earliest durable owner."
- "Abundant implementation makes future coherence and lifetime ownership scarce."
- "Optimize useful outcomes per unit of scarce human attention, with acceptable latency, risk, and maintenance."

His `improve-harness` playbook is a reusable procedure (§3.9) ([playbook](https://raw.githubusercontent.com/lopopolo/harness-engineering/trunk/playbooks/improve-harness.md)). Talk and post titles show where the thinking went next:
- "OpenAI's Framework for Shipping Code at 70 PRs/Week" (Tessl podcast, 9 Jun 2026)
- "Extreme Harness Engineering for Token Billionaires" (Latent Space, 7 Apr 2026)
- "Please Go Brr, on Token Mandates" and "Code Reds Need Maintenance Loops" (17 Jul 2026)

Source: [sources list](https://raw.githubusercontent.com/lopopolo/harness-engineering/trunk/sources/README.md).

**Symphony [P✓].** OpenAI open-sourced a spec for orchestrating Codex runs: "Symphony turns project work into isolated, autonomous implementation runs."
- It watches a Linear board and spawns agents.
- Agents return "proof of work": CI status, PR review feedback, complexity analysis and walkthrough videos. Once work is accepted they land the PR.
- It "works best in codebases that have adopted harness engineering."
- It ships as a SPEC.md plus an experimental Elixir reference implementation, and is labeled "a low-key engineering preview for testing in trusted environments." About 27.6k stars.
- Sources: [github.com/openai/symphony](https://github.com/openai/symphony); announcement [openai.com](https://openai.com/index/open-source-codex-orchestration-symphony/) [P~].

**Codex Prompting Guide (OpenAI Cookbook; covers `gpt-5.3-codex`) [P✓]** ([notebook](https://raw.githubusercontent.com/openai/openai-cookbook/main/examples/gpt-5/codex_prompting_guide.ipynb)):
- **Reasoning effort.** "medium" is the all-round interactive default; "high"/"xhigh" for the hardest long-running tasks.
- **Starter-prompt principles:**
  - "Bias to action: default to implementing with reasonable assumptions."
  - "Persist until the task is fully handled end-to-end within the current turn whenever feasible."
  - "Batch everything… read them together."
  - "Always maximize parallelism."
  - "Unless asked for a plan, never end the interaction with only a plan."
- **What to remove.** "Remove all prompting for the model to communicate an upfront plan, preambles, or other status updates during the rollout."
- **Tools.** Use the exact `apply_patch` implementation the model was trained on ("a major lever for performance"), `rg` over `grep`, a `shell` tool and `update_plan`. Custom tools such as semantic search or MCP need distinct names, explicit usage guidance and distinctive outputs. Truncate tool outputs to about 10k tokens, keeping the start and end.
- **AGENTS.md loading.** Codex CLI loads AGENTS.md from `~/.codex` and from every directory between the repo root and the cwd, merged root-to-leaf so deeper files override. "Each file is injected as its own user-role message."
- **Compaction.** Use the Responses API `/compact` endpoint for long runs.
- **5.3-specific.** Preserve the `phase` field on assistant items.

**Codex's own system prompt (`gpt-5.2-codex_prompt.md`) [P✓]** encodes rules worth copying into any agent file ([file](https://raw.githubusercontent.com/openai/codex/main/codex-rs/core/gpt-5.2-codex_prompt.md)):
- **Git safety:**
  - "You may be in a dirty git worktree."
  - "NEVER revert existing changes you did not make unless explicitly requested."
  - No `git reset --hard` / `git checkout --` without approval.
  - "STOP IMMEDIATELY and ask the user" if unexpected changes appear.
  - Don't amend commits unless asked.
- **Planning.** "Skip using the planning tool for straightforward tasks… Do not make single-step plans."
- **Review mode.** "Findings must be the primary focus," ordered by severity with file/line references; if there are no findings, "state that explicitly" and note residual risk.
- **Frontend.** Avoid "safe, average-looking layouts," default font stacks and "purple-on-white defaults."

**Codex best practices (developers.openai.com) [P~/S].**
- Start with task context, keep durable guidance in AGENTS.md, turn repeated work into skills, and automate stable workflows ([best practices](https://developers.openai.com/codex/learn/best-practices)).
- Ask Codex to plan first on complex or ambiguous tasks using Plan mode (`/plan` or Shift+Tab), so it can "gather context, ask clarifying questions, and build a stronger plan before implementation."
- Third-party summaries of the official page describe a four-part prompt: **Goal** (an outcome, not a method), **Context** (@-mention files and errors), **Constraints** (standards, architecture, safety) and **Done when** (tests pass, bug no longer reproduces) [S].
- When Codex repeats a mistake, ask it for a retrospective and add a rule to AGENTS.md. Search summaries disagree on whether this is on the official page.
- Repo-local skills live in `.agents/skills/` next to AGENTS.md ([OpenAI skills blog](https://developers.openai.com/blog/skills-agents-sdk)) [P~].
- Third-party write-ups for GPT-5.5/5.6-era Codex stress "outcome-first" lean prompts and AGENTS.md limited to non-inferable constraints [S] ([Vaughan, Jul 2026](https://codex.danielvaughan.com/2026/07/26/gpt56-outcome-first-prompting-lean-system-prompts-codex-cli-agents-md-strategy/)).

**"How OpenAI uses Codex" (PDF guide, ~Oct 2025) [P~/S/K].**
- Used daily by Security, Product Engineering, Frontend, API, Infrastructure and Performance Engineering for code understanding, refactors and migrations, performance, test coverage, velocity and flow, and exploration ([PDF](https://cdn.openai.com/pdf/6a2631dc-783e-479b-b1a4-af0cfbd38630/how-openai-uses-codex.pdf), [page](https://openai.com/business/guides-and-resources/how-openai-uses-codex/)).
- Practices:
  - Start large changes in Ask mode to get a plan, then switch to Code mode [S].
  - Write prompts like GitHub issues [S].
  - Keep an AGENTS.md per repo [S].
  - Iterate on the environment setup: startup scripts, env vars, internet access [K].
  - Use the task queue as a lightweight backlog [K].
  - Use best-of-N on hard tasks [K, not confirmed this session].

**"Building an AI-Native Engineering Team" (Nov 2025) [P~/S].** The guide walks each SDLC phase (plan, design, build, test, review, document, deploy/maintain) with a **Delegate / Review / Own** split and checklists ([guide](https://developers.openai.com/codex/guides/build-ai-native-engineering-team), [PDF](https://cdn.openai.com/business-guides-and-resources/building-an-ai-native-engineering-team.pdf)).
- **Plan:** agents read the spec, map it to the codebase, find dependencies, and surface ambiguities and edge cases. Humans own sizing and non-obvious risks.
- **Design:** humans own the design system, UX patterns and architecture.

**Adoption and outcomes (self-reported).**
- An OpenAI forum recap (4 Dec 2025) reports: technical-staff adoption above 92%; Codex reviews every internal PR; Codex users ship about 70% more merged PRs [S] ([forum](https://forum.openai.com/home/blogs/how-openai-engineers-use-codex-to-tackle-big-projects-with-rigor-2025-12-04)). The figures come from executive remarks and vary across retellings (92% vs 95%+, merged vs total PRs).
- Economics paper on Codex usage (Johnston, Holtz, Richmond, Ong, Tambe, Chatterji; 25 Jun 2026; uses OpenAI data) [P~] ([arXiv](https://arxiv.org/abs/2606.26959), [OpenAI-hosted PDF](https://cdn.openai.com/pdf/5d1e1489-21c0-43e4-9d42-f87efdbf0082/the-shift-to-agentic-ai-evidence-from-codex.pdf)):
  - Active users grew more than 5x in H1 2026, fastest outside software developers.
  - Use inside OpenAI is "close to universal" and has largely replaced business use of ChatGPT.
  - More than 10% of users run 3+ concurrent agents a week; 26.6% use skills.
  - The share of users submitting tasks estimated at more than 8 hours rose about 10x.

**OpenAI's "agentic software factory" (Pragmatic Engineer, 15 Sep 2026; paywalled after section 3) [S].**
- Codex has access to source, Git/GitHub, Slack, Notion, Datadog, internal logs and internal skills ([ZenML summary](https://www.zenml.io/llmops-database/building-an-agentic-software-factory-for-high-velocity-development)).
- Post-merge pipeline ([article](https://newsletter.pragmaticengineer.com/p/openai-software-factory); [stage table](https://github.com/FlorianBruniaux/claude-code-ultimate-guide/blob/main/guide/workflows/agentic-software-factories.md)):
  1. **Risk-tiered review.** Parallel review agents each cover one domain (data, infra, cloud, security). High-risk changes get more agent reviews plus a mandatory human; low-risk areas can opt into auto-approval.
  2. **Per-change deploy agent.** It finds the feature flag, infers its effect, picks success and failure signals, and builds a dashboard. A human approves the production rollout.
  3. **Perf Factory.** Agents triage alerts, isolate latency regressions, find root causes and propose fixes that go through normal review.
  4. **Sevbot.** Gathers incident context and suggests mitigations in Slack, but never executes one.
- Other reported figures:
  - Non-engineering teams went from about 0% to 90% Codex use in four months, without a mandate.
  - Some delivery systems saw about 10x load in about six months.
  - Andrew Ambrosino, described in the digest as the Codex lead: "Codex being good at longer-running tasks seems to cause people to do fewer things in parallel."
- No defect, change-failure or rollback data is published.

**AGENTS.md as a standard [P✓/P~].**
- AAIF formed on 9 Dec 2025 under the Linux Foundation. OpenAI contributed AGENTS.md, Anthropic MCP and Block goose; Google, Microsoft, AWS, Bloomberg and Cloudflare are platinum members ([OpenAI](https://openai.com/blog/agentic-ai-foundation), [InfoQ](https://infoq.com/news/2025/12/agentic-ai-foundation/)).
- The agents.md site lists 23 tools: Codex, Amp, Jules, Cursor, Factory, RooCode, Aider, Gemini CLI, goose, Kilo Code, opencode, Phoenix, Zed, Semgrep, Warp, the Copilot coding agent, VS Code, Ona, Devin, Windsurf, UiPath, Augment Code and Junie ([CompatibilitySection](https://raw.githubusercontent.com/agentsmd/agents.md/main/components/CompatibilitySection.tsx)).
- FAQ ([source](https://raw.githubusercontent.com/agentsmd/agents.md/main/components/FAQSection.tsx)):
  - No required fields.
  - Nearest file wins; chat overrides everything.
  - Listed test commands will be run: "The agent will attempt to execute relevant programmatic checks and fix failures before finishing the task."
  - Treat the file "as living documentation."

**Product state.** The model and product timeline is in §5. The `codex-rs/core` prompt files confirm GPT-5-Codex, 5.1-Codex-Max and 5.2-Codex, and the cookbook confirms gpt-5.3-codex. The open-source CLI is at 0.162.1 (9 Oct 2026), with subagents, plugins/skills, hooks and remote control in recent release notes [P✓] ([releases](https://github.com/openai/codex/releases)).

### 2.2 Google (internal engineering, DORA, Gemini CLI, Jules, Antigravity, Addy Osmani)

**Internal AI-assisted engineering.**
- **Google Research blog** "AI in software engineering at Google: Progress and the path ahead" (Satish Chandra and Maxim Tabachnyk, 6 Jun 2024). It covers AI across the inner loop (IDE, code review, code search) and outer loop (bugs, planning) [P~] ([blog](https://research.google/blog/ai-in-software-engineering-at-google-progress-and-the-path-ahead/)). I could not confirm the commonly quoted figures, such as about 50% of code characters completed with AI and about 37% acceptance (see §7).
- **Internal RCT** (Paradis et al.; ICSE SEIP 2025) [P~] ([arXiv](https://arxiv.org/abs/2410.12944v3), [ICSE](https://conf.researchr.org/details/icse-2025/icse-2025-software-engineering-in-practice/26/How-much-does-AI-impact-development-speed-An-enterprise-based-randomized-controlled-)):
  - 96 full-time Google engineers on an enterprise-grade task; tools tested in summer 2024.
  - Best estimate about 21% faster (96 vs 114 minutes) with a wide confidence interval.
  - Engineers who spend more hours a day coding gained more.
  - The authors caution about external validity *(independent-ish: Google researchers on Google tools)*.
- **Share of new code AI-generated** *(self-reported)*:
  - 25% (Oct 2024) [K/S] → about 30% (Jun 2025) [S] → about 50% (autumn 2025) [S] → **about 75% of new code AI-generated and approved by engineers** (Pichai at Cloud Next, 22 Apr 2026) [S] ([Semafor](https://www.semafor.com/article/04/24/2026/google-ceo-says-75-of-companys-new-code-is-ai-generated), [Fast Company](https://www.fastcompany.com/91531519/google-ceo-says-75-of-the-companys-code-is-ai-generated)).
  - Pichai also cited a complex migration that agents plus engineers finished 6x faster than engineers alone a year earlier.
  - Critics note there was no rejection-rate or security data, and that Pichai elsewhere called an engineering-velocity lift of about 10% the metric that matters [S] ([newsanalysis](https://newsanalysis.net/pichai-google-75-percent-ai-code-claim/), [Storyboard18 on the 30%/10% figures](https://www.storyboard18.com/brand-makers/sundar-pichai-explains-why-human-coders-still-have-the-edge-over-ai-69385.htm)).
- **Google's LLM-driven code-migrations paper (Jan 2025) [K].** 39 migrations by 3 developers over 12 months; 595 code changes with about 74% of changes and about 69% of edits LLM-generated; developers estimated about 50% less total time.

**DORA 2025: State of AI-assisted Software Development (Sep 2025).** Sources: [PDF](https://services.google.com/fh/files/misc/2025_state_of_ai_assisted_software_development.pdf), [Google blog](https://blog.google/innovation-and-ai/technology/developers-tools/dora-report-2025/), [ADTmag](https://adtmag.com/articles/2025/09/24/what-2025-dora-report-means-for-developers.aspx), [AI Capabilities Model](https://cloud.google.com/blog/products/ai-machine-learning/introducing-doras-inaugural-ai-capabilities-model) [P~/S].
- **Sample.** Nearly 5,000 respondents plus more than 100 hours of qualitative data.
- **Adoption.** 90% (+14 points YoY); 65% "heavily" rely on AI; more than 80% report higher productivity; 59% report better code quality.
- **Trust.** 30% trust AI output "a little" or "not at all," and only about 25% trust it "a lot" or "a great deal."
- **Delivery.** AI now improves delivery *throughput* (a reversal from 2024) but still increases *instability*.
- **AI Capabilities Model (7 practices):**
  1. Clear and communicated AI stance
  2. Healthy data ecosystems
  3. AI-accessible internal data (framed as "context engineering")
  4. Strong version-control practices
  5. Working in small batches
  6. User-centric focus (teams without it saw performance *decline* with AI)
  7. Quality internal platforms (90% of organizations have adopted platform engineering)
- **Team profiles.** Seven, ranging from "harmonious high-achievers" to "legacy bottleneck." Central thesis: AI is an amplifier and "a systems problem, not a tools problem" ([techstrong](https://techstrong.ai/features/ai-doesnt-fix-whats-already-broken-what-doras-new-model-tells-us-about-getting-ai-right/)).

**DORA 2026.**
- "The ROI of AI-assisted Software Development" (v2026.01; covered by InfoQ in May 2026) [P~/S] ([report](https://cloud.google.com/resources/content/dora-roi-of-ai-assisted-software-development), [InfoQ](https://www.infoq.com/news/2026/05/dora-roi-ai-assisted-dev-report/)):
  - Returns come mainly from the organizational system (platform, workflow clarity, alignment) and from reducing rework, not from headcount cuts.
  - Expect a J-curve dip ("tuition cost"). The sample calculator assumes a 15% dip for three months, and change-failure rate rising from 5% to 6%. It models 39% first-year ROI for a 500-engineer org, explicitly labeled high-uncertainty.
- An editor's note reports DORA will **not** run its 2026 survey or publish a 2026 State of AI report (announced Sep 2026); the AI Capabilities Model work continues [S, needs verification] ([critique](https://makemeacto.cc/what-should-one-think-of-the-2026/), [dora.dev](https://dora.dev/insights/)).

**Gemini CLI [P✓].**
- **Context files.** GEMINI.md loads hierarchically: global `~/.gemini/GEMINI.md` → workspace dirs and parents → **just-in-time** discovery when a tool touches a path, scanning ancestors up to a trusted root.
- **Memory commands.** `/memory show` and `/memory reload`; `@file.md` imports; `context.fileName` accepts a list such as `["AGENTS.md","CONTEXT.md","GEMINI.md"]` ([gemini-md.md](https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/cli/gemini-md.md)).
- **Skills best practices** ([skills-best-practices.md](https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/cli/skills-best-practices.md)):
  - The description "is the most important part."
  - Metadata of about 100 words is always in context; keep the SKILL.md body under 5k words.
  - Use `scripts/` for deterministic steps with LLM-friendly output ("Suppress verbose tracebacks").
  - Match specificity to fragility ("degrees of freedom").
- **Docs** now cover plan mode, git worktrees, checkpointing/rewind, model routing and steering, auto-memory, sandboxing, trusted folders and headless mode ([docs/cli](https://github.com/google-gemini/gemini-cli/tree/main/docs/cli)).
- **Extensions guidance** ([geminicli.com](https://geminicli.com/docs/extensions/best-practices/)): keep context lean, since it costs tokens every session.

**Conductor (Dec 2025 / Jan 2026) [P✓/P~]:**
- **What it is.** "Context-driven development." Persistent Markdown context lives in the repo, not chat ([Google blog](https://developers.googleblog.com/conductor-introducing-context-driven-development-for-gemini-cli/)).
- **Commands:** `/conductor:conductor-setup`, `…-new-track`, `…-implement`, `…-status`, `…-revert` (git-aware) and `…-review`.
- **Files:** `conductor/{product.md, product-guidelines.md, tech-stack.md, workflow.md, code_styleguides/, tracks.md}` plus per-track `spec.md`, `plan.md` and `metadata.json`.
- **Tagline:** "Measure twice, code once."
- **Reach.** It now also runs as a plugin for Antigravity and Claude Code ([repo](https://github.com/gemini-cli-extensions/conductor)).

**Antigravity, and the 2026 consolidation of Google's coding tools [S].**
- **Launch (18 Nov 2025, with Gemini 3)** ([SD Times](https://sdtimes.com/softwaredev/google-announces-agentic-development-platform-google-antigravity/)):
  - An Editor view, and a **Manager view** ("mission control") for parallel asynchronous agents.
  - Agents produce **Artifacts** (task lists, implementation plans, screenshots, browser recordings), which Google pitches as easier to verify than raw tool calls.
  - Built on the licensed Windsurf technology and team.
- **Google I/O (19 May 2026)** ([Developers blog](https://developers.googleblog.com/all-the-news-from-the-google-io-2026-developer-keynote/), [blog.google](https://blog.google/innovation-and-ai/technology/ai/google-io-2026-all-our-announcements/)):
  - Antigravity 2.0 as a standalone desktop app for orchestrating multiple agents.
  - An Antigravity SDK.
  - Gemini 3.5 Flash GA.
  - Managed Agents in the Gemini API.
- **Gemini CLI's status is disputed.** Third-party reports say Gemini CLI and the Code Assist IDE extensions would stop serving Google AI Pro/Ultra and free users on 18 Jun 2026, in favor of a Go-based Antigravity CLI (`agy`) that keeps skills, hooks and subagents as plugins ([inventivehq](https://inventivehq.com/blog/gemini-cli-deprecated-antigravity-cli-migration), [jangwook](https://jangwook.net/en/blog/en/google-io-2026-antigravity-2-agent-platform-analysis/)). However, the open-source repo still ships: v0.63.0 on 6 Oct 2026 and nightlies on 10 Oct 2026, with no deprecation notice in the README [P✓] ([releases](https://github.com/google-gemini/gemini-cli/releases), [repo](https://github.com/google-gemini/gemini-cli)). The cutoff may apply only to consumer tiers; treat it as unresolved.

**Jules [S].** Jules Tools CLI (`npm install -g @google/jules`) and the Jules API (Oct 2025) embed the asynchronous cloud agent in CI, Slack and Jira ([TechRadar](https://www.techradar.com/pro/googles-ai-coding-agent-jules-is-getting-new-command-line-tools)). A third-party profile puts the free tier at 15 tasks per 24 hours and 3 concurrent (Sep 2026) and mentions scheduled maintenance/CI-repair tasks; the evidence there is thin ([rywalker](https://rywalker.com/research/jules)).

**Gemini 3.x prompting [P~/S].** `thinking_level` defaults to high; the levels are minimal (not on 3.1 Pro), low, medium and high, and are "relative allowances" ([Gemini 3 guide](https://ai.google.dev/gemini-api/docs/gemini-3?hl=pt)). Google DevRel's Phil Schmid advises short, direct prompts, no manual chain-of-thought, long context first and the instruction last ([philschmid.de](https://www.philschmid.de/gemini-3-prompt-practices)).

**Addy Osmani (Google Cloud AI) [P~/S].**
- **"My LLM coding workflow going into 2026" (4 Jan 2026).** Spec and plan first (a "15-minute waterfall"); small iterative chunks; explicit context packing; frequent commits as save points; verify everything, sometimes with a second model reviewing the first ([post](https://addyosmani.com/blog/ai-coding-workflow/)).
- **"How to write a good spec for AI agents" (13 Jan 2026).** Six areas (commands, testing, project structure, code style, git workflow, boundaries) and three boundary tiers, **Always / Ask first / Never**. Keep it modular and avoid a "monolithic CLAUDE.md" ([post](https://addyosmani.com/blog/good-spec/)).
- **"The 80% Problem in Agentic Coding" (28 Jan 2026).** Comprehension debt: it is easy to rubber-stamp code you could no longer write yourself ([Substack](https://addyo.substack.com/p/the-80-problem-in-agentic-coding)).
- **AGENTS.md anti-`/init` (23 Feb 2026)** [S].
  - Apply a discoverability filter: if the agent can learn something by reading the code, delete it.
  - Keep tooling preferences, operational landmines and non-obvious conventions.
  - Watch for "anchoring," where a mentioned technology biases the agent every session.
  - Treat the file as a diagnostic of codebase friction.
- **"Agentic Code Review" (Jun 2026).** Review is now the most valuable skill; cites 2026 data showing a sharp rise in PRs merged with zero review ([Substack](https://addyo.substack.com/p/agentic-code-review)).
- **Later 2026 posts:** "Own the Outer Loop" (15 Jul), "Agentic Code Quality" (8 Aug), "Human judgment doesn't leave the software factory" (21 Aug), "Audit your Agent files" (27 Aug), "Agentic Skill Decay" (31 Aug) and "Brownfield Agentic Engineering" (14 Sep, on surfacing hidden constraints in legacy code) ([blog index](https://addyosmani.com/blog/), [brownfield](https://addyo.substack.com/p/brownfield-agentic-engineering)).

### 2.3 Microsoft / GitHub

All [P✓] items below come from current `github/docs` source, as fetched Oct 2026.

**Copilot cloud agent** (renamed from "coding agent"): best practices ([get-the-best-results](https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/cloud-agent/get-the-best-results.md)).
- **Good tasks** have "a clear description of the problem," complete acceptance criteria and direction on which files to change: bug fixes, UI tweaks, test coverage, docs, accessibility and tech debt.
- **Keep for humans:** broad refactors, sensitive work (security, PII, auth), incident response, ambiguous requirements, and tasks you want to learn from.
- **The issue is the prompt.** Have the agent research and plan on a branch before opening a PR.
- **Iterate with `@copilot` PR comments,** batching them with **Start a review** because each submitted comment starts work immediately.
- **Instruction files, by scope:**
  - `.github/copilot-instructions.md` (repo-wide; also applies to Chat and code review).
  - `.github/instructions/**/*.instructions.md` with `applyTo` globs.
  - `**/AGENTS.md`, `/CLAUDE.md` and `/GEMINI.md` are all read.
  - Org-level instructions rank below repo-level.
- **`copilot-setup-steps.yml`** pre-installs dependencies.
- **MCP.** The GitHub and Playwright MCP servers are on by default.
- **Custom agents** are Markdown "agent profiles" with restricted tool sets.

**Guardrails** ([build-guardrails](https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/cloud-agent/build-guardrails.md)):
- By default the agent can't push to the default branch or merge, and it is subject to rulesets like any developer.
- Require code-scanning and quality results on agent-enabled repos.
- Protect Copilot and MCP config files with CODEOWNERS and "Require review from Code Owners."
- Keep sensitive tokens in Actions secrets; the agent can't read them. Provide agent-specific secrets instead.
- Use GitHub-hosted runners (a fresh VM per session) or ephemeral self-hosted runners.
- Workflows triggered by agent PRs stay blocked until a writer approves.
- Request minimal `GITHUB_TOKEN` permissions in setup steps.

**Pilot guidance** ([pilot-cloud-agent](https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/cloud-agent/pilot-cloud-agent.md)):
- Run four phases: evaluate → secure → pilot in a low-risk repo with a cross-functional team → expand.
- "Measure the tool's impact on your organization's downstream goals," and track AI credits and Actions minutes.

**Reviewing AI-generated code** ([checklist](https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/review-ai-generated-code.md)):
- "Always run automated tests and static analysis tools first."
- Verify that dependencies exist and are maintained (watch for hallucinated packages).
- Watch for invented APIs, ignored constraints, and deleted or skipped tests.
- Use pairing for sensitive changes, and put AI-content expectations in `CONTRIBUTING.md`.

**Stacked PRs** (commands in §3.5).
- Order layers by dependency; "a mistake in the bottom layer propagates to every branch above it."
- If a layer needs a long description, split it ([stacking](https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/stack-ai-generated-code-in-pull-requests.md)).

**Third-party agents inside GitHub (marketed as "Agent HQ" [K]).**
- Anthropic Claude and OpenAI Codex run as coding agents in public preview. Invoke them from the Agents tab, issue assignment, `@AGENT_NAME` in PRs, Mobile or VS Code.
- Generated code is auto-scanned (CodeQL, secret scanning, dependency advisories) without a GHAS license.
- Actions appear in the audit log as `anthropic code agent` / `openai code agent` ([third-party agents](https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/about-third-party-coding-agents.md)).
- [K] Agent HQ was announced at Universe (28 Oct 2025) with Anthropic, OpenAI, Google, Cognition and xAI agents, a "mission control," Plan Mode in VS Code and AGENTS.md support.

**GitHub Agentic Workflows** ([doc](https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/about-github-agentic-workflows.md)):
- Markdown with YAML frontmatter, compiled to a hardened `.lock.yml`.
- "Agents run in firewalled containers with read-only tokens by default."
- Writes happen only through declared **safe outputs** (issues, comments, PRs), which are threat-scanned before they apply.
- Engines: Copilot (default), Claude, Codex, Gemini. Budget with `max-ai-credits` (default 1,000 AIC, at 1 AIC = $0.01).
- Use cases: triage, CI-failure investigation, status reports, doc sync, test coverage.

**Copilot Memory** ([doc](https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/copilot-memory.md)): repo facts carry citations that are validated against the current branch before use; there are separate user preferences; anything unused expires after 28 days.

**Copilot CLI (2026 feature set):**
- **Rubber duck.** A read-only critic on a *different* model ("less likely to share the first model's blind spots"). It can auto-invoke after planning, mid-implementation, after writing tests and after repeated failures. Findings are split into blocking, non-blocking and suggestions ([rubber-duck](https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/copilot-cli/rubber-duck.md)).
- **`/fleet`.** Parallel subagents, each with its own context window and a low-cost model by default. "If your request is inherently sequential… may not provide any benefit," and it uses more credits ([fleet](https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/copilot-cli/fleet.md)).
- **Autopilot.** Shift+Tab to enter. It stops at task completion, on a blocker, on Ctrl+C or at `--max-autopilot-continues` (default 5). "Set a continuation limit, especially in scripts and CI" ([autopilot](https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/copilot-cli/autopilot.md)).
- **Skills.** Read from `.github/skills`, `.claude/skills`, `.agents/skills`, `~/.copilot/skills` and `~/.agents/skills`; installable with `gh skill` ([skills](https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/about-agent-skills.md)).

**spec-kit [P✓].**
- About 140.7k stars. Commands are now hyphenated skills: `/speckit-constitution`, `-specify`, `-plan`, `-tasks`, `-implement`, `-converge`.
- Extensions for bug fixing (`/speckit-bug-assess|fix|test`) and idea assessment ([repo](https://github.com/github/spec-kit)).
- Philosophy: "The specification becomes the primary artifact."
- Example constitution articles: Library-First, Test-First ("No implementation code shall be written before" tests are written, approved and failing), Simplicity ("Maximum 3 projects"), Anti-Abstraction and Integration-First ("Prefer real databases over mocks") ([spec-driven.md](https://raw.githubusercontent.com/github/spec-kit/main/spec-driven.md)).

**Microsoft's own agent instructions, from VS Code [P✓].** `.github/copilot-instructions.md` is about 158 lines in four sections: Project Overview, Validating TypeScript Changes, Coding Guidelines and **Learnings** (a running list of agent lessons) ([file](https://github.com/microsoft/vscode/blob/main/.github/copilot-instructions.md)). Notable rules:
- Don't run builds or broad type checks "as a completion ritual"; pick validation by scope and risk.
- Reuse validation results while inputs haven't changed.
- Don't share `node_modules` across worktrees.
- Make dependencies injectable instead of stubbing globals.

**Microsoft Amplifier [P✓].** A research demonstrator for modular, multi-provider agentic development (bundles; specialized agents such as zen-architect and bug-hunter). Its README references gpt-5.5 and claude-opus-4-6 ([repo](https://github.com/microsoft/amplifier)).

**[K] Other Microsoft/GitHub data points:**
- Octoverse 2025 (Oct 2025): 180M+ developers; TypeScript became #1 on GitHub in Aug 2025; about 80% of new developers use Copilot in their first week.
- Nadella: 20–30% of code in Microsoft repos written by AI (Apr 2025).
- Field experiments at Microsoft, Accenture and a Fortune-100 firm (Cui et al.): +26% completed tasks (n≈4,867). Slice 4 covers these.

### 2.4 Amazon / AWS

**AI-DLC (AI-Driven Development Life Cycle) [P✓].**
- The repo describes itself as "adaptive workflow steering rules for AI coding agents" that turn assistants into "structured, verifiable software-delivery workflows."
- Structure: **5 phases and 33 stages**, 11 workflow profiles (including Classic and Express), 14 agents, "human approval gates and source-bound review evidence," and a "118-event audit trail."
- It is harness-neutral, with thin manifests for Claude Code, Kiro CLI/IDE, Codex CLI, Cursor, opencode and Copilot. v2.11.0, about 5.1k stars ([repo](https://github.com/awslabs/aidlc-workflows)); AWS blog: [AI-DLC](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/) [P~].
- [K] The original 2025 framing uses Inception → Construction → Operations phases, "Mob Elaboration"/"Mob Construction" rituals, and "bolts" (hours to days) in place of sprints. AI proposes and asks clarifying questions; humans validate at each gate.

**Kiro [P✓/K].** "An agentic AI development platform that helps developers and teams plan, build, and review software."
- **Specs** structure requirements, design decisions and tasks, with a Requirements Analysis step that surfaces conflicts before coding.
- **Steering** files hold project conventions; **Hooks** react to agent events; the **CLI** covers headless and CI/CD use ([repo](https://github.com/kirodotdev/Kiro)).
- [K] Spec files are `requirements.md` (EARS notation), `design.md` and `tasks.md`. Preview launched Jul 2025; GA in Nov 2025 with property-based testing, checkpoints and Kiro CLI.

**Q Developer transformation (Andy Jassy, Aug 2024) [K]** *(self-reported)*. Java 8/11 → 17 upgrades went from about 50 developer-days per application to hours, saving an estimated 4,500 developer-years and about $260M a year. More than 50% of production Java systems were upgraded within six months, and 79% of auto-generated code reviews shipped without further changes.

**[K, verify]** Reported events from late 2025 to early 2026:
- An internal push to standardize on Kiro, with a weekly-usage target of about 80%.
- An FT report linking Kiro agent actions to an AWS service disruption, which Amazon attributed to misconfigured access/user error.

These are cautionary data points on agent permissions; see §7.

### 2.5 Meta

- **JiTTesting (Jan 2026)** [S] ([arXiv 2601.22832](https://arxiv.org/abs/2601.22832); [summary](https://raw.githubusercontent.com/FlorianBruniaux/claude-code-ultimate-guide/main/docs/resource-evaluations/2026-03-22-harman-jittesting-meta-arxiv.md)).
  - LLM-generated "catching" tests are created at diff time and never committed. The pipeline infers intent from the diff, creates mutants, generates tests that catch them, and filters false positives with rule-based plus LLM assessors.
  - It runs on hundreds of millions of lines of code.
  - Results *(self-reported, via a secondary fact-check)*: 41 candidate catches → 8 true positives → 4 serious failures prevented; assessors cut human review load by 70%; diff-aware generation was 4x better than hardening tests and 20x better than coincidental failures.
  - The key idea is that tests become ephemeral, per-change artifacts.
- **[K] Earlier Meta programs:**
  - **TestGen-LLM** (Feb 2024; FSE'24 industry track): 75% of generated tests built correctly, 57% passed reliably, 25% increased coverage. In Instagram/Facebook test-a-thons it improved 11.5% of classes it was applied to, and 73% of recommendations were accepted for production.
  - **ACH, mutation-guided test generation** (2025): about 73% of generated tests accepted by engineers.
  - **CodeCompose** (2023): reached tens of thousands of developers, with about 22% acceptance and about 8% of typed code coming from it.
  - From 2026, performance reviews reportedly include "AI-driven impact."

### 2.6 Cursor (Anysphere)

All [K] except the fastrender repo; no Cursor URLs could be verified this session.

- **"Best practices for coding with agents" (Jan 2026):**
  - Start with **Plan Mode** (Shift+Tab): the agent researches, asks questions and writes a plan (saved as Markdown) before coding.
  - If output diverges, **revert and refine the plan** rather than patching through follow-ups.
  - Let the agent find context instead of tagging every file. Start a new chat when switching tasks or when the agent keeps repeating mistakes.
  - Keep **rules** (`.cursor/rules`) short: commands, patterns, pointers to canonical examples. Use linters instead of pasted style guides, and add a rule only after a repeated mistake.
  - Use **skills** for dynamic capabilities, and **hooks** for "keep going until tests pass" loops with an iteration cap.
  - TDD: write tests, confirm they fail, commit, then implement.
  - Run several models or agents in parallel via **worktrees** and compare; use **Debug Mode** (hypotheses → instrumentation → reproduce → targeted fix); use **Bugbot** for PR review.
- **"Scaling long-running autonomous coding" (Wilson Lin, Jan 2026):**
  - What failed: flat peer coordination through a shared file with locks (twenty agents slowed to the throughput of two or three) and optimistic concurrency (agents became risk-averse and avoided hard tasks).
  - What worked: **planners** (recursive sub-planners) create tasks, **workers** grind on them independently, and a **judge** decides each cycle whether to continue; each cycle restarts fresh.
  - Output: a browser built from scratch in about a week (over 1M LOC across about 1,000 files); a Solid→React migration in Cursor's own codebase over three weeks (+266K/−193K lines).
  - Lessons: GPT-5.2 held up better than Opus 4.5 on extended autonomous work (Opus "tends to stop earlier and take shortcuts"); removing the integrator role helped; prompts mattered more than harness complexity.
  - The resulting engine repo, `fastrender`, is "Developed as part of research into collaborative parallel AI coding agents," has 29,858 commits, and is "Under heavy development… Not recommended for production use" [P✓] ([repo](https://github.com/wilsonzlin/fastrender)). Critics questioned how much of it actually worked; see §7.
- **"Dynamic context discovery" (Jan 2026).** "Provide fewer details up front" and let the agent pull context:
  - long tool outputs become files;
  - chat history is kept as files for summarization;
  - Agent Skills are supported;
  - MCP tools are lazy-loaded (cutting total tokens by 46.9% in runs that called MCP tools, in an A/B test);
  - terminal sessions are exposed as files.
- **Bugbot** (GA Jul 2025): over 1M PRs reviewed in beta, about 1.5M issues flagged, about half resolved before merge *(vendor-reported)*. **Composer** (Cursor 2.0, Oct 2025): an RL-trained in-house model, "4x faster" than comparably capable models *(vendor-reported)*. Later Composer versions are reportedly built on an open-weights base (see §7).

### 2.7 Cognition (Devin, Windsurf)

All [K] except the customer figures, which come via an [S] aggregator.

- **"Don't Build Multi-Agents" (Walden Yan, Jun 2025).** Two principles: "Share context, and share full agent traces, not just individual messages," and "Actions carry implicit decisions, and conflicting decisions carry bad results." Prefer single-threaded linear agents, and compress history with a dedicated model for long tasks.
- **Read-only subagents are acceptable.** Cognition later shipped SWE-grep (Oct 2025), a fast RL-trained context-retrieval subagent with many parallel tool calls. The line it draws is no parallel *writers*.
- **"Coding Agents 101" (2025).** Say *how*, not just *what*; tell the agent where to start; prompt defensively; give access to CI, tests, types and linters; delegate in verifiable steps; start fresh rather than fight a confused session.
- **"Devin's 2025 performance review" (late 2025).** PR merge rate about 67%, up from 34%, at about 4x speed. Devin is "senior-level at codebase understanding but junior at execution" and works best on clear, verifiable tasks of about 4–8 junior-engineer hours: migrations, vulnerability fixes, tests *(vendor-reported)*.
- **Customer claims** [S, vendor-reported]: Mercedes-Benz turned an 8-month COBOL estimate into 8 days; Itaú auto-resolved 70% of security vulnerabilities ([aggregator](https://github.com/FlorianBruniaux/claude-code-ultimate-guide/blob/main/guide/workflows/agentic-software-factories.md)).

### 2.8 Other tool vendors

- **Sourcegraph/Amp.**
  - The official guides repo supplements the [Amp Manual](https://ampcode.com/manual); every example must include a shared Thread link, and an agent file holds structure, build/test commands and conventions ([repo](https://github.com/ampcode/amp-examples-and-guides)) [P✓].
  - [K] Opinionated design: no model picker; AGENTS.md first (with fallbacks); read-only "Oracle" (reasoning model) and "Librarian" (remote code search) subagents; shareable threads; **handoff to a fresh thread in place of compaction**.
- **Factory (Droids).**
  - Droid runs across CLI, web, Slack/Teams, Linear/Jira and mobile, and claims to be "top performing in terminal benchmarks" *(vendor-reported)* ([repo](https://github.com/Factory-AI/factory)) [P✓].
  - Its agent-steering lint rules are public (see §1, item 18) [P✓], with linked essays [Using Linters to Direct Agents](https://factory.ai/news/using-linters-to-direct-agents) and [Agent Readiness](https://factory.ai/news/agent-readiness) [P~ URLs].
  - [K] Agent Readiness scores a repo on technical pillars (lint/format, build, tests, docs, dev environment, observability, security) across maturity levels. The thesis: agent success depends more on the repo than on the model.
- **Vercel.** The AGENTS.md-vs-skills eval is covered in §1, item 5 ([blog](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals); [critique with conflict-of-interest note](https://raw.githubusercontent.com/FlorianBruniaux/claude-code-ultimate-guide/main/docs/resource-evaluations/025-vercel-agents-md-vs-skills-eval.md)).
  - The index compressed about 5x (40KB → 8KB) with no performance loss.
  - Generate it with `npx @next/codemod@canary agents-md`.
  - The 100% vs 79% gap is about 4 tasks out of 19.
- **Augment.** The Context Engine MCP server (6 Feb 2026) offers semantic indexing of up to about 400–500k files for Claude Code, Cursor and Zed. Self-run benchmark on 300 Elasticsearch PRs: Claude Code + Opus 4.5 +80% quality; Cursor + Opus 4.5 +71%; Cursor + Composer-1 +30% *(vendor-reported, unreplicated)* ([product](https://www.augmentcode.com/product/context-engine-mcp)).
- **JetBrains.** Junie reads `.junie/AGENTS.md` or `AGENTS.md`. JetBrains publishes a guidelines catalog (Java/Spring, Nuxt, Django, Gin) covering style, practices, antipatterns and worked examples ([junie-guidelines](https://github.com/JetBrains/junie-guidelines)) [P✓].
- **Block (goose).** goose is "part of the Agentic AI Foundation (AAIF) at the Linux Foundation." It works with 15+ providers (including via Claude, ChatGPT or Gemini subscriptions through ACP) and "70+ extensions via the Model Context Protocol." About 55.1k stars ([repo](https://github.com/block/goose)) [P✓]. Recipes are versioned, parameterized workflows [S]. [K] Stripe's Minions harness is a goose fork.
- **Replit [K].** Agent 3 (Sep 2025) runs up to about 200 minutes autonomously and tests itself in a browser. After the Jul 2025 incident in which its agent deleted a user's production database during a code freeze, Replit added automatic dev/prod database separation, a planning/chat-only mode and better rollback. This is the canonical case for environment separation.

### 2.9 Large engineering orgs' internal agent programs

- **Stripe "Minions" (Feb 2026, two-part stripe.dev series) [K].** *(Self-reported.)*
  - "One-shot, end-to-end" unattended agents produce over 1,000 merged PRs a week; humans review, but no human-written code.
  - Started from Slack, CLI, web or internal tools (for example, flaky-test tickets).
  - Each run gets its own pre-warmed **devbox** (about 10 seconds to start), the same environment human engineers use.
  - The harness is a goose fork. "Blueprints" interleave deterministic nodes (lint, push, CI) with agentic loops.
  - **Toolshed** is a central MCP server with about 500 tools.
  - Fast local lint/heuristics run before CI, and the agent gets **at most two CI rounds** before handing back to a human.
  - Directory-scoped rule files are shared with Cursor and Claude Code. Motto: what is good for humans is good for agents.
- **Spotify "Honk" (Nov–Dec 2025 three-part engineering-blog series) [K].** *(Self-reported.)*
  - A background agent layered on Fleet Management for large-scale migrations: 1,500+ merged PRs and 60–90% time savings vs manual.
  - Spotify tried open-source agents, then a home-grown loop, then standardized on Claude Code via the Agent SDK.
  - Context engineering: describe the end state, give examples, state what *not* to do, one change per run.
  - Restricted tools: a verify tool exposing format, lint and tests via MCP; limited git and bash.
  - Deterministic verifiers plus an **LLM judge** comparing the diff to the prompt; the judge vetoes about 25% of sessions, and about half of those self-correct.
  - Feb 2026 earnings: leadership said its best developers hadn't hand-written code since December, partly by triggering Honk from Slack.
- **Ramp "Inspect" (Jan 2026)** ([post](https://builders.ramp.com/post/why-we-built-our-background-agent)) [P~ URL; content K].
  - [K] Writes about 30% of merged PRs to the frontend and backend repos *(self-reported)*.
  - Built rather than bought: Modal sandboxes with frequently rebuilt snapshots, OpenCode as the harness, and the same observability and flag tools engineers use (Sentry, Datadog, LaunchDarkly, etc.).
  - Multiplayer sessions; clients in Slack, web and Chrome.
  - An open-source re-implementation "inspired by Ramp's Inspect" shows the architecture: Cloudflare Durable Objects per session, a sandbox with a supervisor, harness (OpenCode or Claude Agent SDK) and bridge; clients in Slack, GitHub, Linear and web; designed for single-tenant trusted orgs ([background-agents](https://github.com/ColeMurray/background-agents)) [P✓].
- **StrongDM "Software Factory" (Feb 2026) [K + P✓ repo].**
  - Charter: "Code must not be written by humans," "Code must not be reviewed by humans," and "If you haven't spent at least $1,000 on tokens today per human engineer, your software factory has room for improvement."
  - Validation uses **scenarios** kept outside the codebase as a holdout set, scored as probabilistic "satisfaction," against a **Digital Twin Universe** of behavioral clones of SaaS dependencies (Okta, Jira, Slack, Google Workspace).
  - It published **Attractor** as natural-language specs ("NLSpec… directly usable by coding agents"): the Attractor spec, a coding-agent-loop spec and a unified-LLM-client spec. Suggested bootstrap prompt: "Implement Attractor as described by https://github.com/strongdm/attractor" ([repo](https://github.com/strongdm/attractor)).
- **Shopify [K + P✓].**
  - Tobi Lütke's memo (Apr 2025): "Reflexive AI usage is now a baseline expectation"; AI use is part of performance and peer review; prototypes should start with AI; teams must show why AI can't do the work before asking for headcount.
  - Shopify open-sourced **Roast**, a Ruby DSL for structured AI workflows. Its "cogs" are `chat`, `agent` (Claude Code or Pi), `cmd`, `ruby`, `map` (parallel), `repeat` and `call`; the pattern is deterministic orchestration around agent steps ([repo](https://github.com/Shopify/roast)).
- **Airbnb (Mar 2025) [K].** *(Self-reported.)*
  - Migrated about 3.5k React test files from Enzyme to RTL in 6 weeks vs a 1.5-year estimate.
  - A per-file state machine (refactor → fix Jest → fix lint/TS) with retry loops that feed errors back.
  - Rich prompts of 40–100k tokens, including up to about 50 related files and exemplar tests.
  - 75% done in 4 hours, 97% after 4 days of "sample, tune, sweep," and the rest finished by hand.
- **Uber [K, verify].** uReview AI code review runs on about 90% of roughly 65k weekly diffs. About 75% of comments are rated useful and about 65% are addressed. Its multi-stage pipeline favors precision over recall: confidence scoring, deduplication and category suppression.
- **Coinbase [K].** In Aug 2025 the CEO required all engineers to onboard to Cursor and Copilot within a week (and dismissed some holdouts). About 33–40% of code was AI-generated, with a 50% goal.
- **Zapier [K].** An "AI fluency" hiring bar with a rubric (Unacceptable / Capable / Adoptive / Transformative).
- **Intercom [K, low].** A "2x" R&D productivity goal driven by agent adoption.
- **Others [K, verify].**
  - Goldman Sachs piloting Devin as a "hybrid workforce" (2025).
  - Nubank's Devin-driven ETL migration (12x engineering-hour efficiency, 20x cost, vendor-reported).
  - Robinhood: about 50% of new code AI-generated (2025).

---

## 3. Concrete practices and configs worth copying

**3.1 AGENTS.md as a map (pattern from OpenAI's harness post and Lopopolo's repo; synthesized template, not verbatim).** Aim for no more than about 100–150 lines and only non-inferable content.

```markdown
# AGENTS.md
## How to work here
- Build: `make build` · Test one: `make test T=path` · Lint: `make lint` (must pass before PR)
- Done when: tests + lint + typecheck green; behavior verified via <script/devtools>
## Map (read only what the task needs)
- Architecture & layer rules → docs/ARCHITECTURE.md (enforced by lints; don't fight them)
- Active plans → docs/exec-plans/active/ · Tech debt → docs/exec-plans/tech-debt-tracker.md
- Product specs → docs/product-specs/ · Security rules → docs/SECURITY.md
## Landmines (non-obvious)
- Never edit generated/ by hand; run `make gen`.
- Payments service: ask before touching migrations.
## Boundaries
- Always: … · Ask first: … · Never: … (Osmani's three tiers)
```

**3.2 Codex/OpenAI-style task prompt** (Goal / Context / Constraints / Done-when [S]), plus the system-prompt rules from the cookbook [P✓]:

```text
Goal: <outcome, not method>
Context: @src/billing/ @docs/ARCHITECTURE.md  (error log attached)
Constraints: follow layer rules; no new deps; keep public API stable
Done when: `make test` + `make lint` pass; repro script no longer fails; summary lists residual risks
```

Operator rules worth copying from Codex's own prompt [P✓]:
- Never revert changes you didn't make.
- No `git reset --hard`.
- Stop and ask if unexpected diffs appear.
- No single-step plans.
- Review output is findings-first, ordered by severity.

**3.3 Cross-tool AGENTS.md wiring [P✓].**

```bash
mv AGENT.md AGENTS.md && ln -s AGENTS.md AGENT.md        # agents.md FAQ migration recipe
# Aider: .aider.conf.yml →  read: AGENTS.md
```
```json
// Gemini CLI .gemini/settings.json
{ "context": { "fileName": ["AGENTS.md", "GEMINI.md"] } }
```

Copilot reads `**/AGENTS.md`, `/CLAUDE.md` and `/GEMINI.md` natively. Codex merges `~/.codex` and root→cwd AGENTS.md files [P✓]. [K] Codex config knobs to check in the docs: `project_doc_fallback_filenames`, `project_doc_max_bytes` (default ~32 KiB) and `AGENTS.override.md`.

**3.4 Copilot path-scoped instructions and environment setup [P✓; YAML is illustrative K].**

```markdown
---
applyTo: "**/tests/*.spec.ts"
---
Use Playwright fixtures from tests/fixtures; never use page.waitForTimeout.
```
```yaml
# .github/workflows/copilot-setup-steps.yml  (job must be named copilot-setup-steps) [K]
on: workflow_dispatch
jobs:
  copilot-setup-steps:
    runs-on: ubuntu-latest
    permissions: { contents: read }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "npm" }
      - run: npm ci
```

**3.5 Review-load control [P✓].**
- `gh extension install github/gh-stack && gh skill install github/gh-stack`, then `gh stack init feat-auth-model`, `gh stack add feat-auth-api`, `gh stack submit`, `gh stack rebase --upstack`. Review and merge bottom-up.
- Copilot CLI cross-model critic: set `"autoInvoke": true` under `subagents.agents.rubber-duck` in `~/.copilot/settings.json`.
- Cap unattended runs with `--max-autopilot-continues` and `max-ai-credits`.

**3.6 Encode taste as executable rules.**
- Factory-style custom lint rules [P✓]: enums, types and constants in dedicated files; filename must match the export; every `.ts/.tsx` needs a test file; structured logging; API routes must use middleware and schema validation.
- OpenAI-style [S]: layer-dependency lints (Types→Config→Repo→Service→Runtime→UI) and structural tests, with **error messages that tell the agent how to fix the violation**.

**3.7 Spec-driven flows (pick one) [P✓].**
- spec-kit: `/speckit-constitution → /speckit-specify → /speckit-plan → /speckit-tasks → /speckit-implement → /speckit-converge`.
- Conductor: `/conductor:conductor-setup → …-new-track → …-implement → …-review → …-revert`.
- AI-DLC: approval gates per stage, profile chosen per request (Classic vs Express).

**3.8 Background-agent architecture (Ramp/Stripe/Symphony composite) [P✓ OSS + K].**
1. **Trigger:** from Slack, an issue or Linear.
2. **Environment:** an isolated, pre-warmed sandbox or devbox per task with a snapshot image.
3. **Harness:** OpenCode, Claude Agent SDK, Codex or a goose fork.
4. **Tools:** a central MCP tool gateway.
5. **Feedback:** fast local lint first, then **at most two CI rounds** before handing back.
6. **Output:** a PR with proof of work (CI status, screenshots or video, risk notes).
7. **Review:** human or agent review tiered by risk.
8. **Attribution:** commits attributed to the prompting human.

**3.9 Lopopolo's harness-improvement loop [P✓].**
1. Pick one real, rerunnable job and record its contract: model, config, accepted outcome, proof, authority, budget.
2. Observe a baseline.
3. Diagnose the *earliest failed handoff*: context, capability, domain ownership, authority, proof, feedback, or worker limitation.
4. Make the smallest reversible fix at the earliest owner (typed boundary, domain tool, authority gate, real-system test, actionable diagnostic).
5. Verify at two layers.
6. Run a fresh trajectory and confirm the fix was actually retrieved or used.
7. Retain, revise or remove it. "The durable result is the improved environment and its evidence, not the existence of another harness component."

**3.10 Spotify-style verification loop [K].** Deterministic verifiers (format, lint, build, tests) are exposed as one MCP "verify" tool. An LLM judge then checks the diff against the prompt; on a veto the agent retries once, otherwise the run goes to a human. Restrict tools: no general shell, constrained git.

**3.11 Copilot Memory-style self-validating memory [P✓].** Store learned repo facts *with code citations*, revalidate them against the current branch before use, and expire them when unused (28 days). Put a "Learnings" section in the instructions file (as VS Code does), but prune it.

---

## 4. Disagreements, caveats, failure modes

This section opens with the cross-company synthesis: what nearly everyone converges on (4.1) and where they split (4.2).

### 4.1 Convergence: 15 principles nearly every company shares

1. **The repository is the agent's world.** Knowledge the agent needs lives in the repo, versioned and reviewable. "What the agent can't see doesn't exist" (OpenAI). The same idea appears as:
   - Conductor's "repository as the single source of truth";
   - spec-kit and Kiro specs and steering, and AI-DLC artifacts;
   - DORA's "AI-accessible internal data" capability.
2. **A small root instruction file, with depth on demand.** AGENTS.md is the cross-tool carrier: 23 tools; read natively by Copilot, Junie and Amp; Gemini via `context.fileName`. Typical sizes are about 100 lines at OpenAI and about 158 at VS Code. Gemini CLI does just-in-time discovery, and Codex merges files root-to-leaf.
3. **Only high-signal, non-inferable content, grown from observed failures.**
   - Osmani's discoverability filter.
   - Cursor: add a rule only after a repeated mistake [K].
   - Codex: retrospective → AGENTS.md [S].
   - VS Code's "Learnings" section.
   - Lopopolo: "earliest durable owner."
4. **An executable definition of done that the agent can check itself.**
   - Codex "Done when" [S].
   - agents.md FAQ: listed checks get run.
   - GitHub: build/test/validate → mergeable PRs.
   - OpenAI: Chrome DevTools and an observability stack per worktree [S].
   - Spotify's verify tool [K]; Cursor TDD [K].
5. **Mechanical enforcement over prose.** Custom lint rules and structural tests, with error messages written for the agent: OpenAI [S], Factory [P✓], Cursor's "use a linter, not a style guide" [K], Lopopolo's "the repository teaches the agent" [P✓].
6. **Plan before code on non-trivial work; re-plan rather than patch.** Codex Plan mode; Cursor Plan Mode [K]; Copilot's research-and-plan before opening a PR; Antigravity plan Artifacts; spec-kit, Kiro, Conductor and AI-DLC approval gates.
7. **Small scopes and small diffs.** DORA's "small batches"; GitHub task guidance and stacked PRs; Devin's 4–8 hour task sweet spot [K]; Airbnb's per-file state machine [K].
8. **An isolated, reproducible environment per task.** Copilot's fresh VM plus `copilot-setup-steps.yml`; Stripe devboxes [K]; Ramp/Open-Inspect sandboxes; OpenAI's per-worktree stacks [S]; Symphony's isolated runs; Copilot CLI local sandboxing.
9. **Least privilege, with capability kept separate from authority.**
   - GitHub: the agent can't merge; CODEOWNERS on agent config; secrets isolation.
   - Agentic Workflows: read-only tokens and "safe outputs."
   - OpenAI Sevbot never executes mitigations [S].
   - Replit's dev/prod separation [K].
   - Lopopolo: "separate contracts."
10. **Deterministic scaffolding around agentic steps.** Stripe blueprints [K]; Shopify Roast cogs; Airbnb's state machine [K]; AI-DLC's "same deterministic engine"; gh-aw compiled `.lock.yml`.
11. **Bounded loops with escalation to a human.** Copilot autopilot's 5 continuations and `max-ai-credits`; Stripe's two-CI-round cap [K]; Cursor hook iteration caps [K]; Symphony "proof of work" before landing.
12. **Review becomes risk-tiered verification.** Agents do first-pass review, often cross-model, and humans own intent and high-risk changes. Examples: OpenAI's risk tiers [S]; Codex reviewing every PR [S]; Copilot rubber duck; Bugbot and uReview [K]; GitHub's AI-code checklist; Osmani.
13. **Asynchronous background agents triggered from existing workflows** (Slack, issues, Linear) that return PRs with evidence: Symphony, Copilot cloud agent and Agent HQ, Jules, Codex cloud, Stripe, Ramp, Spotify.
14. **Foundations amplify AI, so measure outcomes rather than activity.**
    - DORA's amplifier thesis, platform engineering and J-curve.
    - Factory Agent Readiness.
    - Stripe: "good for humans is good for agents" [K].
    - Lopopolo's effectiveness thesis.
    - GitHub: "downstream goals."
15. **Continuous maintenance ("garbage collection") as a standing loop.** OpenAI's doc-gardening agents and quality grades plus Perf Factory [S]; GitHub Agentic Workflows; Spotify Fleet Management [K]; Meta's ephemeral per-diff JiTTests [S].

### 4.2 Disagreements
1. **One agent or many?**
   - *Single-agent:* Cognition's "Don't build multi-agents" [K]; Lopopolo's "give one agent the whole job" [P✓].
   - *Parallel:* Cursor's planner/worker swarms [K]; Copilot `/fleet` [P✓]; Antigravity's Manager view [S]; Codex power users running 3+ agents [P~].
   - *Where they meet:* read-only subagents are acceptable (retrieval, critique: SWE-grep [K], Amp Oracle/Librarian [K], Copilot rubber duck [P✓]). Parallel *writers* need a planner hierarchy and isolation.
   - OpenAI observes that longer-running agents reduce the need for parallel tasks [S].
2. **Do humans review code?**
   - "No": StrongDM [K]; OpenAI harness ("aren't required") [P~].
   - "Yes, gated": GitHub defaults (agent can't merge; CODEOWNERS) [P✓]; OpenAI's factory (mandatory human for high-risk) [S]; Stripe (human-reviewed Minion PRs) [K]; Osmani ("Human judgment doesn't leave the software factory") [S].
   - DORA's finding that AI raises instability supports caution [S].
3. **Heavy spec process or lightweight plans?**
   - Heavy: spec-kit, Kiro, AI-DLC (33 stages) and Conductor formalize specs.
   - Light: Cursor's "revert and re-plan" [K], Codex's lean "outcome-first" prompting [S] and Lopopolo's whole-job thesis favor short plans in the loop.
   - Critics call heavy spec-driven development waterfall-like and review-heavy (for example, Thoughtworks commentary [K]). A third-party Conductor overview flags higher token use on large projects [S].
   - Osmani splits the difference with a "15-minute waterfall": a short spec and plan, then small iterations [S].
4. **Static or dynamic context?**
   - Static wins for must-know knowledge: Vercel's index beat skills [S/vendor].
   - Dynamic wins for everything else: Cursor's "dynamic context discovery" [K]; Gemini's JIT GEMINI.md [P✓]; skills' progressive disclosure [P✓].
   - Practical resolution: a small static map plus on-demand depth.
5. **Build or buy background agents?**
   - Build: Stripe (goose fork), Ramp (own platform on OpenCode/Modal) and StrongDM (Attractor) [K/P✓].
   - Standardize on a vendor harness: Spotify (Claude Code) [K].
   - Buy: GitHub Agent HQ, Devin, Codex cloud and Jules.
6. **Which model for long autonomy?** Cursor found GPT-5.2 better than Opus 4.5 for long runs [K]; Spotify picked Claude Code [K]; Amp hides model choice entirely [K]; GitHub uses cross-model critique on purpose [P✓]. All of these are snapshot-in-time and vendor-specific.
7. **What to measure.**
   - "% of code AI-generated": Google 75% [S]; Coinbase and Microsoft [K].
   - Velocity: Google about 10% [S]; RCT about 21% [P~]; DORA ROI and J-curve [P~].
   - Lopopolo: tokens and lines are inputs, not goals [P✓]. GitHub: "measure downstream goals" [P✓].
8. **Mandates and token targets.**
   - Mandates: Shopify, Coinbase and Meta tie AI use to reviews or require onboarding [K]; StrongDM sets $1,000/day/engineer [K]; Lopopolo's "token mandates" essay [P~ title].
   - Against: OpenAI reports organic non-engineering adoption without a mandate [S]; cost controls (`max-ai-credits`, autopilot caps) [P✓].

### 4.3 Caveats
- Almost every outcome number here is *self-reported or vendor-reported*: OpenAI's 1M LOC and 70% more PRs; Google's 75%; Stripe's 1,000 PRs a week; Spotify's 1,500 PRs; Ramp's 30%; Augment's +80%; Vercel's 100%.
- The only independent or controlled evidence in this slice is Google's RCT (n=96, wide CI) and DORA's survey (correlational). Slice 4 covers RCTs such as METR's.
- The OpenAI factory article publishes no defect, change-failure or rollback data [S].
- Vercel's eval has 19 tasks and a conflict of interest (it ships skills tooling) [S].
- The ETH AGENTS.md figures reached me only through secondary digests, one of which later retracted its own summary numbers [S]. Read the paper (arXiv 2602.11988) before quoting them.

### 4.4 Failure modes documented by companies
- **Context rot and anchoring:** monolithic or auto-generated context files crowd out the task (OpenAI) and bias agents toward stale tech (Osmani).
- **Skills that never fire:** in Vercel's eval, skills were skipped often enough that default skills added +0pp (see the 56% ambiguity in §1, item 5).
- **Coordination pathologies:** lock contention, and risk-averse agents under optimistic concurrency (Cursor [K]).
- **Review collapse:** large PRs degrade review quality (GitHub); comprehension debt (Osmani); rising zero-review merges (Osmani, Jun 2026).
- **Throughput without stability** (DORA).
- **Runaway cost:** autopilot and `/fleet` consume credits unattended (GitHub).
- **Destructive actions without environment separation:** the Replit production-DB deletion (Jul 2025) [K]; the reported AWS/Kiro disruption (disputed) [K].
- **Showcase-quality concerns** about autonomous mega-projects such as Cursor's browser [K].

---

## 5. Key dates

- **2023:** Meta CodeCompose [K].
- **Feb 2024:** Meta TestGen-LLM [K].
- **6 Jun 2024:** Google "AI in software engineering at Google" [P~].
- **Aug 2024:** Amazon Q Developer Java-upgrade results (4,500 dev-years, $260M) [K].
- **Oct 2024:** Google ~25% of new code AI-generated [K/S]; Google RCT preprint [P~].
- **Jan 2025:** goose launched [S]; Google migrations paper [K].
- **Mar 2025:** Airbnb Enzyme→RTL migration [K].
- **Apr 2025:** Shopify memo [K]; Codex CLI [K].
- **May 2025:** Codex cloud; Copilot coding agent preview [K].
- **Jun 2025:** Cognition "Don't Build Multi-Agents" [K].
- **Jul 2025:** Kiro preview; Bugbot GA; Replit DB incident [K].
- **Aug 2025:** Coinbase mandate; AGENTS.md format launched [K].
- **Sep 2025:** spec-kit [K]; GPT-5-Codex [K]; DORA 2025 report [P~/S]; Replit Agent 3 [K].
- **Oct 2025:** Jules Tools and API [S]; Codex GA at DevDay [K]; Agent HQ and Octoverse at Universe [K]; Cursor 2.0 and Composer [K].
- **Nov 2025:** Spotify Honk series [K]; Kiro GA [K]; Antigravity and Gemini 3 (18 Nov) [S]; GPT-5.1-Codex-Max and the "AI-Native Engineering Team" guide [P~/S].
- **Dec 2025:**
  - 4 Dec: OpenAI forum recap (92% adoption, every PR reviewed) [S].
  - 9 Dec: AAIF formed [P~].
  - 11 Dec: GPT-5.1-Codex-Max prompting guide [S].
  - Conductor [P~].
  - GPT-5.2-Codex (date [K]; existence [P✓] via its prompt file).
- **Jan 2026:**
  - 4 Jan: Osmani workflow [P~].
  - 13 Jan: Osmani "good spec" [S].
  - Mid-Jan: Cursor best-practices, scaling-agents and dynamic-context posts [K].
  - 27 Jan: Vercel AGENTS.md vs skills [S].
  - 28 Jan: Osmani "80% problem" [P~].
  - 30 Jan: Meta JiTTesting [S].
  - Ramp Inspect [K].
- **Feb 2026:**
  - Codex app launched [S]; gpt-5.3-codex (date [K]; covered by the cookbook guide [P✓]); Stripe Minions [K]; StrongDM Software Factory [K].
  - 6 Feb: Augment Context Engine MCP [S].
  - 11 Feb: OpenAI "Harness engineering" [P~].
  - 23 Feb: Osmani anti-/init [S].
  - ETH AGENTS.md study [S].
- **H1 2026:** DORA "ROI of AI-assisted Software Development" (v2026.01; InfoQ May 2026) [P~/S].
- **22 Apr 2026:** Pichai: 75% of new Google code AI-generated [S].
- **19 May 2026:** Google I/O: Antigravity 2.0, SDK, Gemini 3.5 Flash [S].
- **May–Jul 2026:** GPT-5.5 and GPT-5.6 ("Sol") appear in third-party Codex prompting guides [S]; official release dates unverified.
- **Jun 2026:**
  - 9 Jun: "OpenAI's Framework for Shipping Code at 70 PRs/Week" (Tessl) [P~ title].
  - 18 Jun: reported consumer-tier Gemini CLI cutoff (disputed) [S].
  - 25 Jun: "The Shift to Agentic AI: Evidence from Codex" [P~].
  - Osmani "Agentic Code Review" [S].
- **17 Jul 2026:** Lopopolo "token mandates" and "maintenance loops" essays [P~ titles].
- **Aug 2026:** Osmani's "software factory," "Audit your Agent files" and "Skill Decay" posts [S].
- **Sep 2026:**
  - DORA says no 2026 survey [S].
  - 14 Sep: Osmani "Brownfield Agentic Engineering" [S].
  - 15 Sep: Pragmatic Engineer, "Inside OpenAI's agentic software factory" [S].
- **6–10 Oct 2026:** Gemini CLI v0.63.0; Codex CLI 0.162.x [P✓].

---

## 6. Sources

Format: Title — author/org — date — URL — note — [primary|secondary]

**OpenAI**
- Harness engineering: leveraging Codex in an agent-first world — Ryan Lopopolo/OpenAI — 11 Feb 2026 — https://openai.com/index/harness-engineering/ — 1M LOC, zero hand-written code; known via snippets — [primary]
- OpenAI harness engineering (news) — InfoQ — Feb 2026 — https://www.infoq.com/news/2026/02/openai-harness-engineering-codex — coverage — [secondary]
- Harness Engineering survey — yage.ai — 12 Mar 2026 — https://yage.ai/share/harness-engineering-survey-en-20260312.html — observability stack and PR counts — [secondary]
- OpenAI's Agent-First Codebase Learnings — Alex Lavaee — 2026 — https://alexlavaee.me/blog/openai-agent-first-codebase-learnings/ — 3.5 PRs/day — [secondary]
- Evaluation: OpenAI harness engineering — F. Bruniaux guide — 2026 — https://raw.githubusercontent.com/FlorianBruniaux/claude-code-ultimate-guide/main/docs/resource-evaluations/2026-02-11-openai-harness-engineering.md — structured digest — [secondary]
- lopopolo/harness-engineering (theses, playbooks, sources) — Ryan Lopopolo — 2026 — https://github.com/lopopolo/harness-engineering — author's own corpus — [primary]
- Improve-harness playbook — Lopopolo — 2026 — https://raw.githubusercontent.com/lopopolo/harness-engineering/trunk/playbooks/improve-harness.md — procedure — [primary]
- Sources list (talks and essays) — Lopopolo — 2026 — https://raw.githubusercontent.com/lopopolo/harness-engineering/trunk/sources/README.md — dates and titles — [primary]
- Symphony — OpenAI — 2026 — https://github.com/openai/symphony — Codex orchestration spec — [primary]
- An open-source spec for Codex orchestration: Symphony — OpenAI — 2026 — https://openai.com/index/open-source-codex-orchestration-symphony/ — URL seen only — [primary]
- Codex Prompting Guide (gpt-5.3-codex) — OpenAI Cookbook — 2026 — https://raw.githubusercontent.com/openai/openai-cookbook/main/examples/gpt-5/codex_prompting_guide.ipynb — harness and prompt rules — [primary]
- gpt-5.2-codex system prompt — OpenAI — 2025–26 — https://raw.githubusercontent.com/openai/codex/main/codex-rs/core/gpt-5.2-codex_prompt.md — git safety, review mode — [primary]
- Codex releases — OpenAI — Oct 2026 — https://github.com/openai/codex/releases — 0.162.1 — [primary]
- Codex best practices — OpenAI — 2026 — https://developers.openai.com/codex/learn/best-practices — Plan mode, AGENTS.md, skills; snippets only — [primary]
- Using skills to accelerate OSS maintenance — OpenAI — 2026 — https://developers.openai.com/blog/skills-agents-sdk — `.agents/skills` — [primary]
- How OpenAI uses Codex — OpenAI — ~Oct 2025 — https://cdn.openai.com/pdf/6a2631dc-783e-479b-b1a4-af0cfbd38630/how-openai-uses-codex.pdf — internal use cases — [primary]
- Building an AI-Native Engineering Team — OpenAI — Nov 2025 — https://developers.openai.com/codex/guides/build-ai-native-engineering-team — Delegate/Review/Own — [primary]
- How OpenAI Engineers use Codex… with Rigor — OpenAI Forum — 4 Dec 2025 — https://forum.openai.com/home/blogs/how-openai-engineers-use-codex-to-tackle-big-projects-with-rigor-2025-12-04 — 92% adoption, ~70% more PRs — [secondary/self-reported]
- The Shift to Agentic AI: Evidence from Codex — Johnston, Holtz et al. — 25 Jun 2026 — https://arxiv.org/abs/2606.26959 — usage economics from OpenAI data — [primary]
- Inside OpenAI's agentic software factory — Gergely Orosz — 15 Sep 2026 — https://newsletter.pragmaticengineer.com/p/openai-software-factory — paywalled — [secondary]
- Agentic software factories (stage table) — F. Bruniaux guide — 2026 — https://github.com/FlorianBruniaux/claude-code-ultimate-guide/blob/main/guide/workflows/agentic-software-factories.md — digest of Orosz plus case list — [secondary]
- OpenAI factory (LLMOps DB) — ZenML — 2026 — https://www.zenml.io/llmops-database/building-an-agentic-software-factory-for-high-velocity-development — tool access — [secondary]
- OpenAI co-founds the Agentic AI Foundation — OpenAI — Dec 2025 — https://openai.com/blog/agentic-ai-foundation — AAIF — [primary]
- Agentic AI Foundation — InfoQ — Dec 2025 — https://infoq.com/news/2025/12/agentic-ai-foundation/ — coverage — [secondary]
- agents.md repo (FAQ, compatibility, hero) — AGENTS.md maintainers — 2025–26 — https://github.com/agentsmd/agents.md — standard semantics, 23 tools, "60k" — [primary]
- GPT-5.6 outcome-first prompting — Daniel Vaughan — 26 Jul 2026 — https://codex.danielvaughan.com/2026/07/26/gpt56-outcome-first-prompting-lean-system-prompts-codex-cli-agents-md-strategy/ — third-party — [secondary]
- Harness engineering for coding agent users — Birgitta Böckeler (Thoughtworks) — 2026 — https://martinfowler.com/articles/harness-engineering.html — URL seen only, content not reviewed — [secondary]

**Google**
- AI in software engineering at Google: Progress and the path ahead — Chandra, Tabachnyk — 6 Jun 2024 — https://research.google/blog/ai-in-software-engineering-at-google-progress-and-the-path-ahead/ — internal tooling — [primary]
- How much does AI impact development speed? (RCT) — Paradis et al./Google — 2024–25 — https://arxiv.org/abs/2410.12944v3 — ~21% faster, n=96 — [primary]
- Google CEO says 75% of new code is AI-generated — Semafor — 24 Apr 2026 — https://www.semafor.com/article/04/24/2026/google-ceo-says-75-of-companys-new-code-is-ai-generated — Cloud Next claim — [secondary]
- Google's 75% AI Code: What Pichai Didn't Say — newsanalysis.net — 2026 — https://newsanalysis.net/pichai-google-75-percent-ai-code-claim/ — critique, trend figures — [secondary]
- 2025 DORA State of AI-assisted Software Development (PDF) — DORA/Google Cloud — Sep 2025 — https://services.google.com/fh/files/misc/2025_state_of_ai_assisted_software_development.pdf — report — [primary]
- How are developers using AI? Inside DORA 2025 — Google — Sep 2025 — https://blog.google/innovation-and-ai/technology/developers-tools/dora-report-2025/ — 90%, 65% — [primary]
- Introducing DORA's inaugural AI Capabilities Model — Google Cloud — 2025 — https://cloud.google.com/blog/products/ai-machine-learning/introducing-doras-inaugural-ai-capabilities-model — 7 capabilities — [primary]
- What 2025 DORA means for developers — ADTmag — 24 Sep 2025 — https://adtmag.com/articles/2025/09/24/what-2025-dora-report-means-for-developers.aspx — trust split — [secondary]
- DORA: ROI of AI-assisted Software Development — Google Cloud — 2026 — https://cloud.google.com/resources/content/dora-roi-of-ai-assisted-software-development — J-curve — [primary]
- New DORA report: foundations drive AI ROI — InfoQ — May 2026 — https://www.infoq.com/news/2026/05/dora-roi-ai-assisted-dev-report/ — coverage — [secondary]
- What should one think of the 2026 DORA brochure? — makemeacto — 2026 — https://makemeacto.cc/what-should-one-think-of-the-2026/ — critique; no-2026-survey note — [secondary]
- GEMINI.md docs; skills best practices; releases — Google — 2026 — https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/cli/gemini-md.md · https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/cli/skills-best-practices.md · https://github.com/google-gemini/gemini-cli/releases — JIT context; still shipping — [primary]
- Conductor (blog and repo) — Google — Dec 2025/Jan 2026 — https://developers.googleblog.com/conductor-introducing-context-driven-development-for-gemini-cli/ · https://github.com/gemini-cli-extensions/conductor — context-driven development — [primary]
- Google announces Antigravity — SD Times — Nov 2025 — https://sdtimes.com/softwaredev/google-announces-agentic-development-platform-google-antigravity/ — Manager view, Artifacts — [secondary]
- All the news from the I/O 2026 developer keynote — Google — May 2026 — https://developers.googleblog.com/all-the-news-from-the-google-io-2026-developer-keynote/ — Antigravity 2.0 — [primary]
- Gemini CLI retired → Antigravity CLI — InventiveHQ — 2026 — https://inventivehq.com/blog/gemini-cli-deprecated-antigravity-cli-migration — disputed — [secondary]
- Jules Tools CLI — TechRadar — Oct 2025 — https://www.techradar.com/pro/googles-ai-coding-agent-jules-is-getting-new-command-line-tools — [secondary]
- Gemini 3 developer guide — Google — 2025–26 — https://ai.google.dev/gemini-api/docs/gemini-3?hl=pt — thinking_level — [primary]
- Gemini 3 prompting best practices — Phil Schmid — 2025 — https://www.philschmid.de/gemini-3-prompt-practices — [secondary]
- My LLM coding workflow going into 2026 — Addy Osmani — 4 Jan 2026 — https://addyosmani.com/blog/ai-coding-workflow/ — [primary]
- How to write a good spec for AI agents — Addy Osmani — 13 Jan 2026 — https://addyosmani.com/blog/good-spec/ — [primary]
- The 80% Problem in Agentic Coding — Addy Osmani — 28 Jan 2026 — https://addyo.substack.com/p/the-80-problem-in-agentic-coding — [primary]
- Agentic Code Review — Addy Osmani — Jun 2026 — https://addyo.substack.com/p/agentic-code-review — [primary]
- Brownfield Agentic Engineering — Addy Osmani — 14 Sep 2026 — https://addyo.substack.com/p/brownfield-agentic-engineering — [primary]
- Addy Osmani blog index — 2026 — https://addyosmani.com/blog/ — Aug 2026 post titles — [primary]
- Evaluation: Osmani AGENTS.md /init anti-pattern — Bruniaux guide — 2026 — https://raw.githubusercontent.com/FlorianBruniaux/claude-code-ultimate-guide/main/docs/resource-evaluations/076-addy-osmani-agents-md-init-antipattern.md — ETH figures — [secondary]
- Evaluating AGENTS.md (ETH) — Gloaguen et al. — 2026 — https://arxiv.org/html/2602.11988v1 — preprint — [primary]

**Microsoft/GitHub**
- Copilot cloud agent best practices; guardrails; pilot — GitHub — Oct 2026 snapshot — https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/cloud-agent/get-the-best-results.md · https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/cloud-agent/build-guardrails.md · https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/cloud-agent/pilot-cloud-agent.md — [primary]
- Review AI-generated code; Stack AI-generated code — GitHub — 2026 — https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/review-ai-generated-code.md · https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/stack-ai-generated-code-in-pull-requests.md — [primary]
- Third-party coding agents; Agentic Workflows; Copilot Memory; Agent skills — GitHub — 2026 — https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/about-third-party-coding-agents.md · https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/about-github-agentic-workflows.md · https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/copilot-memory.md · https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/about-agent-skills.md — [primary]
- Copilot CLI rubber duck, /fleet, autopilot — GitHub — 2026 — https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/copilot-cli/rubber-duck.md · https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/copilot-cli/fleet.md · https://raw.githubusercontent.com/github/docs/main/content/copilot/concepts/agents/copilot-cli/autopilot.md — [primary]
- spec-kit and spec-driven.md — GitHub — 2025–26 — https://github.com/github/spec-kit · https://raw.githubusercontent.com/github/spec-kit/main/spec-driven.md — [primary]
- VS Code copilot-instructions.md — Microsoft — 2026 — https://github.com/microsoft/vscode/blob/main/.github/copilot-instructions.md — real-world agent file — [primary]
- Amplifier — Microsoft — 2026 — https://github.com/microsoft/amplifier — research demonstrator — [primary]

**AWS, Meta and vendors**
- aidlc-workflows; AI-DLC blog — AWS — 2025–26 — https://github.com/awslabs/aidlc-workflows · https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/ — [primary]
- Kiro repo — AWS — 2026 — https://github.com/kirodotdev/Kiro — [primary]
- Just-in-Time Catching Test Generation at Meta — Meta — 30 Jan 2026 — https://arxiv.org/abs/2601.22832 — URL via evaluation — [primary]; digest https://raw.githubusercontent.com/FlorianBruniaux/claude-code-ultimate-guide/main/docs/resource-evaluations/2026-03-22-harman-jittesting-meta-arxiv.md — [secondary]
- fastrender — Wilson Lin (Cursor research) — 2026 — https://github.com/wilsonzlin/fastrender — browser from the agent-swarm experiment — [primary]
- AGENTS.md outperforms skills in our agent evals — Jude Gao/Vercel — 27 Jan 2026 — https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals — [primary]; digest https://raw.githubusercontent.com/FlorianBruniaux/claude-code-ultimate-guide/main/docs/resource-evaluations/025-vercel-agents-md-vs-skills-eval.md — [secondary]
- Context Engine MCP — Augment — Feb 2026 — https://www.augmentcode.com/product/context-engine-mcp — vendor benchmark — [primary]
- Factory repo; ESLint plugin; Agent Readiness; Using Linters to Direct Agents — Factory — 2025–26 — https://github.com/Factory-AI/factory · https://github.com/Factory-AI/eslint-plugin · https://factory.ai/news/agent-readiness · https://factory.ai/news/using-linters-to-direct-agents — [primary]
- Amp examples and guides; Amp Manual — Amp — 2025–26 — https://github.com/ampcode/amp-examples-and-guides · https://ampcode.com/manual — [primary]
- junie-guidelines — JetBrains — 2026 — https://github.com/JetBrains/junie-guidelines — [primary]
- goose — Block/AAIF — 2026 — https://github.com/block/goose — [primary]

**Large engineering orgs**
- Why we built our background agent — Ramp — Jan 2026 — https://builders.ramp.com/post/why-we-built-our-background-agent — URL seen; content [K] — [primary]
- background-agents (Open-Inspect) — Cole Murray — 2026 — https://github.com/ColeMurray/background-agents — architecture inspired by Ramp — [secondary]
- Attractor NLSpecs — StrongDM — 2026 — https://github.com/strongdm/attractor — Software Factory agent spec — [primary]
- Roast — Shopify — 2025–26 — https://github.com/Shopify/roast — structured AI workflows — [primary]

**Other sources cited inline above (all seen this session)**
- How OpenAI uses Codex (web page) — OpenAI — 2025 — https://openai.com/business/guides-and-resources/how-openai-uses-codex/ — [primary]
- Building an AI-native engineering team (PDF) — OpenAI — Nov 2025 — https://cdn.openai.com/business-guides-and-resources/building-an-ai-native-engineering-team.pdf — [primary]
- The Shift to Agentic AI (OpenAI-hosted PDF) — Jun 2026 — https://cdn.openai.com/pdf/5d1e1489-21c0-43e4-9d42-f87efdbf0082/the-shift-to-agentic-ai-evidence-from-codex.pdf — [primary]
- ICSE 2025 SEIP listing for the Google RCT — https://conf.researchr.org/details/icse-2025/icse-2025-software-engineering-in-practice/26/How-much-does-AI-impact-development-speed-An-enterprise-based-randomized-controlled- — [primary]
- Google CEO says 75% of code is AI-generated — Fast Company — Apr 2026 — https://www.fastcompany.com/91531519/google-ceo-says-75-of-the-companys-code-is-ai-generated — [secondary]
- Pichai on human coders (30% code, 10% velocity) — Storyboard18 — Jun 2025 — https://www.storyboard18.com/brand-makers/sundar-pichai-explains-why-human-coders-still-have-the-edge-over-ai-69385.htm — [secondary]
- DORA AI Capabilities Model commentary — Techstrong — 2025 — https://techstrong.ai/features/ai-doesnt-fix-whats-already-broken-what-doras-new-model-tells-us-about-getting-ai-right/ — [secondary]
- DORA insights — DORA — 2026 — https://dora.dev/insights/ — [primary]
- 100 things we announced at I/O 2026 — Google — May 2026 — https://blog.google/innovation-and-ai/technology/ai/google-io-2026-all-our-announcements/ — [primary]
- I/O 2026 Antigravity 2.0 analysis — jangwook.net — May 2026 — https://jangwook.net/en/blog/en/google-io-2026-antigravity-2-agent-platform-analysis/ — [secondary]
- Gemini CLI extension best practices — Google — 2026 — https://geminicli.com/docs/extensions/best-practices/ — [primary]
- Gemini CLI docs/cli index and repo — Google — 2026 — https://github.com/google-gemini/gemini-cli/tree/main/docs/cli · https://github.com/google-gemini/gemini-cli — [primary]
- Jules research profile — rywalker.com — Sep 2026 — https://rywalker.com/research/jules — plan limits — [secondary]
- Lopopolo AGENTS.md and thesis index — 2026 — https://raw.githubusercontent.com/lopopolo/harness-engineering/trunk/AGENTS.md · https://github.com/lopopolo/harness-engineering/tree/trunk/docs — [primary]
- Lopopolo talks and essays (titles only) — https://tessl.io/podcast/109/ · https://www.latent.space/p/harness-eng · https://hyperbo.la/w/token-mandates/ · https://hyperbo.la/w/code-reds-need-maintenance-loops/ — [primary]
- Codex core prompt files listing — OpenAI — 2026 — https://github.com/openai/codex/tree/main/codex-rs/core — [primary]
- OpenAI Cookbook gpt-5 examples index — https://github.com/openai/openai-cookbook/tree/main/examples/gpt-5 — [primary]
- agents.md compatibility list, FAQ and hero — https://raw.githubusercontent.com/agentsmd/agents.md/main/components/CompatibilitySection.tsx · https://raw.githubusercontent.com/agentsmd/agents.md/main/components/FAQSection.tsx · https://raw.githubusercontent.com/agentsmd/agents.md/main/components/Hero.tsx — [primary]

---

## 7. Unverified / low-confidence items (verify before publishing)

**Process limitation.** The search budget was exhausted and WebFetch could not reach non-GitHub hosts. Every **[K]** item above was written from memory without a re-check.

**Highest-value items to verify, by company:**

**Cursor**
- Jan 2026 posts ("best practices for coding with agents," "scaling long-running autonomous coding," "dynamic context discovery"): exact numbers (1M LOC in about a week; +266K/−193K; 46.9% token reduction) and the quoted GPT-5.2 vs Opus 4.5 comparison.
- Bugbot GA statistics.
- Composer 1.5/2 lineage (reportedly an open-weights base such as Kimi K2.5).
- Any "Cursor 3" interface changes in 2026.
- Criticism of fastrender's quality and compilability.

**Cognition**
- "Don't Build Multi-Agents" quotes (high confidence).
- Agents 101 contents.
- 2025 performance-review numbers (67% vs 34% merge rate; 4x).
- SWE-grep design.
- The Mercedes-Benz and Itaú claims (seen only via aggregator).

**Stripe Minions:** 1,000+ PRs a week (possibly 1,300+ in part 2), about 500 Toolshed tools, the two-CI-round cap, devbox spin-up time, goose fork.

**Spotify Honk:** 1,500+ PRs, 60–90% savings, judge veto rate (~25%) and course-correction (~50%); the Feb 2026 earnings-call remark.

**Ramp Inspect:** the ~30% of merged PRs figure.

**StrongDM:** exact charter wording; the Digital Twin Universe list.

**Shopify, Airbnb, Uber, Coinbase, Zapier, Intercom**
- Shopify memo quotes (high confidence).
- Airbnb migration numbers (high confidence).
- Uber uReview numbers (medium).
- Coinbase percentages (medium).
- Zapier rubric names (medium).
- Intercom "2x" goal (low).

**Amazon**
- Kiro spec file names and GA features.
- AI-DLC's original phase and ritual names.
- Q Developer numbers (high confidence).
- The internal Kiro mandate and ~80% target (medium).
- The FT-reported Kiro-linked outage and Amazon's rebuttal (medium; sensitive).

**Meta**
- TestGen-LLM, ACH and CodeCompose numbers (TestGen-LLM high, others medium).
- "AI-driven impact" in performance reviews (medium).
- JiTTesting figures, which came via a secondary fact-check that relied on Perplexity.

**Google**
- The June 2024 blog's metrics (about 50% of code characters AI-assisted; acceptance rate).
- The ~10% velocity quote.
- The migrations-paper figures (74% / ~50%).
- The 18 Jun 2026 Gemini CLI cutoff, which conflicts with continued OSS releases through Oct 2026.
- Whether DORA truly skipped its 2026 survey.

**OpenAI**
- The exact harness-post wording and the 1,500-PR total.
- Whether the observability-stack details (VictoriaLogs/Metrics, TraceQL) are in the post itself.
- "Best-of-N" in the "How OpenAI uses Codex" PDF.
- The "retrospective → AGENTS.md" advice on the official best-practices page.
- Codex config keys (`project_doc_max_bytes`, `project_doc_fallback_filenames`, `AGENTS.override.md`).
- The model timeline after gpt-5.3-codex (GPT-5.4/5.5/5.6 "Sol" naming seen only in third-party blogs).
- The meaning of "70 PRs/Week" in the Tessl episode title.

**Microsoft/GitHub**
- Octoverse 2025 figures (180M developers; TypeScript #1; ~80% of new developers use Copilot in their first week).
- The Agent HQ launch partner list.
- Copilot coding agent launch and GA dates.
- Any Microsoft-internal agent-adoption studies (e.g., dotnet/runtime experience reports). None were reviewed this session.

**Block:** internal goose adoption metrics, and reports of AI-attributed 2026 headcount reductions. Neither was reviewed, and both are omitted above.

**Vercel:** whether "56%" in the AGENTS.md-vs-skills post means skills *were* invoked in 56% of runs (secondary digest) or were *never* invoked in 56% of runs (my recollection). The headline pass rates (53/53/79/100) are consistent across sources.

**Augment and Factory:** all benchmark figures (Augment +80/+71/+30%; Factory "top performing in terminal benchmarks") are vendor-run and unreplicated. Factory's Agent Readiness pillar and level names are [K] only.
