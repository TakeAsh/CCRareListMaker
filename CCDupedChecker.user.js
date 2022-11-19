// ==UserScript==
// @name         ConCon Duplicated Checker
// @namespace    https://www.TakeAsh.net/
// @version      0.1.202211192230
// @description  scan concon list and order by duplication
// @author       TakeAsh68k
// @match        https://c4.concon-collector.com/help/alllist
// @icon         https://www.google.com/s2/favicons?sz=64&domain=concon-collector.com
// @grant        none
// ==/UserScript==

javascript:
(() => {
  const d = document;
  const script = d.createElement('script');
  script.type = 'module';
  script.src = 'https://www.takeash.net/ConConCollector/RareCC/checkDupedCC.js';
  d.head.appendChild(script);
})();
