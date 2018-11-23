import { HttpClient } from '@angular/common/http';
import { ContentGetter } from 'app/content/content-getter';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContentGetterOptions } from './content-getter-options';

/**
 * A content getter that fetches a menu / floating page from Cyclos.
 * The page should be created on Content > Content management > Menu and pages,
 * and will likely be a floating page.
 * Make sure the cyclos root corresponds to the configuration path in Cyclos
 */
export class CyclosPageContentGetter implements ContentGetter {
  private url: string;
  constructor(cyclosRoot: string, pageId: string) {
    this.url = `${cyclosRoot}/web-rpc/menuEntry/menuItemDetails/${pageId}`;
  }

  get(options: ContentGetterOptions): Observable<string> {
    const http = options.injector.get(HttpClient);
    return http.get(this.url).pipe(map(res => this.toContent(res)));
  }

  private toContent(res): string {
    const result = res['result'];
    return result ? result['content'] : null;
  }
}
