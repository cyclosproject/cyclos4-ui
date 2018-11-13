import { Component, Input, ChangeDetectionStrategy, OnInit, ContentChildren, QueryList, OnDestroy, AfterContentInit } from '@angular/core';
import { LayoutService } from 'app/shared/layout.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { truthyAttr } from 'app/shared/helper';
import { PageContentComponent } from 'app/shared/page-content.component';

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
export class PageLayoutComponent implements OnInit, OnDestroy, AfterContentInit {
  @Input() heading: string;
  @Input() ready: boolean;
  @Input() size: 'small' | 'medium' | 'large' | 'full' = 'full';
  @ContentChildren(PageContentComponent) contents: QueryList<PageContentComponent>;

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

  ngAfterContentInit() {
    this.sub = this.contents.changes.subscribe(() => {
      const length = this.contents.length;
      this.contents.forEach((c, i) => {
        c.first = i === 0;
        c.last = i === length - 1;
      });
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
