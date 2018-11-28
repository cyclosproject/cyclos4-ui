import { Injectable } from '@angular/core';
import * as lscache from 'lscache';
import { Observable, of, empty } from 'rxjs';
import { tap, take } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { DEFAULT_CACHE_SECONDS } from 'app/content/content';

/**
 * Service used to manage the persistent cache
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {

  constructor() {
    // This method is not in the current @types/lscache
    lscache['setExpiryMilliseconds'](1000);
    lscache.flushExpired();
  }

  /**
   * Returns the cache value associated with the given key.
   * If the there's no value associated with the key, the producer function is called,
   * and should generate the cached value
   * @param key The cache key
   * @param producer The producer function, called when the value for the given key is not found
   */
  get<T>(key: string, producer?: (string) => Observable<T>, timeoutSeconds = DEFAULT_CACHE_SECONDS): Observable<T> {
    if (timeoutSeconds === 0 || !environment.production) {
      // Don't cache
      return producer(key);
    }
    const cached = lscache.get(key) as T;
    if (cached != null) {
      // The value is cached;
      return of(cached);
    }
    if (producer) {
      return producer(key).pipe(
        take(1),
        tap(value => lscache.set(key, value, timeoutSeconds))
      );
    } else {
      return empty();
    }
  }
}
