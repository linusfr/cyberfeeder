export interface Animation<T> {
  type: string;
  target: Element;
  duration: string;
  style?: string;
  source: AnimationLocation;
  destination: AnimationLocation;
  metadata: T;
}

export interface AnimationLocation {
  element: Element;
  offsetX?: number;
  offsetY?: number;
}

export function createGhostContainer() {
  if (!document.querySelector('#ghosts')) {
    const container = document.createElement('div');
    container.id = 'ghosts';
    const css = 'pointer-events: none; position: absolute; top: 0; left: 0; overflow: hidden; width: 100%; height: 100%;';
    container.setAttribute('style', css);
    document.body.appendChild(container);
  }
}
