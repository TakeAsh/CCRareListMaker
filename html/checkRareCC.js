'use strict';
(async function() {
  const uriRareBase = 'https://c4.concon-collector.com/view/default/';
  const regGotDate = /<span\sclass="keyword">初入手日時<\/span>\s*([^<]+)s*</;
  const regTitle = /<title>([^<]+)<\/title>/;
  const nodes = getNodesByXpath('//span[starts-with(@id,"get_")]');
  for (const node of nodes) {
    const response = await fetch(uriRareBase + node.id.replace(/^get_/, ''));
    if (response.ok) {
      const text = await response.text();
      let m;
      node.innerHTML =
        (m = text.match(regGotDate)) ? m[1]
          : (m = text.match(regTitle)) && m[1] == 'コンコンコレクター 図鑑' ? '-'
            : text;
    } else {
      node.innerHTML = response.statusText;
    }
  }

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
