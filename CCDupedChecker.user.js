// ==UserScript==
// @name         ConCon Duplicated Checker
// @namespace    https://www.TakeAsh.net/
// @version      0.1.202205290900
// @description  scan concon list and order by duplication
// @author       TakeAsh68k
// @match        https://c4.concon-collector.com/help/alllist
// @icon         https://www.google.com/s2/favicons?sz=64&domain=concon-collector.com
// @grant        none
// ==/UserScript==

javascript:
(function() {
  'use strict';
  const d = document;
  const divResult = d.createElement('div');
  d.body.appendChild(divResult);
  divResult.style.position = 'fixed';
  divResult.style.bottom = '0em';
  divResult.style.right = '0em';
  const getDupes = async (concon) => {
    const res = await fetch(`/view/default/${concon.id}`);
    const text = await res.text();
    const doc = await new DOMParser().parseFromString(text, 'text/html');
    const anchor = doc.querySelector(`a[href="https://c4.concon-collector.com/cccontainer/pickid/${concon.id}"]`);
    if (anchor) {
      const m = /\（(\d+)(\+(\d+))?[^\)]+\）/.exec(anchor.textContent);
      const same = m[1] * 1;
      const others = (m[3] || 0) * 1;
      concon.dupes = same + others;
      concon.dupesDetail = `${same}+${others}`;
    }
    return concon;
  };
  const toTable = (concons) => {
    const table = d.createElement('table');
    table.style.backgroundColor = 'rgba(64, 64, 64, 0.6)';
    const thead = d.createElement('thead');
    const tbody = d.createElement('tbody');
    [thead, tbody].forEach(section => table.appendChild(section));
    ['Dupes', 'Rarity', 'Name'].forEach(label => {
      const th = d.createElement('th');
      thead.appendChild(th);
      th.textContent = label;
    });
    concons.forEach(concon => {
      const tr = d.createElement('tr');
      tbody.appendChild(tr);
      const tdDupes = d.createElement('td');
      const tdRarity = d.createElement('td');
      const tdName = d.createElement('td');
      [tdDupes, tdRarity, tdName].forEach(td => tr.appendChild(td));
      tdDupes.textContent = `${concon.dupes} (${concon.dupesDetail})`;
      tdDupes.style.textAlign = 'center';
      tdRarity.textContent = concon.rarity;
      tdRarity.style.textAlign = 'center';
      const aName = d.createElement('a');
      tdName.appendChild(aName);
      aName.href = `https://c4.concon-collector.com/view/default/${concon.id}`;
      aName.target = '_blank';
      aName.textContent = [concon.title, concon.name].join(' ');
    });
    return table;
  };
  (async () => {
    const res = await fetch('/help/alllist');
    const list = await res.json();
    const concons = list.filter(concon => concon.id == concon.same_id);
    for (let i = 0; i < concons.length; ++i) {
      if (i % 20 == 0) {
        divResult.textContent = `${i + 1}/${concons.length}`;
      }
      concons[i] = await getDupes(concons[i]);
    }
    divResult.textContent = '';
    divResult.appendChild(toTable(concons.sort((a, b) => b.dupes - a.dupes || a.id - b.id).slice(0, 20)));
  })();
})();
