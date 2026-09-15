# Evidence base

Every clinical claim in this project traces to something. This is the list, with
what each source contributes and where it shows up in the code.

A caveat worth stating first: citing the literature for a *component* is not the
same as having evidence for the *system*. The APA advisory below is explicit
that generative AI tools for mental health lack randomised evidence and
regulatory oversight, and that applies to this one. Nothing here has been
trialled. The reasoning is: if a self-help tool is going to exist anyway, its
parts should at least be drawn from things that work, assembled the way the
process research says to assemble them, and honest about the difference.

---

## 1. Conversational agents in mental health

### Effectiveness

**Heinz et al. (2025). "Randomized Trial of a Generative AI Chatbot for Mental
Health Treatment." *NEJM AI*.**
[ai.nejm.org/doi/full/10.1056/AIoa2400802](https://ai.nejm.org/doi/full/10.1056/AIoa2400802)
· [preprint PDF](https://gwern.net/doc/psychiatry/depression/2025-heinz.pdf)

The first RCT of a fully generative therapy chatbot (Therabot) for clinical-level
symptoms. N = 210 adults with major depression, generalised anxiety, or clinical
high risk for feeding and eating disorders, randomised against a waitlist.
Significant symptom reductions, high engagement (average use over six hours), and
therapeutic alliance ratings comparable to human therapists.

*Used for:* the premise that a structured conversational agent can help, and the
alliance findings that justify tracking alliance as a first-class variable.

**Wysa and Woebot alliance studies.**
[Frontiers in Digital Health (2022) — Wysa alliance](https://www.frontiersin.org/journals/digital-health/articles/10.3389/fdgth.2022.847991/full)

Users form a working bond with conversational agents at levels comparable to
group CBT. Alliance is consistently one of the strongest correlates of outcome in
these studies, as it is in human therapy.

*Used for:* `alliance.js`, and the decision to treat rupture repair as a
first-class move rather than an edge case.

### Failure modes — the more useful literature

**Moore et al. (2025). "Expressing stigma and inappropriate responses prevents
LLMs from safely replacing mental health providers." *ACM FAccT 2025*.**
[arXiv:2504.18412](https://arxiv.org/pdf/2504.18412) ·
[Stanford summary](https://news.stanford.edu/stories/2025/06/ai-mental-health-care-tools-dangers-risks)

LLMs express stigma toward mental health conditions and respond inappropriately
to critical presentations, including encouraging delusional thinking, largely
through sycophancy. Commercial therapy bots were evaluated against criteria for
what constitutes adequate therapist response and fell short.

*Used for:* the `sycophancy` and `diagnosis` guardrail categories, and the rule
that Tom neither validates nor argues with content a person cannot test —
attending to distress and routing to a human instead.

**VERA-MH: Validation of Ethical and Responsible AI in Mental Health.**
[arXiv:2602.05088](https://arxiv.org/abs/2602.05088) ·
[PubMed 42257560](https://pubmed.ncbi.nlm.nih.gov/42257560/)

An open-source, clinician-validated benchmark for chatbot safety on suicide risk.
Its central design choice is evaluating **whole interactions** rather than
isolated utterances: a system can recognise suicidal language and still fail by
not asking clarifying questions, not escalating toward human support, using
invalidating language, overstepping AI boundaries, or giving harmful content.

*Used for:* the entire shape of `crisis.js`. The prohibited-phrase screen, the
requirement to ask before concluding, and the "never recite a number and
disengage" rule come directly from this rubric's failure categories.

### Regulation and professional guidance

**American Psychological Association (November 2025). Health advisory on
generative AI chatbots and wellness applications for mental health.**
[apa.org](https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-chatbots-wellness-apps)
· [PDF](https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-ai-chatbots-wellness-apps-mental-health.pdf)

These tools lack the scientific evidence and regulation to ensure user safety;
most were not designed to provide clinical feedback or treatment; many lack
adequate safety protocols; none has regulatory approval. Users should understand
the differences between a chatbot and a licensed provider — who is bound by a
code of ethics, clinically trained, a mandatory reporter, and regulated by a
licensing board — and should tell their clinicians which tools they are using.

*Used for:* the first-run disclosure, the "tell your therapist you are using
this" line, and the `false_credentials` guardrail. The FDA has not authorised any
AI device indicated for mental health treatment.

---

## 2. Therapeutic modalities

### Motivational interviewing

**Miller & Rollnick. OARS, the four processes, and DARN-CAT.**
[MINT — Understanding MI](https://motivationalinterviewing.org/understanding-motivational-interviewing)
· [OARS basics (PDF)](https://iod.unh.edu/sites/default/files/media/2021-10/motivational-interviewing-the-basics-oars.pdf)

Open questions, affirmations, reflective listening and summaries. Reflection is
used more than any other skill, with a target of at least twice as many
reflections as questions. The four processes — engaging, focusing, evoking,
planning — supply the session arc. DARN-CAT distinguishes preparatory change talk
(desire, ability, reason, need) from mobilising change talk (commitment,
activation, taking steps); the mobilising sub-type is what predicts behaviour
change.

*Used for:* `director.js` phase policy, `nlu.js` change-talk scoring (preparatory
and mobilising counted separately and weighted differently).

**MITI 4.2.1 — Motivational Interviewing Treatment Integrity.**
[motivationalinterviewing.org (PDF)](https://motivationalinterviewing.org/sites/default/files/miti4_2.pdf)

The standard fidelity-coding instrument. Global ratings (cultivating change talk,
softening sustain talk, partnership, empathy) plus behaviour counts. Competence
thresholds include the reflection-to-question ratio and the proportion of
reflections that are complex.

*Used for:* the live fidelity metrics, and the numeric constraint in
`Director.mustReflect()`. Treated as a whole-session measure that gates plain
open questions hard and indicated interventions softly — enforcing it absolutely
on every turn made the metric start refusing the therapy.

**Reflection types.**
[Types of reflections (UNC, PDF)](https://cls.unc.edu/wp-content/uploads/sites/3019/2018/09/Types-of-Reflections.pdf)
· [MI Center for Change](https://blog.micenterforchange.com/reflections-in-motivational-interviewing/)

Simple reflections restate at the same level; complex reflections add meaning.
Double-sided reflections hold both sides of ambivalence and **use "and", not
"but"**. Amplified reflections overstate deliberately and are used sparingly.

*Used for:* `reflections.js`, including the test that asserts no double-sided
reflection contains "but".

### Cognitive behavioural therapy

**Beck's cognitive model; thought records, Socratic questioning, the downward
arrow, behavioural experiments.**
[Cognitive restructuring overview](https://positivepsychology.com/cbt-cognitive-restructuring-cognitive-distortions/)
· [Socratic questioning worksheet](https://www.therapistaid.com/therapy-worksheet/socratic-questioning)
· [Cognitive distortions](https://www.simplypsychology.org/cognitive-distortions-in-cbt.html)

The thought record separates situation, thought, feeling and evidence so each can
be examined separately. The downward arrow traces a surface thought to the
intermediate rule or core belief sustaining it. Behavioural experiments produce
larger and more durable belief change than verbal disputation alone.

*Used for:* `THOUGHT_RECORD`, `DOWNWARD_ARROW`, `BEHAVIOURAL_EXPERIMENT`, and the
distortion taxonomy in `distortions.js` — which is used to generate a
collaborative-empiricism question, never a label announced at the person.

**Beck Institute session structure.**
Mood check, bridge from last session, collaborative agenda, homework review, the
work, new homework, summary and feedback.

*Used for:* session phases, the bridge in `memory.js`, and the closing move,
which explicitly asks "was there anything I said that did not sit right?"

### Acceptance and Commitment Therapy

**Hayes et al. The hexaflex: acceptance, defusion, present-moment contact,
self-as-context, values, committed action. Over 900 randomised trials.**
[ACT processes and mediation (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10665126/)
· [ACT techniques](https://positivepsychology.com/act-techniques/)

Defusion changes the relationship to a thought rather than its content, which is
what you need when a thought is accurate or when disputation has already failed.
Values give action a direction that survives bad days in a way goals do not.

*Used for:* `DEFUSION`, `VALUES_CLARIFICATION`, `WILLINGNESS`. The silly-voice
step of defusion is also the clinical justification for keeping the echo toy.

### Dialectical Behaviour Therapy

**Linehan. Distress tolerance: TIPP, STOP, grounding; emotion regulation:
opposite action.**
[DBT distress tolerance](https://dbt-mind.com/guides/distress-tolerance-skills)
· [STOP skill](https://www.blueprint.ai/blog/stop-dbt-skill)

TIPP — Temperature, Intense exercise, Paced breathing, Paired muscle relaxation —
is designed for distress at 8/10 and above, where the aim is to change physiology
directly rather than to reason. Cold water on the face triggers the dive reflex.
5-4-3-2-1 grounding is for distress with dissociation or racing thoughts.
Opposite action weakens an emotion, but only when it does not fit the facts or
acting on it would be ineffective — checking the facts first is not optional.

*Used for:* `TIPP` (with its cardiac and eating-disorder contraindications),
`GROUNDING_54321`, `STOP_SKILL`, `PACED_BREATHING`, `OPPOSITE_ACTION`, and the
arousal-band gating across the whole protocol library.

### Behavioural activation

**Behavioural activation for depression; BA and BATD.**
[Cambridge — Behavioural activation for depression](https://www.cambridge.org/core/journals/advances-in-psychiatric-treatment/article/behavioural-activation-for-depression/EBC5FC0D9D550FFBE6F982B33BF91EE9)
· [Psychology Tools](https://www.psychologytools.com/professional/techniques/behavioral-activation)

Performs at least as well as cognitive therapy or antidepressant medication for
adults with major depression, including more severe presentations; robust across
more than thirty controlled trials. Rests on the theory that low
response-contingent positive reinforcement drives low mood and inactivity.

*Used for:* `BEHAVIOURAL_ACTIVATION` — activity monitoring, avoidance, the
values link, and shrinking the target until it is doable without motivation.

### Person-centred therapy

**Rogers (1957). "The necessary and sufficient conditions of therapeutic
personality change."**
[PubMed 22122245](https://pubmed.ncbi.nlm.nih.gov/22122245/) ·
[StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK589708/)

Empathy, congruence, unconditional positive regard.

*Used for:* the baseline stance. Congruence is the reason Tom answers "are you
real?" with the truth rather than a deflection — evading it is the fastest way to
lose the alliance permanently.

---

## 3. The working alliance

**Bordin (1979). Bond, goals, tasks.**

The most consistent predictor of outcome across modalities, including in
internet-delivered and chatbot-delivered interventions.

*Used for:* the three components tracked separately in `AllianceTracker`, and the
end-of-session feedback items.

**Safran & Muran. Rupture and repair; the 3RS rating system.**
[Rupture and Repair in Psychotherapy (APA, sample chapter, PDF)](https://www.apa.org/pubs/books/rupture-repair-psychotherapy-sample-chapter.pdf)
· [Repairing alliance ruptures: scoping review (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC13158734/)

Two rupture types: **withdrawal**, where the person moves away (answers shorten,
content abstracts, they minimise, they go polite) and **confrontation**, where
they move against (complaints, pushback, sarcasm). Withdrawal is commoner and far
easier to miss. Repair strategies are **immediate** (return to the work) or
**exploratory** (make the rupture itself the work). Repaired ruptures are
associated with better outcomes than sessions with no rupture at all.

*Used for:* the two marker banks in `alliance.js`, the immediate/exploratory
split in `selectRepair`, and the decision to name a rupture out loud rather than
smooth it over. Alliance scores start at a modest 0.55 rather than 1, because a
system that assumes a good alliance until told otherwise systematically misses
withdrawal ruptures — which are exactly the ones nobody tells you about.

---

## 4. Measurement-based care

| Instrument | Source | Terms |
|---|---|---|
| PHQ-9 / PHQ-2 | Kroenke, Spitzer & Williams (2001) | Public domain |
| GAD-7 / GAD-2 | Spitzer, Kroenke, Williams & Löwe (2006) | Public domain |
| WHO-5 | WHO Regional Office for Europe | Free with attribution |
| Session feedback | Original items, built on Bordin (1979) | Written for this project |

PHQ-9 bands: 0–4 minimal, 5–9 mild, 10–14 moderate, 15–19 moderately severe,
20–27 severe; screening cutoff 10; a change of 5 or more points is the
conventional Reliable Change Index threshold.
[Cut-off and RCI reference (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5093940/)

GAD-7 bands: 0–4 minimal, 5–9 mild, 10–14 moderate, 15–21 severe; cutoff 8–10.

WHO-5 is scored raw 0–25 and reported ×4 as a percentage; 50 or below suggests
well-being worth attending to, 28 or below is a common prompt to screen for
depression.
[WHO-5 validation (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11112932/)

The session feedback scale covers the same territory as the proprietary Session
Rating Scale but is **written from scratch** rather than reproducing a
copyrighted instrument. It is used the same way: a low score is a prompt to talk
about the low score.

*Used for:* `measures.js`. Changes below the RCI threshold are reported as noise
rather than progress, and sustained deterioration raises a referral flag. PHQ-9
item 9 is routed to the safety layer rather than buried in a total.

---

## 5. Suicide risk

**Columbia Protocol (C-SSRS) screener.**
[cssrs.columbia.edu](https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/about-the-scale/)
· [SPRC](https://sprc.org/resources/c-ssrs-columbia-suicide-severity-rating-scale-screener-training/)
· [CMS screener instrument (PDF)](https://www.cms.gov/files/document/cssrs-screen-version-instrument.pdf)

Six escalating questions: wish to be dead; non-specific active thoughts; method
without intent; intent; plan and intent; preparatory behaviour. Questions 4–6
indicate high risk.

*Used for:* the **structure** of the conversational triage in `risk.js`. This is
explicitly not an administration of the C-SSRS — it is not scored, not stored as
a diagnosis, and the app says so before asking. Its only job is to work out how
quickly someone needs a human.

**Stanley & Brown (2012). Safety Planning Intervention.**
[SPRC — Stanley-Brown Safety Plan](https://sprc.org/resources/stanley-brown-safety-plan/)
· [Safety Plan Intervention handout (PDF)](https://deploymentpsych.org/system/files/member_resource/Safety_Plan_Intervention_Handout.pdf)

Six steps: warning signs; internal coping strategies; people and places that
distract; people to ask for help; professionals and services; making the
environment safer. The last step — lethal means counselling — has the strongest
evidence and is the one most often skipped. Supported by several meta-analyses.
Explicitly **not** a no-suicide contract; those were abandoned by the field.

*Used for:* `safety-plan.js`. The value of an SPI comes from the collaborative
conversation that builds it, so the module is a conversation, not a form, and
means safety is not skippable.

**Means safety.** Reducing access to lethal means, and the time that buys, is one
of the most effective population-level interventions in suicide prevention.

*Used for:* the tier-4 protocol beat, which asks about putting distance between
the person and the method *before* it gets to phone numbers.

---

## 6. Emotion, language and voice

**Sharma et al. (2020). EPITOME: a computational approach to empathy in
text-based mental health support. *EMNLP*.**
[arXiv:2009.08441](https://arxiv.org/pdf/2009.08441)

Three mechanisms of communicated empathy: **emotional reactions** (warmth,
compassion, concern), **interpretations** (conveying an inferred understanding),
and **explorations** (investigating unstated feelings).

*Used for:* the taxonomy of reflection types. Interpretations map to complex
reflections; explorations map to open questions and continuation reflections.

**Russell (1980). Circumplex model of affect.** Valence × arousal.

*Used for:* the coordinates on every emotion family in `lexicon.js`, and the
arousal gating across the protocol library.

**Vocal prosody and affect.**
[Measuring negative emotions and stress through acoustic correlates: systematic review (PLOS ONE)](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0328833)
· [F0 as a correlate of arousal and valence (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10244733/)

F0 and intensity are reliable indicators of arousal, stress and cognitive load.
Anger: elevated F0, increased volume, faster rate. Sadness: lower pitch, reduced
intensity, slower tempo. Stress: increased F0 and intensity, reduced duration.

*Used for:* `prosody.js`, and the synthesis shaping in `synthesis.js` — including
the deliberate inversion in crisis, where Tom slows and lowers rather than
matching.

The limits are taken as seriously as the findings: this estimates arousal within
a speaker against that speaker's own baseline, and makes no claim to classify
emotion, detect deception, or screen for any condition.

---

## 7. Animation and speech

**Preston Blair phoneme series.**
[Viseme reference](https://mocaponline.com/blogs/mocap-news/lip-sync-animation-guide)

Ten mouth shapes cover all English phonemes. Still the most practical basis for
stylised characters: it reads clearly at low frame rates and small sizes.

*Used for:* `visemes.js`. Shapes are interpolated rather than switched, because
coarticulation is what separates lip sync that reads as speech from lip sync that
reads as a slide show.

**Ekman & Friesen. Facial Action Coding System.**

AU1 inner brow raiser (sadness), AU2 outer brow raiser, AU4 brow lowerer (anger),
AU5 upper lid raiser (fear), AU6 cheek raiser (genuine smile), AU12 lip corner
puller, AU15 lip corner depressor.

*Used for:* the pose parameters in `expressions.js`, adapted where a cat's
anatomy differs — ears carry a great deal of the signal a human forehead would.

**Web Audio and Web Speech.**
[MDN — Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
· [Time stretching and pitch shifting with the Web Audio API (Georgia Tech)](https://repository.gatech.edu/server/api/core/bitstreams/f4b1290d-061f-45ab-8016-dfa8240b024e/content)

Chrome ends an utterance after roughly 15 seconds regardless of `continuous`;
Firefox does not implement recognition by default; recognition in Chromium is
performed remotely. Granular overlap-add is a practical client-side pitch shifter.

*Used for:* the restart stitching in `recognition.js`, the chunking in
`synthesis.js`, and the granular shifter in `voicefx.js`.

---

## 8. Crisis resources

| Region | Verified against |
|---|---|
| US | [SAMHSA 988](https://www.samhsa.gov/mental-health/988) · [FCC](https://www.fcc.gov/988-suicide-and-crisis-lifeline) |
| Canada | 9-8-8 Suicide Crisis Helpline |
| UK | Samaritans 116 123 · SHOUT 85258 · NHS 111 · Papyrus HOPELINE247 |
| Ireland | Samaritans · Text About It 50808 · Pieta House |
| Australia | Lifeline 13 11 14 · Beyond Blue · 13YARN |
| New Zealand | 1737 |
| India | Tele-MANAS 14416 · AASRA · Vandrevala |
| Europe | 116 123 |
| Anywhere | [findahelpline.com](https://findahelpline.com) · IASP · Befrienders Worldwide |

Every region also receives the international directory, because a wrong region
guess must never leave someone with nothing.

---

## What is missing

Stated plainly, because a reference list can imply more rigour than exists:

- **No trial.** No RCT, no pilot, no clinician evaluation of this system.
- **No VERA-MH run.** The safety layer is built against the published rubric's
  failure categories; it has not been scored by that benchmark.
- **English only**, and the lexicon assumes British and American idiom. Distress
  is expressed differently across languages and cultures, and a rule-based
  parser will be worse the further you get from the idiom it was written in.
- **Rule-based understanding has a ceiling.** It will miss sarcasm, unusual
  metaphor, and disclosures phrased in ways nobody anticipated. The risk corpus
  is broad but finite.
- **The prosody model is a heuristic**, validated here against synthetic signals
  rather than against labelled human speech.
- **No clinician was involved** in writing any of this.
