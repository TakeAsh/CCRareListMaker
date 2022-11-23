'use strict';
import WorkerManager from 'https://www.takeash.net/js/modules/WorkerManager.mjs';
import { getNodesByXpath } from 'https://www.takeash.net/js/modules/Util.mjs';
(async () => {
  const d = document;
  const maxThreads = 24;
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
