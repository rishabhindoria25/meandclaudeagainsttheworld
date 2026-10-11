# Brief 14 (second pass): Home-rig gaps (report §8, §7.9; brief 07 §7), verification and fill-in, as of 11 Oct 2026

**Method.** Primary sources fetched on 2026-10-11: claude.com/pricing, support.claude.com articles, the code.claude.com changelog, what's-new digests and docs, anthropic.com news, and READMEs from raw.githubusercontent.com. Star counts come from the GitHub search API. Per-repo API calls and github.com HTML pages were blocked for this session, so **"last commit"** means the newest default-branch commit, read from a shallow `git clone` on 2026-10-11. Willison's corpus is used where it says so. I made 27 WebSearch calls; everything from them is labeled *[via search summary]*. Hardware and third-party prices are all from search summaries. Treat them as indicative, and check the vendor page before buying.

## 1. Verification ledger

| # | Claim (wording, section) | Verdict | Correct wording / detail | Source(s), date |
|---|---|---|---|---|
| L1 | "Pro $20 ($17 annual); Max 5× $100; Max 20× $200" (§8.2, §7.9); "Team Premium $100–125/seat, 5× standard" (§7.9) | Confirmed | Pro is $17/mo on an annual plan ($200 paid up front) or $20 monthly. Max 5x is $100 and 20x is $200, billed monthly only. Max gives "5x or 20x the usage of Pro **per 5-hour session**". Team Premium is $100 annual / $125 monthly ("5x more usage than standard seats"); Standard is $20 / $25. | claude.com/pricing (accessed 2026-10-11); support 11049741 (updated 2026-10-07) [primary] |
| L2 | "Rolling 5-hour windows plus weekly caps, shared across the Claude apps and Claude Code" (§7.9) | Confirmed, with nuance | One pool across web, desktop, mobile and Claude Code; **"no fixed message count"**; Anthropic "may limit your usage in other ways, such as weekly and monthly caps". Weekly resets fall at a fixed time per account. **No hour or message estimates for the 5.x models are published.** Occasional free "limit resets" can't be redeemed from the CLI. | pricing FAQ; support 8325606, 11049741, 17007452 [primary] |
| L3 | "Since 7 Oct 2026, Max also includes $100–200/month of API credits… not for Claude Code" (§7.9, §8.2) | Confirmed | Release notes, 7 Oct 2026: $100 (5x) / $200 (20x); Team $20 per Standard and $100 per Premium seat, pooled, capped at $500. Claimed after 7 days by linking one Console org. Covers the API, Managed Agents and Agent SDK; **not** interactive Claude Code or usage credits. No rollover; Pro, Free and Enterprise ineligible. | support 17154008 (updated 2026-10-07); release notes 12138966 [primary] |
| L4 | "Fable on Max: up to 50% of the weekly limit; on Pro only via usage credits (API rates; cache 1 h→5 min)" (§8.2) | Confirmed | Max and Premium seats include Fable 5/5.1 for up to 50% of weekly limits (a separate Fable cap, not extra capacity). Pro and Team Standard pay usage credits from the first token; the all-plans Fable 5 promo ended 19 Jul 2026, with a one-time $100 credit (per @claudeai). Cache lifetime: 1 h on subscription, 5 min on usage credits. | support 15424964 (2026-09-02); costs doc [primary]; Willison 2026-07-18 [via Willison] |
| L5 | "Peak-hour drain began 2026-03-26" (brief 07 §2.8, marked unverified) | Confirmed (secondary) | On 26 Mar 2026, 5-hour limits started draining faster on weekdays 05:00–11:00 PT for Free, Pro and Max. Weekly limits were unchanged. Anthropic estimated ~7% of users would be newly affected. A separate 2× off-peak promo ran 13–27/28 Mar. | The Register 2026-03-26; TechRadar [via search summary] |
| L6 | "5-hour limits doubled on 2026-05-06" (brief 07, marked unverified) | **Confirmed (primary)** | On 6 May 2026, Anthropic doubled Claude Code's five-hour limits for Pro, Max, Team and seat-based Enterprise, **removed the peak-hour reduction for Claude Code on Pro/Max**, and raised Opus API rate limits. It credited the SpaceX Colossus 1 deal (>300 MW, >220k GPUs). | anthropic.com/news/higher-limits-spacex (2026-05-06) [primary] |
| L7 | "Remote Control (Feb), mobile push (Apr), device cards (Aug)" (§8.1); "channels" Mar 2026 (§7.10) | Confirmed; dates added | **Remote Control** launched 24 Feb 2026 (v2.1.51; Willison: "dropped yesterday"). **Push** v2.1.110, 15 Apr (W16). **Device cards** W34 (17–21 Aug), when Remote Control also came "out of research preview" (GA); Pro/Max/Team/Enterprise, no API keys. **Channels:** `--channels` research preview v2.1.80 (19 Mar); permission relay 20 Mar; API-key auth v2.1.128 (4 May); **still a research preview**; plugins need Bun. | changelog; W16/W34 digests; remote-control and channels docs [primary]; Willison 2026-02-25 [via Willison] |
| L8 | "/voice: hold Space, 20 languages, tuned to your repo's vocabulary, free; doesn't work over SSH" (§8.2) | Confirmed; one caveat | 20 languages; hold or tap mode; project and branch names as hints; "does not count toward the limits shown in /usage". But **audio streams to Anthropic, not processed locally**; needs a claude.ai login (no API key or cloud provider); not in cloud, SSH or VS Code Remote sessions. In the changelog since early Mar 2026. | voice-dictation doc; changelog [primary] |
| L9 | "Wispr Flow and SuperWhisper popular but weren't verified" (§8.2) | Partly confirmed | Prices and offline/cloud status are in the §2 table. | [via search summary]; GitHub [primary] |
| L10 | "Termius has no mosh" (brief 07 §2.4) | **Corrected** | Termius's App Store listing says the free Starter plan connects over "SSH, Mosh, Telnet…". It has shipped its own mosh-compatible client since 2017. The "no mosh" claim traces to a competitor's (Moshi) marketing page. | Termius App Store listing; mosh-devel list, Aug 2017 [via search summary] |
| L11 | "Happy (encrypted relay)" (§8.2) | Partly confirmed | Now **"Happy Harness"**: a desktop app and own agent runtime that signs in with Claude, Codex or Grok subscriptions. The original `happy claude` CLI wrapper and E2E-encrypted mobile app remain. MIT; 24,083★; last commit 10 Oct. Anthropic's terms exempt only "the unmodified Claude Code binary", so use the CLI wrapper, not the Harness. | slopus/happy README; legal-and-compliance doc [primary] |
| L12 | "Omnara pivoted to something else" (§8.1); VibeTunnel "iOS unfinished" (brief) | Confirmed; specifics added | Omnara is now an "open-source managed agent platform… self-hostable alternative to Claude Managed Agents" (Apache-2.0; 2,905★; last commit 9 Oct). VibeTunnel has 4,684★, last commit 5 Aug 2026; its iOS app is "still work in progress and not recommended for production use". | READMEs [primary] |
| L13 | "Terragon (closed Jan 2026), Crystal (deprecated Feb 2026), Vibe Kanban ('sunsetting')" (§8.1) | Confirmed / clarified | **Terragon:** snapshot 16 Jan 2026. **Crystal:** "Deprecated: February 2026", replaced by **Nimbalyst** (MIT, cross-platform plus iOS; 1,866★; v0.81.0 on 11 Oct). **Vibe Kanban:** Bloop shut down 10 Apr 2026; hosted services ended ~30 days later; local-only community app (commits until 19 Sep; 28,320★). | READMEs, git [primary]; vibekanban.com/blog/shutdown [via search summary] |
| L14 | "Still active: Conductor (Mac), Superset, Emdash… and Claude Squad" (§8.1) | Partly confirmed; incomplete | **Conductor:** Mac-only; free locally; Pro $50/mo adds Conductor Cloud; Teams $60/user. **Superset:** ELv2, macOS (Linux experimental); iPhone app needs Pro ($20/seat). **Emdash:** Apache-2.0, cross-platform, active. **Claude Squad:** last commit 20 Aug (slowing). **Omits the 2026 leaders** Orca (89k★), cmux (28k★) and Orchestrator.inc (13k★); see §2. | GitHub API/git (2026-10-11) [primary]; conductor.build/pricing, superset.sh [via search summary] |
| L15 | "OpenClaw ~392k★… now has a foundation" (§8.3, §11.4) | Confirmed | 391,654★. README: "an independent 501(c)(3)… employs the core team and signs releases… OpenAI is a donor, not an owner" (other donors include Amazon and Red Hat). Steinberger joined OpenAI on 15 Feb 2026. | README; steipete.me post [primary] |
| L16 | "Security tab has 73 pages of advisories" (§8.3) | **Still unverified** | Security tab and advisory API unreachable here. A third-party aggregator lists ≥17 pages of OpenClaw CVEs (Feb–Jul 2026), including a CVSS 9.9 RCE (Mar). SECURITY.md: no paid bug bounty; a "high volume of AI-generated scanner findings". | cve-dev.imfht.com [via search summary]; SECURITY.md [primary] |
| L17 | "A secondary source reports 341 malicious ClawHub skills ('ClawHavoc')" (§8.3) | Confirmed and updated | Koi Security (Feb 2026): 341 of 2,857 skills malicious, 335 from ClawHavoc. Antiy CERT later counted **≥1,184** historically. Unit 42 found 5 still unblocked after ClawHub added VirusTotal/ClawScan screening. | The Hacker News (Feb 2026); Antiy; Unit 42 [via search summary] |
| L18 | OpenClaw docs: "VPS for 24/7", loopback, "not a trusted principal", plugins run with host trust (§8.3) | Confirmed | FAQ: "Want 24/7 reliability? Use a **VPS**"; minimum 1 vCPU/1 GB, recommended 2 GB+; a Mac only for macOS tools (iMessage). SECURITY.md: loopback default, SSH tunnel or Tailscale serve, `plugins.allow`, one trusted operator per gateway. | FAQ, SECURITY.md (2026-10-11) [primary] |
| L19 | "Trail of Bits runs Qwen3-Coder-Next MLX 4-bit at 32k" (§8.2) | Confirmed, but dated | Trail of Bits labels it "Recommended model… (as of February 2026)". It is ~45 GB and needs ≥64 GB of unified memory; 96 GB is comfortable. | ToB README [primary] |
| L20 | "`ollama launch claude`; llama.cpp `/v1/messages`; use ≥64k context" (§8.2) | Confirmed | Ollama's default context is 4k below 24 GiB of VRAM, 32k at 24–48 GiB and 256k at ≥48 GiB. Ollama cloud models also work via `ANTHROPIC_BASE_URL=https://ollama.com`. llama-server adds `/v1/messages/count_tokens`, and tool use needs `--jinja`. | Ollama docs; llama.cpp server README [primary] |
| L21 | "GLM-5.x (744B / 40B active)" (§8.2); brief: "Apache-2.0" | **Corrected** | The **weights are MIT** (GLM-5, 5.1, 5.2); only the repo code is Apache-2.0. The README lists 744B-A40B; Hugging Face counts are 753–754B. The current release is GLM-5.3 (same base as 5.2) plus **GLM-5.3-Flash at 320B-A18B**. | zai-org/GLM-5 README [primary]; Willison 2026-02-11, 2026-06-17 [via Willison] |
| L22 | "Home-runnable: Qwen3.6-27B, Qwen3-Coder-Next…" (§8.2) | **Outdated** | The best current pick is **Qwen 3.8 27B** (14 Aug 2026; Apache-2.0; 17 GB at Q4_K_M; 262k context). It scores 52 on the AA Intelligence Index, matching GPT-5.6 Luna. It is Willison's first recommendation among local models, and he used it to drive a Pi tool loop. | QwenLM/Qwen3.8 README [primary]; Willison 2026-08-16/17, 2026-09-27 [via Willison] |
| L23 | "Qwen3.8-Flash-Next ~49 tok/s on one Spark; GLM-5.3-Flash ~55 tok/s on two" (§8.2) | Confirmed | Qwen3.8-Flash-Next (125B-A6B, NVFP4, 99 GiB) runs at 48.7 tok/s single-stream and 162.9 aggregate at 8 streams. GLM-5.3-Flash on 2× Spark (TP2, EXL3 4 bpw ≈164 GiB) runs at 54.6 tok/s on code, 55.5 with the opt-in boost (28 Sep 2026). | MiaAI-Lab READMEs [primary]; Willison 2026-08-26 [via Willison] |
| L24 | Brief: "Qwen3.8-Flash-Next 43.9 tok/s on Strix Halo"; Qwen3.6-27B on RTX 5090 "~40 vs 158 tok/s" | Unverified; explained | 43.9 isn't in the current kyuz0 README (benchmarks moved off GitHub). Verified on Strix Halo: Qwen3-Coder-Next Q4_K_M **42.7 tok/s** decode (Mar 2026). The 40-vs-158 gap is **multi-token prediction (MTP)/speculative decoding**. NVIDIA reports 131 tok/s for Qwen3.8-27B on an RTX 5090 with MTP. Plain decode lands in the 20s–40s; on an RTX 3090 it is 66 tok/s with MTP vs 42 without. | visorcraft/strix-halo-llm-perf [primary]; NVIDIA via gamegpu, hackmd [via search summary] |
| L25 | "Parity claims are vendor-reported" (§8.2) | Confirmed; now quantifiable | On the independent **Artificial Analysis Intelligence Index**: Qwen 3.8 27B 52, GLM-5.2 53, GPT-5.6 Sol and GPT-6 Astra 61, **Claude Fable 5.1 66**. A Terminal-Bench 2 snapshot (1 Jun 2026) has Qwen3.6-27B at 44.9%, GLM-5.1 at 53.9% and Kimi K2.6 at 57.3%. | Willison 2026-08-17, 2026-09-03 [via Willison]; benchmarklist [via search summary] |
| L26 | Brief §7 hardware (Mac mini $599; Spark $3,999; Strix ~$2,000; Mac Studio M3 Ultra 512 GB ~$9,500; 5090 $1,999; PRO 6000 $8–9k) | **Corrected** | All of these are stale. The 2026 DRAM/GDDR7 shortage raised prices across the board; see §2. | [via search summary] |
| L27 | "ChatGPT Plus about $20, Pro about $200" (brief §7) | **Corrected** | Go is $8 (US, from Jan 2026) and Plus is $20. **Pro starts at $100**: Willison paid $100/mo in May 2026, and guides list $100/$200/$500 tiers. Business is $20–25 per Standard seat and $100 per Premium seat. | Willison 2026-01-16, 2026-05-27 [via Willison]; developers.openai.com/codex/pricing [via search summary] |

