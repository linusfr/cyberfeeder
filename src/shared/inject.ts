/**
 * Injection logic shared by the Firefox and Chromium background entry points,
 * and by the Chromium-only buttons in the sidebar's settings tab.
 */

/** Origin match pattern for a tab, used when asking for optional permissions. */
export function getOrigin(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}/*`;
  } catch (e) {
    return undefined;
  }
}

/** Tell an already running Cyberfeeder instance to rebuild its script features. */
export function reloadScripts() {
  browser.tabs
    .query({active: true, currentWindow: true})
    .then(async tabs => {
      if (tabs.length > 0 && tabs[0].id !== undefined) {
        browser.tabs.sendMessage(tabs[0].id, {action: 'refresh'}).catch();
      }
    })
    .catch(() => console.warn('Could not send style to Jnet. Is jnet open?'));
}

/**
 * Ask for permission on the current host and inject Cyberfeeder into it.
 * Must be called synchronously from a user gesture, as `permissions.request`
 * is only allowed while one is being handled.
 */
export async function injectAnywhere(tab: {id?: number; url?: string}) {
  const origin = getOrigin(tab.url);
  if (tab.id === undefined || !origin) {
    console.warn('could not find currently open tab id');
    return false;
  }
  console.log('[cyberfeeder] Asking permission for', origin);
  const granted = await browser.permissions.request({origins: [origin]});
  if (!granted) {
    console.log('[cyberfeeder] permission was declined, nothing to do.');
    return false;
  }
  await inject(tab.id);
  return true;
}

/**
 * Inject Cyberfeeder into a tab the user has already granted permission for,
 * unless an instance is running there already.
 */
export async function autoInject(tabId: number, url: string | undefined) {
  const origin = getOrigin(url);
  if (!origin) return;
  if (await isRunning(tabId)) {
    console.log('[background] Cyberfeeder is already running');
    return;
  }
  console.log('[background] Checking permission...');
  const hasPermission = await browser.permissions.contains({origins: [origin]});
  if (!hasPermission) {
    console.log("[background] don't have permission, nothing to do.");
    return;
  }
  console.log('[background] Have permission, injecting Cyberfeeder');
  await inject(tabId);
}

function inject(tabId: number) {
  return browser.scripting.executeScript({
    target: {tabId: tabId},
    files: ['js/jnet.js'],
  });
}

async function isRunning(tabId: number) {
  try {
    return !!(await browser.tabs.sendMessage(tabId, {action: 'ping'}));
  } catch (e) {
    return false;
  }
}
