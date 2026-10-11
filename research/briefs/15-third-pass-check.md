# Brief 15 (third pass): Primary-source re-check, link check and config tests

Scope: the whole report as of 11 Oct 2026, with emphasis on what the first two passes could not reach. Evidence base:
- **An unrestricted network.** The first two passes ran in a sandbox that blocked cursor.com, openai.com, vercel.com, arxiv.org, metr.org, x.com, simonwillison.net and most news sites. This pass ran from an ordinary home connection on macOS. openai.com rejects scripted fetches (403), so its pages were read in a browser. stripe.dev, builders.ramp.com and tbench.ai render with JavaScript, so their figures were read from the data embedded in the page.
- **A full link check** of every URL in the report and the briefs: one GET per URL, browser user agent, redirects followed.
- **Local runs**: the Appendix A JSON was validated against the schemastore schema, and the scripts were run through `bash -n`, `shellcheck`, and real inputs on GNU-compatible and BSD grep. The sandbox behaviour was tested with `@anthropic-ai/sandbox-runtime` 0.0.79, the runtime Claude Code's sandbox is built on.
- **Claude Code itself**: the docs at code.claude.com, `CHANGELOG.md`, npm registry metadata, and `--help` from v2.1.295 and v2.1.267.

## 1. Verification ledger

**Totals.** 33 claims that depended on blocked sites: 28 confirmed, 4 partly right or out of date, 1 wrong. 46 Claude Code details: 32 confirmed, 8 partly right (mostly dates), 1 wrong, 5 not settled by the docs alone. 37 GitHub star counts: all within ±2% of the live value.