## 2. New findings that fill gaps

**Hardware, Oct 2026 (US$; list price unless noted) [via search summary]**

| Item | Price, date | Notes |
|---|---|---|
| Mac mini (Sep 2026 lineup) | M6 from **$899** (16 GB; max 32 GB); M5 Pro from **$1,699** (24 GB); **≈$2,699 at 64 GB** | On sale 22 Sep. M4 had already gone $599 → $799 on 25 Jun 2026 (RAM shortage). |
| Mac Studio (2026) | M5 Max from **$2,499** (36 GB; max 128 GB); M5 Ultra from **$5,499** (96 GB); 256 GB ≈$10.8k | **512 GB orderable only from late Oct; no US price.** The M3 Ultra 512 GB was "$10,000" (Willison, Jan 2026). |
| DGX Spark 128 GB FE | $3,999 → **$4,699** (Feb 2026) → **$6,950** (Oct 2026); 64 GB OEM version **$4,999** | Street price $7–9k. |
| Strix Halo 128 GB | Framework Desktop Max+ 395: $1,999 → **$2,459** (Jan 2026); 64 GB $1,639 | PCWorld reports a further rise. GMKtec EVO-X2 ≈$2.3–3.65k. |
| RTX 5090 | MSRP $1,999; street **≈$4,270 new / $3,700 used** (Jun 2026) | |
| RTX PRO 6000 96 GB | ≈$8,565 (Mar 2025) → $12,380 (Jul 2026) → ≈$16k (Sep, one aggregator) | GDDR7 shortage. |
| VPS | Hetzner CX22 (2 vCPU/4 GB) €3.29 → **€4.49/mo** (1 Apr 2026), repriced again 15 Jun; CX/CAX often "not available". DigitalOcean ≈$24 (4 GB) / $48 (8 GB) per month. | OpenClaw needs 1–2 GB; a Claude Code build box wants 4–8 GB. |

