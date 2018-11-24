import { Injectable } from '@angular/core';
import * as lscache from 'lscache';
import { Observable, of, empty } from 'rxjs';
import { tap, take } from 'rxjs/operators';
import { environment } from 'environments/environment';

/** The number of minutes cached entries expire: 1 day. */
const DEFAULT_EXPIRATION_MINUTES = 24 * 60;

/** The number of minutes for caches that "never expire": 1 year */
const NEVER_EXPIRE_MINUTES = 24 * 60 * 365;

/**
 * Service used to manage the persistent cache
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {

  constructor() {
    lscache.flushExpired();
  }

  /**
   * Returns the cache value associated with the given key.
   * If the there's no value associated with the key, the producer function is called,
   * and should generate the cached value
   * @param key The cache key
   * @param producer The producer function, called when the value for the given key is not found
   */
  get<T>(key: string, producer?: (string) => Observable<T>): Observable<T> {
    const timeout = this.getTimeout(key);
    if (timeout === 0) {
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
        tap(value => lscache.set(key, value, timeout))
      );
    } else {
      return empty();
    }
  }

  private getTimeout(key: string): number {
    const timeout = environment.cacheTimeouts[key];
    if (timeout === undefined) {
      // No specific timeout - use the default
      return DEFAULT_EXPIRATION_MINUTES;
    } else if (timeout < 0) {
      // Cache "forever"
      return NEVER_EXPIRE_MINUTES;
    }
    return timeout;
  }
}