| Claim (report §) | Verdict | Correct wording / detail | Source, date |
|---|---|---|---|
| "It doesn't get easier, you just get faster" as Willison's words (§1, §11.5) | **Wrong attribution** | The line is cyclist Greg LeMond's. Willison quotes it and applies it to software engineers. | simonwillison.net/2026/Sep/27/2026-in-llms-so-far/ |
| ETH: LLM-generated files lower success and raise cost >20%; human-written ~+4 points (§1, §3.5, §6.3, §10) | **Out of date (v1 figures)** | v3 (29 Sep 2026): context files "do not generally improve task success" while raising cost >20%. LLM-generated: −0.5 / −2 points (p = 0.87 / 0.37). Developer-written: +2.4 points (p = 0.21), significantly better than LLM-generated (p = 0.038). Files help with non-standard practices; repository overviews do not. | arxiv.org/abs/2602.11988v3 |
| SkillsBench: +16.2 average, ~+4.5 in software engineering, 16 of 84 worse, self-generated ≈ 0 (§3.5) | **Out of date (v1 figures)** | v4 (14 Jun 2026): +16.6 pp (33.9% → 50.5%) over 87 tasks and 18 model-harness setups; software engineering +11.6 pp; 13 of 87 tasks negative; self-generated skills −8.1 to −11.5 pp. | arxiv.org/abs/2602.12670v4 |
| Rehberger's auto-mode bypass "~80%" (§3.2, §6.7, §11.5) | **Partly** | "60-80% attack success rate using a small sample size"; 80% is the best variant. | embracethered.com, 26 Aug 2026 |
| Official Terminal-Bench 4.0 board: GPT-6 Astra + Codex ~58.2% vs Fable 5.1 + Claude Code ~57.9% (§11.2) | **Out of date** | Correct as of 1–3 Oct (archived copies agree). On 11 Oct the board shows Opus 5.5 + Claude Code 64.85% (330 trials, max effort), Sonnet 5.5 61.82%, GPT-6 Astra and GPT-6.1 Sol 58.18%, Fable 5.1 57.88%. | tbench.ai, live and archived copies of 28 Sep, 3 Oct and 6 Oct |
| Microsoft CLI-agent rollout ~+24% merged PRs (§3.1) | **Confirmed, detail added** | The paper also splits by tool, in weeks an engineer used it: Copilot CLI +24.9% [23.0, 26.8], Claude Code +11.4% [9.4, 13.6]. Brief 12 had called the split blog-only. | arxiv.org/abs/2607.01418 |
| Agent-PR merge rates (71.5% overall; Claude Code 59.0%, n = 459) credited to the AIDev paper (§3.3) | **Confirmed, wrong citation** | The rates come from Ehsani et al., arXiv 2601.15195, which analyzes AIDev data. The AIDev paper (2602.09185) only supplies the 932,791-PR dataset. | arxiv.org/html/2601.15195 |
| Merge conflicts: 41.7% when "two different agents touch the same code" (§3.3) | **Overstated** | The pairs are agent PRs open at the same time in one repository, not PRs touching the same code. Different-agent pairs are ~0.5% of pairs. | arxiv.org/abs/2607.04697 |
| METR "has published nothing for Opus 5/5.5 or Fable" (§3.8, §11.2) | **Partly** | No time horizon has been published. METR's time-horizons page says it is no longer actively updated (last update 8 Sep 2026). METR did publish an Opus 5.5 pre-deployment summary on 22 Sep 2026, without a horizon. | metr.org/time-horizons/, metr.org/blog/2026-09-22-claude-opus-5-5/ |
| METR Feb 2026 update: 57 developers, 1,134 issues; survey "reportedly" run (§3.1) | **Detail** | METR's post says 800+ tasks; 1,134 is the issue count in its public data. The survey (n = 349, Feb–Apr 2026) is published by METR. | metr.org/blog/2026-02-24-uplift-update/, metr.org/blog/2026-05-11-ai-usage-survey/ |
| Novices 15% vs 28–33% "for experienced users" (§1) | **Wording** | The comparison group is intermediate users and above (§3.4 already said so). | anthropic.com/research/claude-code-expertise |
| Google ~75% of new code, "up from 25% in Oct 2024" (§4.2) | **Confirmed, baseline added** | Pichai's Cloud Next 2026 post gives "50% last fall" as the intermediate point. | blog.google, 22 Apr 2026 |
| "34 Claude Code security advisories" (§3.2) | **Confirmed** | 34 published on the repository's security page, 23 Jun 2025–9 Oct 2026: 27 high, 4 medium, 3 low. Brief 04's type breakdown covers 30 of them. | GitHub API, `repos/anthropics/claude-code/security-advisories` |
| Cursor best-practices specifics, and "Opus stops earlier" (§4.2, †) | **Confirmed** | Revert and refine the plan; rules only after repeated mistakes; linters over style guides; a stop hook capped at 5 iterations. Quote: "Opus 4.5 tends to stop earlier and take shortcuts when convenient". | cursor.com/blog/agent-best-practices (9 Jan 2026); cursor.com/blog/scaling-agents (14 Jan 2026) |
| Cognition "Coding Agents 101" and the "senior/junior" line (§4.2, †) | **Confirmed** | "senior-level at codebase understanding but junior at execution". | devin.ai/agents101 (Jun 2025); cognition.ai/blog/devin-annual-performance-review-2025 |
| Stripe Minions 1,000+ then 1,300+ merged PRs/week; Spotify judge vetoes ~25%; Ramp ~30% of merged PRs (§4.3) | **Confirmed** | All match the companies' own posts. Ramp's "over half by Feb 2026" is still unverified. | stripe.dev (19 Feb 2026); engineering.atspotify.com (Dec 2025); builders.ramp.com (12 Jan 2026) |
| OpenAI harness engineering; Vercel 100 / 79 / 53% and "skill never invoked in 56%" (§4.2) | **Confirmed** | The Vercel post gives no task count. The "~19 tasks" figure comes only from a secondary digest, as the report already says. | openai.com/index/harness-engineering/; vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals |
| Claude in Chrome "GA June 2026" (§7.8) | **Wrong date** | GA in v2.1.198, published 1 Jul 2026 (16:50 UTC). Background subagents by default shipped in the same release. | CHANGELOG.md; npm registry |
| Auto mode default for Pro, Max and Team "from 14 Aug" (§2, §7.3) | **Confirmed** | Anthropic's 7 Aug 2026 announcement says it applies starting on August 14. | claude.com/resources/articles/auto-mode-default-in-claude-code |
| Cross-session messaging in "Aug 2026" (§2, §7.10) | **Confirmed** | "Added cross-session SendMessage" appears in v2.1.224 (7 Aug 2026). Earlier fixes mention a same-machine form from June. | CHANGELOG.md; npm registry |
| Haiku 5.5 at $0.10 / $0.50 (§7.1, §11.1) | **Partly** | That price covers prompts up to 100K tokens; above that it is $0.50 / $2.50. | Claude API model reference (cached 6 Oct 2026) |
| "542 npm versions" (§7) | **Partly** | 542 versions were published; 538 are still listed (four are no longer available). | registry.npmjs.org/@anthropic-ai/claude-code |
| Agent teams "no worktree isolation" (§7.5) | **Reworded** | The docs say two teammates editing the same file overwrite each other, and recommend giving each its own files. They do not use the phrase. | code.claude.com/docs/en/agent-teams |

