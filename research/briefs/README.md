# Research briefs (raw, sourced notes)

These are the research briefs behind [the main report](../README.md), all compiled on 11 Oct 2026: eight first-pass research tracks (01–08), six second-pass verification briefs (09–14), and a third-pass check (15).

Each brief has the same layout:
- top takeaways
- detailed findings
- practices and configs
- disagreements and caveats
- dates
- a full source list, with every source labelled primary or secondary
- a section listing what could not be verified

Some sites couldn't be reached during research, so each brief opens with a method note on how sources were accessed. In the briefs:
- items marked **[K]** or "from memory" were **not** re-verified;
- vendor figures are labelled as vendor-reported or self-reported.

| Brief | Scope |
|---|---|
| [01 — Anthropic canon](01-anthropic-canon.md) | Anthropic's engineering posts, docs and research; how the Claude Code team works; Claude 5-era model guidance |
| [02 — Claude Code features](02-claude-code-features.md) | Full feature inventory and power-user configuration as of v2.1.296, with a version timeline |
| [03 — Industry playbooks](03-industry-playbooks.md) | OpenAI, Google/DORA, Microsoft/GitHub, AWS, Meta, Cursor, Cognition, other vendors; Stripe, Spotify, Ramp, StrongDM, Shopify and more |
| [04 — Research evidence](04-research-evidence.md) | RCTs, telemetry, quality and security studies, agent-PR datasets, context and instruction research, multi-agent studies, benchmarks |
| [05 — Practitioner workflows](05-practitioner-workflows.md) | ~25 influential practitioners' setups, a who-does-what matrix, the 15 most-repeated techniques, and where they disagree |
| [06 — Frontier, Jun–Oct 2026](06-frontier-2026.md) | Model releases, product shifts, paradigms, incidents, a master timeline from Jan 2025, and the state of the art on 2026-10-11 |
| [07 — Home rig](07-home-rig.md) | Terminal, parallelism, remote/mobile, always-on boxes, local models, sandboxing, plans and cost; three reference rigs |
| [08 — Methods and tools](08-methods-and-tools.md) | Methodology catalog, CLAUDE.md/AGENTS.md authoring, community ecosystems, AI code review, the tool landscape |

**Second pass.** Each of these briefs starts with a verification ledger for first-pass claims (confirmed, corrected or still unverified), then adds new findings, suggested report edits, sources and a "still unknown" list.

| Brief | Scope |
|---|---|
| [09 — Anthropic's Oct 2026 guides](09-anthropic-oct-2026-guides.md) | "Building effective agent automations", the cloud-sessions field guide, and eval hill-climbing with the `claude-api` skill (all secondary: claude.dev was blocked) |
| [10 — Company programs](10-org-programs-verification.md) | OpenAI, Google, AWS, Meta, Microsoft, Stripe, Spotify, Ramp, StrongDM, Shopify, Uber, Intercom, Block and others: what is confirmed and what was corrected |
| [11 — Tools landscape](11-tools-landscape-update.md) | Cursor, Cognition, Amp, Factory, Vercel, Gemini CLI/Antigravity, Copilot, Codex, terminal agents and benchmarks, Jun–Oct 2026 |
| [12 — Research gaps](12-research-gaps.md) | METR time horizons (TH1.1), security advisories, skills and context-file studies, multi-agent papers, surveys and labor data |
| [13 — People](13-people-verification.md) | Boris Cherny's posts and talks, Karpathy, Horthy's QRSPI, and other practitioner claims |
| [14 — Home rig update](14-home-rig-update.md) | Plans and limits, 2026 hardware prices, session managers, voice and mobile tools, local models, OpenClaw security, public setup repos |

**Third pass.** Run from an unrestricted network, so it could open the sites the first two passes could not. It has the same ledger layout, plus a link check and the results of running the configs.

| Brief | Scope |
|---|---|
| [15 — Third-pass check](15-third-pass-check.md) | 33 claims re-checked against primary pages, 46 Claude Code details, a check of all 1,028 links, the Appendix A configs and the macOS sandbox actually run, and the edits made to the report |
