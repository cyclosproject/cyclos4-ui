import { HttpClient } from '@angular/common/http';
import { Injector } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interface used to retrieve content. Its toString() method will be used to determine the banner uniqueness
 */
type ContentGetter = (injector: Injector) => Observable<string>;

/**
 * Contains helper functions to create common content getters
 */
namespace ContentGetter {

  /**
   * Returns a fixed text
   */
  export function text(content: string): ContentGetter {
    const res = _ => of(content);
    res.toString = () => content;
    return res;
  }

  /**
   * Fetches a content from a URL, via a GET request.
   * When referencing an external URL, make sure that CORS is enabled
   */
  export function url(rawUrl: string): ContentGetter {
    const res = injector => {
      const http = injector.get(HttpClient);
      return http.get(rawUrl, {
        responseType: 'text'
      });
    };
    res.toString = () => rawUrl;
    return res;
  }

  /**
   * Fetches a floating page from Cyclos using WEB-RPC.
   * The page should be created on Content > Content management > Menu and pages with type 'Floating page'.
   * When requesting Cyclos directly, use the URL from the floating page details in the Cyclos administration section.
   * Alternatively, if you have a deploy where `/web-rpc` is proxied, you can pass in the URL to
   * the target `/web-rpc/menuEntry/menuItemDetails/:id`.
   * @param rawUrl The URL, including the content id
   */
  export function cyclosPage(rawUrl: string): ContentGetter {
    const res = injector => {
      const http = injector.get(HttpClient);
      const finalUrl = rawUrl.replace('#page-content!id=', '/web-rpc/menuEntry/menuItemDetails/');
      return http.get(finalUrl).pipe(map((response: any) => {
        const result = response.result;
        return result ? result.content : null;
      }));
    };
    res.toString = () => rawUrl;
    return res;
  }

}

export { ContentGetter };

