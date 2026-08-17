import * as base from './base';
import * as debug from '../debug';

export const eventName = 'newRoom';
// if selector is narrower than this, it seems to be populated a bit too late
// and cyberfeeder will give up
const selector = '.lobby';
const lobbyObserver = new MutationObserver(roomHandler);

function menuWatcher(event: Event) {
  base.conditionalObserver({
    event,
    type: base.eventName,
    targetMode: 'container',
    observer: lobbyObserver,
    selector: selector,
    observeOptions: {characterData: true, subtree: true, childList: true},
    init: () => search(),
  });
}

export function watch() {
  document.addEventListener(base.eventName, menuWatcher);
  const localEvent = base.createNavigationEvent();
  if (localEvent) menuWatcher(localEvent);
}

export function stop() {
  document.removeEventListener(base.eventName, menuWatcher);
  lobbyObserver.disconnect();
}

export interface Room {
  type: 'newRoom';
  title: string;
  element: Element;
}

function roomHandler(mutations: MutationRecord[]) {
  for (const m of mutations) {
    if (m.target.nodeType !== Node.ELEMENT_NODE) continue;
    search(m.target as Element);
    m.addedNodes.forEach(node => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const element = node as Element;
      search(element);
    });
  }
}

function search(element?: Element) {
  let divs: NodeListOf<Element>;
  if (!element) {
    debug.log('[watchers/lobby] refreshing lobby highlighter');
    divs = document.querySelectorAll('.lobby .games .game-list .gameline');
  } else {
    divs = element.querySelectorAll(':scope .gameline');
  }
  divs.forEach(element => {
    const data = identifyRoom(element);
    if (!data) return;
    debug.log('[watchers/lobby] found a new lobby candidate');
    const event = new CustomEvent<Room>(eventName, {detail: data});
    document.dispatchEvent(event);
  });
}

function identifyRoom(element: Element) {
  if (!element.classList.contains('gameline')) return;
  const title = element.querySelector(':scope h4')?.textContent;
  if (!title) return;
  debug.log('[watchers/lobby] found a new lobby, dispatching');
  const data: Room = {
    type: 'newRoom',
    title: title,
    element,
  };
  return data;
}