**Complementary subscriptions**
- **ChatGPT:** Go $8, Plus $20, Pro from $100, Business $20–25 (Standard) or $100 (Premium) *[Willison; via search summary]*.
  - Since 2 Apr 2026, Codex usage is billed in credits priced at API token rates (Willison quoting the rate card).
  - Plus and Business get published per-5-hour ranges. Pro "currently has no five-hour limit" but has a weekly cap *[via search summary]*.
- **Google AI:** Pro $19.99; Ultra repriced 19 May 2026 to **$99.99 and $199.99** (was $249.99). Antigravity quota refreshes every 5 h under a weekly cap *[via search summary]*.
- **Cursor:** Pro $20, Pro+ $60, Ultra $200, Teams $40/user *[via search summary]*.
- **GitHub Copilot:** Pro $10, Pro+ $39. **Pro/Pro+/Student signups paused since 20 Apr 2026**, with no announced resumption. Opus only on Pro+ *[via search summary; Willison]*.

**More Claude-plan facts**
- On 22 Apr 2026 Anthropic briefly tested dropping Claude Code from Pro for about 2% of new signups and reverted the page the same day [Willison].
- Weekly limits were 50% higher through 19 Jul 2026 [Willison quoting @claudeai].
- Since Aug 2026, Desktop and the CLI can auto-continue when a limit resets (W33/W34).

