/// <reference path="../main/index.ts" />

const j = require("../main/index");

j.createJabraApplication('A7tSsfD42VenLagL2mM6i2f0VafP/842cbuPCnC+uE8=').then((jabra) => {
    jabra.on('attach', (device) => {
        console.log('Press any key on Jabra device ' + device.deviceName);
        // If you are creating a softphone, consider using GN protocol when device supports it.
        // E.g. device.setHidWorkingStateAsync(j.enumHidState.GN_HID);
        device.on('btnPress', (btnType, btnValue) => {
          console.log('New input from device is received: ', j.enumDeviceBtnType[btnType], btnValue);
        });
    });    
});
