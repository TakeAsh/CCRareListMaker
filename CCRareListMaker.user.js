// ==UserScript==
// @name         ConCon Rare List Maker
// @namespace    http://www.TakeAsh.net/
// @version      0.1.201511250000
// @description  make ConCon Rare List source
// @author       take-ash
// @match        http://c4.concon-collector.com/help/alllist
// @grant        none
// ==/UserScript==
/* jshint -W097 */
'use strict';

(function() {
    var forceName = ['－', '炎', '光', '風'];
    var types = ['狐魂生成', 'ショップ', '初期開始時', 'シリアル', '換毛', 'イベント', '生成装置'];
    var bgColors = ['BGCOLOR(#7F7F7F):', 'BGCOLOR(#580000):', 'BGCOLOR(#505000):', 'BGCOLOR(#004000):'];
    var viewUrlBase = 'http://c4.concon-collector.com/view/default/';
    var rareListBasePage = 'レア狐魂一覧';
    var numOfLotGroup = 10; /**< 1ページにまとめる弾数 */
    var numOfFurBasePage = '換毛が多い狐魂';
    var numOfFurMin = 3; /**< 最低換毛数 */
    var tableHeader = '|~名前|~勢力|~元|~換毛数|~換毛|h';
    var br = '<br>\n';

    var lastModified = br + 'データ更新日: ' + new Date(window.document.lastModified)
        .toLocaleString() + br;
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
    var lotGroups = [];
    var groupTitles = [];
    for (var lot in lots) {
        var index = lot <= 0 ?
            0 :
            Math.floor((lot - 1) / numOfLotGroup) + 1;
        var lotHeader = lot <= 0 ?
            types[-lot] :
            '第' + lot + '弾';
        if (!lotGroups[index]) {
            lotGroups[index] = '- [[' + rareListBasePage + ']]' + br + '#contents' + br + br;
            groupTitles[index] = [];
        }
        lotGroups[index] += '* ' + lotHeader + br;
        groupTitles[index].push(lotHeader);
        for (var rarity in lots[lot]) {
            lotGroups[index] += '- レア度' + rarity + br;
            lotGroups[index] += tableHeader + br;
            for (var id in lots[lot][rarity]) {
                lotGroups[index] += lots[lot][rarity][id].ToTableItem();
            }
            lotGroups[index] += br;
        }
    }

    var indexPage = '';
    PrintNewWin(lotGroups[0]);
    indexPage += '- [[' + groupTitles[0] + '>' + rareListBasePage + '/0' + ']]' + br;
    for (var i = 1, group; group = lotGroups[i]; ++i) {
        PrintNewWin(group);
        var first = groupTitles[i][0];
        var last = groupTitles[i][groupTitles[i].length - 1];
        var title = first == last ?
            first :
            first + ' - ' + last;
        indexPage += '- [[' + title + '>' + rareListBasePage + '/' + i + ']]' + br;
    }
    indexPage += '- [[' + numOfFurBasePage + ']]' + br;
    PrintNewWin(indexPage);

    var furSortedRares = [];
    for (var id in rares) {
        if (rares[id].ids.length < numOfFurMin) {
            continue;
        }
        furSortedRares.push(rares[id]);
    }
    furSortedRares.sort(function(a, b) {
        return b.ids.length - a.ids.length;
    });
    var furSortedPage = '';
    furSortedPage += '- [[' + rareListBasePage + ']]' + br + '#contents' + br + br;
    furSortedPage += tableHeader + br;
    for (var i = 0, rare; rare = furSortedRares[i]; ++i) {
        furSortedPage += rare.ToTableItem();
    }
    PrintNewWin(furSortedPage);

    function RareCC(line) {
        var items = ('",' + line + ',"')
            .split(/","/);
        for (var i = 0, field; field = fields[i]; ++i) {
            this[field] = items[i + 1];
        }
        if (this.lot_id == 0) {
            this.lot_id = -this.type;
        }
        this.ids = [];
        this.ToTableItem = function() {
            var bgColor = bgColors[this.force_id];
            var furs = [];
            for (var i = 0, id; id = this.ids[i]; ++i) {
                furs.push('[[' + id + '>' + viewUrlBase + id + ']]');
            }
            var fur = furs.join(', ');
            return '|COLOR(white):' + bgColor + this.title + this.name +
                '|COLOR(white):' + bgColor + forceName[this.force_id] +
                '|' + bgColor + '[[' + this.id + '>' + viewUrlBase + this.id + ']]' +
                '|COLOR(white):' + bgColor + (this.ids.length ? this.ids.length : '') +
                '|' + bgColor + fur +
                '|' + br;
        };
    }

    function PrintNewWin(text) {
        var docNew = window.open('', '_blank')
            .document;
        docNew.open('text/html');
        docNew.write('<html><body>\n' + text + lastModified + '</body></html>');
        docNew.close();
    }
})();

// EOF
