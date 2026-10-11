# The Practitioner Canon: How Influential Individual Engineers Run Coding Agents (2025 to mid-2026, with later updates noted)

Slice 5 of 8. Scope: individual practitioners' coding-agent workflows, setups, techniques, quotes, and how their views changed. Research date: 2026-10-11.

**Method note.** The shared WebSearch budget (200 calls) ran out about a quarter of the way through this slice, and WebFetch could not resolve most personal-blog domains from this sandbox. I therefore relied heavily on primary sources hosted on GitHub that the authors publish themselves:
- Armin Ronacher's blog source (`mitsuhiko/lucumr`).
- Peter Steinberger's blog source (`steipete/steipete.me`).
- Mario Zechner's blog source (`badlogic/mariozechner.at`).
- Lance Martin's blog source (`rlancemartin/rlancemartin.github.io`).
- Simon Willison's nightly database backup (`simonw/simonwillisonblog-backup`). It contains his posts, his *Agentic Engineering Patterns* chapters, and his dated link-blog commentary, with the URLs he linked.
- Practitioners' repos: HumanLayer, Superpowers, Ralph, Gas Town, Beads, Pi, Every's compound-engineering plugin, Matt Pocock's skills, Ryan Carson's repos, Karpathy's autoresearch, and Ghostty.

Where a claim rests only on a search-engine summary or on memory, I say so. Those claims are collected in §7.

---

## 1. Top takeaways