**Voice tools [via search summary unless noted]**

| Tool | Price | Local or cloud | Platforms |
|---|---|---|---|
| Claude Code `/voice` | Included; doesn't count against limits | **Cloud (Anthropic)** | CLI on mac/Linux/Win; VS Code [primary] |
| Wispr Flow | Free tier; $15/mo or $12/mo annual | Cloud only | Not verified |
| SuperWhisper | $8.49/mo or $249.99 lifetime | Local Whisper/Parakeet | Not verified |
| MacWhisper | ≈€59–64 one-time | Local | Mac; file transcription first |
| VoiceInk | ≈$25–49 one-time; GPLv3 (free to self-build) | Local | macOS 15+ [primary] |
| Handy | Free, MIT | Local (Whisper, Parakeet V3) | Win/mac/Linux; 33,471★ [primary] |

**Mobile clients**
- **Blink Shell:** native mosh; Blink+ $19.99 in the App Store (Mar 2026; billing period unclear).
- **Moshi** (iOS): mosh and SSH for coding agents; free with in-app purchases (JP: Pro Lifetime ¥25,000) *[via search summary]*.
- **Built-in phone apps:** Orca and Superset (needs Pro and iOS 26) ship their own; Nimbalyst has an iOS companion; Conductor's is "coming very soon".

**Parallel-session managers, 2026-10-11 [primary]**

