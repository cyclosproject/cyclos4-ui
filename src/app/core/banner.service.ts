import { Injectable, Injector } from '@angular/core';
import { Banner } from 'app/content/banner';
import { BannerCard } from 'app/content/banner-card';
import { LoginService } from 'app/core/login.service';
import { ActiveMenu, MenuService } from 'app/core/menu.service';
import { blank, empty as isEmpty } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';
import { environment } from 'environments/environment';
import { BehaviorSubject, EMPTY, forkJoin, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

/** The default number of seconds a banner is shown before rotating */
const DEFAULT_TIMEOUT_SECONDS = 10;

/**
 * Service used to manage the visible banners
 */
@Injectable({
  providedIn: 'root'
})
export class BannerService {

  /** An observable with the visible banner cards for the current context */
  cards$: Observable<BannerCard[]>;
  get cards(): BannerCard[] {
    return this.currentCards.value;
  }

  private allCards: BannerCard[];
  private currentCards = new BehaviorSubject<BannerCard[]>([]);
  private sub: Subscription;
  private currentBanners = new Map<BannerCard, BehaviorSubject<Banner>>();

  constructor(
    private injector: Injector,
    private menu: MenuService,
    private login: LoginService) {
    this.cards$ = this.currentCards.asObservable();
  }

  initialize() {
    const resolver = environment.bannerCardsResolver;
    const cards = resolver == null ? null : resolver.resolveCards(this.injector);
    if (cards == null) {
      this.doInitialize([]);
    } else if (cards instanceof Array) {
      this.doInitialize(cards);
    } else {
      cards.subscribe(c => this.doInitialize(c));
    }
  }

  private doInitialize(cards: BannerCard[]) {
    // Initialize the defaults for each card
    this.allCards = cards || [];
    for (const card of this.allCards) {
      if (typeof card.index !== 'number' || card.index < 0) {
        card.index = 0;
      }
      const firstBanner = this.preProcessBannersArray(card);
      this.currentBanners.set(card, new BehaviorSubject(firstBanner));
    }

    // Whenever either the menu or logged user changes, fetch the banners
    this.menu.activeMenu$.subscribe(() => this.update());
    this.login.user$.subscribe(() => this.update());
    // Initially update
    this.update();
  }

  getCurrentBanner(card: BannerCard): Observable<Banner> {
    const subject = this.currentBanners.get(card);
    return subject ? subject.asObservable().pipe(distinctUntilChanged()) : EMPTY;
  }

  private update(): void {
    const menu = this.menu.activeMenu;
    if (menu == null) {
      return;
    }

    // Get the previously visible cards, and clear their timeouts
    const oldVisible = this.currentCards.value || [];
    for (const card of oldVisible) {
      clearTimeout(card['timeoutHandle']);
    }

    const visible = this.visibleCards(menu);


    // Function that schedules the timers for each visible card and sets the currentCards
    const done = () => {
      for (const card of visible) {
        const banners = card.banners as Banner[];
        if (banners.length > 1) {
          this.scheduleNext(card);
        }
      }
      this.currentCards.next(visible);
    };

    // For each of the visible cards, find those whose banners are still an Observable
    const needsFetching = visible.filter(c => c.banners['subscribe']);
    if (isEmpty(needsFetching)) {
      // No banners needs to be resolved
      done();
    } else {
      // Fetch the banners first
      this.sub = forkJoin(needsFetching.map(c => c.banners as Observable<Banner[]>)).subscribe(matrix => {
        // Replace the Observable by the banners array
        for (let i = 0; i < matrix.length; i++) {
          const card = needsFetching[i];
          const banners = matrix[i];
          card.banners = banners;
          this.preProcessBannersArray(card);
        }
        this.sub.unsubscribe();
        // Only now we're done
        done();
      });
    }
  }

  private visibleCards(activeMenu: ActiveMenu): BannerCard[] {
    const menu = activeMenu.menu;
    if (menu === Menu.DASHBOARD) {
      // Never show any banner in the dashboard, as it would break the layout
      return [];
    }

    const guest = this.login.user == null;
    return this.allCards.filter(card => {
      const forGuests = card.guests === true;
      const forLoggedUsers = card.loggedUsers !== false;
      if (
        (!isEmpty(card.rootMenus) && !card.rootMenus.includes(menu.root))
        || (!isEmpty(card.menus) && !card.menus.includes(menu))
        || (guest && !forGuests)
        || (!guest && !forLoggedUsers)
      ) {
        return false;
      }
      return true;
    });
  }

  private scheduleNext(card: BannerCard) {
    // At this point, the banners are already resolved - must be an array
    const banners = card.banners as Banner[];

    // Get the current banner, as it dictates the timeout
    const currentBanner = card.banners[card.index];

    // Get the next banner
    let nextIndex = card.index + 1;
    if (nextIndex >= banners.length) {
      nextIndex = 0;
    }
    const nextBanner = banners[nextIndex];

    // After the timeout, replace the banner ...
    card['timeoutHandle'] = setTimeout(() => {
      card.index = nextIndex;
      this.currentBanners.get(card).next(nextBanner);
      // ... and already schedule the next one
      this.scheduleNext(card);
    }, currentBanner.timeout * 1000);
  }

  /**
   * If the card banners is an array, fill in the defaults
   * @returns The first banner in the card
   */
  private preProcessBannersArray(card: BannerCard): Banner {
    let banners = card.banners;
    if (!(banners instanceof Array)) {
      return null;
    }
    banners = card.banners = banners.filter(b => b != null);
    for (const banner of banners) {
      if (banner.timeout == null) {
        banner.timeout = DEFAULT_TIMEOUT_SECONDS;
      }
      if (banner.content == null) {
        banner.content = 'This banner has no content!';
      }
      if (blank(banner.linkTarget)) {
        banner.linkTarget = '_self';
      }
    }
    if (card.index >= banners.length) {
      card.index = 0;
    }
    return banners[card.index];
  }
}
