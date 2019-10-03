import { Notyf } from 'notyf';

import { DeviceType } from '@gnaudio/jabra-node-sdk';

export const notyf = new Notyf({duration:1500});

export const deviceSelector = document.getElementById('deviceSelector') as HTMLSelectElement;

export const ringBtn = document.getElementById('ring') as HTMLButtonElement;
export const unringBtn = document.getElementById('unring') as HTMLButtonElement;
export const offhookBtn = document.getElementById('offhook') as HTMLButtonElement;
export const onhookBtn = document.getElementById('onhook') as HTMLButtonElement;
export const muteBtn = document.getElementById('mute') as HTMLButtonElement;
export const unmuteBtn = document.getElementById('unmute') as HTMLButtonElement;
export const holdBtn = document.getElementById('hold') as HTMLButtonElement;
export const resumeBtn = document.getElementById('resume') as HTMLButtonElement;

export const noDeviceFound = document.getElementById('noDeviceFound') as HTMLSelectElement;

// An reference to the device we want to be talking to for the demo.
// Useful in case we have multiple jabra devices attached at the same time.
export let activeDemoDeviceId: number | undefined = undefined;
 
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
    var div = document.createElement("div");
    var att = document.createAttribute("class");
    att.value = "wrapper";
    div.setAttributeNode(att);
    div.innerHTML = msg;
    var br = document.createElement("br");
    var list = document.getElementById("section");
    list!.insertBefore(br, list!.childNodes[0]);
    list!.insertBefore(div, list!.childNodes[0]);

    notyf.error(msg);
}

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
  noDeviceFound.innerText = notificationText;

  // Make sure device id is still valid if device list changes.
  if (activeDemoDeviceId === undefined || devices.every(d => d.deviceID !== activeDemoDeviceId)) {
    if (devices.length > 0) {
      // Auto-select first device if no valid already selected user device is active.
      activeDemoDeviceId = devices[0].deviceID;
    } else {
      activeDemoDeviceId = undefined;
    }
  }

  deviceSelector.onchange = ((e) => {
    activeDemoDeviceId = Number.parseInt(deviceSelector.value);
  });
}

