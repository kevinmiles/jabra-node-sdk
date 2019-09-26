import { createJabraApplication } from '../main/index';

(async () => {
    let jabra = await createJabraApplication('A7tSsfD42VenLagL2mM6i2f0VafP/842cbuPCnC+uE8=');

    let deviceIDList: number[] = [];

    jabra.on('attach', (device) => {
        deviceIDList.push(device.deviceID);
    });
    
    jabra.on('detach', (device) => {
        //logic to remove this deviceID from deviceIDList array
    })

    await jabra.scanForDevicesDoneAsync(); // Wait for all pre-attached devices to be scanned.

    // suppose at some time, deviceIDList = [1, 3, 5]

    const deviceInstanceList = jabra.getAttachedDevices(); //returns the list(Map data structure) of devices
    if (deviceInstanceList.size!=2) {
        throw new Error("Please make sure two jabra devices are attached");
    }

    const device3 = deviceInstanceList.get(deviceIDList[1])!; //get device instance whose deviceID=3
    await device3.ringAsync(); //ring device3

    const device1 = deviceInstanceList.get(deviceIDList[0])!; //get device instance whose deviceID=1
    await device1.ringAsync(); //ring device1

    // Disponse jabra sdk to enable node process to shutdown.
    await jabra.disposeAsync();
})();

