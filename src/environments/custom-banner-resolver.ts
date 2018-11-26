import { BannerResolver } from 'app/content/banners-resolver';
import { BannerFilter } from 'app/content/banner-filter';
import { Observable, of } from 'rxjs';
import { Banner } from 'app/content/banner';
import { StaticContentGetter } from 'app/content/static-content-getter';

export class CustomBannerResolver implements BannerResolver {

  list(filter: BannerFilter): Observable<Banner[][]> {
    switch (filter.menu.root) {
      case 'marketplace':
        return of([
          [
            {
              id: 'fixed',
              content: new StaticContentGetter('Fixed banner')
            }
          ],
          [
            {
              id: '1',
              content: new StaticContentGetter('Banner 1')
            },
            {
              id: '2',
              content: new StaticContentGetter('Banner 2'),
              seconds: 5
            },
            {
              id: '3',
              content: new StaticContentGetter('Banner 2'),
              seconds: 3
            }
          ]
        ]);
    }
  }

}
