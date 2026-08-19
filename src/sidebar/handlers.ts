import {sendIt, saveUserToggles, saveCustom} from './operations';
import {getStyleUI, rebuildStyle} from './html';
import {getAndCacheCurrentScriptToggles, getStyles} from './data';
import * as operations from './operations';
import {injectAnywhere, reloadScripts} from '../shared/inject';
import {isChromium} from '../compat';
import {getActiveTab} from './activeTab';
import {TabType} from './types';

export async function registerHandlers() {
  registerStyleToggleEvent('style');
  registerScriptToggleEvent();
  registerCustomizeToggleEvent('style');
  registerCustomizeToggleEvent('script');
  registerCustomizeResetEvent('style');
  registerCustomizeResetEvent('script');
  registerCustomizeSaveEvent('style');
  registerCustomizeSaveEvent('script');
  registerBackupEvent();
  registerImportEvent();
  registerRebuildHandler();
  registerResetHandler();
  registerPurgeHandler();
  registerChromiumOperations();
  await registerMessageHandler();
}

/**
 * Activates when user changes CSS toggles
 */
function registerStyleToggleEvent(type: TabType) {
  const styleCheckboxes = document.getElementsByClassName(`${type}-enable`);
  for (let i = 0; i < styleCheckboxes.length; i++) {
    styleCheckboxes[i].addEventListener('change', async () => {
      const style = rebuildStyle(type);
      await saveUserToggles(type);
      await operations.sendIt(type, style);
    });
  }
}

function registerScriptToggleEvent() {
  const checkboxes = document.getElementsByClassName('script-enable');
  for (let i = 0; i < checkboxes.length; i++) {
    checkboxes[i].addEventListener('change', async () => {
      const style = rebuildStyle('script');
      await saveUserToggles('script');
      const toggles = await getAndCacheCurrentScriptToggles();
      await operations.sendIt('script', style, toggles);
    });
  }
}

/**
 * Activates when user toggles CSS customization
 */
function registerCustomizeToggleEvent(type: TabType) {
  const customCheckboxes = document.getElementsByClassName(`${type}-customize`);
  for (let i = 0; i < customCheckboxes.length; i++) {
    customCheckboxes[i].addEventListener('change', async () => {
      const element = customCheckboxes[i];
      const li = element.closest('li');
      const style = getStyleUI(li?.id, type);
      if (!style) {
        console.warn('Enable/disable target not found');
        return;
      }

      const {bundledStyles, userStyles} = await getStyles(type);
      style.textarea.disabled = !style.customize.checked;
      style.resetButton.disabled = !style.customize.checked;
      style.saveButton.disabled = !style.customize.checked;
      if (style.customize.checked) {
        // only enable editing but do not send the styles to jnet
        if (style.id in userStyles) {
          style.textarea.value = userStyles[style.id].css;
        }
      } else {
        // reset textarea to bundled style
        if (style.id in bundledStyles) {
          style.textarea.value = bundledStyles[style.id].css;
        } else {
          console.warn('bundled style not found, do not modify text area');
        }
      }
      await saveUserToggles(type);
      if (style.enable.checked) {
        await sendIt(type, rebuildStyle(type));
      }
    });
  }
}

/**
 * Activates when user presses "reset" on customization
 */
function registerCustomizeResetEvent(type: TabType) {
  const applyButtons = document.getElementsByClassName(`${type}-reset`);
  for (let i = 0; i < applyButtons.length; i++) {
    applyButtons[i].addEventListener('click', async () => {
      const element = applyButtons[i];
      const li = element.closest('li');
      const style = getStyleUI(li?.id, type);
      if (!style) {
        return;
      }
      const {bundledStyles} = await getStyles(type);
      if (style.id in bundledStyles) {
        style.textarea.value = bundledStyles[style.id].css;
      } else {
        console.info('Tried to revert to bundled style, but there was none.');
      }
    });
  }
}

/**
 * Activates when user presses "save" button on customization
 */
