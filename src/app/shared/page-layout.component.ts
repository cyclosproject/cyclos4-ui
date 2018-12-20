import { ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { BannerService } from 'app/core/banner.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { empty, truthyAttr } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MenuType } from 'app/shared/menu';

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

  loggingOut$ = new BehaviorSubject(false);

  constructor(
    public layout: LayoutService,
    public login: LoginService,
    public menu: MenuService,
    public banner: BannerService) { }

  ngOnInit() {
    this.layout.currentPageLayout = this;

    const updateLeftAreaVisible = () => {
      const hasCards = !empty(this.banner.cards);
      const fullWidth = this.layout.fullWidth;
      const loggedIn = this.login.user != null;
      const activeMenu = this.menu.activeMenu;
      let hasMenu = loggedIn && !this.hideMenu && activeMenu != null;
      const root = this.menu.rootEntry();
      if (root == null || (root.entries || []).length <= 1) {
        hasMenu = false;
      }
      const rootEntry = activeMenu == null ? null : this.menu.rootEntry(activeMenu.root);
      const rootIsDropDown = rootEntry != null && rootEntry.dropdown;
      const visible = !fullWidth && this.layout.gtmd && (hasCards || hasMenu) && !rootIsDropDown;
      this.leftAreaVisible$.next(visible);
    };
    this.subs.push(this.layout.gtmd$.subscribe(updateLeftAreaVisible));
    this.subs.push(this.layout.fullWidth$.subscribe(updateLeftAreaVisible));
    this.subs.push(this.login.user$.subscribe(updateLeftAreaVisible));
    this.subs.push(this.menu.activeMenu$.subscribe(updateLeftAreaVisible));
    this.subs.push(this.menu.menu(MenuType.SIDE).subscribe(updateLeftAreaVisible));
    this.subs.push(this.banner.cards$.subscribe(updateLeftAreaVisible));
    updateLeftAreaVisible();

    this.subs.push(this.login.subscribeForLoggingOut(flag => {
      this.loggingOut$.next(flag);
    }));
  }

  ngOnDestroy() {
    this.layout.currentPageLayout = null;

    this.subs.forEach(s => s.unsubscribe());
  }

  /**
   * Returns the offset width of the content area
   */
  get contentWidth() {
    const first = this.contentArea.first;
    return first == null ? 0 : first.nativeElement.offsetWidth;
  }
}
