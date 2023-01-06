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
    const currentAp = getNodesByXpath('//span[text()="現在AP"]')[0];
    if (!currentAp || currentAp.nextSibling.textContent.trim() < 3) { break checkOk; }
    const spanRestTime = getNodesByXpath('//span[@class="keyword" and text()="残り時間"]')[0];
    if (!spanRestTime) { break checkOk; }
    const m = spanRestTime.nextSibling.textContent.match(/\s*((?<min>\d+)分)?(?<sec>\d+)秒/);
    const buttonAttacks = getNodesByXpath('//input[@type="submit" and contains(@value,"攻撃する")]');
    if (!buttonAttacks.length) { break checkOk; }
    let buttonAttack = buttonAttacks[1] || buttonAttacks[0];
    if (m.groups.min > config.destoryLimit) {
      const aPlayers = getNodesByXpath('//a[contains(@href,"profile")]');
      aPlayers.shift(); // drop finding player
      const lastMyAttack = aPlayers.find((a) => a.href.match(regMyProfile));
      if (lastMyAttack) {
        const m = lastMyAttack.parentNode.textContent.match(/ダメージを与えた！\((\d+).*\)/);
        if (m && m[1] <= config.attackInterval) { break checkOk; }
      }
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
