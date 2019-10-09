# FAQ for Jabra Node.js SDK (BETA RELEASE)

This file lists a few commen questions/issues and answers

1. On Windows, why do I get an error like "Could not load the Visual C++ component "VCBuild.exe"
   when doing npm install of "@gnaudio/jabra-node-sdk" ?
   - Before doing npm install, please follow [setup directions](nodesdk/README.md#Pre-requisite)
   under NodeJS SDK pre-requisites.

2. Why do I not get all 'btnPress' events in my softphone ?
   - To get all 'btnPress', GN_HID must be enabled for supporting devices.
   See device.isGnHidStdHidSupportedAsync() and device.setHidWorkingStateAsync()

