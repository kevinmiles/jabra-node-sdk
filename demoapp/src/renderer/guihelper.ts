import { Notyf } from 'notyf';

import { DeviceType } from '@gnaudio/jabra-node-sdk';

// Setup client-side notifications:
export const notyf = new Notyf({duration:1500});

// References to our HTML elements.
export const versionInfoContainer = document.getElementById('versionInfoContainer') as HTMLParagraphElement;
export const testAppVersion = document.getElementById('testAppVersion') as HTMLSpanElement;
export const nodeSdkVersion = document.getElementById('nodeSdkVersion') as HTMLSpanElement;
export const electronHelperVersion = document.getElementById('electronHelperVersion') as HTMLSpanElement;
export const electronVersion = document.getElementById('electronVersion') as HTMLSpanElement;
export const nodeVersion = document.getElementById('nodeVersion') as HTMLSpanElement;
export const osType = document.getElementById('osType') as HTMLSpanElement;
export const nativeSdkVersion = document.getElementById('nativeSdkVersion') as HTMLSpanElement;

export const deviceSelector = document.getElementById('deviceSelector') as HTMLSelectElement;
export const ringBtn = document.getElementById('ring') as HTMLButtonElement;
export const unringBtn = document.getElementById('unring') as HTMLButtonElement;
export const offhookBtn = document.getElementById('offhook') as HTMLButtonElement;
export const onhookBtn = document.getElementById('onhook') as HTMLButtonElement;
export const muteBtn = document.getElementById('mute') as HTMLButtonElement;
export const unmuteBtn = document.getElementById('unmute') as HTMLButtonElement;
export const holdBtn = document.getElementById('hold') as HTMLButtonElement;
export const resumeBtn = document.getElementById('resume') as HTMLButtonElement;
export const errorMsg = document.getElementById('errorMsg') as HTMLSelectElement;

// Show version information for components in gui:
export function initVersionInfo(sdk_version_txt: string) {
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
  nativeSdkVersion.innerText = sdk_version_txt;

  (versionInfoContainer as any).style = "display: block";          
}

// An reference to the device we want to be talking to for the demo.
// Useful in case we have multiple jabra devices attached at the same time.
export let activeDemoDeviceId: number | undefined = undefined;
 
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

// Configures GUI depending on which Jabra devices are present.
export function setupDevices(devices: ReadonlyArray<DeviceType>) {
  while (deviceSelector.options.length > 0) {
    deviceSelector.remove(0);
  }

  devices.forEach(device => {
    var opt = document.createElement('option');
    opt.value = device.deviceID.toString();
    opt.innerHTML = device.deviceName;
    deviceSelector.appendChild(opt);
  });

  unringBtn.disabled = (devices.length === 0);
  ringBtn.disabled = (devices.length === 0);
  offhookBtn.disabled = (devices.length === 0);
  onhookBtn.disabled = (devices.length === 0);
  muteBtn.disabled = (devices.length === 0);
  unmuteBtn.disabled = (devices.length === 0);
  holdBtn.disabled = (devices.length === 0);
  resumeBtn.disabled = (devices.length === 0);

  let notificationText = (devices.length === 0) ? "No Jabra device found - Please insert a Jabra Device!" : "";
  errorMsg.innerText = notificationText;

  // Make sure device id is still valid if device list changes.
  if (activeDemoDeviceId === undefined || devices.every(d => d.deviceID !== activeDemoDeviceId)) {
    if (devices.length > 0) {
      // Auto-select first device if no valid already selected user device is active.
      activeDemoDeviceId = devices[0].deviceID;
    } else {
      activeDemoDeviceId = undefined;
    }
  }
}

// Let a new device be considered active if the user selects it in dropdown:
deviceSelector.onchange = ((e) => {
  activeDemoDeviceId = Number.parseInt(deviceSelector.value);
});