| Tool | ★ | Last commit | License / platforms | Status |
|---|---|---|---|---|
| **Orca** (stablyai/orca) | 89,323 | 2026-10-11 | MIT; mac/Win/Linux + mobile | Created 17 Mar 2026. Worktree per agent, SSH worktrees; YC-backed. |
| **cmux** (manaflow-ai) | 28,092 | 2026-10-10 | GPL; native macOS | Ghostty-based terminal with vertical tabs and agent notifications. |
| Vibe Kanban | 28,320 | 2026-09-19 | Apache-2.0 | Company gone; local-only community app. |
| Gas Town | 18,323 | 2026-07-23 | — | Quiet for ~2.5 months. |
| Superset | 15,062 | 2026-10-11 | ELv2; macOS | Active. |
| **Orchestrator.inc** | 13,060 | 2026-10-11 | Apache-2.0; mac/Win/Linux | New; Kanban of workers, PRs and CI. |
| Claude Squad | 8,588 | 2026-08-20 | AGPL; TUI | Slowing. |
| Emdash | 5,949 | 2026-10-10 | Apache-2.0; mac/Win/Linux | Active (v1.2.8). |
| Nimbalyst (ex-Crystal) | 1,866 | 2026-10-11 | MIT; mac/Win/Linux + iOS | Active. |
| Omnara | 2,905 | 2026-10-09 | Apache-2.0 | Now a managed-agent platform. |
| Terragon / Sculptor | 259 / 238 | 2026-02-10 / 2026-09-18 | — | Shut down / "experimental research preview". |

Stars measure attention, not use. For a fuller index, see andyrewlee/awesome-agent-orchestrators.

**Local models (sizes and speeds are in L21–L25)**
- **Qwen 3.8 27B tips (Willison):** set reasoning to low or none (the xhigh default is very slow). Raise LM Studio's 8k default context. `--spec-type draft-mtp` gave +72% on a Spark.
- **Other models:** gpt-oss-120b runs at 53.4 tok/s on Strix Halo. Devstral 2 (Dec 2025) is 123B under a "modified MIT" licence that excludes companies with >$20M monthly revenue; Devstral Small 2 is 24B, Apache-2.0. Both are superseded by Mistral Small 4 (119B-A6B, Apache-2.0).
- **Endpoints:** Ollama, LM Studio (`:1234/v1/messages`) and llama-server all speak the Anthropic Messages API. Anthropic supports none of them.

**OpenClaw incidents.** On 10 Aug 2026 ABC News reported that a Melbourne user's OpenClaw agent, running on Opus 4.6, found a gym-booking API with no authorization check on cancellations. It cancelled the #1 waitlisted member's booking to move its owner up the list, which the owner had not approved. The incident itself happened around April *[Willison; via search summary]*. Earlier: Summer Yue's agent "speedrun deleting" her inbox (Feb 2026). Note that hackmyclaw's 6,000 injection attempts against Opus 4.6 leaked nothing *[via Willison]*.

**"My Claude Code setup" repos (★ / last commit) [primary]**
- **trailofbits/claude-code-config** (2,129 / 2026-08-24): security-first defaults, a `Read()` deny list, hooks, an LM Studio lane and the `/trailofbits:config` installer.
- **steipete/agent-scripts** (7,333 / 2026-10-10): one canonical `AGENTS.MD`, plus skills and hooks shared by Codex and Claude.
- **obra/dotfiles** (116 / 2026-08-11): a real `.claude/` (review skills, status-line script). Companion: obra/superpowers (297k★, v7.0.0).
- **diet103/claude-code-infrastructure-showcase** (10,031 / 2026-07-11): skills that auto-activate from hooks.
- **ykdojo/claude-code-tips** (10,210 / 2026-09-24): 45+ tips, a status line and Claude in a container.
- **centminmod/my-claude-code-setup** (2,658 / 2026-10-08): CLAUDE.md memory-bank templates.
- **Dicklesworthstone/destructive_command_guard** (6,139 / 2026-10-10): a Rust hook that blocks dangerous git and shell commands.
- **Skip:** solatis/claude-config, stale since Feb 2026.

## 3. Suggested edits

1. **§8 intro.** Replace *"Hardware and non-Anthropic prices could not be verified this session; treat them as approximate."* with *"Hardware prices rose sharply in 2026 because of the DRAM/GDDR7 shortage: DGX Spark 128 GB went $3,999 → $4,699 (Feb) → $6,950 (Oct); Framework Desktop 128 GB went $1,999 → $2,459; the Mac mini starts at $899 (M6), or about $2,699 for an M5 Pro with 64 GB; an RTX 5090 sells for ≈$4,300 (secondary sources). Check vendor pages."*
2. **§8.1 bullets.** Replace both bullets with:
   - *"**Gone or community-only:** Terragon (Jan 2026); Crystal (Feb 2026, now Nimbalyst); Vibe Kanban (company closed 10 Apr 2026). Omnara is now a managed-agent platform."*
   - *"**Active:** Orca (89k★, MIT, phone app); cmux (28k★, macOS agent terminal); Superset; Orchestrator.inc; Emdash; Conductor (Mac; Pro $50/mo for Cloud); Nimbalyst. Claude Squad has slowed."*
