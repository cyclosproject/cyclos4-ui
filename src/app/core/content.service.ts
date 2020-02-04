import { Injectable, Injector } from '@angular/core';
import { ContentGetter } from 'app/content/content-getter';
import { Content, DEFAULT_CACHE_SECONDS } from 'app/content/content';
import { CacheService } from 'app/core/cache.service';
import { Observable, of, EMPTY } from 'rxjs';
import { blank } from 'app/shared/helper';
import { ContentPage } from 'app/content/content-page';
import { handleFullWidthLayout } from 'app/content/content-with-layout';
import { empty as isEmpty } from 'app/shared/helper';
import { RootMenu } from 'app/shared/menu';

const VALID_CONTENT_PAGES_ROOT_MENUS = [RootMenu.CONTENT, RootMenu.BANKING, RootMenu.MARKETPLACE, RootMenu.PERSONAL];

/**
 * Service used to resolve dynamic content
 */
@Injectable({
  providedIn: 'root'
})
export class ContentService {

  /** All content pages */
  private _contentPages: ContentPage[];
  get contentPages(): ContentPage[] {
    return this._contentPages;
  }
  setContentPages(contentPages: ContentPage[]) {
    this._contentPages = this.preprocessContentPages(contentPages);
  }

  constructor(
    private cache: CacheService,
    private injector: Injector) {
  }

  /**
   * Resolves the content from the given `Content`, always returning an `Observable<string>`, applying cache when needed
   * @param getter The content getter
   */
  get(content: Content): Observable<string> {
    if (content == null) {
      return EMPTY;
    }
    if (typeof content.content === 'string') {
      return of(content.content);
    }
    const getter = content.content as ContentGetter;
    let observable = getter(this.injector);
    const key = content.cacheKey;
    if (!blank(key)) {
      // When there's a cache key, enable cache
      const cacheSeconds = content.cacheSeconds || DEFAULT_CACHE_SECONDS;
      observable = this.cache.get(key, () => observable, cacheSeconds);
    }
    // When resolving, change the content to a string, so, for this instance it will be obtained immediately
    return observable;
  }

  /**
   * Returns a content page by slug
   * @param slug The slug
   */
  contentPage(slug: string): ContentPage {
    return (this._contentPages || []).find(p => p.slug === slug);
  }

  private preprocessContentPages(contentPages: ContentPage[]): ContentPage[] {
    contentPages = (contentPages || []).filter(p => p != null);
    let nextId = 0;
    for (const page of contentPages) {
      handleFullWidthLayout(page);
      if (isEmpty(page.label)) {
        page.label = page.title || 'Untitled page';
      }
      if (isEmpty(page.icon)) {
        page.icon = 'description';
      }
      if (isEmpty(page.slug)) {
        page.slug = `page_${++nextId}`;
      } else {
        // Make sure the slug doesn't contain invalid characters
        page.slug = page.slug.replace(/[\/\?\#\s\%\:]/g, '-');
      }
      if (!VALID_CONTENT_PAGES_ROOT_MENUS.includes(page.rootMenu)) {
        page.rootMenu = RootMenu.CONTENT;
      }

      // Normalize the isVisible method to always be there and do all checks
      if (!page['processedIsVisible']) {
        const originalIsVisible = page.isVisible;
        page.isVisible = (auth, injector) => {
          if (auth.user == null && page.guests === false
            || auth.user != null && page.loggedUsers === false) {
            return false;
          }
          return originalIsVisible ? originalIsVisible(auth, injector) : true;
        };
        page['processedIsVisible'] = true;
      }
    }
    return contentPages;
  }

}
