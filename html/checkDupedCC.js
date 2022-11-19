'use strict';
import WorkerManager from 'https://www.takeash.net/ConConCollector/RareCC/modules/WorkerManager.mjs';
(async () => {
  if (location.origin != 'https://c4.concon-collector.com') {
    alert('コンコンコレクターのサイトで実行して下さい');
    return;
  }
  const d = document;
  const maxThreads = 24;
  const start = Date.now();
  class StatusManager {
    static #div;
    static #aborted = false;
    static #current = 0;
    static #max = 0;
    static set id(id) {
      this.#div = d.getElementById(id) || d.createElement('div');
      if (!this.#div.id) {
        d.body.appendChild(this.#div);
        this.#div.id = id;
        this.#div.style.position = 'fixed';
        this.#div.style.bottom = '0em';
        this.#div.style.right = '0em';
      }
    }
    static set max(max) {
      this.#max = max;
    }
    static get current() {
      return this.#current;
    }
    static reportProgress(progress) {
      const self = StatusManager;
      if (self.#aborted) { return; }
      if (progress) {
        /* console.log(progress); */
        ++self.#current;
      }
      if (self.#current % 50 != 0) { return; }
      self.#div.textContent = `${self.#current}/${self.#max}`;
    }
    static abort(message) {
      this.#aborted = true;
      this.#div.textContent = message;
    }
    static toTable(concons) {
      this.#div.textContent = '';
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
      this.#div.appendChild(table);
    }
  }
  const wm = new WorkerManager();
  wm.source = () => {
    const regTitle = /<title>([^<]+)<\/title>/;
    const regAnchor = /<a\shref="[^"]+\/cccontainer\/pickid\/[^"]+">([^<]+)<\/a>/;
    const regDupes = /\（(\d+)(\+(\d+))?[^\)]+\）/;
    let isCancelled = false;
    self.addEventListener(
      'message',
      async (event) => {
        if (event.data == 'cancel') {
          isCancelled = true;
          return;
        }
        const id = event.data.id;
        const concons = event.data.data;
        let index = 0;
        for (const concon of concons) {
          if (isCancelled) {
            postMessage({ type: 'Error', message: `worker[${id}]: cancelled`, });
            return;
          }
          const res = await fetch(`${location.origin}/view/default/${concon.id}`);
          const text = await res.text();
          let m;
          if (!(m = text.match(regTitle)) || m[1] != 'コンコンコレクター 図鑑') {
            postMessage({ type: 'Error', message: `worker[${id}]: ${text}`, });
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
        postMessage({
          type: 'Completed',
          message: `worker[${id}]: completed`,
          result: concons,
        });
      }
    );
  };
  wm.reportProgress = StatusManager.reportProgress;
  const res = await fetch('/help/alllist');
  const list = await res.json();
  const baseConCons = list.filter(concon => concon.id == concon.same_id);
  console.log(baseConCons);
  StatusManager.id = 'DupedCheckerResult';
  StatusManager.max = baseConCons.length;
  StatusManager.reportProgress();
  const scannedConCons = await wm.run(baseConCons, maxThreads)
    .catch((err) => {
      StatusManager.abort(err);
      wm.cancelAll();
    });
  wm.dispose();
  console.log(`scannedConCons: ${StatusManager.current}`);
  if (!scannedConCons) { return; }
  console.log(scannedConCons);
  const dupedConCons = scannedConCons
    .reduce((acc, cur) => acc.concat(cur.filter(cc => (cc.dupes || 0) > 0)), [])
    .sort((a, b) => b.dupes - a.dupes || a.id - b.id)
    .slice(0, 20);
  StatusManager.toTable(dupedConCons);
  console.log(`${(Date.now() - start) / 1000} sec`);
})();
