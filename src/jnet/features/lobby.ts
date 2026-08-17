import * as lobby from '../watchers/lobby';
import * as debug from '../debug';

export function enable() {
  document.addEventListener(lobby.eventName, processRoomName);
}

export function disable() {
  document.removeEventListener(lobby.eventName, processRoomName);
}

function processRoomName(e: Event) {
  const event = e as CustomEvent<lobby.Room>;
  if (event.detail.type !== lobby.eventName) return;

  debug.log('[features/lobby] new room detected');
  highlightDeviation(event.detail);
  highlightPrivate(event.detail);
}

function highlightDeviation(data: lobby.Room) {
  if (!data.title.includes("'s game")) {
    debug.log('[features/lobby] found deviation, highlighting');
    data.element.classList.add('cyberfeeder-room-deviation');
  }
}

function highlightPrivate(data: lobby.Room) {
  if (data.title.includes('[PRIVATE]')) {
    debug.log('[features/lobby] found private, highlighting');
    data.element.classList.add('cyberfeeder-room-private');
  }
}
