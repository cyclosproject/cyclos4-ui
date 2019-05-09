import { ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { BannerCard } from 'app/content/banner-card';
import { BannerService } from 'app/core/banner.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { empty, truthyAttr } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { MenuType } from 'app/shared/menu';
import { BehaviorSubject, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

/**
 * The page layout, which may show a menu on the left,
 * plus nested `<page-content>` tags.
 */
@Component({
  selector: 'page-layout',
  templateUrl: 'page-layout.component.html',
  styleUrls: ['page-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageLayoutComponent implements OnInit, OnDestroy {
  @Input() heading: string;
  @Input() ready: boolean;
  @Input() size: 'small' | 'medium' | 'large' | 'full' = 'full';

  @ViewChildren('contentArea') contentArea: QueryList<ElementRef>;

  private subs: Subscription[] = [];

  private _hideMenu = false;
  @Input() get hideMenu(): boolean | string {
    return this._hideMenu;
  }
  set hideMenu(hideMenu: boolean | string) {
    this._hideMenu = truthyAttr(hideMenu);
  }

  leftAreaVisible$ = new BehaviorSubject(false);
  get leftAreaVisible(): boolean {
    return this.leftAreaVisible$.value;
  }

  leftMenuVisible$ = new BehaviorSubject(false);
  get leftMenuVisible(): boolean {
    return this.leftMenuVisible$.value;
  }

  loggingOut$ = new BehaviorSubject(false);
  bannerCards$ = new BehaviorSubject<BannerCard[]>(null);

  constructor(
    public layout: LayoutService,
    public login: LoginService,
    public menu: MenuService,
    public banner: BannerService) { }

  ngOnInit() {
    this.layout.currentPageLayout = this;

    // There are several factors that influence whether the left menu is visible
    const updateLeftMenuVisible = () => {
      const gtmd = this.layout.gtmd;
      const fullWidth = this.layout.fullWidth;
      const loggedIn = this.login.user != null;
      const activeMenu = this.menu.activeMenu;
      let hasMenu = gtmd && !fullWidth && loggedIn && !this.hideMenu && activeMenu != null;
      const root = this.menu.rootEntry();
      if (hasMenu && (root == null || (root.entries || []).length <= 1)) {
        hasMenu = false;
      }
      this.leftMenuVisible$.next(hasMenu);
    };
    this.subs.push(this.layout.gtmd$.subscribe(updateLeftMenuVisible));
    this.subs.push(this.layout.fullWidth$.subscribe(updateLeftMenuVisible));
    this.subs.push(this.login.user$.subscribe(updateLeftMenuVisible));
    this.subs.push(this.menu.activeMenu$.subscribe(updateLeftMenuVisible));
    this.subs.push(this.menu.menu(MenuType.SIDE).subscribe(updateLeftMenuVisible));

    // The left area is visible if not in full-width layout and there's either the left menu or banners
    const updateLeftAreaVisible = () => {
      const gtmd = this.layout.gtmd;
      const fullWidth = this.layout.fullWidth;
      const hasLeftMenu = this.leftMenuVisible;
      const hasCards = !empty(this.bannerCards$.value);
      this.leftAreaVisible$.next(gtmd && !fullWidth && (hasLeftMenu || hasCards));
    };
    this.subs.push(this.layout.gtmd$.subscribe(updateLeftAreaVisible));
    this.subs.push(this.leftMenuVisible$.subscribe(updateLeftAreaVisible));
    this.subs.push(this.layout.fullWidth$.subscribe(updateLeftAreaVisible));
    this.subs.push(this.banner.cards$.subscribe(updateLeftAreaVisible));
    this.subs.push(this.banner.cards$.pipe(first()).subscribe(cards => {
      this.bannerCards$.next(cards);
      updateLeftAreaVisible();
    }));
    this.subs.push(this.login.subscribeForLoggingOut(flag => {
      this.loggingOut$.next(flag);
    }));

    updateLeftAreaVisible();
  }

  ngOnDestroy() {
    this.layout.currentPageLayout = null;
    this.layout.headingActions = [];
    this.subs.forEach(s => s.unsubscribe());
  }

  /**
   * Returns the offset width of the content area
   */
  get contentWidth() {
    const contentArea = this.contentArea.first;
    return contentArea == null ? 0 : contentArea.nativeElement.offsetWidth;
  }

}
