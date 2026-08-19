# Cyberfeeder

This is a browser extension that adds new scripts and stylesheet into jinteki.net.
It runs on Firefox and on Chromium engines (Chrome, Brave, Edge, Vivaldi).

Cyberfeeder is a free software licensed under GPLv3. Exceptions are listed in LICENSE.DEPENDENCY file.

The extension aims to be:
- Plug and playable.
- Good for reading board states intuitively.
- Easy to integrate into jnet.

# Install

- Firefox: install from [addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/cyberfeeder/).
- Chromium engines: there is no web store listing, so build it and load it
  unpacked - `npm run build:chromium`, then open the browser's extensions page,
  enable developer mode, choose "Load unpacked" and select the `app` directory.
  Open the panel from the toolbar icon.

# Bulid and test instructions
- Instructions based on Fedora.
- Install build dependencies: `sudo dnf install sass tsc npm nodejs web-ext`.
- `npm install` to setup project
- `npm run build` to run the build script (build.sh)
- `cd` into `app` and Test using `npm run start`
- go to `jinteki.net`, login, navigate to `Play`, and click `Load replay`, select the `replay.json` file in the root of the project and load a replay (attached as replay.json) and click `Start Replay`. Test the application as you see the replay. (you can use arrow keys to navigate game steps.)

# Chromium build (Chrome, Brave, Edge, Vivaldi)

The same source builds a Manifest V3 extension for Chromium engines. The two
manifests live in `manifests/`, and the build copies the one for the target into
`app/manifest.json`, so `npm run build` still produces the Firefox extension.

- `npm run build:chromium` to build - see Install above for loading it - or
  `npm run start:chromium` to launch a temporary profile with it loaded.
- `npm run package:chromium` writes `build/extension-chromium.zip`.

Two differences are forced by the platform:

- Chromium's `action.onClicked` reports no modifier keys, so the toolbar button
  toggles the side panel and the Shift-click (reload script features) and
  Alt-click (inject outside of jinteki.net) actions appear as buttons in the
  panel's settings tab. They stay hidden on Firefox.
- Those buttons get no `activeTab` grant, so the Chromium manifest asks for
  `tabs` in order to read the current tab's URL when requesting permission for
  a host. The Firefox manifest is unchanged.

# Used versions (for Mozilla reviewer)
- Fedora Spin Sway (version 42)
- npm 10.9.3
- node v22.19.0,
- tsc Version 5.2.2
- sass 1.69.0 compiled with dart2js 3.1.3
- web-ext 7.7.0
