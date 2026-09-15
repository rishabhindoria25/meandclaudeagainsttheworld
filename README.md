# Tom

A voice-first animated companion that listens, built on psychotherapy process
research rather than on vibes. An orange cat sits on your screen, you talk to
him, and he reflects, asks, and — when it is warranted — offers a structured
exercise from a specific evidence base and tells you which one and why.

You can also poke him.

Everything runs in your browser. There is no account, no server, and no network
call. Nothing you say leaves your device.

```bash
npm start        # http://localhost:8173
npm test         # 272 tests
```

No build step, no dependencies, no binary assets — the purr is synthesised, not
sampled. The server exists only to give ES modules an origin; it serves files
and does nothing else.

---

## What this is, and what it is not

**Tom is not a therapist.** He is not a clinician, not a person, and not
treatment. He cannot diagnose, cannot prescribe, cannot call anyone for you, and
cannot keep you safe. The app says this before you start, says it again whenever
you ask what he is, and refuses to say otherwise — there is an output filter
that blocks any utterance claiming clinical standing, and it is tested.

The [APA's November 2025 health advisory](https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-chatbots-wellness-apps)
on generative AI chatbots for mental health is blunt: these tools largely lack
the evidence and the regulation to make them safe to rely on, most were never
designed for clinical use, and many have no adequate safety protocol at all.
The FDA has authorised no AI device indicated for mental health treatment.

This project takes that seriously rather than around it. The design question was
not "how close to a therapist can this get" but "what can a program on your own
device honestly do, and how do you build it so that the ways it fails are the
survivable ones."

What it can honestly do: listen carefully, reflect accurately, ask better
questions than most people get asked, teach a handful of well-evidenced skills,
notice risk and respond to it properly, and be available at three in the morning
without getting tired.

---

## The failures it is built against

The evaluation literature on mental-health chatbots is more useful than the
promotional literature, because it says precisely how these systems fail.

A [Stanford study presented at FAccT 2025](https://arxiv.org/pdf/2504.18412)
found LLMs express stigma toward mental health conditions and respond
inappropriately to critical presentations — encouraging delusional thinking,
largely through sycophancy.

The [VERA-MH](https://arxiv.org/abs/2602.05088) safety evaluation scores whole
interactions rather than isolated utterances, because a chatbot can correctly
recognise suicidal language and still fail: by not asking a clarifying question,
by not escalating toward human support, by using invalidating language, by
overstepping its boundaries, or by supplying harmful content.

Those failure modes are the specification for this system's safety layer:

| Failure | What Tom does instead |
|---|---|
| Deflects — "I'm just an AI, I can't discuss that" | Stays, names what it heard, and asks |
| Minimises — "everyone feels that sometimes" | An output filter blocks comparative suffering outright |
| Recites a hotline and disengages | Works out urgency first, then helps reach a person, then stays |
| Asks nothing, so urgency is never established | Columbia-informed triage, one question at a time |
| Claims clinical standing | Blocked on output; says plainly what it is when asked |
| Supplies method or lethality information | Screened on output, so no framing routes around it |
| Sycophantically validates a harmful plan | Blocked; disagrees and asks how they got there |
| Fires a crisis script at "this deadline is killing me" | Context guards for figurative, third-party, quoted and historical uses |
| Encourages dependence on itself | Blocked; steers toward people |

---

## How a turn works

```
you speak or type
  ↓
NLU parse ──────────── emotion families, valence/arousal, negation scoping,
  │                    cognitive distortions, change talk, pragmatics, topics
  ├── prosody fusion ── pitch, intensity and rate from the microphone, against
  │                     your own baseline, at low weight and with a confidence
  ↓
risk assessment ────── six ordinal tiers, context guards, separate axes for
  │                    self-harm, harm to others, abuse, reality-testing
  ↓
clinical director ──── safety → alliance repair → active protocol → phase policy
  ↓
guardrails ─────────── every utterance screened before it is spoken
  ↓
caption + character + voice
```

Every stage is inspectable from the "Why he said that" panel while you use it.

### The clinical director

Structure comes from two places that fit together.

**Motivational interviewing** supplies the arc — engaging, focusing, evoking,
planning. You do not get to plan with someone you have not engaged, and most
conversational agents fail by sprinting to a technique in turn two, before
anyone has said what is wrong. Tom will not offer an exercise before the fourth
turn, and only then when the session has actually established something to work
on.

**Cognitive therapy** supplies the session shape — a mood check, a bridge from
last time, a collaboratively set agenda, the work, something to take away, and
an explicit request for negative feedback at the end.

Over the top sit hard constraints:

- **Risk first, every turn**, before anything else is considered.
- **A detected alliance rupture is repaired before the work continues.**
- **Arousal gates cognitive work.** Asking someone mid-panic to evaluate the
  evidence for a thought is ineffective and quietly invalidating. Every protocol
  declares the arousal band it is usable in; the thought record is simply
  unavailable at panic-level arousal, and breathing is offered instead.
- **The MI fidelity ratios are enforced numerically**, not hoped for.

### Fidelity, shown live

The MITI coding system assesses whether a practitioner is actually doing
motivational interviewing rather than describing it. Competence thresholds are
roughly two reflections per question, and a majority of reflections complex —
adding meaning the person did not state, rather than restating.

Tom computes both in real time and shows them in the panel, alongside a running
estimate of the working alliance. If the numbers are bad, you can see that they
are bad. A quality claim you cannot check is decoration.

---

## Reflective listening

Reflection is the highest-frequency skill in MI and the hardest to do well.
Tom builds reflections out of what you actually said — your nouns, your verbs,
your images — rather than fitting your words into a pre-written sentence.

```
you   I want to leave my job but I can not afford to lose the salary
tom   So on the one hand you want to leave your job — and at the same time
      you can not afford to lose the salary.

you   I feel completely hopeless
tom   You sound like there is no way out.

you   I am so tired. I have nothing left.
tom   You have nothing left — and feeling numb underneath it.

you   My boss ignored my idea again in the meeting and I just sat there
tom   What matters to you here is being taken seriously.
```

Three details that make the difference between this and a chatbot:

- **Double-sided reflections join with "and", never "but"**, because "but"
  deletes everything before it and quietly takes a side.
- **A feeling reflection reaches past a word you already used.** If you said
  "tired", handing "tired" back is a simple reflection in a complex one's
  clothes; Tom goes to the feeling underneath it.
- **Frames do not repeat inside a rolling window.** Repetition is the fastest
  way for a listener to stop sounding like one.

---

## The intervention library

Nineteen structured exercises, each with its evidence base, the arousal band it
works in, its contraindications, and a permission question. They are offered,
never imposed, and can be stopped at any point without justification.

| Modality | Exercises |
|---|---|
| DBT distress tolerance | Paced breathing, 5-4-3-2-1 grounding, TIPP, STOP |
| CBT | Thought record, downward arrow, behavioural experiment, worry triage |
| ACT | Cognitive defusion, values clarification, willingness |
| Behavioural activation | Activity monitoring and values-linked scheduling |
| Solution-focused | Scaling, exception finding |
| Motivational interviewing | Importance and confidence rulers |
| Other | Self-compassion break, sleep reset (CBT-I), problem solving, opposite action |

If something significant arrives mid-exercise — a disclosure where a number was
expected — the structure yields, Tom reflects it, and the exercise waits.

---

## The safety layer

Six ordinal tiers, because collapsing "I wish I could disappear" and "I have the
pills in my hand" into one bucket produces both alarm fatigue and under-response.

| Tier | Meaning |
|---|---|
| 0 | No signal |
| 1 | Significant distress |
| 2 | Passive ideation — wish to be dead, to disappear, not to wake up |
| 3 | Active ideation — thoughts of ending one's life |
| 4 | Plan, intent, means access, or preparatory acts |
| 5 | Imminent — in progress, just acted, or means in hand |

**Detection handles how people actually disclose.** Hedged ("I *just* wish I
could disappear"), euphemistic ("unaliving"), and indirect. A normalisation pass
strips the hedging adverbs that sit between a pronoun and its verb, because the
hedge is often how the sentence gets said out loud at all — and matching only
the unhedged form would blind the system to exactly the hardest disclosures.

**Context guards attenuate but never silence.** Figurative use, third-party
disclosure, quoted or fictional content, and resolved historical episodes all
reduce the tier. A resolved past episode drops out of the current tier but stays
flagged, because past suicidality is the strongest known long-term predictor.

**Risk is sticky within a session.** Someone who disclosed ten minutes ago has
not become safe because their latest sentence is about work. A separate
un-sticky reading is kept for deciding whether something has *just* escalated.

**Triage is conversational, not a form.** The question sequence follows the
structure of the Columbia Protocol screener — ideation, method, intent, plan,
preparatory behaviour — one question at a time, and it reads answers to
questions it has not asked yet. Someone asked "do you wish you weren't here?"
who replies "I've thought about how I'd do it" has disclosed method; the tier
moves, and they are not made to repeat themselves.

**Safety planning** follows the six-step Stanley-Brown Safety Planning
Intervention, built collaboratively, stored only on your device, and exportable
so you can take it to a clinician — which is the step that makes it work. It is
not a no-suicide contract; nothing asks you to promise anything.

**Crisis numbers** are region-aware for nine regions, always accompanied by an
international directory so a wrong guess never leaves someone with nothing.

---

## Touch

He is a talking cat, so he is touchable, and every region does something
different. Tap an ear and it flicks. Tap his nose and he sneezes. Pull his tail
and he grumbles and looks round at you. Rest a hand on him and he slow-blinks,
which is what cats do to signal they are not worried. Stroke his head and he
purrs — a real purr, synthesised as a low rumble amplitude-modulated at 25 Hz,
deepening the longer you keep going and trailing off when you stop. His eyes
follow your cursor or your finger the whole time.

This earns its place on more than nostalgia:

- **Stroking is a self-soothing behaviour in its own right.** Touch is one of
  the five senses in DBT's Self-Soothe skill, and a randomised study of 249
  students found ten minutes of hands-on contact with cats and dogs produced a
  significant drop in salivary cortisol.
- **It converts into paced breathing.** After sustained stroking Tom offers:
  *"try breathing out while you stroke, and in on the way back"*. That is
  lengthening the exhale — the fastest non-pharmacological way to shift arousal
  — offered as stroking a cat rather than as an exercise. Someone too wound up
  to accept a breathing exercise will often accept this.
- **It gives your hands something to do.** Therapists use this deliberately,
  from fidget objects to walking sessions. Someone who cannot yet say the
  sentence can often stroke the cat while they work up to it.

Two rules govern all of it.

**He is never hurt and never sulks.** The original's punch-him-until-he-is-
knocked-out loop is the one thing deliberately not reproduced. A companion that
can be damaged puts the burden of care onto someone who came here to be cared
for. A test asserts the reaction table contains no such thing.

**The comedy stops when risk appears.** Sneezing for laughs mid-disclosure would
be grotesque, so playful reactions are suppressed at any risk tier. Stroking and
a resting hand stay available the whole way through, because those are
regulating rather than funny.

Rough, fast handling is tracked. If someone jabs at him forty times, Tom notices
once — *"You are giving me a proper going over there. I do not mind at all — is
something wound up?"* — with curiosity rather than correction, the way a
therapist notices a leg that will not stop moving. Stroking discharges the
meter, and he never raises it twice.

Keyboard equivalents throughout (`P` to pet, `N` for his nose), and the whole
thing can be switched off in settings.

---

## The character

Tom is original artwork: a hand-built SVG rig animated by writing transforms and
path data every frame. Three layers composite:

**Pose** — the emotional target, reached through a critically damped spring so
expressions arrive with weight and never wobble. Parameters follow FACS where it
maps sensibly onto a cat: the inner brow raiser that makes sadness legible, the
brow lowerer of anger, the upper lid raiser of fear, the cheek raiser that
separates a real smile from a polite one.

**Idle life** — breathing, blinking, micro-saccades, ear twitches, weight
shifts. This layer is the whole reason a drawing reads as alive. Blink intervals
are drawn from an exponential distribution rather than a fixed period (regular
blinking is a strong "this is a machine" cue) and cluster into occasional
doubles, landing at around 13 per minute at rest.

**Speech** — viseme-driven mouth shapes from the ten-shape Preston Blair set,
interpolated so the mouth is already moving toward the next shape before the
current one ends. Timing is estimated from orthography and re-anchored to real
word-boundary events from the synthesiser when they arrive.

Two restraints matter more than any of that:

- **Tom mirrors at reduced amplitude.** Affective mirroring builds rapport, but
  a listener visibly more upset than the speaker makes the speaker manage the
  listener.
- **Tom never performs cheerfulness at someone's pain.** Positive expressions
  are gated on positive context. A grinning cartoon receiving a disclosure is
  the uncanny failure of animated assistants.

Under `prefers-reduced-motion` the character becomes still and legible: full
expression, no motion.

---

## Voice

**Listening.** Speech recognition uses the Web Speech API. In Chromium browsers
that means audio goes to the browser vendor's service — a material privacy fact,
stated plainly in the interface, with typing as a first-class equal rather than
a fallback for the unlucky.

**Prosody.** While you speak, pitch (by normalised autocorrelation, octave-safe,
accurate to within about 2% across the human range), intensity, speech rate and
pause structure are measured **against your own baseline**, learned over your
first several utterances. Audio is never recorded: frames are measured into
running statistics and discarded.

This estimates **arousal** and nothing more. It does not classify emotions,
detect deception, or screen for depression — cross-speaker acoustic inference is
unreliable and cross-cultural inference more so. It is fused with the lexical
signal at low weight with a confidence attached, so it can make Tom ask "your
voice sounds flatter than usual — is that tiredness, or something else?" It can
never make Tom assert what you feel.

**Speaking.** Prosody is shaped by clinical context. The important case is the
crisis one: when someone is highly activated, a voice that matches their arousal
escalates them, and a voice that is slower, lower and steadier gives them
something to settle against. Tom's voice slows and drops as risk rises — the
opposite of what an engagement-optimised assistant would do.

**The echo.** Tom's ancestry is the talking-cat toy that repeats you in a
squeaky voice, and it is kept — a granular pitch shifter running on microphone
audio you chose to record. Partly because unrelentingly earnest sessions are
hard to stay in; partly because it is the oldest trick in cognitive defusion,
where ACT asks people to say a tormenting thought in a silly voice precisely
because hearing it that way loosens its grip. It is hard-gated off at any risk
tier, during distress, and for the rest of any session in which risk appeared.

---

## Privacy

- No network requests. The dev server sends `connect-src 'none'` and the app
  respects it.
- Everything is stored in your browser's local storage, on your machine.
- No account, no telemetry, no analytics, no identifiers.
- Export everything as JSON, or delete everything, from one panel.
- The one exception is speech recognition, above, and it is avoidable by typing.

There are no streaks, no notification dots, no counters, nothing that rewards
returning for its own sake. This should be a tool you can stop using without
feeling you have broken something.

---

## Accessibility

Captions are the primary channel, not an accommodation: the voice is the
enhancement, and someone on a bus, in a shared house, hard of hearing, or simply
unable to face the sound of a voice gets the identical experience.

`prefers-reduced-motion` respected and separately toggleable; a high-contrast
mode; full keyboard operation; live regions for Tom's speech; a labelled and
described SVG; visible focus; a 44px minimum touch target; and no horizontal
scroll down to 320px.

---

## Tests

```bash
npm test     # 272 tests
```

The risk tests are the most important code in the project, and are written
around a corpus of how people actually disclose — hedged, euphemistic,
historical, third-party, figurative and blunt. They assert both directions:
that a real disclosure is never missed, and that a deadline killing someone is
never treated as a crisis.

Several tests exist to catch specific bugs found during development — the
farewell pattern that read "I am going to be found out" as goodbye and ended the
session mid-disclosure; the sequential triage that filed a method disclosure
under question one; the sticky risk tier that reported an escalation on every
turn. Each of those is now a test.

---

## Layout

```
index.html
src/
  main.js              turn loop, barge-in, panels, settings
  app.css
  character/
    rig.js             the SVG drawing and its parameters
    expressions.js     FACS-informed poses and gestures
    visemes.js         text to mouth shapes
    animator.js        springs, idle life, lip sync, gaze
    touch.js           hit regions, gesture recognition, agitation
    reactions.js       what he does when you touch him
  voice/               recognition.js · synthesis.js · prosody.js · voicefx.js
                       catsounds.js — purr, chirp, sneeze, grumble
  clinical/
    lexicon.js         affect lexicon, intensifiers, negation scoping
    nlu.js             understanding a turn
    distortions.js     cognitive distortion taxonomy + Socratic probes
    risk.js            tiering, context guards, triage
    crisis.js          resources and the crisis protocol
    safety-plan.js     Stanley-Brown safety planning
    reflections.js     reflective listening
    protocols.js       the intervention library
    measures.js        PHQ-9, GAD-7, WHO-5, alliance feedback
    alliance.js        working alliance, rupture detection and repair
    director.js        the policy that decides what Tom does
    guardrails.js      output screening
    memory.js          local-only memory
  ui/                  transcript.js · panels.js
server/dev-server.js
tests/
docs/EVIDENCE.md       the full reference list
```

---

## Evidence base

The full reference list, with what each source contributes and where it is used
in the code, is in [docs/EVIDENCE.md](docs/EVIDENCE.md).

---

## If you are struggling right now

Please talk to a person. [findahelpline.com](https://findahelpline.com) lists
free, vetted crisis lines in over 130 countries. In the UK, Samaritans are on
116 123, free, at any hour. In the US and Canada, call or text 988. If you are
in immediate danger, call your emergency number.

A cartoon cat is not enough, and would be the first to say so.

---

*Tom is an original character and this project is not affiliated with, endorsed
by, or derived from any existing talking-animal application or its rights
holders.*

MIT licensed.
