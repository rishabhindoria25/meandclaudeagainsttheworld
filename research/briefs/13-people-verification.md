# Brief 13 (second pass): Anthropic staff and practitioners, verification (as of 11 Oct 2026)

**How this was checked**
- Willison corpus first.
- Then GitHub-hosted copies ("mirror") of pages that were blocked, read through raw.githubusercontent.com and GitHub code search.
- Then claude.com, fetched directly.
- Then 22 web searches.
- Dates of X posts were decoded from their status IDs.
- x.com, YouTube, podcast sites and personal blogs were never fetched.

## 1. Verification ledger

| Claim (report wording, §) | Verdict | Correct wording / detail | Source(s), date |
|---|---|---|---|
| §4.1 Boris, 2 Jan 2026 thread: "5 terminal tabs plus 5–10 web sessions", teleport, phone | **Confirmed** (secondary) | Tweet 1: *"I run 5 Claudes in parallel in my terminal. I number my tabs 1-5, and use system notifications to know when a Claude needs input."* Tweet 2 adds 5–10 on claude.ai/code: "hand off local sessions to web (using &)… --teleport back and forth". He also starts sessions from the iOS app. | Thread text quoted in a search summary; [0xquinto/bcherny-claude](https://github.com/0xquinto/bcherny-claude); [SKZL playbook](https://github.com/SKZL-AI/boris-cherny-claude-code-playbook) TIPS #01.01–02; [status/2007179832300581177](https://x.com/bcherny/status/2007179832300581177) (2 Jan, 19:58 UTC) |
| §4.1 "Opus with thinking for everything" | **Confirmed** (secondary) | Opus 4.5 with thinking. Less steering and better tool use, so it is "almost always faster in the end". | SKZL #09.01 |
| §4.1 shared CLAUDE.md "after every mistake"; tagging @claude on PRs | **Partly confirmed** (secondary only) | *"Anytime we see Claude do something incorrectly we add it to the CLAUDE.md."* He tags **`@.claude`** on coworkers' PRs through the GitHub Action (`/install-github-action`), and calls it his version of Shipper's "Compounding Engineering". Each team owns its own CLAUDE.md. | SKZL #03.01–04 |
| §4.1 `/commit-push-pr`; `code-simplifier` and `verify-app`; PostToolUse formatter | **Confirmed** (secondary ×2, plus the shipped plugin) | `/commit-push-pr` runs dozens of times a day, with inline bash pre-computing git status. The formatter hook (`Write|Edit` matcher) catches the ~10% of formatting Claude misses (paraphrase). | SKZL #04.02, #05.02–03, #06.01; 0xquinto settings; anthropics/claude-code plugins |
| §4.1 "Pre-allowed safe commands instead of `--dangerously-skip-permissions`" | **Partly confirmed; nuance** | That holds for normal work (`/permissions`, checked into settings.json). For **very long tasks** he runs `--permission-mode=dontAsk` or skip-permissions **inside a sandbox**. He pairs this with a background verifier, an agent Stop hook, or ralph-wiggum. | SKZL #07.01, #07.05, #11.01–03 |
| Brief 01 §7 "verification loop gives 2–3x the quality"; Chrome extension; Slack MCP / `bq` / Sentry | **Partly confirmed** (secondary, multiple) | *"Give Claude a way to verify its work — it will 2–3x the quality."* *"Claude tests every single change I land to claude.ai/code"* using the Chrome extension. Slack MCP is in `.mcp.json`. | SKZL #10.01–02, #08.01–03; 0xquinto CLAUDE.md |
| §4.1 31 Jan "3–5 git worktrees…" | **Corrected (nuance)** | These are tips from the team ("the single biggest productivity unlock"). Boris himself uses multiple git checkouts. | SKZL #01.03 |
| §4.1 24 May: auto mode is the "#1 tip" | **Partly confirmed** (secondary) | He first pushed auto mode in the **16 Apr 2026** Opus 4.7 thread ("Auto mode means no more permission prompts"). On 24 May he called it his #1 tip and "the key building block for multi-clauding". | SKZL #07.04; [status/2044847848035156457](https://x.com/bcherny/status/2044847848035156457) |
| Brief 01 §7 "100% of code by Claude, ~259 PRs in 30 days" | **Confirmed**, now dated | 27 Dec 2025: *"In the last thirty days, I landed 259 PRs -- 497 commits, 40k lines added, 38k lines removed. Every single line was written by Claude Code + Opus 4.5."* On Lenny's Podcast (19 Feb 2026) he said "100% of my code is written by Claude Code", with no hand edits since November and 10–30 PRs a day. | [Willison quote](https://simonwillison.net/2025/Dec/27/boris-cherny/) [primary quote via Willison]; Lenny's [via search summary] |
| Brief 01 §7: podcasts | **Dates filled** | Latent Space: May 2025. Pragmatic Engineer: article 23 Sep 2025, podcast 4 Mar 2026. Every *AI & I* (with Cat Wu): ~Nov 2025. Lenny's: 19 Feb 2026. **YC Startup School: 25–26 Jul 2026.** YC Light Cone: date not found. | §4 |
| Brief 06: Boris, "higher bar" (11 Sep) | **Confirmed** | *"Production code written by Claude should have a higher bar than if it was written by a human."* The checks he lists: lint rules, tests, Claude-driven E2E tests, daily Claude fuzzers, automated code and security review, and automated refactoring. Posted 11 Sep, 01:10 UTC (10 Sep US time). | [Willison, 11 Sep 2026](https://simonwillison.net/2026/Sep/11/boris-cherny/) [via Willison] |
| §11.4 fireside "Jul 2026" | **Corrected (date and title)** | Session title: "Claude Fable, Claude Tag, and Anthropic's Culture" (51:30), at AIE. Willison: "on Wednesday", i.e. 1 Jul. The schedule slot ID says 30 Jun. The transcript was posted 21 Jul. | [transcript](https://simonwillison.net/2026/Jul/21/cat-and-thariq/); Willison note, 3 Jul; ai.engineer listing [via search summary] |
| §11.3 "Claude Tag lands 65% of Claude Code product-engineering PRs" | **Confirmed; nuance** | *"our internal version of Claude Tag lands 65% of our product PRs right now"* (her product engineering team; self-reported). Tag runs on auto mode. Its team memory is "a markdown file per channel". | transcript |
| §11.4 agent review owns the "outer layers" after 6+ months | **Confirmed** | Code owners still review the core. *"For the changes at the outer layers, we actually have Claude code review fully review those."* Review graduated file by file once it was "catching 100% of the issues". PRs that caused incidents go into an eval set. | transcript |
| §11.4 system prompt down ~80%; per-model prompts | **Confirmed; scope added** | The cut came with Fable **and Opus 4.8**. *"It's only our most frontier models that have this 80% token decrease — the older models still have the full system prompt."* Examples and "do not" lists were removed. There are fewer tools: grep and glob were dropped for bash. Cat Wu had reported a **20%** cut for Opus 4.6 (19 Mar). | transcript; [Cat Wu, 19 Mar 2026](https://claude.com/resources/articles/product-management-on-the-ai-exponential) |
| Brief 06 "Cat Wu: say 'use your judgement' about testing" | **Corrected** | Not Cat's words. She described softening "always verify, verify, verify" into context, and checking how "a well-intentioned human" might misread a prompt. Willison paraphrased her as "tell Fable to use its own judgement when deciding to write tests". The prompt "use your judgement to decide an appropriate lower power model and run that in a subagent" is **Willison's own**, built on a tip from Jesse Vincent. | transcript; Willison note "Fable's judgement", 3 Jul |
| §4.1 / brief 06 "auto mode used by almost everyone at Anthropic" | **Confirmed** | *"Broadly within Anthropic, almost every single person uses auto mode."* Internal since January, public 24 Mar. A Sonnet classifier rules on tool calls and on sandbox escapes. Default since 14 Aug. In Anthropic's published evals, humans refused 13.6% of dangerous commands while auto mode blocked 89%, and 0 of 720 injections succeeded. Counterpoint: Johann Rehberger reports an ~80% bypass via a "confused environment" attack. | [Willison, 8 Aug](https://simonwillison.net/2026/Aug/8/auto-mode/); [Willison, 27 Aug](https://simonwillison.net/2026/Aug/27/breaking-claude-code-opus-5-auto-mode/) |
| Brief 01 §7 PDF: Vim mode ~70% autonomous | **Confirmed**; attribution | The Claude Code (product development) team: *"roughly 70% of the final implementation came from Claude's autonomous work, requiring only a few iterations."* The web article credits the Product Design team instead ("minimal human review"). | [PDF mirror](https://raw.githubusercontent.com/Ttuandatt/IELTS_Instructor/main/docs/How-Anthropic-teams-use-Claude-Code_v2.md); [web, 24 Jul 2025](https://claude.com/resources/articles/how-anthropic-teams-use-claude-code) |
| PDF: "slot machine" | **Confirmed**; attribution | Data Science and ML Engineering teams: *"Save your state before letting Claude work, let it run for 30 minutes, then either accept the result or start fresh… Starting over often has a higher success rate."* | PDF mirror |
| PDF: first-try success ~1/3 | **Confirmed**; attribution | RL Engineering team, small-to-medium PRs: *"it only works on first attempt about one-third of the time."* | PDF mirror |
| PDF: security team owns ~half of slash commands | **Confirmed** | *"Security engineering uses 50% of all custom slash command implementations in the entire monorepo."* | PDF mirror |
| Brief 05 §2.24 Sankalp, "Claude Code 2.0" (~Dec 2025) | **Partly confirmed** (secondary ×2) | 27 Dec 2025, titled on the page "A Guide to Claude Code 2.0 and getting better at using coding agents". *"I would do a handoff or compact when I reach total 60% if building something complex."* *"Effective context windows are probably 50-60% or even lesser."* Custom `/handoff` command; plans and todos survive compaction. Compares Opus 4.5 with GPT-5.2-Codex. | [post](https://sankalp.bearblog.dev/my-experience-with-claude-code-20-and-how-to-get-better-at-using-coding-agents/); GitHub notes (§4) |
| Diwank Singh (Julep), "Field notes" | **Confirmed** (mirror) | 7 Jun 2025. Anchor comments `AIDEV-NOTE`, `AIDEV-TODO`, `AIDEV-QUESTION`, which the agent greps before scanning. *"Never. Let. AI. Write. Your. Tests."* *"If an AI tool touches a test file, the PR gets rejected."* | mirror |
| Lee Robinson: cursor.com off its CMS; "complexity budgets" | **Partly confirmed** (3 secondary notes) | "Coding Agents & Complexity Budgets", leerob.com/agents, ~1 Dec 2025. Done in 3 days for **$260.32 of tokens**: 344 agent requests, 67 commits, +43k/−322k lines, builds about 2× faster. Thesis: agents raise the cost of abstractions such as a CMS, i18n layers and preview systems. | notes (§4) |
| Jeremy Howard as critic; SolveIt and "dialog engineering" | **Partly confirmed** | On Machine Learning Street Talk (~Mar 2026), vibe coding as "a slot machine": an illusion of productivity and control [via search summary]. SolveIt (Howard and Whitaker) works in small verified steps with editable dialogs ("Dialog Engineering Keeps Context Useful"). It makes hands-off AI coding "(intentionally) hard". | Whitaker, 12 Sep 2025 |
| Brief 05 §7 Shrivu: "constitution"; no @-includes; /clear + "Document & Clear"; Master-Clone; block-at-submit | **Confirmed**, all five (mirror) | 2 Nov 2025. Monorepo CLAUDE.md is 13KB, with token "ad space" allotted to each tool. "Don't @-File Docs": pitch "why and when to read the file". `/compact` "(Avoid)". *"I strongly prefer [Master-Clone] over the 'Lead-Specialist' model."* A PreToolUse hook on `git commit` requires a tests-passed marker. | [post](https://blog.sshh.io/p/how-i-use-every-claude-code-feature); mirror |
| Dex, "No Vibes Allowed" / "dumb zone" | **Confirmed** | AI Engineer Code Summit, **21 Nov 2025**. Results degrade past **~40%** of ~168k usable tokens. This tightens the 2025 "40–60%" advice. | speaker page; notes; transcript |
| HumanLayer, "Writing a good CLAUDE.md" | **Confirmed** (clipping) | 25 Nov 2025. "< 300 lines is best"; their own root file is "less than sixty lines". *"Frontier thinking LLMs can follow ~ 150-200 instructions"*, and the Claude Code system prompt holds ~50 already. CLAUDE.md is wrapped in *"IMPORTANT: this context may or may not be relevant to your tasks…"*. "Don't use /init." "Never send an LLM to do a linter's job." | clipping |
| "Everything We Got Wrong About RPI" (Mar 2026) / QRSPI | **Confirmed** (transcript) | Phases: questions → research (fresh context, blind to the goal) → design discussion (~200 lines) → structure outline ("C header files") → plan → worktree → implement → PR. Vertical, not horizontal, plans. *"Please read the code"*; you "still get two to 3x speed up". | transcript mirror |
| §5.2 "Why Software Factories Fail (2026)" | **Confirmed; context** | Write-up of his **AIE 2026 keynote**. *"In July 2025 we went full lights-off."* By "the ~third time in november" they rewrote from scratch, with his cofounder hand-coding for two weeks. *"There is no penalty for eroding codebase maintainability."* "Move 2-3x faster, safely." | [wsff.md](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md) |
| §6.4 Böckeler spec-driven development critique (Oct 2025) | **Confirmed** (clipping) | ~15 Oct 2025. Three levels: spec-first, spec-anchored, spec-as-source. Kiro turned a small bug into "4 'user stories' with a total of 16 acceptance criteria" ("sledgehammer to crack a nut"). *"I'd rather review code than all these markdown files."* "False sense of control?": the agent ignored notes and duplicated classes. MDD "never took off for business applications". | [article](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) |
| Manus, six lessons and ~10× | **Confirmed** (mirror) | Peak Ji, 18 Jul 2025. KV-cache hit rate is "the single most important metric". Use a stable prefix and append-only context. Mask, don't remove. File system as context. Recite with `todo.md` (~50 tool calls per task). Keep the wrong stuff in. Don't get few-shotted. Input:output ~100:1. Cached $0.30 vs uncached $3/MTok, "a 10x difference". Rebuilt four times. | mirror |
| Orosz, "How Claude Code is built" (Sep 2025) | **Partly confirmed** (paywalled) | 23 Sep 2025, interviewing Boris, Sid Bidasaria and Cat Wu. The stack (TS, React/Ink, Yoga, Bun) was picked to be "on distribution". ~90% of Claude Code is written by Claude Code (~100% of tests). ~5 PRs per engineer per day; 10+ prototypes per feature; subagents built in 3 days. | [via search summary] |
| Karpathy, 26 Jan extra lines; Jun–Oct 2026 | **Confirmed** (archive); **none found** after Jun | *"Don't tell it what to do, give it success criteria and watch it go."* "slowly starting to atrophy". "the year of the slopacolypse". Watch models "like a hawk, in a nice large IDE". 9 Jun: software "comes out on a tap". Nothing notable found Jul–Oct. | archive; [Willison, 9 Jun](https://simonwillison.net/2026/Jun/9/andrej-karpathy/) |
| Addy Osmani posts | **Dates confirmed** | "Workflow going into 2026": blog dated 4 Jan 2026 (the Medium copy is 19 Dec 2025). "Good spec": 13 Jan. "80% problem": 28 Jan. "Agentic Code Review": ~18 Jun (O'Reilly copy 26 Jun). | search summary; notes |
| §4.1 Fiona Fung, "no non-Claude-assisted commit"; Thariq's quiz | **Confirmed** (primary) | Fiona Fung (3 Jun): *"I don't think I've seen a non-Claude-assisted commit in the last four months."* Thariq (6 Jul): *"I only merge after I pass the quiz perfectly."* | claude.com |

## 2. New findings that fill gaps

**Boris Cherny**
- **YC Startup School (25–26 Jul 2026)** [secondary; YC video "We Cut 80% of Claude Code's Prompt"]:
  - Ablate prompts line by line.
  - *"Every 6 months, delete your claude.md file, delete your skills, and delete your hooks."* Then re-add only what still fails.
  - "Product overhang": over-specifying hobbles strong models.
- **Other 2026 posts** [secondary]:
  - 15 Jul: "encode domain knowledge as infrastructure": CLAUDE.md, a **REVIEW.md**, skills.
  - 17 Jul: measure ROI in engineering hours, not tokens.
  - 23 Sep: used **Lean** with Opus 5.5 to verify the Agent SDK formally, yielding 16 bug-fix PRs. A real-user-monitoring-verified performance loop made claude.ai about 3× faster over 3,000+ changes.
  - 6 Oct: *"Talk to Claude the way you would a coworker"*. Specify only what you want done, how much effort, and how Claude should verify.
- **Code w/ Claude SF (6 May 2026):** "Live coding session with Boris Cherny and Jarred Sumner" (claude.com).

**Cat Wu** (brief 01 found no first-party source; there is one)
- **"Product management on the AI exponential" (19 Mar 2026):**
  - She tests each model by having Claude Code add a table tool to Excalidraw. Opus 4 succeeded "occasionally"; Opus 4.6 does it live.
  - Her early projects: *"hundreds of hours of prompting… but not a single line of code written by hand."*
  - Tools: Claude.ai for thinking, Claude Code for prototypes and evals, Cowork for everything else.
  - Four shifts:
    - Short sprints and "side quests" (AskUserQuestion and todo lists came from these).
    - Demos and evals over docs: *"after you write a spec, send it to Claude Code and see if it can build it."*
    - Revisit features with each new model: *"Use more tokens than you think you need."*
    - "Do the simple thing that works": remove model workarounds once they're no longer needed.
- **Fireside:**
  - Idea-to-build time down "from six to twelve months to maybe even a week".
  - Ships only features that clear an internal retention bar.
  - Engineers drive Remote Control sessions from the couch.
  - Credential injection: the agent can use a credential but cannot read it.
- **Elsewhere** [via search summary]: TechCrunch interview (May 2026); "Behind the Craft" podcast.

**Thariq Shihipar**
- Talks:
  - ACM CAIS keynote, San Jose, 29 May 2026 [via search summary].
  - Led the "How we Claude Code" workshop at Code w/ Claude (7 May; session page dated, speaker named in a search summary).
  - An AIE morning keynote on grief and "Deep Blue" (title unknown).
- Fireside lines: *"a codebase is a spec, and maybe it's the only copy"*; "rewrites are now good"; tool design is "more of a biology than a physics"; "Claude prompting Claude all the way down"; AskUserQuestion was his.
- Posts [via Willison]: "we build our entire harness around prompt caching" (Feb); **"The Unreasonable Effectiveness of HTML"** (8 May: ask for HTML explainers, including for PR review; not in the report); AGENTS.md support built as a mod (18 Sep).

**Fiona Fung:** Code w/ Claude talk "Running an AI-native engineering org" (6 May): what broke in review, ownership and hiring.

**Lydia Hallie:** nothing found beyond the 7 Jul and 14 Aug articles already cited.

**PDF extras (Jul 2025)**
- Review the "80% complete solution".
- Data science saw 2–4× savings on refactors and built 5,000-line TS dashboards. Tip: "Interrupt for simplicity".
- Security incident triage fell from 10–15 to ~5 minutes.

**Practitioners**
- **Diwank:**
  - Three modes (Playground at 80–90% AI; Pair Programming; Production).
  - CLAUDE.md as "a constitution for your codebase". Golden Rule: *"When unsure about implementation details, ALWAYS ask the developer."*
  - A "What AI Must NEVER Do" list: tests, API contracts, migrations, secrets.
  - Tag AI commits `[AI]`. Front-load context (a starved prompt cost 4× the tokens). "One task, one session."
- **Shrivu:**
  - Don't just say "never"; give an alternative.
  - Mine session logs and GitHub Action logs for failures.
  - The GitHub Action is his "most slept on" feature.
  - Playwright is his only MCP.
- **Dex:**
  - Per third-party notes on "No Vibes Allowed" (not checked against the video): static CLAUDE.md files drift out of date, so he prefers on-demand research by subagents.
  - The same notes quote him: "If you have a front-end sub-agent and a backend sub-agent and a QA sub-agent, please stop."

**New Jun–Oct 2026 write-ups and talks not in the report**
1. **Willison keynote, "2026 in LLMs (so far)"** (WeAreDevelopers World Congress NA, San Jose, 25 Sep; posted 27 Sep).
   - "AI mania": idle agents feel like wasted time.
   - A "Fable class model" will solve a problem by brute force *if* you clearly define the goal, give unambiguous constraints and provide the tools. Doing those three things "is kind of what software engineering *is*".
   - ~40 of 277 sessions touched on sandboxing or agent security.
   - *"If it's easy, the agent will do it. Everything that's left for me is difficult."*
2. **Willison, "A new feature for my blog, built using my voice"** (9 Oct).
   - Codex voice mode with GPT-6 Astra High.
   - First prompt: "Start dev server and open in browser".
   - ~30 minutes of talking while cooking, then a GitHub PR review and ~30 minutes of typed fixes.
3. **Willison notes** "More than just code review" (22 Aug) and "harder" (24 Sep).
   - The key skill is to "confidently instruct… and then confidently verify".
   - *"Eyeballing every line of code has never been the most effective way to validate a change to a piece of software."*
   - Agents "make software engineering even harder… extraordinary discipline".
4. **Thomas Ptacek, "Stop Making TUIs"** (20 Aug). Agents make native GUIs nearly free: *"Go build a native UI."*
5. **Boris at YC Startup School** (25–26 Jul): the ablation and "delete every 6 months" advice above.
6. **Dex Horthy, AIE 2026 keynote → wsff.md**. A lights-off post-mortem; also a Pragmatic Engineer conversation with Orosz (Jul 2026).
7. **AIE 2026 popular talks** [via search summary]: "Building Great Agent Skills: The Missing Manual"; Checkout.com, "Your coding agent doesn't always follow your rules".

## 3. Suggested edits

1. **§4.1 caption.**
   - Old: "reconstructed from a community summary because x.com was blocked"
   - New: "reconstructed from two community compilations (0xquinto; SKZL-AI, which cites each status URL) and search summaries quoting the thread. The 259-PR and 'higher bar' posts are quoted verbatim by Willison."
2. **§4.1, 2 Jan row.** Append: "His top tip (community compilations call it the most important): give Claude a way to verify its work, which 'will 2–3x the quality'; Claude tests every claude.ai/code change in Chrome. He tags `@.claude` on PRs to add CLAUDE.md rules. For long tasks he uses dontAsk or skip-permissions only in a sandbox."
3. **§4.1, 31 Jan row.**
   - Old: "**3–5 git worktrees**"
   - New: "Team tips: **3–5 git worktrees** ('the single biggest productivity unlock'; Boris uses multiple checkouts)"
4. **§4.1, add rows.**
   - "**27 Dec 2025**: 259 PRs in 30 days, 'every single line… written by Claude Code + Opus 4.5'."
   - "**16 Apr 2026**: auto mode introduced in his Opus 4.7 tips."
   - "**25–26 Jul**: YC Startup School: cut 80% of the prompt; delete CLAUDE.md, skills and hooks every 6 months and re-add what fails."
   - "**11 Sep**: Claude-written production code needs a *higher* bar."
5. **§4.1, add a 2025 baseline.** "'How Anthropic teams use Claude Code' (Jul 2025):
   - the Claude Code team let Claude write ~70% of Vim mode;
   - data scientists used it 'like a slot machine' (save state, 30 minutes, keep or restart);
   - RL engineers got a first try right 'about one-third of the time';
   - security engineering wrote half of the monorepo's custom slash commands."
6. **§11.4.** Old: "system prompt for frontier models is **down 80%**" → New: "…**down 80%** for the newest models only (Fable, Opus 4.8; older models keep the full prompt; earlier a 20% cut for Opus 4.6)". Date the fireside to **30 Jun / 1 Jul**.
7. **Brief 06.** Old: "Cat Wu: say 'use your judgement' about testing" → New: "Cat Wu: replace absolute rules ('always verify') with context about when verification matters. 'Use your judgement' is Willison's paraphrase and prompt."
8. **§5.1 #3.** Old: "Dex Horthy's 'keep utilization at 40–60%'" → New: "Dex Horthy's 40–60% (Aug 2025), tightened to a '~40% dumb zone' (Nov 2025), plus a ~150–200-instruction budget". "Manus's offload / reduce / isolate" → "Manus's KV-cache-first design (cached tokens are 10× cheaper), mask-don't-remove and todo.md recitation".
9. **§5.2 Dex.** Prepend: "His AIE 2026 keynote recounts a July 2025 lights-off experiment that ended in a hand rewrite in November. QRSPI splits planning into questions → objective research → ~200-line design → structure outline → plan."
10. **§5.2 Karpathy.** Append: "…but 'watch them like a hawk'; 'Don't tell it what to do, give it success criteria'; skill 'atrophy'; 'the year of the slopacolypse'."
11. **§5.2 "Others", add:**
    - Shrivu: CLAUDE.md as "constitution" with token "ad space"; never `@`-include docs; `/clear` + "Document & Clear"; Master-Clone; block-at-submit hooks.
    - Diwank: `AIDEV-*` anchor comments; humans write the tests.
    - Lee Robinson: CMS removed in 3 days for $260; agents raise the cost of abstractions.
    - Sankalp: `/handoff` at ~60% context.
    - Howard: vibe coding as a "slot machine"; SolveIt's small, understood steps.
12. **§6.4 spec-driven row.** Append: "Kiro turned a small bug into 4 stories and 16 acceptance criteria; 'I'd rather review code than all these markdown files'."
13. **Brief 01 §7 and brief 05 §7.** Remove from "unverified": the PDF, Shrivu, Manus, Böckeler, Diwank, HumanLayer, "No Vibes Allowed", Karpathy's 26 Jan notes. Keep Robinson, Sankalp and Howard flagged as secondary.

## 4. Sources

**Willison corpus**
- Boris quotes — Willison — 27 Dec 2025, 14 Feb 2026, 11 Sep 2026 — https://simonwillison.net/2025/Dec/27/boris-cherny/ ; https://simonwillison.net/2026/Feb/14/boris/ ; https://simonwillison.net/2026/Sep/11/boris-cherny/ — linked tweets — [via Willison]
- Fireside Chat with Cat and Thariq — Willison — 21 Jul 2026 — https://simonwillison.net/2026/Jul/21/cat-and-thariq/ — edited transcript — [primary quote via Willison]
- Notes "Understand to participate" (2 Jul), "Fable's judgement" (3 Jul), "More than just code review" (22 Aug), "harder" (24 Sep) — Willison — no URLs offline — [via Willison]
- Auto mode default; Breaking auto mode — Willison — 8 and 27 Aug 2026 — https://simonwillison.net/2026/Aug/8/auto-mode/ ; https://simonwillison.net/2026/Aug/27/breaking-claude-code-opus-5-auto-mode/ — [via Willison]
- Thariq posts — Willison — 20 Feb, 8 May, 18 Sep 2026 — https://simonwillison.net/2026/Feb/20/thariq-shihipar/ ; https://simonwillison.net/2026/May/8/unreasonable-effectiveness-of-html/ ; https://simonwillison.net/2026/Sep/18/thariq-shihipar/ — [via Willison]
- 2026 in LLMs (so far) — Willison — 27 Sep 2026 — https://simonwillison.net/2026/Sep/27/2026-in-llms-so-far/ — keynote — [primary]
- Built using my voice — Willison — 9 Oct 2026 — https://simonwillison.net/2026/Oct/9/built-using-my-voice/ — [primary]
- Stop Making TUIs — Ptacek, via Willison — 20/21 Aug 2026 — https://simonwillison.net/2026/Aug/21/stop-making-tuis/ — [via Willison]
- Karpathy quote — 9 Jun 2026 — https://simonwillison.net/2026/Jun/9/andrej-karpathy/ — [via Willison]

**Boris compilations and interviews**
- bcherny-claude — 0xquinto — 2026 — https://github.com/0xquinto/bcherny-claude — [secondary]
- Boris Cherny Claude Code Playbook (TIPS.md) — SKZL-AI — scanned 10 Oct 2026 — https://github.com/SKZL-AI/boris-cherny-claude-code-playbook — LLM-curated — [secondary]
- Lenny's Podcast — 19 Feb 2026 — https://www.lennysnewsletter.com/p/head-of-claude-code-what-happens — [via search summary]
- How Claude Code is built — Orosz — 23 Sep 2025 — https://newsletter.pragmaticengineer.com/p/how-claude-code-is-built — [via search summary]
- Building Claude Code with Boris Cherny — Pragmatic Engineer — 4 Mar 2026 — https://newsletter.pragmaticengineer.com/p/building-claude-code-with-boris-cherny — [via search summary]
- YC Startup School — Jul 2026 — https://www.ycombinator.com/library/UN-boris-cherny-building-claude-code (blocked); coverage https://zeli.app/zh/story/49077040 — [via search summary]

**Anthropic first-party**
- How Anthropic teams use Claude Code (web) — Anthropic — 24 Jul 2025 — https://claude.com/resources/articles/how-anthropic-teams-use-claude-code — [primary]
- The same, PDF — Anthropic — Jul 2025 — https://www-cdn.anthropic.com/58284b19e702b49db9302d5b6f135ad8871e7658.pdf (blocked); mirror https://raw.githubusercontent.com/Ttuandatt/IELTS_Instructor/main/docs/How-Anthropic-teams-use-Claude-Code_v2.md — [primary text via mirror]
- Product management on the AI exponential — Cat Wu — 19 Mar 2026 — https://claude.com/resources/articles/product-management-on-the-ai-exponential — [primary]
- Running an AI-native engineering org — Fiona Fung — 3 Jun 2026 — https://claude.com/resources/articles/running-an-ai-native-engineering-org — [primary]
- Field guide to Claude Fable 5 — Thariq — 6 Jul 2026 — https://claude.com/resources/articles/a-field-guide-to-claude-fable-finding-your-unknowns — [primary]
- Code w/ Claude SF sessions — 6–7 May 2026 — https://claude.com/code-with-claude/session/sf-live-coding-session-with-boris-cherny-and-jarred-sumner ; https://claude.com/code-with-claude/session/sf-running-an-ai-native-engineering-org ; https://claude.com/code-with-claude/session/sf-ext-how-we-claude-code — [primary]
- ACM CAIS 2026 schedule — https://caisconf.org/schedule/2026/ — [via search summary]

**Practitioners**
- Sankalp — 27 Dec 2025 — https://sankalp.bearblog.dev/my-experience-with-claude-code-20-and-how-to-get-better-at-using-coding-agents/ ; notes https://raw.githubusercontent.com/steveash/hitchhikers-guide-to-ai-native-engineering/main/source-notes/blog-sankalp-claude-code-20.md — [secondary]
- Diwank Singh — 7 Jun 2025 — https://diwank.space/field-notes-from-shipping-real-code-with-claude ; mirror https://raw.githubusercontent.com/foreveryh/claude-code-best-practices/main/content/sources/best-practices-%20Shipping%20Real%20Code.md — [primary text via mirror]
- Lee Robinson — ~1 Dec 2025 — https://leerob.com/agents ; notes https://raw.githubusercontent.com/dgirard/fiches-veille/main/fiches/2025-12/robinson-coding-agents-complexity-budgets-cursor-2025-12.md — [secondary]
- What Is Solveit? — Whitaker — 12 Sep 2025 — https://raw.githubusercontent.com/johnowhitaker/personal_site/main/posts/solveit.md — [primary]; Howard on MLST — https://stationlm.com/analysis/1aa103c5-0eb1-4bed-a391-3a91c4c2eb30 — [via search summary]
- Shrivu Shankar — 2 Nov 2025 — https://blog.sshh.io/p/how-i-use-every-claude-code-feature ; mirror https://raw.githubusercontent.com/ianchanning/safer-ralph/master/references/How%20I%20Use%20Every%20Claude%20Code%20Feature.md — [primary text via mirror]
- HumanLayer, Writing a good CLAUDE.md — 25 Nov 2025 — https://www.humanlayer.dev/blog/writing-a-good-claude-md ; clipping https://raw.githubusercontent.com/taka512/misc/main/bookmark/ai/Writing%20a%20good%20CLAUDE.md — [primary text via mirror]
- Dex Horthy talks — No Vibes Allowed (21 Nov 2025) https://www.youtube.com/watch?v=rmvDxxNubIg ; RPI→QRSPI transcript https://raw.githubusercontent.com/berdyshevol/sdlc-ai-wiki/main/raw/youtube-transcripts/dex-rpi-to-crispy.md ; Everything We Got Wrong https://www.youtube.com/watch?v=YwZR6tc7qYg — [primary text via mirror / secondary]
- Why Software Factories Fail — Horthy — ~Jul 2026 — https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md ; keynote https://www.youtube.com/watch?v=Ib5GBkD555M — [primary]
- Böckeler, SDD — ~15 Oct 2025 — https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html ; clipping https://raw.githubusercontent.com/salomao-santos/letramento-de-ia/main/raw/clippings/Understanding%20Spec-Driven-Development%20Kiro,%20spec-kit,%20and%20Tessl.md — [primary text via mirror]
- Manus — Peak Ji — 18 Jul 2025 — https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus ; mirror https://raw.githubusercontent.com/yzfly/awesome-context-engineering/main/docs/manus/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus.md — [primary text via mirror]
- Karpathy, 26 Jan 2026 — https://x.com/karpathy/status/2015883857489522876 ; archive https://raw.githubusercontent.com/zeuikli/cc-workspace-docs/main/docs/research/tweets/2026-01-26-@karpathy-522876.md — [primary text via mirror]
- Addy Osmani — https://addyosmani.com/blog/ai-coding-workflow/ ; https://addyo.substack.com/p/the-80-problem-in-agentic-coding ; https://addyo.substack.com/p/agentic-code-review — [via search summary / secondary]
- Geoffrey Litt — 1 Jul 2026 — https://youtu.be/WkBPX-oDMnA — [via Willison]

## 5. Still unknown

- The exact text of Boris's 2 Jan (beyond tweets 1–2), 31 Jan, 16 Apr and 24 May posts. Only community compilations were readable, one of them LLM-curated.
- The YC Startup School, Lenny's and Latent Space transcripts were not read directly. The Light Cone podcast date was not found.
- The title of Thariq's AIE keynote. Any 2026 talks by Lydia Hallie. The speakers of Code w/ Claude's "What's new" and "Thinking lever" sessions.
- The original texts of Lee Robinson's and Sankalp's posts. Whether Robinson's "$56,848 CDN" figure was spent or saved.
- Jeremy Howard's own written critique: only a podcast summary was found.
- Karpathy posts from Jul–Oct 2026: none found.
- The exact date of "Everything We Got Wrong About RPI": brief 08 says Mar 2026.
