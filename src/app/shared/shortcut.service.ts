import { Injectable } from '@angular/core';
import { fromEvent, Observable, Subscription } from 'rxjs';

/**
 * Defines a key, combined with modifiers
 */
export class Shortcut {
  private _key: string;
  private _ctrl = false;
  private _alt = false;
  private _shift = false;

  constructor(key: string, mod?: string) {
    this._key = key;
    if (mod) {
      this._ctrl = mod.includes('ctrl');
      this._alt = mod.includes('alt');
      this._shift = mod.includes('shift');
    }
  }

  get key(): string { return this._key; }
  get ctrl(): boolean { return this._ctrl; }
  get alt(): boolean { return this._alt; }
  get shift(): boolean { return this._shift; }

  matches(event: KeyboardEvent): boolean {
    return this.key === event.key
      && this._ctrl === event.ctrlKey
      && this._shift === event.shiftKey
      && this._alt === event.altKey;
  }

  equals(o: Shortcut) {
    return o != null
      && this._key === o._key
      && this._ctrl === o._ctrl
      && this._alt === o._alt
      && this._shift === o._shift;
  }

  toString(): string {
    const parts = [];
    if (this._ctrl) {
      parts.push('ctrl');
    }
    if (this._alt) {
      parts.push('alt');
    }
    if (this._shift) {
      parts.push('shift');
    }
    parts.push(this.key);
    return parts.join(' + ');
  }
}

class ShortcutDescriptor {
  constructor(
    public shortcuts: Shortcut[],
    public handler: (event: KeyboardEvent) => void,
    public stop: boolean) {
  }

  /**
   * Maybe handle the event, according to whether any shortcut matches
   */
  onEvent(event: KeyboardEvent): boolean {
    if (this.shortcuts.find(s => s.matches(event))) {
      this.handler(event);
      if (this.stop) {
        event.preventDefault();
        event.stopPropagation();
      }
      return true;
    }
    return false;
  }
}

/**
 * Provides registration to keyboard shortcuts
 */
@Injectable({
  providedIn: 'root'
})
export class ShortcutService {

  private descriptors: ShortcutDescriptor[] = [];

  constructor() {
    const observable = fromEvent(document.body, 'keydown') as Observable<KeyboardEvent>;
    observable.subscribe(event => this.onEvent(event));
  }

  /**
   * Subscribes for one or more global shortcuts.
   * @param shortcut One or more key or Shortcut
   * @param handler The event handler in case any of the shortcut matched
   * @param stop Whether to prevent default. True by default, so, must be set to true if the default action should be allowed
   */
  subscribe(shortcut: string | Shortcut | (string | Shortcut)[], handler: (event: KeyboardEvent) => any, stop = true): Subscription {
    if (!(shortcut instanceof Array)) {
      shortcut = [shortcut];
    }
    const shortcuts: Shortcut[] = shortcut.map(s => typeof s === 'string' ? new Shortcut(s) : s);

    // Add a descriptor
    const descriptor = new ShortcutDescriptor(shortcuts, handler, stop);
    this.descriptors.push(descriptor);

    // Return a subscription that removes the descriptor
    const subscription = new Subscription(() => {
      const index = this.descriptors.indexOf(descriptor);
      if (index >= 0) {
        this.descriptors.splice(index, 1);
      }
    });
    return subscription;
  }

  private onEvent(event: KeyboardEvent) {
    this.descriptors.forEach(d => d.onEvent(event));
  }

}
