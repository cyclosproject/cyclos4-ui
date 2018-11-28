import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BannerService } from 'app/core/banner.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { empty, truthyAttr } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { BehaviorSubject, Subscription } from 'rxjs';

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

  @Output() sideAreaVisible = new EventEmitter<boolean>();

  private sub: Subscription[] = [];

  private _hideMenu = false;
  @Input() get hideMenu(): boolean | string {
    return this._hideMenu;
  }
  set hideMenu(hideMenu: boolean | string) {
    this._hideMenu = truthyAttr(hideMenu);
  }

  leftAreaVisible$ = new BehaviorSubject(false);

  constructor(
    public layout: LayoutService,
    public login: LoginService,
    public menu: MenuService,
    public banner: BannerService) { }

  ngOnInit() {
    this.layout.currentPageLayout = this;

    const updateSideAreaVisible = () => {
      const hasCards = !empty(this.banner.cards);
      const loggedIn = this.login.user != null;
      const hasMenu = loggedIn && !this.hideMenu && this.menu.activeMenu != null;
      const visible = this.layout.gtmd && (hasCards || hasMenu);
      this.leftAreaVisible$.next(visible);
      this.sideAreaVisible.emit(visible);
    };
    this.sub.push(this.layout.gtmd$.subscribe(updateSideAreaVisible));
    this.sub.push(this.login.user$.subscribe(updateSideAreaVisible));
    this.sub.push(this.menu.activeMenu$.subscribe(updateSideAreaVisible));
    this.sub.push(this.banner.cards$.subscribe(updateSideAreaVisible));
    updateSideAreaVisible();
  }

  ngOnDestroy() {
    this.layout.currentPageLayout = null;

    this.sub.forEach(s => s.unsubscribe());
  }
}
