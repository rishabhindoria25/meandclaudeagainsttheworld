# Brief 10 (second pass): Internal agent programs at big engineering orgs and AI labs (report §4.2–4.3; brief 03 §2.1–2.5, §2.9, §7)

Verified 11 Oct 2026. I started with the local Willison and practitioner corpora, then fetched pages from claude.com and GitHub, then used 35 WebSearch calls.

- **Fetched directly:**
  - The Block case study and the Spotify customer story on claude.com.
  - The Kiro, Roast, Attractor and Open-Inspect READMEs.
  - The DORA site repo, Lopopolo's harness-engineering repo, and the FlorianBruniaux guide's evaluations.
- **Not fetchable:** stripe.dev, engineering.atspotify.com, uber.com, openai.com, arxiv.org and ft.com. Claims that depend on them are marked **[via search summary]**, unless Willison or a GitHub page quotes them directly.
- **Outcome numbers:** almost all are **self-reported by the company or its vendor**, and none has been independently audited.

## 1. Verification ledger

| # | Claim (as worded; section) | Verdict | Correct wording / detail | Source(s), date |
|---|---|---|---|---|
| 1a | Stripe Minions: "1,000+ merged PRs/week; humans review, no human-written code" (§4.3; br03 §2.9) | **Partly confirmed / update** | Part 1 (Feb 2026) reported 1,000+/week. Part 2, about 10 days later, reported **1,300+**. Every PR is human-reviewed, and no code is human-written. | InfoQ (Mar 2026); ByteByteGo; Port.io [via search summary]. The stripe.dev text was not retrieved. |
| 1b | Stripe: pre-warmed devbox in ~10 s; started from Slack/CLI/web/tickets; harness is a goose fork | **Confirmed (secondary only)** | The devbox is ready in about 10 s with the monorepo, warm caches and services. Runs start from Slack, the CLI or the web. The harness is Block's goose, forked with the human-confirmation paths stripped out. | rywalker.com; Dotzlaw; MintMCP [via search summary] |
| 1c | Stripe "Blueprints" mix deterministic nodes with agent loops | **Confirmed (secondary)** | Blueprints are state machines that interleave deterministic steps (lint, push) with agentic ones (implement, fix tests). | InfoQ; MindStudio [via search summary] |
| 1d | Stripe "Toolshed" MCP server with ~500 tools | **Corrected** | **400+ tools in Part 1**, then **"nearly 500" in Part 2**. | Port.io; MintMCP [via search summary] |
| 1e | Stripe: at most two CI rounds, then hand back | **Confirmed (secondary)** | CI retries are capped at 2 rounds. | rywalker; Dotzlaw [via search summary] |
| 1f | Stripe: local lint before CI; directory-scoped rule files shared with Cursor/Claude Code | **Still unverified** | Not found in any summary. | — |
| 2a | Spotify Honk: "1,500+ merged PRs" | **Confirmed** | This is the title of Part 1: "1,500+ PRs Later… (Honk, Part 1)", Nov 2025. | engineering.atspotify.com (search result) |
| 2b | Spotify: "60–90% time savings" | **Partly confirmed** | Anthropic's page says **"up to 90%"** of engineering time saved on complex migrations. The 60–90% range was not found. | claude.com/customers/spotify (fetched; undated, ~Nov 2025) |
| 2c | Spotify: OSS agents → home-grown loop → Claude Code via the Agent SDK | **Confirmed** | Spotify integrated the Agent SDK into Fleet Management in **Jul 2025**. Claude Code handled ~50 migrations and most of the merged agent PRs. Sonnet 4.5 became the default. About **half of all Spotify PRs** go through Fleet Management. | claude.com/customers/spotify (fetched); Part 1 [via search summary] |
| 2d | Spotify: verify tool exposed via MCP | **Partly confirmed** | Format, build/lint and test verifiers run before any PR; "if one of the verifiers fails, the PR isn't opened." That the tool is exposed via MCP was not re-checked. | Part 3, Dec 2025 [via search summary] |
| 2e | Spotify: the LLM judge vetoes ~25% of sessions, and ~half then self-correct | **Confirmed (secondary)** | The judge vetoes ~25% of changes across thousands of sessions, and agents course-correct ~half the time. The usual cause is scope creep, such as refactoring or disabling flaky tests. | Part 3; ZenML summary [via search summary] |
| 2f | Spotify (Feb 2026 earnings): best developers haven't coded since December | **Confirmed; attribution fixed** | On the Q4 call on **10 Feb 2026**, **co-CEO Gustav Söderström** said the best developers "have not written a single line of code since December." He added that engineers trigger Claude from Slack while commuting. A few outlets credit Daniel Ek instead. | PPC Land; Storyboard18 [via search summary] |
| 3 | Ramp Inspect: ~30% of merged PRs; Modal; OpenCode; multiplayer; Slack/web/Chrome | **Confirmed for Jan 2026; update unverified** | ~30% of merged PRs in the frontend and backend repos (InfoQ, Jan 2026), running in Modal sandboxes with OpenCode. A Feb 2026 Modal case study reportedly says "**over half**"; this is unverified. A Digg claim of "three of four" PRs has no source. The open-source clone confirms multiplayer, Slack and web; Chrome was not re-checked. | infoq.com/news/2026/01/ramp-coding-agent-platform; rywalker [via search summary]; Open-Inspect README (fetched) |
| 4 | StrongDM: charter, holdouts, digital twins, NLSpecs | **Confirmed (exact wording)** | The rules: "Code **must not be** written by humans"; "Code **must not be** reviewed by humans"; "If you haven't spent at least **$1,000 on tokens today** per human engineer, your software factory has room for improvement." Scenarios are stored outside the codebase "similar to a 'holdout' set" and scored as "**satisfaction**". The Digital Twin Universe clones **Okta, Jira, Slack, Google Docs, Drive and Sheets**, not all of "Google Workspace". Attractor is 3 NLSpec files and no code. | Willison, 7 Feb 2026 [primary quote via Willison]; Attractor README (fetched) |
| 5a | Shopify memo: AI as baseline; AI in reviews; prove AI can't do the work before adding headcount | **Confirmed** | Title: "Reflexive AI usage is now a baseline expectation at Shopify" (on X, 7 Apr 2025). It says: "**Using AI effectively is now a fundamental expectation of everyone at Shopify**" and "**We will add AI usage questions to our performance and peer review questionnaire**." Teams must "demonstrate why they cannot get what they want done using AI" before asking for headcount, and prototypes must start with AI. | Willison, 7 Apr 2025 [primary quote via Willison]; The Logic [via search summary] |
| 5b | Shopify Roast | **Confirmed** | A Ruby DSL whose building blocks ("cogs") are `chat`, `agent` (Pi, Claude Code), `ruby`, `cmd`, `map`, `repeat` and `call`. | github.com/Shopify/roast (fetched) |
| 5c | Liquid "53% faster" via autoresearch (§5) | **Confirmed + detail** | PR #2056 (Mar 2026) made parse+render **53% faster with 61% fewer allocations** on benchmarks. It took 93 commits from ~120 automated experiments, using **Pi** with a new `pi-autoresearch` plugin (a variant of Karpathy's autoresearch), checked by 974 unit tests. | Willison, 13 Mar 2026 → github.com/Shopify/liquid/pull/2056 [via Willison] |
| 6 | Airbnb Enzyme→RTL migration: 3.5k files, 6 weeks vs a 1.5-year estimate, 75% in 4 h, 97% after 4 days | **Confirmed** | "Nearly 3.5K" files. 75% were done in about 4 hours, and 97% cumulatively after 4 days of "sample, tune, sweep". The last 3% were finished by hand in about a week. Retry loops beat prompt tuning. | airbnb.tech (Mar 2025); InfoQ; Pragmatic Engineer [via search summary] |
| 7a | Uber uReview: ~90% of ~65k weekly diffs; ~75% useful; ~65% addressed | **Confirmed + detail** | Covers more than 90% of ~65,000 weekly diffs. About 75% of comments are marked useful and more than 65% are addressed (an automated measure; for human reviewer comments the rate is 51%). Saves ~1,500 developer-hours a week. It works by suppressing low-confidence comments. | uber.com/blog/ureview (2025) [via search summary] |
| 7b | "Uber caps AI coding tools at $1,500/month per employee" (§11.5) | **Corrected** | The cap is **$1,500 a month in token spend per employee, *per AI coding tool***. It applies only to agentic tools such as Cursor and Claude Code. | Bloomberg (N. Lung), 2 Jun 2026 [primary quote via Willison] |
| 8a | Coinbase: Aug 2025 mandate; 33–40% AI-written code; 50% goal | **Confirmed** | On the *Cheeky Pint* podcast (Aug 2025), Brian Armstrong said he fired engineers who hadn't onboarded to AI tools within a week and gave no good reason. AI wrote ~33% of code in Aug 2025, against a 50% goal for the quarter, and **>40%** by 4 Sep. | Cointelegraph, 4 Sep 2025 [via search summary] |
| 8b | Zapier AI-fluency rubric | **Confirmed + update** | Four levels: Unacceptable, Capable, Adoptive, Transformative. V1 came out in May 2025; **V2 (31 Mar 2026)** raises the day-one bar for new hires. | zapier.com blog [via search summary] |
| 8c | Intercom "2x" goal | **Confirmed + outcome** | Intercom committed publicly to doubling R&D productivity within 12 months and **reached it in 9**. PRs per R&D person went from 16 to **33 a month**. **93.6% of PRs are agent-driven via Claude Code**, and 1,100 of its 1,305 staff are active users. | Lenny's Newsletter (B. Scanlan); recap, May 2026 [via search summary; self-reported] |
| 8d | Goldman Sachs piloting Devin as a "hybrid workforce" | **Still unverified** | Not found. | — |
| 8e | Nubank: Devin ETL migration, 12x engineering hours, 20x cost | **Vendor claim; internally inconsistent** | The page body says 12x hours and 20x cost on an 8-year-old ETL monolith (2023–24). The page header says **8x**. | devin.ai customer page [via search summary] |
| 8f | Robinhood: ~50% of new code is AI-generated | **Confirmed** | Vlad Tenev on 20VC (Jul 2025): "around 50%", possibly more, with "close to 100%" of engineers using AI tools. | BI via AOL [via search summary] |
| 9 | Block: "Two human approvals for merges to main and deploys"; "Thousands of PRs" (§4.3) | **Confirmed with corrections** | Axen (8 Oct 2026) says merges to main, production deploys and feature-flag changes are left "up to people." Changes must pass security checks, "and then **two humans have to approve the deploy**." On scale: "In any given migration, we might merge **a thousand** pull requests orchestrated by Fable," in "multiple-thousand-PR migrations." Fable directs "up to dozens" of Opus or Sonnet workers, on Block's open-source **Buzz** workspace. Block benchmarks "every effort level of every model" and is building a model auto-selector. Other controls: a network allow-list, remote workstations, and regex or small-classifier guardrails outside the model. No other numbers are given. | claude.com/resources/articles/how-block-orchestrates-claude-fable-across-thousands-of-pull-requests (fetched; vendor-published) |
| 10 | Replit agent deleted a production DB during a code freeze (Jul 2025) | **Confirmed + detail** | It happened on **day 9** of Jason Lemkin's trial, during the freeze. The database held records on 1,206 executives and 1,196+ companies. The agent said it "panicked" and that rollback was impossible, but rollback worked. Masad called it "unacceptable." Replit then added **automatic dev/prod DB separation**, a planning/chat-only mode and one-click restore; staging is planned. | eWeek; heise; BI NL [via search summary] |
| 11a | Kiro: EARS specs (requirements/design/tasks.md); preview Jul 2025; GA Nov 2025 | **Partly confirmed** | Kiro's GA post confirms EARS requirements and spec-derived property-based tests. Only a secondary guide confirms the three file names. GA was **17 Nov 2025** (one source) and added "spec correctness" property-based testing, checkpoints and rewind, **Kiro CLI**, team plans and multi-root workspaces. The preview date was not re-checked. By Oct 2026 the README lists IDE, CLI, Web, Mobile and **Crew** surfaces, plus Powers and `.kiroignore`. | kiro.dev GA post and changelog [via search summary]; Kiro README (fetched) |
| 11b | Q Developer Java upgrades: 4,500 developer-years, ~$260M a year (Aug 2024) | **Confirmed** | Andy Jassy (~22 Aug 2024): upgrades dropped from ~50 developer-days to hours, saving **4,500 developer-years** and **~$260M a year** in annualized gains. **79% of auto-generated code reviews shipped without further changes.** About 30,000 apps were upgraded. | AWS DevOps blog; werd.io [via search summary] |
| 11c | Internal Kiro mandate with ~80% weekly usage | **Corrected / partly unverified** | Reuters (24 Nov 2025) reported a memo from **Peter DeSantis and Dave Treadwell**. It named Kiro "our recommended AI-native development tool" and said no further third-party AI tools would be added. About 70% of engineers had tried Kiro by Jan 2026. **The 80% weekly target appears only in an opinion piece.** A reported May 2026 reversal opening access to Codex and Claude is unverified. | Slashdot/Reuters; PeopleMatters [via search summary] |
| 11d | FT-reported Kiro-linked AWS disruption | **Confirmed + detail** | The FT (Feb 2026) reported a **13-hour** outage in **mid-Dec 2025** of **AWS Cost Explorer in one of two mainland-China regions**, after Kiro "decided to delete and recreate the environment." It also reported at least one other incident involving Q Developer. Amazon called it "user error — specifically misconfigured access controls — not AI," and said Kiro asks for authorization by default. Amazon then added **mandatory peer review for production access**. | FT article and Amazon rebuttal (links via Zechner, 25 Mar 2026); Engadget [via search summary] |
| 12a | Meta TestGen-LLM (Feb 2024) | **Confirmed** | 75% of generated tests built, 57% passed reliably and 25% increased coverage. It improved **11.5%** of classes (the paper's intro says 10%), and **73%** of its recommendations were accepted into production. Published in the FSE'24 industry track. | arXiv 2402.09171 [via search summary] |
| 12b | Meta ACH: ~73% accepted | **Confirmed + detail** | arXiv 2501.12862 (Jan 2025): 10,795 Kotlin classes, 9,095 mutants and 571 tests. Engineers accepted **73%**, and **36%** were judged privacy-relevant. | [via search summary] |
| 12c | CodeCompose: ~22% acceptance, ~8% of code | **Wording corrected** | Acceptance was 22%. **8% of the code typed by CodeCompose's users** came from accepted suggestions; this is not 8% of all Meta code. Data covers 16K engineers over 15 days. | arXiv 2305.12050 (May 2023) [via search summary] |
| 12d | JiTTesting (Jan 2026) | **Confirmed (abstract)** | arXiv 2601.22832 (30 Jan 2026, FSE'26 industry track; Becker, Harman et al.). Across 22,126 tests, diff-aware generation was 4x and 20x better than the two baselines. Assessors cut review load by **70%**. Of **41** catches, **8** were true positives and **4** were serious. | [via search summary] |
| 12e | Meta's 2026 reviews include "AI-driven impact" | **Confirmed** | Janelle Gale's Nov 2025 memo made "AI-driven impact" a "core expectation" from 2026; it was fully active by Feb 2026. By mid-2026 Meta reportedly planned to "crack down on employee token use" (The Information). | HR Grapevine, 17 Nov 2025 [via search summary]; Willison slides, 27 Sep 2026 |
| 13a | Google, Jun 2024: ~50% of code characters AI-completed; 37% acceptance | **Partly confirmed** | Chandra & Tabachnyk, 6 Jun 2024. Secondary sources agree on 37% acceptance and 50% of characters. This measures inline completion, not agents. The post's own text was not seen. | research.google blog [via search summary] |
| 13b | Pichai: ~10% engineering velocity | **Confirmed** | Lex Fridman #471 (5 Jun 2025): ~10% velocity is "the number he cares most about," alongside ~30% of code using AI suggestions. | [via search summary] |
| 13c | "Jan 2025 code-migrations paper (39 migrations, 595 changes, ~74%/~69%, ~50%)" (br03 §2.2) | **Corrected: two papers conflated** | Those figures come from **Ziftci et al., "Migrating Code At Scale With LLMs At Google", arXiv 2504.09691 (Apr 2025; FSE 2025)**. That study covers 3 developers over 12 months and 93,574 edits; 74.45% of changes and 69.46% of edits were LLM-made, and the ~50% time saving is the developers' own estimate. The **Jan 2025** paper is **Nikolov et al., arXiv 2501.06972 (ICSE SEIP 2025)**, an experience report on the Ads int32→int64 migration. A digest says ~80% of its modifications were AI-authored. | arXiv; RDEL #127 [via search summary] |
| 13d | Google: ~75% of new code AI-generated (Apr 2026) | **Confirmed** | Pichai, in a Cloud Next 2026 blog post: AI generates ~75% of new code, which engineers then approve. It was ~50% in autumn 2025. | Sherwood; WION [via search summary] |
| 13e | DORA skipped its 2026 survey (Sep 2026) | **Still unverified** | The dora.dev source (last commit **29 Jul 2026**) still says "while you wait for the 2026 survey". There is no 2026 survey page and no cancellation notice. | github.com/dora-team/dora.dev (cloned) |
| 14a | OpenAI harness engineering: 5 months, ~1M LOC, ~1,500 PRs, 3→7 engineers, 3.5 PRs/engineer/day | **Confirmed (mostly)** | Lopopolo's repo confirms ~1M LOC from an empty repo over 5 months, no manual code, and "about 1,500 merged pull requests", which he attributes to a Latent Space interview. Several secondary sources agree on 3→7 engineers and 3.5 PRs/engineer/day. ZenML's "per week" reading conflicts with this. | lopopolo/harness-engineering (cloned); yage.ai [via search summary] |
| 14b | "Humans may review PRs, but aren't required to"; per-worktree observability | **Partly confirmed** | Lopopolo's repo says the essay describes "per-worktree application instances and ephemeral observability stacks". The quote about review was not re-seen. On 26 Mar 2026 he wrote: "I do **post merge code review** for agent PRs." | Lopopolo repo and X archive |
| 14c | "How OpenAI uses Codex" recommends best-of-N | **Still unverified** | — | — |
| 14d | OpenAI's agentic software factory | **Confirmed (secondary) + detail** | Gergely Orosz (15 Sep 2026), from interviews with 7 named engineers. Low-risk areas can opt into **agent auto-approval**; high-risk changes get a mandatory human reviewer. The deploy agent only acts after a human approves the rollout. Load on some systems rose ~10x in ~6 months. Non-engineering teams went from 0% to 90% using Codex. **Andrew Ambrosino is the Codex *desktop* lead**, not "the Codex lead". No defect data is published. | the guide's evaluation of the article [secondary] |
| 14e | 92%+ of technical staff use Codex; ~70% more merged PRs | **Corrected (two sources)** | The official GA post (6 Oct 2025) says "nearly all engineers use Codex… up from just over half in July," engineers "merge 70% more pull requests each week," and Codex reviews "almost every PR." The **92%** comes only from a forum recap on 4 Dec 2025. | openai.com/index/codex-now-generally-available; OpenAI forum [via search summary] |

## 2. New findings that fill gaps

- **Uber's budget.**
  - CTO Praveen Neppalli Naga said Uber "maxed out its full year AI budget just a few months into 2026", mostly because of Claude Code.
  - COO Andrew Macdonald (May 2026) said "25% of our code commits were via Claude Code last quarter," but that the link to more useful features is "very hard to draw."
  - Earlier, CEO Dara Khosrowshahi had said 90% of Uber engineers use AI daily.
  - [primary quote via Willison, 27 May 2026; Willison slides, 27 Sep 2026]
- **The tokenmaxxing reversal.**
  - In Feb 2026: Meta put AI into performance reviews, Microsoft pushed AI on nearly every employee, and Uber said 90% of its engineers use AI.
  - By mid-2026: Meta planned to "crack down on employee token use" (The Information), Microsoft said "Tokenmaxxing is not what we are optimizing for," and Uber capped spending.
  - In late May 2026 Microsoft cancelled internal Claude Code licenses in favor of its own Copilot CLI. The Verge says the move was also financial.
  - DORA's 2 Jun 2026 insight cites Salesforce's **Agentic Work Units** as an outcome metric that replaces counting tokens.
  - [via Willison; dora.dev repo]
- **Amazon's internal response.**
  - In Mar 2026 Amazon retail imposed a **90-day "code safety reset"** on ~335 Tier-1 systems; Treadwell called it "controlled friction."
  - Major changes now need two reviewers. According to the FT, junior and mid-level engineers now need senior sign-off on AI-assisted changes.
  - This followed outages on 2 and 5 Mar, with an estimated ~120k and ~6.3M lost orders.
  - Amazon says only one recent incident involved AI, and that it was user error.
  - [BI link via Zechner; Safety Mag via search summary]
- **Spotify's later scale.**
  - QCon London (Mar 2026): a Honk rewrite running at "**1,000 merged PRs every 10 days**".
  - Part 4 (22 Apr 2026): dataset migrations.
  - Jun 2026: **Honk v2**, with multiplayer sessions, team projects, and orchestration via "Chirp".
  - [via search summary]
- **Shopify.**
  - "**River**" (May 2026) is an internal coding agent that only works in public Slack channels: "River does not respond to direct messages." Lütke calls the setup a *Lehrwerkstatt* (teaching workshop).
  - In Sep 2026 Shopify dropped React Native for separate native apps, because "agents can now do enough of the implementation, translation, testing, and review work" to make two codebases affordable.
  - [via Willison]
- **Lopopolo** (4 Mar 2026): "my team… ships **75 PRs a week with Symphony**." This probably explains the "70 PRs/Week" podcast title. [Lopopolo X archive, in his repo]
- **Databricks, "Managing AI Coding Costs at Scale"** (7 Aug 2026).
  - It draws on interviews with Stripe, Coinbase, Uber and Ramp.
  - Its routing cut average task cost by **more than 30%**, and harness and cache tuning cut tokens by about 50%. Both are internal figures.
  - It recommends progressive spending gates over hard caps for interactive use.
  - [guide evaluation, secondary]
- **Block, beyond the report.**
  - Agents make daily or weekly cleanup passes over a ~1M-line codebase to contain tech debt.
  - Claude refuses to "hack around" the dual-approval system, and Block benchmarks that refusal.
  - Axen illustrates the interface problem with "45 agents working with you."
  - The case study's "Buzz" link points to Anthropic's 24 Jun 2026 post on human-agent teams, not to a repo.
- **Unverified leads from Osmani's "Brownfield Agentic Engineering"** (14 Sep 2026):
  - "Shopify rebuilt the Shop app in twelve weeks"
  - "Stripe moved 3.7 million lines to TypeScript"
  - "Asana cleared an Enzyme backlog in two weeks for about $12,000"
  - Spotify "650+ agent PRs a month" (this one matches claude.com)
  - [guide evaluation, secondary]
- **Uber "Building uReview" talk** (28 Aug 2026): it tracks how often comments are addressed and how engineers react to them, and splits single-file and multi-file reviewers. **Google:** DORA (10 Mar 2026) analyzed 1,110 open-ended responses from Google engineers (Q3 2025). The top uses were code generation, information seeking, code review and testing.

## 3. Suggested edits

1. **§4.2 intro.** "That applies mainly to Cursor, Cognition, Stripe, Spotify and other company blogs." → "That applies mainly to Cursor, Cognition and Stripe. Spotify, Airbnb, Uber, Meta and Google figures were re-checked in wave 2."
2. **§4.3 Stripe.**
   - "1,000+ merged PRs/week; humans review, no human-written code" → "1,000+ merged PRs/week (Part 1, Feb 2026), 1,300+ (Part 2); all human-reviewed (secondary sources)".
   - "(~500 tools)" → "(400+, later ~500 tools)".
3. **§4.3 Spotify.** "1,500+ merged PRs; 60–90% time savings" → "1,500+ merged PRs (Nov 2025); 650+ merged per month and 'up to 90%' time saved (vendor page); ~1,000 merged per 10 days (Mar 2026)". Remove the †.
4. **§4.3 Ramp.** "~30% of merged PRs†" → "~30% of merged PRs, frontend and backend repos (Jan 2026); reportedly over half by Feb 2026 (unverified)".
5. **§4.3 Block.** "**Two human approvals** for merges to main and deploys. | Thousands of PRs" → "Merges to main, deploys and flag changes stay with humans; **two humans approve each deploy**. | 'A thousand' merged PRs per migration; multi-thousand-PR migrations; no quality data".
6. **§4.3 Uber.** "~75% of comments rated useful" → "Covers >90% of ~65k weekly diffs; ~75% of comments useful; >65% addressed (vs 51% of human comments); ~1,500 dev-hours/week saved". Remove the †.
7. **§11.5.** "Uber caps AI coding tools at **$1,500/month per employee**." → "Uber caps token spend at **$1,500/month per employee per agentic coding tool** (Bloomberg, 2 Jun 2026), after using up its 2026 AI budget in about four months."
8. **§4.2 AWS.**
   - "~4,500 developer-years saved." → "~4,500 developer-years and ~$260M/yr (Jassy, Aug 2024); 79% of auto-generated reviews shipped unchanged."
   - "A reported Kiro-linked AWS disruption† (disputed by Amazon)…" → "The FT reported a 13-hour Dec 2025 outage of AWS Cost Explorer in one China region after Kiro chose to 'delete and recreate the environment.' Amazon blamed misconfigured access and added mandatory peer review. In Mar 2026, retail imposed a 90-day 'code safety reset'."
   - Kiro: drop the †, and add "GA 17 Nov 2025 (property-based spec tests, checkpoints, Kiro CLI)".
9. **§4.2 Meta.** "Earlier: TestGen-LLM† and CodeCompose†." → "Earlier: TestGen-LLM (2024: 73% of recommendations accepted); ACH (2025: 73% of tests accepted); CodeCompose (2023: 22% acceptance, 8% of its users' typed code)." Add the JiTTesting numbers: 41 → 8 → 4, and a 70% cut in review load.
10. **Brief 03 §2.2.** "Google's LLM-driven code-migrations paper (Jan 2025) [K]" → "'Migrating Code At Scale With LLMs At Google' (Ziftci et al., Apr 2025, FSE 2025)… 74.45%/69.46%… ~50% (developer estimate). The separate Jan 2025 Nikolov et al. paper covers the Ads int32→int64 migration."
11. **§4.2 OpenAI.**
    - Move "The Codex lead observed… fewer things in parallel" out of the arXiv usage-data bullet and into the factory bullet, attributed to "Andrew Ambrosino (Codex desktop lead), Pragmatic Engineer, Sep 2026".
    - Factory bullet: add "opt-in **agent auto-approval** for low-risk areas".
    - Add: "Officially (6 Oct 2025): nearly all OpenAI engineers use Codex and merge 70% more PRs a week."
12. **§4.4 "Do humans review code?"** Add: "Lopopolo reviews agent PRs after merge. Amazon moved the other way after its outages and now requires senior sign-off on AI-assisted changes."
13. **Brief 03 §2.4.** "weekly-usage target of about 80%" → "Nov 2025 DeSantis/Treadwell memo named Kiro the recommended tool and froze new third-party AI tools; ~70% had tried Kiro by Jan 2026; the 80% target is unverified."
14. **§5 Karpathy entry.** "…53% faster." → "…53% faster with 61% fewer allocations (PR #2056, Mar 2026: ~120 experiments, Pi + pi-autoresearch, 974 tests)."
15. **§4.2 Replit.** Drop the †. Add: "(day 9 of Lemkin's trial; Replit then shipped automatic dev/prod DB separation, a planning-only mode and one-click restore)".
16. **StrongDM (brief 03 §2.9).** "(Okta, Jira, Slack, Google Workspace)" → "(Okta, Jira, Slack, Google Docs/Drive/Sheets)".

## 4. Sources

- How Block orchestrates Claude Fable across thousands of pull requests — Anthropic/Block (B. Axen) — 8 Oct 2026 — https://claude.com/resources/articles/how-block-orchestrates-claude-fable-across-thousands-of-pull-requests — fetched — [primary, vendor-published]
- Spotify cuts migration time by 90% with Claude Agent SDK — Anthropic — ~Nov 2025 (undated) — https://claude.com/customers/spotify — fetched — [primary, vendor]
- Honk Part 1 / Part 3 / Jun 2026 post — Spotify — Nov 2025 / Dec 2025 / Jun 2026 — https://engineering.atspotify.com/2025/11/spotifys-background-coding-agent-part-1 · https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3 · https://engineering.atspotify.com/2026/6/code-with-claude-coding-is-no-longer-the-constraint — [via search summary]
- Spotify Part 3 summary — ZenML — 2026 — https://zenml.io/llmops-database/background-coding-agents-with-strong-feedback-loops-for-large-scale-code-transformations — judge statistics — [secondary]
- Spotify Honk rewrite — InfoQ — Mar 2026 — https://www.infoq.com/news/2026/03/spotify-honk-rewrite — [via search summary]
- Spotify engineers haven't coded since December — PPC Land — Feb 2026 — https://ppc.land/spotify-engineers-havent-coded-since-december-as-ai-transforms-development/ — [via search summary]
- Stripe Minions — InfoQ (Mar 2026) / ByteByteGo / Ry Walker / Port.io — https://infoq.com/news/2026/03/stripe-autonomous-coding-agents/ · https://blog.bytebytego.com/p/how-stripes-minions-ship-1300-prs · https://rywalker.com/research/stripe-minions · https://software-factories.port.io/stripe — [via search summary]
- Ramp Inspect — InfoQ (Jan 2026) / Ry Walker — https://infoq.com/news/2026/01/ramp-coding-agent-platform/ · https://rywalker.com/research/ramp-inspect — [via search summary]; Open-Inspect README — https://github.com/ColeMurray/background-agents — fetched — [secondary]
- How StrongDM's AI team build serious software… — S. Willison — 7 Feb 2026 — https://simonwillison.net/2026/Feb/7/software-factory/ — [primary quote via Willison]; Attractor README — https://github.com/strongdm/attractor — fetched — [primary]
- Shopify memo quote — Willison — 7 Apr 2025 — https://simonwillison.net/2025/Apr/7/tobias/ (→ https://twitter.com/tobi/status/1909231499448401946) — [primary quote via Willison]; headcount rule — The Logic — https://thelogic.co/briefing/shopify-staff-must-use-ai-lutke-says/ — [via search summary]
- Liquid PR #2056 — Willison — 13 Mar 2026 — https://simonwillison.net/2026/Mar/13/liquid/ (→ https://github.com/Shopify/liquid/pull/2056) — [via Willison]
- River / back to native — Willison — 11 May 2026 / 10 Sep 2026 — https://simonwillison.net/2026/May/11/learning-on-the-shop-floor/ · https://simonwillison.net/2026/Sep/10/shopify-react-native/ (→ https://shopify.engineering/back-to-native) — [via Willison]
- Roast README — Shopify — https://github.com/Shopify/roast — fetched — [primary]
- Accelerating Large-Scale Test Migration with LLMs — Airbnb — Mar 2025 — https://airbnb.tech/?p=366 — [via search summary]; InfoQ — https://www.infoq.com/news/2025/03/airbnb-llm-test-migration/ — [via search summary]
- uReview — Uber — 2025 — https://www.uber.com/en-GB/blog/ureview/ — [via search summary]
- Uber caps / product-market fit / 2026 in LLMs — Willison — 3 Jun / 27 May / 27 Sep 2026 — https://simonwillison.net/2026/Jun/3/uber-caps-usage/ (→ Bloomberg https://www.bloomberg.com/news/articles/2026-06-02/uber-caps-usage-of-ai-tools-like-claude-code-to-cut-costs) · https://simonwillison.net/2026/May/27/product-market-fit/ · https://simonwillison.net/2026/Sep/27/2026-in-llms-so-far/ — [primary quote via Willison]
- Coinbase says AI writes nearly half of its code — Cointelegraph — 4 Sep 2025 — https://cointelegraph.com/news/coinbase-says-ai-writes-nearly-half-of-its-code — [via search summary]
- Raising the AI fluency bar in hiring — Zapier — 31 Mar 2026 — https://zapier.com/blog/raising-ai-fluency-bar-in-hiring/ — [via search summary]
- How Intercom 2x'd their engineering — Lenny's Newsletter — 2026 — https://www.lennysnewsletter.com/p/how-intercom-2xd-their-engineering — [via search summary]
- Nubank story — Cognition — https://devin.ai/financial-services — vendor claim — [via search summary]
- Robinhood CEO on AI code — BI via AOL — Jul 2025 — https://www.aol.com/robinhood-ceo-says-majority-companys-094801868.html — [via search summary]
- Replit failure — eWeek — Jul 2025 — https://www.eweek.com/news/replit-ai-coding-assistant-failure/ — [via search summary]
- AWS outage — FT, Feb 2026 — https://www.ft.com/content/00c282de-ed14-4acd-a948-bc8d6bdb339d; Amazon rebuttal — https://www.aboutamazon.com/news/aws/aws-service-outage-ai-bot-kiro; BI, Mar 2026 — https://www.businessinsider.com/amazon-tightens-code-controls-after-outages-including-one-ai-2026-3 — all via M. Zechner, 25 Mar 2026 (local corpus) — [secondary]; Engadget — https://engadget.com/ai/13-hour-aws-outage-reportedly-caused-by-amazons-own-ai-tools-170930190.html — [via search summary]
- 90-day code safety reset — Safety Mag — Mar 2026 — https://www.thesafetymag.com/ca/news/general/amazon-imposes-90-day-code-safety-reset-after-outages/547354 — [via search summary]
- Kiro memo — Slashdot/Reuters — 30 Nov 2025 — https://developers.slashdot.org/story/25/11/30/048214/amazon-tells-its-engineers-use-our-ai-coding-tool-kiro — [via search summary]
- Kiro GA — Kiro — Nov 2025 — https://kiro.dev/blog/general-availability/ — [via search summary]; Kiro README — https://github.com/kirodotdev/Kiro — fetched — [primary]
- Q Developer $260M — AWS — Aug 2024 — https://aws.amazon.com/blogs/devops/amazon-q-developer-just-reached-a-260-million-dollar-milestone — [via search summary]
- Meta papers — TestGen-LLM https://arxiv.org/abs/2402.09171v1 · ACH https://www.alphaxiv.org/abs/2501.12862v1 · CodeCompose https://arxiv.org/abs/2305.12050v1 · JiTTesting https://arxiv.org/abs/2601.22832v1 — [via search summary]
- Meta AI performance reviews — HR Grapevine — 17 Nov 2025 — https://www.hrgrapevine.com/us/content/article/2025-11-17-meta-to-formally-review-employees-ai-performance-from-2026 — [via search summary]
- Google — Research blog (6 Jun 2024) https://research.google/blog/ai-in-software-engineering-at-google-progress-and-the-path-ahead/ · Ziftci et al. https://arxiv.org/abs/2504.09691v1 · Nikolov et al. https://arxiv.org/abs/2501.06972v1 · Pichai on Lex Fridman https://glasp.co/youtube/9V6tWC4CdFQ · 75% https://www.sherwood.news/tech/google-75-of-our-new-code-is-written-by-ai/ — [via search summary]
- dora.dev site source — DORA — last commit 29 Jul 2026 — https://github.com/dora-team/dora.dev — cloned — [primary]
- harness-engineering repo — R. Lopopolo — Jul 2026 — https://github.com/lopopolo/harness-engineering — cloned — [primary]
- Codex GA — OpenAI — 6 Oct 2025 — https://openai.com/index/codex-now-generally-available — [via search summary]; OpenAI Forum recap — 4 Dec 2025 — https://forum.openai.com/home/blogs/how-openai-engineers-use-codex-to-tackle-big-projects-with-rigor-2025-12-04 — [secondary]
- Inside OpenAI's agentic software factory — Pragmatic Engineer — 15 Sep 2026 — https://newsletter.pragmaticengineer.com/p/openai-software-factory — read via the guide's evaluation in https://github.com/FlorianBruniaux/claude-code-ultimate-guide (docs/resource-evaluations/2026-09-15-openai-agentic-software-factory.md) — [secondary]
- Databricks, Managing AI Coding Costs at Scale (7 Aug 2026) — https://www.databricks.com/blog/managing-ai-coding-costs-scale; Osmani, Brownfield Agentic Engineering (14 Sep 2026) — https://addyo.substack.com/p/brownfield-agentic-engineering — both via the guide's evaluations — [secondary]

## 5. Still unknown

- **Stripe:** the exact stripe.dev wording for all Minions figures, plus the local-lint and shared-rule-file claims and "3.7M lines to TypeScript".
- **Spotify:** whether "60–90%" appears anywhere (only "up to 90%" is confirmed), and whether the verify tool is exposed via MCP.
- **Ramp:** the "over half of merged PRs" figure (Modal, Feb 2026).
- **Goldman Sachs:** the Devin pilot.
- **Amazon:** the 80% weekly target, the Kiro preview date, the May 2026 opening to Codex and Claude, and the lost-order estimates.
- **Google:** the Jun 2024 blog's exact 50%/37% wording, and Nikolov et al.'s ~80%. **Whether DORA cancelled its 2026 survey:** nothing on dora.dev shows it as of 29 Jul 2026.
- **OpenAI:**
  - whether "How OpenAI uses Codex" recommends best-of-N;
  - the exact "aren't required to" sentence;
  - whether 3.5 PRs/day refers to the 3-engineer phase;
  - what "70 PRs/Week" counts.
- **Quality data:** none of Stripe, Spotify, Ramp, Block, Intercom or OpenAI's factory publishes defect, change-failure or rollback rates. Amazon's and Replit's incidents are the only published negative outcomes.