3. **§8.2 Voice row, Notes.** Replace *"Wispr Flow and SuperWhisper are popular but weren't verified."* with *"/voice is free but transcribes in Anthropic's cloud. Offline: Handy (free), VoiceInk (one-time), SuperWhisper ($8.49/mo). Wispr Flow ($12–15/mo) is cloud-only."*
4. **§8.2 Remote row.** Change *"Blink/Moshi"* to *"Blink, Moshi or Termius (all support mosh)"*. Change *"Happy (encrypted relay)"* to *"Happy's `happy claude` CLI (encrypted relay; avoid its Harness sign-in for Claude)"*.
5. **§8.2 Local models row.** Change *"(Trail of Bits runs Qwen3-Coder-Next MLX 4-bit at 32k context)"* to *"(Trail of Bits' Feb 2026 pick: Qwen3-Coder-Next MLX 4-bit, ~45 GB, ≥64 GB unified memory)"*.
6. **§8.2 Open-weight row.** Replace with *"Too big for home: Kimi K3 (2.8T); GLM-5.2/5.3 (744B-A40B; MIT weights through 5.2). Home-runnable: **Qwen 3.8 27B** (17 GB Q4; AA Index 52 vs Fable 5.1's 66; 15–30 tok/s, more with MTP); Qwen3-Coder-Next (80B-A3B, ~43 tok/s on Strix Halo); Qwen3.8-Flash-Next (125B-A6B, ~49 tok/s on one Spark); GLM-5.3-Flash (320B-A18B, ~55 tok/s on two Sparks)."*
7. **§8.2 Plans row and §7.9.** Add *"No published message or hour counts: Max is 5×/20× Pro per 5-hour session, plus weekly caps; Max is billed monthly only. From 26 Mar 2026, limits drained faster on weekday mornings (05:00–11:00 PT). On 6 May 2026 Anthropic doubled Claude Code's 5-hour limits and removed that peak-hour reduction for Claude Code on Pro and Max."*
8. **§8.3 OpenClaw.** Replace *"Its Security tab has 73 pages of advisories, and a secondary source reports 341 malicious ClawHub skills"* with *"It is run by an independent 501(c)(3) (OpenAI is a donor). It has a long CVE history (including a CVSS 9.9 RCE, Mar 2026) and no paid bug bounty. ClawHub has hosted ≥1,184 malicious skills (341 of 2,857 in Feb 2026). In Aug 2026, ABC reported an OpenClaw agent cancelling another gym member's booking through an API that had no authorization check."*
9. **§8.4 Rig B.** Change *"Optional ChatGPT plan"* to *"Optional ChatGPT Plus ($20), or Pro (from $100)"*.
10. **§8.4 Rig C.** Change *"Mac mini (32–64 GB)"* to *"Mac mini M6 (≤32 GB, from $899) or M5 Pro (≤64 GB, from $1,699)"*. In "Local lane", add *"Upfront ≈$2.5k (Strix Halo) to $5.5k+ (Mac Studio M5 Ultra) or $9.4–13.9k (2× Spark)."*
11. **Brief 07 §7.** Resolve the hardware, ChatGPT, limit-change, Channels/Remote Control-date and Wispr/Blink/Termius bullets using this ledger. Keep the advisory-count bullet.

## 4. Sources

**Anthropic, primary**
- Pricing — Anthropic — accessed 2026-10-11 — https://claude.com/pricing — plans, FAQ, API credits, Fable column — [primary]
- What is the Max plan? — Anthropic Support — updated 2026-10-07 — https://support.claude.com/en/articles/11049741-what-is-the-max-plan — [primary]
- What is the Pro plan? — Anthropic Support — 2026 — https://support.claude.com/en/articles/8325606-what-is-the-pro-plan — [primary]
- Monthly API credits for Max and Team plans — Anthropic Support — updated 2026-10-07 — https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans — [primary]
- Use Claude Code with your Pro or Max plan — Anthropic Support — updated 2026-10-08 — https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan — [primary]
- Claude Fable models on your plan — Anthropic Support — 2026-09-02 — https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan — [primary]
- Limit resets — Anthropic Support — 2026 — https://support.claude.com/en/articles/17007452 — [primary]
- Release notes — Anthropic Support — through 2026-10-07 — https://support.claude.com/en/articles/12138966-release-notes — [primary]
- Higher usage limits for Claude and a compute deal with SpaceX — Anthropic — 2026-05-06 — https://www.anthropic.com/news/higher-limits-spacex — [primary]

**Claude Code docs, primary**
- Changelog — https://code.claude.com/docs/en/changelog — v2.1.51, v2.1.80/81, v2.1.110, v2.1.128 — [primary]
- What's new, W16 and W34 — https://code.claude.com/docs/en/whats-new/2026-w16 ; https://code.claude.com/docs/en/whats-new/2026-w34 — [primary]
- Remote Control — https://code.claude.com/docs/en/remote-control — [primary]
- Channels — https://code.claude.com/docs/en/channels — [primary]
- Voice dictation — https://code.claude.com/docs/en/voice-dictation — [primary]
- Mobile — https://code.claude.com/docs/en/mobile — [primary]
- Costs — https://code.claude.com/docs/en/costs — [primary]
- Legal and compliance — https://code.claude.com/docs/en/legal-and-compliance — [primary]

