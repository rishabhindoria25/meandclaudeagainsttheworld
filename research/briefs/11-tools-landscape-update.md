# Brief 11 (second pass): Coding-tool vendors, the Jun–Oct 2026 landscape, and independent comparisons (report §4.2, §9, §11.3, §3.9; briefs 03, 06, 08)

Method. I searched the Willison corpus first, then read GitHub-hosted primary material: the Codex, Gemini CLI, pi, OpenCode and Mistral Vibe releases; the Factory, Warp and Kiro READMEs; and a sparse clone of `github/docs` at be38ec5 (9 Oct 2026). Finally I ran 35 WebSearch calls.

Labels: [P] = primary, read directly; [W] = primary quote via Willison; [S] = search summary or secondary.

## 1. Verification ledger

| Claim (report wording, §) | Verdict | Correct wording / detail | Source, date |
|---|---|---|---|
| Cursor "Best practices for coding with agents" (Jan 2026): plan mode; revert and re-plan; short rules after repeated mistakes; capped hook loops; TDD; Debug Mode (§4.2) | Partly confirmed | Confirmed: the post exists and covers Plan Mode and Debug Mode (hypotheses plus runtime data). Not re-found: revert/re-plan, capped hooks, rule-after-repeat, TDD. Keep † on those. | cursor.com/blog/agent-best-practices [S] |
| "Scaling long-running autonomous coding": locks made 20 agents as fast as 2–3 (§4.2) | Confirmed | "Twenty agents slowed to the throughput of two or three", with most time spent waiting. | Cursor post via ZenML/Gigazine [S] |
| Planners → workers → judge; browser ~1M LOC in ~1 week (§4.2) | Confirmed | Quote: "ran for close to a week, writing over 1 million lines of code across 1,000 files" [W]. Peak was ~2,000 concurrent agents and ~30k commits [W]. Critics counted ~1.6M lines of Rust, and CI was failing at launch [W]. | Willison 19, 23, 27 Jan 2026 |
| Solid→React migration, +266K/−193K over 3 weeks (brief 03) | Confirmed (secondary) | — | ZenML [S] |
| GPT-5.2 > Opus 4.5; "Opus tends to stop earlier" (§4.2) | Still unverified | Not found. Related and verified: Lin found GPT-5.1/5.2 *general* models fit the harness better than GPT-5.1-Codex. | Willison 23 Jan [W] |
| Dynamic context discovery: −46.9% tokens (§4.2) | Confirmed, scope added | The −46.9% is total tokens *in runs that called an MCP tool*. Vendor A/B test, statistically significant, high variance by number of MCPs; no sample size published. | cursor.com/blog/dynamic-context-discovery [S] |
| Bugbot: 1M+ PRs, ~1.5M issues, ~half resolved (brief 03) | Confirmed (vendor) | In beta: >1M PRs reviewed, >1.5M issues found, >50% resolved by merge. | "Bugbot out of beta" [S] |
| Composer "4x faster"; base lineage (brief 03) | Confirmed / filled | Cursor 2.0 and Composer 1 shipped 29 Oct 2025 ("4x faster than similarly intelligent models"; base undisclosed). **Composer 2 (Mar 2026) is built on Kimi K2.5**, per Moonshot. | Willison 29 Oct 2025, 20 Mar 2026 [W] |
| Cursor 3 (2 Apr) "replaced the Composer pane with an Agents Window" (§11.3) | Corrected | The **Agents Window became primary; the editor stays as a secondary surface**. Agents run local, SSH, worktree or cloud, with local↔cloud handoff. No evidence for the "Composer pane" wording or for "Glass". | DataCamp and others [S] |
| Graphite acquisition, Dec 2025 (brief 08) | Confirmed | Agreed 19 Dec 2025. Terms undisclosed (cash plus equity). Graphite stays a standalone product. | SiliconANGLE, Fortune [S] |
| SpaceX ~$60B deal "reportedly closed around August… disputed" (§11.3) | Partly confirmed | **Agreement signed 16 Jun 2026** (all-stock, ~389.3M SpaceX shares). **Close reported 14 Aug** (or 15 Aug) per an 8-K I did not see. Cursor moves into **SpaceXAI**. Only the day is uncertain. | Tribune India, AI Weekly, Menastartupdigest [S] |
| "Self-driving codebases" post (task) | Filled (secondary) | "Towards self-driving codebases", 5 Feb 2026. Recursive planners; ~1,000 commits/hour. | plushcap index [S] |
| Cursor pricing 2026 (task) | Filled (secondary) | Hobby free; Pro $20; Pro+ $60; Ultra $200; Teams $40/user. Usage comes from credit pools: frontier models at API rates, and a separate pool for Auto/Composer. Bugbot pricing conflicts across sources. | jetadmin, aicodereview.cc [S] |
| "Don't Build Multi-Agents" quotes (§4.2) | Partly confirmed | "Actions carry implicit decisions, and conflicting decisions carry bad results" is confirmed; "share full traces" was not re-found. **New:** in Apr 2026 Cognition said "today, the landscape is different" and that it now ships specific multi-agent flows in Devin. | [S] |
| "Coding Agents 101"; SWE-grep (§4.2) | Still unverified | — | — |
| Devin 2025 review: 67% vs 34%, 4x, "senior… junior at execution", 4–8 h tasks (§4.2) | Partly confirmed | 14 Nov 2025 (vendor): "4x faster at problem solving", "67% of its PRs are now merged vs 34% last year". The senior/junior phrase and 4–8 h figure were **not found**. | cognition.ai blog [S] |
| SWE-1.5, 29 Oct 2025 (brief 06) | Confirmed | Up to 950 tok/s on Cerebras ("6x faster than Haiku 4.5"). Base undisclosed; Willison suspects GLM. | Willison 29 Oct 2025 [W] |
| Windsurf → Devin Desktop, 2 Jun 2026 (§11.3) | Confirmed (several secondary) | Shipped as an over-the-air update; plans carried over. One source says Cascade reached end of life 1 Jul and was replaced by "Devin Local". | plushcap mirror "Windsurf is now Devin Desktop" [S] |
| SWE-2, 10 Sep 2026 (brief 06) | Confirmed (secondary) | Runs only inside Devin. Cognition says it was **post-trained from Kimi K3**. Medium/High/Max effort levels. Vendor claim: "approaches" Fable 5.1 and GPT-6 Astra at lower cost. One source gives a Terminal-Bench 4 (TB4) score of 27.3%. | runtimewire [S] |
| "Devin Fusion (Opus 5.5 + Haiku 5.5; FrontierCode 66.2)" (task) | Not supported | Fusion pairs a frontier "main" agent with a cheap "sidekick": **47.9 at $2.38/task vs Opus 4.8 high 48.8 at $3.24** (vendor eval). Opus 5.5 reportedly scores **65.3%** on FrontierCode 1.1. Nothing found for 66.2 or Haiku 5.5. | eesel.ai, digg [S] |
| Amp: no model picker; Oracle and Librarian; shareable threads; handoff instead of compaction (§4.2) | Partly confirmed / updated | **Handoff** added 13 Jan 2026 (Fork removed). **Public threads ended 2 Jun 2026**; workspace sharing remains. Oracle on GPT-5.4 from Mar. "No model picker" is secondary only. | ampcode.com/news [S] |
| Factory Agent Readiness "8 pillars, 5 levels" (§4.2) | Partly confirmed | Launch post (20 Jan 2026): 8 pillars (Style & Validation, Build, Testing, Docs, Dev Env, Observability, Security, Task Discovery) and 5 levels. **Current docs say 9 pillars.** Advancing requires passing 80% of a level's criteria. | factory.ai, docs.factory.ai [S] |
| Factory ESLint rules + *"Encode taste as lint rules, not prose"* (§4.2) | Rules confirmed; quote unverified | The README says "All code in this repository is fully AI-generated" and "Our recommendation is NOT to simply import this package", and the repo is unmaintained. The quoted sentence is not in it. | Factory-AI/eslint-plugin [P] |
| Vercel: 100 vs 79%, 19 tasks, ~4-task gap, "56%" (§4.2; brief 03) | Resolved | Vercel: "in **56% of eval cases, the skill was never invoked**". The guide digest's "auto-invoked 56%" is a misreading. Pass rates 53/53/79/100 confirmed. The 19-task count comes only from the digest. | vercel.com [S]; Bruniaux digest [P, secondary] |
| Codex `/goal` in 0.128 (30 Apr) (§11.3) | Confirmed | Loops until it judges the goal complete or the token budget is spent, via injected `continuation.md` and `budget_limit.md` prompts. | rust-v0.128.0; Willison [W] |
| "Codex CLI 0.162 (8 Oct) adds a Command Center and managed worktrees" (§11.3) | Corrected | The Command Center already existed by 0.153.0 (3 Sep). **0.162.0 adds pinning/grouping to it and "tools for creating and listing managed Git worktrees"**, plus subagent, plugin, hook and remote-control changes. | openai/codex releases [P] |
| ChatGPT Work (9 Jul): "Work Local" (ex-Codex app) and "Work Cloud" (§11.3) | Confirmed; naming corrected | "Work Local/Cloud" are **Willison's labels**, not OpenAI names. The ChatGPT desktop app "used to be called Codex". Work requires $20+/month plans; it appears to bill against the Codex allowance. | Willison 30 Aug; help.openai.com via Willison 10 Jul [W] |
| Codex limits and pricing (task) | Filled | **Since 2 Apr 2026, pricing is "to align with API token usage, instead of per-message"** [W]. **$200 Pro (20x) sign-ups paused since 10 Sep 2026**; the $100 tier is unaffected [S]. Limits use 5-hour windows plus weekly caps [S]. | as cited |
| GPT-5.6 deleted `$HOME` (§11.5) | Confirmed, nuanced | "A handful of reports". Happened in full-access mode without a sandbox or auto-review: the model overrode `$HOME` for a temp directory, then deleted it. | Sottiaux via Willison 16 Jul [W] |
| GPT-6 tiers in Codex (task) | Filled | Willison uses **GPT-6 Sol** as his Codex default (22 Sep). Work offers GPT-5.6 Sol/Luna/Terra at Light–Ultra; "Ultra… more eagerly delegates to sub-agents". | Willison [W] |
| Copilot "agent merge (preview)" (§11.3; brief 06 says VS Code) | Corrected | A **GitHub Copilot app** feature (desktop, built on Copilot CLI): it "fix[es] what is blocking it, and merge[s] it as soon as GitHub allows". An `agent-merge` skill handles reviews, failing checks and conflicts. Not labelled preview. | github/docs [P] |
| Copilot app local sandboxing, public preview (brief 06) | Partly confirmed | Local sandbox for both CLI and app, built on Microsoft eXecution Container (MXC). It is OS-level, **not a VM**, off by default, and free. **Cloud** sandboxes are the part in public preview, billed by usage. | github/docs [P] |
| GitHub Models retired 30 Jul (brief 06) | Confirmed | — | changelog via Willison 9 Aug [W] |
| Copilot CLI rubber duck, `/fleet`, autopilot capped at 5 (§4.2) | Confirmed | The CLI now also has remote control and "dynamic workflows" (preview). | github/docs [P] |
| Agent HQ with Anthropic, OpenAI, Google, Cognition and xAI agents (brief 03 [K]) | Corrected (current state) | The docs list **only Claude and Codex** as third-party agents, still **public preview**. "Agent HQ" does not appear in the docs. | github/docs [P] |
| Premium-request pricing (task) | Corrected | **AI Credits ($0.01 each) replaced premium requests on 1 Jun 2026.** Monthly credits: Pro $10 → 1,500; Pro+ $39 → 7,000; **new Max $100 → 20,000**; Business $19 → 1,900; Enterprise $39 → 3,900. Completions unlimited. | plans.md, copilot.yml [P] |
| Gemini CLI cutoff vs continued OSS: "unresolved" (§4.2, §9.1) | Resolved | **Google itself** announced (Developers Blog, 19 May) that Gemini CLI "will stop working with their AI subscription plans on June 18th", replaced by the closed-source Antigravity CLI [W]. Affected: individual Code Assist and AI Pro/Ultra; enterprise and API-key users are apparently unaffected [S]. v0.47.0 (18 Jun) shipped a transition banner and an `antigravity-support` migration skill [P]. OSS releases continue (v0.63.0, 6 Oct) [P]. The README's free tier is stale for individuals. | Willison note 20 May; gemini-cli releases, PR #27765 [P] |
| Antigravity 2.0 (I/O, 19 May) (§4.2/§11.3) | Confirmed / expanded | Desktop app (multi-agent, not an IDE), **Antigravity CLI** (Go, `agy`, closed), an SDK (Python over a closed Go binary) and Gemini API agents. The VS Code-fork IDE remains. Default model: Gemini 3.5 Flash. | Willison 19–20 May [W]; TNW [S] |
| Gemini 3.5 Pro (brief 06) | Still unverified | Slipped from June; not in the API as of mid-Aug [S]. | letsdatascience [S] |
| Jules limits (brief 03) | Secondary only | Free: 15 tasks/24 h, 3 concurrent. Pro: 100/day, 15 concurrent. Ultra: 300/day, 60 concurrent. Scheduled tasks on Pro/Ultra. | rywalker, hackernoon [S] |
| pi: "no built-in subagents, plan mode or permission system" (§9.1); pi 1.0 + Codemode (task) | Confirmed; needs update | **v1.0.0 shipped 1 Oct 2026.** v0.99.0 (29 Sep) "Added codemode, tool search, and MCP support as built-in extensions", reversing Zechner's Nov 2025 stance "pi does not and will not support MCP". pi has belonged to **Earendil** since 8 Apr 2026. | pi-mono releases [P]; Zechner blog (local) |
| OpenCode 2026 (task) | Filled | v1.19.0 (11 Oct): "Run `opencode upgrade --major` to upgrade to OpenCode 2"; auto-update off. Desktop v2 shipped 14 Jul. | opencode releases [P] |
| "Factory Droid · Kiro CLI · Cursor CLI · Amp · Warp: commercial, so no star counts" (§9.1) | Corrected | **Warp's client is now open source**: AGPL-3.0 with MIT UI crates, 65.4k★, "OpenAI is the founding sponsor". Grok Build (since 15 Jul) and Mistral Vibe are Apache-2.0. | warpdotdev/warp [P]; Willison [W] |
| grok CLI "uploaded entire working directories, SSH keys included" (§11.5) | Confirmed, nuanced | It uploaded the current directory; one user who ran it in `$HOME` lost SSH keys and a password database. xAI disabled uploads, deleted retained data and open-sourced Grok Build (15 Jul). | Willison 15 Jul [W] |
| §9.3: "no independent comparison" of review tools | Corrected | **Martian's Code Review Bench** (described as independent; first run Feb 2026) found no tool caught more than 63% of known issues. All other benchmarks are vendor-run: Greptile, Macroscope (2025), Tenki, CodeAnt. None tests Anthropic Code Review. | codzee, codeant, macroscope, tenki [S] |
| §11.2 independent TB4: Vals has Opus 5.5 at 65.2% and Sonnet 5.5 at 64.1%; Snorkel has Opus 5.5 at 64.8% | Not reproduced | Vals: **Opus 5.5 61.62%, #1**. Artificial Analysis: GPT-6 Astra 59.1%, Opus 5.5 ~59.6%. tbench.ai (1 Oct): Astra+Codex ~58.2% vs Fable 5.1+Claude Code ~57.9%. **No Snorkel result found.** Independent runs cluster at 57–62% vs the vendor's 66.4%. | vals.ai, benchlm, presenc [S] |
| Stack Overflow 2026: Claude Code 66% vs Copilot 59% "among agent users" (§3.9) | Corrected precision | **Claude Code 65.5%, Copilot 58.7%, Codex 29.5%, Cursor 25.5%** among the **12,255** who answered the coding-agent question (tools used in the past year). | Visual Studio Magazine 6 Oct [S] |
| Pragmatic Engineer 2026 (§3.9) | Confirmed + detail | 27 Jan–17 Feb 2026, ~1,000 respondents. Claude Code is most used, and most loved (46%, vs Cursor 19% and Copilot 9%). Small companies lean to Claude Code; enterprises default to Copilot. | pragmaticengineer.com [S] |
| JetBrains: ~39% used Claude Code at work (§3.9) | Confirmed (secondary) | 39% in May–Jul 2026, up from 18% in Jan; 47% in the US. Main tool for 31%. Copilot at work ~21%, down from ~29–31%. Codex 3% → 16%. n = 15k+. | JetBrains Research Aug 2026; ADTmag [S] |
| Menlo Ventures: Anthropic leads coding (brief 08) | Partly confirmed | Mid-2025: **42% of enterprise coding vs OpenAI 21%**. Dec 2025: 40% vs 27% of enterprise LLM API spend. A "54% coding" figure is unverified. | TechCrunch 31 Jul 2025 [S] |
| Ramp AI Index, July: Opus 4.8 28.0%, Fable 5 8.0% (brief 06) | Confirmed, with caveat | Built from billing data of 70k companies. The top-10 shares sum to only ~63%. Fable was suspended 12 Jun–1 Jul and Opus 5 shipped 24 Jul, which distorts July. | Willison 23 Aug [W] |

