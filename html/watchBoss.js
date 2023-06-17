'use strict';
import { getNodesByXpath } from 'https://www.takeash.net/js/modules/Util.mjs';
import { getCookie, setCookie } from 'https://www.takeash.net/js/modules/Cookie.mjs';
import { prepareElement, addStyle } from 'https://www.takeash.net/js/modules/PrepareElement.mjs';

const w = window;
const d = document;
const config = {
  checkInterval: 3,
  attackInterval: 20,
  destoryLimit: 10,
};
const cookieMyUserId = '_CCCP_MyUserId';
const cookieKeepLogin = '_CCCP_KeepLogin';
const cookieCredential = '_CCCP_Credential';
const keySender = 'CCBossWatcher';
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
  if (localStorage[cookieCredential]) {
    setTimeout(
      () => {
        const credential = JSON.parse(localStorage[cookieCredential]);
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
        localStorage[cookieCredential] = JSON.stringify(credential);
      }
    );
  } else {
    const aStatus = getNodesByXpath('//a[contains(@href,"/status")]')[0];
    if (aStatus) {
      w.open('/relief/default/1', 'reliefPage');
      w.open('/chat', 'chatPage');
      w.open('/rid/list', 'ridPage');
      aStatus.click();
    }
  }
}

function status() {
  let isKeepLogin = getCookie(cookieKeepLogin);
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
    const span = prepareElement({
      tag: 'span',
      children: [
        {
          tag: 'input',
          id: 'cbKeepLogin',
          type: 'checkbox',
          checked: isKeepLogin,
          events: {
            change: (event) => {
              isKeepLogin = event.target.checked;
              setCookie(cookieKeepLogin, isKeepLogin);
              if (isKeepLogin) {
                timerCheckLogin = setupReloadTimer();
              } else {
                clearTimeout(timerCheckLogin);
              }
            },
          },
        },
        {
          tag: 'label',
          htmlFor: 'cbKeepLogin',
          textContent: 'Keep Login',
        },
      ],
    });
    aAccount.parentNode.appendChild(span);
  }
}

function relief() {
  addStyle({
    '#relief > div': {
      height: 'initial',
    },
    '.BossFrame': {
      position: 'relative',
    },
  });
  w.addEventListener(
    'message',
    (event) => {
      if (event.origin != location.origin || event.data.sender != keySender) { return; }
      const iframe = getNodesByXpath(`//iframe[@name="${event.data.bossId}"]`)[0];
      if (!iframe || !iframe.parentNode) { return; }
      iframe.parentNode.removeChild(iframe);
    }
  );
  getNodesByXpath('//a[contains(@href,"/explore/coop/")]')
    .forEach((a) => {
      const iframe = prepareElement(
        {
          tag: 'details',
          children: [
            {
              tag: 'summary',
            },
            {
              tag: 'div',
              classes: ['BossFrame',],
              children: [{
                tag: 'iframe',
                name: makeBossId(a.href),
                src: a.href,
                width: 500,
                height: 400,
              }],
            }
          ],
        }
      );
      a.parentNode.appendChild(iframe);
      iframe.querySelector('summary').appendChild(a);
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
  setTimeout(
    () => {
      (w.opener || w.parent).postMessage(
        { sender: keySender, bossId: makeBossId(location.href) },
        location.origin
      );
    },
    calcInterval()
  );
}

function makeBossId(uri) {
  const bossId = uri.match(/\/explore\/coop\/(\d+)/)[1];
  return !bossId
    ? null
    : `boss${bossId}`;
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