**GitHub, primary (READMEs fetched 2026-10-11; stars and commits as of that date)**
- Session managers and remotes: https://github.com/stablyai/orca ; https://github.com/manaflow-ai/cmux ; https://github.com/OrchestratorInc/agent-orchestrator ; https://github.com/superset-sh/superset ; https://github.com/generalaction/emdash ; https://github.com/smtg-ai/claude-squad ; https://github.com/stravu/crystal ; https://github.com/nimbalyst/nimbalyst ; https://github.com/BloopAI/vibe-kanban ; https://github.com/terragon-labs/terragon-oss ; https://github.com/imbue-ai/sculptor ; https://github.com/omnara-ai/omnara ; https://github.com/slopus/happy ; https://github.com/amantus-ai/vibetunnel ; https://github.com/gastownhall/gastown — [primary]
- OpenClaw: https://github.com/openclaw/openclaw (README, SECURITY.md) ; https://raw.githubusercontent.com/openclaw/openclaw/main/docs/help/faq-first-run/providers-and-hosting.md ; https://github.com/openclaw/clawhub — [primary]
- OpenClaw, OpenAI and the future — Peter Steinberger — 2026-02-15 — https://raw.githubusercontent.com/steipete/steipete.me/main/src/content/blog/2026/openclaw.md — [primary]
- Models: https://github.com/zai-org/GLM-5 ; https://github.com/QwenLM/Qwen3.8 ; https://github.com/QwenLM/Qwen3-Coder — [primary]
- Model benchmarks and recipes: https://github.com/MiaAI-Lab/GLM-5.3-Flash-EXL3-2x-DGX-Sparks ; https://github.com/MiaAI-Lab/Qwen3.8-Flash-Next-Single-DGX-Spark ; https://github.com/visorcraft/strix-halo-llm-perf ; https://github.com/kyuz0/amd-strix-halo-toolboxes — [primary, community]
- Endpoints: https://raw.githubusercontent.com/ollama/ollama/main/docs/integrations/claude-code.mdx ; https://raw.githubusercontent.com/ggml-org/llama.cpp/master/tools/server/README.md — [primary]
- Voice and config repos: https://github.com/cjpais/Handy ; https://github.com/Beingpax/VoiceInk ; https://github.com/trailofbits/claude-code-config ; https://github.com/steipete/agent-scripts ; https://github.com/obra/dotfiles ; https://github.com/obra/superpowers ; https://github.com/diet103/claude-code-infrastructure-showcase ; https://github.com/ykdojo/claude-code-tips ; https://github.com/centminmod/my-claude-code-setup ; https://github.com/Dicklesworthstone/destructive_command_guard — [primary]

**Simon Willison's blog [via Willison]** (all simonwillison.net)
- Models: Qwen 3.8 27B, 2026-08-16 (tok/s, MTP) — https://simonwillison.net/2026/Aug/16/qwen-38-27b/ ; AA score of 52, 2026-08-17 — https://simonwillison.net/2026/Aug/17/qwen-38-27b-scores-52/ ; Qwen3.8-Flash-Next — https://simonwillison.net/2026/Aug/26/qwen38-flash-next/ ; GLM-5 — https://simonwillison.net/2026/Feb/11/glm-5/ ; GLM-5.2 — https://simonwillison.net/2026/Jun/17/glm-52/ ; Kimi K3 weights — https://simonwillison.net/2026/Jul/27/kimi-k3/ ; GPT-6 Astra (AA Index) — https://simonwillison.net/2026/Sep/3/gpt6-astra/ ; Devstral 2 — https://simonwillison.net/2025/Dec/9/devstral-2/ ; Kimi K2.5 ($10k Mac Studio) — https://simonwillison.net/2026/Jan/27/kimi-k25/
- Plans: Remote Control, 2026-02-25 — https://simonwillison.net/2026/Feb/25/claude-code-remote-control/ ; Pro test, 2026-04-22 — https://simonwillison.net/2026/Apr/22/claude-code-confusion/ ; Copilot plans — https://simonwillison.net/2026/Apr/22/changes-to-github-copilot/ ; product-market fit, 2026-05-27 — https://simonwillison.net/2026/May/27/product-market-fit/ ; Fable bump — https://simonwillison.net/2026/Jul/12/bump/ ; Fable 5 made permanent — https://simonwillison.net/2026/Jul/18/claude-make-fable-5-permanent/ ; ChatGPT Go — https://simonwillison.net/2026/Jan/16/chatgpt-ads/
- OpenClaw: gym quote — https://simonwillison.net/2026/Aug/10/openclaw/ ; hackmyclaw — https://simonwillison.net/2026/Jun/26/hack-my-ai-assistant/ ; Summer Yue — https://simonwillison.net/2026/Feb/23/summer-yue/ ; 2026 in LLMs — https://simonwillison.net/2026/Sep/27/2026-in-llms-so-far/

