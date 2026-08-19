/**
 * Chromium-based browsers (Chrome, Brave, Edge, Vivaldi) expose the extension
 * API as `chrome` and provide no `browser` global. Every API this extension
 * uses is promise-based in Chromium MV3, so aliasing the global is enough to
 * run the shared code on both engines - no polyfill needed.
 *
 * `self` rather than `globalThis`, because it is defined in all three contexts
 * this runs in (content script, extension page, service worker) and keeps the
 * declared node engine range valid.
 *
 * Entry points must import this before any module that touches `browser`.
 */
const globals = self as unknown as {browser?: Record<string, unknown>; chrome?: Record<string, unknown>};

if (!globals.browser && globals.chrome) {
  globals.browser = globals.chrome;
}

/**
 * Chromium lacks `sidebarAction`, which is how the sidebar is opened and closed
 * on Firefox. Features that only exist on one engine are gated on this.
 */
export const isChromium = !globals.browser?.sidebarAction;
