import { ContentGetter } from 'app/content/content-getter';

/**
 * The default number of seconds to cache content (1 hour)
 */
export const DEFAULT_CACHE_SECONDS = 60 * 60;

/**
 * A negative number, indicating to never cache the content
 */
export const DISABLE_CACHE_SECONDS = -1;

/**
 * A large number of seconds, which, in practice, means the cache "never" expires (1 year)
 */
export const CACHE_FOREVER_SECONDS = 365 * 24 * 60 * 60;

/**
 * Interface describing a content
 */
export interface Content {

  /**
   * The content itself, which may be a raw string or a content getter
   */
  content: string | ContentGetter;

  /**
   * The cache key. When not set, will not cache
   */
  cacheKey?: string;

  /**
   * The number of seconds the content should be cached
   */
  cacheSeconds?: number;

}
