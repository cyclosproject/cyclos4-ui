import { Injectable } from '@angular/core';
import { ImagesService } from 'app/api/services/images.service';
import { CacheService } from 'app/core/cache.service';
import { SvgIcon } from 'app/core/svg-icon';
import { isDevServer } from 'app/shared/helper';
import { Observable, of } from 'rxjs';
import { first, tap } from 'rxjs/operators';

const builtin = new Set(Object.values(SvgIcon));

/**
 * Loads icons
 */
@Injectable({
  providedIn: 'root',
})
export class IconLoadingService {
  private icons: { [key: string]: string; };
  private otherIcons = new Set<string>();

  constructor(
    private imageService: ImagesService,
    private cache: CacheService) {
    const current = cache.current('icons');
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
  load(names: string[], includeBuiltin = true): Observable<any> {
    // Store the additional icon names
    names = names || [];
    this.checkOthers(names);

    // Determine the missing icons
    const missing = new Set([...(includeBuiltin ? builtin : []), ...names]);
    if (!isDevServer()) {
      Object.keys(this.icons).forEach(name => missing.delete(name));
    }
    if (missing.size === 0) {
      // Nothing to load
      return of(null);
    }
    return this.imageService.getSvgIcons({
      names: [...missing]
    }).pipe(
      first(),
      tap({
        next: icons => this.store(icons)
      }));
  }

  /**
   * Stores the given icons
   */
  store(icons: { [key: string]: string; }) {
    icons = icons || {};
    this.checkOthers(Object.keys(icons));
    this.icons = { ...this.icons, ...icons };
    this.cache.set('icons', this.icons, 60 * 60 * 24);
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

  private checkOthers(names: string[]) {
    names.forEach(name => {
      if (!builtin.has(name as SvgIcon)) {
        this.otherIcons.add(name);
      }
    });
  }
}
