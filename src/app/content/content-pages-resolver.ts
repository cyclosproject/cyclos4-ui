import { Injector } from '@angular/core';
import { ContentPage } from 'app/content/content-page';
import { Observable } from 'rxjs';

/**
 * Interface used to resolve the content pages which are shown in the application
 */
export interface ContentPagesResolver {

  /**
   * Returns each available content pages.
   * @param injector The Angular injector, used to access shared services
   * @returns Either the content pages or an observable of the content pages
   */
  resolveContentPages(injector: Injector): ContentPage[] | Observable<ContentPage[]>;

}
