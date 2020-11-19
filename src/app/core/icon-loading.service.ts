import { HttpClient } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import { CacheService } from 'app/core/cache.service';
import { Observable, of } from 'rxjs';
import { first, tap } from 'rxjs/operators';
import { SvgIcon } from 'app/core/svg-icon';

const builtin = new Set(Object.values(SvgIcon));

/**
 * Loads icons
 */
@Injectable({
  providedIn: 'root',
})
export class IconLoadingService {

  iconRoot: string;

  private icons: { [key: string]: string };
  private otherIcons = new Set<string>();

  constructor(
    private http: HttpClient,
    private cache: CacheService) {
    const current = isDevMode() ? {} : cache.current('icons');
    if (typeof current === 'string') {
      try {
        this.icons = { ...JSON.parse(current) };
      } catch (e) {
      }
    } else if (typeof current === 'object') {
      this.icons = { ...current };
    } else {
      this.icons = {};
    }
  }

  /**
   * Returns a cold observer which loads the missing icons
   */
  load(names: string[]): Observable<any> {
    // Store the additional icon names
    names = names || [];
    names.forEach(name => {
      if (!builtin.has(name as SvgIcon)) {
        this.otherIcons.add(name);
      }
    });

    // Determine the missing icons
    const missing = new Set([...builtin, ...names]);
    if (!isDevMode()) {
      Object.keys(this.icons).forEach(name => missing.delete(name));
    }
    if (missing.size === 0) {
      // Nothing to load
      return of(null);
    }
    return this.http.get(`${this.iconRoot}/icons.json`, {
      params: { names: [...missing].join(',') }
    }).pipe(
      first(),
      tap({
        next: icons => this.store(icons)
      }));
  }

  private store(icons: { [key: string]: string }) {
    icons = icons || {};
    this.icons = { ...this.icons, ...icons };
    if (!isDevMode) {
      this.cache.set('icons', this.icons, 60 * 60 * 24);
    }
  }

  /**
   * Returns an svg content for the given icon name
   */
  svg(icon: SvgIcon | string): string {
    let content: string;
    if (builtin.has(icon as SvgIcon) || this.otherIcons.has(String(icon))) {
      content = this.icons[icon];
    }
    if (!content) {
      content = `<svg viewbox="0 0 24 24">
        <text x="0" y="24" fill="red">
          ${icon}
          <animate attributeType="XML" attributeName="x"
            values="0;-50;0" dur="10s" repeatCount="indefinite" />
        </text>
      </svg>`;
    }
    return content;
  }
}
