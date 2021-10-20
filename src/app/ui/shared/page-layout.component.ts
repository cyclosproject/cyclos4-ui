import { ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { LayoutService } from 'app/core/layout.service';
import { empty, truthyAttr } from 'app/shared/helper';
import { LoginState } from 'app/ui/core/login-state';
import { LoginService } from 'app/ui/core/login.service';
import { MenuService } from 'app/ui/core/menu.service';
import { UiLayoutService } from 'app/ui/core/ui-layout.service';
import { MenuType } from 'app/ui/shared/menu';
import { BehaviorSubject, Subscription } from 'rxjs';

/**
 * The page layout, which may show a menu on the left,
 * plus nested `<page-content>` tags.
 */
@Component({
  selector: 'page-layout',
  templateUrl: 'page-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutComponent implements OnInit, OnDestroy {
  @Input() heading: string;
  @Input() ready = true;
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

  constructor(
    public layout: LayoutService,
    public login: LoginService,
    private loginState: LoginState,
    public menu: MenuService,
    public uiLayout: UiLayoutService) { }

  ngOnInit() {
    this.uiLayout.currentPageLayout = this;

    // There are several factors that influence whether the left menu is visible
    const updateLeftMenuVisible = () => {
      const gtmd = this.layout.gtmd;
      const fullWidth = this.uiLayout.fullWidth;
      const loggedIn = this.login.user != null;
      const activeMenu = this.menu.activeMenu;
      let hasMenu = gtmd && !fullWidth && loggedIn && !this.hideMenu && !!activeMenu;
      const root = this.menu.rootEntry();
      if (hasMenu && (root == null || empty(root.entries))) {
        hasMenu = false;
      }
      this.leftMenuVisible$.next(hasMenu);
    };
    this.subs.push(this.layout.gtmd$.subscribe(updateLeftMenuVisible));
    this.subs.push(this.uiLayout.fullWidth$.subscribe(updateLeftMenuVisible));
    this.subs.push(this.login.user$.subscribe(updateLeftMenuVisible));
    this.subs.push(this.menu.activeMenu$.subscribe(updateLeftMenuVisible));
    this.subs.push(this.menu.menu(MenuType.SIDE).subscribe(updateLeftMenuVisible));

    // The left area is visible if not in full-width layout and there's either the left menu or banners
    const updateLeftAreaVisible = () => {
      const gtmd = this.layout.gtmd;
      const fullWidth = this.uiLayout.fullWidth;
      const hasLeftMenu = this.leftMenuVisible;
      const hasBanners = !empty(this.uiLayout.banners);
      this.leftAreaVisible$.next(!this.hideMenu && gtmd && !fullWidth && (hasLeftMenu || hasBanners));
    };
    this.subs.push(this.layout.gtmd$.subscribe(updateLeftAreaVisible));
    this.subs.push(this.leftMenuVisible$.subscribe(updateLeftAreaVisible));
    this.subs.push(this.uiLayout.fullWidth$.subscribe(updateLeftAreaVisible));
    this.subs.push(this.uiLayout.banners$.subscribe(updateLeftAreaVisible));
    this.subs.push(this.loginState.subscribeForLoggingOut(flag => {
      this.loggingOut$.next(flag);
    }));

    updateLeftAreaVisible();
  }

  ngOnDestroy() {
    this.uiLayout.currentPageLayout = null;
    this.uiLayout.headingActions = [];
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
