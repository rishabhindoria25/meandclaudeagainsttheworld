# Claude Code capabilities and power-user configuration: state of the art, 11 Oct 2026

**Slice 2 of 8.** This brief inventories Claude Code's features and the way experienced users configure them. It is built mainly from first-party sources:

- **Official docs.** About 90 pages under code.claude.com/docs, downloaded as Markdown through the [docs index](https://code.claude.com/docs/llms.txt) on 11 Oct 2026.
- **CHANGELOG.md.** The full file, 8,789 lines, through **v2.1.296 (9 Oct 2026)**.
- **Release dates.** Dates come from the docs changelog, which labels every version with a date, cross-checked against the npm registry's publish times.
- **Weekly "What's new" digest.** Weeks 13–37 of 2026.
- **Anthropic pages.** A small number of Anthropic posts and the platform's model and pricing pages.

**Method note.** The shared web-search budget ran out early in this run, so I did not open third-party aggregators and could not search for Anthropic's announcement posts for Opus, Sonnet and Haiku 5.5. Model facts below come from the Claude Code docs and changelog plus the platform's models overview and pricing pages.

---

## 1. Top takeaways

1. **Releases ship at an extreme pace.** There have been 542 npm versions since the 24 Feb 2025 launch, about 25–30 a month in 2026. `stable` (2.1.287) trails `latest` (2.1.296) by about a week. Pin `autoUpdatesChannel: "stable"` and track the dated [docs changelog](https://code.claude.com/docs/en/changelog) plus the weekly [What's new](https://code.claude.com/docs/en/whats-new) digest. Source: [npm registry](https://registry.npmjs.org/@anthropic-ai/claude-code).
2. **Opus 5.5 is the default model on every plan and on the API.** Since v2.1.280 (22 Sep 2026), even Pro and Team Standard start on Opus, at **`medium` effort**; Anthropic says Opus 5.5 at medium "matches or exceeds Opus 5 at high". Fable 5.1 ($10/$50 per Mtok) is never the default and can bill usage credits. Source: [model-config](https://code.claude.com/docs/en/model-config).
3. **Every current model has a native 1M-token window.** That covers Fable 5.1, Opus 5.5, Sonnet 5.5 and Haiku 5.5. Claude Code auto-compacts at about 967K; `/autocompact 500k` sets the threshold per model, and `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` holds sessions at 200K. Source: [model-config](https://code.claude.com/docs/en/model-config).
4. **Auto mode is the starting permission mode.** Since v2.1.283–284 (25–28 Sep 2026) it is the built-in default for interactive terminal and VS Code sessions on all plans and providers. A Sonnet 5 classifier replaces most prompts, and auto mode falls back to prompting after 3 consecutive or 20 total blocks. Anthropic reports a 0.4% false-positive rate and a **17% false-negative rate** on real overeager actions. Sources: [permission-modes](https://code.claude.com/docs/en/permission-modes); [engineering post](https://www.anthropic.com/engineering/claude-code-auto-mode).
5. **Permission rules are deterministic and evaluated deny → ask → allow.** Specificity does not change that order. Auto mode drops broad allows: `Bash(*)`, interpreter wildcards, package-manager `run` commands, and `Agent` and `Monitor` allows. Use **`ask` rules** for human checkpoints that survive auto mode. Source: [permissions](https://code.claude.com/docs/en/permissions).
6. **`Read` deny rules don't stop `grep -r` or scripts.** Only the OS sandbox (Seatbelt on macOS, bubblewrap on Linux/WSL2) enforces paths for every process, and it is off by default. `sandbox.credentials` can deny or mask secrets. Source: [sandboxing](https://code.claude.com/docs/en/sandboxing).
7. **Hooks are now a policy engine.** There are 5 handler types (command, http, mcp_tool, prompt, agent) and 33 events. Exit 2 blocks the action, `onFailure: "block"` (v2.1.295) makes a hook fail closed, and a `PreToolUse` deny wins even in bypass mode. Stop hooks are capped at 8 consecutive continuations with no tool call in between. Source: [hooks](https://code.claude.com/docs/en/hooks).
8. **CLAUDE.md:** keep each file under 200 lines. `@imports` don't save context, and HTML comments are stripped. Put file-specific instructions in `.claude/rules/` with `paths:`. Run `/doctor prompt-audit` (v2.1.283). **AGENTS.md is read natively** when no CLAUDE.md exists (v2.1.277, 18 Sep 2026). Source: [memory](https://code.claude.com/docs/en/memory).
9. **Auto memory has been on by default since v2.1.59 (26 Feb 2026).** `MEMORY.md` loads its first 200 lines or 25KB; notes are typed user, feedback, project or reference. It is machine-local and shared across worktrees, and subagents can keep their own via `memory:`. Source: [memory](https://code.claude.com/docs/en/memory).
10. **Subagent defaults (interactive):** subagents run in the background with fork mode on, nest up to depth 3, and run 20 at a time. The Agent tool takes a per-call `effort` (v2.1.292) as well as `model`. The `/agents` wizard was removed (v2.1.198), so edit `.claude/agents/*.md` directly. Source: [sub-agents](https://code.claude.com/docs/en/sub-agents).
11. **There are five ways to parallelise.** Subagents; agent view (`claude agents`, `--bg`; research preview since 11 May 2026); agent teams (still experimental); dynamic workflows (`/workflows`, `ultracode`; 16 concurrent and 1,000 agents per run); and Projects (cloud, Pro/Max beta). Worktrees and cross-session messaging glue them together. Source: [agents](https://code.claude.com/docs/en/agents).
12. **Skills have absorbed custom commands.** The skill listing costs context on every request (descriptions are capped at 1,536 characters); `disable-model-invocation: true` removes it. After compaction, skills are re-attached at no more than 5K tokens each and 25K in total. `/skill-doctor` shows each skill's cost. Source: [skills](https://code.claude.com/docs/en/skills).
13. **Claude Mods (v2.1.287, 1 Oct 2026) are in-process JavaScript/TypeScript plugins.** They can redraw the UI, intercept, rewrite or approve tool calls, and call models. They are **not sandboxed** and can override your own `PreToolUse` blocks, though not managed ones. The built-in "You should know" side-agent mod is opt-in. Source: [mods](https://code.claude.com/docs/en/plugins/mods/overview).
14. **MCP tools are deferred behind tool search by default.** Up-front descriptions are capped at 4,096 characters (v2.1.296) and `MAX_MCP_OUTPUT_TOKENS` defaults to 25K. Anthropic still says **CLI tools (`gh`, `aws`, `gcloud`) are more context-efficient than MCP**. Sources: [mcp](https://code.claude.com/docs/en/mcp); [costs](https://code.claude.com/docs/en/costs).
15. **Headless runs: use `--bare`.** It is recommended and will become the `-p` default; without it, `-p` runs a repo's hooks and `.mcp.json` with no trust dialog. Combine it with `--permission-mode dontAsk`, `--allowedTools`, `--max-turns`, `--max-budget-usd`, `--output-format json` plus `--json-schema`, and `--permission-prompts none`. Source: [headless](https://code.claude.com/docs/en/headless).
16. **Automation:**
    - `/goal`: a built-in, prompt-based Stop hook.
    - `/loop` and cron: session-scoped, expiring after 7 days.
    - Routines: cloud schedule, API or GitHub triggers, 100 scheduled runs per hour.
    - The Monitor tool and channels, which push events into a session.

    Sources: [scheduled-tasks](https://code.claude.com/docs/en/scheduled-tasks); [routines](https://code.claude.com/docs/en/routines).
17. **Limits:** a rolling 5-hour window plus weekly caps, shared across the Claude apps and Claude Code. Max gives 5x or 20x Pro's usage per 5-hour session; Fable on Max is capped at "50% of weekly limits". `/usage` (aliases `/cost`, `/stats`) attributes usage to individual skills, subagents, plugins and MCP servers. Sources: [pricing](https://claude.com/pricing); [costs](https://code.claude.com/docs/en/costs).
18. **Aggregators get some dates wrong.** Agent View shipped in May, not August; the `/doctor` checkup in July; Artifacts in June. Mods, "You should know", plugin install with `--marketplace`, the subagent `effort` parameter, Haiku 5.5 and the Opus 5.5 default are all confirmed (§2.14). Source: [What's new](https://code.claude.com/docs/en/whats-new).

---

## 2. Detailed findings

### 2.1 Versions, channels and where to look

- **Current versions.** On 11 Oct 2026 the `latest` dist-tag is **2.1.296** (9 Oct) and `stable` is **2.1.287**. The first npm publish was 0.2.6 on **24 Feb 2025**. GA came with **1.0.0 on 22 May 2025**, which shipped "Sonnet 4 and Opus 4". [npm](https://registry.npmjs.org/@anthropic-ai/claude-code); [CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
- **Dated sources.** The docs changelog gives a date for every version. The weekly digest summarises the most notable items, but its index currently stops at Week 37 (7–11 Sep 2026). [docs changelog](https://code.claude.com/docs/en/changelog); [What's new](https://code.claude.com/docs/en/whats-new)
- **Diagnostic modes.**
  - `--safe-mode` (v2.1.169) starts with every customisation disabled. Use it to bisect configuration problems.
  - `claude doctor` and `/doctor` (alias `/checkup`) form a setup checkup that can apply fixes. It became a full checkup in the week of 6–10 Jul 2026.

### 2.2 Models, effort, fast mode, pricing and limits

- **Aliases on the Anthropic API.**
  - `opus` → Opus 5.5, `sonnet` → Sonnet 5.5, `haiku` → Haiku 5.5, `fable` → Fable 5.1.
  - `best` → Fable where it is available, otherwise Opus.
  - `opusplan` uses Opus in plan mode and Sonnet for execution.
  - Bedrock and Vertex resolve `sonnet` and `haiku` to older 4.5 models.

  [model-config](https://code.claude.com/docs/en/model-config)
- **Defaults.** `default` resolves to Opus 5.5 for Pro, Max, Team, Enterprise and the API (v2.1.280+). The history runs:
  - Opus 4.8 from 28 May (v2.1.154, Max/API);
  - Sonnet 5 from 30 Jun 2026 (v2.1.197, for Pro and Team Standard);
  - Opus 5 from 24 Jul (v2.1.219);
  - Opus 5.5 from 22 Sep (v2.1.280).

  [model-config](https://code.claude.com/docs/en/model-config); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- **API pricing per Mtok.**

  | Model | Input / output | Notes |
  | :- | :- | :- |
  | Fable 5.1 | $10 / $50 | |
  | Opus 5.5 | $4 / $20 | Cache read $0.20 |
  | Sonnet 5.5 | $2 / $10 | Cache read $0.10 per the pricing page; v2.1.296 corrected Claude Code's figure from $0.20 |
  | Haiku 5.5 | $0.10 / $0.50 | $0.50 / $2.50 for prompts over 100K tokens |

  - All four have 1M context and 128K max output.
  - Retirement is "not sooner than" one year after release. That implies release dates of 1 Sep, 22 Sep, 28 Sep and 7 Oct 2026 respectively.
  - Fast mode on Opus 5.5 is "up to 2.5x faster" at **2x** standard price.

  [models overview](https://platform.claude.com/docs/en/about-claude/models/overview); [pricing](https://claude.com/pricing)
- **Fable 5 / Mythos 5 (9 Jun 2026).**
  - Fable is "a Mythos-class model that we've made safe for general use".
  - Requests flagged as cyber, bio/chem or distillation fall back to Opus 4.8. The classifiers "trigger, on average, in less than 5% of sessions".
  - Fable required usage credits on subscriptions from 23 Jun.

  [Anthropic, Jun 2026](https://www.anthropic.com/news/claude-fable-5-mythos-5)
- **Fable in Claude Code.**
  - The docs advise: "Describe the outcome, not the steps… Skip the verification reminders."
  - Flagged requests trigger automatic model fallback.
  - Interactive sessions ask for consent before billing usage credits.
  - `-p` runs bill usage credits without asking.

  [model-config](https://code.claude.com/docs/en/model-config)
- **Effort.**
  - Levels are `low`, `medium`, `high`, `xhigh` and `max`. Opus 4.6 and Sonnet 4.6 have no `xhigh`.
  - Opus, Sonnet and Haiku 5.5 default to `medium`, Opus 4.7 defaults to `xhigh`, and everything else defaults to `high`.
  - `max` applies to the current session only unless set via `CLAUDE_CODE_EFFORT_LEVEL`.
  - `/effort` saves a level per model in `modelSettings`. Pressing `s` applies it to the session only (v2.1.257).
  - Precedence runs env/flag/`/effort` → settings → model default.
  - `maxEffortLevel` caps effort; the lowest cap from any scope wins.
  - Only the keyword **`ultrathink`** is recognised in a prompt. "think hard" is passed through as plain text.

  [model-config](https://code.claude.com/docs/en/model-config)
- **Effort guidance from Anthropic.**
  - "for most tasks you should use the model's default effort level."
  - Raise effort if Claude skips files or tests.
  - Use larger models for subtle bugs, unfamiliar domains and architecture work.

  [Lydia Hallie, 7 Jul 2026](https://claude.com/blog/claude-model-and-effort-level-in-claude-code)
- **Ultracode.**
  - Ultracode is a toggle, not an effort level. Since v2.1.284 it sits in the `/effort` slider and is set with `/effort ultracode [on|off]` or `"ultracode": true`.
  - With it on, Claude plans a dynamic workflow for every substantive task.
  - It switches off the "Large workflow" warning and the concurrent-subagent cap, and it burns through limits faster.

  [workflows](https://code.claude.com/docs/en/workflows)
- **Subscription limits.**
  - "Every plan has usage limits that reset on a rolling five-hour session window, and paid plans add weekly limits on top." Activity across Claude on the web, desktop, mobile and Claude Code "all draws from the same pool".
  - Pro costs $20/month, or $17/month billed annually. Max starts at $100/month with "5x or 20x more usage than Pro" and includes "$100 to $200/month in API credits".
  - Team Standard is $20–25 per seat; Team Premium is $100–125 per seat with "5x more usage than standard seats".
  - The status line exposes `rate_limits.five_hour` and `rate_limits.seven_day`.
  - Auto-continue at a usage-limit reset is on by default (v2.1.234).

  [pricing](https://claude.com/pricing); [statusline](https://code.claude.com/docs/en/statusline)
- **Enterprise cost benchmark.** Average cost is "around $13 per developer per active day and $150-250 per developer per month, with costs remaining below $30 per active day for 90% of users." [costs](https://code.claude.com/docs/en/costs)

### 2.3 Memory and instructions

- **CLAUDE.md locations, in load order.**
  1. Managed: `/Library/Application Support/ClaudeCode/CLAUDE.md`, `/etc/claude-code/CLAUDE.md`, or `C:\Program Files\ClaudeCode\CLAUDE.md`. The `claudeMd` key can carry this content inline in managed settings. It cannot be excluded.
  2. User: `~/.claude/CLAUDE.md`.
  3. Project: `./CLAUDE.md` or `./.claude/CLAUDE.md`.
  4. Local: `./CLAUDE.local.md`, kept out of git.

  [memory](https://code.claude.com/docs/en/memory)
- **How the files combine.**
  - Files in ancestor directories load at launch and are **concatenated, not overridden**, root first.
  - Subdirectory CLAUDE.md files load lazily when Claude reads or edits a file there.
  - CLAUDE.md is delivered as a user message after the system prompt, so it is "context, not enforced configuration".
- **Size limits.**
  - Target fewer than 200 lines per file.
  - Files up to 4 MiB load in full; larger files are skipped.
  - `@path` imports allow 4 hops. External imports need a one-time approval.
  - Block-level HTML comments are stripped.
- **`.claude/rules/`.**
  - Files are discovered recursively and may be symlinked.
  - `paths:` globs scope a rule. A scoped rule loads when Claude reads, writes or edits a matching file; Write/Edit triggering was fixed in Oct 2026.
  - User-level rules live in `~/.claude/rules/`.
  - `claudeMdExcludes` skips ancestor files in a monorepo.
  - Path-scoped rules and nested CLAUDE.md files are *summarised away* on compaction and reload on demand. The project-root CLAUDE.md is re-injected from disk.

  [context-window](https://code.claude.com/docs/en/context-window)
- **AGENTS.md (v2.1.277).**
  - It loads only when no CLAUDE.md or CLAUDE.local.md exists on the path.
  - The `/config` setting "Project instructions" offers `claude-md-or-agents-md`, `claude-md-and-agents-md`, `claude-md` and `managed-only`. It is implemented as the built-in plugin `cc-plugin-agents-md`.
  - `@AGENTS.md` inside CLAUDE.md is the most portable setup. A symlink fails on Windows, and the Edit tool refuses to write through symlinks.

  [memory](https://code.claude.com/docs/en/memory)
- **Bootstrapping instructions.**
  - `/init` writes a starter CLAUDE.md. With `CLAUDE_CODE_NEW_INIT=1` it becomes an interactive flow that also proposes skills and hooks.
  - `/import codex|gemini|cursor` (v2.1.213+) migrates other agents' instruction files, MCP servers, commands and skills.
  - `/doctor` proposes trims for CLAUDE.md (v2.1.206), and `/doctor prompt-audit` (v2.1.283) does the deeper audit.
- **Auto memory.** On by default since v2.1.59; see takeaway 9.
  - `/memory` toggles it, writing `autoMemoryEnabled`, and `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` turns it off.
  - `autoMemoryDirectory` relocates it.
  - Notes carry ISO `modified` timestamps (v2.1.214).
  - It is off in self-hosted environments and cannot be turned on from background sessions.

  [memory](https://code.claude.com/docs/en/memory)

### 2.4 settings.json scopes and precedence

- **Precedence**, highest first:
  1. **Managed.** Delivered as `managed-settings.json` or `managed-settings.d/`, through MDM, or as server-managed settings from claude.ai.
  2. **`--settings` flag.**
  3. **`.claude/settings.local.json`.**
  4. **`.claude/settings.json`.**
  5. **`~/.claude/settings.json`.**

  [settings](https://code.claude.com/docs/en/settings)
- **How keys combine.**
  - Lists such as `permissions.allow` merge across scopes.
  - `fallbackModel` and `modelPicker` take the whole value from the highest scope that sets them.
  - Environment variables are paired per key; for example, `ANTHROPIC_MODEL` beats `model`.
- **Restrictions on repo-held files.**
  - `defaultMode: "auto"` or `"bypassPermissions"` is **ignored in project and local files** (bypass since v2.1.257).
  - `autoMode` rules are never read from repo files.
  - OpenTelemetry export variables are ignored in project settings.
  - Project `allow` rules, `additionalDirectories`, `extraKnownMarketplaces` and most `env` values wait for workspace trust. `deny` and `ask` rules apply immediately.
- **Stricter-wins exceptions.** Some keys take the stricter value from any scope, including `permissions.blockReadsOutsideWorkingDirectories`, `maxEffortLevel` and `disableClaudeAiConnectors`.
- **Editing and checking.**
  - Settings files are strict JSON. Add `"$schema": "https://json.schemastore.org/claude-code-settings.json"` for editor validation.
  - `/status` shows which sources loaded, and `claude doctor` lists rejected entries.
  - Most keys hot-reload, but `model` and effort do not.
  - `/config key=value` (v2.1.181) sets any key from the prompt.

  [settings](https://code.claude.com/docs/en/settings)
- **Credentials.** `apiKeyHelper` is a shell command whose output is sent as both `X-Api-Key` and Bearer. It is cached for 5 minutes and re-run on a 401 or 403. [settings-reference](https://code.claude.com/docs/en/settings-reference)

### 2.5 Permissions and permission modes

- **Rule syntax.**
  - Rules take the form `Tool` or `Tool(specifier)`.
  - In Bash rules, `*` matches anything, including spaces. Put the `*` **after the subcommand**: `Bash(git * main)` also matches `git -c core.fsmonitor=<script> diff main`, and the CLI warns at startup about such rules.
  - `Bash(ls *)` does not match `lsof`, while `Bash(ls*)` does.
  - Rules match the command *as written*, so `git -C . push` escapes `Bash(git push *)`.
  - Since v2.1.178, deny and ask rules can match a top-level parameter with `Tool(param:value)`, for example `Agent(model:opus)`, `Bash(run_in_background:true)` or `Bash(dangerouslyDisableSandbox:true)`.
  - Glob tool names such as `mcp__*` are allowed in deny rules (v2.1.166).

  [permissions](https://code.claude.com/docs/en/permissions)
- **Path rules use gitignore semantics.**
  - `//abs/path` is an absolute path, `~/path` is home-relative, and `/path` is relative **to the settings file's anchor**. In user settings that anchor is `~/.claude/`, which is a classic mistake.
  - `Read(.env)` matches at any depth.
  - A `Read` deny also blocks Edit and Write on that path (v2.1.208/228).
  - `.claudeignore` has no effect.
  - `Write(...)`, `Glob(...)` and `MultiEdit(...)` path rules are never consulted. Use `Edit(...)` and `Read(...)`.
- **Modes.**

  | Mode | Behaviour |
  | :- | :- |
  | `default` | Called "Manual" in the UI since v2.1.200; accepts the alias `manual`. Reads only. |
  | `acceptEdits` | Also auto-approves `mkdir`, `touch`, `rm`, `rmdir`, `mv`, `cp` and `sed` on in-scope paths. |
  | `plan` | With auto mode available, the classifier reviews planning commands. |
  | `auto` | Classifier-reviewed. |
  | `dontAsk` | Anything that would prompt is denied; intended for CI. |
  | `bypassPermissions` | Refused as root; the warning must be accepted once. |

  - Shift+Tab cycles modes.
  - Even bypass mode still prompts for ask rules, critical-path `rm`, `AskUserQuestion` and reads outside working directories when that block is enabled.

  [permission-modes](https://code.claude.com/docs/en/permission-modes)
- **Auto mode history.**
  - Announced 24 Mar 2026 as a Team preview, in a design that originally ran on Sonnet 4.6 with two stages.
  - Generally available by Jul 2026.
  - Default for new Pro, Max and Team sessions from 14 Aug, and for all plans and providers from v2.1.283–284.

  [auto-mode blog](https://claude.com/blog/auto-mode); [What's new W32](https://code.claude.com/docs/en/whats-new/2026-w32)
- **What the classifier sees and blocks.**
  - It sees user messages, tool calls and CLAUDE.md. Tool results are stripped, which limits prompt injection.
  - A separate server-side probe scans incoming results.
  - Blocked by default: `curl | bash`, force-push, `git reset --hard`, `terraform destroy`, production deploys, IAM grants, secrets leaving the repo, metadata-credential fetches (v2.1.257), and more.
  - Allowed by default: in-repo pushes and lock-file installs.
  - "Boundaries" stated in conversation, such as "don't push", block matching actions but can be lost to compaction. **Use deny rules for guarantees.**
  - Trusted infrastructure goes in the `autoMode.environment`, `allow`, `soft_deny` and `hard_deny` prose lists. `/auto-mode-setup` and `claude auto-mode defaults` help with these.

  [permission-modes](https://code.claude.com/docs/en/permission-modes); [auto-mode-config](https://code.claude.com/docs/en/auto-mode-config)
- **Auto mode evaluation numbers** (Anthropic engineering post).
  - "93% of permission prompts" are approved by users.
  - Full pipeline: 0.4% false-positive rate (n=10,000 real actions), 17% false-negative rate on real overeager actions (n=52), and 5.7% false-negative rate on synthetic exfiltration.

  [Anthropic, 25 Mar 2026](https://www.anthropic.com/engineering/claude-code-auto-mode)
- **Auto mode cost.** Enterprise and API accounts used to pay for classifier calls. Server-side classifier review (v2.1.271–282) removes the separate charge on direct API connections.
- **Working directories.**
  - `permissions.additionalDirectories`, `--add-dir` and `/add-dir` grant **file access only, not configuration**.
  - `/cd` (v2.1.169) moves a session without breaking the prompt cache.

### 2.6 Sandboxing

- **What it is.** OS-level isolation for Bash, PowerShell and Monitor commands and their children, built on the open-source [`@anthropic-ai/sandbox-runtime`](https://github.com/anthropics/sandbox-runtime).
  - Writes are limited to the working directory and the temp directory.
  - Reads cover most of the machine *including `~/.ssh`* unless you deny them.
  - All network traffic goes through a proxy with an allowlist that **starts empty**.
  - Native Windows runs commands unsandboxed, so use WSL2.

  [sandboxing](https://code.claude.com/docs/en/sandboxing)
- **Modes.** In *auto-allow* mode, sandboxed commands run without prompts even in Manual mode; deny rules and ask rules still apply. In *regular* mode, every command is prompted.
  - Failed commands can be retried with `dangerouslyDisableSandbox` (the escape hatch).
  - `allowUnsandboxedCommands: false` gives strict mode, and `failIfUnavailable: true` makes startup fail closed.
- **Credentials.** `sandbox.credentials` takes `deny` entries for files and env vars, and `mask` entries that substitute the real value on egress. Masking requires `network.tlsTerminate` and is honoured only from user, managed or `--settings` files.
- **Newer settings.** `network.deniedDomains`, `strictAllowlist`, `filesystem.disabled`, and per-command `allowed_domains` in auto mode (v2.1.271).
- **Not covered.** File tools, MCP servers, hooks, the status line, `apiKeyHelper`, and **mods** all run outside the sandbox. For a single boundary, use a devcontainer or VM. [sandbox-environments](https://code.claude.com/docs/en/sandbox-environments)

### 2.7 Hooks

- **Events.**
  - Session: `SessionStart`, matched by `startup`, `resume`, `clear`, `compact` or `fork`; `Setup`; `SessionEnd`, which has a 1.5-second budget.
  - Prompt: `UserPromptSubmit`, `UserPromptExpansion`.
  - Tool: `PreToolUse`, `PermissionRequest`, `PermissionDenied`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`.
  - Agents and tasks: `SubagentStart/Stop`, `TaskCreated/Completed`, `TeammateIdle`.
  - Stop: `Stop`, `StopFailure`.
  - Environment: `InstructionsLoaded`, `ConfigChange`, `CwdChanged`, `DirectoryAdded`, `FileChanged`, `WorktreeCreate/Remove`.
  - Compaction: `PreCompact` (can block), `PostCompact`.
  - Model and display: `PreModelSwitch`, `PostModelSwitch`, `Elicitation(Result)`, `MessageDisplay`, `Notification`.

  [hooks](https://code.claude.com/docs/en/hooks)
- **Handlers.**
  - Types are `command` (with `args` for an exec form that needs no shell), `http`, `mcp_tool`, `prompt` (single LLM judgment returning `{"ok":…, "reason":…}`) and `agent`. Agent hooks are experimental, get 50 tool turns, and default to a 60-second timeout.
  - Default timeouts are 600 seconds for command, http and mcp_tool, 30 for prompt and 60 for agent.
  - `if` takes one permission-style filter, for example `Bash(git *)`.
  - `async` runs a hook in the background, and `asyncRewake` wakes Claude when an async hook exits 2.
  - `once` is honoured in skill frontmatter only.
  - All matching hooks run in parallel.
- **Exit codes and output.**
  - Exit 0 means success. Stdout becomes context only for `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart` and `PostModelSwitch`.
  - Exit 2 blocks, with stderr as the reason. Any other exit code is a non-blocking error unless `onFailure: "block"` is set.
  - `PreToolUse` returns `hookSpecificOutput.permissionDecision` of `allow`, `deny`, `ask` or `defer`, with precedence deny > defer > ask > allow. It can also return `updatedInput` and `additionalContext`.
  - A hook's `ask` forces a prompt even in auto mode.
  - `defer` works only in `-p` and suits SDK-hosted UIs.
- **Stop hooks.**
  - Input includes `stop_hook_active`, `last_assistant_message`, `background_tasks` and `session_crons`.
  - The 8-consecutive cap resets on each tool call. Raise it with `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`.
  - `/goal` is the built-in shortcut: "a session-scoped prompt-based Stop hook".
- **Matchers.** A plain `Edit|Write` matches those exact names. Any other character switches to an unanchored JavaScript regular expression, so `Edit.*` also matches `NotebookEdit`.
- **Where hooks live.** User, project, local and managed settings; plugin `hooks/hooks.json`; skill and agent frontmatter. They merge, and `disableAllHooks` cannot disable managed hooks. `allowManagedHooksOnly` blocks user, project, local and plugin hooks, except hooks from plugins force-enabled in managed settings.
- **Canonical recipes in the docs.**
  - Desktop notification on `Notification`.
  - `PostToolUse` running Prettier on `Edit|Write`.
  - `PreToolUse` protect-files script that exits 2.
  - `SessionStart:compact` to re-inject context.
  - Prompt-based or agent-based Stop hook: "Verify that all unit tests pass."
  - HTTP audit hook.

  [hooks-guide](https://code.claude.com/docs/en/hooks-guide)

### 2.8 Subagents, background work, teams, workflows and worktrees

- **Built-in subagents.**
  - **Explore**: read-only. It skips CLAUDE.md, runs at a thoroughness of quick, medium or "very thorough", and uses the main model; on Fable sessions it uses Opus.
  - **Plan**: read-only, used in plan mode.
  - **general-purpose**: all tools.
  - Helpers: `claude`, which is the default agent for background sessions, plus `statusline-setup` and `claude-code-guide`.
  - Remove Explore and Plan with `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS=1`.

  [sub-agents](https://code.claude.com/docs/en/sub-agents)
- **Frontmatter fields.**
  - `name` and `description` are required.
  - Optional: `tools`, `disallowedTools`, `model` (`sonnet`, `opus`, `haiku`, `fable`, a full ID or `inherit`), `permissionMode` (ignored in auto mode), `maxTurns`, `skills` (preloaded in full, at most 32), `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation: worktree`, `color`, `initialPrompt`, `omitClaudeMd` (v2.1.271), `experimental.cacheTtl`, and `autoCompactWindow` (v2.1.296).
- **Model resolution order.** The per-call model, then frontmatter, then `CLAUDE_CODE_SUBAGENT_MODEL`, then the main model. `…_FORCE=1` forces one model on all subagents.
- **Scope priority.** Managed > `--agents` JSON > `.claude/agents/` > `~/.claude/agents/` > plugin.
- **Runtime defaults (interactive).**
  - Background subagents and fork mode are on (v2.1.232).
  - Nesting depth is 3, changed with `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`.
  - Concurrency is 20, changed with `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`.
  - Background permission prompts surface in the main session (v2.1.186).
  - `/subtask <task>` starts a fork that inherits the full conversation and shares the prompt cache. `/fork` copies the session into a background session. `/branch` branches the conversation in place.
  - `/tasks` lists background work, and Ctrl+B backgrounds a running task.
- **Agent view** (research preview, v2.1.139, 11 May 2026).
  - `claude agents` opens one table grouped into Needs input, Working and Completed.
  - `claude --bg "task"`, `--agent <name> --bg`, and `claude attach|logs|stop|rm <id>` manage sessions; `--bg --exec 'pytest -x'` starts a shell job.
  - Dispatched sessions move into their own worktree before editing.
  - Background sessions are local and stop when the machine shuts down. Each one consumes quota independently.

  [agent-view](https://code.claude.com/docs/en/agent-view)
- **Agent teams.** Still "experimental and disabled by default", enabled with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
  - A lead coordinates teammates through a shared task list and messaging.
  - Teammates do not get worktree isolation, so partition files between them.
  - There are known resume and shutdown limitations.

  [agent-teams](https://code.claude.com/docs/en/agent-teams)
- **Dynamic workflows** (v2.1.154, 28 May 2026; the keyword was renamed to `ultracode` in v2.1.160).
  - Claude writes a JavaScript orchestration script (`agent()`, `parallel()`, `pipeline()`). The script runs in an isolated runtime and is saved under `~/.claude/projects/` so it can be resumed and re-run.
  - Limits: 16 concurrent agents (up to 256 via env), 4,096 items per `parallel()`, 1,000 agents per run.
  - A "Large workflow" warning appears above 25 agents or 1.5M projected tokens.
  - `/deep-research` is the bundled workflow.
  - On Pro, workflows must be enabled in `/config`.

  [workflows](https://code.claude.com/docs/en/workflows)
- **Worktrees.**
  - `claude -w <name>` takes a name, `#PR`, or a PR or MR URL, and creates `.claude/worktrees/<name>` on branch `worktree-<name>`.
  - `.worktreeinclude` copies gitignored files such as `.env`.
  - `worktree.baseRef` chooses `fresh` (origin default branch) or `head`, and `worktree.sparsePaths` serves monorepos.
  - `WorktreeCreate` and `WorktreeRemove` hooks support non-git version control.
  - `/batch` splits one change across 5–30 worktree-isolated subagents.

  [worktrees](https://code.claude.com/docs/en/worktrees)
- **Cross-session messaging** (v2.1.224, 7 Aug 2026). `SendMessage` and `ListAgents` connect your sessions across machines and the cloud. `crossSessionInbound` controls what is accepted, and a held-for-approval safeguard applies in bypass mode. [cross-session-messaging](https://code.claude.com/docs/en/cross-session-messaging)

### 2.9 Skills, plugins, marketplaces, mods and output styles

- **Skills** follow the open [Agent Skills](https://agentskills.io) standard.
  - Locations: enterprise, `~/.claude/skills/`, `.claude/skills/` (including nested directories and those added with `--add-dir`), plugins, and claude.ai account sync (v2.1.275; opt out with `syncClaudeAiSkills: false`).
  - Frontmatter: `name`, `description`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools` (granted for the invoking turn only), `disallowed-tools`, `model`, `effort`, `context: fork` with `agent`, `background` (forked skills run in the background by default since v2.1.218), `hooks`, `paths`, and `shell`.
  - Substitutions: `$ARGUMENTS`, `$0`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_EFFORT}` and others. `` !`cmd` `` injects live command output.
  - Skills hot-reload. `/reload-skills` and `/skill-doctor` (v2.1.261), which shows each skill's context cost and usage, help manage them.
  - **Security note:** a project skill's `allowed-tools` is *not gated by workspace trust*, even under `-p`.

  [skills](https://code.claude.com/docs/en/skills)
- **Bundled skills.** `/code-review [low…max|ultra] [--fix] [--comment]` (renamed from `/simplify` in v2.1.147; `/simplify` now means a separate cleanup skill), `/batch`, `/debug`, `/loop`, `/verify`, `/run`, `/claude-api`, `/fewer-permission-prompts`, `/doctor`, `/security-review` and `/deep-research`. [commands](https://code.claude.com/docs/en/commands)
- **Plugins** (2.0.12, 9 Oct 2025) bundle skills, agents, hooks, MCP and LSP servers, monitors and output styles.
  - The **official marketplace `claude-plugins-official` is auto-added** at first launch.
  - Optional marketplaces: `claude-community` (from anthropics/claude-plugins-community) and the demo `claude-code-plugins`.
  - Commands: `/plugin install x@claude-plugins-official`, and `claude plugin install x --marketplace <src>` (v2.1.292), which adds the marketplace on the fly.
  - Tooling: `claude plugin init`, `validate --json`, `details` (shows projected token cost) and `eval` (v2.1.269).
  - Teams use `extraKnownMarketplaces` and `enabledPlugins` in committed settings.

  [anthropic-marketplaces](https://code.claude.com/docs/en/plugins/anthropic-marketplaces)
- **Claude Mods** (v2.1.287, 1 Oct 2026).
  - Mods are "plugins [that] may now modify deeper behavior": JavaScript or TypeScript handlers for events such as `tool.check`, `prompt.submit`, `agent.spawn`, `ui.render` and `turn.step`, plus APIs like `$.model.complete`, `$.http.fetch` and `$.ui.notify`.
  - Built-in mods include `cc-plugin-diff` (`/diff`), `cc-plugin-agents-md`, `cc-plugin-telemetry`, `cc-plugin-sec-default` and the opt-in `cc-plugin-you-should-know`.
  - Inspect a mod before installing with `claude plugin validate ./mod`, which lists its `hooks:` and `calls:`.
  - Stop mods with `--safe-mode` for a session, `disableAllHooks`, or the admin setting `allowManagedModsOnly`.
  - Samples live in [claude-code-playground/mods](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods).

  [mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- **Output styles.** Default plus four built-ins: **Proactive**, **Concise** (v2.1.237), **Explanatory** and **Learning**. Custom styles are Markdown files. `outputStyle` changes take effect from the next message (v2.1.251+), and `/output-style` returned in v2.1.269. [output-styles](https://code.claude.com/docs/en/output-styles)

### 2.10 MCP

- **Scopes.** `local` (the default, in `~/.claude.json` per project), `project` (`.mcp.json`, committed, needs approval and trust) and `user`. Admins have `managedMcpServers` (v2.1.259), `allowedMcpServers` (match by URL) and `allowManagedMcpServersOnly`. [mcp](https://code.claude.com/docs/en/mcp)
- **Tool search.**
  - On by default since v2.1.7 (14 Jan 2026), when it started as a threshold.
  - Now every MCP tool is deferred unless `ENABLE_TOOL_SEARCH=false` or `auto:N` is set, or the session runs behind a non-first-party `ANTHROPIC_BASE_URL`.
  - `alwaysLoad: true` per server (v2.1.121) or `_meta["anthropic/alwaysLoad"]` per tool exempts tools that are needed every turn.
- **Output.** A warning appears above 10K tokens. `MAX_MCP_OUTPUT_TOKENS` defaults to 25K, and text over 50K characters is saved to a file. `_meta["anthropic/maxResultSizeChars"]` allows up to 500K.
- **Authentication and elicitation.** `claude mcp login <name>` (v2.1.186) works over SSH with `--no-browser`. Elicitation (Mar 2026) lets servers request input; URL-mode elicitation arrived on the MCP 2026-07-28 protocol.
- **Connectors.** claude.ai connectors are available in Claude Code (v2.1.46).
- **MCP versus CLI versus skills.**
  - "CLI tools are the most context-efficient way to interact with external services" ([best practices](https://code.claude.com/docs/en/best-practices)).
  - CLIs "are still more context-efficient than MCP servers because they don't add any per-tool listing" ([costs](https://code.claude.com/docs/en/costs)).
  - Use MCP for systems that have no CLI or that need authenticated stateful access, such as Figma, Notion or databases.
  - Use skills for procedures, and hooks to pre-filter output.

### 2.11 Context management

- **Inspecting usage.** `/context [all]` shows a grid with suggestions. The status line exposes `context_window.used_percentage`.
- **Compacting.**
  - `/compact <focus>` summarises with a focus. `/autocompact <N>` sets the threshold per model.
  - On the rewind menu (Esc Esc), "Summarize from here" and "Summarize up to here" do partial compaction.
  - `/clear` starts fresh, and `/rewind` can return to a pre-`/clear` session (v2.1.191).
  - `/btw` asks a side question that never enters history.
- **What survives compaction.**
  - Re-injected: the project-root CLAUDE.md, auto memory, the plan file, and up to 5 recently read files (each under 5K tokens).
  - Skills are re-injected at no more than 5K tokens each and 25K in total.
  - Path rules and nested CLAUDE.md files are summarised away.

  [context-window](https://code.claude.com/docs/en/context-window)
- **Checkpoints.**
  - A checkpoint is taken for every prompt, and the last 100 are kept with the session.
  - Bash-made changes and background-subagent edits are **not tracked**; use git for those.
- **Prompt caching.** Switching models or effort mid-session triggers a cold cache. `promptCacheTtl` and `subagentPromptCacheTtl` set the cache lifetime (`5m` or `1h`). `/usage` and the status line `prompt_cache` show the hit ratio and miss causes (v2.1.251/260). [prompt-caching](https://code.claude.com/docs/en/prompt-caching)
- **Context editing (unverified).** I found no Claude Code doc that describes API-style "context editing" (clearing tool results). Claude Code manages context through compaction, deferred tools and subagents instead.

### 2.12 Surfaces and integrations

| Surface | What it offers (Oct 2026) |
| :- | :- |
| CLI | The full feature set. Fullscreen renderer (`/tui`, `/focus`, a `/diff` panel since v2.1.260), vim mode, voice (`/voice` hold or tap, 20 languages, no token cost) |
| Desktop app (macOS, Windows, Linux beta) | Code tab, parallel sessions, in-app browser, iOS Simulator pane (beta), computer use and Dispatch on Pro and Max. `claude --desktop` and `/desktop` hand a session off |
| VS Code and JetBrains | Native VS Code extension since 2.0.0 (29 Sep 2025), with mode picker and Focus view. JetBrains runs the CLI in the IDE terminal |
| Cloud sessions (claude.ai/code) | `claude --cloud "task"` (formerly `--remote`) and `--teleport` to pull a session back. Auto-fix PRs with `/autofix-pr`. Self-hosted runners for Team and Enterprise (v2.1.224) |
| Mobile, Remote Control, Dispatch | `/remote-control` (Feb 2026) drives a local session from a phone. Push notifications. Projects coordinate cloud threads (Pro and Max beta) |
| Slack | Legacy per-user "Claude Code in Slack" for Pro and Max. **Claude Tag** is the organisation's shared @Claude identity on Team and Enterprise |
| Chrome | Claude in Chrome became GA on direct plans in the week of 29 Jun 2026. Uses your logged-in browser; classifier-checked in auto mode |
| GitHub Actions | `anthropics/claude-code-action@v1`, set up with `/install-github-app`. Example workflows for `@claude` mentions and for running `/code-review --comment` via `plugins:` and `claude_args` |
| Managed Code Review | Team and Enterprise research preview. Multi-agent PR review, "averages $15-25" per review, billed to usage credits. Tune with `REVIEW.md` |
| `/ultrareview` | Cloud multi-agent review. 3 free runs on Pro and Max. `claude ultrareview` for CI |
| Agent SDK | TypeScript and Python libraries that run the Claude Code binary, with tools, hooks, subagents, MCP, permissions, sessions, skills and plugins. Third parties may not offer claude.ai login |

Sources: [platforms](https://code.claude.com/docs/en/platforms), [code-review](https://code.claude.com/docs/en/code-review), [github-actions](https://code.claude.com/docs/en/github-actions), [Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview).

### 2.13 Automation

- **`/loop [interval] [prompt]`.**
  - With no interval, the loop self-paces.
  - With no prompt, it runs `loop.md` or a maintenance prompt.
  - Recurring tasks expire after 7 days.
  - The `CronCreate`, `CronList` and `CronDelete` tools and `ScheduleWakeup` sit underneath.
  - `/usage` shows a per-loop token breakdown (v2.1.243).

  [scheduled-tasks](https://code.claude.com/docs/en/scheduled-tasks)
- **Routines** (research preview).
  - A routine is a saved prompt plus repositories and connectors, run in the cloud.
  - Triggers: schedule, API POST (with an experimental beta header) or GitHub event. Create them with `/schedule` or at claude.ai/code/routines.
  - Limits: 100 scheduled runs per hour, and 30 "Run now" or API fires per hour per routine.

  [routines](https://code.claude.com/docs/en/routines)
- **`/goal <condition>`** (v2.1.139). After each turn a model checks whether the condition holds. Use it for things like "until every call site compiles and tests pass". [goal](https://code.claude.com/docs/en/goal)
- **Monitor and channels.**
  - The **Monitor** tool (v2.1.98) streams background script output. Its deadlines are at most 30 minutes, and 10 minutes in `-p`.
  - **Channels** (research preview, v2.1.80) push Telegram, Discord or iMessage messages, or your own server's events, into a session.

### 2.14 New Jun–Oct 2026, with third-party claims checked against primary sources

| Third-party claim | Verdict | What the primary sources say |
| :- | :- | :- |
| Agent View (Aug 2026) | **Date wrong** | Research preview from **v2.1.139, 11 May 2026**, with continuous changes since. ([agent-view](https://code.claude.com/docs/en/agent-view)) |
| Background Agents | Partly right | `claude --bg` and background sessions shipped in May 2026. Subagents became background by default in the week of 29 Jun 2026. |
| /doctor (Aug 2026) | **Date off** | Full setup checkup with `/checkup` alias in the week of 6–10 Jul 2026 (v2.1.205). `/doctor prompt-audit` arrived 25 Sep (v2.1.283). |
| Artifacts (Aug 2026) | **Date off** | Beta for Team and Enterprise in the week of 15–19 Jun 2026; MCP-connector artifacts and public links in the week of 13–17 Jul. Now available on all paid plans. ([artifacts](https://code.claude.com/docs/en/artifacts)) |
| "Claude Mods" (Oct 2026) | **Confirmed** | v2.1.287, 1 Oct 2026. |
| "You Should Know" agent | **Confirmed** | Built-in, opt-in mod in v2.1.287. First-party sessions with telemetry on only. |
| Plugin install from marketplaces | **Confirmed** | `--marketplace <source>` on `/plugin install` (v2.1.275) and on `claude plugin install` (v2.1.292, 6 Oct). |
| Sub-agent effort control | **Confirmed** | Agent tool `effort` parameter (v2.1.292). The frontmatter `effort` field is older. |
| Lost-work recovery | Probably refers to the Ctrl+C draft recovery | v2.1.288 (2 Oct): Up brings back a prompt cleared with Ctrl+C. Also `/rewind` past `/clear` (v2.1.191). |
| Haiku 5.5 1M-context default | **Confirmed, with a correction** | v2.1.293 (7 Oct). It is the default **Haiku** model, not the session default. |
| Opus 5.5 becomes default (late Sep) | **Confirmed** | v2.1.280, 22 Sep. All plans moved to Opus. |

Other Jun–Oct changes worth knowing:

- **Sonnet 5** (30 Jun). Introductory pricing of $2/$10 was later made permanent.
- **Opus 5** (24 Jul).
- **Fable 5.1** (1 Sep).
- **Sonnet 5.5** (28 Sep).
- **Self-hosted cloud environments** (7 Aug).
- **`--restricted` mode** (v2.1.248).
- **Claude apps gateway** for Bedrock, Vertex and Foundry, with spend limits.
- **`/import`** from Codex, Gemini and Cursor.
- **`/ultraplan` removed** (v2.1.222).
- **Task and Todo tools hidden** on Opus 4.8 and Sonnet 5 and later. `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` restores them.

---

## 3. Concrete practices and configs worth copying

All keys below exist in the current [settings reference](https://code.claude.com/docs/en/settings-reference). Settings files are strict JSON with no comments, so the notes follow each block.

### 3.1 Personal `~/.claude/settings.json`

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "autoUpdatesChannel": "stable",
  "cleanupPeriodDays": 60,
  "fallbackModel": ["sonnet", "haiku"],
  "outputStyle": "Concise",
  "spinnerTipsEnabled": false,
  "preferredNotifChannel": "terminal_bell",
  "permissions": {
    "defaultMode": "auto",
    "allow": [
      "Bash(git status *)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ],
    "ask": [
      "Bash(git push *)",
      "Bash(dangerouslyDisableSandbox:true)"
    ],
    "deny": [
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Read(~/.config/gh/**)",
      "Read(//**/.env)",
      "Read(//**/.env.*)"
    ]
  },
  "sandbox": {
    "enabled": true,
    "credentials": {
      "files": [
        { "path": "~/.aws/credentials", "mode": "deny" },
        { "path": "~/.ssh", "mode": "deny" }
      ],
      "envVars": [
        { "name": "NPM_TOKEN", "mode": "deny" }
      ]
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
        "hooks": [ { "type": "command", "command": "notify-send 'Claude Code' 'Needs your attention'" } ]
      }
    ]
  }
}
```

- **Mode choice.** `defaultMode: "auto"` is already the built-in default on v2.1.283+. Setting it explicitly matters only in user or managed scope, because project files ignore it.
  - If you prefer approving actions yourself, use `"default"` and run `/sandbox` set to auto-allow. That is the official "fewer prompts without a classifier" setup.
- **`ask` rules.** These stay prompts in auto mode. `Bash(dangerouslyDisableSandbox:true)` makes every sandbox-escape retry ask you.
- **Deny breadth.** `Read(//**/.env.*)` also blocks `.env.example`. Add a carve-out such as `Read(!.env.example)` in the same list if needed.
- **Sandbox trade-off.** Denying `~/.ssh` breaks git-over-SSH inside the sandbox. Either use HTTPS remotes or accept the unsandboxed retry prompt.
- **On macOS** the Notification command is `osascript -e 'display notification "…" with title "Claude Code"'`.

### 3.2 Team `.claude/settings.json`, committed (format, gate, protect, re-inject)

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
        "hooks": [ { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/guard-bash.sh", "args": [] } ] },
      { "matcher": "Edit|Write",
        "hooks": [ { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/protect-files.sh", "args": [] } ] }
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [ { "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write --ignore-unknown" } ] }
    ],
    "Stop": [
      { "hooks": [ { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/require-green.sh", "args": [], "timeout": 900 } ] }
    ],
    "SessionStart": [
      { "matcher": "compact",
        "hooks": [ { "type": "command", "command": "echo 'Reminder: use npm scripts; run typecheck + affected tests before finishing; never hand-edit db/migrations.'; git log --oneline -5" } ] }
    ]
  },
  "plansDirectory": "./plans"
}
```

- **Exec form.** `"args": []` selects exec form, which the docs recommend for path placeholders.
- **Worktrees.** `${CLAUDE_PROJECT_DIR}` stays at the main checkout inside a worktree. Scripts should `cd` into the input's `cwd`.
- **Trust.** `deny` and `ask` apply immediately. `allow` rules and `additionalDirectories` wait until each teammate trusts this exact folder. Hooks in settings files behave differently: they already run when only a parent folder is trusted, and in `-p` and SDK runs ([permissions](https://code.claude.com/docs/en/permissions)).
- **The Prettier hook** is the official recipe plus `--ignore-unknown`.
- **`protect-files.sh`** is the docs example: it exits 2 on `.env`, `package-lock.json` or `.git/`.

`.claude/hooks/guard-bash.sh`. This escalates to a human instead of hard-failing. `ask` works even in auto mode, and a `PreToolUse` `deny` beats bypass mode.

```bash
#!/usr/bin/env bash
IN=$(cat)
CMD=$(jq -r '.tool_input.command // empty' <<<"$IN")
if grep -Eq '(rm[[:space:]]+-[a-zA-Z]*r[a-zA-Z]*f|git[[:space:]]+push[^;&|]*(--force|-f)\b|curl[^|]*\|[[:space:]]*(ba|z)?sh|terraform[[:space:]]+destroy)' <<<"$CMD"; then
  jq -n --arg r "guard-bash: destructive/remote-exec pattern: $CMD" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:$r}}'
fi
exit 0
```

`.claude/hooks/require-green.sh`. This is a Stop gate that keeps Claude working until typecheck and tests pass, with a retry cap per session.

```bash
#!/usr/bin/env bash
IN=$(cat)
cd "$(jq -r '.cwd' <<<"$IN")" || exit 0
SID=$(jq -r '.session_id' <<<"$IN"); CNT="${TMPDIR:-/tmp}/claude-stop-$SID"
git diff --quiet HEAD -- 2>/dev/null && exit 0          # nothing changed: allow stop
N=$(cat "$CNT" 2>/dev/null || echo 0); [ "$N" -ge 5 ] && exit 0
if OUT=$(npm run -s typecheck 2>&1 && npm test --silent 2>&1); then rm -f "$CNT"; exit 0; fi
echo $((N+1)) > "$CNT"
{ echo "Checks failing; fix before finishing:"; tail -n 40 <<<"$OUT"; } >&2
exit 2   # Stop + exit 2 = keep working; stderr becomes Claude's instruction
```

Why a manual counter: the built-in 8-continuation cap only counts continuations *without tool calls*, so a gate that never passes can loop for a long time. Lighter alternatives are `/goal all tests pass and typecheck is clean`, or a `type: "agent"` Stop hook, which is experimental.

### 3.3 Status line `~/.claude/statusline.sh`

Uses only documented fields.

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

### 3.4 Subagent `.claude/agents/verifier.md`

```markdown
---
name: verifier
description: Independent verifier. Use proactively after any non-trivial change to check the diff against the user's request, run the relevant tests, and report concrete failures with file:line. Never edits code.
tools: Read, Grep, Glob, Bash
model: sonnet
effort: high
maxTurns: 40
memory: project
color: green
---
You are a skeptical verifier. You did not write this code.
1. Run `git diff HEAD` and restate in one line what the change claims to do.
2. Run only the tests that cover the touched files; then typecheck.
3. Check edge cases the diff ignores (null/empty, error paths, concurrency, auth).
4. Report: PASS/FAIL, then failures as `file:line — problem — evidence (command + output excerpt)`.
Consult your memory for recurring failure patterns in this repo first; record new ones after.
```

- **Format.** The format follows the docs' read-only `code-reviewer` example.
- **Memory.** `memory: project` writes to `.claude/agent-memory/verifier/`, which the docs call "the recommended default scope".
- **Model.** Sonnet 5.5 is half the price of Opus 5.5 per token.
- **Overrides.** Claude can override the model and effort per call (v2.1.292).

### 3.5 Skill `.claude/skills/ship/SKILL.md`

```markdown
---
name: ship
description: Prepare the current branch for review (run checks, commit, push, open a draft PR). Use when the user says "ship it" or asks to open a PR.
argument-hint: "[PR title]"
disable-model-invocation: true
allowed-tools: Bash(git status *) Bash(git diff *) Bash(git add *) Bash(git commit *) Bash(gh pr create *) Bash(npm run lint) Bash(npm test *)
effort: high
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

- **Invocation.** `disable-model-invocation` keeps the description out of every request, so the skill runs only when you call it.
- **Permissions.** `allowed-tools` applies to the invoking turn only. In auto mode, `` !`…` `` commands follow Manual-mode rules (v2.1.271), so keep them read-only.

### 3.6 CLAUDE.md skeleton, kept under 200 lines

```markdown
# <project>: instructions for Claude
<!-- Maintainers: block HTML comments are stripped before Claude sees this file. Keep < 200 lines. -->

## Commands
- Install `pnpm install` · Dev `pnpm dev` (:3000) · Typecheck `pnpm typecheck` · Lint `pnpm lint --fix`
- Test one file: `pnpm vitest run <path>` (prefer single files over the whole suite)

## Architecture (only what the code doesn't make obvious)
- `apps/web` Next.js UI; `services/api` Fastify; shared types in `packages/types`: never duplicate them.
- Feature flags: read via `getFlag()` in `config/flags.ts`, never `process.env`.

## Conventions that differ from defaults
- Named exports only. Throw `AppError` subclasses; never return `{ error }`.

## Workflow
- Before declaring done: typecheck + affected tests, and quote the result.
- Use plan mode for anything under `src/billing/`.
- Conventional Commits; never commit to `main`.

## Gotchas
- Integration tests need `docker compose up db` first. `pnpm build` takes ~4 min: don't use it to validate small edits.

## Compact instructions
When compacting, preserve: modified files, failing test names, current plan.
```

Pair the skeleton with path-scoped rules in `.claude/rules/api.md`:

```markdown
---
paths:
  - "services/api/**/*.ts"
---
- Validate all handler input with zod schemas from `services/api/schemas/`.
- Use the standard error envelope; add OpenAPI comments.
```

- **If the repo already has `AGENTS.md`.** Make the first line of CLAUDE.md `@AGENTS.md` and keep only Claude-specific additions below it.

### 3.7 Headless and CI

```bash
# Locked-down, scriptable run (needs ANTHROPIC_API_KEY or apiKeyHelper under --bare)
claude --bare -p "Run the tests and fix failures in src/ only" \
  --permission-mode dontAsk --allowedTools "Read" "Edit" "Bash(npm test *)" \
  --max-turns 30 --max-budget-usd 5 --output-format json | jq -r '.result, .total_cost_usd'

# Structured output
claude --bare -p "List exported functions in src/lib" --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}' \
  | jq '.structured_output'

# Unattended auto mode: anything that would prompt is denied, the classifier still decides
claude -p "Update dependency pins and run tests" --permission-mode auto --permission-prompts none
```

For GitHub, start from the docs workflow: `anthropics/claude-code-action@v1` with `anthropic_api_key`, permissions `contents/pull-requests/issues: write`, `id-token: write` and `actions: read`, and optionally `plugins: "code-review@claude-code-plugins"` with `prompt: "/code-review:code-review --comment …"`. [github-actions](https://code.claude.com/docs/en/github-actions)

### 3.8 Environment variables worth knowing

All of these appear in the docs.

| Variable | Effect |
| :- | :- |
| `CLAUDE_CODE_SUBAGENT_MODEL=haiku` with `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` | Run every subagent cheaply |
| `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` | Subagent nesting depth (default 3) |
| `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` | Concurrent subagents (default 20) |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW=200000` | Compact at 200K; use behind gateways that cap at that size |
| `ENABLE_TOOL_SEARCH=auto:5` | Load MCP tools up front while their definitions are under 5% of context |
| `MAX_MCP_OUTPUT_TOKENS` | MCP output limit (default 25K) |
| `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` | Stop-hook continuation cap (default 8) |
| `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` | Strip Anthropic and cloud credentials from Bash, hook and MCP subprocesses |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | Enable agent teams |
| `CLAUDE_CODE_NEW_INIT=1` | Interactive `/init` flow |

---

## 4. Disagreements, caveats and failure modes

- **The docs disagree with themselves on two points.**
  - *Auto-mode default version.* Docs say v2.1.283. The changelog's "every plan and provider" line is in v2.1.284; v2.1.283 covered third-party providers and telemetry-off sessions.
  - *Sonnet 5.5 default effort.* Claude Code docs say `medium`; the platform models table lists the API default as `high`. Claude Code's own setting governs inside the CLI.
  - *Auto mode in `-p` after repeated blocks.* The Mar 2026 engineering post says headless runs "terminate instead". The current docs say the blocked action is skipped and "Claude Code doesn't stop the run". Treat the docs as current.
- **The safety layers are probabilistic or bypassable.**
  - CLAUDE.md and output styles are advisory.
  - The hook `if` filter is "best-effort".
  - Bash rules match commands as written, so `git -C . push` escapes them.
  - Read and Edit denies miss indirect readers.
  - Auto mode's own reported miss rate on overeager actions is **17%**, and conversational boundaries can be compacted away. Anthropic: auto mode is not "a drop-in replacement for careful human review on high-stakes infrastructure". [engineering post](https://www.anthropic.com/engineering/claude-code-auto-mode)
- **The supply-chain surface is growing.**
  - `-p` without `--bare` runs a repo's hooks and `.mcp.json` with no trust dialog.
  - Project skills' `allowed-tools` ignore workspace trust.
  - **Mods run unsandboxed with your permissions.** They can approve tool calls, override your `PreToolUse` blocks (not managed ones), and in documented cases approve calls a deny rule refuses.
  - Review with `claude plugin validate` and pin trusted marketplaces through `strictKnownMarketplaces`.
  - Before running `claude -p` on a repository you didn't write, the docs recommend `--setting-sources user`, `--bare`, or `--settings '{"disableAllHooks": true}'`. A user-level `disableAllHooks` alone isn't enough, because project settings outrank it.
- **Context illusions.**
  - `@imports` do not save tokens.
  - Path-scoped rules vanish on compaction until a matching file is touched again.
  - Skill bodies over 5K tokens are truncated after compaction, so put the critical lines first.
  - Only `ultrathink` is a keyword.
- **Checkpoint gaps.** `/rewind` does not undo Bash-made changes, background or forked-skill edits, or symlinked files. Commit often.
- **Cost traps.**
  - Agent teams, ultracode and dynamic workflows multiply tokens.
  - Ten background sessions use roughly ten times the quota.
  - Fable may bill usage credits, and `-p` does so without asking.
  - Code Review averages $15–25 per PR.
- **API churn.**
  - `/simplify` became `/code-review` and then came back as a separate cleanup skill.
  - `/fork` semantics changed: it now copies the session to the background, and `/subtask` is the in-session fork.
  - `/agents` lost its wizard.
  - `TaskOutput` was removed.
  - Todo tools are hidden on new models.
  - Pin `stable` and read the changelog before upgrading shared team configs.
- **Docs can lag the changelog.** For example, the MCP page still says descriptions are capped at 2,048 characters, but v2.1.296 raised the cap to 4,096. When they disagree, trust the dated changelog.
- **Platform gaps.** No native sandbox on Windows. Voice is unavailable over SSH. Remote Control, Projects and Routines need a claude.ai login, not an API key.

---

## 5. Key dates (version and feature timeline)

Dates are from the docs changelog. Early 0.2.x dates are npm publish dates.

| Date | Version | Milestone |
| :- | :- | :- |
| 24 Feb 2025 | 0.2.6 | Research-preview launch (first npm publish) |
| Mar 2025 | 0.2.44–0.2.54 | think/ultrathink, auto-compact, Shift+Tab auto-accept, `.mcp.json` project scope, WebFetch, `#` memory |
| 30 Apr–9 May 2025 | 0.2.93–0.2.107 | `--continue`/`--resume`, Todo list, web search, CLAUDE.md `@imports` |
| 22 May 2025 | 1.0.0 | GA with Sonnet 4 and Opus 4 |
| 16 Jun 2025 | 1.0.23 | TypeScript and Python SDK |
| 30 Jun 2025 | 1.0.38 | Hooks |
| 24 Jul 2025 | 1.0.60 | Custom subagents (`/agents`) |
| 7–22 Aug 2025 | 1.0.71–1.0.86 | Status line, opusplan, output styles, SessionEnd hook, `/context` |
| 29 Sep 2025 | 2.0.0 | Native VS Code extension, `/rewind` checkpoints, `/usage`, Agent SDK rename, `--agents` |
| 9 Oct 2025 | 2.0.12 | Plugins and marketplaces |
| 15–16 Oct 2025 | 2.0.17 / 2.0.20 | Haiku 4.5 and the Explore subagent; Skills |
| 20 Oct 2025 | 2.0.24 | Bash sandbox; web-to-CLI teleport (Claude Code on the web) |
| 27–30 Oct 2025 | 2.0.28 / 2.0.30 | Plan subagent; prompt-based Stop hooks |
| 18–24 Nov 2025 | 2.0.45 / 2.0.51 | PermissionRequest hook, `&` sends to cloud; Opus 4.5 |
| 10–19 Dec 2025 | 2.0.64–2.0.74 | `.claude/rules/`, Claude in Chrome (beta), LSP tool |
| 7–14 Jan 2026 | 2.1.0 / 2.1.7 | Skill hot-reload, `context: fork`, Ctrl+B backgrounding; MCP tool search on by default |
| 5–7 Feb 2026 | 2.1.32–2.1.36 | Opus 4.6, agent teams (experimental), fast mode |
| 17–24 Feb 2026 | 2.1.45–2.1.51 | Sonnet 4.6 with 1M context, `--worktree`, `isolation: worktree`, `claude remote-control` |
| 26–28 Feb 2026 | 2.1.59 / 2.1.63 | Auto memory; `/batch`, HTTP hooks |
| 7–26 Mar 2026 | 2.1.71–2.1.84 | `/loop` and cron, `/effort`, MCP elicitation, channels, auto mode (24 Mar blog), PowerShell tool |
| 1–16 Apr 2026 | 2.1.89–2.1.111 | `defer` decision, computer use in CLI, Monitor tool, Routines, Opus 4.7, `xhigh`, `/ultrareview` |
| 11 May 2026 | 2.1.139 | Agent view, `/goal`, hook `args` exec form |
| 21–28 May 2026 | 2.1.147 / 2.1.154 | `/code-review`; dynamic workflows, Opus 4.8 |
| 2–15 Jun 2026 | 2.1.160–2.1.178 | `ultracode` keyword, `--safe-mode`, `/cd`, Fable 5 (9 Jun), `Tool(param:value)` rules, Artifacts beta |
| 30 Jun–3 Jul 2026 | 2.1.197–2.1.200 | Sonnet 5 default; `/agents` wizard removed; background subagents; "Manual" mode name |
| 24 Jul 2026 | 2.1.219 | Opus 5 |
| 7–14 Aug 2026 | 2.1.224–2.1.233 | Cross-session messaging, self-hosted environments, auto mode default on Pro/Max/Team (14 Aug), fork mode default |
| 1–11 Sep 2026 | 2.1.257–2.1.269 | Fable 5.1, `/diff` panel, `/skill-doctor`, `maxEffortLevel`, `claude plugin eval` |
| 18 Sep 2026 | 2.1.277 | Native AGENTS.md |
| 22 Sep 2026 | 2.1.280 | **Opus 5.5 default on all plans** |
| 25–28 Sep 2026 | 2.1.283 / 2.1.284 | `/doctor prompt-audit`, auto mode default everywhere; Sonnet 5.5, ultracode toggle |
| 1 Oct 2026 | 2.1.287 | **Claude Mods**, "You should know" mod |
| 6–9 Oct 2026 | 2.1.292–2.1.296 | Agent-tool `effort`, `plugin install --marketplace`, Haiku 5.5 (7 Oct), hook `onFailure:"block"`, per-subagent `autoCompactWindow` |

---

## 6. Sources

**Changelogs and registry**

- Claude Code CHANGELOG.md — Anthropic — through 9 Oct 2026 — https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md — full feature history, read in full locally — [primary]
- Claude Code changelog (docs) — Anthropic — updated 9 Oct 2026 — https://code.claude.com/docs/en/changelog — gives a date for every version — [primary]
- npm registry for @anthropic-ai/claude-code — npm — fetched 11 Oct 2026 — https://registry.npmjs.org/@anthropic-ai/claude-code — publish times and dist-tags — [primary]
- What's new weekly digest (Weeks 13–37) — Anthropic — Mar–Sep 2026 — https://code.claude.com/docs/en/whats-new — dated feature summaries — [primary]

**Claude Code docs** — Anthropic — current as of 11 Oct 2026. Fetched as Markdown through https://code.claude.com/docs/llms.txt. All [primary].

- Memory and AGENTS.md: https://code.claude.com/docs/en/memory
- Settings precedence: https://code.claude.com/docs/en/settings
- Example settings files: https://code.claude.com/docs/en/settings-example
- Settings reference: https://code.claude.com/docs/en/settings-reference
- Permission rules: https://code.claude.com/docs/en/permissions
- Permission modes and auto mode: https://code.claude.com/docs/en/permission-modes
- Auto mode configuration: https://code.claude.com/docs/en/auto-mode-config
- Sandbox: https://code.claude.com/docs/en/sandboxing
- Isolation options: https://code.claude.com/docs/en/sandbox-environments
- Hooks reference: https://code.claude.com/docs/en/hooks
- Hook recipes: https://code.claude.com/docs/en/hooks-guide
- Subagents: https://code.claude.com/docs/en/sub-agents
- Parallelism comparison: https://code.claude.com/docs/en/agents
- Agent view: https://code.claude.com/docs/en/agent-view
- Agent teams: https://code.claude.com/docs/en/agent-teams
- Dynamic workflows and ultracode: https://code.claude.com/docs/en/workflows
- Worktrees: https://code.claude.com/docs/en/worktrees
- Cross-session messaging: https://code.claude.com/docs/en/cross-session-messaging
- Skills: https://code.claude.com/docs/en/skills
- Anthropic's plugin marketplaces: https://code.claude.com/docs/en/plugins/anthropic-marketplaces
- Mods: https://code.claude.com/docs/en/plugins/mods/overview
- Output styles: https://code.claude.com/docs/en/output-styles
- MCP and tool search: https://code.claude.com/docs/en/mcp
- Features overview and context costs: https://code.claude.com/docs/en/features-overview
- Compaction behaviour: https://code.claude.com/docs/en/context-window
- Checkpoints: https://code.claude.com/docs/en/checkpointing
- Prompt caching: https://code.claude.com/docs/en/prompt-caching
- Models, effort and 1M context: https://code.claude.com/docs/en/model-config
- Costs and limits: https://code.claude.com/docs/en/costs
- Status line JSON: https://code.claude.com/docs/en/statusline
- Headless and CI: https://code.claude.com/docs/en/headless
- CLI flags: https://code.claude.com/docs/en/cli-reference
- Slash commands: https://code.claude.com/docs/en/commands
- Surfaces: https://code.claude.com/docs/en/platforms
- Managed Code Review: https://code.claude.com/docs/en/code-review
- GitHub Actions: https://code.claude.com/docs/en/github-actions
- Cloud routines: https://code.claude.com/docs/en/routines
- `/loop` and cron: https://code.claude.com/docs/en/scheduled-tasks
- `/goal`: https://code.claude.com/docs/en/goal
- Artifacts: https://code.claude.com/docs/en/artifacts
- Best practices (also covered by Slice 1): https://code.claude.com/docs/en/best-practices
- Agent SDK: https://code.claude.com/docs/en/agent-sdk/overview

**Anthropic platform, pricing and announcements**

- Models overview — Anthropic — Oct 2026 — https://platform.claude.com/docs/en/about-claude/models/overview — IDs, prices, context and retirement dates for Fable 5.1, Opus 5.5, Sonnet 5.5 and Haiku 5.5 — [primary]
- Plans and pricing — Anthropic — fetched 11 Oct 2026 — https://claude.com/pricing — plan prices, 5-hour and weekly limit language, Max API credits, Fable at 50% of weekly limits — [primary]
- Introducing Claude Fable 5 and Mythos 5 — Anthropic — 9 Jun 2026 — https://www.anthropic.com/news/claude-fable-5-mythos-5 — Mythos-class tier, fallback classifiers, pricing — [primary]
- Claude Sonnet 5 — Anthropic — 30 Jun 2026 — https://www.anthropic.com/news/claude-sonnet-5 — pricing (made permanent 10 Aug), tokenizer note — [primary]
- Claude Code auto mode (engineering) — John Hughes, Anthropic — 25 Mar 2026 — https://www.anthropic.com/engineering/claude-code-auto-mode — classifier design, false-positive and false-negative rates — [primary]
- Auto mode announcement — Anthropic — 24 Mar 2026, updated 10 Jul 2026 — https://claude.com/blog/auto-mode — availability and GA note — [primary]
- Choosing a Claude model and effort level in Claude Code — Lydia Hallie, Anthropic — 7 Jul 2026 — https://claude.com/blog/claude-model-and-effort-level-in-claude-code — model and effort guidance — [primary]
- Use Claude Code with your Team or Enterprise plan — Anthropic Support — "updated this week" — https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan — seats and usage credits — [primary]

**Repositories referenced** — all [primary]

- https://github.com/anthropics/claude-plugins-official — official marketplace
- https://github.com/anthropics/claude-code-action — GitHub Action
- https://github.com/anthropics/sandbox-runtime — sandbox runtime
- https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods — sample mods

---

## 7. Unverified or low-confidence items

- **Model announcement posts.** I could not open Anthropic's announcement posts for **Opus 5.5, Sonnet 5.5 and Haiku 5.5** because the search budget was exhausted. Their dates are inferred from changelog dates and from the models table's "not sooner than" retirement dates. Benchmark claims for these models are not covered here.
- **Exact limit sizes.** I found no published numbers for weekly-limit sizes in hours or tokens. Anthropic publishes only relative multiples (Max 5x/20x, Premium 5x Standard) and says it "may limit your usage in other ways". The meaning of "Fable 50% of weekly limits" on Max is taken from the pricing table text without further explanation.
- **Pricing extraction.** Pricing-page details were extracted by script and summariser. The Pro, Max and Team figures and the "$100 to $200/month in API credits" line were re-checked against the raw page text.
- **Blocked posts.** Two Anthropic posts hosted on claude.dev were unreachable through the proxy: the dynamic-workflows launch post and "Spending your effort". Workflow facts rely on the docs.
- **Agent-tool naming history.** The exact version where the subagent tool was renamed from `Task` to `Agent` was not pinned down. `Task(...)` permission syntax appears in early-2026 changelog entries.
- **"Lost-work recovery".** I interpreted the aggregator's term as Ctrl+C draft recovery (v2.1.288) and `/rewind` past `/clear`. A different feature may have been meant.
- **Third-party aggregators.** I did not consult any. The checks in §2.14 are against primary sources only.
- **Context editing.** API-style tool-result clearing in Claude Code was not found in the docs. The CLI appears to rely on compaction, deferral and subagents instead.
