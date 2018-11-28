import { Injectable, Injector } from '@angular/core';
import { ContentGetter } from 'app/content/content-getter';
import { Content, DEFAULT_CACHE_SECONDS } from 'app/content/content';
import { CacheService } from 'app/core/cache.service';
import { Observable, of, empty } from 'rxjs';
import { blank } from 'app/shared/helper';
import { tap } from 'rxjs/operators';

/**
 * Service used to resolve dynamic content
 */
@Injectable({
  providedIn: 'root'
})
export class ContentService {

  constructor(private cache: CacheService, private injector: Injector) {
  }

  /**
   * Resolves the content from the given `Content`, always returning an `Observable<string>`, applying cache when needed
   * @param getter The content getter
   */
  get(content: Content): Observable<string> {
    if (content == null) {
      return empty();
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
    return observable.pipe(tap(str => content.content = str));
  }

}
