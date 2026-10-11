# Anthropic's official canon and the Claude Code team's own practices (as of 2026-10-11)

**How this brief was made.** I fetched primary pages from anthropic.com, claude.com, code.claude.com and platform.claude.com, and the anthropics/claude-code repo on GitHub. Two limits shaped what I could check:

- The shared WebSearch budget ran out partway through.
- This sandbox's egress policy blocked most third-party hosts: x.com, Substack, podcasts, news sites, Wikipedia, `www-cdn.anthropic.com` (PDFs) and `claude.dev`.

As a result, Boris Cherny's X threads are reconstructed from a community GitHub repo that summarizes them. I dated each thread by decoding its X status ID. Everything I could not re-verify is listed in §7.

---

## 1. Top takeaways

1. **Give Claude a check it can run.** This is the first section of the current best-practices docs. They rank four ways to stop Claude finishing on "looks done", from weakest to strongest:
   - ask for the check in the prompt;
   - set a `/goal`, which an evaluator re-checks after every turn;
   - add a Stop hook that blocks the turn until a script passes;
   - have a verification subagent or workflow try to refute the result.

   Also ask Claude to show evidence (test output, screenshots) rather than just claim success. [docs: best practices](https://code.claude.com/docs/en/best-practices)
2. **Context is still the binding constraint, even with 1M-token windows.**
   - Run `/clear` between unrelated tasks.
   - Rewind with Esc Esc rather than piling corrections on top; after two failed corrections, `/clear` and write a better prompt.
   - Send exploration to subagents.
   - Compact before you step away, while the cache is still warm.

   Sources: [docs](https://code.claude.com/docs/en/best-practices); [Thariq Shihipar, Apr 2026](https://claude.com/resources/articles/using-claude-code-session-management-and-1m-context); [Lydia Hallie, Aug 2026](https://claude.com/resources/articles/maximizing-the-value-of-your-claude-code-sessions)
3. **Work in four phases: explore, plan, implement, commit.** Use plan mode only when the approach is uncertain or the change spans several files ("If you could describe the diff in one sentence, skip the plan"). For big features, have Claude interview you with `AskUserQuestion`, write `SPEC.md`, then implement it in a fresh session. [docs](https://code.claude.com/docs/en/best-practices)
4. **Keep CLAUDE.md short and owned by the team.**
   - For each line, ask "Would removing this cause Claude to make mistakes?"
   - Check it into git, and add a rule after every correction.
   - Put sometimes-relevant knowledge into skills or path-scoped rules, and anything that must happen every time into hooks.
   - Re-review the whole configuration every 3–6 months and after model launches.

   Sources: [docs](https://code.claude.com/docs/en/best-practices); [steering guide, Jun 2026](https://claude.com/resources/articles/steering-claude-code-skills-hooks-rules-subagents-and-more); [large codebases, May 2026](https://claude.com/resources/articles/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start)
5. **Permissions have moved from prompts to classifiers.**
   - Users approved 93% of permission prompts in Anthropic's Mar 2026 data and 97% in its Aug 2026 data.
   - OS-level sandboxing cut prompts by 84%.
   - Auto mode became the default for new Pro, Max and Team sessions on 14 Aug 2026. From Claude Code v2.1.283 it is the built-in starting mode for interactive sessions.
   - On real over-eager actions, auto mode still misses 17%, so Anthropic says to keep manual review for production infrastructure.

   Sources: [auto mode, Mar 2026](https://www.anthropic.com/engineering/claude-code-auto-mode); [auto mode default, Aug 2026](https://claude.com/resources/articles/auto-mode-default-in-claude-code)
6. **Contain the agent before you try to steer it.** Anthropic's principle is "Design for containment at the environment layer first, then steer behavior at the model layer." In an internal red-team exercise, a phished user launched Claude Code with a malicious prompt. Exfiltration succeeded in 24 of 25 runs; only egress controls and filesystem boundaries held. [How we contain Claude, May 2026](https://anthropic.com/engineering/how-we-contain-claude)
7. **Parallel sessions are the biggest productivity unlock, but only for independent work.**
   - Jan 2026: Boris Cherny ran 5 terminal sessions plus 5–10 web sessions; the team's top tip was 3–5 git worktrees.
   - Today the tools are agent view, `/batch` (5–30 worktree subagents), dynamic workflows (tens to hundreds of subagents) and experimental agent teams (start with 3–5 teammates).

   Sources: [bcherny-claude README](https://github.com/0xquinto/bcherny-claude) (secondary); [agent teams docs](https://code.claude.com/docs/en/agent-teams.md)
8. **Multi-agent setups use 3–10× more tokens.** They are worth it only for context protection, parallel work, or specialization. Split work by the context each part needs, not by role: a planner/implementer/tester/reviewer split loses information at every handoff. Verifier subagents are the exception that works reliably. [multi-agent guide, Jan 2026](https://claude.com/resources/articles/building-multi-agent-systems-when-and-how-to-use-them)
9. **Long-running harnesses share a common pattern.**
   - An initializer agent sets up `init.sh`, a progress file, a JSON feature list with `"passes": false`, and git.
   - Generation and evaluation are separate agents, with a skeptical, calibrated evaluator.
   - When a new model arrives, remove scaffolding it no longer needs: context resets "had become dead weight" with Opus 4.5.

   Sources: [harnesses, Nov 2025](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents); [harness design, Mar 2026](https://www.anthropic.com/engineering/harness-design-long-running-apps); [Managed Agents, Apr 2026](https://www.anthropic.com/engineering/managed-agents)
10. **Default model and effort, October 2026.** Claude Code runs Opus 5.5 at `medium` effort.
    - Don't carry over the effort level you used on Opus 5.
    - Use `high` when edge cases matter, such as bug-fixing. Use `xhigh` or `max` only where you have measured a gain.
    - Fable 5.1 is for the hardest long-horizon work, Sonnet 5.5 for well-scoped tasks, and Haiku 5.5 for subagent work.
    - Set model and effort at the start of a session; changing them mid-session can invalidate the prompt cache.

    Sources: [model config](https://code.claude.com/docs/en/model-config.md); [Opus 5.5](https://www.anthropic.com/claude-opus-5-5); [Haiku 5.5](https://www.anthropic.com/claude-haiku-5-5)
11. **Prompting advice for the Claude 5 models reverses some 2025 habits.**
    - The 2025 guidance was to tell Claude to verify its work and to "think hard". The 2026 docs say Opus 5 "verifies its own work without being told", so explicit verification instructions cause over-verification and should be removed.
    - Damp subagent spawning and constrain scope explicitly.
    - "think hard" is no longer a recognized keyword; only `ultrathink` remains.
    - The exception: Sonnet 5.5 at `low` effort can skip checks, so its guide gives a verification paragraph to add.

    Sources: [Prompting Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5.md); [Prompting Sonnet 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5.md)
12. **Anthropic's own code review is multi-agent, and human review is tiered by risk.**
    - With the Code Review agents, the share of PRs getting substantive review comments rose from 16% to 54%, and engineers mark under 1% of findings as incorrect. Each review costs $15–25.
    - Humans review a risk-weighted sample of automated approvals.

    Sources: [Code Review, Mar 2026](https://claude.com/resources/articles/code-review); [SDLC security, Jul 2026](https://claude.com/resources/articles/how-anthropic-secures-its-ai-native-software-development-lifecycle)
13. **Anthropic's internal numbers.**
    - Over 80% of merged code was authored by Claude by May 2026, up from "low single digits" before February 2025.
    - Engineers ship 8× as much code per quarter as in 2021–2025.
    - CI job volume grew 25× in six months.
    - On open-ended Claude Code tasks, the internal success rate rose from about 26% to 91% by September 2026.
    - Claude "leads" 26% of AI R&D tasks, up from under 1% in February 2026.

    Sources: [When AI builds itself](https://www.anthropic.com/institute/recursive-self-improvement); [CI article](https://claude.com/resources/articles/agentic-coding-is-straining-ci-heres-how-we-scaled-test-impact-analysis-at-anthropic); [pace of AI development](https://www.anthropic.com/institute/measuring-pace-of-ai-development)
14. **The Dec 2025 internal survey was more modest.**
    - Claude was used in about 59–60% of work, with self-reported productivity up 50% (from 20% a year earlier).
    - Merged PRs per engineer per day rose 67%.
    - 27% of Claude-assisted work would not otherwise have been done.
    - Most staff could fully delegate only 0–20% of their work.

    [How AI is transforming work at Anthropic](https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic)
15. **Learning suffers if you delegate everything.** In a randomized trial of 52 engineers, the group with AI help scored 17% lower on a follow-up quiz (50% vs 67%), with no significant speed gain. Learning held up when participants asked conceptual questions or asked for explanations alongside code. [AI assistance and coding skills, Jan 2026](https://www.anthropic.com/research/AI-assistance-coding-skills)
16. **Expertise still matters.**
    - Across about 400k Claude Code sessions, novices reached verified success 15% of the time, against 28–33% for intermediate users and above.
    - The authors write that "the ability to steer Claude toward success comes more from command of a domain than from the ability to write code".
    - Experienced users auto-approve more (over 40% vs about 20% of sessions) and also interrupt more (about 9% vs 5% of turns).

    Sources: [expertise, Jun 2026](https://www.anthropic.com/research/claude-code-expertise); [agent autonomy, Feb 2026](https://www.anthropic.com/research/measuring-agent-autonomy)
17. **Quality regressions happen.** Between March and April 2026, three changes degraded Claude Code:
    - the default effort was lowered from `high` to `medium`;
    - a caching bug wiped thinking history on every turn;
    - a system-prompt line to reduce verbosity cost 3% on evals.

    The advice to users: check `/effort` and report problems with `/feedback`. [April 23 postmortem](https://www.anthropic.com/engineering/april-23-postmortem)
18. **Read benchmark claims skeptically.** SWE-bench has dropped out of model launch posts in favor of Terminal-Bench 4.0, FrontierCode and CursorBench. Infrastructure setup alone can move agentic coding scores by up to 6 points, so treat leaderboard gaps under 3 points with suspicion. [infrastructure noise, Feb 2026](https://www.anthropic.com/engineering/infrastructure-noise)
19. **How costs work.**
    - Output tokens cost about 5× input.
    - Cache reads dominate agentic spend. They cost 0.1× the input price on most models, 0.05× on Opus 5.5 and Sonnet 5.5, and 0.025× on Fable 5.1.
    - Opus 5.5 costs about 40% less per task than Opus 5.

    Sources: [Lydia Hallie](https://claude.com/resources/articles/maximizing-the-value-of-your-claude-code-sessions); [Opus 5.5 coding sessions](https://claude.com/resources/articles/claude-opus-5-5-built-for-coding-sessions-that-use-more-context); [models overview](https://platform.claude.com/docs/en/models/overview.md)

---

## 2. Detailed findings

### 2.1 Foundational engineering canon (Dec 2024 – Nov 2025)

- **Building effective agents** (Erik Schluntz and Barry Zhang, 19 Dec 2024) [link](https://www.anthropic.com/engineering/building-effective-agents)
  - **Workflows vs agents.** Workflows are "predefined code paths"; agents are LLMs that "dynamically direct their own processes".
  - **Patterns:** prompt chaining, routing, parallelization (sectioning or voting), orchestrator-workers, evaluator-optimizer.
  - **Principles:** simplicity, transparency, and careful design of the agent-computer interface.
  - **Tool design lesson from SWE-bench:** "we actually spent more time optimizing our tools than the overall prompt". Requiring absolute file paths fixed a whole class of errors.
  - The page now says the tooling landscape has changed and points readers to the Managed Agents docs.
- **Claude Code: Best practices for agentic coding** (18 Apr 2025)
  - The URL now returns a 308 redirect to the living docs page at [code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices).
  - Its organizing claim: "Claude's context window fills up fast, and performance degrades as it fills."
  - What the docs page adds that the 2025 post did not have:
    - a "before/after" prompt table (verification criteria, visual checks, fixing root causes);
    - the plan-mode overhead caveat;
    - a CLAUDE.md include/exclude table;
    - add "IMPORTANT" to one line only, never to many;
    - `/doctor` proposes cuts to a checked-in CLAUDE.md;
    - hooks are "deterministic", while CLAUDE.md is "advisory";
    - a code-intelligence plugin for typed languages;
    - `/btw` for side questions that never enter history;
    - name sessions with `/rename` "and treat them like branches";
    - the Writer/Reviewer pattern;
    - `/batch` fan-out to 5–30 worktree subagents;
    - auto mode;
    - an "adversarial review step", with a warning that reviewers "will usually report some [gaps], even when the work is sound", so tell them to flag only correctness and requirement gaps.
  - Named failure patterns: the kitchen-sink session, correcting over and over, the over-specified CLAUDE.md, the trust-then-verify gap, and infinite exploration.
- **How Anthropic teams use Claude Code** (24 Jul 2025) [link](https://claude.com/blog/how-anthropic-teams-use-claude-code)
  - Security: problems that took 10–15 minutes of manual scanning "now resolve 3x as quickly".
  - Inference: research time down 80%, from an hour to 10–20 minutes.
  - Data infrastructure: debugged a Kubernetes outage by feeding Claude dashboard screenshots.
  - Growth marketing: two subagents generate "hundreds of new ads in minutes".
  - Legal: non-engineers built a "phone tree" prototype.
  - The 23-page PDF's detailed tips could not be fetched here (see §7).
- **How we built our multi-agent research system** (13 Jun 2025) [link](https://www.anthropic.com/engineering/multi-agent-research-system)
  - An Opus 4 lead with Sonnet 4 subagents beat single-agent Opus 4 by 90.2% on Anthropic's internal research eval.
  - Token usage explained 80% of performance variance.
  - Agents use about 4× the tokens of chat; multi-agent systems about 15×.
  - Rewriting tool descriptions cut task completion time by 40%.
  - Coding is a weaker fit: "most coding tasks involve fewer truly parallelizable tasks than research."
- **Writing effective tools for agents — with agents** (Ken Aizawa, 11 Sep 2025) [link](https://www.anthropic.com/engineering/writing-tools-for-agents)
  - Process: prototype the tools, evaluate them on realistic verifiable tasks, then let Claude Code refactor the tools from eval transcripts, using a held-out test set.
  - Build a few targeted tools rather than wrapping every endpoint, and namespace them.
  - Offer a `response_format` choice: in their example, concise output used 72 tokens vs 206 for detailed.
  - "For Claude Code, we restrict tool responses to 25,000 tokens by default."
- **Effective context engineering for AI agents** (29 Sep 2025) [link](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
  - Concepts: context rot, a finite attention budget, and writing system prompts at the "right altitude".
  - Retrieve just in time using lightweight identifiers. Claude Code's hybrid: CLAUDE.md loaded up front, glob and grep for everything else.
  - Long-horizon tools: compaction (tune for recall first, then precision), clearing old tool results, structured note-taking, and subagents that return 1,000–2,000-token summaries.
  - Goal: "the smallest set of high-signal tokens".
- **Building agents with the Claude Agent SDK** (Thariq Shihipar, 29 Sep 2025) [link](https://claude.com/blog/building-agents-with-the-claude-agent-sdk)
  - "Give your agents a computer."
  - The agent loop: gather context → take action → verify work → repeat.
  - Start with agentic search (grep over files) before adding semantic search.
  - On verification: "The best form of feedback is providing clearly defined rules for an output." An LLM judge "is generally not a very robust method".
- **Equipping agents for the real world with Agent Skills** (16 Oct 2025; made an open standard 18 Dec 2025) [link](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
  - Progressive disclosure has three levels: name and description in the system prompt, then the SKILL.md body, then linked files.
  - Skills can bundle scripts that run without being loaded into context.
  - Authoring advice: start from evals, then iterate on the skill with Claude.
  - Audit untrusted skills before installing them.
- **Beyond permission prompts: sandboxing** (David Dworken and Oliver Weller-Davies, 20 Oct 2025) [link](https://www.anthropic.com/engineering/claude-code-sandboxing)
  - "Effective sandboxing requires both filesystem and network isolation."
  - Built on bubblewrap (Linux) and Seatbelt (macOS), with a domain-filtering proxy.
  - Cut permission prompts by 84%. The runtime is open-sourced as `sandbox-runtime`.
  - Claude Code on the web keeps git credentials outside the sandbox and routes git through a scoped proxy.
- **Code execution with MCP** (Adam Jones and Conor Kelly, 4 Nov 2025) [link](https://www.anthropic.com/engineering/code-execution-with-mcp)
  - Expose MCP servers to the agent as code APIs on a filesystem, so it loads only what it needs.
  - In their example, token use fell from 150k to 2k (98.7%).
- **Advanced tool use** (Bin Wu, 24 Nov 2025) [link](https://www.anthropic.com/engineering/advanced-tool-use)
  - Tool Search cut tool-definition context by about 85% and raised Opus 4.5 accuracy on MCP evals from 79.5% to 88.1%.
  - Programmatic tool calling cut tokens by 37%.
  - Tool-use examples raised accuracy on complex parameters from 72% to 90%.
- **Effective harnesses for long-running agents** (Justin Young, 26 Nov 2025) [link](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
  - An initializer agent writes `init.sh`, `claude-progress.txt`, a 200+-item JSON feature list (all `"passes": false`) and the first commit.
  - Each coding session then reads git log and progress, picks one feature, starts the server, runs an end-to-end smoke test, and leaves a clean commit.
  - "The model is less likely to inappropriately change or overwrite JSON files compared to Markdown files."
  - The prompt says: "It is unacceptable to remove or edit tests…"
  - Puppeteer-based end-to-end testing "dramatically improved performance".

### 2.2 Engineering posts in 2026

According to the engineering index and the sitemap, the last engineering-blog post was 25 May 2026. After that, Anthropic's guidance appears on claude.com (resources) and in the docs.

- **Demystifying evals for AI agents** (9 Jan) [link](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
  - Vocabulary: task, trial, grader, transcript, outcome, harness.
  - pass@k measures the chance of at least one success; pass^k measures consistency. For example, 75% per-trial success gives about 42% at pass^3.
  - Start with "20-50 simple tasks drawn from real failures."
  - Keep capability evals and regression evals separate. Grade outcomes, not paths.
  - "Read the transcripts!"
- **Designing AI-resistant technical evaluations** (Tristan Hume, 21 Jan) [link](https://www.anthropic.com/engineering/AI-resistant-technical-evaluations)
  - Anthropic's performance-engineering take-home was overtaken by Claude:
    - Opus 4 beat almost all human candidates within the 4-hour limit;
    - Opus 4.5 matched the best human within 2 hours.
  - Humans still win at long horizons and at escaping false dead ends; Claude found the trick only after being told the target cycle count.
- **Building a C compiler with a team of parallel Claudes** (Nicholas Carlini, 5 Feb) [link](https://www.anthropic.com/engineering/building-c-compiler)
  - Setup: 16 Opus 4.6 agents, each in a `while true` loop running Claude Code with `--dangerously-skip-permissions` inside its own container. They coordinated through a bare git upstream and lock files in `current_tasks/`, with no orchestrator.
  - Scale: about 2,000 sessions, 2B input and 140M output tokens, just under $20k, for a roughly 100k-line Rust compiler that builds Linux 6.9 on x86, ARM and RISC-V.
  - Lessons:
    - the verifier must be "nearly perfect";
    - keep test output to a few lines, with details in log files and "ERROR" on the same line so grep finds it;
    - add a `--fast` mode that runs a 1–10% sample of tests, because of "time blindness";
    - give agents specialized roles (deduplication, performance, documentation);
    - use GCC as an oracle to split up a monolithic task.
  - Carlini's caution: "it is easy to see tests pass and assume the job is done."
- **Quantifying infrastructure noise in agentic coding evals** (Gian Segato, 5 Feb) [link](https://www.anthropic.com/engineering/infrastructure-noise)
  - On Terminal-Bench 2.0, scores differed by 6 points (p<0.01) between strict 1× resources and uncapped resources.
  - Recommendations: report the resource multiplier you used, run evals on several days, and distrust leaderboard gaps under 3 points.
- **Harness design for long-running application development** (Prithvi Rajasekaran, 24 Mar) [link](https://www.anthropic.com/engineering/harness-design-long-running-apps)
  - Architecture: planner → generator → evaluator, inspired by GANs. The evaluator uses Playwright to exercise the app. Before each sprint, generator and evaluator agree a "sprint contract" saying what done means.
  - Problems it addresses: "agents reliably skew positive when grading their own work", and out of the box Claude was "a poor QA agent".
  - Results:
    - retro game maker on Opus 4.5: solo run 20 min/$9 and the core feature didn't work; full harness 6 h/$200 and the game was playable;
    - digital audio workstation on Opus 4.6: about 3 h 50 min, $124.70, after dropping sprints in favor of one QA pass at the end.
  - Rules: remove components one at a time to see which are load-bearing, and re-examine the harness with every new model.
- **How we built Claude Code auto mode** (John Hughes, 25 Mar) [link](https://www.anthropic.com/engineering/claude-code-auto-mode)
  - Input layer: a probe scans tool outputs for prompt injection.
  - Output layer: a two-stage transcript classifier running on Sonnet 4.6, which is "reasoning-blind by design" (it sees user messages and tool calls, not Claude's prose or tool results).
  - Three tiers of actions:
    - allowlisted read-only tools;
    - edits inside the project, which skip the classifier;
    - everything else, which the classifier checks.
  - Accuracy:

    | Pipeline | False positives on real traffic (n=10k) | False negatives on real over-eager actions (n=52) | False negatives on synthetic exfiltration |
    |---|---|---|---|
    | Stage 1 only | 8.5% | 6.6% | 1.8% |
    | Full pipeline | 0.4% | 17% | 5.7% |

  - When it entered auto mode, Claude Code dropped any rule granting broad code execution.
  - After 3 consecutive or 20 total denials, it escalates to the human (in `-p` mode it terminates).
  - `claude auto-mode defaults` prints the rule set.
  - Compared with careful manual review, the authors call auto mode "arguably a regression".
- **Scaling Managed Agents: decoupling the brain from the hands** (Lance Martin, Gabe Cemaj and Michael Cohen, 8 Apr) [link](https://www.anthropic.com/engineering/managed-agents)
  - The session log, the harness and the sandbox sit behind separate interfaces, and containers are treated as "cattle".
  - Credentials never reach the sandbox: git is configured at init, and MCP calls go through a vault-backed proxy.
  - Time to first token fell about 60% at the median and over 90% at p95.
  - "Harnesses encode assumptions that go stale as models improve."
- **An update on recent Claude Code quality reports** (23 Apr) [link](https://www.anthropic.com/engineering/april-23-postmortem)
  - 4 Mar – 7 Apr: default effort lowered from `high` to `medium`, which Anthropic calls "the wrong tradeoff".
  - 26 Mar – 10 Apr: a bug cleared thinking history every turn.
  - 16–20 Apr: a verbosity line in the system prompt cost 3% on evals.
  - Fixes: more staff on the public build, evals for every prompt change, and gradual rollouts.
- **How we contain Claude across products** (Max McGuinness and others, 25 May) [link](https://anthropic.com/engineering/how-we-contain-claude)
  - Uses about 93% prompt approval to argue for containment over supervision.
  - Auto mode catches about 83% of over-eager actions, so it is "one layer inside a sandbox".
  - Lessons from real incidents:
    - Malicious repo config ran before the trust prompt; the fix defers loading project config until after consent.
    - In a Cowork case, files were exfiltrated through an allowlisted domain: "Every function reachable through any domain on an allowlist is now an attack surface."
    - "The weakest layer is the one you built yourself."

### 2.3 Best-practice articles from the Claude Code team and Applied AI on claude.com (2026)

- **Multi-agent: when and how** (Cara Phillips, 23 Jan) [link](https://claude.com/resources/articles/building-multi-agent-systems-when-and-how-to-use-them)
  - "Multi-agent implementations typically use 3-10x more tokens."
  - Use subagents to protect context when a subtask produces more than about 1,000 mostly irrelevant tokens.
  - Failure modes: the "telephone game" across handoffs, and "early victory" by verifiers. Example fix: "You MUST run the complete test suite before marking as passed."
- **Harnessing Claude's intelligence** (Lance Martin, 2 Apr) [link](https://claude.com/resources/articles/harnessing-claudes-intelligence)
  - Three patterns: lean on general tools (bash plus an editor), strip the harness down, and set boundaries carefully.
  - Letting Opus 4.6 filter its own tool outputs with code raised BrowseComp from 45.3% to 61.6%.
  - Caching discipline: stable content first, append rather than edit, and use a subagent instead of switching models.
- **Session management and 1M context** (Thariq Shihipar, 15 Apr) [link](https://claude.com/resources/articles/using-claude-code-session-management-and-1m-context)
  - Decision table: continue / rewind / `/compact <hint>` / `/clear` / subagent.
  - "when you start a new task, you should also start a new session."
  - Rewind instead of correcting.
  - The model is least capable at the moment it compacts, so compact proactively with a hint about where the work goes next.
- **Best practices for Opus 4.7** (16 Apr) [link](https://claude.com/resources/articles/best-practices-for-using-claude-opus-4-7-with-claude-code)
  - Put the whole task in the first turn and batch your questions.
  - `xhigh` became the default; `max` "is more prone to overthinking".
  - Ask explicitly for parallel subagents.
- **Large codebases** (14 May) [link](https://claude.com/resources/articles/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start)
  - The root CLAUDE.md should hold "pointers and critical gotchas only".
  - Start sessions in a subdirectory, scope test and lint commands per directory, and commit deny rules for noise.
  - Use LSP for symbol search, and read-only subagents for exploration.
  - Use Stop hooks that propose CLAUDE.md updates, and distribute the setup as a plugin.
  - Re-review the configuration every 3–6 months and give it a named owner.
- **Dynamic workflows** (28 May) [link](https://claude.com/resources/articles/introducing-dynamic-workflows-in-claude-code)
  - Claude writes an orchestration script that runs tens to hundreds of subagents, which try to refute each other.
  - Runs are resumable, and the setting is called `ultracode`.
  - They can "consume substantially more tokens", so start with a scoped task.
- **Running an AI-native engineering org** (Fiona Fung, Director of Engineering for Claude Code and Cowork, 3 Jun) [link](https://claude.com/resources/articles/running-an-ai-native-engineering-org)
  - The bottleneck moved to "Verification, code review, and security."
  - The team replaced roadmaps with just-in-time planning and replaced design docs with prototypes.
  - Humans review legal risk, trust boundaries, security-sensitive code and taste.
  - "I don't think I've seen a non-Claude-assisted commit in the last four months."
- **Steering Claude Code** (Michael Segner, 18 Jun) [link](https://claude.com/resources/articles/steering-claude-code-skills-hooks-rules-subagents-and-more)
  - "Every time X, do Y" belongs in a hook. Procedures belong in skills. Rules for one area of code belong in path-scoped rules. A side task belongs in a subagent.
  - "A real guardrail needs to be deterministic."
- **Getting started with loops** (Delba de Oliveira and Michael Segner, 30 Jun) [link](https://claude.com/resources/articles/getting-started-with-loops)
  - Four kinds of loop: turn-based, goal-based (`/goal`), time-based (`/loop`, `/schedule`) and proactive (routines).
  - Encode what "good" means in skills, review with a second agent, "fix the system", and monitor with `/usage`.
- **A field guide to Claude Fable 5** (Thariq, 6 Jul) [link](https://claude.com/resources/articles/a-field-guide-to-claude-fable-finding-your-unknowns)
  - "Claude Fable is the first model where I find the quality of the work is bottlenecked by my ability to clarify its unknowns."
  - Before implementing: blind-spot passes, prototypes, interviews and reference code.
  - During: an implementation-notes file.
  - After: explainers, plus a quiz on the changes that the author must pass perfectly before merging.
- **Choosing a model and effort level** (Lydia Hallie, 7 Jul) [link](https://claude.com/resources/articles/claude-model-and-effort-level-in-claude-code)
  - Use the default effort, and treat effort as "a manual override".
  - Effort also controls how many files Claude reads and how much it verifies.
  - Diagnose a bad answer in order: was the context wrong, did Claude not try hard enough (raise effort), or did it not know enough (larger model)?
  - Analogy: Fable is a specialist, Opus an expert, Sonnet a strong generalist.
- **Large-scale code migrations** (16 Jul) [link](https://claude.com/resources/articles/ai-code-migration)
  - First build a judge that passes on the old codebase and fails on deliberately broken code.
  - Then: a rulebook and dependency map; a throwaway "shakedown" translation; translate everything with smaller models implementing and larger models reviewing; two adversarial reviewers plus a tie-breaker; a queue derived from disk; batched compile fixes; matching behavior against the old code.
  - Results:
    - Bun, Zig to Rust (Jarred Sumner): about 1M lines in under two weeks, 5.9B uncached input and 690M output tokens, about $165k.
    - A Python-to-TypeScript port (Mike Krieger): 165k lines in a weekend, with 12 Sonnet subagents.
  - "Done should mean 'the output file exists on disk.'"
- **Verification loops with skills** (Delba de Oliveira, 22 Jul) [link](https://claude.com/resources/articles/building-verification-loops-in-claude-code-with-skills)
  - Verification skills can be standalone, embedded in another skill, chained, or run on every PR.
  - "list your exact build and test commands in CLAUDE.md."
- **Auto mode in production** (Molly Vorwerck, 7 Aug) [link](https://claude.com/resources/articles/auto-mode-in-production)
  - Claude works 9× longer between interruptions.
  - Customers deny `rm -rf`, block outbound messages, and switch to accept-edits mode for Terraform and AWS work.
- **Auto mode becomes the default** (7 Aug) [link](https://claude.com/resources/articles/auto-mode-default-in-claude-code)
  - Users approved 97% of prompts.
  - In a controlled study of 1,053 testers, human reviewers caught 13.6% of dangerous commands and auto mode caught 89%.
  - In real sessions, serious harm at severity 7+ was 6.3% with manual approval vs 2.4% with auto mode.
  - Auto mode users ship about 25% more PRs. Anthropic reports 0 of 720 injection attempts succeeded.
  - Admins can use `defaultMode` or `disableAutoMode`.
- **Maximizing the value of your sessions** (Lydia Hallie, 14 Aug) [link](https://claude.com/resources/articles/maximizing-the-value-of-your-claude-code-sessions)
  - Cache lifetime is 1 hour on subscriptions and 5 minutes with an API key; set `ENABLE_PROMPT_CACHING_1H=1` to extend it.
  - Bash output over 30k characters is written to a file instead of context.
  - Use `@`-mentions once per file, quiet noisy commands, and run `/autocompact 200k` on 1M models.
  - Give noisy subagents `model: haiku`, and run `/loop` in a separate session.
- **The Claude Code guide for startups** (Michael Segner, 20 Aug) [link](https://claude.com/resources/articles/claude-code-guide-for-startups)
  - Five rules: everyone ships, automate the tedium, trust but verify, build for rebuilding, and prototype → dogfood → productionize.
  - "Use hooks as hard gates." "Fix the principle, not the example."
- **Opus 5.5 coding sessions** (Michael Segner, 24 Sep) [link](https://claude.com/resources/articles/claude-opus-5-5-built-for-coding-sessions-that-use-more-context)
  - Claude works 3.3× longer per prompt, makes 40% more model calls, and needs 68% fewer interruptions. Context per request grew 2.6×.
  - Pick the model at the start, compact before you step away, and use a 1-hour cache lifetime.
  - Forked subagents start from the parent's cache.
- **Block orchestrating Fable across PRs** (8 Oct) [link](https://claude.com/resources/articles/how-block-orchestrates-claude-fable-across-thousands-of-pull-requests)
  - Fable plans; "up to dozens" of Opus or Sonnet workers make the edits.
  - Benchmark every model at every effort level.
  - Merges to main and deploys need two human approvals.
  - Use allowlists, and cheap regex checks outside the model.

### 2.4 Anthropic's own data on AI-assisted coding

| Date | Source | Key numbers |
|---|---|---|
| 28 Apr 2025 | [Economic Index: AI and software development](https://www.anthropic.com/research/impact-software-development) | **Data:** 500k coding interactions. **Automation:** 79% on Claude Code vs 49% on Claude.ai. **Interaction style:** "Feedback loop" 35.8% vs 21.3%; "directive" 43.8% vs 27.5%. **Languages:** JS/TS 31%, HTML/CSS 28%, Python 14%. **Who:** on Claude Code, 32.9% startup work vs 23.8% enterprise. |
| 15 Sep 2025 | [Economic Index, Sep 2025](https://www.anthropic.com/research/anthropic-economic-index-september-2025-report) | **Coding share:** 36% of Claude.ai; computer/math tasks 44% of API traffic. **Automation:** 77% of API usage. **Directive share on Claude.ai:** 27% → 39%. |
| 25 Nov 2025 | [Estimating productivity gains](https://www.anthropic.com/research/estimating-productivity-gains) | **Time saved:** about 80% per task (Claude's own estimate). **Software developers:** 19% of the estimated productivity gain. **Caveat:** RCTs elsewhere found 14–56% savings. |
| 2 Dec 2025 | [How AI is transforming work at Anthropic](https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic) | **Data:** survey of 132 people, 53 interviews, 200k transcripts. **Use and productivity:** Claude used in 59–60% of work; self-reported productivity +50%; 14% of respondents report over 100%. **Merged PRs:** +67% per engineer per day. **Autonomy:** consecutive tool calls 9.8 → 21.2; human turns 6.2 → 4.1. **Share of tasks:** feature implementation 14.3% → 36.9%. **Concerns:** skill atrophy and a "paradox of supervision". |
| 15 Jan 2026 | [Economic primitives](https://www.anthropic.com/research/anthropic-economic-index-january-2026-report) | **Coding share:** 34% of Claude.ai and 46% of API traffic. **Success:** software development tasks 61%. **Long tasks:** API success hits 50% at tasks of about 3.5 human-hours. |
| 29 Jan 2026 | [AI assistance and coding skills (RCT)](https://www.anthropic.com/research/AI-assistance-coding-skills) | **Design:** n=52. **Quiz:** 50% vs 67% (d=0.738, p=0.01); biggest gap on debugging questions. |
| 18 Feb 2026 | [Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) | **Turn length:** p99.9 rose from under 25 min to over 45 min. **Internal hardest tasks:** success doubled; interventions per session 5.4 → 3.3. **Auto-approve:** about 20% → over 40% with experience. **Software engineering:** about 50% of API tool calls. |
| 9 Mar 2026 | [Code Review](https://claude.com/resources/articles/code-review) | **Output:** code per engineer +200% in a year. **Review:** substantive comments 16% → 54%. **Large PRs** (>1k lines): 84% get findings, averaging 7.5 issues. |
| 24 Mar 2026 | [Economic Index: Learning curves](https://www.anthropic.com/research/economic-index-march-2026-report) | **Tenure:** users of 6+ months are about 10% more successful. **Style:** "the most advanced users are more likely to iterate with Claude". **Model choice:** Opus chosen for 55% of computer/math tasks. |
| May 2026 (updated 18 Sep 2026) | [When AI builds itself](https://www.anthropic.com/institute/recursive-self-improvement) | **Authorship:** "more than 80% of the code we merge… authored by Claude"; leadership estimates 90%+ including scripts. **Volume:** 8× code shipped. **Success:** open-ended Claude Code tasks 76% in May, then about 88–92% across all task tiers by September. **Quality:** "roughly at parity" with human code. **Self-estimate:** staff median about 4× output with Mythos Preview. |
| 16 Jun 2026 | [Agentic coding and expertise](https://www.anthropic.com/research/claude-code-expertise) | **Data:** about 400k sessions from 235k people. **Division of labor:** users make about 70% of planning decisions but only 20% of execution decisions. **Verified success:** novices 15% vs 28–33% others. **Abandonment:** 19% of troubled novice sessions. |
| 26 Jun 2026 | [Economic Index: Cadences](https://www.anthropic.com/research/economic-index-june-2026-report) | **Model mix:** Opus serves 54% of Claude Code sessions vs 10% of chat. **Autonomy:** higher on Claude Code for 26 of 31 output types. |
| 14 Sep 2026 | [CI test impact analysis](https://claude.com/resources/articles/agentic-coding-is-straining-ci-heres-how-we-scaled-test-impact-analysis-at-anthropic) | **CI jobs:** 25× in 6 months. **Tests:** 10× while headcount grew only nominally. **Advice:** "assume your architecture will be at a 25x load within two quarters." |
| 17 Sep 2026 | [Measuring the pace of AI development](https://www.anthropic.com/institute/measuring-pace-of-ai-development) | **AI R&D:** Claude "leads" 26% of tasks (Aug 2026, from under 1% in Feb). **Fleet:** about 30,000 concurrent agents on one internal platform. **Monitoring:** 0.002% of actions blocked. |
| May 2026 snapshot | [Economic Index dataset](https://www.anthropic.com/economic-index) (chat and Cowork only) | **Computer/math share:** 23.8% of usage. **Automation:** 48.6% of conversations. |

### 2.5 How the Claude Code team works

**Boris Cherny, Head of Claude Code.** His threads, dated by decoding the X status IDs. Content comes from the [community summary repo](https://github.com/0xquinto/bcherny-claude) (secondary) and from search-result summaries of press coverage.

- **2 Jan 2026, "my setup"** ([x.com/bcherny/status/2007179832300581177](https://x.com/bcherny/status/2007179832300581177))
  - **Parallel sessions:** 5 terminal tabs numbered 1–5, with system notifications when one needs input, plus 5–10 sessions on claude.ai/code. He moves sessions between web and local with teleport, and starts some from his phone.
  - **Model:** Opus 4.5 with thinking for everything, despite being slower.
  - **Planning and CLAUDE.md:** most sessions start in plan mode; the team shares one CLAUDE.md and adds to it whenever Claude makes a mistake.
  - **Commands, hooks and permissions:** `/commit-push-pr` using inline bash; a PostToolUse formatting hook; pre-allowed safe commands instead of skip-permissions.
  - **Subagents:** `code-simplifier` and `verify-app`.
- **31 Jan 2026, "tips from the team"** ([status/2017742741636321619](https://x.com/bcherny/status/2017742741636321619))
  - **Parallelism:** 3–5 worktrees, one tab per task with color-coded names; Ghostty as the terminal; `/statusline` showing context and branch.
  - **Planning:** start complex tasks in plan mode, and re-plan when things go sideways.
  - **CLAUDE.md and skills:** update CLAUDE.md "after every mistake"; commit skills to git; a `/techdebt` sweep at the end of each session.
  - **Prompts:** "Grill me on these changes", "Prove to me this works", "Scrap this, implement the elegant solution".
  - **Bugs:** paste a Slack bug thread and say "fix", or "Go fix the failing CI tests".
  - **Permissions and data:** route permission requests to Opus through a hook; use Claude for analytics via database CLIs.
  - **Learning:** the Explanatory output style.
- **30 Mar 2026, "power features"** ([status/2038454336355999749](https://x.com/bcherny/status/2038454336355999749))
  - **Remote and mobile:** the mobile app, `/teleport`, `/remote-control`.
  - **Automation loops:** `/loop 5m /babysit` and `/schedule`.
  - **Hooks:** SessionStart (load context), PreToolUse (log every bash command), PermissionRequest (route prompts to a messaging app), Stop (nudge Claude to keep going).
  - **Session and parallel commands:** `/branch`, `/btw`, `claude -w`, `/batch`.
  - **Flags:** `--bare` (up to 10× faster SDK startup), `--add-dir`, `--agent`.
- **24 May 2026** ([status/2058519809214607704](https://x.com/bcherny/status/2058519809214607704)) — auto mode is his #1 tip, as the "key building block for multi-clauding".

**The team's practices as shipped artifacts** ([anthropics/claude-code/plugins](https://github.com/anthropics/claude-code); repo HEAD 9 Oct 2026):

- **`commit-commands`:** `/commit-push-pr` pre-computes git state with `!` inline bash and allows only scoped git and gh tools.
- **`code-review`:**
  - a Haiku agent first checks whether the PR needs review at all;
  - two Sonnet agents check CLAUDE.md compliance;
  - two Opus agents hunt for bugs;
  - each finding is re-checked by a validation subagent before it is reported.

  The instruction is "HIGH SIGNAL issues" only.
- **`pr-review-toolkit`:** includes a `code-simplifier` agent.
- **`ralph-wiggum`:** a Stop-hook loop.
- **`security-guidance`:** a PreToolUse hook that checks for 9 risky patterns.
- **`hookify`:** turns observed bad behavior into hooks.

**Other staff who have published workflows:**
- Thariq Shihipar: session hygiene and the Fable field guide.
- Lydia Hallie: effort and cost guidance.
- Delba de Oliveira: verification skills and loops.
- Fiona Fung: running the org.
- Sid Bidasaria: Code w/ Claude workshops "Stop babysitting your agents" and on routines.
- Jarred Sumner and Mike Krieger: migrations.
- Nicholas Carlini: agent teams.
- Prithvi Rajasekaran: harnesses.

Cat Wu (Head of Product) appears only in photo captions in first-party pages I could reach.

**What changed between 2025 and late 2026**

| Dimension | 2025 | Late 2026 |
|---|---|---|
| Reasoning control | Keywords "think" < "think hard" < "ultrathink" | Effort levels low → max; Opus 5.5 defaults to `medium`. Only `ultrathink` remains, as an in-context nudge: "think hard" is "not recognized as keywords" ([model config](https://code.claude.com/docs/en/model-config.md)). |
| Permissions | `/permissions` allowlists; Boris avoided skip-permissions | Auto mode by default; sandboxing; `dontAsk` for headless runs. |
| Parallelism | Multiple checkouts, a few terminals | Worktrees, agent view, `/batch`, dynamic workflows, agent teams, cross-session messaging, routines. |
| Verification | "Ask Claude to verify" | Enforced through `/goal`, Stop hooks, verification skills and Code Review. Remove redundant verification prompts on Opus 5 and Fable ("Skip the verification reminders"). |
| Harness | Context resets for Sonnet 4.5's "context anxiety" | Resets removed as "dead weight"; 1M windows; compaction you can steer. |
| Model choice | Sonnet daily, Opus when needed; Boris used Opus 4.5 for everything | Opus 5.5 by default, Fable 5.1 for the hardest work, Sonnet 5.5 and Haiku 5.5 for scoped work and subagents. |

### 2.6 Claude 5-era models and official coding guidance

| Model | Release | API price ($/MTok in/out) | Default effort | Positioning; headline coding numbers (all Anthropic-reported) |
|---|---|---|---|---|
| Opus 4.6 | 5 Feb 2026 | 5/25 | `high` | Agent teams preview. SWE-bench Verified 81.42% (with a prompt change, averaged over 25 trials). |
| Opus 4.7 | 16 Apr 2026 | 5/25 | `xhigh` in Claude Code | New tokenizer uses 1.0–1.35× more tokens. Follows instructions more precisely. Cursor reports 70% vs 58% on CursorBench. |
| Opus 4.8 | 28 May 2026 | 5/25 | `high` | About 4× less likely to let flaws in its own code "pass unremarked". Dynamic workflows. |
| Fable 5 / Mythos 5 | 9 Jun 2026 | 10/50 | — | "Mythos-class". Suspended **12 Jun – 1 Jul** under a US export-control directive ([access notice](https://www.anthropic.com/news/fable-mythos-access), [redeployment](https://www.anthropic.com/news/redeploying-fable-5)). |
| Sonnet 5 | 30 Jun 2026 | 2/10 | — | Introductory price made permanent on 10 Aug. |
| Opus 5 | 24 Jul 2026 | 5/25 | `high` | "Much stronger at verifying its work". Within 0.5% of Fable 5 on CursorBench 3.2 at half the cost. |
| Fable 5.1 / Mythos 5.1 | 1 Sep 2026 | 10/50 | `high` (Claude Code) | Terminal-Bench 4.0: 55.8%. CursorBench 3.2.0: 73.4%. |
| **Opus 5.5** | 22 Sep 2026 | **4/20** (fast mode 8/40) | `medium` | Performs at Fable 5.1 level "on most work". Terminal-Bench 4.0: 66.4% (xhigh). FrontierCode: 54.4%. CursorBench 4.0: 57.8%. |
| Sonnet 5.5 | 28 Sep 2026 | 2/10 | API `high`; Claude Code `medium` | Terminal-Bench 4.0: 70.6% (vs Sonnet 5's 10.3%). CursorBench 4.0: 55.5%. |
| Haiku 5.5 | 7 Oct 2026 | 0.10/0.50 (≤100k prompts) | `medium` | Positioned to pair "with Opus 5.5 and Sonnet 5.5 as a subagent on coding work". Terminal-Bench 4.0: 39.2%. |

**Common to the current models:** a 1M-token context window, 128k max output, a June 2026 knowledge cutoff, and adaptive thinking (always on for Opus 5.5 and Fable 5.1). The docs say to "start with Claude Opus 5.5 for most workloads" ([models overview](https://platform.claude.com/docs/en/models/overview.md)).

**Safeguards and fallbacks:**
- Flagged high-risk cyber requests fall back to Opus 4.8. Anthropic states this for Opus 5 in Claude Code and for Opus 5.5 on its launch page.
- Finding vulnerabilities in source code is allowed.
- After the July 2026 redeployment, Fable 5's new classifier flags routine coding and debugging requests more often.
- Opus 5.5 rejects `thinking: disabled` and forced `tool_choice`.
- Thinking blocks are tied to the model and the conversation, so switching models mid-session loses the earlier reasoning ([What's new in Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5.md)).

**Official prompting guidance for agentic coding:**
- [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md):
  - for multi-window tasks, use a different first-window prompt, then `tests.json`, `progress.txt` and git as state;
  - `<investigate_before_answering>`;
  - prompts against over-engineering and against hard-coding to pass tests;
  - a reversibility and confirmation list for risky actions;
  - parallel tool calls.
- Opus 5: remove verification and "double-check" instructions, and dampen subagent spawning. Claude Code exposes `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` and `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`.
- Opus 5.5:
  - set `max_tokens` to 128k for agentic coding;
  - treat a text-only end of turn as a progress report, not completion;
  - stop after 2–3 automatic continuations;
  - give multi-agent teams elapsed-time budgets;
  - wrap pasted text in tagged blocks to resist prompt injection.
- Fable 5.1: tell it "You are operating autonomously", restrict tests to what the task needs, prefer targeted edits over rewrites, and let the lead agent keep working while subagents run.

---

## 3. Concrete practices and configs worth copying

**A lean CLAUDE.md** ([docs](https://code.claude.com/docs/en/best-practices)), plus one useful line about compaction:
```markdown
# Code style
- Use ES modules (import/export) syntax, not CommonJS (require)
# Workflow
- Be sure to typecheck when you're done making a series of code changes
- Prefer running single tests, and not the whole test suite, for performance
- When compacting, always preserve the full list of modified files and any test commands
```

**A path-scoped rule** ([steering](https://claude.com/resources/articles/steering-claude-code-skills-hooks-rules-subagents-and-more)):
```markdown
---
paths:
  - "src/api/**"
  - "**/*.handler.ts"
---
All API handlers must validate input with Zod before processing.
```

**A verification skill** ([Delba de Oliveira](https://claude.com/resources/articles/building-verification-loops-in-claude-code-with-skills)). Save it as `.claude/skills/verify-log-hygiene/SKILL.md`:
```markdown
---
name: verify-log-hygiene
description: Check that error logs include the request ID and never include the request body. Use when the diff touches error handling or logging.
allowed-tools: [Read, Edit, Grep]
---
Read the error-handling paths in the current diff. For each log call on an error path, confirm it includes the request ID and does not pass the request body, headers, or any user-supplied payload. Report each violation with file:line, then fix it.
```
To chain it after a cleanup pass: `Run /simplify on the current diff first. When /simplify finishes, invoke /verify-no-public-api-changes.`

**The official `/commit-push-pr` command** (from `plugins/commit-commands` in anthropics/claude-code). The `!` lines run before the prompt reaches Claude. The frontmatter and context lines are verbatim; the numbered task is condensed:
```markdown
---
allowed-tools: Bash(git checkout --branch:*), Bash(git add:*), Bash(git status:*), Bash(git push:*), Bash(git commit:*), Bash(gh pr create:*)
description: Commit, push, and open a PR
---
- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
1. Create a new branch if on main 2. single commit 3. push 4. gh pr create — do all in a single message.
```

**An adversarial review step** ([docs](https://code.claude.com/docs/en/best-practices)):
```text
Use a subagent to review the rate limiter diff against PLAN.md. Check that every requirement is implemented, the listed edge cases have tests, and nothing outside the task's scope changed. Report gaps, not style preferences.
```

**Headless fan-out** ([docs](https://code.claude.com/docs/en/best-practices)). Try it on 2–3 files first, refine the prompt, then run the full list:
```bash
for file in $(cat files.txt); do
  claude -p "Migrate $file from Python 2 to Python 3. Return OK or FAIL." \
    --allowedTools "Edit,Bash(git commit *)" --permission-mode dontAsk
done
```

**Autonomy and loop commands** ([docs](https://code.claude.com/docs/en/best-practices); [loops](https://claude.com/resources/articles/getting-started-with-loops); [auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode)):
```text
claude --permission-mode auto -p "fix all lint errors"
claude auto-mode defaults                     # print the default block/allow rules
/goal get the homepage Lighthouse score to 90 or above, stop after 5 tries.
/loop 5m check my PR, address review comments, and fix failing CI
/schedule every hour: check #project-feedback for bug reports.
claude --worktree feature-auth                # one isolated worktree per session
```
Admins can set `defaultMode` or `disableAutoMode` in managed settings.

**Effort and cost settings** ([model config](https://code.claude.com/docs/en/model-config.md); [Lydia Hallie](https://claude.com/resources/articles/maximizing-the-value-of-your-claude-code-sessions)):
- `/effort medium` or `CLAUDE_CODE_EFFORT_LEVEL` (`max` is not accepted in the `effortLevel` setting); `maxEffortLevel` caps the level.
- `/autocompact 200k` on 1M-token models.
- `ENABLE_PROMPT_CACHING_1H=1` on API keys.
- `MAX_THINKING_TOKENS=0` for routine work (ignored on Opus 5.5, Sonnet 5.5, Haiku 5.5 and Fable).
- `CLAUDE_CODE_SUBAGENT_MODEL`; `model: haiku` in the definition of a noisy subagent.
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` turns agent teams on; start with 3–5 teammates and about 5–6 tasks each.

**Prompt snippets from Anthropic's model docs.** These are verbatim excerpts, shortened where marked with "…":
- **Opus 5 scope control:** "Deliver what was asked, at the scope intended. Make routine judgment calls yourself, and check in only when different readings of the request would lead to materially different work…"
- **Opus 5 subagent damping:** "Delegate to a subagent only for large tasks that are genuinely independent and parallelizable… do not use subagents to verify or double-check your own work."
- **Sonnet 5.5 at low effort:** "When you change code that can be run, built, or type-checked, run a real check that exercises the change before reporting it done…"
- **Fable 5.1 for unattended runs:** "You are operating autonomously. The user is not watching in real time and cannot answer questions mid-task… Stop only for destructive actions or genuine scope changes the user must decide."
- **All models:** `<investigate_before_answering>Never speculate about code you have not opened…</investigate_before_answering>`
- **Reversibility:** "take local, reversible actions like editing files or running tests, but for actions that are hard to reverse, affect shared systems, or could be destructive, ask the user before proceeding… don't bypass safety checks (e.g. --no-verify)."

**State for long-running harnesses** ([harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents); [prompting docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md)):
- Files: `init.sh`, `claude-progress.txt`, and a `features.json` or `tests.json` whose items carry `"passes": false` or a `status`. Prefer JSON over Markdown for these.
- Start every session with: "Call pwd… Review progress.txt, tests.json, and the git logs… Manually run through a fundamental integration test before moving on."
- Parallel teams in the C-compiler style ([Carlini](https://www.anthropic.com/engineering/building-c-compiler)), paraphrased:
  - an infinite loop of `claude --dangerously-skip-permissions -p "$(cat PROMPT.md)" --model …`, logging to a file, in a container;
  - git upstream plus lock files in `current_tasks/`;
  - terse test output;
  - a `--fast` sampling flag.

---

## 4. Disagreements, caveats, failure modes

**How much to tell Claude to verify depends on the model.**
- The 2025 canon and the current Claude Code docs push explicit verification.
- Opus 5's guide says to *remove* verification instructions, and the Fable tips say "Skip the verification reminders".
- Sonnet 5.5 at `low` effort can skip checks, so its guide adds one.
- The rule that survives across models: give Claude a check it can *run* (tests or hooks), but don't nag it to double-check.

**Multi-agent for coding is contested.**
- The research-system post says coding parallelizes poorly, and the multi-agent guide warns of 3–10× token costs.
- Yet the C compiler, the Bun and TypeScript migrations, and Block show large wins.
- The resolution: it works when tasks are independent and a near-perfect judge exists. It fails on monolithic problems (Linux kernel builds before the GCC oracle) and with role-based splits.

**Auto mode safety is measured mostly by Anthropic.** The 17% miss rate on real over-eager actions is called "the honest number". The 13.6% vs 89% study and the 6.3% vs 2.4% harm figures are Anthropic studies, and "Auto mode in production" is customer testimonials published by the vendor. The two approval rates (93% vs 97%) come from different periods.

**Internal metrics have inconsistent baselines.**
- "8×" is stated per quarter vs 2021–2025 in one place and per day vs 2024 in another.
- Lines of code is "almost certainly an overstatement".
- The 80% authorship figure has attribution gaps; leadership puts it at 90%+.
- Self-reported speedups (+50%; about 4× with Mythos Preview) are, by Anthropic's own caution, likely inflated.
- Success rates are judged by a Claude grader.

**Bun port numbers changed between Anthropic posts.**
- 28 May: about 750k lines, 99.8% of tests passing, 11 days, "not yet in production".
- 16 Jul: about 1M lines, 100% passing in CI, shipped in June, about $165k.

**Benchmarks.**
- Vendor-reported and run at different effort levels (Opus 5.5's Terminal-Bench figure is at `xhigh`).
- Sonnet 5's 10.3% on Terminal-Bench 4.0 looks anomalous.
- Infrastructure noise can be ±6 points.
- SWE-bench was screened for memorization (Opus 4.7 footnote) and has disappeared from launch charts.

**Failure modes Anthropic itself documents:**
- self-evaluation bias (Claude was "a poor QA agent" out of the box);
- declaring victory early;
- context anxiety (Sonnet 4.5);
- time blindness;
- reviewers that always find something, which leads to over-engineering;
- over-eager scope (Opus 4.5 and 4.6 over-engineering; Opus 5 widening scope; Sonnet 5.5 at max starting its own review subagents, which caused timeouts in Cognition's runs);
- autocompaction losing what you need next;
- Fable 5.1 rewriting whole files;
- unattended Opus 5.5 ending its turn with a summary instead of continuing.

**Platform risk.**
- The Fable 5 / Mythos 5 suspension (12 Jun – 1 Jul 2026).
- Safety classifiers rerouting requests to older Opus models.
- The March–April 2026 regressions in default settings and harness.
- Keep a fallback model configured (`fallbackModel`), and pin your effort level.

**Human costs.** Skill atrophy, the "paradox of supervision" (supervising Claude needs the very skills that atrophy), and fewer mentoring interactions. The RCT is small (n=52) and only short-term.

**Security.**
- Cloned repos can carry malicious `.claude/settings.json` hooks.
- Allowlisted domains become exfiltration routes.
- VM isolation hides activity from endpoint detection (EDR).
- A user can unknowingly be the injection vector, in which case model-level defenses fail.

---

## 5. Key dates

- **2024-12-19** Building effective agents
- **2025-04-18** Claude Code best-practices post (now redirects to docs)
- **2025-04-28** Economic Index: AI and software development
- **2025-06-13** Multi-agent research system
- **2025-07-24** How Anthropic teams use Claude Code
- **2025-09-11** Writing effective tools for agents
- **2025-09-29** Context engineering; Claude Agent SDK
- **2025-10-16** Agent Skills (open standard 2025-12-18)
- **2025-10-20** Sandboxing
- **2025-11-04** Code execution with MCP
- **2025-11-24** Opus 4.5 and advanced tool use
- **2025-11-26** Long-running harnesses
- **2025-12-02** How AI is transforming work at Anthropic
- **2025-12-03** Bun acquisition; Claude Code passes $1B run-rate
- **2026-01-02** Boris Cherny's setup thread
- **2026-01-09** Demystifying evals
- **2026-01-15** Economic Index: Economic primitives
- **2026-01-23** Multi-agent when/how guide
- **2026-01-29** AI assistance and coding skills RCT
- **2026-01-31** Boris Cherny's team-tips thread
- **2026-02-05** Opus 4.6; C compiler; infrastructure noise
- **2026-02-18** Measuring agent autonomy
- **2026-02-20** Claude Code Security
- **2026-03-09** Code Review
- **2026-03-24** Harness design; Economic Index: Learning curves
- **2026-03-25** Auto mode research preview and engineering post
- **2026-03-30** Boris Cherny's power-features thread
- **2026-04-08** Managed Agents
- **2026-04-15** Session management guide
- **2026-04-16** Opus 4.7
- **2026-04-23** Quality postmortem
- **2026-05-06/07** Code w/ Claude SF (London 19–20 May; Tokyo 5–6 Jun)
- **2026-05-14** Large codebases guide; agent view and `/goal` that same week
- **2026-05-24** Boris Cherny: auto mode is his #1 tip
- **2026-05-25** How we contain Claude
- **2026-05-28** Opus 4.8 and dynamic workflows
- **2026-06-03** Fiona Fung on running the org
- **2026-06-09** Fable 5 / Mythos 5 (suspended 06-12, restored 07-01)
- **2026-06-16** Expertise study
- **2026-06-18** Steering guide
- **2026-06-26** Economic Index: Cadences
- **2026-06-30** Sonnet 5; loops guide
- **2026-07-06** Fable field guide
- **2026-07-07** Model and effort guide
- **2026-07-16** Code migrations
- **2026-07-21** SDLC security
- **2026-07-22** Verification skills
- **2026-07-24** Opus 5
- **2026-08-07** Auto mode becomes default (effective 08-14)
- **2026-08-14** Maximizing value guide
- **2026-08-20** Startup guide
- **2026-09-01** Fable 5.1 / Mythos 5.1
- **2026-09-14** CI strain article
- **2026-09-17** Pace measurements
- **2026-09-18** "When AI builds itself" update
- **2026-09-22** Opus 5.5
- **2026-09-24** Opus 5.5 coding-sessions article
- **2026-09-28** Sonnet 5.5
- **2026-10-07** Haiku 5.5
- **2026-10-08** Block / Fable case study
- **2026-10-09** Unintended model actions post

---

## 6. Sources

Format: title — author/org — date — URL — note — primary or secondary.

- Building effective agents — Schluntz & Zhang/Anthropic — Dec 2024 — https://www.anthropic.com/engineering/building-effective-agents — patterns, ACI — primary
- Best practices for Claude Code — Anthropic docs — live (v2.1.283+) — https://code.claude.com/docs/en/best-practices — successor to the Apr 2025 post — primary
- Common workflows — Anthropic docs — live — https://code.claude.com/docs/en/common-workflows.md — recipes — primary
- Model configuration — Anthropic docs — live — https://code.claude.com/docs/en/model-config.md — aliases, effort, ultrathink — primary
- Agent teams — Anthropic docs — live — https://code.claude.com/docs/en/agent-teams.md — when to use, sizing — primary
- What's new (weekly) — Anthropic docs — Mar–Sep 2026 — https://code.claude.com/docs/en/whats-new/index.md — feature timeline — primary
- How Anthropic teams use Claude Code — Anthropic — Jul 2025 — https://claude.com/blog/how-anthropic-teams-use-claude-code — team use cases — primary
- Multi-agent research system — Hadfield et al./Anthropic — Jun 2025 — https://www.anthropic.com/engineering/multi-agent-research-system — 90.2%, 15× tokens — primary
- Writing tools for agents — Aizawa/Anthropic — Sep 2025 — https://www.anthropic.com/engineering/writing-tools-for-agents — tool design — primary
- Effective context engineering — Rajasekaran et al./Anthropic — Sep 2025 — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents — context rot — primary
- Building agents with the Claude Agent SDK — Shihipar/Anthropic — Sep 2025 — https://claude.com/blog/building-agents-with-the-claude-agent-sdk — agent loop — primary
- Agent Skills — Zhang, Lazuka, Murag/Anthropic — Oct 2025 — https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills — progressive disclosure — primary
- Sandboxing — Dworken & Weller-Davies/Anthropic — Oct 2025 — https://www.anthropic.com/engineering/claude-code-sandboxing — −84% prompts — primary
- Code execution with MCP — Jones & Kelly/Anthropic — Nov 2025 — https://www.anthropic.com/engineering/code-execution-with-mcp — 98.7% token cut — primary
- Advanced tool use — Wu/Anthropic — Nov 2025 — https://www.anthropic.com/engineering/advanced-tool-use — Tool Search — primary
- Effective harnesses — Young/Anthropic — Nov 2025 — https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents — initializer pattern — primary
- Demystifying evals — Grace et al./Anthropic — Jan 2026 — https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents — pass^k — primary
- AI-resistant technical evaluations — Hume/Anthropic — Jan 2026 — https://www.anthropic.com/engineering/AI-resistant-technical-evaluations — take-home overtaken — primary
- Building a C compiler — Carlini/Anthropic — Feb 2026 — https://www.anthropic.com/engineering/building-c-compiler — 16 agents, $20k — primary
- Infrastructure noise — Segato/Anthropic — Feb 2026 — https://www.anthropic.com/engineering/infrastructure-noise — ±6 points — primary
- Harness design — Rajasekaran/Anthropic — Mar 2026 — https://www.anthropic.com/engineering/harness-design-long-running-apps — planner/generator/evaluator — primary
- Auto mode — Hughes/Anthropic — Mar 2026 — https://www.anthropic.com/engineering/claude-code-auto-mode — classifier metrics — primary
- Managed Agents — Martin, Cemaj, Cohen/Anthropic — Apr 2026 — https://www.anthropic.com/engineering/managed-agents — brain vs hands — primary
- April 23 postmortem — Anthropic — Apr 2026 — https://www.anthropic.com/engineering/april-23-postmortem — regressions — primary
- How we contain Claude — McGuinness et al./Anthropic — May 2026 — https://anthropic.com/engineering/how-we-contain-claude — containment-first — primary
- Multi-agent when/how — Phillips/Anthropic — Jan 2026 — https://claude.com/resources/articles/building-multi-agent-systems-when-and-how-to-use-them — 3–10× tokens — primary
- Code Review — Anthropic — Mar 2026 — https://claude.com/resources/articles/code-review — 16%→54% — primary
- Harnessing Claude's intelligence — Martin/Anthropic — Apr 2026 — https://claude.com/resources/articles/harnessing-claudes-intelligence — strip the harness — primary
- Session management and 1M context — Shihipar/Anthropic — Apr 2026 — https://claude.com/resources/articles/using-claude-code-session-management-and-1m-context — rewind vs compact — primary
- Opus 4.7 best practices — Anthropic — Apr 2026 — https://claude.com/resources/articles/best-practices-for-using-claude-opus-4-7-with-claude-code — first-turn specification — primary
- Large codebases — Anthropic Applied AI — May 2026 — https://claude.com/resources/articles/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start — monorepos — primary
- Dynamic workflows — Anthropic — May 2026 — https://claude.com/resources/articles/introducing-dynamic-workflows-in-claude-code — ultracode — primary
- Running an AI-native engineering org — Fung/Anthropic — Jun 2026 — https://claude.com/resources/articles/running-an-ai-native-engineering-org — team process — primary
- Steering Claude Code — Segner/Anthropic — Jun 2026 — https://claude.com/resources/articles/steering-claude-code-skills-hooks-rules-subagents-and-more — which mechanism when — primary
- Getting started with loops — de Oliveira & Segner/Anthropic — Jun 2026 — https://claude.com/resources/articles/getting-started-with-loops — /goal, /loop — primary
- Field guide to Fable — Shihipar/Anthropic — Jul 2026 — https://claude.com/resources/articles/a-field-guide-to-claude-fable-finding-your-unknowns — unknowns — primary
- Model and effort level — Hallie/Anthropic — Jul 2026 — https://claude.com/resources/articles/claude-model-and-effort-level-in-claude-code — selection — primary
- AI code migration — Anthropic — Jul 2026 — https://claude.com/resources/articles/ai-code-migration — Bun, TypeScript ports — primary
- AI-native SDLC security — Clinton/Anthropic — Jul 2026 — https://claude.com/resources/articles/how-anthropic-secures-its-ai-native-software-development-lifecycle — 80%, 8× — primary
- Verification loops with skills — de Oliveira/Anthropic — Jul 2026 — https://claude.com/resources/articles/building-verification-loops-in-claude-code-with-skills — skills — primary
- Auto mode default — Anthropic — Aug 2026 — https://claude.com/resources/articles/auto-mode-default-in-claude-code — 97%, studies — primary (vendor study)
- Auto mode in production — Vorwerck/Anthropic — Aug 2026 — https://claude.com/resources/articles/auto-mode-in-production — 9× longer between interruptions — primary (customer testimonials)
- Maximizing session value — Hallie/Anthropic — Aug 2026 — https://claude.com/resources/articles/maximizing-the-value-of-your-claude-code-sessions — tokens and cache — primary
- Startup guide — Segner/Anthropic — Aug 2026 — https://claude.com/resources/articles/claude-code-guide-for-startups — five rules — primary
- CI test impact — Malhotra/Anthropic — Sep 2026 — https://claude.com/resources/articles/agentic-coding-is-straining-ci-heres-how-we-scaled-test-impact-analysis-at-anthropic — 25× CI — primary
- Opus 5.5 coding sessions — Segner/Anthropic — Sep 2026 — https://claude.com/resources/articles/claude-opus-5-5-built-for-coding-sessions-that-use-more-context — 3.3× longer per prompt — primary
- Block orchestrates Fable — Anthropic Q&A — Oct 2026 — https://claude.com/resources/articles/how-block-orchestrates-claude-fable-across-thousands-of-pull-requests — case study — primary (customer)
- Code w/ Claude SF recap — Anthropic — May 2026 — https://claude.com/blog/code-w-claude-sf-2026-sf — announcements — primary
- How AI is transforming work at Anthropic — Anthropic — Dec 2025 — https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic — survey — primary
- AI assistance and coding skills — Shen & Tamkin/Anthropic — Jan 2026 — https://www.anthropic.com/research/AI-assistance-coding-skills — RCT — primary
- Measuring agent autonomy — McCain et al./Anthropic — Feb 2026 — https://www.anthropic.com/research/measuring-agent-autonomy — autonomy data — primary
- Agentic coding and expertise — Hitzig et al./Anthropic — Jun 2026 — https://www.anthropic.com/research/claude-code-expertise — 400k sessions — primary
- Economic Index reports — Anthropic — Apr 2025, Sep 2025, Jan/Mar/Jun 2026 — https://www.anthropic.com/research/impact-software-development ; https://www.anthropic.com/research/anthropic-economic-index-september-2025-report ; https://www.anthropic.com/research/anthropic-economic-index-january-2026-report ; https://www.anthropic.com/research/economic-index-march-2026-report ; https://www.anthropic.com/research/economic-index-june-2026-report — usage data — primary
- Economic Index dataset — Anthropic — May 2026 snapshot — https://www.anthropic.com/economic-index — via MCP connector — primary
- Estimating productivity gains — Anthropic — Nov 2025 — https://www.anthropic.com/research/estimating-productivity-gains — about 80% task savings — primary
- When AI builds itself — Anthropic Institute — May 2026, updated Sep 2026 — https://www.anthropic.com/institute/recursive-self-improvement — 80% of code — primary
- Measuring pace of AI development — Anthropic Institute — Sep 2026 — https://www.anthropic.com/institute/measuring-pace-of-ai-development — 26% "leads" — primary
- Investigating unintended model actions — Anthropic — Oct 2026 — https://www.anthropic.com/research/investigating-unintended-model-actions — eval misbehavior — primary
- Model announcements — Anthropic — Nov 2025–Oct 2026 — https://www.anthropic.com/news/claude-opus-4-5 ; https://www.anthropic.com/news/claude-opus-4-6 ; https://www.anthropic.com/news/claude-opus-4-7 ; https://www.anthropic.com/news/claude-opus-4-8 ; https://www.anthropic.com/news/claude-fable-5-mythos-5 ; https://www.anthropic.com/news/claude-sonnet-5 ; https://www.anthropic.com/news/claude-opus-5 ; https://www.anthropic.com/claude-fable-and-mythos-5-1 ; https://www.anthropic.com/claude-opus-5-5 ; https://www.anthropic.com/claude-sonnet-5-5 ; https://www.anthropic.com/claude-haiku-5-5 — specs, benchmarks — primary
- Fable access notices — Anthropic — Jun–Jul 2026 — https://www.anthropic.com/news/fable-mythos-access ; https://www.anthropic.com/news/redeploying-fable-5 — export-control suspension — primary
- Claude Code Security — Anthropic — Feb 2026 — https://www.anthropic.com/news/claude-code-security — 500+ OSS vulnerabilities — primary
- Bun acquisition and $1B run-rate — Anthropic — Dec 2025 — https://www.anthropic.com/news/anthropic-acquires-bun-as-claude-code-reaches-usd1b-milestone — milestone — primary
- Models overview, prompting guides, What's new in Opus 5.5 — Anthropic docs — live — https://platform.claude.com/docs/en/models/overview.md ; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md ; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5.md ; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5.md ; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5.md ; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1.md ; https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5.md — prompting — primary
- anthropics/claude-code official plugins — Anthropic — repo HEAD 9 Oct 2026 — https://github.com/anthropics/claude-code — commit-push-pr, code-review — primary
- bcherny-claude — 0xquinto (community) — 2026 — https://github.com/0xquinto/bcherny-claude — summary of Boris Cherny's threads — secondary
- Boris Cherny X threads — Cherny — 2 Jan, 31 Jan, 30 Mar, 24 May 2026 — https://x.com/bcherny/status/2007179832300581177 ; https://x.com/bcherny/status/2017742741636321619 ; https://x.com/bcherny/status/2038454336355999749 ; https://x.com/bcherny/status/2058519809214607704 — not fetched (blocked) — primary, unverified here
- Coverage of Boris Cherny's setup (seen in search results, not fetched) — https://developers.slashdot.org/story/26/01/06/2239243/creator-of-claude-code-reveals-his-workflow ; https://karozieminski.substack.com/p/boris-cherny-claude-code-workflow ; https://hannahstulberg.substack.com/p/claude-code-for-everything-how-the — secondary

---

## 7. Unverified and low-confidence items

- **The original April 2025 best-practices text.**
  - It now redirects, so these recalled items from it were not re-fetched: the "think < think hard < think harder < ultrathink" ladder, "safe YOLO mode" (skip-permissions in a container with no internet), and test-driven development with tests committed first.
  - The current docs confirm that only `ultrathink` survives.
- **Specific quotes from Boris Cherny's 2 Jan thread** (the X post could not be fetched). The parallel-session counts, plan mode, the shared CLAUDE.md and the Opus 4.5 preference are corroborated by several search summaries and the community repo. These details are from memory only:
  - "2–3× the quality" from a verification loop;
  - tagging `@.claude` in PR reviews to update CLAUDE.md through the GitHub Action;
  - Slack MCP, `bq` and Sentry as daily tools;
  - the Claude Chrome extension used to test every change.
- **Boris Cherny's late-2025 claim** that 100% of his Claude Code contributions over 30 days (about 259 PRs) were written by Claude, and his podcast interviews (Lenny's Podcast, Pragmatic Engineer, Latent Space, YC). Not verifiable here because those sites were blocked.
- **Cat Wu's, Alex Albert's and Ado Kukic's specific workflows.** Not found on reachable first-party pages.
- **Details of the "How Anthropic teams use Claude Code" PDF.** Claimed but not checked: about 70% of the Vim-mode feature written autonomously; the "slot machine" approach (commit, let Claude run about 30 minutes, then keep or restart); Claude succeeding on the first try about a third of the time; the security team owning about half of all custom slash commands.
- **Opus 5.5 fast mode at about 285 tokens/second** (an X trending item) and a "Responsive mode" (third-party report). Unverified. Anthropic states "up to 2.5×" speed at $8/$40.
- **The October 2026 claude.dev posts** ("Claude Code in the cloud", "Building effective agent automations", "Automating eval design"). They are listed on the claude.com blog index, but their content could not be fetched (DNS blocked).
- **A search summary claiming a government letter revoked Fable 5.1 / Mythos 5.1.** It appears to conflate the June 2026 Fable 5 / Mythos 5 suspension. The Fable 5.1 page shows no revocation, and the docs still list `fable` as resolving to Fable 5.1.
- **Benchmark tables on model pages** were read through a summarizing fetcher. Treat any figures not quoted verbatim (for example, the FrontierCode attribution on the Sonnet 5.5 page) as approximate.
