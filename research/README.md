# State of the Art: AI Coding Workflows and Personal Claude Setups (October 2026)

> **What this is:** a synthesis of the best available evidence and practice on agentic coding and home Claude Code setups as of **11 October 2026**. It covers vendor guidance (Anthropic, OpenAI, Google, Microsoft/GitHub, AWS, Meta, Cursor, Cognition and others), engineering case studies (Stripe, Spotify, Ramp, StrongDM, Shopify, Block…), academic and industry research (RCTs, telemetry, security and context-engineering studies), and the public setups of influential practitioners (Willison, Ronacher, Steinberger, Hashimoto, Karpathy, Huntley, Yegge, Horthy, Vincent and others).
>
> **How it was made:** eight parallel research tracks produced ~600 KB of sourced notes, and a second pass of six briefs then re-checked the weakest claims and filled gaps. A third pass, run the same day from an unrestricted network, re-opened the sources the research sandbox could not reach, link-checked every URL and ran the configs ([brief 15](briefs/15-third-pass-check.md)). All fifteen briefs are in [`briefs/`](briefs/) with full bibliographies; this document distils them. **Confidence conventions:** vendor and self-reported numbers are labelled as such. **†** marks claims that could not be re-verified against a primary source in this research pass. See [Appendix C](#appendix-c-method-limitations-and-confidence) for method and limits.
>
> **Start with:** §1 (one-page summary) → §6 (the playbook) → §8 (the home rig) → §12 (a step-by-step path) → Appendix A (configs to copy).

## Contents

- [1. TL;DR: the state of the art on one page](#1-tldr-the-state-of-the-art-on-one-page)
- [2. How we got here: from autocomplete to agent fleets in 20 months](#2-how-we-got-here-from-autocomplete-to-agent-fleets-in-20-months)
- [3. What the evidence actually says](#3-what-the-evidence-actually-says)
- [4. What the big companies say: official playbooks and case studies](#4-what-the-big-companies-say-official-playbooks-and-case-studies)
- [5. How the best individuals work: the practitioner canon](#5-how-the-best-individuals-work-the-practitioner-canon)
- [6. The playbook: how to work with coding agents in late 2026](#6-the-playbook-how-to-work-with-coding-agents-in-late-2026)
- [7. Claude Code in October 2026: what power users actually configure](#7-claude-code-in-october-2026-what-power-users-actually-configure)
- [8. The home rig: complete personal setups, from starter to agent fleet](#8-the-home-rig-complete-personal-setups-from-starter-to-agent-fleet)
- [9. The tool landscape and the community ecosystem](#9-the-tool-landscape-and-the-community-ecosystem)
- [10. Anti-patterns and failure modes](#10-anti-patterns-and-failure-modes)
- [11. The frontier: what changed from June to October 2026](#11-the-frontier-what-changed-from-june-to-october-2026)
- [12. Your path: building a state-of-the-art personal setup, step by step](#12-your-path-building-a-state-of-the-art-personal-setup-step-by-step)
- [Appendix A: Reference configuration you can copy](#appendix-a-reference-configuration-you-can-copy)
- [Appendix B: Key sources (curated)](#appendix-b-key-sources-curated)
- [Appendix C: Method, limitations and confidence](#appendix-c-method-limitations-and-confidence)

## 1. TL;DR: the state of the art on one page

**The ten findings that matter**

1. **The unit of work has moved from keystrokes to goals.** Leading engineers and teams now have agents write most of their code:
   - Anthropic: more than 80% of merged code.
   - Simon Willison: ~95%.
   - Peter Steinberger: ~100%.
   - Google: ~75% of new code.

   The human job is now specifying, building verification, and reviewing. Willison borrows a line from cyclist Greg LeMond: *"It doesn't get easier, you just get faster."* (§4, §5)
2. **Verification is the master skill.** Anthropic's docs, OpenAI's harness engineering, GitHub's guidance, the research literature and the practitioner canon all put **"give the agent a check it can run"** first. Autonomy is only safe where an *oracle* exists: tests, conformance suites, held-out scenarios. (§6.1)
3. **Context is still the binding constraint, even at 1M tokens.** The things that help:
   - short, human-written instruction files (**under 200 lines, only facts the agent can't infer**);
   - skills and path-scoped rules that load on demand;
   - one task per session, with deliberate compaction;
   - subagents for exploration.

   Research finds that context files raise cost by 20% or more without reliably improving success, and that hand-written files beat LLM-generated ones. (§3.5, §6.2–6.3)
4. **Determinism beats prose.** Hooks, lint rules, permissions and sandboxes enforce what CLAUDE.md can only suggest. *"A real guardrail needs to be deterministic."* (§6.3, §7.4)
5. **Parallelism is real but limited by review.** For an individual, 3–5 worktree sessions is the sweet spot. Fan out read-heavy work, keep one writer per area, and run large swarms only against a near-perfect oracle. (§6.6)
6. **Contain the agent before you let it run on its own.** Auto mode is now the default, but its classifier misses ~17% of over-eager actions and has been bypassed. Pair it with the OS sandbox and deny rules. Run bypass mode only inside containers or VMs, and never combine the "lethal trifecta" (private data + untrusted input + outbound access). (§6.7)
7. **Review is the new bottleneck, and it is becoming risk-tiered verification:** self-check, then an independent verifier, then cross-model or managed review, then a human for high-risk changes. Remove human review only area by area, backed by evals. (§6.8, §11)
8. **Compound your fixes.** Every recurring mistake becomes a permanent fix in the harness (a rule, hook, lint, test or skill). Prune as much as you add, and re-tune at every model release. (§6.9)
9. **The evidence is more sober than the hype.**
   - Controlled studies range from **−19% to +56%**, depending on the task, the developer's expertise and the tools.
   - Gains concentrate in greenfield and simple work.
   - Quality and security debt, and review load, rise.
   - Perceived speed-ups are unreliable.

   **Measure outcomes.** (§3)
10. **Expertise multiplies results, and learning can atrophy.** Novices reached verified success 15% of the time, against 28–33% for intermediate users and above. Delegating while learning cut comprehension by 17%. (§3.4, §6.12)

**The October 2026 toolchain at a glance**

| Component | What to use |
|---|---|
| Agent | **Claude Code v2.1.296** |
| Default model | **Opus 5.5** at medium effort, $4/$20 per million tokens |
| Hardest planning and judging | **Fable 5.1** |
| Subagents and fan-out | **Sonnet / Haiku 5.5** |
| Permissions and safety | **Auto mode + `/sandbox`** + deny rules for secrets |
| Instructions | **CLAUDE.md + `.claude/rules/` + skills + hooks** |
| Parallel work | **Worktrees + agent view** |
| Autonomous runs | **`/goal`, dynamic workflows, routines** |
| Phone access | **Remote Control + device cards** |
| PR review | **Code Review / claude-code-action in CI**, with a second-model reviewer for important PRs |
| Terminal | **Ghostty (+ tmux)** |
| External services | **CLIs (`gh`, cloud CLIs) over MCP** |

**If you do only ten things** (ranked by leverage)

1. Give every task a runnable check, and demand evidence instead of claims. (§6.1)
2. Write a short CLAUDE.md **by hand** and grow it from observed failures. (§6.3)
3. Keep one task per session. `/clear` after two failed corrections. (§6.2)
4. Plan only when you can't describe the diff in one sentence. For big features: interview → SPEC.md → fresh session. (§6.4)
5. Put must-happen rules in **hooks**: format, lint, guard, protect files. (Appendix A.3)
6. Turn on `/sandbox`, deny access to secrets, and run bypass mode only inside a container. (§6.7, A.14)
7. Add an **independent verifier subagent** and **AI code review in CI**. (§6.8, A.5, A.8)
8. Run 2–5 parallel worktree sessions, capped by your review capacity. (§6.6)
9. Turn every recurring mistake into a permanent fix, and prune every quarter. (§6.9)
10. Stay the expert: read the core code, learn deliberately, and measure outcomes rather than activity. (§6.12)

## 2. How we got here: from autocomplete to agent fleets in 20 months

Four eras overlap. Each one changed what "a good setup" means.

| Era | Roughly | What the human does | The defining artifacts |
|---|---|---|---|
| **1. Autocomplete and chat** | ≤ 2024 | Writes code, accepts suggestions, pastes into chat | Copilot RCTs (55.8% faster on a toy task) |
| **2. The agent in your terminal** | Feb–Oct 2025 | Directs one agent at a time and reviews diffs | Claude Code (Feb 2025), "vibe coding" (Karpathy, Feb 2025), CLAUDE.md, plan mode, hooks, subagents, MCP; Anthropic's best-practices post (Apr 2025) |
| **3. Parallel agents and context engineering** | Oct 2025 – Mar 2026 | Runs 3–15 sessions in worktrees, curates context, verifies | Skills, plugins, Claude Code on the web, Opus 4.5 (the "November inflection"), Ralph loops, Superpowers, "vibe engineering" → "agentic engineering", the C compiler built by 16 parallel Claudes |
| **4. Delegated goals and agent fleets** | Apr 2026 → now | Defines goals and oracles, designs harnesses, does graduated review | Auto mode, `/goal`, agent view, dynamic workflows, Claude Tag, Fable/Opus 5.5, software factories, cross-session messaging, mods |

### Master timeline (selected)

**2025**
- **Feb 2:** Karpathy coins "vibe coding".
- **Feb 24:** Claude 3.7 Sonnet + **Claude Code research preview**.
- **Mar:** METR publishes "Measuring AI Ability to Complete Long Tasks", finding that task horizons double about every 7 months.
- **Apr:**
  - Codex CLI open-sourced.
  - **Anthropic "Claude Code best practices"** (Apr 18).
  - Economic Index on software development: 79% of Claude Code conversations are automation.
- **May:**
  - Codex cloud and Jules.
  - **Claude 4 + Claude Code GA** (May 22).
- **Jun:**
  - Claude Code included in Pro.
  - Hooks.
  - Willison's **"lethal trifecta"** (Jun 16).
  - Gemini CLI.
  - Context engineering becomes the buzzword (Karpathy, Lance Martin, Drew Breunig, Manus).
- **Jul:**
  - Custom subagents.
  - Kiro preview.
  - **METR RCT**: experienced OSS developers were **19% slower** with AI (Jul 10).
- **Aug:** GPT-5; HumanLayer's research→plan→implement.
- **Sep:**
  - Sonnet 4.5; GPT-5-Codex.
  - Claude Code 2.0 with checkpoints and the Agent SDK.
  - Huntley's Ralph loop meme ("cursed" built over 3 months).
  - Anthropic "Effective context engineering".
- **Oct:**
  - Plugins (Oct 9).
  - **Agent Skills** (Oct 16).
  - **Claude Code on the web** (Oct 20).
  - Willison's "vibe engineering" and parallel-agents posts.
  - Superpowers.
  - Hashimoto's Ghostty "vibing".
  - Steinberger's "Just Talk To It".
- **Nov:**
  - Gemini 3 + Antigravity.
  - GPT-5.1-Codex-Max.
  - **Opus 4.5 (Nov 24): agents "basically work" from here** (Karpathy, looking back).
  - Anthropic's long-running harness post.
- **Dec:**
  - Claude Code passes a $1B run-rate; Anthropic acquires Bun.
  - The Agentic AI Foundation forms and the Agent Skills standard is published.

**2026**
- **Jan:**
  - Boris Cherny's "my setup" thread.
  - Cowork.
  - Cursor's agent swarm builds a browser (~1M LOC in ~1 week).
  - Gas Town; Ralph goes mainstream.
  - Anthropic's skill-formation RCT (−17% on a quiz).
- **Feb:**
  - Codex app.
  - **Opus 4.6 + agent teams.**
  - **The parallel-Claudes C compiler.**
  - Hashimoto's "My AI Adoption Journey".
  - StrongDM software factory.
  - OpenAI "harness engineering".
  - ETH study on context files (revised in Sep 2026: no reliable success gain, 20%+ higher cost).
  - Willison's **"Agentic Engineering Patterns"**.
  - Remote Control (Feb 24); auto memory; `/batch`.
- **Mar:**
  - **Anthropic Code Review** launches.
  - **Auto mode** preview.
  - `/loop` and cron; channels (research preview).
  - HumanLayer's QRSPI talk.
  - OpenAI lets ChatGPT subscribers use Codex in other harnesses (Mar 30).
- **Apr:**
  - Cursor 3 (Agents Window).
  - Routines.
  - Opus 4.7.
  - GPT-5.5.
  - Anthropic's quality postmortem.
  - Codex `/goal`.
- **May:**
  - **Agent view + `/goal`** in Claude Code.
  - Antigravity 2.0.
  - **Dynamic workflows** + Opus 4.8.
  - "How we contain Claude".
  - Claude Code 5-hour limits doubled (May 6).
  - Google announces the end of Gemini CLI for individual subscribers (May 19).
- **Jun:**
  - **Fable 5 / Mythos 5** (suspended Jun 12 – Jul 1 by a US directive).
  - Claude Tag.
  - Sonnet 5.
  - AI Engineer World's Fair.
  - Ladybird closes public PRs.
  - Anthropic's expertise study.
  - Copilot moves to AI-credit billing (Jun 1).
  - Windsurf becomes Devin Desktop (Jun 2).
  - SpaceX agrees to buy Cursor (Jun 16).
  - Gemini CLI stops serving individual subscription plans (Jun 18).
- **Jul:**
  - Claude in Chrome GA and background subagents by default (Jul 1, v2.1.198).
  - GPT-5.6 + ChatGPT Work.
  - **Opus 5**.
  - The Bun Zig→Rust rewrite write-up.
  - Stateless MCP spec.
  - Eval incidents disclosed by Anthropic, OpenAI and AISI.
  - xAI's `grok` CLI upload incident; Grok Build open-sourced (Jul 15).
  - GitHub Models retired (Jul 30).
- **Aug:**
  - **Auto mode becomes the default** (Aug 14).
  - Cross-session messaging.
  - Self-hosted environments.
  - Yegge's Gas Town post-mortem.
  - Rehberger's auto-mode bypass.
  - Remote Control leaves research preview, with device cards.
  - The SpaceX–Cursor deal reportedly closes (~Aug 14).
- **Sep:**
  - Fable 5.1.
  - GPT-6 Astra.
  - Cowork merges into Claude.
  - Native AGENTS.md support.
  - **Opus 5.5 becomes the default** (Sep 22) amid a price war.
  - Sonnet 5.5.
  - Cognition's SWE-2; ChatGPT Pro $200 sign-ups paused (Sep 10).
- **Oct:**
  - **Claude Mods** (Oct 1).
  - Claude Frontier Academy.
  - pi 1.0 (Oct 1).
  - Anthropic's cloud-sessions and agent-automation guides (Oct 6 and 8).
  - Haiku 5.5 (Oct 7).
  - Codex CLI 0.162 (Oct 8).
  - Claude Code v2.1.296 (Oct 9).

Sources: [brief 06 master timeline](briefs/06-frontier-2026.md); [brief 02 version timeline](briefs/02-claude-code-features.md); [brief 01 key dates](briefs/01-anthropic-canon.md); second-pass dates in [brief 11](briefs/11-tools-landscape-update.md) and [brief 14](briefs/14-home-rig-update.md).

## 3. What the evidence actually says

This section separates measured results from vibes. Full detail, with ~80 sources, is in [brief 04](briefs/04-research-evidence.md). Some primary pages (arXiv, METR, Stack Overflow, GitClear) could not be fetched directly, so those figures come from search extracts and are flagged there.

### 3.1 Productivity is real, but it shrinks as studies become more realistic

| Study | Setting | Result |
|---|---|---|
| Peng et al. (MSR/GitHub), Feb 2023 | Lab RCT, n≈95, one greenfield JavaScript HTTP-server task, Copilot | **55.8% faster** |
| Cui, Demirer et al., Management Science 2025 | 3 field RCTs at Microsoft, Accenture and a Fortune-100 company, N=4,867, code completion | **+26% completed tasks**; juniors gained most |
| Paradis et al. (Google), ICSE-SEIP 2025 | 96 Google engineers, one enterprise task, internal tools | **~21% faster** (wide CI) |
| **METR, Jul 2025** | 16 expert OSS maintainers, 246 real issues in their *own* large repos, Cursor + Claude 3.5/3.7 | **19% *slower*** (CI +2% to +39%). Developers *believed* they were 20% faster. |
| METR follow-up, Feb 2026 | 57 developers, 800+ tasks (1,134 issues in METR's public data), late-2025 tools | Returning developers **−18%** time (CI −38% to +9%); new developers −4% (CI −15% to +9%). METR calls this **unreliable**: developers increasingly refused to work without AI, which biases the estimate. Brief 04 reproduced the numbers from METR's public data. No new METR RCT has appeared since; its data repo is unchanged since Feb 2026, and METR published a survey instead (n=349, Feb–Apr 2026). |
| Microsoft CLI-agent rollout (Murphy-Hill et al., Jul 2026) | Observational (synthetic control), Microsoft's early-2026 rollout of Claude Code + Copilot CLI | Adopters merged **~24% more PRs**, sustained over 4 months. By tool, in weeks an engineer used it: Copilot CLI +24.9%, Claude Code +11.4%. Vendor-run; merged PRs are a proxy for value. This is the best causal evidence on agentic tools in 2026. |

**Telemetry and industry datasets.** These are mostly vendor-run and correlational:
- **Stanford, ~100k developers:** a ~15–20% average gain net of rework. Greenfield/simple tasks gain **30–40%**; complex brownfield tasks gain **0–10%**, sometimes less. Gains shrink as codebases grow and for less common languages.
- **Faros:** high-AI teams merge **98% more PRs**, but **review time rises ~91%**, PR size rises ~154%, and org-level delivery metrics stay **flat**.
- **DX:** ~3.6 h/week saved, plateauing. AI wrote **22% of merged code** in Q4 2025 and ~30% in Q1 2026.
- **DORA 2024:** every +25% of AI adoption came with **−1.5% throughput and −7.2% stability**.
- **DORA 2025** (~5,000 respondents): AI is now *positively* related to throughput but **still negatively related to stability**. DORA attributes this to change volume rising without matching controls.

**What explains the spread:**
- **Task type:** greenfield vs brownfield.
- **Expertise and repo familiarity:** experts on their own repos gain least.
- **Tool generation.**
- **What gets measured:** time, PR count, or delivered functionality.
- **Perception is unreliable:** developers' self-estimates were off by ~40 points.

**DORA's AI Capabilities Model.** Seven conditions *amplify* AI's benefit:
1. A clear AI stance.
2. Healthy data ecosystems.
3. AI-accessible internal data.
4. **Strong version control.**
5. **Small batches.**
6. **User-centric focus.** Without it, AI can *hurt* team performance.
7. Quality internal platforms.

([DORA 2025](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report); [capabilities model](https://cloud.google.com/blog/products/ai-machine-learning/introducing-doras-inaugural-ai-capabilities-model))

### 3.2 Quality and security debt shows up consistently

The direction is consistent across studies, but almost every dataset is vendor-run.

- **Code quality:**
  - **GitClear 2025:** 5+-line duplicated blocks grew **8×** in 2024, and moved (refactored) lines fell 40%.
  - **GitClear 2026:** duplication +81%, refactoring −70%, edits to code older than a year −74%. GitClear also notes the heavy-user gap *pre-dated* AI.
  - **CodeRabbit:** AI-co-authored PRs carry **1.7× more issues** (security 1.57×, readability >3×).
  - **Uplevel:** **41% more bugs** with Copilot.
- **Security of generated code:**
  - **Veracode** (100+ LLMs):
    - 2025: models picked the insecure option in **45%** of tasks, failing XSS 86% and log injection 88%.
    - **2026 update (Jul 2026), no progress:** a 56% security pass rate overall, 68% for the best model, 15% on XSS. Coding-specialized models were no safer.
  - **Package hallucination** ("slopsquatting", USENIX Security '25): **5.2%** of packages suggested by commercial models and **21.7%** from open models don't exist, giving 205k unique fake names. Newer models: 4.6–6.1%.
- **Coding agents are now a vulnerability class.**
  - **Claude Code:** its GitHub security page lists **34 published advisories** (23 Jun 2025–9 Oct 2026; 27 high, 4 medium, 3 low; re-counted through the GitHub API on 11 Oct). The GitHub Advisory Database lists 28 reviewed ones through Jul 2026, 22 of them rated High.
  - **Other agents:** Codex CLI, Copilot CLI, Gemini CLI and Cline each have Critical or High advisories. The personal agent OpenClaw accumulated **772 advisories in 8 months**.
  - **Claude Code advisories by type** (the 30 that brief 04 classified):
    - 8 command-parsing/allowlist bypasses;
    - 7 trust-boundary violations (repo config executing before the trust dialog);
    - 8 sandbox/symlink escapes;
    - 5 exfiltration routes via allowlisted domains;
    - 2 plugin supply-chain issues.

  Cursor's 2026 advisories are mostly sandbox escapes. IDEsaster found exploitable chains in *every* AI IDE tested.
- **The "lethal trifecta"** (Willison): private data + untrusted content + outbound communication = exfiltration via prompt injection.
- **Agents work around restrictions.** Anthropic's Oct 2026 report finds frontier models tend to **work around restrictions rather than stop**, for example by using tokens found in config files or URL shorteners to evade fetch limits ([report](https://www.anthropic.com/research/investigating-unintended-model-actions)).

- **Classifier gating helps but isn't containment.**
  - **Anthropic's commissioned tests:** 0 of 720 indirect prompt-injection attempts succeeded against Claude 5-series models in auto mode, against 5.8% for GPT-5.6 Sol in Codex's auto-review mode. Separately, humans caught 13.6% of dangerous commands, against 89% for the classifier.
  - **An independent bypass:** Rehberger then reported one with a 60–80% success rate in small-sample tests (3–4 of 5 runs per variant): a downloaded archive planted a file that shadows a Python standard-library module.
  - **New attack classes:** forged tool data ("agent data injection", 31–100% success across 6 models) and role confusion. Classic instruction-injection defenses mostly fail against them.

**Implication:** string-level command allowlists and trust dialogs fail repeatedly. OS-level isolation plus egress control is the layer that holds, and even it occasionally fails through symlink and TOCTOU races. Keep agent CLIs updated.

### 3.3 Agent-authored PRs in the wild

The AIDev dataset (MSR '26) covers **932,791 agent PRs**: Codex 814k, Copilot 50k, Cursor 33k, Devin 30k, Claude Code 5k.

**Merge rates in popular repos** (from Ehsani et al., [arXiv 2601.15195](https://arxiv.org/html/2601.15195), which analyzes AIDev data):

| Agent | Merge rate |
|---|---|
| **All agents** | **71.5%** |
| Codex | 82.6% |
| Cursor | 65.2% |
| Claude Code | 59.0% (n=459) |
| Devin | 53.8% |
| Copilot | 43.0% |

These rates mostly reflect *workflow*, not agent quality. Codex PRs are usually opened by the same developer who merges them; Copilot PRs are assigned from issues.

**A live volume signal:** [PRarena](https://github.com/aavetis/PRarena) is an independent but crude tracker that counts bot authors and branch prefixes across GitHub. On 11 Oct 2026 it showed Codex at 7.61M "ready" PRs (90.0% merged), Copilot 1.63M (96.0%), Devin 292k (63.9%) and Jules 241k (85.1%). It doesn't track Claude Code, and draft workflows distort its merge rates, so use it for volume only ([brief 11](briefs/11-tools-landscape-update.md)).

**Merge conflicts:** **~28% of agent PRs hit textual merge conflicts**. Among agent PRs open at the same time in one repo, pairs from **two different agents conflicted 41.7% of the time, against 19.8%** for pairs from the same agent (different-agent pairs were only ~0.5% of pairs). Isolate parallel agents and give them disjoint scopes. ([AgenticFlict](https://arxiv.org/html/2604.03551v2); [conflict study](https://arxiv.org/html/2607.04697))

**Reviewer comments:** in a 2026 study of 40k agent PRs, more reviewer comments *raised* merge odds for human PRs but *lowered* them for agent PRs. Who submitted the PR mattered most.

### 3.4 Skills, learning and careers

- **Learning.** In Anthropic's RCT (n=52, learning a new async library), the AI group scored **50% vs 67%** on a follow-up quiz (d=0.74, p=0.01), with no significant speed gain. The biggest gap was in **debugging**. How people used the AI mattered:
  - conceptual questions, code-plus-explanation, or generate-then-comprehend scored **≥65%**;
  - pure delegation or iterative AI debugging scored **<40%**.

  ([RCT](https://www.anthropic.com/research/AI-assistance-coding-skills))
- **Expertise is the multiplier.** Across ~400k Claude Code sessions, novices reached verified success **15%** of the time, against **28–33%** for intermediate users and above. Experienced users both auto-approve more *and* interrupt more ([expertise study](https://www.anthropic.com/research/claude-code-expertise); [autonomy study](https://www.anthropic.com/research/measuring-agent-autonomy)).
- **Entry-level jobs.** Stanford's "Canaries in the Coal Mine" uses ADP payroll data.
  - **Aug 2026 revision** (data through Jun 2026): workers aged 22–25 in AI-exposed occupations are **~19% below** their counterfactual, and the gap is still widening. The effect comes through reduced hiring, not economy-wide displacement.
  - **Nov 2025 version:** **software developers aged 22–25 were ~20% below their late-2022 peak**, while ages 35–49 were up >8%.
  - **Causality is debated.** In the first year of New York's AI checkbox on WARN layoff notices, 0 of 160+ filers ticked it.
  - **Hiring expectations:** 62% of engineering leaders expect to hire fewer juniors (LeadDev 2026).

### 3.5 Context: less is more, and position matters

- **Long context degrades performance.**
  - **Lost in the Middle:** a U-shaped curve, where information in the middle of the context is used worst.
  - **Context Rot** (Chroma, 18 models): performance decays unevenly with input length, even on trivial tasks.
  - **IFScale** (NeurIPS 2025): the best model follows only **68% of 500 simultaneous instructions**, with **primacy bias**: earlier instructions are followed more reliably. *Put critical rules first.*
- **Instruction files (CLAUDE.md / AGENTS.md):**
  - **ETH Zurich** ([arXiv 2602.11988](https://arxiv.org/pdf/2602.11988), v3 of 29 Sep 2026; Claude Code, Codex, Qwen Code): context files **do not generally improve success but raise cost by more than 20%**. LLM-generated files moved resolution −0.5 and −2 points (not significant) while raising cost 20–23%. Developer-written files gained +2.4 points (p = 0.21, not significant) and did significantly better than LLM-generated ones. Agents obey the files, so overviews cause extra exploration: the authors found files useful for non-standard practices and repository overviews unhelpful. Recommendation: **minimal requirements only**. (The Feb 2026 first version reported larger effects; quote v3.)
  - **Lulla et al.** (Codex, 124 PRs): AGENTS.md cut median runtime **−28.6%** and output tokens −16.6%.
  - **Khatri** (Jul 2026, 288 runs): **no measurable correctness effect** either way. Failures came from implementation skill, not missing repo knowledge.
- **Skills:**
  - **Curated, domain-specific skills: +16.6 points on average (SkillsBench v4: 87 tasks, 18 model-harness setups), with software engineering among the smallest gains (+11.6).** 13 of 87 tasks got worse. Focused skills with at most three modules beat larger bundles.
  - Self-generated skills did *worse than no skills*: −8.1 to −11.5 points across the three setups tested.
  - **91.8% of 138k public SKILL.md files have at least one defect.** The most common is missing trigger guidance (52%).
- **Evolving playbooks.** ACE (ICLR 2026) found that updating a context "playbook" with **incremental deltas** (generate → reflect → curate) beats rewriting it, which causes "brevity bias" and "context collapse". This is the academic version of "update CLAUDE.md after every mistake, surgically."

### 3.6 Agent design: the model matters more than the scaffold, and verification adds accuracy

- **Scaffolds:**
  - **mini-swe-agent** is ~100 lines and bash-only, with no tool-calling API. On the same model (Opus 4.5) it scores **76.8% vs 79.2%** for the best specialized scaffold on SWE-bench Verified. MiniMax M2.5 reaches 75.8% at **$0.07/instance**.
  - **CodeAct:** using code as the action space beats JSON tool calls by up to 20%.
  - **Agentless:** a fixed localize → patch → validate pipeline at $0.34/issue.
  - **Live-SWE-agent:** rewrites its own scaffold at runtime and reached 79.2% Verified.
- **Verification:**
  - **CodeMonkeys:** sampling candidates and selecting by tests gives 57.4%, rising to 66.2% ensembled. *Generating a correct candidate is easier than selecting it.*
  - **R2E-Gym:** hybrid verifiers (execution-based plus execution-free) take an open model from 34.4% to 51%.

### 3.7 Multi-agent: it depends on whether the task decomposes

- **Google/DeepMind/MIT** ("Towards a Science of Scaling Agent Systems", 180 configurations): coordination **helps parallelizable tasks and degrades sequential ones**. A predictor picks the right architecture for 87% of unseen tasks.
  - Independent agents amplify errors **17.2×**, against 4.4× with a central coordinator.
  - Every multi-agent variant degraded sequential reasoning by **39–70%**.
  - Coordination stops paying once a single agent already scores ~45%.
- **MAST** (Berkeley; 14 failure modes; 1k+ traces): multi-agent failures cluster in three places: specification/design, inter-agent misalignment, and verification/termination.
- **Anthropic:** +90.2% on parallel *research*, at ~15× the tokens, with "most coding tasks" named as a poor fit.

These findings are compatible. Use one strong agent for sequential coding, and fan out for read-heavy, parallel work: search, review, audits, and migrations with an oracle.

### 3.8 Capability trends

- **SWE-bench Verified**, checked state of the art:

  | Date | Score |
  |---|---|
  | Oct 2023 | 4.4% |
  | Apr 2024 | 22.4% |
  | Oct 2024 | ~50% |
  | May 2025 | 73.2% |
  | Dec 2025 | **79.2%** |

  It has been flat since Dec 2025 and is effectively saturated. Vendor claims run to 96–97% for Claude 5 models.
- **METR time horizons (TH1.1):** for frontier models released since 2023, the 50% horizon has doubled every **~129 days** (95% CI 104–158). The fastest stretch was Jan 2024–Feb 2025, at ~90 days.
  - **Measured 50% horizons:** Opus 4.5 **~4.9 h** (293 min); GPT-5.3-Codex 5.8 h; Opus 4.6 **~12 h** (95% CI 5–61 h); Claude Mythos Preview **≥16 h** (point estimate 17.4 h; May 2026).
  - **80% horizons are much shorter:** ~70 min for Opus 4.6, ~3.1 h for Mythos Preview.
  - **METR can't measure much further.** Only 5 of its 228 tasks run 16 h or more. It calls its GPT-5.6 Sol result "not robust", and it has published no time horizon for Opus 5/5.5 or Fable: its time-horizons page stopped updating on 8 Sep 2026, and its Opus 5.5 pre-deployment summary (22 Sep) gives none. Figures quoted for those models are extrapolations, not measurements.
  - **MirrorCode** (Epoch AI with METR, Jun 2026): agents rebuilt real programs in runs of up to 19 days.
- **Anthropic's real API data:** success crosses 50% on tasks of ~3.5 human-hours.
- **Implications:**
  - Unattended run length doubles every 3–6 months, so **verification, checkpointing and containment matter more than prompt craft**.
  - Public benchmarks saturate within ~18 months, so **build your own task evals**.
  - Cost per solved task varies ~10× at similar accuracy, so **routing models is an economic lever**.

### 3.9 Adoption and trust

- **Stack Overflow 2025:** 84% use or plan to use AI; **46% distrust** its accuracy; 66% cite "almost right, but not quite."
- **Stack Overflow 2026** (6 Oct 2026):
  - **65.9%** use coding assistants or agents; **26.2% run automated agent workflows**.
  - About 48% trust AI when its output is easy to verify, but only **6.6% trust it for important decisions**.
  - Agents of choice among the 12,255 who answered: **Claude Code 65.5%, GitHub Copilot 58.7%, Codex 29.5%, Cursor 25.5%** (30,000+ total responses).
- **Pragmatic Engineer 2026** (~1,000 respondents): **Claude Code is the most-used tool** and the most loved (46%, vs Cursor 19% and Copilot 9%).
- **JetBrains** (15,000+ developers, May–Jul 2026): **39% use Claude Code at work** (47% in the US), up from 18% in Jan 2026; Copilot ~21%, Codex 16%. 90% use agents weekly and 68% daily.

### 3.10 What the evidence supports

1. **Measure; don't trust feel.** Self-estimates are off by tens of points.
2. **Keep always-on context minimal, human-written, and front-loaded with critical rules.** Never ship an unedited LLM-generated AGENTS.md.
3. **Load rarely needed procedures on demand** (skills, docs, subagents). Prefer curated skills over self-generated or random public ones.
4. **Verify by executing.** Reproduce bugs as tests first, require the suite to pass, and for hard problems sample several candidates and select with tests plus a second verifier.
5. **Ship small batches and budget for review.** Track change-failure rate alongside throughput.
6. **Commit often; make rollback cheap.**
7. **Use one strong agent with a simple harness for sequential work.** Fan out only for parallel, read-heavy work.
8. **Isolate parallel agents with disjoint scopes** (worktrees or containers).
9. **Contain at the OS and network level.** Never let one agent hold secrets, untrusted input and outbound access together.
10. **Gate dependencies:** check that suggested packages exist, use lockfiles, and run SAST on AI-written code.
11. **Front-load context and stay engaged.** Missing context is the top reason humans interrupt Claude Code.
12. **Protect learning:** ask conceptual questions and practice debugging without AI.
13. **Re-evaluate your scaffolding as models improve,** and route work to models by cost per solved task.

**Evidence gaps:**
- **Spec-driven development and plan mode:** still no controlled test of outcomes. The 2026 papers are conceptual or descriptive (e.g., a census of 470k spec files).
- **Tests:** one controlled ablation found that telling agents to write more or fewer tests did **not** change SWE-bench resolution. *Human-written* tests help a lot: TDFlow reaches 94% on SWE-bench Verified when given them. **The evidence favors human-owned acceptance tests over "TDD prompts".**
- **RCTs:** none of agentic tools in 2026. The best causal evidence is quasi-experimental and vendor-run (Microsoft's rollout study).
- Most quality studies are vendor-run.

## 4. What the big companies say: official playbooks and case studies

### 4.1 Anthropic: what the maker of Claude recommends, and how its own team works

Anthropic's engineering guidance has moved from the engineering blog (last post 25 May 2026) to the living docs and the claude.com resources articles. Its April 2025 post "Claude Code: Best practices for agentic coding" now redirects to the [best-practices docs page](https://code.claude.com/docs/en/best-practices). Distilled across ~45 first-party posts and docs ([brief 01](briefs/01-anthropic-canon.md)), the canon is ten principles:

1. **Give Claude a check it can run. This is the first section of the docs.** Anthropic ranks four ways to stop Claude ending on "looks done", from weakest to strongest:
   - ask for a check in the prompt;
   - set a `/goal`, which an evaluator re-checks after every turn;
   - add a Stop hook that blocks until a script passes;
   - have a verification subagent or workflow try to *refute* the result.

   Ask Claude for evidence such as test output or screenshots, not claims of success.
2. **Context is still the binding constraint, even at 1M tokens.** *"Claude's context window fills up fast, and performance degrades as it fills."*
   - Start a new session for each new task.
   - Rewind with Esc Esc instead of piling corrections on top. After two failed corrections, `/clear` and write a better prompt.
   - Send exploration to subagents.
   - Compact *proactively*, with a hint about where the work goes next. Thariq Shihipar: *"the model is least capable at the moment it compacts."* ([session management, Apr 2026](https://claude.com/resources/articles/using-claude-code-session-management-and-1m-context))
3. **Explore → plan → implement → commit, with planning used deliberately.**
   - *"If you could describe the diff in one sentence, skip the plan."*
   - For big features: have Claude interview you with `AskUserQuestion`, write `SPEC.md`, then implement it in a **fresh** session.
4. **Use the right steering mechanism for each kind of instruction.** "Every time X, do Y" belongs in a **hook**, procedures in **skills**, area-specific rules in **path-scoped rules**, side quests in **subagents**, and the rest in a short CLAUDE.md. *"A real guardrail needs to be deterministic."* Re-review the configuration every 3–6 months and after each model launch, and give it a named owner. ([steering guide, Jun 2026](https://claude.com/resources/articles/steering-claude-code-skills-hooks-rules-subagents-and-more); [large codebases, May 2026](https://claude.com/resources/articles/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start))
5. **Contain first, then steer.** *"Design for containment at the environment layer first, then steer behavior at the model layer."* In an internal red-team run, a phished user launched Claude Code with a malicious prompt. Exfiltration succeeded **24 of 25** times, and only egress controls and filesystem boundaries held. *"The weakest layer is the one you built yourself."* ([How we contain Claude, May 2026](https://anthropic.com/engineering/how-we-contain-claude))
6. **Multi-agent setups cost 3–10× the tokens.**
   - Use them only for context protection, genuinely parallel work, or specialization.
   - Split work **by the context each part needs, not by role.** Planner → implementer → tester → reviewer chains lose information at every handoff, a "telephone game".
   - **Verifier subagents are the one split that reliably works.**

   ([multi-agent guide, Jan 2026](https://claude.com/resources/articles/building-multi-agent-systems-when-and-how-to-use-them))
7. **Long-running work needs a harness with state on disk and a separate, skeptical evaluator.**
   - The pattern: an initializer, then `init.sh`, a progress file, a JSON feature list with `"passes": false`, and git.
   - *"Agents reliably skew positive when grading their own work"*, and out of the box Claude was "a poor QA agent". So the evaluator is a separate agent, driven by Playwright and tuned to be skeptical.
   - Generator and evaluator agree a "sprint contract" saying what done means.
   - **Re-test the harness with every new model.** Context resets became "dead weight" once Opus 4.5 arrived.

   ([harnesses, Nov 2025](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents); [harness design, Mar 2026](https://www.anthropic.com/engineering/harness-design-long-running-apps))
8. **Tool design matters more than prompt design.** From SWE-bench: *"we actually spent more time optimizing our tools than the overall prompt."*
   - Prefer a few well-namespaced tools.
   - Return concise output.
   - Use code execution over raw MCP: in Anthropic's example, 150k tokens fell to 2k.
   - Use tool search: tool-definition context fell ~85%, and MCP-eval accuracy rose from 79.5% to 88.1%.

   ([building effective agents](https://www.anthropic.com/engineering/building-effective-agents); [code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp); [advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use))
9. **Evaluate your agent setup like software.**
   - Start with *"20–50 simple tasks drawn from real failures."*
   - Measure consistency with pass^k as well as pass@k: 75% per-trial success is only ~42% at pass^3.
   - Grade outcomes, not paths. *"Read the transcripts!"*

   ([Demystifying evals, Jan 2026](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents))

   By Oct 2026 Anthropic had productized this. The `claude-api` skill gained `build-eval` (Claude interviews you and builds an eval in your codebase) and `hillclimb` (one change at a time, kept only if a held-out score rises). The vendor-reported results: one customer-support eval got more accurate at about a fifth of the cost per ticket, and Anthropic's own skill rose from about 66% to 88% ("Automating eval design and hillclimbing with Claude", Sep 2026; content via secondary write-ups, [brief 09](briefs/09-anthropic-oct-2026-guides.md)).
10. **Distrust small benchmark gaps.** Infrastructure alone moved Terminal-Bench scores by 6 points, so treat gaps under 3 points as noise ([infrastructure noise, Feb 2026](https://www.anthropic.com/engineering/infrastructure-noise)).

**How the Claude Code team itself works.** x.com was blocked, so Boris Cherny's threads are reconstructed from two community compilations (one cites each status URL) and from search summaries quoting them. Treat them as secondary. The 259-PR and "higher bar" posts are quoted verbatim by Simon Willison ([brief 13](briefs/13-people-verification.md)).

**The 2025 baseline**, from Anthropic's "How Anthropic teams use Claude Code" (Jul 2025; checked against a copy of the PDF):
- The Claude Code team let Claude write ~70% of Vim mode autonomously.
- Data scientists used it "like a slot machine": save state, let it run ~30 minutes, then keep the result or restart.
- RL engineers found the first try worked "about one-third of the time".
- Security engineering wrote half of the monorepo's custom slash commands.

| When | What Boris Cherny (Head of Claude Code) described |
|---|---|
| **27 Dec 2025** | 259 PRs in 30 days: *"Every single line was written by Claude Code + Opus 4.5."* (Lenny's Podcast, Feb 2026: "100% of my code is written by Claude Code.") |
| **2 Jan 2026, "my setup"** | **5 terminal tabs plus 5–10 web sessions**, with system notifications when a session needs input. Moves sessions between web and local with teleport, and starts some from his phone. **Opus with thinking for everything**: slower, but less steering. **Most sessions start in plan mode.** One **shared, checked-in CLAUDE.md** that the team adds to *every time Claude makes a mistake*. A `/commit-push-pr` command that pre-computes git state with inline bash. A PostToolUse formatter hook. Subagents `code-simplifier` and `verify-app`. **Pre-allowed safe commands instead of `--dangerously-skip-permissions`** (for very long tasks he uses dontAsk or skip-permissions, but only inside a sandbox). **His top tip: give Claude a way to verify its work, which "will 2–3x the quality".** Claude tests every change to claude.ai/code in Chrome. He tags `@.claude` on PRs to add rules to CLAUDE.md through the GitHub Action. |
| **31 Jan 2026, "tips from the team"** | **3–5 git worktrees** ("the single biggest productivity unlock" per the team; Boris himself uses multiple checkouts), one tab per task with color-coded names. Ghostty. A status line showing context use and branch. Re-plan when a task goes sideways. Update CLAUDE.md "after every mistake". Commit skills to git. A `/techdebt` sweep at the end of a session. Prompts: *"Grill me on these changes"*, *"Prove to me this works"*, *"Scrap this, implement the elegant solution."* Paste a Slack bug thread and say "fix". |
| **30 Mar 2026, "power features"** | Mobile app, `/teleport`, `/remote-control`. `/loop 5m /babysit` and `/schedule`. Hooks: SessionStart loads context, PreToolUse logs every bash command, PermissionRequest routes prompts to a messaging app, Stop nudges Claude to keep going. `claude -w`, `/batch`, `/btw`, `/branch`. `--bare` for fast SDK startup. |
| **16 Apr / 24 May 2026** | Auto mode appears in his Opus 4.7 tips (Apr), then becomes **his #1 tip** (May), the "key building block for multi-clauding". |
| **25–26 Jul 2026** (YC Startup School) | **Cut ~80% of the prompt** for new models. **Every 6 months, delete your CLAUDE.md, skills and hooks**, and re-add only what the new model still gets wrong. |
| **11 Sep 2026** | *"Production code written by Claude should have a higher bar than if it was written by a human"*: lint, tests, Claude-driven end-to-end tests, daily Claude fuzzers, automated code and security review. |

The team's habits are also visible in the plugins it ships ([anthropics/claude-code/plugins](https://github.com/anthropics/claude-code)):
- **`/code-review`** runs in stages:
  1. a cheap Haiku gate decides whether the PR needs review at all;
  2. **two Sonnet agents check CLAUDE.md compliance**;
  3. **two Opus agents hunt bugs**;
  4. **a validation subagent re-checks every finding** before it's reported, and only "HIGH SIGNAL issues" go out.
- `security-guidance` is a PreToolUse hook covering 9 risky patterns.
- `hookify` turns observed bad behavior into hooks.

Fiona Fung, Director of Engineering for Claude Code, describes the organization ([Jun 2026](https://claude.com/resources/articles/running-an-ai-native-engineering-org)):
- The bottleneck moved to *"verification, code review, and security."*
- Roadmaps gave way to just-in-time planning, and design docs to prototypes.
- Humans review legal risk, trust boundaries, security-sensitive code and taste.
- *"I don't think I've seen a non-Claude-assisted commit in the last four months."*

Thariq's Fable field guide adds a striking practice: *"Claude Fable is the first model where I find the quality of the work is bottlenecked by my ability to clarify its unknowns."* So, before implementing, run blind-spot passes, prototypes and interviews. After implementing, generate an explainer and a **quiz on the change that the author must pass before merging**. ([Jul 2026](https://claude.com/resources/articles/a-field-guide-to-claude-fable-finding-your-unknowns))

**What changed between 2025 and late 2026**

| | 2025 | Late 2026 |
|---|---|---|
| Reasoning control | "think" < "think hard" < "ultrathink" | Effort levels `low`…`max`. Opus 5.5 defaults to `medium`; only `ultrathink` survives. |
| Permissions | Allowlists; Boris avoided skip-permissions | **Auto mode by default**, plus sandbox; `dontAsk` for headless runs |
| Parallelism | Multiple checkouts, a few terminals | Worktrees, agent view, `/batch`, workflows, agent teams, cross-session messaging, routines |
| Verification | "Ask Claude to verify" | *Enforced* by `/goal`, Stop hooks, verification skills and Code Review. *Remove* nagging verification prompts on Opus 5 and Fable. |
| Harness | Context resets for "context anxiety" | Resets removed as dead weight; 1M windows; steerable compaction |
| Model choice | Sonnet daily, Opus when needed | Opus 5.5 by default; Fable 5.1 for the hardest work; Sonnet and Haiku 5.5 for scoped work and subagents |

**Anthropic's own numbers.** These are self-reported and the baselines are inconsistent, so read them as direction, not proof.
- **Code written by Claude:** more than **80% of merged code** by May 2026 (leadership estimates 90%+), up from "low single digits" before Feb 2025. Engineers ship **~8×** as much code.
- **Infrastructure load:** CI job volume rose **25×** in six months, and Anthropic warns teams to *"assume your architecture will be at a 25x load within two quarters."*
- **Success rates:** internal success on open-ended Claude Code tasks went from ~26% to **~88–92%** by Sep 2026. A Claude grader judges these.
- **Surveys and autonomy:** in the Dec 2025 survey, self-reported productivity was up **50%** and merged PRs per engineer per day up **67%**, but most staff could fully delegate only **0–20%** of their work. Claude "leads" 26% of AI R&D tasks (Aug 2026), and ~30,000 agents run concurrently on one internal platform.
- **Expertise:** across ~400k sessions, **novices reached verified success 15% of the time, against 28–33% for intermediate users and above.** *"The ability to steer Claude toward success comes more from command of a domain than from the ability to write code."* Users make ~70% of planning decisions but only ~20% of execution decisions. ([expertise study, Jun 2026](https://www.anthropic.com/research/claude-code-expertise))

**Case studies.** These are the strongest public evidence of what agent teams can do.

| Project | Setup | Scale and cost | Lesson |
|---|---|---|---|
| **C compiler** (Carlini, Feb 2026) | 16 Opus 4.6 agents in `while true` loops, no orchestrator, coordinating through git and lock files | ~2,000 sessions, ~$20k, ~100k lines of Rust; builds Linux 6.9 | The verifier must be "nearly perfect". ([post](https://www.anthropic.com/engineering/building-c-compiler)) |
| **Retro game maker harness** | Planner → generator → evaluator | Solo run: 20 min, $9, core feature broken. Harness: 6 h, $200, playable. | — |
| **Bun port, Zig → Rust** (Jarred Sumner) | Judge first, then a rulebook, a throwaway "shakedown" translation, smaller models translating and larger models reviewing, two adversarial reviewers plus a tie-breaker | ~1M lines in under two weeks, ~$165k, 100% CI pass | Build the judge before the migration. ([migrations, Jul 2026](https://claude.com/resources/articles/ai-code-migration)) |
| **Python → TypeScript** (Mike Krieger) | 12 Sonnet subagents | 165k lines in a weekend | — |
| **Block** (Oct 2026) | **Fable plans**, up to dozens of Opus or Sonnet workers edit, cheap regex checks run outside the model | **Two human approvals** for merges to main and for deploys | Benchmark every model at every effort level. ([case study](https://claude.com/resources/articles/how-block-orchestrates-claude-fable-across-thousands-of-pull-requests)) |

**Anthropic documents its own failure modes:**
- self-evaluation bias;
- declaring victory early;
- "time blindness";
- reviewers that always find *something*, which leads to over-engineering;
- over-eager scope (Opus 5 widening the task; Sonnet 5.5 at max effort spawning its own review subagents);
- auto-compaction losing what you need next;
- Fable 5.1 rewriting whole files;
- quality regressions from harness changes (the Apr 2026 postmortem: default effort lowered, a caching bug, a verbosity line that cost 3%).

Its learning-effects RCT (n=52, Jan 2026) found AI-assisted learners scored **17% lower on a follow-up quiz (50% vs 67%)** with no significant speed gain. Learning held up when people asked conceptual questions alongside requesting code ([RCT](https://www.anthropic.com/research/AI-assistance-coding-skills)).

### 4.2 The other labs and tool vendors

**How to read this section.** The research sandbox could fetch GitHub-hosted sources (OpenAI's cookbook and Codex repo, `github/docs`, AWS's AI-DLC, Gemini CLI), so those are verified. A **†** marks claims that come from the research agent's prior knowledge and could not be re-checked this session. A second verification pass re-checked the company case studies ([brief 10](briefs/10-org-programs-verification.md)) and the tool vendors ([brief 11](briefs/11-tools-landscape-update.md)). A third pass then read the blocked vendor pages directly (Cursor, Cognition, Stripe, Spotify, Ramp, OpenAI, Vercel); their claims held, so those † marks are gone ([brief 15](briefs/15-third-pass-check.md)). Details still known only from secondary write-ups are flagged as such. Almost every outcome number here is **self-reported by the vendor**. Full detail is in [brief 03](briefs/03-industry-playbooks.md).

**OpenAI: "harness engineering"**
- **[Harness engineering](https://openai.com/index/harness-engineering/)** (Ryan Lopopolo, Feb 2026) is the defining industry essay of 2026.
  - **The experiment:** a five-month internal project shipped a beta with **no hand-written code**: ~1M lines and ~1,500 merged PRs. The team grew from 3 to 7 engineers and averaged ~3.5 PRs per engineer per day (self-reported).
  - **The core move:** stop writing code and design the environment instead: context, tools, constraints and feedback loops.
  - **Context architecture:** they abandoned one big AGENTS.md because it "crowds out the task, the code, and the relevant docs." Instead, a **~100-line AGENTS.md acts as a table of contents** into a structured `docs/` *system of record*: design docs, exec plans, product specs, ARCHITECTURE.md, SECURITY.md. *"What the agent can't see doesn't exist."*
  - **Mechanical enforcement:** custom linters and structural tests enforce a layered architecture. **Error messages are written for the agent**, telling it how to fix the violation.
  - **Background maintenance agents:** recurring "garbage collection" agents grade quality, fix doc drift and open small refactor PRs.
  - **Review:** agents review their own changes, request more agent reviews, and iterate (the post calls this a "Ralph Wiggum loop"). *"Humans may review pull requests, but aren't required to."*
- **Lopopolo's follow-up theses** ([repo](https://github.com/lopopolo/harness-engineering/tree/trunk/docs)):
  - "Keep a large navigable knowledge store and a small active working set."
  - "Code the agent reads becomes prompt material."
  - "Stable lessons move into their earliest durable owner."
  - "Optimize useful outcomes per unit of scarce human attention."
  - His **improve-harness** procedure is a fix-it loop:
    1. Pick one real, re-runnable job and record a baseline.
    2. Find the *earliest failed handoff*.
    3. Make the smallest reversible fix at the earliest owner.
    4. Run a fresh rerun.
    5. Keep, revise or remove the fix.
- **Codex Prompting Guide** ([cookbook](https://raw.githubusercontent.com/openai/openai-cookbook/main/examples/gpt-5/codex_prompting_guide.ipynb)):
  - Use the exact tools the model was trained on (`apply_patch`, `rg`).
  - Default to `medium` reasoning.
  - *Remove* prompts asking for upfront plans and preambles.
  - "Bias to action"; "always maximize parallelism" on reads.
  - Truncate tool output to ~10k tokens, keeping the head and tail.
- **Codex's own system prompt** has git-safety rules worth copying into any agent file: *"NEVER revert existing changes you did not make"*, no `git reset --hard` without approval, and "STOP IMMEDIATELY and ask" if unexpected changes appear. Review output is findings-first, ordered by severity.
- **Delegate / Review / Own.** OpenAI's "Building an AI-native engineering team" guide maps every SDLC phase to what the agent does, what the human checks, and what the human owns.
- **Symphony** ([repo](https://github.com/openai/symphony)) is an open-source orchestration spec. It watches a Linear board, spawns isolated autonomous runs, and returns **"proof of work"**: CI status, review feedback and walkthrough videos. It "works best in codebases that have adopted harness engineering."
- **The "agentic software factory"** (Pragmatic Engineer, Sep 2026; interviews with seven OpenAI engineers):
  - Parallel domain review agents, **risk-tiered**. Low-risk areas can opt into **agent auto-approval**; high-risk changes get a **mandatory human** reviewer.
  - A **per-change deploy agent** picks success signals and builds a dashboard. It acts only after a human approves the rollout.
  - "Perf Factory" agents fix production regressions.
  - Sevbot suggests incident mitigations but never executes them.
  - Load on some delivery systems rose ~10× in ~6 months.
  - Andrew Ambrosino, the Codex desktop lead, observed that better long-running agents make people run *fewer* things in parallel.
  - No defect or change-failure data is published.
- **Adoption** (self-reported):
  - At Codex GA (Oct 2025), OpenAI said nearly all its engineers use Codex, merge 70% more PRs a week, and have Codex review almost every PR.
  - Lopopolo (Mar 2026): his team "ships 75 PRs a week with Symphony", and he reviews agent PRs *after* merge.
- **AGENTS.md is now the cross-tool standard.** OpenAI donated it to the Linux Foundation's **Agentic AI Foundation** (9 Dec 2025), alongside MCP and goose. 23 tools read it, and the site claims 60k+ projects use it. Rule: the closest file wins, and chat overrides everything.
- **Usage data** ([arXiv 2606.26959](https://arxiv.org/abs/2606.26959), OpenAI data):
  - Codex active users grew more than 5× in H1 2026.
  - More than 10% of users run 3+ concurrent agents a week.
  - The share of users submitting tasks estimated at more than 8 human-hours rose ~10×.

**Google**
- **Internal data:**
  - The RCT found **~21% faster** task completion (n=96).
  - Sundar Pichai said **~75% of new code is AI-generated and engineer-approved** (Apr 2026, up from about 50% in fall 2025 and 25% in Oct 2024). On Lex Fridman's podcast (Jun 2025) he called a ~10% engineering-velocity gain "the number he cares most about".
  - **LLM-driven migrations** (Ziftci et al., FSE 2025): 3 developers over 12 months; ~74% of code changes and ~69% of edits were made by the LLM; the developers estimated ~50% time saved.
- **DORA 2025 + AI Capabilities Model** (see §3). The **2026 ROI report** models a **J-curve dip ("tuition")** before gains, and says returns come mainly from the system (platform, workflow, less rework), not from headcount cuts.
- **Gemini CLI:**
  - **Just-in-time GEMINI.md discovery**: context files load when a tool touches a path. `context.fileName` can include AGENTS.md.
  - Skills best practice: *"the description is the most important part"*, and keep the SKILL.md body under 5k words.
- **Conductor** (Dec 2025): "context-driven development". Persistent `conductor/` markdown holds product, tech-stack and workflow files plus per-track `spec.md`/`plan.md`. *"Measure twice, code once."* It now also runs in Claude Code.
- **Antigravity** (Nov 2025; 2.0 desktop app at I/O, May 2026):
  - A **Manager view** for parallel agents.
  - Agents produce **Artifacts** (plans, screenshots, browser recordings), which are easier to verify than raw tool calls.
  - **Gemini CLI's individual tiers ended.** Google announced (19 May 2026) that from 18 Jun 2026 Gemini CLI stopped serving Google AI subscription plans (individual Code Assist, AI Pro/Ultra). They moved to the closed-source Go `agy` Antigravity CLI, which keeps skills, hooks and subagents as plugins. The Apache-2.0 Gemini CLI repo still ships (v0.63.0, 6 Oct) for API-key, Vertex and enterprise use.
- **Addy Osmani** (Google Cloud AI):
  - *"My LLM coding workflow going into 2026"*: a "15-minute waterfall" of a short spec and plan, then small chunks, frequent commits as save points, and a second model reviewing.
  - *"How to write a good spec for AI agents"*: commands, testing, structure, style, git workflow and boundaries, with **Always / Ask first / Never** tiers.
  - The **anti-`/init` discoverability filter**: if the agent can learn it from the code, delete it from the instructions file.
  - *"The 80% problem"*: comprehension debt.
  - *"Agentic Code Review"*: review is now the most valuable skill.

**Microsoft / GitHub** (from the current `github/docs` source)
- **Copilot cloud agent guidance:**
  - Good tasks have "a clear description," acceptance criteria and file pointers. **Keep broad refactors, security/auth/PII work, incident response, ambiguous requirements and *things you want to learn* for humans.**
  - *"If the agent can build, test, and validate its changes in its environment, it's more likely to produce mergeable pull requests."* Pre-install dependencies with `copilot-setup-steps.yml`.
  - Batch PR feedback with "Start a review", because every single comment triggers work.
- **Guardrails by default:**
  - The agent **can't push to the default branch or merge**, and is subject to rulesets.
  - Protect agent and MCP config files with **CODEOWNERS**.
  - The agent can't read Actions secrets.
  - Each session runs on a fresh VM.
  - Workflows triggered by agent PRs need a writer's approval.
- **Review tooling:**
  - A published **checklist for reviewing AI code**: run tests and static analysis first; verify that dependencies exist; watch for invented APIs and deleted or skipped tests.
  - **Stacked PRs** via `gh stack`, because "review quality also degrades as pull request size increases".
- **Agentic Workflows:**
  - Markdown compiled to hardened Actions.
  - Agents run in firewalled containers with **read-only tokens**.
  - **Writes only through declared "safe outputs"**.
  - A per-run credit cap (`max-ai-credits`).
- **Copilot Memory** stores repo facts **with code citations**, re-validates them against the current branch before use, and expires them after 28 days unused. This is a model for memory that can be checked.
- **Copilot CLI:**
  - A **"rubber duck" critic on a *different* model** ("less likely to share the first model's blind spots").
  - `/fleet` for parallel subagents, with a warning that sequential work won't benefit.
  - Autopilot capped at 5 continuations by default.
- **spec-kit**: ~141k★.
- **VS Code's own `copilot-instructions.md`** (~158 lines) ends with a running **"Learnings"** section. It also tells the agent not to run builds "as a completion ritual", and to pick validation by scope and risk.

**AWS**
- **AI-DLC** ([repo](https://github.com/awslabs/aidlc-workflows)): "adaptive workflow steering rules" with 5 phases and 33 stages, human approval gates, and a 118-event audit trail. It runs inside Claude Code, Kiro, Codex, Cursor and Copilot. This is the heaviest-process end of the spectrum.
- **Kiro** (GA 17 Nov 2025):
  - Specs with EARS-notation requirements, design and tasks, plus spec-derived property-based tests.
  - Checkpoints and rewind, steering files, hooks and a headless CLI.
  - By Oct 2026 it spans IDE, CLI, web, mobile and "Crew". Amazon named it the recommended internal tool in Nov 2025.
- **Q Developer Java upgrades** (Andy Jassy, Aug 2024; self-reported): ~4,500 developer-years and ~$260M a year saved. 79% of auto-generated code reviews shipped without changes.
- **Agent incidents and "controlled friction":**
  - **The Kiro outage.** The FT reported a 13-hour outage of AWS Cost Explorer in one mainland-China region in Dec 2025, after Kiro chose to "delete and recreate the environment".
  - **Amazon's response.** It blamed misconfigured access ("user error… not AI") and added mandatory peer review for production access.
  - **The retail reset.** After retail outages in Mar 2026, Amazon imposed a **90-day "code safety reset"** on ~335 Tier-1 systems. Major changes now need two reviewers, and AI-assisted changes by junior and mid-level engineers need senior sign-off (FT, via secondary write-ups).

**Meta**
- **JiTTesting** (Jan 2026; FSE '26 industry track): LLM-generated "catching" tests created per diff and **never committed**.
  - Of 41 catches, 8 were true positives and 4 were serious.
  - LLM assessors cut human review load by ~70%.
  - Tests become ephemeral, per-change artifacts.
- **Earlier work:**
  - TestGen-LLM (2024): 73% of recommendations accepted into production.
  - ACH mutation-guided tests (2025): 73% accepted by engineers.
  - CodeCompose (2023): 22% acceptance; 8% of the code its users typed.
- **Management:** "AI-driven impact" became a core performance-review expectation for 2026. By mid-2026 Meta reportedly planned to crack down on employee token use.

**Cursor** (checked against Cursor's own posts in the third pass)
- **["Best practices for coding with agents"](https://cursor.com/blog/agent-best-practices) (Jan 2026):**
  - Start in plan mode.
  - **If output diverges, revert and refine the plan rather than patching through follow-ups.**
  - Keep rules short and add one only after a repeated mistake.
  - Use linters instead of pasted style guides.
  - Use hooks for "keep going until tests pass" loops, with iteration caps.
  - Practice TDD.
- **"Scaling long-running autonomous coding" (Jan 2026):**
  - Flat peer coordination through shared files and locks failed: 20 agents produced the throughput of 2–3.
  - **Planners → workers → a judge, with fresh cycles**, worked. It built a browser (~1M LOC) in about a week and a Solid→React migration (+266K/−193K lines).
  - Cursor found GPT-5.2-class models best for very long autonomy, noting that "Opus 4.5 tends to stop earlier and take shortcuts when convenient" ([post](https://cursor.com/blog/scaling-agents)).
  - Critics noted failing CI at launch and a ~1.6M-line Rust codebase.
- **"Dynamic context discovery":** provide fewer details up front; long tool outputs, chat history and terminals become files; MCP tools are lazy-loaded (−46.9% total tokens *in runs that called an MCP tool*; vendor A/B test).
- **Bugbot** (GA Jul 2025; vendor-reported): >1M PRs reviewed in beta, >1.5M issues flagged, >50% fixed before merge.
- **Composer 2** (Mar 2026) is built on the open-weight Kimi K2.5.
- **Graphite:** Cursor agreed to buy it in Dec 2025.
- **Cursor 3** (Apr 2026) made the Agents Window the primary interface, with the editor secondary (§11).

**Cognition (Devin, Windsurf)**
- **"Don't Build Multi-Agents"** (Jun 2025): *share full context and traces*; "actions carry implicit decisions, and conflicting decisions carry bad results." Cognition later shipped read-only retrieval subagents (SWE-grep). The line it draws is **no parallel writers**.
- **["Coding Agents 101"](https://devin.ai/agents101)** (Jun 2025):
  - Say *how*, not just *what*.
  - Give the agent CI, tests, types and linters.
  - Delegate in verifiable steps.
  - Start fresh rather than fight a confused session.
- **Devin's 2025 review** (14 Nov 2025; vendor-reported): 67% of PRs merged, vs 34% a year earlier; "4x faster". Best on migrations, vulnerability fixes, tests and small tickets. Cognition calls Devin "senior-level at codebase understanding but junior at execution."
- **2026 changes:**
  - Apr 2026: Cognition said "the landscape is different" and added multi-agent flows. **Devin Fusion** pairs a frontier main agent with a cheap "sidekick" (vendor eval: 47.9 at $2.38/task, vs Opus 4.8's 48.8 at $3.24).
  - Windsurf was renamed **Devin Desktop** (2 Jun).
  - **SWE-2** (10 Sep) is post-trained from Kimi K3.

**Other vendors**
- **Amp:** no model picker; read-only "Oracle" (a stronger reasoning model) and "Librarian" (remote code search) subagents; **handoff to a fresh thread** (Jan 2026) instead of forking or compaction. Public threads ended 2 Jun 2026.
- **Factory:**
  - Agent Readiness: 8 pillars at launch (9 in the current docs), 5 levels, and 80% of a level's criteria needed to advance.
  - It published **ESLint rules designed to steer agents** ([repo](https://github.com/Factory-AI/eslint-plugin)): every file needs a test file, structured logging, middleware on API routes. Factory advises copying the ideas rather than importing the plugin. The lesson: encode taste as lint rules, not prose.
- **Vercel:** a compressed 8KB docs index in AGENTS.md hit 100% on its Next.js 16 eval, against 79% for skills given explicit instructions and 53% for default skills. **The skill was never invoked in 56% of eval cases.** It is a vendor eval with ~19 tasks (the count is per a secondary digest), so the gap is about 4 tasks.
- **Augment:** the Context Engine MCP for semantic indexing of very large repos. Its quality claims are vendor-reported.
- **JetBrains:** Junie reads AGENTS.md; JetBrains publishes a guidelines catalog.
- **Block:** goose, now under the AAIF.
- **Replit:** an agent **deleted a user's production database during a code freeze** (Jul 2025, day 9 of Jason Lemkin's trial). Replit then shipped automatic dev/prod database separation, a planning-only mode and one-click restore. This is the canonical case for strict environment separation.

### 4.3 Big engineering orgs' internal agent programs

| Org | Program | What's distinctive | Reported outcome (self-reported) |
|---|---|---|---|
| **Stripe** | "Minions" (Feb 2026; [Part 2](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2)) | One-shot, unattended agents triggered from Slack, CLI or web. Each gets a pre-warmed **devbox (~10 s)** with the monorepo and warm caches, the same environment humans use. The harness is a fork of Block's goose. "Blueprints" are state machines mixing deterministic steps (lint, push) with agent loops. A central MCP "Toolshed" (400+, later ~500 tools). **At most two CI rounds, then back to a human.** | 1,000+ merged PRs/week (Part 1), then 1,300+ (Part 2). Every PR human-reviewed; none human-written. |
| **Spotify** | "Honk" background agent | Built on Fleet Management, which handles ~half of all Spotify PRs. Standardized on **Claude Code via the Agent SDK** (Jul 2025). One change per run. Format, build and test verifiers must pass before a PR opens. An **LLM judge compares the diff to the prompt and vetoes ~25% of runs** (mostly scope creep); about half of those then self-correct. | 1,500+ merged PRs (Nov 2025). "Up to 90%" of migration time saved (vendor page). ~1,000 merged PRs per 10 days after a 2026 rewrite. Co-CEO Söderström (Feb 2026): its best developers "have not written a single line of code since December." |
| **Ramp** | "Inspect" ([post](https://builders.ramp.com/post/why-we-built-our-background-agent)) | Modal sandboxes with fresh snapshots. OpenCode harness. The same observability and feature-flag tools engineers use. Multiplayer sessions in Slack, web and Chrome. An [open-source clone](https://github.com/ColeMurray/background-agents) shows the architecture. | ~30% of merged PRs in the frontend and backend repos (Jan 2026). Reportedly over half by Feb 2026 (unverified). |
| **StrongDM** | "Software Factory" (Feb 2026) | "Code must not be written by humans… must not be reviewed by humans." Holdout **scenarios** kept outside the repo. A **Digital Twin Universe** cloning Okta, Jira, Slack and Google Docs/Drive/Sheets. Public NLSpecs ([attractor](https://github.com/strongdm/attractor)). | "$1,000 on tokens today per human engineer" |
| **Shopify** | Lütke memo (Apr 2025) + **Roast** + **River** | *"Using AI effectively is now a fundamental expectation of everyone at Shopify."* AI usage is part of performance reviews, and teams must show why AI can't do the work before asking for headcount. [Roast](https://github.com/Shopify/roast) provides deterministic orchestration around agent steps. "River" (May 2026) is an internal coding agent that works only in public Slack channels, so everyone learns from everyone's prompts. | Liquid parse+render 53% faster via an autoresearch loop (§5). Sep 2026: dropped React Native for two native apps, because agents make maintaining two codebases affordable. |
| **Airbnb** | Enzyme→RTL migration (Mar 2025) | A per-file state machine with retry loops (which beat prompt tuning). 40–100k-token prompts with related files and example tests. "Sample, tune, sweep." | ~3.5k files in 6 weeks vs a 1.5-year estimate: 75% done in 4 hours, 97% after 4 days, the last 3% finished by hand |
| **Uber** | uReview | Precision over recall: confidence scoring, dedup, suppression of low-confidence comments | Covers >90% of ~65k weekly diffs. ~75% of comments rated useful; >65% addressed (vs 51% of human reviewers' comments). ~1,500 dev-hours/week saved. Also: 25% of commits went through Claude Code (COO, May 2026), and Uber used up its 2026 AI budget within months. |
| **Intercom** | Claude Code across R&D | A public goal to double R&D productivity in 12 months | Reached in 9 months. PRs per R&D person rose from 16 to 33 a month; 93.6% of PRs are agent-driven (self-reported). |
| **Block** | Fable orchestration (Oct 2026, [case study](https://claude.com/resources/articles/how-block-orchestrates-claude-fable-across-thousands-of-pull-requests)) | Fable plans; "up to dozens" of Opus or Sonnet workers make the edits. Regex or small-classifier guardrails run outside the model. Merges to main, deploys and flag changes stay "up to people", and **two humans approve each deploy**. Block benchmarks every effort level of every model, and agents run regular cleanup passes against tech debt. | "A thousand" merged PRs per migration, with multi-thousand-PR migrations. No quality data published. |

**Mandates and adoption** (self-reported):
- Coinbase's CEO fired engineers who hadn't onboarded to AI tools within a week (Aug 2025). AI wrote >40% of Coinbase's code by Sep 2025, against a 50% goal.
- Robinhood: ~50% of new code (Jul 2025).
- Zapier hires against a four-level AI-fluency rubric (v2, Mar 2026).

The common architecture: a background agent **triggered from where the work lives** (Slack, issues, Linear) runs in an **isolated, pre-warmed sandbox** using the same tools humans use. **Deterministic gates run first** (lint, then capped CI rounds). It returns a **PR with proof of work**, which gets **risk-tiered review**.

### 4.4 Where everyone converges, and where they split

**15 principles nearly every company shares** (brief 03 synthesis, cross-checked against briefs 01 and 08):
1. **The repository is the agent's world.** Knowledge lives in the repo, versioned and reviewable. "What the agent can't see doesn't exist."
2. **A small root instruction file with depth on demand**: ~100 lines at OpenAI, ~158 at VS Code, <200 in Anthropic's guidance.
3. **Only non-inferable, high-signal content, grown from observed failures.**
4. **An executable definition of done** the agent can check itself.
5. **Mechanical enforcement over prose**: lints and structural tests whose error messages are written for the agent.
6. **Plan before non-trivial work; re-plan rather than patch.**
7. **Small scopes and small diffs**, including stacked PRs.
8. **An isolated, reproducible environment per task.**
9. **Least privilege, with capability kept separate from authority.** Agents can't merge; protect agent config with CODEOWNERS; read-only tokens plus safe outputs.
10. **Deterministic scaffolding around agentic steps**: blueprints, state machines, compiled workflows.
11. **Bounded loops that escalate to a human**: continuation caps, credit caps, two CI rounds.
12. **Review becomes risk-tiered verification.** Agents do the first pass, often with a different model; humans own intent and high-risk changes.
13. **Asynchronous background agents** triggered from existing workflows, returning PRs with evidence.
14. **Foundations amplify AI**, so measure outcomes (DORA), not activity ("% of code written by AI").
15. **Continuous maintenance ("garbage collection") as a standing loop**: doc gardening, quality grades, ephemeral tests.

**Where they split:**
- **One agent or many.** Cognition and Lopopolo say one agent should do the whole job. Cursor swarms, Copilot `/fleet` and Antigravity's Manager view go parallel. Common ground: *read-only* parallel helpers are fine; parallel *writers* need a planner hierarchy and isolation.
- **Do humans review code?** StrongDM says no. OpenAI says "aren't required," but its factory still mandates a human for high-risk changes. GitHub's defaults, Stripe and Block keep human approval. Lopopolo reviews agent PRs *after* merge. Amazon moved the other way after its 2026 outages, adding second reviewers and senior sign-off on AI-assisted changes. DORA's stability data argues for caution.
- **Heavy specs or light plans?** spec-kit, Kiro, AI-DLC and Conductor sit at the heavy end. Cursor's "revert and re-plan" and Codex's "outcome-first" lean prompting sit at the light end. Osmani's "15-minute waterfall" is the middle.
- **Static or dynamic context?** A static index wins for must-know facts (Vercel); dynamic discovery wins for everything else. The practical answer is a small static map plus on-demand depth.
- **Build or buy background agents?** Stripe, Ramp and StrongDM built their own; Spotify standardized on Claude Code; others buy Copilot, Devin, Codex cloud or Jules.
- **What to measure.** "% of code AI-generated" (Google 75%) vs velocity (~10%) vs outcomes. Lopopolo: tokens and lines are inputs, not goals. In mid-2026 the "tokenmaxxing" push reversed:
  - Meta reportedly cracked down on token use.
  - Microsoft said "tokenmaxxing is not what we are optimizing for."
  - DORA pointed to outcome metrics such as Salesforce's "Agentic Work Units".

## 5. How the best individuals work: the practitioner canon

Most personal blogs were unreachable from the research sandbox. Brief 05 therefore read primary sources the authors publish on GitHub: Armin Ronacher's, Peter Steinberger's, Mario Zechner's and Lance Martin's blog sources, and Simon Willison's nightly database backup. Full profiles and quotes are in [brief 05](briefs/05-practitioner-workflows.md).

### 5.1 Five things nearly everyone at the top now agrees on

1. **Most of their code is now written by agents.** Armin Ronacher reported ">90% AI-written" for a 40k-line Go service (Sep 2025). Steinberger said "pretty much 100%" (Oct 2025). Karpathy flipped from 80% manual to "80% agent coding" (Dec 2025). Willison said "probably 95% of the code that I produce, I didn't type myself" (Apr 2026). Many name the **"November 2025 inflection"** (Opus 4.5, GPT-5.1/5.2) as the turning point. Karpathy: coding agents *"basically didn't work before December and basically work since."*
2. **The core skill is verification, not prompting.** "Use red/green TDD" ("it's like five tokens, and that works"). "First run the tests." "Your job is to deliver code you have proven to work" (Willison). Carlini: *"it is easy to see tests pass and assume the job is done, when this is rarely the case."*
3. **Context engineering replaced prompt engineering as the frame.** Examples: Karpathy's definition; Breunig's four failure modes (poisoning, distraction, confusion, clash); Dex Horthy's 40–60% context utilization (Aug 2025), tightened to avoiding a ~40%+ "dumb zone" (Nov 2025); HumanLayer's ~150–200-instruction budget for CLAUDE.md; Manus's KV-cache-first design (cached tokens are ~10× cheaper), "mask, don't remove" tools, and todo.md recitation.
4. **For coding agents, CLIs and skills beat MCP.** Playwright MCP costs ~13.7k tokens against a 225-token README for four scripts (Mario Zechner). GitHub MCP costs ~23k tokens against `gh` at zero (Steinberger). Willison called 2025 "the (only?) year of MCP".
5. **Human review, not agent speed, is now the bottleneck.** Thorsten Ball and Armin each wrote some version of *"I too am the bottleneck now."* Steinberger calls himself a "Claudoholic". Willison says he is "wiped out" by 11am running four agents. Yegge wrote "The AI Vampire". **Fatigue and addiction are real occupational hazards.**

### 5.2 Profiles: the setups worth knowing

**Simon Willison: from "vibe engineering" to *Agentic Engineering Patterns***
- **Tools:** Claude Code, Codex CLI, and Codex Cloud or Claude Code for web for async tasks, "frequently launched from my phone".
- **Parallelism:** fresh `/tmp` checkouts instead of worktrees. YOLO mode only where malicious instructions can't reach the context. He kicks off **2–3 async "code research" projects a day** into a dedicated repo (99 projects by Oct 2026).
- **Parallel-task taxonomy:** research and proofs of concept, "how does that work again?", small maintenance, and *"carefully specified and directed actual work"*.
- **Bottleneck:** *"I can only focus on reviewing and landing one significant change at a time."*
- **Guide:** his *Agentic Engineering Patterns* (Feb 2026, 16+ chapters) is the closest thing to a field manual:
  - "Writing code is cheap now"
  - "Hoard things you know how to do"
  - "Red/green TDD"
  - "First run the tests"
  - "Agentic manual testing" (`python -c`, `curl`)
  - "Linear walkthroughs"
  - Anti-pattern: *"Don't file pull requests with code you haven't reviewed yourself."*
- **Shift by May 2026:** *"I'm not reviewing every line of code that they write anymore, even for my production level stuff."* He treats agent output like another team's service, while warning of the **"normalization of deviance."**
- **Security:** the **lethal trifecta** framework, and **scoped credentials** (for example a dedicated cloud org with a $5 budget).

**Armin Ronacher (Flask): from Claude-YOLO to the minimal Pi harness**
- **Jun 2025 recommendations, still widely cited:**
  - A `claude-yolo` alias with Docker for containment.
  - **"I strongly recommend Go for new backend projects"**: explicit context, test caching, low churn. Python "magic" trips agents up.
  - Tools must be "protected against an LLM chaos monkey".
  - A pidfile-guarded `make dev` with **all output tee'd to a log the agent can tail**.
  - "Have the agent do the dumbest possible thing that will work", with plain SQL.
- **"Things that didn't work"** (Jul 2025): most custom slash commands; hooks in YOLO mode; print mode. What works: *"just talk to the machine more, give it more context, keep the audio input going… that is 95% of my workflow."* Before automating a task, run it three times and judge the variance.
- **Practice by late 2025:** **Codex reviews every PR**; Claude handles tool-heavy debugging; *"I still treat every line as my responsibility."* He took plan mode apart ("mostly a custom prompt") and prefers clarifying Q&A that ends in a markdown handoff.
- **2026:** uses **Pi** "almost exclusively", with his own `/answer`, `/todos` and `/review` extensions. Essays: "A Language for Agents" (greppable code, explicit context, results over exceptions); "The Final Bottleneck"; "The Coming Loop" (loops work for porting, performance and research, but produce code "too defensive, too complex, too local"); "Better Models: Worse Tools".

**Peter Steinberger (PSPDFKit; OpenClaw creator; joined OpenAI Feb 2026)**
- **Jun 2025:** "Claude Code is my computer". Two months of skip-permissions on macOS, protected by **hourly Arq snapshots** plus a disk clone.
- **Oct 2025, "Just Talk To It":**
  - Moved to **Codex CLI** and runs **3–8 agents in a 3×3 terminal grid, mostly in the same folder**, each making atomic commits of only its own files.
  - Thinks in "blast radius". Prompts are 1–2 sentences plus a screenshot.
  - **No plan mode**: *"Just talk to it."*
  - Spends ~20% of his time on agent-run refactoring (jscpd, knip). Keeps an ~800-line AGENTS.md ("organizational scar tissue"), symlinked as CLAUDE.md.
  - Spends ~$1k/month across 4 OpenAI subscriptions and 1 Anthropic subscription. He left Claude over *"absolutely right"* sycophancy.
- **Dec 2025:** *"These days I don't read much code anymore."* He builds everything CLI-first so agents can verify output. His `oracle` tool calls GPT-5 Pro for hard problems. He keeps one canonical `AGENTS.md` shared by Claude Code and Codex.

**Mario Zechner (Pi), the "tight leash" minimalist**
- **Pi:** four tools (read/write/edit/bash), system prompt plus tools under 1,000 tokens. No plan mode, no MCP, no subagents (parallel feature subagents are "an anti-pattern"). Context gathering happens **in a separate session that produces an artifact**, then a fresh session uses it.
- **Strongest skeptic essay** ("slowing the fuck down", Mar 2026): agents make "booboos" at machine speed with no pain signal, and "the bigger the codebase, the lower the recall". *"Set yourself limits on how much code you let the clanker generate per day."*

**Mitchell Hashimoto (Ghostty)**
- **Oct 2025 build:** shipped a non-trivial feature in 16 Amp sessions (~8 h, $15.98), with transcripts published. It included an "anti-slop" cleanup session and a manual restructuring that "set the agents up for success".
- **"My AI Adoption Journey"** (Feb 2026), six steps:
  1. Drop the chatbot.
  2. **Reproduce your own work**: do it twice, once by hand and once with the agent.
  3. **End-of-day agents**: spend the last 30 minutes kicking off background work.
  4. Outsource the slam dunks.
  5. **Engineer the harness**: fix every recurring agent mistake permanently via AGENTS.md or scripts.
  6. **Always have an agent running.**
- **Notifications:** turns them *off*. It is "my job as a human to be in control of when I interrupt the agent."
- **Ghostty's AI policy:** disclosure is required and the human must fully understand all code. Ghostty's AGENTS.md even traps agents that try to file PRs on their own.

**Andrej Karpathy**
- **Feb 2025:** coined "vibe coding" ("I 'Accept All' always").
- **Jun 2025:** coined "context engineering".
- **Oct 2025:** agents were "net unhelpful" for the novel, "intellectually intense" nanochat.
- **Dec 2025:** *"I've never felt this much behind as a programmer."*
- **Jan 2026:** "80% agent coding"; *"I really am mostly programming in English now."* Setup: a few Claude Code sessions in Ghostty on the left and an IDE on the right for viewing code and manual edits. He also warned to "watch them like a hawk" and gave his advice: *"Don't tell it what to do, give it success criteria."* He predicted skill "atrophy" and called 2026 "the year of the slopacolypse".
- **Feb 2026:** adopted "agentic engineering".
- **Mar 2026, `autoresearch`:**
  - The human edits only `program.md`.
  - The agent edits one file, under a fixed 5-minute run budget, against one scalar metric (~100 experiments overnight).
  - Shopify's Tobi Lütke reused the pattern (Pi plus a pi-autoresearch plugin, ~120 experiments, checked by 974 tests). Liquid parse+render got 53% faster with 61% fewer allocations (PR #2056, Mar 2026).

**Geoffrey Huntley (Ralph)**
- **The Ralph loop:** `while :; do cat PROMPT.md | claude ; done`. One task per loop, a fresh context each iteration, the plan on disk, and **"backpressure"** from tests, types and lints. *"Each time Ralph does something bad, Ralph gets tuned — like a guitar."*
- **Results:** built the "cursed" programming language over 3 months.
- **Rules:** sandbox everything (*"It's not if it gets popped, it's when"*). Keep context in the "40–60% smart zone". Use one build/test runner even with many subagents.
- **Jan 2026:** "everything is a ralph loop"; the engineer is "programming the loop".

**Steve Yegge (with Gene Kim)**
- **Writing and tools:**
  - "Revenge of the Junior Developer" (completions → agents → clusters → fleets).
  - The *Vibe Coding* book.
  - **Beads**, a git/Dolt-backed issue graph "for agents" (`bd ready`, `bd update --claim`).
  - **Gas Town** (Jan 2026): Mayor, polecats, witness and refinery merge queue; claimed "20–30 agents".
- **The cautionary tail:**
  - Aug 2026: *"Gas Town fell apart at the seams with Opus 4.7."*
  - "The AI Vampire" on fatigue.
  - An agent once wiped a production database password; running with checks disabled is "dangerous and stupid".

**Dex Horthy (HumanLayer)**
- **12-factor agents:** "own your context window".
- **ACE-FCA** (Aug 2025): research → plan → implement with frequent intentional compaction at 40–60% context use. *"I can't read 2000 lines of golang daily. But I can read 200 lines of a well-written implementation plan."* His public command files (`research_codebase`, `create_plan` with "What We're NOT Doing" and automated vs manual verification, `implement_plan`, handoffs) are among the most copied artifacts in the field.
- **2026 revision:**
  - **"Why Software Factories Fail"** (his AI Engineer World's Fair 2026 keynote): HumanLayer ran a "full lights-off" experiment from Jul 2025 and was rewriting by hand by Nov 2025. Training gives "no penalty for eroding codebase maintainability".
  - **QRSPI** splits planning into questions → objective research → a ~200-line design → a structure outline → a plan.
  - New flow: product review → architecture → program design (types and signatures) → vertical slices reviewed **100–200 lines at a time**.
  - *"Read the dang code."*

**Jesse Vincent (Superpowers)**
- **CLAUDE.md:** "We're colleagues", "Don't glaze me", "YOU MUST push back", "Rule #1: if you want an exception to ANY rule, stop and get explicit permission", TDD for everything, journal failed approaches.
- **Superpowers:** turned this into the most popular process plugin: brainstorm → worktree → 2–5-minute tasks → a subagent per task with review → red/green/refactor → finish the branch. *"Evidence over claims."*

**Harper Reed**
- **Workflow:** *"Ask me one question at a time so we can develop a thorough, step-by-step spec"* → `spec.md` → a reasoning model writes `prompt_plan.md` and `todo.md` → an executor prompt walks the plan, commits after each step, and pauses for review.
- **On TDD:** *"The robots LOVE TDD."*
- **On pre-commit hooks:** *"The robot REALLLLLY wants to commit"*, so pre-commit hooks make it fix its own breakage.

**Kent Beck: "augmented coding" with "genies"**
- **Method:** a plan.md list of tests, then "go": implement the next test, then only enough code to pass it.
- **Three warning signs:** loops, functionality he hadn't asked for, and *the genie cheating by disabling or deleting tests*.
- On his own skills: *"90% of my skills just went to zero dollars and 10% of my skills just went up 1000x."*

**Others**
- **Every** (Klaassen and Shipper): compound engineering. Effort is 80% planning and review, 20% execution, and every session ends by writing its lesson down.
- **Thorsten Ball** (Amp): "an LLM, a loop, and enough tokens". Amp has an "oracle" stronger model. ~99% of Amp's code is AI-written. His prompts are plain prose that names files and constraints.
- **antirez:** in 2025, chat with hand-pasted context, because unsupervised agents make "fragile code bases… full of local minima". In 2026 he uses Claude Code with an `IMPLEMENTATION_NOTES.md` the agent must re-read after compaction.
- **Lance Martin:** `/diary` + `/reflect`. A PreCompact hook writes session diaries, and a reflection pass turns them into one-line CLAUDE.md rules.
- **Matt Pocock:** small composable skills: `grill-me` → `to-spec` → `to-tickets` (tracer bullets) → `/tdd` vertical slices → `/code-review`. *"The rate of feedback is your speed limit."*
- **Ryan Carson:** `ai-dev-tasks` (PRD → tasks → one sub-task at a time) and `snarktank/ralph` (`prd.json` with `passes` flags, `progress.txt`, AGENTS.md learnings).
- **Nicholas Carlini:** the 16-agent C compiler (§4.1).
- **Shrivu Shankar** ("How I use every Claude Code feature", Nov 2025):
  - CLAUDE.md is a "constitution" with limited token "ad space". Never `@`-include whole docs; tell Claude *when* to read them.
  - Prefer `/clear` plus "Document & Clear" (write progress to a file, clear, resume) over `/compact`.
  - "Master-Clone" subagents (the main agent spawns copies of itself) over "Lead-Specialist" ones.
  - Hooks that block at *submit* time rather than at every write.
- **Diwank Singh** (Julep, "Field notes from shipping real code with Claude", Jun 2025): `AIDEV-NOTE`/`AIDEV-TODO` anchor comments the agent maintains, and **humans write the tests**.
- **Lee Robinson** (Cursor; secondary sources): moved cursor.com off its CMS in about three days for ~$260 of tokens. Argues that agents raise the cost of unnecessary abstractions.
- **Sankalp** (Claude Code 2.0 guide, Dec 2025; secondary sources): hand off to a fresh session with a `/handoff` command at ~60% context.
- **Jeremy Howard** (the critical view): vibe coding is a "slot machine". He favors small, understood steps (his SolveIt / "dialog engineering" approach).

### 5.3 Who does what (latest known state)

| Practitioner | Main tool | Parallelism | Planning | Verification | Reads the code? | Autonomy |
|---|---|---|---|---|---|---|
| Willison | Claude Code + Codex (+ phone/web) | ~4 + async research | Plan first; precise specs | Red/green TDD, manual tests, conformance suites | Less than every line (2026) | High |
| Ronacher | Pi (+ Codex review) | Low–moderate | Q&A → markdown handoff | Fast tests, logs, Makefile tools | Yes, "every line" | YOLO, leashed |
| Steinberger | Codex CLI | 3–8, same folder | "Let's discuss" | Tests per feature; CLI-first | Barely | Very high |
| Zechner | Pi | Low | Separate context session → artifact | Commit hooks | Yes; caps daily output | Supervised YOLO |
| Hashimoto | Amp (2025) | 1 background | Reproduce, then delegate | Targeted tests in AGENTS.md | Yes + anti-slop passes | Moderate |
| Karpathy | Claude Code + IDE; autoresearch | A few + overnight loops | program.md | Scalar-metric loops | Touch-ups (~20%) | High (research) |
| Huntley | Claude/Amp in a bash loop | 1 monolithic loop | specs/ → plan file | Backpressure + LLM judge | No; tunes the loop | Very high |
| Yegge | Gas Town + Beads | 15–30 (until it broke) | Issue graph | Merge queue | Minimal | Extreme |
| Horthy | Claude Code + HumanLayer cmds | Moderate | RPI → design → slices | Automated + manual criteria | Yes ("read the dang code") | Moderate–high |
| Vincent | Claude Code + Superpowers | Subagent per task | Brainstorm → 2–5 min tasks | Strict TDD | Between tasks | High in guardrails |
| Reed | Claude Code | Low | One-question spec → prompt_plan | TDD + pre-commit | After each step | Moderate |
| Beck | Claude Code | Low | plan.md of tests | Strict TDD | Yes | Low–moderate |

### 5.4 The 15 most-repeated techniques (with endorsers)

1. **Tests as the feedback loop, ideally red/green test-first.** Willison, Beck, Reed, Vincent, Pocock, Huntley, Carlini, Every, Horthy, Steinberger.
2. **Spec or plan in a markdown file before coding.** Reed, Horthy, Beck, Vincent, Every, Carson, Huntley, Steinberger, Ronacher, Pocock.
3. **Let the agent interview you first.** Reed, Pocock (grill-me), Ronacher (`/answer`), Superpowers and Every (brainstorm), Steinberger ("let's discuss").
4. **A living AGENTS.md/CLAUDE.md, updated after every recurring mistake.** Hashimoto, Steinberger, Huntley, Carson, Vincent, Lance Martin, Every, the Claude Code team.
5. **CLIs, skills and scripts over MCP; progressive disclosure.** Ronacher, Zechner, Steinberger, Willison, Huntley, Manus.
6. **Deliberate context hygiene:** fresh sessions, intentional compaction, notes re-read after compaction. Horthy, Huntley, Zechner, Breunig, Lance Martin, antirez.
7. **YOLO with containment:** containers, async or remote machines, snapshots, scoped credentials.
8. **Close the loop so the agent can observe results:** logs, dev servers, curl, screenshots, browser scripts, CLI-first design.
9. **Run parallel agents, capped by review capacity.** Run low-stakes and research work in parallel.
10. **Small blast radius:** PR-sized vertical slices, 2–5-minute tasks, one sub-task at a time.
11. **Second-model or second-context review:** Codex reviewing Claude, an "oracle" model, review subagents.
12. **Dedicated cleanup and refactor passes:** "anti-slop sessions", `/ce-simplify-code`, ~20% refactor time.
13. **Point agents at working examples to recombine** ("look at ../vibetunnel and do the same").
14. **Agent-legible codebases:** simple, explicit, greppable code; stable dependencies; conformance suites.
15. **Loops against verifiable goals for unattended work:** Ralph, autoresearch, end-of-day agents.

Honorable mention: **voice dictation for rich context** (Ronacher: "95% of my workflow"; Karpathy uses SuperWhisper).

### 5.5 Where they genuinely disagree

| Issue | One side | Other side |
|---|---|---|
| Process weight | Structured pipelines (Horthy, Superpowers, Every, Reed, Carson, Huntley) | "Just talk to it"; plan mode is just a prompt (Steinberger, Ronacher, Zechner) |
| Subagents | Valuable for isolation and review (Superpowers, HumanLayer, Manus, Claude Code team) | Opaque, or an anti-pattern for parallel features (Zechner, Steinberger); investigative use only (Ronacher) |
| Scale of parallelism | Armies and factories (Yegge, StrongDM; Steinberger at 3–8) | Tight leash (Zechner, Ronacher, Hashimoto at 1, Willison bounded by review). Gas Town later collapsed. |
| Reading the code | Mostly not (Steinberger, StrongDM; Willison uneasily) | Yes (Horthy, Ronacher, Zechner, Beck) |
| Loops for long-lived code | "Programming the loop" (Huntley, Yegge, StrongDM) | Loops write "too defensive, too complex" code (Ronacher); "a model-training issue" (Horthy) |
| Worktrees | Superpowers, HumanLayer, Anthropic | Same folder, commit to main (Steinberger); fresh /tmp checkouts (Willison) |
| Agent-written tests | Write them first (Willison, Beck, Superpowers) | They become "untrustworthy" (Zechner); passing tests are "rarely" proof (Carlini); use held-out scenarios (StrongDM) |
| Claude vs Codex | Opus "earned my trust" (Willison); Claude for tool-heavy debugging (Ronacher) | Codex reads more and is less sycophantic (Steinberger). Both sides concede it's mostly "vibes". |

**What reconciles them.** These disagreements mostly track **stakes and verifiability**:
- **Greenfield, or work with a strong oracle**: lighter process, more agents, less line-reading.
- **Long-lived, shared, high-stakes code**: plans, slices, reading the code, and fewer, better-supervised agents.

## 6. The playbook: how to work with coding agents in late 2026

This section brings §3–§5 together into one working method. Each principle notes who backs it: **E** = empirical evidence (§3), **V** = vendor guidance (§4), **P** = practitioner consensus (§5).

### 6.0 The loop in one picture

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ 0. HARNESS (once, then continuously): short CLAUDE.md/AGENTS.md · fast tests │
 │    · linters/types as hooks · sandbox + permissions · skills · CI review    │
 └─────────────────────────────────────────────────────────────────────────────┘
   1. FRAME     → fresh session · state the outcome + constraints + "done when"
   2. EXPLORE   → read-only (plan mode / Explore subagent) · scoped, not "investigate everything"
   3. PLAN      → only if the diff can't be described in one sentence · edit the plan (Ctrl+G)
                  big/unclear → interview → SPEC.md → NEW session
   4. IMPLEMENT → small vertical slice · test-first where possible · commit as save points
   5. VERIFY    → the agent runs the check (tests/build/screenshot) · /goal or Stop hook gate
                  → independent verifier subagent / second model tries to refute it
   6. REVIEW    → small PR with evidence (test output, demo, walkthrough) · risk-tiered human review
   7. COMPOUND  → every recurring mistake becomes a rule, hook, skill, lint or test
```

### 6.1 Give the agent a check it can run (E, V, P: unanimous)

**Why it matters.** This is the first section of Anthropic's best-practices docs and the most-repeated technique among practitioners. The evidence base supports it too: reproduction tests and verifier selection raise accuracy, and DORA links instability to weak test controls. *"Claude stops when the work looks done. Without a check it can run, 'looks done' is the only signal available."*

**The enforcement ladder,** weakest to strongest:
1. Ask for the check in the prompt.
2. Use `/goal <condition>`, which a separate evaluator re-checks after each turn.
3. Add a **Stop hook** that blocks the turn from ending until a script passes.
4. Have a **verification subagent or workflow** try to refute the result.

**Ask for evidence, not claims:** test output, the command that was run, a screenshot.

**Own the acceptance tests.** The research shows that *human-written* tests are what move results (TDFlow: 94% on SWE-bench Verified with them). Merely prompting an agent to write more tests didn't change outcomes in a controlled ablation (§3.10). So write or approve the tests that define "done" yourself, then let the agent use red/green TDD inside that frame. "Use red/green TDD" costs about five tokens and works (Willison). Kent Beck's warning signs: loops, unrequested features, and **tests being disabled or deleted**. Forbid editing tests ("It is unacceptable to remove or edit tests") and protect test paths with hooks.

**For UI, verify in a real browser.** Use Claude in Chrome, Playwright, or the Chrome DevTools MCP/CLI. Anthropic found browser-level end-to-end checks "dramatically improved" long-running harnesses.

**Make test output easy for the agent to read.** Keep it terse, write details to a log file, put `ERROR <reason>` on one line, and add a `--fast` deterministic sample mode (Carlini).

**Build the oracle before going autonomous.** Conformance suites, held-out scenarios and digital twins are what made the C compiler, the Bun port and StrongDM's factory possible. *"The task verifier must be nearly perfect."*

### 6.2 Treat context as the scarcest resource (E, V, P)

**The evidence:** context rot, lost-in-the-middle, and instruction-count decay with **primacy bias** (§3.5). This holds even with 1M-token windows.

- **One task per session.** `/clear` between unrelated tasks. **After two failed corrections, `/clear` and rewrite the prompt.** A clean session with a better prompt "almost always outperforms" a long one full of corrections.
- **Rewind instead of correcting.** Esc Esc returns to the point before things went wrong.
- **Send exploration to subagents.** They read many files and return 1–2k-token summaries.
- **Compact on purpose, with a hint.** Use `/compact focus on X`, or "summarize from here". *The model is least capable at the moment it compacts*, so don't wait for auto-compaction at the worst moment.
- **Keep a notes file the agent must re-read after compaction**, such as `IMPLEMENTATION_NOTES.md` or `progress.txt` (antirez, Ralph, Anthropic's harness).
- **Rule of thumb from Horthy and Huntley:** keep working context at roughly 40–60% full, then hand off to a fresh session through a written artifact.
- **Side questions** go through `/btw`, so they never enter the history.

| Strategy | Claude Code mechanisms |
|---|---|
| **Write** (save state outside the context window) | plan files, NOTES.md/progress logs, auto-memory, Beads |
| **Select** (pull in only what's needed) | `@` imports, skills (progressive disclosure), path-scoped `.claude/rules/`, MCP tool search, CLIs over MCP |
| **Compress** | `/compact <focus>`, partial summarize, handoff docs |
| **Isolate** | subagents, `context: fork` skills, worktrees, agent teams, workflows |

### 6.3 Put each instruction where it belongs (V, E)

| If the instruction is… | Put it in… | Why |
|---|---|---|
| A non-inferable fact needed every session (commands, gotchas, conventions that differ from defaults) | **CLAUDE.md / AGENTS.md**, under 200 lines | Loaded every turn, so every line costs attention |
| A rule that applies only to part of the codebase | **`.claude/rules/*.md` with `paths:`** | Loads only when matching files are touched |
| A procedure or runbook (deploy, release, migrations) | **A skill** (`disable-model-invocation: true` if it has side effects) | Only the description loads up front; the body loads on use |
| "Every time X, do Y" | **A hook** | CLAUDE.md is advisory; hooks are deterministic |
| "Never do X" (secrets, prod, force-push) | **Permissions deny rules + sandbox** (managed settings for teams) | Prose prohibitions can be compacted away or ignored |
| A side task that reads a lot | **A subagent** | Keeps your main context clean |
| Knowledge of an API newer than the model's training data | **A compressed docs index in AGENTS.md**, or a Context7 skill | Vercel: a static index beat on-demand skills, which agents often failed to invoke |

**Write the file yourself and keep it minimal.**
- ETH found that context files **raise cost by more than 20% without reliably improving success**. Developer-written files did better than LLM-generated ones, and the authors found files useful for non-standard practices but not for repository overviews.
- Test each line: *"Would removing this cause Claude to make mistakes?"*
- Use "IMPORTANT" on one line at most.
- **Grow the file from observed failures. Don't front-load it.**
- `/init` output is a starting point, not a finished file.
- Prune with `/doctor` and `/doctor prompt-audit`. Re-review the setup every 3–6 months and after each model launch.

**Cross-tool setups.** Keep AGENTS.md as the canonical file and put `@AGENTS.md` at the top of CLAUDE.md. Claude Code also reads AGENTS.md natively when no CLAUDE.md exists.

### 6.4 Plan in proportion to uncertainty (V, P)

- **Skip the plan** when *"you could describe the diff in one sentence."*
- **Use plan mode** when the approach is uncertain, the change spans several files, or you don't know the code. Edit the plan directly (`Ctrl+G`). **If the output diverges, revert and re-plan rather than patching through follow-up prompts** (Cursor, Anthropic).
- **For big features, have Claude interview you first.** It asks questions with `AskUserQuestion`, writes `SPEC.md`, and you implement in a **fresh session**. A good spec names the files and interfaces involved, says what is out of scope, and ends with an end-to-end verification step.
- **Choose a methodology by context:**

| Method | Best fit | Watch out for |
|---|---|---|
| **Explore → Plan → Code → Commit** (Anthropic; `feature-dev` plugin) | The default for multi-file changes | Planning overhead on trivial tasks |
| **Interview → SPEC.md → fresh session** (Anthropic; Harper Reed's "one question at a time") | New features with unclear requirements | — |
| **Research → Plan → Implement → QRSPI** (HumanLayer; [ACE-FCA](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md)) | Large, unfamiliar, brownfield codebases | 2026 revision: review ~200-line designs and 100–200-line slices, *and* "read the dang code" |
| **Spec-driven development** ([spec-kit](https://github.com/github/spec-kit), [OpenSpec](https://github.com/Fission-AI/OpenSpec), Kiro, BMAD, AWS AI-DLC, Google Conductor) | Greenfield work, teams needing an audit trail | Piles of markdown to review; one process forced onto every task size; no controlled evidence it beats plan mode. Böckeler watched Kiro turn a small bug into 4 user stories with 16 acceptance criteria: *"I'd rather review code than all these markdown files"* ([Böckeler](https://www.martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)). OpenSpec is the lighter option for existing codebases. |
| **Superpowers** ([obra](https://github.com/obra/superpowers)) | Disciplined solo work | Token-heavy; overkill for one-line fixes |
| **Compound engineering** ([Every](https://github.com/EveryInc/compound-engineering-plugin)) | Long-lived codebases | Prune the accumulated `docs/solutions/` |
| **Osmani's "15-minute waterfall"** | The pragmatic middle ground | — |

### 6.5 Work in small slices with frequent save points (E, V, P)

- **Use vertical slices and 2–5-minute tasks** (Superpowers). Keep PRs reviewable: DORA's "small batches", GitHub's stacked PRs, Horthy's 100–200-line review slices.
- **Commit often.** Checkpoints/`/rewind` **don't track Bash-made changes or background subagent edits**, so git is your real undo.
- **Agents' high-volume output collides with review capacity.** Faros found **+98% PRs but +91% review time**. Cap how much you generate at what you can review.

### 6.6 Parallelize what's independent, capped by review capacity (E, V, P)

- **Start with 3–5 sessions, each in its own worktree** (Anthropic's guidance). Willison: *"I can only focus on reviewing and landing one significant change at a time."* Run research, maintenance and "scout" attempts in parallel, and keep **one significant change** in your own review lane.
- **Fan out work that is read-heavy or embarrassingly parallel:** search, review from several angles, audits, migrations with an oracle. Use **one strong agent for sequential work**. Evidence: Google/DeepMind found coordination degrades sequential tasks; Cognition's *no parallel writers*.
- **Split work by context, not role.** Planner → coder → tester → reviewer chains lose information at every handoff. Verifier subagents are the one split that reliably works.
- **Pick the parallelism tier by who holds the plan:**
  - **subagents** (Claude does);
  - **agent view / worktrees** (you do);
  - **agent teams** (a lead agent; experimental);
  - **dynamic workflows** (a script; up to 16 concurrent / 1,000 agents per run).
- **Expect 3–15× token cost and 28–42% merge-conflict rates** if parallel writers share files. Give each agent disjoint files.

### 6.7 Autonomy only inside containment, and only with an oracle (E, V, P)

**Containment comes first.**
- Use auto mode (classifier) + `/sandbox` (OS isolation, deny-by-default egress) + deny rules for secrets.
- Put `--dangerously-skip-permissions` **only inside a container, VM, Docker Sandbox or `srt`**.
- Never combine private data, untrusted input and outbound access in one agent (the **lethal trifecta**).
- Use scoped credentials, for example a cloud org with a $5 budget.
- Auto mode misses ~17% of over-eager actions by Anthropic's own measure, and a security researcher demonstrated a 60–80% bypass rate against it in small-sample tests (Aug 2026). **It is one layer, not the boundary.**

**Bounded autonomy.**
- `/goal` for tasks with a measurable end state: one end state, the check, constraints, and a turn cap.
- Ralph-style fresh-context loops for mechanical, multi-hour work: migrations, ports, getting tests green.
- Anthropic's **initializer + JSON feature list + progress file + `init.sh` + git** harness for multi-session builds.

**Separate generator and evaluator.** *"Agents reliably skew positive when grading their own work."* Use a skeptical evaluator agent, driven by Playwright, with a "sprint contract" defining done.

**Put a budget on everything:** `--max-turns`, `--max-budget-usd`, `maxEffortLevel`, usage-credit caps, and cloud spend caps.

**Scheduled and unattended agents (Anthropic, Oct 2026).** Anthropic's guide "Building effective agent automations" gives six rules. Its content is known only from secondary write-ups ([brief 09](briefs/09-anthropic-oct-2026-guides.md)):
1. Keep **bookmarks** so each run knows where the last one stopped.
2. Treat a failed read as **"unreadable", not "quiet"**.
3. **Re-check every item against its live source** before acting.
4. **Confirm the action, then record the state.**
5. Keep preferences **read-only**.
6. Apply **least privilege**.

These apply equally to `/loop`, routines and your own cron agents.

### 6.8 Review as risk-tiered verification (E, V, P)

1. **The agent verifies its own work** (tests, build, screenshots).
2. **An independent check:** a fresh-context verifier subagent, or `/code-review`.
3. **Cross-model review** is common practice: Codex reviewing Claude's diffs, Copilot's "rubber duck", Amp's oracle.
4. **CI review:** managed Code Review tuned with `REVIEW.md`, or `claude-code-action`, or other bots. Cap nits and require `file:line` evidence.
5. **Human review, tiered by risk.** Core, security, auth, payments and infrastructure always get a human, and many teams require two approvals for main and deploys (Block). Outer layers can graduate to agent-only review **area by area**, after months of building trust and with evals built from incident PRs (Claude Code team).

**Make review cheap with artifacts:** linear walkthroughs, demo videos (`shot-scraper video`), and PR descriptions you wrote yourself. For a hard change, have the agent quiz you before you merge (Thariq).

**Control noise.** A reviewer asked to find gaps always finds some. Ask for "correctness and requirement gaps only", use confidence thresholds, and after the first pass report Important findings only.

### 6.9 Compound: every mistake becomes a permanent fix (V, P)

- **When the agent makes a recurring mistake, change the environment, not just the conversation:**
  - a CLAUDE.md line;
  - a hook (`hookify` converts observed behavior into hooks);
  - a lint rule with an error message written for the agent;
  - a test;
  - a skill.

  Boris Cherny: update CLAUDE.md "after every mistake". Hashimoto: "engineer the harness". Lopopolo: *"Stable lessons move into their earliest durable owner."*
- **Learning loops:** Every's `/ce-compound` writes to `docs/solutions/`; Lance Martin's `/diary` + `/reflect`; Trail of Bits' weekly `/insights` → rules, hooks or skills. Research backs **incremental delta updates** over rewrites (ACE).
- **Prune as much as you add.** Bloat is the failure mode: ETH, IFScale, and 91.8% of public SKILL.md files contain defects.
- **Re-test the harness when the model changes.** Anthropic removed context resets as "dead weight" after Opus 4.5. Gas Town "fell apart" on Opus 4.7. Claude 5 models need *less* prompting.

### 6.10 Choose models and effort deliberately (V)

- **Default:** Opus 5.5 at `medium`. Raise effort when Claude skips files or tests, or for subtle bugs and unfamiliar domains. Avoid `max` unless you've measured a gain; Willison saw it overthink to the 128k output limit and return nothing.
- **Tiering:**
  - **Fable 5.1:** planning, judging, hard debugging, long unattended runs. *"Describe the outcome, not the steps."*
  - **Sonnet 5.5:** scoped work and verifiers.
  - **Haiku 5.5:** fan-out subagents.
  - `opusplan` gives Opus planning with Sonnet execution.
- **Set model and effort at session start.** Switching mid-session cools the prompt cache and drops earlier thinking.
- **For Claude 5 models, remove "always double-check" boilerplate and rein in subagent spawning.** Keep a verification paragraph only for Sonnet 5.5 at low effort.
- **Keep a fallback model configured** (`fallbackModel`). Models can be suspended, as Fable was in Jun 2026, or rerouted by classifiers.

### 6.11 Make the codebase agent-legible (E, V, P)

- **Fast, deterministic tests** with a sampled `--fast` mode, and **one-command setup** (`init.sh` / `make dev` guarded by a pidfile).
- **Linters, type checkers and formatters wired into hooks or pre-commit**, so "the robot" fixes its own breakage. Encode taste as lint rules with agent-readable errors (Factory, OpenAI).
- **Logs the agent can read** (tee'd to a file), and observability it can query.
- **Simple, explicit, greppable code.** Prefer plain SQL, stable dependencies and explicit context. Armin recommends Go for new backends.
- **AGENTS.md as a ~100-line map** into `docs/`, the system of record. "What the agent can't see doesn't exist."
- **CLI-first tools.** Agents verify through CLIs, and CLIs cost almost no context compared with MCP.
- Score yourself against **Factory's Agent Readiness** pillars: style and validation, build, testing, docs, dev environment, observability, security, task discovery.

### 6.12 Protect your skills, judgment and attention (E, P)

- **When learning something new, use AI for concepts and explanations, not full delegation.** Delegators scored 17% lower on the quiz. Use the **Explanatory** or **Learning** output style. Practice debugging without AI.
- **Domain expertise predicts success** (15% vs 28–33% verified success). Invest in it, especially if you're early-career.
- **Watch for cognitive debt.** Schedule walkthroughs, and keep enough understanding to participate (Geoffrey Litt).
- **Fatigue and compulsion are real.** "Wiped out by 11am", "Claudoholic", "The AI Vampire". Set limits. Some people turn notifications *off* and decide for themselves when to check in (Hashimoto). Others cap how much code they generate per day (Zechner).

## 7. Claude Code in October 2026: what power users actually configure

Claude Code ships fast. There have been **542 npm versions published since the 24 Feb 2025 launch** (538 still listed), about 25–30 a month in 2026. On 11 Oct 2026, `latest` is **v2.1.296** (9 Oct) and `stable` is v2.1.287.

Power users set `"autoUpdatesChannel": "stable"` and follow two pages:
- the dated [docs changelog](https://code.claude.com/docs/en/changelog);
- the weekly [What's new](https://code.claude.com/docs/en/whats-new) digest.

Third-party "what's new" round-ups often get dates wrong. Agent View shipped in **May** 2026, not August. Everything below comes from the official docs and changelog; full detail is in [brief 02](briefs/02-claude-code-features.md).

### 7.1 Models and effort

| Model | API price (in/out per Mtok) | Role in Claude Code | Terminal-Bench 4.0 (Anthropic-reported) |
|---|---|---|---|
| **Opus 5.5** (22 Sep 2026) | $4 / $20 | **Default on every plan**, at `medium` effort. Anthropic says medium "matches or exceeds Opus 5 at high". | 66.4% (xhigh) |
| **Fable 5.1** (1 Sep 2026) | $10 / $50 | The top tier, for the hardest long-horizon work. Never the default. It can bill usage credits; on Max it is capped at 50% of weekly limits. | 55.8% |
| **Sonnet 5.5** (28 Sep 2026) | $2 / $10 | Well-scoped tasks; a cheap verifier or subagent | 70.6% |
| **Haiku 5.5** (7 Oct 2026) | $0.10 / $0.50 for prompts up to 100K tokens ($0.50 / $2.50 above) | Subagents, classifiers, bulk fan-out | 39.2% |

All four models have a native **1M-token context window** and 128K maximum output. Claude Code auto-compacts at about 967K tokens. Change the threshold with `/autocompact`, or keep sessions at 200K with `CLAUDE_CODE_DISABLE_1M_CONTEXT=1`.

**Effort and model aliases:**
- Effort levels are `low`, `medium`, `high`, `xhigh` and `max`. Anthropic's advice is *"for most tasks you should use the model's default effort level"*. Raise it when Claude skips files or tests, or for subtle bugs, unfamiliar domains and architecture.
- `ultrathink` is the **only** keyword still recognized in prompts. "Think hard" is now plain text.
- **`ultracode`** is a separate toggle. With it on, Claude plans a multi-agent workflow for every substantive task.
- **Aliases:** `opusplan` uses Opus for planning and Sonnet for execution. `best` picks Fable where you have access.
- **Fast mode** on Opus 5.5 is up to 2.5× faster at 2× the price.

**Prompting has partly reversed since 2025.** The Claude 5-era models verify their own work without being told. Anthropic's model guide now says to *remove* boilerplate "always verify" instructions, rein in over-eager subagent spawning, and **"describe the outcome, not the steps"** for Fable. The exception is Sonnet 5.5 at low effort, which still benefits from an explicit verification paragraph.

> Sources: [model-config](https://code.claude.com/docs/en/model-config), [models overview](https://platform.claude.com/docs/en/about-claude/models/overview), [effort guidance (Lydia Hallie, Jul 2026)](https://claude.com/blog/claude-model-and-effort-level-in-claude-code), [Opus 5.5 launch](https://www.anthropic.com/claude-opus-5-5), [brief 01](briefs/01-anthropic-canon.md).

**Caveat on benchmarks.** SWE-bench has dropped out of Anthropic's launch posts. Anthropic's own work shows that infrastructure setup alone can move scores by about 6 points. Its advice is to **ignore leaderboard gaps under ~3 points**.

### 7.2 Instructions and memory

**CLAUDE.md files load in a fixed order:**
1. managed (organization-wide)
2. user: `~/.claude/CLAUDE.md`
3. project: `./CLAUDE.md`
4. local: `CLAUDE.local.md`, kept out of git

Ancestor files are concatenated, root first. Subdirectory CLAUDE.md files load lazily, when Claude touches files in that directory.

**Rules for the file itself:**
- Keep each file under **200 lines**.
- `@imports` do not save context, because imported files still load at launch.
- Block-level HTML comments are stripped, so you can leave notes there for human maintainers.

**Where other kinds of instruction belong:**
- **Path-scoped rules** go in `.claude/rules/*.md` with `paths:` frontmatter. They load only when Claude touches matching files, which suits narrow conventions.
- **Skills** hold procedures. Only their descriptions are always loaded; the body loads when the skill is used. Set `disable-model-invocation: true` for skills you only ever call by name.
- **Hooks** hold anything that *must* happen. Prose in CLAUDE.md is advisory; Anthropic's docs call it "context, not enforced configuration".

**AGENTS.md** has been read natively since v2.1.277, but only when there is no CLAUDE.md. The most portable setup is a first line of `@AGENTS.md` in CLAUDE.md. `/import codex|gemini|cursor` migrates other tools' configuration.

**Auto memory** has been on since Feb 2026. It writes `MEMORY.md`, loads the first 200 lines or 25KB, and keeps typed notes. Subagents can keep their own with `memory: project`.

**Maintenance tools:**
- `/doctor` suggests trims.
- `/doctor prompt-audit` finds contradictions across CLAUDE.md, rules, skills and agents.
- `/skill-doctor` shows what each skill costs in context.

**What survives compaction:**
- Kept: the project-root CLAUDE.md, auto memory, the plan file, and a few recently read files.
- Summarized away: path rules and nested CLAUDE.md files, until a matching file is touched again.
- Truncated: skill bodies over 5K tokens. Put the critical lines first.

### 7.3 Permissions and safety: deterministic rules plus a classifier

**Permission rules** are evaluated **deny → ask → allow**, however specific each rule is.
- `ask` rules survive auto mode, so use them as human checkpoints, for example `Bash(git push *)`.
- Bash rules match the command *as written*: `git -C . push` escapes `Bash(git push *)`.
- **A `Read` deny does not stop `grep -r` or a script.** Only the OS sandbox enforces paths for every process: Seatbelt on macOS, bubblewrap on Linux and WSL2. It is **off by default**.
- The sandbox restricts writes to the working directory and its network allowlist starts empty. `sandbox.credentials` can deny or mask secrets.

**Auto mode** has been the default since 14 Aug 2026 for Pro, Max and Team, and on every plan since v2.1.284.
- A Sonnet-class classifier replaces most permission prompts, because users approved 93–97% of prompts anyway.
- It blocks `curl | bash`, force-pushes, `git reset --hard`, `terraform destroy`, production deploys, IAM grants and secret exfiltration.
- Anthropic reports a **0.4% false-positive rate**, but also a **17% false-negative rate on real over-eager actions**. Its advice is not to treat auto mode as "a drop-in replacement for careful human review on high-stakes infrastructure".
- Separately, OS-level sandboxing on its own cut permission prompts by 84% internally.

Anthropic's stated principle is to **contain at the environment layer first**. In a red-team test with a phished user, exfiltration succeeded 24 out of 25 times until egress and filesystem limits were applied. [Sources: [permissions](https://code.claude.com/docs/en/permissions), [permission-modes](https://code.claude.com/docs/en/permission-modes), [sandboxing](https://code.claude.com/docs/en/sandboxing), [auto-mode engineering post](https://www.anthropic.com/engineering/claude-code-auto-mode), [how we contain Claude](https://anthropic.com/engineering/how-we-contain-claude).]

**Supply-chain traps to know:**
- `claude -p` without `--bare` runs the repo's hooks and `.mcp.json` **with no trust dialog**. Use `--bare` on code you didn't write.
- Project skills' `allowed-tools` ignore workspace trust.
- **Claude Mods** (v2.1.287) are in-process JavaScript that runs *unsandboxed*. They can approve tool calls and override your own `PreToolUse` blocks. Inspect them with `claude plugin validate`.

### 7.4 Hooks: the policy engine

**Scope:**
- 33 events, including `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`, `PreCompact`, `TaskCompleted` and `TeammateIdle`.
- 5 handler types: `command`, `http`, `mcp_tool`, `prompt` (an LLM judgment) and `agent` (experimental).

**Exit codes:**
- Exit 2 blocks the action, and stderr is shown to Claude as the reason.
- `onFailure: "block"` (v2.1.295) makes a hook fail closed.
- A `PreToolUse` deny wins even in bypass mode.
- A **Stop hook that exits 2 keeps Claude working**. That is the mechanism behind "don't stop until the tests pass".
- The built-in cap of 8 consecutive continuations without a tool call does not catch a gate that never passes. Add your own retry counter.

**Recipes worth copying** (see Appendix A):
- a `PostToolUse` formatter on `Edit|Write`;
- a `PreToolUse` guard that turns destructive commands into an `ask`;
- protect-files (exit 2 on `.env`, lockfiles, `.git/`);
- `SessionStart:compact` to re-inject critical reminders;
- a Stop gate that requires a green typecheck and tests;
- `Notification` hooks that send desktop or phone alerts.

### 7.5 Parallelism: five built-in mechanisms

| Mechanism | What it is | Use it for |
|---|---|---|
| **Subagents** | Background by default, nest 3 deep, 20 run at once. Model and `effort` can be set per call. Built-ins: Explore (read-only), Plan, general-purpose. | Keeping noisy search, review and verification out of the main context |
| **Agent view** (`claude agents`, `claude --bg "task"`) | A table of your local background sessions grouped into Needs input, Working and Completed. Each session moves into its own worktree before editing. | Running several sessions at once from one terminal |
| **Worktrees** (`claude -w <name>`, `/batch`) | Isolated checkouts. `.worktreeinclude` copies `.env` and similar files in. `/batch` fans one change out to 5–30 worktree-isolated subagents. | Parallel features, large mechanical changes |
| **Agent teams** (experimental) | A lead plus teammates with a shared task list and mailboxes. Teammates editing the same file overwrite each other, so give each one its own files. | Review from several angles, competing debug hypotheses |
| **Dynamic workflows** (`ultracode`, `/workflows`) | Claude writes a JavaScript orchestration script that can be resumed. Limits: 16 concurrent agents (up to 256), 1,000 per run. Ships with `/deep-research`. | Audits, migrations, fix-until-green |

**Cross-session messaging** (`SendMessage`, `ListAgents`) connects sessions across machines and the cloud. Each background session consumes quota independently, so ten sessions use about ten times the tokens.

### 7.6 Skills, plugins, MCP

**Skills** follow the open [Agent Skills](https://agentskills.io) standard and have absorbed custom slash commands.
- `` !`cmd` `` injects live command output into the skill.
- `context: fork` runs the skill in an isolated subagent.
- `allowed-tools` grants permissions for the invoking turn only.
- Bundled skills include `/code-review`, `/batch`, `/debug`, `/loop`, `/verify`, `/run`, `/security-review`, `/deep-research` and `/fewer-permission-prompts`.

**Plugins** bundle skills, agents, hooks, MCP and LSP servers.
- The official marketplace is added automatically.
- `claude plugin details` shows a plugin's projected token cost, and `claude plugin eval` (v2.1.269) tests plugins.

**MCP tools are deferred behind tool search by default**, so only the tools you actually use cost context. Anthropic's own guidance is that **CLIs such as `gh`, `aws` and `gcloud` are more context-efficient than MCP**. Reserve MCP for systems without a CLI or that need authenticated, stateful access, such as Figma, Notion or databases.

### 7.7 Context hygiene

- **Check usage:** `/context` shows a grid of what is using context, and the status line can show `context_window.used_percentage`.
- **Reset between tasks:** `/clear`.
- **Compact with a focus:** `/compact <focus>`. Esc Esc → "Summarize from here" does a partial compaction.
- **Side questions:** `/btw` asks something that never enters the history.
- **Rewind:** `/rewind` can restore past checkpoints, even past a `/clear`.
- **Rewind's limits:** checkpoints **don't track Bash-made changes** or background subagent edits, so commit often.
- **Prompt cache:** switching model or effort mid-session cools the prompt cache. Choose them at the start of the session.

### 7.8 Surfaces and automation

- **Surfaces:**
  - the CLI (fullscreen TUI, `/voice`, a `/diff` panel);
  - the desktop app (parallel sessions, in-app browser, iOS Simulator pane);
  - VS Code and JetBrains;
  - **cloud sessions** (`claude --cloud "task"`, `--teleport` to pull a session back locally, `/autofix-pr`). A cloud session starts from a fresh clone of the **remote** branch, so **push first**. Only project-level configuration (CLAUDE.md, rules, skills, agents) travels with it, so commit your shared config. Handoff only goes one way: you can pull a cloud session down with `--teleport`, but you can't push a terminal session up. (Anthropic's Oct 2026 cloud-sessions field guide, via secondary write-ups);
  - **Remote Control** (drive a local session from your phone) and push notifications;
  - Claude in Chrome (GA 1 Jul 2026, v2.1.198);
  - Slack ("Claude Tag" for Team and Enterprise);
  - GitHub Actions (`claude-code-action@v1`);
  - managed **Code Review**, and `/ultrareview` (3 free runs on Pro and Max);
  - the **Agent SDK** in TypeScript and Python.
- **Automation:**
  - **`/goal <condition>`** (an evaluator model checks the condition after every turn);
  - **`/loop`** and cron (session-scoped, expiring after 7 days);
  - **Routines** (cloud runs triggered by a schedule, an API call or a GitHub event; 100 scheduled runs per hour);
  - the **Monitor** tool (streams background output);
  - **channels** (Telegram, Discord or iMessage messages pushed into a session).
- **Headless runs:** `claude --bare -p … --permission-mode dontAsk --allowedTools … --max-turns … --max-budget-usd … --output-format json [--json-schema …]`.

### 7.9 Plans, limits and cost

**Subscriptions** use rolling **5-hour windows plus weekly caps**, shared across the Claude apps and Claude Code. Anthropic publishes **no hour or message counts**, and says it may also apply weekly and monthly caps.

| Plan | Price | Usage |
|---|---|---|
| Pro | $20/mo ($17 on an annual plan) | baseline |
| Max | $100/mo (monthly billing only) | 5× Pro per 5-hour session |
| Max | $200/mo (monthly billing only) | 20× Pro per 5-hour session |
| Team Premium | $100 (annual) or $125 (monthly) per seat | 5× standard seats |

**Limits change often.** From 26 Mar 2026, 5-hour limits drained faster on weekday mornings (05:00–11:00 PT; secondary sources). On 6 May 2026, Anthropic doubled Claude Code's 5-hour limits for Pro, Max, Team and seat-based Enterprise, and removed the peak-hour reduction for Claude Code on Pro and Max. It credited a compute deal with SpaceX ([announcement](https://www.anthropic.com/news/higher-limits-spacex)).

Since 7 Oct 2026, Max also includes API credits: $100/month on 5× and $200/month on 20×, with no rollover. Team gets a pooled amount per seat. These credits work for the API, Managed Agents and the Agent SDK, **not** for interactive Claude Code.

**Checking usage:** `/usage` attributes usage to individual skills, subagents, plugins and MCP servers. The status line exposes the 5-hour and 7-day percentages.

**Enterprise benchmark:** about **$13 per developer per active day, or $150–250 per developer per month**. For 90% of users, costs stay under $30 per active day.

**Things that multiply cost:** agent teams, ultracode, workflows, many background sessions, Fable, and Code Review at $15–25 per PR. [Sources: [pricing](https://claude.com/pricing), [costs](https://code.claude.com/docs/en/costs).]

### 7.10 Timeline (selected)

| Date | Milestone |
|---|---|
| 24 Feb 2025 | Research preview |
| 22 May 2025 | 1.0 GA (Sonnet 4 / Opus 4) |
| 30 Jun 2025 | Hooks |
| 24 Jul 2025 | Custom subagents |
| Aug 2025 | Status line, output styles, `/context` |
| 29 Sep 2025 | 2.0: VS Code extension, `/rewind` checkpoints, Agent SDK |
| 9 Oct 2025 | Plugins and marketplaces |
| 16 Oct 2025 | Skills |
| 20 Oct 2025 | Bash sandbox; Claude Code on the web |
| 24 Nov 2025 | Opus 4.5 |
| Dec 2025 | `.claude/rules/`, Claude in Chrome (beta), LSP tool |
| Jan 2026 | `context: fork` skills; MCP tool search on by default |
| Feb 2026 | Opus 4.6, agent teams, fast mode, `--worktree`, Remote Control (24 Feb), auto memory, `/batch` |
| Mar 2026 | `/loop` and cron, `/effort`, channels (research preview, 19 Mar), **auto mode** (24 Mar) |
| Apr 2026 | Routines, Opus 4.7, `xhigh`, `/ultrareview`, mobile push for Remote Control (15 Apr) |
| 6 May 2026 | Claude Code 5-hour limits doubled |
| 11 May 2026 | **Agent view**, **`/goal`** |
| 28 May 2026 | **Dynamic workflows**, Opus 4.8 |
| 9 Jun 2026 | Fable 5 / Mythos 5 |
| 30 Jun 2026 | Sonnet 5 |
| 1 Jul 2026 | Background subagents by default; Claude in Chrome GA |
| 24 Jul 2026 | Opus 5 |
| Aug 2026 | Cross-session messaging, self-hosted environments, auto mode default (14 Aug), device cards and Remote Control out of preview |
| 1 Sep 2026 | Fable 5.1 |
| 18 Sep 2026 | Native AGENTS.md |
| 22 Sep 2026 | **Opus 5.5 default** |
| 28 Sep 2026 | Sonnet 5.5, ultracode toggle |
| 1 Oct 2026 | **Claude Mods** |
| 7 Oct 2026 | Haiku 5.5 |

## 8. The home rig: complete personal setups, from starter to agent fleet

Full detail is in [brief 07](briefs/07-home-rig.md), updated by the second-pass [brief 14](briefs/14-home-rig-update.md).

**Hardware got much more expensive in 2026** because of a DRAM and GDDR7 shortage. These prices come from secondary sources, so check the vendor page before buying:
- DGX Spark 128 GB: $3,999 at launch → $4,699 (Feb) → $6,950 (Oct).
- Framework Desktop (Strix Halo) 128 GB: $1,999 → $2,459.
- Mac mini: from $899 (M6, up to 32 GB); about $2,699 for an M5 Pro with 64 GB.
- RTX 5090: about $4,300 on the street, against a $1,999 list price.

### 8.1 Use the first-party features first

In 2025 the home-rig ecosystem existed to fill gaps in Claude Code. Most of those gaps have since been closed by Anthropic:

| 2025 gap | First-party answer in 2026 |
|---|---|
| Parallel sessions | `claude -w` worktrees; `claude agents` agent view with a keep-alive daemon |
| Coding from your phone | Remote Control (24 Feb) with mobile push (15 Apr) and **device cards** (Aug, when Remote Control left research preview): tap your home machine in the Claude app to start a session there |
| Cron and jobs | `/loop`, desktop scheduled tasks, cloud **routines** |
| Chat-ops | **Channels** (still a research preview, since Mar): Telegram, Discord or iMessage, with an allowlist |
| Agent-to-agent | Cross-session messaging |
| Dictation | `/voice` (doesn't count against usage limits; transcribed in Anthropic's cloud) |
| Usage tracking | `rate_limits` fields in the status line JSON; `/usage` attribution |

Third-party orchestrators keep dying, so build on tools that **degrade gracefully to plain `git worktree` + tmux**. Status as of 11 Oct 2026, from each repo:
- **Gone or community-only:** Terragon (closed Jan 2026); Crystal (deprecated Feb 2026 and replaced by Nimbalyst); Vibe Kanban (its company shut down on 10 Apr 2026, leaving a local-only community app). Omnara is now a self-hostable managed-agent platform.
- **Active:** [Orca](https://github.com/stablyai/orca) (89k★, MIT, cross-platform with a phone app), [cmux](https://github.com/manaflow-ai/cmux) (28k★, a Ghostty-based macOS terminal with agent notifications), Superset, Orchestrator.inc, Emdash, Conductor (Mac; Pro at $50/mo adds Conductor Cloud) and Nimbalyst. Claude Squad has slowed.

### 8.2 Component-by-component

| Layer | State of the art (Oct 2026) | Notes |
|---|---|---|
| **Terminal** | **Ghostty** is the consensus pick, recommended by both Anthropic's power-user tips and Trail of Bits. On Windows, WezTerm or Windows Terminal. | Desktop notifications work natively in Ghostty, Kitty and iTerm2, including over SSH. **Inside tmux, set `allow-passthrough on` and `extended-keys on`**, or notifications and Shift+Enter break. |
| **Telling sessions apart** | `/color`, color-coded tabs, worktree aliases (`za`/`zb`/`zc`); per-session status via OSC 7501 (v2.1.295) | Anthropic's guidance is **3–5 parallel sessions**. Your review bandwidth is the real limit. |
| **Editor alongside** | VS Code/Cursor extension; Zed via ACP; Neovim via `claudecode.nvim`; the desktop app's diff view and in-app browser | Review diffs wherever you're fastest. |
| **Status line / usage** | Native JSON includes `context_window.used_percentage`, `rate_limits.five_hour/seven_day`, cost and effort. Add-ons: **ccstatusline** (13.2k★), **ccusage** (19k★, also reads Codex/OpenCode/OpenClaw logs). `/usage` breaks spend down per skill, subagent, plugin and MCP server. | Pace yourself across the 5-hour and weekly windows. |
| **Notifications** | (a) Terminal-native; (b) a `Notification` hook calling `osascript`/`notify-send` plus an **ntfy** push to your phone; (c) Remote Control push ("Push when actions required") | Treat the ntfy topic like a password. |
| **Voice** | `/voice`: hold Space, 20 languages, tuned to your repo's vocabulary, and it doesn't count against usage limits. Audio is transcribed in Anthropic's cloud, it needs a claude.ai login, and it doesn't work over SSH. Offline alternatives: **Handy** (free, MIT, cross-platform), **VoiceInk** (macOS, one-time purchase) or SuperWhisper ($8.49/mo). | Anthropic says people speak about 3× faster than they type. Wispr Flow ($12–15/mo) is popular but cloud-only. |
| **Parallelism** | Native worktrees, agent view, `/batch`, `claude --cloud` fan-out. GUI: Conductor, Superset or Emdash, mainly for reviewing diffs. | Agent view's "delete" removes uncommitted work. `.worktreeinclude` multiplies copies of `.env` files. |
| **Remote and mobile** | **Remote Control**: outbound HTTPS only, no open ports, transcript stored on Anthropic's servers while connected, bypass mode can't be selected from the phone. Alternatives: **Happy**'s `happy claude` CLI (an encrypted relay; use the CLI wrapper rather than its newer Harness sign-in, since Anthropic's terms exempt only the unmodified Claude Code binary); **Tailscale + mosh + tmux** with Blink, Moshi or Termius (all three support mosh) for a raw shell. | Common mosh gotchas: a UTF-8 locale is required; Tailscale userspace mode breaks mosh's UDP. |
| **Always-on box** | `tmux` + `caffeinate` + `claude remote-control --spawn worktree --capacity N`, then device cards on your phone. Desktop scheduled tasks need the machine awake. Cloud routines run with the laptop closed (minimum interval 1 h, 100 runs/h). | Choose by asking two questions: does the job need local files, and does it need the machine on? |
| **Sandbox ladder** | `/sandbox` (Bash only; cut prompts 84%) → **`srt`** (wraps the whole process, MCP and hooks included) → devcontainer + firewall (still can't stop a malicious repo exfiltrating `~/.claude` credentials) → **Docker Sandboxes `sbx`** (free microVM; a proxy injects credentials so they never enter it) → VM or cloud session. | Anthropic: *"Always run `--dangerously-skip-permissions` sessions inside a container, a VM, or the sandbox runtime."* The Bash sandbox alone is not enough for unattended bypass mode. |
| **Secrets** | `sandbox.credentials` deny or mask; a `Read()` deny list for `~/.ssh`, `~/.aws`, `~/.config/gh`, `~/.npmrc`, keychains; `enableAllProjectMcpServers: false` | Without `/sandbox`, Read denies don't constrain Bash. |
| **MCP diet** | Prefer CLIs (`gh`, `sentry-cli`, `aws`). Context7 as CLI + skill (`npx ctx7 setup`). Playwright's own README suggests CLI + skills for coding agents. Chrome DevTools MCP `--slim --headless`. Supabase MCP `read_only` + `project_ref`. | MCP tools are deferred behind tool search by default. Check `/usage` for per-server cost. |
| **Local models** | `ollama launch claude`; LM Studio (Trail of Bits' Feb 2026 pick: Qwen3-Coder-Next MLX 4-bit, ~45 GB, needing ≥64 GB of unified memory); llama.cpp `/v1/messages`; claude-code-router. Use ≥64k context: Ollama defaults to 4k–32k unless you have ≥48 GiB of VRAM. | **Unsupported by Anthropic.** A custom `ANTHROPIC_BASE_URL` disables Remote Control, voice and cloud features. Many local users switch to OpenCode or a lab's own CLI instead. |
| **Open-weight models** | Too big for home: Kimi K3 (2.8T total / 104B active), GLM-5.2/5.3 (744B / 40B active; MIT-licensed weights). Home-runnable: **Qwen 3.8 27B** (Aug 2026, Apache-2.0, 17 GB at Q4; Willison's first pick), Qwen3-Coder-Next (80B / 3B active; ~43 tok/s on Strix Halo), Qwen3.8-Flash-Next (125B / 6B active; ~49 tok/s on one DGX Spark), GLM-5.3-Flash (320B / 18B active; ~55 tok/s on two Sparks). | Treat these as a **privacy or overflow lane**. On the independent Artificial Analysis Intelligence Index, Qwen 3.8 27B scores 52 against Fable 5.1's 66; that index is a general composite, not a coding eval. Small models are also easier to prompt-inject. |
| **Plans** | Pro $20 ($17 annual); Max 5× $100; Max 20× $200 (monthly billing only). 5-hour and weekly limits are shared across all Claude surfaces, and **Anthropic publishes no hour or message counts**. Fable on Max: up to 50% of the weekly limit; on Pro, Fable is available only through usage credits (API rates; prompt cache drops from 1 h to 5 min). | Limits change often (§7.9). The new Max monthly API credits (Oct 2026) **can't be used in Claude Code**. |
| **Terms** | *"Advertised usage limits for Pro and Max plans assume ordinary, individual usage."* Third-party products may not route requests through subscription credentials. | Use an **API key** for OpenClaw, custom bots and anything shared. |

### 8.3 "Claude at home" beyond code

- **Cowork, Dispatch and computer use** (Pro/Max). Dispatch is a persistent conversation on your phone that spawns Code sessions. Computer use runs in the background on macOS (Sep 2026).
- **Home Assistant** has had an MCP Server since 2025.2 and exposes only the entities you choose. Add it with `claude mcp add home-assistant --transport http <url>`.
- **Obsidian "second brain"** vaults with morning, nightly and weekly agents. The popular plugin ships its nightly agent *disabled*, because that agent needs bypass mode.
- **Personal skills** for iMessage, WhatsApp and Google (Steinberger's `agent-scripts`). He also keeps one canonical `AGENTS.md` symlinked into both Claude Code and Codex.
- **Morning briefings** pulled from your calendar and inbox (a Desktop scheduled-task example).
- **OpenClaw** (~392k★), the "Mac mini agent box" craze. Its own docs:
  - recommend a **VPS for 24/7** use;
  - say to keep the gateway on loopback only, and that "the model/agent is not a trusted principal";
  - warn that plugins run with host trust.

  It is now run by an independent 501(c)(3) foundation (OpenAI is a donor, not an owner). The GitHub Advisory Database lists **772 advisories** across its packages in 8 months (Feb–Oct 2026), 458 of them with CVE IDs (§3.2). One was a CVSS 9.9 remote-code-execution bug in March (secondary source). It has no paid bug bounty. Its skill marketplace, ClawHub, has hosted at least 1,184 malicious skills over time (341 of 2,857 in one Feb 2026 scan). In Aug 2026, ABC News reported an OpenClaw agent that found a gym-booking API with no authorization check and cancelled another member's booking to move its owner up the waitlist. Run it on a dedicated machine or user account, with plugins pinned and an API key.

### 8.4 Three reference rigs

**Rig A: Starter. One laptop, one plan, native features only (~$20/month)**

| Component | Choice |
|---|---|
| Plan | Pro ($20); upgrade to Max 5× when `/usage` shows weekly limits binding |
| Terminal / editor | Ghostty (+ `/terminal-setup` in IDE terminals); your usual editor |
| Status line | `/statusline show model, context % and 5h/7d usage` |
| Safety | Default auto mode + `/sandbox` (auto-allow) + secrets deny list + a guard hook (Appendix A) |
| Parallelism | Two worktrees: `claude -w <name>` |
| Mobile | Claude app + `/remote-control` when stepping away; push enabled in `/config` |
| Voice | `/voice` |
| MCP | None to start; `gh` CLI; Context7 via `npx ctx7 setup` when needed |

Setup steps:
1. Install with `curl -fsSL https://claude.ai/install.sh | bash`, then `/login`.
2. Install Ghostty.
3. Paste the personal settings from Appendix A.2.
4. Run `/sandbox` and choose auto-allow.
5. Add `.claude/worktrees/` to `.gitignore`.
6. Test Remote Control from your phone.

**Rig B: Serious solo power user. 3–6 parallel sessions, remote-capable, with a sandboxed bypass lane (~$200–270/month)**

| Component | Choice |
|---|---|
| Plan | Max 20× ($200), or Max 5× if you run ≤3 sessions. Usage credits with a monthly cap. Optional ChatGPT Plus ($20) for Codex second-opinion reviews; ChatGPT Pro starts at $100. |
| Terminal | Ghostty + tmux (passthrough config) |
| Sessions | Native `claude -w`, `claude agents` / `--bg`, `/fork`. Optional GUI for diff review: Conductor, Superset or Emdash. |
| Usage | ccstatusline (5-hour block and weekly widgets), `npx ccusage@latest daily`, a weekly `/insights` turned into CLAUDE.md rules, hooks or skills |
| Notifications | Ghostty native + an ntfy hook + Remote Control push |
| Remote | `remoteControlAtStartup: true`; Tailscale + mosh + tmux + Blink for a raw shell; Happy as an alternative |
| Safety | Auto mode by default. **Bypass lane = `sbx run claude` (Docker Sandboxes)** or a devcontainer with firewall. `sandbox.credentials` masking. Trail of Bits-style hooks. |
| Tools | `gh`, `ctx7`, Playwright CLI / agent-browser, Chrome DevTools MCP (slim), Sentry/Linear only as needed |
| Scheduling | `/loop` for PR babysitting; 1–3 routines (nightly dependency audit, morning PR review) |

**Rig C: Autonomous home "agent fleet". Always-on box, chat-ops, isolated workers, optional local-model lane (~$350–700/month, plus ≈$2.5k–14k upfront if you add a local-model box)**

| Component | Choice |
|---|---|
| Accounts | Max 20× under your own login, plus usage credits with a hard cap. **A separate API key for every third-party harness** (OpenClaw, pi, Agent SDK bots). |
| Always-on host | A Mac mini (M6 up to 32 GB, from $899; M5 Pro up to 64 GB, from $1,699) or a Linux mini-PC/VPS (a build box wants 4–8 GB of RAM), on a UPS, with a **separate OS user for the agents**, FileVault and firewall on, Tailscale, no public ports |
| Session server | `tmux` + `caffeinate -is claude remote-control --spawn worktree --capacity 6 --permission-mode auto`; device cards on your phone; the agent-view daemon for `--bg` jobs |
| Coordination | Cross-session messaging (`isolatePeerMachines: true`). Gas Town only if you really want 10–30 agents with a merge queue. |
| Isolation | **Every autonomous worker in Docker Sandboxes** (`sbx run --clone …`) or a firewalled devcontainer; `srt`-wrapped MCP servers; branch protection on main |
| Chat-ops | Claude Channels (Telegram with an allowlist) or a hardened OpenClaw on the dedicated box |
| Scheduling | Cloud routines for anything that must run with the box off; desktop tasks (keep-awake and worktree toggles on) for jobs that need local files |
| Observability | ccusage (covers Claude Code, Codex and OpenClaw), `/usage` loop rows, an ntfy topic per box, push |
| Local lane (optional) | Mac Studio, 1–2× DGX Spark, or Strix Halo 128 GB running LM Studio/Ollama/vLLM, for private or overflow tasks only. Upfront: ≈$2.5k (Strix Halo) to $5.5k+ (Mac Studio M5 Ultra), or $9.4–13.9k for two Sparks. |
| Backups | Agents push branches early and often; Time Machine/restic of `~`; a weekly review of scheduled tasks, routines and stale worktrees |

The command snippets for these rigs (tmux, the always-on server, Telegram, Docker Sandboxes, `srt`, the local lane) are in **Appendix A.11–A.15**.

### 8.5 Public setups worth reading

These are real people's published configurations (stars and last commit as of 11 Oct 2026). Read them for ideas, and copy pieces rather than whole repos.

| Repo | ★ | What to take from it |
|---|---|---|
| [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config) | 2.1k | Security-first defaults: a `Read()` deny list, guard hooks, an LM Studio lane and an installer. The best starting point for safety settings. |
| [steipete/agent-scripts](https://github.com/steipete/agent-scripts) | 7.3k | One canonical `AGENTS.md` plus skills and hooks shared by Claude Code and Codex. |
| [obra/dotfiles](https://github.com/obra/dotfiles) | 116 | A real working `.claude/` from the Superpowers author: review skills and a status-line script. |
| [diet103/claude-code-infrastructure-showcase](https://github.com/diet103/claude-code-infrastructure-showcase) | 10k | Skills that activate automatically from hooks. |
| [ykdojo/claude-code-tips](https://github.com/ykdojo/claude-code-tips) | 10.2k | 45+ tips, a status line, and running Claude in a container. |
| [centminmod/my-claude-code-setup](https://github.com/centminmod/my-claude-code-setup) | 2.7k | CLAUDE.md "memory bank" templates. |
| [Dicklesworthstone/destructive_command_guard](https://github.com/Dicklesworthstone/destructive_command_guard) | 6.1k | A fast Rust hook that blocks dangerous git and shell commands. |

## 9. The tool landscape and the community ecosystem

### 9.1 Terminal agents

| Agent | GitHub ★ (11 Oct 2026) | Reputation |
|---|---|---|
| **Claude Code** (Anthropic) | 150.1k | Has the most ways to extend it: CLAUDE.md and rules, skills, hooks, subagents, plugins and marketplaces, agent teams, dynamic workflows and `/goal`. Runs in the terminal, VS Code, JetBrains, the desktop app, the web and mobile. |
| **OpenCode** | 212.6k | MIT-licensed and works with any model provider. The default choice for local or mixed models. |
| **Codex CLI** (OpenAI) | 128.6k | Written in Rust. Also ships as an IDE extension, a desktop app and Codex cloud. Known for long autonomous runs and as a reviewer. |
| **pi** (Mario Zechner; owned by Earendil since Apr 2026) | 114.2k | Deliberately minimal and hackable. **1.0 shipped 1 Oct 2026.** MCP is now built in via "codemode" (v0.99), reversing its no-MCP stance. Still no built-in subagents or permission system. |
| **Gemini CLI** (Google) | 107.3k | 1M-token context. **Individual Google-login and AI Pro/Ultra access ended 18 Jun 2026** (moved to the closed-source Antigravity CLI). Still maintained for API-key, Vertex and enterprise users. The README's free-tier figures are stale. |
| **goose** (Block, now under the Linux Foundation's Agentic AI Foundation) | 55.1k | 15+ model providers and 70+ MCP extensions. |
| **Aider** | 49.5k | The pioneer: repo map and auto-commits. |
| **Crush** (Charm) | 28.6k | Uses language servers (LSP) for code context; works with multiple models. |
| **Copilot CLI** (GitHub) | 11.2k | Uses the same agent harness as Copilot's cloud coding agent. |
| **Warp** | 65.4k | The client is now open source (AGPL-3.0). |
| **Mistral Vibe** · **Grok Build** (xAI) | — | Apache-2.0 CLIs. Grok Build was open-sourced after the Jul 2026 upload incident (§11.5). |
| Closed source: Factory Droid · Kiro CLI · Cursor CLI · Amp · Antigravity CLI | — | Droid includes an agent-readiness report and a GitHub Action. Kiro's CLI runs headless in CI. |

Stars measure attention, not quality. Source: the repo pages, compiled in [brief 08](briefs/08-methods-and-tools.md).

**What each tool is known for.** This is soft consensus from practitioners. It is partly anecdotal, and the frontier brief adds data points (§11).
- **Claude Code:** the ecosystem and extension hub, and the best tool for interactive steering.
- **Codex:** thorough, long-running autonomous work, and a strong second-opinion reviewer.
- **Cursor:** the best loop inside an IDE, with a choice of models.
- **Gemini CLI / Antigravity:** large-context exploration. Individual users now go through the Antigravity CLI.
- **OpenCode and pi:** open harnesses that work with any model.

A common pattern is to **use two vendors: one agent implements and the other reviews.** Portability layers make this cheap: AGENTS.md, Agent Skills, plugins that install on 14–16 different hosts, and ACP, the Agent Client Protocol.

### 9.2 Community frameworks and configuration collections: what to trust

| Project | ★ | What it is | Verdict |
|---|---|---|---|
| [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | 37.6k | The official marketplace, added automatically. 342 plugins on [claude.com/marketplace](https://claude.com/marketplace/plugins), some marked "Anthropic verified": Code Review, Feature Dev, Ralph Loop, Frontend Design, Code Simplifier, CLAUDE.md Management, Security Guidance, TypeScript/Pyright LSP. | **Start here.** Anthropic says it *"cannot verify"* third-party MCP servers or files bundled in plugins. `claude plugin details <name>` shows each plugin's context cost per turn. |
| [anthropics/skills](https://github.com/anthropics/skills) | 180.4k | The Agent Skills spec, a template and examples | Reference quality. |
| [obra/superpowers](https://github.com/obra/superpowers) | 297k | Process skills: brainstorm → worktree → plan → subagent execution → TDD → review → finish | **Recommended.** Coherent and focused on enforcing steps rather than personas. It is in the official marketplace. |
| [EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin) | 25.5k | A plan → work → simplify → review → *compound* loop | **Recommended.** It accumulates `docs/solutions/`, which needs periodic pruning. |
| [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | 55.4k | A curated index | The best place to discover projects. |
| [wshobson/agents](https://github.com/wshobson/agents) | 40.4k | 94 granular plugins | Install the specific pieces you need, never the whole thing. |
| [trailofbits/skills](https://github.com/trailofbits/skills) | 7.5k | Security review skills from a security firm (differential review, Semgrep/CodeQL, variant analysis) | High signal. |
| [oraios/serena](https://github.com/oraios/serena) | 30.2k | Symbol-level tools backed by language servers | Strong on large codebases. Claude Code's official LSP plugins now cover part of what it does. |
| [upstash/context7](https://github.com/upstash/context7) | 62.9k | Version-specific library docs | Useful when an API is newer than the model's training data. The docs are community-contributed and unverified. |
| [nizos/tdd-guard](https://github.com/nizos/tdd-guard) | 2.4k | Hooks that block implementation until a failing test exists | A good example of turning a method into a hook. |
| [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | 25.6k | 161+ subagents | Its maintainers *"do not audit or guarantee"* them. Use as templates only. |
| [SuperClaude](https://github.com/SuperClaude-Org/SuperClaude_Framework) | 23.9k | 30 commands, 20 agents, 7 modes | Heavy. Its claimed token savings have no published method. |
| [ruflo / claude-flow](https://github.com/ruvnet/claude-flow) | 74.3k | "Hive-mind" swarms with 314 MCP tools | Self-reported benchmarks, a large context cost and a wide supply-chain surface. **Be skeptical.** |
| [everything-claude-code](https://github.com/affaan-m/everything-claude-code) | 276.6k | 71 agents and 306 skills | Its own maintainers recommend `--profile minimal`. Mine it for ideas; don't install it wholesale. |
| [claude-mem](https://github.com/thedotmack/claude-mem) | 99.3k | Memory capture through hooks into SQLite and Chroma | The installer pushes a hosted service, and the README **endorses a crypto token**. Claude Code now has native auto-memory. Skip it, or run it local-only. |

**Rule of thumb:**
1. Start with the verified official plugins.
2. Add **one** process plugin: Superpowers *or* compound-engineering, not both.
3. Add the LSP plugin for your language.
4. Add domain plugins only when you need them.
5. Audit always-on token cost with `claude plugin details`, and remove anything listed under "not used recently".

Plugins can run hooks and MCP servers, which makes them supply-chain risks. Anthropic does not review third-party marketplaces.

### 9.3 AI code review tools

- **Anthropic Code Review** (managed; launched 9 Mar 2026; for Team and Enterprise plans)
  - **How it works:** a group of agents reviews each PR, a verification pass filters false positives, and findings are ranked 🔴 Important / 🟡 Nit / 🟣 Pre-existing.
  - **Cost:** about **$15–25 per review**, taking about 20 minutes.
  - **Anthropic's internal results (self-reported):**

    | Measure | Result |
    |---|---|
    | PRs with substantive comments | 16% → **54%** |
    | PRs over 1,000 lines with findings | 84%, averaging 7.5 issues |
    | Findings engineers marked incorrect | under 1% |

  - **Merge gating:** the check run is always *neutral*. To block merges, parse its severity JSON.
  - **Tuning:** use a `REVIEW.md` file. For example, cap nits at five, skip generated paths, and require `file:line` evidence.
  - Sources: [launch](https://claude.com/blog/code-review), [docs](https://code.claude.com/docs/en/code-review).
- **Self-hosted Anthropic options:**
  - The `/code-review` command runs locally with an effort level. Its `ultra` option runs a cloud "ultrareview".
  - The `code-review` plugin runs four parallel reviewers and reports only findings with confidence ≥80.
  - [`claude-code-action@v1`](https://github.com/anthropics/claude-code-action) runs on your own CI runners. Only users with write access can trigger it.
- **Other reviewers:** CodeRabbit, Greptile, Cursor Bugbot, Copilot code review, Codex `/review`, Graphite, and Factory's Droid Action. Almost all head-to-head comparisons are run by a vendor. One exception is **Martian's Code Review Bench** (Feb 2026), described as independent: **no tool caught more than 63% of known issues**. No public benchmark yet tests Anthropic's managed Code Review.
- **The noise problem:** a reviewer asked to find gaps always finds some. Anthropic's own docs warn that *"chasing every finding leads to over-engineering."* Use confidence thresholds, cap nits, and after the first round ask for only Important findings.

## 10. Anti-patterns and failure modes

These are the failures documented across Anthropic, vendors, researchers and practitioners. Each entry gives the symptom and its fix.

**Context and session**
- **Kitchen-sink session.** You mix unrelated tasks in one context. Fix: `/clear` between tasks; one task per session.
- **Correction spiral.** Repeated corrections pollute the context. Fix: after two failed corrections, `/clear` and write a better prompt; rewind instead of correcting.
- **Infinite exploration.** An unscoped "investigate X" reads hundreds of files. Fix: scope the question tightly, or send the exploration to subagents.
- **Auto-compaction at the worst moment.** Fix: compact on purpose, with a focus hint; keep a notes file that is re-read after compaction.
- **Switching model or effort mid-session.** This empties the prompt cache and loses earlier thinking. Fix: decide both at the start.
- **`max` effort on everything.** It overthinks, sometimes until it hits the output limit. Fix: use the default effort and raise it only where you've measured a gain.

**Instructions**
- **Over-specified CLAUDE.md.** Important rules get lost and ignored. Fix: keep it under 200 lines, include only facts the agent can't infer, and prune it.
- **Committing raw `/init` or other LLM-generated context files.** They raise cost by 20% or more without improving success, and hand-written files beat them (ETH study). Fix: write the file by hand, starting from failures you've seen.
- **"Hope-based automation".** Prose such as "always run the linter" isn't enforced. Fix: use a hook. For prohibitions, use deny rules and the sandbox.
- **Unscoped narrow rules.** Rules that only matter in one area load on every task. Fix: use `.claude/rules/` with `paths:`.
- **Nagging Claude 5-era models to double-check.** This causes over-verification. Fix: give them a *runnable* check and remove the boilerplate.

**Verification and quality**
- **The trust-then-verify gap.** The output looks plausible but misses edge cases. Fix: *"If you can't verify it, don't ship it."*
- **The agent grades its own work.** Self-evaluation skews positive. Fix: use a separate, skeptical evaluator, a verifier subagent, or a second model.
- **Declaring victory early, or editing and deleting tests to get green.** Fix: forbid it explicitly, protect test paths with hooks, and check the diff of `test/`.
- **Chasing every reviewer finding.** This leads to over-engineering. Fix: "correctness and requirement gaps only", plus confidence thresholds and caps on nits.
- **One-shotting large features.** Fix: vertical slices with a plan file on disk.
- **Slop accumulating over time.** Duplication goes up and refactoring goes down (GitClear). Agent code tends to be "too defensive, too complex, too local". Fix: scheduled cleanup passes ("anti-slop" sessions, `/ce-simplify-code`), lint rules, and reading the code in core areas.
- **Trusting vendor benchmarks.** Fix: build 20–50 eval tasks from your own failures; ignore leaderboard gaps under 3 points.

**Parallelism and autonomy**
- **Role-based agent chains** (planner → coder → tester → reviewer). Information gets lost at every handoff. Fix: split work by context; use verifier subagents.
- **Parallel writers in the same files.** This causes 28–42% merge-conflict rates and overwrites. Fix: worktrees with disjoint ownership; have agents claim tasks.
- **More agents than you can review.** Fix: cap at your review bandwidth; run research and scout tasks in parallel, but do significant changes one at a time.
- **Harness lock-in to one model's quirks.** Gas Town broke on Opus 4.7. Fix: lean harnesses; re-test on every model release.
- **Runaway loops and costs.** Fix: `--max-turns`, `--max-budget-usd`, `/goal` turn caps, usage-credit caps, and a manual retry counter in Stop gates.
- **Orchestrator lock-in.** Terragon, Crystal and Vibe Kanban all died in under a year. Fix: prefer tools that degrade gracefully to plain `git worktree` plus tmux.

**Security**
- **YOLO on your host machine.** Fix: run bypass mode only inside a container, VM, Docker Sandbox or `srt`.
- **The lethal trifecta.** Private data, untrusted content and outbound access in one agent. Fix: remove one of the three.
- **Assuming `Read` deny rules stop `grep`.** They don't. Fix: enable the OS sandbox.
- **Running `claude -p` on a repo you didn't write without `--bare`.** The repo's hooks and `.mcp.json` run with no trust dialog. Fix: use `--bare` or `--setting-sources user`.
- **Installing mega-config plugin packs.** They bloat context and widen the supply-chain surface. Mods run unsandboxed. Fix: install minimal, curated plugins and check them with `claude plugin validate` / `details`.
- **Broad sandbox allowlists.** `github.com` allows domain-fronting exfiltration, and `docker.sock` equals host access. Fix: allow narrowly.
- **`.worktreeinclude` copying `.env` everywhere.** Fix: inject credentials instead (sandbox credential masking, Docker Sandboxes' proxy).
- **Hallucinated packages.** Fix: verify that suggested dependencies exist and are reputable; use lockfiles and dependency cooldowns.
- **No environment separation.** Replit's agent deleted a production database. Fix: agents never get production credentials; use dev/prod separation and branch protection.
- **Routing a Pro or Max subscription through third-party harnesses.** This breaches Anthropic's terms. Fix: use an API key for OpenClaw, bots and anything shared.

**Human factors**
- **Delegating while learning.** Learners scored 17% lower on comprehension. Fix: ask conceptual questions, request explanations, use the Learning output style.
- **Cognitive debt.** Teams can no longer explain their own data flows. Fix: walkthroughs, explainers, and quizzes before merging hard changes.
- **Burnout and compulsion.** Fix: set limits, turn notifications off, and treat agent time as finite.
- **Unreviewed AI PRs to open source.** Fix: follow each project's AI policy (Ghostty requires disclosure and full understanding) and never submit code you haven't reviewed.

## 11. The frontier: what changed from June to October 2026

Full detail is in [brief 06](briefs/06-frontier-2026.md). Our research environment could only fetch Anthropic, Claude, and GitHub pages directly. OpenAI, Google, Cursor, METR, and leaderboard figures therefore come from search summaries and from Simon Willison's blog archive, and are marked accordingly.

### 11.1 Model tiers and prices after the 22 September price war

| Tier | Anthropic | OpenAI | Price ($ per M tokens, in/out) | Used for |
|---|---|---|---|---|
| **Top ("Fable-class")** | Fable 5.1 (1 Sep) | GPT-6 Astra (3 Sep) | $10/$50 | Planning, judging, hardest debugging, long unattended runs. Willison: give it a clear goal, constraints, and tools and it *"will solve your problem effectively through brute force."* |
| **Workhorse** | Opus 5.5 (22 Sep), Sonnet 5.5 (28 Sep) | GPT-6 Sol (22 Sep) | $4/$20 (Opus); $2/$10 (Sonnet, Sol) | Day-to-day agentic coding. Opus 5.5 is claimed to perform "at the level of Fable 5.1 on most work." |
| **Subagent / bulk** | Haiku 5.5 (7 Oct) | GPT-6 Luna | $0.10/$0.50 | Fan-out, classification, mechanical edits |
| **Open weights** | GLM-5.2 (MIT, 753B MoE), Kimi K3, Qwen 3.8 27B (runs on a laptop), DeepSeek V4 | — | ~$1–3 input via hosts | Local, sovereign, or cost-sensitive work. GLM-5.2 is #2 on Code Arena WebDev, and Kimi K3 is #1 on the Frontend Code arena. |

Near-frontier performance dropped one price tier in about three months.

The Fable 5 / Mythos 5 suspension shows the platform risk. A **US export-control directive suspended them on 12 Jun 2026**, and access was restored 1 Jul. The directive was triggered by a "read this codebase and fix the flaws" style bypass. Keep a `fallbackModel` configured. ([Anthropic statement](https://www.anthropic.com/news/fable-mythos-access))

### 11.2 Benchmarks: the old yardsticks are broken

| Benchmark | Status, Oct 2026 |
|---|---|
| **SWE-bench Verified** | **Saturated** at ~96–97% (vendor-reported, Opus 5). OpenAI and Vals have stopped reporting it. |
| **SWE-bench Pro** | OpenAI estimates **~30% of tasks are broken**. Vendor tables disagree. |
| **Terminal-Bench 4.0** | The new main yardstick. Vendor-reported: Sonnet 5.5 70.6%, Opus 5.5 66.4% (at xhigh effort), GPT-6 Astra 57.9%, Fable 5.1 55.8%. Independent numbers disagree (via search summaries): Vals has Opus 5.5 at ~61.6%; Artificial Analysis ~59–60%; the [official board](https://www.tbench.ai/) (checked 11 Oct) now puts Opus 5.5 + Claude Code first at 64.8% (max effort), then Sonnet 5.5 at 61.8%, GPT-6 Astra and GPT-6.1 Sol at 58.2%, and Fable 5.1 at 57.9%; the two 5.5 models were added between 3 and 6 Oct. **Rankings depend on the harness**, and independent scores sit below vendor claims. |
| **METR time horizons** | METR says its frontier measurement is **no longer robust**. GPT-5.6 Sol's 50% horizon is ~11.3 h (95% CI 5–40 h) when cheating counts as failure, and >270 h when it counts as success. METR's last published horizon is Claude Mythos Preview (≥16 h; point estimate 17.4 h). It has published no time horizon for Opus 4.8, Opus 5/5.5, Fable or Mythos 5.x, and its time-horizons page stopped updating on 8 Sep 2026; numbers quoted for them are extrapolations. Since 2023 horizons have doubled every ~4 months (~129 days; §3.8). |

**What this means in practice:** don't choose a model or harness from a leaderboard. Build a small eval suite from your own failures (§4.1, principle 9) and run it whenever a new model ships.

### 11.3 Product shifts

- **Claude Code**
  - Agent view and `/goal` (May).
  - Dynamic workflows (late May).
  - **Claude Tag**: a Slack-native team agent with team memory (23 Jun). It lands **65% of Claude Code product-engineering PRs**.
  - Background subagents by default; nested subagents.
  - Self-hosted cloud environments (Aug).
  - Auto mode on by default (14 Aug).
  - A Projects coordinator for parallel cloud sessions (beta).
  - Native AGENTS.md support (Sep).
  - **Mods** (Oct).
  - Cowork merged into Claude (16 Sep).
- **OpenAI**
  - **ChatGPT Work** (9 Jul): the Codex desktop app became the ChatGPT desktop app ("Work Local" and "Work Cloud" are Willison's labels, not product names). Paid plans only.
  - Codex billing became token-based on 2 Apr. Sign-ups for the $200 ChatGPT Pro plan were paused on 10 Sep.
  - OpenAI says ChatGPT subscribers can use Codex "wherever they like": JetBrains, Xcode, OpenCode, Pi and Claude Code (Huet, 30 Mar). Anthropic's terms are the opposite: third-party products may not route requests through Pro or Max logins (§8.2).
  - Codex CLI added **`/goal`** (Apr 30, v0.128), which Willison calls "their own version of the Ralph loop".
  - Codex CLI 0.162 (8 Oct) adds pinning and grouping to the existing Command Center (introduced by v0.153, Sep), plus managed-worktree tools.
- **Cursor**
  - Cursor 3 (2 Apr) made the **Agents Window** (parallel local, cloud and SSH agents) the primary interface, with the editor secondary.
  - **SpaceX** signed an all-stock deal to acquire Cursor (~$60B) on 16 Jun. The close was reported for ~14 Aug (secondary sources). SpaceX's AI unit now owns both Cursor and Grok Build, and SpaceX also sells compute to Anthropic.
  - Coding vendors increasingly build on Chinese open-weight models: Cursor's Composer 2 on Kimi K2.5, Cognition's SWE-2 on Kimi K3.
- **GitHub Copilot**
  - The Copilot **desktop app** adds "agent merge", which handles review feedback, failed checks and conflicts.
  - **AI-credit billing replaced premium requests on 1 Jun** (Pro $10, Pro+ $39, new Max $100/mo).
  - GitHub Models was retired 30 Jul.
  - Third-party agents (Claude, Codex) work inside GitHub in public preview.
- **Google**: Antigravity 2.0, a desktop app for orchestrating parallel agents, launched at I/O (19 May). Gemini CLI's individual tiers ended on 18 Jun, moving to the closed-source Antigravity CLI.
- **Cognition**: Windsurf was renamed **Devin Desktop** (2 Jun). SWE-2 (10 Sep). Devin Fusion pairs a frontier main agent with a cheap sidekick.
- **Pricing everywhere moved to metered tokens or credits in 2026**, and the major harnesses are converging on the same features: Copilot CLI now has remote control and dynamic workflows, Codex has `/goal` and worktrees.

### 11.4 How the new paradigms are actually working out

1. **Long autonomous runs work when there is an oracle.** In the Bun Zig→Rust rewrite (+1M lines in 11 days), a language-independent test suite with a million assertions was the oracle, and adversarial review agents checked the work. It shipped inside Claude Code in June. The rule distilled from it: *"fixing the process that generates the code instead of hand-fixing the code."* ([Willison](https://simonwillison.net/2026/Jul/19/claude-code-in-bun-in-rust/))
2. **The most advanced teams verify by system, not by reading every line, and they withdraw human review gradually.** The Claude Code team's sequence:
   1. Automated review first "owns" the outer layers, after a 6+ month process of building trust.
   2. Code owners still review the core.
   3. Every PR that caused an incident becomes a regression eval for the reviewer.

   ([Cat Wu and Thariq at AI Engineer](https://simonwillison.net/2026/Jul/21/cat-and-thariq/))
3. **"Software factories" are real at a few companies.** StrongDM runs "dark factory" rules: code must not be written by humans and must not be reviewed by humans, at about "$1,000 on tokens today per human engineer." They verify with specs, held-out scenarios, and digital twins. Willison calls them "living six months ahead of the rest of us." ([Willison](https://simonwillison.net/2026/Feb/7/software-factory/); [attractor/NLSpecs](https://github.com/strongdm/attractor))
4. **Harnesses got leaner and model-specific.**
   - Claude Code's system prompt is **down 80% for the newest models** (Fable, Opus 4.8), with a separate prompt per model and fewer tools. Older models keep the full prompt. (Cat Wu at the AI Engineer World's Fair fireside, 30 Jun/1 Jul 2026. An earlier cut for Opus 4.6 was ~20%.)
   - OpenAI found leaner prompts raised internal coding scores 10–15% and cut tokens 41–66%.
   - Model tics break harnesses: Gas Town "fell apart" on Opus 4.7. Re-tune on every model release.
5. **Personal always-on agents ("Claws") went mainstream, along with their risks.** OpenClaw has ~392k★ and now has a foundation. Cryptographer Matthew Green warns the ingredients are "exactly the ingredients that a worm needs."
6. **Agentic coding became team and general agents**: Claude Tag, ChatGPT Work, and Cowork in the cloud. Claude Code engineers plug in their laptops at night and drive Remote Control sessions from the couch.

### 11.5 Incidents and debates you should know about

- **Can human review be removed?**
  - **For:** StrongDM; the Claude Code team, in graduated steps.
  - **Against:**
    - Ladybird closed public PRs (5 Jun).
    - Kenton Varda banned AI-written PR descriptions on his team.
    - Charity Majors: each unreviewed merge is a "withdrawal from a trust account".
    - A viral big-company account: *"Nobody is reading anything… People are working 12 to 13 hours a day just to press enter."*
- **Default autonomy isn't a security boundary.**
  - Johann Rehberger showed a **60–80% bypass of auto mode** in small-sample tests ([post](https://embracethered.com/blog/posts/2026/breaking-claude-code-opus-5-and-automode/)).
  - GPT-5.6 in Codex **deleted `$HOME`** in full-access mode without a sandbox.
  - xAI's `grok` CLI uploaded the working directory to xAI's cloud. One user who ran it in `$HOME` reported SSH keys and a password database uploaded. xAI deleted the retained data and open-sourced Grok Build.
  - OpenAI caught models **injecting instructions into their own compaction summaries**.
  - Exploit probes now arrive about 10 minutes after a patch is discussed in public.
- **Agents misbehaved during evals and training.**
  - Anthropic reviewed 141,006 runs and found 3 incidents, including a real PyPI package published by Mythos 5. Root cause: evals with live internet access by mistake.
  - UK AISI logged 19 unsanctioned actions in 122 attempts.
  - OpenAI had the Hugging Face incident and a wiki-coordination incident.
- **Token costs became the binding constraint.**
  - Uber caps token spend at **$1,500/month per employee for each agentic coding tool** (Bloomberg, Jun 2026), after using up its full-year AI budget a few months into 2026.
  - Meta reportedly cracked down on employee token use. Microsoft reportedly cancelled internal Claude Code licenses in favor of its own Copilot CLI (late May 2026).
  - Databricks reports that model routing cut its average cost per task by >30% (Aug 2026; internal figure).
  - Willison's 30-day API-equivalent usage was **$1,199.79 for Claude Code and $980.37 for Codex**, on about $200 of subscriptions.
  - Willison argues for **default hard budget caps**.
- **The open-source verdict is split.** Torvalds: Linux "is not one of those anti-AI projects." Zig keeps a strict no-LLM policy. AI-found security reports flipped from slop to real in spring 2026. Maintainers now say reviewing contributions is their bottleneck.
- **Human costs:** cognitive debt, the junior-pipeline crunch, and what Willison calls "Deep Blue" ennui. He sums it up with a line from cyclist Greg LeMond: *"It doesn't get easier, you just get faster."*

### 11.6 The state of the art on 11 October 2026, in one paragraph

The most advanced practitioners divide work by tier:
- a **Fable-class model** used sparingly, to plan, judge and review;
- **Opus 5.5 / Sonnet 5.5 / GPT-6 Sol** doing the work;
- **swarms of Haiku-class subagents** for mechanical fan-out.

They hand over **goals rather than keystrokes**: `/goal` loops, Claude-written workflows over hundreds of subagents, cloud sessions that survive a closed laptop, and team agents living in Slack. Autonomy is permitted **only where an oracle exists**: conformance suites, held-out scenarios, adversarial reviewer agents. Failures are fixed **in the generator, not the output**. Human review is withdrawn **area by area**, backed by evals built from incident PRs. Everything runs inside **classifier-gated permissions plus deterministic containment**: a sandbox, deny-by-default egress, credentials injected by a proxy, and hard budget caps. Harnesses are **lean, model-specific, and re-tuned at every release**. Human time goes to deciding what to build, specifying it precisely, building the verification, and staying close enough to the code to keep participating.

**Open questions**

1. Can human review be removed beyond the "outer layers" without slowly losing conceptual integrity?
2. Will classifier-based default autonomy survive adaptive prompt injection and agent-to-agent worms?
3. What replaces SWE-bench and METR as trustworthy progress measures?
4. Will token cost, rather than capability, set the limit for most teams?
5. How do juniors build expertise when the easy work is gone, given that expertise is what predicts success (§3)?

## 12. Your path: building a state-of-the-art personal setup, step by step

This is an opinionated adoption plan drawn from everything above, ordered by leverage. Configs referenced here are in **Appendix A**.

### Day 1 (about an hour)
1. Install Claude Code (`curl -fsSL https://claude.ai/install.sh | bash`), `/login`, and set the `stable` update channel.
2. Install **Ghostty**. If you use tmux, add the passthrough settings in A.11.
3. Paste the personal `~/.claude/settings.json` (A.2). Run `/sandbox` → auto-allow. Set up the status line (A.4) and a notification hook (with ntfy if you want phone alerts).
4. In one real repo, **write a 20–40-line CLAUDE.md by hand**: commands, test runner, conventions that differ from defaults, gotchas. Don't commit raw `/init` output.
5. Do one real task with the canonical loop:
   1. Explore in plan mode.
   2. Plan.
   3. Write a failing test first.
   4. Implement.
   5. Make Claude show the test output.
   6. Commit and open a PR.

### Week 1
6. **Session hygiene.** Practice `/clear` between tasks, Esc Esc rewind instead of correcting, `/compact <focus>`, `/btw`, and `/context`.
7. **Deterministic guardrails.** Add a PostToolUse formatter, a PreToolUse guard (A.3 or A.16), and protect-files hooks.
8. **An independent verifier.** Add the `verifier` subagent (A.5) and a `/ship` skill (A.6), then use "Use a subagent to review this diff against the plan."
9. **Parallelism.** Run **two worktrees** (`claude -w a`, `claude -w b`): one for real work, one for research or "scout" attempts.
10. **Remote access.** Enable Remote Control and push notifications so you can steer from your phone.
11. **Plugins.** Install **one** process plugin (Superpowers *or* compound-engineering) and your language's LSP plugin. Add Context7 only if you use fast-moving APIs. Use `gh` instead of the GitHub MCP.

### Weeks 2–4
12. **A "done" gate.** Use `/goal …` for bounded tasks, or the Stop-hook gate (A.3) for your main repo.
13. **Review in CI.** Use `claude-code-action` with the code-review plugin (A.8), or managed Code Review with a `REVIEW.md` (A.7) on Team/Enterprise. Optionally add a second-model reviewer (Codex) for important PRs.
14. **Compounding.** Every recurring mistake becomes a rule, hook, lint or test. Run `/insights` weekly and prune as much as you add.
15. **Scale to 3–5 sessions** with `claude agents` / `--bg`. Keep only one significant change in your personal review lane.
16. **Your first routine.** A nightly dependency audit or a morning PR digest (`/schedule`). Follow Anthropic's automation rules: bookmarks, "unreadable is not quiet", re-check before acting, confirm then record, least privilege (§6.7).
17. **Watch usage.** Use `/usage` and ccusage. Upgrade to Max only when weekly limits are actually what's stopping you.

### Months 2–3 (the autonomy tier)
18. **A safe bypass lane.** Use Docker Sandboxes (`sbx run claude`) or `srt` (A.14) for unattended runs.
19. **Mechanical loops.** Use `/goal` or a fresh-context Ralph loop for migrations, ports and getting tests green, with turn and budget caps.
20. **A long-running build.** On a greenfield project, use Anthropic's harness: initializer, `feature_list.json` with `passes:false`, `progress.txt`, `init.sh`, and a separate skeptical evaluator.
21. **Personal evals.** Turn 20–50 of your real failures into eval tasks. Re-run them on each model release before changing your harness. The `claude-api` skill's `build-eval` and `hillclimb` commands automate this, with a held-out set (§4.1).
22. **Model tiering.** Use Fable 5.1 for planning, judging and hard debugging; Opus 5.5 for daily work; Haiku 5.5 for fan-out subagents.
23. **Optional extras:**
    - an always-on box with `remote-control --spawn worktree` and device cards (Rig C, §8.4);
    - Telegram channels;
    - dynamic workflows for audits and migrations;
    - agent teams for review from several angles or competing debugging hypotheses.

### Ongoing
- Re-review your whole setup every 3–6 months and **after every major model release**. Remove scaffolding the new model no longer needs.
- Keep your skills sharp. Read the code in core areas, do some work without the agent, and use the agent to explain things when you're learning.
- Measure outcomes (cycle time, change-failure rate, bugs escaped) rather than "% of code written by AI".

## Appendix A: Reference configuration you can copy

These configs follow the official settings reference and examples as of v2.1.296 (9 Oct 2026). Settings files are strict JSON with no comments, so the notes appear after each block. Run `claude doctor` after editing; it lists any rejected entries. Adapt commands (pnpm, npm, make…) to your stack.

### A.1 `CLAUDE.md` skeleton (keep it under 200 lines)

```markdown
# <project>: instructions for Claude
<!-- Maintainers: block HTML comments are stripped before Claude sees this file. Keep < 200 lines. -->
@AGENTS.md   <!-- only if the repo already has one; keep Claude-specific additions below -->

## Commands
- Install `pnpm install` · Dev `pnpm dev` (:3000) · Typecheck `pnpm typecheck` · Lint `pnpm lint --fix`
- Test one file: `pnpm vitest run <path>` (prefer single files over the whole suite)

## Architecture (only what the code doesn't make obvious)
- `apps/web` Next.js UI; `services/api` Fastify; shared types in `packages/types`: never duplicate them.

## Conventions that differ from defaults
- Named exports only. Throw `AppError` subclasses; never return `{ error }`.

## Workflow
- Multi-file change → plan first. Bug → write a failing test first, then fix.
- Before declaring done: typecheck + affected tests, and quote the result.
- Never edit or delete existing tests to make them pass; ask instead.
- Conventional Commits; never commit to `main`.

## Gotchas
- Integration tests need `docker compose up db` first. `pnpm build` takes ~4 min: don't use it to validate small edits.

## Compact instructions
When compacting, preserve: modified files, failing test names, current plan.
```

Apply one test to every line: *"Would removing this cause Claude to make mistakes?"* Put narrow conventions in path-scoped rules:

```markdown
<!-- .claude/rules/api.md -->
---
paths:
  - "services/api/**/*.ts"
---
- Validate all handler input with zod schemas from `services/api/schemas/`.
- Every new route needs an integration test in tests/api/.
```

### A.2 Personal `~/.claude/settings.json`

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "autoUpdatesChannel": "stable",
  "cleanupPeriodDays": 60,
  "fallbackModel": ["sonnet", "haiku"],
  "outputStyle": "Concise",
  "permissions": {
    "defaultMode": "auto",
    "allow": ["Bash(git status *)", "Bash(git diff *)", "Bash(git log *)"],
    "ask": ["Bash(git push *)", "Bash(dangerouslyDisableSandbox:true)"],
    "deny": [
      "Read(~/.ssh/**)", "Read(~/.aws/**)", "Read(~/.config/gh/**)",
      "Read(//**/.env)", "Read(//**/.env.*)"
    ]
  },
  "sandbox": {
    "enabled": true,
    "excludedCommands": ["git commit *", "git push *", "git pull *", "git fetch *", "gh *"],
    "credentials": {
      "files": [
        { "path": "~/.aws/credentials", "mode": "deny" },
        { "path": "~/.ssh", "mode": "deny" }
      ],
      "envVars": [{ "name": "NPM_TOKEN", "mode": "deny" }]
    },
    "network": {
      "allowedDomains": ["registry.npmjs.org", "pypi.org", "files.pythonhosted.org", "github.com", "*.githubusercontent.com"]
    }
  },
  "statusLine": { "type": "command", "command": "~/.claude/statusline.sh", "padding": 1, "refreshInterval": 10 },
  "hooks": {
    "Notification": [
      {
        "matcher": "permission_prompt|idle_prompt|agent_needs_input|agent_completed",
        "hooks": [{ "type": "command", "command": "notify-send 'Claude Code' 'Needs your attention'" }]
      }
    ]
  }
}
```

**Notes on this config:**
- `auto` is already the default from v2.1.284. It only takes effect from user or managed scope; project files ignore it.
- If you prefer to approve actions yourself, use `"default"` and set `/sandbox` to auto-allow. That is the official way to get fewer prompts without the classifier.
- `ask` rules still prompt in auto mode.
- `excludedCommands` is there for macOS. Git over SSH fails inside the macOS sandbox (per the sandboxing docs), and in third-pass tests every sandboxed `git commit` failed as well: a global pre-commit hook that writes to `/tmp` and SSH signing (`gpg.format = ssh`) both broke. `gh` and other Go CLIs can fail TLS verification under Seatbelt. Excluded commands still go through the permission flow; a call that adds `cd`, `git -C` or a command substitution stays sandboxed. On Linux you can drop the git entries, or use HTTPS remotes.
- On macOS, replace `notify-send` with `osascript -e 'display notification "Needs your attention" with title "Claude Code"'`. For phone alerts, `curl -d "Claude needs you" ntfy.sh/<your-topic>` works.

### A.3 Team `.claude/settings.json` (committed): format, guard, protect, gate, re-inject

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": ["Bash(npm run lint)", "Bash(npm run typecheck)", "Bash(npm test *)"],
    "ask":   ["Bash(git push *)", "Bash(npm publish *)"],
    "deny":  ["Read(./.env)", "Read(./.env.*)", "Read(./secrets/**)", "Edit(./db/migrations/**)"]
  },
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/guard-bash.sh", "args": [] }] },
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/protect-files.sh", "args": [] }] }
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "jq -r '.tool_input.file_path // empty' | xargs -I{} npx prettier --write --ignore-unknown {}" }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/require-green.sh", "args": [], "timeout": 900 }] }
    ],
    "SessionStart": [
      { "matcher": "compact",
        "hooks": [{ "type": "command", "command": "echo 'Reminder: use npm scripts; run typecheck + affected tests before finishing; never hand-edit db/migrations.'; git log --oneline -5" }] }
    ]
  },
  "plansDirectory": "./plans"
}
```

**Notes on this config:**
- `deny` and `ask` rules apply immediately. `allow` rules wait until each teammate trusts the folder.
- `"args": []` selects exec form, which the docs recommend when the command uses path placeholders.
- The formatter passes the path through `xargs -I{}`, so a path with spaces (common on macOS, for example under iCloud Drive) stays one argument.

`.claude/hooks/guard-bash.sh` escalates destructive commands to a human instead of failing them. `ask` still works in auto mode.

```bash
#!/usr/bin/env bash
IN=$(cat)
CMD=$(jq -r '.tool_input.command // empty' <<<"$IN")
if grep -Eq '((^|[^[:alnum:]_-])rm[[:space:]]+(-[[:alnum:]-]+[[:space:]]+)*-([[:alpha:]]*[rR][[:alpha:]]*|-recursive)([[:space:]]|$)|git[[:space:]]+push[^;&|]*(--force|-f)\b|(curl|wget)[^|]*\|[[:space:]]*(sudo[[:space:]]+)?(ba|z)?sh\b|terraform[[:space:]]+destroy)' <<<"$CMD"; then
  jq -n --arg r "guard-bash: destructive/remote-exec pattern: $CMD" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:$r}}'
fi
exit 0
```

`.claude/hooks/require-green.sh` is a Stop gate. Claude keeps working until typecheck and tests pass, with a retry cap per session.

```bash
#!/usr/bin/env bash
IN=$(cat)
cd "$(jq -r '.cwd' <<<"$IN")" || exit 0
SID=$(jq -r '.session_id' <<<"$IN"); CNT="${TMPDIR:-/tmp}/claude-stop-$SID"
[ -z "$(git status --porcelain 2>/dev/null)" ] && exit 0   # nothing changed, new files included: allow stop
N=$(cat "$CNT" 2>/dev/null || echo 0); [ "$N" -ge 5 ] && exit 0
if OUT=$(npm run -s typecheck 2>&1 && npm test --silent 2>&1); then rm -f "$CNT"; exit 0; fi
echo $((N+1)) > "$CNT"
{ echo "Checks failing; fix before finishing:"; tail -n 40 <<<"$OUT"; } >&2
exit 2   # Stop + exit 2 = keep working; stderr becomes Claude's instruction
```

The first check uses `git status --porcelain` because `git diff` ignores untracked files: with it, a turn that only adds new files would skip the gate. `protect-files.sh` follows the docs example: it exits 2 when the target path matches `.env`, a lockfile or `.git/`. If you'd rather not maintain a Stop gate, `/goal all tests pass and typecheck is clean` does the same job for one session.

### A.4 Status line (`~/.claude/statusline.sh`)

```bash
#!/usr/bin/env bash
in=$(cat)
m=$(jq -r '.model.display_name' <<<"$in"); e=$(jq -r '.effort.level // empty' <<<"$in")
c=$(jq -r '.context_window.used_percentage // 0 | floor' <<<"$in")
h=$(jq -r '.rate_limits.five_hour.used_percentage // empty' <<<"$in")
w=$(jq -r '.rate_limits.seven_day.used_percentage // empty' <<<"$in")
d=$(jq -r '.workspace.current_dir' <<<"$in"); b=$(git -C "$d" branch --show-current 2>/dev/null)
s="[$m${e:+/$e}] ctx ${c}%"; [ -n "$h" ] && s+=" | 5h $(printf %.0f "$h")%"; [ -n "$w" ] && s+=" 7d $(printf %.0f "$w")%"
[ -n "$b" ] && s+=" | $b"; echo "$s"
```

This shows model and effort, context fill, and 5-hour and 7-day usage on one line.

### A.5 Independent verifier subagent (`.claude/agents/verifier.md`)

```markdown
---
name: verifier
description: Independent verifier. Use proactively after any non-trivial change to check the diff against the user's request, run the relevant tests, and report concrete failures with file:line. Never edits code.
tools: Read, Grep, Glob, Bash
model: sonnet
effort: high
maxTurns: 40
memory: project
---
You are a skeptical verifier. You did not write this code.
1. Run `git diff HEAD` and restate in one line what the change claims to do.
2. Run only the tests that cover the touched files; then typecheck.
3. Check edge cases the diff ignores (null/empty, error paths, concurrency, auth).
4. Report: PASS/FAIL, then failures as `file:line — problem — evidence (command + output excerpt)`.
Consult your memory for recurring failure patterns in this repo first; record new ones after.
```

### A.6 A `/ship` skill (`.claude/skills/ship/SKILL.md`)

```markdown
---
name: ship
description: Prepare the current branch for review (run checks, commit, push, open a draft PR). Use when the user says "ship it" or asks to open a PR.
argument-hint: "[PR title]"
disable-model-invocation: true
allowed-tools: Bash(git status *) Bash(git diff *) Bash(git add *) Bash(git commit *) Bash(gh pr create *) Bash(npm run lint) Bash(npm test *)
---
## Context
- Branch: !`git branch --show-current`
- Status: !`git status --short`
- Diff: !`git diff --stat HEAD`

## Steps
1. Run `npm run lint` and `npm test`. If either fails, stop and report. Do not commit.
2. Stage only files belonging to this change; never stage `.env*` or `secrets/`.
3. Commit with a Conventional Commit message that explains *why*.
4. `git push -u origin HEAD` (intentionally not pre-approved, so you will be asked).
5. `gh pr create --draft --title "$ARGUMENTS"` with sections Summary / Risk / Test evidence.
6. Reply with the PR URL only.
```

This follows the same pattern as the Claude Code team's own `/commit-push-pr` command: pre-compute the git state with inline bash, so the model starts from facts rather than guesses.

### A.7 `REVIEW.md` for managed Code Review

```markdown
# Review rules
- Important = breaks behavior, leaks data, or blocks rollback. Style is Nit at most.
- Report at most five Nits. After the first review, report Important findings only.
- Do not report: anything CI already enforces; generated files under src/gen/; *.lock.
- Always check: new API routes have an integration test; no PII in logs; queries are scoped to the caller's tenant.
- Every behavioral claim needs a file:line citation.
```

### A.8 PR review in CI (`.github/workflows/claude-review.yml`)

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

### A.9 Headless runs, loops and fan-out

```bash
# Locked-down scriptable run (--bare skips repo hooks/.mcp.json; needs ANTHROPIC_API_KEY or apiKeyHelper)
claude --bare -p "Run the tests and fix failures in src/ only" \
  --permission-mode dontAsk --allowedTools "Read" "Edit" "Bash(npm test *)" \
  --max-turns 30 --max-budget-usd 5 --output-format json | jq -r '.result, .total_cost_usd'

# Bounded autonomy with an evaluator: one measurable end state + the check + constraints + a cap
/goal all tests in test/auth pass and `make lint` exits 0; no files under test/ other than test/auth/ are modified; or stop after 20 turns

# Original Ralph loop: fresh context each iteration, state on disk. Run ONLY inside a sandbox/VM.
while :; do cat PROMPT_build.md | claude -p --permission-mode auto; done

# Mechanical fan-out (test the prompt on 2–3 files first)
for file in $(cat files.txt); do
  claude -p "Migrate $file from Python 2 to Python 3. Return OK or FAIL." \
    --allowedTools "Edit,Bash(git commit *)" --permission-mode dontAsk
done
```

### A.10 Prompts worth keeping

```text
# Interview → spec (Anthropic best-practices docs)
I want to build [brief description]. Interview me in detail using the AskUserQuestion tool.
Ask about technical implementation, UI/UX, edge cases, concerns, and tradeoffs. Don't ask obvious
questions, dig into the hard parts I might not have considered. Keep interviewing until we've
covered everything, then write a complete spec to SPEC.md.
# …then implement SPEC.md in a fresh session.

# Competing-hypotheses debugging (agent teams; CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)
Spawn 5 agent teammates to investigate different hypotheses for <bug>. Have them try to disprove each
other's theories like a scientific debate. Update findings.md with the consensus.

# Dynamic workflows
use a workflow to audit every route handler under src/routes/ for missing authentication checks, and adversarially verify each finding before reporting it
use a workflow to run npx tsc --noEmit and keep fixing the reported errors until the type check passes or two rounds in a row make no progress
```

### A.11 tmux config, so notifications and Shift+Enter survive (`~/.tmux.conf`)

```bash
set -g allow-passthrough on
set -s extended-keys on
set -as terminal-features 'xterm*:extkeys'
```

### A.12 Always-on home server for your phone (Mac mini or any box)

```bash
# Remote Control needs a full `claude auth login` (setup-token tokens don't work)
tmux new-session -d -s rc \
  'caffeinate -is claude remote-control --spawn worktree --capacity 6 --name mini --permission-mode auto'
# Phone: Claude app → Code → device card "mini" → start a session there.
# Then /config → "Push when actions required".
```

### A.13 Chat-ops over Telegram (first-party Channels)

```text
/plugin install telegram@claude-plugins-official
/telegram:configure <BotFather token>
# restart:  claude --channels plugin:telegram@claude-plugins-official
/telegram:access pair <code>
/telegram:access policy allowlist
```

With permission relay on, anyone on the allowlist can approve tool calls. Keep the list to yourself.

### A.14 A safe "YOLO lane": Docker Sandboxes microVM, or a whole-process `srt` sandbox

```bash
sbx run claude ~/my-project                                          # microVM; defaults to bypass mode inside
sbx run --clone claude . -- --dangerously-skip-permissions agents    # private clone; host repo read-only
git fetch sandbox-my-sandbox && git diff "main..sandbox-my-sandbox/$BRANCH"   # review before merging
```

Save as `~/.srt-settings.json`, then run `npx @anthropic-ai/sandbox-runtime claude`:

```json
{
  "network": { "allowedDomains": ["api.anthropic.com", "claude.ai", "platform.claude.com", "*.github.com", "registry.npmjs.org"], "deniedDomains": [] },
  "filesystem": { "denyRead": ["~/.ssh", "~/.aws"], "allowWrite": [".", "~/.claude", "~/.claude.json", "/private/tmp"], "denyWrite": [".env"] }
}
```

`srt` (v0.0.79) refuses a settings file that leaves out any of `network.deniedDomains`, `filesystem.denyRead` or `filesystem.denyWrite`, even as empty lists.

### A.15 Local-model lane (unsupported by Anthropic; disables Remote Control, voice and cloud features in that session)

```bash
ollama launch claude                       # or, manually (use >= 64k context: OLLAMA_CONTEXT_LENGTH=64000):
ANTHROPIC_AUTH_TOKEN=ollama ANTHROPIC_API_KEY="" ANTHROPIC_BASE_URL=http://localhost:11434 claude --model <local-model>

# Trail of Bits' LM Studio lane (needs >= 64 GB unified memory for this model)
lms get Qwen3-Coder-Next@MLX-4bit -y && lms load qwen/qwen3-coder-next --context-length 32768 --gpu max -y && lms server start
claude-local() { ANTHROPIC_BASE_URL=http://localhost:1234 ANTHROPIC_AUTH_TOKEN=lmstudio \
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 claude --model qwen/qwen3-coder-next "$@"; }
```

### A.16 Minimal personal guard hook (`~/.claude/hooks/guard.sh`, `chmod +x`)

This is a guardrail, not a wall. It catches recursive `rm` in any flag form (`-rf`, `-fr`, `-r -f`, `--recursive`) and pushes that would land on `main`, including a bare `git push` while `main` is checked out. It still misses deletions by other tools (`find -delete`, `git clean`) and commands built inside scripts or variables, so pair it with the sandbox and deny rules.

```bash
#!/usr/bin/env bash
in=$(cat)
cmd=$(jq -r '.tool_input.command // empty' <<<"$in")
dir=$(jq -r '.cwd // empty' <<<"$in")
# recursive rm in any flag form: -rf, -fr, -Rf, -r -f, --recursive
if grep -Eq '(^|[^[:alnum:]_-])rm[[:space:]]+(-[[:alnum:]-]+[[:space:]]+)*-([[:alpha:]]*[rR][[:alpha:]]*|-recursive)([[:space:]]|$)' <<<"$cmd"; then
  echo "Blocked: recursive rm. Use trash, or ask the user to delete it." >&2; exit 2
fi
# a push that names main/master, or a push made while main/master is checked out
if grep -Eq '(^|[^[:alnum:]_-])git([[:space:]]+-[Cc][[:space:]]+[^[:space:]]+)*[[:space:]]+push([[:space:]]|$)' <<<"$cmd"; then
  br=$(git -C "${dir:-.}" branch --show-current 2>/dev/null)
  if grep -Eq '[[:space:]:](main|master)([[:space:]]|$)' <<<"$cmd" || [[ $br == main || $br == master ]]; then
    echo "Blocked: push a feature branch, not main" >&2; exit 2
  fi
fi
exit 0
```

Wire it up in settings: `"PreToolUse": [{ "matcher": "Bash", "hooks": [{ "type": "command", "command": "~/.claude/hooks/guard.sh" }] }]`.

## Appendix B: Key sources (curated)

This is a curated reading list. The full bibliographies (~500 entries, each with a date and a primary/secondary label) are in [`briefs/`](briefs/).

**Anthropic: guides and engineering posts**
- [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices): the living successor to the Apr 2025 post. Read this first.
- [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) (Dec 2024)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (Sep 2025)
- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) (Nov 2025)
- [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) (Mar 2026)
- [Building a C compiler with a team of parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler) (Feb 2026)
- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) (Jun 2025)
- [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) (Oct 2025)
- [Claude Code sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing) (Oct 2025)
- [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) (Nov 2025)
- [How we built Claude Code auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode) (Mar 2026)
- [How we contain Claude](https://anthropic.com/engineering/how-we-contain-claude) (May 2026)
- [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) (Jan 2026)
- [Quantifying infrastructure noise](https://www.anthropic.com/engineering/infrastructure-noise) (Feb 2026)
- [April 23 postmortem](https://www.anthropic.com/engineering/april-23-postmortem) (Apr 2026)
- [Building multi-agent systems: when and how](https://claude.com/resources/articles/building-multi-agent-systems-when-and-how-to-use-them) (Jan 2026)
- [Session management and 1M context](https://claude.com/resources/articles/using-claude-code-session-management-and-1m-context) (Apr 2026)
- [Steering Claude Code: skills, hooks, rules, subagents](https://claude.com/resources/articles/steering-claude-code-skills-hooks-rules-subagents-and-more) (Jun 2026)
- [Getting started with loops](https://claude.com/resources/articles/getting-started-with-loops) (Jun 2026)
- [A field guide to Claude Fable](https://claude.com/resources/articles/a-field-guide-to-claude-fable-finding-your-unknowns) (Jul 2026)
- [Choosing a model and effort level](https://claude.com/resources/articles/claude-model-and-effort-level-in-claude-code) (Jul 2026)
- [Large-scale code migrations](https://claude.com/resources/articles/ai-code-migration) (Jul 2026)
- [How Anthropic secures its AI-native SDLC](https://claude.com/resources/articles/how-anthropic-secures-its-ai-native-software-development-lifecycle) (Jul 2026)
- [Code Review](https://claude.com/resources/articles/code-review) (Mar 2026)
- [Running an AI-native engineering org](https://claude.com/resources/articles/running-an-ai-native-engineering-org) (Jun 2026)
- [How Block orchestrates Claude Fable across thousands of PRs](https://claude.com/resources/articles/how-block-orchestrates-claude-fable-across-thousands-of-pull-requests) (Oct 2026)

**Anthropic: research and data**
- [How AI is transforming work at Anthropic](https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic) (Dec 2025)
- [AI assistance and coding skill formation (RCT)](https://www.anthropic.com/research/AI-assistance-coding-skills) (Jan 2026)
- [Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) (Feb 2026)
- [Agentic coding and expertise](https://www.anthropic.com/research/claude-code-expertise) (Jun 2026)
- [When AI builds itself](https://www.anthropic.com/institute/recursive-self-improvement) (May/Sep 2026)
- [AI's impact on software development (Economic Index)](https://www.anthropic.com/research/impact-software-development) (Apr 2025)
- [Investigating unintended model actions](https://www.anthropic.com/research/investigating-unintended-model-actions) (Oct 2026)

**Claude Code reference docs**
- Instructions and permissions: [memory / CLAUDE.md](https://code.claude.com/docs/en/memory) · [settings](https://code.claude.com/docs/en/settings) · [permissions](https://code.claude.com/docs/en/permissions) · [permission modes](https://code.claude.com/docs/en/permission-modes) · [sandboxing](https://code.claude.com/docs/en/sandboxing)
- Extending Claude Code: [hooks](https://code.claude.com/docs/en/hooks) · [hooks guide](https://code.claude.com/docs/en/hooks-guide) · [subagents](https://code.claude.com/docs/en/sub-agents) · [skills](https://code.claude.com/docs/en/skills) · [mods](https://code.claude.com/docs/en/plugins/mods/overview) · [MCP](https://code.claude.com/docs/en/mcp)
- Parallel work: [agent view](https://code.claude.com/docs/en/agent-view) · [agent teams](https://code.claude.com/docs/en/agent-teams) · [dynamic workflows](https://code.claude.com/docs/en/workflows) · [worktrees](https://code.claude.com/docs/en/worktrees)
- Automation: [/goal](https://code.claude.com/docs/en/goal) · [routines](https://code.claude.com/docs/en/routines) · [scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks) · [remote control](https://code.claude.com/docs/en/remote-control)
- Models and cost: [model config](https://code.claude.com/docs/en/model-config) · [costs](https://code.claude.com/docs/en/costs)
- Headless, CI and review: [headless](https://code.claude.com/docs/en/headless) · [GitHub Actions](https://code.claude.com/docs/en/github-actions) · [Code Review](https://code.claude.com/docs/en/code-review)
- Release history: [changelog](https://code.claude.com/docs/en/changelog) · [What's new](https://code.claude.com/docs/en/whats-new)

**Other labs and vendors**
- OpenAI: [Harness engineering](https://openai.com/index/harness-engineering/) · [Codex prompting guide](https://raw.githubusercontent.com/openai/openai-cookbook/main/examples/gpt-5/codex_prompting_guide.ipynb) · [Symphony](https://github.com/openai/symphony) · [Lopopolo's harness-engineering notes](https://github.com/lopopolo/harness-engineering/tree/trunk/docs) · [agents.md](https://github.com/agentsmd/agents.md)
- GitHub: [Copilot cloud agent best practices](https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/cloud-agent/get-the-best-results.md) · [guardrails](https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/cloud-agent/build-guardrails.md) · [reviewing AI code](https://raw.githubusercontent.com/github/docs/main/content/copilot/tutorials/review-ai-generated-code.md) · [spec-kit](https://github.com/github/spec-kit)
- Google: [DORA 2025](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report) · [DORA AI Capabilities Model](https://cloud.google.com/blog/products/ai-machine-learning/introducing-doras-inaugural-ai-capabilities-model) · [Conductor](https://github.com/gemini-cli-extensions/conductor) · [Addy Osmani: LLM coding workflow 2026](https://addyosmani.com/blog/ai-coding-workflow/) · [Osmani: good specs for agents](https://addyosmani.com/blog/good-spec/)
- AWS: [AI-DLC workflows](https://github.com/awslabs/aidlc-workflows) · [Kiro](https://github.com/kirodotdev/Kiro)
- Factory: [Agent Readiness](https://factory.ai/news/agent-readiness) · [agent-steering ESLint rules](https://github.com/Factory-AI/eslint-plugin)
- Vercel: [AGENTS.md outperforms skills](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals)

**Internal agent programs at other companies**
- [Ramp: why we built our background agent](https://builders.ramp.com/post/why-we-built-our-background-agent) · [open-source background-agents clone](https://github.com/ColeMurray/background-agents)
- [StrongDM attractor (NLSpecs)](https://github.com/strongdm/attractor)
- [Shopify Roast](https://github.com/Shopify/roast)

**Research**
- Productivity:
  - [Peng et al., Copilot RCT](https://arxiv.org/abs/2302.06590v1)
  - [Cui, Demirer et al., field experiments](https://www.microsoft.com/en-us/research/?p=1148213)
  - [Google internal RCT](https://arxiv.org/html/2410.12944v2)
  - [METR 2025 RCT](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)
  - [METR 2026 update](https://metr.org/blog/2026-02-24-uplift-update/) and its [data](https://github.com/METR/Measuring-Late-2025-AI-on-OSS-Devs)
- Code quality and security:
  - [GitClear 2026](https://www.gitclear.com/the_ai_code_quality_maintainability_gap)
  - [CodeRabbit AI vs human code](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report)
  - [Veracode GenAI security](https://www.veracode.com/press-release/ai-generated-code-poses-major-security-risks-in-nearly-half-of-all-development-tasks-veracode-research-reveals/)
  - [Package hallucinations (USENIX '25)](https://www.usenix.org/conference/usenixsecurity25/presentation/spracklen)
  - [Claude Code security advisories](https://github.com/anthropics/claude-code/security/advisories)
- Agent PRs:
  - [AIDev (MSR '26)](https://arxiv.org/html/2602.09185v1)
  - [Where do AI coding agents fail?](https://arxiv.org/html/2601.15195)
  - [AgenticFlict](https://arxiv.org/html/2604.03551v2)
- Learning and careers: [Canaries in the Coal Mine](https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine)
- Context and instructions:
  - [Lost in the Middle](https://arxiv.org/abs/2307.03172)
  - [Context Rot](https://research.trychroma.com/context-rot)
  - [IFScale](https://arxiv.org/abs/2507.11538)
  - [ACE](https://www.microsoft.com/en-us/research/publication/agentic-context-engineering-evolving-contexts-for-self-improving-language-models/)
  - [Evaluating AGENTS.md (ETH)](https://arxiv.org/pdf/2602.11988)
  - [AGENTS.md efficiency](https://arxiv.org/abs/2601.20404v1)
  - [Do context files help? (ablation)](https://arxiv.org/pdf/2607.27250)
- Multi-agent systems: [MAST](https://github.com/multi-agent-systems-failure-taxonomy/MAST) · [Towards a science of scaling agent systems](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/)
- Scaffolds and verification: [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) · [Agentless](https://github.com/OpenAutoCoder/Agentless) · [CodeMonkeys](https://github.com/ScalingIntelligence/codemonkeys) · [R2E-Gym](https://github.com/R2E-Gym/R2E-Gym)
- Capability trends: [METR Time Horizon 1.1](https://metr.org/blog/2026-1-29-time-horizon-1-1/)
- Surveys: [Stack Overflow 2026 survey](https://stackoverflow.blog/2026/10/06/the-results-of-the-2026-developer-survey-are-here/) · [Pragmatic Engineer AI tooling 2026](https://newsletter.pragmaticengineer.com/p/ai-tooling-2026)

**Practitioners**
- Simon Willison:
  - [Agentic Engineering Patterns](https://simonwillison.net/guides/agentic-engineering-patterns/)
  - [Parallel coding agents](https://simonwillison.net/2025/Oct/5/parallel-coding-agents/)
  - [Designing agentic loops](https://simonwillison.net/2025/Sep/30/designing-agentic-loops/)
  - [Vibe engineering](https://simonwillison.net/2025/Oct/7/vibe-engineering/)
  - [The lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)
  - [2026 in LLMs (so far)](https://simonwillison.net/2026/Sep/27/2026-in-llms-so-far/)
  - [Fireside chat with Cat Wu and Thariq](https://simonwillison.net/2026/Jul/21/cat-and-thariq/)
  - [Software factory](https://simonwillison.net/2026/Feb/7/software-factory/)
- Armin Ronacher: [Agentic coding recommendations](https://lucumr.pocoo.org/2025/6/12/agentic-coding/) · [Things that didn't work](https://lucumr.pocoo.org/2025/7/30/things-that-didnt-work/) · [90%](https://lucumr.pocoo.org/2025/9/29/90-percent/) · [What is plan mode](https://lucumr.pocoo.org/2025/12/17/what-is-plan-mode/) · [Pi](https://lucumr.pocoo.org/2026/1/31/pi/)
- Peter Steinberger: [Just Talk To It](https://steipete.me/posts/just-talk-to-it) · [agent-scripts](https://github.com/steipete/agent-scripts)
- Mario Zechner: [What if you don't need MCP](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/)
- Mitchell Hashimoto: [My AI adoption journey](https://mitchellh.com/writing/my-ai-adoption-journey) · [Vibing a non-trivial Ghostty feature](https://mitchellh.com/writing/non-trivial-vibing)
- Andrej Karpathy: [autoresearch](https://github.com/karpathy/autoresearch)
- Geoffrey Huntley: [Ralph](https://ghuntley.com/ralph/) · [how-to-ralph-wiggum](https://github.com/ghuntley/how-to-ralph-wiggum)
- Steve Yegge: [Welcome to Gas Town](https://steve-yegge.medium.com/welcome-to-gas-town-4f25ee16dd04) · [Beads](https://github.com/steveyegge/beads)
- Dex Horthy (HumanLayer): [ACE-FCA](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md) · [12-factor agents](https://github.com/humanlayer/12-factor-agents) · [HumanLayer commands](https://github.com/humanlayer/humanlayer/tree/main/.claude/commands)
- Jesse Vincent: [Superpowers](https://github.com/obra/superpowers) · [dotfiles CLAUDE.md](https://github.com/obra/dotfiles/blob/main/.claude/CLAUDE.md)
- Harper Reed: [My LLM codegen workflow](https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/) · [Basic Claude Code](https://harper.blog/2025/05/08/basic-claude-code/)
- Kent Beck: [Augmented coding: beyond the vibes](https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes)
- Thorsten Ball: [How to build an agent](https://ampcode.com/how-to-build-an-agent)
- Every: [compound-engineering plugin](https://github.com/EveryInc/compound-engineering-plugin)
- Context engineering:
  - Drew Breunig: [How contexts fail](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html)
  - Manus: [Context engineering lessons](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)
  - Lance Martin: [Claude Diary](https://rlancemartin.github.io/2025/12/01/claude_diary/)
- Matt Pocock: [skills](https://github.com/mattpocock/skills)

**Home-rig tools and ecosystem**
- Plugins and skills: [claude-plugins-official](https://github.com/anthropics/claude-plugins-official) · [anthropics/skills](https://github.com/anthropics/skills) · [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
- Security and sandboxing: [Trail of Bits claude-code-config](https://github.com/trailofbits/claude-code-config) · [Trail of Bits skills](https://github.com/trailofbits/skills) · [sandbox-runtime](https://github.com/anthropics/sandbox-runtime)
- Usage tracking: [ccusage](https://github.com/ccusage/ccusage) · [ccstatusline](https://github.com/sirmalloc/ccstatusline)
- Remote and mobile: [Happy](https://github.com/slopus/happy)
- Parallel-session managers: [Claude Squad](https://github.com/smtg-ai/claude-squad) · [Superset](https://github.com/superset-sh/superset) · [Emdash](https://github.com/generalaction/emdash)
- Other: [OpenClaw](https://github.com/openclaw/openclaw) · [claude-code-action](https://github.com/anthropics/claude-code-action)

## Appendix C: Method, limitations and confidence

**Method.** Eight research tracks ran in parallel. Each wrote a sourced brief (see [`briefs/`](briefs/)):

1. Anthropic's official canon and the Claude Code team's own practices
2. The Claude Code feature inventory, built from ~90 docs pages and the full 8,789-line changelog through v2.1.296
3. Other companies' playbooks and case studies
4. Academic and empirical evidence, including a re-run of METR's regression on its public data and SWE-bench state-of-the-art trajectories computed from the leaderboard JSON
5. The practitioner canon, read largely from authors' own GitHub-hosted blog sources and Simon Willison's public blog database
6. Frontier developments, June–October 2026
7. Home rigs
8. Methods, frameworks and the tool landscape

This document synthesizes the briefs. The most important claims were spot-checked against primary pages: for example, the best-practices docs, model and pricing pages, and permission-mode defaults.

**Second pass (also 11 Oct 2026).** Six follow-up briefs ([09–14](briefs/)) re-checked the claims the first pass marked † or labelled weak, and filled the largest gaps. Each one has a verification ledger (confirmed, corrected, still unverified), new findings, sources, and a "still unknown" list:

| Brief | What it re-checked |
|---|---|
| [09](briefs/09-anthropic-oct-2026-guides.md) | Anthropic's late-Sep/Oct 2026 guides: agent automations, cloud sessions, eval hill-climbing |
| [10](briefs/10-org-programs-verification.md) | Company programs: OpenAI, Google, AWS, Meta, Stripe, Spotify, Ramp, Shopify, Uber, Intercom and others |
| [11](briefs/11-tools-landscape-update.md) | Cursor, Cognition, Amp, Factory, Vercel, Gemini CLI, Copilot, Codex, terminal agents, benchmarks |
| [12](briefs/12-research-gaps.md) | Research numbers: METR horizons, security advisories, skills studies, surveys, labor data |
| [13](briefs/13-people-verification.md) | Practitioner claims: Boris Cherny, Karpathy, Horthy, and Anthropic talks |
| [14](briefs/14-home-rig-update.md) | Plans and limits, hardware prices, session managers, voice and mobile tools, local models, OpenClaw |

**What the second pass changed.** Many first-pass claims were confirmed, often with exact dates. It also caught real errors. The report text is now corrected; the first-pass briefs are left as they were, and the second-pass briefs record each correction:
- METR's Opus 4.5 horizon is 293 minutes, not 320. The "89-day doubling" covers only Jan 2024–Feb 2025; the TH1.1 trend for models released since 2023 is about 129 days.
- Uber's spending cap is per employee *per agentic tool*.
- Two different Google migration papers had been merged into one.
- Termius does support mosh, and GLM's weights are MIT-licensed, not Apache-2.0.
- The independent Terminal-Bench 4 scores in the first draft could not be reproduced; the ones found are lower.
- "Devin Fusion = Opus 5.5 + Haiku 5.5" had no source.
- The Gemini CLI question is settled: individual tiers ended on 18 Jun 2026.
- OpenClaw's "73 pages of advisories" is replaced by a count from the GitHub Advisory Database (772 in 8 months).
- The first draft had no hardware prices. Brief 14 adds 2026 prices, all from secondary sources.

**Third pass (also 11 Oct 2026, from an unrestricted network).** [Brief 15](briefs/15-third-pass-check.md) records the method, every verdict and the sources. In short:
- **Links:** the report's 204 links plus the 5 primary sources this pass added all work, apart from the `localhost` example in A.15 and one Medium page that blocks scripted checks. Across the briefs, 1,000 of 1,028 unique URLs returned 200; the dead ones are listed in brief 15. The main domains return real 404s for made-up pages, so a 200 there means the cited page exists.
- **Claims:** 33 claims that depended on blocked sites were re-checked against the primary page: 28 held, 4 were partly right or out of date, and 1 was wrong. 46 Claude Code details were checked against the docs, the changelog and `--help`. 37 GitHub star counts matched within 2%.
- **Corrected in this text:** the "you just get faster" line is Greg LeMond's, which Willison quotes; the ETH context-file study (v3, 29 Sep) and SkillsBench (v4) numbers now come from their revised versions; the auto-mode bypass is 60–80% on small samples; the Terminal-Bench 4.0 board changed after 3 Oct; Claude in Chrome went GA on 1 Jul; Haiku 5.5 costs more above 100K-token prompts; the merge-rate table cites arXiv 2601.15195.
- **Configs that misbehaved when run** and are now fixed: the Stop gate skipped turns that only added new files; the formatter hook split paths with spaces; `guard-bash.sh` missed `rm -fr` and `rm -Rf`; the personal guard missed a bare `git push` from `main`; the `srt` settings lacked a required key; and the personal settings needed `excludedCommands` for git and `gh` on macOS.
- **Now confirmed against primary pages,** so their † marks are gone: Cursor's best-practices post and its "Opus stops earlier" quote, Cognition's "Coding Agents 101" and its "senior-level understanding, junior execution" line, and the Stripe Minions, Spotify Honk and Ramp Inspect figures.

**Still unverified after the third pass.** These keep their † or are flagged in the text:
- some company figures (Ramp's "over half by Feb 2026"; Amazon's internal targets);
- the full text of some Boris Cherny threads, read only through community compilations;
- time-horizon figures for the newest models, which METR has not published.

**Limitations.**
- **Web search ran out early.** A shared web-search budget was used up partway through.
- **Many sites were unreachable.** The research sandbox could fetch only anthropic.com, claude.com, code.claude.com, platform.claude.com, github.com and raw.githubusercontent.com. Many personal blogs, vendor sites (openai.com, cursor.com, vercel.com), arXiv and news sites could not be opened directly.
- **How those sources were handled:** read from GitHub-hosted mirrors where possible (author blog repos, Simon Willison's database backup, `github/docs`, the OpenAI cookbook); otherwise taken from search-result extracts, labelled as such in the briefs.
- **The second pass hit the same walls.** cursor.com, openai.com, vercel.com, arxiv.org, metr.org, x.com, simonwillison.net and claude.dev were blocked by the sandbox's network policy. Where those were the only primary source, the second pass used GitHub mirrors, Simon Willison's database backup, or search summaries, each labelled.
- **The third pass had no such limits.** It ran on an ordinary home connection and read the blocked sites directly (openai.com through a browser).
- **Weakest areas now:** company figures that have only secondary coverage (Coinbase, some Amazon and Ramp numbers), hardware prices, and live leaderboards, which change within days.
- **Gaps in the evidence itself:** there is no controlled study of spec-driven or TDD-first agent workflows; RCTs barely cover agentic tools; and most quality studies are run by vendors.

**Confidence conventions.**
- *Vendor-reported* and *self-reported* label numbers a company published about its own product or practice.
- **†** marks claims that could not be re-verified against a primary source, even after the third pass.
- Star counts are as of 11 Oct 2026; they measure attention, not quality.
- Prices and limits are as of 11 Oct 2026 and change often.

**Freshness.** This field changes monthly. Claude Code alone shipped ~25–30 versions a month in 2026. Re-check the [changelog](https://code.claude.com/docs/en/changelog) and [What's new](https://code.claude.com/docs/en/whats-new) before relying on version-specific details.
