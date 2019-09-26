import { createJabraApplication, DeviceType, JabraType, jabraEnums, enumAPIReturnCode, ConfigParamsCloud } from '@gnaudio/jabra-node-sdk';

test('exported standard members ok', async () => {
    expect(createJabraApplication).toBeTruthy();
    expect(jabraEnums).toBeTruthy();
    expect(jabraEnums.enumAPIReturnCode).toBeTruthy();
    expect(enumAPIReturnCode).toBeTruthy();
    expect(DeviceType).toBeTruthy();
    expect(JabraType).toBeTruthy();
});
  