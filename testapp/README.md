Jabra Node.js Test App

This is an advanced test application that allows detailed testing of individual API calls. The application
is intended for testing and experimenting with the API.

To run the application open a command shell and execute the following:

```
npm install
npm run start
```

## Options

The test application accepts the following command line options:
--nonJabraDeviceDectection=true/false (default is false)
--blockAllNetworkAccess=true/false (default is false)
--baseUrl_capabilities=string
--baseUrl_fw=string
--proxy=string

To overrride defaults specify when starting test like this (note the extra '--' to avoid having
the script options being used by npm itself):
```
npm run start -- --nonJabraDeviceDectection=true
```