## 2. New findings that fill gaps

- **Ownership concentration.** SpaceXAI now owns Cursor (deal closed around 14 Aug) and Grok Build. SpaceX also sells Colossus compute to Anthropic at "$1.25 billion per month through May 2029" (SpaceX S-1) [W, Willison 20 & 27 May]. This matters for enterprise vendor-risk reviews.
- **Coding vendors now post-train Chinese open-weight models.** Composer 2 is built on Kimi K2.5 [W]. SWE-2 is built on Kimi K3, per the vendor [S]. SWE-1.5 is likely GLM-based [W].
- **Subscriptions became portable.** OpenAI (Huet, 30 Mar 2026): "use Codex, and their ChatGPT subscription, wherever they like… JetBrains, Xcode, OpenCode, Pi, and now Claude Code" [W].
- **Pricing converged on metered tokens.**
  - Codex billing aligned to API token usage on 2 Apr [W].
  - Copilot moved to AI Credits on 1 Jun [P].
  - Windsurf dropped per-request credits in Mar [W].
  - Cursor uses credit pools [S].
  - Capacity rationing followed: ChatGPT Pro $200 sign-ups paused 10 Sep [S]; Copilot individual sign-ups paused in Apr [W].
- **The leading harnesses now ship much the same feature set.**
  - Copilot CLI: a different-model rubber duck, `/fleet`, autopilot, remote control, dynamic workflows and an MXC sandbox [P].
  - Codex: `/goal`, a Command Center, worktrees, plugins, hooks and remote control [P].
  - Mistral Vibe 2.x: subagents, skills and ACP [P].
