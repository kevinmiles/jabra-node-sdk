import { Notyf } from 'notyf';

import { DeviceType, MetaApi, ClassEntry } from '@gnaudio/jabra-node-sdk';

// Setup client-side notifications:
export const notyf = new Notyf({duration:1500});

// References to our HTML elements.

export const testAppVersion = document.getElementById('testAppVersion') as HTMLSpanElement;
export const nodeSdkVersion = document.getElementById('nodeSdkVersion') as HTMLSpanElement;
export const electronHelperVersion = document.getElementById('electronHelperVersion') as HTMLSpanElement;
export const electronVersion = document.getElementById('electronVersion') as HTMLSpanElement;
export const nodeVersion = document.getElementById('nodeVersion') as HTMLSpanElement;
export const osType = document.getElementById('osType') as HTMLSpanElement;
export const nativeSdkVersion = document.getElementById('nativeSdkVersion') as HTMLSpanElement;

export const errorMsg = document.getElementById('errorMsg') as HTMLSelectElement;

export const deviceSelector = document.getElementById('deviceSelector') as HTMLSelectElement;
export const apiClassSelector = document.getElementById('apiClassSelector') as HTMLSelectElement;

export const initSDKBtn = document.getElementById('initSDKBtn') as HTMLButtonElement;
export const unInitSDKBtn = document.getElementById('unInitSDKBtn') as HTMLButtonElement;
export const apiReferenceBtn = document.getElementById('apiReference') as HTMLButtonElement;
export const setupUserMediaPlaybackBtn = document.getElementById('setupUserMediaPlaybackBtn') as HTMLButtonElement;
export const devicesBtn = document.getElementById('devicesBtn') as HTMLButtonElement;
export const checkInstallBtn = document.getElementById('checkInstallBtn') as HTMLButtonElement;
export const nativeSdkVersionContainer = document.getElementById('nativeSdkVersionContainer') as HTMLSpanElement;

export const player = document.getElementById('player') as HTMLAudioElement;

export const methodSelector = document.getElementById('methodSelector') as HTMLSelectElement;
export const filterInternalsAndDeprecatedMethodsChk = document.getElementById('filterInternalsAndDeprecatedMethodsChk') as HTMLInputElement;
export const invokeApiBtn = document.getElementById('invokeApiBtn') as HTMLButtonElement;
export const stressInvokeApiBtn = document.getElementById('stressInvokeApiBtn') as HTMLButtonElement;
export const methodHelp = document.getElementById('methodHelp') as HTMLDivElement;
export const methodSignature = document.getElementById('methodSignature') as HTMLDivElement;

export const txtParam1 = document.getElementById('txtParam1') as HTMLInputElement;
export const txtParam2 = document.getElementById('txtParam2') as HTMLInputElement;
export const txtParam3 = document.getElementById('txtParam3') as HTMLInputElement;
export const txtParam4 = document.getElementById('txtParam4') as HTMLInputElement;
export const txtParam5 = document.getElementById('txtParam5') as HTMLInputElement;

export const param1Hint = document.getElementById('param1Hint') as HTMLSpanElement;
export const param2Hint = document.getElementById('param2Hint') as HTMLSpanElement;
export const param3Hint = document.getElementById('param3Hint') as HTMLSpanElement;
export const param4Hint = document.getElementById('param4Hint') as HTMLSpanElement;
export const param5Hint = document.getElementById('param5Hint') as HTMLSpanElement;

export const messagesCount = document.getElementById('messagesCount') as HTMLSpanElement;
export const clearMessageAreaBtn = document.getElementById('clearMessageAreaBtn') as HTMLButtonElement;
export const copyMessagesBtn = document.getElementById('copyMessages') as HTMLButtonElement;
export const toggleScrollMessageAreaBtn = document.getElementById('toggleScrollMessageAreaBtn') as HTMLButtonElement;
export const messageFilter = document.getElementById('messageFilter') as HTMLSelectElement;
export const messageArea = document.getElementById('messageArea') as HTMLTextAreaElement

export const errorsCount = document.getElementById('errorsCount') as HTMLSpanElement;
export const clearErrorAreaBtn = document.getElementById('clearErrorAreaBtn') as HTMLButtonElement;
export const toggleScrollErrorAreaBtn = document.getElementById('toggleScrollErrorAreaBtn') as HTMLButtonElement;
export const errorArea = document.getElementById('errorArea') as HTMLTextAreaElement;

