// ==UserScript==
// @name           ConCon fur checker
// @namespace      https://www.TakeAsh.net/
// @ujs:published  2020-12-12 20:30
// @version        0.1.202012122030
// @description    check you have furs or not.
// @author         TakeAsh68k
// @match          https://c4.concon-collector.com/help/alllist
// @grant          none
// ==/UserScript==

javascript:
(function() {
  'use strict';
  const uriRareCCBase = '/view/default/';
  let rares = JSON.parse(document.body.textContent || document.body.innerText)
    .reduce(
      (acc, cur) => {
        let rare = new RareCC(cur);
        if (!acc[rare.same_id]) {
          acc[rare.same_id] = rare;
        } else {
          acc[rare.same_id].ids.push(rare.id);
        }
        return acc;
      },
      {}
    );
  let ids = Object.keys(rares)
    .filter(id => rares[id].ids.length >= 4)
    .sort((a, b) => (rares[b].ids.length - rares[a].ids.length) || (a.id - b.id))
    .slice(0, 300);

  let docNew = window.open('', 'FurChecker').document;
  docNew.open('text/html');
  docNew.write('<html lang="ja">');
  docNew.write('<head><meta charset="utf-8">');
  docNew.write('<meta name="viewport" content="width=device-width, initial-scale=1">');
  docNew.write('<link rel="stylesheet" type="text/css" href="/css/pc/cm.css">');
  docNew.write('<title>Fur Checker</title></head>');
  docNew.write('<body><table border="1">');
  docNew.write('<tr><th>#</th><th>換毛数</th><th>名前</th><th>初入手日時</th></tr>');
  ids.forEach((id, index) => docNew.write(rares[id].toRow(index + 1)));
  docNew.write('</table>');
  docNew.write('</body></html>');
  docNew.close();
  let script = docNew.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://www.takeash.net/ConConCollector/RareCC/checkRareCC.js';
  docNew.head.appendChild(script);

  function RareCC(src) {
    for (var p in src) {
      this[p] = src[p];
    }
    this.ids = [];
    this.toRow = (index) => '<tr><td>' + index + '</td><td>' + this.ids.length +
      '</td><td><a href="' + uriRareCCBase + this.id + '" target="_blank">' +
      this.title + this.name + '</a></td><td><span id="get_' + this.id +
      '"></span></td></tr>';
  }
})();