- **Google.** Gemini Spark "runs on Gemini 3.5 Flash and Antigravity" [W]. Osmani: "Over 40K SWEs use agentic coding weekly" at Google [W, 13 Apr].
- **JetBrains.** Air launched in public preview (Mar 2026), built on Fleet, and runs Codex, Claude Agent, Gemini CLI and Junie over ACP. Junie CLI costs $10–$60/month. "Air in JetBrains IDEs" went to early access in Oct 2026 [S].
- **ACP Registry.** Live since Jan or Mar 2026; lists Claude Code, Codex CLI, Copilot CLI, OpenCode and Gemini CLI [S].
- **Kiro.** Now spans IDE, CLI, Web, Mobile and "Crew" [P]. CLI 2.0 shipped 13 Apr [S]. Amazon Q Developer sign-ups were redirected to Kiro from 15 May [S].
- **Mistral.** Devstral 2 (123B) uses a "modified MIT" licence that bars companies above $20M monthly revenue; Small 2 is Apache-2.0 [W]. Vibe 2.0 shipped 27 Jan [S].
- **PRarena** is an independent but crude usage proxy: it counts bot authors and branch prefixes on GitHub. Cumulative "ready" PRs and merge rates (11 Oct):

  | Agent | Ready PRs | Merged |
  |---|---|---|
  | Codex | 7.61M | 90.0% |
  | Copilot | 1.63M | 96.0% |
  | Jules | 241k | 85.1% |
  | Devin | 292k | 63.9% |
  | Cursor | — | 101.9% (anomalous) |

  Claude Code is not tracked. Draft workflows confound the merge rates [P]. Use it as a volume signal only.
