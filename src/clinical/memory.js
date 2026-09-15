/**
 * Local-only session memory.
 *
 * Everything written here stays in the browser's own storage on the user's
 * device. There is no account, no sync, and no network call anywhere in this
 * module — which is what makes it honest to tell someone that what they say
 * goes nowhere.
 *
 * Two kinds of memory, because they serve different clinical purposes:
 *
 *   - **Episodic**: what happened in a given session. Used for the bridge at the
 *     start of the next one ("last time we were talking about…"), which is a
 *     standard cognitive-therapy structure and one of the cheapest ways to make
 *     a conversation feel continuous rather than restarted.
 *   - **Semantic**: things that stay true across sessions — the person's stated
 *     values, what they call themselves, what has actually helped, what has
 *     not, and the plans they have made.
 *
 * Deletion is complete and immediate, and is offered prominently rather than
 * buried. A tool people cannot leave is a tool people should not enter.
 */

const KEY = 'tom.memory.v1';
const MAX_SESSIONS = 24;

/** @returns {Storage|null} */
function storage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const probe = '__tom_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    // Private browsing, blocked site data, or a sandboxed frame. The app must work
    // without persistence — it just forgets between sessions, which is a valid mode.
    return null;
  }
}

/** @returns {{sessions: object[], semantic: object, settings: object, version: number}} */
export function load() {
  const empty = { version: 1, sessions: [], semantic: emptySemantic(), settings: {} };
  const s = storage();
  if (!s) return empty;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      version: 1,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      semantic: { ...emptySemantic(), ...(parsed.semantic ?? {}) },
      settings: parsed.settings ?? {},
    };
  } catch {
    return empty;
  }
}

function emptySemantic() {
  return {
    name: null,
    values: [],          // what the person has said matters to them
    strengths: [],       // affirmable things they have actually done
    helped: [],          // protocol ids that produced a rating improvement
    didNotHelp: [],      // protocol ids declined or rated as unchanged
    supports: [],        // people they have named as support
    safetyPlan: null,
    measures: {},        // { phq9: [{scaled, at}], ... }
    riskFlags: [],       // e.g. historical disclosure, kept as a standing risk factor
  };
}

/** @param {object} state */
export function save(state) {
  const s = storage();
  if (!s) return false;
  try {
    const trimmed = { ...state, sessions: state.sessions.slice(-MAX_SESSIONS) };
    s.setItem(KEY, JSON.stringify(trimmed));
    return true;
  } catch {
    return false;
  }
}

/** Remove everything. Irreversible, and meant to be. */
export function erase() {
  const s = storage();
  if (!s) return false;
  try { s.removeItem(KEY); return true; } catch { return false; }
}

/**
 * Record a completed session.
 * @param {object} state
 * @param {{notes:object, transcript:Array<{role:string,text:string,at:string}>, startedAt:string}} session
 */
export function recordSession(state, session) {
  const summary = {
    at: session.startedAt,
    endedAt: new Date().toISOString(),
    focus: session.notes.focus,
    topics: session.notes.topics?.slice(0, 3).map(([t]) => t) ?? [],
    protocols: session.notes.protocolsUsed ?? [],
    homework: session.notes.homework ?? [],
    turns: session.notes.fidelity?.turns ?? 0,
    maxRiskTier: Math.max(0, ...(session.notes.riskHistory ?? []).map((r) => r.tier)),
    ruptures: (session.notes.ruptures ?? []).length,
    // The transcript itself is kept separately and can be dropped independently.
    transcriptLength: session.transcript?.length ?? 0,
  };
  state.sessions.push(summary);
  return state;
}

/**
 * The bridge from the previous session: one sentence Tom can open with.
 * @param {object} state
 * @returns {{lastFocus:string|null, homework:string|null, daysSince:number|null, line:string|null}}
 */
export function bridge(state) {
  const last = state.sessions[state.sessions.length - 1];
  if (!last) return { lastFocus: null, homework: null, daysSince: null, line: null };

  const daysSince = Math.floor((Date.now() - new Date(last.endedAt ?? last.at).getTime()) / 86400000);
  const homework = last.homework?.[last.homework.length - 1] ?? null;

  const parts = [];
  if (last.focus) parts.push(`Last time we were mostly on ${last.focus.replace(/_/g, ' ')}`);
  if (homework) parts.push(`and you were going to ${homework}`);
  const line = parts.length ? `${parts.join(' ')}.` : null;

  return { lastFocus: last.focus ?? null, homework, daysSince, line };
}

/**
 * Note that a protocol helped or did not, based on the before/after ratings it
 * collected. Over several sessions this becomes a genuine preference profile,
 * so the same person is not offered the same unhelpful exercise repeatedly.
 */
export function recordProtocolOutcome(state, protocolId, { before, after }) {
  const sem = state.semantic;
  const b = Number(before);
  const a = Number(after);
  if (Number.isFinite(b) && Number.isFinite(a)) {
    const helped = b - a >= 2;
    const list = helped ? sem.helped : sem.didNotHelp;
    const other = helped ? sem.didNotHelp : sem.helped;
    if (!list.includes(protocolId)) list.push(protocolId);
    const idx = other.indexOf(protocolId);
    if (idx >= 0) other.splice(idx, 1);
  }
  return state;
}

/** @param {object} state @param {string} instrumentId @param {number} scaled */
export function recordMeasure(state, instrumentId, scaled) {
  const list = (state.semantic.measures[instrumentId] ??= []);
  list.push({ scaled, at: new Date().toISOString() });
  if (list.length > 40) list.shift();
  return state;
}

/** Everything, as a plain object the user can download. */
export function exportAll(state, transcript = []) {
  return {
    exportedAt: new Date().toISOString(),
    note: 'Exported from Tom, a local-only self-help tool. This is not a clinical record.',
    sessions: state.sessions,
    semantic: state.semantic,
    transcript,
  };
}
