// ==UserScript==
// @name         ConCon Duplicated Checker
// @namespace    https://www.TakeAsh.net/
// @version      0.1.202211061600
// @description  scan concon list and order by duplication
// @author       TakeAsh68k
// @match        https://c4.concon-collector.com/help/alllist
// @icon         https://www.google.com/s2/favicons?sz=64&domain=concon-collector.com
// @grant        none
// ==/UserScript==

javascript:
(async function() {
  'use strict';
  if (location.origin != 'https://c4.concon-collector.com') {
    alert('コンコンコレクターのサイトで実行して下さい');
    return;
  }
  const d = document;
  const maxThreads = 24;
  const idDivResult = 'DupedCheckerResult';
  const start = Date.now();
  const divResult = d.getElementById(idDivResult) || d.createElement('div');
  if (!divResult.id) {
    d.body.appendChild(divResult);
    divResult.id = idDivResult;
    divResult.style.position = 'fixed';
    divResult.style.bottom = '0em';
    divResult.style.right = '0em';
  }
  const range = (start, stop, step) =>
    Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));
  const srcWorker = () => {
    const regTitle = /<title>([^<]+)<\/title>/;
    const regAnchor = /<a\shref="[^"]+\/cccontainer\/pickid\/[^"]+">([^<]+)<\/a>/;
    const regDupes = /\（(\d+)(\+(\d+))?[^\)]+\）/;
    self.addEventListener(
      'message',
      async (event) => {
        const id = event.data.id;
        const concons = event.data.data;
        let index = 0;
        for (const concon of concons) {
          const res = await fetch(`${location.origin}/view/default/${concon.id}`);
          const text = await res.text();
          let m;
          if (!(m = text.match(regTitle)) || m[1] != 'コンコンコレクター 図鑑') {
            postMessage({ type: 'Error', message: `worker[${id}]: ${text}}` });
            return;
          }
          const anchor = regAnchor.exec(text);
          if (anchor) {
            const m = regDupes.exec(anchor[1]);
            const same = m[1] * 1;
            const others = (m[3] || 0) * 1;
            concon.dupes = same + others;
            concon.dupesDetail = `${same}+${others}`;
          }
          postMessage({
            type: 'Progress',
            progress: {
              id: id,
              message: `${++index}/${concons.length}`,
            },
          });
        }
        postMessage({ type: 'Complete', result: concons });
      }
    );
  };
  const urlWorker = URL.createObjectURL(new Blob([`(${srcWorker})();`], { type: 'application/javascript' }));
  const createWorker = (id, initialData, reportProgress) => {
    if (typeof reportProgress != 'function') { reportProgress = () => { }; }
    return new Promise((resolve, reject) => {
      const worker = new Worker(urlWorker);
      worker.addEventListener(
        'message',
        (event) => {
          const data = event.data;
          switch (data.type) {
            case 'Progress':
              reportProgress(data.progress);
              break;
            case 'Complete':
              resolve(data.result);
              break;
            case 'Error':
              reject(data.message);
              break;
          }
        }
      );
      worker.addEventListener('error', reject);
      worker.postMessage({ id: id, data: initialData });
    });
  };
  const res = await fetch('/help/alllist');
  const list = await res.json();
  const baseConCons = list.filter(concon => concon.id == concon.same_id);
  console.log(baseConCons);
  let aborted = false;
  let current = 0;
  const updateStatus = (progress) => {
    if (aborted) { return; }
    if (progress) {
      /* console.log(progress); */
      ++current;
    }
    if (current % 50 != 0) { return; }
    divResult.textContent = `${current}/${baseConCons.length}`;
  };
  updateStatus();
  const from = (i) => Math.ceil(baseConCons.length * i / maxThreads);
  const dividedConCons = range(0, maxThreads - 1, 1)
    .map((i) => baseConCons.slice(from(i), from(i + 1)));
  console.log(dividedConCons);
  const scannedConCons = await Promise.all(
    dividedConCons.map((concons, index) => createWorker(index, concons, updateStatus))
  ).catch((err) => {
    aborted = true;
    divResult.textContent = err;
  });
  URL.revokeObjectURL(urlWorker);
  console.log(`scannedConCons: ${current}`);
  if (!scannedConCons) { return; }
  console.log(scannedConCons);
  divResult.textContent = '';
  const dupedConCons = scannedConCons
    .reduce((acc, cur) => acc.concat(cur.filter(cc => (cc.dupes || 0) > 0)), [])
    .sort((a, b) => b.dupes - a.dupes || a.id - b.id)
    .slice(0, 20);
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
      aName.href = `/view/default/${concon.id}`;
      aName.target = '_blank';
      aName.textContent = [concon.title, concon.name].join(' ');
    });
    return table;
  };
  divResult.appendChild(toTable(dupedConCons));
  console.log(`${(Date.now() - start) / 1000} sec`);
})();
