# Changelog
All notable changes to this project will be documented in this file

### 2.0 SDK Beta notes (temporary beta process changes):
- Beta10 changes:
  - Fix for SetEqualizerParameters + parameter change.
  - Fix for GetErrorString when failing.

- Beta9 changes:
  - Changed devlog event to return a described object instead of string.

- Beta8 changes:
  - Fix RegisterPairingListCallback bug providing wrong data etc.
  - New shutdownServer argument to disposeAsync.
  - Fix restart bug and multiple frame support for jabra-electron-renderer-helper.

- Beta7 changes:
  - Bugfix for CheckForFirmwareUpdate, GetTimestamp, EnableEqualizer
  - Change parameter handling in testapp.
  - Added much more internal event logging.
  - Use PRODUCT_DIR for destination for native binaries.
  - Documentation fix (remote images for npm package).

- Beta6 changes:
  - Bugfixes for GetErrorString
  - Fix JDO native libs issue (Mac, Win)
  - Electron helper fix createApiClient resolving too early.
- Beta5 changes:
  - Bugfixes for unmuteAsync, setOnlineAsync and resumeAsync.

- Beta4 changes:
  - Various bugfixes.
  - Documentation improvements.
  - Improved test app.

- Beta3 changes:
  - Improved logging and extended it to jabra-electron-renderer-helper
  - Bugfixes and documentation fixes.
  - Improved error handling, added related JabraError types. 

- Beta2 changes:
  - All events/functions marked as TODO now implemented.
  - Renamed mute functions to muteAsync() and unmuteAsync() for consistency.
  - getAttachedDevices now returns an array instead of a map.
  - Misleading CTRs removed from meta.
  - events bugfix in jabra-electron-renderer-helper

### 2.0.0 - 2019
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
    - Some settings functions renamed, also now uses DeviceSettings as type.
    - Various bugfixes in typescript declarations.
    - Removed all FFI related artifacts, incl. constants and error codes.
  

### 1.0.5 (2017-02-27)
- Minor changes in documentation. 
    - Mentioned as a Beta release in README.
    - Cleanup of CHANGELOG

### 1.0.4 (2017-02-26)
- Beta public version for Winodws(SDK Version: 1.2.0.24) and Mac(SDK Version: 1.2.0.25)
- Minor changes in type definition file
- Removed package scoping


