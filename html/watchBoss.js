'use strict';
import { getNodesByXpath } from 'https://www.takeash.net/js/modules/Util.mjs';

const d = document;
const config = {
  checkInterval: 3,
  attackInterval: 20,
  destoryLimit: 10,
};
const cookieName = '_CCCP_MyUserId';
const myUserId = getCookie(cookieName);
const regMyProfile = new RegExp(`\/profile\/default\/${myUserId}\\b`);
const page = location.pathname.match(/^\/([^\/]+)/)[1];
switch (page) {
  case 'status':
    status();
    break;
  case 'relief':
  case 'chat':
    relief();
    break;
  case 'explore':
    explore();
    break;
}

function status() {
  const aProfile = getNodesByXpath('//a[text()="プロフィール"]')[0];
  if (!aProfile) { return; }
  const m = aProfile.href.match(/\/profile\/default\/(\d+)/);
  if (!m || !m[1]) { return; }
  setCookie(cookieName, m[1], 30);
}

function relief() {
  getNodesByXpath('//a[contains(@href,"/explore/coop/")]')
    .forEach((a) => {
      const bossId = a.href.match(/\/explore\/coop\/(\d+)/)[1];
      a.target = `boss${bossId}`;
      a.click();
    });
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const interval = hour == 4 && 0 <= min && min <= 31
    ? (32 - min) * 60 * 1000
    : config.checkInterval * 60 * 1000;
  setInterval(() => { location = location.href; }, interval);
}

function explore() {
  checkOk: {
    if (getCurrentAp() < 3) { break checkOk; }
    const restTime = getRestTime();
    if (!restTime) { break checkOk; }
    const buttonAttacks = getNodesByXpath('//input[@type="submit" and contains(@value,"攻撃する")]');
    if (!buttonAttacks.length) { break checkOk; }
    let buttonAttack = buttonAttacks[1] || buttonAttacks[0];
    if (restTime.min > config.destoryLimit && !isBeforeMaintenance()) {
      if (getLastAttack() <= config.attackInterval) { break checkOk; }
      buttonAttack = buttonAttacks[0];
    }
    buttonAttack.click();
    return;
  }
  setTimeout(() => { window.close(); }, 10 * 1000);
}

function getCookie(key) {
  const m = d.cookie.match(new RegExp(key + '\\s*=\\s*([^;]+)'));
  return m && m[1] || '';
}

function setCookie(key, value, expireDate) {
  let cookieStr = key + '=' + value + ';path=/';
  if (expireDate > 0) {
    expireDate = new Date(new Date().getTime() + 60 * 60 * 24 * expireDate * 1000).toGMTString();
    cookieStr += ';expires=' + expireDate;
  }
  d.cookie = cookieStr;
}

function getCurrentAp() {
  const currentAp = getNodesByXpath('//span[text()="現在AP"]')[0];
  return !currentAp
    ? 0
    : currentAp.nextSibling.textContent.trim();
}

function getRestTime() {
  const spanRestTime = getNodesByXpath('//span[@class="keyword" and text()="残り時間"]')[0];
  if (!spanRestTime) { return null; }
  const m = spanRestTime.nextSibling.textContent.match(/\s*((?<min>\d+)分)?(?<sec>\d+)秒/);
  return { min: m.groups.min || 0, sec: m.groups.sec || 0 };
}

function isBeforeMaintenance() {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  return hour == 3 && (60 - config.checkInterval * 4) <= min && min <= 59;
}

function getLastAttack() {
  const aPlayers = getNodesByXpath('//a[contains(@href,"profile")]');
  aPlayers.shift(); // drop finding player
  const lastMyAttack = aPlayers.find((a) => a.href.match(regMyProfile));
  if (!lastMyAttack) { return Number.MAX_VALUE; }
  const m = lastMyAttack.parentNode.textContent.match(/ダメージを与えた！\((\d+).*\)/);
  return m && m[1]
    ? m[1]
    : Number.MAX_VALUE;
}
