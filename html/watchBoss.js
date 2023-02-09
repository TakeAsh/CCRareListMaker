'use strict';
import { getNodesByXpath } from 'https://www.takeash.net/js/modules/Util.mjs';

const d = document;
const config = {
  checkInterval: 3,
  attackInterval: 20,
  destoryLimit: 10,
};
const cookieMyUserId = '_CCCP_MyUserId';
const cookieKeepLogin = '_CCCP_KeepLogin';
const cookieCredential = '_CCCP_Credential';
const myUserId = getCookie(cookieMyUserId);
const regMyProfile = new RegExp(`\/profile\/default\/${myUserId}\\b`);
const page = location.pathname.match(/^\/([^\/]+)/)[1];
switch (page) {
  case 'login':
    login();
    break;
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

function login() {
  const credentialRaw = getCookie(cookieCredential);
  if (credentialRaw) {
    setTimeout(
      () => {
        const credential = JSON.parse(credentialRaw);
        getNodesByXpath('//input[@name="id"]')[0].value = credential.id;
        getNodesByXpath('//input[@name="pass"]')[0].value = credential.pass;
        getNodesByXpath('//input[@type="submit"]')[0].click();
      },
      10 * 1000
    );
  }
  const form = d.querySelector('form');
  if (form) {
    form.addEventListener(
      'submit',
      (event) => {
        const credential = {
          id: getNodesByXpath('//input[@name="id"]')[0].value,
          pass: getNodesByXpath('//input[@name="pass"]')[0].value,
        };
        setCookie(cookieCredential, JSON.stringify(credential), 30);
      }
    );
  } else {
    const aStatus = getNodesByXpath('//a[contains(@href,"/status")]')[0];
    if (aStatus) {
      aStatus.click();
    }
  }
}

function status() {
  let isKeepLogin = getCookieBool(cookieKeepLogin);
  let timerCheckLogin = undefined;
  if (isKeepLogin) {
    timerCheckLogin = setupReloadTimer();
    const aLogin = Array.from(document.querySelectorAll('a'))
      .filter((a) => a.href.match(/\/login$/));
    if (aLogin[0]) {
      aLogin[0].click();
    }
  }
  const aProfile = getNodesByXpath('//a[text()="プロフィール"]')[0];
  if (aProfile) {
    const m = aProfile.href.match(/\/profile\/default\/(\d+)/);
    if (m && m[1]) {
      setCookie(cookieMyUserId, m[1], 30);
    }
  }
  const aAccount = getNodesByXpath('//a[contains(@href,"/account")]')[0];
  if (aAccount) {
    const span = d.createElement('span');
    aAccount.parentNode.appendChild(span);
    const checkbox = d.createElement('input');
    checkbox.id = 'cbKeepLogin';
    checkbox.type = 'checkbox';
    checkbox.checked = isKeepLogin;
    checkbox.addEventListener(
      'change',
      (event) => {
        isKeepLogin = event.target.checked;
        setCookieBool(cookieKeepLogin, isKeepLogin);
        if (isKeepLogin) {
          timerCheckLogin = setupReloadTimer();
        } else {
          clearTimeout(timerCheckLogin);
        }
      }
    );
    span.appendChild(checkbox);
    const label = d.createElement('label');
    label.htmlFor = 'cbKeepLogin';
    label.textContent = 'Keep Login';
    span.appendChild(label);
  }
}

function relief() {
  getNodesByXpath('//a[contains(@href,"/explore/coop/")]')
    .forEach((a) => {
      const bossId = a.href.match(/\/explore\/coop\/(\d+)/)[1];
      a.target = `boss${bossId}`;
      a.click();
    });
  setupReloadTimer();
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

function getCookieBool(key) {
  return getCookie(key).toLowerCase() != 'false'
    ? true
    : false;
}

function setCookie(key, value, expireDate) {
  let cookieStr = key + '=' + value + ';path=/';
  if (expireDate > 0) {
    expireDate = new Date(new Date().getTime() + 60 * 60 * 24 * expireDate * 1000).toGMTString();
    cookieStr += ';expires=' + expireDate;
  }
  d.cookie = cookieStr;
}

function setCookieBool(key, value, expireDate) {
  setCookie(key, value ? 'true' : 'false', expireDate);
}

function calcInterval() {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  return hour == 4 && 0 <= min && min <= 31
    ? (32 - min) * 60 * 1000
    : config.checkInterval * 60 * 1000;
}

function setupReloadTimer() {
  return setTimeout(() => { location = location.href; }, calcInterval());
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
