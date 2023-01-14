// ==UserScript==
// @name         ConCon D-Boss Processer
// @namespace    https://www.TakeAsh.net/
// @version      0.0.202301141230
// @description  try to take over the world!
// @author       TakeAsh68k
// @match        https://c4.concon-collector.com/status
// @match        https://c4.concon-collector.com/relief/default/2
// @match        https://c4.concon-collector.com/relief/default/2/*
// @match        https://c4.concon-collector.com/rid/attack/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=concon-collector.com
// @grant        none
// ==/UserScript==

(function() {
  const d = document;
  const script = d.createElement('script');
  script.type = 'module';
  script.src = 'https://www.takeash.net/ConConCollector/RareCC/processDBoss.js';
  d.head.appendChild(script);
})();