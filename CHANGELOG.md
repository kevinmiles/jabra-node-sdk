# Changelog
All notable changes to this project will be documented in this file

### 2.0.0 - 2019
- New npm package with gnaudio scope "@gnaudio/jabra-node-sdk" that replaces previous "jabra" and "jabra-dev" packages.
  Complete rewrite in typescript based on N-API (Next generation APIs for Node.js)
  Provided API is ~95% identical but there are few breaking changes and bugfixes such as:
    - The default initializeer function export (antipattern) is removed!
      The initializer function is now a plain function export called "createJabraApplication" that unlike the previous function 
      returns a promise which resolves when the sdk is initialized
      (See examples for new usage syntax).
    - Added scanForDevicesDoneAsync async on JabraType and removed similar sync function on DeviceType.
    - device deattach event takes a DeviceType as single argument.
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


