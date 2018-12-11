import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

declare const require;

/**
 * A registry of SVG icons, which are statically loaded in the application
 */
@Injectable({
  providedIn: 'root'
})
export class SvgIconRegistry {

  private registry = new Map<string, SVGElement>();

  constructor() {
    this.register('account_balance_circle');
    this.register('search_users');
    this.register('marketplace');
    this.register('edit_profile');
    this.register('account');
    this.register('pay');
    this.register('contact_list');
    this.register('passwords');
  }

  private register(name: string) {
    const content = require(`!raw-loader!../icons/${name}.svg`);
    const div = document.createElement('div');
    div.innerHTML = content;
    const svg = div.querySelector('svg') as SVGElement;
    if (!svg) {
      throw Error('<svg> tag not found');
    }
    this.registry.set(name, svg);
  }

  /**
   * Returns the SVG element for the given icon
   * @param name The icon name
   */
  svg(name: string): Observable<SVGElement> {
    const cached = this.registry.get(name);
    if (cached) {
      return of(cached.cloneNode(true) as SVGElement);
    }
    throw new Error(`No such SVG icon: ${name}`);
  }

  /**
   * Returns whether an icon with the given name is an SVG icon
   * @param name The icon name
   */
  isSvgIcon(name: string) {
    return this.registry.has(name);
  }

}
