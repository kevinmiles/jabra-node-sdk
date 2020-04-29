import { createJabraApplication } from '../main/index';

createJabraApplication('A7tSsfD42VenLagL2mM6i2f0VafP/842cbuPCnC+uE8=').then((jabra) => {
  jabra.on('attach', (device) => {
    device.getImageThumbnailPathAsync().then(res => {
      console.log('getImageThumbnailPathAsync: ', res);
    });
  });
});
