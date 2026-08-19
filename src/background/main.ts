import '../compat';
import {autoInject, injectAnywhere, reloadScripts} from '../shared/inject';

/**
 * Open sidebar when clicking the extension logo on the addons list
 */
browser.browserAction.onClicked.addListener(handleClick);

/**
 * Open sidebar when clicking the extension logo on the URL bar
 * 0 = left
 * 1 = middle
 */
browser.pageAction.onClicked.addListener(handleClick);

/** Auto inject on user navigation */
browser.tabs.onUpdated.addListener(handleUpdate);

function handleClick(tab: browser.tabs.Tab, click?: browser.pageAction.OnClickData | browser.browserAction.OnClickData) {
  if (!click) return;
  if (click.button !== 0) return;
  if (click.modifiers.length === 0) {
    browser.sidebarAction.open();
    return;
  }
  if (click.modifiers.includes('Ctrl')) {
    browser.sidebarAction.close();
    return;
  }
  if (click.modifiers.includes('Shift')) {
    reloadScripts();
    return;
  }
  if (click.modifiers.includes('Alt')) {
    injectAnywhere(tab);
  }
}

function handleUpdate(tabId: number, changeInfo: browser.tabs._OnUpdatedChangeInfo, tab: browser.tabs.Tab) {
  // ignore all events other than change in url
  if (!changeInfo.url) return;
  if (changeInfo.status !== 'complete') return;
  console.log('[background] new url', changeInfo.url);
  autoInject(tabId, tab.url);
}
