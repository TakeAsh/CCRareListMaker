import { getCookie, setCookie } from 'https://www.takeash.net/js/modules/Cookie.mjs';

const d = document;
const cookieName = '_CCCP_ProcessDBoss';
const directions = ['New', 'Old'];

export default class Status {
  #myUserId = 0;
  #isProcessing = false;
  #apLimit = 20;
  #ap = 0;
  #lastAccess = 0;
  #direction = directions[0];

  constructor() {
    this.load();
  }

  get myUserId() { return this.#myUserId; }
  set myUserId(value) {
    this.#myUserId = value * 1;
    this.save();
  }

  get isProcessing() { return this.#isProcessing; }
  set isProcessing(value) {
    this.#isProcessing = !!value;
    this.save();
  }

  get apLimit() { return this.#apLimit; }
  set apLimit(value) {
    value *= 1;
    if (value < 20 || 300 < value) { return; }
    this.#apLimit = value;
    this.save();
  }

  get ap() {
    return Math.min(
      this.#ap + Math.floor((Date.now() - this.#lastAccess) / (1000 * 60)),
      this.#apLimit);
  }
  set ap(value) {
    value *= 1;
    if (value < 0 || this.#apLimit < value) { return; }
    this.#ap = value;
    this.#lastAccess = Date.now();
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
    this.#myUserId = cookie.myUserId * 1 || 0;
    this.#isProcessing = !!cookie.isProcessing;
    this.#apLimit = cookie.apLimit * 1 || 20;
    this.#ap = cookie.ap * 1 || 0;
    this.#lastAccess = cookie.lastAccess * 1 || 0;
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
        apLimit: this.#apLimit,
        ap: this.#ap,
        lastAccess: this.#lastAccess,
        direction: this.#direction,
      },
      30
    );
  }
}
