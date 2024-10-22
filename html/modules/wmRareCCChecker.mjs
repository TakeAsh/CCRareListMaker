'use strict';
import { getNodesByXpath } from 'https://www.takeash.net/js/modules/Util.mjs';
import WorkerManager from 'https://www.takeash.net/js/modules/WorkerManager.mjs';

export default class wmRareCCChecker extends WorkerManager {
  #doc = null;
  #maxThreads = 16;
  #baseNodes = null;
  #nodes = null;
  #count = 0;
  #isAborted = false;
  constructor(doc, maxThreads) {
    super();
    this.#doc = doc;
    this.#maxThreads = maxThreads;
    this.source = () => {
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
    this.reportProgress = (progress) => {
      if (this.#isAborted) { return; }
      this.#nodes[progress.ccId].textContent = progress.result;
      this.#showResult(`${++this.#count}/${this.#baseNodes.length}`);
    };
  }
  async run() {
    this.#baseNodes = getNodesByXpath('//span[starts-with(@id,"get_")]', this.#doc);
    this.#nodes = this.#baseNodes.reduce(
      (acc, cur) => {
        acc[this.#toCCId(cur)] = cur;
        return acc;
      },
      {}
    );
    this.#count = 0;
    this.#isAborted = false;
    return await super.run(this.#baseNodes.map(node => this.#toCCId(node)), this.#maxThreads)
      .then(() => { this.#showResult('Completed', 'keyword'); })
      .catch((err) => {
        this.#isAborted = true;
        this.cancelAll();
        this.#showResult(err, 'error_message');
      });
  };
  #showResult(message, classname) {
    const result = this.#doc.getElementById('Result') || this.#doc.createElement('span');
    if (!result.id) {
      result.id = 'Result';
      this.#doc.body.insertBefore(result, this.#doc.body.firstChild);
    }
    result.className = '';
    if (classname) {
      result.classList.add(classname);
    }
    result.textContent = message;
  }
  #toCCId(node) {
    return node.id.replace(/^get_/, '');
  }
}