- **First-party benchmarks.** CursorBench (from 11 Mar 2026) is built from Cursor Blame data. Its v4.0 set (10 Sep) is not comparable with v3.x and cannot be reproduced [S]. Cognition's FrontierCode is vendor-built, though made with 20+ OSS maintainers [S].
- **Scale and market datapoints.**
  - Codex had ">1M developers" in the month to 2 Feb 2026 [W].
  - Microsoft cancelled internal Claude Code licences in favour of Copilot CLI (The Verge: partly financial) [W].
  - Microsoft's MAI-Code-1-Flash (137B total, 5B active) is "purpose-built for GitHub Copilot" (2 Jun) [W].

## 3. Suggested edits

1. **§4.2 Cursor.**
   - Drop the block-level †; keep it only on the best-practices specifics and the Opus quote.
   - Change "(−46.9% tokens in an A/B test)" to "(−46.9% total tokens *in runs that called an MCP tool*; vendor A/B test)".
   - Replace "The post found GPT-5.2 better than Opus 4.5 … 'stop earlier'" with "Cursor found GPT-5.2-class general models best for very long autonomy (Opus comparison quote unverified†); critics noted failing CI at launch and ~1.6M lines of Rust."
   - Add: "Bugbot (GA Jul 2025, vendor): >1M PRs reviewed in beta, >1.5M issues, >50% fixed before merge. Composer 2 (Mar 2026) is built on Kimi K2.5. Cursor bought Graphite (agreed 19 Dec 2025)."
