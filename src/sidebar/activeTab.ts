import {isChromium} from '../compat';

/**
 * Tracks the tab the sidebar is looking at. Chromium only: it exists for the
 * inject button, which Firefox does not show.
 *
 * Requesting an optional permission is only allowed while a user gesture is
 * being handled, and awaiting `tabs.query` inside a click handler already loses
 * that gesture on Chromium. Keeping the current tab cached lets the inject
 * button call `permissions.request` synchronously.
 */
let activeTab: browser.tabs.Tab | undefined;

export function getActiveTab() {
  return activeTab;
}

export async function watchActiveTab() {
  if (!isChromium) return;
  browser.tabs.onActivated.addListener(async info => {
    activeTab = await browser.tabs.get(info.tabId).catch(() => undefined);
  });
  browser.tabs.onUpdated.addListener((_tabId, _changeInfo, tab) => {
    if (tab.active) {
      activeTab = tab;
    }
  });
  const tabs = await browser.tabs.query({active: true, currentWindow: true});
  if (tabs.length > 0) {
    activeTab = tabs[0];
  }
}