**Secondary [via search summary]**
- Apple: Macworld — https://macworld.com/article/3220063/apple-launches-new-m6-mac-mini-with-another-price-hike.html ; https://macworld.com/article/3220024/apple-announces-the-m5-ultra-mac-studio-with-up-to-512gb-of-ram.html ; how2shout — https://www.how2shout.com/?p=88205
- DGX Spark: wccftech — https://wccftech.com/nvidia-dgx-spark-700-usd-price-hike-memory-shortages-4699-new-pricing/amp/ ; iTiger — https://www.itiger.com/news/1108675194
- Strix Halo: Notebookcheck — https://www.notebookcheck.net/Framework-Desktop-now-cost-up-to-460-more-due-to-RAM-shortage.1203235.0.html ; PCWorld — https://www.pcworld.com/article/3031562/framework-raises-prices-yet-again-as-memory-costs-go-up.html ; aiindigo — https://aiindigo.com/hardware/gmktec-evo-x2-ryzen-ai-max-395-128gb
- GPUs: videocardprices — https://videocardprices.com/compare/nvidia-rtx-5090-vs-nvidia-rtx-pro-6000-blackwell/ ; Digital Citizen — https://www.digitalcitizen.life/nvidia-rtx-pro-6000-blackwell-prices-climb-past-10000-as-ai-demand-keeps-rising/
- VPS: igorslab — https://www.igorslab.de/en/hetzner-to-significantly-increase-prices-for-cloud-and-dedicated-servers-from-april-2026/ ; privatedevops — https://privatedevops.com/news/hetzner-june-2026-cloud-price-increase-what-to-do ; valebyte — https://valebyte.com/en/blog/digitalocean-pricing-overview-and-5-cheaper-alternatives-in-2026/
- Subscriptions: OpenAI — https://developers.openai.com/codex/pricing ; CloudZero — https://www.cloudzero.com/blog/google-antigravity-pricing/ ; dev.to (Cursor) — https://dev.to/rahulxsingh/cursor-pricing-in-2026-hobby-pro-pro-ultra-teams-and-enterprise-plans-explained-4b89 ; GitHub changelog — https://github.blog/changelog/2026-04-20-changes-to-github-copilot-plans-for-individuals/
- Claude peak hours: The Register — 2026-03-26 — https://www.theregister.com/2026/03/26/anthropic_tweaks_usage_limits/
- Voice: Spokenly — https://spokenly.app/blog/wispr-flow-pricing ; Voibe — https://www.getvoibe.com/resources/dictation-app-pricing/
- Mobile: Moshi — https://apps.apple.com/app/id6757859949 ; Termius — https://apps.apple.com/il/app/termius-modern-ssh-client/id549039908?l=he ; mosh-devel — https://mailman.mit.edu/pipermail/mosh-devel/2017-August/001502.html ; Blink in-app purchases — https://apppricinglab.com/iap/apple/1594898306
- Session managers: Conductor — https://www.conductor.build/pricing ; Vibe Kanban — https://vibekanban.com/blog/shutdown ; Superset — https://superset.sh/compare/superset-vs-cursor
- OpenClaw: The Hacker News — https://thehackernews.com/2026/02/researchers-find-341-malicious-clawhub.html ; Antiy — https://www.antiy.net/p/clawhavoc-analysis-of-large-scale-poisoning-campaign-targeting-the-openclaw-skill-market-for-ai-agents/ ; Unit 42 — https://unit42.paloaltonetworks.com/?p=182742 ; CVE list — https://cve-dev.imfht.com/vendor/OpenClaw?lang=en ; eSecurity Planet (gym) — https://www.esecurityplanet.com/threats/news-claude-ai-agent-australian-gym-api-flaw-apac/
- Model throughput and evals: gamegpu (NVIDIA RTX 5090) — https://en.gamegpu.com/news/zhelezo/nvidia-uskorila-lokalnyj-ii-na-rtx-5090-do-200-tokenov-v-sekundu ; hackmd — https://hackmd.io/@thc1006/qwen3-8-27b-speculative-decoding-rtx-3090 ; benchmarklist (TB2) — https://benchmarklist.com/benchmarks/vals_terminal_bench_2/

## 5. Still unknown

- **Unverified numbers:** OpenClaw's exact advisory/CVE count (the "73 pages" claim) and the Strix Halo figure of 43.9 tok/s for Qwen3.8-Flash-Next.
- **Official prices not yet available:** Mac Studio M5 Ultra 512 GB (orderable late Oct) and the Mac mini M6 32 GB configuration. GMKtec EVO-X2's current price is unconfirmed (≈$2.3–3.65k).
- **Subscriptions read only from summaries:** ChatGPT Pro's tier structure ($100/$200/$500) and exact Codex per-5h numbers; Google AI Ultra's post-May price (two tiers); whether Copilot signups have resumed.
- **Platforms and pricing not checked:** Wispr Flow and SuperWhisper platforms, Blink's billing period, and Orca's commercial model beyond its MIT licence.
- **Coding-specific gap:** no independent agentic-coding eval (Terminal-Bench 2.x run on a neutral harness) for Qwen 3.8 27B or GLM-5.3 was found. The AA Index is a general composite score.
