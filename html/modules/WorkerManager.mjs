export default class WorkerManager {
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
