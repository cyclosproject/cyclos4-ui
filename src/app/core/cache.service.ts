import { Injectable } from '@angular/core';
import { isDevServer } from 'app/shared/helper';
import lscache from 'lscache';
import { EMPTY, Observable, of } from 'rxjs';
import { take, tap } from 'rxjs/operators';

/**
 * The default number of seconds to cache content (1 hour)
 */
const DEFAULT_CACHE_SECONDS = 60 * 60;

/**
 * Service used to manage the persistent cache
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  constructor() {
    lscache.setExpiryMilliseconds(1000);
    lscache.flushExpired();
  }

  /**
   * Returns the currently cached value associated with the given key.
   * @param key The cache key
   */
  current(key: string): any {
    return lscache.get(key);
  }

  /**
   * Sets the currently cached value
   * @param key The value key
   * @param value The value to store
   * @param timeoutSeconds The timeout seconds
   */
  set(key: string, value: any, timeoutSeconds = DEFAULT_CACHE_SECONDS) {
    lscache.set(key, value, timeoutSeconds);
  }

  /**
   * Returns the cache value associated with the given key.
   * If the there's no value associated with the key, the producer function is called,
   * and should generate the cached value
   * @param key The cache key
   * @param producer The producer function, called when the value for the given key is not found
   */
  get<T>(key: string, producer: (key: string) => Observable<T>, timeoutSeconds = DEFAULT_CACHE_SECONDS): Observable<T> {
    if (timeoutSeconds === 0 || isDevServer()) {
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
      return EMPTY;
    }
  }
}
