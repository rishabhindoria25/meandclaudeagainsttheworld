/**
 * Side panels: the transparency panel, fidelity metrics, and questionnaires.
 *
 * The transparency panel exists because a system that reasons about someone's
 * emotional state and then chooses a technique should be inspectable by the
 * person it is reasoning about. Every move Tom makes names its modality, its
 * evidence base, and what in the conversation triggered it. This is also the
 * honest answer to "how do I know this thing knows what it is doing" — you look.
 */

import { score, describe, changeSince, INSTRUMENTS } from '../clinical/measures.js';

/**
 * Render the explanation of Tom's most recent move.
 * @param {HTMLElement} root
 * @param {object} move
 */
export function renderWhy(root, move) {
  if (!move) {
    root.innerHTML = '<dd>Nothing said yet.</dd>';
    return;
  }
  const m = move.meta ?? {};
  const rows = [
    ['What he did', humanKind(move.kind)],
    ['Why', m.why],
    ['Approach', m.modality],
    ['Evidence', m.evidence],
    ['Where we are', m.phase ? `${m.phase} phase` : null],
    ['What he heard', m.understood ? describeUnderstanding(m.understood) : null],
    ['Risk level', m.riskTier > 0 ? `tier ${m.riskTier}` : 'no risk signals'],
  ].filter(([, v]) => v);

  root.replaceChildren();
  for (const [label, value] of rows) {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    root.append(dt, dd);
  }

  if (move.guardrails?.length) {
    const dt = document.createElement('dt');
    dt.textContent = 'Guardrail';
    const dd = document.createElement('dd');
    dd.textContent = `A draft reply was blocked (${move.guardrails.map((g) => g.category).join(', ')}) and replaced. ${move.guardrails[0].why}`;
    root.append(dt, dd);
  }
}

function humanKind(kind) {
  return {
    reflect: 'Reflected back what you said',
    question: 'Asked an open question',
    affirm: 'Named something you did',
    summary: 'Summarised',
    close: 'Closed the session',
    offer_protocol: 'Offered an exercise',
    protocol_step: 'Walked a step of an exercise',
    protocol_complete: 'Finished an exercise',
    psychoeducation: 'Offered some information',
    safety: 'Followed the safety protocol',
    safety_plan: 'Worked on your safety plan',
    safety_plan_complete: 'Finished the safety plan',
    repair: 'Repaired something that went wrong between you',
    meta: 'Answered a question about what he is',
    space: 'Left you space',
  }[kind] ?? kind;
}

function describeUnderstanding(u) {
  const bits = [];
  if (u.primaryAffect) bits.push(`feeling: ${u.primaryAffect}`);
  if (Number.isFinite(u.arousal)) bits.push(`activation: ${Math.round(u.arousal * 100)}%`);
  if (u.topics?.length) bits.push(`about: ${u.topics.join(', ')}`);
  if (u.distortions?.length) bits.push(`thinking patterns worth a question: ${u.distortions.join(', ')}`);
  if (u.ambivalent) bits.push('pulled both ways');
  if (u.changeTalk?.length) bits.push(`talk about changing: ${u.changeTalk.join(', ')}`);
  return bits.join(' · ') || 'nothing distinctive';
}

/**
 * Fidelity metrics, displayed live.
 *
 * These are the same measures used to assess whether a human practitioner is
 * actually doing motivational interviewing rather than describing it. Showing
 * them makes a claim falsifiable instead of decorative.
 */