2. **§4.2 Cognition.**
   - Replace the Devin line with: "Devin's 2025 review (14 Nov 2025, vendor): 67% of PRs merged vs 34%; '4x faster'; best on migrations, vulnerability fixes, tests and small tickets (the 'senior/junior' phrasing is unverified†)."
   - Add: "In Apr 2026 Cognition said 'the landscape is different' and added multi-agent flows; **Devin Fusion** pairs a frontier main agent with a cheap sidekick (vendor eval: 47.9 at $2.38/task vs Opus 4.8's 48.8 at $3.24)."
3. **§4.2 Other vendors.**
   - Amp: "Oracle (GPT-5.4+) and Librarian subagents; **handoff** (Jan 2026) instead of fork/compaction; public threads ended 2 Jun 2026."
   - Factory: "8 pillars at launch, 9 in current docs; 5 levels; 80% of a level's criteria to advance." Remove "Encode taste as lint rules, not prose" or mark it †. Add: "Factory says *don't import* the plugin; copy the ideas."
   - Vercel: add "skills were never invoked in 56% of eval cases; 19 tasks per a secondary digest."
4. **§4.2 Google, "Reports that consumer Gemini CLI would be retired… (unresolved)".** Replace with: "**Resolved:** Google announced (19 May 2026) that Gemini CLI stops serving Google AI subscription plans (individual Code Assist, AI Pro/Ultra) from 18 Jun 2026, in favour of the closed-source Go `agy` CLI, which keeps skills, hooks and subagents as plugins. The Apache-2.0 repo still ships (v0.63.0, 6 Oct) for API-key, Vertex and enterprise use, and itself bundles an Antigravity migration skill."
5. **§9.1 table.**
   - Gemini CLI row: "Individual Google-login and AI Pro/Ultra access ended 18 Jun 2026 (moved to Antigravity CLI); still maintained for API-key, Vertex and enterprise users; README free-tier figures are stale."
   - pi row: add "owned by Earendil since Apr 2026; **1.0 on 1 Oct 2026**; MCP now built in via 'codemode' (v0.99), reversing its no-MCP stance."
   - Last row: rename it "closed source: Factory Droid · Kiro CLI · Cursor CLI · Amp · Antigravity CLI". Add rows for Warp (open client, AGPL, 65.4k★), Mistral Vibe (Apache-2.0) and Grok Build (Apache-2.0, open-sourced after its Jul 2026 upload incident).
