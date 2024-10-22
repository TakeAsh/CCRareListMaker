'use strict';

class RareCC {
  #ids = [];
  constructor(src) {
    Object.assign(this, src);
  }
  get furs() {
    return this.#ids.length;
  }
  add(id) {
    this.#ids.push(id);
  }
  toRow(index, skip) {
    return `<tr><td>${index + skip}</td>`
      + `<td>${this.furs}</td>`
      + `<td><a href="/view/default/${this.id}" target="_blank">${this.title + this.name}</a></td>`
      + `<td><span id="get_${this.id}"></span></td></tr>`;
  }
}

class RareCCs {
  add(rare) {
    if (!this[rare.same_id]) {
      this[rare.same_id] = rare;
    } else {
      this[rare.same_id].add(rare.id);
    }
    return this;
  }
}

export { RareCC, RareCCs };
