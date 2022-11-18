'use strict';
(async () => {
  const d = document;
  const maxThreads = 24;
  class WorkerManager {
    #url = null;
    #reportProgress = (progress) => { };
    #workers = [];
    #range = (max) => Array.from({ length: max }, (_, i) => (i));
    /**
     * function as worker source
     * @param {() => void} fnc
     * @memberof WorkerManager
     */
    set source(fnc) {
      if (typeof fnc != 'function') { return; }
      this.#url = URL.createObjectURL(
        new Blob([`(${fnc})();`], { type: 'application/javascript' }));
    }
    /**
     * function called by the worker while running.
     * @memberof WorkerManager
     */
    get reportProgress() {
      return this.#reportProgress;
    }
    set reportProgress(fnc) {
      if (typeof fnc != 'function') { return; }
      this.#reportProgress = fnc;
    }
    /**
     * release resources
     * @memberof WorkerManager
     */
    dispose() {
      URL.revokeObjectURL(this.#url);
      this.#url = null;
      this.#reportProgress = null;
      this.#workers = null;
    }
    /**
     * create a Promise including Worker and start it
     * @param {*} id Worker id
     * @param {*} initialData Initial data for worker
     * @return {Promise} Promise including Worker
     * @memberof WorkerManager
     */
    create(id, initialData) {
      return new Promise((resolve, reject) => {
        const worker = new Worker(this.#url);
        worker.reportProgress = this.#reportProgress;
        worker.addEventListener(
          'message',
          (event) => {
            const data = event.data;
            switch (data.type) {
              case 'Progress':
                event.target.reportProgress(data.progress);
                break;
              case 'Completed':
                console.log(data.message);
                resolve(data.result);
                break;
              case 'Error':
                console.log(data.message);
                reject(data.message);
                break;
            }
          }
        );
        worker.addEventListener('error', reject);
        worker.postMessage({ id: id, data: initialData });
        this.#workers.push(worker);
      });
    }
    /**
     * create workers from data and run them
     * @param {Array} data array of initial data
     * @param {number} threads
     * @return {Promise} worker results
     * @memberof WorkerManager
     */
    async run(data, threads) {
      const from = (i) => Math.ceil(data.length * i / threads);
      const divided = this.#range(threads).map((i) => data.slice(from(i), from(i + 1)));
      console.log(divided);
      return await Promise.all(divided.map((part, i) => this.create(i, part)));
    }
    /**
     * notify all workers that they should be cancelled
     * @memberof WorkerManager
     */
    cancelAll() {
      this.#workers.forEach((worker) => { worker.postMessage('cancel'); })
    }
  }
  const wm = new WorkerManager();
  wm.source = () => {
    const uriRareBase = 'https://c4.concon-collector.com/view/default/';
    const regGotDate = /<span\sclass="keyword">初入手日時<\/span>\s*([^<]+)s*</;
    const regTitle = /<title>([^<]+)<\/title>/;
    let isCancelled = false;
    self.addEventListener(
      'message',
      async (event) => {
        if (event.data == 'cancel') {
          isCancelled = true;
          return;
        }
        const id = event.data.id;
        const ccIds = event.data.data;
        let result = '';
        let index = 0;
        for (const ccId of ccIds) {
          if (isCancelled) {
            postMessage({ type: 'Error', message: `worker[${id}]: cancelled`, });
            return;
          }
          const response = await fetch(uriRareBase + ccId);
          if (response.ok) {
            const text = await response.text();
            let m;
            if (!(m = text.match(regTitle)) || m[1] != 'コンコンコレクター 図鑑') {
              postMessage({ type: 'Error', message: `worker[${id}]: ${text}`, });
              return;
            }
            result = (m = text.match(regGotDate))
              ? m[1]
              : '-';
          } else {
            result = response.statusText;
          }
          postMessage({
            type: 'Progress',
            progress: {
              index: index++,
              ccId: ccId,
              result: result,
            },
          });
        }
        postMessage({
          type: 'Completed',
          message: `worker[${id}]: completed`,
          result: null,
        });
      }
    );
  };
  const toCCId = (node) => node.id.replace(/^get_/, '');
  const baseNodes = getNodesByXpath('//span[starts-with(@id,"get_")]');
  const nodes = baseNodes.reduce(
    (acc, cur) => {
      acc[toCCId(cur)] = cur;
      return acc;
    },
    {}
  );
  let count = 0;
  let isAborted = false;
  wm.reportProgress = (progress) => {
    if (isAborted) { return; }
    nodes[progress.ccId].textContent = progress.result;
    showResult(`${++count}/${baseNodes.length}`);
  };
  await wm.run(baseNodes.map(node => toCCId(node)), maxThreads)
    .then(() => { showResult('Completed', 'keyword'); })
    .catch((err) => {
      isAborted = true;
      wm.cancelAll();
      showResult(err, 'error_message');
    });
  wm.dispose();

  function getNodesByXpath(xpath, context) {
    const itr = d.evaluate(
      xpath,
      context || d,
      null,
      XPathResult.ORDERED_NODE_ITERATOR_TYPE,
      null
    );
    const nodes = [];
    let node = null;
    while (node = itr.iterateNext()) {
      nodes.push(node);
    }
    return nodes;
  }

  function showResult(message, classname) {
    const result = d.getElementById('Result') || d.createElement('span');
    if (!result.id) {
      result.id = 'Result';
      d.body.insertBefore(result, d.body.firstChild);
    }
    if (classname) {
      result.classList.add(classname);
    }
    result.textContent = message;
  }
})();
