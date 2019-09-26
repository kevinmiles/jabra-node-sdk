
// Import normal stuff:
import { createJabraApplication, DeviceType, JabraType, jabraEnums, enumAPIReturnCode, ConfigParamsCloud } from '@gnaudio/jabra-node-sdk';

test('init, version and clean dispose', async () => {
  let config: ConfigParamsCloud = {
    blockAllNetworkAccess: true
  };

  let app = await createJabraApplication('A7tSsfD42VenLagL2mM6i2f0VafP/842cbuPCnC+uE8=', config);
  
  expect(app).toBeTruthy();
  
  let ver = await app.getSDKVersionAsync();
  console.log("Sucessfully initialized jabra app for sdk version " + ver);

  expect(ver).toBeTruthy();

  await app.disposeAsync();
});


