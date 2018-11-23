import { Observable, of } from 'rxjs';
import { ContentGetterOptions } from './content-getter-options';
import { ContentGetter } from './content-getter';

/**
 * A content getter that returns a static content, as received in the constructor
 */
export class StaticContentGetter implements ContentGetter {

  constructor(private content: string) {
  }

  get(_: ContentGetterOptions): Observable<string> {
    return of(this.content);
  }
}