6. **§9.3 last "Other reviewers" sentence.** Replace with: "Almost all head-to-heads are vendor-run (Greptile, Macroscope, Tenki, CodeAnt). Martian's Code Review Bench (Feb 2026), described as independent, found no tool caught more than 63% of known issues. No public benchmark yet tests Anthropic's managed Code Review."
7. **§11.2 TB4 row, independent clause.** Replace with: "Independent numbers disagree (search summaries): Vals Opus 5.5 61.6%; Artificial Analysis ~59–60%; tbench.ai (1 Oct) GPT-6 Astra+Codex ~58.2% vs Fable 5.1+Claude Code ~57.9%. No Snorkel TB4 result found."
8. **§11.3.**
   - OpenAI: "ChatGPT Work (9 Jul): the Codex desktop app became the ChatGPT desktop app (Willison's 'Work Local'); paid plans only. Codex 0.162 (8 Oct) adds Command Center pinning and managed-worktree tools. Codex billing became token-based on 2 Apr; $200 Pro sign-ups were paused 10 Sep."
   - Cursor: "Cursor 3 (2 Apr) made the Agents Window primary, with the editor secondary. SpaceX signed 16 Jun (~$60B in stock); the close was reported 14 Aug (secondary)."
   - GitHub: "The Copilot **app** adds agent merge. **AI-credit billing replaced premium requests on 1 Jun**, with a new $100 Max plan. GitHub Models was retired 30 Jul. Third-party agents (Claude, Codex) are still in preview."
   - Google: add "Gemini CLI's individual tiers ended 18 Jun."
   - Cognition: "Devin Desktop (2 Jun); SWE-2 (10 Sep, Kimi K3-based); Devin Fusion."
9. **§11.5 grok.** "xAI's `grok` CLI uploaded the working directory to xAI's cloud. One user who ran it in `$HOME` reported SSH keys and a password database uploaded. xAI deleted retained data and open-sourced Grok Build."
10. **§3.9.**
    - Stack Overflow: "Claude Code 65.5%, Copilot 58.7%, Codex 29.5%, Cursor 25.5% among 12,255 answering the coding-agent question (secondary)."
    - JetBrains: "39% (May–Jul, up from 18% in Jan; 47% in the US); Copilot ~21%; Codex 16%."
    - Pragmatic Engineer: add "most loved: Claude Code 46%, Cursor 19%, Copilot 9%."
11. **§2 timeline.** Add: Jun 1 Copilot usage billing; Jun 2 Devin Desktop; Jun 16 SpaceX–Cursor agreement; Jun 18 Gemini CLI cutoff; Jul 14–15 grok incident; Jul 30 GitHub Models retired; ~Aug 14 Cursor close; Sep 10 SWE-2 and ChatGPT Pro pause; Oct 1 pi 1.0; Oct 8 Codex 0.162.

## 4. Sources

**Willison corpus** [via Willison]
- Cursor Composer — Willison — 29 Oct 2025 — https://simonwillison.net/2025/Oct/29/cursor-composer/ — Cursor 2.0
- SWE-1.5 — Willison — 29 Oct 2025 — https://simonwillison.net/2025/Oct/29/swe-15/
- Scaling long-running autonomous coding — Willison — 19 Jan 2026 — https://simonwillison.net/2026/Jan/19/scaling-long-running-autonomous-coding/
- FastRender — Willison — 23 Jan 2026 — https://simonwillison.net/2026/Jan/23/fastrender/
- One Human + One Agent (critique) — Willison — 27 Jan 2026 — https://simonwillison.net/2026/Jan/27/one-human-one-agent-one-browser/
- Kimi on Composer 2 — Willison — 20 Mar 2026 — https://simonwillison.net/2026/Mar/20/cursor-on-kimi/ — primary quote
- Codex app — Willison — 2 Feb 2026 — https://simonwillison.net/2026/Feb/2/introducing-the-codex-app/
- Copilot plan changes — Willison — 22 Apr 2026 — https://simonwillison.net/2026/Apr/22/changes-to-github-copilot/
- GPT-5.5 / Huet quote — Willison — 23 Apr 2026 — https://simonwillison.net/2026/Apr/23/gpt-5-5/
- Codex /goal — Willison — 30 Apr 2026 — https://simonwillison.net/2026/Apr/30/codex-goals/
- Gemini 3.5 Flash — Willison — 19 May 2026 — https://simonwillison.net/2026/May/19/gemini-35-flash/
- I/O note — Willison — 20 May 2026 — no URL constructed; links developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/ and github.com/google-antigravity/antigravity-cli
- Product-market fit — Willison — 27 May 2026 — https://simonwillison.net/2026/May/27/product-market-fit/ — Codex rate card, Microsoft licences
- ChatGPT Work help-page quote — Willison — 10 Jul 2026 — https://simonwillison.net/2026/Jul/10/openai/
- grok-build — Willison — 15 Jul 2026 — https://simonwillison.net/2026/Jul/15/grok-build/
- GPT-5.6 deletions — Willison — 16 Jul 2026 — https://simonwillison.net/2026/Jul/16/bad-codex-bug/
- GitHub Models retired — Willison — 9 Aug 2026 — https://simonwillison.net/2026/Aug/9/github-models-is-now-retired/
- Ramp AI Index — Willison — 23 Aug 2026 — https://simonwillison.net/2026/Aug/23/anthropics-best-ai-model-struggles-to-attract-users-as-cheaper-t/
- Understanding ChatGPT Work — Willison — 30 Aug 2026 — https://simonwillison.net/2026/Aug/30/understanding-chatgpt-work/
- Price war — Willison — 22 Sep 2026 — https://simonwillison.net/2026/Sep/22/opus-and-sol-and-luna/
- Devstral 2 — Willison — 9 Dec 2025 — https://simonwillison.net/2025/Dec/9/devstral-2/
- PRarena — Willison — 1 Oct 2025 — https://simonwillison.net/2025/Oct/1/prarena/

