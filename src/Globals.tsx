import { isPlatform } from '@ionic/react';
import axios from 'axios';
import IndexedDbZipFuncs from './IndexedDbZipFuncs';

const pwaUrl = process.env.PUBLIC_URL || '';
const bugReportApiUrl = 'https://vh6ud1o56g.execute-api.ap-northeast-1.amazonaws.com/bugReportMailer';

let log = '';

const axiosInstance = axios.create({
  timeout: 10000,
});

const assetsVersion = 1;
async function downloadAssets() {
  const res = await axiosInstance.get(`${window.location.origin}${pwaUrl}/assets.zip`, {
    responseType: 'blob',
  });
  await IndexedDbZipFuncs.extractZipToZips(res.data);
}

async function updateAssets(dispatch: Function) {
  return downloadAssets().then(async () => {
    dispatch({
      type: "SET_KEY_VAL",
      key: 'assetsVersion',
      val: Globals.assetsVersion,
    });
      
    dispatch({
      type: "SET_KEY_VAL",
      key: 'assetsUpdateDate',
      val: new Date().toISOString(),
    });
  });
}

async function clearAppData() {
  localStorage.clear();
}

const electronBackendApi: {
  send: (channel: string, data: any) => {},
  receive: (channel: string, func: Function) => {},
  receiveOnce: (channel: string, func: Function) => {},
  invoke: (channel: string, data: any) => Promise<any>,
} = (window as any).electronBackendApi;

function removeElementsByClassName(doc: Document, className: string) {
  let elements = doc.getElementsByClassName(className);
  while (elements.length > 0) {
    elements[0].parentNode?.removeChild(elements[0]);
  }
}

const consoleLog = console.log.bind(console);
const consoleError = console.error.bind(console);

function getLog() {
  return log;
}

function enableAppLog() {
  console.log = function () {
    log += '----- Info ----\n';
    log += (Array.from(arguments)) + '\n';
    consoleLog.apply(console, arguments as any);
  };

  console.error = function () {
    log += '----- Error ----\n';
    log += (Array.from(arguments)) + '\n';
    consoleError.apply(console, arguments as any);
  };
}

function disableAppLog() {
  log = '';
  console.log = consoleLog;
  console.error = consoleError;
}

function disableAndroidChromeCallout(event: any) {
  event.preventDefault();
  event.stopPropagation();
  return false;
}

// Workable but imperfect.
function disableIosSafariCallout(this: Window) {
  const s = this.getSelection();
  if ((s?.rangeCount || 0) > 0) {
    const r = s?.getRangeAt(0);
    s?.removeAllRanges();
    setTimeout(() => {
      s?.addRange(r!);
    }, 50);
  }
}

//const webkit = (window as any).webkit;
function copyToClipboard(text: string) {
  try {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'clipboard-read' } as any).then(() => {
        navigator.clipboard.writeText(text);
      });
    } else {
      navigator.clipboard && navigator.clipboard.writeText(text);
    }
  } catch (error) {
    console.error(error);
  }
}

function shareByLink(dispatch: Function, url: string = window.location.href) {
  copyToClipboard(url);
  dispatch({
    type: 'TMP_SET_KEY_VAL',
    key: 'shareTextModal',
    val: {
      show: true,
      text: decodeURIComponent(url),
    },
  });
}

function isMacCatalyst() {
  return isPlatform('ios') && navigator.platform === 'MacIntel';
}

const checkServiceWorkerInterval = 20;
let serviceWorkerLoaded = false;
let _serviceWorkerReg: ServiceWorkerRegistration;
async function getServiceWorkerReg() {
  if (serviceWorkerLoaded) {
    return _serviceWorkerReg;
  }

  return new Promise<ServiceWorkerRegistration>((ok, fail) => {
    let waitTime = 0;
    const waitLoading = setInterval(() => {
      if (navigator.serviceWorker.controller != null) {
        clearInterval(waitLoading);
        ok(_serviceWorkerReg);
      } else if (waitTime > 1e3 * 10) {
        clearInterval(waitLoading);
        fail('getServiceWorkerReg timeout!');
      }
      waitTime += checkServiceWorkerInterval;
    }, checkServiceWorkerInterval);
  });
}
function setServiceWorkerReg(serviceWorkerReg: ServiceWorkerRegistration) {
  _serviceWorkerReg = serviceWorkerReg;
}

let _serviceWorkerRegUpdated: ServiceWorkerRegistration;
function getServiceWorkerRegUpdated() {
  return _serviceWorkerRegUpdated;
}
function setServiceWorkerRegUpdated(serviceWorkerRegUpdated: ServiceWorkerRegistration) {
  _serviceWorkerRegUpdated = serviceWorkerRegUpdated;
}

const newStoreFile = 'dfb-dict-settings.json';

const Globals = {
  localFileProtocolName: 'safe-file-protocol',
  assetsVersion,
  assetsDir: 'assets',
  pwaUrl,
  bugReportApiUrl,
  storeFile: newStoreFile,
  getLog,
  enableAppLog,
  disableAppLog,
  axiosInstance,
  updateAssets,
  appSettings: {
    'theme': '佈景主題',
    'uiFontSize': 'UI 字型大小',
  } as Record<string, string>,
  updateApp: () => {
    return new Promise(async resolve => {
      navigator.serviceWorker.getRegistrations().then(async regs => {
        const hasUpdates = await Promise.all(regs.map(reg => (reg.update() as any).then((newReg: ServiceWorkerRegistration) => {
          return newReg.installing !== null || newReg.waiting !== null;
        })));
        resolve(hasUpdates.reduce((prev, curr) => prev || curr, false));
      });
    });
  },
  updateCssVars: (settings: any) => {
    document.documentElement.style.cssText = `--ui-font-size: ${settings.uiFontSize}px; --text-font-size: ${settings.fontSize}px`
  },
  isMacCatalyst,
  isTouchDevice: () => {
    return (isPlatform('ios') && !isMacCatalyst()) || isPlatform('android');
  },
  isStoreApps: () => {
    return isPlatform('pwa') || isPlatform('electron');
  },
  clearAppData,
  electronBackendApi,
  removeElementsByClassName,
  disableAndroidChromeCallout,
  disableIosSafariCallout,
  copyToClipboard,
  shareByLink,
  setServiceWorkerReg,
  getServiceWorkerReg,
  setServiceWorkerRegUpdated,
  getServiceWorkerRegUpdated,
};

export default Globals;
