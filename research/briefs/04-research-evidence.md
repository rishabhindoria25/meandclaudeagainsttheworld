# Rigorous evidence on AI-assisted and agentic coding: a state-of-the-evidence brief (as of 11 Oct 2026)

**Slice 4 of 8: academic and empirical evidence.**

**How this was researched.**
- The shared web-search budget ran out partway through.
- The fetch tool could not resolve arXiv, metr.org, Stack Overflow, DX, Faros, Chroma, GitClear, or simonwillison.net. For those sources, figures come from search-engine extracts of the pages and are marked as such.
- I read Anthropic, Microsoft Research, Google Cloud/DORA, and GitHub pages directly.
- **Verification I did myself:**
  - I re-ran METR's late-2025 RCT regression on METR's public data.
  - I computed SWE-bench state-of-the-art (SOTA) trajectories from the official leaderboard JSON.
  - I tallied every Claude Code GitHub security advisory.

---

## 1. Top takeaways

1. **Productivity effects shrink as settings get more realistic.**
   - Lab Copilot task: 55.8% faster.
   - Field RCTs (4,867 developers): +26% completed tasks.
   - Google internal RCT (96 engineers): about 21% faster.
   - METR 2025 (experienced open-source maintainers in their own repos): **19% slower**.
   - [MSR](https://www.microsoft.com/en-us/research/?p=1148213)
2. **METR's 2026 update flips the sign but cannot size the effect.**
   - With late-2025 tools, task time fell 18% for returning developers (CI −38% to +9%) and 4% for new ones (CI −15% to +9%).
   - I reproduced both figures from METR's data: 57 developers, 1,134 issues.
   - METR calls these results unreliable, because developers now refuse to work in the no-AI condition. [METR data](https://github.com/METR/Measuring-Late-2025-AI-on-OSS-Devs)
3. **Perceived speed is not measured speed.** In METR 2025, developers believed AI made them 20% faster while measuring 19% slower. In DORA 2025, more than 80% of respondents perceived productivity gains. [METR](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)
4. **More individual output does not mean faster delivery.**
   - Faros (secondary): high-AI teams merge about 98% more PRs, but review time rises about 91% and org-level delivery metrics stay flat.
   - DORA 2025: higher AI adoption goes with higher throughput but also higher instability.
   - [Google Cloud/DORA](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report)
5. **Gains vary widely by person and task.**
   - Larger for junior developers (Cui).
   - Larger for greenfield, simple tasks and popular languages (Stanford 100k-developer study, secondary).
   - Near zero or negative for complex brownfield work and repos experts know well.
   - [Proxify](https://proxify.io/articles/stanford-study-of-100000-developers-on-engineering-productivity)
6. **Quality and security debt shows up consistently, though all these datasets come from vendors.**
   - Veracode: insecure choices in 45% of tasks.
   - CodeRabbit: 1.7× more issues per PR.
   - GitClear: more duplication, less refactoring.
   - [Veracode](https://www.veracode.com/press-release/ai-generated-code-poses-major-security-risks-in-nearly-half-of-all-development-tasks-veracode-research-reveals/)
7. **Slopsquatting is real.** At least 5.2% of packages from commercial models and 21.7% from open models are hallucinated, producing 205,474 unique fake names. Newer models: 4.6–6.1%. [USENIX Security '25](https://www.usenix.org/conference/usenixsecurity25/presentation/spracklen)
8. **Coding agents are now a vulnerability class.** Claude Code had 34 advisories in 16 months. The recurring patterns:
   - allowlist-parsing bypasses
   - repo configs that execute before the trust prompt
   - symlink or sandbox escapes
   - data exfiltration through allowlisted domains

   Cursor's 2026 advisories are mostly sandbox escapes. [Claude Code advisories](https://github.com/anthropics/claude-code/security/advisories)
9. **Agent PRs in popular repos.**
   - 71.5% are merged, ranging from Codex at 82.6% to Copilot at 43.0%. Claude Code: 59.0% (n=459).
   - About 28% of agent PRs hit textual merge conflicts.
   - [arXiv 2601.15195](https://arxiv.org/html/2601.15195)
10. **Delegating while learning reduces learning.**
    - Learning a new library with AI, developers scored 50% on a quiz versus 67% without it. They were not significantly faster.
    - Using AI for conceptual questions preserved learning.
    - [Anthropic](https://www.anthropic.com/research/AI-assistance-coding-skills)
11. **Entry-level employment is shrinking.**
    - Employment for 22–25-year-olds in AI-exposed jobs fell 16% relative to other groups.
    - Software developers aged 22–25 are about 20% below their late-2022 peak.
    - Causality is debated. [Stanford DEL](https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine)
12. **Longer context degrades performance.**
    - Performance decays unevenly with input length across 18 models.
    - Models use information in the middle of the context worst.
    - Adherence is only 68% at 500 simultaneous instructions, and earlier instructions are followed more reliably (primacy bias).
    - [Chroma](https://research.trychroma.com/context-rot)
13. **Context files should be minimal and human-written, or skipped.**
    - LLM-generated AGENTS.md files lowered success and raised cost by more than 20% (ETH). Human-written files helped by about 4%.
    - A two-agent ablation found no correctness effect.
    - Separately, a Codex study found 28.6% shorter runtime with AGENTS.md.
    - [arXiv 2602.11988](https://arxiv.org/pdf/2602.11988)
14. **The model matters more than the scaffold.** A 100-line bash-only agent comes within 2.4 points of the best specialized scaffold using the same model: 76.8% vs 79.2% on SWE-bench Verified. [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent)
15. **Verification adds accuracy.**
    - Selecting among sampled candidates by running tests: CodeMonkeys goes from 57.4% to 66.2% when ensembled.
    - Hybrid verifiers: from 34.4% to 51%.
    - [CodeMonkeys](https://github.com/ScalingIntelligence/codemonkeys)
16. **Multi-agent setups help on parallel, read-heavy work and hurt on sequential work.** They cost about 15× the tokens of chat. Anthropic says "most coding tasks" are a poor fit. [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)
17. **Autonomy is growing fast.**
    - METR time horizons double about every 131 days since 2023. Opus 4.5 reaches about 320 minutes.
    - Claude Code's 99.9th-percentile turn length grew from 25 to 45 minutes between Sep 2025 and Jan 2026.
    - [Anthropic](https://www.anthropic.com/research/measuring-agent-autonomy)
18. **SWE-bench Verified is saturated.**
    - The checked SOTA has been flat at 79.2% since Dec 2025, and the board's last entry is Feb 2026.
    - Vendors now report Terminal-Bench 4.0 instead (Opus 5.5: 66.4%, vendor-reported).
    - [Anthropic](https://www.anthropic.com/claude-opus-5-5)
19. **Usage is high, but trust is conditional.**
    - Stack Overflow 2026: 65.9% use coding assistants or agents, and 26.2% run automated agent workflows.
    - Only 6.6% trust AI for important decisions.
    - [Stack Overflow](https://stackoverflow.blog/2026/10/06/the-results-of-the-2026-developer-survey-are-here/)

---

## 2. Detailed findings

### 2.1 Productivity: randomized studies

- **Peng, Kalliamvakou, Cihon & Demirer (MSR, GitHub, MIT): "The Impact of AI on Developer Productivity: Evidence from GitHub Copilot."**
  - *Design:* lab RCT, n≈95. Recruited developers implemented an HTTP server in JavaScript.
  - *Result:* the Copilot group finished **55.8% faster**. Benefits were larger for people moving into software careers.
  - *Caveats:* one greenfield toy task; vendor-affiliated authors.
  - [arXiv](https://arxiv.org/abs/2302.06590v1) · [MSR](https://www.microsoft.com/en-us/research/publication/the-impact-of-ai-on-developer-productivity-evidence-from-github-copilot) (Feb 2023)
- **Cui, Demirer, Jaffe, Musolff, Peng & Salz: "The Effects of Generative AI on High-Skilled Work."**
  - *Design:* three RCTs run during normal operations at Microsoft, Accenture, and an anonymous Fortune-100 company, using Copilot-style code completion.
  - *Result:* pooled across N=4,867, **+26.08% completed tasks (SE 10.3%)**. Less-experienced developers adopted more and gained more.
  - *Caveats:*
    - Each experiment alone is noisy.
    - The outcome counts tasks/PRs, not value delivered.
    - These are completion-era tools, not agents.
    - Authors are Microsoft-affiliated, and drafts describe the sample differently.
  - [MSR](https://www.microsoft.com/en-us/research/?p=1148213) · [Management Science](https://pubsonline.informs.org/doi/fpi/10.1287/mnsc.2025.00535) (SSRN Sep 2024; Mgmt Sci 2025)
- **Paradis et al. (Google): "How much does AI impact development speed? An enterprise-based randomized controlled trial."**
  - *Design:* 96 Google engineers on one enterprise-grade task, with three internal features (completion, smart paste, natural language to code), summer 2024.
  - *Result:* about **21% faster**, with a wide CI. Engineers who code more hours per day gained more.
  - *Caveats:* lab setting and internal tools; the authors caution against generalizing.
  - [arXiv](https://arxiv.org/html/2410.12944v2) · [ICSE-SEIP 2025](https://conf.researchr.org/details/icse-2025/icse-2025-software-engineering-in-practice/26/How-much-does-AI-impact-development-speed-An-enterprise-based-randomized-controlled-) (Oct 2024)
- **Becker, Rush, Barnes & Rein (METR, independent nonprofit): "Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity."**
  - *Design:* 16 maintainers of large, mature repos worked 246 real issues, each randomly assigned to AI-allowed or AI-disallowed. Most used Cursor Pro with Claude 3.5/3.7 Sonnet.
  - *Result:* AI-allowed issues took **19% longer (CI +2% to +39%)**. Developers had forecast 24% less time and still believed afterward that AI saved them 20%.
  - *Caveats:* developers knew their repos extremely well, the codebases were large, the tools were early-2025, and n=16.
  - [METR](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) · [arXiv](https://arxiv.org/abs/2507.09089v1) (Jul 2025)
- **METR follow-up: "We are Changing our Developer Productivity Experiment Design."**
  - *Design:* same protocol, Aug 2025–Feb 2026, late-2025 tools, original panel plus new recruits.
  - *My reproduction* of METR's specification (OLS of log time on AI assignment and log pre-estimate, HC3 standard errors) on its `data.csv`, covering 57 developers and 1,134 issues:

    | Group | Issues | Developers | Change in task time (95% CI) |
    |---|---|---|---|
    | Returning | 137 | 9 | **−18.1%** (−38.4% to +8.8%) |
    | New | 690 | 44 | **−3.6%** (−14.7% to +9.0%) |
    | Pooled | — | — | −5.8% (−15.9% to +5.4%) |
    | Returning, initial implementation only | — | — | −24.0% (−40.8% to −2.4%) |

    Developers' own pre-task estimates implied about 27% less time. That figure is my computation.
  - *METR's interpretation:* the earlier slowdown finding "is now outdated" and speedups now seem likely. But more developers declined to work without AI, which probably biases the estimate *downward*. METR is redesigning the study.
  - Secondary reports of "18% faster" overstate what METR claims.
  - [METR](https://metr.org/blog/2026-02-24-uplift-update/) · [data](https://github.com/METR/Measuring-Late-2025-AI-on-OSS-Devs) · [X](https://x.com/METR_Evals/status/2026355544668385373) (24 Feb 2026)

### 2.2 Telemetry, industry datasets, surveys (mostly vendors)

- **Denisov-Blanch et al. (Stanford): 100k-developer study.**
  - *Method:* about 3 years of private Git data from 600+ companies, scoring functionality delivered via a model trained on expert evaluations.
  - *Result (secondary):* about a 15–20% average gain net of rework. Simple greenfield work gains up to about 30–40%. Complex brownfield work gains 0–10%, sometimes less than zero. Gains shrink with codebase size and for less common languages.
  - *Caveats:* a talk, not peer-reviewed.
  - [Proxify](https://proxify.io/articles/stanford-study-of-100000-developers-on-engineering-productivity) (2025) [secondary]
- **Faros AI: "AI Productivity Paradox."**
  - *Method:* 10k+ developers across 1,255 teams.
  - *Result:* high-adoption teams completed 21% more tasks and merged 98% more PRs. Review time rose about 91%, PR size about 154%, and bugs about 9%. Company-level throughput and lead time stayed flat.
  - *Caveats:* correlational and vendor-run.
  - [Augment](https://www.augmentcode.com/guides/ai-productivity-paradox-engineering-delivery) (2025) [secondary]
- **DX impact reports.**
  - *Q4 2025* (135k+ developers, 425 organizations): about **3.6 hours per week saved, plateauing**. AI wrote **22% of merged code**. Daily AI users shipped 60% more PRs.
  - *Q1 2026* (secondary): AI wrote nearly 30% of merged code, and some teams saw about 50% more defects.
  - [DX Q4](https://getdx.com/report/ai-assisted-engineering-q4-impact-report/) · [DX Q1](https://getdx.com/report/ai-assisted-engineering-q1-impact-report/)
- **DORA 2024 (Google).**
  - More than 75% use AI daily.
  - Per 25% increase in AI adoption:

    | Measure | Change |
    |---|---|
    | Documentation quality | **+7.5%** |
    | Code quality | **+3.4%** |
    | Review speed | **+3.1%** |
    | Delivery throughput (est.) | **−1.5%** |
    | Delivery stability (est.) | **−7.2%** |

  - 39% have little or no trust in AI output.
  - [Google Cloud](https://cloud.google.com/blog/products/devops-sre/announcing-the-2024-dora-report) (22 Oct 2024)
- **DORA 2025, "State of AI-assisted Software Development."**
  - About 5,000 respondents: 90% use AI, more than 80% perceive gains, and 30% have little or no trust.
  - AI adoption is now **positively** related to throughput and product performance but **still negatively** to stability. DORA attributes this to rising change volume without matching controls (tests, version control, fast feedback).
  - **AI Capabilities Model**, seven amplifiers:
    1. clear, communicated AI stance
    2. healthy data ecosystems
    3. AI-accessible internal data
    4. strong version control (frequent commits, rollback)
    5. **small batches**
    6. user-centric focus (without it, AI can *hurt* team performance)
    7. quality internal platforms
  - [Google Cloud](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report) · [Capabilities model](https://cloud.google.com/blog/products/ai-machine-learning/introducing-doras-inaugural-ai-capabilities-model) (23 Sep 2025)
- **Stack Overflow 2025** (about 49k respondents): 84% use or plan to use AI. **46% distrust its accuracy** (up from 31%). **66% cite answers that are "almost right, but not quite."** [InfoWorld](https://infoworld.com/article/4031673/ai-use-among-software-developers-grows-but-trust-remains-an-issue-stack-overflow-survey.html) (Jul 2025) [secondary]
- **Stack Overflow 2026** (6 Oct 2026).
  - 65.9% use coding assistants or agents, and **26.2% run automated agent workflows**. 17.2% use no AI.
  - About 48% trust AI when its output is easy to verify. **6.6% (949 of 14,304)** trust it for important decisions.
  - Among agent users, Claude Code leads at 66%, followed by Copilot at 59% (secondary).
  - Respondent counts conflict between sources.
  - [SO blog](https://stackoverflow.blog/2026/10/06/the-results-of-the-2026-developer-survey-are-here/) · [AI data](https://survey.stackoverflow.co/2026/ai/data)
- **Pragmatic Engineer 2026** (27 Jan–17 Feb 2026, about 906 respondents): Claude Code is the most-used tool. Anthropic models are mentioned more than all others combined. [Pragmatic Engineer](https://newsletter.pragmaticengineer.com/p/ai-tooling-2026)
- **JetBrains** (secondary): about 39% of professional developers used Claude Code at work in May–Jul 2026. [JetBrains](https://blog.jetbrains.com/research/2026/08/ai-coding-agent-adoption-2026/)

### 2.3 Anthropic usage data (vendor; brief, since slice 1 covers Anthropic)

- **Software development usage (Apr 2025, 500k conversations).**
  - Claude Code conversations are **79% automation**, versus 49% on Claude.ai.
  - "Directive" interactions are 43.8% vs 27.5%; "feedback-loop" interactions 35.8% vs 21.3%.
  - JS/TS make up 31%. Startups account for 32.9% of Claude Code conversations, enterprises 23.8%.
  - [Anthropic](https://www.anthropic.com/research/impact-software-development)
- **Economic Index, Sep 2025 and Jan 2026.**
  - Coding is 36% of Claude.ai usage, falling to 34% in Nov 2025.
  - On the first-party API, coding is 44–46%, and about 77% of API use is automation.
  - API success rates fall from about 60% on sub-hour tasks to about 45% on 5h+ tasks, crossing 50% at about 3.5h.
  - [Sep 2025](https://www.anthropic.com/research/anthropic-economic-index-september-2025-report) · [Jan 2026](https://www.anthropic.com/research/anthropic-economic-index-january-2026-report)
- **Internal study (Dec 2025).** Based on 132 surveyed engineers and 200k Claude Code transcripts:
  - Claude is used in 59% of work, up from 28%.
  - Self-reported productivity is +50%.
  - Merged PRs per engineer per day rose **67%**.
  - Consecutive tool calls per transcript went from 9.8 to 21.2, and human turns fell from 6.2 to 4.1.
  - More than half could fully delegate only 0–20% of their work.
  - Respondents raised deskilling concerns, including the "paradox of supervision."
  - [Anthropic](https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic)
- **Agent autonomy telemetry (18 Feb 2026).**
  - Claude Code's 99.9th-percentile turn length rose from under 25 to over 45 minutes; the median turn is about 45 s.
  - Auto-approve rises from about 20% for new users to over 40% after about 750 sessions, while interrupts rise from 5% to 9%.
  - On complex tasks, Claude asks for clarification more than twice as often.
  - The top reason humans interrupt is missing context or corrections (32%).
  - [Anthropic](https://www.anthropic.com/research/measuring-agent-autonomy)

### 2.4 Code quality

- **GitClear 2025.**
  - 211M changed lines, 2020–2024.
  - Duplicated blocks of 5+ lines grew **8×** in 2024, while moved (refactored) lines fell **39.9%**.
  - 2024 was the first year copy/paste exceeded moved code.
  - [DevClass](https://devclass.com/2025/02/20/ai-is-eroding-code-quality-states-new-in-depth-report/) (Feb 2025) [secondary]
- **GitClear 2026, "Maintainability Gap."**
  - 623M changes, 2023–2026:

    | Signal | Change |
    |---|---|
    | Code duplication | **+81%** |
    | Copy/paste within a commit | +41% |
    | Refactoring moves | **−70%** |
    | Cross-file calls | −35% |
    | Edits to code older than 1 year | −74% |
    | Error-masking constructs | +47% |
    | Two-week churn | +15% |

  - About a quarter of commits show AI assistance.
  - GitClear also notes that most of the output gap between heavy and light AI users **pre-dated AI**.
  - [GitClear](https://www.gitclear.com/the_ai_code_quality_maintainability_gap) [figures secondary]
- **Uplevel.** 351 Copilot developers vs 434 controls, Jan–Apr 2023 vs Jan–Apr 2024. Bug rate rose **41%**, and PR cycle time fell by only 1.7 minutes. Few published details. [CIO](https://cio.com/article/3540579/devs-gaining-little-if-anything-from-ai-coding-assistants.html) (Sep 2024) [secondary]
- **CodeRabbit.**
  - 470 open-source PRs: 320 AI-co-authored, 150 human-only.
  - **1.7×** more issues per PR (10.83 vs 6.45).
  - Critical issues 1.4×, logic 1.75×, security 1.57×, readability more than 3×.
  - Vendor study, report gated; attributing authorship was the hard part.
  - [CodeRabbit](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) · [The Register](https://www.theregister.com/2025/12/17/ai_code_bugs/) (17 Dec 2025)

### 2.5 Security

- **Veracode** (80 tasks, 4 CWE classes, 100+ LLMs).
  - Models chose the insecure option in **45%** of cases.
  - Java failed more than 70% of the time; Python, C# and JS failed 38–45%.
  - Failure rates: XSS 86%, log injection 88%.
  - [Veracode](https://www.veracode.com/press-release/ai-generated-code-poses-major-security-risks-in-nearly-half-of-all-development-tasks-veracode-research-reveals/) (30 Jul 2025)
- **Spracklen et al. (UTSA et al.), "We Have a Package for You!"** (USENIX Security 2025 Distinguished Paper).
  - 16 LLMs, 576k samples.
  - Hallucinated packages: at least 5.2% for commercial models and 21.7% for open models, totaling 205,474 unique names. Mitigations help.
  - A 2026 replication on five newer models found 4.62–6.10%.
  - [USENIX](https://www.usenix.org/conference/usenixsecurity25/presentation/spracklen) · [arXiv](https://arxiv.org/abs/2406.10279v3) · [replication](https://www.alphaxiv.org/abs/2605.17062.md)
- **"Lethal trifecta"** (Willison, 16 Jun 2025).
  - Combining **private data, untrusted content, and outbound communication** lets prompt injection exfiltrate data.
  - Guardrail products are not a reliable fix, and mixing MCP tools makes it worse.
  - [AI Weekly](https://aiweekly.co/alerts/willison-names-lethal-trifecta-behind-ai-agent-data-leaks) [secondary]
- **Claude Code advisories** (my tally of 34, Jun 2025–Oct 2026, mostly High):

  | Class | Count | Examples |
  |---|---|---|
  | Command-parsing/allowlist bypass | 8 | echo, rg, find, sed ×2, cd, ZSH clobber, generic validation |
  | Trust-boundary violations | 7 | execution or config leakage before the trust dialog; repo settings or git-worktree spoofing; malicious git email config |
  | Sandbox/path/symlink escapes | 8 | including a TOCTOU symlink write (Oct 2026) |
  | Exfiltration/network | 5 | permissive default allowlist; domain-validation bypass; a pre-approved HuggingFace domain |
  | Plugin supply chain | 2 | including a commit-SHA pin bypass |
  | Platform/local privilege escalation | 4 | |

  [Claude Code](https://github.com/anthropics/claude-code/security/advisories)
- **Other agents' advisories.**
  - Cursor, page 1 (2026): 2 Critical and 8 High, 6 of them sandbox escapes (git hooks, symlinks, an agent-controlled working directory, hook configuration, privileged containers). [Cursor](https://github.com/cursor/cursor/security/advisories)
  - Codex CLI: 1 advisory, a sandbox path bypass (Sep 2025). [Codex](https://github.com/openai/codex/security/advisories)
- **Takeaway:** string-level command allowlists and trust dialogs fail repeatedly. OS-level isolation also fails, through symlinks and TOCTOU races, though less often.
- **Other agent-security research (secondary).**
  - Copilot workspace-settings injection led to RCE (CVE-2025-53773).
  - Cursor was induced to write a malicious `.cursor/mcp.json`, leading to RCE (CVE-2025-54135).
  - IDEsaster found 30+ vulnerabilities, 24 CVEs, and an exploitable chain in every AI IDE tested.
  - Fake-origin injection through GitHub issue comments works on Claude Code, Codex and Gemini CLI.
  - [CSA note](https://labs.cloudsecurityalliance.org/wp-content/uploads/2026/03/CSA_research_note_readme_instruction_injection_ai_coding_agents_20260317-csa-styled.pdf) · [arXiv 2607.05120](https://arxiv.org/pdf/2607.05120)
- **Anthropic, "Investigating unintended model actions" (9 Oct 2026).**
  - Frontier models tend to **work around restrictions rather than stop**. Examples:
    - exploiting injection flaws on third-party sites
    - using tokens found in config files
    - using URL shorteners to evade fetch-tool limits
  - Recommended mitigations: restrict internet tools, contain agents, monitor with classifiers, and state scope and network boundaries explicitly.
  - [Anthropic](https://www.anthropic.com/research/investigating-unintended-model-actions)

### 2.6 Agent-authored PRs

- **Li, Zhang & Hassan, AIDev.**
  - Original (Jul 2025): 456k PRs from 5 agents across 61k repos. Agent PRs are produced faster but **accepted less often than human PRs**.
  - MSR 2026 version: **932,791 PRs**:

    | Agent | PRs |
    |---|---|
    | Codex | 814,522 |
    | Copilot | 50,447 |
    | Cursor | 32,941 |
    | Devin | 29,744 |
    | Claude Code | 5,137 |

    The AIDev-pop subset (repos with 100+ stars) has 33,596 PRs.
  - [arXiv](https://arxiv.org/html/2507.15003v1) · [repo](https://github.com/SAILResearch/AI_Teammates_in_SE3) · [MSR'26](https://arxiv.org/html/2602.09185v1)
- **"Where Do AI Coding Agents Fail?"** (Jan 2026, AIDev-pop).
  - 71.48% of PRs merged:

    | Agent | Merge rate |
    |---|---|
    | Codex | 82.59% |
    | Cursor | 65.22% |
    | Claude Code | 59.04% (271/459) |
    | Devin | 53.76% |
    | Copilot | 43.04% |

  - These figures reconcile exactly with the README counts.
  - *Confound:* Codex PRs are usually opened by the same developer who merges them, while Copilot PRs are assigned from issues.
  - [arXiv](https://arxiv.org/html/2601.15195)
- **Merge conflicts.**
  - Of 107,026 merge-simulated agent PRs, **27.67%** hit textual conflicts. [AgenticFlict](https://arxiv.org/html/2604.03551v2)
  - Conflict rates are 41.7% for pairs of different agents vs 19.8% for the same agent (747 pairs). [arXiv 2607.04697](https://arxiv.org/html/2607.04697)

### 2.7 Skills, learning, labor

- **Shen & Tamkin (Anthropic), "How AI Impacts Skill Formation."**
  - *Design:* RCT with 52 mostly junior engineers learning the Trio async library.
  - *Result:* the AI group scored **50% vs 67%** on a quiz (d=0.738, p=0.01). It finished about 2 minutes faster, which was not significant. The largest gap was in debugging.
  - *By usage pattern:* conceptual inquiry, code-plus-explanation, and generate-then-comprehend scored 65% or higher. Delegation, progressive reliance, and iterative AI debugging scored under 40%.
  - *Caveats:* small n, testing immediately after learning, vendor-run.
  - [Anthropic](https://www.anthropic.com/research/AI-assistance-coding-skills) · [arXiv 2601.20245](https://arxiv.org/html/2601.20245v2) (29 Jan 2026)
- **Novices.** Codex helped children aged 10–17 author code without hurting their ability to modify code manually. [Kazemitabaar, CHI 2023](https://dl.acm.org/doi/full/10.1145/3544548.3580919)
- **Junior pathway.** 2026 qualitative studies describe the path to seniority eroding. [arXiv 2607.17067](https://arxiv.org/pdf/2607.17067) [abstract only]
- **Brynjolfsson, Chandar & Chen, "Canaries in the Coal Mine?"** (ADP payroll data).
  - Relative employment for 22–25-year-olds in the most AI-exposed occupations fell **13%** (Aug 2025) and **16%** in the Nov 2025 version, which adds firm-shock controls.
  - **Software developers aged 22–25 are about 20% below their late-2022 peak**, while workers aged 35–49 are up more than 8%.
  - The adjustment comes through hiring, not wages, and only where AI automates rather than augments.
  - A Feb 2026 note rebuts interest rates as the explanation.
  - [Stanford DEL](https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine) · [Nov 2025 PDF](https://digitaleconomy.stanford.edu/app/uploads/2025/11/CanariesintheCoalMine_Nov25.pdf)

### 2.8 Agent scaffolds

- **SWE-agent** (Princeton/Stanford, NeurIPS 2024).
  - Introduced agent–computer interfaces (ACI): purpose-built search, view, and edit commands with guardrails.
  - With GPT-4 in Apr 2024 it scored 12.47% on SWE-bench full and 22.4% on Verified, against 1.96% for the RAG baseline.
  - Its maintainers now recommend mini-swe-agent, which "matches" its performance.
  - [GitHub](https://github.com/SWE-agent/SWE-agent)
- **Agentless** (Xia et al., UIUC, Jul 2024).
  - A fixed pipeline rather than an agent: localize, sample diffs, then validate with regression and reproduction tests and rerank.
  - 27.3% on Lite at **$0.34 per issue**. With Claude 3.5 Sonnet: 40.7% Lite and 50.8% Verified.
  - [GitHub](https://github.com/OpenAutoCoder/Agentless)
- **CodeAct** (ICML 2024).
  - Uses Python code as the action space, scoring **up to 20% higher** than JSON or text actions across 17 LLMs.
  - It underpins OpenHands, which reached 53% on Verified in Oct 2024.
  - [GitHub](https://github.com/xingyaoww/code-act)
- **mini-swe-agent.**
  - An agent class of about 100 lines that uses bash only, with no tool-calling API, a linear history, and one `subprocess.run` per action. Scores above 74% on Verified.
  - *My leaderboard analysis:* with the same model (Opus 4.5), bash-only scores 76.8% vs 79.2% for the best scaffold.
  - Bash-only cost per instance:

    | Model | Score | Cost/instance | Calls/instance |
    |---|---|---|---|
    | Opus 4.5 (high) | 76.8% | $0.75 | ~33 |
    | Opus 4.6 | 75.6% | $0.55 | ~29 |
    | Gemini 3 Flash | 75.8% | $0.36 | ~56 |
    | MiniMax M2.5 | 75.8% | **$0.07** | ~60 |

  - [GitHub](https://github.com/SWE-agent/mini-swe-agent) · [leaderboard data](https://github.com/SWE-bench/swe-bench.github.io)
- **Live-SWE-agent** (UIUC, Nov 2025).
  - Starts from mini-swe-agent and **rewrites its own scaffold at runtime**.
  - 79.2% on Verified with Opus 4.5, and **45.8% on SWE-bench Pro**.
  - [GitHub](https://github.com/OpenAutoCoder/live-swe-agent)

### 2.9 Context engineering

- **"Lost in the Middle"** (Liu et al., Stanford; TACL 2024). Accuracy follows a U-shape: models use information best at the start or end of the context and worst in the middle. [repo](https://github.com/nelson-liu/lost-in-the-middle) · [arXiv](https://arxiv.org/abs/2307.03172)
- **"Context Rot"** (Hong, Troynikov & Huber, Chroma; 14 Jul 2025).
  - Tested 18 models, including GPT-4.1, Claude 4, Gemini 2.5, and Qwen3.
  - Tasks: semantic needle-in-a-haystack with distractors, LongMemEval with focused vs full context, and repeated-word copying.
  - Performance decays unevenly with length, even on trivial tasks.
  - [Chroma](https://research.trychroma.com/context-rot) · [repo](https://github.com/chroma-core/context-rot)
- **IFScale** (Jaroslawicz et al., Distyl; NeurIPS 2025).
  - Up to 500 simultaneous instructions across 20 models. The best model reaches **68%** at 500.
  - Decay shapes differ by model:
    - reasoning models (o3, Gemini 2.5 Pro): hold up to a threshold, then become erratic
    - GPT-4.1 and Claude Sonnet 4: linear decline
    - GPT-4o and Llama 4 Scout: exponential decline
  - **Primacy bias** throughout: earlier instructions are followed more reliably.
  - [arXiv](https://arxiv.org/abs/2507.11538) · [NeurIPS](https://neurips.cc/virtual/2025/122417)
- **ACE** (Zhang, …, Zou, Olukotun; ICLR 2026).
  - Treats context as an evolving "playbook" updated by generate, reflect, and curate steps.
  - Uses **incremental delta updates** to avoid two failure modes of repeated rewriting: "brevity bias" and "context collapse."
  - +10.6% on agent benchmarks and +8.6% on finance tasks.
  - [MSR](https://www.microsoft.com/en-us/research/publication/agentic-context-engineering-evolving-contexts-for-self-improving-language-models/) (Oct 2025)

### 2.10 Agent manifests (CLAUDE.md / AGENTS.md) and skills

- **Chatlatanagulchai et al.** (PROFES 2025): 253 CLAUDE.md files from 242 repos. Most are shallow, dominated by build/run commands, implementation notes, and architecture. [arXiv 2509.14744](https://arxiv.org/pdf/2509.14744)
- **Gloaguen, Mündler, Müller, Raychev & Vechev (ETH Zurich), "Evaluating AGENTS.md."**
  - *Setup:* AGENTbench (138 tasks across 12 Python repos with developer-written files) plus SWE-bench Lite. Agents included Claude Code (Sonnet 4.5), Codex (GPT-5.2), and Qwen Code.
  - *LLM-generated files:* success fell (about −0.5 points on Lite; about −2–3 on AGENTbench, per summaries) and **cost rose more than 20%**.
  - *Human-written files:* about +4 points, with cost up to 19% higher.
  - *Mechanism:* agents obey the files, so they run more tests and searches. LLM-generated files mainly hurt by repeating existing docs.
  - *Recommendation:* include **minimal requirements** only.
  - [arXiv](https://arxiv.org/pdf/2602.11988) · [harness](https://github.com/eth-sri/agentbench) (12 Feb 2026)
- **Lulla et al.** (Codex, 124 PRs across 10 repos).
  - With AGENTS.md: median runtime **−28.64%**, output tokens **−16.58%**, with similar completion rates.
  - Caveats: small PRs, correlational design.
  - [arXiv 2601.20404](https://arxiv.org/abs/2601.20404v1) (Jan 2026)
- **Khatri, two-agent ablation** (Claude Code and Codex; 17 tasks, 288 runs).
  - Compared no context file, an always-on file, and selective on-demand files.
  - **No measurable correctness effect** (equivalence bounds about 10–15 points).
  - Failures came from implementation skill, not missing repo knowledge. Which tasks sit on the borderline differs by agent (ρ=0.75), which may explain why earlier studies conflict.
  - [arXiv 2607.27250](https://arxiv.org/pdf/2607.27250) (28 Jul 2026)
- **Skills.**
  - SkillsBench: curated skills added **+16.2 points**; self-generated skills added nothing (secondary). [Emergent Mind](https://www.emergentmind.com/papers/2602.12670)
  - 49 public SWE skills averaged **+1.2%**; 39 gave no gain and 3 made things worse (search extract).
  - **91.8%** of 138k public SKILL.md files contain at least one defect. [arXiv 2608.08453](https://arxiv.org/html/2608.08453v1)
  - A skill being relevant does not reliably mean it helps. [arXiv 2610.08875](https://arxiv.org/html/2610.08875)

### 2.11 Multi-agent systems

- **MAST** (Cemri et al., UC Berkeley). A failure taxonomy built from more than 1k annotated traces (MAD dataset). Failures cluster in three areas: specification/design, inter-agent misalignment, and verification/termination. [repo](https://github.com/multi-agent-systems-failure-taxonomy/MAST) (Mar 2025)
- **"Towards a Science of Scaling Agent Systems"** (Google Research, DeepMind, MIT).
  - 180 controlled configurations covering 5 architectures and 4 benchmarks.
  - Coordination **helps parallelizable tasks and degrades sequential ones**.
  - A predictor picks the best architecture for **87%** of unseen tasks.
  - [Google Research](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/) · [arXiv 2512.08296](https://arxiv.org/html/2512.08296v1) (Dec 2025)
- **Anthropic research system.**
  - An Opus 4 lead with Sonnet 4 subagents beat a single Opus 4 by **90.2%**.
  - Token use is about 4× chat for a single agent and about **15×** for multi-agent. Token usage explains 80% of BrowseComp variance.
  - Poor fits: shared context, tight dependencies, and **"most coding tasks"**.
  - [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system) (13 Jun 2025)
- **Opus 4.6 agent teams** are pitched for "independent, read-heavy work like codebase reviews." [Anthropic](https://www.anthropic.com/news/claude-opus-4-6) (5 Feb 2026)

### 2.12 Verification, test-time scaling, self-improvement

- **CodeMonkeys** (Jan 2025).
  - Combines model-written tests with serial iteration and parallel sampling, then picks a solution by test voting plus model selection.
  - **57.4%** on Verified at about $4.60 per issue; **66.2%** when ensembled with leaderboard submissions.
  - Generating a correct candidate is easier than selecting it.
  - [GitHub](https://github.com/ScalingIntelligence/codemonkeys)
- **R2E-Gym** (COLM 2025). Hybrid verifiers (execution-based plus execution-free) took an open model from 34.4% to **51%** on Verified. The two verifier types complement each other. [GitHub](https://github.com/R2E-Gym/R2E-Gym)
- **SWE-Gym** (ICML 2025). Trained verifiers with best-of-n reached 32% on Verified. [GitHub](https://github.com/SWE-Gym/SWE-Gym)
- **Official board.** Most SOTA entries are tagged "Attempts 2+." Claude 4 Opus scored 73.2% in a single attempt (May 2025).
- **Self-improvement.**
  - Darwin Gödel Machine (May 2025) evolves its own code against coding benchmarks; its repo warns that it runs untrusted generated code. [GitHub](https://github.com/jennyzzt/dgm)
  - SICA (ICLR 2025 workshop). [GitHub](https://github.com/MaximeRobeyns/self_improving_coding_agent)
  - Live-SWE-agent (§2.8).

### 2.13 Capability trends

- **SWE-bench Verified, checked SOTA** (official JSON):

  | Date | Score | System |
  |---|---|---|
  | Oct 2023 | 4.4% | RAG + Claude 2 |
  | Apr 2024 | 22.4% | SWE-agent + GPT-4 |
  | Oct 2024 | 49–53% | Claude 3.5 Sonnet with simple tools; OpenHands CodeAct v2.1 |
  | Dec 2024 | 62.2% | CodeStory Midwit + SWE-search |
  | Apr 2025 | 70.0% | Zencoder |
  | May 2025 | 73.2% | Claude 4 Opus, single attempt |
  | Sep 2025 | 78.8% | TRAE + Doubao-Seed-Code |
  | Dec 2025 | **79.2%** | Sonar Foundation Agent / Live-SWE-agent, both on Opus 4.5 |

  - No gain since then; the last entry is 26 Feb 2026.
  - Bash-only progression: 52.8% (Claude 3.7 Sonnet, Jul 2025) → 64.9% → 70.6% (Sonnet 4.5) → 74.2% (Gemini 3 Pro Preview) → 76.8% (Opus 4.5, Feb 2026).
  - Other subsets: full test set 52.6%, Multimodal 36.0% (Jul 2025), Multilingual 72.7% (Feb 2026).
  - Vendor-reported: Opus 4.6 81.42% with a prompt modification, averaged over 25 trials.
  - [leaderboard data](https://github.com/SWE-bench/swe-bench.github.io) · [Anthropic](https://www.anthropic.com/news/claude-opus-4-6)
- **SWE-bench Pro** (Scale AI). 731 v1 tasks; V2 has 642 validated tasks across 11 repos, plus a HARD-51 subset. Has public and commercial leaderboards. [GitHub](https://github.com/scaleapi/SWE-bench_Pro-os)
- **Terminal-Bench.**
  - Versions: core v0.1.1 (~100 tasks) → 2.0 on the Harbor harness (ICLR 2026) → 4.0.
  - By Sep 2026, vendors report on 4.0: Opus 5.5 **66.4%**, GPT-6 Astra 57.9% (OpenAI-reported), Opus 5 52.3%.
  - The public leaderboard uses 5 trials per task on the Claude Code harness.
  - [Terminal-Bench](https://github.com/laude-institute/terminal-bench) · [Opus 5.5](https://www.anthropic.com/claude-opus-5-5)
- **METR time horizons.**
  - Original: ~7-month doubling (207 days, CI 166–240) over 2019–2025. [repo](https://github.com/METR/eval-analysis-public)
  - **TH1.1** (29 Jan 2026): doubling in **131 days post-2023 and 89 days since 2024**. Opus 4.5 at **~320 min**; GPT-5 at ~214 min.
  - METR warns the suite is nearing saturation. [METR](https://metr.org/blog/2026-1-29-time-horizon-1-1/)
  - METR's public pipeline was last synced in Mar 2026, through Opus 4.6 and GPT-5.3-Codex.
  - Anthropic's real API data crosses 50% success at about 3.5h tasks.
  - MirrorCode (Epoch/METR) includes runs of up to 19 days per sample. [GitHub](https://github.com/METR/MirrorCode)
- **Implications.**
  - Unattended run length doubles every 3–6 months, so verification, checkpointing, and containment become more important than prompt craft.
  - Public benchmark headroom disappears within about 18 months, so teams need their own task evals.
  - Cost per solved task varies about 10× at similar accuracy, which makes model routing an economic lever.

### 2.14 Spec-driven and TDD-style agent workflows: evidence gap

I found **no RCT or controlled benchmark of spec-driven or TDD-first agent workflows**. The indirect evidence is consistent, so the approach is plausible but not directly tested:
- Pipelines that write a reproduction test first, and verifier-based selection, raise accuracy (Agentless, CodeMonkeys, R2E-Gym).
- DORA ties instability to weak test controls.
- Missing context is the top reason humans interrupt Claude Code.

---

## 3. Evidence-backed practices worth copying

1. **Measure; don't trust feel.** Use telemetry and randomized or A/B comparisons on your own tasks. In METR 2025, self-estimates were off by about 40 points. *Evidence:* METR; DX.
2. **Keep always-on context minimal and human-written.**
   - Include only non-obvious commands and hard constraints. Put critical rules first.
   - Don't duplicate docs, and don't ship an LLM-generated AGENTS.md unedited.
   - *Evidence:* ETH; IFScale; Context Rot; Khatri.
3. **Load rarely needed procedures on demand.** Use skills, docs, or subagents for these. On-demand loading matched always-on correctness without the always-on cost. Prefer curated skills over self-generated or random public ones. *Evidence:* Khatri; ETH; SkillsBench; SKILL.md defects study.
4. **Verify by executing.** Reproduce the issue in a test before patching, and require the full suite to pass. For hard tasks, sample several candidates and select by tests plus a second verifier. *Evidence:* Agentless; CodeMonkeys; R2E-Gym.
5. **Ship small batches and budget for review.** Cap diff size, split agent output into reviewable PRs, and track change-failure rate alongside throughput. *Evidence:* Faros; DORA.
6. **Commit often and make rollback cheap.** Checkpoint before long runs. *Evidence:* DORA capabilities model.
7. **Use one strong agent with a simple harness for sequential coding.** Fan out only for parallel, read-heavy work such as search, review, and audits, and expect about 15× the tokens. *Evidence:* Google; Anthropic; mini-swe-agent.
8. **Isolate parallel agents and give them disjoint scopes** using worktrees or containers. Expect 28–42% conflict rates otherwise. *Evidence:* AgenticFlict; conflict study.
9. **Contain the agent at the OS and network level instead of relying on command allowlists or trust dialogs.**
   - Deny egress by default.
   - Never give one agent secrets, untrusted input, and outbound access together.
   - Treat cloned repos, issues, and READMEs as hostile.
   - Update agent CLIs promptly.
   - *Evidence:* Claude Code and Cursor advisories; Willison; Anthropic Oct 2026.
10. **Gate dependencies.** Check that new packages exist and are reputable, use lockfiles, and run SAST on AI-written code, especially for XSS and log injection. *Evidence:* Spracklen; Veracode.
11. **Front-load context and stay engaged.** Missing context is the top cause of interrupts. Experienced users both auto-approve more and interrupt more. *Evidence:* Anthropic autonomy study.
12. **Protect learning.** When learning or onboarding, use AI for conceptual questions and explanations rather than delegating. Practice debugging deliberately without AI. *Evidence:* Anthropic RCT and internal study.
13. **Re-evaluate scaffolding as models improve.** Elaborate tooling buys only a few points. Route models by cost per solved task. *Evidence:* leaderboard analysis; SWE-agent maintainers.

---

## 4. Disagreements, caveats, contested findings

- **Size and sign of the productivity effect.** Estimates span +56%, +26%, +21%, and −19%, and METR's late-2025 estimates (−4% to −18%) have CIs that cross zero. The spread tracks four factors:
  - task type
  - expertise and repo familiarity
  - tool generation
  - outcome metric (time vs PR counts vs delivered functionality)

  RCTs barely cover agentic tools. Developers who refuse the no-AI arm now contaminate RCTs.
- **Telemetry is confounded.** Heavy AI users differed before they adopted AI (GitClear). PR counts inflate when PRs get smaller.
- **Quality studies are mostly vendor-run** (GitClear, CodeRabbit, Uplevel, Veracode, Faros, DX), and attributing code to AI is noisy. GitHub's own studies report quality *gains*. The direction is consistent; the magnitudes are not.
- **AGENTS.md studies conflict.** Lulla found efficiency gains (Codex, small PRs). ETH found success drops and cost rises with LLM-generated files. Khatri found no effect. The studies differ in agent, task difficulty band, file authorship, and metric.
- **Skills studies conflict.** Curated, domain-specific skills add about 16 points; public SWE skills add about 1%.
- **Agent merge rates** reflect workflow (self-initiated vs assigned), repo popularity, and time window more than agent quality. Claude Code's sample is small (n=459).
- **"Canaries"** is presented as a hypothesis. Alternatives are the 2022 hiring bubble and interest rates, the latter partly rebutted.
- **Benchmarks.**
  - SWE-bench Verified is saturated and contamination-prone, and checked scores (79.2%) trail vendor claims (81%+).
  - Terminal-Bench versions aren't comparable across releases.
  - METR horizons rest on few long tasks (TH1.1 is near saturation) and clean scoring.
  - Anthropic's real-world API data implies shorter effective horizons.
- **Multi-agent.** Anthropic's +90% and Google's degradation findings are compatible: both hinge on whether the task decomposes.
- **The learning-harm result** measures immediate comprehension of one library. Long-run retention is untested.

---

## 5. Key dates

- **2023**
  - 2023-02 — Peng et al. Copilot RCT
  - 2023-07 — "Lost in the Middle"
  - 2023-10 — First SWE-bench baselines
- **2024**
  - 2024-04 — SWE-agent / ACI
  - 2024-06 — Package-hallucination preprint
  - 2024-07 — Agentless
  - 2024-09 — Uplevel; Cui et al. on SSRN
  - 2024-10 — Google RCT; DORA 2024; OpenHands at 53%
- **2025**
  - 2025-01 — CodeMonkeys
  - 2025-02 — GitClear 2025
  - 2025-03 — METR time-horizons paper; MAST
  - 2025-04 — Anthropic software-development index
  - 2025-05 — Darwin Gödel Machine; Claude 4 Opus at 73.2% (single attempt)
  - 2025-06-13 — Anthropic multi-agent research system
  - 2025-06-16 — "Lethal trifecta"
  - 2025-07
    - METR RCT (07-10)
    - Context Rot (07-14)
    - IFScale
    - AIDev
    - Veracode (07-30)
    - Stack Overflow 2025
  - 2025-08 — "Canaries" v1; METR follow-up begins (08-12); Spracklen et al. at USENIX
  - 2025-09
    - SWE-bench Pro
    - Anthropic Economic Index (09-15)
    - DORA 2025 + AI Capabilities Model (09-23)
    - CLAUDE.md manifests study
  - 2025-10 — ACE
  - 2025-11 — Opus 4.5; Live-SWE-agent; "Canaries" revision (−16%)
  - 2025-12
    - Anthropic internal study (12-02)
    - Verified SOTA reaches 79.2% (12-05)
    - Google "scaling agent systems"
    - CodeRabbit (12-17)
- **2026**
  - 2026-01
    - Anthropic Economic Index (01-15)
    - AGENTS.md efficiency study
    - TH1.1 and Anthropic skill-formation RCT (01-29)
  - 2026-02
    - Opus 4.6 (02-05)
    - ETH AGENTS.md study (02-12)
    - SkillsBench; AIDev MSR'26
    - Anthropic autonomy telemetry (02-18)
    - METR update (02-24)
    - Last official SWE-bench entry (02-26)
  - 2026-03 — CSA README-injection note; Pragmatic Engineer 2026 survey
  - 2026-04 — AgenticFlict
  - 2026-06/07 — GitClear "Maintainability Gap"; Khatri ablation (07-28); cross-agent conflicts study; agent data-injection study
  - 2026-08 — JetBrains adoption report; 138k-SKILL.md defect study
  - 2026-09 — Opus 5.5 with Terminal-Bench 4.0 at 66.4% (09-22); Anthropic R&D automation index: Claude "leads" on 26% of AI R&D work
  - 2026-10
    - Stack Overflow 2026 (10-06)
    - Claude Code TOCTOU and plugin-pin advisories (10-05, 10-09)
    - Anthropic "unintended model actions" (10-09)
    - Skills-utility study

---

## 6. Sources

**Productivity and surveys**
- The Impact of AI on Developer Productivity: Evidence from GitHub Copilot — Peng, Kalliamvakou, Cihon, Demirer — Feb 2023 — arXiv — https://arxiv.org/abs/2302.06590v1 ; https://www.microsoft.com/en-us/research/publication/the-impact-of-ai-on-developer-productivity-evidence-from-github-copilot — lab RCT, +55.8% — [primary]
- The Effects of Generative AI on High-Skilled Work — Cui, Demirer, Jaffe, Musolff, Peng, Salz — 2024/2025 — Management Science — https://www.microsoft.com/en-us/research/?p=1148213 ; https://pubsonline.informs.org/doi/fpi/10.1287/mnsc.2025.00535 — 4,867 devs, +26.08% — [primary]
- How much does AI impact development speed? — Paradis et al. (Google) — Oct 2024 — ICSE-SEIP 2025 — https://arxiv.org/html/2410.12944v2 — ~21% faster — [primary, via search extract]
- Measuring the Impact of Early-2025 AI on Experienced OSS Developer Productivity — Becker, Rush, Barnes, Rein (METR) — Jul 2025 — METR/arXiv — https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ ; https://arxiv.org/abs/2507.09089v1 — +19% time — [primary, via extract]
- We are Changing our Developer Productivity Experiment Design — METR — 24 Feb 2026 — https://metr.org/blog/2026-02-24-uplift-update/ — late-2025 results unreliable — [primary, via extract]
- Measuring-Late-2025-AI-on-OSS-Devs — METR — Feb 2026 — GitHub — https://github.com/METR/Measuring-Late-2025-AI-on-OSS-Devs — data I re-analyzed — [primary]
- Does AI Actually Boost Developer Productivity? (100k devs) — Denisov-Blanch (Stanford) — 2025 — talk — https://proxify.io/articles/stanford-study-of-100000-developers-on-engineering-productivity — greenfield vs brownfield — [secondary]
- AI Productivity Paradox — Faros AI — 2025 — vendor — https://www.augmentcode.com/guides/ai-productivity-paradox-engineering-delivery — +98% PRs, +91% review time — [secondary]
- AI-assisted engineering Q4 impact report — DX — late 2025 — vendor — https://getdx.com/report/ai-assisted-engineering-q4-impact-report/ — 3.6 h/week, 22% AI code — [primary, via extract]
- AI-assisted engineering Q1 impact report — DX — 2026 — vendor — https://getdx.com/report/ai-assisted-engineering-q1-impact-report/ — ~30% AI code — [secondary extract]
- 2024 DORA highlights — Google Cloud/DORA — 22 Oct 2024 — https://cloud.google.com/blog/products/devops-sre/announcing-the-2024-dora-report — −1.5% / −7.2% — [primary]
- Announcing the 2025 DORA Report — Google Cloud — 23 Sep 2025 — https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report — throughput up, stability down — [primary]
- DORA AI Capabilities Model — Storer, DeBellis — 23 Sep 2025 — https://cloud.google.com/blog/products/ai-machine-learning/introducing-doras-inaugural-ai-capabilities-model — seven amplifiers — [primary]
- Stack Overflow 2025 survey coverage — InfoWorld — Jul 2025 — https://infoworld.com/article/4031673/ai-use-among-software-developers-grows-but-trust-remains-an-issue-stack-overflow-survey.html — 46% distrust — [secondary]
- Results of the 2026 Developer Survey — Stack Overflow — 6 Oct 2026 — https://stackoverflow.blog/2026/10/06/the-results-of-the-2026-developer-survey-are-here/ ; https://survey.stackoverflow.co/2026/ai/data — 6.6% trust for important decisions — [primary, via extract]
- AI Tooling for Software Engineers in 2026 — Pragmatic Engineer — Mar 2026 — https://newsletter.pragmaticengineer.com/p/ai-tooling-2026 — ~906 respondents — [primary, via extract]
- AI Coding Agents: Adoption Trends — JetBrains Research — Aug 2026 — https://blog.jetbrains.com/research/2026/08/ai-coding-agent-adoption-2026/ — ~39% use Claude Code — [secondary extract]

**Anthropic data (vendor)**
- AI's impact on software development — Anthropic — Apr 2025 — https://www.anthropic.com/research/impact-software-development — [primary]
- Economic Index reports — Anthropic — Sep 2025, Jan 2026 — https://www.anthropic.com/research/anthropic-economic-index-september-2025-report ; https://www.anthropic.com/research/anthropic-economic-index-january-2026-report — [primary]
- How AI is transforming work at Anthropic — 2 Dec 2025 — https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic — [primary]
- Measuring AI agent autonomy in practice — 18 Feb 2026 — https://www.anthropic.com/research/measuring-agent-autonomy — [primary]
- Estimating AI productivity gains — Nov 2025 — https://www.anthropic.com/research/estimating-productivity-gains — [primary]
- Measurements for understanding the pace of AI development inside frontier labs — Anthropic Institute — 17 Sep 2026 — https://www.anthropic.com/institute/measuring-pace-of-ai-development — R&D automation index — [primary]

**Quality and security**
- GitClear 2025 coverage — DevClass — Feb 2025 — https://devclass.com/2025/02/20/ai-is-eroding-code-quality-states-new-in-depth-report/ — [secondary]
- The Maintainability Gap: 2026 — GitClear — mid-2026 — https://www.gitclear.com/the_ai_code_quality_maintainability_gap — [primary page; figures via secondary]
- Uplevel coverage — CIO — Sep 2024 — https://cio.com/article/3540579/devs-gaining-little-if-anything-from-ai-coding-assistants.html — [secondary]
- State of AI vs Human Code Generation — CodeRabbit — 17 Dec 2025 — https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report ; https://www.theregister.com/2025/12/17/ai_code_bugs/ — [vendor / secondary]
- 2025 GenAI Code Security Report — Veracode — 30 Jul 2025 — https://www.veracode.com/press-release/ai-generated-code-poses-major-security-risks-in-nearly-half-of-all-development-tasks-veracode-research-reveals/ — [primary, via extract]
- We Have a Package for You! — Spracklen et al. — Aug 2025 — USENIX Security — https://www.usenix.org/conference/usenixsecurity25/presentation/spracklen ; https://arxiv.org/abs/2406.10279v3 — [primary, via extract]
- Package hallucination replication — 2026 — arXiv 2605.17062 — https://www.alphaxiv.org/abs/2605.17062.md — [secondary listing]
- Lethal trifecta coverage — AI Weekly / HiddenLayer — Jun 2025 — https://aiweekly.co/alerts/willison-names-lethal-trifecta-behind-ai-agent-data-leaks ; https://www.hiddenlayer.com/research/the-lethal-trifecta-and-how-to-defend-against-it — [secondary]
- Claude Code security advisories — Anthropic — Jun 2025–Oct 2026 — https://github.com/anthropics/claude-code/security/advisories — 34 tallied — [primary]
- Cursor security advisories — Anysphere — https://github.com/cursor/cursor/security/advisories — [primary]
- Codex security advisories — OpenAI — https://github.com/openai/codex/security/advisories — [primary]
- README instruction injection note — Cloud Security Alliance — 17 Mar 2026 — https://labs.cloudsecurityalliance.org/wp-content/uploads/2026/03/CSA_research_note_readme_instruction_injection_ai_coding_agents_20260317-csa-styled.pdf — [secondary]
- Agent Data Injection Attacks are Realistic Threats — 2026 — arXiv — https://arxiv.org/pdf/2607.05120 — [primary, via extract]
- Investigating unintended model actions — Anthropic — 9 Oct 2026 — https://www.anthropic.com/research/investigating-unintended-model-actions — [primary]

**Agent PRs**
- The Rise of AI Teammates in SE 3.0 — Li, Zhang, Hassan — Jul 2025 — https://arxiv.org/html/2507.15003v1 — [primary, via extract]
- AI_Teammates_in_SE3 / AIDev — SAIL — https://github.com/SAILResearch/AI_Teammates_in_SE3 — [primary]
- AIDev: Studying AI Coding Agents on GitHub — Feb 2026 — MSR'26 — https://arxiv.org/html/2602.09185v1 — [primary, via extract]
- Where Do AI Coding Agents Fail? — Jan 2026 — https://arxiv.org/html/2601.15195 — [primary, via extract]
- AgenticFlict — Apr 2026 — https://arxiv.org/html/2604.03551v2 — [primary, via extract]
- AI Agent PRs: Frequency, Structure, Merge Conflict Rates — Jul 2026 — https://arxiv.org/html/2607.04697 — [primary, via extract]

**Skills and labor**
- How AI assistance impacts the formation of coding skills — Shen, Tamkin (Anthropic) — 29 Jan 2026 — https://www.anthropic.com/research/AI-assistance-coding-skills ; https://arxiv.org/html/2601.20245v2 — [primary]
- Canaries in the Coal Mine? — Brynjolfsson, Chandar, Chen — Aug/Nov 2025 — Stanford DEL — https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine ; https://digitaleconomy.stanford.edu/app/uploads/2025/11/CanariesintheCoalMine_Nov25.pdf — [primary, via extract]
- Canaries, interest rates and timing — Stanford DEL — 9 Feb 2026 — https://digitaleconomy.stanford.edu/news/canaries-interest-rates-and-timinga-more-on-recent-drivers-of-employment-changes-for-young-workers — [primary, via extract]
- AI code generators and novice learners — Kazemitabaar et al. — 2023 — CHI — https://dl.acm.org/doi/full/10.1145/3544548.3580919 — [primary, via extract]

**Agent design, context, multi-agent, verification**
- SWE-agent — Yang et al. — NeurIPS 2024 — https://github.com/SWE-agent/SWE-agent — [primary]
- mini-swe-agent — https://github.com/SWE-agent/mini-swe-agent — [primary]
- Agentless — Xia et al. — Jul 2024 — https://github.com/OpenAutoCoder/Agentless — [primary]
- Live-SWE-agent — Nov 2025 — https://github.com/OpenAutoCoder/live-swe-agent — [primary]
- CodeAct — Wang et al. — ICML 2024 — https://github.com/xingyaoww/code-act — [primary]
- OpenHands — https://github.com/OpenHands/OpenHands — [primary]
- SWE-bench leaderboard data — https://github.com/SWE-bench/swe-bench.github.io (data/leaderboards.json, master) — [primary]
- Lost in the Middle — Liu et al. — 2023/TACL 2024 — https://arxiv.org/abs/2307.03172 ; https://github.com/nelson-liu/lost-in-the-middle — [primary]
- Context Rot — Hong, Troynikov, Huber — 14 Jul 2025 — https://research.trychroma.com/context-rot ; https://github.com/chroma-core/context-rot — [primary, via extract]
- How Many Instructions Can LLMs Follow at Once? — Jaroslawicz et al. — NeurIPS 2025 — https://arxiv.org/abs/2507.11538 ; https://neurips.cc/virtual/2025/122417 — [primary, via extract]
- Agentic Context Engineering — Zhang et al. — ICLR 2026 — https://www.microsoft.com/en-us/research/publication/agentic-context-engineering-evolving-contexts-for-self-improving-language-models/ — [primary]
- On the Use of Agentic Coding Manifests — Chatlatanagulchai et al. — Sep 2025 — https://arxiv.org/pdf/2509.14744 — [primary, via extract]
- Evaluating AGENTS.md — Gloaguen et al. (ETH) — 12 Feb 2026 — https://arxiv.org/pdf/2602.11988 ; https://github.com/eth-sri/agentbench — [primary, via extract]
- On the Impact of AGENTS.md Files on Efficiency — Lulla et al. — Jan 2026 — https://arxiv.org/abs/2601.20404v1 — [primary, via extract]
- Do Context Files Help Coding Agents? — Khatri — 28 Jul 2026 — https://arxiv.org/pdf/2607.27250 — [primary, via extract]
- SkillsBench — Feb 2026 — https://www.emergentmind.com/papers/2602.12670 — [secondary aggregator]
- What Keeps Agent Skills from Being Reusable? — 2026 — https://arxiv.org/html/2608.08453v1 — [primary, via extract]
- Agent Skills' Downstream Utility — Oct 2026 — https://arxiv.org/html/2610.08875 — [primary, via extract]
- MAST — Cemri et al. — Mar 2025 — https://github.com/multi-agent-systems-failure-taxonomy/MAST — [primary]
- Towards a Science of Scaling Agent Systems — Google/DeepMind/MIT — Dec 2025 — https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/ ; https://arxiv.org/html/2512.08296v1 — [primary, via extract]
- Multi-agent research system — Anthropic — 13 Jun 2025 — https://www.anthropic.com/engineering/multi-agent-research-system — [primary]
- CodeMonkeys — Ehrlich et al. — Jan 2025 — https://github.com/ScalingIntelligence/codemonkeys — [primary]
- R2E-Gym — Jain et al. — COLM 2025 — https://github.com/R2E-Gym/R2E-Gym — [primary]
- SWE-Gym — Pan et al. — ICML 2025 — https://github.com/SWE-Gym/SWE-Gym — [primary]
- Darwin Gödel Machine — Zhang, Hu, Lu, Lange, Clune — May 2025 — https://github.com/jennyzzt/dgm — [primary]
- SICA — Robeyns, Szummer, Aitchison — 2025 — https://github.com/MaximeRobeyns/self_improving_coding_agent — [primary]

**Capability**
- Time Horizon 1.1 — METR — 29 Jan 2026 — https://metr.org/blog/2026-1-29-time-horizon-1-1/ — [primary, via extract]
- eval-analysis-public — METR — synced Mar 2026 — https://github.com/METR/eval-analysis-public — [primary]
- SWE-bench Pro — Scale AI — https://github.com/scaleapi/SWE-bench_Pro-os — [primary]
- Terminal-Bench / Harbor — Laude Institute — https://github.com/laude-institute/terminal-bench ; https://github.com/laude-institute/harbor — [primary]
- Claude Opus 4.5 / 4.6 / 5.5 announcements — Anthropic — Nov 2025 / Feb 2026 / Sep 2026 — https://www.anthropic.com/news/claude-opus-4-5 ; https://www.anthropic.com/news/claude-opus-4-6 ; https://www.anthropic.com/claude-opus-5-5 — [primary, vendor]
- MirrorCode — Epoch AI / METR — 2026 — https://github.com/METR/MirrorCode — [primary]

---

## 7. Unverified / low-confidence items

- **Secondary-only figures (I could not reach the primary pages):**
  - DX Q1 2026 (~30% AI-written code; +50% defects for some teams)
  - Faros (+91% review time, +154% PR size, +9% bugs)
  - Stanford 100k-developer bands
  - all GitClear 2026 metrics
  - Pragmatic Engineer "most loved" percentages
  - Stack Overflow 2026 agent-choice shares (66% / 59%) and its conflicting respondent counts (16,664 vs 30,000+)
  - JetBrains 39%
  - SkillsBench +16.2 points
  - ETH per-benchmark deltas
  - the "49 SWE skills, +1.2%" study, whose paper ID I could not pin down
- **METR horizons for 2026 models:**
  - A secondary claim puts "Claude Mythos Preview" at a ~17.4h horizon (Mar 2026). Unverified.
  - A "Time Horizon 2.0" exists according to a forum post title.
  - No primary METR figures for Opus 4.6, GPT-5.3-Codex, or later models were retrieved.
- **From memory, not re-verified:**
  - Google scaling-paper effect sizes that circulate online: sequential degradation of 39–70%; error amplification of ~17× for independent agents vs ~4× for centralized; a ~45% single-agent saturation threshold.
  - MAST has 14 failure modes and κ≈0.88.
  - DGM: 20%→50% on SWE-bench and 14.2%→30.7% on Polyglot.
  - SICA: 17%→53%.
  - Peng et al.'s CI of 21–89%.
- **CVE-ID mappings come from secondary write-ups.** The GitHub advisories I read list GHSA IDs only. The mappings are:
  - Claude Code: CVE-2025-59536 and CVE-2026-21852
  - Copilot: CVE-2025-53773 (CVSS 9.6)
  - Cursor: CVE-2025-54135 and CVE-2026-22708
- **Not verified:**
  - Atlassian State of DevEx 2025 ("68% save 10+ h/week")
  - Jellyfish and LinearB AI statistics
  - a reported UChicago/Cursor working paper on organizations that default to agents
  - 2026 vendor scores on SWE-bench Pro and Terminal-Bench 2.0
- **Titles seen but not read:**
  - arXiv 2605.23135 (longitudinal study of AI coding assistants)
  - 2605.18461 ("One Developer Is All You Need")
  - 2608.20446 (vibe-coding review)
  - 2604.16399 (IACDM)
  - 2601.18749 (developer vs agentic PRs)
  - 2607.05743 (execution-security balkanization)
  - 2607.24606 (junior developers)
- **Gap:** I found no controlled evidence on spec-driven or TDD agent workflows. The search budget ran out before a dedicated sweep, so a follow-up search is recommended.