Everything else checked in §1, §3, §4 and §7 matched its primary source. Examples:
- Anthropic's >80% of merged code, Willison's ~95%, Steinberger's ~100%;
- the learning RCT (50% vs 67%) and the auto-mode 17% false-negative rate;
- the METR 2025 RCT and TH1.1 figures, read from METR's live results file;
- the Stack Overflow 2026 figures and Veracode 2026;
- the 91.8% SKILL.md defect rate;
- the Claude Code settings keys, rule syntax, hook semantics, status-line fields, CLI flags and limits.

## 2. Link check

- **Report:** 204 unique URLs before this pass. All returned 200 except an `http://localhost:1234` example in A.15 and one Medium page that answers scripted requests with 403. This pass added 5 primary links (Cursor ×2, Cognition, Stripe, tbench.ai), all 200.
- **Briefs:** 1,028 unique URLs after normalisation; 1,000 returned 200.
  - **Real 404s:**
    - brief 09: `claude.com/code-with-claude/session/sf-ext-you-should-build-evaluation-engineers-instead-of-evaluation-sets`;
    - brief 03: `newsanalysis.net/pichai-google-75-percent-ai-code-claim/`. The claim itself is confirmed by Pichai's own post.
    - brief 07: `www.conductor.build/workflows/run-parallel-claude-codes`.
  - **Unreachable:** `vibekanban.com/blog/shutdown` (consistent with the company having shut down) and `cve-dev.imfht.com`.
  - **Bot walls**, probably fine in a browser: medium.com ×5, ft.com ×2, bloomberg.com, dl.acm.org, pubsonline.informs.org, news.ycombinator.com (rate limit) and four blogs.
  - **Placeholders, not links:** `ntfy.sh/$NTFY_TOPIC`, `https://$HA_HOST/api/mcp`, and a Supabase URL with an empty `project_ref`.
- **Why a 200 means something here:** code.claude.com, claude.com/resources, anthropic.com, simonwillison.net, arxiv.org, metr.org, embracethered.com and stackoverflow.blog all return 404 for a made-up path. platform.claude.com returns 200 for anything, and openai.com returns 403 for anything, so links there were checked by title or in a browser.
- **Redirects:** about 40, all to the moved page rather than a generic one. Examples:
  - claude.com/blog → /resources/articles;
  - repository renames such as `affaan-m/everything-claude-code` → `affaan-m/ECC`, `ruvnet/claude-flow` → `ruvnet/ruflo` and `block/goose` → `aaif-goose/goose`;
  - developers.openai.com/codex → learn.chatgpt.com.

## 3. Configs run

