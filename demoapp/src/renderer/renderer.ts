// This file is included by the index.html file and will be executed in the renderer process for that window.
console.log('renderer.js loaded');

import { createApiClient } from '@gnaudio/jabra-electron-renderer-helper';
import { enumDeviceBtnType, DeviceType, JabraType, ClassEntry, JabraEventsList, DeviceEventsList, enumHidState } from '@gnaudio/jabra-node-sdk';

import { initVersionInfo, activeDemoDeviceId, notyf, showError, setupDevices, 
         ringBtn, offhookBtn, onhookBtn, muteBtn, unmuteBtn, holdBtn, resumeBtn, unringBtn } from './guihelper';

// Create a API client proxy for the JabraType api class, that allows the jabra client code
// to transparently access the Jabra api. Behind the scenes, this is accompished by internal 
// IPC messages between the client and a Jabra API server running in the main process.
createApiClient(window.electron.ipcRenderer).then((jabra) => {
    console.log("jabraApiClient initialized");

    // Update GUI with version info.
    jabra.getSDKVersionAsync().then((v) => {
        console.log("Found native sdk v" + v);
        initVersionInfo(v);
    });


    let devices = jabra.getAttachedDevices();
    setupDevices(devices);

    function executeOnActiveDemoDevice( callback: (device: DeviceType) => Promise<any>) {
        let activeDevice = devices.find(d => d.deviceID == activeDemoDeviceId);
        if (activeDevice) {
            callback(activeDevice).then((v) => {
                // Callback operation succeeded
            }).catch((err) => {
                notyf.error(err);
            });
        } else {
            notyf.error("please insert a device and try again");
        }
    }

    jabra.on('attach', (device) => {
        notyf.success(device.deviceName + " attached");

        device.isGnHidStdHidSupportedAsync().then((supported) => {
            if (supported) {
                return device.setHidWorkingStateAsync(enumHidState.GN_HID);
            } else {
                return Promise.reject(new Error("GN protocol not supported"));
            }
        }).catch( (e) => {
            showError("Could not switch to GN protocol for device " + device.deviceName +". Please try another device as some functions in this demo may not work.");
        });

        device.on("btnPress", (btnType: enumDeviceBtnType, value: boolean) => {
           if (activeDemoDeviceId === device.deviceID) {
            let msg = getBtnMessageEventDescription(device.deviceID, btnType, value);
            notyf.success(msg);
           }
        });

        devices = jabra.getAttachedDevices();
        setupDevices(devices);
    });

    jabra.on('detach', (device) => {
        notyf.success(device.deviceName + " detached");
        devices = Array.from(jabra.getAttachedDevices().values());
        setupDevices(devices);
    });

    ringBtn.onclick = () => {
        executeOnActiveDemoDevice((device) => device.ringAsync());
    }

    unringBtn.onclick = () => {
        executeOnActiveDemoDevice((device) => device.unringAsync());
    }
    

    offhookBtn.onclick = () => {
        executeOnActiveDemoDevice((device) => device.offhookAsync());
    }

    onhookBtn.onclick = () => {
        executeOnActiveDemoDevice((device) => device.onhookAsync());
    }

    muteBtn.onclick = () => {
        executeOnActiveDemoDevice((device) => device.muteAsync());
    }

    unmuteBtn.onclick = () => {
        executeOnActiveDemoDevice((device) => device.unmuteAsync());
    }

    holdBtn.onclick = () => {
        executeOnActiveDemoDevice((device) => device.holdAsync());
    }

    resumeBtn.onclick = () => {
        executeOnActiveDemoDevice((device) => device.resumeAsync());
    }
}).catch( (err) => {
    console.error("Could not initialize Jabra Api client : " + err);
    showError(err);
});

function getBtnMessageEventDescription(deviceId: number, btnType: enumDeviceBtnType, value: boolean) : string {
    switch (btnType) {
        case enumDeviceBtnType.Mute: return value ? "The device requested to be muted" : "The device requested to be unmuted"; break;
        case enumDeviceBtnType.Online: return value ? "Online event from device" : "Offline event from device"; break;
        case enumDeviceBtnType.OffHook: return value ? "Accept call event from the device (offhook)" : "End call event from the device (onhook)"; break;
        case enumDeviceBtnType.LineBusy: return value ? "Line busy event from device" : "Line idle event from device"; break;
        case enumDeviceBtnType.RejectCall: return "Reject event from the device"; break;
        case enumDeviceBtnType.Flash: return "Flash event from the device"; break;

        default: return enumDeviceBtnType[btnType] + " event from device";
    }
}




