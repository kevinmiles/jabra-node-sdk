// This file is included by the index.html file and will
// be executed in the renderer process for that window.
console.log('renderer.js loaded');

import { createApiClient } from '../../renderer/index';
import { JabraType, ClassEntry, JabraEventsList, DeviceEventsList } from '@gnaudio/jabra-node-sdk';

createApiClient(window.electron.ipcRenderer).then((client) => {
    console.log("jabraApiClient initialized");

    client.on('attach', (device) => {
        console.log("DEVICE ATTACHED " + JSON.stringify(device, null, 2));

        console.log("device name is " + device.deviceName);
        console.log("ESN is " + device.ESN);

        device.getSerialNumberAsync().then((sn) => {
            console.log("Serial number is " + sn);
        });
    });

    client.on('detach', (device) => {
        console.log("DEVICE DETACHED " + JSON.stringify(device, null, 2));
    });


    client.setSoftphoneReadyAsync(false).then(() => {
        console.log("GOT setSoftphoneReadyAsync"); 
    }).catch ((err) => {
        console.log("GOT setSoftphoneReadyAsync ERROR " + err);
    });

}).catch( (err) => {
    console.error("Could not initialize Jabra Api client : " + err);
});






