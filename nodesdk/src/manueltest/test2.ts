import { createJabraApplication, DeviceType, JabraType, jabraEnums, 
         _getJabraApiMetaSync, _JabraNativeAddonLog, AddonLogSeverity } from '../main/index';

(async () => {
    try {
        let jabra = await createJabraApplication('A7tSsfD42VenLagL2mM6i2f0VafP/842cbuPCnC+uE8=')

        let meta = _getJabraApiMetaSync();
        // console.log("Got Jabra meta " + JSON.stringify(meta, null, 2));

        _JabraNativeAddonLog(AddonLogSeverity.info, "test2", "this is a test");

        jabra.getSDKVersionAsync().then(v => {
            console.log("SDK version is '" + v + "'");
        }).catch(err => {
            console.error("'get sdk version failed : " + err);
            console.log('get sdk version failed with error code : ' + err.code || "undefined"); 
        });

        jabra.on('attach', (device: DeviceType) => {
            console.log("Device attached with device " + JSON.stringify(device));

            device.on('onDevLogEvent', (event) => {
                console.log("Devlog event is '" + JSON.stringify(event, null, 3) + "'");
            });
        });

        jabra.on('detach', (device: DeviceType) => {
            console.log('Device detached with device ', JSON.stringify(device));
            jabra.disposeAsync();
        });
    } catch (err) {
        console.error("Got exception err " + err);
        console.log('get exception error code : ' + err.code || "undefined"); 
    }
})();


