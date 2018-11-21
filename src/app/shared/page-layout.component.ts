import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { truthyAttr } from 'app/shared/helper';
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

  private sub: Subscription;

  private _hideMenu = false;
  @Input() get hideMenu(): boolean | string {
    return this._hideMenu;
  }
  set hideMenu(hideMenu: boolean | string) {
    this._hideMenu = truthyAttr(hideMenu);
  }

  showLeftArea = new BehaviorSubject(false);

  constructor(
    public layout: LayoutService,
    public login: LoginService,
    public menu: MenuService) { }

  ngOnInit() {
    const updateShowLeft = () => {
      this.showLeftArea.next(!this.hideMenu && this.login.user != null && this.layout.gtmd && this.menu.activeMenu != null);
    };
    this.layout.gtmd$.subscribe(updateShowLeft);
    this.login.user$.subscribe(updateShowLeft);
    this.menu.activeMenu$.subscribe(updateShowLeft);
    updateShowLeft();
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
