

import { _JabraNativeAddonLog, AddonLogSeverity } from '@gnaudio/jabra-node-sdk';

test('native logging works', async () => {
    expect(_JabraNativeAddonLog).toBeTruthy();
    
    // Verify that we can call method without exceptions.
    _JabraNativeAddonLog(AddonLogSeverity.info, "TESTING", "test function called");
});