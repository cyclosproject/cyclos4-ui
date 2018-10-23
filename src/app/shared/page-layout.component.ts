import { Component, Input, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { LayoutService } from 'app/shared/layout.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { BehaviorSubject } from 'rxjs';
import { truthyAttr } from 'app/shared/helper';

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
export class PageLayoutComponent implements OnInit {
  @Input() heading: string;
  @Input() ready: boolean;
  @Input() size: 'small' | 'medium' | 'large' | 'full' = 'full';

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
      this.showLeftArea.next(!this.hideMenu && this.layout.gtmd && this.menu.activeMenu != null);
    };
    this.layout.gtmd$.subscribe(updateShowLeft);
    this.login.user$.subscribe(updateShowLeft);
    this.menu.activeMenu$.subscribe(updateShowLeft);
    updateShowLeft();
  }
}
