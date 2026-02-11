'use strict';
import Status from './modules/DBossProcesserStatus.mjs';
import { getNodesByXpath, sleep } from 'https://www.takeash.net/js/modules/Util.mjs';
import { prepareElement, addStyle } from 'https://www.takeash.net/js/modules/PrepareElement.mjs';

const d = document;
const nameDBossPage = 'dbossPage';
const messageDone = 'DBossProc: Done';
const status = new Status();
const ui = {
  buttonProcess: prepareElement({
    tag: 'button',
    textContent: 'Process',
    events: { click: startProcessDBosses, },
  }),
  buttonCancel: prepareElement({
    tag: 'button',
    textContent: 'Cancel',
    disabled: true,
    events: { click: stopProcessDBosses, },
  }),
  radioNew: prepareElement({
    tag: 'input',
    name: 'radioDirection',
    id: 'radioNew',
    type: 'radio',
    value: 'New',
    checked: status.direction == 'New',
    events: { change: changeDirection, },
  }),
  labelNew: prepareElement({
    tag: 'label',
    htmlFor: 'radioNew',
    textContent: '↓',
  }),
  radioOld: prepareElement({
    tag: 'input',
    name: 'radioDirection',
    id: 'radioOld',
    type: 'radio',
    value: 'Old',
    checked: status.direction == 'Old',
    events: { change: changeDirection, },
  }),
  labelOld: prepareElement({
    tag: 'label',
    htmlFor: 'radioOld',
    textContent: '↑',
  }),
};
let DBosses = [];
if (location.pathname.startsWith('/status')) {
  pageStatus();
} else if (location.pathname.startsWith('/relief/default/2')) {
  await sleep(300);
  pageRelief();
} else if (location.pathname.startsWith('/chat')) {
  await sleep(300);
  pageChat();
} else if (location.pathname.startsWith('/rid/attack/')) {
  pageRidAttack();
}

function pageStatus() {
  const aProfile = getNodesByXpath('//a[text()="プロフィール"]')[0];
  if (!aProfile) { return; }
  const m = aProfile.href.match(/\/profile\/default\/(\d+)/);
  if (!m || !m[1]) { return; }
  status.myUserId = m[1];
  status.apLimit = d.querySelector('#ap_limit').textContent;
  status.ap = d.querySelector('#ap').textContent;
}

function pageRelief() {
  const div = Array.from(d.querySelectorAll('div'))
    .find((div) => div.textContent.match(/^\s*全部\s+\/\s+探索\s+\/\s+討伐\s*$/));
  if (!div) { return; }
  [
    d.createTextNode(' / '),
    ui.buttonProcess, d.createTextNode(' '),
    ui.buttonCancel, d.createTextNode(' '),
    ui.radioNew, ui.labelNew, ui.radioOld, ui.labelOld,
  ].forEach(node => {
    div.appendChild(node);
  });
  const divBox = prepareElement({
    tag: 'div',
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr'
    },
  });
  const divRelief = d.querySelector('#relief');
  divRelief.parentNode.insertBefore(divBox, divRelief);
  divBox.appendChild(divRelief);
  const iframe = prepareElement({
    tag: 'iframe',
    name: nameDBossPage,
    style: { width: '100%', height: '98%', },
  });
  divBox.appendChild(iframe);
  DBosses = getDBosses();
  window.addEventListener('message', processDBosses);
}

function pageChat() {
  addStyle({
    '#all': {
      width: 'initial',
    },
    '#divBox': {
      display: 'grid',
    },
    '.log': {
      width: 'initial',
    },
    '.log2': {
      width: 'initial',
    },
  });
  const divBox = prepareElement({
    tag: 'div',
    id: 'divBox',
  });
  const divLog = d.querySelector('div[class*="log"]');
  const divLog2 = d.querySelector('div[class*="log2"]');
  const divDBoss = prepareElement({
    tag: 'div',
    children: [
      {
        tag: 'div',
        id: 'DBossProc_Command',
      },
      {
        tag: 'iframe',
        name: nameDBossPage,
        style: { position: 'relative', width: '100%', height: '98%', },
      },
    ],
  });
  divLog.parentNode.appendChild(divBox);
  [divLog, divLog2, divDBoss]
    .filter(div => div.children.length)
    .forEach(div => divBox.appendChild(div));
  divBox.style.gridTemplateColumns =
    divLog2.children.length == 0 ? '5fr 3fr' :
      divLog.children.length == 0 ? '2fr 3fr' :
        '5fr 2fr 3fr';
  const divDBossCommand = d.getElementById('DBossProc_Command');
  [
    ui.buttonProcess, d.createTextNode(' '),
    ui.buttonCancel, d.createTextNode(' '),
    ui.radioNew, ui.labelNew, ui.radioOld, ui.labelOld,
  ].forEach(node => {
    divDBossCommand.appendChild(node);
  });
  DBosses = getDBosses_Chat();
  window.addEventListener('message', processDBosses);
}

function startProcessDBosses(event) {
  ui.buttonProcess.disabled = true;
  ui.buttonCancel.disabled = false;
  status.isProcessing = true;
  processDBoss();
}

function stopProcessDBosses(event) {
  ui.buttonProcess.disabled = false;
  ui.buttonCancel.disabled = true;
  status.isProcessing = false;
}

function changeDirection(event) {
  status.direction = event.target.value;
}

function getDBosses(context) {
  return getNodesByXpath('.//a[contains(@href,"/rid/attack/")]', context)
    .map((dboss) => {
      dboss.target = nameDBossPage;
      return dboss;
    });
}

function getDBosses_Chat() {
  const myPath = `/profile/default/${status.myUserId}`;
  const divBosses = getNodesByXpath('//div[contains(@class,"log2")]/div')
    .filter(div => !div.querySelector(`a[href$="${myPath}"]`))
    .reduce(
      (acc, cur) => {
        acc.push(...getDBosses(cur));
        return acc;
      },
      []
    );
  return divBosses;
}

function processDBosses(event) {
  if (event.origin != location.origin
    || event.data != messageDone) { return; }
  processDBoss();
}

function processDBoss() {
  status.load();
  ok: {
    if (status.ap < 3) { break ok; }
    const dboss = status.direction == 'New' ? DBosses.shift() : DBosses.pop();
    if (!dboss) { break ok; }
    status.ap -= 3;
    dboss.click();
    return;
  }
  stopProcessDBosses();
}

function pageRidAttack() {
  if (!status.isProcessing) { return; }
  const ap = getCurrentAp();
  ok: {
    if (status.ap < 0) { break ok; }
    status.ap = ap;
    if (status.ap < 3) { break ok; }
    const button = getNodesByXpath('//input[@type="submit" and @value="救援する"]')[0];
    if (!button) { break ok; }
    status.ap -= 3;
    button.click();
    return;
  }
  const winRelief = window.opener || window.parent;
  winRelief.postMessage(messageDone, location.origin);
}

function getCurrentAp() {
  const currentAp = getNodesByXpath('//span[text()="現在AP"]')[0];
  return !currentAp
    ? -1
    : currentAp.nextSibling.textContent.trim();
}
