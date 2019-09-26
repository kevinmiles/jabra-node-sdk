
import { JabraType, ClassEntry, getJabraApiMetaSync, ConfigParamsCloud, 
         createJabraApplication } from '@gnaudio/jabra-node-sdk';

test('metaSync returns values', async () => {
      let meta = getJabraApiMetaSync();
      
      expect(meta).toBeTruthy();
      expect(meta.length>0).toBeTruthy();
     
});

test('api meta returns value', async () => {
      let config: ConfigParamsCloud = {
        blockAllNetworkAccess: true
      };
    
      let app = await createJabraApplication('A7tSsfD42VenLagL2mM6i2f0VafP/842cbuPCnC+uE8=', config);
      
      expect(app).toBeTruthy();
      
      let meta = app.getMeta();    
      expect(meta).toBeTruthy();
      expect(meta.name).toBe(JabraType.name);
    
      await app.disposeAsync();
});