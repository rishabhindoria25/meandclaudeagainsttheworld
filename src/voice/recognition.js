/**
 * Speech recognition.
 *
 * The Web Speech API is the only speech recognition available without sending
 * audio to a service the user did not choose, so it is what this uses — with
 * clear eyes about its limits. In Chrome and Edge, recognition is performed
 * remotely on the browser vendor's servers; that is a material privacy fact, so
 * the app states it plainly and typing is a first-class alternative rather than
 * a fallback for the unlucky.
 *
 * Practical quirks handled here:
 *  - Chrome ends an utterance after roughly 15 seconds regardless of `continuous`,
 *    so a session is stitched back together across restarts.
 *  - `onend` fires for many reasons, including ones that are not the user
 *    stopping; restarting blindly produces a loop, so restarts are debounced and
 *    bounded.
 *  - Firefox does not implement it at all by default. Detection is by feature,
 *    never by user-agent string.
 */

const Recognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

export function isSupported() {
  return Boolean(Recognition);
}

/**
 * @typedef {object} RecognitionEvents
 * @property {(text:string)=>void} [onInterim]
 * @property {(text:string, confidence:number)=>void} [onFinal]
 * @property {()=>void} [onStart]
 * @property {()=>void} [onEnd]
 * @property {(err:{code:string, message:string, fatal:boolean})=>void} [onError]
 * @property {(level:number)=>void} [onLevel]
 */

export class Listener {
  /**
   * @param {RecognitionEvents & {lang?:string, continuous?:boolean, silenceMs?:number}} opts
   */
  constructor(opts = {}) {
    this.opts = opts;
    this.lang = opts.lang ?? (typeof navigator !== 'undefined' ? navigator.language : 'en-GB');
    this.continuous = opts.continuous ?? true;
    this.silenceMs = opts.silenceMs ?? 1500;

    this.recognition = null;
    this.listening = false;
    this.wantListening = false;
    this.buffer = '';
    this.interim = '';
    this.restartCount = 0;
    this.lastResultAt = 0;
    this.silenceTimer = null;
  }

  /** @returns {boolean} whether recognition actually started */
  start() {
    if (!Recognition) {
      this.opts.onError?.({ code: 'unsupported', message: 'This browser does not support speech recognition. You can type instead — it works exactly the same.', fatal: true });
      return false;
    }
    this.wantListening = true;
    this.restartCount = 0;
    this._spin();
    return true;
  }

  stop() {
    this.wantListening = false;
    this._clearSilence();
    if (this.recognition) {
      try { this.recognition.stop(); } catch { /* already stopped */ }
    }
    this._flush();
  }

  abort() {
    this.wantListening = false;
    this.buffer = '';
    this.interim = '';
    this._clearSilence();
    if (this.recognition) {
      try { this.recognition.abort(); } catch { /* already aborted */ }
    }
  }

  _spin() {
    if (!this.wantListening || this.listening) return;

    const r = new Recognition();
    r.lang = this.lang;
    r.continuous = this.continuous;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => {
      this.listening = true;
      this.restartCount = 0;
      this.opts.onStart?.();
    };

    r.onresult = (event) => {
      this.lastResultAt = Date.now();
      let interim = '';
      let confidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          this.buffer = `${this.buffer} ${text}`.trim();
          confidence = result[0].confidence ?? 0;
        } else {
          interim += text;
        }
      }

      this.interim = interim.trim();
      if (this.interim) this.opts.onInterim?.(`${this.buffer} ${this.interim}`.trim());

      // An end-of-turn is a pause, not a final result: people pause mid-thought
      // and the recogniser marks it final. Waiting out the silence lets them
      // finish the sentence they were in the middle of.
      this._resetSilence(confidence);
    };

    r.onerror = (event) => {
      const code = event.error;
      const fatal = code === 'not-allowed' || code === 'service-not-allowed';
      if (code === 'no-speech' || code === 'aborted') return; // routine, not worth surfacing
      this.opts.onError?.({ code, message: describeError(code), fatal });
      if (fatal) this.wantListening = false;
    };

    r.onend = () => {
      this.listening = false;
      if (!this.wantListening) { this._flush(); return; }
      // Chrome cuts utterances at ~15s. Restart, with a bound so a persistent
      // failure cannot spin forever.
      this.restartCount += 1;
      if (this.restartCount > 12) {
        this.wantListening = false;
        this.opts.onError?.({ code: 'restart-loop', message: 'Speech recognition kept dropping out. Switching to typing.', fatal: true });
        this.opts.onEnd?.();
        return;
      }
      setTimeout(() => this._spin(), 120 * Math.min(4, this.restartCount));
    };

    this.recognition = r;
    try {
      r.start();
    } catch {
      // start() throws if called while already started; the onend handler will retry.
      this.listening = false;
    }
  }

  _resetSilence(confidence = 0) {
    this._clearSilence();
    this.silenceTimer = setTimeout(() => this._flush(confidence), this.silenceMs);
  }

  _clearSilence() {
    if (this.silenceTimer) { clearTimeout(this.silenceTimer); this.silenceTimer = null; }
  }

  _flush(confidence = 0) {
    this._clearSilence();
    const text = `${this.buffer} ${this.interim}`.trim();
    this.buffer = '';
    this.interim = '';
    if (text) this.opts.onFinal?.(text, confidence);
    this.opts.onEnd?.();
  }
}

function describeError(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was refused. You can turn it on in your browser settings, or just type — Tom works exactly the same either way.';
    case 'audio-capture':
      return 'No microphone was found. Typing works just as well.';
    case 'network':
      return 'Speech recognition needs a network connection in this browser. Typing works offline.';
    case 'language-not-supported':
      return 'This language is not supported for speech recognition here. Typing works.';
    default:
      return 'Speech recognition had a problem. You can carry on by typing.';
  }
}