function registerCustomizeSaveEvent(type: TabType) {
  const applyButtons = document.getElementsByClassName(`${type}-save`);
  for (let i = 0; i < applyButtons.length; i++) {
    applyButtons[i].addEventListener('click', async () => {
      const element = applyButtons[i];
      const li = element.closest('li');
      const style = getStyleUI(li?.id, type);
      if (!style) {
        return;
      }
      await saveCustom(type, style);
      await saveUserToggles(type);
      if (style.enable.checked) {
        const style = rebuildStyle(type);
        await sendIt(type, style);
      }
    });
  }
}

function registerBackupEvent() {
  const button = document.getElementById('backup');
  if (!button) {
    console.error('Backup button not found');
    return;
  }
  button?.addEventListener('click', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storage = await browser.storage.local.get(null as any);
    const data = JSON.stringify(storage);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.id = 'download';
    a.href = url;
    a.download = 'cyberfeeder-backup.json';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function registerImportEvent() {
  const button = document.getElementById('import') as HTMLElement;
  const input = document.getElementById('importInput') as HTMLInputElement;
  if (!button || !input) {
    console.error('Import button not found');
    return;
  }
  button.addEventListener('click', async () => {
    let reloadNeeded = false;
    if (!input.files || input.files?.length === 0) {
      console.info('No files selected');
      return;
    }
    const file = input.files[0];
    if (file && file.type === 'application/json') {
      const content = await readFile(file);
      if (!content) {
        console.warn('failed to read loaded file');
        return;
      }
      try {
        const jsonData = JSON.parse(content);
        await browser.storage.local.set(jsonData);
        reloadNeeded = true;
      } catch (e) {
        console.debug(e);
        console.warn('Failed to parse JSON data');
      }
    }
    if (reloadNeeded) {
      browser.runtime.reload();
    }
  });
}

async function registerMessageHandler() {
  browser.runtime.onMessage.addListener(async message => {
    console.info('Got initialize request from jnet, sending style');
    if (message.action === 'init') {
      await sendIt('style', rebuildStyle('style'));
      await sendIt('script', rebuildStyle('script'));
    }
  });
}

function registerResetHandler() {
  const button = document.getElementById('settings-reset');
  if (!button) {
    console.warn("Couldn't find reset button");
    return;
  }
  button.addEventListener('click', async () => {
    await sendIt('style', '');
    await sendIt('script', '');
  });
}

function registerPurgeHandler() {
  const button = document.getElementById('settings-purge');
  if (!button) {
    console.warn("Couldn't find purge button");
    return;
  }
  button.addEventListener('click', async () => {
    await sendIt('style', '');
    await sendIt('script', '');
    await browser.storage.local.clear();
    browser.runtime.reload();
  });
}

/**
 * Chromium's toolbar button cannot report modifier keys, so the actions that are
 * Shift-click and Alt-click on Firefox are offered as buttons there instead.
 * The container stays hidden on Firefox, where those clicks already work.
 */
function registerChromiumOperations() {
  const container = document.getElementById('chromium-only');
  if (!container || !isChromium) {
    return;
  }
  container.hidden = false;

  const refresh = document.getElementById('settings-refresh');
  if (refresh) {
    refresh.addEventListener('click', () => reloadScripts());
  } else {
    console.warn("Couldn't find refresh button");
  }

  const inject = document.getElementById('settings-inject');
  if (!inject) {
    console.warn("Couldn't find inject button");
    return;
  }
  inject.addEventListener('click', async () => {
    const tab = getActiveTab();
    if (!tab) {
      console.warn('Could not find the current tab');
      return;
    }
    // Call this without awaiting anything first, so the click's user gesture is
    // still active when the optional permission is requested.
    const injected = await injectAnywhere(tab);
    if (!injected) return;
    await sendIt('style', rebuildStyle('style'));
    await sendIt('script', rebuildStyle('script'), await getAndCacheCurrentScriptToggles());
  });
}

function registerRebuildHandler() {
  const button = document.getElementById('settings-rebuild');
  if (!button) {
    console.warn("Couldn't find rebuild button");
    return;
  }
  button.addEventListener('click', async () => {
    await sendIt('style', rebuildStyle('style'));
    await sendIt('script', rebuildStyle('script'));
  });
}

function readFile(file: File): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result?.toString());
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
