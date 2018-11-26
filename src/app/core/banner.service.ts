import { Injectable, Injector } from '@angular/core';
import { Banner } from 'app/content/banner';
import { BannerFilter } from 'app/content/banner-filter';
import { BannerResolver } from 'app/content/banners-resolver';
import { StaticContentGetter } from 'app/content/static-content-getter';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable, Subscription, of } from 'rxjs';

/** The default number of seconds a banner is shown before rotating */
const DEFAULT_TIMEOUT_SECONDS = 10;

/**
 * Service used to manage the visible banners
 */
@Injectable({
  providedIn: 'root'
})
export class BannerService {

  private _banners = new BehaviorSubject<Banner[][]>([]);
  banners$: Observable<Banner[][]>;
  private resolver: BannerResolver;
  private nextId = 0;

  private sub: Subscription;

  constructor(
    private injector: Injector,
    private login: LoginService,
    private menu: MenuService) {

    this.banners$ = this._banners.asObservable();

    this.resolver = environment.bannerResolver;
    if (this.resolver) {
      // When there's no resolver, banners will always be empty
      menu.lastSelectedMenu$.subscribe(() => this.update());
      login.user$.subscribe(() => this.update());
    }
  }

  private update(): void {
    const filter = this.filter;
    if (filter == null) {
      return;
    }
    const observable = this.resolver.list(filter) || of([]);
    this.sub = observable.subscribe(banners => {
      this._banners.next(this.fillBannersDefaults(banners));
      if (this.sub) {
        this.sub.unsubscribe();
      }
    });
  }

  private fillBannersDefaults(banners: Banner[][]): Banner[][] {
    if (!banners == null) {
      return [];
    }
    for (let i = 0; i < banners.length; i++) {
      let card = banners[i];
      if (card == null) {
        card = [];
        banners[i] = card;
      }
      for (let j = 0; j < card.length; j++) {
        const banner = card[j];
        card[j] = this.fillBannerDefaults(banner);
      }
    }
    return banners;
  }

  private fillBannerDefaults(banner: Banner): Banner {
    if (banner == null) {
      banner = { id: null, content: null };
    }
    if (banner.id == null) {
      banner.id = `banner_${++this.nextId}`;
    }
    if (banner.seconds == null) {
      banner.seconds = DEFAULT_TIMEOUT_SECONDS;
    }
    if (typeof banner.showCard !== 'boolean') {
      banner.showCard = true;
    }
    if (!banner.content) {
      banner.content = new StaticContentGetter('This banner has no content!');
    }
    return banner;
  }

  private get filter(): BannerFilter {
    const menu = this.menu.lastSelectedMenu;
    if (menu == null) {
      return null;
    }
    return {
      injector: this.injector,
      user: this.login.user,
      menu: menu
    };
  }

}