1. **Majority-agent-written code became normal among elite practitioners in the second half of 2025.**
   - Armin Ronacher was "probably north of 90% AI-written code" for a 40k-LOC Go service (Sep 2025).
   - Peter Steinberger said agents write "pretty much 100% of my code" (Oct 2025).
   - Karpathy flipped from 80% manual to "80% agent coding and 20% edits+touchups" in December 2025.
   - Simon Willison said in Apr 2026: "probably 95% of the code that I produce, I didn't type myself". [lucumr 90%](https://lucumr.pocoo.org/2025/9/29/90-percent/) · [steipete](https://steipete.me/posts/just-talk-to-it) · [Karpathy](https://x.com/karpathy/status/2015883857489522876)
2. **Many cite a "November/December 2025 inflection"** (Claude Opus 4.5, GPT-5.1/5.2). Simon calls Opus 4.5 "the first one that earned my trust". Karpathy (Feb 2026): "coding agents basically didn't work before December and basically work since". [Karpathy](https://twitter.com/karpathy/status/2026731645169185220)
3. **Verification is the core skill, not prompting.** The recurring phrases are "Use red/green TDD", "First run the tests" and "Your job is to deliver code you have proven to work". Carlini warns "it is easy to see tests pass and assume the job is done, when this is rarely the case". [Simon, Red/green TDD](https://simonwillison.net/guides/agentic-engineering-patterns/red-green-tdd/) · [Simon, proven to work](https://simonwillison.net/2025/Dec/18/code-proven-to-work/) · [Carlini](https://www.anthropic.com/engineering/building-c-compiler)
4. **Context engineering replaced prompt engineering as the frame.**
   - Karpathy's definition (Jun 2025).
   - Breunig's four failure modes: poisoning, distraction, confusion, clash.
   - Dex Horthy's "keeping utilization in the 40%-60% range" with frequent intentional compaction.
   - Manus: offload, reduce, isolate, plus KV-cache discipline. [Breunig fixes](https://www.dbreunig.com/2025/06/26/how-to-fix-your-context.html) · [ACE-FCA](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md)
5. **Plans live in editable markdown files on disk; "plan mode" itself is contested.** Harper Reed, Dex Horthy, Kent Beck, Jesse Vincent, Every and Huntley all write spec/plan files first. Armin, Mario and Steinberger argue Claude Code's plan mode is "mostly a custom prompt" and prefer conversational planning into a file. [Armin, plan mode](https://lucumr.pocoo.org/2025/12/17/what-is-plan-mode/)
6. **CLIs and skills beat MCP for coding agents (near consensus by late 2025).**
   - Playwright MCP costs 13.7k tokens, against 225 tokens for a README of four scripts (Mario).
   - GitHub MCP costs 23k tokens, against `gh` at zero (Steinberger).
   - Simon called 2025 "the (only?) year of MCP".
   - Armin's Pi 1.0 later re-added MCP via "Codemode" (Oct 2026). [Mario](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/)
7. **YOLO mode (skipping permission prompts) is the power-user default, with mitigations.** Mitigations include containers, remote or cloud agents, backups, and tightly scoped credentials. The counterweights are the "lethal trifecta" and the "normalization of deviance". [Simon, agentic loops](https://simonwillison.net/2025/Sep/30/designing-agentic-loops/) · [lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)
8. **Parallelism is bounded by human review.**
   - Simon: "I can only focus on reviewing and landing one significant change at a time". He runs research and maintenance in parallel.
   - Steinberger: 3–8 Codex agents in one folder.
   - Hashimoto: one background agent.
   - Yegge's Gas Town: 20–30 agents, which later "fell apart" (Aug 2026). [Simon, parallel agents](https://simonwillison.net/2025/Oct/5/parallel-coding-agents/)
9. **"Harness engineering": every agent mistake becomes a permanent fix in the environment** (AGENTS.md, scripts, tests). Hashimoto's Step 5 named it. Steinberger's ~800-line AGENTS.md is "organizational scar tissue". Huntley tunes Ralph "like a guitar". [Hashimoto](https://mitchellh.com/writing/my-ai-adoption-journey)
10. **Outer loops (Ralph, autoresearch) work best when the goal is verifiable.** Examples are greenfield builds against specs, ports, performance and research. Armin, Mario and Dex Horthy doubt they work for long-lived code. Codex CLI shipped `/goal` (a Ralph-style loop) in Apr 2026. [Huntley, Ralph](https://ghuntley.com/ralph/) · [autoresearch](https://github.com/karpathy/autoresearch)
11. **Make codebases agent-legible.**
    - Armin: simple code, Go, plain SQL, fast tools, logs written to files, "the dumbest possible thing that will work".
    - Steinberger: CLI-first, and codebases "so agents can work in it efficiently".
    - Simon: language-agnostic conformance suites. [Armin](https://lucumr.pocoo.org/2025/6/12/agentic-coding/)
12. **The bottleneck has moved to review and accountability.** See Armin's "The Final Bottleneck", Simon's May 2026 admission that he no longer reviews every line, Ghostty's AI policy and Vouch, and Simon's anti-pattern "Don't file pull requests with code you haven't reviewed yourself". [Simon, May 2026](https://simonwillison.net/2026/May/6/vibe-coding-and-agentic-engineering/)
13. **Cognitive load and addiction are recurring warnings.** Steinberger calls himself a "Claudoholic". Simon is "wiped out" by 11am running four agents. Yegge wrote "The AI Vampire". Armin wrote "Agent Psychosis". [Yegge](https://steve-yegge.medium.com/the-ai-vampire-eda6e4f07163)
14. **Compounding learning loops: each session should leave the harness smarter.** Examples are Every's `/ce-compound` writing to `docs/solutions/`, Lance Martin's `/diary` + `/reflect`, Ralph updating AGENTS.md, Jesse Vincent's journal, and antirez's `IMPLEMENTATION_NOTES.md`. [Every plugin](https://github.com/EveryInc/compound-engineering-plugin)
15. **Tool and model loyalties shift fast; much of it is "vibes".**
    - Steinberger moved from Claude Code to Codex (Oct 2025).
    - Armin went from Claude Code + Sonnet to Claude + Codex review to Pi.
    - Mario left Claude Code to write Pi.
    - Hashimoto used Amp.
    - Armin: "I have nothing beyond vibes to back up my preference for Claude." [Armin, year of vibes](https://lucumr.pocoo.org/2025/12/22/a-year-of-vibes/)
16. **The strongest skeptics are themselves heavy users.**
    - Mario: compounding "booboos", low recall in agentic search, "slow the fuck down".
    - Armin: loop code is "too defensive, too complex, too local".
    - Karpathy: agents "net unhelpful" for nanochat (Oct 2025).
    - Dex Horthy: "Why Software Factories Fail" (2026). [Mario](https://news.ycombinator.com/item?id=47517539)
17. **Async/cloud agents are best for research and risky tasks.** Simon fires off "2-3 code research projects a day" into a dedicated repo. Steinberger uses Codex web as a phone-driven issue tracker. Hashimoto runs "end-of-day agents". [simonw/research](https://github.com/simonw/research)
18. **Minimalism in harnesses persuades many experts.** Thorsten Ball: "It's an LLM, a loop, and enough tokens". Pi has four tools and a system prompt plus tools under 1,000 tokens. Armin uses Pi "almost exclusively" (Jan 2026). [Thorsten Ball](https://ampcode.com/how-to-build-an-agent) · [Armin, Pi](https://lucumr.pocoo.org/2026/1/31/pi/)

---

## 2. Detailed findings (per practitioner)

### 2.1 Simon Willison: "vibe engineering" → *Agentic Engineering Patterns*

**Setup (Oct 2025).**
- Daily drivers: "Claude Code (on Sonnet 4.5), Codex CLI (on GPT-5-Codex), and Codex Cloud (for asynchronous tasks, frequently launched from my phone)". He was also trying Copilot coding agent and Jules.
- He keeps multiple terminal windows in different directories, in YOLO mode "for tasks where I'm confident malicious instructions can't sneak into the context".
- No worktrees: "I do a fresh checkout, often into /tmp". Riskier tasks go to Codex Cloud.

[Parallel agents](https://simonwillison.net/2025/Oct/5/parallel-coding-agents/) (2025-10-05)

**Parallel-task taxonomy.**
- Research/proofs of concept.
- "How does that work again?" explanations, which are worth stashing as future context.
- Small maintenance, such as fixing deprecation warnings.
- "Carefully specified and directed actual work". Code from your own spec "is a lot less effort to review".

He endorses Josh Bleecher Snyder's "send out a scout" (an attempt you never intend to merge). Bottleneck: "I can only focus on reviewing and landing one significant change at a time". (same post)

**Designing agentic loops** (2025-09-30).
- "If you can reduce your problem to a clear goal and a set of tools that can iterate towards that goal a coding agent can often brute force its way to an effective solution."
- YOLO options: sandbox, "someone else's computer" (Codespaces), or take a risk. "Most people choose option 3."
- Prefer shell commands documented in AGENTS.md over MCP.
- Issue tightly scoped credentials. Example: a dedicated Fly.io org with a $5 budget.

[post](https://simonwillison.net/2025/Sep/30/designing-agentic-loops/)

**Vibe engineering** (2025-10-07). LLMs "actively reward existing top tier software engineering practices": tests, planning, docs, Git habits, CI, review culture, "a very weird form of management", manual QA, preview environments and re-learned estimation. "AI tools amplify existing expertise." Update (Feb 2026): "Agentic Engineering" won as the term.

[post](https://simonwillison.net/2025/Oct/7/vibe-engineering/)

**Async code research** (2025-11-06).
- Dedicated repo, unlimited network, "2-3 code research projects a day".
- `simonw/research` held 99 agent-written projects by Oct 2026. "Every single line of text and code was written by an LLM."

[repo](https://github.com/simonw/research)

**Agentic Engineering Patterns** (guide launched 2026-02-23; 16 chapters by Apr 2026). Chapters include:
- "Writing code is cheap now" ("Good code still has a cost").
- "Hoard things you know how to do": recombine working examples.
- "AI should help us produce better code": "Shipping worse code with agents is a *choice*".
- "Anti-patterns": "Don't file pull requests with code you haven't reviewed yourself".
- "Red/green TDD", "First run the tests", "Agentic manual testing" (`python -c`, `curl`, `/tmp` scratch files).
- "Linear walkthroughs" (using his Showboat tool), "Using Git with coding agents", "Subagents", "Prompts I use".

[guide](https://simonwillison.net/guides/agentic-engineering-patterns/) · [intro](https://simonwillison.net/2026/Feb/23/agentic-engineering-patterns/)

**Evolution.**
- Sep 2025: skeptical of parallel agents. Oct 2025: embraced them.
- Feb 2026: "Opus 4.5 was the first one that earned my trust". He opens every session by telling the agent how to run the tests, then says "use red-green TDD" ("it's like five tokens, and that works").
- Feb 2026 also brought "conformance-driven development": have the agent build a test suite that passes against six frameworks, then implement against it (Pragmatic Summit fireside chat; via blog backup).
- Apr 2026: "I write so much of my code on my phone" (Claude iPhone app / Claude Code for web). "I can fire up four agents in parallel … by like 11 AM, I am wiped out for the day" (Lenny's Podcast highlights).
- May 2026: "I'm not reviewing every line of code that they write anymore, even for my production level stuff". He treats agents like another team's service, while warning of "the normalization of deviance".

[May 2026](https://simonwillison.net/2026/May/6/vibe-coding-and-agentic-engineering/)

**Security frame.** The lethal trifecta: private data + untrusted content + external communication (2025-06-16). The 2025 review chapter is titled "The year of YOLO and the Normalization of Deviance". [trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) · [2025 review](https://simonwillison.net/2025/Dec/31/the-year-in-llms/)

### 2.2 Armin Ronacher (Flask; Earendil): from Claude-yolo to Pi

**Jun 2025 recommendations** ([post](https://lucumr.pocoo.org/2025/6/12/agentic-coding/), 2025-06-12).
- Setup: Claude Code on the $100 Max plan, "exclusively … Sonnet". He prefers its output over Opus.
- He assigns a job, rarely interrupts, and uses Vim for final edits.
- "I disable all permission checks", via a `claude-yolo` alias. Docker is suggested to contain risk.
- MCP only when unavoidable (Playwright). The agent uses `psql` directly.
- "I strongly recommend Go for new backend projects": explicit context, test caching, structural interfaces, low churn. Python's magic (pytest fixtures, async) trips agents.
- Tool rules: fast, user-friendly, "protected against an LLM chaos monkey", observable.
- Make it easy to observe: a Makefile with `make dev` guarded by a pidfile ("services already running"), and all output tee'd to a log file the agent can tail. Emails are logged to stdout in debug mode so the agent can complete sign-in flows.
- "Have the agent do 'the dumbest possible thing that will work'". Plain SQL. "Keep important checks local". Be "more conservative about upgrades".

**What didn't work** ([post](https://lucumr.pocoo.org/2025/7/30/things-that-didnt-work/), 2025-07-30).
- Most slash commands went unused (`/fix-bug`, `/commit`, `/add-tests`, `/fix-nits`, `/next-todo`). The one he kept infers files from `git status`.
- Hooks gave "no efficiency gains" in YOLO mode. Workaround: PATH "interceptors".
- Print mode is unreliable. Subagents help only for investigative tasks.
- What works: "just talk to the machine more, give it more context, keep the audio input going … that is 95% of my workflow."
- Automation rule: only automate what you do regularly. Evaluate by running the same task three times and judging the variance.
- Warning: automation "encourages mental disengagement".

**90%** ([post](https://lucumr.pocoo.org/2025/9/29/90-percent/), 2025-09-29).
- Design, schema and architecture by hand, with AI "as a kind of rubber duck". Raw SQL including migrations. OpenAPI-first.
- "Claude Code and Codex … the constant is Codex for code review after PRs". Claude for debugging that needs tool access.
- PR-sized chunks: "agent loop with finishing touches", with a todo list for cleanups.
- "I still treat every line as my responsibility, judged as if I wrote it myself."

**Late 2025.**
- Moved his last MCPs (Playwright, Sentry) to skills. Preferred path: "ask the agent to write its own tools as a skill" ([source](https://raw.githubusercontent.com/mitsuhiko/lucumr/main/blog/posts/2025/12-13-skills-vs-mcp.md), 2025-12-13).
- Took apart plan mode. It is a hidden markdown plan file plus injected read-only reminders, "mostly a custom prompt to give it structure, and some system reminders and a handful of examples". He instead has the agent ask clarifying questions, answers them in an editor, and iterates on a markdown handoff ([post](https://lucumr.pocoo.org/2025/12/17/what-is-plan-mode/), 2025-12-17).
- Year review: "Amp … the Apple or Porsche of agentic coding tools, Claude Code is the affordable Volkswagen, and Pi is the Hacker's Open Source choice". He wants version control that preserves prompts and failed paths, and review built into the VCS ([post](https://lucumr.pocoo.org/2025/12/22/a-year-of-vibes/)).

**2026.**
- Pi is "the coding agent that I use almost exclusively" (Jan 31), with his own extensions: `/answer` (question extraction), `/todos` (file-backed, claimable), `/review` (branch the session tree into a fresh review context), `/control`, `/files` ([post](https://lucumr.pocoo.org/2026/1/31/pi/); [agent-stuff](https://github.com/mitsuhiko/agent-stuff)).
- "A Language For Agents" (Feb 9): local reasoning, greppable code, explicit context, results over exceptions. Agents hate macros, re-exports and flaky tests ([post](https://lucumr.pocoo.org/2026/2/9/a-language-for-agents/)).
- "The Final Bottleneck" (Feb 13): review capacity and accountability. "I too am the bottleneck now" ([source](https://raw.githubusercontent.com/mitsuhiko/lucumr/main/blog/posts/2026/02-13-the-final-bottleneck.md)).
- Later updates:
  - "The Coming Loop" (Jun 23) concedes loops work for porting, performance, security scanning and research. But "present-day models tend to produce code that is too defensive, too complex, too local in its reasoning", and loops amplify this ([source](https://raw.githubusercontent.com/mitsuhiko/lucumr/main/blog/posts/2026/06-23-the-coming-loop.md)).
  - "Better Models: Worse Tools" (Jul 4): newer Claude models invent fields in tool calls ([post](https://lucumr.pocoo.org/2026/7/4/better-models-worse-tools/)).
  - "What is Codemode" (Oct 6): Pi 1.0 adds MCP via code execution ([source](https://raw.githubusercontent.com/mitsuhiko/lucumr/main/blog/posts/2026/10-06-codemode.md)).

### 2.3 Peter Steinberger (PSPDFKit founder; OpenClaw; joined OpenAI Feb 2026)

**Jun 2025, "Claude Code is My Computer"** ([source](https://raw.githubusercontent.com/steipete/steipete.me/main/src/content/blog/2025/claude-code-is-my-computer.md), 2025-06-03).
- Two months of `--dangerously-skip-permissions` on macOS, with hourly Arq snapshots plus a SuperDuper clone. "Zero incidents."
- He uses it for OS administration, migrations and git ("commit everything in logical chunks"). Alias `cc`.
- His Jun 1 workshop used a spec-first flow: dictate into Gemini AI Studio, have a *second* AI instance list "what questions do you have?", fold the answers back in, then generate code ([post](https://steipete.me/posts/2025/the-future-of-vibe-coding)).

**Aug 2025.**
- Ghostty + Claude Code + VS Code on the side, on a 40" monitor fitting four Claude instances.
- "All of these work on main". Worktrees "just slows me down". 1–2 agents normally, ~4 for cleanup, tests or UI.
- GPT-5 reviews plans. He "removed my last MCP". Tests are written "IN THE SAME CONTEXT".
- Session time shown in the statusline ([source](https://raw.githubusercontent.com/steipete/steipete.me/main/src/content/blog/2025/optimal-ai-development-workflow.md)).
- "Just One More Prompt" (Aug 19): "I'm a Claudoholic … I'm addicted to agentic engineering" ([source](https://raw.githubusercontent.com/steipete/steipete.me/main/src/content/blog/just-one-more-prompt.md)).

**Oct 2025, "Just Talk To It"** ([post](https://steipete.me/posts/just-talk-to-it), 2025-10-14).
- "completely moved to `codex` cli". "I run between 3-8 in parallel in a 3x3 terminal grid, most of them in the same folder".
- Agents make atomic commits of only their own files. Model: gpt-5-codex on medium.
- Thinks in "blast radius". Interrupts with "what's the status". Uses "give me a few options before making changes".
- Left Claude Code over "absolutely right" sycophancy and "100% production ready messages while tests fail".
- Cost: four OpenAI subscriptions plus one Anthropic, about $1k/month.
- Prompts are 1–2 sentences plus a screenshot (~50% of prompts). No plan mode: "No harness charade needed. Just talk to it."
- Commands: `/commit`, `/automerge`, `/massageprs`, `/review`.
- Background processes go to tmux. "Almost all MCPs really should be clis". `chrome-devtools-mcp` is used only "to close the loop".
- ~20% of time on agent-run refactoring (jscpd, knip, ESLint react-compiler).
- AGENTS.md is "~800 lines … organizational scar tissue", symlinked as CLAUDE.md. ast-grep rules run as a git hook.

**Dec 2025, "Shipping at Inference-Speed"** ([source](https://raw.githubusercontent.com/steipete/steipete.me/main/src/content/blog/2025/shipping-at-inference-speed.md), 2025-12-28).
- "These days I don't read much code anymore". Output is "limited by inference time and hard thinking".
- Builds start as a CLI so agents can verify output.
- Model: gpt-5.2-codex on high. Built `oracle` (an agent-callable GPT-5 Pro CLI).
- Habits: queueing, "never revert", "commit to main", cross-project references ("look at ../vibetunnel and do the same"), a `docs/` folder plus a `docs:list` script forcing doc reads.
- Two Macs (MacBook Pro plus a Mac Studio over Jump Desktop). "Plan mode feels like a hack that was necessary for older generations of models".

**2026.**
- Clawdbot became OpenClaw: 196k stars by Feb 15 (per Simon), ~391k by Oct 2026.
- Joined OpenAI on Feb 15; OpenClaw moves to a foundation ([source](https://raw.githubusercontent.com/steipete/steipete.me/main/src/content/blog/2026/openclaw.md)).
- His shared global AGENTS.MD rules include "Unknown changes = other agent. Continue, touching own scope. Conflict/problem: stop + ask." ([agent-scripts](https://raw.githubusercontent.com/steipete/agent-scripts/main/AGENTS.MD)).

### 2.4 Mario Zechner (libGDX; Pi)

- Started on Claude Code in Apr 2025. Reverse-engineered it (claude-trace, cchistory).
- Grew to dislike it as "a spaceship with 80% of functionality I have no use for", with system prompts and tools changing on every release.
- **"What if you don't need MCP"** (2025-11-02): four Puppeteer scripts plus a README of 225 tokens replace Playwright MCP (21 tools, 13.7k tokens) and Chrome DevTools MCP (26 tools, 18k tokens) ([post](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/)).
- **Pi** (2025-11-30) ([source](https://raw.githubusercontent.com/badlogic/mariozechner.at/main/src/posts/2025-11-30-pi-coding-agent/index.md)):
  - Four tools (read, write, edit, bash). "pi's system prompt and tool definitions together come in below 1000 tokens".
  - YOLO by default. Other agents' security measures are "mostly security theater" given the trifecta.
  - No plan mode, no MCP, no background bash (use tmux).
  - No sub-agents, except spawning itself via bash for code review. "Spawning multiple sub-agents to implement various features in parallel is an anti-pattern".
  - Gather context in a *separate* session into an artifact, then start fresh, because models are "poor at finding all the context needed".
- **Year review** (2025-12-22):
  - "nobody knows yet how to do this properly". He is in the "tight leash" camp. Armies of agents "a recipe for disaster for me".
  - Commit hooks for typecheck and lint beat LSP diagnostics. He stopped using voice dictation.
  - Agents are "only effective in the hands of domain experts" ([source](https://raw.githubusercontent.com/badlogic/mariozechner.at/main/src/posts/2025-12-22-year-in-review-2025/index.md)).
- **"Thoughts on slowing the fuck down"** (2026-03-25), discussed in §4 ([source](https://raw.githubusercontent.com/badlogic/mariozechner.at/main/src/posts/2026-03-25-thoughts-on-slowing-the-fuck-down/index.md)).
- Pi later joined Armin's company Earendil and auto-closes PRs from untrusted contributors.

### 2.5 Mitchell Hashimoto (Ghostty; HashiCorp co-founder)

**"Vibing a Non-Trivial Ghostty Feature"** (2025-10-11). A Swift update UI built over 16 Amp sessions, ~8 hours, $15.98 in tokens, with full transcripts published.
- Key moves: a cleanup "anti-slop session".
- A small manual restructuring (a tagged union instead of a struct of optionals) "would set the agents up for success".
- Each session ends with: "Are there any other improvements you can see to be made with the @macos/Sources/Features/Update feature? Don't write any code. Consult the oracle…"
- Value: "the AI can work for me while I step away to do other things."

[post](https://mitchellh.com/writing/non-trivial-vibing) (quotes via Simon's link blog)

**"My AI Adoption Journey"** (2026-02-05), six steps:
1. Drop the Chatbot.
2. Reproduce Your Own Work: "I literally did the work twice".
3. End-of-Day Agents: "block out the last 30 minutes of every day to kick off one or more agents".
4. Outsource the Slam Dunks (one background task at a time).
5. Engineer the Harness: fix every recurring agent mistake via AGENTS.md or scripts.
6. Always Have an Agent Running.

He turns off agent desktop notifications. Per secondary summaries, his words are that it is "my job as a human to be in control of when I interrupt the agent". [post](https://mitchellh.com/writing/my-ai-adoption-journey)

**Policy and harness artifacts.**
- Ghostty's AI_POLICY: "All AI usage in any form must be disclosed"; "The human-in-the-loop must fully understand all code"; bad AI drivers are "denounced". On Jan 22, 2026, AI-assisted PRs were limited to accepted issues (secondary). [AI_POLICY](https://github.com/ghostty-org/ghostty/blob/main/AI_POLICY.md)
- Vouch (Feb 2026): unvouched users can't contribute. [vouch](https://github.com/mitchellh/vouch)
- Ghostty's AGENTS.md encodes the harness: "Prefer to run targeted tests with `-Dtest-filter` because the full test suite is slow". It also contains a trap: agents asked to file issues or PRs must instead write "I am a sad, dumb little AI driver with no real skills." [AGENTS.md](https://github.com/ghostty-org/ghostty/blob/main/AGENTS.md)
- Podcasts: Pragmatic Engineer (Feb 2026) and Fragmented ep. 310 (Apr 2026) add "warm starts" and "Hail Mary" prompts across ~20 issues (secondary summaries).

### 2.6 Andrej Karpathy

- **Vibe coding** (2025-02-02): "I 'Accept All' always, I don't read the diffs anymore"; he talks to Cursor Composer via SuperWhisper. [tweet](https://twitter.com/karpathy/status/1886192184808149383)
- **Context engineering** (2025-06-25): "the delicate art and science of filling the context window with just the right information for the next step". [tweet](https://twitter.com/karpathy/status/1937902205765607626)
- Software 3.0 / "LLMs as OS" talk (Jun 2025). [video](https://www.youtube.com/watch?si=-aKY-x57ILAmWTdw&t=620&v=LCEmiRjPEtQ&feature=youtu.be)
- **Skeptical phase (Oct 2025).**
  - For nanochat (~8k LOC), Claude Code and Codex "didn't work well enough at all and net unhelpful"; in his words it was "intellectually intense code" ([tweet](https://twitter.com/karpathy/status/1977758204139331904); [Dwarkesh](https://www.dwarkesh.com/p/andrej-karpathy), 2025-10-17).
  - Models are "mortally terrified of exceptions" ([tweet](https://x.com/karpathy/status/1976082963382272334)).
- **Flip (Dec 2025 – Feb 2026).**
  - "I've never felt this much behind as a programmer" (2025-12-26; [secondary](https://www.aol.com/news/guy-coined-vibe-coding-now-172146964.html)).
  - Jan 26 notes: 80/20 flip; "I really am mostly programming in English now"; setup is "a small few CC sessions on the left in ghostty windows/tabs and an IDE on the right for viewing the code + manual edits" ([tweet](https://x.com/karpathy/status/2015883857489522876)).
  - Adopted the term "agentic engineering" (~Feb 2026, [tweet](https://twitter.com/karpathy/status/2019137879310836075)).
- **autoresearch** (Mar 2026):
  - The agent edits only `train.py`. The human edits `program.md`, called a lightweight "skill" that shapes the "research org".
  - Fixed 5-minute runs, metric `val_bpb`, ~12 experiments per hour or ~100 overnight, "disable all permissions".
  - Shopify's Tobi Lütke reused it for Liquid: 53% faster parse+render. [repo](https://github.com/karpathy/autoresearch)
- Later: "working software increasingly comes out on a tap" (Jun 2026, on Claude Fable 5). [tweet](https://twitter.com/karpathy/status/2064409694761054332)

### 2.7 Geoffrey Huntley: Ralph Wiggum

- **Core**: `while :; do cat PROMPT.md | claude-code ; done` (Jul 2025).
  - One task per loop, a fresh context each iteration, the plan on disk as shared state.
  - "Each time Ralph does something bad, Ralph gets tuned — like a guitar" (secondary). Used for 3 months to build the "cursed" language (Sep 2025).
  - [ralph](https://ghuntley.com/ralph/) · [cursed](https://ghuntley.com/cursed/)
- **Playbook** ([how-to-ralph-wiggum](https://github.com/ghuntley/how-to-ralph-wiggum), Dec 2025 fork of Clayton Farr's):
  - Files: `specs/*` (one per JTBD topic), `PROMPT_plan.md`/`PROMPT_build.md`, a disposable `IMPLEMENTATION_PLAN.md`, a ~60-line operational `AGENTS.md`.
  - Command: `claude -p --dangerously-skip-permissions --output-format=stream-json --model opus`.
  - Context: ~176k usable tokens, a "40-60% smart zone". The main context acts as scheduler; subagents fan out, but only one runs build/test.
  - "Backpressure" from tests, types and lints, plus LLM-as-judge for subjective criteria.
  - Run it sandboxed: "It's not if it gets popped, it's when." "Let Ralph Ralph."
- **MCP cost** (Aug 2025): ~176k usable context. The GitHub MCP adds 93 tools and ~55k tokens. [allocations](https://ghuntley.com/allocations/)
- **"everything is a ralph loop"** (2026-01-17): "Software is now clay on the pottery wheel". The engineer is "programming the loop". The approach is monolithic, not multi-agent. [loop](https://ghuntley.com/loop/)
- Dex Horthy's history: Huntley demoed overnight autonomous livestreams in Jun 2025. Ralph "went viral in the final weeks of 2025", and Anthropic shipped a stop-hook plugin. Dex: nobody serious recommends the plugin for production; it is "a fascinating learning exercise" (2026-01-06). [history](https://www.humanlayer.dev/blog/brief-history-of-ralph)

### 2.8 Steve Yegge (+ Gene Kim)

- Mar 2025: Claude Code is "like a wood chipper fueled by dollars". [tweet](https://twitter.com/Steve_Yegge/status/1898674257808515242)
- Apr 2025, "Revenge of the junior developer": waves from completions to agents to agent clusters to fleets (secondary [republish](https://conffab.com/?p=8063)).
- Jul 2025: an agent "wiped a production database password"; running with checks disabled is "dangerous and stupid". [tweet](https://x.com/steve_yegge/status/1946360175339974807)
- Book *Vibe Coding* with Gene Kim (IT Revolution, Oct 2025; release year per publisher listings). Its framework is "FAAFO": fast, ambitious, autonomous, fun, optionality. [publisher](https://itrevolution.com/articles/vibe-coding-the-revolutionary-approach-transforming-software-development/)
- **Beads** (2025-10-13) is a git/Dolt-backed dependency-graph issue tracker "for agents", replacing markdown plans:
  - Commands: `bd ready`, `bd create`, `bd dep add`, `bd update --claim`.
  - Its CLI was designed by "Desire Paths": "make their hallucinations real" (Jan 2026).
  - [beads](https://github.com/steveyegge/beads) · [Software Survival 3.0](https://steve-yegge.medium.com/software-survival-3-0-97a2a6255f7b)
- **Gas Town** (Jan 2026):
  - Roles: Mayor (concierge), polecats (ephemeral workers producing MRs), witness, deacon, and a refinery merge queue, over tmux and Claude Code.
  - "Scale comfortably to 20-30 agents".
  - Eight-stage adoption model: stage 8 is "build your own orchestrator".
  - [post](https://steve-yegge.medium.com/welcome-to-gas-town-4f25ee16dd04) · [repo](https://github.com/steveyegge/gastown)
- **Evolution**:
  - "The AI Vampire" (Feb 2026): agent fatigue and value capture by employers.
  - Apr 2026: industry split of "20% agentic power users, 20% outright refusers, 60% still using Cursor or equivalent".
  - Aug 2026: "Gas Town fell apart at the seams with Opus 4.7" ("just two more things" tic). [Vampire](https://steve-yegge.medium.com/the-ai-vampire-eda6e4f07163) · [Shape of Things](https://yegge.ai/essays/the-shape-of-things-to-come/)

### 2.9 Dex Horthy (HumanLayer)

- **12-factor agents**: "Own your context window", "Compact Errors into Context Window", "Small, Focused Agents". [repo](https://github.com/humanlayer/12-factor-agents)
- **ACE-FCA** (~Aug/Sep 2025): Research → Plan → Implement, with "frequent intentional compaction" and "keeping utilization in the 40%-60% range".
  - Humans review research and plans: "I can't read 2000 lines of golang daily. But I _can_ read 200 lines of a well-written implementation plan."
  - Results: a BAML (300k LOC Rust) fix approved next day; 35k LOC in 7 hours.
  - Costs and limits: about $12k/month on Opus for 3 people; failures on a race condition and on parquet-java. [ace-fca](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md)
- **Commands** ([27 files](https://github.com/humanlayer/humanlayer/tree/main/.claude/commands)):
  - `research_codebase` spawns locator, analyzer and pattern-finder subagents. Rule: "Document what IS, not what SHOULD BE".
  - `create_plan` uses phases with separate "Automated Verification" and "Manual Verification", a "What We're NOT Doing" section, and "Don't assume - verify with code".
  - Others: `implement_plan`, `validate_plan`, `create_handoff`/`resume_handoff`, `ralph_*`.
- **2026 update ("Why Software Factories Fail")**:
  - Lights-off factories fail because training gives "no penalty for eroding codebase maintainability".
  - New flow: product review → system architecture → program design (types, signatures) → vertical slices reviewed 100–200 lines at a time.
  - "30 minutes of planning saves hours of review"; "Read the dang code." [wsff.md](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md)

### 2.10 Jesse Vincent (Superpowers; Prime Radiant)

- **CLAUDE.md** ([dotfiles](https://github.com/obra/dotfiles/blob/main/.claude/CLAUDE.md)):
  - "We're colleagues"; "Don't glaze me".
  - "Rule #1: If you want exception to ANY rule, YOU MUST STOP and get explicit permission".
  - TDD for every feature or bugfix; "YOU MUST push back"; journal "failed approaches"; never skip pre-commit hooks.
- **Sep 2025 workflow**: an architect agent iterates on a plan, then fresh Claude Code instances implement it (via Simon). [post](https://blog.fsck.com/2025/10/05/how-im-using-coding-agents-in-september-2025/)
- **Superpowers** (2025-10-09) is a skills plugin with a seven-step pipeline:
  - brainstorming → git worktree → plans of 2–5 minute tasks with exact paths → subagent-per-task plus review → red-green-refactor → review between tasks → finish branch.
  - Skills use Graphviz DOT flowcharts.
  - Philosophy: "Test-Driven Development - Write tests first, always"; "Evidence over claims".
  - [announcement](https://blog.fsck.com/2025/10/09/superpowers/) · [repo](https://github.com/obra/superpowers)
- 2026: evals (superpowers-evals, smevals). Tip (Jul 2026, via Simon): let Fable delegate smaller tasks to cheaper models.

### 2.11 Harper Reed

- **Feb 2025**: brainstorm a spec with "Ask me one question at a time…", save `spec.md`, then a reasoning model writes `prompt_plan.md` + `todo.md`, then execute.
  - Execution was then copy-paste to Claude with repomix. For legacy code he used mise tasks plus repomix.
  - Plea: make coding with an LLM "a multiplayer game". [post](https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/)
- **May 2025 "Basic Claude Code"**: moved from Aider to Claude Code.
  - gpt-4o for the idea, o1-pro/o3 for spec and prompts. A fixed prompt walks `prompt_plan.md`, commits, and pauses (see §3).
  - "THIS IS BAD FOR ROBOTS" (tests-after); "The robots LOVE TDD".
  - Linting plus pre-commit hooks: "The robot REALLLLLY wants to commit".
  - CLAUDE.md adapted from Jesse Vincent's. Plans run 8–12 steps; a greenfield plan takes 30–45 minutes. The whole team uses it.
  - [post](https://harper.blog/2025/05/08/basic-claude-code/)
- Later: Claude Code for email via MCP and skills (Dec 2025). [post](https://harper.blog/2025/12/03/claude-code-email-productivity-mcp-agents/)

### 2.12 Kent Beck: "augmented coding" with "genies"

- **"Augmented Coding: Beyond the Vibes"** (2025-06-25): a B+ tree library in Rust and Python. "In augmented coding you care about the code, its complexity, the tests, & their coverage."
  - Prompt fragment (secondary): "When I say 'go', find the next unmarked test in plan.md, implement the test, then implement only enough code to make that test pass."
  - Warning signs: "1. Loops. 2. Functionality I hadn't asked for… 3. Any indication that the genie was cheating, for example by disabling or deleting tests."
  - Outcome: correctness and performance good, "not so good about the code quality".
  - [post](https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes)
- Earlier "genie" posts: the genie wants to "leap", so constrain context to the next step. [genie posts](https://newsletter.kentbeck.com/p/genie-wants-to-leap)
- Jun 2025, with Gergely Orosz: "90% of my skills just went to zero dollars and 10% of my skills just went up 1000x". [video](https://www.youtube.com/watch?v=aSXaxOdVtAQ&t=12m30s)
- Dec 2025: augmented coding makes "the junior bet" better (AI "collapses the search space"). [post](https://tidyfirst.substack.com/p/the-bet-on-juniors-just-got-better)

### 2.13 Thorsten Ball (Amp)

- "How to Build an Agent" (2025-04-15): an agent is "an LLM, a loop, and enough tokens", in under 400 lines of Go. [post](https://ampcode.com/how-to-build-an-agent)
- Amp's distinctive ideas:
  - Shareable threads (used by Hashimoto).
  - An "oracle" (a stronger model consulted on demand). [news](https://ampcode.com/news/gpt-5-oracle)
  - Removing plan mode (Dec 2025, per Armin).
- Feb 2026: "I too am the bottleneck now". [tweet](https://x.com/thorstenball/status/2022310010391302259)
- Laracon US talk "Think Harder: How I Prompt" (2026-07-29). Secondary notes:
  - Plain prose describing the mechanism; name the folders and files; list constraints; point the agent at existing sources.
  - No MCP, frameworks or custom slash commands; ~99% of Amp's code AI-written.
  - [talk page](https://thorstenball.com/talks/how-i-prompt/)

### 2.14 Kieran Klaassen & Dan Shipper (Every): compound engineering

- "Each unit of engineering work should make subsequent units easier -- not harder."
- Effort split: "80% is in planning and review, 20% is in execution". "The point is leverage, not ceremony."
- Plugin loop (36 skills, 14 hosts): `/ce-brainstorm` → `/ce-plan` → `/ce-work` → `/ce-simplify-code` → `/ce-code-review` → `/ce-compound`.
  - The compound step captures learnings in `docs/solutions/`, which later plans read.
  - `/lfg` runs the whole loop and watches CI, but doesn't merge without permission.
- [repo](https://github.com/EveryInc/compound-engineering-plugin) · essays: [compound engineering](https://every.to/chain-of-thought/compound-engineering-how-every-codes-with-agents), [origin story](https://every.to/source-code/my-ai-had-already-fixed-the-code-before-i-saw-it) (dates not verified)

### 2.15 Nicholas Carlini (Anthropic): C compiler with 16 parallel Claudes (2026-02-05)

- **Setup**:
  - A bash `while true` loop relaunching Claude Code (Opus 4.6), each agent in its own Docker container cloning a bare `/upstream` repo.
  - Task claims via lock files in `current_tasks/`. No orchestrator agent.
- **Scale and result**: ~2,000 sessions over two weeks, ~2B input and 140M output tokens, under $20k. A ~100k-line Rust compiler that builds bootable Linux 6.9 on x86, ARM and RISC-V. Caveats: x86 16-bit boot code still uses GCC, and it relies on GCC's assembler and linker.
- **Lessons**:
  - The verifier must be nearly perfect.
  - Design test output for the model: terse, with grep-able `ERROR` lines and precomputed stats.
  - "Claude can't tell time": a `--fast` deterministic per-agent sample of tests.
  - Agents maintain READMEs and progress files.
  - GCC as a known-good oracle to split kernel bugs across agents.
  - Specialist roles: deduplication, performance, code-quality critique, docs.
- "it is easy to see tests pass and assume the job is done, when this is rarely the case." [post](https://www.anthropic.com/engineering/building-c-compiler)
- Chris Lattner's review is summarized by Simon. [Lattner](https://www.modular.com/blog/the-claude-c-compiler-what-it-reveals-about-the-future-of-software)

### 2.16 antirez (Salvatore Sanfilippo)

- **Jul 2025**: frontier LLMs via web chat with hand-pasted full context: papers, large parts of the code, "a brain dump".
  - Uses: review, prototyping, pair design, and code "under your clear specifications".
  - Left alone, agents produce "fragile code bases that are larger than needed, complex, full of local minima choices".
  - [post](https://antirez.com/news/154)
- **Jan 2026**: "Don't fall into the anti-AI hype"; "Programming changed forever, anyway". [post](https://antirez.com/news/158)
- Built `flux2.c` with Claude Code + Opus 4.5. It became possible "once I started to tell Opus that it *needed* to take a file with all the implementation notes", kept updated and "processed ASAP after context compaction" (via Simon). [repo](https://github.com/antirez/flux2.c)

### 2.17 Context-engineering theorists: Manus (Peak Ji), Drew Breunig, Lance Martin

- **Manus** ([blog](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus), Jul 2025), as summarized in Lance Martin's webinar notes ([notes](https://rlancemartin.github.io/2025/10/15/manus/), Oct 2025):
  - Tool results have "full" and "compact" (file-path) forms; stale results are compacted, then schema-based summarization.
  - Fewer than 20 atomic functions. MCP is exposed through a CLI. Utilities are listed and the agent calls `--help`.
  - Sub-agents isolate context, not roles. A `todo.md` consumed ~1/3 of actions, so it was replaced by a planner agent.
  - KV-cache hit rate is the key cost metric. Refactored 5 times since March. Test the harness across model strengths (Bitter Lesson).
- **Drew Breunig** (Jun 2025):
  - Failure modes: poisoning, distraction, confusion, clash.
  - Fixes: RAG, tool loadout (fewer than ~20 tools), quarantine, pruning, summarization, offloading. "context is not free."
  - Jan 2026: a "library with no code" (spec + AGENTS.md + YAML conformance tests).
  - [fails](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html) · [fixes](https://www.dbreunig.com/2025/06/26/how-to-fix-your-context.html) · [no-code library](https://www.dbreunig.com/2026/01/08/a-software-library-with-no-code.html)
- **Lance Martin**:
  - Write/select/compress/isolate (Jun 2025) ([source](https://raw.githubusercontent.com/rlancemartin/rlancemartin.github.io/master/_posts/2025-06-22-context_engineering.md)).
  - "Claude Diary" (Dec 2025): `/diary` plus a PreCompact hook write session entries, and `/reflect` turns them into one-line CLAUDE.md rules ([post](https://rlancemartin.github.io/2025/12/01/claude_diary/)).
  - Agent design patterns (Jan 2026): give agents a computer, a multi-layer action space, progressive disclosure, offload, cache, isolate, evolve context ([source](https://raw.githubusercontent.com/rlancemartin/rlancemartin.github.io/master/_posts/2026-01-09-agent_design.md)).

### 2.18 Shrivu Shankar: "How I Use Every Claude Code Feature" (Nov 2025)

Simon's quote, verified: MCP should become "a simple, secure gateway that provides a few powerful, high-level tools" (`download_raw_data`, `take_sensitive_gated_action`, `execute_code_in_environment_with_state`). It manages "auth, networking, and security boundaries and then get[s] out of the way". [post](https://blog.sshh.io/p/how-i-use-every-claude-code-feature). Other widely cited details are unverified (§7).

### 2.19 Matt Pocock: composable skills (2026)

[mattpocock/skills](https://github.com/mattpocock/skills):
- Skills: `grill-me`/`grilling` (interview until every design branch is resolved), `to-spec`, `to-tickets` (tracer-bullet tickets with blocking edges), `implement` (via `/tdd` then `/code-review`).
- `tdd` works "one vertical slice at a time". Also `handoff`, `retro`, `improve-codebase-architecture`.
- Principles: alignment first, a shared glossary, "The rate of feedback is your speed limit" (from *The Pragmatic Programmer*), "Invest in the design of the system every day" (Beck), "Software engineering fundamentals matter more than ever."
- Skills should be "small, easy to adapt, and composable".

### 2.20 Ryan Carson

- **ai-dev-tasks**: `create-prd.md` → `generate-tasks.md` → work "one sub-task at a time", with human approval after each. [repo](https://github.com/snarktank/ai-dev-tasks)
- **snarktank/ralph** (Jan 2026; Amp by default, or Claude):
  - `prd.json` stories carry a `passes` flag. `progress.txt` is an append-only log of learnings, and AGENTS.md is updated each iteration.
  - The loop exits on `<promise>COMPLETE</promise>`; default 10 iterations. "Each iteration is a fresh instance with clean context."
  - [repo](https://github.com/snarktank/ralph) · [tweet](https://x.com/ryancarson/status/2008548371712135632)

### 2.21 Addy Osmani

- Retitled his book *Beyond Vibe Coding* (Sep 2025, per Simon). [book](https://beyond.addy.ie/)
- An early adopter of "agentic engineering" (Feb 2026). [post](https://addyosmani.com/blog/agentic-engineering/)
- "The 80% Problem in Agentic Coding" cites Armin's poll of 5,000 developers: 44% now write less than 10% of their code manually (secondary summary). [post](https://addyo.substack.com/p/the-80-problem-in-agentic-coding)

### 2.22 Birgitta Böckeler & Martin Fowler (Thoughtworks)

- Böckeler's "Harness Engineering – first thoughts" memo (Feb 2026) suggests OpenAI's use of "harness engineering" may have been "inspired by Mitchell Hashimoto's recent blog post" (secondary summary). [memo](https://www.martinfowler.com/articles/exploring-gen-ai/harness-engineering-memo.html)
- Fowler (Feb 2026): "LLMs are eating specialty skills". [fragment](https://martinfowler.com/fragments/2026-02-18.html)
- Böckeler's spec-driven-development critique (Oct 2025) is in §7.

### 2.23 Gergely Orosz (Pragmatic Engineer)

- Oct 2025: working with multiple agents "comes VERY natural to most senior+ engineers or tech lead[s]". [tweet](https://twitter.com/gergelyorosz/status/1976242900670480763) · [article](https://blog.pragmaticengineer.com/new-trend-programming-by-kicking-off-parallel-ai-agents/)
- He documented 80+ hour weeks at AI startups. [article](https://blog.pragmaticengineer.com/new-trend-extreme-hours-at-ai-startups/)
- Interviews with Beck, Hashimoto and Yegge. [Yegge interview](https://newsletter.pragmaticengineer.com/p/steve-yegge-on-ai-agents-and-the)

### 2.24 Lower-verification canon entries

Sankalp (Claude Code 2.0 guide), Diwank Singh ("Field notes from shipping real code with Claude"), Lee Robinson ("complexity budgets") and Jeremy Howard (critical view) could not be verified this session. See §7.

---

## 3. Concrete practices & configs worth copying

**Armin: YOLO alias plus PATH interceptors** (instead of hooks):
```sh
# .claude/interceptors/python
#!/bin/sh
echo "This project uses uv, please use 'uv run python' instead."
exit 1
# launch
CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=1 PATH="`pwd`/.claude/interceptors:${PATH}" claude --dangerously-skip-permissions
```
Other habits: a pidfile-guarded `make dev`, a `make tail-log`, emails logged to stdout in debug mode, and git-status-driven slash commands whose body embeds `` !`git status` `` so no file arguments are needed.

**Simon: four- and five-word prompts.**
- "First run the tests" or `Run "uv run pytest"`.
- "Build a Python function to extract headers from a markdown string. Use red/green TDD."
- Manual-testing prompts: "Try that new function on some edge cases using `python -c`"; "Run a dev server and explore that new JSON API using `curl`".
- Walkthroughs: "Read the source and then plan a linear walkthrough … use showboat to create a walkthrough.md".
- In AGENTS.md, one example line per tool (`shot-scraper http://www.example.com/ -w 800 -o example.jpg`).
- Scoped credentials, such as a $5-budget cloud org.

**Harper: spec, then plan, then executor prompt.**
- Spec prompt: "Ask me one question at a time so we can develop a thorough, step-by-step spec for this idea… Remember, only one question at a time."
- Executor prompt (verbatim excerpt):
```
1. Open @prompt_plan.md and identify any prompts not marked as completed.
2. For each incomplete prompt: Double-check if it's truly unfinished … implement it …
   Make sure the tests pass … Commit the changes … Update @prompt_plan.md to mark this prompt as completed.
3. After you finish each prompt, pause and wait for user review or feedback.
```
- Add `pre-commit` (lint, typecheck, tests) so "the robot" fixes its own breakage before committing.

**Kent Beck: plan.md plus "go".** One test at a time, minimal code to pass. Watch for loops, unrequested features, and disabled or deleted tests.

**Mitchell.**
- End-of-session prompt: "…Don't write any code. Consult the oracle. Consider parts of the code that can also get more unit tests added."
- A 30-minute end-of-day agent kickoff. Notifications off. AGENTS.md entries for targeted test commands.

**Steinberger (`~/.codex/config.toml`, Dec 2025; excerpt)**:
```toml
model = "gpt-5.2-codex"
model_reasoning_effort = "high"
tool_output_token_limit = 25000
model_auto_compact_token_limit = 233000
[features]
unified_exec = true
web_search_request = true
skills = true
```
Prompts he relies on:
- "give me a few options before making changes", "let's discuss", "what's the status".
- Trigger words for hard bugs: "take your time", "comprehensive", "read all code that could be related", "create possible hypothesis".
- "write docs to docs/*.md". Queue "continue" messages. "Ask the model to write tests after each feature/fix … Use the same context."

**Huntley: Ralph loop.** `./loop.sh plan` builds `IMPLEMENTATION_PLAN.md` from `specs/`. `./loop.sh 20` runs ≤20 build iterations, each doing one task, then validate, update the plan and AGENTS.md, commit, and exit. Use a sandbox with minimal credentials; Ctrl+C plus `git reset --hard` as the escape hatch.

**Dex: research and plan prompts.**
- Research prompt: "YOUR ONLY JOB IS TO DOCUMENT AND EXPLAIN THE CODEBASE AS IT EXISTS TODAY". Saved to `thoughts/shared/research/YYYY-MM-DD-…md`.
- Plan template: Overview / Current State / Desired End State / What We're NOT Doing / Phases, each with automated and manual success criteria and a human checkpoint.
- Keep context at 40–60% utilization.

**Carlini: parallel autonomous agents.**
- One container per agent with a shared bare repo. Lock files for task claims.
- Model-friendly test output and a `--fast` deterministic sample.
- A known-good oracle to split monolithic failures. Progress and README files for orientation.

**Mario: minimal tools plus review sub-agent.** Four browser scripts documented in a ~225-token README. A slash command that tells Pi to "Spawn yourself as a sub-agent via bash to do a code review … Do not read the code yourself."

**Every: compound step.** After each feature, `/ce-compound` writes the lesson to `docs/solutions/`, and `/ce-plan` reads it next time.

**Lance: memory reflection.** `/diary` (manual, or auto via a PreCompact hook) writes to `~/.claude/memory/diary/`. `/reflect` turns diary entries into one-line CLAUDE.md rules and keeps a `processed.log`.

**antirez / Ralph / Carson: persistent notes file.** An `IMPLEMENTATION_NOTES.md` / `progress.txt` that the agent must update and re-read after compaction.

**Karpathy: autoresearch.** The human edits only `program.md`. The agent edits one file under a fixed time budget and a single scalar metric, and keeps or discards each change.

---

## 4. Disagreements, caveats, failure modes (incl. skeptics)

**Genuine disagreements.** The full side-by-side table is in §8-iii. The deepest splits:
- **How much process.** Structured spec→plan→implement pipelines (Dex, Superpowers, Every, Harper, Carson, Huntley) versus "just talk to it" (Steinberger, Armin, Mario). Steinberger himself reversed: spec-first in Jun 2025, then he called it "the old way of thinking" by Oct 2025.
- **How much to read.** "I don't read much code anymore" (Steinberger) and Simon's uneasy May 2026 version, versus "Read the dang code" (Dex), "every line as my responsibility" (Armin), and capping daily code at review capacity (Mario).
- **How many agents.** Yegge's 20–30 and StrongDM's "Code must not be reviewed by humans", versus Mario ("recipe for disaster"), Hashimoto (one background agent) and Simon (review-bounded).
- **Smaller splits.** Subagents, worktrees, context resets, hooks, whether agent-written tests can be trusted, and Claude vs Codex. Most practitioners concede the model preference is "vibes".

**Failure modes that practitioners document.**
- Scope creep and cheating, such as deleting tests (Beck).
- Over-defensive or over-complex code, "mortally terrified of exceptions" (Karpathy, Armin).
- Duplication from low-recall agentic search (Mario).
- Context rot and poisoning (Breunig).
- Sycophancy, "absolutely right" (Steinberger).
- Stale plans (Huntley: regenerate them).
- Harness decay when models change. Yegge's Gas Town collapsed with Opus 4.7. Armin found newer Claude models worse at Pi's edit schema.
- Slop PRs and issues to open source (Ghostty policy; Armin's "Pi OSS").
- Addiction and burnout (Steinberger, Simon, Yegge).
- Security: lethal trifecta, YOLO normalization, and Yegge's wiped production password.
- Cost: Dex's $12k/month team; StrongDM's "$1,000 on tokens today per human engineer"; Breunig's "end of the free lunch" with Fable pricing (Aug 2026).

**Skeptics' best arguments** (all from heavy users):
- **Mario** (Mar 2026): agents make "booboos" at machine speed with no learning and no human pain signal, so errors compound unnoticed. Agents are "merchants of complexity". "The bigger the codebase, the lower the recall." Remedy: "Set yourself limits on how much code you let the clanker generate per day", and hand-write architecture and APIs.
- **Armin** (Jun 2026): loops amplify local defensive patches. Code quality from hands-off harnesses has not improved and may be getting worse.
- **Dex** (2026): "no amount of harness engineering or loopsmaxxing can solve what is fundamentally a model-training issue".
- **Karpathy** (Oct 2025): for novel, "intellectually intense" code, agents misread intent because of priors from the internet. He reversed by Dec 2025 for general work.
- **antirez** (Jul 2025): unsupervised agents produce bloated, fragile codebases. He kept a human-in-loop chat workflow, then adopted Claude Code with notes files (Jan 2026).
- **Margaret-Anne Storey**, via Simon: "cognitive debt", meaning teams lose the plot even when code is readable. [post](https://margaretstorey.com/blog/2026/02/09/cognitive-debt/)

---

## 5. Key dates

- 2025-02-02: Karpathy coins "vibe coding". 2025-02-16: Harper Reed's codegen workflow. Late Feb: Claude Code launched with Claude 3.7 Sonnet.
- 2025-04-07: Yegge, "Revenge of the junior developer". 2025-04-15: Thorsten Ball, "How to Build an Agent".
- 2025-05-08: Harper, "Basic Claude Code".
- 2025-06-03: Steinberger, "Claude Code is My Computer". 06-12: Armin, "Agentic Coding Recommendations". 06-16: Simon, lethal trifecta.
- 2025-06-22 to 06-26: Breunig, context failures and fixes. 06-23: Lance Martin, context engineering. 06-25: Karpathy's "context engineering" tweet; Kent Beck, "Augmented Coding".
- 2025-07: Huntley's Ralph post. 07-21: antirez summer update. 07-30: Armin, "Things That Didn't Work".
- 2025-08-18: Armin, "Your MCP Doesn't Need 30 Tools". 08-19: Steinberger, "Just One More Prompt". 08-22: Huntley, MCP allocations. ~Late Aug: Dex, ACE-FCA.
- 2025-09-09: Huntley, cursed. 09-29: Armin, "90%". 09-30: Simon, "Designing agentic loops".
- 2025-10-05: Simon, parallel agents; Jesse Vincent's September workflow. 10-07: Simon, "Vibe engineering". 10-09: Superpowers. 10-11: Hashimoto's Ghostty transcripts. 10-13: Beads; nanochat ("net unhelpful"). 10-14: Steinberger, "Just Talk To It". 10-16: Skills ("bigger deal than MCP"). 10-17: Karpathy on Dwarkesh. Oct: Kim & Yegge, *Vibe Coding*.
- 2025-11-02: Shrivu Shankar's guide; Mario, "What if you don't need MCP". 11-06: Simon, async code research. ~11-24: Opus 4.5 (the "November inflection"). 11-25: first OpenClaw commit. 11-30: Mario's Pi.
- 2025-12-01: Lance, Claude Diary. 12-13 / 12-17: Armin, skills vs MCP; plan mode. 12-18: Simon, "proven to work". 12-22: Armin, "A Year of Vibes"; Mario, year review. 12-26: Karpathy, "never felt this much behind". 12-28: Steinberger, "Shipping at Inference-Speed".
- 2026-01 (start): Gas Town. 01-06: Dex, "Brief History of Ralph". 01-11: antirez, "Don't fall into the anti-AI hype". 01-17: Huntley, "everything is a ralph loop". 01-18: Armin, "Agent Psychosis". 01-22: Ghostty tightens its AI policy. 01-26: Karpathy's 80/20 notes. 01-31: Armin on Pi.
- 2026-02-05: Hashimoto, "My AI Adoption Journey"; Carlini's C compiler; Opus 4.6. ~02-05: Karpathy, "agentic engineering". 02-07: Simon on the StrongDM "software factory"; Vouch. 02-13: Armin, "The Final Bottleneck". By 02-13: Yegge, "The AI Vampire" (cited by Armin). 02-15: Steinberger joins OpenAI. 02-23: Simon's *Agentic Engineering Patterns*. 02-25: Hashimoto on Pragmatic Engineer.
- 2026-03: Karpathy's autoresearch. 03-25: Mario, "slowing the fuck down".
- 2026-04-02: Simon on Lenny's Podcast ("95%… I didn't type"). 04-14: Hashimoto on Fragmented. 04-30: Codex `/goal` (a Ralph-style loop).
- 2026-05-06: Simon, vibe coding and agentic engineering converging. 05-24: Armin, "Pi OSS".
- Later updates (covered more fully by slice 6): 06-23 Armin, "The Coming Loop"; 07-04 Armin, "Better Models: Worse Tools"; ~07 Dex, "Why Software Factories Fail"; 07-29 Thorsten's Laracon talk; 08-04 Yegge on Gas Town's collapse; 08-23 Breunig, "end of the free lunch"; 10-06 Armin, Codemode / Pi 1.0 MCP.

---

## 6. Sources

Format: Title — author — date — URL — note — [primary|secondary]

**Simon Willison**
- Embracing the parallel coding agent lifestyle — Simon Willison — 2025-10-05 — https://simonwillison.net/2025/Oct/5/parallel-coding-agents/ — setup and task taxonomy (text read via backup) — [primary]
- Vibe engineering — Simon Willison — 2025-10-07 — https://simonwillison.net/2025/Oct/7/vibe-engineering/ — practices list; Feb 2026 term update — [primary]
- Designing agentic loops — Simon Willison — 2025-09-30 — https://simonwillison.net/2025/Sep/30/designing-agentic-loops/ — YOLO options, scoped credentials — [primary]
- The lethal trifecta for AI agents — Simon Willison — 2025-06-16 — https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/ — security frame — [primary]
- Claude Skills are awesome, maybe a bigger deal than MCP — Simon Willison — 2025-10-16 — https://simonw.substack.com/p/claude-skills-are-awesome-maybe-a — skills vs MCP — [primary]
- Your job is to deliver code you have proven to work — Simon Willison — 2025-12-18 — https://simonwillison.net/2025/Dec/18/code-proven-to-work/ — manual and automated proof — [primary]
- 2025: The year in LLMs — Simon Willison — 2025-12-31 — https://simonwillison.net/2025/Dec/31/the-year-in-llms/ — YOLO and normalization of deviance; MCP; conformance suites — [primary]
- Writing about Agentic Engineering Patterns — Simon Willison — 2026-02-23 — https://simonwillison.net/2026/Feb/23/agentic-engineering-patterns/ — guide launch — [primary]
- Agentic Engineering Patterns (guide) — Simon Willison — 2026-02 onward — https://simonwillison.net/guides/agentic-engineering-patterns/ — 16 chapters (text read via backup) — [primary]
- Vibe coding and agentic engineering are getting closer than I'd like — Simon Willison — 2026-05-06 — https://simonwillison.net/2026/May/6/vibe-coding-and-agentic-engineering/ — no longer reviewing every line — [primary]
- simonw/research — Simon Willison — 2025–2026 — https://github.com/simonw/research — 99 async agent research projects — [primary]
- simonwillisonblog-backup (posts, guide chapters, link blog) — Simon Willison — continuous — https://github.com/simonw/simonwillisonblog-backup — source for the async research (2025-11-06), StrongDM (2026-02-07), Pragmatic Summit (2026-03-14) and Lenny's (2026-04-02) entries, and link-blog quotes — [primary]

**Armin Ronacher**
- Agentic Coding Recommendations — Armin Ronacher — 2025-06-12 — https://lucumr.pocoo.org/2025/6/12/agentic-coding/ — setup, Go, tools — [primary]
- Agentic Coding Things That Didn't Work — Armin Ronacher — 2025-07-30 — https://lucumr.pocoo.org/2025/7/30/things-that-didnt-work/ — slash commands, hooks, interceptors — [primary]
- Your MCP Doesn't Need 30 Tools: It Needs Code — Armin Ronacher — 2025-08-18 — https://lucumr.pocoo.org/2025/8/18/code-mcps/ — code-based MCP — [primary]
- 90% — Armin Ronacher — 2025-09-29 — https://lucumr.pocoo.org/2025/9/29/90-percent/ — 90% AI-written; Codex reviews — [primary]
- Skills vs Dynamic MCP Loadouts (source file) — Armin Ronacher — 2025-12-13 — https://raw.githubusercontent.com/mitsuhiko/lucumr/main/blog/posts/2025/12-13-skills-vs-mcp.md — agent-written skills — [primary]
- What Actually Is Claude Code's Plan Mode? — Armin Ronacher — 2025-12-17 — https://lucumr.pocoo.org/2025/12/17/what-is-plan-mode/ — plan-mode teardown — [primary]
- A Year Of Vibes — Armin Ronacher — 2025-12-22 — https://lucumr.pocoo.org/2025/12/22/a-year-of-vibes/ — Amp/CC/Pi; VCS wishes — [primary]
- Pi: The Minimal Agent Within OpenClaw — Armin Ronacher — 2026-01-31 — https://lucumr.pocoo.org/2026/1/31/pi/ — Pi extensions — [primary]
- A Language For Agents — Armin Ronacher — 2026-02-09 — https://lucumr.pocoo.org/2026/2/9/a-language-for-agents/ — what agents want — [primary]
- The Final Bottleneck (source file) — Armin Ronacher — 2026-02-13 — https://raw.githubusercontent.com/mitsuhiko/lucumr/main/blog/posts/2026/02-13-the-final-bottleneck.md — review and accountability — [primary]
- The Coming Loop (source file) — Armin Ronacher — 2026-06-23 — https://raw.githubusercontent.com/mitsuhiko/lucumr/main/blog/posts/2026/06-23-the-coming-loop.md — where loops work and fail — [primary]
- Better Models: Worse Tools — Armin Ronacher — 2026-07-04 — https://lucumr.pocoo.org/2026/7/4/better-models-worse-tools/ — tool-call regression — [primary]
- What is Codemode (source file) — Armin Ronacher — 2026-10-06 — https://raw.githubusercontent.com/mitsuhiko/lucumr/main/blog/posts/2026/10-06-codemode.md — Pi 1.0 MCP — [primary]
- agent-stuff — Armin Ronacher — 2026 — https://github.com/mitsuhiko/agent-stuff — his skills and extensions — [primary]

**Peter Steinberger**
- Claude Code is My Computer (source file) — Peter Steinberger — 2025-06-03 — https://raw.githubusercontent.com/steipete/steipete.me/main/src/content/blog/2025/claude-code-is-my-computer.md — YOLO on macOS — [primary]
- The Future of Vibe Coding — Peter Steinberger — 2025-06-01 — https://steipete.me/posts/2025/the-future-of-vibe-coding — spec critique loop — [primary]
- My Current AI Dev Workflow (source file) — Peter Steinberger — 2025-08-25 — https://raw.githubusercontent.com/steipete/steipete.me/main/src/content/blog/2025/optimal-ai-development-workflow.md — main branch, no MCP — [primary]
- Just One More Prompt (source file) — Peter Steinberger — 2025-08-19 — https://raw.githubusercontent.com/steipete/steipete.me/main/src/content/blog/just-one-more-prompt.md — addiction — [primary]
- Just Talk To It — Peter Steinberger — 2025-10-14 — https://steipete.me/posts/just-talk-to-it — Codex workflow — [primary]
- Shipping at Inference-Speed (source file) — Peter Steinberger — 2025-12-28 — https://raw.githubusercontent.com/steipete/steipete.me/main/src/content/blog/2025/shipping-at-inference-speed.md — config.toml; doesn't read code — [primary]
- OpenClaw, OpenAI and the future (source file) — Peter Steinberger — 2026-02-15 — https://raw.githubusercontent.com/steipete/steipete.me/main/src/content/blog/2026/openclaw.md — joins OpenAI — [primary]
- agent-scripts AGENTS.MD — Peter Steinberger — 2026 — https://raw.githubusercontent.com/steipete/agent-scripts/main/AGENTS.MD — shared agent rules — [primary]
- openclaw/openclaw — Steinberger and community — 2026 — https://github.com/openclaw/openclaw — ~391k stars (Oct 2026) — [primary]

**Mario Zechner**
- What if you don't need MCP? — Mario Zechner — 2025-11-02 — https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/ — token comparison — [primary]
- Pi coding agent (source file) — Mario Zechner — 2025-11-30 — https://raw.githubusercontent.com/badlogic/mariozechner.at/main/src/posts/2025-11-30-pi-coding-agent/index.md — design choices — [primary]
- Year in review 2025 (source file) — Mario Zechner — 2025-12-22 — https://raw.githubusercontent.com/badlogic/mariozechner.at/main/src/posts/2025-12-22-year-in-review-2025/index.md — "nobody knows yet" — [primary]
- Thoughts on slowing the fuck down (source file) — Mario Zechner — 2026-03-25 — https://raw.githubusercontent.com/badlogic/mariozechner.at/main/src/posts/2026-03-25-thoughts-on-slowing-the-fuck-down/index.md — skeptic manifesto — [primary]
- pi-mono — Zechner / earendil-works — 2025–2026 — https://github.com/badlogic/pi-mono — Pi harness (~114k stars) — [primary]

**Mitchell Hashimoto**
- Vibing a Non-Trivial Ghostty Feature — Mitchell Hashimoto — 2025-10-11 — https://mitchellh.com/writing/non-trivial-vibing — 16 sessions, $15.98 (quotes via Simon) — [primary]
- My AI Adoption Journey — Mitchell Hashimoto — 2026-02-05 — https://mitchellh.com/writing/my-ai-adoption-journey — six steps (quotes via Simon and summaries) — [primary]
- Ghostty AI_POLICY.md — Ghostty — 2025–2026 — https://github.com/ghostty-org/ghostty/blob/main/AI_POLICY.md — disclosure rules — [primary]
- Ghostty AGENTS.md — Ghostty — 2026 — https://github.com/ghostty-org/ghostty/blob/main/AGENTS.md — harness example — [primary]
- Vouch — Mitchell Hashimoto — 2026-02 — https://github.com/mitchellh/vouch — contributor vouching — [primary]
- Mitchell Hashimoto's new way of writing code (podcast) — Gergely Orosz — 2026-02-25 — https://newsletter.pragmaticengineer.com/p/mitchell-hashimoto — interview — [secondary]
- Fragmented ep. 310 — Gopal/Souza — 2026-04-14 — https://fragmentedpodcast.com/episodes/310/ — warm starts, Hail Mary prompts — [secondary]

**Andrej Karpathy**
- "vibe coding" tweet — Karpathy — 2025-02-02 — https://twitter.com/karpathy/status/1886192184808149383 — coinage — [primary]
- "context engineering" tweet — Karpathy — 2025-06-25 — https://twitter.com/karpathy/status/1937902205765607626 — definition — [primary]
- nanochat "net unhelpful" tweet — Karpathy — 2025-10-13 — https://twitter.com/karpathy/status/1977758204139331904 — skeptical phase — [primary]
- AGI is still a decade away (Dwarkesh) — Karpathy/Patel — 2025-10-17 — https://www.dwarkesh.com/p/andrej-karpathy — agents for boilerplate — [primary]
- "mortally terrified of exceptions" — Karpathy — 2025-10 — https://x.com/karpathy/status/1976082963382272334 — defensive code — [primary]
- Guy who coined vibe coding feels behind — AOL/Business Insider — 2025-12 — https://www.aol.com/news/guy-coined-vibe-coding-now-172146964.html — Dec 26 tweet coverage — [secondary]
- Notes from Claude coding (80/20) — Karpathy — 2026-01-26 — https://x.com/karpathy/status/2015883857489522876 — workflow flip (text via search snippets) — [primary]
- "agentic engineering" tweet — Karpathy — ~2026-02 — https://twitter.com/karpathy/status/2019137879310836075 — term adoption (via Simon) — [primary]
- "coding agents basically didn't work before December" — Karpathy — 2026-02-26 — https://twitter.com/karpathy/status/2026731645169185220 — inflection — [primary]
- autoresearch — Karpathy — 2026-03 — https://github.com/karpathy/autoresearch — program.md loop — [primary]

**Geoffrey Huntley, Dex Horthy, Ryan Carson**
- Ralph Wiggum as a "software engineer" — Huntley — 2025-07 — https://ghuntley.com/ralph/ — the loop — [primary]
- I ran Claude in a loop for three months… cursed — Huntley — 2025-09 — https://ghuntley.com/cursed/ — 3-month loop — [primary]
- too many MCP servers… — Huntley — 2025-08 — https://ghuntley.com/allocations/ — context budget math — [primary]
- everything is a ralph loop — Huntley — 2026-01-17 — https://ghuntley.com/loop/ — "programming the loop" — [primary]
- how-to-ralph-wiggum — Huntley (fork of Farr) — 2025-12 — https://github.com/ghuntley/how-to-ralph-wiggum — playbook — [primary]
- A Brief History of Ralph — Dex Horthy — 2026-01-06 — https://www.humanlayer.dev/blog/brief-history-of-ralph — history and critique (via search) — [secondary]
- Getting AI to Work in Complex Codebases (ace-fca.md) — Dex Horthy — ~2025-08/09 — https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md — RPI, 40–60% — [primary]
- 12-factor agents — Dex Horthy — 2025 — https://github.com/humanlayer/12-factor-agents — principles — [primary]
- HumanLayer .claude/commands — HumanLayer — 2025–2026 — https://github.com/humanlayer/humanlayer/tree/main/.claude/commands — research/plan/implement prompts — [primary]
- Why Software Factories Fail (wsff.md) — Dex Horthy — ~2026-07 — https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md — 2026 update — [primary]
- ai-dev-tasks — Ryan Carson (snarktank) — 2025 — https://github.com/snarktank/ai-dev-tasks — PRD → tasks — [primary]
- ralph — Ryan Carson (snarktank) — 2026-01 — https://github.com/snarktank/ralph — prd.json loop — [primary]

**Steve Yegge**
- Welcome to Gas Town — Steve Yegge — 2026-01 — https://steve-yegge.medium.com/welcome-to-gas-town-4f25ee16dd04 — orchestrator, 8 stages — [primary]
- gastown README — Yegge — 2026 — https://github.com/steveyegge/gastown — roles, "20-30 agents" — [primary]
- Introducing Beads — Yegge — 2025-10-13 — https://steve-yegge.medium.com/introducing-beads-a-coding-agent-memory-system-637d7d92514a — agent memory — [primary]
- beads README — Yegge — 2026 — https://github.com/steveyegge/beads — `bd` CLI — [primary]
- Software Survival 3.0 — Yegge — 2026-01-30 — https://steve-yegge.medium.com/software-survival-3-0-97a2a6255f7b — desire paths (via Simon) — [primary]
- The AI Vampire — Yegge — 2026-02 — https://steve-yegge.medium.com/the-ai-vampire-eda6e4f07163 — fatigue — [primary]
- The Shape of Things to Come — Yegge — 2026-08-04 — https://yegge.ai/essays/the-shape-of-things-to-come/ — Gas Town collapse (via Simon) — [primary]
- Revenge of the junior developer (republish) — Yegge — 2025-04-07 — https://conffab.com/?p=8063 — waves and fleets — [secondary]
- Vibe Coding book article — IT Revolution — 2025 — https://itrevolution.com/articles/vibe-coding-the-revolutionary-approach-transforming-software-development/ — FAAFO — [secondary]
- Gas Town's agent patterns — Maggie Appleton — 2026-01 — https://maggieappleton.com/gastown — cost critique (via search) — [secondary]

**Other practitioners**
- Superpowers announcement — Jesse Vincent — 2025-10-09 — https://blog.fsck.com/2025/10/09/superpowers/ — plugin launch (via Simon) — [primary]
- How I'm using coding agents in September, 2025 — Jesse Vincent — 2025-10-05 — https://blog.fsck.com/2025/10/05/how-im-using-coding-agents-in-september-2025/ — architect/implementer (via Simon) — [primary]
- superpowers — Jesse Vincent — 2025–2026 — https://github.com/obra/superpowers — 7-step workflow — [primary]
- CLAUDE.md — Jesse Vincent — 2025 — https://github.com/obra/dotfiles/blob/main/.claude/CLAUDE.md — rules — [primary]
- My LLM codegen workflow atm — Harper Reed — 2025-02-16 — https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/ — spec → plan → execute (via Simon) — [primary]
- Basic Claude Code — Harper Reed — 2025-05-08 — https://harper.blog/2025/05/08/basic-claude-code/ — executor prompt, TDD (source read) — [primary]
- Augmented Coding: Beyond the Vibes — Kent Beck — 2025-06-25 — https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes — warning signs (via search) — [primary]
- The Bet On Juniors Just Got Better — Kent Beck — 2025-12 — https://tidyfirst.substack.com/p/the-bet-on-juniors-just-got-better — juniors (via Simon) — [primary]
- How to Build an Agent — Thorsten Ball — 2025-04-15 — https://ampcode.com/how-to-build-an-agent — minimal agent (via search) — [primary]
- Think Harder: How I Prompt — Thorsten Ball — 2026-07-29 — https://thorstenball.com/talks/how-i-prompt/ — Laracon talk (via search) — [primary]
- compound-engineering-plugin — Klaassen/Chow (Every) — 2025–2026 — https://github.com/EveryInc/compound-engineering-plugin — loop and philosophy — [primary]
- Compound engineering: how Every codes with agents — Shipper/Klaassen — date unverified — https://every.to/chain-of-thought/compound-engineering-how-every-codes-with-agents — essay (link seen, not read) — [primary]
- Building a C compiler with a team of parallel Claudes — Nicholas Carlini — 2026-02-05 — https://www.anthropic.com/engineering/building-c-compiler — 16 agents — [primary]
- Coding with LLMs in the summer of 2025 — antirez — 2025-07 — https://antirez.com/news/154 — chat-first (via Simon) — [primary]
- Don't fall into the anti-AI hype — antirez — 2026-01-11 — https://antirez.com/news/158 — reversal (via Simon) — [primary]
- Context Engineering for AI Agents: Lessons from Building Manus — Yichao "Peak" Ji — 2025-07 — https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus — KV cache (link seen) — [primary]
- Context Engineering in Manus — Lance Martin — 2025-10-15 — https://rlancemartin.github.io/2025/10/15/manus/ — webinar notes — [secondary]
- How Long Contexts Fail / How to Fix Your Context — Drew Breunig — 2025-06-22 / 06-26 — https://www.dbreunig.com/2025/06/26/how-to-fix-your-context.html — failure modes and fixes — [primary]
- Context Engineering for Agents (source file) — Lance Martin — 2025-06-23 — https://raw.githubusercontent.com/rlancemartin/rlancemartin.github.io/master/_posts/2025-06-22-context_engineering.md — write/select/compress/isolate — [primary]
- Claude Diary — Lance Martin — 2025-12-01 — https://rlancemartin.github.io/2025/12/01/claude_diary/ — reflection memory — [primary]
- How I Use Every Claude Code Feature — Shrivu Shankar — 2025-11 — https://blog.sshh.io/p/how-i-use-every-claude-code-feature — MCP as gateway (via Simon) — [primary]
- mattpocock/skills — Matt Pocock — 2026 — https://github.com/mattpocock/skills — grill-me, tdd — [primary]
- Agentic engineering — Addy Osmani — 2026-02 — https://addyosmani.com/blog/agentic-engineering/ — term (link via Simon) — [primary]
- The 80% Problem in Agentic Coding — Addy Osmani — date unverified — https://addyo.substack.com/p/the-80-problem-in-agentic-coding — Armin poll (via search) — [secondary]
- Harness Engineering – first thoughts — Birgitta Böckeler — 2026-02 — https://www.martinfowler.com/articles/exploring-gen-ai/harness-engineering-memo.html — harness term (via search) — [primary]
- New trend: programming by kicking off parallel AI agents — Gergely Orosz — 2025-10 — https://blog.pragmaticengineer.com/new-trend-programming-by-kicking-off-parallel-ai-agents/ — parallel trend (via search) — [secondary]

---

## 7. Unverified / low-confidence items

- **Shrivu Shankar's post details** (from memory, not re-fetched): CLAUDE.md as "constitution"; avoid `@`-including docs; prefer `/clear` + "document & clear" over `/compact`; "Master-Clone" over "Lead-Specialist" subagents; "block-at-submit" hooks rather than block-at-write. Only the MCP-gateway quote and the URL are verified.
- **Dex Horthy's "No Vibes Allowed"** talk (AI Engineer Code Summit, Nov 2025) and the "dumb zone" framing. Also HumanLayer's "Writing a good CLAUDE.md" guidance (keep it short; progressive disclosure; don't use the LLM as a linter). Not verified this session. The 2026 wsff.md does not use the term "dumb zone".
- **Karpathy's Jan 26 notes beyond the quoted lines**: "slopacolypse", skill "atrophy", "don't tell it what to do, give it success criteria". Also details of the Software 3.0 talk ("autonomy slider", generation–verification loop). From memory.
- **Manus's six July-2025 lessons** (stable prompt prefix, append-only context, mask tools rather than remove them, recitation via todo.md, keep errors in context, avoid few-shot ruts; ~10× cost gap between cached and uncached tokens). From memory. Lance's notes confirm only the cache-hit-rate point, the todo.md finding, the 5 refactors and the <20 functions.
- **Sankalp's Claude Code 2.0 guide** (~Dec 2025). Content and URL not verified.
- **Diwank Singh's "Field notes from shipping real code with Claude"** (~Jun 2025). Recalled content: `AIDEV-NOTE`/`AIDEV-TODO` anchor comments; humans write the tests. Not verified.
- **Lee Robinson's "coding agents & complexity budgets"** (~Dec 2025). Recalled: moving cursor.com off a CMS with agents for a few hundred dollars of tokens. Not verified.
- **Jeremy Howard's critical stance** on agentic and vibe coding (SolveIt / "dialog engineering", small human-understood steps). Not verified; the only verified Howard quote this session is an unrelated Jun 2026 tweet.
- **Böckeler's spec-driven-development critique** (Oct 2025) and **Fowler's** "Some thoughts on LLMs and software development" (Aug 2025; "hallucinations are a feature"). From memory.
- **Gergely Orosz, "How Claude Code is built"** (Sep 2025). Slice 1 territory; not verified here.
- **Exact dates** for Huntley's Ralph post (Jul 2025), Every's essays, Addy's "80% problem" post, and the *Vibe Coding* book's release year.
- **Thorsten Ball's original tool list.** I recall read_file / list_files / edit_file; one secondary source lists a search tool instead.
- **Hashimoto quotes**: "engineer a solution such that the agent never makes that mistake again" and the notifications quote are worded via secondary summaries of the primary post.
- **Ghostty's Jan 22, 2026 "accepted issues only" rule** comes from a secondary source. The current AI_POLICY text I fetched does not contain it.

---

## 8. Synthesis

### (i) Who-does-what matrix (latest known state; "?" means not documented)

| Practitioner | Primary tool(s) | Parallelism | Planning style | Testing / verification | Review style | Autonomy |
|---|---|---|---|---|---|---|
| Simon Willison | Claude Code, Codex CLI/web, Claude Code for web (phone) | ~4 local plus async research | Plan first; specify precisely for real work | Red/green TDD; "first run the tests"; agentic manual tests; conformance suites | Reviews landed work; by May 2026 not every line | High (YOLO, async) |
| Armin Ronacher | Pi (also Claude Code, Codex for review) | Low–moderate | Q&A → markdown handoff; no plan mode | Fast tests, logs, Makefile tools | Every line his responsibility; Codex/Pi `/review` | YOLO, leashed; loops only for porting/research |
| Peter Steinberger | Codex CLI (gpt-5.x-codex) | 3–8 in one folder | "Let's discuss"; spec plus GPT-5-Pro review for tricky work | Tests after each feature, same context; CLI-first loops | Barely reads code; review bots; 20% refactor time | Very high |
| Mario Zechner | Pi | Low ("tight leash") | Separate context-gathering session → artifact | Commit hooks (types/lint) | Human in the code; limit daily output | YOLO but supervised |
| Mitchell Hashimoto | Amp (2025) | 1 background agent | Reproduce, then delegate slam dunks | Targeted tests in AGENTS.md | Anti-slop cleanup sessions; oracle review | Moderate |
| Andrej Karpathy | Claude Code + IDE; autoresearch | "A few" CC sessions; overnight loops | ? (program.md for research) | Scalar-metric loops (val_bpb) | Edits plus touch-ups (~20%) | High for research loops |
| Geoffrey Huntley | Claude Code / Amp in bash loop | Single monolithic loop | specs/ → IMPLEMENTATION_PLAN.md | Backpressure: tests/types/lints, LLM-judge | Tune prompts; not per-line | Very high (greenfield) |
| Steve Yegge | Gas Town + Beads over Claude Code | 15–30 (until collapse) | Beads issue graph, convoys | Merge queue (Refinery) | Mayor/agents; minimal human | Extreme |
| Dex Horthy | Claude Code + HumanLayer commands | Moderate | Research → Plan → Implement; 2026: product → architecture → program design | Automated vs manual criteria per phase | Reviews research/plans, then "read the dang code" | Moderate–high |
| Jesse Vincent | Claude Code + Superpowers | Subagent per task | Brainstorm → plan of 2–5 min tasks | Strict TDD | Review between tasks | High within guardrails |
| Harper Reed | Claude Code | Low | Q-by-Q spec → prompt_plan.md | TDD plus pre-commit | Pause after each step | Moderate |
| Kent Beck | Claude Code / genies | Low | plan.md test list, "go" | Strict TDD | Watches for loops and cheating | Low–moderate |
| Thorsten Ball | Amp | ? | Plain-prose prompts naming files | ? | Oracle | ? |
| Every (Klaassen/Shipper) | Claude Code + compound plugin | Multiple reviewer agents | /ce-brainstorm → /ce-plan (80% plan+review) | Browser tests in /lfg | Multi-agent review, then human | High (/lfg) |
| Nicholas Carlini | Claude Code in containers | 16 | Lock-file task claims; agents keep READMEs | Near-perfect verifier; GCC oracle | Specialist critic agents | Fully autonomous (experiment) |
| antirez | Web chat (2025) → Claude Code (2026) | Low | Brain-dump context; notes file | ? | Strict supervision | Low → moderate |
| Matt Pocock | Skills on any agent | Subagents per ticket | Grill → spec → tracer-bullet tickets | TDD vertical slices | /code-review subagents | Moderate |
| Ryan Carson | Amp/Claude + Ralph | Loop | PRD → tasks → prd.json | Checks before `passes:true` | One sub-task at a time (manual mode) | Moderate–high |

### (ii) The 15 most-repeated techniques (and who endorses them)

1. **Tests as the agent's feedback loop, ideally test-first (red/green).** Simon, Beck, Harper, Jesse (Superpowers), Pocock, Huntley ("backpressure"), Carlini, Every, Dex (automated criteria), Steinberger (tests after each feature), Ghostty AGENTS.md.
2. **Write the spec/plan to a markdown file before coding.** Harper, Dex, Beck (plan.md), Jesse, Every, Carson, Huntley, Steinberger (docs/*.md), Armin (handoff file), Pocock (to-spec), Simon (plan in advance).
3. **Let the agent interview you first.** Harper ("one question at a time"), Pocock (grill-me), Armin (clarifying questions → `/answer`), Superpowers/Every (brainstorm), Steinberger ("let's discuss"; AI-asks-questions spec loop), Dex (ask only what the code can't answer).
4. **Living AGENTS.md/CLAUDE.md updated after every recurring mistake.** Hashimoto, Steinberger ("scar tissue"), Huntley, Carson (Ralph updates AGENTS.md), Jesse, Lance (diary/reflect), Every (docs/solutions), Simon, Armin.
5. **CLIs/skills/scripts over MCP; progressive disclosure.** Armin, Mario, Steinberger, Simon, Huntley, Manus, Lance, Shrivu (MCP as thin gateway), Thorsten (per talk notes).
6. **Deliberate context hygiene.** Fresh sessions, intentional compaction, small context. Dex (40–60%), Huntley, Mario (separate context session), Armin, Breunig, Lance, Manus, antirez (notes re-read after compaction). Steinberger dissents for GPT-5.2.
7. **YOLO with containment.** Containers, remote or async machines, backups, scoped credentials. Armin, Steinberger (Arq), Simon (Codespaces/async; $5 org), Huntley (sandbox), Mario, Carlini, Karpathy (autoresearch).
8. **Close the loop so agents can observe results.** Logs, dev servers, curl, screenshots, browser scripts, CLI-first. Armin, Steinberger, Simon (Showboat), Mario, Carlini (model-friendly test output).
9. **Run parallel agents, but cap them at review capacity and prefer low-stakes or research work in parallel.** Simon, Steinberger, Hashimoto, Jesse, Karpathy, Gergely, Yegge (aggressive).
10. **Small blast radius.** PR-sized or vertical slices, one sub-task at a time. Steinberger, Armin, Simon, Pocock (tracer bullets), Dex (100–200-line slices), Superpowers (2–5 min tasks), Carson, Harper (8–12-step plans).
11. **Second-model or second-context review.** Armin (Codex for PRs; Pi `/review` branch), Steinberger (GPT-5-Pro, oracle), Hashimoto ("consult the oracle"), Superpowers, Every, Mario (review sub-agent), the Claude Code team via Lance (parallel review sub-agents).
12. **Dedicated cleanup/refactor passes.** Hashimoto ("anti-slop session"), Steinberger (20% refactoring: jscpd, knip), Armin (cleanup todo before merge), Every (`/ce-simplify-code`), Simon (async refactors), Pocock (`improve-codebase-architecture`).
13. **Point agents at existing working examples to recombine.** Simon ("hoard things you know how to do"), Armin ("pointing the AI to existing implementations"), Steinberger ("look at ../vibetunnel"), Thorsten (point at existing sources), Hashimoto (manual restructure to set agents up).
14. **Agent-legible codebases and stacks.** Simple and explicit code, Go, plain SQL, stable dependencies, greppable code, conformance suites. Armin, Steinberger (TS/Go/Swift; "engineer [codebases] so agents can work in it efficiently"), Simon, Breunig (spec+tests library).
15. **Loops against verifiable goals for unattended work.** Ralph, autoresearch, end-of-day agents. Huntley, Karpathy, Hashimoto, Carlini, Carson, Dex (ralph commands), Simon (async research). Armin limits loops to porting, performance and research.

Honorable mention: **voice dictation for rich context** (Armin: "95% of my workflow"; Steinberger: Wispr Flow; Karpathy: SuperWhisper). Mario dropped it, and Steinberger types more with Codex.

### (iii) Points of genuine disagreement

| Issue | Position A | Position B |
|---|---|---|
| Plan mode / heavy process | Structured pipelines: Dex, Superpowers, Every, Harper, Carson, Huntley | "Just talk to it"; plan mode is a prompt: Steinberger, Armin, Mario |
| Subagents | Valuable for isolation and review: Superpowers, HumanLayer, Manus, Simon, Claude Code team | Opaque "charade" or anti-pattern for parallel features: Mario, Steinberger; Armin investigative-only |
| Scale of parallelism | Armies or factories: Yegge, StrongDM, Steinberger (3–8) | Tight leash: Mario, Armin, Hashimoto (1), Simon (review-bound); Yegge's Gas Town later collapsed |
| Reading the code | Mostly not: Steinberger; Simon (uneasily, May 2026); StrongDM | Yes: Dex ("Read the dang code"), Armin, Mario, Beck |
| Long-lived code via loops | Huntley ("programming the loop"), Yegge, StrongDM | Armin (loops "too defensive, too complex"), Mario, Dex ("model-training issue") |
| Context resets | Fresh context per phase or loop, 40–60%: Dex, Huntley | Long sessions fine on GPT-5.2: Steinberger |
| MCP | Thin secure gateway still useful: Shrivu; Codemode in Pi 1.0 (Armin, Oct 2026) | CLIs and skills only: Mario, Steinberger, Simon ("(only?) year of MCP") |
| Hooks | Pre-commit hooks are "the real magic" (Harper); PreCompact memory (Lance) | No gains in YOLO mode (Armin); "no hook will stop them" (Steinberger) |
| Worktrees | Superpowers, HumanLayer | Same folder, commit to main (Steinberger); fresh /tmp checkouts (Simon) |
| Trusting agent-written tests | Agents write tests first (Simon, Beck, Superpowers) | Agent test suites become "untrustworthy" (Mario); passing tests are "rarely" proof (Carlini); holdout scenarios needed (StrongDM) |
| Claude vs Codex | Claude for tool-heavy debugging (Armin), Opus "earned my trust" (Simon) | Codex reads more, less sycophantic (Steinberger); both concede "vibes" |
