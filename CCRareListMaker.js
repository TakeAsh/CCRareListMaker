// ==UserScript==
// @name         ConCon Rare List Maker
// @namespace    http://www.TakeAsh.net/
// @version      0.1.201511232230
// @description  make ConCon Rare List source
// @author       take-ash
// @match        http://c4.concon-collector.com/help/alllist
// @grant        none
// ==/UserScript==
/* jshint -W097 */
'use strict';

(function() {
    var forceName = ['－', '炎', '光', '風'];
    var bgColors = ['BGCOLOR(#7F7F7F):', 'BGCOLOR(#580000):', 'BGCOLOR(#505000):', 'BGCOLOR(#004000):'];
    var viewUrlBase = 'http://c4.concon-collector.com/view/default/';
    var br = '<br>\n';

    var textarea = document.getElementsByTagName('textarea')[0];
    var csv = textarea.textContent || textarea.innerText;
    var lines = csv.split(/\n/);
    var fields = lines.shift()
        .replace(/"/g, '')
        .split(',');
    var rares = {};
    for (var i = 0, line; line = lines[i]; ++i) {
        var rareCC = new RareCC(line);
        if (rares[rareCC.same_id]) {
            rares[rareCC.same_id].ids.push(rareCC.id);
        } else {
            rares[rareCC.same_id] = rareCC;
        }
    }
    var lots = {};
    for (var id in rares) {
        var rareCC = rares[id];
        if (!lots[rareCC.lot_id]) {
            lots[rareCC.lot_id] = {};
        }
        if (!lots[rareCC.lot_id][rareCC.rarity]) {
            lots[rareCC.lot_id][rareCC.rarity] = {};
        }
        if (!lots[rareCC.lot_id][rareCC.rarity][rareCC.id]) {
            lots[rareCC.lot_id][rareCC.rarity][rareCC.id] = rareCC;
        }
    }
    var result = '';
    result += '#contents' + br + br;
    for (var lot in lots) {
        var lotHeader = lot == 0 ?
            'ショップ, 開始時, シリアル, イベント, 生成装置' :
            '第' + lot + '弾';
        result += '* ' + lotHeader + br;
        for (var rarity in lots[lot]) {
            result += '- レア度' + rarity + br;
            result += '|~名前|~勢力|~元|~換毛|h' + br;
            for (var id in lots[lot][rarity]) {
                result += lots[lot][rarity][id].ToTableItem(false);
            }
            result += br;
        }
    }
    PrintNewWin(result);

    function RareCC(line) {
        var items = ('",' + line + ',"')
            .split(/","/);
        for (var i = 0, field; field = fields[i]; ++i) {
            this[field] = items[i + 1];
        }
        this.ids = [];
        this.ToTableItem = function(showFurDetail) {
            var bgColor = bgColors[this.force_id];
            var fur = showFurDetail ?
                this.ids.join(', ') :
                (this.ids.length > 0 ?
                    this.ids.length :
                    '');
            return '|COLOR(white):' + bgColor + this.title + this.name +
                '|COLOR(white):' + bgColor + forceName[this.force_id] +
                '|[[' + this.id + '>' + viewUrlBase + this.id + ']]' +
                '|' + fur +
                '|' + br;
        };
    }

    function PrintNewWin(text) {
        var docNew = window.open('', '_blank')
            .document;
        docNew.open('text/html');
        docNew.write('<html><body>\n' + text + '</body></html>');
        docNew.close();
    }
})();

// EOF
