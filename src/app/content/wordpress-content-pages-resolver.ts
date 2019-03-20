import { HttpClient } from '@angular/common/http';
import { Injector } from '@angular/core';
import { ContentPage } from 'app/content/content-page';
import { ContentPagesResolver } from 'app/content/content-pages-resolver';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Resolves each page returned from a Wordpress API call as a content page.
 * See the https://developer.wordpress.org/rest-api/ documentation for more details.
 * For example, you can tag all pages in your Worpress installation as `content-page`,
 * and they will automatically show in the frontend if you use an URL like
 * `https://example.com/wp-json/wp/v2/pages`.
 * All resolved pages are placed in the Information menu.
 */
export class WordpressContentPagesResolver implements ContentPagesResolver {

  constructor(private url: string) { }

  contentPages(injector: Injector): Observable<ContentPage[]> {
    return injector.get(HttpClient).get(this.url).pipe(map((res: any[]) => {
      return res.map(p => this.toContentPage(p));
    }));
  }

  private toContentPage(input: any): ContentPage {
    return {
      slug: input.slug,
      title: input.title.rendered,
      content: input.content.rendered
    };
  }

}
