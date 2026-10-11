# Methods, Community Frameworks & the Tool Landscape for AI-Assisted Coding — state of the art as of 2026-10-11 (Brief 08)

**Scope:** (a) a catalog of methodologies; (b) how to author CLAUDE.md and AGENTS.md; (c) community configuration ecosystems; (d) AI code review and CI; (e) the tool landscape.

**How this was researched:**
- The shared WebSearch budget ran out partway through, after about 25 searches from this agent.
- WebFetch could reach only github.com, anthropic.com, claude.com and code.claude.com. martinfowler.com, openai.com, vercel.com, arxiv.org, humanlayer.dev, simonwillison.net, harper.blog, stackoverflow.co and factory.ai all failed with a DNS error.
- Claims are therefore anchored on GitHub READMEs, Anthropic docs and blogs, and search-result excerpts of primary pages. Anything taken from memory is flagged inline and listed in §7.
- GitHub star counts were read from the repo pages on 2026-10-11.

---

## 1. Top takeaways

1. **The canonical loop has converged.** It runs: explore or research, then plan with human review, then implement against a check the agent can run, then commit, then get an independent review. Anthropic's current docs put "give Claude a way to verify its work" first, ahead of planning. Their test for skipping the plan step: *"If you could describe the diff in one sentence, skip the plan."* — [code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices)
2. **Most named methodologies are really context-management strategies.**
   - HumanLayer's "frequent intentional compaction" keeps context utilization at 40–60%.
   - It also moves human review upstream: one bad line in a plan can cause hundreds of bad lines of code, and a research misunderstanding can cause thousands. — [ace-fca.md](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md)
