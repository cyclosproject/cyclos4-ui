import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContentGetter } from './content-getter';
import { ContentGetterOptions } from './content-getter-options';

/**
 * A content getter that dynamically loads a URL and uses its content.
 * When referencing an external URL, make sure that CORS is enabled
 */
export class UrlContentGetter implements ContentGetter {

  constructor(private url: string) {
  }

  get(options: ContentGetterOptions): Observable<string> {
    const http = options.injector.get(HttpClient);
    return http.get(this.url, {
      responseType: 'text'
    });
  }
}
