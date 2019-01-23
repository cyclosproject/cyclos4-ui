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

  let _nextId = 0;

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
    * An IFrame that hosts the given URL.
    * Loads the host page a script to allow the iframe be adjusted according to the content.
    * The page hosted inside the iFrame must include the following script:
    * https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/3.6.3/iframeResizer.contentWindow.min.js
    */
  export function iframe(iframeUrl: string): ContentGetter {
    const id = 'iframeResizerScript';
    let script = document.getElementById(id) as HTMLScriptElement;
    if (script == null) {
      script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/3.6.3/iframeResizer.min.js';
      script.id = id;
      document.head.appendChild(script);
    }
    const idIx = _nextId++;
    const wrapperId = `wrapper_${idIx}`;
    const iframeId = `iframe_${idIx}`;
    const spinnerId = `spinner_${idIx}`;
    const res = () => {
      return of(`
      <div id="${spinnerId}" class="spinner"><img src="images/spinner.svg"></div>
      <div id="${wrapperId}" class="embed-responsive" style="position:absolute; top:-1000rem; visibility:hidden;">
        <iframe id="${iframeId}"
          src="${iframeUrl}"
          onload="
            iFrameResize({
              heightCalculationMethod: (navigator.userAgent.indexOf("MSIE") !== -1) ? 'max' : 'lowestElement',
              checkOrigin: false,
              interval: -32 }, '#${iframeId}');
            document.getElementById('${spinnerId}').style.display = 'none';
            document.getElementById('${wrapperId}').style.visibility = '';
            document.getElementById('${wrapperId}').style.position = 'relative';
            document.getElementById('${wrapperId}').style.top = '';
          "
          class="embed-responsive-item border-0 flex-grow-1">
        </iframe>
      </div>
      `);
    };
    res.toString = () => `iframe@${iframeUrl}`;
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

