/**
 * Transcript rendering.
 *
 * Captions are not an accessibility afterthought here, they are the primary
 * channel. Someone may be in a shared house, on a bus, hard of hearing, or in
 * the fairly common state of not being able to face the sound of a voice — and
 * every one of those people should get the identical experience. The voice is
 * the enhancement; the text is the product.
 */

const ROLE_LABELS = { user: 'You', tom: 'Tom', system: 'Note' };

/**
 * @param {HTMLElement} root
 */
export function createTranscript(root) {
  /** @type {Array<{role:string, text:string, at:string, meta?:object}>} */
  const entries = [];

  function add(role, text, options = {}) {
    const entry = { role, text, at: new Date().toISOString(), meta: options.meta };
    entries.push(entry);

    const wrap = document.createElement('article');
    wrap.className = `turn turn--${role}`;
    if (options.kind === 'safety' || options.kind === 'safety_plan') wrap.classList.add('turn--safety');

    const who = document.createElement('div');
    who.className = 'turn__who';
    who.textContent = ROLE_LABELS[role] ?? role;
    wrap.append(who);

    const body = document.createElement('div');
    body.className = 'turn__text';
    body.textContent = text;
    wrap.append(body);

    if (options.resources) wrap.append(renderResources(options.resources));

    if (options.why) {
      const why = document.createElement('p');
      why.className = 'turn__why';
      why.textContent = options.why;
      wrap.append(why);
    }

    root.append(wrap);
    // Only follow the conversation if the reader has not scrolled up to re-read.
    const nearBottom = root.scrollHeight - root.scrollTop - root.clientHeight < 140;
    if (nearBottom) root.scrollTop = root.scrollHeight;
    return entry;
  }

  function renderResources(text) {
    const list = document.createElement('ul');
    list.className = 'turn__resources';
    for (const line of String(text).split('\n').filter(Boolean)) {
      const li = document.createElement('li');
      const [name, ...rest] = line.split(':');
      const detail = rest.join(':').trim();
      if (detail) {
        const strong = document.createElement('strong');
        strong.textContent = name.trim();
        li.append(strong, document.createTextNode(detail));
      } else {
        li.textContent = line;
      }
      list.append(li);
    }
    return list;
  }

  return {
    add,
    entries,
    clear() { root.replaceChildren(); entries.length = 0; },
    /** Plain-text export, for the person to keep or take to a clinician. */
    toText() {
      return entries
        .map((e) => `${ROLE_LABELS[e.role] ?? e.role}: ${e.text}`)
        .join('\n\n');
    },
  };
}