**GitHub, fetched** [primary]
- Codex releases (0.153–0.162.1) — OpenAI — Sep–Oct 2026 — https://github.com/openai/codex/releases
- Gemini CLI repo (releases v0.47.0 and v0.63.0, PR #27765, `antigravity-support` SKILL.md, README, quota doc) — Google — 2026 — https://github.com/google-gemini/gemini-cli
- Antigravity CLI — Google — https://github.com/google-antigravity/antigravity-cli
- pi releases — Earendil — https://github.com/badlogic/pi-mono/releases
- OpenCode releases — https://github.com/anomalyco/opencode/releases
- `github/docs` @ be38ec5 — GitHub — 9 Oct 2026 — content/copilot: get-started/plans.md; billing (legacy) what-changed-with-billing.md; github-copilot-app how-tos and built-in-skills; about-cloud-and-local-sandboxes.md; about-third-party-coding-agents.md; copilot-cli autopilot/rubber-duck/fleet/remote-control; dynamic-workflows.md; data/variables/copilot.yml
- Factory README — https://raw.githubusercontent.com/Factory-AI/factory/main/README.md
- Factory ESLint plugin README — https://raw.githubusercontent.com/Factory-AI/eslint-plugin/main/README.md
- Warp README — https://github.com/warpdotdev/warp
- Mistral Vibe releases — https://github.com/mistralai/mistral-vibe/releases
- Kiro README — https://github.com/kirodotdev/Kiro
- PRarena — A. Avetisian — https://github.com/aavetis/PRarena — independent, crude
- Vercel eval digest — Bruniaux — 30 Jan 2026 — https://raw.githubusercontent.com/FlorianBruniaux/claude-code-ultimate-guide/main/docs/resource-evaluations/025-vercel-agents-md-vs-skills-eval.md — [secondary]; misreads the 56%
- Zechner, "I've sold out" (8 Apr 2026) and the pi launch post (30 Nov 2025) — local blog sources [primary]

**Via search summary / secondary** [S]
- Vercel — 27 Jan 2026 — https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals
- Bugbot out of beta — Cursor — Jul 2025 — https://cursor.com/cn/blog/bugbot-out-of-beta
- Best practices for coding with agents — Cursor — Jan 2026 — https://cursor.com/blog/agent-best-practices
- Dynamic context discovery — Cursor — Jan 2026 — https://cursor.com/blog/dynamic-context-discovery
- Scaling multi-agent coding (summary) — ZenML — 2026 — https://www.zenml.io/llmops-database/scaling-multi-agent-autonomous-coding-systems
- Cursor 3 — DataCamp — Apr 2026 — https://www.datacamp.com/blog/cursor-3
- Cursor acquires Graphite — SiliconANGLE — 19 Dec 2025 — https://siliconangle.com/2025/12/19/cursor-acquires-ai-code-review-startup-graphite/
- Cursor–Graphite — Fortune — 19 Dec 2025 — https://www.fortune.com/2025/12/19/cursor-ai-coding-startup-graphite-competition-heats-up
- SpaceX to acquire Cursor — Tribune India — Jun 2026 — https://www.tribuneindia.com/news/business/spacex-to-acquire-ai-coding-startup-cursor-in-60-billion-deal-expects-q3-2026-close/
- SpaceX closes Cursor deal — AI Weekly — Aug 2026 — https://aiweekly.co/alerts/spacex-closes-60b-cursor-deal-folds-it-into-spacexai-unit
- SpaceX completes Cursor acquisition — Menastartupdigest — Aug 2026 — https://menastartupdigest.com/?p=48251
- Towards self-driving codebases (index) — plushcap — Feb 2026 — https://www.plushcap.com/content/cursor/blog/cursor-towards-self-driving-codebases
- Cursor pricing — jetadmin — 27 Jul 2026 — https://www.jetadmin.io/blog/cursor-pricing-explained-plans-credit-system-and-real-costs-in-2026/
- Devin review — Cognition — 14 Nov 2025 — https://cognition.ai/blog/devin-annual-performance-review-2025
- Windsurf is now Devin Desktop (mirror) — plushcap — Jun 2026 — https://www.plushcap.com/content/windsurf/blog/windsurf-windsurf-is-now-devin-desktop
- SWE-2 — runtimewire — Sep 2026 — https://runtimewire.com/article/cognition-swe-2-coding-model-scott-wu
- Devin Fusion — eesel.ai — 2026 — https://www.eesel.ai/blog/devin-fusion
- Opus 5.5 on FrontierCode — Digg — Sep/Oct 2026 — https://digg.com/ai/avxtznby
- Amp news — Amp/Sourcegraph — Jan–Jul 2026 — https://www.ampcode.com/news
- Agent Readiness — Factory — 20 Jan 2026 — https://factory.ai/news/agent-readiness
- Agent Readiness docs — Factory — 2026 — https://docs.factory.ai/agent-readiness/overview
- About ChatGPT Pro plans — OpenAI — Sep 2026 — https://help.openai.com/en/articles/9793128-about-chatgpt-pro-plans
- Codex usage limits — developersdigest — 28 Sep 2026 — https://www.developersdigest.tech/blog/codex-usage-limits-pricing-2026
- Transitioning Gemini CLI to Antigravity CLI — Google — 19 May 2026 — https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/
- Antigravity 2.0 — The Next Web — May 2026 — https://thenextweb.com/news/google-antigravity-2-desktop-cli-sdk-io-2026
- Gemini 3.5 Pro unconfirmed — letsdatascience — Aug 2026 — https://letsdatascience.com/news/gemini-35-pro-launch-remains-unconfirmed-a09db704
- Jules profile — rywalker — 2026 — https://rywalker.com/research/jules
- JetBrains Air launch — devclass — 11 Mar 2026 — https://www.devclass.com/ai-ml/2026/03/11/jetbrains-launches-ai-agent-ide-built-on-the-corpse-of-abandoned-fleet/5208890
- JetBrains consolidates under Air — Techzine — 2026 — https://www.techzine.eu/news/devops/144455/jetbrains-consolidates-agentic-tooling-under-the-new-name-air/
- The ACP Registry is live — Zed — Jan 2026 — https://zed.dev/blog/acp-registry
- ACP updates — agentclientprotocol.com — 2026 — https://agentclientprotocol.com/updates
- Mistral Vibe 2.0 — Mistral — 27 Jan 2026 — https://mistral.ai/fr/news/mistral-vibe-2-0
- Kiro pricing — usagebar — 2026 — https://usagebar.com/blog/kiro-pricing-and-free-tier
- Terminal-Bench 4 — Vals — Sep 2026 — https://vals.ai/benchmarks/terminal-bench-4
- Claude Opus 5.5 evals — Vals — 22 Sep 2026 — https://vals.ai/models/anthropic_claude-opus-5-5
- AA Terminal-Bench 4 mirror — BenchLM — Sep 2026 — https://benchlm.ai/benchmarks/aaTerminalBench4
- TB leaderboard mirror — presenc — Oct 2026 — https://presenc.ai/research/terminal-bench-leaderboard-2026
- Review benchmarks (mostly vendor-run) — https://medium.com/@codzee.io/we-compared-the-public-ai-code-review-benchmarks-from-2026-methodology-datasets-metrics-and-269dd35637a6
- Review benchmarks (mostly vendor-run) — https://codeant.ai/blogs/ai-code-review-benchmark-results-from-200-000-real-pull-requests
- Review benchmarks (mostly vendor-run) — https://macroscope.com/content/ai-code-review-benchmark-best-models
- Review benchmarks (mostly vendor-run) — https://tenki.cloud/benchmarks/code-reviewer
- CursorBench v4.0 — Datalearner — Sep 2026 — https://www.datalearner.com/en/benchmarks/cursorbench-v4-0
- Stack Overflow 2026 — Visual Studio Magazine — 6 Oct 2026 — https://visualstudiomagazine.com/articles/2026/10/06/stack-overflow-2026-survey-vs-code-leads-visual-studio-takes-third.aspx
- AI tooling 2026 — Pragmatic Engineer — Mar 2026 — https://newsletter.pragmaticengineer.com/p/ai-tooling-2026
- AI coding agent adoption 2026 — JetBrains Research — Aug 2026 — https://blog.jetbrains.com/research/2026/08/ai-coding-agent-adoption-2026/
- JetBrains survey coverage — ADTmag — Aug 2026 — https://adtmag.com/articles/jetbrains-survey-finds-ai-coding-agents-becoming-routine-developer-tools.aspx
- Menlo mid-2025 survey — TechCrunch — 31 Jul 2025 — https://techcrunch.com/2025/07/31/enterprises-prefer-anthropics-ai-models-over-anyone-elses-including-openai

## 5. Still unknown

- **Cursor:**
  - The exact wording of the best-practices post (revert, hooks, TDD).
  - The Opus 4.5 "stops earlier" quote.
  - The SpaceX 8-K and exact closing day.
  - Bugbot's current price.
- **Cognition:**
  - "Coding Agents 101".
  - SWE-grep.
  - The senior/junior and 4–8 h phrasing.
  - Primary posts for Devin Desktop, SWE-2 and Fusion.
  - Any source for "66.2" or a Haiku 5.5 sidekick.
- **Vercel:** the task count in the primary post.
- **Factory:** the full criteria list, and when the pillar count went from 8 to 9.
- **Amp:** model-picker status.
- **Google:**
  - Which Gemini CLI auth paths officially remain.
  - Gemini 3.5 Pro after mid-Aug.
  - Primary Jules limits.
- **Codex:** official per-plan limits.
- **GitHub:** whether VS Code also has agent merge, and the Copilot app's launch date.
- **Benchmarks:** a Snorkel TB4 run; Vals' Sonnet 5.5 score.
- **Menlo:** the Dec 2025 coding share.
- **Kiro:** the Kiro-linked AWS outage (FT) and official pricing.
- **Warp:** Oz details.
