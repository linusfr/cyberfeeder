import * as debug from '../debug';
import * as command from '../watchers/command';

export function enable() {
  document.addEventListener(command.clickEvent, handler);
}

export function disable() {
  document.removeEventListener(command.clickEvent, handler);
}

function handler(e: Event) {
  const event = e as CustomEvent<command.CommandPanelClick>;
  if (!event.detail || event.detail.type !== command.clickEvent) return;
  if (event.detail.key === 'game_draw' || event.detail.text === 'Draw') {
    temporarilyDisable(event.detail.element);
  }
}

function temporarilyDisable(e: Element) {
  debug.log('[slowDraw] clicked draw, disabling button');
  e.classList.add('cyberfeeder-disabled');
  setTimeout(() => {
    e.classList.remove('cyberfeeder-disabled');
  }, 800);
}
