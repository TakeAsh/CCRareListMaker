'use strict';
import { getNodesByXpath } from 'https://www.takeash.net/js/modules/Util.mjs';

const d = document;
const statusDefault = {
  myUserId: 0,
  isProcessing: false,
  ap: 0,
};
const cookieProcessDBoss = '_CCCP_ProcessDBoss';
const nameDBossPage = 'dbossPage';
const messageDone = 'DBossProc: Done';
let status = getCookie(cookieProcessDBoss) || statusDefault;
const regMyProfile = new RegExp(`\/profile\/default\/${status.myUserId}\\b`);
const buttonProcess = d.createElement('button');
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
  setCookie(cookieProcessDBoss, status, 30);
}

function pageRelief() {
  const div = Array.from(d.querySelectorAll('div'))
    .find((div) => div.textContent.match(/^\s*全部\s+\/\s+探索\s+\/\s+討伐\s*$/));
  if (!div) { return; }
  div.appendChild(d.createTextNode(' / '));
  buttonProcess.textContent = 'Process';
  buttonProcess.addEventListener('click', startProcessDBosses);
  div.appendChild(buttonProcess);
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
  status.isProcessing = true;
  setCookie(cookieProcessDBoss, status, 30);
  processDBoss();
}

function processDBosses(event) {
  if (event.origin != location.origin
    || event.data != messageDone) { return; }
  processDBoss();
}

function processDBoss() {
  status = getCookie(cookieProcessDBoss) || statusDefault;
  ok: {
    if (status.ap < 3) { break ok; }
    const dboss = DBosses.shift();
    if (!dboss) { break ok; }
    status.ap -= 3;
    setCookie(cookieProcessDBoss, status, 30);
    dboss.click();
    return;
  }
  status.isProcessing = false;
  setCookie(cookieProcessDBoss, status, 30);
  buttonProcess.disabled = false;
}

function pageRidAttack() {
  if (!status.isProcessing) { return; }
  status.ap = getCurrentAp();
  setCookie(cookieProcessDBoss, status, 30);
  const winRelief = window.opener || window.parent;
  if (status.ap < 3) {
    winRelief.postMessage(messageDone, location.origin);
    return;
  }
  const button = getNodesByXpath('//input[@type="submit" and @value="救援する"]')[0];
  if (button) {
    status.ap -= 3;
    setCookie(cookieProcessDBoss, status, 30);
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

function getCookie(key) {
  const m = d.cookie.match(new RegExp(key + '\\s*=\\s*([^;]+)'));
  return !m || !m[1]
    ? null
    : JSON.parse(m[1]);
}

function setCookie(key, obj, expireDate) {
  let cookieStr = key + '=' + JSON.stringify(obj) + ';path=/';
  if (expireDate > 0) {
    expireDate = new Date(new Date().getTime() + 60 * 60 * 24 * expireDate * 1000).toGMTString();
    cookieStr += ';expires=' + expireDate;
  }
  d.cookie = cookieStr;
}
