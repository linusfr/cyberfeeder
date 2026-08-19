import '../compat';
import {autoInject} from '../shared/inject';

/**
 * Chromium has no equivalent of Firefox's modifier-aware browserAction click
 * (`action.onClicked` receives only the tab), so the toolbar button is wired to
 * toggle the side panel natively and the Shift/Alt actions are offered as
 * buttons in the panel's settings tab instead. Note that `openPanelOnActionClick`
 * suppresses `action.onClicked` entirely - the two are mutually exclusive.
 */
chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true}).catch(e => console.warn('[background] could not set panel behavior', e));

/** Auto inject on user navigation */
chrome.tabs.onUpdated.addListener(handleUpdate);

/**
 * Unlike Firefox, Chromium reports a navigation's url and its load status in
 * separate onUpdated events, so waiting for both in one event never fires.
 */
function handleUpdate(tabId: number, changeInfo: chrome.tabs.OnUpdatedInfo, tab: chrome.tabs.Tab) {
  if (changeInfo.status !== 'complete') return;
  if (!tab.url) return;
  console.log('[background] new url', tab.url);
  autoInject(tabId, tab.url);
}