export function renderFidelity(root, fidelity, allianceDetail) {
  const metrics = [
    {
      value: fidelity.ratio == null ? '—' : fidelity.ratio.toFixed(1),
      label: 'reflections per question',
      state: fidelity.ratio == null ? '' : fidelity.ratio >= 2 ? 'good' : 'watch',
      title: 'MI competence is conventionally two or more reflections for every question.',
    },
    {
      value: `${Math.round(fidelity.complex * 100)}%`,
      label: 'complex reflections',
      state: fidelity.complex >= 0.5 ? 'good' : 'watch',
      title: 'Complex reflections add meaning the person did not state. Competence is conventionally 50% or more.',
    },
    {
      value: `${Math.round((allianceDetail?.overall ?? 0) * 100)}%`,
      label: 'working alliance',
      state: (allianceDetail?.overall ?? 0) >= 0.55 ? 'good' : 'watch',
      title: 'Estimated from how you are responding: bond, agreement on goals, agreement on tasks.',
    },
    { value: String(fidelity.turns), label: 'turns', state: '', title: 'How many times you have spoken.' },
  ];

  root.replaceChildren();
  for (const m of metrics) {
    const div = document.createElement('div');
    div.className = `metric${m.state ? ` metric--${m.state}` : ''}`;
    div.title = m.title;
    div.innerHTML = `<div class="metric__value"></div><div class="metric__label"></div>`;
    div.querySelector('.metric__value').textContent = m.value;
    div.querySelector('.metric__label').textContent = m.label;
    root.append(div);
  }
}

/**
 * Build a questionnaire form.
 *
 * @param {object} instrument
 * @param {(result:{scored:object, responses:number[]})=>void} onComplete
 * @returns {HTMLFormElement}
 */
export function buildMeasureForm(instrument, onComplete) {
  const form = document.createElement('form');
  form.className = 'measure-form';

  const intro = document.createElement('p');
  intro.className = 'hint';
  intro.textContent = instrument.window;
  form.append(intro);

  instrument.items.forEach((text, i) => {
    const item = document.createElement('fieldset');
    item.className = 'measure-item';
    item.style.border = '0';
    item.style.padding = '0';
    item.style.margin = '0';

    const legend = document.createElement('legend');
    legend.className = 'measure-item__text';
    legend.textContent = `${i + 1}. ${text}`;
    item.append(legend);

    const options = document.createElement('div');
    options.className = 'measure-item__options';
    for (const opt of instrument.options) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `item-${i}`;
      input.value = String(opt.value);
      const span = document.createElement('span');
      span.textContent = opt.label;
      label.append(input, span);
      options.append(label);
    }
    item.append(options);
    form.append(item);
  });

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'btn btn--primary';
  submit.textContent = 'Done';
  form.append(submit);

  const status = document.createElement('p');
  status.className = 'hint';
  status.setAttribute('role', 'status');
  form.append(status);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const responses = instrument.items.map((_, i) => {
      const checked = form.querySelector(`input[name="item-${i}"]:checked`);
      return checked ? Number(checked.value) : NaN;
    });
    const scored = score(instrument, responses);
    if (!scored.complete) {
      status.textContent = 'A few are still unanswered — no pressure, but the score needs all of them.';
      return;
    }
    onComplete({ scored, responses });
  });

  return form;
}

/**
 * Render past measure scores as a small sparkline-style list.
 * @param {HTMLElement} root
 * @param {Record<string, Array<{scaled:number, at:string}>>} measures
 */
export function renderMeasureHistory(root, measures) {
  root.replaceChildren();
  const ids = Object.keys(measures ?? {});
  if (!ids.length) {
    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = 'Nothing recorded yet.';
    root.append(p);
    return;
  }

  for (const id of ids) {
    const instrument = INSTRUMENTS[id];
    const history = measures[id];
    if (!instrument || !history?.length) continue;

    const latest = history[history.length - 1];
    const max = instrument.scale ? instrument.max * instrument.scale : instrument.max;

    const row = document.createElement('div');
    row.className = 'measure-row';

    const name = document.createElement('span');
    name.textContent = instrument.name;

    const bar = document.createElement('div');
    bar.className = 'measure-row__bar';
    const fill = document.createElement('div');
    fill.className = 'measure-row__fill';
    fill.style.width = `${Math.round((latest.scaled / max) * 100)}%`;
    bar.append(fill);

    const value = document.createElement('strong');
    value.textContent = `${latest.scaled}/${max}`;

    row.append(name, bar, value);
    root.append(row);

    if (history.length >= 2) {
      const change = changeSince(instrument, history[history.length - 2].scaled, latest.scaled);
      const note = document.createElement('p');
      note.className = 'hint';
      note.textContent = change.description;
      root.append(note);
    }
  }
}

export { describe };
