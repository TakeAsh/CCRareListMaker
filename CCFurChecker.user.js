// ==UserScript==
// @name           ConCon fur checker
// @namespace      https://www.TakeAsh.net/
// @ujs:published  2022-10-29 16:30
// @version        0.1.202210291630
// @description    check you have furs or not.
// @author         TakeAsh68k
// @match          https://c4.concon-collector.com/help/alllist
// @grant          none
// ==/UserScript==

javascript:
(async function() {
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
    toRow(index) {
      return `<tr><td>${index}</td>`
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

  if (location.origin != 'https://c4.concon-collector.com') {
    alert('コンコンコレクターのサイトで実行して下さい');
    return;
  }
  const response = await fetch(`${location.origin}/help/alllist`);
  const text = await response.text();
  const rares = JSON.parse(text).reduce(
    (acc, cur) => acc.add(new RareCC(cur)),
    new RareCCs()
  );
  const ids = Object.keys(rares)
    .filter(id => rares[id].furs >= 4)
    .sort((a, b) => (rares[b].furs - rares[a].furs) || (a.id - b.id))
    .slice(0, 300);

  const doc = window.open('', 'FurChecker').document;
  doc.open('text/html');
  [
    '<html lang="ja">',
    '<head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<link rel="stylesheet" type="text/css" href="/css/pc/cm.css">',
    '<title>Fur Checker</title></head>',
    '<body><table border="1">',
    '<tr><th>#</th><th>換毛数</th><th>名前</th><th>初入手日時</th></tr>',
  ].forEach((line) => { doc.write(line); });
  ids.forEach((id, index) => doc.write(rares[id].toRow(index + 1)));
  [
    '</table>',
    '</body></html>',
  ].forEach((line) => { doc.write(line); });
  doc.close();
  const script = doc.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://www.takeash.net/ConConCollector/RareCC/checkRareCC.js';
  doc.head.appendChild(script);
})();
