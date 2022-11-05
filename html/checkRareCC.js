'use strict';
(function() {
  const maxThreads = 24;
  const srcWorker = `
  const uriRareBase = 'https://c4.concon-collector.com/view/default/';
  const regGotDate = /<span\\sclass="keyword">初入手日時<\\/span>\\s*([^<]+)s*</;
  const regTitle = /<title>([^<]+)<\\/title>/;
  self.addEventListener(
    'message',
    async (event) => {
      const param = event.data;
      let result = '';
      let index = 0;
      for (const ccId of param.ccIds) {
        const response = await fetch(uriRareBase + ccId);
        if (response.ok) {
          const text = await response.text();
          let m;
          result =
            (m = text.match(regGotDate)) ? m[1]
              : (m = text.match(regTitle)) && m[1] == 'コンコンコレクター 図鑑' ? '-'
                : text;
        } else {
          result = response.statusText;
        }
        postMessage({ index: index++, ccId: ccId, result: result });
      }
    }
  );`;
  const urlWorker = URL.createObjectURL(new Blob([srcWorker], { type: 'application/javascript' }));
  const range = (start, stop, step) => Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));
  getNodesByXpath('//span[starts-with(@id,"get_")]')
    .reduce(
      (acc, cur, index) => {
        acc[index % maxThreads].push(cur);
        return acc;
      },
      range(0, maxThreads - 1, 1).map((_) => [])
    ).forEach((nodes) => {
      const worker = new Worker(urlWorker);
      worker.addEventListener(
        'message',
        (event) => {
          const data = event.data;
          nodes[data.index].textContent = data.result;
        }
      );
      worker.postMessage({ ccIds: nodes.map(node => node.id.replace(/^get_/, '')) });
    });
  URL.revokeObjectURL(urlWorker);

  function getNodesByXpath(xpath, context) {
    const itr = document.evaluate(
      xpath,
      context || document,
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
})();
