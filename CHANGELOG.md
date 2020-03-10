# Changelog
All notable changes to this project will be documented in this file

### General

Latest v3.0.0 release is an interim production release for node.js on Windows that specifically targets an issue where code in the Jabra core libraries can cause the client app to incurr a 100% CPU load, making the application inoperable.

This release changes the underlying core library from an older v1.7.9 to the latest production release 1.8.3.

In addition to fixing the CPU-load issue, the latest version of the core library also includes a large number of bug-fixes and general improvements that results in faster operation and much improved stability.

Please note that even though the node.js wrapper layer in v3.0.0 is almost identical to one in v2.0.0, the upgrade of the core library from v1.7 to v1.8 may mean that you can experience the need for minor changes to your application logic.

V3.0.0 production version is code-wise identical to v3.0.0-beta1. If you already have integrated the v3.0.0-beta1, you should not experience any need for changes.

--------------------------------

### v3.1.0-beta.1
- Upgraded embedded native "C" sdk to v1.8.7.2.
- Added various new APIs for above "C" sdk, incl. reboot, locking etc.
- Added support for detecting non-Jabra devices (new optional argument to createJabraApplication).
- Updated related electron helper JabraApiServerFactory.create method arguments (optional package but breaking change if used).

### v3.0.0 - (2019-2-28)
- Upgraded embedded native "C" sdk to v1.8.3.10 which fixes the following:
  - Sometimes, core library functions could cause 100% CPU load on Windows clients.
  - Inserting or removing chorded headsets sometime could cause host application to crash
- Removed getLastFirmwareUpdateErrorInfoAsync (no longer supported by "C" sdk).
- Versioning scheme documented, beta disclaimer updated.

For other minor functional changes/updates, see release notes for v1.8.3 on developer.jabra.com

Disclaimer: Exceptionally, this release is only validated for Windows. Mac and Linux core library versions do not suffer from the 100% CPU utilisation issue. We therefore recommend that you for production use stay on v2.0.0 for those platforms, until the next general relase is made for all platforms.

Known issues: 
  - Third party products can't be recognized by NodeJS SDK. Non-jabra headsets are no longer visible through the API, as this option is turned off be default in new version of the underlying core library.
  - Speak 710 connected via Link 370 can't set settings (also present in v2.0.0).
  - API function enableEquailzerAsync() do not work as expected (also present in v2.0.0).

Device support:
The device support is identical to the one for Windows SDK v1.8.3.10, but please note that this release of the node.js SDK has only been validation-tested with the following devices:

- Biz 2400 II
- Engage 50
- Engage 75
- Evolve 65t
- Evolve 75 / Link 370
- Speak 710 / Link 370

### v2.0.0 - (2019-12-10)
- New npm package with gnaudio scope "@gnaudio/jabra-node-sdk" that replaces previous "jabra" and "jabra-dev" packages.
- New optional "@gnaudio/jabra-electron-renderer-helper" to make secure client-side access to Jabra api much easier from Electron.

- Complete rewrite in typescript based on N-API (Next generation APIs for Node.js)
  Provided API is ~95% identical but there are few breaking changes and bugfixes such as:
    - The default initializer function export (antipattern) is removed!
      The initializer function is now a plain function export called "createJabraApplication" that unlike the previous function 
      returns a promise which resolves when the sdk is initialized
      (See examples for new usage syntax).
    - Added scanForDevicesDoneAsync async on JabraType and removed similar sync function on DeviceType.
    - device deattach event takes a DeviceType as single argument.
    - getAttachedDevices now returns an array instead of a map.
    - Changed devlog event to return a described object instead of string.
    - Some settings functions renamed, also now uses DeviceSettings as type.
    - Various bugfixes in typescript declarations.
    - Removed all FFI related artifacts, incl. constants and error codes.

- Known important issues: 
    - This version will nondeterministicly produce 100% CPU load on some Windows machines in some 
      CC scenarios. We aim to identify and fix this issue in an upcomming beta release.
                

### v1.0.5 (2017-02-27)
- Minor changes in documentation. 
    - Mentioned as a Beta release in README.
    - Cleanup of CHANGELOG

### v1.0.4 (2017-02-26)
- Beta public version for Winodws(SDK Version: 1.2.0.24) and Mac(SDK Version: 1.2.0.25)
- Minor changes in type definition file
- Removed package scoping


