# Jabra Node.js SDK - BETA RELEASE

This is the monorepo for the new Jabra [Node.js](https://nodejs.org) SDK (a [native jabra sdk](https://developer.jabra.com/site/global/sdks/overview/index.gsp) wrapper) and related helpers, demos and tests.

This new Jabra Node.js SDK is based on [N-API](https://nodejs.org/api/n-api.html) and is thus Application Binary Interface (ABI) stable across versions of Node.js. It is also maintained as a core part of node.js and know to work more easily with ElectronJs (https://electronjs.org/), including latest version 6.

For more information, refer to the [individual README files](#Project-Contents) in each project folder linked below or the common references at the bottom of this page.

**Warning: ALL software released here is in BETA (ALPHA for demo/test). All software can be considered unstable, possibly untested and might be updated at any time. Use at your own risk. If you want to use something stable, please await completion of our development and Q/A process OR consider using our previous ["jabra"](https://www.npmjs.com/package/jabra) package (util it will be deprecated at a later stage).**

# Project contents
- [NODE.JS SDK NPM PROJECT](nodesdk/README.md) (MAIN PROJECT)
- [Electron renderer helper npm project (optional package)](electronrendererhelper/README.md)
- [Demo app project](demoapp/README.md)
- [Test app project](testapp/README.md)
- [Integration test project](integrationtest/README.md)

# Common references
- [Changelog](CHANGELOG.md)
- [License](LICENSE.md)

# Bug reports
If you find any bug or have any suggestion then fill in the form at [Jabra developer support site](https://developer.jabra.com/support/) with below details:

1. Bug description with steps to reproduce the issue.
2. Console log after enabling debug mode for this module, see [Debugging and Logging](nodesdk/README.md#debugging-and-logging) section for more.
3. File logs, see [Debugging and Logging](nodesdk/README.md#debugging-and-logging) section for more.

# Credits

Orginal GN authors (from before source was released on github):
- Morten Frederiksen
- Steffen Klausen
- Sudeep Kumar
- Morten M. Christensen