3. **HumanLayer has revised Research→Plan→Implement (RPI) into QRSPI** (Question, Research, Design, Structure, Plan, Worktree, Implement, PR).
   - Each phase stays under 40 instructions.
   - The human reviews a ~200-line design and a ~2-page structure outline instead of a 1,000-line plan.
   - Secondary sources say Dex Horthy recanted the 2025 advice not to read the code. — [qrspi README](https://github.com/matanshavit/qrspi) (talk: March 2026)
4. **Spec-driven development (SDD) is the most popular and the most contested method.**
   - spec-kit has **140.7k★**. Its constitution, `/speckit-*` commands and a new `converge` step are on the [repo page](https://github.com/github/spec-kit).
   - OpenSpec (**71.6k★**) markets itself as the lighter option for existing (brownfield) codebases. — [OpenSpec](https://github.com/Fission-AI/OpenSpec)
   - Böckeler names three levels of SDD (spec-first, spec-anchored, spec-as-source) and warns about review overload and a false sense of control. — [martinfowler.com](https://www.martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) (Oct 15, 2025)
5. **Ralph turned into a product.**
   - The original is a fresh-context bash loop that keeps state on disk and relies on backpressure from tests, types and lints.
   - Anthropic shipped it as the `ralph-loop` plugin (a Stop hook inside the same session), then as **`/goal`**: a prompt-based Stop hook in which a small fast model judges a completion condition after every turn. — [ralph plugin](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum), [/goal docs](https://code.claude.com/docs/en/goal)
6. **Process plugins are now how methodologies spread.**
   - **Superpowers** (297k★): brainstorm → worktree → 2–5-minute tasks → a fresh subagent per task with review → enforced TDD → finish the branch. It is listed in Anthropic's official marketplace. — [obra/superpowers](https://github.com/obra/superpowers)
   - Every's **compound-engineering** (25.5k★): plan → work → simplify → review → *compound* (lessons written to `docs/solutions/`), with 80% of effort on planning and review. — [EveryInc plugin](https://github.com/EveryInc/compound-engineering-plugin)
7. **Multi-agent work has three tiers.** Pick by who holds the plan.
   - **Subagents** are the default, for context isolation.
   - **Agent teams** are experimental. Start with 3–5 teammates and 5–6 tasks each.
   - **Dynamic workflows** are scripted fan-out: up to 16 concurrent agents and 1,000 agents per run. — [agent teams](https://code.claude.com/docs/en/agent-teams), [workflows](https://code.claude.com/docs/en/workflows)
   - Anthropic warns that *"most coding tasks involve fewer truly parallelizable tasks than research"* and that multi-agent setups use about 15× the tokens of a chat. — [multi-agent research](https://www.anthropic.com/engineering/multi-agent-research-system)
8. **The ceiling for parallel agents is set by the verifier.** Carlini ran 16 parallel Claudes over ~2,000 sessions for just under $20k and produced a ~100k-line Rust C compiler that builds Linux 6.9. *The task verifier must be nearly perfect.* — [Anthropic](https://www.anthropic.com/engineering/building-c-compiler) (Feb 5, 2026)
9. **Criteria for an "agent-ready" codebase have converged** on:
   - fast, deterministic tests;
   - linters and type checks used as guardrails;
   - a short AGENTS.md that acts as an index, with `docs/` as the system of record;
   - observability the agent can read;
   - one-command dev environment scripts;
   - discoverable tasks.

   Factory formalized this as 8 pillars and 5 levels, with 80% of a level's criteria needed to advance. — [factory.ai/news/agent-readiness](https://factory.ai/news/agent-readiness) (Jan 20, 2026)
10. **Anthropic's CLAUDE.md guidance is now "under 200 lines, non-inferable facts only."** Procedures go in skills, narrow rules in path-scoped `.claude/rules/`, and anything that must always happen goes in hooks. Claude Code reads AGENTS.md natively from v2.1.277. — [memory docs](https://code.claude.com/docs/en/memory), [steering blog](https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more) (Jun 18, 2026)
11. **Evidence on context files is mixed and the effects are modest.**
    - ETH Zurich: *"context files tend to reduce task success rates compared to providing no repository context"* and raise inference cost by more than 20%. — [paper notes](https://github.com/AkihikoWatanabe/paper_notes/issues/4710), [arXiv 2602.11988](https://arxiv.org/pdf/2602.11988) (Feb 2026)
    - Vercel: an 8KB docs index in AGENTS.md hit **100%** on its evals, against **79%** for skills. Skills were never invoked in 56% of cases. — [Vercel](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals) (Jan 2026; vendor eval)
12. **The ecosystem is huge and noisy.**
    - The official marketplace lists **342 plugins**, some badged "Anthropic verified". — [claude.com/marketplace](https://claude.com/marketplace/plugins)
    - Mega-collections such as everything-claude-code (276.6k★, 306 skills) tell users to install a minimal profile.
    - Some popular projects carry unverified benchmark claims (ruflo) or trust red flags (claude-mem's README endorses a crypto token).
13. **Managed AI code review is now a standard CI layer.**
    - Anthropic's Code Review launched Mar 9, 2026. It costs about $15–25 per review and takes about 20 minutes on average.
    - Internally, PRs with substantive review comments rose from 16% to 54%, and engineers marked under 1% of findings as incorrect. These are self-reported numbers.
    - It is tuned with a `REVIEW.md` file. — [claude.com/blog/code-review](https://claude.com/blog/code-review), [docs](https://code.claude.com/docs/en/code-review)
14. **Anthropic's own software lifecycle is a reusable template.** Claude authors about 80% of merged code. Each PR gets several narrow review agents plus SAST; code is tiered by risk, with mandatory human approval for critical code; new AI reviewers run in shadow mode first; every agent gets a single-purpose identity. — [claude.com blog](https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle) (Jul 21, 2026)
15. **Open-source terminal agents have very large followings** (stars as of today): OpenCode 212.6k★, Claude Code 150.1k★, Codex 128.6k★, pi 114.2k★, Gemini CLI 107.3k★. Methods now move between tools through AGENTS.md, Agent Skills, and plugins that install on 14–16 different agents. — repo pages in §6
16. **Claude Code adoption signals:**
    - $1B run-rate revenue about six months after GA (Nov 2025). — [Anthropic](https://www.anthropic.com/news/anthropic-acquires-bun-as-claude-code-reaches-usd1b-milestone)
    - More than $2.5B run-rate and an estimated 4% of public GitHub commits (SemiAnalysis, Feb 2026). — [Anthropic](https://www.anthropic.com/news/anthropic-raises-30-billion-series-g-funding-380-billion-post-money-valuation)
17. **The vocabulary shifted from "vibe coding" (Feb 2025) to "vibe engineering" (Oct 2025) to "agentic engineering" (Feb 2026).** The dividing line is professional accountability: tests, review, and reading the code. — [Willison, Feb 23, 2026](https://simonwillison.net/2026/Feb/23/agentic-engineering-patterns/)

---

## 2. Detailed findings

### (a) Methodology catalog

#### A1. Explore → Plan → Code → Commit (Anthropic)

**Origin:** Anthropic's "Claude Code: Best practices for agentic coding" (Apr 2025; the date is from memory). That URL now 308-redirects to the living docs page. — [docs](https://code.claude.com/docs/en/best-practices)

**Steps:**
1. **Explore in plan mode.** Press `Shift+Tab` or start with `claude --permission-mode plan`. Claude reads but does not edit.
2. **Plan.** Ask for a plan; `Ctrl+G` opens it in your editor.
3. **Implement.** Ask Claude to write tests and run the suite.
4. **Commit.** Ask Claude to commit and open a PR.

**Fit:** Use it when the approach is uncertain, the change touches several files, or the code is unfamiliar.

**Additions in the current docs:**
- "Let Claude interview you": an `AskUserQuestion` prompt that produces SPEC.md, then a fresh session for implementation.
- The Writer/Reviewer pattern with two sessions.
- A fresh-context adversarial review subagent. The docs warn that reviewers *"prompted to find gaps will usually report some… chasing every finding leads to over-engineering"*.
- `/clear` after two failed corrections.

**Official implementation:** the `feature-dev` plugin, a 7-phase workflow:
1. Discovery.
2. Codebase exploration with 2–3 parallel `code-explorer` agents.
3. Clarifying questions; the workflow **waits** for answers.
4. Architecture with 2–3 `code-architect` options.
5. Implementation after explicit approval.
6. Review by 3 parallel `code-reviewer` agents.
7. Summary.

— [feature-dev](https://github.com/anthropics/claude-code/tree/main/plugins/feature-dev)

#### A2. Research → Plan → Implement with frequent intentional compaction (HumanLayer, Aug 2025)

**Origin:** Dex Horthy / HumanLayer, "Advanced Context Engineering for Coding Agents". It references a YC talk on Aug 20 and examples from Aug 2025. — [ace-fca.md](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md) (also at [humanlayer.com](https://www.humanlayer.com/blog/advanced-context-engineering))

**Steps:**
1. **Research.** Map the relevant files and the information flow. This step can be repeated across several compacted passes.
2. **Plan.** Spell out exact steps and files, *"being super precise about the testing / verification steps in each phase."*
3. **Implement phase by phase** in a git worktree, compacting status back into the plan after each verified phase.

**Rules:**
- Keep context utilization at 40–60%.
- Review research and plans rather than code: *"When you review the research and the plans, you get more leverage."*

**Reference prompts:** 27 files in `humanlayer/.claude/commands`. They include `research_codebase.md`, `create_plan.md`, `iterate_plan.md`, `implement_plan.md`, `validate_plan.md`, `create_handoff.md`/`resume_handoff.md` (compaction across sessions), and `ralph_research/plan/impl.md`. — [commands](https://github.com/humanlayer/humanlayer/tree/main/.claude/commands)

**Claimed results** (self-reported):
- A ~1-hour bug fix in BAML, a 300k-line Rust codebase.
- About 35k LOC in about 7 hours: 3 hours of research and planning, 4 of implementation.
- A team spend of about $12k per month on Opus.

**Self-reported failures and caveats:**
- A 7-hour Hadoop-removal attempt failed.
- *"you probably need at least one person who is an expert in the codebase"*
- *"I won't even try to convince you that research/plan/implement is the right approach for most teams - it probably isn't."*

**2026 evolution, QRSPI (sometimes called "CRISPY"):** from Horthy's March 2026 talk "Everything We Got Wrong About Research-Plan-Implement" ([talk page](https://www.humanlayer.dev/qrspi-mlops)). A community codification lists eight phases. — [qrspi](https://github.com/matanshavit/qrspi) (72★)

| Phase | Output |
|---|---|
| Question | `task.md`, `questions.md` |
| Research | `research.md`, written **blind to the task** so it stays factual |
| Design | `design.md` (~200 lines); the agent must ask questions before writing it |
| Structure | `structure.md`: vertical slices, each with test checkpoints |
| Plan | `plan.md` |
| Worktree | isolated git worktree |
| Implement | one commit per phase |
| PR | pull request based on the design document |

The original RPI prompts used 85+ instructions each. Secondary write-ups say Horthy now rejects 2025's "trust the plan, don't read the code" stance. — [ZenML summary](https://www.zenml.io/llmops-database/evolution-from-rpi-to-crispy-multi-stage-workflow-for-production-coding-agents) (secondary)

#### A3. Spec-driven development (SDD)

**Böckeler's analysis** (Thoughtworks, Oct 15, 2025): [martinfowler.com](https://www.martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html). I could not fetch it, so the content below comes from search excerpts plus memory.

- **Definition:** writing a spec before writing code with AI. The definition of SDD "is still in flux."
- **Three levels:**
  - *spec-first*: the spec is used for the immediate task.
  - *spec-anchored*: the spec is kept for ongoing maintenance.
  - *spec-as-source*: humans edit only the spec.
- **Critiques** (partly from memory, see §7):
  - One workflow is applied to every problem size. Kiro turned a small bug into multiple user stories with many acceptance criteria.
  - Reviewing piles of markdown can be worse than reviewing code.
  - Specs give a false sense of control: agents still ignored or over-applied instructions.
  - It echoes model-driven development (MDD); spec-as-source risks the inflexibility of MDD combined with the non-determinism of LLMs.

  The Thoughtworks Radar also warns that tools "generate lengthy spec files that are hard to review." — [Radar](https://www.thoughtworks.com/radar/techniques/spec-driven-development)

| Tool | Origin / date | How it works | Status (2026-10-11) |
|---|---|---|---|
| **GitHub spec-kit** | GitHub, Sept 2025 (date from memory) | `specify init <proj> --integration <agent>`. Commands: `/speckit-constitution` (once per project), then per feature `/speckit-specify` → `-plan` → `-tasks` → `-implement` → `-converge`, repeated until it reports "Converged". Earlier versions had `clarify`/`analyze`/`checklist` commands; these are now optional quality gates. The philosophy doc says *"code serves specifications"*. Constitution articles: Library-First, CLI Interface, Test-First (*"NON-NEGOTIABLE"*), Simplicity (*"Maximum 3 projects"*), Anti-Abstraction. The spec template forces `[NEEDS CLARIFICATION: …]` markers, and a spec is not complete until none remain. | **140.7k★**, 12.6k forks. Opt-in extensions for bugs and idea assessment; presets and workflows. [repo](https://github.com/github/spec-kit), [spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md) |
| **AWS Kiro** | Preview July 2025; GA Nov 2025 (both dates from memory) | Agentic IDE plus CLI. Specs are requirements, design and tasks, with a Requirements Analysis step; there are also hooks and steering files. EARS-style acceptance criteria are reported by third parties. | Now IDE, CLI (headless/CI), Web, Mobile (preview), cloud sessions (preview) and Crew. [kirodotdev/Kiro](https://github.com/kirodotdev/Kiro) (issue tracker, 4.4k★). Pricing tiers conflict across third-party sources. |
| **Tessl** | Spec Registry open beta Sept 2025 | Bet on spec-as-source; the regeneration engine is in closed beta and JavaScript-only. | Repositioned in early 2026 as a registry of evaluated **skills**, with Snyk security scores and 3,000+ skills (secondary sources). [codemyspec review](https://codemyspec.com/blog/tessl-review), [rywalker](https://rywalker.com/research/tessl) |
| **OpenSpec** (Fission AI) | 2025 | `openspec init`. Each change gets `openspec/changes/<id>/` holding a proposal, spec deltas (WHEN/THEN scenarios), a design and tasks. Commands: `/opsx:propose`, `/opsx:apply`, `/opsx:archive` (archived changes are merged into the specs). "Fluid not rigid", brownfield-first. Calls spec-kit "thorough but heavyweight" and Kiro IDE lock-in. | **71.6k★**, 30+ assistants, telemetry on by default (opt-out). [repo](https://github.com/Fission-AI/OpenSpec) |
| **BMAD-METHOD** | Brian Madison, 2025 | Agile personas (analyst, PM, architect, UX, scrum master, dev, test architect — persona list from memory). A PRD and an architecture doc are "sharded" into story files. Now "small changes go straight to build". | **54.0k★**. v6 installs as skills/plugins: `npx skills add bmad-code-org/BMAD-METHOD` or `/plugin marketplace add bmad-code-org/bmad-plugins`. [repo](https://github.com/bmad-code-org/BMAD-METHOD) |
| **Agent OS** (Builder Methods, Brian Casel) | 2025 | Now centred on *standards*: Discover, Deploy, Shape Spec, Index. | 5.5k★. The focus has narrowed; earlier full spec→tasks→implement flows are no longer on the README. [repo](https://github.com/buildermethods/agent-os) |
| **Task Master** (Eyal Toledano) | 2025 | `task-master parse-prd` → `next` → `expand`, plus complexity analysis. Runs as an MCP server. Tool sets range from `core`/`lean` (7 tools) to `all` (36 tools, ~21k tokens). | 28.2k★. MIT + Commons Clause. [repo](https://github.com/eyaltoledano/claude-task-master) |

**When SDD fits:** larger features, greenfield work, and teams that need an auditable design trail.

**When it is overkill:** bug fixes and changes you could describe in one sentence. Anthropic's own docs say to skip the plan in that case.

#### A4. Harper Reed: idea → spec → plan → execute (Feb 2025; from memory, see §7)

1. **Idea honing** in a chat LLM, one question at a time: "Ask me one question at a time so we can develop a thorough, step-by-step spec…". The result is `spec.md`.
2. **Planning** with a reasoning model: "Draft a detailed, step-by-step blueprint… break it down into small, iterative chunks…". This produces `prompt_plan.md` and `todo.md`.
3. **Execution** by feeding the prompts one at a time to Claude or Aider, later Claude Code.

For existing (non-greenfield) code, repomix bundles the code into the prompt, and mise tasks generate missing tests and code reviews. This lineage is the ancestor of SDD and of Anthropic's "interview me, then write SPEC.md" prompt.

#### A5. TDD with agents

**Anthropic:** *"write a failing test that reproduces the issue, then fix it"*. Another variant has one Claude write tests and another write code to pass them. — [best practices](https://code.claude.com/docs/en/best-practices)

**Enforcement options:**
- Superpowers' `test-driven-development` skill (red/green/refactor: write a failing test, watch it fail, write minimal code, watch it pass, commit).
- spec-kit constitution Article III.
- **TDD Guard** (2.4k★): hooks that block implementation without a failing test, or over-implementation. It supports Vitest, Jest, pytest, PHPUnit, Go, Rust and RSpec. Its README says it *"grew into Probity"* (Claude Code, Codex, Copilot CLI). — [nizos/tdd-guard](https://github.com/nizos/tdd-guard)

**Rationale:** tests are the backpressure that closes the agent loop, and Ralph, `/goal` and Carlini's harness all depend on them. A known failure mode is agents editing or deleting tests to go green. Anthropic's harness prompt says *"It is unacceptable to remove or edit tests."* — [long-running harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

#### A6. Ralph Wiggum loops and variants

**Origin:** Geoffrey Huntley, 2025. *"In its purest form, Ralph is a Bash loop."* Huntley also says the Claude Code plugin "isn't it". — [ghuntley.com/ralph](https://ghuntley.com/ralph/). Mainstream coverage came in Jan 2026 ([The Register](https://www.theregister.com/2026/01/27/ralph_wiggum_claude_loops/)).

**Canonical playbook** (Clayton Farr's organization of Huntley's method; fork has 1.8k★):
- **Loop:** `while :; do cat PROMPT.md | claude ; done`. Each iteration gets a **fresh context** and does one task.
- **State on disk:** `specs/` (one file per topic), `IMPLEMENTATION_PLAN.md`, and a brief `AGENTS.md`.
- **Two modes:** a planning mode (gap analysis, no code) and a building mode.
- **Principles:**
  - use subagents for searching and reading;
  - steer with backpressure from tests, types, lint and build;
  - don't assume something is unimplemented; search the code first;
  - treat the plan as disposable.
- **Requirement:** a sandbox, because `--dangerously-skip-permissions` makes the sandbox the only security boundary.

— [how-to-ralph-wiggum](https://github.com/ghuntley/how-to-ralph-wiggum)

**Variants:**
- **Official `ralph-wiggum` / "Ralph Loop" plugin.** A Stop hook re-feeds the *same prompt in the same session*. Run `/ralph-loop "<task>" --completion-promise "DONE" --max-iterations 50` and stop it with `/cancel-ralph`. The promise is an exact string match, so `--max-iterations` is the real safety net. Results it cites (unverified anecdotes): 6 repos overnight, and a "$50k contract for $297". — [plugin](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum)
- **snarktank/ralph** (Ryan Carson; 21.9k★). Runs Amp or Claude Code per story from `prd.json` (with `passes` flags), keeps `progress.txt`, updates AGENTS.md with learnings, and requires browser verification for UI work. — [repo](https://github.com/snarktank/ralph)
- **HumanLayer** has `ralph_research`/`ralph_plan`/`ralph_impl` commands.
- **Anthropic `/goal`** is the productized successor. A prompt-based Stop hook sends the condition (up to 4,000 characters) to the small fast model after each turn, which returns met, not yet met, or impossible. It stops itself after several turns without tool use and works headless (`claude -p "/goal …"`). Write conditions as *one measurable end state, a stated check, and constraints*. — [docs](https://code.claude.com/docs/en/goal)

**Fit:** mechanical work with machine-checkable completion, such as migrations, getting tests green, or porting. **Avoid it** for design judgment. In Huntley's view, in-session loops degrade through context compaction, whereas the original starts fresh each iteration.

#### A7. Compounding engineering (Every)

**Origin:** Kieran Klaassen and Dan Shipper at Every, 2025. *"Each unit of engineering work should make subsequent units easier — not harder."* Effort is split 80% planning and review, 20% execution.

**Commands:**
- `/ce-brainstorm` (requirements Q&A)
- `/ce-plan`
- `/ce-work` (executes, verifies, commits)
- `/ce-simplify-code`
- `/ce-code-review` (multi-agent, report-only, checked against the plan)
- `/ce-compound` (writes one reusable learning to `docs/solutions/`, optionally linked from AGENTS.md or CLAUDE.md)
- `/lfg` runs the whole loop hands-off and opens a PR.

The plugin has 36 skills, runs on 14 hosts, and has **25.5k★**. — [repo](https://github.com/EveryInc/compound-engineering-plugin), [install page](https://every.to/compound-engineering/install/)

**Critique:** the knowledge base it accumulates needs pruning, or it becomes the bloated context the ETH study warns about.

#### A8. Superpowers (Jesse Vincent / obra, Oct 2025)

A skills framework that enforces process, not personas. Steps:
1. **brainstorming**: Socratic questions, then a design doc.
2. **using-git-worktrees**: an isolated branch with a verified clean test baseline.
3. **writing-plans**: tasks of 2–5 minutes, with exact paths, complete code and a verification step for each.
4. **subagent-driven-development** (a fresh subagent per task, reviewed after each) **or executing-plans** (inline, cheaper).
5. **test-driven-development** (red/green/refactor).
6. **requesting-code-review** (by severity; critical issues block).
7. **finishing-a-development-branch**: merge, open a PR, keep, or discard.

**Install:** `/plugin install superpowers@claude-plugins-official`. Adapters exist for Codex, Cursor, Copilot CLI, Gemini CLI, Antigravity, Devin CLI, Droid, pi, Qwen and others.

**297k★** (unusually high, see §4). — [obra/superpowers](https://github.com/obra/superpowers)

#### A9. Beads and Gas Town (Steve Yegge)

**Beads** (27.8k★) is a *"distributed graph issue tracker for AI agents, powered by Dolt"* that replaces markdown plans.
- Commands: `bd ready` (unblocked work), `bd update <id> --claim` (atomic), `bd dep add`, `bd close`, `bd prime`, `bd remember`.
- Hash IDs avoid merge collisions between agents.
- `bd init` writes an AGENTS.md snippet telling agents not to use markdown TODOs.

— [steveyegge/beads](https://github.com/steveyegge/beads)

**Gas Town** (now `gastownhall/gastown`, 18.3k★) is a workspace manager for many agents, built on tmux, Beads and Claude Code.
- **Mayor:** coordinator.
- **Polecats:** workers with persistent identity and ephemeral sessions in worktrees.
- **Witness:** watches for stuck agents.
- **Refinery:** merge queue.
- **Deacon:** supervisor across projects.
- **Convoys:** bundles of beads assigned to workers.
- A scheduler caps dispatch to avoid API rate limits.

— [repo](https://github.com/steveyegge/gastown), [glossary](https://docs.gastownhall.ai/glossary)

Third-party write-ups describe it as a research prototype with fragile features and heavy compute and API spend. — [heise](https://www.heise.de/en/background/Full-Control-Gas-Town-Orchestrates-Ten-or-More-Coding-Agents-11178824.html?seite=2) (secondary)

#### A10. Agent teams and orchestrator-worker patterns

**Theory:** orchestrator-workers is one of Anthropic's agent patterns: *"a central LLM dynamically breaks down tasks, delegates… and synthesizes."* It sits alongside chaining, routing, parallelization and evaluator-optimizer. The advice is *"adding complexity only when it demonstrably improves outcomes."* — [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) (Dec 19, 2024)

**Evidence:**
- An Opus 4 lead with Sonnet 4 subagents scored **+90.2%** over single-agent Opus 4 on an internal *research* eval.
- Token usage explained 80% of the performance variance.
- Multi-agent setups use about 15× the tokens of a chat.
- They are a poor fit when work needs shared context or has many dependencies, which describes most coding. — [multi-agent research](https://www.anthropic.com/engineering/multi-agent-research-system) (Jun 13, 2025)

**Claude Code mechanisms in Oct 2026:**
- **Agent teams** (experimental; enable with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`)
  - A lead plus teammates, each in its own context, sharing a task list with dependencies and file-locked claiming, plus mailboxes.
  - Hooks: `TeammateIdle`, `TaskCreated`, `TaskCompleted` (exit code 2 blocks).
  - Best uses: parallel review with distinct lenses, debugging with competing hypotheses ("scientific debate"), and features spanning several layers.
  - Guidance: start with 3–5 teammates, give each 5–6 tasks, and assign file ownership to avoid overwrites.
  - Limitations: no nested teams, and in-process teammates are not restored on resume. — [docs](https://code.claude.com/docs/en/agent-teams)
- **Dynamic workflows** move the plan into a JavaScript script that uses `agent()`, `pipeline()`, `parallel()` and a schema. Typical uses are audits with adversarial verification, migrations of 500 files, and fix-until-green.
  - Limits: 16 concurrent agents by default, 1,000 per run.
  - Cost warnings above 25 agents or 1.5M projected tokens.
  - Turn on per prompt with `ultracode` or per session with `/effort ultracode`.
  - Bundled `/deep-research`. — [docs](https://code.claude.com/docs/en/workflows)

**Case study:** Carlini's compiler ran 16 agents with no orchestrator.
- Each agent ran a `while true` loop in its own container, with a bare git upstream and tasks claimed through lock files in `current_tasks/`.
- Agents with specific roles handled dedup, performance and documentation.
- Lessons:
  - keep test output to a few lines and send the rest to log files;
  - make the test harness print sparse progress with a `--fast` 1–10% sample, because agents have no sense of elapsed time;
  - when every agent hits the same blocking bug, parallelism stops helping; GCC was used as an oracle and delta debugging found failing file pairs. — [building-c-compiler](https://www.anthropic.com/engineering/building-c-compiler)

#### A11. "Vibe coding" vs "vibe engineering" vs "agentic engineering"

- **Vibe coding:** Karpathy, Feb 2025: "forget that the code even exists" (from memory). Appropriate for throwaway prototypes.
- **Vibe engineering:** Simon Willison, Oct 2025 (from memory). Experienced engineers using agents with accountability: automated tests, planning, documentation, version control, CI, code-review culture, manual QA, and preview environments.
- **Agentic engineering:**
  - Willison's guide launched Feb 23, 2026: *"building software using coding agents… which can run the code they write,"* in contrast to vibe coding, where you pay no attention to the code. — [simonwillison.net](https://simonwillison.net/2026/Feb/23/agentic-engineering-patterns/); a chapter was published Mar 15, 2026 ([changelog](https://simonwillison.net/guides/agentic-engineering-patterns/what-is-agentic-engineering/changes)).
  - Karpathy is reported to have proposed "agentic engineering" as the professional successor term around the vibe-coding anniversary in Feb 2026. — [letsdatascience](https://letsdatascience.com/news/andrej-karpathy-coins-agentic-engineering-term-a55528b6) (secondary)

#### A12. Context engineering: write, select, compress, isolate

**LangChain's taxonomy** (blog dated Jul 2, 2025, often credited to Lance Martin):
- **Write:** *"saving information outside the context window,"* such as scratchpads and memories.
- **Select:** *"pulling it into the context window,"* such as retrieval and tool selection.
- **Compress:** *"retaining only the tokens required,"* such as summarization (one example cut 115k tokens to 60k).
- **Isolate:** *"splitting it up,"* such as subagents and sandboxes.

— [blog](https://langchain.com/blog/context-engineering-for-agents), [repo](https://github.com/langchain-ai/context_engineering)

**Anthropic** (Sep 29, 2025):
- "context rot" and an "attention budget";
- system prompts at the *"right altitude"*;
- just-in-time retrieval: CLAUDE.md loaded up front, glob/grep on demand;
- for long horizons: compaction, structured note-taking (NOTES.md, to-do lists) and sub-agent architectures. — [effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

**HumanLayer's 12-factor-agents** (26.6k★): "Factor 3: Own your context window". — [repo](https://github.com/humanlayer/12-factor-agents)

**Mapping to Claude Code:**

| Strategy | Claude Code mechanisms |
|---|---|
| write | plan files, `NOTES.md`, auto memory, Beads |
| select | `@` imports, skills (progressive disclosure), path-scoped rules, MCP tool search |
| compress | `/compact <focus>`, "summarize from here", handoff documents |
| isolate | subagents, `context: fork` skills, worktrees, workflows |

#### A13. Making codebases agent-ready

**Factory Agent Readiness** (Jan 20, 2026). Eight pillars:
- Style & Validation
- Build System
- Testing
- Documentation
- Dev Environment
- Observability
- Security
- Task Discovery

The docs page mentions nine pillars, an inconsistency in Factory's own materials. There are five levels, and you advance by passing **80%** of the current level's criteria. Criteria are checked per repository (CODEOWNERS, branch protection) and per application (linter, unit tests). Run it with `/readiness-report` in the Droid CLI. Example ratings: CockroachDB at Level 4, Express at Level 2. — [launch](https://factory.ai/news/agent-readiness), [docs](https://docs.factory.ai/agent-readiness/overview)

**OpenAI "harness engineering"** (Feb 2026): AGENTS.md is about 100 lines and serves as a *table of contents*, while a structured `docs/` directory is the *system of record*. The reason given is that one large file can't be checked mechanically for coverage, freshness or ownership, so it drifts. — [openai.com](https://openai.com/index/harness-engineering/) (fetch failed; search excerpt). The project numbers (~1M LOC, ~1,500 PRs, 0 hand-written lines, small team) are from memory, see §7.

**Anthropic's long-running harness** (Nov 26, 2025):
- an *initializer* agent creates `feature_list.json` (all failing, each with a `passes` flag), `claude-progress.txt` and `init.sh`;
- a *coding* agent runs each later session: `pwd` → git log and progress → pick the next failing feature → `init.sh` plus a smoke end-to-end test → implement → commit.
- End-to-end browser testing with Puppeteer MCP beat unit tests or curl alone. — [anthropic.com](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

**Consolidated checklist:**
- one-command setup;
- fast, deterministic tests with a sampled mode;
- terse test output and "ERROR + reason" on a single line;
- linters and type checkers wired into hooks;
- an LSP code-intelligence plugin;
- AGENTS.md as an index;
- docs-as-record with owners;
- logs and metrics the agent can query;
- CODEOWNERS and branch protection;
- issues sized for an agent.

### (b) Authoring CLAUDE.md / AGENTS.md

**Anthropic's current canon** — [memory docs](https://code.claude.com/docs/en/memory), [best practices](https://code.claude.com/docs/en/best-practices), [features overview](https://code.claude.com/docs/en/features-overview):

- **Size:** *"target under 200 lines per CLAUDE.md file."* `@imports` don't reduce context cost, because imported files also load at launch (maximum depth: 4 hops). HTML block comments are stripped, so they can hold notes for human maintainers.
- **Include:**
  - bash commands Claude can't guess;
  - style rules that differ from defaults;
  - test runners;
  - branch and PR etiquette;
  - project-specific architectural decisions;
  - required env vars and quirks;
  - non-obvious gotchas.
- **Exclude:**
  - anything Claude can infer from the code;
  - standard conventions;
  - API docs (link to them instead);
  - fast-changing information;
  - tutorials;
  - file-by-file descriptions;
  - "write clean code".
- **Test for each line:** *"Would removing this cause Claude to make mistakes?"* Use "IMPORTANT" on one line only. If a rule is ignored, the file is probably too long.
- **Tooling:**
  - `/doctor` proposes cuts.
  - `/doctor prompt-audit` finds contradictions across CLAUDE.md, rules, skills, agents and output styles.
  - The official "CLAUDE.md Management" and "Claude Code Setup" plugins are verified in the marketplace.
- **Progressive disclosure:** skills load only their name and description at start, the body on use, and referenced files on demand. — [Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) (Oct 16, 2025)
- **Path-scoped rules:** files in `.claude/rules/*.md` with `paths:` frontmatter load only when matching files are read or edited.
- **Anti-patterns** (Jun 18, 2026 blog):
  1. "Hope-based automation" ("every time X, do Y") belongs in a hook.
  2. Prohibitions written as prose need hooks, permissions or managed settings.
  3. A ~30-line runbook belongs in a skill.
  4. Narrow rules left unscoped load on every task.
  5. Personal preferences belong in user-level files, not shared project files.
  6. Replacing the default output style drops its coding instructions.
  7. Too many system-prompt appends weaken adherence.

  *"Keep CLAUDE.md under 200 lines, give it an owner, and review changes to it like code."* — [steering blog](https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more)
- **Earlier blog** (Nov 25, 2025): *"Think of `/init` as a starting point, not a finished product"*; *"Each addition should solve a real problem you have encountered"*; never put secrets in the file. — [claude.com](https://claude.com/blog/using-claude-md-files)

**Interoperability:**
- Claude Code reads `AGENTS.md` natively (v2.1.277+), but only when no CLAUDE.md or CLAUDE.local.md exists in the working directory or above it.
- Setting `instructionFiles: claude-md-and-agents-md` loads both.
- Otherwise put `@AGENTS.md` in CLAUDE.md, or symlink the two files. On Windows teams, use the import rather than the symlink.
- `/import` (v2.1.213+) copies other agents' configuration (AGENTS.md, Cursor rules and others).

— [memory docs](https://code.claude.com/docs/en/memory)

**AGENTS.md spec:** *"a simple, open format for guiding coding agents."* The minimal example has three sections: dev environment tips, testing, and PR instructions (24.9k★). — [agentsmd/agents.md](https://github.com/agentsmd/agents.md)

**HumanLayer, "Writing a good CLAUDE.md"** (Kyle, Nov 2025; read via a Japanese summary):
- Cover WHAT, WHY and HOW.
- Frontier models follow roughly 150–200 instructions, and compliance drops uniformly as you add more.
- Keep the file under about 300 lines.
- For large projects, make it a table of contents.
- Don't use it as an "expensive linter".
- Don't auto-generate it with `/init`.
- Claude Code wraps CLAUDE.md in a system reminder (*"You should not respond to this context unless it is highly relevant to your task"*), so content that looks irrelevant gets ignored.

— [summary issue](https://github.com/AkihikoWatanabe/paper_notes/issues/4717)

**OpenAI:** the ~100-line AGENTS.md as table of contents described in A13.

**Research:**
- **ETH Zurich / SRI Lab** (Gloaguen, Mündler, Müller, Raychev, Vechev; arXiv 2602.11988, Feb 2026). Setup: SWE-bench tasks with LLM-generated context files, plus a new benchmark drawn from repos that already have developer-written files.
  - Finding: *"context files tend to reduce task success rates compared to providing no repository context"* while raising cost by more than 20%.
  - Both kinds of file push agents to explore more broadly, and agents follow them.
  - Secondary reporting: LLM-generated files average about −3%; human-written files about +4%, with up to 19% more cost.
  - Recommendation: include only *non-inferable* details. — [notes](https://github.com/AkihikoWatanabe/paper_notes/issues/4710), [ETH page](https://www.sri.inf.ethz.ch/publications/gloaguen2026agentsmd), [InfoQ](https://infoq.com/news/2026/03/agents-context-file-value-review) (secondary)
- **Vercel** (late Jan 2026, testing Next.js 16 APIs absent from training data):

  | Setup | Pass rate |
  |---|---|
  | Baseline, no docs | 53% |
  | Default skill | 53% |
  | Skill with explicit instructions (maximum) | 79% |
  | 8KB compressed docs index in AGENTS.md | **100%** |

  Skills were never invoked in 56% of cases. These are first-party evals. — [Vercel](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals)
- **Follow-up papers exist**, but I only saw their titles: "Do Context Files Help Coding Agents? A Two-Agent Ablation Study" ([arXiv 2607.27250](https://arxiv.org/html/2607.27250v1)) and "Engineering Reliable Coding Agents…" ([arXiv 2608.13867](https://arxiv.org/pdf/2608.13867)).

**Synthesis:** keep a short, hand-written file of non-inferable facts. Add a compressed index of post-cutoff docs when APIs are new. Put procedures in skills invoked explicitly with `/name` when they are critical. Enforce invariants with hooks. Never commit a raw `/init` output.

### (c) Community configuration ecosystems

Stars as of 2026-10-11. The "Assessment" column is my synthesis from structural signals: scope, curation, unverified claims and trust flags.

| Project | ★ | What it is | Assessment |
|---|---|---|---|
| [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | 37.6k | Official marketplace, auto-added on first interactive run. `/plugins` (Anthropic) plus `/external_plugins` (partners). **342 plugins** on [claude.com/marketplace](https://claude.com/marketplace/plugins). Verified badges include Code Review, Feature Dev, Ralph Loop, Frontend Design, Code Simplifier, CLAUDE.md Management, Security Guidance, and TypeScript/Pyright LSP. | Default starting point. The README warns that Anthropic *"cannot verify"* the MCP servers or files inside third-party plugins. The details pane shows per-plugin context cost (tokens added every turn vs when invoked). — [docs](https://code.claude.com/docs/en/discover-plugins) |
| anthropics/claude-plugins-community (`claude-community`) | — | Third-party plugins submitted by their authors | Opt-in; auto-update off by default. — [docs](https://code.claude.com/docs/en/plugins/anthropic-marketplaces) |
| [anthropics/skills](https://github.com/anthropics/skills) | 180.4k | Agent Skills spec, template, examples; source-available docx/pdf/pptx/xlsx skills | Reference quality. "Demonstration and educational purposes only." |
| [anthropics/claude-code/plugins](https://github.com/anthropics/claude-code/blob/main/plugins/README.md) | (150.1k repo) | Demo marketplace `claude-code-plugins`: 13 plugins including `code-review`, `feature-dev`, `pr-review-toolkit`, `hookify`, `ralph-wiggum`, `security-guidance` | Install the official-marketplace copies to avoid duplicates. |
| [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | 55.4k | Curated list of skills, agents, status lines, tooling and plugins; PRs from collaborators only | Best discovery index. |
| [obra/superpowers](https://github.com/obra/superpowers) | 297k | Process skills (see A8) | Widely adopted and coherent. Skills enforce gates rather than adding personas. In the official marketplace. |
| [EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin) | 25.5k | Plan, work, review, compound loop | Well regarded. Prune the `docs/solutions/` it accumulates. |
| [wshobson/agents](https://github.com/wshobson/agents) | 40.4k | 94 granular plugins, 202 agents, 184 skills, 105 commands; model tiers; adapters for Codex, OpenCode, Copilot, pi | Granular installs keep context small. Don't install everything. |
| [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | 25.6k | 161+ subagents in 10 categories | README: maintainers *"do not audit or guarantee"* them. Treat as templates. |
| [SuperClaude_Framework](https://github.com/SuperClaude-Org/SuperClaude_Framework) | 23.9k | v4.3.0: 30 `/sc:` commands, 20 agents, 7 modes, 8 MCP integrations | Claims of "30–50% fewer tokens" have no published method. Heavy. |
| [ruvnet/ruflo (ex claude-flow)](https://github.com/ruvnet/claude-flow) | 74.3k | "Hive-mind" swarms, 314 MCP tools, inconsistent agent counts (98 vs 100+), latency claims of "1.3×–1953×" | Self-reported benchmarks. Heavy context and supply-chain surface. Approach skeptically. |
| [affaan-m/everything-claude-code (ECC)](https://github.com/affaan-m/everything-claude-code) | 276.6k | 71 agents, 306 skills, hooks, rules, the AgentShield scanner; 7 harnesses | The maintainers themselves advise `--profile minimal`, noting that the Claude plugin advertises its full catalog to the model. Mine it for ideas; don't install it wholesale. |
| [trailofbits/skills](https://github.com/trailofbits/skills) | 7.5k | Security plugins: differential-review, static-analysis (Semgrep/CodeQL SARIF), insecure-defaults, sharp-edges, variant-analysis | High signal: a security firm with a "Trophy Case" of real bugs found. CC-BY-SA-4.0. |
| [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | 99.3k | Five lifecycle hooks capture observations, compress them with AI, and store them in SQLite+Chroma for injection into later sessions. v13.35.0. | Useful idea, but the installer offers a hosted "observer" with an email sign-in and 30-day trial, and the README **endorses a third-party crypto token**. Use the local provider or skip it. Claude Code now ships native auto memory. |
| [oraios/serena](https://github.com/oraios/serena) | 30.2k | LSP-backed symbol tools (find references, replace symbol body, rename) for 40+ languages | Strong on large codebases. Partly superseded by Claude Code's official LSP code-intelligence plugins. README: *"Do not install Serena via an MCP or plugin marketplace!"* |
| [upstash/context7](https://github.com/upstash/context7) | 62.9k | Version-specific library docs. MCP tools `resolve-library-id` and `query-docs`, or CLI plus skills. Setup with `npx ctx7 setup --claude` (OAuth/API key). | Useful for fast-moving APIs. Docs are community-contributed and Upstash *"cannot guarantee"* their accuracy or security. |
| [nizos/tdd-guard](https://github.com/nizos/tdd-guard) | 2.4k | TDD enforcement through hooks; now continued as "Probity" | Good example of turning a methodology into hooks. |

**Rule of thumb:**
- Start with official verified plugins, one process plugin (Superpowers *or* compound-engineering, not both), and an LSP plugin for your language.
- Add domain plugins such as Trail of Bits only when needed.
- Run `claude plugin details <name>` for always-on token cost, and remove anything listed under "Not used recently". — [docs](https://code.claude.com/docs/en/discover-plugins)

### (d) AI code review and CI

**Anthropic Code Review (managed):** launched Mar 9, 2026; research preview for Team and Enterprise plans.
- A fleet of agents works per PR, a verification step filters false positives, and findings are deduplicated and ranked.
- Severities: 🔴 Important, 🟡 Nit, 🟣 Pre-existing.
- The check run is **always neutral**. To gate merges, parse the `bughunter-severity` JSON from the check output.
- Triggers: once per PR, on every push, or manually (`@claude review`, or `@claude review always` to subscribe). Since July 2026 the bare `@claude review` no longer subscribes the PR to later pushes.
- Cost about $15–25 per review; about 20 minutes on average.
- Internal stats:

  | Metric | Value |
  |---|---|
  | PRs with substantive review comments | 16% → 54% |
  | PRs over 1,000 lines with findings | 84% (avg 7.5 issues) |
  | PRs under 50 lines with findings | 31% (avg 0.5 issues) |
  | Findings engineers marked incorrect | under 1% |

- **Tuning with `REVIEW.md`:** redefine what Important means, cap nits (e.g., at most five), list paths to skip, add repo-specific checks, set a verification bar ("`file:line` citation required"), and suppress new nits after the first review.

— [blog](https://claude.com/blog/code-review), [docs](https://code.claude.com/docs/en/code-review)

**Local and self-hosted options:**
- `/code-review` runs as a background subagent with an effort level from low to max. Flags: `--fix`, `--comment`, `--max-findings`, `ultra` for a cloud "ultrareview". It does *not* read REVIEW.md.
- The `code-review` plugin runs four parallel agents: two for CLAUDE.md compliance, one for bugs, one for git blame and history. It reports only findings with confidence ≥80. — [plugin](https://github.com/anthropics/claude-code/tree/main/plugins/code-review)
- **claude-code-action v1** (9.5k★) runs on your own runners. It detects interactive (`@claude`) vs automation (`prompt:`) mode and accepts plugins, skills and OIDC workload identity federation. Only users with write access can trigger it, and bots must be allowlisted. Cost controls: `--max-turns`, timeouts, concurrency. — [docs](https://code.claude.com/docs/en/github-actions), [repo](https://github.com/anthropics/claude-code-action)

**Anthropic's layered lifecycle** (Jul 21, 2026), as a template — [claude.com](https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle):
- secure-coding rules in CLAUDE.md and org-wide skills;
- `/security-review` before a PR opens;
- several narrow review agents with separate contexts, plus SAST;
- code tiered by risk, with human approval for regulated or critical code and risk-weighted sampling;
- invariant tests ("user A can never read user B's data");
- new AI reviewers run in shadow mode;
- single-purpose agent identities.

Reported outcomes: about 80% of code authored by Claude, and about a third of past claude.ai incident bugs would have been caught by the current automation. An Intercom case: 19% of PRs auto-approved and deployment frequency doubled (customer-reported).

**Other reviewers:** I could not verify these numbers this session. They are from memory, mostly vendor claims; see §7.

| Tool | Notes (from memory) |
|---|---|
| CodeRabbit | Most-installed AI review app; CLI added 2025; Dec 2025 report claimed AI-authored PRs carry ~1.7× more issues |
| Greptile | Vendor benchmark claimed the highest bug-catch rate vs CodeRabbit, Copilot and Cursor |
| Cursor Bugbot | GA mid-2025, about $40/user/month; claimed ~50% of flagged issues fixed before merge |
| Graphite | Acquired by Cursor, Dec 2025 |
| GitHub Copilot code review | GA Apr 2025; CodeQL/linter integration in late 2025 |
| OpenAI Codex | `@codex review` / `/review`, with a GPT-5-Codex review training emphasis (Sept 2025) |
| Factory | Ships a Droid GitHub Action for PR reviews (verified) — [Factory-AI/factory](https://github.com/Factory-AI/factory) |

**Evidence quality:** the cross-vendor benchmarks are mostly run by the vendors themselves. Independent head-to-head data was not found in this session.

**Gates before commit or push (verified mechanics):**
- `claude -p` in pre-commit or CI scripts;
- a **Stop hook** that runs your check and blocks the end of the turn until it passes;
- **PreToolUse** hooks (exit code 2 blocks) for invariants such as protected paths;
- the official `security-guidance` PreToolUse hook. — [best practices](https://code.claude.com/docs/en/best-practices), [features](https://code.claude.com/docs/en/features-overview)

### (e) Tool landscape (as of Oct 2026)

**CLI agents.** Stars were verified today; positioning comes from the READMEs plus memory.

| Agent | ★ | Notes |
|---|---|---|
| Claude Code | 150.1k | Native installer (npm install deprecated). The richest extension model: skills, hooks, subagents, plugins, agent teams, workflows, `/goal`. Also runs on web, desktop, VS Code and JetBrains. — [repo](https://github.com/anthropics/claude-code) |
| OpenAI Codex CLI | 128.6k | Rust. ChatGPT sign-in recommended. Also an IDE extension, desktop app (`codex app`) and Codex Web cloud agent. — [repo](https://github.com/openai/codex) |
| OpenCode | 212.6k | `anomalyco/opencode`, MIT, open source and provider-agnostic. Agents: build, plan (read-only), `@general`. Desktop beta. — [repo](https://github.com/sst/opencode) |
| pi | 114.2k | `earendil-works` monorepo. A *"minimal, extensible agent harness"*: subagents and plan mode deliberately left out, no built-in permission system. — [repo](https://github.com/badlogic/pi-mono) |
| Gemini CLI | 107.3k | Gemini 3, 1M context. Free tier: 60 requests/min and 1,000/day with Google login. GEMINI.md files and extensions. — [repo](https://github.com/google-gemini/gemini-cli) |
| goose | 55.1k | Now `aaif-goose` under the Linux Foundation's Agentic AI Foundation. 15+ providers, 70+ MCP extensions, uses subscriptions via ACP. — [repo](https://github.com/block/goose) |
| Aider | 49.5k | The pioneer: repo map, auto-commits; 88% of its last release was written by Aider. — [repo](https://github.com/Aider-AI/aider) |
| Crush (Charm) | 28.6k | LSP-enhanced, multi-model, FSL-1.1-MIT. — [repo](https://github.com/charmbracelet/crush) |
| GitHub Copilot CLI | 11.2k | Same harness as Copilot's coding agent; one premium request per prompt; Autopilot mode is experimental. The README snapshot still names Sonnet 4.5 as default, so it is likely stale. — [repo](https://github.com/github/copilot-cli) |
| Factory Droid | n/a | Plugins marketplace, Droid GitHub Action, ACP for JetBrains and Zed, `/readiness-report`. — [Factory-AI/factory](https://github.com/Factory-AI/factory) |
| Kiro CLI | n/a | Headless and CI support. — [kirodotdev/Kiro](https://github.com/kirodotdev/Kiro) |
| Cursor CLI, Amp, Warp | n/a | Not verified this session (memory: Cursor CLI Aug 2025; Amp from Sourcegraph, 2025; Warp "ADE" 2025). |

**Agentic IDEs and cloud agents (from memory, unverified this session):**
- **IDEs:**
  - Cursor (2.0 with its own Composer model, Oct 2025; background/cloud agents; Bugbot);
  - Windsurf (acquired by Cognition, Jul 2025);
  - Google Antigravity (Nov 2025, with Gemini 3);
  - Kiro (spec-driven);
  - Zed (originator of ACP; the [ACP repo](https://github.com/agentclientprotocol/agent-client-protocol) has 4.4k★);
  - VS Code + Copilot agent mode;
  - JetBrains (Junie plus ACP agents).
- **Cloud agents:**
  - Codex cloud (May 2025);
  - Jules (beta May 2025, GA Aug 2025);
  - Devin;
  - Copilot coding agent (preview May 2025, GA Sept 2025);
  - Cursor background agents;
  - Claude Code on the web (Oct 2025);
  - Kiro cloud sessions (preview, verified).

**Adoption data:**
- **Verified, Anthropic-sourced:**
  - Claude Code GA in May 2025; $1B run-rate by Nov 2025. — [Anthropic](https://www.anthropic.com/news/anthropic-acquires-bun-as-claude-code-reaches-usd1b-milestone)
  - More than $2.5B run-rate, weekly active users doubled since Jan 1, business subscriptions ×4, enterprise more than half of revenue, and SemiAnalysis's estimate of **4% of public GitHub commits** (all as of Feb 12, 2026). — [Anthropic](https://www.anthropic.com/news/anthropic-raises-30-billion-series-g-funding-380-billion-post-money-valuation)
  - Economic Index (Apr 2025): 79% of Claude Code conversations were "automation" vs 49% on Claude.ai; startups made up 32.9% of Claude Code work. — [Anthropic](https://www.anthropic.com/research/impact-software-development)
- **Surveys (from memory, see §7):**
  - Stack Overflow 2025: 84% use or plan to use AI; 51% of professional developers use it daily; 46% distrust its accuracy vs 33% who trust it; 66% cite "almost right" answers.
  - JetBrains Developer Ecosystem 2025: 85% regularly use AI; 62% use at least one coding assistant or agent.
  - Pragmatic Engineer's 2026 AI-tooling survey reportedly found Claude Code the most-used tool among respondents.
  - Menlo Ventures (2025) reported Anthropic leading enterprise coding-model share.
  - Stack Overflow 2026 results were **not retrieved**.

**Relative strengths:** practitioner consensus, from memory and only partly verified.

| Tool | Reputation |
|---|---|
| Claude Code | Strongest extensibility and ecosystem, and the method-plugin hub |
| Codex | Thorough on long autonomous tasks; strong reviewer; many use it as a second-opinion reviewer of Claude's diffs |
| Cursor | Best IDE-native loop and multi-model choice |
| Gemini CLI | Free-tier and large-context exploration |
| OpenCode / pi | Open, hackable harnesses with any model |
| Kiro / spec-kit | Spec-heavy teams |

Running two or more agents (one implementing, one reviewing) is common. The portability layers — AGENTS.md, Agent Skills, plugins that install on 14–16 hosts, and ACP — make this cheap.

---

## 3. Concrete practices & configs worth copying

**1. Minimal CLAUDE.md** (under 200 lines, non-inferable facts only; per the Anthropic and HumanLayer guidance above):
```markdown
# Project: payments-api (Go 1.24, Postgres 16)
## Commands
- Build: `make build` · Single test: `go test ./internal/... -run TestName` (prefer single tests)
- Lint+types: `make lint` (must pass before commit)
## Conventions that differ from defaults
- Money is int64 cents; never float. Errors wrap with `fmt.Errorf("op: %w", err)`.
## Workflow
- For multi-file changes: plan first; write a failing test, then fix.
- When compacting, preserve the list of modified files and test commands.
## Gotchas
- `make dev` needs `STRIPE_TEST_KEY`; integration tests need `docker compose up db`.
## Docs index (read on demand)
- Architecture: docs/architecture.md · ADRs: docs/adr/ · API conventions: see skill `/api-conventions`
```

**2. AGENTS.md as the source, with Claude-specific additions:**
```markdown
<!-- CLAUDE.md -->
@AGENTS.md
## Claude-only
- Use the `security-reviewer` subagent before opening PRs touching src/auth/.
```
Alternatively run `ln -s AGENTS.md CLAUDE.md`, but avoid the symlink on Windows teams. — [memory docs](https://code.claude.com/docs/en/memory)

**3. Path-scoped rule** (`.claude/rules/api.md`; loads only when matching files are touched):
```markdown
---
paths:
  - "src/api/**/*.ts"
---
- Every new route needs an integration test in tests/api/.
- Validate input with zod schemas from src/api/schemas.ts.
```

**4. Interview, then spec, then a fresh session** (Anthropic):
```text
I want to build [brief description]. Interview me in detail using the AskUserQuestion tool.
Ask about technical implementation, UI/UX, edge cases, concerns, and tradeoffs. Don't ask obvious
questions, dig into the hard parts I might not have considered. Keep interviewing until we've
covered everything, then write a complete spec to SPEC.md.
```

**5. Deterministic "done" gate.**

Use `/goal` for a session (it wraps a prompt-based Stop hook):
```text
/goal all tests in test/auth pass and `make lint` exits 0; no files under test/ other than test/auth/ are modified; or stop after 20 turns
```
Headless: `claude -p "/goal CHANGELOG.md has an entry for every PR merged this week" --output-format stream-json --verbose`. For a project-wide rule, use a Stop hook script in settings instead. — [goal docs](https://code.claude.com/docs/en/goal)

**6. Ralph, original style** (adapted from the playbook loop):
```bash
# fresh context every iteration; state lives in specs/, IMPLEMENTATION_PLAN.md, AGENTS.md
while :; do cat PROMPT_build.md | claude -p --permission-mode auto ; git push; done   # run in a sandbox
```
Plugin style: `/ralph-loop "<task + checklist>. Output <promise>COMPLETE</promise> when done." --completion-promise "COMPLETE" --max-iterations 50`. — [playbook](https://github.com/ghuntley/how-to-ralph-wiggum), [plugin](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum)

**7. Long-running harness artifacts** (Anthropic):
```json
// feature_list.json — coding agents may ONLY flip "passes"
[{"id":"auth-01","description":"User can sign up with email","passes":false},
 {"id":"auth-02","description":"Password reset email is sent","passes":false}]
```
Plus `claude-progress.txt` (an append-only log), `init.sh` (starts the dev server) and descriptive commits. The session routine is: `pwd` → git log and progress → next failing feature → `init.sh` plus a smoke end-to-end test → implement → commit. — [anthropic.com](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

**8. QRSPI artifact layout:**
```
thoughts/<ticket>/task.md, questions.md → research.md (task-blind) → design.md (~200 lines, human review)
→ structure.md (vertical slices + test checkpoints, human review) → plan.md → worktree → implement (commit per phase) → PR
```
— [qrspi](https://github.com/matanshavit/qrspi). The `thoughts/` root folder is my convention.

**9. Spec-kit and OpenSpec quick starts:**
```bash
uv tool install specify-cli && specify init my-project --integration copilot   # then /speckit-constitution, /speckit-specify …
npm install -g @fission-ai/openspec@latest && openspec init                    # then /opsx:propose → /opsx:apply → /opsx:archive
```

**10. Process plugins:**
```text
/plugin install superpowers@claude-plugins-official
/plugin marketplace add EveryInc/compound-engineering-plugin   then   /plugin install compound-engineering
```

**11. Agent team for review or debugging:**
```json
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
```
```text
Spawn 5 agent teammates to investigate different hypotheses for <bug>. Have them try to disprove each
other's theories like a scientific debate. Update findings.md with the consensus.
```

**12. Dynamic workflow prompts:**
```text
use a workflow to audit every route handler under src/routes/ for missing authentication checks, and adversarially verify each finding before reporting it
use a workflow to run npx tsc --noEmit and keep fixing the reported errors until the type check passes or two rounds in a row make no progress
```

**13. Headless fan-out migration:**
```bash
for file in $(cat files.txt); do
  claude -p "Migrate $file from Python 2 to Python 3. Return OK or FAIL." \
    --allowedTools "Edit,Bash(git commit *)" --permission-mode dontAsk
done
```
Test the prompt on 2–3 files first.

**14. PR review in CI** (claude-code-action v1 with the code-review plugin; adapted from the docs with the same keys and values):
```yaml
on: { pull_request: { types: [opened, synchronize, ready_for_review, reopened] } }
jobs:
  review:
    runs-on: ubuntu-latest
    permissions: { contents: read, pull-requests: read, issues: read, id-token: write }
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 1 }
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          plugin_marketplaces: "https://github.com/anthropics/claude-code.git"
          plugins: "code-review@claude-code-plugins"
          prompt: "/code-review:code-review --comment ${{ github.repository }}/pull/${{ github.event.pull_request.number }}"
          claude_args: '--allowedTools "mcp__github_inline_comment__create_inline_comment"'
```

**15. REVIEW.md core** (managed Code Review): "Important = breaks behavior, leaks data, blocks rollback; style is Nit at most. Report at most five Nits. Do not report: anything CI enforces; generated files under `src/gen/`; `*.lock`. Always check: new API routes have an integration test; no PII in logs; queries scoped to the caller's tenant. Behavior claims need a `file:line` citation." To gate merges, parse the severity JSON: `gh api repos/O/R/check-runs/ID --jq '.output.text | split("bughunter-severity: ")[1] | split(" -->")[0] | fromjson'`. — [docs](https://code.claude.com/docs/en/code-review)

**16. Agent-friendly test output** (Carlini): print a few summary lines, write details to a log, put "ERROR <reason>" on one line, and offer a deterministic `--fast` sample (1–10%). — [anthropic.com](https://www.anthropic.com/engineering/building-c-compiler)

---

## 4. Disagreements, caveats, failure modes

- **Do specs help? SDD vs. "just iterate".**
  - Böckeler and the Thoughtworks Radar flag review burden, one workflow for every problem size, and specs that agents ignore. OpenSpec calls spec-kit heavyweight. Agent OS narrowed to standards. Tessl's spec-as-source moved into a skills registry.
  - spec-kit's adoption (140.7k★) shows demand, but it is not evidence of outcomes. No controlled study comparing SDD with plain plan mode was found.
- **Reading the code.** RPI in 2025 implied reviewing plans instead of code. Horthy's 2026 talk (secondary) recants, and Willison's "agentic engineering" definition rests on accountability for the code. Treat reviewing plans as *added* leverage, not a replacement for reviewing code.
- **Ralph purity.** Huntley says the in-session plugin "isn't it": compaction degrades a long session, whereas the bash loop starts fresh each time. Anthropic's `/goal` also runs in one session but uses a separate evaluator model and stall detection. Pick fresh-context loops for multi-hour or multi-day work and `/goal` for bounded tasks. Runs that skip permissions require a sandbox.
- **Multi-agent value vs cost.**
  - Anthropic: about 15× tokens, and coding is less parallelizable.
  - Agent teams are experimental (no resume, laggy task status, leads that stop early).
  - Gas Town has heavy spend and fragility.
  - Carlini's success depended on an excellent oracle and many independent failing tests. When work converged on one blocking bug, the agents overwrote each other.
- **Evidence on context files conflicts.** ETH reports context files reduce success; Vercel reports an AGENTS.md docs index works best. These measured different things: generic repo overviews vs post-cutoff API knowledge. A Jan 2026 efficiency study reportedly found AGENTS.md cut runtime and tokens (from memory, see §7). Consensus: keep it minimal and non-inferable, and write it yourself.
- **Skills vs always-on context.** Vercel found skills went uninvoked 56% of the time, while Anthropic promotes skills for anything needed only sometimes. Mitigations: sharper `description` fields, explicit `/skill` invocation for critical workflows, and an index of must-know facts in AGENTS.md.
- **Mega-configs and supply-chain risk.**
  - Plugins run hooks and MCP servers, and Anthropic does not review third-party marketplaces.
  - Massive collections inflate context (ECC's own docs say its full catalog is advertised to the model).
  - Some READMEs carry unverified performance claims (ruflo, SuperClaude) or trust red flags (claude-mem's crypto-token endorsement and hosted sign-in).
  - Star counts in the 100k–300k range for config repos are unusual; treat stars as attention, not quality.
- **AI review noise.** Anthropic's docs warn that reviewers asked to find gaps always find some, which leads to over-engineering. Use confidence thresholds (the plugin's ≥80), REVIEW.md nit caps, and "after the first review, Important only." Vendor accuracy claims are self-measured, including Anthropic's under-1% incorrect rate.
- **Trust gap.** Usage outpaces trust in surveys (from memory, see §7). Independent RCT-style work such as METR's 2025 study (from memory) found experienced developers slower in some settings. Anthropic's own internal productivity numbers are self-reported.
- **Common failure modes across methods:**
  - kitchen-sink sessions;
  - repeated corrections polluting context;
  - over-specified CLAUDE.md;
  - unscoped "investigate" requests;
  - agents declaring victory early or editing tests;
  - one-shotting large features;
  - leaving a broken state with no notes;
  - in fan-outs, file collisions and merge conflicts;
  - prompt-injection-driven actions. Anthropic reported an incident-response agent asking a coding agent to push a fix over Slack, which a human gate caught.

---

## 5. Key dates

- **2024-12-19:** Anthropic, "Building effective agents" (orchestrator-workers and other patterns).
- **2025-02 (from memory):** Karpathy coins "vibe coding"; Claude Code research preview; Harper Reed's codegen workflow post (Feb 16).
- **2025 (spring–summer):** Task Master, BMAD and Agent OS emerge (dates approximate).
- **2025-04 (from memory):** Anthropic publishes "Claude Code: best practices for agentic coding" (Explore→Plan→Code→Commit).
- **2025-04-28:** Anthropic Economic Index software-development report.
- **2025-05:** Claude Code GA.
- **2025-06-13:** Anthropic's multi-agent research system post (+90.2%, ~15× tokens).
- **2025-07-02:** LangChain's write/select/compress/isolate post.
- **2025-07 (from memory):** Kiro preview; Huntley's Ralph post around this time.
- **2025-08:** HumanLayer ACE-FCA / RPI (YC talk Aug 20).
- **2025-09:** GitHub spec-kit (from memory); Tessl Spec Registry open beta.
- **2025-09-29:** Anthropic, "Effective context engineering for AI agents".
- **2025-10 (from memory):** Superpowers (~Oct 9); Willison's "vibe engineering" (Oct 7); Beads.
- **2025-10-15:** Böckeler, "Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl".
- **2025-10-16:** Anthropic Agent Skills post.
- **2025-11:** HumanLayer "Writing a good CLAUDE.md"; Claude Code $1B run-rate; Kiro GA (from memory).
- **2025-11-25:** Anthropic "Using CLAUDE.md files" blog.
- **2025-11-26:** Anthropic "Effective harnesses for long-running agents".
- **2025-12 (approx.):** Official ralph-wiggum plugin; Agentic AI Foundation formed (goose now under `aaif-goose`).
- **2026-01 (from memory):** Gas Town (~Jan 1); Vercel's AGENTS.md vs skills eval (late Jan).
- **2026-01-20:** Factory Agent Readiness.
- **2026-01-27:** Ralph mainstream coverage (The Register).
- **2026-02:** ETH AGENTS.md paper (arXiv 2602.11988); OpenAI "harness engineering"; Karpathy's "agentic engineering" (secondary).
- **2026-02-05:** Carlini's C compiler with parallel Claudes.
- **2026-02-12:** Claude Code passes $2.5B run-rate; SemiAnalysis estimates 4% of GitHub commits.
- **2026-02-23:** Willison launches "Agentic Engineering Patterns".
- **2026-03:** Horthy's "Everything We Got Wrong About RPI" talk (QRSPI).
- **2026-03-09:** Anthropic Code Review launch.
- **2026-06-18:** Anthropic "Steering Claude Code" blog (anti-patterns, under-200-line rule).
- **2026-07:** Code Review `@claude review` semantics change; Anthropic AI-native lifecycle post (Jul 21).
- **2026-10-11:** Snapshot. Official marketplace has 342 plugins; spec-kit 140.7k★, Superpowers 297k★, OpenCode 212.6k★, Claude Code 150.1k★.

---

## 6. Sources

All primary except where marked secondary.

**Anthropic docs and blogs**
- Best practices for Claude Code — Anthropic — living doc (originally Apr 2025) — https://code.claude.com/docs/en/best-practices — verification-first, explore/plan/code/commit, failure patterns.
- Claude Code: Best practices for agentic coding — Anthropic — 2025 — https://www.anthropic.com/engineering/claude-code-best-practices — now redirects to the docs page.
- How Claude remembers your project (memory) — Anthropic — 2026 — https://code.claude.com/docs/en/memory — under-200-line target, rules, AGENTS.md support, imports.
- Extend Claude Code (features overview) — Anthropic — 2026 — https://code.claude.com/docs/en/features-overview — CLAUDE.md vs skills vs hooks; context-cost table.
- Agent teams — Anthropic — 2026 — https://code.claude.com/docs/en/agent-teams — setup, sizing, limits.
- Dynamic workflows — Anthropic — 2026 — https://code.claude.com/docs/en/workflows — scripted fan-out, limits, ultracode.
- /goal — Anthropic — 2026 — https://code.claude.com/docs/en/goal — evaluator loop, condition-writing guidance.
- Code Review docs — Anthropic — 2026 — https://code.claude.com/docs/en/code-review — triggers, severities, REVIEW.md, pricing.
- GitHub Actions docs — Anthropic — 2026 — https://code.claude.com/docs/en/github-actions — v1 action, YAML, security.
- Install and manage plugins — Anthropic — 2026 — https://code.claude.com/docs/en/discover-plugins — scopes, context-cost estimates.
- Anthropic's marketplaces — Anthropic — 2026 — https://code.claude.com/docs/en/plugins/anthropic-marketplaces — official vs community vs demo.
- Code Review launch — Anthropic — Mar 9, 2026 — https://claude.com/blog/code-review — internal stats.
- How Anthropic secures its AI-native SDLC — Jason Clinton — Jul 21, 2026 — https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle — layered gates, ~80% of code authored by Claude.
- Steering Claude Code — Michael Segner — Jun 18, 2026 — https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more — anti-patterns.
- Using CLAUDE.md files — Anthropic — Nov 25, 2025 — https://claude.com/blog/using-claude-md-files — /init as starting point.
- Claude Marketplace — Anthropic — accessed Oct 11, 2026 — https://claude.com/marketplace/plugins — 342 plugins, verified badges.
- Building effective agents — Erik S., Barry Zhang — Dec 19, 2024 — https://www.anthropic.com/engineering/building-effective-agents — patterns.
- Multi-agent research system — Hadfield et al. — Jun 13, 2025 — https://www.anthropic.com/engineering/multi-agent-research-system — +90.2%, 15× tokens.
- Effective context engineering — Rajasekaran et al. — Sep 29, 2025 — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents — compaction, notes, sub-agents.
- Agent Skills — Zhang, Lazuka, Murag — Oct 16, 2025 — https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills — progressive disclosure.
- Effective harnesses for long-running agents — Justin Young — Nov 26, 2025 — https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents — initializer/coding agents.
- Building a C compiler with parallel Claudes — Nicholas Carlini — Feb 5, 2026 — https://www.anthropic.com/engineering/building-c-compiler — 16 agents, ~$20k.
- Impact on software development — Anthropic — Apr 28, 2025 — https://www.anthropic.com/research/impact-software-development — 79% automation.
- Bun acquisition / $1B milestone — Anthropic — Dec 3, 2025 — https://www.anthropic.com/news/anthropic-acquires-bun-as-claude-code-reaches-usd1b-milestone.
- Series G announcement — Anthropic — Feb 12, 2026 — https://www.anthropic.com/news/anthropic-raises-30-billion-series-g-funding-380-billion-post-money-valuation — $2.5B run-rate, 4% of commits.

**Methodology originators and repos**
- ace-fca.md — HumanLayer — Aug 2025 — https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md — RPI, frequent intentional compaction.
- Advanced Context Engineering (blog) — HumanLayer — 2025 — https://www.humanlayer.com/blog/advanced-context-engineering — seen in search, not fetched.
- HumanLayer .claude/commands — 2025–26 — https://github.com/humanlayer/humanlayer/tree/main/.claude/commands — reference prompts.
- 12-factor-agents — Dex Horthy — 2025 — https://github.com/humanlayer/12-factor-agents — "own your context window".
- QRSPI — matanshavit — 2026 — https://github.com/matanshavit/qrspi — codification of Horthy's March 2026 talk [secondary].
- Horthy talk page — HumanLayer — Mar 2026 — https://www.humanlayer.dev/qrspi-mlops — not fetched.
- RPI→CRISPY summary — ZenML — 2026 — https://www.zenml.io/llmops-database/evolution-from-rpi-to-crispy-multi-stage-workflow-for-production-coding-agents [secondary].
- Understanding SDD: Kiro, spec-kit, Tessl — Birgitta Böckeler — Oct 15, 2025 — https://www.martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html — via search excerpts only.
- Thoughtworks Radar: SDD — Thoughtworks — 2025 — https://www.thoughtworks.com/radar/techniques/spec-driven-development — via search excerpts.
- github/spec-kit — GitHub — 2025–26 — https://github.com/github/spec-kit — 140.7k★.
- spec-driven.md — GitHub — https://github.com/github/spec-kit/blob/main/spec-driven.md — constitution articles.
- Fission-AI/OpenSpec — https://github.com/Fission-AI/OpenSpec — 71.6k★.
- BMAD-METHOD — https://github.com/bmad-code-org/BMAD-METHOD — 54.0k★.
- Agent OS — https://github.com/buildermethods/agent-os — 5.5k★.
- Task Master — https://github.com/eyaltoledano/claude-task-master — 28.2k★.
- Kiro issue tracker — AWS — https://github.com/kirodotdev/Kiro — feature surfaces.
- Tessl review — codemyspec — 2026 — https://codemyspec.com/blog/tessl-review [secondary]; Tessl research — Ry Walker — https://rywalker.com/research/tessl [secondary].
- Ralph Wiggum as a "software engineer" — Geoffrey Huntley — 2025 — https://ghuntley.com/ralph/ — seen in search, not fetched.
- ralph-wiggum plugin — Anthropic — https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum.
- how-to-ralph-wiggum (ralph-playbook fork) — https://github.com/ghuntley/how-to-ralph-wiggum [secondary interpretation of Huntley].
- snarktank/ralph — Ryan Carson — https://github.com/snarktank/ralph — 21.9k★.
- Ralph coverage — The Register — Jan 27, 2026 — https://www.theregister.com/2026/01/27/ralph_wiggum_claude_loops/ [secondary].
- obra/superpowers — Jesse Vincent — https://github.com/obra/superpowers — 297k★.
- compound-engineering-plugin — Every — https://github.com/EveryInc/compound-engineering-plugin — 25.5k★; install page https://every.to/compound-engineering/install/.
- steveyegge/beads — https://github.com/steveyegge/beads — 27.8k★.
- gastown — https://github.com/steveyegge/gastown — 18.3k★; glossary https://docs.gastownhall.ai/glossary.
- Gas Town feature — heise — 2026 — https://www.heise.de/en/background/Full-Control-Gas-Town-Orchestrates-Ten-or-More-Coding-Agents-11178824.html?seite=2 [secondary].
- feature-dev plugin — Anthropic — https://github.com/anthropics/claude-code/tree/main/plugins/feature-dev.
- tdd-guard — nizos — https://github.com/nizos/tdd-guard — 2.4k★.
- Agentic Engineering Patterns — Simon Willison — Feb 23, 2026 — https://simonwillison.net/2026/Feb/23/agentic-engineering-patterns/ — seen in search; changelog https://simonwillison.net/guides/agentic-engineering-patterns/what-is-agentic-engineering/changes.
- Karpathy coins "agentic engineering" — letsdatascience — 2026 — https://letsdatascience.com/news/andrej-karpathy-coins-agentic-engineering-term-a55528b6 [secondary].
- Context engineering for agents — LangChain — Jul 2, 2025 — https://langchain.com/blog/context-engineering-for-agents; repo https://github.com/langchain-ai/context_engineering.
- Agent Readiness — Factory — Jan 20, 2026 — https://factory.ai/news/agent-readiness; docs https://docs.factory.ai/agent-readiness/overview — via search excerpts.
- Factory-AI/factory — https://github.com/Factory-AI/factory — Droid, GitHub Action.
- Harness engineering — OpenAI — Feb 2026 — https://openai.com/index/harness-engineering/ — via search excerpts.

**CLAUDE.md / AGENTS.md research**
- Evaluating AGENTS.md — Gloaguen et al. (ETH) — Feb 2026 — https://arxiv.org/pdf/2602.11988; https://www.sri.inf.ethz.ch/publications/gloaguen2026agentsmd; notes https://github.com/AkihikoWatanabe/paper_notes/issues/4710.
- InfoQ on context-file value — Mar 2026 — https://infoq.com/news/2026/03/agents-context-file-value-review [secondary].
- AGENTS.md outperforms skills — Vercel — late Jan 2026 — https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals — via search excerpts; vendor eval.
- Writing a good CLAUDE.md — HumanLayer (Kyle) — Nov 2025 — summarized at https://github.com/AkihikoWatanabe/paper_notes/issues/4717 [secondary summary].
- agents.md spec — https://github.com/agentsmd/agents.md — 24.9k★.
- Do Context Files Help Coding Agents? — Jul 2026 — https://arxiv.org/html/2607.27250v1 — title only.

**Ecosystem repos** (stars on 2026-10-11)
- claude-plugins-official https://github.com/anthropics/claude-plugins-official
- skills https://github.com/anthropics/skills
- demo plugins https://github.com/anthropics/claude-code/blob/main/plugins/README.md
- code-review plugin https://github.com/anthropics/claude-code/tree/main/plugins/code-review
- awesome-claude-code https://github.com/hesreallyhim/awesome-claude-code
- wshobson/agents https://github.com/wshobson/agents
- VoltAgent https://github.com/VoltAgent/awesome-claude-code-subagents
- SuperClaude https://github.com/SuperClaude-Org/SuperClaude_Framework
- ruflo/claude-flow https://github.com/ruvnet/claude-flow
- everything-claude-code https://github.com/affaan-m/everything-claude-code
- trailofbits/skills https://github.com/trailofbits/skills
- claude-mem https://github.com/thedotmack/claude-mem
- serena https://github.com/oraios/serena
- context7 https://github.com/upstash/context7

**Tools**
- claude-code https://github.com/anthropics/claude-code
- claude-code-action https://github.com/anthropics/claude-code-action
- codex https://github.com/openai/codex
- gemini-cli https://github.com/google-gemini/gemini-cli
- opencode https://github.com/sst/opencode
- aider https://github.com/Aider-AI/aider
- pi-mono https://github.com/badlogic/pi-mono
- copilot-cli https://github.com/github/copilot-cli
- goose https://github.com/block/goose
- crush https://github.com/charmbracelet/crush
- ACP https://github.com/agentclientprotocol/agent-client-protocol

---

## 7. Unverified / low-confidence items

**Research constraints.** The shared web-search cap was hit early. WebFetch could not resolve martinfowler.com, openai.com, vercel.com, arxiv.org, humanlayer.dev/.com, simonwillison.net, harper.blog, stackoverflow.co or factory.ai. Content from those sites comes only from search-result excerpts or from my memory.

**From memory, not re-verified this session:**
- **Harper Reed's post** (Feb 16, 2025): the prompts and files (`spec.md`, `prompt_plan.md`, `todo.md`, repomix, mise). The URL was not verified, so it is not cited.
- **Willison's "Vibe engineering"** (Oct 7, 2025) and its practice list. The URL was not verified.
- **Karpathy's "vibe coding" quote and date.** The "agentic engineering" coinage date (early Feb 2026) comes from secondary sources only.
- **Böckeler details:** Kiro inflating a small bug into multiple stories and acceptance criteria; the "markdown review vs code review" point; the MDD "worst of both worlds" line; Tessl's "GENERATED FROM SPEC" markers. The three levels and the Radar warning *are* verified via search excerpts.
- **Kiro specifics:** `.kiro/specs/*/requirements.md|design.md|tasks.md`, `.kiro/steering/`, EARS format, GA on Nov 17, 2025, and pricing (third-party sources conflict).
- **spec-kit's announcement date** (Sept 2025) and the earlier `specs/###-feature/` layout.
- **BMAD persona list.**
- **The Agent OS v3 refocus narrative.**
- **Origin dates** for Superpowers, Beads, Gas Town, the official Ralph plugin (~Dec 2025) and compound engineering.
- **OpenAI harness-engineering numbers:** ~1M LOC, ~1,500 PRs, a small team, five months, zero hand-written code.
- **Codex AGENTS.md discovery rules:** global `~/.codex/AGENTS.md`, `AGENTS.override.md`, root-to-cwd concatenation, and the 32 KiB `project_doc_max_bytes` default. The repo's own doc is a stub.
- **The HumanLayer claim that their own root CLAUDE.md is under 60 lines.**
- **A Jan 2026 study reporting AGENTS.md reduced agent runtime by ~29% and output tokens by ~17%.** Title, authors and numbers are all unverified.
- **Code-review vendor claims:** CodeRabbit (1.7× issues in AI PRs), Greptile's benchmark, Bugbot pricing and resolution rate, Cursor acquiring Graphite (Dec 2025), Copilot code review GA date and CodeQL integration, and Codex review features.
- **Survey figures:** Stack Overflow 2025 (84%/51%/46% vs 33%/66%), JetBrains Developer Ecosystem 2025 (85%/62%), the Pragmatic Engineer 2026 survey ranking Claude Code #1, and Menlo Ventures' coding-share figures. **Stack Overflow 2026 results were not retrieved at all.**
- **METR's 2025 slowdown study** (19% slower) is mentioned only as context.
- **Tool launch dates** for Cursor 2.0 and Composer, Cursor CLI, Antigravity, the Windsurf/Cognition deal, Jules, the Copilot coding agent, Amp, Warp, Claude Code on the web, and Kiro GA.
- **Practitioner consensus on relative strengths** (Claude Code vs Codex vs Cursor) is a synthesis from memory, not an evidence-backed ranking.

**Verified but anomalous.** Very high star counts for configuration and framework repos (Superpowers 297k, ECC 276.6k, anthropics/skills 180.4k) were read directly from GitHub. They may reflect attention dynamics or inflation rather than usage; GitHub shows no download or active-use metrics.

**Fetched with caveats:**
- The Copilot CLI README snapshot names Sonnet 4.5 as default, so it may be stale.
- Factory's docs page and launch post disagree on the pillar count: nine vs eight.
