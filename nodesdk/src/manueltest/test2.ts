import {
    createJabraApplication, DeviceType, JabraType, jabraEnums,
    _getJabraApiMetaSync, _JabraNativeAddonLog, AddonLogSeverity, enumRemoteMmiType, enumRemoteMmiInput, enumRemoteMmiPriority
} from '../main/index';

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

        jabra.on('attach', async (device: DeviceType) => {
            console.log(device.deviceName);
            
            await device.getRemoteMMIFocusAsync(
                enumRemoteMmiType.MMI_TYPE_MFB, 
                enumRemoteMmiInput.MMI_ACTION_NONE, 
                enumRemoteMmiPriority.MMI_PRIORITY_HIGH
            ).catch(err => console.log(err));
        
            await device.releaseRemoteMmiFocusAsync(enumRemoteMmiType.MMI_TYPE_DOT3).catch(err => console.log(err));                      
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
