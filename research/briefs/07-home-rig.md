# The Home Rig: Personal Claude Code Setups from Minimal to Agent Fleet (state of the art, 2026-10-11)

**Research note (read first).** Two limits shaped this brief. (1) The shared WebSearch budget ran out after about 20 queries. (2) WebFetch only resolved github.com, raw.githubusercontent.com, \*.claude.com and anthropic.com. Every other host (ollama.com, lmstudio.ai, simonwillison.net, mitchellh.com, docs.docker.com, huggingface.co, conductor.build, vibekanban.com and others) failed DNS lookup. So the evidence comes from three places: Anthropic's living docs (all accessed 2026-10-11), GitHub READMEs and repo metadata, and a few third-party pages that appeared in search results but could not be opened. Those last ones are labeled *secondary (seen in results)*. Star counts and push dates come from the GitHub API on 2026-10-11.

## 1. Top takeaways

1. **Anthropic now ships first-party versions of most things the 2025 home-rig ecosystem was built for.** It has worktrees (`claude -w`), background sessions with agent view (`claude agents`, May 2026), and Remote Control (February 2026) with mobile push (April 2026). It added "device cards" in August 2026, so you can start a session on a home machine from your phone. It also has cloud routines (April 2026), Telegram/Discord/iMessage channels, cross-session messaging (August 2026) and `/voice`. Build on these before adding third-party layers. [What's new](https://code.claude.com/docs/en/whats-new/index.md)
2. **Auto mode is now the default starting permission mode** for interactive terminal and VS Code sessions (v2.1.283+). The docs reserve `bypassPermissions` for "isolated containers and VMs only." [Permission modes](https://code.claude.com/docs/en/permission-modes.md)
3. **Ghostty is the consensus terminal.** Both Anthropic's power-user tips and Trail of Bits recommend it. Desktop notifications work natively only in Ghostty, Kitty and iTerm2, and they still reach you over SSH. Inside tmux you need `allow-passthrough` and `extended-keys`. [Terminal config](https://code.claude.com/docs/en/terminal-config.md), [Power-user tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips)
4. **Usage tracking is now native.** The status-line JSON exposes `rate_limits.five_hour.used_percentage` and `seven_day.used_percentage`, and `/usage` breaks down what consumed your quota by skill, subagent, plugin and MCP server. ccstatusline (13.2k★) and ccusage (19.0k★) remain the popular add-ons. [Status line](https://code.claude.com/docs/en/statusline.md), [Costs](https://code.claude.com/docs/en/costs.md)
5. **Anthropic's own guidance is 3–5 parallel sessions, each in its own worktree.** Every session draws on the same quota, and agent teams use about 7× the tokens of a normal session when teammates run in plan mode. In practice, your review bandwidth is the real limit. [Power-user tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips), [Costs](https://code.claude.com/docs/en/costs.md)
6. **Third-party orchestrators come and go quickly.** Terragon shut down on 2026-01-16 and left an open-source snapshot. Crystal was deprecated in February 2026 in favor of Nimbalyst. Vibe Kanban's README says it is "sunsetting." Omnara pivoted to self-hostable managed agents. Still active: Conductor (Mac), Superset (15.1k★), Emdash (5.9k★, cross-platform) and Claude Squad (8.6k★). [terragon-oss](https://github.com/terragon-labs/terragon-oss), [crystal](https://github.com/stravu/crystal), [vibe-kanban](https://github.com/BloopAI/vibe-kanban)
7. **Remote Control only makes outbound HTTPS connections and opens no inbound ports.** While connected, the transcript is stored on Anthropic's servers. The phone app cannot select Bypass mode. A beta Trusted Devices option adds biometric re-authentication. For raw-terminal access, people use Tailscale + mosh + tmux + Blink. [Remote Control](https://code.claude.com/docs/en/remote-control), [Mobile](https://code.claude.com/docs/en/mobile.md), [pocket-terminal](https://github.com/domenicdgenovese/pocket-terminal)
8. **OpenClaw (391.6k★) made the "Mac mini agent box" popular, but its own docs recommend a VPS for 24/7 use.** They also say to keep the gateway loopback-only, treat inbound messages as untrusted, and note that tools run on the host unless you configure sandboxing. The repo's Security tab lists 73 pages of published advisories. [OpenClaw SECURITY.md](https://github.com/openclaw/openclaw/blob/main/SECURITY.md), [hosting FAQ](https://raw.githubusercontent.com/openclaw/openclaw/main/docs/help/faq-first-run/providers-and-hosting.md)
9. **Anthropic's terms limit subscription logins to ordinary individual use.** "Advertised usage limits for Pro and Max plans assume ordinary, individual usage." Third-party products may not route requests through Free, Pro or Max credentials. OpenClaw's own docs say "use an Anthropic API key" for shared automation. [Legal & compliance](https://code.claude.com/docs/en/legal-and-compliance.md), [OpenClaw Anthropic provider](https://raw.githubusercontent.com/openclaw/openclaw/main/docs/providers/anthropic.md)
10. **There are three ways to schedule work, and the choice matters.**
    - `/loop`: runs inside an open session, minimum interval 1 minute, expires after 7 days.
    - Desktop scheduled tasks: the app must be open and the machine awake; use the **Keep computer awake** setting; after a missed run it does one catch-up run.
    - Cloud routines: minimum interval 1 hour, capped at 100 scheduled runs per hour, and they count against your plan.

    [Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks.md), [Desktop tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks.md), [Routines](https://code.claude.com/docs/en/routines.md)
11. **Sandboxing is a ladder; pick the rung for the job.** From lightest to strongest:
    - `/sandbox`: covers Bash commands only and cut permission prompts 84% in Anthropic's internal use.
    - `srt`: wraps the whole process, including MCP servers and hooks.
    - Devcontainer: adds an egress firewall, but a malicious project can still exfiltrate `~/.claude` credentials.
    - Docker Sandboxes: a free local microVM whose proxy injects credentials so the real secret never enters the sandbox.
    - VM or cloud session.

    [Sandbox environments](https://code.claude.com/docs/en/sandbox-environments.md), [Anthropic sandboxing post](https://www.anthropic.com/engineering/claude-code-sandboxing)
12. **Secrets handling has a new native tool.** `sandbox.credentials` can deny a secret, or `mask` it and inject the real value only for allowed hosts. Combine it with Trail of Bits' `Read()` deny list, and never mount `~/.ssh` into containers. [Sandboxing](https://code.claude.com/docs/en/sandboxing.md), [Trail of Bits config](https://github.com/trailofbits/claude-code-config)
13. **Local models plug in easily but are unsupported.** `ollama launch claude`, LM Studio and llama.cpp's `/v1/messages` endpoint all work with Claude Code. Anthropic, however, "doesn't support routing Claude Code to non-Claude models through any gateway." A custom `ANTHROPIC_BASE_URL` also disables Remote Control. Give local models at least a 64k context. [LLM gateway](https://code.claude.com/docs/en/llm-gateway.md), [Ollama doc](https://raw.githubusercontent.com/ollama/ollama/main/docs/integrations/claude-code.mdx)
14. **Open-weight models are now in two tiers.** The frontier tier (Kimi K3 at 2.8T total/104B active; GLM-5.x at 744B total/40B active) approaches Opus 4.8 and Fable 5 on vendor-reported agentic benchmarks but cannot run on home hardware. The home-runnable tier runs on 24–128 GB machines: Qwen3.6-27B, Qwen3-Coder-Next (80B total/3B active) and Qwen3.8-Flash-Next (about 49 tok/s on one DGX Spark). [Kimi-K3](https://github.com/MoonshotAI/Kimi-K3), [GLM-5](https://github.com/zai-org/GLM-5), [Qwen3.8-Flash-Next on Spark](https://github.com/MiaAI-Lab/Qwen3.8-Flash-Next-Single-DGX-Spark)
15. **Plans as of 2026-10-11:**
    - Pro: $20/month ($17/month billed annually).
    - Max 5x: $100/month. Max 20x: $200/month.
    - All have 5-hour and weekly limits, shared across every Claude surface.
    - Fable on Max: up to 50% of your weekly limit. On Pro, Fable is billed only through usage credits.
    - Usage credits bill at API rates, and the prompt-cache lifetime drops from 1 hour to 5 minutes while you draw on them.
    - The new Max monthly API credits (from 2026-10-07) cannot be used for Claude Code.

    [Pricing](https://claude.com/pricing), [Fable on your plan](https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan)
16. **Trim MCP and prefer CLIs.**
    - Anthropic says "Prefer CLI tools" (`gh`, `sentry-cli`), and MCP tool definitions are now deferred until needed.
    - Playwright MCP's own README says coding agents "might benefit from using the CLI+SKILLS instead."
    - Context7 ships a CLI-plus-skill path: `npx ctx7 setup`.

    [Costs](https://code.claude.com/docs/en/costs.md), [playwright-mcp](https://github.com/microsoft/playwright-mcp), [context7](https://github.com/upstash/context7)
17. **"Claude at home" is now a first-party product area.**
    - Cowork, plus Dispatch from your phone and computer use (research preview), on Pro and Max.
    - Home Assistant's MCP server, added with `claude mcp add home-assistant --transport http`.
    - Obsidian "second brain" plugins. The most popular one ships its nightly agent disabled because that agent needs bypass mode.

    [Desktop](https://code.claude.com/docs/en/desktop.md), [HA MCP](https://raw.githubusercontent.com/home-assistant/home-assistant.io/current/source/_integrations/mcp_server.markdown), [obsidian-second-brain](https://github.com/eugeniughelbur/obsidian-second-brain)
18. **Voice input.** Native `/voice` sends audio to Anthropic for transcription, does not count against usage limits, and does not work over SSH. Offline alternatives: Handy (33.5k★, MIT, cross-platform) and VoiceInk (6.7k★, macOS, GPLv3). [Voice dictation](https://code.claude.com/docs/en/voice-dictation.md), [Handy](https://github.com/cjpais/Handy)

## 2. Detailed findings

### 2.1 Terminal and editor stack

- **Terminal choice: Ghostty.**
  - Anthropic recommends it for synchronized rendering and 24-bit color. Its tips also suggest `/color`, color-coded tabs and worktree aliases (`za`, `zb`, `zc`) to tell sessions apart → [Power-user tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips) (help-center page; it showed only "Updated over 2 weeks ago").
  - Trail of Bits calls it "the best terminal for Claude Code because it uses native Metal GPU rendering," with WezTerm for Windows → [ToB config](https://github.com/trailofbits/claude-code-config) (created 2026-02-04, updated 2026-10-10).
  - Secondary posts make the same pick: KeepCoding (May 2026; one worktree per Ghostty split, rarely tmux) and Mejba Ahmed (January 2026) → [KeepCoding](https://keepcoding.io/blog-frr/mi-setup-claude-code-ghostty-worktrees-mac/), [mejba.me](https://mejba.me/blog/ghostty-terminal-claude-code-workflow) *(secondary, seen in results)*.
- **Terminal compatibility.**
  - Shift+Enter works natively in Ghostty, Kitty, iTerm2, WezTerm, Warp, Apple Terminal and Windows Terminal. VS Code, Cursor, Zed and Alacritty before 0.16 need `/terminal-setup`. JetBrains terminals have none; use Ctrl+J.
  - Desktop notifications are on by default only in Ghostty, Kitty and iTerm2, and they are forwarded over SSH. iTerm2 needs "Send escape sequence-generated alerts." Elsewhere, set `"preferredNotifChannel": "terminal_bell"` or use a hook.
  - Terminals that support OSC 7501 show each session's working/waiting/done status (v2.1.295+).
  - tmux swallows notifications and Shift+Enter unless you set `allow-passthrough on` and `extended-keys on`. The Remote Control docs say to run `claude` in tmux or screen on remote machines.

  → [Terminal config](https://code.claude.com/docs/en/terminal-config.md), [Remote Control](https://code.claude.com/docs/en/remote-control)
- **Editors used alongside agents.**
  - VS Code and Cursor: Claude Code extension.
  - Zed and other ACP clients: `agentclientprotocol/claude-agent-acp` (2.6k★).
  - Neovim: `coder/claudecode.nvim` (3.1k★).
  - Desktop Code tab: panes, diff view, an in-app browser (July 2026), an iOS Simulator pane, pop-out panes (September 2026) and `/resume` for sessions started in the CLI.

  → [What's new](https://code.claude.com/docs/en/whats-new/index.md)
- **Ergonomics and multi-monitor.** I found no rigorous source. Docs-derived aids: per-session `/color`, agent-view groups (Needs input / Ready for review), OSC 7501 status, and `CLAUDE_CLIENT_PRESENCE_FILE`, which mutes phone pushes while you are at the desk → [Remote Control](https://code.claude.com/docs/en/remote-control)

### 2.2 Status lines, usage trackers, notifications, voice

- **Native status line.** Its JSON payload includes `cost.total_cost_usd`, `context_window.used_percentage`, `rate_limits.five_hour|seven_day.used_percentage` and `resets_at`, `prompt_cache` and effort. `/statusline <description>` generates a script and `refreshInterval` re-runs it. The docs link ccstatusline and starship-claude → [Status line](https://code.claude.com/docs/en/statusline.md)
- **Add-ons.**
  - **ccstatusline** (13.2k★): a TUI started with `npx -y ccstatusline@latest`. Widgets include the 5-hour block timer, session and weekly usage with reset timers, context bar, git/worktree, voice and sandbox status. It writes a `statusLine` entry with `refreshInterval: 10` → [ccstatusline](https://github.com/sirmalloc/ccstatusline).
  - **ccusage** (19.0k★; repo now Rust-based): `daily`, `weekly`, `monthly`, `session`, `blocks` (5-hour windows) and a beta `statusline`. It also reads Codex, OpenCode, Amp, OpenClaw, Gemini CLI and Copilot CLI logs → [ccusage](https://github.com/ccusage/ccusage).
  - Others: Claude-Code-Usage-Monitor (8.7k★), claude-statusbar (rate-limit projections), CCometixLine, claude-hud, tmux-claude-status-tabs → [awesome-claude-code](https://raw.githubusercontent.com/hesreallyhim/awesome-claude-code/main/README.md) *(curated, secondary)*.
- **Native usage views.**
  - `/usage` attributes plan usage to skills, subagents, plugins and MCP servers and lists the heaviest loops (24-hour or 7-day view).
  - `/insights` writes a "how you work" HTML report.
  - `/usage-credits` manages overage.

  → [Costs](https://code.claude.com/docs/en/costs.md)
- **Notifications, three tiers.**
  - (a) Terminal-native, as above.
  - (b) Notification hooks: `osascript` or `notify-send`. On macOS, Script Editor needs notification permission. Community add-ons provide ntfy phone push (anotifier), sounds (Claudio) and a menu-bar glow (Lockpaw).
  - (c) Remote Control mobile push (April 2026). Enable `/config` → "Push when Claude decides" and/or "Push when actions required."

  → [Hooks guide](https://code.claude.com/docs/en/hooks-guide.md), [Remote Control](https://code.claude.com/docs/en/remote-control), [awesome-claude-code](https://raw.githubusercontent.com/hesreallyhim/awesome-claude-code/main/README.md)
- **Voice.**
  - `/voice` has hold mode (Space, rebindable to `meta+k`) and tap mode, 20 languages, and is tuned to coding vocabulary using your project and branch names.
  - Audio streams to Anthropic and needs a claude.ai login. It does not work over SSH or in cloud sessions and does not count toward limits.
  - Anthropic says people speak about 3× faster than they type. macOS system dictation (fn fn) also works.

  → [Voice dictation](https://code.claude.com/docs/en/voice-dictation.md), [tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips). Offline alternatives: Handy (33.5k★, MIT, Windows/macOS/Linux, Whisper and Parakeet V3) → [Handy](https://github.com/cjpais/Handy); VoiceInk (6.7k★, macOS 15+, GPLv3 source, paid builds) → [VoiceInk](https://github.com/Beingpax/VoiceInk). Wispr Flow, SuperWhisper and MacWhisper were not verified.

### 2.3 Parallelism: worktrees and session managers

- **Native features.**
  - `claude -w <name>` creates `.claude/worktrees/<name>/` on branch `worktree-<name>`. `-w "#1234"` starts from a PR.
  - `.worktreeinclude` copies gitignored files such as `.env`. `worktree.baseRef` chooses `fresh` or `head`.
  - Subagents can declare `isolation: worktree`, and `/batch` spreads one change across 5–30 worktree-isolated subagents.
  - Claude Code blocks edits and git redirects into the main checkout.

  → [Worktrees](https://code.claude.com/docs/en/worktrees.md), [Run agents in parallel](https://code.claude.com/docs/en/agents.md)
- **Agent view** (research preview, May 2026).
  - Commands: `claude agents`, `claude --bg "<task>"`, `/bg`, `/fork`.
  - A supervisor daemon keeps sessions alive through sleep and auto-updates but not through shutdown. Unattached idle sessions are stopped after about an hour and resume when you return.
  - Each dispatched session moves into its own worktree. It is told to commit and push, and never to push to main, force-push or merge.
  - Deleting a session deletes its worktree, uncommitted changes included.

  → [Agent view](https://code.claude.com/docs/en/agent-view.md)
- **Cloud fan-out.** Each `claude --cloud "<task>"` call is its own VM; `claude --teleport` pulls one back. Projects (public beta on Pro and Max) coordinate cloud "threads" → [Cloud sessions](https://code.claude.com/docs/en/claude-code-on-the-web.md)
- **Third-party managers (status as of 2026-10-11).**
  - **Active.**
    - Conductor: free local Mac app (Apple Silicon only) with worktree-per-agent; Conductor Cloud runs agents in microVMs; a competitor cites a $50/month Pro plan *(secondary)* → [conductor.build](https://www.conductor.build/workflows/run-parallel-claude-codes), [morphllm](https://www.morphllm.com/conductor-ai-coding).
    - Claude Squad: tmux + worktrees TUI (`cs`), experimental `-y` autoyes, AGPL; 8,589★, last push 2026-08-20 → [claude-squad](https://github.com/smtg-ai/claude-squad).
    - Superset: "100+ coding agents"; ELv2; macOS (Linux experimental); desktop app free; the iPhone app needs Superset Pro; per-workspace ports; 15.1k★ → [superset](https://github.com/superset-sh/superset).
    - Emdash (YC W26): Apache-2.0; macOS, Windows and Linux; runs agents on remote machines over SSH/SFTP; pulls Linear/Jira/GitHub issues; 5.9k★ → [emdash](https://github.com/generalaction/emdash).
    - Sculptor: "experimental research preview"; 238★ → [sculptor](https://github.com/imbue-ai/sculptor).
    - Codex app (`codex app`; included with ChatGPT Plus, Pro, Business, Edu and Enterprise) → [openai/codex](https://github.com/openai/codex).
  - **Gone or going.**
    - Terragon: shutdown snapshot 2026-01-16 → [terragon-oss](https://github.com/terragon-labs/terragon-oss).
    - Crystal: "Deprecated: February 2026," replaced by Nimbalyst → [crystal](https://github.com/stravu/crystal).
    - Vibe Kanban: "sunsetting" (28.3k★, last push 2026-09-19) → [vibe-kanban](https://github.com/BloopAI/vibe-kanban).
- **Extreme end: Gas Town** (Steve Yegge; 18.3k★). Roles are Mayor, polecats, witness and refinery merge queue; it needs Beads and tmux 3.0+ and claims to "scale comfortably to 20-30 agents" → [gastown](https://github.com/gastownhall/gastown)
- **Who uses what.**
  - Anthropic's team: 3–5 sessions plus a dedicated "analysis" worktree.
  - Trail of Bits: worktrunk. They warn that a blocked helper can silently fall back to `git checkout -b` in the shared directory.
  - Peter Steinberger: one canonical `AGENTS.md` symlinked to `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`, with skills synced to both harnesses.

  → [tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips), [ToB](https://github.com/trailofbits/claude-code-config), [agent-scripts](https://github.com/steipete/agent-scripts)

### 2.4 Remote and mobile

- **Remote Control.** Secondary coverage dates it to February 2026 as a Max research preview; it is now on Pro, Max, Team and Enterprise.
  - Server-mode flags: `--spawn same-dir|worktree|session`, `--capacity` (default 32), `--permission-mode`, `--chrome`. Auto-connect with `remoteControlAtStartup: true`. Stopped servers can be resumed for about 4 hours.
  - It does not work with API keys, `setup-token` tokens, Bedrock/Vertex/Foundry, a custom `ANTHROPIC_BASE_URL` or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`.
  - Transcripts are stored on Anthropic's servers while connected. Trusted Devices (beta) requires a sign-in within the last 18 hours plus biometrics.

  → [Remote Control](https://code.claude.com/docs/en/remote-control), [Help Net Security](https://www.helpnetsecurity.com/?p=358918) *(secondary)*
- **Phone.** The Code tab in the Claude app gives you cloud sessions, Projects and Remote Control, or you can message Dispatch (Pro and Max). Bypass mode is not selectable from the phone. Since August 2026, any machine running `claude remote-control` appears as a device card, and tapping it starts a session there → [Mobile](https://code.claude.com/docs/en/mobile.md), [W34](https://code.claude.com/docs/en/whats-new/index.md)
- **Third-party.**
  - Happy (24.1k★, MIT, free): `npm i -g happy && happy claude`; desktop app plus iOS/Android/web clients with an encrypted relay → [happy](https://github.com/slopus/happy).
  - Omnara has pivoted to "a self-hostable alternative to Claude Managed Agents" → [omnara](https://github.com/omnara-ai/omnara).
  - VibeTunnel (4.7k★): browser terminal at `localhost:4020`; `vt` wrapper; `vt follow` for worktrees; Tailscale recommended; iOS app "unfinished" → [vibetunnel](https://github.com/amantus-ai/vibetunnel).
- **Tailscale + mosh + tmux + Blink/Moshi** (Termius has no mosh). Known failure modes:
  - mosh-server needs a UTF-8 locale, and mobile clients often send no `LANG`.
  - sshd honors only the first `SetEnv` line.
  - Tailscale SSH does not work in the sandboxed GUI (cask) build.
  - Userspace-mode Tailscale breaks mosh's UDP traffic.

  → [pocket-terminal](https://github.com/domenicdgenovese/pocket-terminal) (Aug 2026; anecdotal). Trail of Bits' `dropkit` manages disposable DigitalOcean droplets joined to Tailscale → [ToB README](https://raw.githubusercontent.com/trailofbits/claude-code-config/main/README.md)

### 2.5 Always-on home machines, scheduling, and the OpenClaw wave

- **Native always-on building blocks.**
  - `claude remote-control --spawn worktree` in tmux, plus device cards on your phone.
  - The agent-view daemon.
  - Desktop scheduled tasks: the app must be open and the machine awake; use **Settings > This computer > System > Keep computer awake**. Closing the lid still sleeps the machine. Missed runs in the last 7 days produce one catch-up run. Each task lives in `~/.claude/scheduled-tasks/<name>/SKILL.md`.
  - `/loop`: fixed or self-paced (1 minute to 1 hour), `.claude/loop.md`, up to 50 tasks per session, 7-day expiry.
  - Routines: cloud; schedule, API `/fire` or GitHub triggers; minimum interval 1 hour; no permission prompts; your connectors included by default; at most 100 scheduled runs per hour per account.

  → [Desktop tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks.md), [Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks.md), [Routines](https://code.claude.com/docs/en/routines.md)
- **Chat-ops: Channels** (research preview). Telegram, Discord and iMessage plugins push messages into a running session.
  - Pair your account, then `/telegram:access policy allowlist`.
  - iMessage needs Full Disk Access to read `chat.db`.
  - With permission relay, anyone on the allowlist can approve tool calls.

  → [Channels](https://code.claude.com/docs/en/channels.md)
- **Cross-session messaging** (August 2026). Messages travel through a local socket on the same machine, or through Anthropic over Remote Control across machines. A message cannot approve anything or change configuration. Messages into bypass-mode sessions are held for approval. `isolatePeerMachines: true` gates anything leaving the machine. Idle delivery spends tokens → [Cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging.md)
- **The OpenClaw wave.** The project went Clawdbot → Moltbot → OpenClaw after a trademark request from Anthropic (secondary). It is now MIT-licensed, "stewarded by the OpenClaw Foundation," with 391,647★ → [openclaw](https://github.com/openclaw/openclaw), [Sid Saladi](https://sidsaladi.substack.com/p/openclawmoltbotclawdbot-101-the-complete) *(secondary)*. Its own hosting FAQ:
  - A Mac mini is "a popular always-on host choice," but a Mac is needed only for iMessage-type tools.
  - A VPS is recommended for 24/7.
  - Minimum spec: 1 vCPU and 1 GB RAM.
  - Small local models are more injectable.

  → [hosting FAQ](https://raw.githubusercontent.com/openclaw/openclaw/main/docs/help/faq-first-run/providers-and-hosting.md)
- **OpenClaw security lessons.**
  - Keep the gateway on loopback and never expose it publicly; use an SSH tunnel or Tailscale serve.
  - "The model/agent is not a trusted principal."
  - Plugins run with host-level trust; pin them with `plugins.allow`.
  - Assume one trusted operator and one user per machine or VPS.

  → [SECURITY.md](https://github.com/openclaw/openclaw/blob/main/SECURITY.md). The Security tab shows 73 pages of advisories, including a September 2026 "High" ("Exec approvals could outlive their reviewed working directory") → [security](https://github.com/openclaw/openclaw/security). Koi Security reported 341 malicious ClawHub skills out of 2,857 ("ClawHavoc," Atomic Stealer) → [UGREEN blog](https://eu.ugreen.com/es/blogs/docking-station/openclaw-mac-mini-configuracion-minima-seguridad) *(secondary)*.
- **Subscriptions in third-party harnesses.** OpenClaw's Anthropic page accepts `setup-token`, but its troubleshooting says "do not copy an OAuth token into OpenClaw" and recommends API keys for shared automation. Anthropic's terms forbid third-party apps from routing requests through Pro or Max credentials → [OpenClaw Anthropic](https://raw.githubusercontent.com/openclaw/openclaw/main/docs/providers/anthropic.md), [Legal](https://code.claude.com/docs/en/legal-and-compliance.md)

### 2.6 Local and open models at home

- **Wiring.**
  - Ollama: `ollama launch claude`, or the env-var setup in §3. Ollama's default context is 4k under 24 GiB VRAM, 32k at 24–48 GiB and 256k at 48 GiB or more; use at least 64k (`OLLAMA_CONTEXT_LENGTH=64000`) → [Ollama](https://raw.githubusercontent.com/ollama/ollama/main/docs/integrations/claude-code.mdx), [context](https://raw.githubusercontent.com/ollama/ollama/main/docs/context-length.mdx).
  - LM Studio: Trail of Bits uses Qwen3-Coder-Next MLX 4-bit (needs at least 64 GB unified memory) at 32k context via `claude-local` → [ToB README](https://raw.githubusercontent.com/trailofbits/claude-code-config/main/README.md).
  - llama-server exposes `POST /v1/messages`; tools need `--jinja` → [llama.cpp](https://raw.githubusercontent.com/ggml-org/llama.cpp/master/tools/server/README.md).
  - claude-code-router (37.6k★) is now a general local gateway → [CCR](https://github.com/musistudio/claude-code-router).
- **Caveats.** Anthropic "doesn't support routing Claude Code to non-Claude models through any gateway." A custom base URL also disables Remote Control, voice and cloud features → [LLM gateway](https://code.claude.com/docs/en/llm-gateway.md). Many local users switch harnesses instead: OpenCode (`anomalyco/opencode`, 212.6k★) or each lab's own CLI (Qwen Code 28.4k★, Kimi Code, ZCode, MiniMax Code, DeepSeek Harness at 247k★ two months after launch).
- **Best open coding models (October 2026).**
  - **Frontier, not home-runnable.**
    - Kimi K3: 2.8T total / 104B active, 1M context. Vendor numbers: Terminal-Bench 2.1 88.3 vs Fable 5 88.0 and Opus 4.8 84.6 → [Kimi-K3](https://github.com/MoonshotAI/Kimi-K3).
    - GLM-5.x: 744B total / 40B active, Apache-2.0. GLM-5.2: SWE-bench Pro 62.1; Terminal-Bench 2.1 81.0 vs Opus 4.8's 85.0 → [GLM-5](https://github.com/zai-org/GLM-5).
  - **Prosumer.**
    - GLM-5.3-Flash (320B total / 18B active) on 2× DGX Spark, EXL3 at 4 bpw (~164 GiB): about 55 tok/s decode on code, ~1.5k tok/s prefill → [recipe](https://github.com/MiaAI-Lab/GLM-5.3-Flash-EXL3-2x-DGX-Sparks).
    - Qwen3.8-Flash-Next (NVFP4) on 1× Spark: 48.7 tok/s single stream, ~2.2k tok/s prefill → [recipe](https://github.com/MiaAI-Lab/Qwen3.8-Flash-Next-Single-DGX-Spark).
    - The same model on Strix Halo (experimental ROCm): 43.9 tok/s → [kyuz0](https://github.com/kyuz0/amd-strix-halo-toolboxes).
  - **Single GPU or Mac.**
    - Qwen3.6-27B: whichllm (May 2026) estimates about 40 t/s on an RTX 5090 at Q6_K → [whichllm](https://github.com/Andyyyy64/whichllm); a community server claims 158 tok/s → [devnen](https://github.com/devnen/qwen3.6-windows-server).
    - Qwen3-Coder-Next (80B total / 3B active, 256K context, "supports Claude Code") → [Qwen3-Coder](https://github.com/QwenLM/Qwen3-Coder).
    - gpt-oss-20b on CPU.
  - **Gap.** All parity claims are vendor-reported without a neutral harness. Treat local models as privacy or overflow lanes.

### 2.7 Safety for "YOLO" and bypass runs

- **Anthropic's rule.** "Always run `--dangerously-skip-permissions` sessions inside a container, a VM, or the sandbox runtime." The Bash sandbox alone "is not sufficient for fully unattended runs," because MCP servers, hooks and file tools run outside it. Claude Code refuses bypass mode as root → [Sandbox environments](https://code.claude.com/docs/en/sandbox-environments.md)
- **Auto mode.**
  - The classifier blocks `curl | bash`, data exfiltration, production deploys, force pushes, `git reset --hard`, `terraform destroy`, merging an unapproved PR and more.
  - Nothing auto-approves explicit ask rules or `rm` on critical paths.
  - Timeline: preview March 2026, Pro in May, default for new sessions on Pro/Max/Team from 2026-08-14, built-in default from v2.1.283.

  → [Permission modes](https://code.claude.com/docs/en/permission-modes.md), [What's new](https://code.claude.com/docs/en/whats-new/index.md)
- **Isolation layers.**
  - `/sandbox` (Seatbelt or bubblewrap) cut prompts 84%. Close its escape hatch with `allowUnsandboxedCommands: false`. The docs warn broad domains such as `github.com` allow domain-fronting exfiltration, and `allowUnixSockets` on `docker.sock` equals host access → [Sandboxing](https://code.claude.com/docs/en/sandboxing.md), [Anthropic (2025-10-20)](https://www.anthropic.com/engineering/claude-code-sandboxing).
  - `srt` (beta) wraps the whole process, MCP servers included → [srt](https://github.com/anthropics/sandbox-runtime).
  - Devcontainer feature plus `init-firewall.sh`: still "do[es] not prevent a malicious project from exfiltrating... the Claude Code credentials" → [Devcontainer](https://code.claude.com/docs/en/devcontainer.md), [ToB devcontainer (950★)](https://github.com/trailofbits/claude-code-devcontainer).
  - **Docker Sandboxes** (`sbx`, releases 0.45–0.47, 2026-09-21 → 10-05): a microVM with its own Docker daemon; a host proxy swaps a placeholder credential for the real one ("the real credential stays outside the sandbox"); free locally, including commercial use; `sbx run claude` defaults to bypass; it ignores `~/.claude` → [index](https://raw.githubusercontent.com/docker/docs/main/content/manuals/ai/sandboxes/_index.md), [architecture](https://raw.githubusercontent.com/docker/docs/main/content/manuals/ai/sandboxes/architecture.md), [claude-code](https://raw.githubusercontent.com/docker/docs/main/content/manuals/ai/sandboxes/agents/claude-code.md).
- **Secrets hygiene.**
  - `sandbox.credentials` can deny files and env vars, or mask them and inject the real value only for listed hosts.
  - Trail of Bits' `Read()` deny list covers `~/.ssh`, `~/.aws`, `~/.config/gh`, `~/.npmrc`, keychains and wallets. Without `/sandbox`, those rules don't constrain Bash.
  - Cloud sessions keep GitHub tokens and "network secrets" outside the VM.
  - `claude --cloud` bundling leaves `.env`, `*.tfvars` and keys behind.
  - `.worktreeinclude` multiplies copies of `.env` across worktrees.

  → [Sandboxing](https://code.claude.com/docs/en/sandboxing.md), [ToB settings](https://raw.githubusercontent.com/trailofbits/claude-code-config/main/settings.json), [Cloud](https://code.claude.com/docs/en/claude-code-on-the-web.md)
- **Prompt-injection exposure.**
  - WebFetch returns model-written summaries, not raw pages.
  - Servers in a project's `.mcp.json` need approval. Trail of Bits sets `enableAllProjectMcpServers: false` and warns "a compromised repo could ship malicious MCP servers."
  - Chrome DevTools MCP "exposes content of the browser instance."
  - Use Supabase MCP `read_only` and `project_ref`.
  - Channels' permission relay delegates approval power.

  → [Security](https://code.claude.com/docs/en/security.md), [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp), [supabase/mcp](https://github.com/supabase/mcp)
- **Git discipline as backup.** Block `rm -rf` and pushes to main in hooks, keeping in mind that "hooks are not a security boundary... Guardrails, not walls." Agent-view sessions push branches. Desktop scheduled tasks act on your live working tree unless you enable the worktree toggle → [ToB](https://github.com/trailofbits/claude-code-config), [Desktop tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks.md)

### 2.8 Plans and cost

- **Plans.**
  - Pro: $20/month, or $17/month billed annually. "Claude Code included." Fable only via usage credits.
  - Max: "From $100." The help center lists Max 5x at $100 and Max 20x at $200, billed monthly. Fable gets up to "50% of weekly limits."
  - Limits: a rolling 5-hour window plus weekly limits, one pool across web, desktop, mobile, Claude Code and Cowork.

  → [Pricing](https://claude.com/pricing), [Max plan](https://support.claude.com/en/articles/11049741-what-is-the-max-plan), [Fable (2026-09-02)](https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan)
- **API rates per million tokens (input/output):** Fable 5.1 $10/$50; Opus 5.5 $4/$20; Sonnet 5.5 $2/$10; Haiku 5.5 $0.10/$0.50 up to 100K tokens. Opus fast mode is 2× and batch is −50% → [Pricing](https://claude.com/pricing)
- **Cost drivers.**
  - Usage credits bill at API rates, and the cache lifetime drops from 1 hour to 5 minutes.
  - Scheduled loops, goal check-ins and incoming cross-session messages each re-send your full context.
  - Agent teams use about 7× the tokens when teammates run in plan mode.
  - `/rate-limit-options` and Desktop (August 2026) can wait for a limit to reset and then continue.

  → [Costs](https://code.claude.com/docs/en/costs.md)
- **Max monthly API credits** (from 2026-10-07; $100 for 5x, $200 for 20x): they cover the API and Agent SDK, not Claude Code, and expire monthly → [support 17154008](https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans) *(seen in results)*, [Pro/Max + Claude Code](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- **Real spend.**
  - Anthropic's enterprise average is about $13 per developer per active day and $150–250 per month; 90% stay under $30 per active day → [Costs](https://code.claude.com/docs/en/costs.md).
  - Heavy individuals mostly sit on Max 20x and track API-equivalent value with ccusage. Viberank aggregates self-submitted totals (not bills) → [viberank](https://github.com/sculptdotfun/viberank).
  - Secondary reports say peak-hour drain began 2026-03-26 and 5-hour limits were doubled on 2026-05-06 (unverified) → [heyuan110](https://www.heyuan110.com/posts/ai/2026-02-28-claude-rate-limits/), [leanware](https://leanware.co/insights/claude-max-plan) *(secondary)*.
- **Complements.** Codex comes with ChatGPT Plus, Pro, Business, Edu and Enterprise. OpenClaw's FAQ says OpenAI "explicitly allows subscription OAuth usage" in third-party tools, a policy difference from Anthropic → [openai/codex](https://github.com/openai/codex), [OpenClaw FAQ](https://raw.githubusercontent.com/openclaw/openclaw/main/docs/help/faq-first-run/providers-and-hosting.md)

### 2.9 MCP servers and CLIs people keep installed

- **Anthropic's guidance.** MCP tool definitions are deferred by default. "Prefer CLI tools when available: `gh`, `aws`, `gcloud`, `sentry-cli`." Check per-server usage share in `/usage` → [Costs](https://code.claude.com/docs/en/costs.md). Presenting MCP servers as code APIs cut 150k → 2k tokens (98.7%) → [Anthropic (2025-11-04)](https://www.anthropic.com/engineering/code-execution-with-mcp)
- **What people keep:**
  - Context7: remote MCP, or `npx ctx7 setup` for a CLI plus skill.
  - Playwright MCP: its README says coding agents "might benefit from using the CLI+SKILLS instead."
  - Chrome DevTools MCP (`--slim --headless`; also has a CLI).
  - agent-browser: Rust CLI using snapshot refs.
  - Exa (Trail of Bits).
  - Claude in Chrome (generally available late June 2026).
  - Supabase: read-only and project-scoped.
  - Home Assistant.
  - `gh` rather than a GitHub MCP server.

  → [context7](https://github.com/upstash/context7), [playwright-mcp](https://github.com/microsoft/playwright-mcp), [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp), [agent-browser](https://github.com/vercel-labs/agent-browser), [ToB](https://github.com/trailofbits/claude-code-config)

### 2.10 "Claude at home" beyond code

- **Cowork, Dispatch, computer use.** Cowork is Claude Code's architecture inside Desktop: local files, Claude in Chrome, and connectors and skills managed through Customize (it does not read `~/.claude`). Dispatch, on Pro and Max only, is a persistent conversation that spawns Code sessions and pushes to your phone. Computer use (research preview, Pro and Max) runs on your real desktop and has run in the background on macOS since September 2026 → [Cowork](https://claude.com/docs/cowork/overview), [Desktop](https://code.claude.com/docs/en/desktop.md)
- **Personal OS.**
  - obsidian-second-brain (4.7k★): about 45 vault commands plus morning, nightly and weekly agents. The background agent needs bypass, so it ships disabled and cannot delete notes → [obsidian-second-brain](https://github.com/eugeniughelbur/obsidian-second-brain).
  - Steinberger's skills: iMessage (`imsg`), WhatsApp (`wacli`), Google (`gog`), `peekaboo` → [agent-scripts](https://github.com/steipete/agent-scripts).
  - Desktop's docs cite "morning briefings that pull from your calendar and inbox" as a scheduled-task use case.
- **Home automation.** Home Assistant has had an MCP Server since 2025.2. It exposes only the entities you choose (admin accounts by default) and uses OAuth: `claude mcp add home-assistant --transport http <url>`. Claude Desktop connectors reach it from the cloud, so your instance must be internet-reachable. A local Claude Code client can likely stay on your LAN (inference) → [HA MCP Server](https://raw.githubusercontent.com/home-assistant/home-assistant.io/current/source/_integrations/mcp_server.markdown)

## 3. Practices and configs worth copying

**`~/.claude/settings.json`: a power-user baseline.** It combines the docs' examples with a Trail of Bits subset. Adjust the domains to your stack.
```json
{
  "statusLine": { "type": "command", "command": "npx -y ccstatusline@latest", "padding": 0, "refreshInterval": 10 },
  "voice": { "enabled": true, "mode": "hold" },
  "remoteControlAtStartup": true,
  "worktree": { "baseRef": "fresh" },
  "enableAllProjectMcpServers": false,
  "permissions": {
    "deny": [
      "Read(~/.ssh/**)", "Edit(~/.ssh/**)", "Read(~/.gnupg/**)", "Read(~/.aws/**)",
      "Read(~/.config/gh/**)", "Read(~/.git-credentials)", "Read(~/.npmrc)",
      "Read(~/.docker/config.json)", "Edit(~/.zshrc)", "Edit(~/.bashrc)",
      "Bash(sudo *)", "Bash(git push --force*)", "Bash(git reset --hard*)"
    ]
  },
  "sandbox": {
    "enabled": true,
    "allowUnsandboxedCommands": false,
    "network": { "allowedDomains": ["*.github.com", "registry.npmjs.org", "pypi.org", "files.pythonhosted.org"] },
    "credentials": {
      "files": [ { "path": "~/.ssh", "mode": "deny" }, { "path": "~/.aws/credentials", "mode": "deny" } ],
      "envVars": [ { "name": "NPM_TOKEN", "mode": "deny" } ]
    }
  },
  "hooks": {
    "Notification": [ { "matcher": "", "hooks": [
      { "type": "command", "command": "osascript -e 'display notification \"Claude Code needs your attention\" with title \"Claude Code\"'" },
      { "type": "command", "command": "curl -s -d \"Claude needs input: $(basename \"$PWD\")\" \"https://ntfy.sh/$NTFY_TOPIC\" >/dev/null" }
    ] } ],
    "PreToolUse": [ { "matcher": "Bash", "hooks": [ { "type": "command", "command": "~/.claude/hooks/guard.sh" } ] } ]
  }
}
```
Sources: [statusline](https://code.claude.com/docs/en/statusline.md), [voice](https://code.claude.com/docs/en/voice-dictation.md), [RC](https://code.claude.com/docs/en/remote-control), [sandboxing](https://code.claude.com/docs/en/sandboxing.md), [hooks guide](https://code.claude.com/docs/en/hooks-guide.md), [ToB settings](https://raw.githubusercontent.com/trailofbits/claude-code-config/main/settings.json). ntfy topics behave like passwords: use a long random `NTFY_TOPIC` or self-host ntfy ([ntfy](https://github.com/binwiederhier/ntfy)).

**`~/.claude/hooks/guard.sh`** (`chmod +x`). Exit code 2 blocks the command and returns stderr to Claude. This is a guardrail, not a wall. Tested: it blocks `rm -rf`, `rm -Rf` and `git push origin main` or `HEAD:master`. It misses split flags such as `rm -r -f`, so pair it with the sandbox and deny rules.
```bash
#!/usr/bin/env bash
cmd=$(jq -r '.tool_input.command // empty')
echo "$cmd" | grep -Eq 'rm[[:space:]]+-[A-Za-z]*([rR][A-Za-z]*f|f[A-Za-z]*[rR])' && { echo "Blocked: use trash, not rm -rf" >&2; exit 2; }
echo "$cmd" | grep -Eq 'git[[:space:]]+push.*[[:space:]:](main|master)([[:space:]]|$)' && { echo "Blocked: push a feature branch" >&2; exit 2; }
exit 0
```

**`~/.tmux.conf`** (from the docs):
```bash
set -g allow-passthrough on
set -s extended-keys on
set -as terminal-features 'xterm*:extkeys'
```

**Parallel-session muscle memory:**
```bash
claude --worktree feature-auth            # isolated checkout under .claude/worktrees/
claude --worktree "#1234"                 # start from a PR
printf '.env\n.env.local\n' > .worktreeinclude   # copy gitignored env into worktrees (mind the secrets)
claude --bg "investigate the flaky SettingsChangeDetector test"   # background session
claude agents                             # agent view: Needs input / Ready for review / Working
claude --cloud "Fix the flaky test in auth.spec.ts"   # cloud fan-out; pull back with claude --teleport
```
[Worktrees](https://code.claude.com/docs/en/worktrees.md), [Agent view](https://code.claude.com/docs/en/agent-view.md), [Cloud](https://code.claude.com/docs/en/claude-code-on-the-web.md)

**Always-on home server (Mac mini).** Keep it awake and serve sessions to your phone. `caffeinate` is standard macOS. Remote Control needs a full `claude auth login`; `setup-token` tokens don't work.
```bash
tmux new-session -d -s rc \
  'caffeinate -is claude remote-control --spawn worktree --capacity 6 --name mini --permission-mode auto'
# Phone: Claude app → Code → device card "mini" (Aug 2026+) or session list. Then /config → Push when actions required.
```
[Remote Control](https://code.claude.com/docs/en/remote-control), [What's new W34](https://code.claude.com/docs/en/whats-new/index.md)

**Chat-ops via Telegram** (first-party Channels):
```text
/plugin install telegram@claude-plugins-official
/telegram:configure <BotFather token>
# restart:  claude --channels plugin:telegram@claude-plugins-official
/telegram:access pair <code>
/telegram:access policy allowlist
```
[Channels](https://code.claude.com/docs/en/channels.md)

**Scheduling:**
- Inside a session: `/loop 5m check if the deployment finished`, or a bare `/loop` with `.claude/loop.md`.
- Cloud: `/schedule daily PR review at 9am`.
- Desktop: Routines → New → Local, with **Keep computer awake** on.

[Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks.md), [Routines](https://code.claude.com/docs/en/routines.md)

**YOLO runs in a microVM** (Docker Sandboxes):
```bash
sbx run claude ~/my-project                                   # defaults to --dangerously-skip-permissions
sbx run --name my-sandbox claude -- "Add error handling to the login function"
sbx run --clone claude . -- --dangerously-skip-permissions agents   # private clone; host repo read-only
git fetch sandbox-my-sandbox && git diff "main..sandbox-my-sandbox/$BRANCH"
```
[Docker Sandboxes: Claude Code](https://raw.githubusercontent.com/docker/docs/main/content/manuals/ai/sandboxes/agents/claude-code.md)

**Whole-process sandbox** (`srt`; on Linux also install bubblewrap, socat and ripgrep). Write `~/.srt-settings.json`, then run `npx @anthropic-ai/sandbox-runtime claude`:
```json
{
  "network": { "allowedDomains": ["api.anthropic.com", "claude.ai", "platform.claude.com", "*.github.com", "registry.npmjs.org"] },
  "filesystem": { "denyRead": ["~/.ssh", "~/.aws"], "allowWrite": [".", "~/.claude", "~/.claude.json", "/private/tmp"], "denyWrite": [".env"] }
}
```
[Sandbox environments](https://code.claude.com/docs/en/sandbox-environments.md), [srt](https://github.com/anthropics/sandbox-runtime)

**Local-model lane** (unsupported by Anthropic):
```bash
ollama launch claude                       # or manual:
ANTHROPIC_AUTH_TOKEN=ollama ANTHROPIC_API_KEY="" ANTHROPIC_BASE_URL=http://localhost:11434 claude --model qwen3.5
# Trail of Bits' LM Studio lane:
lms get Qwen3-Coder-Next@MLX-4bit -y && lms load qwen/qwen3-coder-next --context-length 32768 --gpu max -y && lms server start
claude-local() { ANTHROPIC_BASE_URL=http://localhost:1234 ANTHROPIC_AUTH_TOKEN=lmstudio \
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 claude --model qwen/qwen3-coder-next "$@"; }
```
[Ollama](https://raw.githubusercontent.com/ollama/ollama/main/docs/integrations/claude-code.mdx), [ToB README](https://raw.githubusercontent.com/trailofbits/claude-code-config/main/README.md)

**MCP diet:**
```bash
npx ctx7 setup --claude                          # Context7 as CLI + skill, no MCP
claude mcp add playwright npx @playwright/mcp@latest
claude mcp add home-assistant --transport http "https://$HA_HOST/api/mcp"   # then /mcp → Authenticate
```
Supabase URL: `https://mcp.supabase.com/mcp?project_ref=<ref>&read_only=true&features=database,docs` ([supabase/mcp](https://github.com/supabase/mcp)).

**Weekly hygiene** (Trail of Bits): run `/insights` and turn the findings into `CLAUDE.md` rules, hooks or skills. Prefer `/clear` over `/compact`. After two failed corrections, rewind or start fresh. → [ToB](https://github.com/trailofbits/claude-code-config)

## 4. Disagreements, caveats, failure modes

- **Ghostty splits vs tmux.** Practitioners increasingly use Ghostty splits instead of tmux (KeepCoding, secondary). Anthropic still says to use tmux or screen on remote machines, because a closed terminal kills the session there. Agent view's daemon now covers the local case.
- **How many agents.** Anthropic suggests 3–5. Gas Town claims "20-30 agents." Superset markets "100+." Quota and human review are the binding limits in every case. Every parallel session draws on the same 5-hour and weekly pool, and routines, loops and goal check-ins burn tokens while you are idle.
- **Bypass mode.** Trail of Bits runs `claude-yolo` with `/sandbox`. Anthropic's docs say the Bash sandbox is *not* sufficient for unattended bypass runs and prescribe a container, VM or `srt`. Docker Sandboxes makes bypass its default inside a microVM.
- **Devcontainers aren't exfiltration-proof.** The docs say a malicious repo can still steal `~/.claude` credentials. Docker Sandboxes' credential-injection proxy and cloud sessions' credential proxy are stronger.
- **Remote Control privacy.** The transcript is stored on Anthropic's servers while connected, and it is unavailable to ZDR/HIPAA orgs. Happy uses an encrypted relay, and Tailscale + mosh keeps everything on your own network.
- **Throughput claims don't agree.** For Qwen3.6-27B on an RTX 5090, whichllm says about 40 t/s and devnen claims 158 tok/s (likely with speculative decoding and vLLM). Recommended context for Claude Code also varies: at least 64k (Ollama) vs 32k (Trail of Bits, chosen for speed).
- **Orchestrator churn.** Within ten months, four notable tools shut down, deprecated, sunset or pivoted (Terragon, Crystal, Vibe Kanban, Omnara). Prefer tools that degrade gracefully to plain `git worktree` plus tmux.
- **Worktree footguns.**
  - Agent view's delete removes uncommitted work.
  - Worktrees created with `git lfs install --local` get LFS pointer files.
  - `.worktreeinclude` multiplies copies of your secrets.
  - A blocked helper can fall back to the shared checkout (Trail of Bits).
- **Subscription vs third-party harnesses.** OpenClaw and other tools can technically use subscription tokens. Anthropic's terms forbid third-party products from routing requests through Pro or Max credentials and reserve the right to enforce "without prior notice." Use an API key for anything shared or productized.
- **OpenClaw exposure.**
  - Running the main session on the host without sandboxing.
  - Public gateway binds.
  - Malicious marketplace skills.
  - A large advisory backlog.

  Run it on a dedicated machine or VPS, as a separate OS user, with plugins pinned.
- **Local models.** Anthropic does not support them. Custom base URLs break Remote Control and cloud features. Vendor benchmarks overstate parity, and small models are easier to prompt-inject.
- **Hooks give a false sense of safety.** "Hooks are not a security boundary" (Trail of Bits). Deny rules without `/sandbox` don't constrain Bash (Trail of Bits).
- **Limit-change reports.** Secondary sources describe peak-hour drain (2026-03-26) and doubled 5-hour limits (2026-05-06); neither is confirmed by Anthropic pages I could reach.

## 5. Three reference rigs

### A. Minimal / starter: "one laptop, one plan, native features only"

| Component | Choice | Why |
|---|---|---|
| Plan | Claude Pro, $20/month ($17/month annual) | Claude Code included. Remote Control, routines and auto mode are all on Pro |
| Terminal | Ghostty (macOS/Linux) or WezTerm/Windows Terminal | Native notifications and Shift+Enter |
| Editor | VS Code, Zed or Neovim + `/terminal-setup` | Review diffs where you're comfortable |
| Status line | `/statusline show model, context % and 5h/7d usage` | Native rate-limit fields, no dependencies |
| Safety | Default auto mode + `/sandbox` (auto-allow) + Trail of Bits deny subset + `guard.sh` | Fewer prompts without bypass |
| Parallelism | `claude -w <name>` × 2 | Worktree isolation |
| Mobile | Claude app + `/rc` when stepping away; push toggles in `/config` | Zero infrastructure |
| Voice | `/voice` (hold Space) | Free, doesn't count toward limits |
| MCP | None to start; `gh` CLI; add Context7 via `npx ctx7 setup` | Keeps context lean |

**Monthly cost: about $20** (plus optional usage credits capped in Settings > Usage).

**Setup:**
1. `curl -fsSL https://claude.ai/install.sh | bash`, then `claude` → `/login`.
2. Install Ghostty, and run `/terminal-setup` if you're in an IDE terminal.
3. Paste the deny list and Notification hook from §3, and run `/sandbox` → auto-allow.
4. `/statusline …`; add `.claude/worktrees/` to `.gitignore`.
5. Install the Claude app and test `claude --remote-control "laptop"`.
6. Upgrade to Max 5x if `/usage` shows weekly limits binding.

### B. Serious solo power user: "3–6 parallel sessions, remote-capable, sandboxed YOLO lane"

| Component | Choice | Why |
|---|---|---|
| Plan | Claude Max 20x, $200 (or Max 5x, $100 if ≤3 sessions); usage credits with a monthly cap; optional ChatGPT plan for Codex second opinions | Parallel sessions multiply usage; Fable gets up to 50% of the weekly limit |
| Machine | Existing MacBook Pro or Linux workstation + external monitor | Most work is API-bound |
| Terminal | Ghostty + tmux (passthrough config) | Persistence + notifications |
| Session mgmt | Native: `claude -w`, `claude agents`/`--bg`, `/fork`. Optional GUI: Conductor (Mac), Superset (Mac) or Emdash (cross-platform) | Native first; GUI for diff review |
| Status/usage | ccstatusline (5-hour block + weekly widgets), `npx ccusage@latest daily`, weekly `/insights` | Pace usage across windows |
| Notifications | Ghostty native + ntfy hook + Remote Control push ("actions required") | Phone knows when you're blocked |
| Remote | `remoteControlAtStartup: true`; Tailscale + mosh + tmux + Blink/Moshi for raw shell; Happy as an alternative | Steer from the couch or on the road |
| Voice | `/voice` locally; Handy/VoiceInk when over SSH | `/voice` doesn't work over SSH |
| Safety | Auto mode by default; YOLO lane = `sbx run claude` (Docker Sandboxes) or a devcontainer with firewall; `sandbox.credentials` masking; Trail of Bits hooks | Bypass only inside a microVM or container |
| MCP/CLIs | `gh`, `ctx7` skill, Playwright CLI/agent-browser, Chrome DevTools MCP (`--slim --headless`), Sentry/Linear connectors as needed | Check `/usage` MCP attribution monthly |
| Scheduling | `/loop` for PR babysitting; 1–3 routines (nightly dependency audit, PR review) | Cloud runs while the laptop sleeps |

**Monthly cost: about $200–$270** ($200 Max 20x + $0–50 usage credits + optional ChatGPT plan; hardware already owned).

**Setup:**
1. Do everything in Rig A.
2. Install ccstatusline and ccusage.
3. Add the §3 tmux config.
4. Install Tailscale on laptop and phone, then `brew install mosh`; follow pocket-terminal's locale/`SetEnv` fixes.
5. Install Docker Sandboxes (`sbx`) and test `sbx run claude .`.
6. Add `.worktreeinclude`, carefully.
7. Create routines with `/schedule`.
8. Optionally install Conductor, Superset or Emdash, and review diffs there.

### C. Autonomous "agent fleet" at home: "always-on box, chat-ops, isolated workers, optional local-model lane"

| Component | Choice | Why |
|---|---|---|
| Accounts | Max 20x ($200) under your own login + usage credits with a hard monthly cap; an Anthropic API key (Console) for any third-party harness (OpenClaw, Pi, custom Agent SDK bots) | Terms: subscription OAuth is for ordinary individual use; API keys for automation |
| Always-on host | Mac mini (Apple Silicon, 32–64 GB) or a Linux mini-PC/VPS; UPS; separate macOS/Linux user for agents | OpenClaw FAQ: a Mac is needed only for iMessage; VPS is best for 24/7 |
| Local-model box (optional) | Mac Studio (128–512 GB), DGX Spark (1–2×) or a Strix Halo 128 GB running LM Studio, Ollama or vLLM | Privacy/overflow lane: Qwen3.8-Flash-Next on 1 Spark (~49 tok/s); GLM-5.3-Flash on 2 Sparks (~55 tok/s) |
| Session server | `claude remote-control --spawn worktree --capacity 6` in tmux under `caffeinate`; device cards on phone; agent-view daemon for `--bg` jobs | Native fleet without inbound ports |
| Coordination | Cross-session messaging (`isolatePeerMachines: true`); optional Gas Town for 10–30 agents (`gt up`, Mayor/refinery merge queue) | Hand-offs and a merge queue |
| Isolation | Each autonomous worker in Docker Sandboxes (`sbx run --clone claude . -- --dangerously-skip-permissions agents`) or a devcontainer with firewall; `srt`-wrapped MCP servers; branch protection on main | Bypass only inside microVMs; credentials stay outside |
| Chat-ops | Claude Channels (Telegram/Discord/iMessage, allowlist) — or OpenClaw on the dedicated box/VPS: loopback gateway, DM pairing, `plugins.allow`, sandbox non-main sessions, API key | Phone-native control with explicit trust boundaries |
| Scheduling | Cloud routines for anything that must run with the box off; Desktop scheduled tasks (Keep computer awake + worktree toggle) for local-file jobs; `/loop` for babysitting | Pick by "needs local files?" and "needs machine on?" |
| Observability | ccusage (also counts OpenClaw/Codex), ccstatusline weekly widget, `/usage` loop rows, ntfy topic per box, Remote Control push | Catch runaway loops and quota burn |
| Backups | `git push` early and often (agents push branches), Time Machine/restic of `~` excluding caches, weekly review of `~/.claude/scheduled-tasks/` and routines | Agents delete worktrees; git is your undo |

**Monthly cost:**
- Subscription: $200 (Max 20x) + usage-credit cap ($100–300) + API-key spend for third-party bots (budget $20–100).
- Host: a Mac mini amortized over 36 months is roughly $20–55/month; a VPS is $5–20/month.
- Optional local box: DGX Spark or Mac Studio amortized adds roughly $90–300/month.
- Electricity: small.
- **Total: about $350–$700/month without the local-model box; $450–$1,000 with it.** Hardware prices are unverified this session; see §7.

**Setup:**
1. Create a dedicated OS user on the always-on box; FileVault on; firewall on; Tailscale; no public ports.
2. Install Claude Code and `claude auth login` (full scope, needed for Remote Control). Leave `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` unset.
3. Install `sbx` (Docker Sandboxes) and run `sbx secret set anthropic`, or `/login` inside the sandbox. Test a clone-mode run.
4. Start the Remote Control server in tmux (§3). Enable push and Trusted Devices.
5. Install the Telegram channel plugin and set the allowlist policy, or install OpenClaw with `openclaw onboard --install-daemon` and an API key, keeping the gateway on loopback.
6. Create routines (`/schedule`) and Desktop tasks for local jobs.
7. Optionally `brew install gastown`, then `gt install ~/gt --shell --git`, then `gt rig add …`.
8. Optionally set up the local-model lane (`ollama launch claude` or Trail of Bits' `claude-local`). Keep it to non-critical tasks, and remember Remote Control won't work in those sessions.
9. Weekly: run ccusage/`/usage`, prune stale worktrees (`git worktree list`), and review held cross-session messages and advisories (OpenClaw Security tab).

## 6. Sources

Anthropic docs pages are living documents, accessed 2026-10-11.

- Continue local sessions with Remote Control — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/remote-control — modes, flags, security, push, Trusted Devices — [primary]
- Claude Code docs index — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/llms.txt — page map — [primary]
- Manage multiple agents with agent view — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/agent-view.md — `claude agents`, `--bg`, daemon — [primary]
- Run agents in parallel — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/agents.md — comparison of parallel approaches — [primary]
- Run parallel sessions with worktrees — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/worktrees.md — `-w`, `.worktreeinclude`, isolation checks — [primary]
- Choose a sandbox environment — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/sandbox-environments.md — isolation ladder, bypass guidance — [primary]
- Configure the sandboxed Bash tool — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/sandboxing.md — sandbox JSON, credentials, limitations — [primary]
- Development containers — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/devcontainer.md — feature, firewall, exfiltration warning — [primary]
- Choose a permission mode — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/permission-modes.md — auto mode default, classifier blocks — [primary]
- Security — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/security.md — prompt-injection safeguards, MCP trust — [primary]
- Manage costs effectively — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/costs.md — $13/day average, `/usage`, cache TTL, CLI over MCP — [primary]
- Customize your status line — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/statusline.md — `rate_limits` fields — [primary]
- Configure your terminal — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/terminal-config.md — notifications, tmux, OSC 7501 — [primary]
- Automate actions with hooks — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/hooks-guide.md — Notification and protect-files examples — [primary]
- Voice dictation — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/voice-dictation.md — `/voice` requirements — [primary]
- Run prompts on a schedule — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/scheduled-tasks.md — `/loop`, cron limits — [primary]
- Automate work with routines — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/routines.md — triggers, caps, API — [primary]
- Schedule recurring tasks in Desktop — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/desktop-scheduled-tasks.md — Keep awake, catch-up — [primary]
- Push events with channels — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/channels.md — Telegram/Discord/iMessage — [primary]
- Message your other sessions — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/cross-session-messaging.md — safeguards, cross-machine — [primary]
- Claude Code on mobile — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/mobile.md — Code tab, Dispatch, limits — [primary]
- Use Claude Code in the cloud — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/claude-code-on-the-web.md — `--cloud`, teleport, credentials — [primary]
- Desktop application — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/desktop.md — Dispatch, computer use — [primary]
- Other LLM gateways — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/llm-gateway.md — no support for non-Claude models — [primary]
- Legal and compliance — Anthropic — accessed 2026-10-11 — https://code.claude.com/docs/en/legal-and-compliance.md — OAuth and ordinary-use terms — [primary]
- What's new (weekly digests W13–W37) — Anthropic — Mar–Sep 2026 — https://code.claude.com/docs/en/whats-new/index.md — feature timeline — [primary]
- Cowork overview — Anthropic — accessed 2026-10-11 — https://claude.com/docs/cowork/overview — Cowork capabilities — [primary]
- Plans & pricing — Anthropic — accessed 2026-10-11 — https://claude.com/pricing — plan and API prices — [primary]
- What is the Max plan? — Anthropic Help Center — "updated this week" (Oct 2026) — https://support.claude.com/en/articles/11049741-what-is-the-max-plan — $100/$200, weekly limit — [primary]
- Use Claude Code with your Pro or Max plan — Anthropic Help Center — Oct 2026 — https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan — shared limits; API credits excluded — [primary]
- Claude Fable models on your plan — Anthropic Help Center — 2026-09-02 — https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan — 50% weekly allowance — [primary]
- How do usage and length limits work? — Anthropic Help Center — Oct 2026 — https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work — usage drivers — [primary]
- Claude Code power user tips — Anthropic Help Center — ~Sep 2026 — https://support.claude.com/en/articles/14554000-claude-code-power-user-tips — 3–5 worktrees, Ghostty, voice — [primary]
- Monthly API credits for Max and Team plans — Anthropic Help Center — Oct 2026 — https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans — not usable for Claude Code — [primary, seen in results]
- Claude Code sandboxing — Anthropic Engineering — 2025-10-20 — https://www.anthropic.com/engineering/claude-code-sandboxing — 84% fewer prompts — [primary]
- Code execution with MCP — Anthropic Engineering — 2025-11-04 — https://www.anthropic.com/engineering/code-execution-with-mcp — 98.7% token reduction — [primary]
- claude-code-config — Trail of Bits — created 2026-02-04, updated 2026-10-10 — https://github.com/trailofbits/claude-code-config — opinionated defaults, deny list, local LM Studio — [primary]
- claude-code-devcontainer — Trail of Bits — created 2025-09, updated 2026-10 — https://github.com/trailofbits/claude-code-devcontainer — bypass-safe container — [primary]
- sandbox-runtime (srt) — Anthropic — accessed 2026-10-11 — https://github.com/anthropics/sandbox-runtime — whole-process sandbox — [primary]
- Docker Sandboxes docs (index/architecture/claude-code/release notes) — Docker — releases 2026-09-21 to 2026-10-05 — https://raw.githubusercontent.com/docker/docs/main/content/manuals/ai/sandboxes/_index.md — microVM, credential proxy — [primary]
- OpenClaw README / SECURITY.md / Security tab — OpenClaw Foundation — repo 2025-11-24 to present — https://github.com/openclaw/openclaw — threat model, 73 pages of advisories — [primary]
- OpenClaw providers & hosting FAQ — OpenClaw — accessed 2026-10-11 — https://raw.githubusercontent.com/openclaw/openclaw/main/docs/help/faq-first-run/providers-and-hosting.md — Mac mini vs VPS — [primary]
- OpenClaw Anthropic provider — OpenClaw — accessed 2026-10-11 — https://raw.githubusercontent.com/openclaw/openclaw/main/docs/providers/anthropic.md — API key over setup-token — [primary]
- OpenClaw Mac mini minimal security config — UGREEN — Feb 2026 — https://eu.ugreen.com/es/blogs/docking-station/openclaw-mac-mini-configuracion-minima-seguridad — ClawHavoc figures — [secondary]
- OpenClaw/Moltbot/Clawdbot 101 — Sid Saladi — 2026 — https://sidsaladi.substack.com/p/openclawmoltbotclawdbot-101-the-complete — naming history — [secondary]
- Ollama + Claude Code / context length docs — Ollama — accessed 2026-10-11 — https://raw.githubusercontent.com/ollama/ollama/main/docs/integrations/claude-code.mdx — `ollama launch claude`, 64k — [primary]
- llama.cpp server README — ggml-org — accessed 2026-10-11 — https://raw.githubusercontent.com/ggml-org/llama.cpp/master/tools/server/README.md — `/v1/messages` — [primary]
- claude-code-router — musistudio — updated 2026-10 — https://github.com/musistudio/claude-code-router — local gateway — [primary]
- Kimi-K3 — Moonshot AI — repo 2026-07-27 — https://github.com/MoonshotAI/Kimi-K3 — 2.8T/104B, vendor benchmarks — [primary, vendor claims]
- GLM-5 — Z.ai — repo 2026-02-09 — https://github.com/zai-org/GLM-5 — 744B-A40B, 5.3-Flash — [primary, vendor claims]
- Qwen3-Coder — Qwen — accessed 2026-10-11 — https://github.com/QwenLM/Qwen3-Coder — Coder-Next supports Claude Code — [primary]
- GLM-5.3-Flash on 2× DGX Spark — MiaAI-Lab — 2026-09 — https://github.com/MiaAI-Lab/GLM-5.3-Flash-EXL3-2x-DGX-Sparks — measured tok/s — [secondary/community]
- Qwen3.8-Flash-Next on 1× DGX Spark — MiaAI-Lab — 2026-09 — https://github.com/MiaAI-Lab/Qwen3.8-Flash-Next-Single-DGX-Spark — measured tok/s — [secondary/community]
- amd-strix-halo-toolboxes — kyuz0 — updated 2026-10 — https://github.com/kyuz0/amd-strix-halo-toolboxes — Strix Halo numbers — [secondary/community]
- whichllm — Andyyyy64 — snapshot 2026-05 — https://github.com/Andyyyy64/whichllm — hardware → model picks — [secondary/community]
- qwen3.6-windows-server — devnen — 2026-04 — https://github.com/devnen/qwen3.6-windows-server — 5090 throughput claim — [secondary/community]
- claude-squad — smtg-ai — last push 2026-08-20 — https://github.com/smtg-ai/claude-squad — tmux TUI — [primary]
- vibe-kanban — BloopAI — last push 2026-09-19 — https://github.com/BloopAI/vibe-kanban — "sunsetting" — [primary]
- crystal — Stravu — deprecated Feb 2026 — https://github.com/stravu/crystal — replaced by Nimbalyst — [primary]
- terragon-oss — Terragon Labs — 2026-01-16 — https://github.com/terragon-labs/terragon-oss — shutdown snapshot — [primary]
- superset — Superset — updated 2026-10 — https://github.com/superset-sh/superset — ELv2, mac-first — [primary]
- emdash — General Action — updated 2026-10 — https://github.com/generalaction/emdash — Apache-2.0, cross-platform — [primary]
- sculptor — Imbue — updated 2026-10 — https://github.com/imbue-ai/sculptor — experimental research preview — [primary]
- Conductor run-parallel workflow page — Melty Labs — 2026 — https://www.conductor.build/workflows/run-parallel-claude-codes — Conductor Cloud — [primary, seen in results]
- Conductor AI coding overview — Morph — Mar 2026 — https://www.morphllm.com/conductor-ai-coding — free, Apple Silicon — [secondary]
- gastown — Gas Town Hall (Steve Yegge) — updated 2026-10 — https://github.com/gastownhall/gastown — 20–30 agents — [primary]
- agent-scripts — Peter Steinberger — updated 2026-10 — https://github.com/steipete/agent-scripts — shared AGENTS.md/skills — [primary]
- happy — slopus — updated 2026-10 — https://github.com/slopus/happy — mobile/desktop client, encrypted relay — [primary]
- omnara — Omnara — updated 2026-10 — https://github.com/omnara-ai/omnara — pivot to managed agents — [primary]
- vibetunnel — Amantus AI — updated 2026-10 — https://github.com/amantus-ai/vibetunnel — browser terminal — [primary]
- pocket-terminal — D. Genovese — 2026-08 — https://github.com/domenicdgenovese/pocket-terminal — Tailscale/mosh traps — [secondary/anecdotal]
- openai/codex README — OpenAI — accessed 2026-10-11 — https://github.com/openai/codex — `codex app`, plan inclusion — [primary]
- ccusage — ryoppippi et al. — updated 2026-10 — https://github.com/ccusage/ccusage — usage CLI — [primary]
- ccstatusline — sirmalloc — updated 2026-10 — https://github.com/sirmalloc/ccstatusline — status line TUI — [primary]
- awesome-claude-code — hesreallyhim — accessed 2026-10-11 — https://raw.githubusercontent.com/hesreallyhim/awesome-claude-code/main/README.md — tool directory — [secondary]
- playwright-mcp — Microsoft — accessed 2026-10-11 — https://github.com/microsoft/playwright-mcp — CLI+skills advice — [primary]
- chrome-devtools-mcp — Google Chrome DevTools — accessed 2026-10-11 — https://github.com/ChromeDevTools/chrome-devtools-mcp — security notes — [primary]
- context7 — Upstash — accessed 2026-10-11 — https://github.com/upstash/context7 — `ctx7` CLI+skill — [primary]
- agent-browser — Vercel Labs — accessed 2026-10-11 — https://github.com/vercel-labs/agent-browser — browser CLI — [primary]
- supabase/mcp — Supabase — accessed 2026-10-11 — https://github.com/supabase/mcp — `read_only`/`project_ref` — [primary]
- HA MCP Server integration — Home Assistant — since 2025.2 — https://raw.githubusercontent.com/home-assistant/home-assistant.io/current/source/_integrations/mcp_server.markdown — `claude mcp add` — [primary]
- obsidian-second-brain — E. Ghelbur — 2026-03 to present — https://github.com/eugeniughelbur/obsidian-second-brain — vault agents — [primary]
- Handy — cjpais — updated 2026-10 — https://github.com/cjpais/Handy — offline STT — [primary]
- VoiceInk — Beingpax — updated 2026-10 — https://github.com/Beingpax/VoiceInk — macOS offline STT — [primary]
- ntfy — binwiederhier — accessed 2026-10-11 — https://github.com/binwiederhier/ntfy — push notifications — [primary]
- viberank — sculptdotfun — updated 2026-09 — https://github.com/sculptdotfun/viberank — ccusage leaderboard — [secondary]
- Anthropic's Remote Control brings Claude Code to mobile — Help Net Security — Feb 2026 — https://www.helpnetsecurity.com/?p=358918 — launch as Max research preview — [secondary]
- Mi setup: Claude Code + Ghostty + worktrees — KeepCoding — 2026-05-24 — https://keepcoding.io/blog-frr/mi-setup-claude-code-ghostty-worktrees-mac/ — Ghostty splits over tmux — [secondary, seen in results only]
- Claude rate limits 2026 — heyuan110 — 2026-02-28 — https://www.heyuan110.com/posts/ai/2026-02-28-claude-rate-limits/ — measured caps — [secondary, seen in results only]
- Claude Max plan: pricing, limits — Leanware — 2026 — https://leanware.co/insights/claude-max-plan — limit-change claims — [secondary, seen in results only]

## 7. Unverified / low-confidence items

- **Hardware prices.** None were verifiable this session because vendor sites were unreachable. Approximate prices from memory, before any 2026 DRAM-driven increases: Mac mini M4 from about $599; DGX Spark about $3,999 at launch (October 2025); Strix Halo 128 GB boxes about $2,000; Mac Studio M3 Ultra 512 GB about $9,500; RTX 5090 $1,999 MSRP; RTX PRO 6000 96 GB about $8–9k. Rig cost ranges in §5 depend on these.
- **ChatGPT plan prices** (Plus about $20, Pro about $200) and Codex limits: not verified.
- **Conductor:** pricing, Pro plan and Cloud details come only from vendor or competitor pages seen in results. Paseo and other alternatives were not checked.
- **Vibe Kanban "community-maintained" status:** the README says only "sunsetting." The shutdown post could not be fetched.
- **ClawHavoc figures** (341 of 2,857 skills, Atomic Stealer): secondary only; Koi Security's report was not reachable.
- **OpenClaw history:** the Clawdbot → Moltbot → OpenClaw renames are from secondary sources. That Steinberger moved to OpenAI and the project went to a foundation is from memory; the README confirms only "OpenClaw Foundation."
- **Limit-change reports:** peak-hour drain from 2026-03-26 and doubled 5-hour limits from 2026-05-06 are secondary. Anthropic's older (2025) "hours of Sonnet/Opus per week" estimates are likely stale for the 5.x models.
- **Timing of the Opus 5.5 / Sonnet 5.5 / Haiku 5.5 launch:** these appear on the pricing page and in the docs, but the W37 digest (Sep 7–11) predates them. Exact dates not found.
- **Model benchmark parity claims** (Kimi K3, GLM-5.x) are vendor-reported and use no neutral harness. Community throughput numbers vary widely (Qwen3.6-27B on an RTX 5090: about 40 vs 158 tok/s).
- **Wispr Flow, SuperWhisper, MacWhisper, Blink, Termius, Pushover:** features and prices not verified this session.
- **Channels launch date and Remote Control general availability** across plans: the dates are not in the docs I could reach.
- **Ergonomics and multi-monitor practices:** no rigorous source found; the recommendations are docs-derived proxies.
- **Monthly API credits details** (claiming after 7 days, $500 Team pool): from search-result summaries of the support and platform pages, not fetched in full.