| Config | Result before | Fix applied in the report |
|---|---|---|
| A.2 and A.3 JSON | Both valid against the schemastore schema. The schema is stale in three places: no `Concise` in the outputStyle description, no `mask` credential mode, and 31 hook events against 33 in the docs. | None needed |
| A.3 `require-green.sh` (Stop gate) | `git diff --quiet HEAD` exits 0 when the only changes are untracked files, so a turn that only adds files skips typecheck and tests. Reproduced in a scratch repository. | Check `git status --porcelain` instead. Retested in a scratch repository on six cases: clean tree, failing checks, the five-retry cap, a fix clearing the counter, new files only, and staged files. The old gate let the new-files-only case stop; the fixed one passes all six. |
| A.3 PostToolUse formatter | `xargs` splits a path with spaces into two arguments, so the formatter fails on, for example, iCloud Drive paths. | `xargs -I{}` |
| A.3 `guard-bash.sh` | Missed `rm -fr`, `rm -Rf`, split flags and `wget \| sh`. | One regex covers every recursive-`rm` form and `wget`. Retested on 24 commands. |
| A.16 personal guard | Missed split flags, and a bare `git push` while `main` is checked out. | Reads `cwd` from the hook input and checks the current branch. Retested. |
| A.2 sandbox on macOS (tested with `srt` 0.0.79) | Every sandboxed `git commit` failed: a global pre-commit hook writing to `/tmp` was blocked, and signing could not write its temp file. `gh api` failed TLS verification (x509, as the docs warn). An allowed registry returned 200 and an unlisted host was blocked. Writes outside allowed paths were blocked. `~/.ssh` was readable unless denied. | `excludedCommands` for `git commit`, `git push`, `git pull`, `git fetch` and `gh` |
| A.14 `srt` settings | `srt` 0.0.79 refuses a file that omits `network.deniedDomains`, so the A.14 file would not run. | Added `"deniedDomains": []` and a note |
| A.4 status line | Works: model, effort, context %, 5-hour and 7-day usage, branch; ~35 ms per refresh. | None needed |

## 4. Edits made to the report

- §1: LeMond attribution, the context-file sentence, and "intermediate users and above".
- §2: 1 Jul entry added.
- §3.1: METR task count and survey; Microsoft per-tool split.
- §3.2: advisory count detail; bypass rate.
- §3.3: merge-rate citation; conflict wording.
- §3.5: ETH v3; SkillsBench v4.
- §3.8: METR status.
- §4.2: Google baseline; Cursor and Cognition links, with the † marks removed.
- §4.3: Stripe primary link.
- §6.3, §6.7, §10: ETH and bypass wording.
- §7: npm count, Haiku long-context price, agent-teams wording, Chrome GA date, timeline split.
- §11.2: Terminal-Bench board and METR status.
- §11.5: bypass rate; LeMond attribution.
- Appendix A: the fixes in §3 of this brief.
- Appendix C: a third-pass summary, and a shorter "still unverified" list.

The first- and second-pass briefs are left as they were.

## 5. Sources

Primary pages opened in this pass, beyond those already cited in the report:
- arxiv.org/abs/2602.11988v3
- arxiv.org/abs/2602.12670v4
- arxiv.org/abs/2607.01418
- arxiv.org/html/2601.15195
- arxiv.org/abs/2607.04697
- arxiv.org/abs/2608.08453
- metr.org/time-horizons/
- metr.org/assets/benchmark_results_1_1.yaml
- metr.org/blog/2026-09-22-claude-opus-5-5/
- metr.org/blog/2026-05-11-ai-usage-survey/
- www.tbench.ai (live, plus archived copies)
- cursor.com/blog/agent-best-practices
- cursor.com/blog/scaling-agents
- devin.ai/agents101
- cognition.ai/blog/devin-annual-performance-review-2025
- stripe.dev (Minions parts 1 and 2)
- engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3
- builders.ramp.com/post/why-we-built-our-background-agent
- openai.com/index/harness-engineering/
- developers.openai.com/api/docs/pricing
- vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals
- survey.stackoverflow.co/2026/ai
- veracode.com/blog/2026-genai-code-security-report-ai-risk/
- blog.google (Cloud Next 2026)
- claude.com/resources/articles/auto-mode-default-in-claude-code
- code.claude.com/docs/en/sandboxing and settings-reference
- github.com/anthropics/sandbox-runtime
- the Docker Sandboxes docs in github.com/docker/docs
- raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
- registry.npmjs.org/@anthropic-ai/claude-code

## 6. Still unknown

- Whether SSH commit signing can work inside the macOS sandbox with the agent socket allowed. Sandboxed commits failed earlier, on hooks and temp files. The agent socket path also changes at every login, so a fixed `allowUnixSockets` entry would not survive a reboot.
- Ramp's "over half of merged PRs by Feb 2026", Amazon's internal targets, and the full text of some Boris Cherny threads.
- Time horizons for Opus 5/5.5, Fable and Mythos 5.x, which METR has not published.
- When the artifact version of this report is rebuilt, render with `pandoc -f gfm` or escape `$`. The converter used for the first artifact turned `$4/$20`-style text into TeX math in nine places.
