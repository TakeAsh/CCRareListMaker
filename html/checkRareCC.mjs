'use strict';
import { clamp } from 'https://www.takeash.net/js/modules/Util.mjs';
import { AutoSaveConfig } from 'https://www.takeash.net/js/modules/AutoSaveConfig.mjs';
import { prepareElement, addStyle } from 'https://www.takeash.net/js/modules/PrepareElement.mjs';
import { RareCC, RareCCs } from './modules/RareCC.mjs';
import wmRareCCChecker from './modules/wmRareCCChecker.mjs';

(async (w, d) => {
  const maxThreads = 18;
  const settings = new AutoSaveConfig({
    page: 0,
    rows: 25,
    limitRare: 2,
    stepPage: 8,
    stepRows: 8,
  }, '_CCFurCheckerSettings');
  const rares = await getRareCCs();
  const idsFull = Object.keys(rares)
    .filter(id => rares[id].furs >= settings.limitRare)
    .sort((a, b) => (rares[b].furs - rares[a].furs) || (a.id - b.id));
  const doc = prepareDoc();
  const tbodyRares = doc.getElementById('tbodyRares');
  const wm = new wmRareCCChecker(doc, maxThreads);
  await renderIds();

  async function getRareCCs() {
    const response = await fetch(`${location.origin}/help/alllist`);
    const rawRares = await response.json();
    return rawRares.reduce(
      (acc, cur) => acc.add(new RareCC(cur)),
      new RareCCs()
    );
  }
  function prepareDoc() {
    const toInput = (event, css) => event.target.parentNode.querySelector(css);
    const createPageHandler = (delta) => async (event) => {
      const input = toInput(event, '#inputPage');
      const maxPage = Math.floor(idsFull.length / settings.rows);
      input.value = settings.page = clamp(parseInt(input.value) + delta, 0, maxPage);
      await renderIds();
    };
    const createRowsHandler = (delta) => async (event) => {
      const input = toInput(event, '#inputRows');
      input.value = settings.rows = clamp(parseInt(input.value) + delta, 10, 60);
      await renderIds();
    };
    const doc = w.open('', 'FurChecker').document;
    doc.open('text/html');
    [
      '<html lang="ja">',
      '<head><meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<link rel="stylesheet" type="text/css" href="/css/pc/cm.css">',
      '<title>Fur Checker</title></head>',
      '<body></body>',
      '</html>',
    ].forEach((line) => { doc.write(line); });
    doc.close();
    addStyle({
      '#controller': {
        display: 'grid',
        gridTemplateColumns: '3em 2em 2em 2em 2em 2em',
        columnGap: '0.2em',
      },
      '#controller input': {
        width: '100%',
      },
    }, doc);
    doc.body.appendChild(prepareElement({
      tag: 'div',
      id: 'controller',
      children: [
        {
          tag: 'span',
          textContent: 'Page',
        },
        {
          tag: 'button',
          textContent: '--',
          events: { click: createPageHandler(- settings.stepPage), },
        },
        {
          tag: 'button',
          textContent: '-',
          events: { click: createPageHandler(-1), },
        },
        {
          tag: 'input',
          id: 'inputPage',
          type: 'text',
          value: settings.page,
          events: { change: createPageHandler(0), },
        },
        {
          tag: 'button',
          textContent: '+',
          events: { click: createPageHandler(1), },
        },
        {
          tag: 'button',
          textContent: '++',
          events: { click: createPageHandler(settings.stepPage), },
        },
        {
          tag: 'span',
          textContent: 'Rows',
        },
        {
          tag: 'button',
          textContent: '--',
          events: { click: createRowsHandler(- settings.stepRows), },
        },
        {
          tag: 'button',
          textContent: '-',
          events: { click: createRowsHandler(-1), },
        },
        {
          tag: 'input',
          id: 'inputRows',
          type: 'text',
          value: settings.rows,
          events: { change: createRowsHandler(0), },
        },
        {
          tag: 'button',
          textContent: '+',
          events: { click: createRowsHandler(1), },
        },
        {
          tag: 'button',
          textContent: '++',
          events: { click: createRowsHandler(settings.stepRows), },
        },
      ],
    }, doc));
    doc.body.appendChild(prepareElement({
      tag: 'table',
      border: 1,
      children: [
        {
          tag: 'thead',
          children: [
            {
              tag: 'tr',
              children: [
                {
                  tag: 'th',
                  textContent: '#',
                },
                {
                  tag: 'th',
                  textContent: '換毛数',
                },
                {
                  tag: 'th',
                  textContent: '名前',
                },
                {
                  tag: 'th',
                  textContent: '初入手日時',
                },
              ],
            },
          ],
        },
        {
          tag: 'tbody',
          id: 'tbodyRares',
        },
      ],
    }, doc));
    return doc;
  }
  async function renderIds() {
    const skip = settings.page * settings.rows;
    tbodyRares.innerHTML = idsFull.slice(skip, skip + settings.rows)
      .map((id, index) => rares[id].toRow(index + 1, skip))
      .join('');
    await wm.run();
  }
})(window, document);
