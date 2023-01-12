'use strict';
import Status from './modules/DBossProcesserStatus.mjs';
import { getNodesByXpath } from 'https://www.takeash.net/js/modules/Util.mjs';

const d = document;
const nameDBossPage = 'dbossPage';
const messageDone = 'DBossProc: Done';
const status = new Status();
const regMyProfile = new RegExp(`\/profile\/default\/${status.myUserId}\\b`);
const buttonProcess = d.createElement('button');
const buttonCancel = d.createElement('button');
let DBosses = [];
if (location.pathname.startsWith('/status')) {
  pageStatus();
} else if (location.pathname.startsWith('/relief/default/2')) {
  pageRelief();
} else if (location.pathname.startsWith('/rid/attack/')) {
  pageRidAttack();
}

function pageStatus() {
  const aProfile = getNodesByXpath('//a[text()="プロフィール"]')[0];
  if (!aProfile) { return; }
  const m = aProfile.href.match(/\/profile\/default\/(\d+)/);
  if (!m || !m[1]) { return; }
  status.myUserId = m[1];
  status.ap = d.querySelector('#ap').textContent;
}

function pageRelief() {
  const div = Array.from(d.querySelectorAll('div'))
    .find((div) => div.textContent.match(/^\s*全部\s+\/\s+探索\s+\/\s+討伐\s*$/));
  if (!div) { return; }
  div.appendChild(d.createTextNode(' / '));
  buttonProcess.textContent = 'Process';
  buttonProcess.addEventListener('click', startProcessDBosses);
  div.appendChild(buttonProcess);
  div.appendChild(d.createTextNode(' '));
  buttonCancel.textContent = 'Cancel';
  buttonCancel.disabled = true;
  buttonCancel.addEventListener('click', stopProcessDBosses);
  div.appendChild(buttonCancel);
  div.appendChild(d.createTextNode(' '));
  const radioNew = d.createElement('input');
  radioNew.name = 'radioDirection';
  radioNew.id = 'radioNew';
  radioNew.type = 'radio';
  radioNew.value = 'New';
  radioNew.checked = radioNew.value == status.direction;
  radioNew.addEventListener('change', changeDirection);
  div.appendChild(radioNew);
  const labelNew = d.createElement('label');
  labelNew.htmlFor = radioNew.id;
  labelNew.textContent = '↓';
  div.appendChild(labelNew);
  const radioOld = d.createElement('input');
  radioOld.name = 'radioDirection';
  radioOld.id = 'radioOld';
  radioOld.type = 'radio';
  radioOld.value = 'Old';
  radioOld.checked = radioOld.value == status.direction;
  radioOld.addEventListener('change', changeDirection);
  div.appendChild(radioOld);
  const labelOld = d.createElement('label');
  labelOld.htmlFor = radioOld.id;
  labelOld.textContent = '↑';
  div.appendChild(labelOld);
  const divBox = d.createElement('div');
  divBox.style.display = 'flex';
  const divRelief = d.querySelector('#relief');
  divRelief.parentNode.insertBefore(divBox, divRelief);
  divBox.appendChild(divRelief);
  divRelief.style.width = '50%';
  const ifrane = d.createElement('iframe');
  ifrane.name = nameDBossPage;
  ifrane.style.width = '50%';
  divBox.appendChild(ifrane);
  DBosses = getNodesByXpath('//a[contains(@href,"/rid/attack/")]')
    .map((dboss) => {
      dboss.target = nameDBossPage;
      return dboss;
    });
  window.addEventListener('message', processDBosses);
}

function startProcessDBosses(event) {
  buttonProcess.disabled = true;
  buttonCancel.disabled = false;
  status.isProcessing = true;
  processDBoss();
}

function stopProcessDBosses(event) {
  buttonProcess.disabled = false;
  buttonCancel.disabled = true;
  status.isProcessing = false;
}

function changeDirection(event) {
  status.direction = event.target.value;
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
  status.ap = getCurrentAp();
  const winRelief = window.opener || window.parent;
  if (status.ap < 3) {
    winRelief.postMessage(messageDone, location.origin);
    return;
  }
  const button = getNodesByXpath('//input[@type="submit" and @value="救援する"]')[0];
  if (button) {
    status.ap -= 3;
    button.click();
  } else {
    winRelief.postMessage(messageDone, location.origin);
  }
}

function getCurrentAp() {
  const currentAp = getNodesByXpath('//span[text()="現在AP"]')[0];
  return !currentAp
    ? 0
    : currentAp.nextSibling.textContent.trim();
}