export const devLogStatus = document.getElementById('devLogStatus') as HTMLSpanElement;
export const boomArmStatus = document.getElementById('boomArmStatus') as HTMLSpanElement;
export const txStatus = document.getElementById('txStatus') as HTMLSpanElement;
export const txPeakStatus = document.getElementById('txPeakStatus') as HTMLSpanElement;
export const rxStatus = document.getElementById('rxStatus') as HTMLSpanElement;
export const rxPeakStatus = document.getElementById('rxPeakStatus') as HTMLSpanElement;
export const txSpeechStatus = document.getElementById('txSpeechStatus') as HTMLSpanElement;
export const rxSpeechStatus = document.getElementById('rxSpeechStatus') as HTMLSpanElement;

export function initStaticVersionInfo() {
  const urlParams = new URLSearchParams(window.location.search);
  const testApp_version_txt = urlParams.get('testAppVersion') || "?";
  const nodesdk_version_txt = urlParams.get('nodeSdkVersion') || "?";
  const electronHelper_version_txt = urlParams.get('electronHelperVersion') || "?";
  const electron_version_txt = urlParams.get('electronVersion') || "?";
  const node_version_txt = urlParams.get('nodeVersion') || "?";
  const os_type_txt = urlParams.get('osType') || "?";

  testAppVersion.innerText = testApp_version_txt;
  nodeSdkVersion.innerText = nodesdk_version_txt;
  electronHelperVersion.innerText = electronHelper_version_txt;
  electronVersion.innerText = electron_version_txt;
  nodeVersion.innerText = node_version_txt;
  osType.innerText = os_type_txt;
}
 
// Utility to show errors prominently in the window. 
export function showError(err: string | String | Error) {
    let msg: string;
    if (err instanceof Error) {
      msg = err.toString();
    } else if ((typeof err === 'string') || (err instanceof String)) {
      msg = err.toString(); 
    } else {
      msg = JSON.stringify(err);
    }

    // Add nodes to show the error message
    errorMsg.innerText = msg;

    // Also show as notification.
    notyf.error(msg);
}

export function addDevice(device: DeviceType) {
    const opt = document.createElement('option');
    opt.value = device.deviceID.toString();
    opt.innerHTML = device.deviceName;
    deviceSelector.appendChild(opt);

    devicesSideEffects();
}

export function removeDevice(device: DeviceType) {
    let found = false;
    let i = 0;
    while (deviceSelector.options.length > i && !found) {
      if (deviceSelector.options[i].value === device.deviceID.toString()) {
          deviceSelector.remove(i);
          found = true;
      }

      ++i;
    }

    devicesSideEffects();
}

// Configures GUI depending on which Jabra devices are present.
export function setupDevices(devices: ReadonlyArray<DeviceType>) {
  while (deviceSelector.options.length > 0) {
    deviceSelector.remove(0);
  }

  devices.forEach(device => {
    const opt = document.createElement('option');
    opt.value = device.deviceID.toString();
    opt.innerHTML = device.deviceName;
    deviceSelector.appendChild(opt);
  });

  devicesSideEffects();
}

function devicesSideEffects() {
  // disable stuff here.

  let notificationText = (deviceSelector.options.length === 0) ? "No Jabra device found - Please insert a Jabra Device!" : "";
  errorMsg.innerText = notificationText;
}

export function setupApiClasses(apiClasses: any[]) {
  while (apiClassSelector.options.length > 0) {
    apiClassSelector.remove(0);
  }

  apiClasses.forEach(clazz => {
    const opt = document.createElement('option');
    opt.value = clazz.name;
    opt.innerHTML = clazz.name;
    apiClassSelector.appendChild(opt);
  });
}

export function setupApiMethods(meta: ClassEntry | undefined) {
  while (methodSelector.options.length > 0) {
    methodSelector.remove(0);
  }

  if (meta) {
    const sortedMethods = [...meta.methods].sort();
    sortedMethods.forEach(methodMeta => {
      var opt = document.createElement('option');
      opt.value = methodMeta.name;
      opt.innerHTML = methodMeta.name;
      methodSelector.appendChild(opt);
    });
  }
}


