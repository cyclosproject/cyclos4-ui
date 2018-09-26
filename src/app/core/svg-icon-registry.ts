import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// Use the require method provided by webpack
declare const require;

/**
 * Intercepts requests to set the correct headers and handle errors
 */
@Injectable({
  providedIn: 'root'
})
export class SvgIconRegistry {

  private names: string[] = [];
  private registry = new Map<string, SVGElement>();

  constructor(private http: HttpClient) {
    this.names.push('account_balance_circle');
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
    const url = `images/${name}.svg`;
    return this.http.get(url, { responseType: 'text' }).pipe(
      map(content => {
        const div = document.createElement('div');
        div.innerHTML = content;
        const svg = div.querySelector('svg') as SVGElement;
        if (!svg) {
          throw Error('<svg> tag not found');
        }
        return svg;
      }),
      tap(svg => this.registry.set(name, svg))
    );
  }

  /**
   * Returns whether an icon with the given name is an SVG icon
   * @param name The icon name
   */
  isSvgIcon(name: string) {
    return this.names.includes(name);
  }

}
