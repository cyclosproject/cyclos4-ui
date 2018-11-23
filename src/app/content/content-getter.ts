import { Observable } from 'rxjs';
import { ContentGetterOptions } from './content-getter-options';

/**
 * Interface used to retrieve content
 */
export interface ContentGetter {

  /**
   * Retrieves the content based on the given options
   * @param options The options
   * @returns The observable, which will resolve the content
   */
  get(options: ContentGetterOptions): Observable<string>;

}
