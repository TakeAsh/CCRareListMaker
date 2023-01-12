import { getCookie, setCookie } from 'https://www.takeash.net/js/modules/Cookie.mjs';

const d = document;
const cookieName = '_CCCP_ProcessDBoss';
const directions = ['New', 'Old'];

export default class Status {
  #myUserId = 0;
  #isProcessing = false;
  #ap = 0;
  #direction = 'New';

  constructor() {
    this.load();
  }

  get myUserId() { return this.#myUserId; }
  set myUserId(value) {
    this.#myUserId = value;
    this.save();
  }

  get isProcessing() { return this.#isProcessing; }
  set isProcessing(value) {
    this.#isProcessing = value;
    this.save();
  }

  get ap() { return this.#ap; }
  set ap(value) {
    this.#ap = value;
    this.save();
  }

  get direction() { return this.#direction; }
  set direction(value) {
    if (!directions.includes(value)) { return; }
    this.#direction = value;
    this.save();
  }

  load() {
    const cookie = getCookie(cookieName) || {};
    this.#myUserId = cookie.myUserId || 0;
    this.#isProcessing = !!cookie.isProcessing;
    this.#ap = cookie.ap || 0;
    this.#direction = !directions.includes(cookie.direction)
      ? directions[0]
      : cookie.direction;
  }

  save() {
    setCookie(
      cookieName,
      {
        myUserId: this.#myUserId,
        isProcessing: this.#isProcessing,
        ap: this.#ap,
        direction: this.#direction,
      },
      30
    );
  }
}
