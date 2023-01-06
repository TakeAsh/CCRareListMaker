// ==UserScript==
// @name         ConCon Boss Watcher
// @namespace    https://www.TakeAsh.net/
// @version      0.0.2023010705
// @description  Watch boss and beat it repeatedly.
// @author       TakeAsh68k
// @match        https://c4.concon-collector.com/status
// @match        https://c4.concon-collector.com/relief/default/1
// @match        https://c4.concon-collector.com/chat
// @match        https://c4.concon-collector.com/chat/*
// @match        https://c4.concon-collector.com/explore/coop/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=concon-collector.com
// @grant        none
// ==/UserScript==

(function() {
  const d = document;
  const script = d.createElement('script');
  script.type = 'module';
  script.src = 'https://www.takeash.net/ConConCollector/RareCC/watchBoss.js';
  d.head.appendChild(script);
})();