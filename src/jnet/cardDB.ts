/** Piggyback on NRDB card database used by jnet */
import * as debug from './debug';

let cached: CyberfeederDatabase | void | undefined;

export type CardType = Card | Agenda;
export interface Card {
  code: string;
  faction: string;
  images: {en: {default: {stock: string}}};
  normalizedtitle: string;
  side: 'Corp' | 'Runner';
  title: string;
  type: 'Identity' | 'Resource' | 'Hardware' | 'Event' | 'Program' | 'Upgrade' | 'Agenda' | 'Operation' | 'Asset' | 'Ice';
}

export interface Agenda extends Card {
  advancementcost: number;
  agendapoints: number;
  type: 'Agenda';
}

interface JNetDatabase {
  lang: string;
  cards: CardType[];
  version: number;
}

interface CyberfeederDatabase {
  cards: {[key: string]: CardType};
}

export async function load() {
  if (cached) {
    debug.log('[card] card db is already cached, skipping load');
    return;
  }
  const jnetDB = getJnetDatabase();
  if (jnetDB) {
    cached = deriveCyberfeederDB(jnetDB);
    debug.log('[card] loaded localstorage based database');
    return;
  }
  const httpDB = await getJnetHttpDatabase();
  if (httpDB) {
    cached = deriveCyberfeederDB(httpDB);
    debug.log('[card] loaded HTTP based database');
    return;
  }
  debug.warn('[card] card db failed to load');
}

export function query(name: string): CardType | null {
  if (!cached) {
    debug.warn('[card] There is no card database, cannot query card');
    return null;
  }
  return cached.cards[name];
}

function getJnetDatabase() {
  const textData = localStorage.getItem('cards');
  if (!textData) {
    debug.warn('[card] Could not find jnet DB');
    return;
  }
  return JSON.parse(textData) as JNetDatabase;
}

async function getJnetHttpDatabase() {
  try {
    const response = await fetch(`https://${location.hostname}/data/cards`);
    const database = await response.json();
    const sanity = database[1];
    if (sanity.faction && sanity.title) {
      return {
        lang: 'compat',
        cards: database,
        version: -1,
      };
    } else {
      debug.warn('[cards] database acquired, but it is suspiciouly small, returning empty list instead');
      return;
    }
  } catch (e) {
    debug.warn('[card] tried to fetch HTTP card database but it failed');
    debug.warn(e);
  }
  return;
}

/** convert jnet's index-based db to text key based db */
function deriveCyberfeederDB(jnetDB: JNetDatabase) {
  const cyberfeederDB: CyberfeederDatabase = {
    cards: {},
  };
  for (const card of jnetDB.cards) {
    cyberfeederDB.cards[card.title] = card;
  }
  return cyberfeederDB;
}
