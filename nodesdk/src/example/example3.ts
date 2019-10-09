import { createJabraApplication, JabraError } from '../main/index';

(async () => {
    let jabra = await createJabraApplication('A7tSsfD42VenLagL2mM6i2f0VafP/842cbuPCnC+uE8=');

    await jabra.scanForDevicesDoneAsync(); // Wait for all pre-attached devices to be scanned.

    const deviceInstanceList = jabra.getAttachedDevices(); //returns the list of devices
    if (deviceInstanceList.length<2) {
        throw new Error("Please make sure 2 jabra devices are attached");
    }

    const firstDevice = deviceInstanceList[0]
    await firstDevice.ringAsync();

    const secondDevice = deviceInstanceList[1];
    await secondDevice.ringAsync();

    // Disponse jabra sdk to enable node process to shutdown.
    await jabra.disposeAsync();
})();

