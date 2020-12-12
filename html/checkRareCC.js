'use strict';
(function() {
  const uriRareBase = 'https://c4.concon-collector.com/view/default/';
  getNodesByXpath('//span[starts-with(@id,"get_")]').forEach(node => {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', uriRareBase + node.id.replace(/^get_/, ''));
    xhr.onload = function(e) {
      let m = xhr.responseText.match(/<span\sclass="keyword">初入手日時<\/span>\s*([^<]+)</);
      node.innerHTML = !m ? '-' : m[1];
    };
    xhr.send();
  });

  function getNodesByXpath(xpath, context) {
    let itr = document.evaluate(
      xpath,
      context || document,
      null,
      XPathResult.ORDERED_NODE_ITERATOR_TYPE,
      null
    );
    let nodes = [];
    let node = null;
    while (node = itr.iterateNext()) {
      nodes.push(node);
    }
    return nodes;
  }
})();
