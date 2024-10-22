// ==UserScript==
// @name           ConCon fur checker
// @namespace      https://www.TakeAsh.net/
// @version        2024-10-22 21:00
// @description    check you have furs or not.
// @author         TakeAsh68k
// @match          https://c4.concon-collector.com/help/alllist
// @icon           https://www.google.com/s2/favicons?sz=64&domain=concon-collector.com
// @grant          none
// ==/UserScript==

javascript:
(async (d) => {
  'use strict';
  if (location.origin != 'https://c4.concon-collector.com') {
    alert('コンコンコレクターのサイトで実行して下さい');
    return;
  }
  const scripts = [
    'https://www.takeash.net/ConConCollector/RareCC/checkRareCC.mjs',
  ];
  const loadScript = (src) => new Promise((resolve, reject) => {
    const name = (/([^\/]+)$/.exec(src))[1];
    const script = d.createElement('script');
    script.onload = () => { resolve(name); };
    script.onerror = reject;
    script.type = name.endsWith('.mjs') ? 'module' : null;
    script.src = src;
    d.head.appendChild(script);
  });
  console.log(await Promise.all(scripts.map((src) => loadScript(src))));
})(document);
