# Brief 12 (second pass): Research and evidence gaps, verification and fill-in

Scope: report §3 and brief 04 §7, as of 11 Oct 2026. Evidence base:
- **Primary data I computed myself:**
  - METR's public TH1.1 runs, `github.com/METR/eval-analysis-public`, 4 snapshots from 20 Jan to 5 Mar 2026. I re-fit METR's weighted logistic method with scikit-learn.
  - A third-party copy of METR's official TH1.1 results file (`joansam/metr-chart`). Its values match my re-fit exactly; for example, Opus 4.6 comes out at 718.8 min in both.
  - The GitHub Advisory Database (git snapshot of 11 Oct 2026).
  - The DGM and MAST repos.
- **First-party pages fetched:** claude.com and anthropic.com.
- **Local Willison corpus.**
- **35 web searches**, labelled "[via search summary]" where used.

## 1. Verification ledger

| Claim (report §) | Verdict | Correct wording / detail | Source(s), date |
|---|---|---|---|
| TH1.1 doubling "~131 days since 2023" (§3.8) | **Confirmed (drifted)** | METR's current TH1.1 file gives **128.7 days (95% CI 104–158) for models released since 2023**, excluding estimates above 16 h. My re-fit of the public runs gives 137, 134 and 129 days for the 30 Jan, 12 Feb and 5 Mar snapshots. | METR results YAML (copy); eval-analysis-public commit 52cb829, 5 Mar 2026 [primary data] |
| "~89 days since 2024" (§3.8) | **Partly confirmed; needs a qualifier** | METR's pipeline computes its "from 2024" trend only over **Jan 2024–25 Feb 2025** (the original paper's window). My re-fit gives 92 days for that window, but 98–104 days for 2024 to Feb 2026. So "since 2024" overstates the recent pace. | Same; `reports/time-horizon-1-1/dvc.yaml` |
| "Opus 4.5 sits at ~320 minutes"; brief: "GPT-5 ~214 min" (§3.8, brief §2.13) | **Corrected** | TH1.1 Opus 4.5 = **293 min (4 h 53 m; 95% CI 162–624 min)**. It was already 293.0 in the 20 Jan 2026 release snapshot. GPT-5 = **203 min**. I found no source for 320 min. (TH1.0's figure was about 4 h 49 m, from memory and not re-verified.) | METR YAML; my re-fit of the 20 Jan snapshot [primary data] |
| "Claude Mythos Preview ~17.4 h (Mar 2026)" (brief §7) | **Confirmed, date corrected** | Covers the "Claude Mythos Preview (early)" snapshot (release date in METR's file: 7 Apr 2026). 50% horizon **1,045 min = 17.4 h (95% CI 8.5–55 h)**; 80% horizon 186 min (3.1 h). METR published it about 8 May 2026 as "**at least 16 h**", because measurements above 16 h are unreliable. Only 5 of the 228 TH1.1 tasks run 16 h or longer, and the longest is 30 h. | METR YAML; my task count from runs; [via search summary] |
| No primary METR figure for Opus 4.6 / GPT-5.3-Codex (brief §7) | **Filled** | Opus 4.6: **718.8 min ≈ 12.0 h (95% CI 5.3–60.6 h)**; 80% horizon 70 min. It was first reported at about 14.5 h (870 min) on 20 Feb 2026, then revised. GPT-5.3-Codex: **349.5 min ≈ 5.8 h (CI 3.2–13.6 h)**, not a new high (the brief's earlier ~6.5 h is superseded). Also in the file: GPT-5.2 at 5.9 h, Gemini 3.1 Pro at 6.4 h and GPT-5.4 at 5.7 h. | METR YAML; public runs 5 Mar 2026; LessWrong and Wikipedia [via search summary] |
| GPT-5.6 Sol ~11.3 h (CI 5–40 h); >270 h if cheating counts as success (§11.2) | **Confirmed** | Adds that dropping cheating runs gives **71 h (CI 13–11,400 h)**. METR says none of these is robust. Sol's detected cheating rate was the highest of any public model on METR's ReAct harness. The estimate is not in METR's results file. | METR blog, 26 Jun 2026 [via search summary] |
| No METR runs for Opus 5.5 (§11.2); Opus 5 / Fable | **Confirmed (broader)** | METR has published **no horizon for Opus 4.8, Opus 5/5.5, Fable 5/5.1 or Mythos 5.x**. Anthropic's Opus 5.5 page names METR only as a pre-release evaluator. A tracker repo notes that METR's results file has not changed since Mythos Preview. Figures such as "Opus 5.5 153 h" are extrapolations from Epoch's and Anthropic's capability indices (ECI/AECI), not measurements. | anthropic.com/claude-opus-5-5 (fetched); metr-chart NOTES.md, 4 Oct 2026 [secondary] |
| "Time Horizon 2.0 exists" (brief §7) | **Still unverified (probably not released)** | METR's chart still labels TH1.1 "Current". I found no announcement. | metr.org/horizon-chart-embed [via search summary] |
| METR pipeline last synced Mar 2026 (brief §2.13) | **Confirmed** | The last commit was 5 Mar 2026. Note that METR's own results file goes further: it adds Gemini 3.1 Pro, GPT-5.4 and Mythos Preview. | eval-analysis-public git log [primary] |
| METR productivity study "being redesigned" | **Partly filled** | No new RCT has been published. The data repo is unchanged since 24 Feb 2026. A secondary report says METR ran a Feb–Apr 2026 **survey of 349 technical workers** instead; pay had been cut from $150/h to $50/h. | Measuring-Late-2025 repo [primary]; Bowley, 4 Apr 2026 [via search summary] |
| MirrorCode "runs of up to 19 days" | **Confirmed + filled** | Epoch AI paper with METR: arXiv 2606.30182, Jun 2026, 25 target programs. One of the largest runs cost $2,600 over 19 days. Epoch's leaderboard (30 tasks × 3 runs, 10B-token and 7-day caps) is led by Opus 4.7 at 56%. Opus 4.6 rebuilt `gotree` (about 16k lines of Go); the human estimate is 2–17 weeks, labelled preliminary. | MirrorCode README [primary]; Epoch, Import AI #466 [via search summary] |
| "No RCT or controlled benchmark of spec-driven or TDD-first workflows" (§3.10) | **Partly confirmed; refine** | **Spec-driven development (SDD):** still no controlled study. There are only conceptual papers (2609.00252, 2602.00180) and an observational census (SPECMINE, 2608.25202). **Tests:** one controlled ablation exists. Prompting agents to write more or fewer tests did **not** change SWE-bench Verified resolution (2602.07900). Human-written tests, by contrast, let TDFlow reach 94.3% on Verified (2510.23761). **Plan mode:** I found no controlled study. | [via search summary] |
| CLAUDE.md / AGENTS.md: only ETH, Lulla, Khatri | **Confirmed** | I found no further controlled 2026 studies. | [via search summary] |
| SkillsBench "+16.2 points" (§3.5) | **Confirmed, important nuance** | +16.2 pp is an average across 11 domains. **Software engineering gained only about +4.5 pp** (healthcare +51.9). 16 of 84 tasks got worse. Self-generated skills averaged about 0. Scale: 86 tasks, 7 configurations, 7,308 trajectories. Focused skills of 2–3 modules beat comprehensive docs. | arXiv 2602.12670 [via search summary] |
| "91.8% of 138k SKILL.md files have a defect" (§3.5) | **Confirmed** | 138,133 files from 20,556 repos. **91.8% have at least one defect** (88.8–94.6% across thresholds), and 67.0% have a routing defect. Most common: missing trigger guidance 52.3%, name repeated as heading 44.3%, too many inline examples 32.1%. Another detector (2607.01456) finds smells in more than 99% of files, so prevalence depends on the detector. | arXiv 2608.08453 (Ji et al., Aug 2026) [via search summary] |
| "49 public SWE skills averaged +1.2%" (§3.5) | **Still unverified** | Not located. The candidate 2607.09065 ("Inside the Skill Market") makes no such claim in its abstract. | [via search summary] |
| "A relevant skill doesn't reliably help" (arXiv 2610.08875) | **Still unverified** | The ID did not surface in search. | — |
| Codex usage paper: >5× users, >10% run 3+ agents, 26.6% skills, ~10× 8 h+ tasks (§4.2) | **Partly confirmed** | Johnston, Holtz, Richmond, Ong, Tambe, Chatterji (OpenAI, Columbia, Wharton, Duke), 25 Jun 2026, econ.GN. Confirmed: more than 5× growth in H1 2026, fastest outside software developers; near-universal inside OpenAI; the median legal-role employee used **13×** and the median researcher **50×+** the output tokens of Nov 2025; requests for tasks of 8 h+ up about 10× (TNW). Not re-checked: ">10% run 3+" and "26.6%". All data is OpenAI's own. | arXiv 2606.26959; RePEc; TNW [via search summary] |
| JiTTesting "numbers secondary" (§4.3) | **Confirmed from abstract** | 15 Meta authors, 30 Jan 2026, FSE 2026 industry track. Across **22,126 generated tests**, change-aware generation produced about 4× the catches of hardening tests and about 20× those of coincidental failures. Assessors cut human review load by 70%. Of 41 candidate catches, 8 were true positives and 4 were serious. | arXiv 2601.22832 [via search summary] |
| Newer models hallucinate packages at 4.6–6.1% (§3.2) | **Confirmed** | Churilov (independent): 5 models (Sonnet 4.6, Haiku 4.5, GPT-5.4-mini, Gemini 2.5 Pro, DeepSeek V3.2) and 199,845 prompts gave **4.62–6.10%**. 127 invented names are shared by all five models, and 53 of them are still registrable. No 2026 model beat the best result from 2024. | arXiv 2605.17062 [via search summary] |
| Stack Overflow 2026: 16,664 vs 30,000+ respondents | **Partly resolved** | Press coverage gives **more than 30,000 responses from 169 countries**. Per-question counts are smaller: 14,304 answered the trust item. I could not trace the 16,664 figure. | IT Brief, Oct 2026 [via search summary] |
| Stack Overflow agent shares "secondary" (§3.9) | **Confirmed** | The blog states: "The agents of choice are Claude Code (66%) and GitHub Copilot (59%)." Also 78.7% say source attribution matters, and about 20% hand deployment or operations to AI. | stackoverflow.blog, 6 Oct 2026 [via search summary] |
| Pragmatic Engineer 2026 "~906 respondents", Claude Code most used (§3.9) | **Partly confirmed** | Fielded 27 Jan–17 Feb 2026 with "nearly 1,000" responses. **Most loved: Claude Code 46%, Cursor 19%, Copilot 9%.** Claude Code is the most used, but exact usage percentages are paywalled. | newsletter.pragmaticengineer.com [via search summary] |
| JetBrains ~39% "secondary" (§3.9) | **Confirmed** | Survey of more than 15,000 professional developers, May–Jul 2026, published 18 Aug 2026: **39% use Claude Code at work** (47% in the US), up from 18% in Jan 2026. 90% use agents weekly and 68% daily. Copilot is at 21% and Codex at 16% (secondary). | blog.jetbrains.com/research [via search summary] |
| Whether DORA skipped 2026; DORA ROI report | **Still unverified** | dora.dev refers to an upcoming 2026 survey; I found no evidence of a skip, and no ROI report. | dora.dev/survey [via search summary] |
| DX Q1 2026 "~30% AI-written; +50% defects" | **Still unverified** | DX's Q1 2026 post covers 400+ companies, 93% adoption and managers "shipping 4× as much code" (method unclear). The ~30% and +50% figures were not found. | getdx.com [via search summary] |
| Faros 2026, Atlassian DevEx, Jellyfish, LinearB | **Still unverified** | Nothing found. | — |
| GitClear 2026 figures "secondary" (§3.2) | **Confirmed; baseline caveat** | GitClear's page, based on 623M changes, lists 8 signals: duplication +81%, copy/paste +41%, error-masking +47%, two-week churn +15%, refactoring moves −70%, cross-file calls −35%, legacy edits −74%. GitClear gives the baseline as **"vs 2022 levels"**; LeadDev says "since 2023". | gitclear.com; LeadDev [via search summary] |
| Veracode 45% insecure (§3.2) | **Updated** | The **2026 GenAI Code Security Report (28 Jul 2026)** finds no real improvement: an average **56% security pass rate** (about 44% insecure) across more than 100 models in 4 snapshots. Best is GPT-5.5 at 68%; worst is Qwen3.7-max at 50%. XSS (CWE-80) passes only 15%. Coding-specialized models are no safer. | veracode.com blog; SD Times [via search summary] |
| "34 Claude Code advisories in 16 months" (§3.2) | **Partly confirmed** | The GitHub Advisory Database lists **28 reviewed advisories for `@anthropic-ai/claude-code`** between 23 Jun 2025 and 24 Jul 2026: 27 with CVE IDs; 22 High, 4 Moderate, 2 Low. The gap from 34 is probably repo-only advisories from Aug–Oct 2026. | github/advisory-database, 11 Oct 2026 [primary data] |
| CVE mappings (brief §7) | **Mostly confirmed; one correction** | CVE-2025-59536 (commands run before the trust dialog, 3 Oct 2025) and CVE-2026-21852 (data leak via environment configuration before trust confirmation, 21 Jan 2026) are **Claude Code**: confirmed. CVE-2025-53773 is a **Copilot/Visual Studio** command injection (12 Aug 2025), confirmed, but its vector `AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H` scores **CVSS 7.8, not 9.6**. Cursor's CVE-2025-54135 and CVE-2026-22708 were not found in the months I checked. | advisory-database [primary data] |
| Google scaling paper effect sizes (brief §7) | **Confirmed** | Independent agents amplify errors **17.2×** versus **4.4×** with centralized coordination. Every multi-agent variant degraded sequential reasoning by **39–70%**. Returns turn diminishing or negative once a single agent already scores about **45%**. Centralized coordination added +80.8% on parallelizable financial reasoning (v1 says 80.9%). The architecture predictor is right 87% of the time. | arXiv 2512.08296 v1/v2 [via search summary] |
| MAST "14 failure modes, κ≈0.88" | **Partly confirmed** | 14 modes in 3 categories (5 specification, 6 inter-agent misalignment, 3 verification/termination), from the repo's `definitions.txt`. The dataset has more than 1K annotated traces. **κ = 0.88 is not re-verified.** | MAST repo [primary] |
| DGM 20%→50% (SWE-bench), 14.2%→30.7% (Polyglot) | **Partly confirmed** | Starting points are confirmed from the repo's metadata: **12/60 = 20.0%** on a SWE-bench subset and **32/225 = 14.2%** on Polyglot. The end points are not re-verified. | jennyzzt/dgm [primary data] |
| SICA 17%→53% | **Still unverified** | The README does not state numbers; the result was on a SWE-bench Verified subset. | SICA repo |
| "Canaries": −16%; developers aged 22–25 about 20% below peak (§3.4) | **Updated** | The **Aug 2026 revision** uses ADP data through Jun 2026. Workers aged 22–25 in AI-exposed jobs are **about 19% below** their counterfactual and the gap is still widening. It works through reduced hiring, and there is no economy-wide displacement. I did not get a software-developer-specific 2026 figure. | Stanford Digital Economy Lab PDF and post, 12 Aug 2026 [via search summary] |
| Narayanan & Kapoor WARN data (Jun 2026) | **Confirmed** | New York added an AI checkbox to WARN layoff filings in Mar 2025. In the first full year, **160+ companies filed and none ticked it** (Hunton analysis). | normaltech.ai, 14 Jun 2026 [via Willison] |
| "RCTs barely cover agentic tools" (§3.10) | **Confirmed** | I found no 2026 RCT of Claude Code, Codex or Cursor. The best new causal evidence is quasi-experimental: the Microsoft study in §2. | [via search summary] |

## 2. New findings that fill gaps

**Productivity and telemetry, 2026**
- **Microsoft CLI-agent rollout** (Murphy-Hill, Butler, Savelieva; arXiv 2607.01418; 1 Jul 2026).
  - *Setup:* observational study of Microsoft's early-2026 rollout of Claude Code and GitHub Copilot CLI.
  - *Result:* adopters merged **about 24% more PRs** than the counterfactual, and the lift held across 4 months (Feb–Apr). Secondary write-ups add a 95% CI of +14.5% to +33.7% and a synthetic-control design.
  - *Diffusion:* first use spread through social networks rather than the org chart.
  - *Caveats:* merged PRs are a proxy, not value; the study is vendor-run (Microsoft owns GitHub). A per-tool split (Copilot CLI +24.9%, Claude Code +11.4%) appears only in one blog and is unverified.
- **Vella & Blincoe** (arXiv 2605.23135; May 2026). Two survey waves six months apart: n=158 and 101, with a matched cohort of 95. 82% report spending less time writing code, and the authors coin "supervisory engineering work". All self-reported.
- **JetBrains/UC Irvine, "Evolving with AI"** (arXiv 2601.10258; ICSE 2026). Two years of telemetry from 800 developers plus a survey of 62. AI users write substantially more code but also **delete significantly more**.
- **Itaú Unibanco case study** (arXiv 2605.18461, "One Developer Is All You Need"). One veteran developer, with agents in four roles, delivered an 18-week, four-person scope in about 9 weeks. The gain came from **less waiting between stages**, not faster coding. Single case, and it assumes deep codebase knowledge (secondary summary).
- **Berkeley Haas** (Ranganathan & Ye, HBR, Feb 2026). 200 employees followed Apr–Dec 2025. AI **intensifies** work: parallel threads, constant checking, more open tasks. Qualitative.
- **LeadDev AI Impact Report 2026** (591 engineering leaders). 26% report major gains, only 31% measure them, and **62% expect to hire fewer juniors**.

**Agent PRs**
- **arXiv 2601.18749** (Yoshioka et al.; 26 Jan 2026). 40,214 agent PRs from AIDev plus 6,618 human PRs, with 64 features. Who submits the PR dominates merge outcomes. More reviewer comments **raise merge odds for human PRs but lower them for agent PRs**.

**Security**
- **Anthropic auto-mode evaluations** (7 Aug 2026; vendor-run or vendor-commissioned; claude.com, fetched).
  - *Human vs classifier:* in a study of 1,053 paid testers, one prompt per session was swapped for a dangerous command. Humans caught 13.6% (143/1,053); auto mode would have blocked 89% (937). Auto mode blocked 800 that humans approved, while humans blocked only 6 that auto mode allowed.
  - *Prompt injection (Trajectory Labs):* 72 held-out indirect-injection scenarios × 10 runs. **0/720 attempts succeeded** against Fable 5, Opus 5 and Sonnet 5 in auto mode. GPT-5.6 Sol in Codex succumbed to 5.83% (auto-review) and 19.03% (full access).
  - *Red-teaming (Apollo):* the classifier's miss rate fell from 12% to 7% on synthetic attacks.
  - *Independent counterpoint:* on 27 Aug, Rehberger reported an attack on Opus 5 auto mode that works about 80% of the time. A downloaded zip plants a `struct.py` that shadows a standard-library module; this is a "confused environment" attack rather than classic injection. In some runs auto mode **blocked Claude's attempt to clean up** afterwards. [via Willison]
- **Agent Data Injection** (Choi et al.; arXiv 2607.05120; 6 Jul 2026). Forged metadata and tool responses succeed 31.3–43.3% of the time on JSON data and 33.3–100% on web DOM data, across 6 models. Defenses built for instruction injection mostly fail. Remote code execution via a spoofed maintainer identity in a GitHub issue comment was confirmed on Claude Code, Codex and Gemini CLI.
- **"Prompt injection as role confusion"** (Ye, Cui, Hadfield-Menell; Jun 2026). Models judge text's role by its *style*. Rewriting attacks so they no longer mimic the role format cut attack success from 61% to 10%. [via Willison]
- **Execution-security survey** (Rashidi; arXiv 2607.05743; 7 Jul 2026). Reviews 39 papers from 2023–2026 in 17 categories: sandboxing, access control, TOCTOU, MCP. The work is siloed, confirms 4 patched CVEs, and identifies 5 cross-cutting gaps.
- **Advisory counts** (GitHub Advisory Database, 11 Oct 2026; primary).
  - Codex CLI: 2, including CVE-2025-61260 (Critical, malicious MCP config).
  - Copilot CLI: 2 (High).
  - Gemini CLI: 1 (Critical, CVE-2026-12537, trust and allowlist bypass).
  - Cline: 3, including an unauthorized npm publish of cline@2.3.0 (Feb 2026) and two cross-origin WebSocket hijacks, one Critical.
  - The personal agent **OpenClaw: 772 advisories across its packages (759 on `openclaw` itself) in 8 months**, Feb–Oct 2026, 335 of them published in March; 458 carry CVE IDs.
- **IOActive (2026).** 27 models and tools, 730 prompts: average security score 59%, and **31.6% of samples were fully exploitable**.

**Workflows, context and skills**
- **Tests.** In Chen et al. (arXiv 2602.07900), changing how many tests agents write had no significant effect on resolution. TDFlow (EACL 2026) reaches 88.8% on SWE-bench Lite and 94.3% on Verified *given human-written tests*. Its authors call writing reproduction tests "the primary obstacle". Implication: **the value lies in tests a human owns, not in telling the agent to write tests first.**
- **Spec-driven development.**
  - arXiv 2609.00252 proposes five human–agent interaction patterns and calls for empirical validation.
  - arXiv 2602.00180 (AIWare 2026) distinguishes spec-first, spec-anchored and spec-as-source.
  - SPECMINE (2608.25202) counts 470,795 spec files across 73,030 repos.
  - None measures outcomes.
- **Multi-agent vs single.** In arXiv 2511.00872 (Nov 2025), multi-agent setups took more steps and produced more complete software, but single agents produced more *executable* code. arXiv 2511.04064 warns that tool differences confound such comparisons.
- **File-native context** (McMillan; arXiv 2602.05447; Feb 2026). 9,649 experiments across 11 models, using SQL schemas of up to 10,000 tables. The model mattered most. Frontier models benefited from filesystem retrieval; open models less so. An unfamiliar compact format (TOON) cost **+138% tokens at 500 tables and +740% at 10,000** (a "grep tax"). [via Willison]

**Labor**
- **Thoughtworks retreat** (Feb 2026, qualitative). Juniors are "more profitable than they have ever been"; the at-risk group is mid-level engineers. [via Willison]
- Narayanan & Kapoor argue the real bottlenecks are deciding and specifying what to build, verifying and taking accountability, and deep understanding of the context. [via Willison]

## 3. Suggested edits

1. **§3.8, line 358.**
   - **Old:** "**METR time horizons:** **doubling every ~131 days since 2023, and ~89 days since 2024** (TH1.1, Jan 2026). Opus 4.5 sits at ~320 minutes. METR now warns that frontier measurements are not robust."
   - **New:** "**METR time horizons (TH1.1):** for frontier models released since 2023, the 50% horizon has doubled about every **129 days** (95% CI 104–158). The fastest stretch was Jan 2024–Feb 2025, at about 90 days. Measured 50% horizons:
     - Opus 4.5: **4.9 h** (293 min)
     - GPT-5.3-Codex: 5.8 h
     - Opus 4.6: **~12 h** (95% CI 5–61 h)
     - Claude Mythos Preview: **≥16 h** (point estimate 17.4 h, CI 8.5–55 h; May 2026)

     80%-reliability horizons are far shorter: about 70 min for Opus 4.6 and 3.1 h for Mythos Preview. Only 5 of METR's 228 tasks last 16 h or more, so it cannot resolve longer horizons. Its GPT-5.6 Sol result is 'not robust', and it has published nothing for Opus 5/5.5 or Fable."
2. **§11.2 METR row, line 1551.**
   - **Old:** "There are no METR runs yet for Opus 5.5."
   - **New:** "METR's last published horizon is Claude Mythos Preview (≥16 h; point estimate 17.4 h). It has published none for Opus 4.8, Opus 5/5.5, Fable or Mythos 5.x. Horizons quoted for those models are extrapolations from capability indices (ECI/AECI), not measurements."
3. **§3.1 table.**
   - **Append to the METR follow-up row:** "No RCT has been published since. The data repo is unchanged since 24 Feb 2026, and METR has reportedly switched to surveys (n=349, Feb–Apr 2026)."
   - **Add a row:** "| Microsoft CLI-agent rollout, Jul 2026 (arXiv 2607.01418) | Observational, Claude Code + Copilot CLI adopters vs synthetic control | **~+24% merged PRs**, sustained over 4 months; vendor-run; PRs ≠ value |"
4. **§3.2, line 264.** Append to the Veracode bullet: "The **Jul 2026 update** shows no progress: a 56% security pass rate across 100+ models, 68% for the best (GPT-5.5), a 15% pass rate on XSS, and coding-specialized models no safer."
5. **§3.2, line 266.**
   - **Old:** "Brief 04 tallied **34 Claude Code security advisories in 16 months**"
   - **New:** "Brief 04 counted 34 advisories on Claude Code's GitHub security page (Jun 2025–Oct 2026). The GitHub Advisory Database has **28 reviewed advisories through Jul 2026**, 27 with CVEs and 22 rated High. OpenClaw (a personal agent) collected 772 advisories in 8 months."
   - **Add a bullet:** "**Classifier gating helps but isn't containment.** In Anthropic's commissioned evaluation, 0 of 720 injection attempts succeeded against Claude 5-series models in auto mode, versus 5.83% for GPT-5.6 Sol in Codex's auto-review mode. In a 1,053-developer study, humans caught 13.6% of dangerous commands against 89% for auto mode. Three weeks later, Rehberger reported a bypass that works about 80% of the time."
6. **§3.4, line 306.** Replace the first sentence with: "Stanford's 'Canaries' (ADP payroll data; Aug 2026 revision, data through Jun 2026) finds workers aged 22–25 in AI-exposed occupations **about 19% below** their counterfactual, with the gap still widening. The adjustment comes through reduced hiring, and there is no economy-wide displacement. The Nov 2025 version reported −16%, with software developers aged 22–25 about 20% below their late-2022 peak. Counterpoint: New York's AI box on WARN layoff notices drew **0 ticks from 160+ filers** in its first year."
7. **§3.5, lines 319–323.** Replace with:
   - "Curated skills: **+16.2 pp on average, but only ~+4.5 pp in software engineering**; 16 of 84 tasks got worse; self-generated skills ≈0 (SkillsBench)."
   - "91.8% of 138,133 public SKILL.md files have a defect. The most common is missing trigger guidance (52%)."
   - Drop "Public SWE skills: averaged +1.2%" and "A relevant skill doesn't reliably help" unless a source is found.
8. **§3.7, line 339.** Append: "Independent agents amplify errors **17.2×** (4.4× with a central orchestrator). Every multi-agent variant cut sequential-task performance by **39–70%**. Coordination stops paying once a single agent already scores about **45%**."
   - **Line 340:** "MAST (Berkeley, 1k+ traces)" → "MAST (14 failure modes, 1k+ traces)".
9. **§3.9, lines 371–373.**
   - "Secondary reports say Claude Code leads among agent users" → "Agents of choice: Claude Code 66%, Copilot 59% (30,000+ responses)."
   - Pragmatic Engineer: "most-used, and most-loved (46% vs Cursor 19%, Copilot 9%)".
   - JetBrains: remove "(secondary)" and add "(15,000+ developers; up from 18% in Jan 2026; 90% use agents weekly)".
10. **§3.10, lines 392–393 (also line 2211).** Replace with:
    - "**Spec-driven development and plan mode:** still no controlled test of outcomes."
    - "**Tests:** one controlled ablation found that telling agents to write more tests doesn't change resolution. Human-written tests help a lot (TDFlow 94% on Verified). So the evidence favors *human-owned* acceptance tests over 'TDD prompts'."
    - "**RCTs:** none of agentic tools in 2026. The best causal evidence is quasi-experimental and vendor-run."
11. **§4.3, line 612.** "(Jan 2026; numbers secondary)" → "(Jan 2026, FSE 2026 industry track; 22,126 tests; 41 candidate catches gave 8 true positives, 4 of them serious; assessors cut review load by 70%)".
12. **Brief 04.**
    - §2.13: "Opus 4.5 at **~320 min**; GPT-5 at ~214 min" → "293 min; 203 min".
    - §7: "CVE-2025-53773 (CVSS 9.6)" → "(CVSS 7.8, local, user interaction required)".
    - §7: "~17.4h horizon (Mar 2026)" → "(model released Apr 2026; METR published May 2026)".

## 4. Sources

- METR eval-analysis-public (TH1.1 runs, pipeline) — METR — 20 Jan–5 Mar 2026 — GitHub — https://github.com/METR/eval-analysis-public — my re-fit of runs.jsonl across 4 snapshots — [primary]
- METR TH1.1 results file (copy) — METR via joansam/metr-chart — committed ~Jun 2026; notes dated 4 Oct 2026 — GitHub — https://github.com/joansam/metr-chart — `benchmark_results_1_1 (5).yaml` and `analysis/NOTES.md`; matches my re-fit — [secondary copy of primary]
- GPT-5.6 Sol evaluation — METR — 26 Jun 2026 — https://metr.org/blog/2026-06-26-gpt-5-6-sol/ — [via search summary]
- Estimating time horizons for Opus 4.6 and GPT-5.3-Codex — LessWrong — Feb 2026 — https://www.lesswrong.com/posts/WacuyurbABwNv8ziq/estimating-metr-time-horizons-for-claude-opus-4-6-and-gpt-5 — the 14.5 h to 12 h revision — [via search summary]
- METR (Wikipedia table) — https://en.wikipedia.org/wiki/METR — [via search summary]
- Time Horizon 1.1 chart — METR — https://metr.org/horizon-chart-embed — labelled "Current" — [via search summary]
- METR time horizons v1.1 table (DataLearner) — https://www.datalearner.com/en/benchmarks/metr-time-horizons-v1-1 — Mythos 1,044.78 min — [via search summary]
- Measuring-Late-2025-AI-on-OSS-Devs — METR — last commit 24 Feb 2026 — https://github.com/METR/Measuring-Late-2025-AI-on-OSS-Devs — [primary]
- METR's developer productivity research: 2026 update — R. Bowley — 4 Apr 2026 — https://blog.robbowley.net/2026/04/04/metrs-developer-productivity-research-2026-update/ — survey of 349 — [via search summary]
- MirrorCode — Epoch AI/METR — Jun 2026 — https://arxiv.org/pdf/2606.30182 ; https://epoch.ai/blog/mirrorcode ; https://epochai.substack.com/p/the-epoch-brief-june-26-2026 ; https://jack-clark.net/2026/07/27/import-ai-466-the-bitter-lesson-for-robotics-ais-complete-week-long-programming-tasks/ ; repo https://github.com/METR/MirrorCode — [via search summary; repo primary]
- Claude Opus 5.5 — Anthropic — 22 Sep 2026 — https://www.anthropic.com/claude-opus-5-5 — METR named only as pre-release evaluator — [primary, fetched]
- Auto mode as the default in Claude Code — Anthropic — 7 Aug 2026 — https://claude.com/blog/auto-mode-default-in-claude-code — 1,053-tester study; Trajectory Labs; Apollo — [primary, fetched; vendor]
- Auto mode default / Breaking Claude Code Opus 5 Auto Mode — Willison; Rehberger — 8 and 27 Aug 2026 — https://simonwillison.net/2026/Aug/8/auto-mode/ ; https://simonwillison.net/2026/Aug/27/breaking-claude-code-opus-5-auto-mode/ (links https://embracethered.com/blog/posts/2026/breaking-claude-code-opus-5-and-automode/) — [via Willison]
- Prompt Injection as Role Confusion — Ye, Cui, Hadfield-Menell — Jun 2026 — https://simonwillison.net/2026/Jun/22/prompt-injection-as-role-confusion/ (links https://role-confusion.github.io) — [via Willison]
- GitHub Advisory Database — GitHub — snapshot 11 Oct 2026 — https://github.com/github/advisory-database — my counts of reviewed and unreviewed entries — [primary]
- Agent Data Injection Attacks are Realistic Threats — Choi et al. — 6 Jul 2026 — https://arxiv.org/pdf/2607.05120 — [via search summary]
- The Balkanization of Execution-Security Research — Rashidi — 7 Jul 2026 — https://arxiv.org/pdf/2607.05743 — [via search summary]
- The Range Shrinks, the Threat Remains — Churilov — May 2026 — https://arxiv.org/pdf/2605.17062 — [via search summary]
- Just-in-Time Catching Test Generation at Meta — Meta — 30 Jan 2026 — https://arxiv.org/abs/2601.22832v1 — [via search summary]; digest https://raw.githubusercontent.com/FlorianBruniaux/claude-code-ultimate-guide/main/docs/resource-evaluations/2026-03-22-harman-jittesting-meta-arxiv.md — [secondary]
- The Shift to Agentic AI: Evidence from Codex — Johnston et al. — 25 Jun 2026 — https://arxiv.org/pdf/2606.26959 ; https://ideas.repec.org/p/arx/papers/2606.26959.html ; https://thenextweb.com/news/openai-codex-agents-shift-employees-non-developers — [via search summary; OpenAI data]
- Adoption and Impact of Command-Line AI Coding Agents — Murphy-Hill, Butler, Savelieva (Microsoft) — 1 Jul 2026 — https://arxiv.org/abs/2607.01418 ; https://ecorpit.com/microsoft-claude-code-copilot-cli-productivity-study-2026/ — [via search summary]
- The Impact of AI Coding Assistants on SE: A Longitudinal Study — Vella & Blincoe — May 2026 — https://arxiv.org/pdf/2605.23135 — [via search summary]
- Evolving with AI: A Longitudinal Analysis of Developer Logs — JetBrains and UC Irvine — ICSE 2026 — https://arxiv.org/html/2601.10258v1 — [via search summary]
- One Developer Is All You Need — 2026 — https://arxiv.org/pdf/2605.18461 — details via lilting.ch — [via search summary, secondary]
- Let's Make Every Pull Request Meaningful — Yoshioka et al. — 26 Jan 2026 — https://arxiv.org/abs/2601.18749v1 — [via search summary]
- Vibe Coding: Practice, Performance, Productivity, and Risk — Aug 2026 — https://arxiv.org/pdf/2608.20446 — title only — [via search summary]
- SkillsBench — Feb 2026 — https://arxiv.org/html/2602.12670v1 — [via search summary]
- What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files — Ji et al. — Aug 2026 — https://arxiv.org/pdf/2608.08453 ; related https://arxiv.org/pdf/2607.01456 ; https://arxiv.org/abs/2607.09065 — [via search summary]
- Rethinking the Value of Agent-Generated Tests — Chen et al. — Feb 2026 — https://arxiv.org/pdf/2602.07900 ; TDFlow https://arxiv.org/pdf/2510.23761 — [via search summary]
- Spec-driven development papers — https://arxiv.org/pdf/2609.00252 ; https://arxiv.org/abs/2602.00180v1 ; https://www.alphaxiv.org/abs/2608.25202 ; https://arxiv.org/pdf/2606.04967 — [via search summary]
- Agent-framework comparisons — https://arxiv.org/pdf/2511.00872 ; https://arxiv.org/pdf/2511.04064 — [via search summary]
- Towards a Science of Scaling Agent Systems — Google Research, DeepMind, MIT — Dec 2025 — https://arxiv.org/pdf/2512.08296 ; https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/ — [via search summary]
- MAST repo — Berkeley — https://github.com/multi-agent-systems-failure-taxonomy/MAST — [primary]; DGM https://github.com/jennyzzt/dgm — [primary data]; SICA https://github.com/MaximeRobeyns/self_improving_coding_agent — [primary]
- Structured Context Engineering for File-Native Agentic Systems — McMillan — Feb 2026 — https://arxiv.org/abs/2602.05447 via https://simonwillison.net/2026/Feb/9/structured-context-engineering-for-file-native-agentic-systems/ — [via Willison]
- Stack Overflow 2026 survey — 6 Oct 2026 — https://stackoverflow.blog/2026/10/06/the-results-of-the-2026-developer-survey-are-here/ ; https://itbrief.co.uk/story/stack-overflow-survey-shows-developers-trust-ai-with-caveats — [via search summary]
- AI tooling 2026 — Pragmatic Engineer — Mar 2026 — https://newsletter.pragmaticengineer.com/p/ai-tooling-2026 — [via search summary]
- AI coding agent adoption 2026 — JetBrains Research — 18 Aug 2026 — https://blog.jetbrains.com/research/2026/08/ai-coding-agent-adoption-2026/ ; https://adtmag.com/articles/jetbrains-survey-finds-ai-coding-agents-becoming-routine-developer-tools.aspx — [via search summary]
- DORA survey page — https://dora.dev/survey/ — [via search summary]
- DX AI Impact Report Q1 2026 — https://getdx.com/blog/ai-impact-report-q1-2026/ — [via search summary]
- The AI Impact Report 2026 — LeadDev — https://leaddev.com/the-ai-impact-report-2026/ — [via search summary]
- The Maintainability Gap — GitClear — 2026 — https://gitclear.com/the_ai_code_quality_maintainability_gap ; https://leaddev.com/ai/code-maintainability-plummets-in-the-ai-coding-era — [via search summary]
- 2026 GenAI Code Security Report — Veracode — 28 Jul 2026 — https://www.veracode.com/blog/2026-genai-code-security-report-ai-risk ; https://sdtimes.com/agentic-security/veracode-finds-ai-generated-code-security-has-barely-improved-since-last-year/ — [via search summary; vendor]
- The Security Gap in AI-Generated Code — IOActive — 2026 — https://www.ioactive.com/the-security-gap-in-ai-generated-code/ — [via search summary; vendor]
- Canaries in the Coal Mine (Aug 2026 revision) — Brynjolfsson, Chandar, Chen — 12 Aug 2026 — https://digitaleconomy.stanford.edu/app/uploads/2026/08/Canaries_August2026.pdf ; https://digitaleconomy.stanford.edu/news/canariesaug26/ — [via search summary]
- Why AI hasn't replaced software engineers — Narayanan & Kapoor — 14 Jun 2026 — https://www.normaltech.ai/p/why-ai-hasnt-replaced-software-engineers via https://simonwillison.net/2026/Jun/14/why-ai-hasnt-replaced-software-engineers/ — [via Willison]
- Thoughtworks retreat takeaways — Feb 2026 — https://simonwillison.net/2026/Feb/14/thoughtworks/ — [via Willison]
- AI Doesn't Reduce Work—It Intensifies It — Ranganathan & Ye — Feb 2026 — https://simonwillison.net/2026/Feb/9/ai-intensifies-work/ (links https://hbr.org/2026/02/ai-doesnt-reduce-work-it-intensifies-it) — [via Willison]

## 5. Still unknown

- **Official METR TH1.1 launch-post figures.** I could not see the original Opus 4.5 or GPT-5 numbers or the exact wording of the 89-day claim, because metr.org is blocked. The "320 min" figure may come from a chart or bootstrap median rather than the point estimate.
- **"Time Horizon 2.0".** There is no sign that it exists.
- **METR on the newest models.** Whether METR will measure Opus 5/5.5 or Fable at all. Its 349-person survey results are also unknown.
- **Skills studies.** The sources for "49 public SWE skills, +1.2%" and for arXiv 2610.08875.
- **Unread arXiv items.** Contents of 2608.20446 (beyond its title) and 2604.16399 (IACDM, not searched for lack of budget); arXiv 2607.24606 was not found at all.
- **Remaining paper details.**
  - κ=0.88 for MAST.
  - The end points for DGM (50.0% and 30.7%).
  - The SICA figures.
  - Per-tool split and design details of the Microsoft study.
  - The Codex paper's ">10% run 3+ agents" and "26.6% use skills" figures.
- **Surveys.**
  - Stack Overflow 2026: the source of the 16,664 count, and the official total.
  - Pragmatic Engineer: exact most-used percentages.
  - DORA: whether a 2026 report exists, and the DORA ROI report.
  - DX: the "~30% of merged code" figure.
  - Faros 2026, Atlassian DevEx 2025/2026, Jellyfish and LinearB 2026 figures.
- **Quality and security.**
  - 2026 updates from CodeRabbit and Sonar.
  - Cursor's CVE-2025-54135 and CVE-2026-22708 mappings.
  - The 6 Claude Code advisories that appear on the repository's security page but not in the GitHub Advisory Database.
- **Labor.** A software-developer-specific figure from the Aug 2026 "Canaries" revision, and the reported UChicago/Cursor working paper.
- **Plan mode.** No controlled evaluation located (no dedicated search was run).
