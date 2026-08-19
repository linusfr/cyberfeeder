import '../compat';
import {getAndCacheCurrentScriptToggles, initializeLocalStorage} from './data';
import * as html from './html';
import * as operations from './operations';
import {registerHandlers} from './handlers';
import {watchActiveTab} from './activeTab';

/**
 * Loading script for sidebar
 */
document.addEventListener('DOMContentLoaded', async () => {
  await initializeLocalStorage();
  await watchActiveTab();
  await html.buildSidebar('style');
  await html.buildSidebar('script');
  await html.setVersion();
  await registerHandlers();
  await operations.sendIt('style', html.rebuildStyle('style'));
  const toggles = await getAndCacheCurrentScriptToggles();
  await operations.sendIt('script', html.rebuildStyle('script'), toggles);
});
